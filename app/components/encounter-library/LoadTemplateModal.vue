<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal--wide">
      <div class="modal__header">
        <h2>Load from Template</h2>
        <button class="modal__close" @click="$emit('close')">×</button>
      </div>

      <div class="modal__body">
        <!-- Filters -->
        <div class="filters">
          <div class="filter-search">
            <input
              v-model="searchQuery"
              type="text"
              class="form-input"
              placeholder="Search templates..."
            />
          </div>
          <select v-model="selectedCategory" class="form-select">
            <option :value="null">All Categories</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <!-- Template List -->
        <div v-if="loading" class="loading-state">
          Loading templates...
        </div>

        <div v-else-if="filteredTemplates.length === 0" class="empty-state">
          <p v-if="templates.length === 0">
            No templates available. Create one by saving an encounter!
          </p>
          <p v-else>
            No templates match your search.
          </p>
        </div>

        <div v-else class="template-list">
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            class="template-item"
            :class="{ 'template-item--selected': selectedTemplateId === template.id }"
            @click="selectedTemplateId = template.id"
          >
            <div class="template-item__main">
              <h4>{{ template.name }}</h4>
              <p v-if="template.description" class="template-item__description">
                {{ template.description }}
              </p>
            </div>
            <div class="template-item__meta">
              <span class="meta-badge battle-type" :class="`battle-type--${template.battleType}`">
                {{ formatBattleType(template.battleType) }}
              </span>
              <span class="meta-badge">
                {{ template.combatants.length }} combatants
              </span>
              <span v-if="template.gridConfig" class="meta-badge">
                {{ template.gridConfig.width }}x{{ template.gridConfig.height }} grid
              </span>
            </div>
            <div v-if="template.tags.length > 0" class="template-item__tags">
              <span v-for="tag in template.tags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <!-- Selected Template Preview -->
        <div v-if="selectedTemplate" class="preview-section">
          <h4>Combatants Preview</h4>
          <div class="combatants-preview">
            <div
              v-for="(combatant, idx) in selectedTemplate.combatants"
              :key="idx"
              class="combatant-preview"
            >
              <span class="side-dot" :class="getSideClass(combatant.side)"></span>
              <span class="combatant-name">{{ getCombatantName(combatant) }}</span>
              <span class="combatant-type">{{ combatant.type }}</span>
            </div>
            <p v-if="selectedTemplate.combatants.length === 0" class="no-combatants">
              No combatants in this template
            </p>
          </div>
        </div>

        <!-- Encounter Name Input -->
        <div v-if="selectedTemplateId" class="encounter-name-section">
          <label for="encounter-name">Encounter Name *</label>
          <input
            id="encounter-name"
            v-model="encounterName"
            type="text"
            class="form-input"
            :placeholder="selectedTemplate?.name || 'New Encounter'"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div class="modal__footer">
        <NuxtLink to="/gm/encounters" class="btn btn--ghost">
          Browse Library
        </NuxtLink>
        <div class="footer-actions">
          <button class="btn btn--secondary" @click="$emit('close')">
            Cancel
          </button>
          <button
            class="btn btn--primary"
            :disabled="!selectedTemplateId || !encounterName.trim() || loadingCreate"
            @click="handleLoad"
          >
            {{ loadingCreate ? 'Creating...' : 'Create Encounter' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEncounterLibraryStore, type TemplateCombatant } from '~/stores/encounterLibrary'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'load', data: { templateId: string; encounterName: string }): void
}>()

const libraryStore = useEncounterLibraryStore()

const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const selectedTemplateId = ref<string | null>(null)
const encounterName = ref('')
const loadingCreate = ref(false)
const error = ref<string | null>(null)

const loading = computed(() => libraryStore.loading)
const templates = computed(() => libraryStore.templates)
const categories = computed(() => libraryStore.categories)

const filteredTemplates = computed(() => {
  let result = [...templates.value]

  // Filter by category
  if (selectedCategory.value) {
    result = result.filter(t => t.category === selectedCategory.value)
  }

  // Filter by search
  if (searchQuery.value.trim()) {
    const search = searchQuery.value.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(search) ||
      t.description?.toLowerCase().includes(search) ||
      t.tags.some(tag => tag.toLowerCase().includes(search))
    )
  }

  return result
})

const selectedTemplate = computed(() => {
  if (!selectedTemplateId.value) return null
  return templates.value.find(t => t.id === selectedTemplateId.value)
})

// Auto-fill encounter name when template is selected
watch(selectedTemplateId, (id) => {
  if (id) {
    const template = templates.value.find(t => t.id === id)
    if (template && !encounterName.value) {
      encounterName.value = template.name
    }
  }
})

const formatBattleType = (type: string): string => {
  const types: Record<string, string> = {
    trainer: 'Trainer',
    full_contact: 'Full Contact',
    'full-contact': 'Full Contact' // Legacy compatibility
  }
  return types[type] || type
}

const getSideClass = (side: string): string => {
  return `side-dot--${side}`
}

const getCombatantName = (combatant: TemplateCombatant): string => {
  if (!combatant.entityData) return 'Unknown'

  if (combatant.type === 'pokemon') {
    const data = combatant.entityData as { species: string; nickname?: string | null }
    return data.nickname || data.species
  } else {
    const data = combatant.entityData as { name: string }
    return data.name
  }
}

const handleLoad = () => {
  if (!selectedTemplateId.value || !encounterName.value.trim()) return

  error.value = null
  loadingCreate.value = true

  emit('load', {
    templateId: selectedTemplateId.value,
    encounterName: encounterName.value.trim()
  })
}

// Fetch templates on mount
onMounted(() => {
  libraryStore.fetchTemplates()
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: $color-bg-secondary;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
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
    padding: $spacing-lg;
    border-bottom: 1px solid $glass-border;

    h2 {
      margin: 0;
      font-size: 1.25rem;
    }
  }

  &__close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: $color-text-muted;
    padding: $spacing-xs;
    line-height: 1;

    &:hover {
      color: $color-text;
    }
  }

  &__body {
    padding: $spacing-lg;
    overflow-y: auto;
    flex: 1;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    border-top: 1px solid $glass-border;
    background: $color-bg-tertiary;
  }
}

.footer-actions {
  display: flex;
  gap: $spacing-md;
}

.filters {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  .filter-search {
    flex: 1;
  }

  .form-select {
    width: auto;
    min-width: 150px;
  }
}

.loading-state,
.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: $color-text-muted;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: $spacing-lg;
}

.template-item {
  background: $glass-bg;
  border: 2px solid $glass-border;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-primary;
  }

  &--selected {
    border-color: $color-accent-teal;
    background: rgba($color-accent-teal, 0.1);
  }

  &__main {
    h4 {
      margin: 0 0 $spacing-xs;
      font-size: 1rem;
    }
  }

  &__description {
    margin: 0 0 $spacing-sm;
    font-size: 0.875rem;
    color: $color-text-muted;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-bottom: $spacing-sm;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }
}

.meta-badge {
  padding: 2px 8px;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  font-size: 0.75rem;
}

.battle-type {
  &--trainer {
    background: rgba($color-primary, 0.2);
    color: $color-primary;
  }

  &--full_contact,
  &--full-contact {
    background: rgba(244, 67, 54, 0.2);
    color: #ef5350;
  }
}

.tag {
  padding: 2px 6px;
  background: rgba($color-accent-teal, 0.2);
  border-radius: $border-radius-sm;
  font-size: 0.7rem;
  color: $color-accent-teal;
}

.preview-section {
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;

  h4 {
    margin: 0 0 $spacing-sm;
    font-size: 0.875rem;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.combatants-preview {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  max-height: 150px;
  overflow-y: auto;
}

.combatant-preview {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: 0.875rem;
  padding: $spacing-xs;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
}

.side-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #888;

  &--player {
    background: #22c55e;
    box-shadow: 0 0 4px rgba(#22c55e, 0.5);
  }

  &--ally {
    background: #3b82f6;
    box-shadow: 0 0 4px rgba(#3b82f6, 0.5);
  }

  &--enemy {
    background: #ef4444;
    box-shadow: 0 0 4px rgba(#ef4444, 0.5);
  }
}

.combatant-name {
  flex: 1;
}

.combatant-type {
  font-size: 0.75rem;
  color: $color-text-muted;
  text-transform: capitalize;
}

.no-combatants {
  color: $color-text-muted;
  font-size: 0.875rem;
  font-style: italic;
}

.encounter-name-section {
  margin-bottom: $spacing-md;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: 500;
    font-size: 0.875rem;
  }
}

.error-message {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-danger, 0.1);
  border: 1px solid $color-danger;
  border-radius: $border-radius-sm;
  color: $color-danger;
  font-size: 0.875rem;
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
</style>
