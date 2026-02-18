import type { Pokemon, Move } from '~/types'
import { roll, rollCritical, type DiceRollResult } from '~/utils/diceRoller'

interface MoveRollAttack {
  result: DiceRollResult
  resultClass?: string
  extra?: string
}

interface MoveRollDamage {
  result: DiceRollResult
  resultClass?: string
  extra?: string
  isCrit: boolean
}

export interface MoveRollState {
  moveName: string
  attack?: MoveRollAttack
  damage?: MoveRollDamage
}

export interface SkillRollState {
  skill: string
  result: DiceRollResult
}

export function usePokemonSheetRolls(pokemon: Ref<Pokemon | null>) {
  const { getDamageRoll } = useDamageCalculation()

  const lastSkillRoll = ref<SkillRollState | null>(null)
  const lastMoveRoll = ref<MoveRollState | null>(null)

  const rollSkill = (skill: string, notation: string) => {
    const result = roll(notation)
    lastSkillRoll.value = { skill, result }
  }

  const getAttackStat = (move: Move): number => {
    if (!pokemon.value) return 0
    if (move.damageClass === 'Physical') {
      return pokemon.value.currentStats?.attack || 0
    } else if (move.damageClass === 'Special') {
      return pokemon.value.currentStats?.specialAttack || 0
    }
    return 0
  }

  const getMoveDamageFormula = (move: Move): string => {
    if (!move.damageBase) return '-'
    const diceNotation = getDamageRoll(move.damageBase)
    const stat = getAttackStat(move)
    if (stat > 0) {
      return `${diceNotation}+${stat}`
    }
    return diceNotation
  }

  const rollAttack = (move: Move) => {
    const result = roll('1d20')
    const naturalRoll = result.dice[0]

    let extra = ''
    let resultClass = ''

    if (naturalRoll === 20) {
      extra = 'Natural 20! CRIT!'
      resultClass = 'roll-result__total--crit'
    } else if (naturalRoll === 1) {
      extra = 'Natural 1! Miss!'
      resultClass = 'roll-result__total--miss'
    } else if (move.ac && result.total >= move.ac) {
      extra = `vs AC ${move.ac} - Hit!`
      resultClass = 'roll-result__total--hit'
    } else if (move.ac) {
      extra = `vs AC ${move.ac} - Miss`
      resultClass = 'roll-result__total--miss'
    }

    lastMoveRoll.value = {
      moveName: move.name,
      attack: {
        result,
        resultClass,
        extra
      }
    }
  }

  const rollDamage = (move: Move, isCrit: boolean) => {
    if (!move.damageBase) return

    const notation = getDamageRoll(move.damageBase)
    const diceResult = isCrit ? rollCritical(notation) : roll(notation)
    const stat = getAttackStat(move)

    const total = diceResult.total + stat
    const statLabel = move.damageClass === 'Physical' ? 'Atk' : 'SpAtk'
    const breakdown = stat > 0
      ? `${diceResult.breakdown.replace(/ = \d+$/, '')} + ${stat} (${statLabel}) = ${total}`
      : diceResult.breakdown

    const result: DiceRollResult = {
      ...diceResult,
      total,
      breakdown
    }

    const damageRoll: MoveRollDamage = {
      result,
      resultClass: isCrit ? 'roll-result__total--crit' : undefined,
      extra: isCrit ? 'Critical Hit!' : undefined,
      isCrit
    }

    if (lastMoveRoll.value?.moveName === move.name) {
      lastMoveRoll.value = {
        ...lastMoveRoll.value,
        damage: damageRoll
      }
    } else {
      lastMoveRoll.value = {
        moveName: move.name,
        damage: damageRoll
      }
    }
  }

  return {
    lastSkillRoll: readonly(lastSkillRoll),
    lastMoveRoll: readonly(lastMoveRoll),
    rollSkill,
    rollAttack,
    rollDamage,
    getMoveDamageFormula
  }
}
