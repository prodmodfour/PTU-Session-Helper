<template>
  <div :class="['capabilities-section', `capabilities-section--${variant}`]">
    <h4 class="section-label">Capabilities</h4>
    <div class="capabilities-grid">
      <div class="capability-block">
        <label>Power</label>
        <span class="capability-value">{{ derivedStats.power }}</span>
      </div>
      <div class="capability-block">
        <label>High Jump</label>
        <span class="capability-value">{{ derivedStats.highJump }}m</span>
      </div>
      <div class="capability-block">
        <label>Long Jump</label>
        <span class="capability-value">{{ derivedStats.longJump }}m</span>
      </div>
      <div class="capability-block">
        <label>Overland</label>
        <span class="capability-value">{{ derivedStats.overland }}</span>
      </div>
      <div class="capability-block">
        <label>Swimming</label>
        <span class="capability-value">{{ derivedStats.swimming }}</span>
      </div>
      <div class="capability-block">
        <label>Throwing Range</label>
        <span class="capability-value">{{ derivedStats.throwingRange }}m</span>
      </div>
      <div class="capability-block">
        <label>Weight Class</label>
        <span class="capability-value">{{ derivedStats.weightClass != null ? derivedStats.weightClass : '—' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrainerDerivedStats } from '~/utils/trainerDerivedStats'

withDefaults(defineProps<{
  derivedStats: TrainerDerivedStats
  variant?: 'default' | 'bordered'
}>(), {
  variant: 'default'
})
</script>

<style lang="scss" scoped>
.capabilities-section {
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid $glass-border;
}

.section-label {
  margin: 0 0 $spacing-sm 0;
  font-size: $font-size-sm;
  color: $color-text-muted;
  text-transform: uppercase;
  font-weight: 600;
}

.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-sm;
}

.capability-block {
  background: $color-bg-secondary;
  border-radius: $border-radius-sm;
  padding: $spacing-sm;
  text-align: center;

  .capabilities-section--bordered & {
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
  }

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    margin-bottom: $spacing-xs;
  }
}

.capability-value {
  font-size: $font-size-md;
  font-weight: 600;
  color: $color-accent-teal;
}
</style>
