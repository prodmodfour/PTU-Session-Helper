<template>
  <div class="encounter-header">
    <div class="encounter-header__info">
      <h2>{{ encounter.name }}</h2>
      <div class="encounter-header__meta">
        <span class="badge" :class="encounter.battleType === 'trainer' ? 'badge--blue' : 'badge--red'">
          {{ encounter.battleType === 'trainer' ? 'Trainer Battle' : 'Full Contact' }}
        </span>
        <span class="badge badge--gray">Round {{ encounter.currentRound }}</span>
        <span v-if="encounter.isPaused" class="badge badge--yellow">Paused</span>
        <span v-if="encounter.isServed" class="badge badge--green">
          <img src="/icons/phosphor/monitor.svg" alt="" class="badge-icon" /> Served to Group
        </span>
      </div>
    </div>

    <div class="encounter-header__actions">
      <!-- Serve/Unserve Buttons -->
      <button
        v-if="!encounter.isServed"
        class="btn btn--secondary btn--with-icon"
        @click="$emit('serve')"
        title="Display this encounter on Group View"
      >
        <img src="/icons/phosphor/monitor.svg" alt="" class="btn-svg" />
        Serve to Group
      </button>
      <button
        v-else
        class="btn btn--warning btn--with-icon"
        @click="$emit('unserve')"
        title="Stop displaying this encounter on Group View"
      >
        <img src="/icons/phosphor/monitor.svg" alt="" class="btn-svg" />
        Unserve
      </button>

      <!-- Undo/Redo Buttons -->
      <div class="undo-redo-group">
        <button
          class="btn btn--secondary btn--icon btn--with-icon"
          :disabled="!undoRedoState.canUndo"
          :title="undoRedoState.canUndo ? `Undo: ${undoRedoState.lastActionName}` : 'Nothing to undo'"
          @click="$emit('undo')"
        >
          <img src="/icons/phosphor/arrow-counter-clockwise.svg" alt="" class="btn-svg" />
          Undo
        </button>
        <button
          class="btn btn--secondary btn--icon btn--with-icon"
          :disabled="!undoRedoState.canRedo"
          :title="undoRedoState.canRedo ? `Redo: ${undoRedoState.nextActionName}` : 'Nothing to redo'"
          @click="$emit('redo')"
        >
          <img src="/icons/phosphor/arrow-clockwise.svg" alt="" class="btn-svg" />
          Redo
        </button>
      </div>

      <button
        v-if="!encounter.isActive"
        class="btn btn--success"
        @click="$emit('start')"
        :disabled="encounter.combatants.length === 0"
      >
        Start Combat
      </button>
      <button
        v-else
        class="btn btn--primary"
        @click="$emit('nextTurn')"
      >
        Next Turn
      </button>
      <button class="btn btn--danger" @click="$emit('end')">
        End Encounter
      </button>
      <button
        class="btn btn--ghost btn--with-icon"
        @click="$emit('saveTemplate')"
        title="Save current setup as a reusable template"
      >
        <img src="/icons/phosphor/floppy-disk.svg" alt="" class="btn-svg" />
        Save Template
      </button>
      <button
        class="btn btn--ghost btn--icon-only"
        @click="$emit('showHelp')"
        title="Keyboard shortcuts (?)"
        data-testid="help-btn"
      >
        <img src="/icons/phosphor/question.svg" alt="" class="btn-svg btn-svg--icon-only" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Encounter } from '~/types'

interface UndoRedoState {
  canUndo: boolean
  canRedo: boolean
  lastActionName: string | null
  nextActionName: string | null
}

defineProps<{
  encounter: Encounter
  undoRedoState: UndoRedoState
}>()

defineEmits<{
  serve: []
  unserve: []
  undo: []
  redo: []
  start: []
  nextTurn: []
  end: []
  saveTemplate: []
  showHelp: []
}>()
</script>

<style lang="scss" scoped>
.encounter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $glass-border;

  &__info {
    h2 {
      margin-bottom: $spacing-sm;
      color: $color-text;
    }
  }

  &__meta {
    display: flex;
    gap: $spacing-sm;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
  }
}

.undo-redo-group {
  display: flex;
  gap: $spacing-xs;
  padding: 0 $spacing-sm;
  border-left: 1px solid $glass-border;
  border-right: 1px solid $glass-border;
  margin: 0 $spacing-xs;

  .btn {
    min-width: auto;
    padding: $spacing-xs $spacing-sm;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.btn-svg {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
  opacity: 0.9;

  &--icon-only {
    width: 18px;
    height: 18px;
  }
}

.btn--with-icon {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
}

.btn--ghost {
  background: transparent;
  border: 1px solid $glass-border;
  color: $color-text-muted;

  &:hover {
    border-color: $color-primary;
    color: $color-text;
  }
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;

  &--blue {
    background: $gradient-scarlet;
    box-shadow: 0 0 8px rgba($color-accent-scarlet, 0.3);
  }
  &--red {
    background: $gradient-scarlet;
    box-shadow: 0 0 8px rgba($color-accent-scarlet, 0.3);
  }
  &--gray {
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
  }
  &--yellow {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    color: $color-text-dark;
  }
  &--green {
    background: linear-gradient(135deg, $color-success 0%, #34d399 100%);
    box-shadow: 0 0 8px rgba($color-success, 0.4);
  }
}

.badge-icon {
  width: 12px;
  height: 12px;
  filter: brightness(0) invert(1);
}
</style>
