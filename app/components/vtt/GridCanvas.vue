<template>
  <div
    ref="containerRef"
    class="grid-canvas-container"
    data-testid="grid-canvas-container"
    @wheel.prevent="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <canvas
      ref="canvasRef"
      class="grid-canvas"
      data-testid="grid-canvas"
    />

    <!-- Token Layer (rendered over canvas) -->
    <div
      class="token-layer"
      :style="tokenLayerStyle"
    >
      <VTTToken
        v-for="token in visibleTokens"
        :key="token.combatantId"
        :token="token"
        :cell-size="scaledCellSize"
        :combatant="getCombatant(token.combatantId)"
        :is-current-turn="token.combatantId === currentTurnId"
        :is-selected="token.combatantId === selectedTokenId"
        :is-multi-selected="selectionStore.isSelected(token.combatantId)"
        :is-gm="isGm"
        @select="(id, evt) => handleTokenSelect(id, evt)"
        @drag-start="handleTokenDragStart"
        @drag-end="handleTokenDragEnd"
      />
    </div>

    <!-- Marquee Selection Overlay -->
    <div
      v-if="selectionStore.isMarqueeActive && marqueePixelRect"
      class="marquee-selection"
      :style="marqueePixelRect"
    />

    <!-- Coordinate Display -->
    <div v-if="showCoordinates && hoveredCell" class="coordinate-display">
      {{ hoveredCell.x }}, {{ hoveredCell.y }}
    </div>

    <!-- Zoom Controls -->
    <div class="zoom-controls" v-if="showZoomControls">
      <button
        class="zoom-btn"
        @click="zoomIn"
        title="Zoom In"
        data-testid="zoom-in-btn"
      >
        +
      </button>
      <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
      <button
        class="zoom-btn"
        @click="zoomOut"
        title="Zoom Out"
        data-testid="zoom-out-btn"
      >
        -
      </button>
      <button
        class="zoom-btn"
        @click="resetView"
        title="Reset View"
        data-testid="reset-view-btn"
      >
        ⌂
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GridConfig, GridPosition, Combatant } from '~/types'
import { useSelectionStore } from '~/stores/selection'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
}

const props = defineProps<{
  config: GridConfig
  tokens: TokenData[]
  combatants: Combatant[]
  currentTurnId?: string
  isGm?: boolean
  showZoomControls?: boolean
  showCoordinates?: boolean
}>()

const emit = defineEmits<{
  tokenMove: [combatantId: string, position: GridPosition]
  tokenSelect: [combatantId: string | null]
  cellClick: [position: GridPosition]
  multiSelect: [combatantIds: string[]]
}>()

// Selection Store
const selectionStore = useSelectionStore()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// View state
const zoom = ref(1)
const panOffset = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })
const selectedTokenId = ref<string | null>(null)
const hoveredCell = ref<GridPosition | null>(null)
const draggingTokenId = ref<string | null>(null)

// Marquee selection state
const isMarqueeSelecting = ref(false)
const marqueeStartScreen = ref<{ x: number; y: number } | null>(null)

// Background image
const backgroundImage = ref<HTMLImageElement | null>(null)

// Constants
const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.2)'
const GRID_LINE_WIDTH = 1

// Computed
const scaledCellSize = computed(() => props.config.cellSize * zoom.value)

const gridPixelWidth = computed(() => props.config.width * props.config.cellSize)
const gridPixelHeight = computed(() => props.config.height * props.config.cellSize)

const tokenLayerStyle = computed(() => ({
  transform: `translate(${panOffset.value.x}px, ${panOffset.value.y}px) scale(${zoom.value})`,
  transformOrigin: '0 0',
  width: `${gridPixelWidth.value}px`,
  height: `${gridPixelHeight.value}px`,
}))

const visibleTokens = computed(() => {
  return props.tokens.filter(token => {
    const pos = token.position
    return pos.x >= 0 && pos.x < props.config.width &&
           pos.y >= 0 && pos.y < props.config.height
  })
})

// Marquee pixel rect for visual overlay (in screen coordinates)
const marqueePixelRect = computed(() => {
  const rect = selectionStore.marqueeRect
  if (!rect) return null

  // Convert grid coords to screen pixels
  const left = rect.x * props.config.cellSize * zoom.value + panOffset.value.x
  const top = rect.y * props.config.cellSize * zoom.value + panOffset.value.y
  const width = rect.width * props.config.cellSize * zoom.value
  const height = rect.height * props.config.cellSize * zoom.value

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
})

// Token positions for marquee selection
const tokenPositions = computed(() => {
  return props.tokens.map(t => ({
    id: t.combatantId,
    position: t.position,
    size: t.size,
  }))
})

// Methods
const getCombatant = (combatantId: string): Combatant | undefined => {
  return props.combatants.find(c => c.id === combatantId)
}

const loadBackgroundImage = () => {
  if (props.config.background) {
    const img = new Image()
    img.onload = () => {
      backgroundImage.value = img
      render()
    }
    img.onerror = () => {
      backgroundImage.value = null
      render()
    }
    img.src = props.config.background
  } else {
    backgroundImage.value = null
  }
}

const render = () => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Set canvas size to container size
  const rect = container.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height

  // Clear canvas
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Apply transformations
  ctx.save()
  ctx.translate(panOffset.value.x, panOffset.value.y)
  ctx.scale(zoom.value, zoom.value)

  // Draw background image if available
  if (backgroundImage.value) {
    ctx.drawImage(
      backgroundImage.value,
      0, 0,
      gridPixelWidth.value,
      gridPixelHeight.value
    )
  }

  // Draw grid
  drawGrid(ctx)

  ctx.restore()
}

const drawGrid = (ctx: CanvasRenderingContext2D) => {
  const { width, height, cellSize } = props.config

  ctx.strokeStyle = GRID_LINE_COLOR
  ctx.lineWidth = GRID_LINE_WIDTH

  // Draw vertical lines
  for (let x = 0; x <= width; x++) {
    ctx.beginPath()
    ctx.moveTo(x * cellSize, 0)
    ctx.lineTo(x * cellSize, height * cellSize)
    ctx.stroke()
  }

  // Draw horizontal lines
  for (let y = 0; y <= height; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * cellSize)
    ctx.lineTo(width * cellSize, y * cellSize)
    ctx.stroke()
  }
}

const screenToGrid = (screenX: number, screenY: number): GridPosition => {
  const container = containerRef.value
  if (!container) return { x: -1, y: -1 }

  const rect = container.getBoundingClientRect()
  const canvasX = screenX - rect.left
  const canvasY = screenY - rect.top

  // Reverse transformations
  const gridX = Math.floor((canvasX - panOffset.value.x) / scaledCellSize.value)
  const gridY = Math.floor((canvasY - panOffset.value.y) / scaledCellSize.value)

  return { x: gridX, y: gridY }
}

const handleWheel = (event: WheelEvent) => {
  const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value + delta))

  if (newZoom !== zoom.value) {
    // Zoom toward mouse position
    const container = containerRef.value
    if (container) {
      const rect = container.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      // Calculate new pan offset to keep mouse position fixed
      const scale = newZoom / zoom.value
      panOffset.value = {
        x: mouseX - (mouseX - panOffset.value.x) * scale,
        y: mouseY - (mouseY - panOffset.value.y) * scale,
      }
    }

    zoom.value = newZoom
    render()
  }
}

const handleMouseDown = (event: MouseEvent) => {
  // Middle mouse button or right click for panning
  if (event.button === 1 || event.button === 2) {
    isPanning.value = true
    panStart.value = { x: event.clientX - panOffset.value.x, y: event.clientY - panOffset.value.y }
    event.preventDefault()
    return
  }

  // Left click
  if (event.button === 0 && !draggingTokenId.value) {
    const gridPos = screenToGrid(event.clientX, event.clientY)

    // Check if clicking on a token
    const clickedToken = getTokenAtPosition(gridPos)

    if (clickedToken) {
      // Token click handled by VTTToken component
      return
    }

    // If GM and not clicking on token, start marquee selection
    if (props.isGm) {
      isMarqueeSelecting.value = true
      marqueeStartScreen.value = { x: event.clientX, y: event.clientY }
      selectionStore.startMarquee(gridPos)

      // Clear selection unless shift is held
      if (!event.shiftKey) {
        selectionStore.clearSelection()
      }
    }

    // Emit cell click
    if (gridPos.x >= 0 && gridPos.x < props.config.width &&
        gridPos.y >= 0 && gridPos.y < props.config.height) {
      emit('cellClick', gridPos)
    }
  }
}

const getTokenAtPosition = (gridPos: GridPosition): TokenData | undefined => {
  return props.tokens.find(token => {
    const right = token.position.x + token.size - 1
    const bottom = token.position.y + token.size - 1
    return gridPos.x >= token.position.x && gridPos.x <= right &&
           gridPos.y >= token.position.y && gridPos.y <= bottom
  })
}

const handleMouseMove = (event: MouseEvent) => {
  // Update hovered cell
  const gridPos = screenToGrid(event.clientX, event.clientY)
  hoveredCell.value = gridPos

  // Handle marquee selection
  if (isMarqueeSelecting.value && selectionStore.isMarqueeActive) {
    selectionStore.updateMarquee(gridPos)
  }

  // Handle panning
  if (isPanning.value) {
    panOffset.value = {
      x: event.clientX - panStart.value.x,
      y: event.clientY - panStart.value.y,
    }
    render()
  }
}

const handleMouseUp = (event: MouseEvent) => {
  isPanning.value = false

  // Finalize marquee selection
  if (isMarqueeSelecting.value) {
    const rect = selectionStore.marqueeRect
    if (rect && (rect.width > 1 || rect.height > 1)) {
      // Only select if marquee is bigger than 1 cell
      selectionStore.selectInRect(rect, tokenPositions.value, event.shiftKey)
      emit('multiSelect', selectionStore.selectedArray)
    }

    isMarqueeSelecting.value = false
    marqueeStartScreen.value = null
    selectionStore.endMarquee()
  }
}

const handleTokenSelect = (combatantId: string, event?: MouseEvent) => {
  selectedTokenId.value = combatantId
  emit('tokenSelect', combatantId)

  // Handle multi-selection with modifier keys
  if (props.isGm) {
    // Check if we have a keyboard event from the token click
    const shiftKey = event?.shiftKey ?? false
    const ctrlKey = event?.ctrlKey ?? event?.metaKey ?? false

    if (shiftKey || ctrlKey) {
      selectionStore.toggleSelection(combatantId)
    } else {
      // Single click without modifier - clear and select
      selectionStore.select(combatantId)
    }
    emit('multiSelect', selectionStore.selectedArray)
  }
}

const handleTokenDragStart = (combatantId: string) => {
  draggingTokenId.value = combatantId
  selectedTokenId.value = combatantId
}

const handleTokenDragEnd = (combatantId: string, event: MouseEvent) => {
  draggingTokenId.value = null

  const newPos = screenToGrid(event.clientX, event.clientY)

  // Validate position is within grid
  if (newPos.x >= 0 && newPos.x < props.config.width &&
      newPos.y >= 0 && newPos.y < props.config.height) {
    emit('tokenMove', combatantId, newPos)
  }
}

// Zoom controls
const zoomIn = () => {
  zoom.value = Math.min(MAX_ZOOM, zoom.value + ZOOM_STEP)
  render()
}

const zoomOut = () => {
  zoom.value = Math.max(MIN_ZOOM, zoom.value - ZOOM_STEP)
  render()
}

const resetView = () => {
  zoom.value = 1
  panOffset.value = { x: 0, y: 0 }
  render()
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.isGm) return

  // Ctrl/Cmd + A - Select all tokens
  if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
    event.preventDefault()
    const allIds = props.tokens.map(t => t.combatantId)
    selectionStore.selectMultiple(allIds)
    emit('multiSelect', selectionStore.selectedArray)
    return
  }

  // Escape - Clear selection
  if (event.key === 'Escape') {
    selectionStore.clearSelection()
    selectedTokenId.value = null
    emit('tokenSelect', null)
    emit('multiSelect', [])
    return
  }

  // Delete - Could be used for removing tokens in future
}

// Lifecycle
onMounted(() => {
  loadBackgroundImage()
  render()

  // Handle window resize
  window.addEventListener('resize', render)

  // Handle keyboard shortcuts
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', render)
  window.removeEventListener('keydown', handleKeyDown)
})

// Watch for config changes
watch(() => props.config, () => {
  loadBackgroundImage()
  render()
}, { deep: true })

watch(() => props.tokens, () => {
  render()
}, { deep: true })

// Expose methods for parent
defineExpose({
  zoomIn,
  zoomOut,
  resetView,
  render,
})
</script>

<style lang="scss" scoped>
.grid-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
  background: $color-bg-primary;
  border-radius: $border-radius-md;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.token-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.coordinate-display {
  position: absolute;
  bottom: $spacing-sm;
  left: $spacing-sm;
  background: rgba(0, 0, 0, 0.7);
  color: $color-text;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-family: monospace;
}

.zoom-controls {
  position: absolute;
  bottom: $spacing-sm;
  right: $spacing-sm;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  background: rgba(0, 0, 0, 0.7);
  padding: $spacing-xs;
  border-radius: $border-radius-sm;
}

.zoom-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-md;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: $color-bg-secondary;
    border-color: $color-accent-scarlet;
  }

  &:active {
    transform: scale(0.95);
  }
}

.zoom-level {
  color: $color-text-muted;
  font-size: $font-size-xs;
  min-width: 40px;
  text-align: center;
}

.marquee-selection {
  position: absolute;
  background: rgba($color-accent-teal, 0.2);
  border: 2px dashed $color-accent-teal;
  pointer-events: none;
  z-index: 50;
  box-shadow: 0 0 10px rgba($color-accent-teal, 0.3);
}
</style>
