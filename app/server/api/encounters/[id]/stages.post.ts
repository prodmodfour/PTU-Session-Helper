import { prisma } from '~/server/utils/prisma'

type StageStat = 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed' | 'accuracy' | 'evasion'

const VALID_STATS: StageStat[] = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion']

// PTU stage modifiers are clamped to -6 to +6
const MIN_STAGE = -6
const MAX_STAGE = 6

function clampStage(value: number): number {
  return Math.max(MIN_STAGE, Math.min(MAX_STAGE, value))
}

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
  for (const stat of Object.keys(body.changes)) {
    if (!VALID_STATS.includes(stat as StageStat)) {
      throw createError({
        statusCode: 400,
        message: `Invalid stat: ${stat}. Valid stats are: ${VALID_STATS.join(', ')}`
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

    // Initialize stage modifiers if not present
    if (!entity.stageModifiers) {
      entity.stageModifiers = {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0
      }
    }

    const previousStages = { ...entity.stageModifiers }
    const appliedChanges: Record<string, { previous: number; change: number; current: number }> = {}

    // Apply changes (body.changes contains delta values, e.g., +2 or -1)
    // If body.absolute is true, set the value directly instead of adding
    for (const [stat, value] of Object.entries(body.changes)) {
      const previousValue = entity.stageModifiers[stat] || 0
      let newValue: number

      if (body.absolute) {
        // Set absolute value
        newValue = clampStage(value as number)
      } else {
        // Add delta value
        newValue = clampStage(previousValue + (value as number))
      }

      entity.stageModifiers[stat] = newValue
      appliedChanges[stat] = {
        previous: previousValue,
        change: newValue - previousValue,
        current: newValue
      }
    }

    // Update the actual entity in database
    if (combatant.type === 'pokemon') {
      await prisma.pokemon.update({
        where: { id: combatant.entityId },
        data: {
          stageModifiers: JSON.stringify(entity.stageModifiers)
        }
      })
    } else {
      await prisma.humanCharacter.update({
        where: { id: combatant.entityId },
        data: {
          stageModifiers: JSON.stringify(entity.stageModifiers)
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
      moveLog: JSON.parse(encounter.moveLog),
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
    }

    return {
      success: true,
      data: parsed,
      stageChanges: {
        combatantId: body.combatantId,
        changes: appliedChanges,
        currentStages: entity.stageModifiers
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update combat stages'
    })
  }
})
