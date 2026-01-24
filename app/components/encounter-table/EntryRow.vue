<template>
  <div class="entry-row">
    <span class="col-name">
      <img
        :src="getSpriteUrl(entry.speciesName)"
        :alt="entry.speciesName"
        class="species-sprite"
        @error="handleSpriteError($event)"
      />
      {{ entry.speciesName }}
    </span>
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
      <div class="level-inputs">
        <input
          :value="displayLevelMin"
          type="number"
          class="level-input"
          min="1"
          max="100"
          :placeholder="String(tableLevelRange.min)"
          @change="handleLevelMinChange"
        />
        <span class="level-separator">-</span>
        <input
          :value="displayLevelMax"
          type="number"
          class="level-input"
          min="1"
          max="100"
          :placeholder="String(tableLevelRange.max)"
          @change="handleLevelMaxChange"
        />
      </div>
    </span>
    <span class="col-actions">
      <button
        class="btn btn--icon btn--ghost btn--danger"
        @click="$emit('remove', entry)"
        title="Remove"
      >
        <img src="/icons/phosphor/trash.svg" alt="Remove" class="action-icon" />
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

const { getSpriteUrl } = usePokemonSprite()

const handleSpriteError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/images/pokemon-placeholder.svg'
}

const emit = defineEmits<{
  (e: 'remove', entry: EncounterTableEntry): void
  (e: 'update-weight', entry: EncounterTableEntry, weight: number): void
  (e: 'update-level-range', entry: EncounterTableEntry, levelRange: LevelRange | null): void
}>()

const chancePercent = computed(() => {
  if (props.totalWeight === 0) return '0.0'
  return ((props.entry.weight / props.totalWeight) * 100).toFixed(1)
})

// Display values for level inputs (empty string if using table default)
const displayLevelMin = computed(() => props.entry.levelRange?.min ?? '')
const displayLevelMax = computed(() => props.entry.levelRange?.max ?? '')

const handleWeightChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newWeight = parseFloat(target.value)
  if (!isNaN(newWeight) && newWeight > 0) {
    emit('update-weight', props.entry, newWeight)
  }
}

const handleLevelMinChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newMin = target.value ? parseInt(target.value) : null
  updateLevelRange(newMin, props.entry.levelRange?.max ?? null)
}

const handleLevelMaxChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newMax = target.value ? parseInt(target.value) : null
  updateLevelRange(props.entry.levelRange?.min ?? null, newMax)
}

const updateLevelRange = (min: number | null, max: number | null) => {
  // If both are null/empty, clear the level range (use table default)
  if (min === null && max === null) {
    emit('update-level-range', props.entry, null)
    return
  }

  // Use table defaults for any missing values
  const finalMin = min ?? props.tableLevelRange.min
  const finalMax = max ?? props.tableLevelRange.max

  emit('update-level-range', props.entry, { min: finalMin, max: finalMax })
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
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-weight: 500;
  color: $color-text;
}

.species-sprite {
  width: 24px;
  height: 24px;
  object-fit: contain;
  image-rendering: pixelated;
  flex-shrink: 0;
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
  color: #64b5f6;
  font-weight: 500;
}

.col-level {
  color: $color-text-muted;
  font-size: 0.875rem;
}

.level-inputs {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.level-input {
  width: 50px;
  padding: $spacing-xs;
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: 0.875rem;
  text-align: center;

  &:focus {
    outline: none;
    border-color: $color-primary;
  }

  &::placeholder {
    color: $color-text-muted;
    opacity: 0.5;
  }
}

.level-separator {
  color: $color-text-muted;
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

.action-icon {
  width: 14px;
  height: 14px;
  filter: brightness(0) invert(0.7);
  transition: filter 0.15s ease;
}

.btn--danger:hover .action-icon {
  filter: brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(340deg);
}
</style>
