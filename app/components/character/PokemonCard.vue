<template>
  <NuxtLink :to="`/gm/pokemon/${pokemon.id}`" class="pokemon-card">
    <div class="pokemon-card__sprite">
      <img :src="spriteUrl" :alt="displayName" @error="handleSpriteError" />
      <div v-if="pokemon.shiny" class="pokemon-card__shiny-indicator">
        <img src="/icons/ui/shiny.svg" alt="Shiny" />
      </div>
    </div>

    <div class="pokemon-card__info">
      <div class="pokemon-card__header">
        <h3 class="pokemon-card__name">{{ displayName }}</h3>
      </div>

      <div class="pokemon-card__species" v-if="pokemon.nickname">
        {{ pokemon.species }}
      </div>

      <div class="pokemon-card__types">
        <span
          v-for="type in pokemon.types"
          :key="type"
          class="type-badge"
          :class="`type-badge--${type.toLowerCase()}`"
        >
          {{ type }}
        </span>
      </div>

      <div class="pokemon-card__level">Level {{ pokemon.level }}</div>

      <div class="pokemon-card__hp">
        <div class="health-bar health-bar--compact" :class="healthBarClass">
          <div class="health-bar__label">HP</div>
          <div class="health-bar__container">
            <div class="health-bar__track">
              <div class="health-bar__fill" :style="{ width: healthPercentage + '%' }"></div>
            </div>
            <span class="health-bar__text">{{ pokemon.currentHp }}/{{ pokemon.maxHp }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pokemon-card__actions" @click.stop.prevent>
      <NuxtLink :to="`/gm/pokemon/${pokemon.id}?edit=true`" class="btn btn--sm btn--secondary">
        Edit
      </NuxtLink>
      <button class="btn btn--sm btn--danger" @click="$emit('delete', pokemon)">
        Delete
      </button>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Pokemon } from '~/types'

const props = defineProps<{
  pokemon: Pokemon
}>()

defineEmits<{
  delete: [pokemon: Pokemon]
}>()

const { getSpriteUrl, getSpriteByDexNumber } = usePokemonSprite()
const { getHealthPercentage, getHealthStatus } = useCombat()

const displayName = computed(() => props.pokemon.nickname || props.pokemon.species)

const spriteUrl = ref(getSpriteUrl(props.pokemon.species, props.pokemon.shiny))

const handleSpriteError = () => {
  // Fallback to placeholder
  spriteUrl.value = '/images/pokemon-placeholder.svg'
}

const healthPercentage = computed(() =>
  getHealthPercentage(props.pokemon.currentHp, props.pokemon.maxHp)
)

const healthBarClass = computed(() => {
  const status = getHealthStatus(healthPercentage.value)
  return `health-bar--${status}`
})
</script>

<style lang="scss" scoped>
.pokemon-card {
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

  &__sprite {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
    border: 2px solid $border-color-default;
    border-radius: $border-radius-lg;
    position: relative;

    img {
      max-width: 100%;
      max-height: 100%;
      image-rendering: pixelated;
    }
  }

  &__shiny-indicator {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #ffd700 0%, #ffec8b 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
    animation: sparkle 1.5s ease-in-out infinite;

    img {
      width: 12px;
      height: 12px;
      filter: brightness(0);
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-size: $font-size-md;
    font-weight: 600;
    margin: 0;
    color: $color-text;
  }

  &__species {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  &__types {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  &__level {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
  }

  &__hp {
    width: 100%;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    opacity: 0;
    transform: translateX(8px);
    transition: all $transition-fast;
  }

  &:hover &__actions {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes sparkle {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
  }
}
</style>
