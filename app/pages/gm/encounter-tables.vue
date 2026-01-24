<template>
  <div class="encounter-tables">
    <div class="encounter-tables__header">
      <h2>Encounter Tables</h2>
      <div class="encounter-tables__actions">
        <button class="btn btn--secondary" @click="showImportModal = true">
          📤 Import
        </button>
        <button class="btn btn--primary" @click="showCreateModal = true">
          + New Table
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="encounter-tables__filters">
      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          class="form-input"
          placeholder="Search tables..."
        />
      </div>

      <div class="filter-group">
        <select v-model="filters.sortBy" class="form-select">
          <option value="name">Sort by Name</option>
          <option value="createdAt">Sort by Created</option>
          <option value="updatedAt">Sort by Updated</option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="filters.sortOrder" class="form-select">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      <button class="btn btn--secondary btn--sm" @click="resetFilters">
        Reset
      </button>
    </div>

    <!-- Content -->
    <div class="encounter-tables__content">
      <div v-if="loading" class="encounter-tables__loading">
        Loading...
      </div>

      <div v-else-if="filteredTables.length === 0" class="encounter-tables__empty">
        <p>No encounter tables found</p>
        <button class="btn btn--primary" @click="showCreateModal = true">
          Create your first encounter table
        </button>
      </div>

      <div v-else class="encounter-tables__grid">
        <TableCard
          v-for="table in filteredTables"
          :key="table.id"
          :table="table"
        />
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal" data-testid="encounter-table-modal">
        <div class="modal__header">
          <h3>Create Encounter Table</h3>
          <button class="modal__close" @click="showCreateModal = false">&times;</button>
        </div>
        <form @submit.prevent="createTable">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Name *</label>
              <input
                v-model="newTable.name"
                type="text"
                class="form-input"
                placeholder="e.g., Glowlace Forest"
                required
                data-testid="table-name-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="newTable.description"
                class="form-input"
                rows="3"
                placeholder="Describe this habitat..."
                data-testid="table-description-input"
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Min Level</label>
                <input
                  v-model.number="newTable.levelMin"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  data-testid="level-min-input"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Max Level</label>
                <input
                  v-model.number="newTable.levelMax"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  data-testid="level-max-input"
                />
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="showCreateModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary" :disabled="!newTable.name" data-testid="save-table-btn">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Generate Modal -->
    <div v-if="generateModal.show" class="modal-overlay" @click.self="generateModal.show = false">
      <div class="modal modal--wide">
        <div class="modal__header">
          <h3>Generate Wild Encounter</h3>
          <button class="modal__close" @click="generateModal.show = false">&times;</button>
        </div>
        <div class="modal__body">
          <div class="generate-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Table</label>
                <div class="form-value">{{ generateModal.table?.name }}</div>
              </div>
              <div class="form-group">
                <label class="form-label">Sub-habitat (optional)</label>
                <select v-model="generateModal.modificationId" class="form-select">
                  <option :value="null">Base Table</option>
                  <option
                    v-for="mod in generateModal.table?.modifications"
                    :key="mod.id"
                    :value="mod.id"
                  >
                    {{ mod.name }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Pokemon Count</label>
                <input
                  v-model.number="generateModal.count"
                  type="number"
                  class="form-input"
                  min="1"
                  max="10"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Level Range</label>
                <div class="level-range-inputs">
                  <input
                    v-model.number="generateModal.levelMin"
                    type="number"
                    class="form-input"
                    min="1"
                    max="100"
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    v-model.number="generateModal.levelMax"
                    type="number"
                    class="form-input"
                    min="1"
                    max="100"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Generated Results -->
          <div v-if="generateModal.results.length > 0" class="generate-results">
            <h4>Generated Pokemon</h4>
            <div class="generate-results__list">
              <div
                v-for="(pokemon, index) in generateModal.results"
                :key="index"
                class="generate-result-row"
              >
                <span class="result-species">{{ pokemon.speciesName }}</span>
                <span class="result-level">Lv. {{ pokemon.level }}</span>
                <span class="result-weight">(Weight: {{ pokemon.weight }})</span>
                <button
                  class="btn btn--ghost btn--sm btn--icon-only"
                  @click="rerollPokemon(index)"
                  title="Reroll this Pokemon"
                >
                  <img src="/icons/phosphor/dice-five.svg" alt="Reroll" class="icon-sm" />
                </button>
              </div>
            </div>
          </div>

          <!-- Error message -->
          <div v-if="addToEncounterError" class="add-error">
            {{ addToEncounterError }}
          </div>

          <!-- No active encounter hint -->
          <div v-if="generateModal.results.length > 0 && !encounterStore.encounter" class="no-encounter-hint">
            <img src="/icons/phosphor/lightbulb.svg" alt="" class="hint-icon" /> No active encounter. <NuxtLink to="/gm" class="hint-link">Go to GM page</NuxtLink> to create one first.
          </div>
        </div>
        <div class="modal__footer">
          <button type="button" class="btn btn--secondary" @click="generateModal.show = false">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn--primary"
            @click="doGenerate"
          >
            {{ generateModal.results.length > 0 ? 'Regenerate' : 'Generate' }}
          </button>
          <button
            v-if="generateModal.results.length > 0"
            type="button"
            class="btn btn--success"
            :disabled="addingToEncounter || !encounterStore.encounter"
            @click="addToEncounter"
          >
            {{ addingToEncounter ? 'Adding...' : 'Add to Encounter' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Import Encounter Table</h3>
          <button class="modal__close" @click="showImportModal = false">&times;</button>
        </div>
        <div class="modal__body">
          <div class="import-zone" :class="{ 'import-zone--dragover': isDragOver }">
            <input
              type="file"
              ref="fileInputRef"
              accept=".json"
              @change="handleFileSelect"
              class="import-zone__input"
            />
            <div
              class="import-zone__content"
              @dragover.prevent="isDragOver = true"
              @dragleave="isDragOver = false"
              @drop.prevent="handleFileDrop"
              @click="fileInputRef?.click()"
            >
              <span class="import-zone__icon">
                <img src="/icons/phosphor/folder.svg" alt="" class="import-icon" />
              </span>
              <p class="import-zone__text">
                {{ selectedFile ? selectedFile.name : 'Click or drag JSON file here' }}
              </p>
              <p v-if="selectedFile" class="import-zone__hint">
                Click to choose a different file
              </p>
            </div>
          </div>

          <div v-if="importError" class="import-error">
            {{ importError }}
          </div>

          <div v-if="importWarning" class="import-warning">
            {{ importWarning }}
          </div>
        </div>
        <div class="modal__footer">
          <button type="button" class="btn btn--secondary" @click="closeImportModal">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn--primary"
            :disabled="!selectedFile || importing"
            @click="doImport"
          >
            {{ importing ? 'Importing...' : 'Import' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EncounterTable } from '~/types'

definePageMeta({
  layout: 'gm'
})

useHead({
  title: 'GM - Encounter Tables'
})

const router = useRouter()
const tablesStore = useEncounterTablesStore()
const encounterStore = useEncounterStore()

// Load tables on mount
onMounted(async () => {
  await tablesStore.loadTables()
})

// Local state
const loading = computed(() => tablesStore.loading)
const showCreateModal = ref(false)
const showImportModal = ref(false)

// Import state
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)
const importWarning = ref<string | null>(null)

const filters = ref({
  search: '',
  sortBy: 'name' as 'name' | 'createdAt' | 'updatedAt',
  sortOrder: 'asc' as 'asc' | 'desc'
})

// Watch and sync filters
watch(filters, (newFilters) => {
  tablesStore.setFilters(newFilters)
}, { deep: true })

const filteredTables = computed(() => tablesStore.filteredTables)

// New table form
const newTable = ref({
  name: '',
  description: '',
  levelMin: 1,
  levelMax: 10
})

// Generate modal state
const generateModal = ref({
  show: false,
  table: null as EncounterTable | null,
  modificationId: null as string | null,
  count: 3,
  levelMin: null as number | null,
  levelMax: null as number | null,
  results: [] as Array<{
    speciesId: string
    speciesName: string
    level: number
    weight: number
    source: 'parent' | 'modification'
  }>
})

// Actions
const resetFilters = () => {
  filters.value = {
    search: '',
    sortBy: 'name',
    sortOrder: 'asc'
  }
}

const createTable = async () => {
  try {
    const table = await tablesStore.createTable({
      name: newTable.value.name,
      description: newTable.value.description || undefined,
      levelRange: {
        min: newTable.value.levelMin,
        max: newTable.value.levelMax
      }
    })
    showCreateModal.value = false
    newTable.value = { name: '', description: '', levelMin: 1, levelMax: 10 }
    // Navigate to editor
    router.push(`/gm/encounter-tables/${table.id}`)
  } catch (error) {
    console.error('Failed to create table:', error)
  }
}

const deleteTable = async (table: EncounterTable) => {
  if (confirm(`Delete "${table.name}"? This cannot be undone.`)) {
    await tablesStore.deleteTable(table.id)
  }
}

const generateFromTable = (table: EncounterTable) => {
  generateModal.value = {
    show: true,
    table,
    modificationId: null,
    count: 3,
    levelMin: table.levelRange.min,
    levelMax: table.levelRange.max,
    results: []
  }
}

const doGenerate = async () => {
  if (!generateModal.value.table) return

  try {
    const result = await tablesStore.generateFromTable(generateModal.value.table.id, {
      count: generateModal.value.count,
      modificationId: generateModal.value.modificationId ?? undefined,
      levelRange: generateModal.value.levelMin && generateModal.value.levelMax
        ? { min: generateModal.value.levelMin, max: generateModal.value.levelMax }
        : undefined
    })
    generateModal.value.results = result.generated
  } catch (error) {
    console.error('Failed to generate:', error)
  }
}

const rerollPokemon = async (index: number) => {
  if (!generateModal.value.table) return

  try {
    const result = await tablesStore.generateFromTable(generateModal.value.table.id, {
      count: 1,
      modificationId: generateModal.value.modificationId ?? undefined,
      levelRange: generateModal.value.levelMin && generateModal.value.levelMax
        ? { min: generateModal.value.levelMin, max: generateModal.value.levelMax }
        : undefined
    })
    if (result.generated.length > 0) {
      generateModal.value.results[index] = result.generated[0]
    }
  } catch (error) {
    console.error('Failed to reroll:', error)
  }
}

// State for adding to encounter
const addingToEncounter = ref(false)
const addToEncounterError = ref<string | null>(null)

const addToEncounter = async () => {
  if (generateModal.value.results.length === 0) {
    addToEncounterError.value = 'No Pokemon generated'
    return
  }

  if (!encounterStore.encounter) {
    addToEncounterError.value = 'No active encounter. Please create or load an encounter first from the GM page.'
    return
  }

  addingToEncounter.value = true
  addToEncounterError.value = null

  try {
    const pokemonToAdd = generateModal.value.results.map(p => ({
      speciesId: p.speciesId || '',
      speciesName: p.speciesName,
      level: p.level
    }))

    const created = await encounterStore.addWildPokemon(pokemonToAdd, 'enemies')

    // Success - close modal and show confirmation
    generateModal.value.show = false
    generateModal.value.results = []

    // Navigate to GM page to see the encounter
    router.push('/gm')
  } catch (error) {
    console.error('Failed to add to encounter:', error)
    addToEncounterError.value = error instanceof Error ? error.message : 'Failed to add Pokemon to encounter'
  } finally {
    addingToEncounter.value = false
  }
}

// Export
const exportTable = (table: EncounterTable) => {
  tablesStore.exportTable(table.id)
}

// Import
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0]
    importError.value = null
    importWarning.value = null
  }
}

const handleFileDrop = (event: DragEvent) => {
  isDragOver.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const file = event.dataTransfer.files[0]
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      selectedFile.value = file
      importError.value = null
      importWarning.value = null
    } else {
      importError.value = 'Please select a JSON file'
    }
  }
}

const closeImportModal = () => {
  showImportModal.value = false
  selectedFile.value = null
  importError.value = null
  importWarning.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const doImport = async () => {
  if (!selectedFile.value) return

  importing.value = true
  importError.value = null
  importWarning.value = null

  try {
    const text = await selectedFile.value.text()
    const jsonData = JSON.parse(text)
    const result = await tablesStore.importTable(jsonData)

    if (result.warnings) {
      importWarning.value = result.warnings
    }

    // Navigate to the imported table
    closeImportModal()
    router.push(`/gm/encounter-tables/${result.table.id}`)
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      importError.value = 'Invalid JSON file format'
    } else if (error instanceof Error) {
      importError.value = error.message
    } else {
      importError.value = 'Failed to import table'
    }
  } finally {
    importing.value = false
  }
}
</script>

<style lang="scss" scoped>
.encounter-tables {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;

    h2 {
      margin: 0;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: $glass-bg;
    backdrop-filter: $glass-blur;
    border: 1px solid $glass-border;
    border-radius: $border-radius-lg;

    .filter-group {
      flex: 1;
      min-width: 150px;
    }
  }

  &__content {
    min-height: 400px;
  }

  &__loading,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: $color-text-muted;

    p {
      margin-bottom: $spacing-md;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: $spacing-md;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: $color-bg-secondary;
  border-radius: $border-radius-lg;
  border: 1px solid $glass-border;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &--wide {
    max-width: 700px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid $glass-border;

    h3 {
      margin: 0;
      color: $color-text;
    }
  }

  &__close {
    background: none;
    border: none;
    color: $color-text-muted;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;

    &:hover {
      color: $color-text;
    }
  }

  &__body {
    padding: $spacing-lg;
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
    padding: $spacing-md $spacing-lg;
    border-top: 1px solid $glass-border;
  }
}

.form-group {
  margin-bottom: $spacing-md;
}

.form-label {
  display: block;
  margin-bottom: $spacing-xs;
  color: $color-text-muted;
  font-size: 0.875rem;
}

.form-value {
  color: $color-text;
  font-weight: 500;
}

.form-row {
  display: flex;
  gap: $spacing-md;

  .form-group {
    flex: 1;
  }
}

.level-range-inputs {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  input {
    width: 80px;
  }

  span {
    color: $color-text-muted;
  }
}

.generate-form {
  margin-bottom: $spacing-lg;
}

.generate-results {
  h4 {
    margin-bottom: $spacing-md;
    color: $color-text;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
}

.generate-result-row {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: $glass-bg;
  border-radius: $border-radius-sm;

  .result-species {
    flex: 1;
    font-weight: 500;
    color: $color-text;
  }

  .result-level {
    color: $color-primary;
    font-weight: 500;
  }

  .result-weight {
    color: $color-text-muted;
    font-size: 0.875rem;
  }
}

.btn--success {
  background: $color-success;
  color: white;

  &:hover {
    background: darken($color-success, 10%);
  }
}

.btn--ghost {
  background: transparent;
  border: 1px solid $glass-border;

  &:hover {
    background: $glass-bg;
  }
}

// Import zone styles
.import-zone {
  position: relative;
  border: 2px dashed $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &--dragover {
    border-color: $color-primary;
    background: rgba($color-primary, 0.05);
  }

  &__input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  &__content {
    pointer-events: none;
  }

  &__icon {
    display: block;
    margin-bottom: $spacing-md;
  }
}

.import-icon {
  width: 48px;
  height: 48px;
  filter: brightness(0) invert(0.5);
}

.icon-sm {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(0.7);
}

.hint-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  margin-right: 4px;
  filter: brightness(0) saturate(100%) invert(70%) sepia(50%) saturate(500%) hue-rotate(10deg);
}

.btn--icon-only:hover .icon-sm {
  filter: brightness(0) invert(1);
}

// Reopen import-zone for remaining nested styles
.import-zone {

  &__text {
    color: $color-text;
    margin: 0;
  }

  &__hint {
    color: $color-text-muted;
    font-size: 0.875rem;
    margin: $spacing-sm 0 0;
  }
}

.import-error {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-danger, 0.1);
  border: 1px solid rgba($color-danger, 0.3);
  border-radius: $border-radius-sm;
  color: $color-danger;
  font-size: 0.875rem;
}

.import-warning {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: $border-radius-sm;
  color: #ffc107;
  font-size: 0.875rem;
}

.add-error {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-danger, 0.1);
  border: 1px solid rgba($color-danger, 0.3);
  border-radius: $border-radius-sm;
  color: $color-danger;
  font-size: 0.875rem;
}

.no-encounter-hint {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-primary, 0.1);
  border: 1px solid rgba($color-primary, 0.3);
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  font-size: 0.875rem;

  .hint-link {
    color: $color-primary;
    text-decoration: underline;

    &:hover {
      color: lighten($color-primary, 10%);
    }
  }
}
</style>
