<template>
  <div class="action-panel">
    <!-- Actions Remaining -->
    <div class="action-panel__status">
      <span>Actions: {{ combatant.actionsRemaining }}/2</span>
      <span>Shift: {{ combatant.shiftActionsRemaining }}/1</span>
    </div>

    <!-- Moves (Pokemon) -->
    <div v-if="isPokemon && moves.length > 0" class="action-panel__section">
      <h4>Moves</h4>
      <div class="move-list">
        <button
          v-for="move in moves"
          :key="move.id || move.name"
          class="move-btn"
          :class="`move-btn--${move.type?.toLowerCase() || 'normal'}`"
          :disabled="combatant.actionsRemaining === 0"
          @click="$emit('useMove', move)"
        >
          <span class="move-btn__name">{{ move.name }}</span>
          <span class="move-btn__type">{{ move.type }}</span>
          <span v-if="move.damageBase" class="move-btn__damage">
            DB {{ move.damageBase }}
          </span>
        </button>
      </div>
    </div>

    <!-- Standard Actions -->
    <div class="action-panel__section">
      <h4>Actions</h4>
      <div class="action-list">
        <button
          class="action-btn"
          :disabled="combatant.shiftActionsRemaining === 0"
        >
          Shift
        </button>
        <button
          class="action-btn"
          :disabled="combatant.actionsRemaining === 0"
        >
          Struggle
        </button>
        <button
          class="action-btn"
          @click="$emit('passTurn')"
        >
          Pass Turn
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Move, Pokemon } from '~/types'

const props = defineProps<{
  combatant: Combatant
  availableTargets: Combatant[]
}>()

defineEmits<{
  useMove: [move: Move]
  passTurn: []
}>()

const isPokemon = computed(() => props.combatant.type === 'pokemon')

const moves = computed(() => {
  if (isPokemon.value) {
    return (props.combatant.entity as Pokemon).moves || []
  }
  return []
})
</script>

<style lang="scss" scoped>
.action-panel {
  &__status {
    display: flex;
    justify-content: space-between;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: $glass-bg;
    backdrop-filter: $glass-blur;
    border: 1px solid $glass-border;
    border-radius: $border-radius-md;
    font-size: $font-size-sm;
    color: $color-text-muted;

    span {
      font-weight: 500;
    }
  }

  &__section {
    margin-bottom: $spacing-lg;

    h4 {
      margin-bottom: $spacing-sm;
      font-size: $font-size-sm;
      color: $color-text-muted;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}

.move-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.move-btn {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  border: none;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;
  color: $color-text;
  box-shadow: $shadow-sm;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    transform: translateX(4px);
    box-shadow: $shadow-md;
  }

  &__name {
    flex: 1;
    font-weight: 600;
  }

  &__type {
    font-size: $font-size-xs;
    opacity: 0.8;
    text-transform: uppercase;
  }

  &__damage {
    font-size: $font-size-xs;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    font-weight: 600;
  }

  // Type colors
  &--normal { background-color: $type-normal; }
  &--fire { background-color: $type-fire; }
  &--water { background-color: $type-water; }
  &--electric { background-color: $type-electric; color: $color-text-dark; }
  &--grass { background-color: $type-grass; }
  &--ice { background-color: $type-ice; color: $color-text-dark; }
  &--fighting { background-color: $type-fighting; }
  &--poison { background-color: $type-poison; }
  &--ground { background-color: $type-ground; color: $color-text-dark; }
  &--flying { background-color: $type-flying; }
  &--psychic { background-color: $type-psychic; }
  &--bug { background-color: $type-bug; }
  &--rock { background-color: $type-rock; }
  &--ghost { background-color: $type-ghost; }
  &--dragon { background-color: $type-dragon; }
  &--dark { background-color: $type-dark; }
  &--steel { background-color: $type-steel; color: $color-text-dark; }
  &--fairy { background-color: $type-fairy; }
}

.action-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.action-btn {
  padding: $spacing-sm $spacing-lg;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;
  font-weight: 500;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: $gradient-sv-cool;
    border-color: $color-accent-scarlet;
    box-shadow: $shadow-glow-scarlet;
  }
}
</style>
