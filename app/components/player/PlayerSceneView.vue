<template>
  <div class="player-scene">
    <!-- No active scene placeholder -->
    <div v-if="!scene" class="player-scene__empty">
      <PhMapPinLine :size="48" />
      <p class="player-scene__empty-text">No active scene</p>
      <p class="player-scene__empty-hint">The GM has not started a scene yet.</p>
    </div>

    <!-- Active scene content -->
    <div v-else class="player-scene__content">
      <!-- Scene header -->
      <header class="player-scene__header">
        <h2 class="player-scene__title">{{ scene.name }}</h2>
        <span v-if="scene.weather" class="player-scene__weather-badge">
          <PhCloudSun :size="16" />
          {{ scene.weather }}
        </span>
      </header>

      <!-- Location image -->
      <div v-if="scene.locationImage" class="player-scene__image-container">
        <img
          :src="scene.locationImage"
          :alt="scene.locationName ?? scene.name"
          class="player-scene__image"
        />
      </div>

      <!-- Location name (when no image) -->
      <div v-else-if="scene.locationName" class="player-scene__location">
        <PhMapPin :size="18" />
        <span>{{ scene.locationName }}</span>
      </div>

      <!-- Description -->
      <p v-if="scene.description" class="player-scene__description">
        {{ scene.description }}
      </p>

      <!-- Characters present -->
      <section v-if="scene.characters.length > 0" class="player-scene__section">
        <h3 class="player-scene__section-title">
          <PhUsers :size="18" />
          Characters
        </h3>
        <ul class="player-scene__list">
          <li
            v-for="character in scene.characters"
            :key="character.id"
            class="player-scene__list-item"
          >
            <PhUser :size="16" />
            <span>{{ character.name }}</span>
            <span v-if="character.isPlayerCharacter" class="player-scene__tag player-scene__tag--pc">PC</span>
            <span v-else class="player-scene__tag player-scene__tag--npc">NPC</span>
          </li>
        </ul>
      </section>

      <!-- Pokemon present -->
      <section v-if="scene.pokemon.length > 0" class="player-scene__section">
        <h3 class="player-scene__section-title">
          <PhPawPrint :size="18" />
          Pokemon
        </h3>
        <ul class="player-scene__list">
          <li
            v-for="pkmn in scene.pokemon"
            :key="pkmn.id"
            class="player-scene__list-item"
          >
            <PhPawPrint :size="16" />
            <span>{{ pkmn.nickname ?? pkmn.species }}</span>
            <span v-if="pkmn.nickname" class="player-scene__species">({{ pkmn.species }})</span>
          </li>
        </ul>
      </section>

      <!-- Groups present -->
      <section v-if="scene.groups.length > 0" class="player-scene__section">
        <h3 class="player-scene__section-title">
          <PhUsersThree :size="18" />
          Groups
        </h3>
        <ul class="player-scene__list">
          <li
            v-for="group in scene.groups"
            :key="group.id"
            class="player-scene__list-item"
          >
            <PhUsersThree :size="16" />
            <span>{{ group.name }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhMapPinLine,
  PhMapPin,
  PhCloudSun,
  PhUser,
  PhUsers,
  PhUsersThree,
  PhPawPrint
} from '@phosphor-icons/vue'
import type { PlayerSceneData } from '~/composables/usePlayerScene'

defineProps<{
  scene: PlayerSceneData | null
}>()
</script>

<style lang="scss" scoped>
.player-scene {
  padding: $spacing-md;
  padding-bottom: $player-nav-clearance;

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    padding: $spacing-xxl $spacing-md;
    color: $color-text-muted;
    text-align: center;
  }

  &__empty-text {
    font-size: $font-size-lg;
    font-weight: 600;
  }

  &__empty-hint {
    font-size: $font-size-sm;
    opacity: 0.7;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-sm;
    flex-wrap: wrap;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: 700;
    margin: 0;
    color: $color-text;
  }

  &__weather-badge {
    display: inline-flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-full;
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-text-secondary;
    white-space: nowrap;
  }

  &__image-container {
    border-radius: $border-radius-md;
    overflow: hidden;
    border: 1px solid $border-color-default;
  }

  &__image {
    width: 100%;
    height: auto;
    max-height: 240px;
    object-fit: cover;
    display: block;
  }

  &__location {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-md;
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__description {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    line-height: 1.6;
    margin: 0;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text;
    margin: 0;
    padding-bottom: $spacing-xs;
    border-bottom: 1px solid $border-color-subtle;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__list-item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xs $spacing-sm;
    background: $color-bg-secondary;
    border-radius: $border-radius-sm;
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__species {
    color: $color-text-muted;
    font-size: $font-size-xs;
  }

  &__tag {
    margin-left: auto;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    &--pc {
      background: rgba($color-success, 0.15);
      color: $color-success;
    }

    &--npc {
      background: rgba($color-text-muted, 0.15);
      color: $color-text-muted;
    }
  }
}
</style>
