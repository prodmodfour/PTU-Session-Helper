<template>
  <div class="player-move-list">
    <div
      v-for="move in moves"
      :key="move.id"
      class="move-row"
      :class="{ 'move-row--expanded': expandedMoveId === move.id }"
      @click="toggleMove(move.id)"
    >
      <div class="move-row__header">
        <span class="move-row__type-badge" :class="`type--${move.type.toLowerCase()}`">
          {{ move.type }}
        </span>
        <span class="move-row__name">{{ move.name }}</span>
        <span class="move-row__class">{{ move.damageClass }}</span>
      </div>
      <div class="move-row__stats">
        <span v-if="move.damageBase" class="move-row__stat">
          DB {{ move.damageBase }}
        </span>
        <span v-if="move.ac !== null" class="move-row__stat">
          AC {{ move.ac }}
        </span>
        <span class="move-row__stat move-row__stat--freq">
          {{ move.frequency }}
        </span>
      </div>
      <div v-if="expandedMoveId === move.id" class="move-row__details">
        <div class="move-detail">
          <span class="move-detail__label">Range</span>
          <span class="move-detail__value">{{ move.range }}</span>
        </div>
        <p class="move-row__effect">{{ move.effect }}</p>
      </div>
    </div>
    <p v-if="moves.length === 0" class="empty-text">No moves.</p>
  </div>
</template>

<script setup lang="ts">
import type { Move } from '~/types'

defineProps<{
  moves: Move[]
}>()

const expandedMoveId = ref<string | null>(null)

const toggleMove = (moveId: string) => {
  expandedMoveId.value = expandedMoveId.value === moveId ? null : moveId
}
</script>

<style lang="scss" scoped>
.player-move-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.move-row {
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  padding: $spacing-xs $spacing-sm;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover {
    background: $color-bg-hover;
  }

  &--expanded {
    background: $color-bg-hover;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__type-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 4px;
    border-radius: 3px;
    color: white;
    min-width: 40px;
    text-align: center;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: 600;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__class {
    font-size: 10px;
    color: $color-text-muted;
  }

  &__stats {
    display: flex;
    gap: $spacing-sm;
    margin-top: 2px;
  }

  &__stat {
    font-size: 10px;
    color: $color-text-muted;

    &--freq {
      margin-left: auto;
      color: $color-accent-teal;
    }
  }

  &__details {
    margin-top: $spacing-xs;
    padding-top: $spacing-xs;
    border-top: 1px solid $border-color-subtle;
  }

  &__effect {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    margin: $spacing-xs 0 0;
    line-height: 1.4;
  }
}

.move-detail {
  display: flex;
  gap: $spacing-xs;
  font-size: $font-size-xs;

  &__label {
    color: $color-text-muted;
    font-weight: 600;
  }

  &__value {
    color: $color-text;
  }
}

.empty-text {
  font-size: $font-size-sm;
  color: $color-text-muted;
  text-align: center;
  padding: $spacing-sm;
}

</style>
