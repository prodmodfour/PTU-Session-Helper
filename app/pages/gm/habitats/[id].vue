<template>
  <div class="table-editor">
    <div class="table-editor__header">
      <NuxtLink to="/gm/habitats" class="btn btn--secondary btn--sm">
        ← Back to Habitats
      </NuxtLink>
      <h2 v-if="table">{{ table.name }}</h2>
      <div class="table-editor__actions" v-if="table">
        <button class="btn btn--secondary btn--with-icon" @click="showSettingsModal = true">
          <img src="/icons/phosphor/gear.svg" alt="" class="btn-icon" />
          Settings
        </button>
        <button class="btn btn--primary btn--with-icon" @click="showGenerateModal = true">
          <img src="/icons/phosphor/dice-five.svg" alt="" class="btn-icon" />
          Generate
        </button>
        <button class="btn btn--danger btn--with-icon" @click="confirmDelete">
          <img src="/icons/phosphor/trash.svg" alt="" class="btn-icon" />
          Delete
        </button>
      </div>
    </div>

    <div v-if="loading" class="table-editor__loading">
      Loading...
    </div>

    <div v-else-if="!table" class="table-editor__not-found">
      <p>Table not found</p>
      <NuxtLink to="/gm/habitats" class="btn btn--primary">
        Back to Habitats
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Table Info -->
      <div class="table-info">
        <div class="info-row">
          <span class="info-label">Description:</span>
          <span class="info-value">{{ table.description || 'No description' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Level Range:</span>
          <span class="info-value">{{ table.levelRange.min }} - {{ table.levelRange.max }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Population Density:</span>
          <span class="info-value">
            <span class="density-badge" :class="`density--${table.density}`">
              {{ getDensityLabel(table.density) }}
            </span>
            <span class="spawn-preview">Spawns {{ getSpawnRange(table.density) }} Pokemon</span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Total Weight:</span>
          <span class="info-value">{{ totalWeight }}</span>
        </div>
      </div>

      <div class="table-editor__content">
        <!-- Entries Section -->
        <section class="editor-section">
          <div class="section-header">
            <h3>Pokemon Entries ({{ table.entries.length }})</h3>
            <button class="btn btn--primary btn--sm" @click="showAddEntryModal = true">
              + Add Pokemon
            </button>
          </div>

          <div v-if="table.entries.length === 0" class="section-empty">
            <p>No Pokemon in this table yet</p>
            <button class="btn btn--primary" @click="showAddEntryModal = true">
              Add your first Pokemon
            </button>
          </div>

          <div v-else class="entries-list">
            <div class="entries-header">
              <span class="col-name">Pokemon</span>
              <span class="col-weight">Weight</span>
              <span class="col-chance">Chance</span>
              <span class="col-level">Level Range</span>
              <span class="col-actions">Actions</span>
            </div>
            <EntryRow
              v-for="entry in sortedEntries"
              :key="entry.id"
              :entry="entry"
              :total-weight="totalWeight"
              :table-level-range="table.levelRange"
              @remove="removeEntry"
              @update-weight="updateEntryWeight"
              @update-level-range="updateEntryLevelRange"
            />
          </div>
        </section>

        <!-- Modifications Section -->
        <section class="editor-section">
          <div class="section-header">
            <h3>Sub-habitats ({{ table.modifications.length }})</h3>
            <button class="btn btn--primary btn--sm" @click="showAddModModal = true">
              + Add Sub-habitat
            </button>
          </div>

          <div v-if="table.modifications.length === 0" class="section-empty">
            <p>No sub-habitats defined</p>
            <p class="section-hint">
              Sub-habitats let you create variations of this table (e.g., "Deep Forest" as a variant of "Forest")
            </p>
          </div>

          <div v-else class="modifications-list">
            <ModificationCard
              v-for="mod in table.modifications"
              :key="mod.id"
              :modification="mod"
              :parent-entries="table.entries"
              :table-id="table.id"
              :parent-density="table.density"
              @edit="editModification"
              @delete="deleteModification"
            />
          </div>
        </section>
      </div>
    </template>

    <!-- Add Entry Modal -->
    <div v-if="showAddEntryModal" class="modal-overlay" @click.self="showAddEntryModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Add Pokemon</h3>
          <button class="modal__close" @click="showAddEntryModal = false">&times;</button>
        </div>
        <form @submit.prevent="addEntry">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Pokemon Species *</label>
              <PokemonSearchInput
                v-model="newEntry.speciesName"
                @select="handleSpeciesSelect"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Rarity</label>
              <select v-model="newEntry.rarity" class="form-select">
                <option value="common">Common (Weight: 10)</option>
                <option value="uncommon">Uncommon (Weight: 5)</option>
                <option value="rare">Rare (Weight: 3)</option>
                <option value="very-rare">Very Rare (Weight: 1)</option>
                <option value="legendary">Legendary (Weight: 0.1)</option>
                <option value="custom">Custom Weight</option>
              </select>
            </div>
            <div v-if="newEntry.rarity === 'custom'" class="form-group">
              <label class="form-label">Custom Weight</label>
              <input
                v-model.number="newEntry.customWeight"
                type="number"
                class="form-input"
                min="0.1"
                step="0.1"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Level Range Override (optional)</label>
              <div class="level-range-inputs">
                <input
                  v-model.number="newEntry.levelMin"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  v-model.number="newEntry.levelMax"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Max"
                />
              </div>
              <p class="form-hint">Leave blank to use table's default range</p>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="showAddEntryModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary" :disabled="!newEntry.speciesId">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add Modification Modal -->
    <div v-if="showAddModModal" class="modal-overlay" @click.self="showAddModModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Create Sub-habitat</h3>
          <button class="modal__close" @click="showAddModModal = false">&times;</button>
        </div>
        <form @submit.prevent="addModification">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Name *</label>
              <input
                v-model="newMod.name"
                type="text"
                class="form-input"
                placeholder="e.g., Deep Canopy"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="newMod.description"
                class="form-input"
                rows="2"
                placeholder="Describe this sub-habitat..."
              ></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Level Range Override (optional)</label>
              <div class="level-range-inputs">
                <input
                  v-model.number="newMod.levelMin"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  v-model.number="newMod.levelMax"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="showAddModModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary" :disabled="!newMod.name">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Modification Modal -->
    <div v-if="showEditModModal" class="modal-overlay" @click.self="showEditModModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Edit Sub-habitat</h3>
          <button class="modal__close" @click="showEditModModal = false">&times;</button>
        </div>
        <form @submit.prevent="saveModification">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Name *</label>
              <input
                v-model="editMod.name"
                type="text"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="editMod.description"
                class="form-input"
                rows="2"
                placeholder="Describe this sub-habitat..."
              ></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Level Range Override (optional)</label>
              <div class="level-range-inputs">
                <input
                  v-model.number="editMod.levelMin"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  v-model.number="editMod.levelMax"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="showEditModModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary" :disabled="!editMod.name">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal && table" class="modal-overlay" @click.self="showSettingsModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Table Settings</h3>
          <button class="modal__close" @click="showSettingsModal = false">&times;</button>
        </div>
        <form @submit.prevent="saveSettings">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input
                v-model="editSettings.name"
                type="text"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="editSettings.description"
                class="form-input"
                rows="3"
              ></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Min Level</label>
                <input
                  v-model.number="editSettings.levelMin"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Max Level</label>
                <input
                  v-model.number="editSettings.levelMax"
                  type="number"
                  class="form-input"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Population Density</label>
              <select v-model="editSettings.density" class="form-select">
                <option value="sparse">Sparse (1-2 Pokemon)</option>
                <option value="moderate">Moderate (2-4 Pokemon)</option>
                <option value="dense">Dense (4-6 Pokemon)</option>
                <option value="abundant">Abundant (6-8 Pokemon)</option>
              </select>
              <p class="form-hint">
                Controls how many Pokemon spawn when generating encounters
              </p>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="showSettingsModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Generate Modal -->
    <GenerateEncounterModal
      v-if="showGenerateModal && table"
      :table="table"
      :has-active-encounter="!!encounterStore.encounter"
      :add-error="addError"
      :adding-to-encounter="addingToEncounter"
      @close="showGenerateModal = false; addError = null"
      @add-to-encounter="handleAddToEncounter"
    />

    <!-- Delete Confirmation -->
    <ConfirmModal
      v-if="showDeleteModal"
      title="Delete Encounter Table"
      :message="`Are you sure you want to delete '${table?.name}'? This will also delete all modifications and entries.`"
      confirm-text="Delete"
      confirm-class="btn--danger"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { EncounterTable, EncounterTableEntry, TableModification, RarityPreset, LevelRange, DensityTier } from '~/types'
import { RARITY_WEIGHTS, DENSITY_RANGES } from '~/types'

definePageMeta({
  layout: 'gm'
})

const route = useRoute()
const router = useRouter()
const tablesStore = useEncounterTablesStore()
const encounterStore = useEncounterStore()

const tableId = computed(() => route.params.id as string)
const table = ref<EncounterTable | null>(null)
const loading = ref(true)

// Modals
const showAddEntryModal = ref(false)
const showAddModModal = ref(false)
const showSettingsModal = ref(false)
const showEditModModal = ref(false)
const showGenerateModal = ref(false)
const showDeleteModal = ref(false)

// Add to encounter state
const addingToEncounter = ref(false)
const addError = ref<string | null>(null)

// New entry form
const newEntry = ref({
  speciesId: '',
  speciesName: '',
  rarity: 'common' as RarityPreset | 'custom',
  customWeight: 10,
  levelMin: null as number | null,
  levelMax: null as number | null
})

// New modification form
const newMod = ref({
  name: '',
  description: '',
  levelMin: null as number | null,
  levelMax: null as number | null
})

// Edit modification form
const editMod = ref({
  id: '',
  name: '',
  description: '',
  levelMin: null as number | null,
  levelMax: null as number | null
})

// Edit settings form
const editSettings = ref({
  name: '',
  description: '',
  levelMin: 1,
  levelMax: 10,
  density: 'moderate' as DensityTier
})

// Load table
onMounted(async () => {
  loading.value = true
  const loaded = await tablesStore.loadTable(tableId.value)
  if (loaded) {
    table.value = loaded
    updateEditSettings()
  }
  loading.value = false
})

useHead({
  title: computed(() => table.value ? `GM - ${table.value.name}` : 'GM - Encounter Table')
})

// Computed
const totalWeight = computed(() => {
  if (!table.value) return 0
  return table.value.entries.reduce((sum, e) => sum + e.weight, 0)
})

const sortedEntries = computed(() => {
  if (!table.value) return []
  return [...table.value.entries].sort((a, b) => b.weight - a.weight)
})

// Helper functions for density display
const getDensityLabel = (density: DensityTier): string => {
  return density.charAt(0).toUpperCase() + density.slice(1)
}

const getSpawnRange = (density: DensityTier): string => {
  const range = DENSITY_RANGES[density]
  return `${range.min}-${range.max}`
}

// Methods
const updateEditSettings = () => {
  if (table.value) {
    editSettings.value = {
      name: table.value.name,
      description: table.value.description || '',
      levelMin: table.value.levelRange.min,
      levelMax: table.value.levelRange.max,
      density: table.value.density
    }
  }
}

const handleSpeciesSelect = (species: { id: string; name: string }) => {
  newEntry.value.speciesId = species.id
  newEntry.value.speciesName = species.name
}

const getWeight = (): number => {
  if (newEntry.value.rarity === 'custom') {
    return newEntry.value.customWeight
  }
  return RARITY_WEIGHTS[newEntry.value.rarity as RarityPreset]
}

const addEntry = async () => {
  if (!table.value || !newEntry.value.speciesId) return

  try {
    await tablesStore.addEntry(table.value.id, {
      speciesId: newEntry.value.speciesId,
      weight: getWeight(),
      levelRange: newEntry.value.levelMin && newEntry.value.levelMax
        ? { min: newEntry.value.levelMin, max: newEntry.value.levelMax }
        : undefined
    })
    // Refresh table
    table.value = await tablesStore.loadTable(tableId.value)
    showAddEntryModal.value = false
    newEntry.value = {
      speciesId: '',
      speciesName: '',
      rarity: 'common',
      customWeight: 10,
      levelMin: null,
      levelMax: null
    }
  } catch (error) {
    console.error('Failed to add entry:', error)
  }
}

const removeEntry = async (entry: EncounterTableEntry) => {
  if (!table.value) return
  if (confirm(`Remove ${entry.speciesName} from this table?`)) {
    await tablesStore.removeEntry(table.value.id, entry.id)
    table.value = await tablesStore.loadTable(tableId.value)
  }
}

const updateEntryWeight = async (entry: EncounterTableEntry, newWeight: number) => {
  if (!table.value) return
  try {
    await tablesStore.updateEntry(table.value.id, entry.id, { weight: newWeight })
  } catch (error) {
    console.error('Failed to update weight:', error)
  }
}

const updateEntryLevelRange = async (entry: EncounterTableEntry, levelRange: LevelRange | null) => {
  if (!table.value) return
  try {
    await tablesStore.updateEntry(table.value.id, entry.id, { levelRange: levelRange ?? undefined })
    table.value = await tablesStore.loadTable(tableId.value)
  } catch (error) {
    console.error('Failed to update level range:', error)
  }
}

const addModification = async () => {
  if (!table.value || !newMod.value.name) return

  try {
    await tablesStore.createModification(table.value.id, {
      name: newMod.value.name,
      description: newMod.value.description || undefined,
      levelRange: newMod.value.levelMin && newMod.value.levelMax
        ? { min: newMod.value.levelMin, max: newMod.value.levelMax }
        : undefined
    })
    table.value = await tablesStore.loadTable(tableId.value)
    showAddModModal.value = false
    newMod.value = { name: '', description: '', levelMin: null, levelMax: null }
  } catch (error) {
    console.error('Failed to create modification:', error)
  }
}

const editModification = (mod: TableModification) => {
  editMod.value = {
    id: mod.id,
    name: mod.name,
    description: mod.description || '',
    levelMin: mod.levelRange?.min ?? null,
    levelMax: mod.levelRange?.max ?? null
  }
  showEditModModal.value = true
}

const saveModification = async () => {
  if (!table.value || !editMod.value.id || !editMod.value.name) return

  try {
    await tablesStore.updateModification(table.value.id, editMod.value.id, {
      name: editMod.value.name,
      description: editMod.value.description || undefined,
      levelRange: editMod.value.levelMin && editMod.value.levelMax
        ? { min: editMod.value.levelMin, max: editMod.value.levelMax }
        : undefined
    })
    table.value = await tablesStore.loadTable(tableId.value)
    showEditModModal.value = false
    editMod.value = { id: '', name: '', description: '', levelMin: null, levelMax: null }
  } catch (error) {
    console.error('Failed to update modification:', error)
  }
}

const deleteModification = async (mod: TableModification) => {
  if (!table.value) return
  if (confirm(`Delete sub-habitat "${mod.name}"?`)) {
    await tablesStore.deleteModification(table.value.id, mod.id)
    table.value = await tablesStore.loadTable(tableId.value)
  }
}

const saveSettings = async () => {
  if (!table.value) return

  try {
    await tablesStore.updateTable(table.value.id, {
      name: editSettings.value.name,
      description: editSettings.value.description || undefined,
      levelRange: {
        min: editSettings.value.levelMin,
        max: editSettings.value.levelMax
      },
      density: editSettings.value.density
    })
    table.value = await tablesStore.loadTable(tableId.value)
    showSettingsModal.value = false
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

const confirmDelete = () => {
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!table.value) return
  await tablesStore.deleteTable(table.value.id)
  router.push('/gm/habitats')
}

const handleAddToEncounter = async (pokemon: Array<{ speciesId: string; speciesName: string; level: number }>) => {
  if (!encounterStore.encounter) {
    addError.value = 'No active encounter. Create or load an encounter first.'
    return
  }

  addingToEncounter.value = true
  addError.value = null

  try {
    await encounterStore.addWildPokemon(pokemon, 'enemies')
    showGenerateModal.value = false
    router.push('/gm')
  } catch (e: unknown) {
    addError.value = e instanceof Error ? e.message : 'Failed to add Pokemon to encounter'
  } finally {
    addingToEncounter.value = false
  }
}
</script>

<style lang="scss" scoped>
.table-editor {
  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    h2 {
      flex: 1;
      margin: 0;
      color: $color-text;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.btn--with-icon {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
}

.btn-icon {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.table-editor__loading,
.table-editor__not-found {
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

.table-editor__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.table-info {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;
}

.info-row {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-xs 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba($glass-border, 0.5);
  }
}

.info-label {
  color: $color-text-muted;
  min-width: 120px;
}

.info-value {
  color: $color-text;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.density-badge {
  padding: 2px 8px;
  border-radius: $border-radius-sm;
  font-size: 0.75rem;
  font-weight: 500;

  &.density--sparse {
    background: rgba(158, 158, 158, 0.2);
    color: #bdbdbd;
  }

  &.density--moderate {
    background: rgba(33, 150, 243, 0.2);
    color: #64b5f6;
  }

  &.density--dense {
    background: rgba(255, 152, 0, 0.2);
    color: #ffb74d;
  }

  &.density--abundant {
    background: rgba(244, 67, 54, 0.2);
    color: #ef5350;
  }
}

.spawn-preview {
  font-size: 0.75rem;
  color: $color-text-muted;
}

.editor-section {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-md;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $glass-border;

  h3 {
    margin: 0;
    color: $color-text;
  }
}

.section-empty {
  text-align: center;
  padding: $spacing-xl;
  color: $color-text-muted;

  p {
    margin-bottom: $spacing-md;
  }
}

.section-hint {
  font-size: 0.875rem;
  color: $color-text-muted;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.entries-header {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $color-text-muted;
  border-bottom: 1px solid $glass-border;
}

.modifications-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

// Modal styles (shared)
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

.form-hint {
  margin-top: $spacing-xs;
  font-size: 0.75rem;
  color: $color-text-muted;
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
</style>
