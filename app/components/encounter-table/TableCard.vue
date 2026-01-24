<template>
  <NuxtLink :to="`/gm/encounter-tables/${table.id}`" class="table-card">
    <div class="table-card__header">
      <h3 class="table-card__name">{{ table.name }}</h3>
      <div class="table-card__actions">
        <button
          class="btn btn--icon btn--ghost"
          @click.stop.prevent="$emit('generate', table)"
          title="Generate Encounter"
        >
          <img src="/icons/phosphor/dice-five.svg" alt="Generate" class="action-icon" />
        </button>
        <button
          class="btn btn--icon btn--ghost"
          @click.stop.prevent="$emit('export', table)"
          title="Export Table"
        >
          <img src="/icons/phosphor/download-simple.svg" alt="Export" class="action-icon" />
        </button>
        <button
          class="btn btn--icon btn--ghost btn--danger"
          @click.stop.prevent="$emit('delete', table)"
          title="Delete Table"
        >
          <img src="/icons/phosphor/trash.svg" alt="Delete" class="action-icon" />
        </button>
      </div>
    </div>

    <p v-if="table.description" class="table-card__description">
      {{ table.description }}
    </p>

    <div class="table-card__meta">
      <span class="meta-item">
        <span class="meta-label">Levels:</span>
        <span class="meta-value">{{ table.levelRange.min }} - {{ table.levelRange.max }}</span>
      </span>
      <span class="meta-item">
        <span class="meta-label">Entries:</span>
        <span class="meta-value">{{ table.entries.length }}</span>
      </span>
      <span v-if="table.modifications.length > 0" class="meta-item">
        <span class="meta-label">Sub-habitats:</span>
        <span class="meta-value">{{ table.modifications.length }}</span>
      </span>
    </div>

    <!-- Preview of top entries -->
    <div v-if="table.entries.length > 0" class="table-card__preview">
      <div class="preview-header">Top Pokemon</div>
      <div class="preview-entries">
        <div
          v-for="entry in topEntries"
          :key="entry.id"
          class="preview-entry"
        >
          <span class="entry-name">{{ entry.speciesName }}</span>
          <span class="entry-weight" :class="getRarityClass(entry.weight)">
            {{ getRarityLabel(entry.weight) }}
          </span>
        </div>
        <div v-if="table.entries.length > 5" class="preview-more">
          +{{ table.entries.length - 5 }} more
        </div>
      </div>
    </div>

    <!-- Modifications preview -->
    <div v-if="table.modifications.length > 0" class="table-card__mods">
      <div class="mods-label">Sub-habitats:</div>
      <div class="mods-list">
        <span
          v-for="mod in table.modifications"
          :key="mod.id"
          class="mod-tag"
        >
          {{ mod.name }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { EncounterTable } from '~/types'

const props = defineProps<{
  table: EncounterTable
}>()

defineEmits<{
  (e: 'delete', table: EncounterTable): void
  (e: 'generate', table: EncounterTable): void
  (e: 'export', table: EncounterTable): void
}>()

// Get top 5 entries by weight
const topEntries = computed(() => {
  return [...props.table.entries]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
})

// Get rarity label based on weight
const getRarityLabel = (weight: number): string => {
  if (weight >= 10) return 'Common'
  if (weight >= 5) return 'Uncommon'
  if (weight >= 3) return 'Rare'
  if (weight >= 1) return 'Very Rare'
  return 'Legendary'
}

// Get rarity class for styling
const getRarityClass = (weight: number): string => {
  if (weight >= 10) return 'rarity--common'
  if (weight >= 5) return 'rarity--uncommon'
  if (weight >= 3) return 'rarity--rare'
  if (weight >= 1) return 'rarity--very-rare'
  return 'rarity--legendary'
}
</script>

<style lang="scss" scoped>
.table-card {
  display: block;
  text-decoration: none;
  color: inherit;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  transition: all $transition-normal;
  cursor: pointer;

  &:hover {
    border-color: $color-primary;
    transform: translateY(-2px);
    box-shadow: $shadow-lg;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-sm;
  }

  &__name {
    margin: 0;
    font-size: 1.125rem;
    color: $color-text;
    font-weight: 600;
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
  }

  &__description {
    margin: 0 0 $spacing-md;
    color: $color-text-muted;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $glass-border;
  }

  &__preview {
    margin-bottom: $spacing-md;
  }

  &__mods {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }
}

.meta-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: 0.875rem;
}

.meta-label {
  color: $color-text-muted;
}

.meta-value {
  color: $color-text;
  font-weight: 500;
}

.preview-header {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $color-text-muted;
  margin-bottom: $spacing-sm;
}

.preview-entries {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.preview-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.entry-name {
  color: $color-text;
}

.entry-weight {
  padding: 2px 8px;
  border-radius: $border-radius-sm;
  font-size: 0.75rem;
  font-weight: 500;

  &.rarity--common {
    background: rgba(76, 175, 80, 0.2);
    color: #81c784;
  }

  &.rarity--uncommon {
    background: rgba(33, 150, 243, 0.2);
    color: #64b5f6;
  }

  &.rarity--rare {
    background: rgba(156, 39, 176, 0.2);
    color: #ba68c8;
  }

  &.rarity--very-rare {
    background: rgba(255, 152, 0, 0.2);
    color: #ffb74d;
  }

  &.rarity--legendary {
    background: rgba(244, 67, 54, 0.2);
    color: #ef5350;
  }
}

.preview-more {
  font-size: 0.75rem;
  color: $color-text-muted;
  text-align: center;
  padding-top: $spacing-xs;
}

.mods-label {
  font-size: 0.75rem;
  color: $color-text-muted;
}

.mods-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.mod-tag {
  padding: 2px 8px;
  background: rgba($color-primary, 0.2);
  border-radius: $border-radius-sm;
  font-size: 0.75rem;
  color: $color-primary;
}

.btn--icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
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
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(0.7);
  transition: filter 0.15s ease;
}

.btn--ghost:hover .action-icon {
  filter: brightness(0) invert(1);
}

.btn--danger:hover .action-icon {
  filter: brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(340deg);
}
</style>
