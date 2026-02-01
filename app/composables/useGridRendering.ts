import type { GridConfig, GridPosition, TerrainType, MovementPreview } from '~/types'
import { useMeasurementStore } from '~/stores/measurement'
import { useFogOfWarStore } from '~/stores/fogOfWar'
import { useTerrainStore, TERRAIN_COLORS } from '~/stores/terrain'
import { useRangeParser } from '~/composables/useRangeParser'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
}

interface UseGridRenderingOptions {
  canvasRef: Ref<HTMLCanvasElement | null>
  containerRef: Ref<HTMLDivElement | null>
  config: Ref<GridConfig>
  tokens: Ref<TokenData[]>
  zoom: Ref<number>
  panOffset: Ref<{ x: number; y: number }>
  isGm: Ref<boolean>
  // Movement state
  selectedTokenForMovement: Ref<TokenData | null>
  movingToken: Ref<TokenData | null>
  hoveredCell: Ref<GridPosition | null>
  externalMovementPreview: Ref<MovementPreview | null>
  // Movement helpers
  getSpeed: (combatantId: string) => number
  getBlockedCells: (excludeCombatantId?: string) => GridPosition[]
  calculateMoveDistance: (from: GridPosition, to: GridPosition) => number
  getTerrainCostAt: (x: number, y: number) => number
}

// Constants
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.2)'
const GRID_LINE_WIDTH = 1

export function useGridRendering(options: UseGridRenderingOptions) {
  const measurementStore = useMeasurementStore()
  const fogOfWarStore = useFogOfWarStore()
  const terrainStore = useTerrainStore()
  const { getMovementRangeCells } = useRangeParser()

  // Background image
  const backgroundImage = ref<HTMLImageElement | null>(null)

  // Computed values
  const gridPixelWidth = computed(() => options.config.value.width * options.config.value.cellSize)
  const gridPixelHeight = computed(() => options.config.value.height * options.config.value.cellSize)

  /**
   * Load background image from config
   */
  const loadBackgroundImage = () => {
    if (options.config.value.background) {
      const img = new Image()
      img.onload = () => {
        backgroundImage.value = img
        render()
      }
      img.onerror = () => {
        backgroundImage.value = null
        render()
      }
      img.src = options.config.value.background
    } else {
      backgroundImage.value = null
    }
  }

  /**
   * Main render function
   */
  const render = () => {
    const canvas = options.canvasRef.value
    const container = options.containerRef.value
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
    ctx.translate(options.panOffset.value.x, options.panOffset.value.y)
    ctx.scale(options.zoom.value, options.zoom.value)

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
    if (options.selectedTokenForMovement.value) {
      drawMovementRange(ctx)
    }

    // Draw movement preview arrow when in move mode
    if (options.movingToken.value && options.hoveredCell.value) {
      drawMovementPreview(ctx)
    }

    // Draw external movement preview (from WebSocket, for group view)
    if (options.externalMovementPreview.value && !options.isGm.value) {
      drawExternalMovementPreview(ctx, options.externalMovementPreview.value)
    }

    // Draw measurement overlay
    if (measurementStore.mode !== 'none' && measurementStore.affectedCells.length > 0) {
      drawMeasurementOverlay(ctx)
    }

    // Draw fog of war overlay (only for non-GM players)
    if (fogOfWarStore.enabled && !options.isGm.value) {
      drawFogOfWar(ctx)
    }

    // Draw fog of war preview for GM (semi-transparent)
    if (fogOfWarStore.enabled && options.isGm.value) {
      drawFogOfWarPreview(ctx)
    }

    ctx.restore()
  }

  /**
   * Draw the grid lines
   */
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const { width, height, cellSize } = options.config.value

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

  /**
   * Draw terrain cells
   */
  const drawTerrain = (ctx: CanvasRenderingContext2D) => {
    const { width, height, cellSize } = options.config.value

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const terrain = terrainStore.getTerrainAt(x, y)
        if (terrain === 'normal') continue

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

  /**
   * Draw terrain-specific patterns
   */
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

  /**
   * Draw measurement overlay
   */
  const drawMeasurementOverlay = (ctx: CanvasRenderingContext2D) => {
    const { cellSize } = options.config.value
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
      if (cell.x >= 0 && cell.x < options.config.value.width &&
          cell.y >= 0 && cell.y < options.config.value.height) {
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

  /**
   * Draw fog of war for players (fully opaque fog on hidden cells)
   */
  const drawFogOfWar = (ctx: CanvasRenderingContext2D) => {
    const { width, height, cellSize } = options.config.value

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const fogState = fogOfWarStore.getCellState(x, y)

        if (fogState === 'hidden') {
          ctx.fillStyle = 'rgba(10, 10, 15, 0.95)'
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        } else if (fogState === 'explored') {
          ctx.fillStyle = 'rgba(10, 10, 15, 0.5)'
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  /**
   * Draw fog of war preview for GM (shows fog state without blocking view)
   */
  const drawFogOfWarPreview = (ctx: CanvasRenderingContext2D) => {
    const { width, height, cellSize } = options.config.value

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const fogState = fogOfWarStore.getCellState(x, y)

        if (fogState === 'hidden') {
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
      }
    }
  }

  /**
   * Draw movement range overlay for selected token
   */
  const drawMovementRange = (ctx: CanvasRenderingContext2D) => {
    const token = options.selectedTokenForMovement.value
    if (!token) return

    const { cellSize } = options.config.value
    const speed = options.getSpeed(token.combatantId)
    const blocked = options.getBlockedCells(token.combatantId)

    // Pass terrain cost getter if terrain is present
    const terrainCostGetter = terrainStore.terrainCount > 0 ? options.getTerrainCostAt : undefined
    const rangeCells = getMovementRangeCells(token.position, speed, blocked, terrainCostGetter)

    // Draw reachable cells with cyan tint
    ctx.fillStyle = 'rgba(34, 211, 238, 0.2)'
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)'
    ctx.lineWidth = 1

    rangeCells.forEach(cell => {
      if (cell.x >= 0 && cell.x < options.config.value.width &&
          cell.y >= 0 && cell.y < options.config.value.height) {
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

  /**
   * Draw movement preview arrow when in click-to-move mode
   */
  const drawMovementPreview = (ctx: CanvasRenderingContext2D) => {
    const token = options.movingToken.value
    const target = options.hoveredCell.value
    if (!token || !target) return

    const { cellSize } = options.config.value
    const speed = options.getSpeed(token.combatantId)
    const distance = options.calculateMoveDistance(token.position, target)
    const isValidMove = distance <= speed && distance > 0

    // Token center
    const startX = token.position.x * cellSize + (token.size * cellSize) / 2
    const startY = token.position.y * cellSize + (token.size * cellSize) / 2

    // Target center
    const endX = target.x * cellSize + cellSize / 2
    const endY = target.y * cellSize + cellSize / 2

    // Check if target is blocked
    const blocked = options.getBlockedCells(token.combatantId)
    const isBlocked = blocked.some(b => b.x === target.x && b.y === target.y)

    // Choose color based on validity
    let arrowColor = 'rgba(34, 211, 238, 0.8)'
    let bgColor = 'rgba(34, 211, 238, 0.2)'
    if (!isValidMove || isBlocked) {
      arrowColor = 'rgba(239, 68, 68, 0.8)'
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

  /**
   * Draw external movement preview received from WebSocket (for group view)
   */
  const drawExternalMovementPreview = (ctx: CanvasRenderingContext2D, preview: MovementPreview) => {
    const { cellSize } = options.config.value

    // Find the token for sizing
    const token = options.tokens.value.find(t => t.combatantId === preview.combatantId)
    const tokenSize = token?.size || 1

    // Draw movement range grid if token exists
    if (token) {
      const speed = options.getSpeed(token.combatantId)
      const blocked = options.getBlockedCells(token.combatantId)
      const terrainCostGetter = terrainStore.terrainCount > 0 ? options.getTerrainCostAt : undefined
      const rangeCells = getMovementRangeCells(token.position, speed, blocked, terrainCostGetter)

      // Draw reachable cells with cyan tint
      ctx.fillStyle = 'rgba(34, 211, 238, 0.2)'
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)'
      ctx.lineWidth = 1

      rangeCells.forEach(cell => {
        if (cell.x >= 0 && cell.x < options.config.value.width &&
            cell.y >= 0 && cell.y < options.config.value.height) {
          ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize)
          ctx.strokeRect(cell.x * cellSize + 0.5, cell.y * cellSize + 0.5, cellSize - 1, cellSize - 1)
        }
      })

      // Draw origin marker ring around token
      const originX = token.position.x * cellSize + (tokenSize * cellSize) / 2
      const originY = token.position.y * cellSize + (tokenSize * cellSize) / 2

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.arc(originX, originY, (tokenSize * cellSize) / 2 + 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw speed indicator
      ctx.fillStyle = 'rgba(34, 211, 238, 0.9)'
      ctx.font = 'bold 12px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const speedText = `${speed}m`
      const textX = token.position.x * cellSize + tokenSize * cellSize - 10
      const textY = token.position.y * cellSize + tokenSize * cellSize - 10

      const textMetrics = ctx.measureText(speedText)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(textX - textMetrics.width / 2 - 3, textY - 8, textMetrics.width + 6, 16)
      ctx.fillStyle = 'rgba(34, 211, 238, 0.9)'
      ctx.fillText(speedText, textX, textY)
    }

    // Token center
    const startX = preview.fromPosition.x * cellSize + (tokenSize * cellSize) / 2
    const startY = preview.fromPosition.y * cellSize + (tokenSize * cellSize) / 2

    // Target center
    const endX = preview.toPosition.x * cellSize + cellSize / 2
    const endY = preview.toPosition.y * cellSize + cellSize / 2

    // Choose color based on validity
    const arrowColor = preview.isValid ? 'rgba(34, 211, 238, 0.8)' : 'rgba(239, 68, 68, 0.8)'
    const bgColor = preview.isValid ? 'rgba(34, 211, 238, 0.2)' : 'rgba(239, 68, 68, 0.2)'

    // Highlight target cell
    if (preview.distance > 0) {
      ctx.fillStyle = bgColor
      ctx.fillRect(preview.toPosition.x * cellSize, preview.toPosition.y * cellSize, cellSize, cellSize)
      ctx.strokeStyle = arrowColor
      ctx.lineWidth = 2
      ctx.strokeRect(preview.toPosition.x * cellSize + 1, preview.toPosition.y * cellSize + 1, cellSize - 2, cellSize - 2)

      // Draw arrow line
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

      // Draw distance indicator
      const distText = `${preview.distance}m`
      ctx.font = 'bold 14px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const labelX = endX
      const labelY = preview.toPosition.y * cellSize - 12

      const metrics = ctx.measureText(distText)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(labelX - metrics.width / 2 - 4, labelY - 10, metrics.width + 8, 20)
      ctx.fillStyle = preview.isValid ? 'rgba(34, 211, 238, 1)' : 'rgba(239, 68, 68, 1)'
      ctx.fillText(distText, labelX, labelY)
    }
  }

  return {
    render,
    loadBackgroundImage,
    backgroundImage,
    gridPixelWidth,
    gridPixelHeight
  }
}
