/**
 * Composable for VTT canvas rendering functions
 * Extracted from GridCanvas.vue for reuse and maintainability
 */
import type { GridConfig, GridPosition, TerrainType, MovementPreview } from '~/types'
import { TERRAIN_COLORS } from '~/stores/terrain'

// Constants
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.2)'
const GRID_LINE_WIDTH = 1

export function useCanvasRendering() {
  /**
   * Draw the grid lines
   */
  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    config: GridConfig
  ) => {
    const { width, height, cellSize } = config

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
   * Draw terrain pattern for a specific terrain type
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
        // Draw dots for difficult terrain
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        for (let i = 0; i < 5; i++) {
          const dotX = x * cellSize + 8 + (i % 3) * 10
          const dotY = y * cellSize + 10 + Math.floor(i / 3) * 12
          ctx.beginPath()
          ctx.arc(dotX, dotY, 2, 0, Math.PI * 2)
          ctx.fill()
        }
        break

      case 'earth':
        // Draw downward arrow pattern for earth/underground terrain
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(centerX, (y + 1) * cellSize - 8)
        ctx.lineTo(centerX, y * cellSize + 8)
        ctx.moveTo(centerX - 5, (y + 1) * cellSize - 14)
        ctx.lineTo(centerX, (y + 1) * cellSize - 8)
        ctx.lineTo(centerX + 5, (y + 1) * cellSize - 14)
        ctx.stroke()
        break

      case 'rough':
        // Draw jagged line pattern for rough terrain
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        const roughY = centerY
        ctx.moveTo(x * cellSize + 4, roughY)
        ctx.lineTo(x * cellSize + cellSize * 0.2, roughY - 5)
        ctx.lineTo(x * cellSize + cellSize * 0.35, roughY + 3)
        ctx.lineTo(x * cellSize + cellSize * 0.5, roughY - 4)
        ctx.lineTo(x * cellSize + cellSize * 0.65, roughY + 5)
        ctx.lineTo(x * cellSize + cellSize * 0.8, roughY - 3)
        ctx.lineTo((x + 1) * cellSize - 4, roughY)
        ctx.stroke()
        break
    }

    ctx.restore()
  }

  /**
   * Draw movement preview arrow
   */
  const drawMovementArrow = (
    ctx: CanvasRenderingContext2D,
    from: GridPosition,
    to: GridPosition,
    cellSize: number,
    tokenSize: number,
    color: string = 'rgba(0, 255, 255, 0.6)'
  ) => {
    const fromCenterX = (from.x + tokenSize / 2) * cellSize
    const fromCenterY = (from.y + tokenSize / 2) * cellSize
    const toCenterX = (to.x + tokenSize / 2) * cellSize
    const toCenterY = (to.y + tokenSize / 2) * cellSize

    // Draw arrow line
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(fromCenterX, fromCenterY)
    ctx.lineTo(toCenterX, toCenterY)
    ctx.stroke()

    // Draw arrow head
    const angle = Math.atan2(toCenterY - fromCenterY, toCenterX - fromCenterX)
    const headLen = 15
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(toCenterX, toCenterY)
    ctx.lineTo(
      toCenterX - headLen * Math.cos(angle - Math.PI / 6),
      toCenterY - headLen * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(toCenterX, toCenterY)
    ctx.lineTo(
      toCenterX - headLen * Math.cos(angle + Math.PI / 6),
      toCenterY - headLen * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
    ctx.restore()
  }

  /**
   * Draw a cell highlight
   */
  const drawCellHighlight = (
    ctx: CanvasRenderingContext2D,
    position: GridPosition,
    cellSize: number,
    color: string
  ) => {
    ctx.fillStyle = color
    ctx.fillRect(
      position.x * cellSize,
      position.y * cellSize,
      cellSize,
      cellSize
    )
  }

  /**
   * Draw movement range overlay
   */
  const drawMovementRange = (
    ctx: CanvasRenderingContext2D,
    cells: GridPosition[],
    cellSize: number,
    color: string = 'rgba(0, 255, 150, 0.2)'
  ) => {
    ctx.fillStyle = color
    for (const cell of cells) {
      ctx.fillRect(
        cell.x * cellSize,
        cell.y * cellSize,
        cellSize,
        cellSize
      )
    }
  }

  /**
   * Draw fog of war (hidden areas)
   */
  const drawFogOfWar = (
    ctx: CanvasRenderingContext2D,
    config: GridConfig,
    isHiddenFn: (x: number, y: number) => boolean,
    isPartialFn: (x: number, y: number) => boolean
  ) => {
    const { width, height, cellSize } = config

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (isHiddenFn(x, y)) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        } else if (isPartialFn(x, y)) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  /**
   * Draw fog of war preview for GM (semi-transparent)
   */
  const drawFogOfWarPreview = (
    ctx: CanvasRenderingContext2D,
    config: GridConfig,
    isHiddenFn: (x: number, y: number) => boolean,
    isPartialFn: (x: number, y: number) => boolean
  ) => {
    const { width, height, cellSize } = config

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (isHiddenFn(x, y)) {
          // Draw striped pattern for hidden cells
          ctx.fillStyle = 'rgba(100, 100, 100, 0.3)'
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

          // Draw diagonal stripes
          ctx.save()
          ctx.strokeStyle = 'rgba(150, 150, 150, 0.3)'
          ctx.lineWidth = 1
          ctx.beginPath()
          for (let i = 0; i < cellSize * 2; i += 6) {
            ctx.moveTo(x * cellSize + i, y * cellSize)
            ctx.lineTo(x * cellSize, y * cellSize + i)
          }
          ctx.stroke()
          ctx.restore()
        } else if (isPartialFn(x, y)) {
          ctx.fillStyle = 'rgba(100, 100, 100, 0.15)'
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  /**
   * Calculate distance between two grid positions using PTU diagonal rules
   * Diagonals alternate: 1m, 2m, 1m, 2m...
   */
  const calculateMoveDistance = (from: GridPosition, to: GridPosition): number => {
    const dx = Math.abs(to.x - from.x)
    const dy = Math.abs(to.y - from.y)
    const diagonals = Math.min(dx, dy)
    const straights = Math.abs(dx - dy)
    // Diagonal cost: 1 + 2 + 1 + 2... = diagonals + floor(diagonals / 2)
    const diagonalCost = diagonals + Math.floor(diagonals / 2)
    return diagonalCost + straights
  }

  return {
    drawGrid,
    drawTerrainPattern,
    drawMovementArrow,
    drawCellHighlight,
    drawMovementRange,
    drawFogOfWar,
    drawFogOfWarPreview,
    calculateMoveDistance,
    GRID_LINE_COLOR,
    GRID_LINE_WIDTH
  }
}
