/**
 * Execute a move in combat and log it
 *
 * Enforces PTU move frequency restrictions:
 * - Scene / Scene x2 / Scene x3: limited uses per scene
 * - EOT (Every Other Turn): cannot use on consecutive rounds
 * - Daily / Daily x2 / Daily x3: limited uses per day
 * - At-Will: unlimited
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, findCombatant, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
import { calculateDamage, applyDamageToEntity } from '~/server/services/combatant.service'
import { syncDamageToDatabase } from '~/server/services/entity-update.service'
import { checkMoveFrequency, incrementMoveUsage } from '~/utils/moveFrequency'
import type { Move } from '~/types/character'

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

    // Find move on the actor's entity
    let move: Move | null = null
    let moveIndex = -1
    if (actor.type === 'pokemon') {
      const pokemonEntity = actor.entity as { moves?: Move[] }
      if (pokemonEntity.moves) {
        moveIndex = pokemonEntity.moves.findIndex(m => m.id === body.moveId || m.name === body.moveId)
        if (moveIndex >= 0) {
          move = pokemonEntity.moves[moveIndex]
        }
      }
    }
    const moveName = move?.name || body.moveId || 'Unknown Move'

    // Validate frequency restrictions (only for known moves with frequency data)
    if (move && move.frequency) {
      const frequencyCheck = checkMoveFrequency(move, record.currentRound)
      if (!frequencyCheck.canUse) {
        throw createError({
          statusCode: 400,
          message: `Cannot use ${moveName}: ${frequencyCheck.reason}`
        })
      }
    }

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

    // Increment move usage tracking (immutably update the move on the actor)
    const moveDbUpdates: Promise<unknown>[] = []
    if (move && moveIndex >= 0 && actor.type === 'pokemon') {
      const pokemonEntity = actor.entity as { moves: Move[] }
      const updatedMove = incrementMoveUsage(move, record.currentRound)
      const updatedMoves = pokemonEntity.moves.map((m, i) =>
        i === moveIndex ? updatedMove : m
      )

      // Update the actor immutably for the combatants snapshot
      actor.entity = { ...actor.entity, moves: updatedMoves }

      // Sync updated moves to the Pokemon's database record
      if (actor.entityId) {
        moveDbUpdates.push(
          prisma.pokemon.update({
            where: { id: actor.entityId },
            data: { moves: JSON.stringify(updatedMoves) }
          })
        )
      }
    }

    // Execute move usage database updates
    if (moveDbUpdates.length > 0) {
      await Promise.all(moveDbUpdates)
    }

    // Create log entry
    const logEntry = {
      id: crypto.randomUUID(),
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
