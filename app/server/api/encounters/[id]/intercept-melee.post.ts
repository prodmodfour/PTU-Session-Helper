/**
 * POST /api/encounters/:id/intercept-melee
 *
 * Resolve an Intercept Melee maneuver (PTU p.242, R116).
 *
 * Trigger: An ally within movement range is hit by an adjacent melee foe.
 * The interceptor makes an Acrobatics or Athletics check (DC = 3x meters).
 * On success: Push ally 1m away, shift to their space, take the hit.
 * On failure: Shift floor(check/3) meters toward target.
 *
 * Consumes Full Action (Standard + Shift) and Interrupt for the round.
 */
import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { loadEncounter, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
import {
  canIntercept,
  checkInterceptLoyalty,
  resolveInterceptMelee,
  getDefaultOutOfTurnUsage
} from '~/server/services/out-of-turn.service'
import { canUseWeaponize } from '~/server/services/living-weapon.service'
import { reconstructWieldRelationships } from '~/server/services/living-weapon-state'
import { broadcastToEncounter } from '~/server/utils/websocket'
import type { OutOfTurnAction } from '~/types/combat'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  const body = await readBody(event)
  const {
    interceptorId,
    targetId,
    attackerId,
    actionId,
    skillCheck,
    isWeaponize
  } = body as {
    interceptorId: string
    targetId: string
    attackerId: string
    actionId: string
    skillCheck: number
    /** Weaponize ability: Free Action intercept for wielded Living Weapon (PTU p.2874) */
    isWeaponize?: boolean
  }

  if (!interceptorId || !targetId || !attackerId || skillCheck === undefined) {
    throw createError({
      statusCode: 400,
      message: 'interceptorId, targetId, attackerId, and skillCheck are required'
    })
  }

  if (typeof skillCheck !== 'number' || skillCheck < 0) {
    throw createError({
      statusCode: 400,
      message: 'skillCheck must be a non-negative number'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    if (!record.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter is not active'
      })
    }

    // Find participants
    const interceptor = combatants.find(c => c.id === interceptorId)
    const target = combatants.find(c => c.id === targetId)
    const attacker = combatants.find(c => c.id === attackerId)

    if (!interceptor) {
      throw createError({ statusCode: 404, message: 'Interceptor combatant not found' })
    }
    if (!target) {
      throw createError({ statusCode: 404, message: 'Target combatant not found' })
    }
    if (!attacker) {
      throw createError({ statusCode: 404, message: 'Attacker combatant not found' })
    }

    // Weaponize ability: validate Living Weapon can use Free Action intercept
    // PTU p.2874: while wielded and actively commanded, may Intercept for wielder as Free Action
    if (isWeaponize) {
      const wieldRelationships = reconstructWieldRelationships(combatants)
      if (!canUseWeaponize(interceptor, wieldRelationships)) {
        throw createError({
          statusCode: 400,
          message: 'Cannot use Weaponize: interceptor must have Weaponize ability, be wielded, and not fainted'
        })
      }
      // Verify target is the wielder
      const wieldRel = wieldRelationships.find(r => r.weaponId === interceptorId)
      if (!wieldRel || wieldRel.wielderId !== targetId) {
        throw createError({
          statusCode: 400,
          message: 'Weaponize intercept: target must be the wielder of this Living Weapon'
        })
      }
      // Skip normal eligibility check — Weaponize is a Free Action (no Interrupt cost)
    } else {
      // Validate normal eligibility
      const eligibility = canIntercept(interceptor)
      if (!eligibility.allowed) {
        throw createError({
          statusCode: 400,
          message: `Cannot Intercept Melee: ${eligibility.reason}`
        })
      }
    }

    // Validate loyalty for Pokemon
    const loyaltyCheck = checkInterceptLoyalty(interceptor, target)
    if (!loyaltyCheck.allowed) {
      throw createError({
        statusCode: 400,
        message: `Cannot Intercept Melee: ${loyaltyCheck.reason}`
      })
    }

    // Resolve the Intercept
    const resolution = resolveInterceptMelee(
      combatants,
      interceptorId,
      targetId,
      attackerId,
      skillCheck
    )

    const interceptorName = getEntityName(interceptor)
    const targetName = getEntityName(target)
    const attackerName = getEntityName(attacker)

    // Update pending actions (mark as accepted if actionId provided)
    let pendingActions: OutOfTurnAction[] = JSON.parse(record.pendingActions || '[]')
    if (actionId) {
      pendingActions = pendingActions.map(a => {
        if (a.id === actionId) {
          return { ...a, status: 'accepted' as const }
        }
        return a
      })
    }

    // Build move log entry
    const moveLog = JSON.parse(record.moveLog || '[]')
    const successText = resolution.interceptSuccess
      ? `Success -- took the hit for ${targetName}.`
      : `Failed -- shifted ${resolution.distanceMoved}m toward ${targetName}.`

    const moveName = isWeaponize ? 'Weaponize (Intercept)' : 'Intercept Melee'
    const actionType = isWeaponize ? 'free' : 'interrupt'
    moveLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      round: record.currentRound,
      actorId: interceptorId,
      actorName: interceptorName,
      moveName,
      damageClass: 'Status',
      actionType,
      targets: [{
        id: attackerId,
        name: attackerName,
        hit: resolution.interceptSuccess
      }],
      notes: `${interceptorName} intercepted attack on ${targetName}${isWeaponize ? ' (Weaponize — Free Action)' : ''}. DC ${resolution.dcRequired}, check ${skillCheck}. ${successText}`
    })

    // Save to database
    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(resolution.updatedCombatants),
        pendingActions: JSON.stringify(pendingActions),
        moveLog: JSON.stringify(moveLog)
      }
    })

    // Broadcast
    broadcastToEncounter(id, {
      type: 'interrupt_resolved',
      data: {
        encounterId: id,
        maneuver: 'intercept-melee',
        interceptorId,
        interceptorName,
        targetId,
        targetName,
        attackerId,
        attackerName,
        success: resolution.interceptSuccess,
        distanceMoved: resolution.distanceMoved,
        dcRequired: resolution.dcRequired
      }
    })

    const response = buildEncounterResponse(record, resolution.updatedCombatants, {
      moveLog,
      pendingOutOfTurnActions: pendingActions
    })

    return {
      success: true,
      data: {
        encounter: response,
        interceptSuccess: resolution.interceptSuccess,
        distanceMoved: resolution.distanceMoved,
        dcRequired: resolution.dcRequired,
        interceptorNewPosition: resolution.interceptorNewPosition,
        targetNewPosition: resolution.targetNewPosition
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to resolve Intercept Melee'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
