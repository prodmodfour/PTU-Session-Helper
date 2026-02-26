// VTT pathfinding function types
// Extracted from composables to break circular dependency between
// usePathfinding.ts and useRangeParser.ts.

// Terrain cost function: returns movement cost multiplier at a grid position.
// Returns Infinity for impassable terrain.
export type TerrainCostGetter = (x: number, y: number) => number

// Elevation cost function: returns movement cost for transitioning between
// two elevation levels. Flying Pokemon may return 0 within Sky speed range.
export type ElevationCostGetter = (fromZ: number, toZ: number) => number

// Terrain elevation getter: returns the ground elevation at a grid position.
export type TerrainElevationGetter = (x: number, y: number) => number
