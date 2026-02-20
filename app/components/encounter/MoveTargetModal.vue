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
                <span class="evasion-label">{{ getTargetEvasionLabel(target.id) }}:</span>
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
import type { Move, Combatant } from '~/types'
import type { DiceRollResult } from '~/utils/diceRoller'

const { getCombatantName } = useCombatantDisplay()

const props = defineProps<{
  move: Move
  actor: Combatant
  targets: Combatant[]
}>()

const emit = defineEmits<{
  confirm: [targetIds: string[], damage?: number, rollResult?: DiceRollResult, targetDamages?: Record<string, number>]
  cancel: []
}>()

// Convert props to refs for the composable
const moveRef = toRef(props, 'move')
const actorRef = toRef(props, 'actor')
const targetsRef = toRef(props, 'targets')

// Use the extracted composable for all calculations
const {
  // State
  selectedTargets,
  damageRollResult,
  hasRolledDamage,
  hasRolledAccuracy,
  accuracyResults,
  // STAB
  hasSTAB,
  effectiveDB,
  // Accuracy
  attackerAccuracyStage,
  getTargetEvasion,
  getTargetEvasionLabel,
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
  targetDamageCalcs,
  rollDamage,
  // Target selection
  toggleTarget,
  getTargetNameById,
  // Confirmation
  canConfirm,
  getConfirmData
} = useMoveCalculation(moveRef, actorRef, targetsRef)

// Use shared composable for name resolution
const getTargetName = getCombatantName

const confirm = () => {
  const data = getConfirmData()
  emit('confirm', data.targetIds, data.damage, data.rollResult, data.targetDamages)
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
