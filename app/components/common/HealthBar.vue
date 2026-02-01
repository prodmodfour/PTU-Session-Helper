<template>
  <div class="health-bar" :class="healthBarClass">
    <div v-if="showLabel" class="health-bar__label">HP</div>
    <div class="health-bar__container">
      <div class="health-bar__track">
        <!-- Temp HP layer (cyan) -->
        <div
          v-if="tempHp > 0"
          class="health-bar__temp"
          :style="{ width: tempHpPercentage + '%' }"
        ></div>
        <!-- Regular HP layer -->
        <div class="health-bar__fill" :style="{ width: healthPercentage + '%' }"></div>
      </div>
      <span class="health-bar__text">
        <template v-if="showExactValues">
          {{ currentHp }}/{{ maxHp }}
          <span v-if="tempHp > 0" class="health-bar__temp-text">(+{{ tempHp }})</span>
        </template>
        <template v-else>
          {{ healthPercentage }}%
          <span v-if="tempHp > 0" class="health-bar__temp-text">(+T)</span>
        </template>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  currentHp: number
  maxHp: number
  tempHp?: number
  showLabel?: boolean
  showExactValues?: boolean
}>(), {
  tempHp: 0,
  showLabel: true,
  showExactValues: false
})

const { getHealthPercentage, getHealthStatus } = useCombat()

const healthPercentage = computed(() =>
  getHealthPercentage(props.currentHp, props.maxHp)
)

const tempHpPercentage = computed(() => {
  if (props.tempHp <= 0) return 0
  // Show temp HP as percentage of max HP, capped at 100%
  return Math.min(100, Math.round((props.tempHp / props.maxHp) * 100))
})

const healthBarClass = computed(() => {
  const status = getHealthStatus(healthPercentage.value)
  return `health-bar--${status}`
})
</script>

<style lang="scss" scoped>
.health-bar {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  width: 100%;

  &__label {
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-text-muted;
    min-width: 20px;
  }

  &__container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__track {
    flex: 1;
    height: 8px;
    background: $color-bg-tertiary;
    border-radius: $border-radius-full;
    overflow: hidden;
    position: relative;
  }

  &__fill {
    height: 100%;
    background: $color-success;
    border-radius: $border-radius-full;
    transition: width 0.3s ease, background-color 0.3s ease;
    position: relative;
    z-index: 1;
  }

  &__temp {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: $color-info;
    opacity: 0.7;
    z-index: 2;
  }

  &__text {
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-text;
    min-width: 50px;
    text-align: right;
  }

  &__temp-text {
    color: $color-info;
    font-size: $font-size-xs;
  }

  // Health status colors
  &--healthy &__fill {
    background: $color-success;
  }

  &--injured &__fill {
    background: $color-warning;
  }

  &--critical &__fill {
    background: $color-danger;
  }

  &--fainted &__fill {
    background: $color-text-muted;
  }
}
</style>
