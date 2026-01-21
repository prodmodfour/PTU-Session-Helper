import { prisma } from '~/server/utils/prisma'

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
    const healResult: {
      hpHealed?: number
      tempHpGained?: number
      injuriesHealed?: number
      newHp: number
      newTempHp: number
      newInjuries: number
      faintedRemoved: boolean
    } = {
      newHp: entity.currentHp,
      newTempHp: entity.temporaryHp || 0,
      newInjuries: entity.injuries || 0,
      faintedRemoved: false
    }

    // Heal HP (capped at max HP)
    if (typeof body.amount === 'number' && body.amount > 0) {
      const maxHp = entity.maxHp
      const previousHp = entity.currentHp
      const newHp = Math.min(maxHp, previousHp + body.amount)
      entity.currentHp = newHp
      healResult.hpHealed = newHp - previousHp
      healResult.newHp = newHp

      // Remove Fainted status if healed from 0 HP
      if (previousHp === 0 && newHp > 0) {
        entity.statusConditions = (entity.statusConditions || []).filter(
          (s: string) => s !== 'Fainted'
        )
        healResult.faintedRemoved = true
      }
    }

    // Grant Temporary HP (stacks with existing)
    if (typeof body.tempHp === 'number' && body.tempHp > 0) {
      const previousTempHp = entity.temporaryHp || 0
      const newTempHp = previousTempHp + body.tempHp
      entity.temporaryHp = newTempHp
      healResult.tempHpGained = body.tempHp
      healResult.newTempHp = newTempHp
    }

    // Heal injuries (can't go below 0)
    if (typeof body.healInjuries === 'number' && body.healInjuries > 0) {
      const previousInjuries = entity.injuries || 0
      const newInjuries = Math.max(0, previousInjuries - body.healInjuries)
      entity.injuries = newInjuries
      healResult.injuriesHealed = previousInjuries - newInjuries
      healResult.newInjuries = newInjuries
    }

    // Update the actual entity in database
    if (combatant.type === 'pokemon') {
      await prisma.pokemon.update({
        where: { id: combatant.entityId },
        data: {
          currentHp: entity.currentHp,
          temporaryHp: entity.temporaryHp,
          injuries: entity.injuries,
          statusConditions: JSON.stringify(entity.statusConditions || [])
        }
      })
    } else {
      await prisma.humanCharacter.update({
        where: { id: combatant.entityId },
        data: {
          currentHp: entity.currentHp,
          temporaryHp: entity.temporaryHp,
          injuries: entity.injuries,
          statusConditions: JSON.stringify(entity.statusConditions || [])
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
      healResult: {
        combatantId: body.combatantId,
        ...healResult
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to heal combatant'
    })
  }
})
