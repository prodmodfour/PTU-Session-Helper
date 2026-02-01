<template>
  <div class="maneuvers-grid">
    <button
      v-for="maneuver in maneuvers"
      :key="maneuver.id"
      class="maneuver-btn"
      :class="`maneuver-btn--${maneuver.actionType}`"
      :disabled="isDisabled(maneuver)"
      @click="$emit('select', maneuver)"
    >
      <div class="maneuver-btn__header">
        <img :src="maneuver.icon" alt="" class="maneuver-btn__icon" />
        <span class="maneuver-btn__name">{{ maneuver.name }}</span>
      </div>
      <div class="maneuver-btn__meta">
        <span class="maneuver-btn__action">{{ maneuver.actionLabel }}</span>
        <span v-if="maneuver.ac" class="maneuver-btn__ac">AC {{ maneuver.ac }}</span>
      </div>
      <p class="maneuver-btn__desc">{{ maneuver.shortDesc }}</p>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Maneuver } from '~/constants/combatManeuvers'
import { COMBAT_MANEUVERS } from '~/constants/combatManeuvers'

const props = withDefaults(defineProps<{
  maneuvers?: Maneuver[]
  standardActionUsed?: boolean
  shiftActionUsed?: boolean
}>(), {
  maneuvers: () => COMBAT_MANEUVERS,
  standardActionUsed: false,
  shiftActionUsed: false
})

defineEmits<{
  select: [maneuver: Maneuver]
}>()

const isDisabled = (maneuver: Maneuver): boolean => {
  if (maneuver.actionType === 'standard') {
    return props.standardActionUsed
  }
  if (maneuver.actionType === 'full') {
    // Full action requires both standard and shift
    return props.standardActionUsed || props.shiftActionUsed
  }
  // Interrupts are always available (they're reactions)
  return false
}
</script>

<style lang="scss" scoped>
.maneuvers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $spacing-md;
}

.maneuver-btn {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: $color-bg-hover;
    border-color: $border-color-emphasis;
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__icon {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-md;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-xs;
  }

  &__action {
    padding: 2px $spacing-xs;
    background: $color-bg-secondary;
    border-radius: $border-radius-sm;
    color: $color-text-muted;
  }

  &__ac {
    color: $color-text-muted;
  }

  &__desc {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.4;
  }

  // Action type colors
  &--standard {
    &:not(:disabled):hover {
      border-color: $color-accent-teal;
    }
  }

  &--full {
    &:not(:disabled):hover {
      border-color: $color-warning;
    }
    .maneuver-btn__action {
      background: rgba($color-warning, 0.2);
      color: $color-warning;
    }
  }

  &--interrupt {
    &:not(:disabled):hover {
      border-color: $color-accent-violet;
    }
    .maneuver-btn__action {
      background: rgba($color-accent-violet, 0.2);
      color: $color-accent-violet;
    }
  }
}
</style>
