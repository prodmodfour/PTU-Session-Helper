<template>
  <div class="map-uploader">
    <div class="map-uploader__header">
      <h4>Map Background</h4>
      <button
        v-if="currentBackground"
        class="btn-icon btn-danger"
        @click="removeBackground"
        :disabled="isLoading"
        title="Remove background"
      >
        <span class="icon">×</span>
      </button>
    </div>

    <!-- Current Background Preview -->
    <div v-if="currentBackground" class="map-uploader__preview">
      <img :src="currentBackground" alt="Current map background" />
      <div class="map-uploader__preview-overlay">
        <span>Current Background</span>
      </div>
    </div>

    <!-- Upload Zone -->
    <div
      v-else
      class="map-uploader__dropzone"
      :class="{ 'is-dragover': isDragOver, 'is-loading': isLoading }"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
      @drop.prevent="handleDrop"
      @click="openFilePicker"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="map-uploader__input"
        @change="handleFileSelect"
      />

      <div v-if="isLoading" class="map-uploader__loading">
        <span class="spinner"></span>
        <span>Uploading...</span>
      </div>
      <div v-else class="map-uploader__prompt">
        <span class="icon-upload">+</span>
        <span>Drop image here or click to upload</span>
        <span class="map-uploader__hint">PNG, JPG, WebP (max 5MB)</span>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="map-uploader__error">
      {{ error }}
    </div>

    <!-- Replace Button (when background exists) -->
    <button
      v-if="currentBackground && !isLoading"
      class="btn btn-secondary btn-sm"
      @click="openFilePicker"
    >
      Replace Background
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  encounterId: string
  currentBackground?: string
}>()

const emit = defineEmits<{
  backgroundChange: [url: string | null]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

const openFilePicker = () => {
  fileInput.value?.click()
}

const validateFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type. Please use PNG, JPG, WebP, or GIF.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File too large. Maximum size is 5MB.'
  }
  return null
}

const uploadFile = async (file: File) => {
  const validationError = validateFile(file)
  if (validationError) {
    error.value = validationError
    return
  }

  error.value = null
  isLoading.value = true

  try {
    // Convert to base64 data URL
    const reader = new FileReader()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })

    // Upload to server
    const response = await $fetch(`/api/encounters/${props.encounterId}/background`, {
      method: 'POST',
      body: { imageData: dataUrl },
    })

    if (response.success && response.data?.background) {
      emit('backgroundChange', response.data.background)
    } else {
      throw new Error('Upload failed')
    }
  } catch (err) {
    console.error('Upload error:', err)
    error.value = err instanceof Error ? err.message : 'Failed to upload image'
  } finally {
    isLoading.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    uploadFile(file)
  }
  // Reset input so same file can be selected again
  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    uploadFile(file)
  }
}

const removeBackground = async () => {
  error.value = null
  isLoading.value = true

  try {
    const response = await $fetch(`/api/encounters/${props.encounterId}/background`, {
      method: 'DELETE',
    })

    if (response.success) {
      emit('backgroundChange', null)
    } else {
      throw new Error('Failed to remove background')
    }
  } catch (err) {
    console.error('Remove error:', err)
    error.value = err instanceof Error ? err.message : 'Failed to remove background'
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.map-uploader {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h4 {
      margin: 0;
      font-size: $font-size-sm;
      color: $color-text;
    }
  }

  &__preview {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: $border-radius-md;
    overflow: hidden;
    border: 1px solid $border-color-default;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: $spacing-xs $spacing-sm;
      background: rgba(0, 0, 0, 0.6);
      color: $color-text-muted;
      font-size: $font-size-xs;
      text-align: center;
    }
  }

  &__dropzone {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 2px dashed $border-color-default;
    border-radius: $border-radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: $color-bg-secondary;

    &:hover {
      border-color: $color-accent-teal;
      background: rgba($color-accent-teal, 0.05);
    }

    &.is-dragover {
      border-color: $color-accent-teal;
      background: rgba($color-accent-teal, 0.1);
      border-style: solid;
    }

    &.is-loading {
      pointer-events: none;
      opacity: 0.7;
    }
  }

  &__input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
  }

  &__prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;
    color: $color-text-muted;
    text-align: center;
    padding: $spacing-md;

    .icon-upload {
      font-size: 2rem;
      color: $color-accent-teal;
    }
  }

  &__hint {
    font-size: $font-size-xs;
    opacity: 0.7;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    color: $color-text-muted;

    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid $border-color-default;
      border-top-color: $color-accent-teal;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }

  &__error {
    padding: $spacing-xs $spacing-sm;
    background: rgba($color-accent-scarlet, 0.1);
    border: 1px solid $color-accent-scarlet;
    border-radius: $border-radius-sm;
    color: $color-accent-scarlet;
    font-size: $font-size-xs;
  }
}

.btn-icon {
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: all 0.15s ease;

  &.btn-danger {
    color: $color-accent-scarlet;

    &:hover {
      background: rgba($color-accent-scarlet, 0.1);
      border-color: $color-accent-scarlet;
    }
  }

  .icon {
    font-size: 1.2rem;
    line-height: 1;
  }
}

.btn-sm {
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
