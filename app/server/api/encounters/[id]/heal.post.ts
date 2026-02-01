/**
 * Apply healing to a combatant (HP, temp HP, or injuries)
 */
import { loadEncounter, findCombatant, saveEncounterCombatants, buildEncounterResponse } from '~/server/services/encounter.service'
import { applyHealingToEntity } from '~/server/services/combatant.service'
import { syncHealingToDatabase } from '~/server/services/entity-update.service'

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

  // Must have at least one healing type
  if (typeof body.amount !== 'number' && typeof body.tempHp !== 'number' && typeof body.healInjuries !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'At least one of amount (HP), tempHp, or healInjuries is required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const combatant = findCombatant(combatants, body.combatantId)
    const entity = combatant.entity

    // Apply healing using service
    const healResult = applyHealingToEntity(combatant, {
      amount: body.amount,
      tempHp: body.tempHp,
      healInjuries: body.healInjuries
    })

    // Sync to database if entity has a record
    await syncHealingToDatabase(
      combatant,
      entity.currentHp,
      entity.temporaryHp || 0,
      entity.injuries || 0,
      entity.statusConditions || []
    )

    await saveEncounterCombatants(id, combatants)

    const response = buildEncounterResponse(record, combatants)

    return {
      success: true,
      data: response,
      healResult: {
        combatantId: body.combatantId,
        ...healResult
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to heal combatant'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
