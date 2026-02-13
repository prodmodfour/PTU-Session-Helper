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
        <span
          v-if="originLabel"
          class="pokemon-card__origin"
          :class="`pokemon-card__origin--${pokemon.origin}`"
        >
          {{ originLabel }}
        </span>
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
      <div v-if="pokemon.location" class="pokemon-card__location">
        <PhMapPin :size="12" />
        {{ pokemon.location }}
      </div>

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

      <!-- Status Conditions -->
      <div v-if="statusConditions.length > 0" class="pokemon-card__status">
        <span
          v-for="status in statusConditions"
          :key="status"
          class="status-badge"
          :class="`status-badge--${status.toLowerCase().replace(' ', '-')}`"
        >
          {{ status }}
        </span>
      </div>

      <!-- Injuries -->
      <div v-if="pokemon.injuries > 0" class="pokemon-card__injuries">
        <span class="injury-badge">{{ pokemon.injuries }} Injur{{ pokemon.injuries === 1 ? 'y' : 'ies' }}</span>
      </div>
    </div>

  </NuxtLink>
</template>

<script setup lang="ts">
import { PhMapPin } from '@phosphor-icons/vue'
import type { Pokemon } from '~/types'

const props = defineProps<{
  pokemon: Pokemon
}>()


const { getSpriteUrl, getSpriteByDexNumber } = usePokemonSprite()
const { getHealthPercentage, getHealthStatus } = useCombat()

const displayName = computed(() => props.pokemon.nickname || props.pokemon.species)

const originLabels: Record<string, string> = {
  wild: 'Wild',
  captured: 'Captured',
  template: 'Template',
  import: 'Imported'
}
const originLabel = computed(() => originLabels[props.pokemon.origin] ?? '')

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

const statusConditions = computed(() => {
  if (!props.pokemon.statusConditions) return []
  return Array.isArray(props.pokemon.statusConditions)
    ? props.pokemon.statusConditions
    : []
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

  &__origin {
    padding: 1px 6px;
    border-radius: $border-radius-sm;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;

    &--wild { background: #166534; color: #bbf7d0; }
    &--captured { background: #1e40af; color: #bfdbfe; }
    &--template { background: #6b21a8; color: #e9d5ff; }
    &--import { background: #92400e; color: #fde68a; }
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
    margin-bottom: $spacing-xs;
  }

  &__location {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    color: $color-accent-violet;
    margin-bottom: $spacing-sm;
  }

  &__hp {
    width: 100%;
  }

  &__status {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: $spacing-xs;
  }

  &__injuries {
    margin-top: $spacing-xs;
  }
}

.status-badge {
  padding: 2px 6px;
  border-radius: $border-radius-sm;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  // Persistent conditions (more severe)
  &--burned { background: #ff6b35; color: #fff; }
  &--frozen { background: #7dd3fc; color: #000; }
  &--paralyzed { background: #facc15; color: #000; }
  &--poisoned { background: #a855f7; color: #fff; }
  &--badly-poisoned { background: #7c3aed; color: #fff; }
  &--asleep { background: #6b7280; color: #fff; }
  &--fainted { background: #1f2937; color: #9ca3af; }

  // Volatile conditions
  &--confused { background: #f472b6; color: #000; }
  &--flinched { background: #fbbf24; color: #000; }
  &--infatuated { background: #ec4899; color: #fff; }
  &--cursed { background: #581c87; color: #fff; }
  &--disabled { background: #64748b; color: #fff; }
  &--encored { background: #22d3ee; color: #000; }
  &--taunted { background: #ef4444; color: #fff; }
  &--tormented { background: #991b1b; color: #fff; }

  // Movement conditions
  &--stuck { background: #92400e; color: #fff; }
  &--trapped { background: #78350f; color: #fff; }
  &--slowed { background: #0369a1; color: #fff; }

  // Default
  background: $color-bg-tertiary;
  color: $color-text;
}

.injury-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: $border-radius-sm;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: $color-danger;
  color: #fff;
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
