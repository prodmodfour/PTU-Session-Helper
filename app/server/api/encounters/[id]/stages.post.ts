/**
 * Update combat stage modifiers on a combatant
 */
import { loadEncounter, findCombatant, saveEncounterCombatants, buildEncounterResponse } from '~/server/services/encounter.service'
import { updateStageModifiers, validateStageStats } from '~/server/services/combatant.service'
import { syncStagesToDatabase } from '~/server/services/entity-update.service'

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

  if (!body.changes || typeof body.changes !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'changes object is required with stat modifications'
    })
  }

  // Validate stat names
  validateStageStats(Object.keys(body.changes))

  try {
    const { record, combatants } = await loadEncounter(id)
    const combatant = findCombatant(combatants, body.combatantId)

    // Update stage modifiers using service
    const stageResult = updateStageModifiers(combatant, body.changes, body.absolute || false)

    // Sync to database if entity has a record
    await syncStagesToDatabase(combatant, stageResult.currentStages)

    await saveEncounterCombatants(id, combatants)

    const response = buildEncounterResponse(record, combatants)

    return {
      success: true,
      data: response,
      stageChanges: {
        combatantId: body.combatantId,
        changes: stageResult.changes,
        currentStages: stageResult.currentStages
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to update combat stages'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
