<template>
  <div class="tab-content">
    <div class="abilities-list">
      <div v-for="(ability, idx) in abilities" :key="idx" class="ability-card">
        <div class="ability-card__header">
          <span class="ability-name">{{ ability.name }}</span>
          <span v-if="ability.trigger" class="ability-trigger">{{ ability.trigger }}</span>
        </div>
        <p class="ability-effect">{{ ability.effect }}</p>
      </div>
      <p v-if="!abilities?.length" class="empty-state">No abilities recorded</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ability } from '~/types'

defineProps<{
  abilities: Ability[]
}>()
</script>

<style lang="scss" scoped>
.abilities-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.ability-card {
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
}

.ability-name {
  font-weight: 600;
  font-size: $font-size-md;
}

.ability-trigger {
  font-size: $font-size-xs;
  padding: $spacing-xs $spacing-sm;
  background: rgba($color-accent-violet, 0.2);
  color: $color-accent-violet;
  border-radius: $border-radius-sm;
}

.ability-effect {
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: 1.5;
  margin: 0;
}

.empty-state {
  color: $color-text-muted;
  font-style: italic;
  text-align: center;
  padding: $spacing-xl;
}
</style>
