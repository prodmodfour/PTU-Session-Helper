import { prisma } from '~/server/utils/prisma'

interface DamageResult {
  finalDamage: number
  tempHpAbsorbed: number
  hpDamage: number
  newHp: number
  newTempHp: number
  injuryGained: boolean
  newInjuries: number
  fainted: boolean
}

function calculateDamage(
  damage: number,
  currentHp: number,
  maxHp: number,
  temporaryHp: number,
  currentInjuries: number
): DamageResult {
  let remainingDamage = damage
  let tempHpAbsorbed = 0
  let injuryGained = false

  // Temporary HP absorbs damage first
  if (temporaryHp > 0) {
    tempHpAbsorbed = Math.min(temporaryHp, remainingDamage)
    remainingDamage -= tempHpAbsorbed
  }

  const newTempHp = temporaryHp - tempHpAbsorbed
  const hpDamage = remainingDamage
  const newHp = Math.max(0, currentHp - hpDamage)

  // PTU Massive Damage rule: 50%+ of max HP in one hit = injury
  // Only HP damage counts, not temp HP damage
  if (hpDamage >= maxHp / 2) {
    injuryGained = true
  }

  const newInjuries = injuryGained ? currentInjuries + 1 : currentInjuries
  const fainted = newHp === 0

  return {
    finalDamage: damage,
    tempHpAbsorbed,
    hpDamage,
    newHp,
    newTempHp,
    injuryGained,
    newInjuries,
    fainted
  }
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

  if (!body.combatantId || typeof body.damage !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'combatantId and damage are required'
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
    const currentHp = entity.currentHp
    const maxHp = entity.maxHp
    const temporaryHp = entity.temporaryHp || 0
    const currentInjuries = entity.injuries || 0

    // Calculate damage with PTU mechanics
    const result = calculateDamage(
      body.damage,
      currentHp,
      maxHp,
      temporaryHp,
      currentInjuries
    )

    // Update combatant entity
    entity.currentHp = result.newHp
    entity.temporaryHp = result.newTempHp
    entity.injuries = result.newInjuries

    // Add Fainted status if HP reached 0
    if (result.fainted && !entity.statusConditions?.includes('Fainted')) {
      entity.statusConditions = entity.statusConditions || []
      entity.statusConditions.push('Fainted')
    }

    // Update the actual entity in database
    // Track lastInjuryTime if an injury was gained
    const injuryUpdateData = result.injuryGained ? { lastInjuryTime: new Date() } : {}

    if (combatant.type === 'pokemon') {
      await prisma.pokemon.update({
        where: { id: combatant.entityId },
        data: {
          currentHp: result.newHp,
          temporaryHp: result.newTempHp,
          injuries: result.newInjuries,
          statusConditions: JSON.stringify(entity.statusConditions || []),
          ...injuryUpdateData
        }
      })
    } else {
      await prisma.humanCharacter.update({
        where: { id: combatant.entityId },
        data: {
          currentHp: result.newHp,
          temporaryHp: result.newTempHp,
          injuries: result.newInjuries,
          statusConditions: JSON.stringify(entity.statusConditions || []),
          ...injuryUpdateData
        }
      })
    }

    // Track defeated enemies for XP
    let defeatedEnemies = JSON.parse(encounter.defeatedEnemies)
    if (result.fainted && combatant.side === 'enemies') {
      defeatedEnemies.push({
        species: entity.species || entity.name,
        level: entity.level
      })
    }

    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(combatants),
        defeatedEnemies: JSON.stringify(defeatedEnemies)
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
      moveLog: JSON.parse(encounter.moveLog),
      defeatedEnemies
    }

    return {
      success: true,
      data: parsed,
      damageResult: {
        combatantId: body.combatantId,
        ...result
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to apply damage'
    })
  }
})
