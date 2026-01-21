import { prisma } from '~/server/utils/prisma'

/**
 * Take a Breather - PTU Full Action
 * - Reset all combat stages to 0
 * - Remove Temporary HP
 * - Cure volatile status conditions (Confused, Cursed, Rage, Suppressed, Enraged)
 * - Apply Tripped + Vulnerable until next turn (stored as tempConditions)
 */

const VOLATILE_CONDITIONS = [
  'Confused',
  'Cursed',
  'Enraged',
  'Suppressed',
  'Flinched'
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
    const result: {
      stagesReset: boolean
      tempHpRemoved: number
      conditionsCured: string[]
      trippedApplied: boolean
      vulnerableApplied: boolean
    } = {
      stagesReset: false,
      tempHpRemoved: 0,
      conditionsCured: [],
      trippedApplied: false,
      vulnerableApplied: false
    }

    // Reset combat stages to 0
    const stages = entity.stageModifiers || {
      attack: 0,
      defense: 0,
      specialAttack: 0,
      specialDefense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0
    }

    const hadStages = Object.values(stages).some(v => v !== 0)
    if (hadStages) {
      entity.stageModifiers = {
        attack: 0,
        defense: 0,
        specialAttack: 0,
        specialDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0
      }
      result.stagesReset = true
    }

    // Remove Temporary HP
    if (entity.temporaryHp && entity.temporaryHp > 0) {
      result.tempHpRemoved = entity.temporaryHp
      entity.temporaryHp = 0
    }

    // Cure volatile status conditions
    const currentStatuses: string[] = entity.statusConditions || []
    const remainingStatuses: string[] = []

    for (const status of currentStatuses) {
      if (VOLATILE_CONDITIONS.includes(status)) {
        result.conditionsCured.push(status)
      } else {
        remainingStatuses.push(status)
      }
    }

    entity.statusConditions = remainingStatuses

    // Apply Tripped and Vulnerable (temporary until next turn)
    // These are stored in a separate tempConditions array that gets cleared on their turn
    if (!combatant.tempConditions) {
      combatant.tempConditions = []
    }
    if (!combatant.tempConditions.includes('Tripped')) {
      combatant.tempConditions.push('Tripped')
      result.trippedApplied = true
    }
    if (!combatant.tempConditions.includes('Vulnerable')) {
      combatant.tempConditions.push('Vulnerable')
      result.vulnerableApplied = true
    }

    // Mark as having used their standard action
    combatant.turnState.standardActionUsed = true
    combatant.turnState.hasActed = true

    // Update the actual entity in database
    if (combatant.type === 'pokemon') {
      await prisma.pokemon.update({
        where: { id: combatant.entityId },
        data: {
          temporaryHp: entity.temporaryHp,
          stageModifiers: JSON.stringify(entity.stageModifiers),
          statusConditions: JSON.stringify(entity.statusConditions)
        }
      })
    } else {
      await prisma.humanCharacter.update({
        where: { id: combatant.entityId },
        data: {
          temporaryHp: entity.temporaryHp,
          stageModifiers: JSON.stringify(entity.stageModifiers),
          statusConditions: JSON.stringify(entity.statusConditions)
        }
      })
    }

    // Add to move log
    const moveLog = JSON.parse(encounter.moveLog)
    moveLog.push({
      id: crypto.randomUUID(),
      round: encounter.currentRound,
      actorId: body.combatantId,
      actorName: entity.nickname || entity.species || entity.name,
      moveName: 'Take a Breather',
      targets: [],
      notes: `Reset stages, removed ${result.tempHpRemoved} temp HP, cured: ${result.conditionsCured.join(', ') || 'none'}`
    })

    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(combatants),
        moveLog: JSON.stringify(moveLog)
      }
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
      moveLog,
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
    }

    return {
      success: true,
      data: parsed,
      breatherResult: {
        combatantId: body.combatantId,
        ...result
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to take a breather'
    })
  }
})
