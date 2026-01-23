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

    <!-- Measurement Toolbar -->
    <div v-if="config.enabled" class="vtt-measurement-toolbar" data-testid="measurement-toolbar">
      <div class="vtt-measurement-toolbar__modes">
        <button
          class="measurement-btn"
          :class="{ 'measurement-btn--active': measurementStore.mode === 'distance' }"
          @click="setMeasurementMode('distance')"
          title="Distance (M)"
          data-testid="measure-distance-btn"
        >
          📏 Distance
        </button>
        <button
          class="measurement-btn"
          :class="{ 'measurement-btn--active': measurementStore.mode === 'burst' }"
          @click="setMeasurementMode('burst')"
          title="Burst AoE (B)"
          data-testid="measure-burst-btn"
        >
          💥 Burst
        </button>
        <button
          class="measurement-btn"
          :class="{ 'measurement-btn--active': measurementStore.mode === 'cone' }"
          @click="setMeasurementMode('cone')"
          title="Cone AoE (C)"
          data-testid="measure-cone-btn"
        >
          🔺 Cone
        </button>
        <button
          class="measurement-btn"
          :class="{ 'measurement-btn--active': measurementStore.mode === 'line' }"
          @click="setMeasurementMode('line')"
          title="Line AoE (L)"
          data-testid="measure-line-btn"
        >
          ➖ Line
        </button>
        <button
          class="measurement-btn"
          :class="{ 'measurement-btn--active': measurementStore.mode === 'close-blast' }"
          @click="setMeasurementMode('close-blast')"
          title="Close Blast"
          data-testid="measure-close-blast-btn"
        >
          ⬛ Close Blast
        </button>
      </div>

      <div v-if="measurementStore.mode !== 'none'" class="vtt-measurement-toolbar__options">
        <template v-if="measurementStore.mode !== 'distance'">
          <label>Size:</label>
          <button
            class="size-btn"
            @click="measurementStore.setAoeSize(measurementStore.aoeSize - 1)"
            :disabled="measurementStore.aoeSize <= 1"
          >-</button>
          <span class="size-display">{{ measurementStore.aoeSize }}</span>
          <button
            class="size-btn"
            @click="measurementStore.setAoeSize(measurementStore.aoeSize + 1)"
            :disabled="measurementStore.aoeSize >= 10"
          >+</button>
        </template>

        <template v-if="['cone', 'close-blast', 'line'].includes(measurementStore.mode)">
          <span class="separator">|</span>
          <label>Dir:</label>
          <button class="dir-btn" @click="measurementStore.cycleDirection">
            {{ directionArrow }}
          </button>
        </template>

        <button
          class="measurement-btn measurement-btn--clear"
          @click="clearMeasurement"
          title="Clear (Escape)"
        >
          ✕ Clear
        </button>
      </div>
    </div>

    <!-- Fog of War Toolbar (GM Only) -->
    <div v-if="config.enabled && isGm" class="vtt-fow-toolbar" data-testid="fow-toolbar">
      <div class="vtt-fow-toolbar__header">
        <button
          class="fow-toggle-btn"
          :class="{ 'fow-toggle-btn--active': fogOfWarStore.enabled }"
          @click="toggleFogOfWar"
          data-testid="toggle-fow-btn"
        >
          {{ fogOfWarStore.enabled ? '🌫 Fog On' : '☀ Fog Off' }}
        </button>

        <template v-if="fogOfWarStore.enabled">
          <span class="separator">|</span>

          <div class="vtt-fow-toolbar__tools">
            <button
              class="fow-btn"
              :class="{ 'fow-btn--active': fogOfWarStore.toolMode === 'reveal' }"
              @click="setFogTool('reveal')"
              title="Reveal (V)"
              data-testid="fow-reveal-btn"
            >
              👁 Reveal
            </button>
            <button
              class="fow-btn"
              :class="{ 'fow-btn--active': fogOfWarStore.toolMode === 'hide' }"
              @click="setFogTool('hide')"
              title="Hide (H)"
              data-testid="fow-hide-btn"
            >
              🙈 Hide
            </button>
            <button
              class="fow-btn"
              :class="{ 'fow-btn--active': fogOfWarStore.toolMode === 'explore' }"
              @click="setFogTool('explore')"
              title="Explore (E)"
              data-testid="fow-explore-btn"
            >
              🔍 Explore
            </button>
          </div>

          <span class="separator">|</span>

          <div class="vtt-fow-toolbar__brush">
            <label>Brush:</label>
            <button
              class="size-btn"
              @click="fogOfWarStore.setBrushSize(fogOfWarStore.brushSize - 1)"
              :disabled="fogOfWarStore.brushSize <= 1"
            >-</button>
            <span class="size-display">{{ fogOfWarStore.brushSize }}</span>
            <button
              class="size-btn"
              @click="fogOfWarStore.setBrushSize(fogOfWarStore.brushSize + 1)"
              :disabled="fogOfWarStore.brushSize >= 10"
            >+</button>
          </div>

          <span class="separator">|</span>

          <div class="vtt-fow-toolbar__actions">
            <button
              class="fow-btn fow-btn--small"
              @click="revealAllFog"
              title="Reveal All"
              data-testid="fow-reveal-all-btn"
            >
              Reveal All
            </button>
            <button
              class="fow-btn fow-btn--small fow-btn--danger"
              @click="hideAllFog"
              title="Hide All"
              data-testid="fow-hide-all-btn"
            >
              Hide All
            </button>
          </div>
        </template>
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
import { useMeasurementStore, type MeasurementMode } from '~/stores/measurement'
import { useFogOfWarStore, type FogOfWarState } from '~/stores/fogOfWar'
import { useTerrainStore } from '~/stores/terrain'

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
  encounterId?: string
}>()

const emit = defineEmits<{
  configUpdate: [config: GridConfig]
  tokenMove: [combatantId: string, position: GridPosition]
  backgroundUpload: [file: File]
  backgroundRemove: []
  multiSelect: [combatantIds: string[]]
}>()

// Stores
const selectionStore = useSelectionStore()
const measurementStore = useMeasurementStore()
const fogOfWarStore = useFogOfWarStore()
const terrainStore = useTerrainStore()

// Fog persistence
const { loadFogState, debouncedSave: debouncedSaveFog, cancelPendingSave: cancelPendingFogSave } = useFogPersistence()

// Terrain persistence
const { loadTerrainState, debouncedSave: debouncedSaveTerrain, cancelPendingSave: cancelPendingTerrainSave } = useTerrainPersistence()

// Load fog and terrain state when encounter changes
watch(() => props.encounterId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    // Load both fog and terrain states
    const [fogLoaded, terrainLoaded] = await Promise.all([
      loadFogState(newId),
      loadTerrainState(newId)
    ])
    if (fogLoaded || terrainLoaded) {
      // Re-render grid canvas if available
      gridCanvasRef.value?.render()
    }
  }
}, { immediate: true })

// Auto-save fog state when it changes (debounced)
watch(() => fogOfWarStore.$state, () => {
  if (props.encounterId && props.isGm) {
    debouncedSaveFog(props.encounterId)
  }
}, { deep: true })

// Auto-save terrain state when it changes (debounced)
watch(() => terrainStore.$state, () => {
  if (props.encounterId && props.isGm) {
    debouncedSaveTerrain(props.encounterId)
  }
}, { deep: true })

// Clean up on unmount
onUnmounted(() => {
  cancelPendingFogSave()
  cancelPendingTerrainSave()
})

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

// Direction arrow mapping
const directionArrow = computed(() => {
  const arrows: Record<string, string> = {
    north: '↑',
    south: '↓',
    east: '→',
    west: '←',
    northeast: '↗',
    northwest: '↖',
    southeast: '↘',
    southwest: '↙',
  }
  return arrows[measurementStore.aoeDirection] || '↑'
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
  // Cell clicks for fog painting are handled in GridCanvas
  // This event is available for future features like token placement
}

const handleMultiSelect = (combatantIds: string[]) => {
  emit('multiSelect', combatantIds)
}

// Measurement methods
const setMeasurementMode = (mode: MeasurementMode) => {
  if (measurementStore.mode === mode) {
    measurementStore.setMode('none')
  } else {
    measurementStore.setMode(mode)
  }
}

const clearMeasurement = () => {
  measurementStore.setMode('none')
  measurementStore.clearMeasurement()
}

// Fog of War methods
const toggleFogOfWar = () => {
  fogOfWarStore.setEnabled(!fogOfWarStore.enabled)
}

const setFogTool = (tool: FogOfWarState['toolMode']) => {
  fogOfWarStore.setToolMode(tool)
}

const revealAllFog = () => {
  fogOfWarStore.revealAll(props.config.width, props.config.height)
}

const hideAllFog = () => {
  fogOfWarStore.hideAll()
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

.vtt-measurement-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;

  &__modes {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__options {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    margin-left: auto;
    padding-left: $spacing-sm;
    border-left: 1px solid $border-color-default;

    label {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }
  }
}

.measurement-btn {
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: $color-bg-primary;
    border-color: $color-accent-teal;
  }

  &--active {
    background: rgba($color-accent-teal, 0.2);
    border-color: $color-accent-teal;
    color: $color-accent-teal;
  }

  &--clear {
    background: rgba($color-danger, 0.1);
    border-color: $color-danger;
    color: $color-danger;

    &:hover {
      background: rgba($color-danger, 0.2);
    }
  }
}

.size-btn,
.dir-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: $color-bg-primary;
    border-color: $color-accent-teal;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.dir-btn {
  font-size: $font-size-md;
  width: 28px;
}

.size-display {
  min-width: 20px;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text;
}

.separator {
  color: $border-color-default;
}

// Fog of War Toolbar
.vtt-fow-toolbar {
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;

  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-sm;
  }

  &__tools {
    display: flex;
    gap: $spacing-xs;
  }

  &__brush {
    display: flex;
    align-items: center;
    gap: $spacing-xs;

    label {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
  }
}

.fow-toggle-btn {
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: $color-bg-primary;
    border-color: $color-accent-teal;
  }

  &--active {
    background: rgba($color-accent-teal, 0.2);
    border-color: $color-accent-teal;
    color: $color-accent-teal;
  }
}

.fow-btn {
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: $color-bg-primary;
    border-color: $color-accent-teal;
  }

  &--active {
    background: rgba($color-accent-teal, 0.2);
    border-color: $color-accent-teal;
    color: $color-accent-teal;
  }

  &--small {
    padding: $spacing-xs;
    font-size: $font-size-xs;
  }

  &--danger {
    border-color: rgba($color-danger, 0.5);

    &:hover {
      background: rgba($color-danger, 0.1);
      border-color: $color-danger;
      color: $color-danger;
    }
  }
}
</style>
