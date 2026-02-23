<template>
  <div class="camera-controls">
    <button
      class="camera-btn"
      :disabled="isRotating"
      title="Rotate Counter-Clockwise (Q)"
      data-testid="rotate-ccw-btn"
      @click="$emit('rotateCcw')"
    >
      <img src="/icons/phosphor/arrow-counter-clockwise.svg" alt="" class="camera-btn__icon" />
    </button>

    <span class="camera-angle" data-testid="camera-angle-display">
      {{ angleLabel }}
    </span>

    <button
      class="camera-btn"
      :disabled="isRotating"
      title="Rotate Clockwise (E)"
      data-testid="rotate-cw-btn"
      @click="$emit('rotateCw')"
    >
      <img src="/icons/phosphor/arrow-clockwise.svg" alt="" class="camera-btn__icon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CameraAngle } from '~/types'

const ANGLE_LABELS: Record<CameraAngle, string> = {
  0: 'N',
  1: 'E',
  2: 'S',
  3: 'W'
}

const props = defineProps<{
  angle: CameraAngle
  isRotating: boolean
}>()

defineEmits<{
  rotateCw: []
  rotateCcw: []
}>()

const angleLabel = computed(() => ANGLE_LABELS[props.angle])
</script>

<style lang="scss" scoped>
.camera-controls {
  position: absolute;
  bottom: $spacing-md;
  left: $spacing-md;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  background: rgba($color-bg-primary, 0.9);
  backdrop-filter: blur(4px);
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-md;
  border: 1px solid $border-color-default;
  z-index: 10;
}

.camera-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover:not(:disabled) {
    background: $color-bg-hover;
    border-color: $color-accent-teal;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &__icon {
    width: 16px;
    height: 16px;
    filter: invert(1);
  }
}

.camera-angle {
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-text-muted;
  min-width: 20px;
  text-align: center;
}
</style>
