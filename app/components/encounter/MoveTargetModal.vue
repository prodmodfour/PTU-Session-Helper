<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal">
      <div class="modal__header">
        <h2>{{ move.name }}</h2>
        <span class="type-badge" :class="`type-badge--${move.type?.toLowerCase() || 'normal'}`">
          {{ move.type }}
        </span>
        <span v-if="hasSTAB" class="stab-badge">STAB</span>
      </div>

      <div class="modal__body">
        <!-- Move Info -->
        <div class="move-info">
          <div class="move-info__stat">
            <span class="label">Class:</span>
            <span>{{ move.damageClass }}</span>
          </div>
          <div v-if="move.damageBase" class="move-info__stat">
            <span class="label">DB:</span>
            <span>{{ move.damageBase }}{{ hasSTAB ? ' → ' + effectiveDB : '' }}</span>
          </div>
          <div v-if="move.ac" class="move-info__stat">
            <span class="label">AC:</span>
            <span>{{ move.ac }}</span>
          </div>
          <div class="move-info__stat">
            <span class="label">Range:</span>
            <span>{{ move.range }}</span>
          </div>
          <div v-if="move.damageBase && attackStatValue" class="move-info__stat">
            <span class="label">{{ attackStatLabel }}:</span>
            <span>{{ attackStatValue }}</span>
          </div>
          <div v-if="attackerAccuracyStage !== 0" class="move-info__stat">
            <span class="label">Accuracy:</span>
            <span :class="attackerAccuracyStage > 0 ? 'stat-boost' : 'stat-drop'">
              {{ attackerAccuracyStage > 0 ? '+' : '' }}{{ attackerAccuracyStage }}
            </span>
          </div>
        </div>

        <div v-if="move.effect" class="move-effect">
          {{ move.effect }}
        </div>

        <!-- Target Selection -->
        <div class="target-selection">
          <h4>Select Target(s)</h4>
          <div class="target-list">
            <button
              v-for="target in targets"
              :key="target.id"
              class="target-btn"
              :class="{
                'target-btn--selected': selectedTargets.includes(target.id),
                'target-btn--ally': target.side === 'players' || target.side === 'allies',
                'target-btn--enemy': target.side === 'enemies',
                'target-btn--hit': accuracyResults[target.id]?.hit,
                'target-btn--miss': accuracyResults[target.id] && !accuracyResults[target.id].hit
              }"
              @click="toggleTarget(target.id)"
            >
              <div class="target-btn__main">
                <span class="target-btn__name">{{ getTargetName(target) }}</span>
                <span class="target-btn__hp">{{ target.entity.currentHp }}/{{ target.entity.maxHp }}</span>
              </div>
              <!-- Accuracy result display -->
              <div v-if="selectedTargets.includes(target.id) && accuracyResults[target.id]" class="target-btn__accuracy">
                <span class="accuracy-roll">
                  d20: {{ accuracyResults[target.id].roll }}
                  <span v-if="accuracyResults[target.id].isNat20" class="crit-badge">NAT 20!</span>
                  <span v-if="accuracyResults[target.id].isNat1" class="fumble-badge">NAT 1</span>
                </span>
                <span class="accuracy-threshold">vs {{ accuracyResults[target.id].threshold }}</span>
                <span
                  class="accuracy-result"
                  :class="accuracyResults[target.id].hit ? 'accuracy-result--hit' : 'accuracy-result--miss'"
                >
                  {{ accuracyResults[target.id].hit ? 'HIT' : 'MISS' }}
                </span>
              </div>
              <!-- Evasion preview before accuracy roll -->
              <div v-else-if="selectedTargets.includes(target.id) && move.ac && !hasRolledAccuracy" class="target-btn__evasion">
                <span class="evasion-label">{{ evasionTypeLabel }}:</span>
                <span class="evasion-value">+{{ getTargetEvasion(target.id) }}</span>
                <span class="evasion-threshold">→ Need {{ getAccuracyThreshold(target.id) }}+</span>
              </div>
              <!-- Damage preview (only for hits) -->
              <div v-if="selectedTargets.includes(target.id) && hasRolledDamage && targetDamageCalcs[target.id] && (accuracyResults[target.id]?.hit || !move.ac)" class="target-btn__damage-preview">
                <span
                  class="effectiveness-badge"
                  :class="'effectiveness-badge--' + targetDamageCalcs[target.id].effectivenessClass"
                >
                  {{ targetDamageCalcs[target.id].effectivenessText }}
                </span>
                <span class="target-btn__final-damage">
                  {{ targetDamageCalcs[target.id].finalDamage }} dmg
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Accuracy Section (for moves with AC) -->
        <div v-if="move.ac && selectedTargets.length > 0" class="accuracy-section">
          <div class="accuracy-section__header">
            <span class="accuracy-section__label">
              Accuracy Check (AC {{ move.ac }})
            </span>
            <span v-if="attackerAccuracyStage !== 0" class="accuracy-section__modifier">
              {{ attackerAccuracyStage > 0 ? '+' : '' }}{{ attackerAccuracyStage }} Accuracy
            </span>
          </div>

          <div v-if="!hasRolledAccuracy" class="accuracy-section__roll-prompt">
            <button class="btn btn--primary btn--roll" @click="rollAccuracy">
              Roll Accuracy
            </button>
          </div>

          <div v-else class="accuracy-section__result">
            <div class="accuracy-summary">
              <span class="accuracy-summary__hits">{{ hitCount }} Hit{{ hitCount !== 1 ? 's' : '' }}</span>
              <span class="accuracy-summary__separator">/</span>
              <span class="accuracy-summary__misses">{{ missCount }} Miss{{ missCount !== 1 ? 'es' : '' }}</span>
            </div>
            <button class="btn btn--secondary btn--sm" @click="rollAccuracy">
              Reroll Accuracy
            </button>
          </div>
        </div>

        <!-- Damage Section -->
        <div v-if="fixedDamage && canShowDamageSection" class="damage-section damage-section--fixed">
          <span class="damage-section__label">Fixed Damage:</span>
          <span class="damage-section__value">{{ fixedDamage }}</span>
          <span class="damage-section__note">(ignores stats & type effectiveness)</span>
        </div>

        <div v-else-if="move.damageBase && canShowDamageSection" class="damage-section">
          <div class="damage-section__header">
            <span class="damage-section__label">
              Damage (DB {{ effectiveDB }}{{ hasSTAB ? ' with STAB' : '' }}):
            </span>
            <span class="damage-section__notation">{{ damageNotation }}</span>
          </div>

          <div v-if="!hasRolledDamage" class="damage-section__roll-prompt">
            <button class="btn btn--primary btn--roll" @click="rollDamage">
              Roll Damage
            </button>
          </div>

          <div v-else class="damage-section__result">
            <div class="damage-breakdown">
              <div class="damage-breakdown__row">
                <span class="damage-breakdown__label">Base Roll:</span>
                <span class="damage-breakdown__value">{{ damageRollResult?.total }}</span>
                <span class="damage-breakdown__detail">{{ damageRollResult?.breakdown }}</span>
              </div>
              <div class="damage-breakdown__row">
                <span class="damage-breakdown__label">+ {{ attackStatLabel }}:</span>
                <span class="damage-breakdown__value">{{ attackStatValue }}</span>
              </div>
              <div class="damage-breakdown__row damage-breakdown__row--total">
                <span class="damage-breakdown__label">Pre-Defense Total:</span>
                <span class="damage-breakdown__value">{{ preDefenseTotal }}</span>
              </div>
            </div>
            <button class="btn btn--secondary btn--sm" @click="rollDamage">
              Reroll
            </button>
          </div>

          <!-- Per-target damage breakdown (after rolling, only for hits) -->
          <div v-if="hasRolledDamage && hitTargets.length > 0" class="target-damages">
            <h4>Damage Per Target</h4>
            <div
              v-for="targetId in hitTargets"
              :key="targetId"
              class="target-damage-row"
            >
              <span class="target-damage-row__name">{{ getTargetNameById(targetId) }}</span>
              <div class="target-damage-row__calc" v-if="targetDamageCalcs[targetId]">
                <span class="target-damage-row__step">{{ preDefenseTotal }}</span>
                <span class="target-damage-row__op">−</span>
                <span class="target-damage-row__step">{{ targetDamageCalcs[targetId].defenseStat }} {{ defenseStatLabel }}</span>
                <span class="target-damage-row__op">×</span>
                <span
                  class="target-damage-row__step effectiveness-badge"
                  :class="'effectiveness-badge--' + targetDamageCalcs[targetId].effectivenessClass"
                >
                  {{ targetDamageCalcs[targetId].effectiveness }}
                </span>
                <span class="target-damage-row__op">=</span>
                <span class="target-damage-row__result">{{ targetDamageCalcs[targetId].finalDamage }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Miss message when all targets missed -->
        <div v-if="hasRolledAccuracy && hitCount === 0" class="miss-message">
          All targets evaded the attack!
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('cancel')">Cancel</button>
        <button
          class="btn btn--primary"
          :disabled="!canConfirm"
          @click="confirm"
        >
          Use {{ move.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Move, Combatant, Pokemon, HumanCharacter, PokemonType } from '~/types'
import type { DiceRollResult } from '~/utils/diceRoller'
import { roll } from '~/utils/diceRoller'

interface TargetDamageCalc {
  targetId: string
  defenseStat: number
  effectiveness: number
  effectivenessText: string
  effectivenessClass: string
  finalDamage: number
}

interface AccuracyResult {
  targetId: string
  roll: number
  threshold: number
  hit: boolean
  isNat1: boolean
  isNat20: boolean
}

const props = defineProps<{
  move: Move
  actor: Combatant
  targets: Combatant[]
}>()

const emit = defineEmits<{
  confirm: [targetIds: string[], damage?: number, rollResult?: DiceRollResult, targetDamages?: Record<string, number>]
  cancel: []
}>()

const {
  rollDamageBase,
  getDamageRoll,
  hasSTAB: checkSTAB,
  getTypeEffectiveness,
  getEffectivenessDescription,
  applyStageModifier,
  calculatePhysicalEvasion,
  calculateSpecialEvasion,
  calculateSpeedEvasion
} = useCombat()

// Use extracted composable for safe stat access
const {
  getStageModifiers,
  getPokemonAttackStat,
  getPokemonSpAtkStat,
  getPokemonDefenseStat,
  getPokemonSpDefStat,
  getPokemonSpeedStat,
  getHumanStat
} = useEntityStats()

const selectedTargets = ref<string[]>([])
const damageRollResult = ref<DiceRollResult | null>(null)
const hasRolledDamage = ref(false)
const hasRolledAccuracy = ref(false)
const accuracyResults = ref<Record<string, AccuracyResult>>({})

// Get actor's types
const actorTypes = computed((): string[] => {
  if (props.actor.type === 'pokemon') {
    return (props.actor.entity as Pokemon).types
  }
  // Humans don't have types, so no STAB
  return []
})

// Check if move gets STAB
const hasSTAB = computed(() => {
  if (!props.move.type) return false
  return checkSTAB(props.move.type, actorTypes.value)
})

// Effective damage base (with STAB +2)
const effectiveDB = computed(() => {
  if (!props.move.damageBase) return 0
  return hasSTAB.value ? props.move.damageBase + 2 : props.move.damageBase
})

// Get attacker's accuracy combat stage
const attackerAccuracyStage = computed((): number => {
  const stages = getStageModifiers(props.actor.entity)
  return stages.accuracy || 0
})

// Evasion type label based on move damage class
const evasionTypeLabel = computed((): string => {
  return props.move.damageClass === 'Physical' ? 'Phys Evasion' : 'Spec Evasion'
})

// Get a target's evasion value based on move type
const getTargetEvasion = (targetId: string): number => {
  const target = props.targets.find(t => t.id === targetId)
  if (!target || !target.entity) return 0

  const entity = target.entity
  const stages = getStageModifiers(entity)

  if (props.move.damageClass === 'Physical') {
    // Physical evasion from Defense
    const defStat = target.type === 'pokemon'
      ? getPokemonDefenseStat(entity)
      : getHumanStat(entity, 'defense')
    return calculatePhysicalEvasion(defStat, stages.defense)
  } else {
    // Special evasion from Sp. Defense
    const spDefStat = target.type === 'pokemon'
      ? getPokemonSpDefStat(entity)
      : getHumanStat(entity, 'specialDefense')
    return calculateSpecialEvasion(spDefStat, stages.specialDefense)
  }
}

// Calculate accuracy threshold needed to hit a target
const getAccuracyThreshold = (targetId: string): number => {
  if (!props.move.ac) return 0

  const evasion = getTargetEvasion(targetId)
  // Threshold = Move AC + Evasion - Accuracy stages
  // But evasion is capped at +9 total
  const effectiveEvasion = Math.min(9, evasion)
  return Math.max(1, props.move.ac + effectiveEvasion - attackerAccuracyStage.value)
}

// Roll accuracy for all selected targets
const rollAccuracy = () => {
  if (!props.move.ac) return

  const results: Record<string, AccuracyResult> = {}

  for (const targetId of selectedTargets.value) {
    const d20Result = roll('1d20')
    const naturalRoll = d20Result.dice[0] // dice array, not rolls
    const threshold = getAccuracyThreshold(targetId)

    const isNat1 = naturalRoll === 1
    const isNat20 = naturalRoll === 20

    // Natural 1 always misses, Natural 20 always hits
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

  // Reset damage roll when accuracy is rerolled
  hasRolledDamage.value = false
  damageRollResult.value = null
}

// Count hits and misses
const hitCount = computed(() => {
  return Object.values(accuracyResults.value).filter(r => r.hit).length
})

const missCount = computed(() => {
  return Object.values(accuracyResults.value).filter(r => !r.hit).length
})

// Get list of targets that were hit (for damage calculation)
const hitTargets = computed((): string[] => {
  if (!props.move.ac) {
    // No AC = auto-hit (status moves, etc.)
    return selectedTargets.value
  }
  return selectedTargets.value.filter(id => accuracyResults.value[id]?.hit)
})

// Can show damage section? Only if there are hits (or no AC check needed)
const canShowDamageSection = computed((): boolean => {
  if (!props.move.ac) return true // No accuracy check needed
  return hasRolledAccuracy.value && hitCount.value > 0
})

// Get actor's attack stat (Attack or Special Attack based on move class)
const attackStatValue = computed((): number => {
  if (!props.move.damageBase) return 0

  const entity = props.actor.entity
  if (!entity) return 0

  const stages = getStageModifiers(entity)

  if (props.move.damageClass === 'Physical') {
    const baseStat = props.actor.type === 'pokemon'
      ? getPokemonAttackStat(entity)
      : getHumanStat(entity, 'attack')
    return applyStageModifier(baseStat, stages.attack)
  } else if (props.move.damageClass === 'Special') {
    const baseStat = props.actor.type === 'pokemon'
      ? getPokemonSpAtkStat(entity)
      : getHumanStat(entity, 'specialAttack')
    return applyStageModifier(baseStat, stages.specialAttack)
  }
  return 0
})

const attackStatLabel = computed(() => {
  return props.move.damageClass === 'Physical' ? 'ATK' : 'SP.ATK'
})

const defenseStatLabel = computed(() => {
  return props.move.damageClass === 'Physical' ? 'DEF' : 'SP.DEF'
})

// Pre-defense total (base roll + attack stat)
const preDefenseTotal = computed(() => {
  if (!damageRollResult.value) return 0
  return damageRollResult.value.total + attackStatValue.value
})

// Parse move effect for fixed damage (e.g., Dragon Rage = 15 HP)
const fixedDamage = computed((): number | null => {
  if (!props.move.effect) return null

  const patterns = [
    /lose\s+(\d+)\s+(?:HP|Hit\s*Points?)/i,
    /deals?\s+(\d+)\s+damage/i,
    /always\s+deals?\s+(\d+)/i,
    /(\d+)\s+damage\s+flat/i,
    /flat\s+(\d+)\s+damage/i,
    /(\d+)\s+Damage/
  ]

  for (const pattern of patterns) {
    const match = props.move.effect.match(pattern)
    if (match) {
      return parseInt(match[1], 10)
    }
  }

  return null
})

// Get the dice notation for this move's damage (using effective DB)
const damageNotation = computed(() => {
  if (!effectiveDB.value) return null
  return getDamageRoll(effectiveDB.value)
})

// Calculate damage for each selected target (only for hits)
const targetDamageCalcs = computed((): Record<string, TargetDamageCalc> => {
  if (!hasRolledDamage.value || !damageRollResult.value) return {}

  const calcs: Record<string, TargetDamageCalc> = {}

  // Only calculate for targets that were hit
  for (const targetId of hitTargets.value) {
    const target = props.targets.find(t => t.id === targetId)
    if (!target || !target.entity) continue

    // Get target's defense stat
    const entity = target.entity
    const stages = getStageModifiers(entity)

    let defenseStat: number
    if (props.move.damageClass === 'Physical') {
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

    // Get target's types for effectiveness
    let targetTypes: string[]
    if (target.type === 'pokemon') {
      targetTypes = (entity as Pokemon).types || []
    } else {
      // Humans are typeless (neutral effectiveness)
      targetTypes = []
    }

    // Calculate type effectiveness
    const effectiveness = props.move.type
      ? getTypeEffectiveness(props.move.type, targetTypes)
      : 1

    // Calculate final damage
    // (Pre-defense total - Defense) × Effectiveness, minimum 1
    let damage = preDefenseTotal.value - defenseStat
    damage = Math.max(1, damage) // Minimum 1 before effectiveness
    damage = Math.floor(damage * effectiveness)
    damage = Math.max(1, damage) // Final minimum 1

    // Immunity check
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

const getEffectivenessClass = (effectiveness: number): string => {
  if (effectiveness === 0) return 'immune'
  if (effectiveness <= 0.25) return 'double-resist'
  if (effectiveness < 1) return 'resist'
  if (effectiveness >= 2) return 'double-super'
  if (effectiveness > 1) return 'super'
  return 'neutral'
}

// Roll damage for the move (using effective DB with STAB)
const rollDamage = () => {
  if (!effectiveDB.value) return
  damageRollResult.value = rollDamageBase(effectiveDB.value, false)
  hasRolledDamage.value = true
}

const toggleTarget = (targetId: string) => {
  const index = selectedTargets.value.indexOf(targetId)
  if (index === -1) {
    selectedTargets.value.push(targetId)
  } else {
    selectedTargets.value.splice(index, 1)
  }

  // Reset accuracy and damage rolls when targets change
  hasRolledAccuracy.value = false
  hasRolledDamage.value = false
  accuracyResults.value = {}
  damageRollResult.value = null
}

const getTargetName = (target: Combatant): string => {
  if (target.type === 'pokemon') {
    const pokemon = target.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (target.entity as HumanCharacter).name
}

const getTargetNameById = (targetId: string): string => {
  const target = props.targets.find(t => t.id === targetId)
  return target ? getTargetName(target) : '???'
}

// Can confirm the action?
const canConfirm = computed((): boolean => {
  if (selectedTargets.value.length === 0) return false

  // If move has AC, accuracy must be rolled
  if (props.move.ac && !hasRolledAccuracy.value) return false

  // If move has damage and there are hits, damage must be rolled
  if (props.move.damageBase && !fixedDamage.value && hitTargets.value.length > 0 && !hasRolledDamage.value) {
    return false
  }

  // All checks passed (even if all misses, we can confirm to log the miss)
  return true
})

const confirm = () => {
  // For fixed damage moves, apply flat damage to hit targets only
  if (fixedDamage.value) {
    const targetDamages: Record<string, number> = {}
    for (const targetId of hitTargets.value) {
      targetDamages[targetId] = fixedDamage.value
    }
    emit('confirm', selectedTargets.value, fixedDamage.value, undefined, targetDamages)
    return
  }

  // For normal moves, send per-target calculated damages (only for hits)
  if (hasRolledDamage.value && Object.keys(targetDamageCalcs.value).length > 0) {
    const targetDamages: Record<string, number> = {}
    for (const [targetId, calc] of Object.entries(targetDamageCalcs.value)) {
      targetDamages[targetId] = calc.finalDamage
    }
    // Use first hit target's damage as "main" damage for backward compatibility
    const firstHitTarget = hitTargets.value[0]
    const firstTargetDamage = firstHitTarget ? targetDamages[firstHitTarget] : undefined
    emit('confirm', selectedTargets.value, firstTargetDamage, damageRollResult.value ?? undefined, targetDamages)
    return
  }

  // Status moves, all misses, or no damage
  emit('confirm', selectedTargets.value, undefined, undefined, undefined)
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  width: 100%;
  max-width: 550px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-xl, 0 0 40px rgba($color-accent-violet, 0.15);
  animation: slideUp 0.3s ease-out;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-lg;
    border-bottom: 1px solid $glass-border;
    background: linear-gradient(135deg, rgba($color-accent-violet, 0.1) 0%, transparent 100%);

    h2 {
      margin: 0;
      flex: 1;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-lg;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-md;
    padding: $spacing-lg;
    border-top: 1px solid $glass-border;
    background: rgba($color-bg-primary, 0.5);
  }
}

.stab-badge {
  background: linear-gradient(135deg, $color-success 0%, darken($color-success, 10%) 100%);
  color: white;
  font-size: $font-size-xs;
  font-weight: 700;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;
  text-transform: uppercase;
}

.stat-boost {
  color: $color-success;
  font-weight: 600;
}

.stat-drop {
  color: $color-side-enemy;
  font-weight: 600;
}

.move-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;

  &__stat {
    display: flex;
    gap: $spacing-sm;
    font-size: $font-size-sm;

    .label {
      color: $color-text-muted;
    }
  }
}

.move-effect {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: 1.5;
}

.target-selection {
  margin-bottom: $spacing-lg;

  h4 {
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.target-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.target-btn {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 2px solid transparent;
  border-radius: $border-radius-md;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;

  &__main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  &__damage-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-top: $spacing-xs;
    border-top: 1px solid rgba($glass-border, 0.5);
  }

  &__final-damage {
    font-weight: 700;
    color: $color-accent-scarlet;
  }

  &:hover {
    background: $color-bg-hover;
    border-color: $border-color-emphasis;
  }

  &--selected {
    border-color: $color-accent-scarlet;
    background: linear-gradient(135deg, rgba($color-accent-scarlet, 0.15) 0%, rgba($color-accent-violet, 0.1) 100%);
    box-shadow: 0 0 10px rgba($color-accent-scarlet, 0.2);
  }

  &--ally {
    border-left: 4px solid $color-side-player;
  }

  &--enemy {
    border-left: 4px solid $color-side-enemy;
  }

  &--hit {
    border-color: $color-success;
    background: linear-gradient(135deg, rgba($color-success, 0.15) 0%, rgba($color-success, 0.05) 100%);
  }

  &--miss {
    border-color: rgba($color-text-muted, 0.5);
    background: rgba($color-text-muted, 0.05);
    opacity: 0.7;
  }

  &__name {
    font-weight: 500;
  }

  &__hp {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &__accuracy {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    width: 100%;
    padding-top: $spacing-xs;
    border-top: 1px solid rgba($glass-border, 0.5);
    font-size: $font-size-sm;
  }

  &__evasion {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    width: 100%;
    padding-top: $spacing-xs;
    border-top: 1px solid rgba($glass-border, 0.5);
    font-size: $font-size-sm;
    color: $color-text-muted;

    .evasion-value {
      color: $color-accent-violet;
      font-weight: 600;
    }

    .evasion-threshold {
      margin-left: auto;
      color: $color-text-muted;
    }
  }
}

.accuracy-roll {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-family: monospace;
}

.accuracy-threshold {
  color: $color-text-muted;
}

.accuracy-result {
  margin-left: auto;
  font-weight: 700;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;

  &--hit {
    background: rgba($color-success, 0.2);
    color: $color-success;
  }

  &--miss {
    background: rgba($color-text-muted, 0.2);
    color: $color-text-muted;
  }
}

.crit-badge {
  background: linear-gradient(135deg, gold 0%, darken(gold, 10%) 100%);
  color: $color-bg-primary;
  font-size: $font-size-xs;
  font-weight: 700;
  padding: 1px $spacing-xs;
  border-radius: $border-radius-sm;
  text-transform: uppercase;
}

.fumble-badge {
  background: rgba($color-side-enemy, 0.3);
  color: $color-side-enemy;
  font-size: $font-size-xs;
  font-weight: 700;
  padding: 1px $spacing-xs;
  border-radius: $border-radius-sm;
  text-transform: uppercase;
}

.effectiveness-badge {
  font-size: $font-size-xs;
  font-weight: 600;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;

  &--immune {
    background: rgba(128, 128, 128, 0.3);
    color: #888;
  }

  &--double-resist {
    background: rgba($color-side-ally, 0.2);
    color: $color-side-ally;
  }

  &--resist {
    background: rgba($color-side-ally, 0.15);
    color: lighten($color-side-ally, 10%);
  }

  &--neutral {
    background: rgba(255, 255, 255, 0.1);
    color: $color-text-muted;
  }

  &--super {
    background: rgba($color-side-enemy, 0.15);
    color: lighten($color-side-enemy, 10%);
  }

  &--double-super {
    background: rgba($color-side-enemy, 0.25);
    color: $color-side-enemy;
  }
}

.damage-section {
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;

  &--fixed {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    flex-wrap: wrap;
    background: linear-gradient(135deg, rgba($color-accent-scarlet, 0.15) 0%, rgba($color-accent-violet, 0.1) 100%);
    border-color: rgba($color-accent-scarlet, 0.3);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-weight: 500;
  }

  &__notation {
    font-family: monospace;
    font-size: $font-size-sm;
    color: $color-accent-violet;
    background: $color-bg-secondary;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
  }

  &__value {
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-accent-scarlet;
  }

  &__note {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-style: italic;
  }

  &__roll-prompt {
    display: flex;
    justify-content: center;
  }

  &__result {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }
}

.damage-breakdown {
  background: $color-bg-secondary;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &__row {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xs 0;

    &--total {
      border-top: 1px solid $border-color-default;
      margin-top: $spacing-xs;
      padding-top: $spacing-sm;

      .damage-breakdown__value {
        color: $color-accent-scarlet;
        font-size: $font-size-lg;
      }
    }
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-muted;
    min-width: 120px;
  }

  &__value {
    font-weight: 700;
    color: $color-text;
  }

  &__detail {
    font-size: $font-size-xs;
    font-family: monospace;
    color: $color-text-muted;
  }
}

.target-damages {
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color-default;

  h4 {
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.target-damage-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-sm;
  background: $color-bg-secondary;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-sm;

  &__name {
    font-weight: 600;
    font-size: $font-size-sm;
  }

  &__calc {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    flex-wrap: wrap;
    font-size: $font-size-sm;
  }

  &__step {
    background: $color-bg-tertiary;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
  }

  &__op {
    color: $color-text-muted;
    font-weight: 500;
  }

  &__result {
    font-weight: 700;
    font-size: $font-size-md;
    color: $color-accent-scarlet;
    background: rgba($color-accent-scarlet, 0.15);
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
  }
}

.accuracy-section {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-weight: 500;
  }

  &__modifier {
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    background: $color-bg-secondary;
    color: $color-accent-violet;
    font-weight: 600;
  }

  &__roll-prompt {
    display: flex;
    justify-content: center;
  }

  &__result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
  }
}

.accuracy-summary {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: $font-size-lg;

  &__hits {
    color: $color-success;
    font-weight: 700;
  }

  &__separator {
    color: $color-text-muted;
  }

  &__misses {
    color: $color-text-muted;
    font-weight: 500;
  }
}

.miss-message {
  padding: $spacing-lg;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-size-lg;
  font-style: italic;
  background: $color-bg-tertiary;
  border: 1px dashed $border-color-default;
  border-radius: $border-radius-md;
}

.btn--roll {
  font-size: $font-size-md;
  padding: $spacing-md $spacing-xl;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
