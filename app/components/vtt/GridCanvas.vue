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
      <template v-if="measurementStore.mode !== 'none'">
        <span class="coordinate-display__mode">| {{ measurementStore.mode }}</span>
        <span v-if="measurementStore.distance > 0" class="coordinate-display__distance">
          | {{ measurementStore.distance }}m
        </span>
      </template>
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
import type { GridConfig, GridPosition, Combatant, TerrainType } from '~/types'
import { useSelectionStore } from '~/stores/selection'
import { useMeasurementStore } from '~/stores/measurement'
import { useFogOfWarStore } from '~/stores/fogOfWar'
import { useTerrainStore, TERRAIN_COLORS } from '~/stores/terrain'
import { useRangeParser } from '~/composables/useRangeParser'

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
  showMovementRange?: boolean
  getMovementSpeed?: (combatantId: string) => number
}>()

const emit = defineEmits<{
  tokenMove: [combatantId: string, position: GridPosition]
  tokenSelect: [combatantId: string | null]
  cellClick: [position: GridPosition]
  multiSelect: [combatantIds: string[]]
}>()

// Selection Store
const selectionStore = useSelectionStore()

// Measurement Store
const measurementStore = useMeasurementStore()

// Fog of War Store
const fogOfWarStore = useFogOfWarStore()

// Terrain Store
const terrainStore = useTerrainStore()

// Range Parser
const { getMovementRangeCells } = useRangeParser()

// Default movement speed if not provided
const DEFAULT_MOVEMENT_SPEED = 5

// Fog painting state
const isFogPainting = ref(false)
const lastPaintedCell = ref<GridPosition | null>(null)

// Terrain painting state
const isTerrainPainting = ref(false)
const lastTerrainCell = ref<GridPosition | null>(null)

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
const movementRangeEnabled = ref(false)

// Click-to-move state
const movingTokenId = ref<string | null>(null)
const moveTargetCell = ref<GridPosition | null>(null)

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

// Selected token for movement range display
const selectedTokenForMovement = computed(() => {
  // Show movement range if prop is true OR local toggle is on OR in move mode
  const shouldShow = props.showMovementRange || movementRangeEnabled.value || movingTokenId.value
  const tokenId = movingTokenId.value || selectedTokenId.value
  if (!shouldShow || !tokenId) return null
  return props.tokens.find(t => t.combatantId === tokenId)
})

// Moving token data for preview
const movingToken = computed(() => {
  if (!movingTokenId.value) return null
  return props.tokens.find(t => t.combatantId === movingTokenId.value)
})

// Calculate distance between two grid positions using PTU diagonal rules
// Diagonals alternate: 1m, 2m, 1m, 2m...
const calculateMoveDistance = (from: GridPosition, to: GridPosition): number => {
  const dx = Math.abs(to.x - from.x)
  const dy = Math.abs(to.y - from.y)
  const diagonals = Math.min(dx, dy)
  const straights = Math.abs(dx - dy)
  // Diagonal cost: 1 + 2 + 1 + 2... = diagonals + floor(diagonals / 2)
  const diagonalCost = diagonals + Math.floor(diagonals / 2)
  return diagonalCost + straights
}

// Get movement speed for a combatant
const getSpeed = (combatantId: string): number => {
  if (props.getMovementSpeed) {
    return props.getMovementSpeed(combatantId)
  }
  return DEFAULT_MOVEMENT_SPEED
}

// Get blocked cells (cells occupied by other tokens)
const getBlockedCells = (excludeCombatantId?: string): GridPosition[] => {
  const blocked: GridPosition[] = []
  props.tokens.forEach(token => {
    if (token.combatantId === excludeCombatantId) return
    // Add all cells occupied by this token
    for (let dx = 0; dx < token.size; dx++) {
      for (let dy = 0; dy < token.size; dy++) {
        blocked.push({
          x: token.position.x + dx,
          y: token.position.y + dy
        })
      }
    }
  })
  return blocked
}

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

  // Draw terrain layer (before grid for visual layering)
  if (terrainStore.terrainCount > 0) {
    drawTerrain(ctx)
  }

  // Draw grid
  drawGrid(ctx)

  // Draw movement range overlay (before measurement and fog)
  if (selectedTokenForMovement.value) {
    drawMovementRange(ctx)
  }

  // Draw movement preview arrow when in move mode
  if (movingToken.value && hoveredCell.value) {
    drawMovementPreview(ctx)
  }

  // Draw measurement overlay
  if (measurementStore.mode !== 'none' && measurementStore.affectedCells.length > 0) {
    drawMeasurementOverlay(ctx)
  }

  // Draw fog of war overlay (only for non-GM players)
  if (fogOfWarStore.enabled && !props.isGm) {
    drawFogOfWar(ctx)
  }

  // Draw fog of war preview for GM (semi-transparent)
  if (fogOfWarStore.enabled && props.isGm) {
    drawFogOfWarPreview(ctx)
  }

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

const drawTerrain = (ctx: CanvasRenderingContext2D) => {
  const { width, height, cellSize } = props.config

  // Draw all terrain cells
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const terrain = terrainStore.getTerrainAt(x, y)

      if (terrain === 'normal') continue // Skip normal terrain

      const colors = TERRAIN_COLORS[terrain]
      if (!colors) continue

      // Fill cell with terrain color
      ctx.fillStyle = colors.fill
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

      // Draw border
      ctx.strokeStyle = colors.stroke
      ctx.lineWidth = 1
      ctx.strokeRect(x * cellSize + 0.5, y * cellSize + 0.5, cellSize - 1, cellSize - 1)

      // Draw pattern/icon for certain terrain types
      drawTerrainPattern(ctx, x, y, terrain, cellSize)
    }
  }
}

const drawTerrainPattern = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  terrain: TerrainType,
  cellSize: number
) => {
  const centerX = x * cellSize + cellSize / 2
  const centerY = y * cellSize + cellSize / 2

  ctx.save()

  switch (terrain) {
    case 'blocking':
      // Draw X pattern for blocking
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x * cellSize + 4, y * cellSize + 4)
      ctx.lineTo((x + 1) * cellSize - 4, (y + 1) * cellSize - 4)
      ctx.moveTo((x + 1) * cellSize - 4, y * cellSize + 4)
      ctx.lineTo(x * cellSize + 4, (y + 1) * cellSize - 4)
      ctx.stroke()
      break

    case 'water':
      // Draw wave pattern for water
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < 3; i++) {
        const waveY = y * cellSize + 8 + i * 10
        ctx.moveTo(x * cellSize + 4, waveY)
        ctx.quadraticCurveTo(
          x * cellSize + cellSize / 4, waveY - 3,
          x * cellSize + cellSize / 2, waveY
        )
        ctx.quadraticCurveTo(
          x * cellSize + (3 * cellSize) / 4, waveY + 3,
          (x + 1) * cellSize - 4, waveY
        )
      }
      ctx.stroke()
      break

    case 'hazard':
      // Draw warning triangle for hazard
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.beginPath()
      ctx.moveTo(centerX, y * cellSize + 6)
      ctx.lineTo(x * cellSize + 6, (y + 1) * cellSize - 6)
      ctx.lineTo((x + 1) * cellSize - 6, (y + 1) * cellSize - 6)
      ctx.closePath()
      ctx.fill()

      // Exclamation mark
      ctx.fillStyle = 'rgba(255, 69, 0, 0.8)'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('!', centerX, centerY + 2)
      break

    case 'elevated':
      // Draw up arrow for elevated
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(centerX, y * cellSize + 8)
      ctx.lineTo(centerX, (y + 1) * cellSize - 8)
      ctx.moveTo(centerX - 5, y * cellSize + 14)
      ctx.lineTo(centerX, y * cellSize + 8)
      ctx.lineTo(centerX + 5, y * cellSize + 14)
      ctx.stroke()
      break

    case 'difficult':
      // Draw dots pattern for difficult terrain
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      const dotSize = 2
      const spacing = cellSize / 4
      for (let dx = 1; dx < 4; dx++) {
        for (let dy = 1; dy < 4; dy++) {
          if ((dx + dy) % 2 === 0) {
            ctx.beginPath()
            ctx.arc(
              x * cellSize + dx * spacing,
              y * cellSize + dy * spacing,
              dotSize,
              0,
              Math.PI * 2
            )
            ctx.fill()
          }
        }
      }
      break
  }

  ctx.restore()
}

const drawMeasurementOverlay = (ctx: CanvasRenderingContext2D) => {
  const { cellSize } = props.config
  const cells = measurementStore.affectedCells
  const origin = measurementStore.startPosition

  // Color based on measurement mode
  const colors: Record<string, { fill: string; stroke: string }> = {
    distance: { fill: 'rgba(59, 130, 246, 0.3)', stroke: 'rgba(59, 130, 246, 0.8)' },
    burst: { fill: 'rgba(239, 68, 68, 0.3)', stroke: 'rgba(239, 68, 68, 0.8)' },
    cone: { fill: 'rgba(245, 158, 11, 0.3)', stroke: 'rgba(245, 158, 11, 0.8)' },
    line: { fill: 'rgba(34, 197, 94, 0.3)', stroke: 'rgba(34, 197, 94, 0.8)' },
    'close-blast': { fill: 'rgba(168, 85, 247, 0.3)', stroke: 'rgba(168, 85, 247, 0.8)' },
  }

  const color = colors[measurementStore.mode] || colors.distance

  // Draw affected cells
  ctx.fillStyle = color.fill
  ctx.strokeStyle = color.stroke
  ctx.lineWidth = 2

  cells.forEach(cell => {
    // Only draw cells within grid bounds
    if (cell.x >= 0 && cell.x < props.config.width &&
        cell.y >= 0 && cell.y < props.config.height) {
      ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize)
      ctx.strokeRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize)
    }
  })

  // Draw origin marker
  if (origin) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()
    ctx.arc(
      origin.x * cellSize + cellSize / 2,
      origin.y * cellSize + cellSize / 2,
      cellSize / 4,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }

  // Draw distance line for distance mode
  if (measurementStore.mode === 'distance' && origin && measurementStore.endPosition) {
    ctx.strokeStyle = 'rgba(59, 130, 246, 1)'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])

    ctx.beginPath()
    ctx.moveTo(
      origin.x * cellSize + cellSize / 2,
      origin.y * cellSize + cellSize / 2
    )
    ctx.lineTo(
      measurementStore.endPosition.x * cellSize + cellSize / 2,
      measurementStore.endPosition.y * cellSize + cellSize / 2
    )
    ctx.stroke()

    ctx.setLineDash([])
  }
}

// Draw fog of war for players (fully opaque fog on hidden cells)
const drawFogOfWar = (ctx: CanvasRenderingContext2D) => {
  const { width, height, cellSize } = props.config

  // Draw fog on each hidden cell
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const fogState = fogOfWarStore.getCellState(x, y)

      if (fogState === 'hidden') {
        // Full fog - completely opaque black
        ctx.fillStyle = 'rgba(10, 10, 15, 0.95)'
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      } else if (fogState === 'explored') {
        // Explored fog - semi-transparent (dimmed)
        ctx.fillStyle = 'rgba(10, 10, 15, 0.5)'
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
      // 'revealed' cells are not covered
    }
  }
}

// Draw fog of war preview for GM (shows fog state without blocking view)
const drawFogOfWarPreview = (ctx: CanvasRenderingContext2D) => {
  const { width, height, cellSize } = props.config

  // Draw fog state indicator on each cell
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const fogState = fogOfWarStore.getCellState(x, y)

      if (fogState === 'hidden') {
        // Dim red tint for hidden cells
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

        // Draw cross pattern for hidden cells
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x * cellSize + 2, y * cellSize + 2)
        ctx.lineTo((x + 1) * cellSize - 2, (y + 1) * cellSize - 2)
        ctx.moveTo((x + 1) * cellSize - 2, y * cellSize + 2)
        ctx.lineTo(x * cellSize + 2, (y + 1) * cellSize - 2)
        ctx.stroke()
      } else if (fogState === 'explored') {
        // Yellow tint for explored cells
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)'
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

        // Draw dots for explored cells
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)'
        ctx.beginPath()
        ctx.arc(
          x * cellSize + cellSize / 2,
          y * cellSize + cellSize / 2,
          2,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
      // 'revealed' cells show no preview overlay
    }
  }
}

// Get terrain cost at a position for movement calculations
const getTerrainCostAt = (x: number, y: number): number => {
  return terrainStore.getMovementCost(x, y, false) // TODO: Pass canSwim based on combatant
}

// Draw movement range overlay for selected token
const drawMovementRange = (ctx: CanvasRenderingContext2D) => {
  const token = selectedTokenForMovement.value
  if (!token) return

  const { cellSize } = props.config
  const speed = getSpeed(token.combatantId)
  const blocked = getBlockedCells(token.combatantId)

  // Pass terrain cost getter if terrain is present
  const terrainCostGetter = terrainStore.terrainCount > 0 ? getTerrainCostAt : undefined
  const rangeCells = getMovementRangeCells(token.position, speed, blocked, terrainCostGetter)

  // Draw reachable cells with cyan tint
  ctx.fillStyle = 'rgba(34, 211, 238, 0.2)' // Cyan-400 with low opacity
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)'
  ctx.lineWidth = 1

  rangeCells.forEach(cell => {
    // Only draw cells within grid bounds
    if (cell.x >= 0 && cell.x < props.config.width &&
        cell.y >= 0 && cell.y < props.config.height) {
      ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize)
      ctx.strokeRect(cell.x * cellSize + 0.5, cell.y * cellSize + 0.5, cellSize - 1, cellSize - 1)
    }
  })

  // Draw token origin marker with pulsing ring
  const originX = token.position.x * cellSize + (token.size * cellSize) / 2
  const originY = token.position.y * cellSize + (token.size * cellSize) / 2

  ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.arc(originX, originY, (token.size * cellSize) / 2 + 4, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // Draw speed indicator text at bottom-right of token
  ctx.fillStyle = 'rgba(34, 211, 238, 0.9)'
  ctx.font = 'bold 12px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const speedText = `${speed}m`
  const textX = token.position.x * cellSize + token.size * cellSize - 10
  const textY = token.position.y * cellSize + token.size * cellSize - 10

  // Background for text
  const textMetrics = ctx.measureText(speedText)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(
    textX - textMetrics.width / 2 - 3,
    textY - 8,
    textMetrics.width + 6,
    16
  )
  ctx.fillStyle = 'rgba(34, 211, 238, 0.9)'
  ctx.fillText(speedText, textX, textY)
}

// Draw movement preview arrow when in click-to-move mode
const drawMovementPreview = (ctx: CanvasRenderingContext2D) => {
  const token = movingToken.value
  const target = hoveredCell.value
  if (!token || !target) return

  const { cellSize } = props.config
  const speed = getSpeed(token.combatantId)
  const distance = calculateMoveDistance(token.position, target)
  const isValidMove = distance <= speed && distance > 0

  // Token center
  const startX = token.position.x * cellSize + (token.size * cellSize) / 2
  const startY = token.position.y * cellSize + (token.size * cellSize) / 2

  // Target center
  const endX = target.x * cellSize + cellSize / 2
  const endY = target.y * cellSize + cellSize / 2

  // Check if target is blocked
  const blocked = getBlockedCells(token.combatantId)
  const isBlocked = blocked.some(b => b.x === target.x && b.y === target.y)

  // Choose color based on validity
  let arrowColor = 'rgba(34, 211, 238, 0.8)' // Cyan for valid
  let bgColor = 'rgba(34, 211, 238, 0.2)'
  if (!isValidMove || isBlocked) {
    arrowColor = 'rgba(239, 68, 68, 0.8)' // Red for invalid
    bgColor = 'rgba(239, 68, 68, 0.2)'
  }

  // Highlight target cell
  if (distance > 0) {
    ctx.fillStyle = bgColor
    ctx.fillRect(target.x * cellSize, target.y * cellSize, cellSize, cellSize)
    ctx.strokeStyle = arrowColor
    ctx.lineWidth = 2
    ctx.strokeRect(target.x * cellSize + 1, target.y * cellSize + 1, cellSize - 2, cellSize - 2)
  }

  // Draw arrow line
  if (distance > 0) {
    ctx.strokeStyle = arrowColor
    ctx.lineWidth = 3
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw arrowhead
    const angle = Math.atan2(endY - startY, endX - startX)
    const arrowSize = 12
    ctx.fillStyle = arrowColor
    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  }

  // Draw distance indicator near target
  if (distance > 0) {
    const distText = `${distance}m`
    ctx.font = 'bold 14px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const labelX = endX
    const labelY = target.y * cellSize - 12

    // Background
    const metrics = ctx.measureText(distText)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(
      labelX - metrics.width / 2 - 4,
      labelY - 10,
      metrics.width + 8,
      20
    )

    // Text
    ctx.fillStyle = isValidMove && !isBlocked ? 'rgba(34, 211, 238, 1)' : 'rgba(239, 68, 68, 1)'
    ctx.fillText(distText, labelX, labelY)

    // Show "Out of range" or "Blocked" message if invalid
    if (!isValidMove && !isBlocked) {
      const msgY = labelY - 20
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      const msg = 'Out of range'
      const msgMetrics = ctx.measureText(msg)
      ctx.fillRect(labelX - msgMetrics.width / 2 - 4, msgY - 8, msgMetrics.width + 8, 16)
      ctx.fillStyle = 'rgba(239, 68, 68, 1)'
      ctx.font = 'bold 10px system-ui, sans-serif'
      ctx.fillText(msg, labelX, msgY)
    } else if (isBlocked) {
      const msgY = labelY - 20
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      const msg = 'Blocked'
      const msgMetrics = ctx.measureText(msg)
      ctx.fillRect(labelX - msgMetrics.width / 2 - 4, msgY - 8, msgMetrics.width + 8, 16)
      ctx.fillStyle = 'rgba(239, 68, 68, 1)'
      ctx.font = 'bold 10px system-ui, sans-serif'
      ctx.fillText(msg, labelX, msgY)
    }
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
  if (event.button === 0) {
    const gridPos = screenToGrid(event.clientX, event.clientY)

    // If in measurement mode, start measuring
    if (measurementStore.mode !== 'none') {
      measurementStore.startMeasurement(gridPos)
      render()
      return
    }

    // If fog of war is enabled and GM, start fog painting
    if (props.isGm && fogOfWarStore.enabled) {
      // Check if clicking within grid bounds
      if (gridPos.x >= 0 && gridPos.x < props.config.width &&
          gridPos.y >= 0 && gridPos.y < props.config.height) {
        isFogPainting.value = true
        lastPaintedCell.value = gridPos
        fogOfWarStore.applyTool(gridPos.x, gridPos.y)
        render()
        return
      }
    }

    // If terrain editing is enabled and GM, start terrain painting
    if (props.isGm && terrainStore.enabled) {
      // Check if clicking within grid bounds
      if (gridPos.x >= 0 && gridPos.x < props.config.width &&
          gridPos.y >= 0 && gridPos.y < props.config.height) {
        isTerrainPainting.value = true
        lastTerrainCell.value = gridPos
        terrainStore.applyTool(gridPos.x, gridPos.y)
        render()
        return
      }
    }

    // Check if clicking on a token
    const clickedToken = getTokenAtPosition(gridPos)

    if (clickedToken) {
      // Token click handled by VTTToken component
      return
    }

    // If in move mode and clicking on empty cell, try to move
    if (movingTokenId.value && props.isGm) {
      const token = movingToken.value
      if (token) {
        const speed = getSpeed(token.combatantId)
        const distance = calculateMoveDistance(token.position, gridPos)
        const blocked = getBlockedCells(token.combatantId)
        const isBlocked = blocked.some(b => b.x === gridPos.x && b.y === gridPos.y)

        // Check if move is valid
        if (distance > 0 && distance <= speed && !isBlocked &&
            gridPos.x >= 0 && gridPos.x < props.config.width &&
            gridPos.y >= 0 && gridPos.y < props.config.height) {
          // Emit the move
          emit('tokenMove', movingTokenId.value, gridPos)
          // Exit move mode
          movingTokenId.value = null
          moveTargetCell.value = null
          render()
          return
        } else if (distance === 0) {
          // Clicked on same cell, cancel move mode
          movingTokenId.value = null
          moveTargetCell.value = null
          render()
          return
        }
        // Invalid move - stay in move mode but don't move
      }
    }

    // If clicking on empty space without move mode, cancel selection
    if (!clickedToken) {
      movingTokenId.value = null
      moveTargetCell.value = null
      selectedTokenId.value = null
      emit('tokenSelect', null)
    }

    // If GM and not clicking on token, start marquee selection
    if (props.isGm && !movingTokenId.value) {
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
  const cellChanged = !hoveredCell.value ||
    hoveredCell.value.x !== gridPos.x ||
    hoveredCell.value.y !== gridPos.y
  hoveredCell.value = gridPos

  // Re-render for movement preview when in move mode
  if (movingTokenId.value && cellChanged) {
    render()
  }

  // Handle measurement mode
  if (measurementStore.isActive) {
    measurementStore.updateMeasurement(gridPos)
    render()
  }

  // Handle fog painting while dragging
  if (isFogPainting.value && props.isGm && fogOfWarStore.enabled) {
    // Only paint if moved to a new cell
    if (!lastPaintedCell.value ||
        lastPaintedCell.value.x !== gridPos.x ||
        lastPaintedCell.value.y !== gridPos.y) {
      // Check within bounds
      if (gridPos.x >= 0 && gridPos.x < props.config.width &&
          gridPos.y >= 0 && gridPos.y < props.config.height) {
        lastPaintedCell.value = gridPos
        fogOfWarStore.applyTool(gridPos.x, gridPos.y)
        render()
      }
    }
  }

  // Handle terrain painting while dragging
  if (isTerrainPainting.value && props.isGm && terrainStore.enabled) {
    // Only paint if moved to a new cell
    if (!lastTerrainCell.value ||
        lastTerrainCell.value.x !== gridPos.x ||
        lastTerrainCell.value.y !== gridPos.y) {
      // Check within bounds
      if (gridPos.x >= 0 && gridPos.x < props.config.width &&
          gridPos.y >= 0 && gridPos.y < props.config.height) {
        lastTerrainCell.value = gridPos
        terrainStore.applyTool(gridPos.x, gridPos.y)
        render()
      }
    }
  }

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

  // End fog painting
  if (isFogPainting.value) {
    isFogPainting.value = false
    lastPaintedCell.value = null
  }

  // End terrain painting
  if (isTerrainPainting.value) {
    isTerrainPainting.value = false
    lastTerrainCell.value = null
  }

  // End measurement (but keep the result visible)
  if (measurementStore.isActive) {
    measurementStore.endMeasurement()
  }

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
  // If clicking the same token that's already in move mode, cancel move mode
  if (movingTokenId.value === combatantId) {
    movingTokenId.value = null
    moveTargetCell.value = null
    render()
    return
  }

  // If in move mode and clicking a different token, switch to that token
  if (movingTokenId.value && movingTokenId.value !== combatantId) {
    movingTokenId.value = combatantId
    selectedTokenId.value = combatantId
    emit('tokenSelect', combatantId)
    render()
    return
  }

  // Enter move mode for this token
  selectedTokenId.value = combatantId
  movingTokenId.value = combatantId
  emit('tokenSelect', combatantId)

  // Handle multi-selection with modifier keys
  if (props.isGm) {
    const shiftKey = event?.shiftKey ?? false
    const ctrlKey = event?.ctrlKey ?? event?.metaKey ?? false

    if (shiftKey || ctrlKey) {
      selectionStore.toggleSelection(combatantId)
    } else {
      selectionStore.select(combatantId)
    }
    emit('multiSelect', selectionStore.selectedArray)
  }

  render()
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

  // Escape - Clear selection, measurement, and move mode
  if (event.key === 'Escape') {
    selectionStore.clearSelection()
    measurementStore.clearMeasurement()
    measurementStore.setMode('none')
    movingTokenId.value = null
    moveTargetCell.value = null
    selectedTokenId.value = null
    emit('tokenSelect', null)
    emit('multiSelect', [])
    render()
    return
  }

  // M - Toggle distance measurement mode
  if (event.key === 'm' || event.key === 'M') {
    if (measurementStore.mode === 'distance') {
      measurementStore.setMode('none')
    } else {
      measurementStore.setMode('distance')
    }
    render()
    return
  }

  // B - Toggle burst mode
  if (event.key === 'b' || event.key === 'B') {
    if (measurementStore.mode === 'burst') {
      measurementStore.setMode('none')
    } else {
      measurementStore.setMode('burst')
    }
    render()
    return
  }

  // C - Toggle cone mode
  if (event.key === 'c' || event.key === 'C') {
    if (measurementStore.mode === 'cone') {
      measurementStore.setMode('none')
    } else {
      measurementStore.setMode('cone')
    }
    render()
    return
  }

  // R - Rotate AoE direction (for cone/close-blast)
  if (event.key === 'r' || event.key === 'R') {
    measurementStore.cycleDirection()
    render()
    return
  }

  // +/- - Adjust AoE size
  if (event.key === '+' || event.key === '=') {
    measurementStore.setAoeSize(measurementStore.aoeSize + 1)
    render()
    return
  }
  if (event.key === '-' || event.key === '_') {
    measurementStore.setAoeSize(measurementStore.aoeSize - 1)
    render()
    return
  }

  // W - Toggle movement range display
  if (event.key === 'w' || event.key === 'W') {
    movementRangeEnabled.value = !movementRangeEnabled.value
    render()
    return
  }

  // F - Toggle fog of war
  if (event.key === 'f' || event.key === 'F') {
    fogOfWarStore.setEnabled(!fogOfWarStore.enabled)
    render()
    return
  }

  // T - Toggle terrain editing
  if (event.key === 't' || event.key === 'T') {
    terrainStore.setEnabled(!terrainStore.enabled)
    render()
    return
  }

  // V - Reveal fog tool
  if (event.key === 'v' || event.key === 'V') {
    if (fogOfWarStore.enabled) {
      fogOfWarStore.setToolMode('reveal')
    }
    return
  }

  // H - Hide fog tool
  if (event.key === 'h' || event.key === 'H') {
    if (fogOfWarStore.enabled) {
      fogOfWarStore.setToolMode('hide')
    }
    return
  }

  // E - Explore fog tool
  if (event.key === 'e' || event.key === 'E') {
    if (fogOfWarStore.enabled) {
      fogOfWarStore.setToolMode('explore')
    }
    return
  }

  // [ and ] - Adjust fog brush size
  if (event.key === '[') {
    fogOfWarStore.setBrushSize(fogOfWarStore.brushSize - 1)
    return
  }
  if (event.key === ']') {
    fogOfWarStore.setBrushSize(fogOfWarStore.brushSize + 1)
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

// Re-render when selected token changes (for movement range display)
watch(selectedTokenId, () => {
  render()
})

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
  user-select: none;
  -webkit-user-select: none;

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
  display: flex;
  align-items: center;
  gap: $spacing-xs;

  &__mode {
    color: $color-accent-teal;
    text-transform: capitalize;
  }

  &__distance {
    color: $color-accent-scarlet;
    font-weight: 600;
  }
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
