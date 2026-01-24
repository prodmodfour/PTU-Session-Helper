<template>
  <div class="modification-card">
    <div class="modification-card__header">
      <div class="mod-info">
        <h4 class="mod-name">{{ modification.name }}</h4>
        <p v-if="modification.description" class="mod-description">
          {{ modification.description }}
        </p>
      </div>
      <div class="mod-actions">
        <button
          class="btn btn--icon btn--ghost"
          @click="$emit('edit', modification)"
          title="Edit Sub-habitat"
        >
          <img src="/icons/phosphor/pencil-simple.svg" alt="Edit" class="action-icon" />
        </button>
        <button
          class="btn btn--icon btn--ghost btn--danger"
          @click="$emit('delete', modification)"
          title="Delete Sub-habitat"
        >
          <img src="/icons/phosphor/trash.svg" alt="Delete" class="action-icon" />
        </button>
      </div>
    </div>

    <div class="modification-card__meta">
      <span v-if="modification.levelRange" class="meta-item">
        <span class="meta-label">Level Override:</span>
        <span class="meta-value">{{ modification.levelRange.min }} - {{ modification.levelRange.max }}</span>
      </span>
      <span class="meta-item">
        <span class="meta-label">Changes:</span>
        <span class="meta-value">{{ modification.entries.length }}</span>
      </span>
    </div>

    <div v-if="modification.entries.length > 0" class="modification-card__changes">
      <div class="changes-header">Modifications</div>
      <div class="changes-list">
        <div
          v-for="entry in modification.entries"
          :key="entry.id"
          class="change-row"
          :class="{
            'change--remove': entry.remove,
            'change--add': isNewEntry(entry),
            'change--override': !entry.remove && !isNewEntry(entry)
          }"
        >
          <span class="change-type">
            <template v-if="entry.remove">−</template>
            <template v-else-if="isNewEntry(entry)">+</template>
            <template v-else>↔</template>
          </span>
          <span class="change-name">{{ entry.speciesName }}</span>
          <span v-if="!entry.remove" class="change-weight">
            Weight: {{ entry.weight }}
          </span>
        </div>
      </div>
    </div>

    <div class="modification-card__add">
      <button class="btn btn--secondary btn--sm" @click="showAddModal = true">
        + Add Change
      </button>
    </div>

    <!-- Add Change Modal -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal">
        <div class="modal__header">
          <h3>Add Modification Entry</h3>
          <button class="modal__close" @click="showAddModal = false">&times;</button>
        </div>
        <form @submit.prevent="addChange">
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Pokemon Species *</label>
              <PokemonSearchInput
                v-model="newChange.speciesName"
                @select="handleSpeciesSelect"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Action</label>
              <select v-model="newChange.action" class="form-select">
                <option value="override">Override Weight</option>
                <option value="remove">Remove from Table</option>
              </select>
            </div>
            <div v-if="newChange.action === 'override'" class="form-group">
              <label class="form-label">New Weight</label>
              <input
                v-model.number="newChange.weight"
                type="number"
                class="form-input"
                min="0.1"
                step="0.1"
              />
              <p class="form-hint">
                <template v-if="parentEntry">
                  Current weight in parent: {{ parentEntry.weight }}
                </template>
                <template v-else>
                  This Pokemon will be added to this sub-habitat
                </template>
              </p>
            </div>
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary" @click="showAddModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn--primary" :disabled="!newChange.speciesName">
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableModification, EncounterTableEntry, ModificationEntry } from '~/types'

const props = defineProps<{
  modification: TableModification
  parentEntries: EncounterTableEntry[]
  tableId: string
}>()

defineEmits<{
  (e: 'edit', modification: TableModification): void
  (e: 'delete', modification: TableModification): void
}>()

const tablesStore = useEncounterTablesStore()

const showAddModal = ref(false)
const newChange = ref({
  speciesName: '',
  action: 'override' as 'override' | 'remove',
  weight: 10
})

// Check if entry is new (not in parent)
const isNewEntry = (entry: ModificationEntry): boolean => {
  return !props.parentEntries.some(p => p.speciesName === entry.speciesName)
}

// Get parent entry for comparison
const parentEntry = computed(() => {
  return props.parentEntries.find(p => p.speciesName === newChange.value.speciesName)
})

const handleSpeciesSelect = (species: { id: string; name: string }) => {
  newChange.value.speciesName = species.name
  // Set default weight from parent if exists
  const parent = props.parentEntries.find(p => p.speciesName === species.name)
  if (parent) {
    newChange.value.weight = parent.weight
  }
}

const addChange = async () => {
  if (!newChange.value.speciesName) return

  try {
    await tablesStore.addModificationEntry(props.tableId, props.modification.id, {
      speciesName: newChange.value.speciesName,
      weight: newChange.value.action === 'override' ? newChange.value.weight : undefined,
      remove: newChange.value.action === 'remove'
    })
    showAddModal.value = false
    newChange.value = { speciesName: '', action: 'override', weight: 10 }
  } catch (error) {
    console.error('Failed to add change:', error)
  }
}
</script>

<style lang="scss" scoped>
.modification-card {
  background: rgba($color-bg-secondary, 0.5);
  border: 1px solid $glass-border;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-md;
  }

  &__meta {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
    font-size: 0.875rem;
  }

  &__changes {
    margin-bottom: $spacing-md;
  }

  &__add {
    display: flex;
    justify-content: center;
  }
}

.mod-info {
  flex: 1;
}

.mod-name {
  margin: 0 0 $spacing-xs;
  font-size: 1rem;
  color: $color-text;
}

.mod-description {
  margin: 0;
  font-size: 0.875rem;
  color: $color-text-muted;
}

.mod-actions {
  display: flex;
  gap: $spacing-xs;
}

.meta-item {
  display: flex;
  gap: $spacing-xs;
}

.meta-label {
  color: $color-text-muted;
}

.meta-value {
  color: $color-text;
}

.changes-header {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $color-text-muted;
  margin-bottom: $spacing-sm;
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.change-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: 0.875rem;

  &.change--remove {
    background: rgba($color-danger, 0.1);
    .change-type { color: $color-danger; }
  }

  &.change--add {
    background: rgba($color-success, 0.1);
    .change-type { color: $color-success; }
  }

  &.change--override {
    background: rgba($color-warning, 0.1);
    .change-type { color: $color-warning; }
  }
}

.change-type {
  font-weight: bold;
  width: 16px;
  text-align: center;
}

.change-name {
  flex: 1;
  color: $color-text;
}

.change-weight {
  color: $color-text-muted;
  font-size: 0.75rem;
}

.btn--icon {
  width: 28px;
  height: 28px;
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

.btn--ghost:hover .action-icon {
  filter: brightness(0) invert(1);
}

.btn--danger:hover .action-icon {
  filter: brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(340deg);
}

// Modal styles
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
  max-width: 450px;
  max-height: 90vh;
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid $glass-border;

    h3 {
      margin: 0;
      color: $color-text;
      font-size: 1rem;
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
</style>
