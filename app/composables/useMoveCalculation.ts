import type { Move, Combatant, Pokemon } from '~/types'
import type { DiceRollResult } from '~/utils/diceRoller'
import { roll } from '~/utils/diceRoller'

export interface TargetDamageCalc {
  targetId: string
  defenseStat: number
  effectiveness: number
  effectivenessText: string
  effectivenessClass: string
  finalDamage: number
}

export interface AccuracyResult {
  targetId: string
  roll: number
  threshold: number
  hit: boolean
  isNat1: boolean
  isNat20: boolean
}

/**
 * Composable for handling move damage and accuracy calculations
 * Extracts combat logic from MoveTargetModal for reusability
 */
export function useMoveCalculation(
  move: Ref<Move>,
  actor: Ref<Combatant>,
  targets: Ref<Combatant[]>
) {
  const {
    rollDamageBase,
    getDamageRoll,
    hasSTAB: checkSTAB,
    getTypeEffectiveness,
    getEffectivenessDescription,
    applyStageModifier,
    calculatePhysicalEvasion,
    calculateSpecialEvasion
  } = useCombat()

  const {
    getStageModifiers,
    getPokemonAttackStat,
    getPokemonSpAtkStat,
    getPokemonDefenseStat,
    getPokemonSpDefStat,
    getHumanStat
  } = useEntityStats()

  const { getCombatantNameById } = useCombatantDisplay()

  // State
  const selectedTargets = ref<string[]>([])
  const damageRollResult = ref<DiceRollResult | null>(null)
  const hasRolledDamage = ref(false)
  const hasRolledAccuracy = ref(false)
  const accuracyResults = ref<Record<string, AccuracyResult>>({})

  // =====================================
  // STAB Calculations
  // =====================================
  const actorTypes = computed((): string[] => {
    if (actor.value.type === 'pokemon') {
      return (actor.value.entity as Pokemon).types
    }
    return []
  })

  const hasSTAB = computed(() => {
    if (!move.value.type) return false
    return checkSTAB(move.value.type, actorTypes.value)
  })

  const effectiveDB = computed(() => {
    if (!move.value.damageBase) return 0
    return hasSTAB.value ? move.value.damageBase + 2 : move.value.damageBase
  })

  // =====================================
  // Accuracy Calculations
  // =====================================
  const attackerAccuracyStage = computed((): number => {
    const stages = getStageModifiers(actor.value.entity)
    return stages.accuracy || 0
  })

  const evasionTypeLabel = computed((): string => {
    return move.value.damageClass === 'Physical' ? 'Phys Evasion' : 'Spec Evasion'
  })

  const getTargetEvasion = (targetId: string): number => {
    const target = targets.value.find(t => t.id === targetId)
    if (!target || !target.entity) return 0

    const entity = target.entity
    const stages = getStageModifiers(entity)
    const evasionBonus = stages.evasion ?? 0

    if (move.value.damageClass === 'Physical') {
      const defStat = target.type === 'pokemon'
        ? getPokemonDefenseStat(entity)
        : getHumanStat(entity, 'defense')
      return calculatePhysicalEvasion(defStat, stages.defense, evasionBonus)
    } else {
      const spDefStat = target.type === 'pokemon'
        ? getPokemonSpDefStat(entity)
        : getHumanStat(entity, 'specialDefense')
      return calculateSpecialEvasion(spDefStat, stages.specialDefense, evasionBonus)
    }
  }

  const getAccuracyThreshold = (targetId: string): number => {
    if (!move.value.ac) return 0

    const evasion = getTargetEvasion(targetId)
    const effectiveEvasion = Math.min(9, evasion)
    return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value)
  }

  const rollAccuracy = () => {
    if (!move.value.ac) return

    const results: Record<string, AccuracyResult> = {}

    for (const targetId of selectedTargets.value) {
      const d20Result = roll('1d20')
      const naturalRoll = d20Result.dice[0]
      const threshold = getAccuracyThreshold(targetId)

      const isNat1 = naturalRoll === 1
      const isNat20 = naturalRoll === 20

      let hit: boolean
      if (isNat1) {
        hit = false
      } else if (isNat20) {
        hit = true
      } else {
        hit = naturalRoll >= threshold
      }

      results[targetId] = {
        targetId,
        roll: naturalRoll,
        threshold,
        hit,
        isNat1,
        isNat20
      }
    }

    accuracyResults.value = results
    hasRolledAccuracy.value = true
    hasRolledDamage.value = false
    damageRollResult.value = null
  }

  const hitCount = computed(() => {
    return Object.values(accuracyResults.value).filter(r => r.hit).length
  })

  const missCount = computed(() => {
    return Object.values(accuracyResults.value).filter(r => !r.hit).length
  })

  const hitTargets = computed((): string[] => {
    if (!move.value.ac) {
      return selectedTargets.value
    }
    return selectedTargets.value.filter(id => accuracyResults.value[id]?.hit)
  })

  const canShowDamageSection = computed((): boolean => {
    if (!move.value.ac) return true
    return hasRolledAccuracy.value && hitCount.value > 0
  })

  // =====================================
  // Damage Calculations
  // =====================================
  const attackStatValue = computed((): number => {
    if (!move.value.damageBase) return 0

    const entity = actor.value.entity
    if (!entity) return 0

    const stages = getStageModifiers(entity)

    if (move.value.damageClass === 'Physical') {
      const baseStat = actor.value.type === 'pokemon'
        ? getPokemonAttackStat(entity)
        : getHumanStat(entity, 'attack')
      return applyStageModifier(baseStat, stages.attack)
    } else if (move.value.damageClass === 'Special') {
      const baseStat = actor.value.type === 'pokemon'
        ? getPokemonSpAtkStat(entity)
        : getHumanStat(entity, 'specialAttack')
      return applyStageModifier(baseStat, stages.specialAttack)
    }
    return 0
  })

  const attackStatLabel = computed(() => {
    return move.value.damageClass === 'Physical' ? 'ATK' : 'SP.ATK'
  })

  const defenseStatLabel = computed(() => {
    return move.value.damageClass === 'Physical' ? 'DEF' : 'SP.DEF'
  })

  const preDefenseTotal = computed(() => {
    if (!damageRollResult.value) return 0
    return damageRollResult.value.total + attackStatValue.value
  })

  const fixedDamage = computed((): number | null => {
    if (!move.value.effect) return null

    const patterns = [
      /lose\s+(\d+)\s+(?:HP|Hit\s*Points?)/i,
      /deals?\s+(\d+)\s+damage/i,
      /always\s+deals?\s+(\d+)/i,
      /(\d+)\s+damage\s+flat/i,
      /flat\s+(\d+)\s+damage/i,
      /(\d+)\s+Damage/
    ]

    for (const pattern of patterns) {
      const match = move.value.effect.match(pattern)
      if (match) {
        return parseInt(match[1], 10)
      }
    }

    return null
  })

  const damageNotation = computed(() => {
    if (!effectiveDB.value) return null
    return getDamageRoll(effectiveDB.value)
  })

  const getEffectivenessClass = (effectiveness: number): string => {
    if (effectiveness === 0) return 'immune'
    if (effectiveness <= 0.25) return 'double-resist'
    if (effectiveness < 1) return 'resist'
    if (effectiveness >= 2) return 'double-super'
    if (effectiveness > 1) return 'super'
    return 'neutral'
  }

  const targetDamageCalcs = computed((): Record<string, TargetDamageCalc> => {
    if (!hasRolledDamage.value || !damageRollResult.value) return {}

    const calcs: Record<string, TargetDamageCalc> = {}

    for (const targetId of hitTargets.value) {
      const target = targets.value.find(t => t.id === targetId)
      if (!target || !target.entity) continue

      const entity = target.entity
      const stages = getStageModifiers(entity)

      let defenseStat: number
      if (move.value.damageClass === 'Physical') {
        const baseStat = target.type === 'pokemon'
          ? getPokemonDefenseStat(entity)
          : getHumanStat(entity, 'defense')
        defenseStat = applyStageModifier(baseStat, stages.defense)
      } else {
        const baseStat = target.type === 'pokemon'
          ? getPokemonSpDefStat(entity)
          : getHumanStat(entity, 'specialDefense')
        defenseStat = applyStageModifier(baseStat, stages.specialDefense)
      }

      let targetTypes: string[]
      if (target.type === 'pokemon') {
        targetTypes = (entity as Pokemon).types || []
      } else {
        targetTypes = []
      }

      const effectiveness = move.value.type
        ? getTypeEffectiveness(move.value.type, targetTypes)
        : 1

      let damage = preDefenseTotal.value - defenseStat
      damage = Math.max(1, damage)
      damage = Math.floor(damage * effectiveness)
      damage = Math.max(1, damage)

      if (effectiveness === 0) {
        damage = 0
      }

      const effectivenessText = getEffectivenessDescription(effectiveness)

      calcs[targetId] = {
        targetId,
        defenseStat,
        effectiveness,
        effectivenessText,
        effectivenessClass: getEffectivenessClass(effectiveness),
        finalDamage: damage
      }
    }

    return calcs
  })

  const rollDamage = () => {
    if (!effectiveDB.value) return
    damageRollResult.value = rollDamageBase(effectiveDB.value, false)
    hasRolledDamage.value = true
  }

  // =====================================
  // Target Selection
  // =====================================
  const toggleTarget = (targetId: string) => {
    const index = selectedTargets.value.indexOf(targetId)
    if (index === -1) {
      selectedTargets.value.push(targetId)
    } else {
      selectedTargets.value.splice(index, 1)
    }

    hasRolledAccuracy.value = false
    hasRolledDamage.value = false
    accuracyResults.value = {}
    damageRollResult.value = null
  }

  const getTargetNameById = (targetId: string): string => {
    return getCombatantNameById(targets.value, targetId)
  }

  // =====================================
  // Confirmation Logic
  // =====================================
  const canConfirm = computed((): boolean => {
    if (selectedTargets.value.length === 0) return false

    if (move.value.ac && !hasRolledAccuracy.value) return false

    if (move.value.damageBase && !fixedDamage.value && hitTargets.value.length > 0 && !hasRolledDamage.value) {
      return false
    }

    return true
  })

  const getConfirmData = () => {
    if (fixedDamage.value) {
      const targetDamages: Record<string, number> = {}
      for (const targetId of hitTargets.value) {
        targetDamages[targetId] = fixedDamage.value
      }
      return {
        targetIds: selectedTargets.value,
        damage: fixedDamage.value,
        rollResult: undefined,
        targetDamages
      }
    }

    if (hasRolledDamage.value && Object.keys(targetDamageCalcs.value).length > 0) {
      const targetDamages: Record<string, number> = {}
      for (const [targetId, calc] of Object.entries(targetDamageCalcs.value)) {
        targetDamages[targetId] = calc.finalDamage
      }
      const firstHitTarget = hitTargets.value[0]
      const firstTargetDamage = firstHitTarget ? targetDamages[firstHitTarget] : undefined
      return {
        targetIds: selectedTargets.value,
        damage: firstTargetDamage,
        rollResult: damageRollResult.value ?? undefined,
        targetDamages
      }
    }

    return {
      targetIds: selectedTargets.value,
      damage: undefined,
      rollResult: undefined,
      targetDamages: undefined
    }
  }

  // Reset state
  const reset = () => {
    selectedTargets.value = []
    damageRollResult.value = null
    hasRolledDamage.value = false
    hasRolledAccuracy.value = false
    accuracyResults.value = {}
  }

  return {
    // State
    selectedTargets,
    damageRollResult,
    hasRolledDamage,
    hasRolledAccuracy,
    accuracyResults,

    // STAB
    actorTypes,
    hasSTAB,
    effectiveDB,

    // Accuracy
    attackerAccuracyStage,
    evasionTypeLabel,
    getTargetEvasion,
    getAccuracyThreshold,
    rollAccuracy,
    hitCount,
    missCount,
    hitTargets,
    canShowDamageSection,

    // Damage
    attackStatValue,
    attackStatLabel,
    defenseStatLabel,
    preDefenseTotal,
    fixedDamage,
    damageNotation,
    getEffectivenessClass,
    targetDamageCalcs,
    rollDamage,

    // Target selection
    toggleTarget,
    getTargetNameById,

    // Confirmation
    canConfirm,
    getConfirmData,
    reset
  }
}
