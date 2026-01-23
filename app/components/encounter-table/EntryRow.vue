<template>
  <div class="entry-row">
    <span class="col-name">{{ entry.speciesName }}</span>
    <span class="col-weight">
      <input
        :value="entry.weight"
        type="number"
        class="weight-input"
        min="0.1"
        step="0.1"
        @change="handleWeightChange"
      />
    </span>
    <span class="col-chance">{{ chancePercent }}%</span>
    <span class="col-level">
      <template v-if="entry.levelRange">
        {{ entry.levelRange.min }} - {{ entry.levelRange.max }}
      </template>
      <template v-else>
        <span class="default-range">({{ tableLevelRange.min }} - {{ tableLevelRange.max }})</span>
      </template>
    </span>
    <span class="col-actions">
      <button
        class="btn btn--icon btn--ghost btn--danger"
        @click="$emit('remove', entry)"
        title="Remove"
      >
        🗑️
      </button>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { EncounterTableEntry, LevelRange } from '~/types'

const props = defineProps<{
  entry: EncounterTableEntry
  totalWeight: number
  tableLevelRange: LevelRange
}>()

const emit = defineEmits<{
  (e: 'remove', entry: EncounterTableEntry): void
  (e: 'update-weight', entry: EncounterTableEntry, weight: number): void
}>()

const chancePercent = computed(() => {
  if (props.totalWeight === 0) return '0.0'
  return ((props.entry.weight / props.totalWeight) * 100).toFixed(1)
})

const handleWeightChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newWeight = parseFloat(target.value)
  if (!isNaN(newWeight) && newWeight > 0) {
    emit('update-weight', props.entry, newWeight)
  }
}
</script>

<style lang="scss" scoped>
.entry-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: $spacing-md;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-bg-secondary, 0.5);
  border-radius: $border-radius-sm;
  transition: background 0.2s ease;

  &:hover {
    background: rgba($color-bg-secondary, 0.8);
  }
}

.col-name {
  font-weight: 500;
  color: $color-text;
}

.col-weight {
  display: flex;
  align-items: center;
}

.weight-input {
  width: 70px;
  padding: $spacing-xs $spacing-sm;
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: $color-primary;
  }
}

.col-chance {
  color: $color-primary;
  font-weight: 500;
}

.col-level {
  color: $color-text-muted;
  font-size: 0.875rem;
}

.default-range {
  opacity: 0.6;
  font-style: italic;
}

.col-actions {
  display: flex;
  justify-content: flex-end;
}

.btn--icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.btn--ghost {
  background: transparent;
  border: 1px solid transparent;

  &:hover {
    background: $glass-bg;
    border-color: $glass-border;
  }
}

.btn--danger:hover {
  background: rgba($color-danger, 0.2);
  border-color: $color-danger;
}
</style>
