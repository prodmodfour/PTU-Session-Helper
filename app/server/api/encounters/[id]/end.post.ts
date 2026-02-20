/**
 * POST /api/encounters/:id/end
 *
 * Ends an encounter, deactivating it and clearing volatile conditions
 * from all combatants per PTU p.247: "Volatile Afflictions are cured
 * completely at the end of the encounter."
 */
import { prisma } from '~/server/utils/prisma'
import { VOLATILE_CONDITIONS } from '~/constants/statusConditions'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import type { Combatant, StatusCondition } from '~/types'

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

    // PTU p.247: clear volatile conditions from all combatants at encounter end
    const updatedCombatants = combatants.map(combatant => {
      const currentConditions: StatusCondition[] = combatant.entity?.statusConditions || []
      const clearedConditions = clearVolatileConditions(currentConditions)

      // Only create new object if conditions actually changed
      if (clearedConditions.length === currentConditions.length) {
        return combatant
      }

      return {
        ...combatant,
        entity: {
          ...combatant.entity,
          statusConditions: clearedConditions
        }
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

    // Sync volatile condition clearing to database for entities with records
    const syncPromises = updatedCombatants
      .filter(c => {
        const originalConditions: StatusCondition[] =
          combatants.find(oc => oc.id === c.id)?.entity?.statusConditions || []
        const newConditions: StatusCondition[] = c.entity?.statusConditions || []
        return newConditions.length !== originalConditions.length
      })
      .map(c => syncEntityToDatabase(c, {
        statusConditions: c.entity?.statusConditions || []
      }))

    await Promise.all(syncPromises)

    const turnOrder = JSON.parse(encounter.turnOrder)

    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
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
