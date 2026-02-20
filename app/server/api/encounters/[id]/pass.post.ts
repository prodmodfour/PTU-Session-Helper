/**
 * Pass Turn - Marks all actions as used, ending the combatant's turn.
 * Persists to database so state survives page refresh.
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, findCombatant, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'

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

    // Mark turn as complete — all actions consumed
    combatant.turnState = {
      ...combatant.turnState,
      hasActed: true,
      standardActionUsed: true,
      shiftActionUsed: true
    }

    // Add to move log
    const moveLog = JSON.parse(record.moveLog)
    const entityName = getEntityName(combatant)
    moveLog.push({
      id: crypto.randomUUID(),
      round: record.currentRound,
      actorId: body.combatantId,
      actorName: entityName,
      moveName: 'Pass',
      targets: [],
      notes: 'Passed turn — all actions forfeited'
    })

    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(combatants),
        moveLog: JSON.stringify(moveLog)
      }
    })

    const response = buildEncounterResponse(record, combatants, { moveLog })

    return {
      success: true,
      data: response
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to pass turn'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
