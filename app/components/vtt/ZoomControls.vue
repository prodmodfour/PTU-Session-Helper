<template>
  <div class="zoom-controls">
    <button
      class="zoom-btn"
      @click="$emit('zoomIn')"
      title="Zoom In"
      data-testid="zoom-in-btn"
    >
      +
    </button>
    <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
    <button
      class="zoom-btn"
      @click="$emit('zoomOut')"
      title="Zoom Out"
      data-testid="zoom-out-btn"
    >
      -
    </button>
    <button
      class="zoom-btn"
      @click="$emit('reset')"
      title="Reset View"
      data-testid="reset-view-btn"
    >
      ⌂
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  zoom: number
}>()

defineEmits<{
  zoomIn: []
  zoomOut: []
  reset: []
}>()
</script>

<style lang="scss" scoped>
.zoom-controls {
  position: absolute;
  bottom: $spacing-md;
  right: $spacing-md;
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

.zoom-btn {
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
  font-size: $font-size-md;
  transition: all $transition-fast;

  &:hover {
    background: $color-bg-hover;
    border-color: $color-accent-teal;
  }
}

.zoom-level {
  font-size: $font-size-xs;
  color: $color-text-muted;
  min-width: 40px;
  text-align: center;
}
</style>
