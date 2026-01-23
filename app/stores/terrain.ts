import { defineStore } from 'pinia'
import type { GridPosition, TerrainType, TerrainCell } from '~/types'

export interface TerrainState {
  enabled: boolean
  // Map of "x,y" -> TerrainCell for tracking terrain
  cells: Map<string, TerrainCell>
  // Default terrain type for cells not in the map
  defaultType: TerrainType
  // Current painting tool
  paintMode: TerrainType
  // Brush size for terrain painting
  brushSize: number
}

// Movement cost multipliers for terrain types
export const TERRAIN_COSTS: Record<TerrainType, number> = {
  normal: 1,
  difficult: 2,
  blocking: Infinity,
  water: 2, // Requires swim capability, else blocking
  hazard: 1, // Normal cost but deals damage
  elevated: 1, // Normal cost but affects line of sight
}

// Terrain display colors
export const TERRAIN_COLORS: Record<TerrainType, { fill: string; stroke: string; pattern?: string }> = {
  normal: { fill: 'transparent', stroke: 'transparent' },
  difficult: { fill: 'rgba(139, 69, 19, 0.3)', stroke: 'rgba(139, 69, 19, 0.6)' }, // Brown
  blocking: { fill: 'rgba(64, 64, 64, 0.8)', stroke: 'rgba(32, 32, 32, 1)' }, // Dark gray
  water: { fill: 'rgba(30, 144, 255, 0.4)', stroke: 'rgba(30, 144, 255, 0.7)' }, // Blue
  hazard: { fill: 'rgba(255, 69, 0, 0.3)', stroke: 'rgba(255, 69, 0, 0.6)' }, // Red-orange
  elevated: { fill: 'rgba(144, 238, 144, 0.3)', stroke: 'rgba(144, 238, 144, 0.6)' }, // Light green
}

// Helper to convert position to map key
const posToKey = (x: number, y: number): string => `${x},${y}`
const keyToPos = (key: string): GridPosition => {
  const [x, y] = key.split(',').map(Number)
  return { x, y }
}

export const useTerrainStore = defineStore('terrain', {
  state: (): TerrainState => ({
    enabled: false,
    cells: new Map(),
    defaultType: 'normal',
    paintMode: 'difficult',
    brushSize: 1,
  }),

  getters: {
    // Get terrain type at position
    getTerrainAt: (state) => (x: number, y: number): TerrainType => {
      const key = posToKey(x, y)
      const cell = state.cells.get(key)
      return cell?.type ?? state.defaultType
    },

    // Get full terrain cell data at position
    getCellAt: (state) => (x: number, y: number): TerrainCell | null => {
      const key = posToKey(x, y)
      return state.cells.get(key) ?? null
    },

    // Get movement cost for a cell
    getMovementCost: (state) => (x: number, y: number, canSwim: boolean = false): number => {
      const terrain = state.cells.get(posToKey(x, y))?.type ?? state.defaultType

      if (terrain === 'water' && !canSwim) {
        return Infinity // Cannot pass water without swim
      }

      return TERRAIN_COSTS[terrain]
    },

    // Check if cell is passable
    isPassable: (state) => (x: number, y: number, canSwim: boolean = false): boolean => {
      const terrain = state.cells.get(posToKey(x, y))?.type ?? state.defaultType

      if (terrain === 'blocking') return false
      if (terrain === 'water' && !canSwim) return false

      return true
    },

    // Get all terrain cells as array (for serialization)
    allCells: (state): TerrainCell[] => {
      return Array.from(state.cells.values())
    },

    // Get cells of a specific type
    getCellsByType: (state) => (type: TerrainType): TerrainCell[] => {
      return Array.from(state.cells.values()).filter(cell => cell.type === type)
    },

    // Count of non-normal terrain cells
    terrainCount: (state): number => {
      return state.cells.size
    },
  },

  actions: {
    // Toggle terrain system on/off
    setEnabled(enabled: boolean) {
      this.enabled = enabled
    },

    // Set the paint mode (terrain type to paint)
    setPaintMode(mode: TerrainType) {
      this.paintMode = mode
    },

    // Set brush size
    setBrushSize(size: number) {
      this.brushSize = Math.max(1, Math.min(10, size))
    },

    // Set terrain at a single cell
    setTerrain(x: number, y: number, type: TerrainType, elevation: number = 0, note?: string) {
      const key = posToKey(x, y)

      if (type === 'normal' && elevation === 0 && !note) {
        // Remove from map if setting to default
        this.cells.delete(key)
      } else {
        this.cells.set(key, {
          position: { x, y },
          type,
          elevation,
          note,
        })
      }
    },

    // Clear terrain at a single cell (reset to normal)
    clearTerrain(x: number, y: number) {
      const key = posToKey(x, y)
      this.cells.delete(key)
    },

    // Apply paint tool at position (uses current paintMode and brushSize)
    applyTool(x: number, y: number) {
      const radius = this.brushSize - 1

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Use Chebyshev distance for brush shape
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= radius) {
            this.setTerrain(x + dx, y + dy, this.paintMode)
          }
        }
      }
    },

    // Erase terrain in area (uses brushSize)
    eraseTool(x: number, y: number) {
      const radius = this.brushSize - 1

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= radius) {
            this.clearTerrain(x + dx, y + dy)
          }
        }
      }
    },

    // Fill a rectangular area with terrain
    fillRect(x1: number, y1: number, x2: number, y2: number, type: TerrainType) {
      const minX = Math.min(x1, x2)
      const maxX = Math.max(x1, x2)
      const minY = Math.min(y1, y2)
      const maxY = Math.max(y1, y2)

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          this.setTerrain(x, y, type)
        }
      }
    },

    // Draw a line of terrain (for walls)
    drawLine(x1: number, y1: number, x2: number, y2: number, type: TerrainType) {
      // Bresenham's line algorithm
      const dx = Math.abs(x2 - x1)
      const dy = Math.abs(y2 - y1)
      const sx = x1 < x2 ? 1 : -1
      const sy = y1 < y2 ? 1 : -1
      let err = dx - dy

      let x = x1
      let y = y1

      while (true) {
        this.setTerrain(x, y, type)

        if (x === x2 && y === y2) break

        const e2 = 2 * err
        if (e2 > -dy) {
          err -= dy
          x += sx
        }
        if (e2 < dx) {
          err += dx
          y += sy
        }
      }
    },

    // Clear all terrain
    clearAll() {
      this.cells.clear()
    },

    // Reset store to initial state
    reset() {
      this.cells.clear()
      this.enabled = false
      this.paintMode = 'difficult'
      this.brushSize = 1
    },

    // Import terrain state from serialized data
    importState(data: { cells: Array<{ position: GridPosition; type: TerrainType; elevation: number; note?: string }> }) {
      this.cells.clear()
      data.cells.forEach(cell => {
        const key = posToKey(cell.position.x, cell.position.y)
        this.cells.set(key, cell)
      })
    },

    // Export terrain state for serialization
    exportState(): { cells: Array<{ position: GridPosition; type: TerrainType; elevation: number; note?: string }> } {
      return {
        cells: Array.from(this.cells.values()),
      }
    },
  },
})
