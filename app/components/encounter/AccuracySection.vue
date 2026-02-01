<template>
  <div class="accuracy-section">
    <div class="accuracy-section__header">
      <span class="accuracy-section__label">
        Accuracy Check (AC {{ moveAC }})
      </span>
      <span v-if="accuracyStage !== 0" class="accuracy-section__modifier">
        {{ accuracyStage > 0 ? '+' : '' }}{{ accuracyStage }} Accuracy
      </span>
    </div>

    <div v-if="!hasRolled" class="accuracy-section__roll-prompt">
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
</template>

<script setup lang="ts">
import { roll } from '~/utils/diceRoller'

export interface AccuracyResult {
  targetId: string
  roll: number
  threshold: number
  hit: boolean
  isNat1: boolean
  isNat20: boolean
}

const props = defineProps<{
  moveAC: number
  accuracyStage: number
  targetIds: string[]
  getAccuracyThreshold: (targetId: string) => number
}>()

const emit = defineEmits<{
  'update:results': [results: Record<string, AccuracyResult>]
  rolled: []
}>()

const hasRolled = ref(false)
const results = ref<Record<string, AccuracyResult>>({})

const hitCount = computed(() => {
  return Object.values(results.value).filter(r => r.hit).length
})

const missCount = computed(() => {
  return Object.values(results.value).filter(r => !r.hit).length
})

const rollAccuracy = () => {
  const newResults: Record<string, AccuracyResult> = {}

  for (const targetId of props.targetIds) {
    const d20Result = roll('1d20')
    const naturalRoll = d20Result.dice[0]
    const threshold = props.getAccuracyThreshold(targetId)

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

    newResults[targetId] = {
      targetId,
      roll: naturalRoll,
      threshold,
      hit,
      isNat1,
      isNat20
    }
  }

  results.value = newResults
  hasRolled.value = true
  emit('update:results', newResults)
  emit('rolled')
}

// Expose for parent component
defineExpose({
  hasRolled,
  results,
  hitCount,
  missCount
})
</script>

<style lang="scss" scoped>
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

.btn--roll {
  font-size: $font-size-md;
  padding: $spacing-md $spacing-xl;
}
</style>
