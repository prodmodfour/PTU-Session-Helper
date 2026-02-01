<template>
  <div class="move-log-panel">
    <h3>Combat Log</h3>
    <div class="move-log">
      <div
        v-for="entry in moveLog"
        :key="entry.id"
        class="move-log__entry"
      >
        <span class="move-log__round">R{{ entry.round }}</span>
        <span class="move-log__actor">{{ entry.actorName }}</span>
        <span class="move-log__move">{{ entry.moveName }}</span>
        <span class="move-log__targets">
          → {{ entry.targets.map(t => t.name).join(', ') }}
        </span>
      </div>
      <p v-if="moveLog.length === 0" class="move-log__empty">
        No actions yet
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MoveLogEntry {
  id: string
  round: number
  actorName: string
  moveName: string
  targets: { name: string }[]
}

defineProps<{
  moveLog: MoveLogEntry[]
}>()
</script>

<style lang="scss" scoped>
.move-log-panel {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  height: fit-content;
  max-height: 600px;
  overflow-y: auto;

  h3 {
    margin-bottom: $spacing-md;
    font-size: $font-size-md;
    font-weight: 600;
  }
}

.move-log {
  &__entry {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    padding: $spacing-sm;
    border-bottom: 1px solid $border-color-default;
    font-size: $font-size-sm;

    &:last-child {
      border-bottom: none;
    }
  }

  &__round {
    background: $color-bg-tertiary;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;
    font-weight: 600;
    font-size: $font-size-xs;
  }

  &__actor {
    font-weight: 600;
    color: $color-accent-scarlet;
  }

  &__move {
    color: $color-text-muted;
  }

  &__targets {
    color: $color-text-muted;
  }

  &__empty {
    color: $color-text-muted;
    text-align: center;
    padding: $spacing-lg;
    font-style: italic;
  }
}
</style>
