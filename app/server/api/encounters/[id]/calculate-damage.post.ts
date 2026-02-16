/**
 * Calculate damage for a move using the full PTU 9-step formula.
 * Read-only endpoint — does not modify encounter state.
 *
 * Returns a detailed breakdown for test assertions and (future) UI display.
 */
import { loadEncounter, findCombatant } from '~/server/services/encounter.service'
import { calculateDamage, calculateEvasion, calculateAccuracyThreshold } from '~/utils/damageCalculation'
import type { AccuracyCalcResult } from '~/utils/damageCalculation'
import type { Pokemon, HumanCharacter, Move } from '~/types'

interface CalculateDamageRequest {
  attackerId: string
  targetId: string
  moveName: string
  isCritical?: boolean
  damageReduction?: number
}

interface EntityDamageStats {
  attackStat: number
  attackStage: number
  defenseStat: number
  defenseStage: number
  types: string[]
  accuracyStage: number
}

interface EntityEvasionStats {
  defenseBase: number
  defenseStage: number
  spDefBase: number
  spDefStage: number
  speedBase: number
  speedStage: number
}

function getEntityStats(
  combatant: { type: string; entity: Pokemon | HumanCharacter },
  damageClass: 'Physical' | 'Special'
): EntityDamageStats {
  const entity = combatant.entity
  const stages = entity.stageModifiers

  if (combatant.type === 'pokemon') {
    const pokemon = entity as Pokemon
    return damageClass === 'Physical'
      ? {
          attackStat: pokemon.currentStats.attack,
          attackStage: stages?.attack ?? 0,
          defenseStat: pokemon.currentStats.defense,
          defenseStage: stages?.defense ?? 0,
          types: [...pokemon.types],
          accuracyStage: stages?.accuracy ?? 0,
        }
      : {
          attackStat: pokemon.currentStats.specialAttack,
          attackStage: stages?.specialAttack ?? 0,
          defenseStat: pokemon.currentStats.specialDefense,
          defenseStage: stages?.specialDefense ?? 0,
          types: [...pokemon.types],
          accuracyStage: stages?.accuracy ?? 0,
        }
  }

  const human = entity as HumanCharacter
  return damageClass === 'Physical'
    ? {
        attackStat: human.stats.attack,
        attackStage: stages?.attack ?? 0,
        defenseStat: human.stats.defense,
        defenseStage: stages?.defense ?? 0,
        types: [],
        accuracyStage: stages?.accuracy ?? 0,
      }
    : {
        attackStat: human.stats.specialAttack,
        attackStage: stages?.specialAttack ?? 0,
        defenseStat: human.stats.specialDefense,
        defenseStage: stages?.specialDefense ?? 0,
        types: [],
        accuracyStage: stages?.accuracy ?? 0,
      }
}

function getEntityEvasionStats(
  combatant: { type: string; entity: Pokemon | HumanCharacter }
): EntityEvasionStats {
  const entity = combatant.entity
  const stages = entity.stageModifiers

  if (combatant.type === 'pokemon') {
    const pokemon = entity as Pokemon
    return {
      defenseBase: pokemon.currentStats.defense,
      defenseStage: stages?.defense ?? 0,
      spDefBase: pokemon.currentStats.specialDefense,
      spDefStage: stages?.specialDefense ?? 0,
      speedBase: pokemon.currentStats.speed,
      speedStage: stages?.speed ?? 0,
    }
  }

  const human = entity as HumanCharacter
  return {
    defenseBase: human.stats.defense,
    defenseStage: stages?.defense ?? 0,
    spDefBase: human.stats.specialDefense,
    spDefStage: stages?.specialDefense ?? 0,
    speedBase: human.stats.speed,
    speedStage: stages?.speed ?? 0,
  }
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<CalculateDamageRequest>(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Encounter ID is required' })
  }

  if (!body.attackerId || !body.targetId || !body.moveName) {
    throw createError({
      statusCode: 400,
      message: 'attackerId, targetId, and moveName are required',
    })
  }

  try {
    const { combatants } = await loadEncounter(id)

    const attacker = findCombatant(combatants, body.attackerId)
    const target = findCombatant(combatants, body.targetId)

    // Find move in attacker's move list
    let move: Move | undefined
    if (attacker.type === 'pokemon') {
      const pokemon = attacker.entity as Pokemon
      move = pokemon.moves?.find(
        (m) => m.name.toLowerCase() === body.moveName.toLowerCase()
      )
    }

    if (!move) {
      throw createError({
        statusCode: 404,
        message: `Move "${body.moveName}" not found on attacker`,
      })
    }

    if (!move.damageBase || move.damageBase <= 0) {
      throw createError({
        statusCode: 400,
        message: `Move "${body.moveName}" is not a damaging move (damageBase: ${move.damageBase})`,
      })
    }

    if (move.damageClass === 'Status') {
      throw createError({
        statusCode: 400,
        message: `Move "${body.moveName}" is a Status move and does not deal damage`,
      })
    }

    // Extract attacker stats based on damage class
    const attackerData = getEntityStats(attacker, move.damageClass)

    // Extract target stats based on damage class
    const targetData = getEntityStats(target, move.damageClass)

    const result = calculateDamage({
      attackerTypes: attackerData.types,
      attackStat: attackerData.attackStat,
      attackStage: attackerData.attackStage,
      moveType: move.type,
      moveDamageBase: move.damageBase,
      moveDamageClass: move.damageClass,
      targetTypes: targetData.types,
      defenseStat: targetData.defenseStat,
      defenseStage: targetData.defenseStage,
      isCritical: body.isCritical,
      damageReduction: body.damageReduction,
    })

    // Compute dynamic evasion from target's stage-modified stats (P1)
    const targetEvasion = getEntityEvasionStats(target)
    const physicalEvasion = calculateEvasion(targetEvasion.defenseBase, targetEvasion.defenseStage)
    const specialEvasion = calculateEvasion(targetEvasion.spDefBase, targetEvasion.spDefStage)
    const speedEvasion = calculateEvasion(targetEvasion.speedBase, targetEvasion.speedStage)

    // Physical moves use Physical Evasion, Special moves use Special Evasion
    const applicableEvasion = move.damageClass === 'Physical' ? physicalEvasion : specialEvasion
    const effectiveEvasion = Math.min(9, applicableEvasion)

    const moveAC = move.ac ?? 0
    const accuracy: AccuracyCalcResult = {
      moveAC,
      attackerAccuracyStage: attackerData.accuracyStage,
      physicalEvasion,
      specialEvasion,
      speedEvasion,
      applicableEvasion,
      effectiveEvasion,
      accuracyThreshold: calculateAccuracyThreshold(moveAC, attackerData.accuracyStage, applicableEvasion),
    }

    return {
      success: true,
      data: {
        ...result,
        accuracy,
        meta: {
          attackerId: body.attackerId,
          targetId: body.targetId,
          moveName: move.name,
          moveType: move.type,
          moveDamageClass: move.damageClass,
        },
      },
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to calculate damage'
    throw createError({ statusCode: 500, message })
  }
})
