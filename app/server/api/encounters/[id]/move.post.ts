/**
 * Execute a move in combat and log it
 */
import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { loadEncounter, findCombatant, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
import { calculateDamage, applyDamageToEntity } from '~/server/services/combatant.service'
import { syncDamageToDatabase } from '~/server/services/entity-update.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const moveLog = JSON.parse(record.moveLog)

    // Find actor
    const actor = findCombatant(combatants, body.actorId)
    const actorName = getEntityName(actor)

    // Find move
    let move = null
    if (actor.type === 'pokemon') {
      const pokemonEntity = actor.entity as { moves?: Array<{ id?: string; name: string; type?: string }> }
      if (pokemonEntity.moves) {
        move = pokemonEntity.moves.find(m => m.id === body.moveId || m.name === body.moveId)
      }
    }
    const moveName = move?.name || body.moveId || 'Unknown Move'

    // Process targets with full PTU damage pipeline
    const dbUpdates: Promise<unknown>[] = []
    const targets = body.targetIds.map((targetId: string) => {
      const target = combatants.find(c => c.id === targetId)
      if (!target) return null

      const targetName = getEntityName(target)

      // Get damage for this specific target
      const targetDamage = body.targetDamages?.[targetId] ?? body.damage ?? 0

      // Apply damage using PTU mechanics (temp HP, injuries, faint + status clearing)
      if (targetDamage > 0) {
        const entity = target.entity
        const damageResult = calculateDamage(
          targetDamage,
          entity.currentHp,
          entity.maxHp,
          entity.temporaryHp || 0,
          entity.injuries || 0
        )

        applyDamageToEntity(target, damageResult)

        dbUpdates.push(syncDamageToDatabase(
          target,
          damageResult.newHp,
          damageResult.newTempHp,
          damageResult.newInjuries,
          entity.statusConditions || [],
          damageResult.injuryGained
        ))
      }

      return {
        id: targetId,
        name: targetName,
        damage: targetDamage,
        effect: body.effect || null,
        hit: true
      }
    }).filter(Boolean)

    // Execute all database updates for damaged targets
    if (dbUpdates.length > 0) {
      await Promise.all(dbUpdates)
    }

    // Create log entry
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      round: record.currentRound,
      actorId: body.actorId,
      actorName,
      moveName,
      moveType: move?.type || null,
      targets,
      notes: body.notes || null
    }

    moveLog.push(logEntry)

    // Use an action
    if (actor.actionsRemaining > 0) {
      actor.actionsRemaining--
    }

    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(combatants),
        moveLog: JSON.stringify(moveLog)
      }
    })

    const response = buildEncounterResponse(record, combatants, { moveLog })

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to execute move'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
