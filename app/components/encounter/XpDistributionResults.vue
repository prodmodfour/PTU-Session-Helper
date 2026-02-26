<template>
  <div class="results-section">
    <h3 class="section__title">XP Distribution Complete</h3>
    <div class="results-list">
      <div
        v-for="result in results"
        :key="result.pokemonId"
        class="result-row"
        :class="{ 'result-row--leveled': result.levelsGained > 0 }"
      >
        <div class="result-row__info">
          <span class="result-row__name">{{ result.species }}</span>
          <span class="result-row__xp">+{{ result.xpGained }} XP</span>
        </div>
        <div class="result-row__level">
          <span v-if="result.levelsGained > 0" class="result-row__levelup">
            Lv.{{ result.previousLevel }} -> Lv.{{ result.newLevel }}
          </span>
          <span v-else class="result-row__no-change">
            Lv.{{ result.newLevel }}
          </span>
        </div>
      </div>
    </div>
    <div class="results-total">
      Total XP Distributed: {{ totalXpDistributed }}
    </div>

    <!-- Level-Up Notification (detailed view for leveled Pokemon) -->
    <LevelUpNotification
      v-if="hasLevelUps"
      :results="results"
    />
  </div>
</template>

<script setup lang="ts">
import type { XpApplicationResult } from '~/utils/experienceCalculation'

const props = defineProps<{
  results: XpApplicationResult[]
  totalXpDistributed: number
}>()

const hasLevelUps = computed(() =>
  props.results.some(r => r.levelsGained > 0)
)
</script>

<style lang="scss" scoped>
.results-section {
  padding: $spacing-sm 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
}

.result-row {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &--leveled {
    border-color: rgba($color-success, 0.4);
    background: linear-gradient(135deg, rgba($color-success, 0.05) 0%, $color-bg-tertiary 100%);
  }

  &__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-weight: 600;
    color: $color-text;
  }

  &__xp {
    font-size: $font-size-sm;
    color: $color-accent-teal;
    font-weight: 600;
  }

  &__level {
    margin-bottom: $spacing-xs;
  }

  &__levelup {
    font-weight: 700;
    color: $color-success;
  }

  &__no-change {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

.results-total {
  text-align: center;
  padding: $spacing-md;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-accent-teal;
}
</style>
