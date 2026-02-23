<template>
  <div class="elevation-toolbar" data-testid="elevation-toolbar">
    <div class="elevation-toolbar__header">
      <button
        class="elevation-toggle-btn"
        :class="{ 'elevation-toggle-btn--active': enabled }"
        @click="$emit('toggle')"
        data-testid="toggle-elevation-btn"
      >
        <img src="/icons/phosphor/triangle.svg" alt="" class="toolbar-icon" />
        {{ enabled ? 'Elevation On' : 'Elevation Off' }}
      </button>

      <template v-if="enabled">
        <span class="separator">|</span>

        <!-- Mode switcher: Token vs Terrain -->
        <div class="elevation-toolbar__modes">
          <button
            class="elevation-btn"
            :class="{ 'elevation-btn--active': mode === 'token' }"
            @click="$emit('setMode', 'token')"
            title="Set token elevation"
            data-testid="elevation-token-mode-btn"
          >
            Token
          </button>
          <button
            class="elevation-btn"
            :class="{ 'elevation-btn--active': mode === 'terrain' }"
            @click="$emit('setMode', 'terrain')"
            title="Set terrain elevation"
            data-testid="elevation-terrain-mode-btn"
          >
            Terrain
          </button>
        </div>

        <span class="separator">|</span>

        <!-- Elevation level control -->
        <div class="elevation-toolbar__level">
          <label>Level:</label>
          <button
            class="size-btn"
            @click="$emit('decrease')"
            :disabled="currentLevel <= 0"
            data-testid="elevation-decrease-btn"
          >-</button>
          <span class="size-display">{{ currentLevel }}</span>
          <button
            class="size-btn"
            @click="$emit('increase')"
            :disabled="currentLevel >= maxElevation"
            data-testid="elevation-increase-btn"
          >+</button>
        </div>

        <span class="separator">|</span>

        <!-- Selected token info -->
        <div v-if="selectedTokenName" class="elevation-toolbar__selected">
          <span class="elevation-toolbar__token-name">{{ selectedTokenName }}</span>
          <span class="elevation-toolbar__token-elev">Z: {{ selectedTokenElevation }}</span>
        </div>
        <div v-else class="elevation-toolbar__hint">
          <span>{{ mode === 'token' ? 'Select a token' : 'Click cells to paint' }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
export type ElevationMode = 'token' | 'terrain'

defineProps<{
  enabled: boolean
  mode: ElevationMode
  currentLevel: number
  maxElevation: number
  selectedTokenName?: string
  selectedTokenElevation?: number
}>()

defineEmits<{
  toggle: []
  setMode: [mode: ElevationMode]
  increase: []
  decrease: []
}>()
</script>

<style lang="scss" scoped>
.elevation-toolbar {
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-sm;
  }

  &__modes {
    display: flex;
    gap: $spacing-xs;
  }

  &__level {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    label {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }
  }

  &__selected {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__token-name {
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-text;
  }

  &__token-elev {
    font-size: $font-size-xs;
    color: $color-accent-teal;
    font-weight: 600;
    padding: 2px 6px;
    background: rgba($color-accent-teal, 0.15);
    border-radius: $border-radius-sm;
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-style: italic;
  }
}

.toolbar-icon {
  width: 14px;
  height: 14px;
  filter: brightness(0) invert(0.7);
  transition: filter 0.15s ease;
}

.elevation-toggle-btn {
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

.elevation-btn {
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
  }

  &--active {
    background: rgba($color-accent-teal, 0.2);
    border-color: $color-accent-teal;
    color: $color-accent-teal;
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
