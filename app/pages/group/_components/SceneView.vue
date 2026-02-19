<template>
  <div class="scene-view" :class="weatherClass">
    <!-- Weather Overlay -->
    <div v-if="scene?.weather" class="weather-overlay" :class="`weather-overlay--${scene.weather}`">
      <div class="weather-particles"></div>
    </div>

    <!-- No Active Scene -->
    <div v-if="!scene" class="scene-view__waiting">
      <div class="waiting-card">
        <PhFilmSlate class="waiting-icon" :size="64" />
        <h2>No Active Scene</h2>
        <p>The GM will set up a scene for the narrative view.</p>
      </div>
    </div>

    <!-- Active Scene -->
    <div v-else class="scene-view__content">
      <!-- Background Image -->
      <div
        v-if="scene.locationImage"
        class="scene-background"
        :style="{ backgroundImage: `url(${scene.locationImage})` }"
      ></div>

      <!-- Location Header -->
      <header v-if="scene.locationName" class="scene-header">
        <h1 class="location-name">{{ scene.locationName }}</h1>
        <p v-if="scene.description" class="location-description">{{ scene.description }}</p>
      </header>

      <!-- Scene Canvas - Groups and Sprites -->
      <div class="scene-canvas">
        <!-- Groups -->
        <div
          v-for="group in scene.groups"
          :key="group.id"
          class="scene-group"
          :style="{
            left: `${group.position.x}%`,
            top: `${group.position.y}%`,
            width: `${group.width}px`,
            height: `${group.height}px`
          }"
        >
          <span class="group-label">{{ group.name }}</span>
          <span class="group-count">{{ getGroupMemberCount(group.id) }}</span>
        </div>

        <!-- Pokemon Sprites -->
        <div
          v-for="pokemon in scene.pokemon"
          :key="pokemon.id"
          class="scene-sprite scene-sprite--pokemon"
          :style="{
            left: `${pokemon.position.x}%`,
            top: `${pokemon.position.y}%`
          }"
        >
          <img
            :src="getSpriteUrl(pokemon.species)"
            :alt="pokemon.nickname || pokemon.species"
            class="sprite-image"
          />
          <span class="sprite-label">
            {{ pokemon.nickname || pokemon.species }}
            <small>Lv.{{ pokemon.level }}</small>
          </span>
        </div>

        <!-- Character Avatars -->
        <div
          v-for="character in scene.characters"
          :key="character.id"
          class="scene-sprite scene-sprite--character"
          :style="{
            left: `${character.position.x}%`,
            top: `${character.position.y}%`
          }"
        >
          <div class="avatar-circle">
            <img
              v-if="character.avatarUrl"
              :src="character.avatarUrl"
              :alt="character.name"
              class="avatar-image"
            />
            <PhUser v-else :size="32" />
          </div>
          <span class="sprite-label">{{ character.name }}</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { PhFilmSlate, PhUser } from '@phosphor-icons/vue'
import type { Scene } from '~/types/scene'

const groupViewTabsStore = useGroupViewTabsStore()

// Active scene from store (synced via WebSocket in group/index.vue)
const scene = computed(() => groupViewTabsStore.activeScene)

// Weather class for background effects
const weatherClass = computed(() => {
  if (!scene.value?.weather) return ''
  return `scene-view--${scene.value.weather}`
})

const { getSpriteUrl } = usePokemonSprite()

// Helper functions
function getGroupMemberCount(groupId: string): number {
  if (!scene.value) return 0
  const pokemonCount = scene.value.pokemon.filter(p => p.groupId === groupId).length
  const characterCount = scene.value.characters.filter(c => c.groupId === groupId).length
  return pokemonCount + characterCount
}
</script>

<style lang="scss" scoped>
.scene-view {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: $gradient-bg-radial;

  &__waiting {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  &__content {
    min-height: 100vh;
    position: relative;
  }

  // Weather variations
  &--sunny {
    background: linear-gradient(135deg, #fff8e1 0%, #ffe082 100%);
  }

  &--rain {
    background: linear-gradient(135deg, #455a64 0%, #263238 100%);
  }

  &--sandstorm {
    background: linear-gradient(135deg, #d7ccc8 0%, #a1887f 100%);
  }

  &--hail, &--snow {
    background: linear-gradient(135deg, #e3f2fd 0%, #90caf9 100%);
  }

  &--fog {
    background: linear-gradient(135deg, #cfd8dc 0%, #90a4ae 100%);
  }

  &--harsh_sunlight {
    background: linear-gradient(135deg, #ff8f00 0%, #ff6f00 50%, #e65100 100%);
  }

  &--heavy_rain {
    background: linear-gradient(135deg, #1a237e 0%, #0d1b2a 100%);
  }

  &--strong_winds {
    background: linear-gradient(135deg, #78909c 0%, #546e7a 50%, #37474f 100%);
  }
}

.waiting-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-xxl;
  background: rgba($color-bg-secondary, 0.8);
  border-radius: $border-radius-lg;
  text-align: center;

  h2 {
    margin: 0;
    color: $color-text;
  }

  p {
    margin: 0;
    color: $color-text-muted;
  }
}

.waiting-icon {
  color: $color-primary;
  opacity: 0.7;
}

.scene-background {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.8;
  z-index: 0;
}

.weather-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;

  &--sunny {
    background: radial-gradient(ellipse at 20% 0%, rgba(255, 235, 59, 0.3) 0%, transparent 60%);

    .weather-particles {
      background: radial-gradient(ellipse at 20% 0%, rgba(255, 235, 59, 0.15) 0%, transparent 50%);
      animation: sun-pulse 4s ease-in-out infinite;
    }
  }

  &--rain {
    background: linear-gradient(transparent 0%, rgba(0, 0, 0, 0.3) 100%);

    .weather-particles {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 100'%3E%3Cline x1='10' y1='0' x2='10' y2='30' stroke='%2390caf9' stroke-width='2'/%3E%3C/svg%3E");
      animation: rain 0.3s linear infinite;
    }
  }

  &--snow {
    box-shadow: inset 0 0 100px rgba(255, 255, 255, 0.2);

    .weather-particles {
      background-image: radial-gradient(circle, white 2px, transparent 2px);
      background-size: 20px 20px;
      animation: snow 3s linear infinite;
    }
  }

  &--hail {
    .weather-particles {
      background-image: radial-gradient(circle, rgba(200, 230, 255, 0.9) 3px, transparent 3px);
      background-size: 30px 30px;
      animation: hail 0.8s linear infinite;
    }
  }

  &--sandstorm {
    background: rgba(161, 136, 127, 0.3);

    .weather-particles {
      animation: sandstorm 0.5s linear infinite;
    }
  }

  &--fog {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(4px);
  }

  &--harsh_sunlight {
    background: rgba(255, 111, 0, 0.2);

    .weather-particles {
      background: radial-gradient(ellipse at 20% 0%, rgba(255, 200, 0, 0.3) 0%, transparent 50%);
      animation: sun-pulse 2s ease-in-out infinite;
    }
  }

  &--heavy_rain {
    background: linear-gradient(transparent 0%, rgba(0, 0, 0, 0.5) 100%);

    .weather-particles {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 15 80'%3E%3Cline x1='7' y1='0' x2='7' y2='40' stroke='%2364b5f6' stroke-width='3'/%3E%3C/svg%3E");
      animation: rain 0.2s linear infinite;
    }
  }

  &--strong_winds {
    .weather-particles {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 20'%3E%3Cline x1='0' y1='10' x2='80' y2='10' stroke='rgba(255,255,255,0.3)' stroke-width='2'/%3E%3C/svg%3E");
      background-size: 200px 20px;
      animation: wind 0.8s linear infinite;
    }
  }
}

.weather-particles {
  position: absolute;
  inset: 0;
}

@keyframes rain {
  from { background-position: 0 0; }
  to { background-position: 0 100px; }
}

@keyframes snow {
  from { background-position: 0 0; }
  to { background-position: 20px 100vh; }
}

@keyframes hail {
  from { background-position: 0 0; }
  to { background-position: 15px 100vh; }
}

@keyframes sun-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes wind {
  from { background-position: 0 0; }
  to { background-position: 200px 0; }
}

@keyframes sandstorm {
  0% { opacity: 0.5; transform: translateX(0); }
  50% { opacity: 0.3; transform: translateX(10px); }
  100% { opacity: 0.5; transform: translateX(0); }
}

.scene-header {
  position: relative;
  z-index: 2;
  padding: $spacing-xl;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent);
  color: white;

  .location-name {
    margin: 0;
    font-size: $font-size-xxxl;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }

  .location-description {
    margin: $spacing-sm 0 0;
    font-size: $font-size-lg;
    opacity: 0.9;
  }
}

.scene-canvas {
  position: relative;
  z-index: 2;
  min-height: 60vh;
  margin: $spacing-xl;
}

.scene-group {
  position: absolute;
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: $border-radius-lg;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  transform: translate(-50%, -50%);

  .group-label {
    position: absolute;
    top: -$spacing-lg;
    left: $spacing-sm;
    padding: $spacing-xs $spacing-sm;
    background: rgba(0, 0, 0, 0.7);
    border-radius: $border-radius-sm;
    font-size: $font-size-sm;
    color: white;
  }

  .group-count {
    position: absolute;
    top: -$spacing-lg;
    right: $spacing-sm;
    padding: $spacing-xs $spacing-sm;
    background: $color-primary;
    border-radius: $border-radius-full;
    font-size: $font-size-xs;
    color: white;
    font-weight: 700;
  }
}

.scene-sprite {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  transition: transform 0.3s ease;

  &:hover {
    transform: translate(-50%, -50%) scale(1.1);
    z-index: 10;
  }

  &--pokemon {
    .sprite-image {
      width: 80px;
      height: 80px;
      object-fit: contain;
      filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
    }
  }

  &--character {
    .avatar-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: $color-bg-secondary;
      border: 3px solid $color-primary;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: $shadow-lg;
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .sprite-label {
    padding: $spacing-xs $spacing-sm;
    background: rgba(0, 0, 0, 0.8);
    border-radius: $border-radius-sm;
    font-size: $font-size-sm;
    color: white;
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    align-items: center;

    small {
      font-size: $font-size-xs;
      opacity: 0.8;
    }
  }
}

</style>
