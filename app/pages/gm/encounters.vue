<template>
  <div class="encounter-library">
    <div class="page-header">
      <div class="page-header__title">
        <h1>Encounter Library</h1>
        <span class="template-count">{{ libraryStore.templateCount }} templates</span>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--primary" @click="showCreateModal = true">
          + New Template
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search templates..."
          class="search-input"
          @input="handleSearch"
        />
      </div>

      <div class="filter-group">
        <select v-model="selectedCategory" class="category-select" @change="handleCategoryChange">
          <option :value="null">All Categories</option>
          <option v-for="cat in libraryStore.categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="sortBy" class="sort-select" @change="handleSortChange">
          <option value="updatedAt">Recently Updated</option>
          <option value="createdAt">Recently Created</option>
          <option value="name">Name</option>
        </select>
        <button
          class="btn btn--icon btn--ghost"
          @click="libraryStore.toggleSortOrder()"
          :title="libraryStore.filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'"
        >
          {{ libraryStore.filters.sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="libraryStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading templates...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="libraryStore.error" class="error-state">
      <p>{{ libraryStore.error }}</p>
      <button class="btn btn--primary" @click="libraryStore.fetchTemplates()">
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="libraryStore.filteredTemplates.length === 0" class="empty-state">
      <div class="empty-icon">
        <img src="/icons/phosphor/folder.svg" alt="" class="empty-icon__svg" />
      </div>
      <h3>No Templates Found</h3>
      <p v-if="searchQuery || selectedCategory">
        No templates match your search criteria.
      </p>
      <p v-else>
        Create your first encounter template to get started.
      </p>
      <button class="btn btn--primary" @click="showCreateModal = true">
        + Create Template
      </button>
    </div>

    <!-- Template Grid -->
    <div v-else class="template-grid">
      <TemplateCard
        v-for="template in libraryStore.filteredTemplates"
        :key="template.id"
        :template="template"
        :is-selected="template.id === libraryStore.selectedTemplateId"
        @load="handleLoad"
        @edit="handleEdit"
        @delete="handleDelete"
        @duplicate="handleDuplicate"
      />
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <div class="modal__header">
          <h2>{{ showEditModal ? 'Edit Template' : 'Create Template' }}</h2>
          <button class="btn btn--icon btn--ghost" @click="closeModals">×</button>
        </div>

        <div class="modal__body">
          <div class="form-group">
            <label>Name *</label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Enter template name"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea
              v-model="formData.description"
              placeholder="Enter description (optional)"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Battle Type</label>
              <select v-model="formData.battleType" class="form-select">
                <option value="trainer">Trainer Battle</option>
                <option value="full_contact">Full Contact</option>
              </select>
            </div>

            <div class="form-group">
              <label>Category</label>
              <input
                v-model="formData.category"
                type="text"
                placeholder="e.g., Boss Fights"
                class="form-input"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                <option v-for="cat in libraryStore.categories" :key="cat" :value="cat" />
              </datalist>
            </div>
          </div>

          <div class="form-group">
            <label>Tags (comma-separated)</label>
            <input
              v-model="tagsInput"
              type="text"
              placeholder="e.g., gym, leader, fire"
              class="form-input"
            />
          </div>
        </div>

        <div class="modal__footer">
          <button class="btn btn--ghost" @click="closeModals">Cancel</button>
          <button
            class="btn btn--primary"
            :disabled="!formData.name"
            @click="submitForm"
          >
            {{ showEditModal ? 'Save Changes' : 'Create Template' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Load Template Modal -->
    <div v-if="showLoadModal && templateToLoad" class="modal-overlay" @click.self="showLoadModal = false">
      <div class="modal">
        <div class="modal__header">
          <h2>Load Template</h2>
          <button class="btn btn--icon btn--ghost" @click="showLoadModal = false">×</button>
        </div>

        <div class="modal__body">
          <p>Load "<strong>{{ templateToLoad.name }}</strong>" into a new encounter?</p>
          <p class="text-muted">This will create a new encounter with {{ templateToLoad.combatants.length }} combatants.</p>
        </div>

        <div class="modal__footer">
          <button class="btn btn--ghost" @click="showLoadModal = false">Cancel</button>
          <button class="btn btn--primary" @click="confirmLoad">
            Load Template
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal && templateToDelete" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal">
        <div class="modal__header">
          <h2>Delete Template</h2>
          <button class="btn btn--icon btn--ghost" @click="showDeleteModal = false">×</button>
        </div>

        <div class="modal__body">
          <p>Are you sure you want to delete "<strong>{{ templateToDelete.name }}</strong>"?</p>
          <p class="text-danger">This action cannot be undone.</p>
        </div>

        <div class="modal__footer">
          <button class="btn btn--ghost" @click="showDeleteModal = false">Cancel</button>
          <button class="btn btn--danger" @click="confirmDelete">
            Delete Template
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'gm'
})

import { useEncounterLibraryStore, type EncounterTemplate } from '~/stores/encounterLibrary'
import TemplateCard from '~/components/encounter-library/TemplateCard.vue'

const libraryStore = useEncounterLibraryStore()
const router = useRouter()

// Search and filters
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const sortBy = ref<'name' | 'createdAt' | 'updatedAt'>('updatedAt')

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showLoadModal = ref(false)
const showDeleteModal = ref(false)

// Form data
const formData = ref({
  name: '',
  description: '',
  battleType: 'trainer' as 'trainer' | 'full_contact',
  category: ''
})
const tagsInput = ref('')
const editingTemplateId = ref<string | null>(null)

// Template action targets
const templateToLoad = ref<EncounterTemplate | null>(null)
const templateToDelete = ref<EncounterTemplate | null>(null)

// Fetch templates on mount
onMounted(() => {
  libraryStore.fetchTemplates()
})

// Handlers
const handleSearch = () => {
  libraryStore.setSearch(searchQuery.value)
}

const handleCategoryChange = () => {
  libraryStore.setCategory(selectedCategory.value)
}

const handleSortChange = () => {
  libraryStore.setSortBy(sortBy.value)
}

const handleLoad = (template: EncounterTemplate) => {
  templateToLoad.value = template
  showLoadModal.value = true
}

const handleEdit = (template: EncounterTemplate) => {
  editingTemplateId.value = template.id
  formData.value = {
    name: template.name,
    description: template.description || '',
    battleType: template.battleType as 'trainer' | 'full_contact',
    category: template.category || ''
  }
  tagsInput.value = template.tags.join(', ')
  showEditModal.value = true
}

const handleDelete = (template: EncounterTemplate) => {
  templateToDelete.value = template
  showDeleteModal.value = true
}

const handleDuplicate = async (template: EncounterTemplate) => {
  await libraryStore.duplicateTemplate(template.id)
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingTemplateId.value = null
  formData.value = {
    name: '',
    description: '',
    battleType: 'trainer',
    category: ''
  }
  tagsInput.value = ''
}

const submitForm = async () => {
  const tags = tagsInput.value
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)

  if (showEditModal.value && editingTemplateId.value) {
    await libraryStore.updateTemplate(editingTemplateId.value, {
      name: formData.value.name,
      description: formData.value.description || null,
      battleType: formData.value.battleType,
      category: formData.value.category || null,
      tags
    })
  } else {
    await libraryStore.createTemplate({
      name: formData.value.name,
      description: formData.value.description || undefined,
      battleType: formData.value.battleType,
      category: formData.value.category || undefined,
      tags
    })
  }

  closeModals()
}

const confirmLoad = async () => {
  if (!templateToLoad.value) return

  // TODO: Implement encounter creation from template
  // For now, navigate to GM page with template ID
  router.push(`/gm?loadTemplate=${templateToLoad.value.id}`)
  showLoadModal.value = false
  templateToLoad.value = null
}

const confirmDelete = async () => {
  if (!templateToDelete.value) return

  await libraryStore.deleteTemplate(templateToDelete.value.id)
  showDeleteModal.value = false
  templateToDelete.value = null
}
</script>

<style lang="scss" scoped>
.encounter-library {
  padding: $spacing-lg;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;

  &__title {
    display: flex;
    align-items: baseline;
    gap: $spacing-md;

    h1 {
      margin: 0;
      font-size: 1.75rem;
      color: $color-text;
    }
  }
}

.template-count {
  font-size: 0.875rem;
  color: $color-text-muted;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border-radius: $border-radius-md;
  border: 1px solid $glass-border;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

.search-input {
  width: 300px;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: 0.875rem;

  &::placeholder {
    color: $color-text-muted;
  }

  &:focus {
    outline: none;
    border-color: $color-primary;
  }
}

.category-select,
.sort-select {
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $color-primary;
  }
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $spacing-lg;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xxl;
  text-align: center;
  color: $color-text-muted;
}

.empty-icon {
  margin-bottom: $spacing-md;

  &__svg {
    width: 64px;
    height: 64px;
    filter: brightness(0) invert(0.5);
  }
}

.empty-state h3 {
  margin: 0 0 $spacing-sm;
  color: $color-text;
}

.empty-state p {
  margin: 0 0 $spacing-lg;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $glass-border;
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: $spacing-md;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-overlay {
  @include modal-overlay-base;
}

.modal {
  background: $color-bg-primary;
  border-radius: $border-radius-lg;
  border: 1px solid $glass-border;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid $glass-border;

    h2 {
      margin: 0;
      font-size: 1.25rem;
      color: $color-text;
    }
  }

  &__body {
    padding: $spacing-lg;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-md;
    padding: $spacing-md $spacing-lg;
    border-top: 1px solid $glass-border;
  }
}

.form-group {
  margin-bottom: $spacing-md;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-size: 0.875rem;
    color: $color-text-muted;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: 0.875rem;

  &::placeholder {
    color: $color-text-muted;
  }

  &:focus {
    outline: none;
    border-color: $color-primary;
  }
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.text-muted {
  color: $color-text-muted;
  font-size: 0.875rem;
}

.text-danger {
  color: $color-danger;
  font-size: 0.875rem;
}

.btn {
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-sm;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1px solid transparent;

  &--primary {
    background: $color-primary;
    color: white;

    &:hover {
      background: darken($color-primary, 10%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--ghost {
    background: transparent;
    color: $color-text;
    border-color: $glass-border;

    &:hover {
      background: $glass-bg;
    }
  }

  &--danger {
    background: $color-danger;
    color: white;

    &:hover {
      background: darken($color-danger, 10%);
    }
  }

  &--icon {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
