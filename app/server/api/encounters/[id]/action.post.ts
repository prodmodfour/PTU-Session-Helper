/**
 * Consume a specific action type for a combatant.
 *
 * PTU p.218: Each combatant gets one Standard Action, one Shift Action,
 * and one Swift Action per turn. This endpoint marks a single action type
 * as used without performing any game effect — the caller is responsible
 * for the effect (e.g., capture attempt, move execution).
 *
 * Request body:
 * - combatantId: string — the combatant whose action is consumed
 * - actionType: 'standard' | 'shift' | 'swift'
 */
import { loadEncounter, findCombatant, saveEncounterCombatants, buildEncounterResponse } from '~/server/services/encounter.service'

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

  const validActions = ['standard', 'shift', 'swift']
  if (!body.actionType || !validActions.includes(body.actionType)) {
    throw createError({
      statusCode: 400,
      message: `actionType must be one of: ${validActions.join(', ')}`
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const combatant = findCombatant(combatants, body.combatantId)

    // Map actionType to turnState field
    const fieldMap: Record<string, keyof typeof combatant.turnState> = {
      standard: 'standardActionUsed',
      shift: 'shiftActionUsed',
      swift: 'swiftActionUsed'
    }

    const field = fieldMap[body.actionType]

    if (combatant.turnState[field]) {
      throw createError({
        statusCode: 400,
        message: `${body.actionType} action already used this turn`
      })
    }

    // Consume the action (immutable update)
    combatant.turnState = {
      ...combatant.turnState,
      [field]: true
    }

    await saveEncounterCombatants(id, combatants)

    const response = buildEncounterResponse(record, combatants)

    return {
      success: true,
      data: response
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to consume action'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
