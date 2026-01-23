<template>
  <div class="shortcuts-help" data-testid="keyboard-shortcuts-help">
    <div class="shortcuts-help__header">
      <h3>Keyboard Shortcuts</h3>
      <button class="shortcuts-help__close" @click="$emit('close')" aria-label="Close">&times;</button>
    </div>

    <div class="shortcuts-help__content">
      <!-- General Section -->
      <section class="shortcuts-section">
        <h4>General</h4>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>Z</kbd>
            <span>Undo last action</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>
            <span>Redo action</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl</kbd> + <kbd>Y</kbd>
            <span>Redo action (alternative)</span>
          </div>
          <div class="shortcut-item">
            <kbd>?</kbd>
            <span>Show this help</span>
          </div>
        </div>
      </section>

      <!-- VTT Grid Section -->
      <section class="shortcuts-section">
        <h4>Virtual Tabletop - Grid</h4>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>+</kbd> / <kbd>=</kbd>
            <span>Zoom in</span>
          </div>
          <div class="shortcut-item">
            <kbd>-</kbd>
            <span>Zoom out</span>
          </div>
          <div class="shortcut-item">
            <kbd>0</kbd>
            <span>Reset view (zoom and pan)</span>
          </div>
          <div class="shortcut-item">
            <kbd>Arrow keys</kbd>
            <span>Pan the grid</span>
          </div>
          <div class="shortcut-item">
            <kbd>Scroll wheel</kbd>
            <span>Zoom in/out</span>
          </div>
          <div class="shortcut-item">
            <kbd>Middle-click drag</kbd>
            <span>Pan the grid</span>
          </div>
        </div>
      </section>

      <!-- VTT Selection Section -->
      <section class="shortcuts-section">
        <h4>Virtual Tabletop - Selection</h4>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>Shift</kbd> + <kbd>Click</kbd>
            <span>Add/remove from selection</span>
          </div>
          <div class="shortcut-item">
            <kbd>Shift</kbd> + <kbd>Drag</kbd>
            <span>Marquee select multiple tokens</span>
          </div>
          <div class="shortcut-item">
            <kbd>Escape</kbd>
            <span>Clear selection / Cancel action</span>
          </div>
          <div class="shortcut-item">
            <kbd>Delete</kbd>
            <span>Remove selected token (GM only)</span>
          </div>
        </div>
      </section>

      <!-- VTT Movement Section -->
      <section class="shortcuts-section">
        <h4>Virtual Tabletop - Movement & Range</h4>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>W</kbd>
            <span>Toggle movement range display</span>
          </div>
          <div class="shortcut-item">
            <kbd>M</kbd>
            <span>Distance measurement mode</span>
          </div>
          <div class="shortcut-item">
            <kbd>B</kbd>
            <span>Burst AoE mode</span>
          </div>
          <div class="shortcut-item">
            <kbd>C</kbd>
            <span>Cone AoE mode</span>
          </div>
          <div class="shortcut-item">
            <kbd>L</kbd>
            <span>Line AoE mode</span>
          </div>
          <div class="shortcut-item">
            <kbd>R</kbd>
            <span>Cycle AoE direction</span>
          </div>
          <div class="shortcut-item">
            <kbd>[</kbd> / <kbd>]</kbd>
            <span>Decrease/Increase AoE size</span>
          </div>
        </div>
      </section>

      <!-- VTT GM Tools Section -->
      <section class="shortcuts-section">
        <h4>Virtual Tabletop - GM Tools</h4>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>T</kbd>
            <span>Toggle terrain painting mode</span>
          </div>
          <div class="shortcut-item">
            <kbd>F</kbd>
            <span>Toggle fog of war editing</span>
          </div>
          <div class="shortcut-item">
            <kbd>V</kbd>
            <span>Fog reveal tool</span>
          </div>
          <div class="shortcut-item">
            <kbd>H</kbd>
            <span>Fog hide tool</span>
          </div>
          <div class="shortcut-item">
            <kbd>E</kbd>
            <span>Fog explore tool</span>
          </div>
          <div class="shortcut-item">
            <kbd>[</kbd> / <kbd>]</kbd>
            <span>Decrease/Increase brush size</span>
          </div>
        </div>
      </section>
    </div>

    <div class="shortcuts-help__footer">
      <p>Press <kbd>?</kbd> to toggle this help</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  close: []
}>()
</script>

<style lang="scss" scoped>
.shortcuts-help {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: $shadow-lg;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $glass-border;

    h3 {
      margin: 0;
      font-size: $font-size-lg;
      color: $color-text;
    }
  }

  &__close {
    background: none;
    border: none;
    color: $color-text-muted;
    font-size: $font-size-xl;
    cursor: pointer;
    padding: 0;
    line-height: 1;

    &:hover {
      color: $color-text;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
  }

  &__footer {
    margin-top: $spacing-lg;
    padding-top: $spacing-md;
    border-top: 1px solid $glass-border;
    text-align: center;

    p {
      margin: 0;
      color: $color-text-muted;
      font-size: $font-size-sm;
    }
  }
}

.shortcuts-section {
  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-md;
    color: $color-accent-teal;
    font-weight: 600;
  }
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;

  &:hover {
    background: rgba($color-text, 0.05);
  }

  span {
    color: $color-text-muted;
    font-size: $font-size-sm;
  }
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: $font-size-xs;
  color: $color-text;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.25);
  min-width: 1.5em;
  text-align: center;
}
</style>
