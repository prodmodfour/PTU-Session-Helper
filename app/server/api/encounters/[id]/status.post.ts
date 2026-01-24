import { prisma } from '~/server/utils/prisma'
import type { StatusCondition } from '~/types'

const VALID_STATUS_CONDITIONS: StatusCondition[] = [
  'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned',
  'Asleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed',
  'Disabled', 'Encored', 'Taunted', 'Tormented',
  'Stuck', 'Slowed', 'Trapped', 'Enraged', 'Suppressed', 'Fainted'
]

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

  // Must have add or remove array
  if (!body.add && !body.remove) {
    throw createError({
      statusCode: 400,
      message: 'Either add or remove array is required'
    })
  }

  // Validate status conditions
  const addStatuses: StatusCondition[] = body.add || []
  const removeStatuses: StatusCondition[] = body.remove || []

  for (const status of [...addStatuses, ...removeStatuses]) {
    if (!VALID_STATUS_CONDITIONS.includes(status)) {
      throw createError({
        statusCode: 400,
        message: `Invalid status condition: ${status}`
      })
    }
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

    const combatants = JSON.parse(encounter.combatants)
    const combatant = combatants.find((c: any) => c.id === body.combatantId)

    if (!combatant) {
      throw createError({
        statusCode: 404,
        message: 'Combatant not found'
      })
    }

    const entity = combatant.entity
    let currentStatuses: StatusCondition[] = entity.statusConditions || []

    // Remove statuses first
    currentStatuses = currentStatuses.filter(s => !removeStatuses.includes(s))

    // Add new statuses (avoid duplicates)
    for (const status of addStatuses) {
      if (!currentStatuses.includes(status)) {
        currentStatuses.push(status)
      }
    }

    entity.statusConditions = currentStatuses

    // Update the actual entity in database
    if (combatant.type === 'pokemon') {
      await prisma.pokemon.update({
        where: { id: combatant.entityId },
        data: {
          statusConditions: JSON.stringify(currentStatuses)
        }
      })
    } else {
      await prisma.humanCharacter.update({
        where: { id: combatant.entityId },
        data: {
          statusConditions: JSON.stringify(currentStatuses)
        }
      })
    }

    await prisma.encounter.update({
      where: { id },
      data: { combatants: JSON.stringify(combatants) }
    })

    const turnOrder = JSON.parse(encounter.turnOrder)

    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      combatants,
      currentRound: encounter.currentRound,
      currentTurnIndex: encounter.currentTurnIndex,
      turnOrder,
      isActive: encounter.isActive,
      isPaused: encounter.isPaused,
      isServed: encounter.isServed,
      moveLog: JSON.parse(encounter.moveLog),
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies),
      gridConfig: encounter.gridConfig ? JSON.parse(encounter.gridConfig) : null,
      createdAt: encounter.createdAt,
      updatedAt: encounter.updatedAt
    }

    return {
      success: true,
      data: parsed,
      statusChange: {
        combatantId: body.combatantId,
        added: addStatuses,
        removed: removeStatuses,
        current: currentStatuses
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update status conditions'
    })
  }
})
