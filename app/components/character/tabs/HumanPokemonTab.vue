<template>
  <div class="tab-content">
    <div v-if="pokemon?.length" class="pokemon-team">
      <div v-for="poke in pokemon" :key="poke.id" class="team-pokemon">
        <img :src="getSpriteUrl(poke.species, poke.shiny)" :alt="poke.species" />
        <div class="team-pokemon__info">
          <span class="team-pokemon__name">{{ poke.nickname || poke.species }}</span>
          <span class="team-pokemon__level">Lv. {{ poke.level }}</span>
        </div>
        <div class="team-pokemon__hp">
          {{ poke.currentHp }}/{{ poke.maxHp }}
        </div>
      </div>
    </div>
    <p v-else class="empty-state">No Pokemon linked to this trainer</p>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon } from '~/types'

defineProps<{
  pokemon?: Pokemon[]
}>()

const { getSpriteUrl } = usePokemonSprite()
</script>

<style lang="scss" scoped>
.pokemon-team {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.team-pokemon {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  transition: all $transition-fast;

  &:hover {
    background: $color-bg-hover;
    border-color: $border-color-emphasis;
  }

  img {
    width: 48px;
    height: 48px;
    image-rendering: pixelated;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__name {
    font-weight: 600;
    color: $color-text;
  }

  &__level {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &__hp {
    font-size: $font-size-sm;
    color: $color-text-muted;
    padding: $spacing-xs $spacing-sm;
    background: $color-bg-secondary;
    border-radius: $border-radius-sm;
  }
}

.empty-state {
  color: $color-text-muted;
  font-style: italic;
  text-align: center;
  padding: $spacing-xl;
}
</style>
