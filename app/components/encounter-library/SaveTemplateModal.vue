<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h2>Save as Template</h2>
        <button class="modal__close" @click="$emit('close')">×</button>
      </div>

      <div class="modal__body">
        <p class="modal__description">
          Save the current encounter setup as a reusable template.
        </p>

        <div class="form-group">
          <label for="template-name">Template Name *</label>
          <input
            id="template-name"
            v-model="form.name"
            type="text"
            class="form-input"
            placeholder="e.g., Gym Battle Setup"
            required
          />
        </div>

        <div class="form-group">
          <label for="template-description">Description</label>
          <textarea
            id="template-description"
            v-model="form.description"
            class="form-input form-textarea"
            placeholder="Describe this encounter template..."
            rows="3"
          />
        </div>

        <div class="form-group">
          <label for="template-category">Category</label>
          <input
            id="template-category"
            v-model="form.category"
            type="text"
            class="form-input"
            placeholder="e.g., Gym Battle, Wild Encounter"
            list="category-suggestions"
          />
          <datalist id="category-suggestions">
            <option v-for="cat in existingCategories" :key="cat" :value="cat" />
          </datalist>
        </div>

        <div class="form-group">
          <label for="template-tags">Tags (comma-separated)</label>
          <input
            id="template-tags"
            v-model="tagsInput"
            type="text"
            class="form-input"
            placeholder="e.g., electric, gym, level-30"
          />
          <div v-if="parsedTags.length > 0" class="tag-preview">
            <span v-for="tag in parsedTags" :key="tag" class="tag">{{ tag }}</span>
          </div>
        </div>

        <!-- Summary -->
        <div class="summary">
          <h4>Template Summary</h4>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="summary-label">Battle Type:</span>
              <span class="summary-value">{{ formatBattleType(encounterId ? 'trainer' : 'trainer') }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Combatants:</span>
              <span class="summary-value">{{ combatantCount }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Grid:</span>
              <span class="summary-value">{{ hasGrid ? 'Enabled' : 'No grid' }}</span>
            </div>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">
          Cancel
        </button>
        <button
          class="btn btn--primary"
          :disabled="!isValid || loading"
          @click="handleSave"
        >
          {{ loading ? 'Saving...' : 'Save Template' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEncounterLibraryStore } from '~/stores/encounterLibrary'

const props = defineProps<{
  encounterId: string
  combatantCount: number
  hasGrid: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', templateId: string): void
}>()

const libraryStore = useEncounterLibraryStore()

const form = reactive({
  name: '',
  description: '',
  category: ''
})

const tagsInput = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

const parsedTags = computed(() => {
  if (!tagsInput.value.trim()) return []
  return tagsInput.value
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0)
})

const existingCategories = computed(() => libraryStore.categories)

const isValid = computed(() => {
  return form.name.trim().length > 0
})

const formatBattleType = (type: string): string => {
  const types: Record<string, string> = {
    trainer: 'Trainer Battle',
    wild: 'Wild Encounter',
    'full-contact': 'Full Contact',
    'full_contact': 'Full Contact'
  }
  return types[type] || type
}

const handleSave = async () => {
  if (!isValid.value) return

  loading.value = true
  error.value = null

  try {
    const result = await libraryStore.createFromEncounter({
      encounterId: props.encounterId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      tags: parsedTags.value
    })

    if (result) {
      emit('saved', result.id)
      emit('close')
    } else {
      error.value = libraryStore.error || 'Failed to save template'
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to save template'
  } finally {
    loading.value = false
  }
}

// Load existing categories on mount
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
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

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

  &__description {
    color: $color-text-muted;
    margin-bottom: $spacing-lg;
    font-size: 0.875rem;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-md;
    padding: $spacing-lg;
    border-top: 1px solid $glass-border;
    background: $color-bg-tertiary;
  }
}

.form-group {
  margin-bottom: $spacing-md;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: 500;
    font-size: 0.875rem;
  }
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.tag-preview {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
}

.tag {
  padding: 2px 8px;
  background: rgba($color-accent-teal, 0.2);
  border-radius: $border-radius-sm;
  font-size: 0.75rem;
  color: $color-accent-teal;
}

.summary {
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-top: $spacing-lg;

  h4 {
    margin: 0 0 $spacing-sm;
    font-size: 0.875rem;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-label {
  font-size: 0.75rem;
  color: $color-text-muted;
}

.summary-value {
  font-weight: 500;
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
</style>
