/**
 * Sprint Maneuver - PTU Standard Action (page 245)
 * - Adds 'Sprint' tempCondition for +50% movement speed until next turn
 * - Persists to database so state survives page refresh
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, findCombatant, getEntityName } from '~/server/services/encounter.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  if (!body.combatantId) {
    throw createError({
      statusCode: 400,
      message: 'combatantId is required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const combatant = findCombatant(combatants, body.combatantId)

    let sprintApplied = false

    // Add Sprint tempCondition if not already present
    if (!combatant.tempConditions) {
      combatant.tempConditions = []
    }
    if (!combatant.tempConditions.includes('Sprint')) {
      combatant.tempConditions = [...combatant.tempConditions, 'Sprint']
      sprintApplied = true
    }

    // Add to move log
    const moveLog = JSON.parse(record.moveLog)
    const entityName = getEntityName(combatant)
    moveLog.push({
      id: crypto.randomUUID(),
      round: record.currentRound,
      actorId: body.combatantId,
      actorName: entityName,
      moveName: 'Sprint',
      targets: [],
      notes: sprintApplied ? '+50% movement speed until next turn' : 'Sprint already active'
    })

    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(combatants),
        moveLog: JSON.stringify(moveLog)
      }
    })

    const turnOrder = JSON.parse(record.turnOrder)

    const parsed = {
      id: record.id,
      name: record.name,
      battleType: record.battleType,
      weather: record.weather ?? null,
      weatherDuration: record.weatherDuration ?? 0,
      weatherSource: record.weatherSource ?? null,
      combatants,
      currentRound: record.currentRound,
      currentTurnIndex: record.currentTurnIndex,
      turnOrder,
      isActive: record.isActive,
      isPaused: record.isPaused,
      moveLog,
      defeatedEnemies: JSON.parse(record.defeatedEnemies)
    }

    return {
      success: true,
      data: parsed,
      sprintResult: {
        combatantId: body.combatantId,
        sprintApplied
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to apply sprint'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
