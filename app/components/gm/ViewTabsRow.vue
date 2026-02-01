<template>
  <div class="view-tabs-row">
    <div class="view-tabs">
      <button
        class="view-tab"
        :class="{ 'view-tab--active': activeView === 'list' }"
        @click="$emit('update:activeView', 'list')"
        data-testid="list-view-tab"
      >
        <img src="/icons/phosphor/list.svg" alt="" class="view-tab__icon" />
        List View
      </button>
      <button
        class="view-tab"
        :class="{ 'view-tab--active': activeView === 'grid' }"
        @click="$emit('update:activeView', 'grid')"
        data-testid="grid-view-tab"
      >
        <img src="/icons/phosphor/map-trifold.svg" alt="" class="view-tab__icon" />
        Grid View
      </button>
    </div>

    <!-- Damage Mode Toggle -->
    <div class="damage-mode-toggle">
      <span class="damage-mode-label">Damage Mode:</span>
      <button
        class="damage-mode-btn"
        :class="{ 'damage-mode-btn--active': damageMode === 'set' }"
        @click="$emit('update:damageMode', 'set')"
        title="Use fixed average damage values"
        data-testid="set-damage-btn"
      >
        <img src="/icons/phosphor/chart-bar.svg" alt="" class="damage-mode-btn__icon" />
        Set
      </button>
      <button
        class="damage-mode-btn"
        :class="{ 'damage-mode-btn--active': damageMode === 'rolled' }"
        @click="$emit('update:damageMode', 'rolled')"
        title="Roll dice for damage"
        data-testid="rolled-damage-btn"
      >
        <img src="/icons/phosphor/dice-five.svg" alt="" class="damage-mode-btn__icon" />
        Rolled
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeView: 'list' | 'grid'
  damageMode: 'set' | 'rolled'
}>()

defineEmits<{
  'update:activeView': [value: 'list' | 'grid']
  'update:damageMode': [value: 'set' | 'rolled']
}>()
</script>

<style lang="scss" scoped>
.view-tabs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;
  flex-wrap: wrap;
}

.view-tabs {
  display: flex;
  gap: $spacing-sm;
}

.view-tab {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-lg;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  color: $color-text-muted;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &__icon {
    width: 16px;
    height: 16px;
    filter: brightness(0) invert(0.5);
    transition: filter 0.2s ease;
  }

  &:hover {
    background: $color-bg-secondary;
    color: $color-text;

    .view-tab__icon {
      filter: brightness(0) invert(1);
    }
  }

  &--active {
    background: $gradient-scarlet;
    border-color: transparent;
    color: $color-text;
    box-shadow: $shadow-glow-scarlet;

    .view-tab__icon {
      filter: brightness(0) invert(1);
    }
  }
}

.damage-mode-toggle {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-md;
  padding: $spacing-xs $spacing-sm;
}

.damage-mode-label {
  font-size: $font-size-sm;
  color: $color-text-muted;
  font-weight: 500;
}

.damage-mode-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: transparent;
  border: 1px solid transparent;
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  font-size: $font-size-sm;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &__icon {
    width: 14px;
    height: 14px;
    filter: brightness(0) invert(0.5);
    transition: filter 0.2s ease;
  }

  &:hover {
    background: $color-bg-tertiary;
    color: $color-text;

    .damage-mode-btn__icon {
      filter: brightness(0) invert(1);
    }
  }

  &--active {
    background: rgba($color-accent-teal, 0.2);
    border-color: $color-accent-teal;
    color: $color-accent-teal;

    .damage-mode-btn__icon {
      filter: brightness(0) saturate(100%) invert(80%) sepia(30%) saturate(700%) hue-rotate(120deg);
    }
  }
}
</style>
