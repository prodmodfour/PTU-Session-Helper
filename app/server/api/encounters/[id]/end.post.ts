/**
 * POST /api/encounters/:id/end
 *
 * Ends an encounter, deactivating it and clearing volatile conditions
 * from all combatants per PTU p.247: "Volatile Afflictions are cured
 * completely at the end of the encounter."
 *
 * Also clears bound AP for human combatants per PTU Core p.59:
 * "[Stratagem] Features may only be bound during combat and
 * automatically unbind when combat ends."
 */
import { prisma } from '~/server/utils/prisma'
import { VOLATILE_CONDITIONS } from '~/constants/statusConditions'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { resetSceneUsage } from '~/utils/moveFrequency'
import { calculateSceneEndAp } from '~/utils/restHealing'
import type { Combatant, StatusCondition } from '~/types'
import type { Move, Pokemon } from '~/types/character'

/**
 * Remove volatile conditions from a combatant's entity.
 * Returns the updated status conditions array (new reference, no mutation).
 */
function clearVolatileConditions(conditions: StatusCondition[]): StatusCondition[] {
  return conditions.filter(
    (s: StatusCondition) => !(VOLATILE_CONDITIONS as StatusCondition[]).includes(s)
  )
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    const combatants: Combatant[] = JSON.parse(encounter.combatants)

    // PTU p.247: clear volatile conditions and reset scene-frequency moves at encounter end
    const updatedCombatants = combatants.map(combatant => {
      const currentConditions: StatusCondition[] = combatant.entity?.statusConditions || []
      const clearedConditions = clearVolatileConditions(currentConditions)
      const conditionsChanged = clearedConditions.length !== currentConditions.length

      // Reset scene-frequency moves for Pokemon combatants
      let updatedEntity = combatant.entity
      if (combatant.type === 'pokemon') {
        const pokemonEntity = combatant.entity as Pokemon
        const moves: Move[] = pokemonEntity.moves || []
        const resetMoves = resetSceneUsage(moves)
        const movesChanged = !resetMoves.every((m, i) => m === moves[i])

        if (movesChanged || conditionsChanged) {
          updatedEntity = {
            ...pokemonEntity,
            moves: resetMoves,
            statusConditions: clearedConditions
          }
        }
      }

      // Only create new object if something actually changed
      if (updatedEntity === combatant.entity && !conditionsChanged) {
        return combatant
      }

      return {
        ...combatant,
        entity: conditionsChanged && combatant.type !== 'pokemon'
          ? { ...combatant.entity, statusConditions: clearedConditions }
          : updatedEntity
      }
    })

    // Update encounter: deactivate and save updated combatants
    await prisma.encounter.update({
      where: { id },
      data: {
        isActive: false,
        isPaused: false,
        combatants: JSON.stringify(updatedCombatants)
      }
    })

    // Sync changes to database for entities with records
    const syncPromises: Promise<unknown>[] = []

    for (const c of updatedCombatants) {
      if (!c.entityId) continue

      const original = combatants.find(oc => oc.id === c.id)
      const originalConditions: StatusCondition[] = original?.entity?.statusConditions || []
      const newConditions: StatusCondition[] = c.entity?.statusConditions || []
      const conditionsChanged = newConditions.length !== originalConditions.length

      // Sync volatile condition clearing
      if (conditionsChanged) {
        syncPromises.push(syncEntityToDatabase(c, {
          statusConditions: newConditions
        }))
      }

      // Sync scene-frequency move resets for Pokemon
      if (c.type === 'pokemon') {
        const pokemonEntity = c.entity as Pokemon
        syncPromises.push(
          prisma.pokemon.update({
            where: { id: c.entityId },
            data: { moves: JSON.stringify(pokemonEntity.moves || []) }
          })
        )
      }
    }

    // PTU Core p.59: Stratagems "automatically unbind when combat ends."
    // Clear boundAp and recalculate currentAp for all human combatants with DB records.
    const humanEntityIds = updatedCombatants
      .filter(c => c.type === 'human' && c.entityId)
      .map(c => c.entityId!)

    if (humanEntityIds.length > 0) {
      const dbCharacters = await prisma.humanCharacter.findMany({
        where: { id: { in: humanEntityIds } },
        select: { id: true, level: true, drainedAp: true }
      })

      for (const char of dbCharacters) {
        const restoredAp = calculateSceneEndAp(char.level, char.drainedAp)
        syncPromises.push(
          prisma.humanCharacter.update({
            where: { id: char.id },
            data: {
              boundAp: 0,
              currentAp: restoredAp
            }
          })
        )
      }
    }

    await Promise.all(syncPromises)

    const turnOrder = JSON.parse(encounter.turnOrder)

    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      weather: encounter.weather ?? null,
      weatherDuration: encounter.weatherDuration ?? 0,
      weatherSource: encounter.weatherSource ?? null,
      combatants: updatedCombatants,
      currentRound: encounter.currentRound,
      currentTurnIndex: encounter.currentTurnIndex,
      turnOrder,
      isActive: false,
      isPaused: false,
      moveLog: JSON.parse(encounter.moveLog),
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to end encounter'
    })
  }
})
