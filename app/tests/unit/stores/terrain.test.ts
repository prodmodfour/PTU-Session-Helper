import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTerrainStore, TERRAIN_COSTS, TERRAIN_COLORS } from '~/stores/terrain'

describe('terrain store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const store = useTerrainStore()

      expect(store.enabled).toBe(false)
      expect(store.cells.size).toBe(0)
      expect(store.defaultType).toBe('normal')
      expect(store.paintMode).toBe('difficult')
      expect(store.brushSize).toBe(1)
    })
  })

  describe('terrain types', () => {
    it('should have correct movement costs', () => {
      expect(TERRAIN_COSTS.normal).toBe(1)
      expect(TERRAIN_COSTS.difficult).toBe(2)
      expect(TERRAIN_COSTS.blocking).toBe(Infinity)
      expect(TERRAIN_COSTS.water).toBe(2)
      expect(TERRAIN_COSTS.earth).toBe(Infinity)
      expect(TERRAIN_COSTS.rough).toBe(1)
      expect(TERRAIN_COSTS.hazard).toBe(1)
      expect(TERRAIN_COSTS.elevated).toBe(1)
    })

    it('should have colors defined for all terrain types', () => {
      const terrainTypes = ['normal', 'difficult', 'blocking', 'water', 'earth', 'rough', 'hazard', 'elevated'] as const

      terrainTypes.forEach(type => {
        expect(TERRAIN_COLORS[type]).toBeDefined()
        expect(TERRAIN_COLORS[type].fill).toBeDefined()
        expect(TERRAIN_COLORS[type].stroke).toBeDefined()
      })
    })
  })

  describe('setTerrain', () => {
    it('should set terrain at a position', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'difficult')

      expect(store.getTerrainAt(5, 5)).toBe('difficult')
      expect(store.cells.size).toBe(1)
    })

    it('should remove cell when setting to normal (default)', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'difficult')
      expect(store.cells.size).toBe(1)

      store.setTerrain(5, 5, 'normal')
      expect(store.cells.size).toBe(0)
    })

    it('should store elevation', () => {
      const store = useTerrainStore()

      store.setTerrain(3, 3, 'elevated', 5)

      const cell = store.getCellAt(3, 3)
      expect(cell).not.toBeNull()
      expect(cell?.elevation).toBe(5)
    })

    it('should store notes', () => {
      const store = useTerrainStore()

      store.setTerrain(3, 3, 'hazard', 0, 'Lava pit')

      const cell = store.getCellAt(3, 3)
      expect(cell?.note).toBe('Lava pit')
    })
  })

  describe('getTerrainAt', () => {
    it('should return default type for empty cells', () => {
      const store = useTerrainStore()

      expect(store.getTerrainAt(10, 10)).toBe('normal')
    })

    it('should return set terrain type', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'blocking')

      expect(store.getTerrainAt(5, 5)).toBe('blocking')
    })
  })

  describe('getMovementCost', () => {
    it('should return 1 for normal terrain', () => {
      const store = useTerrainStore()

      expect(store.getMovementCost(0, 0)).toBe(1)
    })

    it('should return 2 for difficult terrain', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'difficult')

      expect(store.getMovementCost(0, 0)).toBe(2)
    })

    it('should return Infinity for blocking terrain', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'blocking')

      expect(store.getMovementCost(0, 0)).toBe(Infinity)
    })

    it('should return Infinity for water without swim', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'water')

      expect(store.getMovementCost(0, 0, false)).toBe(Infinity)
    })

    it('should return 2 for water with swim', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'water')

      expect(store.getMovementCost(0, 0, true)).toBe(2)
    })

    it('should return Infinity for earth without burrow', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'earth')

      expect(store.getMovementCost(0, 0, false, false)).toBe(Infinity)
    })

    it('should return Infinity for earth with default params (no burrow)', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'earth')

      expect(store.getMovementCost(0, 0)).toBe(Infinity)
    })

    it('should return 1 for earth with burrow', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'earth')

      expect(store.getMovementCost(0, 0, false, true)).toBe(1)
    })

    it('should return 1 for rough terrain', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'rough')

      expect(store.getMovementCost(0, 0)).toBe(1)
    })
  })

  describe('isPassable', () => {
    it('should return true for normal terrain', () => {
      const store = useTerrainStore()

      expect(store.isPassable(0, 0)).toBe(true)
    })

    it('should return false for blocking terrain', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'blocking')

      expect(store.isPassable(0, 0)).toBe(false)
    })

    it('should return false for water without swim', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'water')

      expect(store.isPassable(0, 0, false)).toBe(false)
    })

    it('should return true for water with swim', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'water')

      expect(store.isPassable(0, 0, true)).toBe(true)
    })

    it('should return true for difficult terrain', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'difficult')

      expect(store.isPassable(0, 0)).toBe(true)
    })

    it('should return true for hazard terrain', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'hazard')

      expect(store.isPassable(0, 0)).toBe(true)
    })

    it('should return false for earth without burrow', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'earth')

      expect(store.isPassable(0, 0)).toBe(false)
    })

    it('should return true for earth with burrow', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'earth')

      expect(store.isPassable(0, 0, false, true)).toBe(true)
    })

    it('should return true for rough terrain', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'rough')

      expect(store.isPassable(0, 0)).toBe(true)
    })
  })

  describe('applyTool', () => {
    it('should paint single cell with brush size 1', () => {
      const store = useTerrainStore()
      store.setPaintMode('blocking')
      store.setBrushSize(1)

      store.applyTool(5, 5)

      expect(store.getTerrainAt(5, 5)).toBe('blocking')
      expect(store.getTerrainAt(4, 5)).toBe('normal')
      expect(store.getTerrainAt(6, 5)).toBe('normal')
    })

    it('should paint area with brush size 2', () => {
      const store = useTerrainStore()
      store.setPaintMode('difficult')
      store.setBrushSize(2)

      store.applyTool(5, 5)

      // Brush size 2 = radius 1 (3x3 area)
      expect(store.getTerrainAt(5, 5)).toBe('difficult')
      expect(store.getTerrainAt(4, 5)).toBe('difficult')
      expect(store.getTerrainAt(6, 5)).toBe('difficult')
      expect(store.getTerrainAt(5, 4)).toBe('difficult')
      expect(store.getTerrainAt(5, 6)).toBe('difficult')
    })
  })

  describe('eraseTool', () => {
    it('should clear terrain in area', () => {
      const store = useTerrainStore()

      // Paint some terrain
      store.setTerrain(5, 5, 'difficult')
      store.setTerrain(6, 5, 'difficult')
      store.setTerrain(5, 6, 'difficult')

      expect(store.terrainCount).toBe(3)

      // Erase with brush size 2
      store.setBrushSize(2)
      store.eraseTool(5, 5)

      expect(store.getTerrainAt(5, 5)).toBe('normal')
      expect(store.getTerrainAt(6, 5)).toBe('normal')
      expect(store.getTerrainAt(5, 6)).toBe('normal')
    })
  })

  describe('fillRect', () => {
    it('should fill rectangular area with terrain', () => {
      const store = useTerrainStore()

      store.fillRect(0, 0, 2, 2, 'water')

      expect(store.getTerrainAt(0, 0)).toBe('water')
      expect(store.getTerrainAt(1, 0)).toBe('water')
      expect(store.getTerrainAt(2, 0)).toBe('water')
      expect(store.getTerrainAt(0, 1)).toBe('water')
      expect(store.getTerrainAt(1, 1)).toBe('water')
      expect(store.getTerrainAt(2, 1)).toBe('water')
      expect(store.getTerrainAt(0, 2)).toBe('water')
      expect(store.getTerrainAt(1, 2)).toBe('water')
      expect(store.getTerrainAt(2, 2)).toBe('water')

      expect(store.terrainCount).toBe(9)
    })

    it('should handle reversed coordinates', () => {
      const store = useTerrainStore()

      store.fillRect(2, 2, 0, 0, 'difficult')

      expect(store.terrainCount).toBe(9)
    })
  })

  describe('drawLine', () => {
    it('should draw horizontal line', () => {
      const store = useTerrainStore()

      store.drawLine(0, 5, 4, 5, 'blocking')

      for (let x = 0; x <= 4; x++) {
        expect(store.getTerrainAt(x, 5)).toBe('blocking')
      }
    })

    it('should draw vertical line', () => {
      const store = useTerrainStore()

      store.drawLine(5, 0, 5, 4, 'blocking')

      for (let y = 0; y <= 4; y++) {
        expect(store.getTerrainAt(5, y)).toBe('blocking')
      }
    })

    it('should draw diagonal line', () => {
      const store = useTerrainStore()

      store.drawLine(0, 0, 3, 3, 'hazard')

      expect(store.getTerrainAt(0, 0)).toBe('hazard')
      expect(store.getTerrainAt(1, 1)).toBe('hazard')
      expect(store.getTerrainAt(2, 2)).toBe('hazard')
      expect(store.getTerrainAt(3, 3)).toBe('hazard')
    })
  })

  describe('clearAll', () => {
    it('should remove all terrain', () => {
      const store = useTerrainStore()

      store.setTerrain(0, 0, 'blocking')
      store.setTerrain(1, 1, 'water')
      store.setTerrain(2, 2, 'hazard')

      expect(store.terrainCount).toBe(3)

      store.clearAll()

      expect(store.terrainCount).toBe(0)
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = useTerrainStore()

      store.setEnabled(true)
      store.setPaintMode('blocking')
      store.setBrushSize(5)
      store.setTerrain(5, 5, 'difficult')

      store.reset()

      expect(store.enabled).toBe(false)
      expect(store.paintMode).toBe('difficult')
      expect(store.brushSize).toBe(1)
      expect(store.terrainCount).toBe(0)
    })
  })

  describe('getCellsByType', () => {
    it('should return cells of a specific type', () => {
      const store = useTerrainStore()

      store.setTerrain(0, 0, 'water')
      store.setTerrain(1, 0, 'water')
      store.setTerrain(0, 1, 'blocking')
      store.setTerrain(2, 2, 'difficult')

      const waterCells = store.getCellsByType('water')
      const blockingCells = store.getCellsByType('blocking')

      expect(waterCells.length).toBe(2)
      expect(blockingCells.length).toBe(1)
    })
  })

  describe('import/export', () => {
    it('should export state correctly', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'difficult', 0, 'test')
      store.setTerrain(6, 6, 'blocking')

      const exported = store.exportState()

      expect(exported.cells.length).toBe(2)
      expect(exported.cells.some(c => c.position.x === 5 && c.position.y === 5)).toBe(true)
      expect(exported.cells.some(c => c.position.x === 6 && c.position.y === 6)).toBe(true)
    })

    it('should import state correctly', () => {
      const store = useTerrainStore()

      store.importState({
        cells: [
          { position: { x: 1, y: 1 }, type: 'water', elevation: 0 },
          { position: { x: 2, y: 2 }, type: 'hazard', elevation: 3, note: 'danger' },
        ],
      })

      expect(store.getTerrainAt(1, 1)).toBe('water')
      expect(store.getTerrainAt(2, 2)).toBe('hazard')
      expect(store.getCellAt(2, 2)?.elevation).toBe(3)
      expect(store.getCellAt(2, 2)?.note).toBe('danger')
    })
  })

  describe('brush size limits', () => {
    it('should clamp brush size to minimum 1', () => {
      const store = useTerrainStore()

      store.setBrushSize(0)
      expect(store.brushSize).toBe(1)

      store.setBrushSize(-5)
      expect(store.brushSize).toBe(1)
    })

    it('should clamp brush size to maximum 10', () => {
      const store = useTerrainStore()

      store.setBrushSize(15)
      expect(store.brushSize).toBe(10)
    })
  })
})
