<template>
  <div class="damage-section" :class="{ 'damage-section--fixed': fixedDamage !== null }">
    <!-- Fixed Damage Display -->
    <template v-if="fixedDamage !== null">
      <span class="damage-section__label">Fixed Damage:</span>
      <span class="damage-section__value">{{ fixedDamage }}</span>
      <span class="damage-section__note">(ignores stats & type effectiveness)</span>
    </template>

    <!-- Normal Damage Roll -->
    <template v-else>
      <div class="damage-section__header">
        <span class="damage-section__label">
          Damage (DB {{ effectiveDB }}{{ hasSTAB ? ' with STAB' : '' }}):
        </span>
        <span class="damage-section__notation">{{ damageNotation }}</span>
      </div>

      <div v-if="!hasRolled" class="damage-section__roll-prompt">
        <button class="btn btn--primary btn--roll" @click="rollDamage">
          Roll Damage
        </button>
      </div>

      <div v-else class="damage-section__result">
        <div class="damage-breakdown">
          <div class="damage-breakdown__row">
            <span class="damage-breakdown__label">Base Roll:</span>
            <span class="damage-breakdown__value">{{ rollResult?.total }}</span>
            <span class="damage-breakdown__detail">{{ rollResult?.breakdown }}</span>
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
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DiceRollResult } from '~/utils/diceRoller'

const props = defineProps<{
  effectiveDB: number
  hasSTAB: boolean
  damageNotation: string
  attackStatLabel: string
  attackStatValue: number
  fixedDamage: number | null
}>()

const emit = defineEmits<{
  'update:rollResult': [result: DiceRollResult]
  rolled: []
}>()

const { rollDamageBase } = useDamageCalculation()

const hasRolled = ref(false)
const rollResult = ref<DiceRollResult | null>(null)

const preDefenseTotal = computed(() => {
  if (!rollResult.value) return 0
  return rollResult.value.total + props.attackStatValue
})

const rollDamage = () => {
  if (!props.effectiveDB) return
  rollResult.value = rollDamageBase(props.effectiveDB, false)
  hasRolled.value = true
  emit('update:rollResult', rollResult.value)
  emit('rolled')
}

// Expose for parent component
defineExpose({
  hasRolled,
  rollResult,
  preDefenseTotal
})
</script>

<style lang="scss" scoped>
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

.btn--roll {
  font-size: $font-size-md;
  padding: $spacing-md $spacing-xl;
}
</style>
