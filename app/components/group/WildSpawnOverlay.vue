<template>
  <Transition name="wild-spawn-fade">
    <div v-if="wildSpawn" class="wild-spawn-overlay">
      <div class="wild-spawn-card">
        <div class="wild-spawn-card__header">
          <h1 class="wild-spawn-card__title">Wild Pokemon Appeared!</h1>
          <p class="wild-spawn-card__subtitle">{{ wildSpawn.tableName }}</p>
        </div>

        <div class="wild-spawn-card__grid">
          <div
            v-for="(pokemon, index) in wildSpawn.pokemon"
            :key="`${pokemon.speciesName}-${index}`"
            class="pokemon-slot"
          >
            <div class="pokemon-slot__sprite-container">
              <img
                :src="getSpriteUrl(pokemon.speciesName)"
                :alt="pokemon.speciesName"
                class="pokemon-slot__sprite"
                @error="handleSpriteError($event)"
              />
            </div>
            <div class="pokemon-slot__level">Lv. {{ pokemon.level }}</div>
            <div class="pokemon-slot__name">{{ pokemon.speciesName }}</div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { WildSpawnPreview } from '~/stores/groupView'

defineProps<{
  wildSpawn: WildSpawnPreview | null
}>()

const { getSpriteUrl } = usePokemonSprite()

const handleSpriteError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/images/pokemon-placeholder.svg'
}
</script>

<style lang="scss" scoped>
.wild-spawn-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
}

.wild-spawn-card {
  background: linear-gradient(
    135deg,
    rgba($color-bg-secondary, 0.95) 0%,
    rgba($color-bg-tertiary, 0.95) 100%
  );
  border: 2px solid transparent;
  background-clip: padding-box;
  border-radius: $border-radius-xl;
  padding: $spacing-xxl;
  max-width: 90vw;
  box-shadow:
    0 0 60px rgba($color-accent-scarlet, 0.3),
    0 0 120px rgba($color-accent-violet, 0.2),
    $shadow-lg;
  animation: card-entrance 0.5s ease-out;

  // Gradient border effect
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: calc($border-radius-xl + 2px);
    background: $gradient-sv-primary;
    z-index: -1;
  }

  position: relative;

  @media (min-width: 3000px) {
    padding: $spacing-xxl * 1.5;
    border-radius: $border-radius-xl * 1.5;
  }

  &__header {
    text-align: center;
    margin-bottom: $spacing-xl;

    @media (min-width: 3000px) {
      margin-bottom: $spacing-xxl;
    }
  }

  &__title {
    font-size: $font-size-xxxl;
    font-weight: 800;
    margin: 0 0 $spacing-sm 0;
    background: $gradient-sv-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    animation: title-glow 2s ease-in-out infinite alternate;

    @media (min-width: 3000px) {
      font-size: 5rem;
    }
  }

  &__subtitle {
    font-size: $font-size-xl;
    color: $color-text-muted;
    margin: 0;

    @media (min-width: 3000px) {
      font-size: $font-size-xxl;
    }
  }

  &__grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: $spacing-xl;

    @media (min-width: 3000px) {
      gap: $spacing-xxl;
    }
  }
}

.pokemon-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  animation: slot-pop 0.4s ease-out backwards;

  @for $i from 1 through 10 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
  }

  &__sprite-container {
    width: 128px;
    height: 128px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(
      circle,
      rgba($color-accent-teal, 0.15) 0%,
      transparent 70%
    );
    border-radius: 50%;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      box-shadow: inset 0 0 30px rgba($color-accent-teal, 0.2);
      pointer-events: none;
    }

    @media (min-width: 3000px) {
      width: 192px;
      height: 192px;
    }
  }

  &__sprite {
    width: 96px;
    height: 96px;
    object-fit: contain;
    image-rendering: pixelated;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));

    @media (min-width: 3000px) {
      width: 144px;
      height: 144px;
    }
  }

  &__level {
    font-size: $font-size-lg;
    font-weight: 700;
    padding: $spacing-xs $spacing-md;
    background: $gradient-scarlet;
    border-radius: $border-radius-md;
    color: #fff;
    box-shadow: 0 2px 8px rgba($color-accent-scarlet, 0.4);

    @media (min-width: 3000px) {
      font-size: $font-size-xl;
      padding: $spacing-sm $spacing-lg;
    }
  }

  &__name {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text;
    text-align: center;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (min-width: 3000px) {
      font-size: $font-size-xl;
      max-width: 200px;
    }
  }
}

// Animations
@keyframes card-entrance {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes slot-pop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes title-glow {
  0% {
    text-shadow: 0 0 10px rgba($color-accent-scarlet, 0.5);
  }
  100% {
    text-shadow: 0 0 20px rgba($color-accent-violet, 0.6);
  }
}

// Transition
.wild-spawn-fade-enter-active {
  transition: opacity 0.3s ease-out;
}

.wild-spawn-fade-leave-active {
  transition: opacity 0.5s ease-in;
}

.wild-spawn-fade-enter-from,
.wild-spawn-fade-leave-to {
  opacity: 0;
}
</style>
