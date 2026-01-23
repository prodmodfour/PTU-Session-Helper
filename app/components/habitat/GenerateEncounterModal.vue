<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal generate-modal" data-testid="generate-modal">
      <div class="modal__header">
        <h2>Generate Wild Encounter</h2>
        <button class="modal__close" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal__body">
        <!-- Table Info -->
        <div class="table-info">
          <h3>{{ table.name }}</h3>
          <p v-if="table.description">{{ table.description }}</p>
          <div class="table-info__meta">
            <span class="badge">Lv. {{ table.levelRange.min }}-{{ table.levelRange.max }}</span>
            <span class="badge">{{ table.entries.length }} species</span>
          </div>
        </div>

        <!-- Generation Options -->
        <div class="form-section">
          <div class="form-group">
            <label for="gen-count">Number of Pokemon</label>
            <input
              id="gen-count"
              v-model.number="count"
              type="number"
              class="form-input"
              min="1"
              max="10"
              data-testid="gen-count-input"
            />
          </div>

          <div class="form-group" v-if="table.modifications.length > 0">
            <label for="gen-modification">Apply Modification</label>
            <select
              id="gen-modification"
              v-model="selectedModification"
              class="form-select"
              data-testid="gen-modification-select"
            >
              <option value="">None (Base Table)</option>
              <option
                v-for="mod in table.modifications"
                :key="mod.id"
                :value="mod.id"
              >
                {{ mod.name }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  v-model="overrideLevel"
                  class="form-checkbox"
                />
                Override Level Range
              </label>
            </div>
          </div>

          <div v-if="overrideLevel" class="form-row">
            <div class="form-group">
              <label for="override-min">Min Level</label>
              <input
                id="override-min"
                v-model.number="levelMin"
                type="number"
                class="form-input"
                min="1"
                max="100"
                data-testid="override-min-input"
              />
            </div>
            <div class="form-group">
              <label for="override-max">Max Level</label>
              <input
                id="override-max"
                v-model.number="levelMax"
                type="number"
                class="form-input"
                min="1"
                max="100"
                data-testid="override-max-input"
              />
            </div>
          </div>
        </div>

        <!-- Pool Preview -->
        <div class="pool-preview" v-if="resolvedEntries.length > 0">
          <h4>Encounter Pool ({{ resolvedEntries.length }} species)</h4>
          <div class="pool-entries">
            <div
              v-for="entry in resolvedEntries.slice(0, 10)"
              :key="entry.speciesName"
              class="pool-entry"
            >
              <span class="pool-entry__name">{{ entry.speciesName }}</span>
              <span class="pool-entry__weight">{{ formatPercent(entry.weight) }}</span>
            </div>
            <div v-if="resolvedEntries.length > 10" class="pool-entry pool-entry--more">
              +{{ resolvedEntries.length - 10 }} more species...
            </div>
          </div>
        </div>

        <!-- Generated Results -->
        <div v-if="generatedPokemon.length > 0" class="generated-results">
          <h4>Generated Pokemon</h4>
          <div class="generated-list">
            <div
              v-for="(pokemon, index) in generatedPokemon"
              :key="index"
              class="generated-item"
              data-testid="generated-pokemon"
            >
              <span class="generated-item__name">{{ pokemon.speciesName }}</span>
              <span class="generated-item__level">Lv. {{ pokemon.level }}</span>
              <span class="generated-item__source" :class="`generated-item__source--${pokemon.source}`">
                {{ pokemon.source }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="addError" class="modal__error" data-testid="add-error">
        {{ addError }}
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">
          Cancel
        </button>
        <button
          class="btn btn--primary"
          :disabled="generating || table.entries.length === 0"
          @click="generate"
          data-testid="generate-btn"
        >
          {{ generating ? 'Generating...' : 'Generate' }}
        </button>
        <button
          v-if="generatedPokemon.length > 0"
          class="btn btn--success"
          :disabled="addingToEncounter || !hasActiveEncounter"
          :title="!hasActiveEncounter ? 'No active encounter' : ''"
          @click="addToEncounter"
          data-testid="add-to-encounter-btn"
        >
          {{ addingToEncounter ? 'Adding...' : hasActiveEncounter ? 'Add to Encounter' : 'No Active Encounter' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EncounterTable, ResolvedTableEntry } from '~/types'

const props = defineProps<{
  table: EncounterTable
  hasActiveEncounter?: boolean
  addError?: string | null
  addingToEncounter?: boolean
}>()

const emit = defineEmits<{
  close: []
  addToEncounter: [pokemon: Array<{ speciesId: string; speciesName: string; level: number }>]
}>()

const encounterTablesStore = useEncounterTablesStore()

// State
const count = ref(1)
const selectedModification = ref('')
const overrideLevel = ref(false)
const levelMin = ref(props.table.levelRange.min)
const levelMax = ref(props.table.levelRange.max)
const generating = ref(false)
const generatedPokemon = ref<Array<{
  speciesId: string
  speciesName: string
  level: number
  weight: number
  source: 'parent' | 'modification'
}>>([])

// Computed
const resolvedEntries = computed((): ResolvedTableEntry[] => {
  return encounterTablesStore.getResolvedEntries(
    props.table.id,
    selectedModification.value || undefined
  )
})

const totalWeight = computed(() => {
  return resolvedEntries.value.reduce((sum, e) => sum + e.weight, 0)
})

// Methods
const formatPercent = (weight: number): string => {
  const percent = (weight / totalWeight.value) * 100
  return `${percent.toFixed(1)}%`
}

const generate = async () => {
  generating.value = true
  try {
    const options: {
      count: number
      modificationId?: string
      levelRange?: { min: number; max: number }
    } = {
      count: count.value
    }

    if (selectedModification.value) {
      options.modificationId = selectedModification.value
    }

    if (overrideLevel.value) {
      options.levelRange = {
        min: levelMin.value,
        max: levelMax.value
      }
    }

    const result = await encounterTablesStore.generateFromTable(props.table.id, options)
    generatedPokemon.value = result.generated
  } catch (error) {
    console.error('Failed to generate:', error)
  } finally {
    generating.value = false
  }
}

const addToEncounter = () => {
  emit('addToEncounter', generatedPokemon.value.map(p => ({
    speciesId: p.speciesId,
    speciesName: p.speciesName,
    level: p.level
  })))
}

// Update level range when table changes
watch(() => props.table, (newTable) => {
  levelMin.value = newTable.levelRange.min
  levelMax.value = newTable.levelRange.max
}, { immediate: true })
</script>

<style lang="scss" scoped>
.generate-modal {
  max-width: 500px;
}

.modal__error {
  background: rgba($color-danger, 0.1);
  border: 1px solid $color-danger;
  border-radius: $border-radius-sm;
  color: $color-danger;
  padding: $spacing-sm $spacing-md;
  margin-top: $spacing-md;
  font-size: $font-size-sm;
}

.table-info {
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  padding: $spacing-lg;
  margin-bottom: $spacing-lg;

  h3 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-lg;
  }

  p {
    color: $color-text-muted;
    font-size: $font-size-sm;
    margin-bottom: $spacing-sm;
  }

  &__meta {
    display: flex;
    gap: $spacing-sm;
  }

  .badge {
    padding: 2px $spacing-sm;
    background: $color-bg-secondary;
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
  }
}

.form-section {
  margin-bottom: $spacing-lg;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
}

.form-checkbox {
  margin-right: $spacing-sm;
}

.pool-preview {
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;

  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

.pool-entries {
  max-height: 150px;
  overflow-y: auto;
}

.pool-entry {
  display: flex;
  justify-content: space-between;
  padding: $spacing-xs 0;
  border-bottom: 1px solid $border-color-default;

  &:last-child {
    border-bottom: none;
  }

  &__name {
    font-weight: 500;
  }

  &__weight {
    color: $color-text-muted;
    font-size: $font-size-sm;
  }

  &--more {
    color: $color-text-muted;
    font-style: italic;
  }
}

.generated-results {
  background: linear-gradient(135deg, rgba($color-success, 0.1) 0%, rgba($color-accent-teal, 0.1) 100%);
  border: 1px solid rgba($color-success, 0.3);
  border-radius: $border-radius-md;
  padding: $spacing-md;

  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    color: $color-success;
  }
}

.generated-list {
  max-height: 200px;
  overflow-y: auto;
}

.generated-item {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-xs;

  &__name {
    flex: 1;
    font-weight: 600;
  }

  &__level {
    background: $gradient-scarlet;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    font-weight: 600;
  }

  &__source {
    font-size: $font-size-xs;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;

    &--parent {
      background: $color-bg-secondary;
      color: $color-text-muted;
    }

    &--modification {
      background: rgba($color-accent-violet, 0.2);
      color: $color-accent-violet;
    }
  }
}
</style>
