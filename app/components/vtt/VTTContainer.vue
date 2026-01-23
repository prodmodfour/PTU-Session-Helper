<template>
  <div class="vtt-container" data-testid="vtt-container">
    <!-- VTT Header with Controls -->
    <div class="vtt-header">
      <div class="vtt-header__title">
        <h3>Battle Grid</h3>
        <span class="vtt-header__size">{{ config.width }}×{{ config.height }}</span>
        <span v-if="selectionStore.selectedCount > 0" class="vtt-header__selection">
          {{ selectionStore.selectedCount }} selected
        </span>
      </div>

      <div class="vtt-header__controls">
        <!-- Toggle Grid Settings -->
        <button
          v-if="isGm"
          class="btn btn--sm btn--secondary"
          @click="showSettings = !showSettings"
          data-testid="grid-settings-btn"
        >
          ⚙ Settings
        </button>

        <!-- Toggle Grid Visibility -->
        <button
          v-if="isGm"
          class="btn btn--sm"
          :class="config.enabled ? 'btn--primary' : 'btn--secondary'"
          @click="toggleGrid"
          data-testid="toggle-grid-btn"
        >
          {{ config.enabled ? '🗺 Grid On' : '🗺 Grid Off' }}
        </button>
      </div>
    </div>

    <!-- Grid Settings Panel -->
    <div v-if="showSettings && isGm" class="vtt-settings" data-testid="vtt-settings">
      <div class="vtt-settings__row">
        <div class="form-group">
          <label>Width (cells)</label>
          <input
            type="number"
            v-model.number="localConfig.width"
            class="form-input form-input--sm"
            min="5"
            max="100"
            data-testid="grid-width-input"
          />
        </div>
        <div class="form-group">
          <label>Height (cells)</label>
          <input
            type="number"
            v-model.number="localConfig.height"
            class="form-input form-input--sm"
            min="5"
            max="100"
            data-testid="grid-height-input"
          />
        </div>
        <div class="form-group">
          <label>Cell Size (px)</label>
          <input
            type="number"
            v-model.number="localConfig.cellSize"
            class="form-input form-input--sm"
            min="20"
            max="100"
            data-testid="cell-size-input"
          />
        </div>
      </div>

      <div class="vtt-settings__row">
        <div class="form-group form-group--wide">
          <label>Background Image</label>
          <div class="background-upload">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              class="background-upload__input"
              @change="handleFileSelect"
              data-testid="background-file-input"
            />
            <button
              class="btn btn--sm btn--secondary background-upload__btn"
              @click="triggerFileInput"
              :disabled="isUploading"
              data-testid="upload-bg-btn"
            >
              {{ isUploading ? 'Uploading...' : 'Upload Image' }}
            </button>
            <button
              v-if="localConfig.background"
              class="btn btn--sm btn--danger"
              @click="removeBackground"
              :disabled="isUploading"
              data-testid="remove-bg-btn"
            >
              Remove
            </button>
          </div>
          <div v-if="localConfig.background" class="background-preview">
            <img :src="localConfig.background" alt="Background preview" />
          </div>
          <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>
        </div>
      </div>

      <div class="vtt-settings__actions">
        <button
          class="btn btn--sm btn--secondary"
          @click="resetSettings"
        >
          Reset
        </button>
        <button
          class="btn btn--sm btn--primary"
          @click="applySettings"
          data-testid="apply-settings-btn"
        >
          Apply
        </button>
      </div>
    </div>

    <!-- Grid Canvas -->
    <div v-if="config.enabled" class="vtt-grid-wrapper">
      <GridCanvas
        ref="gridCanvasRef"
        :config="config"
        :tokens="tokens"
        :combatants="combatants"
        :current-turn-id="currentTurnId"
        :is-gm="isGm"
        :show-zoom-controls="true"
        :show-coordinates="true"
        @token-move="handleTokenMove"
        @token-select="handleTokenSelect"
        @cell-click="handleCellClick"
        @multi-select="handleMultiSelect"
      />
    </div>

    <!-- Grid Disabled State -->
    <div v-else class="vtt-disabled">
      <p>Grid is disabled</p>
      <button
        v-if="isGm"
        class="btn btn--primary"
        @click="toggleGrid"
      >
        Enable Grid
      </button>
    </div>

    <!-- Selected Token Info -->
    <div v-if="selectedCombatant" class="vtt-selection" data-testid="vtt-selection">
      <div class="vtt-selection__header">
        <span class="vtt-selection__name">{{ getDisplayName(selectedCombatant) }}</span>
        <button class="vtt-selection__close" @click="selectedTokenId = null">&times;</button>
      </div>
      <div class="vtt-selection__info">
        <span>Position: ({{ selectedCombatant.position?.x ?? '?'}}, {{ selectedCombatant.position?.y ?? '?' }})</span>
        <span>HP: {{ selectedCombatant.entity.currentHp }}/{{ selectedCombatant.entity.maxHp }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GridConfig, GridPosition, Combatant, Pokemon, HumanCharacter } from '~/types'
import { DEFAULT_SETTINGS } from '~/types'
import GridCanvas from '~/components/vtt/GridCanvas.vue'
import { useSelectionStore } from '~/stores/selection'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
}

const props = defineProps<{
  config: GridConfig
  combatants: Combatant[]
  currentTurnId?: string
  isGm?: boolean
}>()

const emit = defineEmits<{
  configUpdate: [config: GridConfig]
  tokenMove: [combatantId: string, position: GridPosition]
  backgroundUpload: [file: File]
  backgroundRemove: []
  multiSelect: [combatantIds: string[]]
}>()

// Selection Store
const selectionStore = useSelectionStore()

// Refs
const gridCanvasRef = ref<InstanceType<typeof GridCanvas> | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const showSettings = ref(false)
const selectedTokenId = ref<string | null>(null)
const isUploading = ref(false)
const uploadError = ref<string | null>(null)

// Local config for editing
const localConfig = ref<GridConfig>({
  enabled: props.config.enabled,
  width: props.config.width,
  height: props.config.height,
  cellSize: props.config.cellSize,
  background: props.config.background,
})

// Computed
const tokens = computed((): TokenData[] => {
  return props.combatants
    .filter(c => c.position)
    .map(c => ({
      combatantId: c.id,
      position: c.position!,
      size: c.tokenSize || 1,
    }))
})

const selectedCombatant = computed(() => {
  if (!selectedTokenId.value) return null
  return props.combatants.find(c => c.id === selectedTokenId.value)
})

// Methods
const getDisplayName = (combatant: Combatant): string => {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (combatant.entity as HumanCharacter).name
}

const toggleGrid = () => {
  emit('configUpdate', {
    ...props.config,
    enabled: !props.config.enabled,
  })
}

const applySettings = () => {
  emit('configUpdate', { ...localConfig.value })
  showSettings.value = false
}

const resetSettings = () => {
  localConfig.value = {
    enabled: true,
    width: DEFAULT_SETTINGS.defaultGridWidth,
    height: DEFAULT_SETTINGS.defaultGridHeight,
    cellSize: DEFAULT_SETTINGS.defaultCellSize,
    background: undefined,
  }
}

const handleTokenMove = (combatantId: string, position: GridPosition) => {
  emit('tokenMove', combatantId, position)
}

const handleTokenSelect = (combatantId: string | null) => {
  selectedTokenId.value = combatantId
}

const handleCellClick = (position: GridPosition) => {
  // Could be used for placing tokens, targeting, etc.
  console.log('Cell clicked:', position)
}

const handleMultiSelect = (combatantIds: string[]) => {
  emit('multiSelect', combatantIds)
}

// File upload methods
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    uploadError.value = 'Invalid file type. Use JPEG, PNG, GIF, or WebP.'
    return
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    uploadError.value = 'File too large. Maximum size is 5MB.'
    return
  }

  uploadError.value = null
  isUploading.value = true

  try {
    emit('backgroundUpload', file)
  } finally {
    isUploading.value = false
    // Reset file input
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

const removeBackground = () => {
  localConfig.value.background = undefined
  emit('backgroundRemove')
}

// Watch for external config changes
watch(() => props.config, (newConfig) => {
  localConfig.value = { ...newConfig }
}, { deep: true })

// Expose methods
defineExpose({
  resetView: () => gridCanvasRef.value?.resetView(),
})
</script>

<style lang="scss" scoped>
.vtt-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
}

.vtt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &__title {
    display: flex;
    align-items: baseline;
    gap: $spacing-sm;

    h3 {
      margin: 0;
      font-size: $font-size-md;
    }
  }

  &__size {
    color: $color-text-muted;
    font-size: $font-size-sm;
  }

  &__selection {
    color: $color-accent-teal;
    font-size: $font-size-sm;
    font-weight: 600;
    padding: 2px 8px;
    background: rgba($color-accent-teal, 0.15);
    border-radius: $border-radius-sm;
  }

  &__controls {
    display: flex;
    gap: $spacing-sm;
  }
}

.vtt-settings {
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  &__row {
    display: flex;
    gap: $spacing-md;
    flex-wrap: wrap;

    .form-group {
      flex: 1;
      min-width: 100px;

      &--wide {
        flex: 3;
        min-width: 200px;
      }
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  .form-input--sm {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
  }
}

.background-upload {
  display: flex;
  gap: $spacing-sm;
  align-items: center;

  &__input {
    display: none;
  }

  &__btn {
    flex-shrink: 0;
  }
}

.background-preview {
  margin-top: $spacing-sm;
  border-radius: $border-radius-sm;
  overflow: hidden;
  max-height: 100px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    max-height: 100px;
  }
}

.upload-error {
  color: $color-danger;
  font-size: $font-size-xs;
  margin-top: $spacing-xs;
}

.vtt-grid-wrapper {
  height: 500px;
  min-height: 400px;
  border-radius: $border-radius-md;
  overflow: hidden;
}

.vtt-disabled {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  color: $color-text-muted;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
}

.vtt-selection {
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  padding: $spacing-sm $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-weight: 600;
    color: $color-text;
  }

  &__close {
    background: none;
    border: none;
    color: $color-text-muted;
    font-size: $font-size-lg;
    cursor: pointer;
    padding: 0;
    line-height: 1;

    &:hover {
      color: $color-text;
    }
  }

  &__info {
    display: flex;
    gap: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}
</style>
