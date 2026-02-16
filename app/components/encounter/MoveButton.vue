<template>
  <button
    class="move-btn"
    :class="[
      `move-btn--${move.type?.toLowerCase() || 'normal'}`,
      { 'move-btn--disabled': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('select', move)"
  >
    <div class="move-btn__main">
      <span class="move-btn__name">{{ move.name }}</span>
      <span class="move-btn__type">{{ move.type }}</span>
    </div>
    <div class="move-btn__details">
      <span v-if="move.damageBase" class="move-btn__damage">
        DB {{ move.damageBase }}{{ showSTAB && hasSTAB ? '+2' : '' }}
      </span>
      <span class="move-btn__frequency">{{ move.frequency }}</span>
      <span v-if="move.ac !== null && move.ac !== undefined" class="move-btn__ac">AC {{ move.ac }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { Move } from '~/types'

const props = withDefaults(defineProps<{
  move: Move
  disabled?: boolean
  actorTypes?: string[]
  showSTAB?: boolean
}>(), {
  disabled: false,
  actorTypes: () => [],
  showSTAB: false
})

defineEmits<{
  select: [move: Move]
}>()

const { hasSTAB: checkSTAB } = useTypeChart()

const hasSTAB = computed(() => {
  if (!props.showSTAB || !props.move.type || props.actorTypes.length === 0) return false
  return checkSTAB(props.move.type, props.actorTypes)
})
</script>

<style lang="scss" scoped>
.move-btn {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;
  width: 100%;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__main {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__name {
    font-weight: 600;
    color: $color-text;
  }

  &__type {
    font-size: $font-size-xs;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;
    background: rgba(255, 255, 255, 0.1);
  }

  &__details {
    display: flex;
    gap: $spacing-sm;
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__damage {
    color: $color-danger;
  }

  &__ac {
    color: $color-info;
  }

  // Type-based border colors
  @each $type, $color in (
    'normal': #a8a878,
    'fire': #f08030,
    'water': #6890f0,
    'electric': #f8d030,
    'grass': #78c850,
    'ice': #98d8d8,
    'fighting': #c03028,
    'poison': #a040a0,
    'ground': #e0c068,
    'flying': #a890f0,
    'psychic': #f85888,
    'bug': #a8b820,
    'rock': #b8a038,
    'ghost': #705898,
    'dragon': #7038f8,
    'dark': #705848,
    'steel': #b8b8d0,
    'fairy': #ee99ac
  ) {
    &--#{$type} {
      border-left: 3px solid $color;

      &:hover:not(:disabled) {
        border-color: $color;
        background: rgba($color, 0.1);
      }
    }
  }
}
</style>
