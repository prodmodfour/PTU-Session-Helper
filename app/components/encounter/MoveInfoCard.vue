<template>
  <div class="move-info">
    <div class="move-info__header">
      <h3 class="move-info__name">{{ move.name }}</h3>
      <span class="type-badge" :class="`type-badge--${move.type?.toLowerCase() || 'normal'}`">
        {{ move.type }}
      </span>
      <span v-if="hasSTAB" class="stab-badge">STAB</span>
    </div>

    <div class="move-info__stats">
      <div class="move-info__stat">
        <span class="label">Class:</span>
        <span>{{ move.damageClass }}</span>
      </div>
      <div v-if="move.damageBase" class="move-info__stat">
        <span class="label">DB:</span>
        <span>{{ move.damageBase }}{{ hasSTAB ? ' → ' + effectiveDB : '' }}</span>
      </div>
      <div v-if="move.ac !== null && move.ac !== undefined" class="move-info__stat">
        <span class="label">AC:</span>
        <span>{{ move.ac }}</span>
      </div>
      <div class="move-info__stat">
        <span class="label">Range:</span>
        <span>{{ move.range }}</span>
      </div>
      <div class="move-info__stat">
        <span class="label">Frequency:</span>
        <span>{{ move.frequency }}</span>
      </div>
      <div v-if="attackStat" class="move-info__stat">
        <span class="label">{{ attackStatLabel }}:</span>
        <span>{{ attackStat }}</span>
      </div>
    </div>

    <div v-if="move.effect" class="move-info__effect">
      {{ move.effect }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Move } from '~/types'

const props = withDefaults(defineProps<{
  move: Move
  hasSTAB?: boolean
  attackStat?: number
}>(), {
  hasSTAB: false,
  attackStat: 0
})

const effectiveDB = computed(() => {
  if (!props.move.damageBase) return 0
  return props.hasSTAB ? props.move.damageBase + 2 : props.move.damageBase
})

const attackStatLabel = computed(() => {
  return props.move.damageClass === 'Physical' ? 'ATK' : 'SP.ATK'
})
</script>

<style lang="scss" scoped>
.move-info {
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;
  }

  &__name {
    margin: 0;
    font-size: $font-size-lg;
    color: $color-text;
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm $spacing-lg;
    margin-bottom: $spacing-sm;
  }

  &__stat {
    display: flex;
    gap: $spacing-xs;
    font-size: $font-size-sm;

    .label {
      color: $color-text-muted;
    }
  }

  &__effect {
    font-size: $font-size-sm;
    color: $color-text-muted;
    line-height: 1.5;
    padding-top: $spacing-sm;
    border-top: 1px solid $border-color-default;
  }
}

.stab-badge {
  display: inline-block;
  padding: 2px $spacing-xs;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-warning;
  background: rgba($color-warning, 0.2);
  border-radius: $border-radius-sm;
}
</style>
