<template>
  <div class="fow-toolbar" data-testid="fow-toolbar">
    <div class="fow-toolbar__header">
      <button
        class="fow-toggle-btn"
        :class="{ 'fow-toggle-btn--active': enabled }"
        @click="$emit('toggle')"
        data-testid="toggle-fow-btn"
      >
        <img :src="enabled ? '/icons/phosphor/cloud.svg' : '/icons/phosphor/sun.svg'" alt="" class="toolbar-icon" />
        {{ enabled ? 'Fog On' : 'Fog Off' }}
      </button>

      <template v-if="enabled">
        <span class="separator">|</span>

        <div class="fow-toolbar__tools">
          <button
            class="fow-btn"
            :class="{ 'fow-btn--active': toolMode === 'reveal' }"
            @click="$emit('setTool', 'reveal')"
            title="Reveal (V)"
            data-testid="fow-reveal-btn"
          >
            <img src="/icons/phosphor/eye.svg" alt="" class="toolbar-icon" />
            Reveal
          </button>
          <button
            class="fow-btn"
            :class="{ 'fow-btn--active': toolMode === 'hide' }"
            @click="$emit('setTool', 'hide')"
            title="Hide (H)"
            data-testid="fow-hide-btn"
          >
            <img src="/icons/phosphor/eye-slash.svg" alt="" class="toolbar-icon" />
            Hide
          </button>
          <button
            class="fow-btn"
            :class="{ 'fow-btn--active': toolMode === 'explore' }"
            @click="$emit('setTool', 'explore')"
            title="Explore (E)"
            data-testid="fow-explore-btn"
          >
            <img src="/icons/phosphor/magnifying-glass.svg" alt="" class="toolbar-icon" />
            Explore
          </button>
        </div>

        <span class="separator">|</span>

        <div class="fow-toolbar__brush">
          <label>Brush:</label>
          <button
            class="size-btn"
            @click="$emit('decreaseBrush')"
            :disabled="brushSize <= 1"
          >-</button>
          <span class="size-display">{{ brushSize }}</span>
          <button
            class="size-btn"
            @click="$emit('increaseBrush')"
            :disabled="brushSize >= 10"
          >+</button>
        </div>

        <span class="separator">|</span>

        <div class="fow-toolbar__actions">
          <button
            class="fow-btn fow-btn--small"
            @click="$emit('revealAll')"
            title="Reveal All"
            data-testid="fow-reveal-all-btn"
          >
            Reveal All
          </button>
          <button
            class="fow-btn fow-btn--small fow-btn--danger"
            @click="$emit('hideAll')"
            title="Hide All"
            data-testid="fow-hide-all-btn"
          >
            Hide All
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FogOfWarState } from '~/stores/fogOfWar'

defineProps<{
  enabled: boolean
  toolMode: FogOfWarState['toolMode']
  brushSize: number
}>()

defineEmits<{
  toggle: []
  setTool: [tool: FogOfWarState['toolMode']]
  increaseBrush: []
  decreaseBrush: []
  revealAll: []
  hideAll: []
}>()
</script>

<style lang="scss" scoped>
.fow-toolbar {
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-sm;
  }

  &__tools {
    display: flex;
    gap: $spacing-xs;
  }

  &__brush {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    label {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
  }
}

.toolbar-icon {
  width: 14px;
  height: 14px;
  filter: brightness(0) invert(0.7);
  transition: filter 0.15s ease;
}

.fow-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: $color-bg-primary;
    border-color: $color-accent-teal;

    .toolbar-icon {
      filter: brightness(0) invert(1);
    }
  }

  &--active {
    background: rgba($color-accent-teal, 0.2);
    border-color: $color-accent-teal;
    color: $color-accent-teal;

    .toolbar-icon {
      filter: brightness(0) saturate(100%) invert(80%) sepia(30%) saturate(700%) hue-rotate(120deg);
    }
  }
}

.fow-btn {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: $color-bg-primary;
    border-color: $color-accent-teal;

    .toolbar-icon {
      filter: brightness(0) invert(1);
    }
  }

  &--active {
    background: rgba($color-accent-teal, 0.2);
    border-color: $color-accent-teal;
    color: $color-accent-teal;

    .toolbar-icon {
      filter: brightness(0) saturate(100%) invert(80%) sepia(30%) saturate(700%) hue-rotate(120deg);
    }
  }

  &--small {
    padding: $spacing-xs;
    font-size: $font-size-xs;
  }

  &--danger {
    border-color: rgba($color-danger, 0.5);

    &:hover {
      background: rgba($color-danger, 0.1);
      border-color: $color-danger;
      color: $color-danger;
    }
  }
}

.size-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: $color-bg-primary;
    border-color: $color-accent-teal;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.size-display {
  min-width: 20px;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text;
}

.separator {
  color: $border-color-default;
}
</style>
