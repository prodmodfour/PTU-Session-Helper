/**
 * Apply damage to a combatant with PTU mechanics
 */
import { loadEncounter, findCombatant, saveEncounterCombatants, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
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

  if (!body.combatantId || typeof body.damage !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'combatantId and damage are required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const combatant = findCombatant(combatants, body.combatantId)
    const entity = combatant.entity

    // Calculate damage with PTU mechanics
    const damageResult = calculateDamage(
      body.damage,
      entity.currentHp,
      entity.maxHp,
      entity.temporaryHp || 0,
      entity.injuries || 0
    )

    // Apply damage to combatant entity
    applyDamageToEntity(combatant, damageResult)

    // Sync to database if entity has a record
    await syncDamageToDatabase(
      combatant,
      damageResult.newHp,
      damageResult.newTempHp,
      damageResult.newInjuries,
      entity.statusConditions || [],
      damageResult.injuryGained
    )

    // Track defeated enemies for XP
    let defeatedEnemies = JSON.parse(record.defeatedEnemies)
    if (damageResult.fainted && combatant.side === 'enemies') {
      const entityName = combatant.type === 'pokemon'
        ? (entity as { species: string }).species
        : (entity as { name: string }).name
      defeatedEnemies.push({
        species: entityName,
        level: entity.level
      })
    }

    await saveEncounterCombatants(id, combatants, { defeatedEnemies })

    const response = buildEncounterResponse(record, combatants, { defeatedEnemies })

    return {
      success: true,
      data: response,
      damageResult: {
        combatantId: body.combatantId,
        ...damageResult
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to apply damage'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
