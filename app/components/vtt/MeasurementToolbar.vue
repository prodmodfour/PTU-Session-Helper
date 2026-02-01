<template>
  <div class="measurement-toolbar" data-testid="measurement-toolbar">
    <div class="measurement-toolbar__modes">
      <button
        class="measurement-btn"
        :class="{ 'measurement-btn--active': mode === 'distance' }"
        @click="$emit('setMode', 'distance')"
        title="Distance (M)"
        data-testid="measure-distance-btn"
      >
        <img src="/icons/phosphor/ruler.svg" alt="" class="toolbar-icon" />
        Distance
      </button>
      <button
        class="measurement-btn"
        :class="{ 'measurement-btn--active': mode === 'burst' }"
        @click="$emit('setMode', 'burst')"
        title="Burst AoE (B)"
        data-testid="measure-burst-btn"
      >
        <img src="/icons/phosphor/target.svg" alt="" class="toolbar-icon" />
        Burst
      </button>
      <button
        class="measurement-btn"
        :class="{ 'measurement-btn--active': mode === 'cone' }"
        @click="$emit('setMode', 'cone')"
        title="Cone AoE (C)"
        data-testid="measure-cone-btn"
      >
        <img src="/icons/phosphor/triangle.svg" alt="" class="toolbar-icon" />
        Cone
      </button>
      <button
        class="measurement-btn"
        :class="{ 'measurement-btn--active': mode === 'line' }"
        @click="$emit('setMode', 'line')"
        title="Line AoE (L)"
        data-testid="measure-line-btn"
      >
        <img src="/icons/phosphor/minus.svg" alt="" class="toolbar-icon" />
        Line
      </button>
      <button
        class="measurement-btn"
        :class="{ 'measurement-btn--active': mode === 'close-blast' }"
        @click="$emit('setMode', 'close-blast')"
        title="Close Blast"
        data-testid="measure-close-blast-btn"
      >
        <img src="/icons/phosphor/square.svg" alt="" class="toolbar-icon" />
        Close Blast
      </button>
    </div>

    <div v-if="mode !== 'none'" class="measurement-toolbar__options">
      <template v-if="mode !== 'distance'">
        <label>Size:</label>
        <button
          class="size-btn"
          @click="$emit('decreaseSize')"
          :disabled="aoeSize <= 1"
        >-</button>
        <span class="size-display">{{ aoeSize }}</span>
        <button
          class="size-btn"
          @click="$emit('increaseSize')"
          :disabled="aoeSize >= 10"
        >+</button>
      </template>

      <template v-if="['cone', 'close-blast', 'line'].includes(mode)">
        <span class="separator">|</span>
        <label>Dir:</label>
        <button class="dir-btn" @click="$emit('cycleDirection')">
          {{ directionArrow }}
        </button>
      </template>

      <button
        class="measurement-btn measurement-btn--clear"
        @click="$emit('clear')"
        title="Clear (Escape)"
      >
        <img src="/icons/phosphor/x-circle.svg" alt="" class="toolbar-icon" />
        Clear
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MeasurementMode } from '~/stores/measurement'

const props = defineProps<{
  mode: MeasurementMode
  aoeSize: number
  aoeDirection: string
}>()

defineEmits<{
  setMode: [mode: MeasurementMode]
  increaseSize: []
  decreaseSize: []
  cycleDirection: []
  clear: []
}>()

// Direction arrow mapping
const directionArrow = computed(() => {
  const arrows: Record<string, string> = {
    north: '↑',
    south: '↓',
    east: '→',
    west: '←',
    northeast: '↗',
    northwest: '↖',
    southeast: '↘',
    southwest: '↙',
  }
  return arrows[props.aoeDirection] || '↑'
})
</script>

<style lang="scss" scoped>
.measurement-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;

  &__modes {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__options {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-left: auto;
    padding-left: $spacing-sm;
    border-left: 1px solid $border-color-default;

    label {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }
  }
}

.toolbar-icon {
  width: 14px;
  height: 14px;
  filter: brightness(0) invert(0.7);
  transition: filter 0.15s ease;
}

.measurement-btn {
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

  &--clear {
    background: rgba($color-danger, 0.1);
    border-color: $color-danger;
    color: $color-danger;

    .toolbar-icon {
      filter: brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(340deg);
    }

    &:hover {
      background: rgba($color-danger, 0.2);
    }
  }
}

.size-btn,
.dir-btn {
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

.dir-btn {
  font-size: $font-size-md;
  width: 28px;
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
