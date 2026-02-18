<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal__header">
        <h3>Import Encounter Table</h3>
        <button class="modal__close" @click="$emit('close')">&times;</button>
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
        <button type="button" class="btn btn--secondary" @click="$emit('close')">
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
</template>

<script setup lang="ts">
const emit = defineEmits<{
  close: []
  imported: [tableId: string]
}>()

const tablesStore = useEncounterTablesStore()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const importing = ref(false)
const importError = ref<string | null>(null)
const importWarning = ref<string | null>(null)

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

    emit('imported', result.table.id)
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

.import-icon {
  width: 48px;
  height: 48px;
  filter: brightness(0) invert(0.5);
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
</style>
