<template>
  <NuxtLink :to="`/gm/characters/${human.id}`" class="human-card">
    <div class="human-card__avatar">
      <img v-if="human.avatarUrl" :src="human.avatarUrl" :alt="human.name" />
      <div v-else class="human-card__avatar-placeholder">
        {{ human.name.charAt(0).toUpperCase() }}
      </div>
    </div>

    <div class="human-card__info">
      <div class="human-card__header">
        <h3 class="human-card__name">{{ human.name }}</h3>
        <span class="human-card__type" :class="`human-card__type--${human.characterType}`">
          {{ human.characterType === 'player' ? 'Player' : 'NPC' }}
        </span>
      </div>

      <div class="human-card__level">Level {{ human.level }}</div>

      <div class="human-card__stats">
        <span>HP: {{ human.currentHp }}/{{ human.maxHp }}</span>
        <span>SPD: {{ human.stats?.speed || 0 }}</span>
      </div>
    </div>

  </NuxtLink>
</template>

<script setup lang="ts">
import type { HumanCharacter } from '~/types'

defineProps<{
  human: HumanCharacter
}>()
</script>

<style lang="scss" scoped>
.human-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  cursor: pointer;
  transition: all $transition-normal;
  text-decoration: none;
  color: inherit;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba($color-accent, 0.3);
    box-shadow: $shadow-lg, $shadow-glow-scarlet;
  }

  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: $border-radius-lg;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid $border-color-default;
    background: $color-bg-tertiary;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-size: $font-size-md;
    font-weight: 600;
    margin: 0;
    color: $color-text;
  }

  &__type {
    font-size: $font-size-xs;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.05em;

    &--player {
      background: $gradient-scarlet;
      box-shadow: 0 0 8px rgba($color-accent-scarlet, 0.3);
    }

    &--npc {
      background: $gradient-violet;
      box-shadow: 0 0 8px rgba($color-accent-violet, 0.3);
    }
  }

  &__level {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  &__stats {
    display: flex;
    gap: $spacing-md;
    font-size: $font-size-xs;
    color: $color-text-muted;
  }
}
</style>
