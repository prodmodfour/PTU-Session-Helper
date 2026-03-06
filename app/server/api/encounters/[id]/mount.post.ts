/**
 * POST /api/encounters/:id/mount
 *
 * Mount a trainer on an adjacent Pokemon with the Mountable capability.
 * Sets mount state on both the rider (trainer) and mount (Pokemon) combatants.
 *
 * PTU p.218: Mounting is a Standard Action with Acrobatics/Athletics DC 10.
 * Expert Acrobatics/Athletics: mount as Free Action during Shift (2m+ movement).
 * Mounted Prowess edge: auto-succeed the mounting check.
 */
import { loadEncounter, buildEncounterResponse, saveEncounterCombatants } from '~/server/services/encounter.service'
import { executeMount } from '~/server/services/mounting.service'
import { applyFaintStatus } from '~/server/services/combatant.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { checkHeavilyInjured, applyHeavilyInjuredPenalty, checkDeath } from '~/utils/injuryMechanics'
import { broadcastToEncounter } from '~/server/utils/websocket'
import type { StatusCondition } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  if (!body.riderId || !body.mountId) {
    throw createError({
      statusCode: 400,
      message: 'riderId and mountId are required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    if (!record.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter must be active to mount'
      })
    }

    // Execute mount (validates preconditions, returns new combatant array)
    const mountResult = executeMount(
      combatants,
      body.riderId,
      body.mountId,
      body.skipCheck,
      record.weather
    )

    // --- Heavily Injured penalty on Standard Action (PTU p.250, ptu-rule-151) ---
    // Mounting at non-expert level costs a Standard Action.
    const isLeagueBattle = record.battleType === 'trainer'
    let heavilyInjuredHpLoss = 0
    if (mountResult.actionCost === 'standard') {
      const rider = mountResult.updatedCombatants.find(c => c.id === body.riderId)
      if (rider) {
        let entity = rider.entity
        const injuries = entity.injuries || 0
        const hiCheck = checkHeavilyInjured(injuries)

        if (hiCheck.isHeavilyInjured && entity.currentHp > 0) {
          const penalty = applyHeavilyInjuredPenalty(entity.currentHp, injuries)
          heavilyInjuredHpLoss = penalty.hpLost
          rider.entity = { ...entity, currentHp: penalty.newHp }
          entity = rider.entity

          if (penalty.newHp === 0) {
            applyFaintStatus(rider)
            entity = rider.entity
          }

          const deathResult = checkDeath(
            entity.currentHp, entity.maxHp, injuries,
            isLeagueBattle, penalty.unclampedHp
          )

          if (deathResult.isDead) {
            const conditions: StatusCondition[] = entity.statusConditions || []
            if (!conditions.includes('Dead')) {
              rider.entity = { ...entity, statusConditions: ['Dead', ...conditions.filter((s: StatusCondition) => s !== 'Dead')] }
              entity = rider.entity
            }
          }

          if (penalty.hpLost > 0 && rider.entityId) {
            await syncEntityToDatabase(rider, {
              currentHp: entity.currentHp,
              statusConditions: entity.statusConditions,
              ...(penalty.newHp === 0 && entity.stageModifiers ? { stageModifiers: entity.stageModifiers } : {})
            })
          }

          rider.turnState = {
            ...rider.turnState,
            heavilyInjuredPenaltyApplied: true
          }
        }
      }
    }

    // Persist updated combatants
    await saveEncounterCombatants(id, mountResult.updatedCombatants)

    const response = buildEncounterResponse(record, mountResult.updatedCombatants)

    // Broadcast mount event via WebSocket (send full encounter response)
    broadcastToEncounter(id, {
      type: 'encounter_update',
      data: response
    })

    return {
      success: true,
      data: {
        encounter: response,
        mountResult: {
          riderId: mountResult.riderId,
          mountId: mountResult.mountId,
          actionCost: mountResult.actionCost,
          checkRequired: mountResult.checkRequired,
          checkAutoSuccess: mountResult.checkAutoSuccess,
          mounted: true
        }
      },
      ...(heavilyInjuredHpLoss > 0 && {
        heavilyInjuredPenalty: {
          combatantId: body.riderId,
          hpLost: heavilyInjuredHpLoss,
          fainted: mountResult.updatedCombatants.find(c => c.id === body.riderId)?.entity.currentHp === 0
        }
      })
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to mount'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
