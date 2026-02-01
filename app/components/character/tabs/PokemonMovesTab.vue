<template>
  <div class="tab-content">
    <div class="moves-list">
      <div v-for="(move, idx) in moves" :key="idx" class="move-card">
        <div class="move-card__header">
          <span class="move-name">{{ move.name }}</span>
          <span class="move-type type-badge" :class="`type-badge--${(move.type || 'normal').toLowerCase()}`">
            {{ move.type }}
          </span>
        </div>
        <div class="move-card__details">
          <span><strong>Class:</strong> {{ move.damageClass }}</span>
          <span><strong>Freq:</strong> {{ move.frequency }}</span>
          <span v-if="move.ac"><strong>AC:</strong> {{ move.ac }}</span>
          <span v-if="move.damageBase"><strong>DB:</strong> {{ move.damageBase }}</span>
        </div>
        <div class="move-card__range">
          <strong>Range:</strong> {{ move.range }}
        </div>
        <div v-if="move.effect" class="move-card__effect">
          {{ move.effect }}
        </div>
      </div>
      <p v-if="!moves?.length" class="empty-state">No moves recorded</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Move } from '~/types'

defineProps<{
  moves: Move[]
}>()
</script>

<style lang="scss" scoped>
.moves-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.move-card {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__details {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm $spacing-lg;
    font-size: $font-size-sm;
    margin-bottom: $spacing-xs;
  }

  &__range {
    font-size: $font-size-sm;
    margin-bottom: $spacing-sm;
  }

  &__effect {
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.5;
    padding-top: $spacing-sm;
    border-top: 1px solid $border-color-default;
  }
}

.move-name {
  font-weight: 600;
  font-size: $font-size-md;
}

.empty-state {
  color: $color-text-muted;
  font-style: italic;
  text-align: center;
  padding: $spacing-xl;
}
</style>
