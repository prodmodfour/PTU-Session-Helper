<template>
  <div class="habitat-panel" :class="{ 'habitat-panel--collapsed': collapsed }">
    <!-- Collapsed State -->
    <div v-if="collapsed" class="collapsed-strip" @click="emit('toggle-collapse')">
      <PhTree :size="20" />
    </div>

    <!-- Expanded State -->
    <template v-else>
      <div class="panel-header">
        <h3>Habitat</h3>
        <button class="btn btn--sm btn--ghost" @click="emit('toggle-collapse')">
          <PhCaretRight :size="16" />
        </button>
      </div>

      <div class="panel-content">
        <!-- Habitat Selector -->
        <div class="form-group">
          <select
            :value="sceneHabitatId"
            @change="emit('select-habitat', ($event.target as HTMLSelectElement).value || null)"
          >
            <option :value="null">Select Habitat...</option>
            <option
              v-for="table in encounterTables"
              :key="table.id"
              :value="table.id"
            >
              {{ table.name }}
            </option>
          </select>
        </div>

        <!-- Selected Habitat Info -->
        <template v-if="selectedTable">
          <div class="habitat-info">
            <span class="habitat-meta">
              Lv. {{ selectedTable.levelRange.min }}-{{ selectedTable.levelRange.max }}
            </span>
            <span class="habitat-meta habitat-meta--density">
              {{ selectedTable.density }}
            </span>
          </div>

          <!-- Generate Button -->
          <button
            class="btn btn--sm btn--primary generate-btn"
            :disabled="generating"
            @click="handleGenerate"
          >
            <PhDiceFive :size="16" />
            <span>{{ generating ? 'Generating...' : 'Generate Random' }}</span>
          </button>

          <!-- Entry List -->
          <div class="entries-list">
            <div
              v-for="entry in selectedTable.entries"
              :key="entry.id"
              class="entry-item"
            >
              <img
                :src="getSpriteUrl(entry.speciesName)"
                :alt="entry.speciesName"
                class="entry-sprite"
                loading="lazy"
              />
              <div class="entry-info">
                <span class="entry-species">{{ entry.speciesName }}</span>
                <span class="entry-meta">
                  {{ getRarityLabel(entry.weight, selectedTable.entries) }}
                  <template v-if="entry.levelRange">
                    &middot; Lv. {{ entry.levelRange.min }}-{{ entry.levelRange.max }}
                  </template>
                </span>
              </div>
              <button
                class="btn btn--sm btn--ghost add-btn"
                @click="handleAddEntry(entry)"
              >
                <PhPlus :size="14" />
              </button>
            </div>
          </div>
        </template>

        <div v-else-if="encounterTables.length === 0" class="empty-list">
          No habitats available.
        </div>
        <div v-else class="empty-list">
          Select a habitat to see available Pokemon.
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhTree, PhCaretRight, PhDiceFive, PhPlus } from '@phosphor-icons/vue'

interface EncounterTableEntry {
  id: string
  speciesId: string
  speciesName: string
  weight: number
  levelRange?: { min: number; max: number }
}

interface EncounterTable {
  id: string
  name: string
  levelRange: { min: number; max: number }
  density: string
  entries: EncounterTableEntry[]
}

const props = defineProps<{
  encounterTables: EncounterTable[]
  sceneHabitatId: string | null
  collapsed: boolean
  generating: boolean
}>()

const emit = defineEmits<{
  'select-habitat': [habitatId: string | null]
  'add-pokemon': [species: string, level: number]
  'generate-encounter': [tableId: string]
  'toggle-collapse': []
}>()

const { getSpriteUrl } = usePokemonSprite()

const selectedTable = computed(() => {
  if (!props.sceneHabitatId) return null
  return props.encounterTables.find(t => t.id === props.sceneHabitatId) ?? null
})

const handleGenerate = () => {
  if (!selectedTable.value || props.generating) return
  emit('generate-encounter', selectedTable.value.id)
}

const handleAddEntry = (entry: EncounterTableEntry) => {
  if (!selectedTable.value) return
  const range = entry.levelRange ?? selectedTable.value.levelRange
  const level = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
  emit('add-pokemon', entry.speciesName, level)
}

const getRarityLabel = (weight: number, entries: EncounterTableEntry[]): string => {
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  const percentage = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0
  if (percentage >= 20) return 'Common'
  if (percentage >= 10) return 'Uncommon'
  if (percentage >= 5) return 'Rare'
  return 'Very Rare'
}
</script>

<style lang="scss" scoped>
.habitat-panel {
  width: 280px;
  background: $color-bg-secondary;
  border-left: 1px solid $border-color-default;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;

  &--collapsed {
    width: 40px;
  }
}

.collapsed-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md $spacing-xs;
  gap: $spacing-sm;
  cursor: pointer;
  color: $color-text-muted;

  &:hover {
    color: $color-text;
    background: $color-bg-tertiary;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid $border-color-default;

  h3 {
    margin: 0;
    font-size: $font-size-md;
    color: $color-text;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-md;
}

.form-group {
  margin-bottom: $spacing-md;

  select {
    width: 100%;
    padding: $spacing-sm;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    color: $color-text;
    font-size: $font-size-sm;

    &:focus {
      outline: none;
      border-color: $color-primary;
    }
  }
}

.habitat-info {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.habitat-meta {
  padding: 2px $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  color: $color-text-muted;

  &--density {
    text-transform: capitalize;
  }
}

.generate-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.entry-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;

  &:hover {
    background: $color-bg-tertiary;

    .add-btn {
      opacity: 1;
    }
  }
}

.entry-sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
  image-rendering: pixelated;
}

.entry-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.entry-species {
  font-size: $font-size-sm;
  color: $color-text;
  font-weight: 500;
}

.entry-meta {
  font-size: $font-size-xs;
  color: $color-text-muted;
}

.add-btn {
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.empty-list {
  padding: $spacing-md;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-size-sm;
}
</style>
