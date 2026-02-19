---
domain: vtt-grid
mapped_at: 2026-02-19T00:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 98
files_read: 30
---

# App Capabilities: VTT Grid

## Summary
- Total capabilities: 98
- Types: api-endpoint(8), service-function(3), composable-function(35), store-action(29), store-getter(6), component(11), prisma-field(3), websocket-event(1), utility(2)
- Orphan capabilities: 5

---

## vtt-grid-C001: Encounter Grid Enabled Flag

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Encounter.gridEnabled`
- **Game Concept:** VTT grid toggle — whether the tactical battle grid is active for an encounter
- **Description:** Boolean flag on the Encounter model that controls whether the VTT grid is displayed. Default `false`. When enabled, position bounds checking is enforced on token moves.
- **Inputs:** Set via grid-config PUT endpoint
- **Outputs:** Drives UI rendering of grid vs. disabled state
- **Orphan:** false

## vtt-grid-C002: Encounter Grid Dimensions

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Encounter.gridWidth,gridHeight,gridCellSize`
- **Game Concept:** Battle map size — PTU uses 1 cell = 1 meter
- **Description:** Three integer fields on the Encounter model: `gridWidth` (default 20), `gridHeight` (default 15), `gridCellSize` (default 40px). Defines the battlefield dimensions and visual scale.
- **Inputs:** Set via grid-config PUT endpoint
- **Outputs:** Used by all grid rendering, movement validation, and placement logic
- **Orphan:** false

## vtt-grid-C003: Encounter Fog/Terrain State Persistence

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Encounter.fogOfWarEnabled,fogOfWarState,terrainEnabled,terrainState`
- **Game Concept:** Persistent fog of war and terrain data per encounter
- **Description:** Four fields: `fogOfWarEnabled` (boolean), `fogOfWarState` (JSON string: `{cells: [key,state][], defaultState}`), `terrainEnabled` (boolean), `terrainState` (JSON string: `{cells: TerrainCellData[]}`). Stored in SQLite as JSON strings.
- **Inputs:** Written by fog and terrain PUT endpoints
- **Outputs:** Read by fog and terrain GET endpoints
- **Orphan:** false

## vtt-grid-C004: Update Combatant Position

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/position.post.ts:default`
- **Game Concept:** Token movement on the tactical grid (1 cell = 1 meter)
- **Description:** POST endpoint that updates a single combatant's grid position within an encounter. Validates grid bounds when grid is enabled. Mutates the combatant within the JSON combatants array and re-serializes.
- **Inputs:** `{ combatantId: string, position: { x: number, y: number } }` in request body; encounter ID in URL
- **Outputs:** `{ success: true, data: { combatantId, position } }`
- **Orphan:** false

## vtt-grid-C005: Update Grid Configuration

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/grid-config.put.ts:default`
- **Game Concept:** Configure battle map — grid dimensions, cell size, enable/disable, background
- **Description:** PUT endpoint that partially updates grid configuration. Merges provided fields with existing values. Width/height validated 5-100, cellSize validated 20-100.
- **Inputs:** `Partial<{ enabled: boolean, width: number, height: number, cellSize: number, background: string }>` in request body
- **Outputs:** `{ success: true, data: { enabled, width, height, cellSize, background? } }`
- **Orphan:** false

## vtt-grid-C006: Upload Background Image

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/background.post.ts:default`
- **Game Concept:** Battle map background image upload
- **Description:** POST endpoint accepting multipart form data. Validates file type (JPEG/PNG/GIF/WebP) and size (5MB max). Converts to base64 data URL and stores in SQLite.
- **Inputs:** Multipart form data with `file` field
- **Outputs:** `{ success: true, data: { background: "data:image/...;base64,..." } }`
- **Orphan:** false

## vtt-grid-C007: Remove Background Image

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/background.delete.ts:default`
- **Game Concept:** Clear battle map background
- **Description:** DELETE endpoint that sets `gridBackground` to null on the encounter.
- **Inputs:** Encounter ID in URL
- **Outputs:** `{ success: true, data: { background: null } }`
- **Orphan:** false

## vtt-grid-C008: Get Fog of War State

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/fog.get.ts:default`
- **Game Concept:** Retrieve 3-state fog of war (hidden/revealed/explored)
- **Description:** GET endpoint that reads fog state from encounter. Parses `fogOfWarState` JSON and returns cells array + defaultState. Handles parse errors gracefully.
- **Inputs:** Encounter ID in URL
- **Outputs:** `{ success: true, data: { enabled: boolean, cells: [string, string][], defaultState: FogState } }`
- **Orphan:** false

## vtt-grid-C009: Save Fog of War State

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/fog.put.ts:default`
- **Game Concept:** Persist 3-state fog of war
- **Description:** PUT endpoint that updates fog state. Full replacement semantics on cells array. Validates `defaultState` against allowed values. Merges with existing state using `??` fallback.
- **Inputs:** `{ enabled?: boolean, cells?: [string, string][], defaultState?: 'hidden' | 'revealed' | 'explored' }` in request body
- **Outputs:** `{ success: true, data: { enabled, cells, defaultState } }`
- **Orphan:** false

## vtt-grid-C010: Get Terrain State

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/terrain.get.ts:default`
- **Game Concept:** Retrieve terrain overlay (6 terrain types with movement costs)
- **Description:** GET endpoint that reads terrain state from encounter. Parses `terrainState` JSON and returns cells array with position, type, elevation, and optional note.
- **Inputs:** Encounter ID in URL
- **Outputs:** `{ success: true, data: { enabled: boolean, cells: TerrainCellData[] } }`
- **Orphan:** false

## vtt-grid-C011: Save Terrain State

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/terrain.put.ts:default`
- **Game Concept:** Persist terrain overlay
- **Description:** PUT endpoint that updates terrain state. Full replacement semantics on cells array. Merges with existing state.
- **Inputs:** `{ enabled?: boolean, cells?: TerrainCellData[] }` in request body
- **Outputs:** `{ success: true, data: { enabled, cells } }`
- **Orphan:** false

## vtt-grid-C012: Size-to-Token Mapping

- **Type:** service-function
- **Location:** `server/services/grid-placement.service.ts:sizeToTokenSize`
- **Game Concept:** PTU creature size categories → grid cell occupation
- **Description:** Maps PTU size strings to token cell sizes: Small/Medium → 1x1, Large → 2x2, Huge → 3x3, Gigantic → 4x4.
- **Inputs:** `size: string | undefined` (PTU size category)
- **Outputs:** `number` (1, 2, 3, or 4)
- **Orphan:** false

## vtt-grid-C013: Build Occupied Cells Set

- **Type:** service-function
- **Location:** `server/services/grid-placement.service.ts:buildOccupiedCellsSet`
- **Game Concept:** Token collision detection for multi-cell tokens
- **Description:** Iterates all combatants, marks all cells occupied by each token (accounting for token size), returns a Set of "x,y" coordinate strings.
- **Inputs:** `combatants: Combatant[]` (with optional position and tokenSize)
- **Outputs:** `Set<string>` of occupied cell keys
- **Orphan:** false

## vtt-grid-C014: Find Placement Position

- **Type:** service-function
- **Location:** `server/services/grid-placement.service.ts:findPlacementPosition`
- **Game Concept:** Auto-placement of tokens by combat side (Players left, Allies center-left, Enemies right)
- **Description:** Two-pass algorithm: first scans the designated side area (columns 1-4 for players, 5-8 for allies, right edge for enemies), then falls back to global grid scan. Accounts for token size and occupied cells. Mutates occupiedCells set.
- **Inputs:** `occupiedCells: Set<string>, side: string, tokenSize: number, gridWidth: number, gridHeight: number`
- **Outputs:** `Position` (x, y)
- **Orphan:** false

## vtt-grid-C015: Update Combatant Position (Store)

- **Type:** store-action
- **Location:** `stores/encounterGrid.ts:updateCombatantPosition`
- **Game Concept:** Token movement persistence via API
- **Description:** Sends combatant position to server via POST `/api/encounters/{id}/position`. Returns the position on success.
- **Inputs:** `encounterId: string, combatantId: string, position: GridPosition`
- **Outputs:** `Promise<GridPosition>`
- **Orphan:** false

## vtt-grid-C016: Update Grid Config (Store)

- **Type:** store-action
- **Location:** `stores/encounterGrid.ts:updateGridConfig`
- **Game Concept:** Grid configuration persistence via API
- **Description:** Sends partial grid config to server via PUT `/api/encounters/{id}/grid-config`. Returns updated config.
- **Inputs:** `encounterId: string, config: Partial<GridConfig>`
- **Outputs:** `Promise<Partial<GridConfig>>`
- **Orphan:** false

## vtt-grid-C017: Set Token Size (Store)

- **Type:** store-action
- **Location:** `stores/encounterGrid.ts:setTokenSize`
- **Game Concept:** Multi-cell token sizing for large Pokemon
- **Description:** Saves the encounter with updated token size by sending the full encounter object via PUT `/api/encounters/{id}`.
- **Inputs:** `encounterId: string, encounter: Encounter, combatantId: string, size: number`
- **Outputs:** `Promise<number>`
- **Orphan:** false

## vtt-grid-C018: Upload Background Image (Store)

- **Type:** store-action
- **Location:** `stores/encounterGrid.ts:uploadBackgroundImage`
- **Game Concept:** Battle map image upload via API
- **Description:** Uploads an image file as FormData via POST `/api/encounters/{id}/background`. Returns background URL string.
- **Inputs:** `encounterId: string, file: File`
- **Outputs:** `Promise<string>` (background URL)
- **Orphan:** false

## vtt-grid-C019: Remove Background Image (Store)

- **Type:** store-action
- **Location:** `stores/encounterGrid.ts:removeBackgroundImage`
- **Game Concept:** Clear battle map image via API
- **Description:** Deletes background via DELETE `/api/encounters/{id}/background`.
- **Inputs:** `encounterId: string`
- **Outputs:** `Promise<void>`
- **Orphan:** false

## vtt-grid-C020: Load Fog State (Store)

- **Type:** store-action
- **Location:** `stores/encounterGrid.ts:loadFogState`
- **Game Concept:** Load persisted fog of war state from server
- **Description:** Fetches fog state via GET `/api/encounters/{id}/fog`. Returns `{ enabled, cells, defaultState }`.
- **Inputs:** `encounterId: string`
- **Outputs:** `Promise<{ enabled: boolean, cells: [string, string][], defaultState: string }>`
- **Orphan:** false

## vtt-grid-C021: Save Fog State (Store)

- **Type:** store-action
- **Location:** `stores/encounterGrid.ts:saveFogState`
- **Game Concept:** Persist fog of war state to server
- **Description:** Sends fog state via PUT `/api/encounters/{id}/fog`.
- **Inputs:** `encounterId: string, fogState: { enabled: boolean, cells: [string, string][], defaultState: string }`
- **Outputs:** `Promise<void>`
- **Orphan:** true — Not called directly; VTTContainer uses useFogPersistence composable instead

## vtt-grid-C022: Fog Enabled Toggle

- **Type:** store-action
- **Location:** `stores/fogOfWar.ts:setEnabled`
- **Game Concept:** Enable/disable fog of war for an encounter
- **Description:** Sets the `enabled` state property to true/false.
- **Inputs:** `enabled: boolean`
- **Outputs:** State change
- **Orphan:** false

## vtt-grid-C023: Fog Tool Mode

- **Type:** store-action
- **Location:** `stores/fogOfWar.ts:setToolMode`
- **Game Concept:** GM fog painting tool selection (reveal/hide/explore)
- **Description:** Sets the active painting tool mode for the fog brush.
- **Inputs:** `mode: 'reveal' | 'hide' | 'explore'`
- **Outputs:** State change
- **Orphan:** false

## vtt-grid-C024: Fog Brush Size

- **Type:** store-action
- **Location:** `stores/fogOfWar.ts:setBrushSize`
- **Game Concept:** Fog painting brush radius
- **Description:** Sets brush radius for fog painting, clamped to [1, 10].
- **Inputs:** `size: number`
- **Outputs:** State change
- **Orphan:** false

## vtt-grid-C025: Fog Apply Tool

- **Type:** store-action
- **Location:** `stores/fogOfWar.ts:applyTool`
- **Game Concept:** GM fog brush paint operation
- **Description:** Applies the current `toolMode` at position (x,y) using the current `brushSize` as Chebyshev-distance radius. Dispatches to `revealArea`, `hideArea`, or `exploreArea`.
- **Inputs:** `x: number, y: number`
- **Outputs:** State change — updates cellStates map
- **Orphan:** false

## vtt-grid-C026: Fog Reveal/Hide Area

- **Type:** store-action
- **Location:** `stores/fogOfWar.ts:revealArea,hideArea,exploreArea`
- **Game Concept:** Bulk fog state change within Chebyshev radius
- **Description:** Three functions that set all cells within a Chebyshev-distance radius to revealed, hidden, or explored respectively.
- **Inputs:** `centerX: number, centerY: number, radius: number`
- **Outputs:** State change — updates cellStates map for all cells in radius
- **Orphan:** false

## vtt-grid-C027: Fog Reveal/Hide Rectangle

- **Type:** store-action
- **Location:** `stores/fogOfWar.ts:revealRect,hideRect`
- **Game Concept:** Rectangular fog region operations
- **Description:** Reveals or hides all cells in a rectangular area defined by two corner coordinates.
- **Inputs:** `x1: number, y1: number, x2: number, y2: number`
- **Outputs:** State change
- **Orphan:** true — No component currently uses rectangle fog operations

## vtt-grid-C028: Fog Reveal All / Hide All

- **Type:** store-action
- **Location:** `stores/fogOfWar.ts:revealAll,hideAll`
- **Game Concept:** Bulk fog operations for scene transitions
- **Description:** `revealAll` reveals every cell on the grid (requires grid dimensions). `hideAll` clears the map and sets defaultState to 'hidden'.
- **Inputs:** `revealAll(gridWidth, gridHeight)`, `hideAll()` no params
- **Outputs:** State change — complete fog reset/reveal
- **Orphan:** false

## vtt-grid-C029: Fog Import/Export State

- **Type:** store-action
- **Location:** `stores/fogOfWar.ts:importState,exportState`
- **Game Concept:** Fog state serialization for persistence
- **Description:** `importState` replaces cellStates map from `[key, state][]` tuples. `exportState` serializes the map to tuples plus defaultState.
- **Inputs:** `importState(data: { cells: [string, FogState][], defaultState: FogState })`, `exportState()` no params
- **Outputs:** `importState`: state change; `exportState`: `{ cells: [string, FogState][], defaultState }`
- **Orphan:** false

## vtt-grid-C030: Fog Cell State Getters

- **Type:** store-getter
- **Location:** `stores/fogOfWar.ts:isVisible,getCellState,revealedCells,exploredCells,visibleCount`
- **Game Concept:** Fog visibility queries for rendering and game logic
- **Description:** Five getters: `isVisible(x,y)` returns true for revealed/explored. `getCellState(x,y)` returns exact fog state. `revealedCells` returns positions in 'revealed' state. `exploredCells` returns positions in 'explored' state. `visibleCount` counts all visible cells.
- **Inputs:** Coordinate parameters for cell-specific getters
- **Outputs:** Boolean, FogState, GridPosition[], or number
- **Orphan:** false

## vtt-grid-C031: Terrain Enabled Toggle

- **Type:** store-action
- **Location:** `stores/terrain.ts:setEnabled`
- **Game Concept:** Enable/disable terrain overlay
- **Description:** Sets the `enabled` state property.
- **Inputs:** `enabled: boolean`
- **Outputs:** State change
- **Orphan:** false

## vtt-grid-C032: Terrain Paint Mode

- **Type:** store-action
- **Location:** `stores/terrain.ts:setPaintMode`
- **Game Concept:** Select terrain type for painting (normal/difficult/blocking/water/hazard/elevated)
- **Description:** Sets the terrain type the brush will place.
- **Inputs:** `mode: TerrainType`
- **Outputs:** State change
- **Orphan:** false

## vtt-grid-C033: Terrain Brush Size

- **Type:** store-action
- **Location:** `stores/terrain.ts:setBrushSize`
- **Game Concept:** Terrain painting brush radius
- **Description:** Sets brush radius for terrain painting, clamped to [1, 10].
- **Inputs:** `size: number`
- **Outputs:** State change
- **Orphan:** false

## vtt-grid-C034: Terrain Set/Clear Cell

- **Type:** store-action
- **Location:** `stores/terrain.ts:setTerrain,clearTerrain`
- **Game Concept:** Place or remove terrain on a single cell
- **Description:** `setTerrain` sets terrain type, elevation, and note at a cell. If type is 'normal' with elevation 0 and no note, removes from map (optimization). `clearTerrain` removes a cell.
- **Inputs:** `setTerrain(x, y, type, elevation?, note?)`, `clearTerrain(x, y)`
- **Outputs:** State change
- **Orphan:** false

## vtt-grid-C035: Terrain Apply/Erase Tool

- **Type:** store-action
- **Location:** `stores/terrain.ts:applyTool,eraseTool`
- **Game Concept:** Terrain brush paint and erase operations
- **Description:** `applyTool` paints terrain using current `paintMode` and `brushSize` in Chebyshev-distance square. `eraseTool` erases terrain with current brush.
- **Inputs:** `x: number, y: number`
- **Outputs:** State change
- **Orphan:** false

## vtt-grid-C036: Terrain Fill Rectangle

- **Type:** store-action
- **Location:** `stores/terrain.ts:fillRect`
- **Game Concept:** Flood-fill a rectangular area with terrain (e.g., a lake)
- **Description:** Fills a rectangular area defined by two corners with a specified terrain type.
- **Inputs:** `x1: number, y1: number, x2: number, y2: number, type: TerrainType`
- **Outputs:** State change
- **Orphan:** true — TerrainPainter has a "fill" tool mode but the actual fillRect call path is unclear

## vtt-grid-C037: Terrain Draw Line

- **Type:** store-action
- **Location:** `stores/terrain.ts:drawLine`
- **Game Concept:** Draw terrain lines (walls, rivers) using Bresenham's algorithm
- **Description:** Draws a line of terrain between two points using Bresenham's line algorithm.
- **Inputs:** `x1: number, y1: number, x2: number, y2: number, type: TerrainType`
- **Outputs:** State change
- **Orphan:** true — TerrainPainter has a "line" tool mode but the actual drawLine call path is unclear

## vtt-grid-C038: Terrain Clear All

- **Type:** store-action
- **Location:** `stores/terrain.ts:clearAll`
- **Game Concept:** Remove all terrain from the grid
- **Description:** Clears all terrain cells from the map.
- **Inputs:** None
- **Outputs:** State change — empty terrain map
- **Orphan:** false

## vtt-grid-C039: Terrain Import/Export State

- **Type:** store-action
- **Location:** `stores/terrain.ts:importState,exportState`
- **Game Concept:** Terrain state serialization for persistence
- **Description:** `importState` replaces all terrain cells from serialized data. `exportState` serializes all cells for saving.
- **Inputs:** `importState(data: { cells: TerrainCellData[] })`, `exportState()` no params
- **Outputs:** `importState`: state change; `exportState`: `{ cells: TerrainCellData[] }`
- **Orphan:** false

## vtt-grid-C040: Terrain Cell Getters

- **Type:** store-getter
- **Location:** `stores/terrain.ts:getTerrainAt,getCellAt,getMovementCost,isPassable,allCells,getCellsByType,terrainCount`
- **Game Concept:** Terrain queries for movement, pathfinding, and rendering
- **Description:** Seven getters: `getTerrainAt(x,y)` returns TerrainType. `getCellAt(x,y)` returns full TerrainCell. `getMovementCost(x,y,canSwim?)` returns cost multiplier (water=Infinity if no swim). `isPassable(x,y,canSwim?)` returns boolean. `allCells` returns array. `getCellsByType(type)` filters. `terrainCount` counts non-default cells.
- **Inputs:** Coordinate parameters for cell-specific getters
- **Outputs:** TerrainType, TerrainCell, number, boolean, or TerrainCell[]
- **Orphan:** false

## vtt-grid-C041: Terrain Cost Constants

- **Type:** utility
- **Location:** `stores/terrain.ts:TERRAIN_COSTS`
- **Game Concept:** PTU terrain movement cost multipliers
- **Description:** Exported constant mapping terrain types to movement cost multipliers: normal=1, difficult=2, blocking=Infinity, water=2 (swim) or Infinity (no swim), hazard=1, elevated=1.
- **Inputs:** N/A
- **Outputs:** `Record<TerrainType, number>`
- **Orphan:** false

## vtt-grid-C042: Measurement Mode

- **Type:** store-action
- **Location:** `stores/measurement.ts:setMode`
- **Game Concept:** Measurement/AoE tool selection (distance/burst/cone/line/close-blast)
- **Description:** Sets the measurement mode. If set to 'none', automatically clears measurement.
- **Inputs:** `mode: MeasurementMode`
- **Outputs:** State change
- **Orphan:** false

## vtt-grid-C043: Measurement Start/Update/End/Clear

- **Type:** store-action
- **Location:** `stores/measurement.ts:startMeasurement,updateMeasurement,endMeasurement,clearMeasurement`
- **Game Concept:** Measurement lifecycle for distance/AoE calculation
- **Description:** `startMeasurement` sets origin + isActive. `updateMeasurement` moves endpoint. `endMeasurement` deactivates but preserves display. `clearMeasurement` resets all.
- **Inputs:** `startMeasurement(position)`, `updateMeasurement(position)`, others no params
- **Outputs:** State changes
- **Orphan:** false

## vtt-grid-C044: AoE Size and Direction

- **Type:** store-action
- **Location:** `stores/measurement.ts:setAoeSize,setAoeDirection,cycleDirection`
- **Game Concept:** AoE shape parameters — size (burst radius, cone length) and 8-directional aiming
- **Description:** `setAoeSize` sets size clamped to [1,10]. `setAoeDirection` sets direction. `cycleDirection` rotates clockwise through all 8 directions (N→NE→E→SE→S→SW→W→NW→N).
- **Inputs:** `setAoeSize(size)`, `setAoeDirection(direction)`, `cycleDirection()` no params
- **Outputs:** State changes
- **Orphan:** false

## vtt-grid-C045: Measurement Distance Getter

- **Type:** store-getter
- **Location:** `stores/measurement.ts:distance`
- **Game Concept:** PTU Chebyshev distance calculation (1 cell = 1 meter)
- **Description:** Calculates Chebyshev distance (max of dx, dy) between start and end positions. Returns 0 if either position is null.
- **Inputs:** Derived from startPosition and endPosition state
- **Outputs:** `number` (distance in cells/meters)
- **Orphan:** false

## vtt-grid-C046: Measurement Affected Cells Getter

- **Type:** store-getter
- **Location:** `stores/measurement.ts:affectedCells`
- **Game Concept:** AoE shape cell calculation (burst/cone/line/close-blast)
- **Description:** Computes all grid cells affected by the current measurement using internal geometry helpers: Bresenham's line, Chebyshev burst, expanding cone, close-blast square. Dispatches based on mode.
- **Inputs:** Derived from mode, startPosition, endPosition, aoeSize, aoeDirection state
- **Outputs:** `GridPosition[]`
- **Orphan:** false

## vtt-grid-C047: Measurement Result Getter

- **Type:** store-getter
- **Location:** `stores/measurement.ts:result`
- **Game Concept:** Complete measurement result assembly
- **Description:** Assembles distance, affectedCells, originCell, and path into a single MeasurementResult object.
- **Inputs:** Derived from state
- **Outputs:** `MeasurementResult | null`
- **Orphan:** false

## vtt-grid-C048: Token Selection

- **Type:** store-action
- **Location:** `stores/selection.ts:select,addToSelection,removeFromSelection,toggleSelection,selectMultiple,addMultipleToSelection,clearSelection`
- **Game Concept:** Single and multi-token selection for batch operations
- **Description:** Seven selection actions using immutable Set operations. `select` replaces selection with one ID. `addToSelection` adds to existing. `removeFromSelection` removes one. `toggleSelection` toggles. `selectMultiple` replaces with array. `addMultipleToSelection` adds array. `clearSelection` empties.
- **Inputs:** Token/combatant ID(s)
- **Outputs:** State changes to `selectedIds` Set
- **Orphan:** false

## vtt-grid-C049: Marquee Drag-Selection

- **Type:** store-action
- **Location:** `stores/selection.ts:startMarquee,updateMarquee,endMarquee,selectInRect`
- **Game Concept:** Rubber-band multi-token selection
- **Description:** `startMarquee` begins drag-select. `updateMarquee` updates rectangle. `endMarquee` finalizes. `selectInRect` resolves which tokens overlap the rectangle using AABB overlap detection with token size awareness.
- **Inputs:** `startMarquee(position)`, `updateMarquee(position)`, `selectInRect(rect, tokenPositions, additive?)`
- **Outputs:** State changes to selectedIds and marquee state
- **Orphan:** false

## vtt-grid-C050: Selection Getters

- **Type:** store-getter
- **Location:** `stores/selection.ts:selectedCount,hasSelection,isSelected,selectedArray,marqueeRect`
- **Game Concept:** Selection state queries
- **Description:** `selectedCount` returns count. `hasSelection` returns boolean. `isSelected(id)` checks one. `selectedArray` converts to array. `marqueeRect` computes normalized rectangle from marquee corners.
- **Inputs:** Selection state; `isSelected(id)` takes combatant ID
- **Outputs:** Number, boolean, string[], or rect object
- **Orphan:** false

## vtt-grid-C051: PTU Diagonal Move Distance

- **Type:** composable-function
- **Location:** `composables/useGridMovement.ts:calculateMoveDistance`
- **Game Concept:** PTU alternating diagonal movement cost (1m/2m/1m/2m...)
- **Description:** Calculates distance between two GridPositions using PTU diagonal rules. Diagonals alternate cost: `diagonals + floor(diagonals/2) + straights`.
- **Inputs:** `from: GridPosition, to: GridPosition`
- **Outputs:** `number` (distance in meters)
- **Orphan:** false

## vtt-grid-C052: Get Movement Speed

- **Type:** composable-function
- **Location:** `composables/useGridMovement.ts:getSpeed`
- **Game Concept:** Combatant movement speed lookup (PTU Overland stat)
- **Description:** Returns the combatant's movement speed by calling the provided callback, or falls back to DEFAULT_MOVEMENT_SPEED (5).
- **Inputs:** `combatantId: string`
- **Outputs:** `number` (speed in cells/meters)
- **Orphan:** false

## vtt-grid-C053: Get Blocked Cells

- **Type:** composable-function
- **Location:** `composables/useGridMovement.ts:getBlockedCells`
- **Game Concept:** Token collision detection for movement validation
- **Description:** Iterates all tokens (excluding one optionally), builds a flat array of every grid cell occupied by each token (accounting for multi-cell tokens via size).
- **Inputs:** `excludeCombatantId?: string`
- **Outputs:** `GridPosition[]`
- **Orphan:** false

## vtt-grid-C054: Terrain Cost at Cell

- **Type:** composable-function
- **Location:** `composables/useGridMovement.ts:getTerrainCostAt`
- **Game Concept:** Terrain movement cost lookup
- **Description:** Delegates to `terrainStore.getMovementCost(x, y, false)`. Has a TODO to pass `canSwim` based on combatant capability.
- **Inputs:** `x: number, y: number`
- **Outputs:** `number` (cost multiplier)
- **Orphan:** false

## vtt-grid-C055: Validate Move

- **Type:** composable-function
- **Location:** `composables/useGridMovement.ts:isValidMove`
- **Game Concept:** Movement legality check (distance vs speed, blocked cells, grid bounds)
- **Description:** Validates a move: checks distance vs speed, blocked cells, and grid bounds. Returns validity, distance, and blocked flag.
- **Inputs:** `fromPos, toPos, combatantId, gridWidth, gridHeight`
- **Outputs:** `{ valid: boolean, distance: number, blocked: boolean }`
- **Orphan:** false

## vtt-grid-C056: Screen-to-Grid Coordinate Conversion

- **Type:** composable-function
- **Location:** `composables/useGridInteraction.ts:screenToGrid`
- **Game Concept:** Mouse coordinate to grid cell mapping (accounting for zoom and pan)
- **Description:** Converts screen (mouse) coordinates to grid cell position, accounting for pan offset and zoom level.
- **Inputs:** `screenX: number, screenY: number`
- **Outputs:** `GridPosition`
- **Orphan:** false

## vtt-grid-C057: Token Hit-Testing

- **Type:** composable-function
- **Location:** `composables/useGridInteraction.ts:getTokenAtPosition`
- **Game Concept:** Click target resolution for multi-cell tokens
- **Description:** Finds a token that occupies the given grid position (accounting for multi-cell tokens).
- **Inputs:** `gridPos: GridPosition`
- **Outputs:** `TokenData | undefined`
- **Orphan:** false

## vtt-grid-C058: Grid Interaction Mouse Handlers

- **Type:** composable-function
- **Location:** `composables/useGridInteraction.ts:handleWheel,handleMouseDown,handleMouseMove,handleMouseUp`
- **Game Concept:** Grid input handling — zoom, pan, token move, fog/terrain painting, measurement, marquee
- **Description:** Four mouse event handlers. `handleWheel`: zoom toward cursor, clamped 0.25-3x. `handleMouseDown`: dispatches to pan (middle/right-click), measurement start, fog/terrain painting start, click-to-move, token select, marquee start, or cell click. `handleMouseMove`: movement preview, measurement, fog/terrain drag-paint, marquee, or pan. `handleMouseUp`: ends pan, fog/terrain painting, measurement, and marquee.
- **Inputs:** `MouseEvent` or `WheelEvent`
- **Outputs:** Various state changes and emit callbacks
- **Orphan:** false

## vtt-grid-C059: Token Selection Handler

- **Type:** composable-function
- **Location:** `composables/useGridInteraction.ts:handleTokenSelect`
- **Game Concept:** Token click-to-move and multi-selection
- **Description:** Handles token click: toggles move mode on re-click, switches token on different token click, enters move mode on first click. Supports Shift/Ctrl modifiers for multi-selection.
- **Inputs:** `combatantId: string, event?: MouseEvent`
- **Outputs:** State changes and emit callbacks
- **Orphan:** false

## vtt-grid-C060: Grid Keyboard Shortcuts

- **Type:** composable-function
- **Location:** `composables/useGridInteraction.ts:handleKeyDown`
- **Game Concept:** VTT keyboard navigation and tool switching
- **Description:** GM-only keyboard shortcuts: Ctrl+A (select all), Escape (clear), M/B/C (measurement modes), R (rotate AoE), +/- (AoE size), W (movement range), F (fog toggle), T (terrain toggle), V/H/E (fog tools), [/] (fog brush size).
- **Inputs:** `KeyboardEvent`
- **Outputs:** State changes
- **Orphan:** false

## vtt-grid-C061: Zoom Controls

- **Type:** composable-function
- **Location:** `composables/useGridInteraction.ts:zoomIn,zoomOut,resetView`
- **Game Concept:** Grid zoom and pan navigation
- **Description:** `zoomIn` increments by 0.1, capped at 3x. `zoomOut` decrements by 0.1, capped at 0.25x. `resetView` resets to 1x zoom and (0,0) pan.
- **Inputs:** None
- **Outputs:** State changes to zoom and panOffset refs
- **Orphan:** false

## vtt-grid-C062: Canvas Render Pipeline

- **Type:** composable-function
- **Location:** `composables/useGridRendering.ts:render`
- **Game Concept:** Complete VTT canvas rendering (grid, terrain, fog, measurement, movement)
- **Description:** Main render loop. Clears canvas, applies pan+zoom transform, draws layers in order: (1) background image, (2) terrain, (3) grid lines, (4) movement range, (5) movement preview arrow, (6) external movement preview (WebSocket), (7) measurement overlay, (8) fog of war (player view), (9) fog of war preview (GM view).
- **Inputs:** Reads from all connected refs and stores
- **Outputs:** Canvas pixel output
- **Orphan:** false

## vtt-grid-C063: Background Image Loader

- **Type:** composable-function
- **Location:** `composables/useGridRendering.ts:loadBackgroundImage`
- **Game Concept:** Battle map background loading from data URL
- **Description:** Loads the background URL from config into an Image element. Triggers re-render on load/error.
- **Inputs:** Reads from config.background ref
- **Outputs:** Sets backgroundImage ref
- **Orphan:** false

## vtt-grid-C064: Terrain Rendering

- **Type:** composable-function
- **Location:** `composables/useGridRendering.ts:drawTerrain`
- **Game Concept:** Visual terrain overlay (6 types with distinct patterns and colors)
- **Description:** Iterates every cell, queries terrainStore.getTerrainAt, fills with TERRAIN_COLORS background + border, draws terrain-specific patterns (X for blocking, waves for water, triangle for hazard, arrow for elevated, dots for difficult).
- **Inputs:** Canvas context, reads terrain store
- **Outputs:** Canvas pixel output
- **Orphan:** false

## vtt-grid-C065: Measurement Overlay Rendering

- **Type:** composable-function
- **Location:** `composables/useGridRendering.ts:drawMeasurementOverlay`
- **Game Concept:** AoE shape visualization (color-coded by type)
- **Description:** Draws measurement tool overlay. Color-coded: blue (distance), red (burst), amber (cone), green (line), purple (close-blast). Shows affected cells, origin marker, and distance line.
- **Inputs:** Canvas context, reads measurement store
- **Outputs:** Canvas pixel output
- **Orphan:** false

## vtt-grid-C066: Fog of War Rendering (Player View)

- **Type:** composable-function
- **Location:** `composables/useGridRendering.ts:drawFogOfWar`
- **Game Concept:** Fog visibility for players — hidden (95% opacity black), explored (50% opacity)
- **Description:** Player view only. Draws opaque fog on "hidden" cells and semi-transparent fog on "explored" cells.
- **Inputs:** Canvas context, reads fog store
- **Outputs:** Canvas pixel output
- **Orphan:** false

## vtt-grid-C067: Fog of War Preview (GM View)

- **Type:** composable-function
- **Location:** `composables/useGridRendering.ts:drawFogOfWarPreview`
- **Game Concept:** GM fog state preview — red tint + X for hidden, amber tint + dot for explored
- **Description:** GM view only. Shows fog state without blocking view. Hidden cells get red tint + cross pattern. Explored cells get amber tint + center dot.
- **Inputs:** Canvas context, reads fog store
- **Outputs:** Canvas pixel output
- **Orphan:** false

## vtt-grid-C068: Movement Range Rendering

- **Type:** composable-function
- **Location:** `composables/useGridRendering.ts:drawMovementRange`
- **Game Concept:** Reachable cells overlay considering speed, terrain costs, and blocked cells
- **Description:** Draws reachable cells for selected token. Uses Dijkstra flood-fill from useRangeParser. Draws cyan-tinted cells, dashed ring around origin, and speed badge.
- **Inputs:** Canvas context, selected token, reads terrain store
- **Outputs:** Canvas pixel output
- **Orphan:** false

## vtt-grid-C069: Movement Preview Rendering

- **Type:** composable-function
- **Location:** `composables/useGridRendering.ts:drawMovementPreview`
- **Game Concept:** Click-to-move preview arrow with distance and validity
- **Description:** Draws target cell highlight, arrow from token to cursor, distance label, and "Out of range"/"Blocked" message for invalid moves.
- **Inputs:** Canvas context, moving token, hovered cell
- **Outputs:** Canvas pixel output
- **Orphan:** false

## vtt-grid-C070: External Movement Preview Rendering

- **Type:** composable-function
- **Location:** `composables/useGridRendering.ts:drawExternalMovementPreview`
- **Game Concept:** WebSocket movement preview on group/player view
- **Description:** Draws a movement preview received from WebSocket for group view. Shows movement range grid, origin ring, speed badge, arrow, and distance label.
- **Inputs:** Canvas context, MovementPreview object from WebSocket
- **Outputs:** Canvas pixel output
- **Orphan:** false

## vtt-grid-C071: Canvas Drawing Primitives

- **Type:** composable-function
- **Location:** `composables/useCanvasDrawing.ts:drawArrow,drawDistanceLabel,drawMessageLabel,drawCellHighlight,drawDashedRing,drawSpeedBadge,drawTerrainPattern,drawCrossPattern,drawCenterDot`
- **Game Concept:** VTT rendering primitives for grid overlays
- **Description:** Nine pure drawing functions: arrows with arrowheads (dashed), distance text labels, message labels, cell fills with borders, dashed circle markers, speed badges, terrain type patterns (X/waves/triangle/arrow/dots), cross patterns for fog, and center dots for explored fog.
- **Inputs:** Canvas context + specific options per function
- **Outputs:** Canvas pixel output
- **Orphan:** false

## vtt-grid-C072: Legacy Canvas Rendering

- **Type:** composable-function
- **Location:** `composables/useCanvasRendering.ts:drawGrid,drawTerrainPattern,drawMovementArrow,drawCellHighlight,drawMovementRange,drawFogOfWar,drawFogOfWarPreview,calculateMoveDistance`
- **Game Concept:** Standalone VTT rendering utilities (legacy version)
- **Description:** Eight functions — standalone versions that take raw config/callbacks rather than refs. Includes grid lines, terrain patterns, movement arrows, cell highlights, movement range fill, fog of war (player + GM), and PTU diagonal distance. Partially superseded by useGridRendering + useCanvasDrawing.
- **Inputs:** Canvas context + direct config/callback parameters
- **Outputs:** Canvas pixel output or number (distance)
- **Orphan:** true — Likely superseded by useGridRendering + useCanvasDrawing composition

## vtt-grid-C073: Fog Persistence Load

- **Type:** composable-function
- **Location:** `composables/useFogPersistence.ts:loadFogState`
- **Game Concept:** Load fog of war state from server into fog store
- **Description:** Fetches fog state via GET `/api/encounters/{id}/fog`. Calls `fogOfWarStore.setEnabled()` and `fogOfWarStore.importState()` with received data.
- **Inputs:** `encounterId: string`
- **Outputs:** `Promise<boolean>` (success/failure)
- **Orphan:** false

## vtt-grid-C074: Fog Persistence Save

- **Type:** composable-function
- **Location:** `composables/useFogPersistence.ts:saveFogState`
- **Game Concept:** Save fog of war state from store to server
- **Description:** Exports state from fogOfWarStore and sends via PUT `/api/encounters/{id}/fog`.
- **Inputs:** `encounterId: string`
- **Outputs:** `Promise<boolean>` (success/failure)
- **Orphan:** false

## vtt-grid-C075: Fog Debounced Save

- **Type:** composable-function
- **Location:** `composables/useFogPersistence.ts:debouncedSave,cancelPendingSave,forceSave`
- **Game Concept:** Auto-save fog state with 500ms debounce
- **Description:** `debouncedSave` queues a save with 500ms debounce. `cancelPendingSave` clears pending timer. `forceSave` cancels debounce and saves immediately.
- **Inputs:** `encounterId: string`
- **Outputs:** State changes; `forceSave` returns `Promise<boolean>`
- **Orphan:** false

## vtt-grid-C076: Terrain Persistence Load

- **Type:** composable-function
- **Location:** `composables/useTerrainPersistence.ts:loadTerrainState`
- **Game Concept:** Load terrain state from server into terrain store
- **Description:** Fetches terrain state via GET `/api/encounters/{id}/terrain`. Calls `terrainStore.setEnabled()` and `terrainStore.importState()`.
- **Inputs:** `encounterId: string`
- **Outputs:** `Promise<boolean>` (success/failure)
- **Orphan:** false

## vtt-grid-C077: Terrain Persistence Save

- **Type:** composable-function
- **Location:** `composables/useTerrainPersistence.ts:saveTerrainState`
- **Game Concept:** Save terrain state from store to server
- **Description:** Exports state from terrainStore and sends via PUT `/api/encounters/{id}/terrain`.
- **Inputs:** `encounterId: string`
- **Outputs:** `Promise<boolean>` (success/failure)
- **Orphan:** false

## vtt-grid-C078: Terrain Debounced Save

- **Type:** composable-function
- **Location:** `composables/useTerrainPersistence.ts:debouncedSave,cancelPendingSave,forceSave`
- **Game Concept:** Auto-save terrain state with 500ms debounce
- **Description:** `debouncedSave` queues a save with 500ms debounce. `cancelPendingSave` clears pending timer. `forceSave` cancels and saves immediately.
- **Inputs:** `encounterId: string`
- **Outputs:** State changes; `forceSave` returns `Promise<boolean>`
- **Orphan:** false

## vtt-grid-C079: Parse PTU Range String

- **Type:** composable-function
- **Location:** `composables/useRangeParser.ts:parseRange`
- **Game Concept:** PTU move range string parsing (Self, Field, Melee, Burst N, Cone N, etc.)
- **Description:** Parses PTU range strings into structured data. Handles: Self, Field, Melee, Cardinally Adjacent, Burst N, Cone N, Close Blast N, Ranged Blast N, Line N, simple numeric ranges, and fallback. Extracts target count, base range, and line width.
- **Inputs:** `rangeString: string`
- **Outputs:** `RangeParseResult` (type, range, aoeSize?, targetCount?, width?, minRange?, special?)
- **Orphan:** false

## vtt-grid-C080: Check Range

- **Type:** composable-function
- **Location:** `composables/useRangeParser.ts:isInRange`
- **Game Concept:** Range validation for move targeting
- **Description:** Checks if a target position is within the parsed range of an attacker. Uses Chebyshev distance. Special handling for self, field, and cardinally-adjacent ranges. Respects minRange.
- **Inputs:** `attacker: GridPosition, target: GridPosition, parsedRange: RangeParseResult`
- **Outputs:** `boolean`
- **Orphan:** false

## vtt-grid-C081: Get AoE Affected Cells

- **Type:** composable-function
- **Location:** `composables/useRangeParser.ts:getAffectedCells`
- **Game Concept:** AoE shape computation for PTU moves (burst/cone/blast/line)
- **Description:** Computes all grid cells affected by an AoE shape. Burst: Chebyshev square. Cone: expanding triangle. Close-blast/ranged-blast: NxN square. Line: straight with optional width. De-duplicates results.
- **Inputs:** `origin: GridPosition, direction: string, parsedRange: RangeParseResult`
- **Outputs:** `GridPosition[]`
- **Orphan:** false

## vtt-grid-C082: Dijkstra Movement Range

- **Type:** composable-function
- **Location:** `composables/useRangeParser.ts:getMovementRangeCells`
- **Game Concept:** Movement flood-fill with PTU diagonal parity and terrain costs
- **Description:** Dijkstra-based flood-fill exploring all 8 directions. Tracks diagonal parity for PTU alternating cost (1/2/1/2). Multiplies base cost by terrain cost. Skips blocked cells and impassable terrain. Returns all reachable cells within movement budget.
- **Inputs:** `origin: GridPosition, speed: number, blockedCells: GridPosition[], getTerrainCost?: (x,y) => number`
- **Outputs:** `GridPosition[]`
- **Orphan:** false

## vtt-grid-C083: Movement Validation

- **Type:** composable-function
- **Location:** `composables/useRangeParser.ts:validateMovement`
- **Game Concept:** Full movement legality check with reason strings
- **Description:** Validates movement: checks blocked destination, impassable terrain, uses Dijkstra flood-fill to verify reachability. Returns reason string: "Destination is blocked", "Destination is impassable terrain", "Exceeds movement speed", "Cannot reach destination".
- **Inputs:** `from, to, speed, blockedCells?, getTerrainCost?`
- **Outputs:** `{ valid: boolean, distance: number, cost: number, reason?: string }`
- **Orphan:** false

## vtt-grid-C084: A* Pathfinding

- **Type:** composable-function
- **Location:** `composables/useRangeParser.ts:calculatePathCost`
- **Game Concept:** Optimal path calculation with PTU diagonal parity and terrain awareness
- **Description:** A* pathfinding with PTU diagonal parity tracking. Uses PTU diagonal distance as heuristic. Accounts for terrain cost multipliers. Returns optimal path cost and positions, or null if no path exists.
- **Inputs:** `from, to, blockedCells?, getTerrainCost?`
- **Outputs:** `{ cost: number, path: GridPosition[] } | null`
- **Orphan:** false

## vtt-grid-C085: Calculate Move Cost

- **Type:** composable-function
- **Location:** `composables/useRangeParser.ts:calculateMoveCost`
- **Game Concept:** PTU diagonal movement cost formula
- **Description:** Minimum movement cost between two points: `diagonals + floor(diagonals/2) + straights`.
- **Inputs:** `from: GridPosition, to: GridPosition`
- **Outputs:** `number`
- **Orphan:** false

## vtt-grid-C086: VTT Container Component

- **Type:** component
- **Location:** `components/vtt/VTTContainer.vue`
- **Game Concept:** Top-level VTT orchestrator — grid, fog, terrain, measurement, selection, settings
- **Description:** Main GM VTT component. Composes GridCanvas with all toolbars (Measurement, FogOfWar, TerrainPainter, GridSettings). Manages fog/terrain persistence (auto-save on state change), grid toggle, background upload, token selection panel. Loads fog + terrain state when encounter changes.
- **Inputs:** Props: config (GridConfig), combatants, currentTurnId, isGm, encounterId
- **Outputs:** Emits: configUpdate, tokenMove, backgroundUpload, backgroundRemove, multiSelect, movementPreviewChange
- **Orphan:** false

## vtt-grid-C087: Grid Canvas Component

- **Type:** component
- **Location:** `components/vtt/GridCanvas.vue`
- **Game Concept:** Core VTT rendering engine — canvas + token HTML overlay
- **Description:** Wires together useGridMovement, useGridRendering, and useGridInteraction composables. Renders canvas layers (terrain, grid, fog, measurement, movement) plus HTML token overlay with VTTToken components. Handles resize, keyboard, and mouse events. Manages zoom and pan.
- **Inputs:** Props: config, tokens, combatants, currentTurnId, isGm, showZoomControls, showCoordinates, showMovementRange, getMovementSpeed, externalMovementPreview
- **Outputs:** Emits: tokenMove, tokenSelect, cellClick, multiSelect, movementPreviewChange
- **Orphan:** false

## vtt-grid-C088: Group Grid Canvas Component

- **Type:** component
- **Location:** `components/vtt/GroupGridCanvas.vue`
- **Game Concept:** Read-only VTT for TV/projector group display
- **Description:** Thin wrapper around GridCanvas with `isGm=false`. Receives movement preview from WebSocket for real-time GM action mirroring. 4K responsive styling for projector display.
- **Inputs:** Props: config, combatants, currentTurnId, movementPreview
- **Outputs:** None (read-only)
- **Orphan:** false

## vtt-grid-C089: VTT Token Component

- **Type:** component
- **Location:** `components/vtt/VTTToken.vue`
- **Game Concept:** Combatant token on VTT — sprite, HP bar, name, side coloring, size
- **Description:** Renders a combatant token with: Pokemon sprite (Gen5 pixel art or Gen6+ 3D) or character avatar, HP bar (green/amber/red), name label on hover, side-based glow (players/allies/enemies), multi-cell size badge, fainted state (greyscale + opacity), current turn indicator, multi-selection outline.
- **Inputs:** Props: token, cellSize, combatant, isCurrentTurn, isSelected, isMultiSelected, isGm
- **Outputs:** Emits: select (combatantId, MouseEvent)
- **Orphan:** false

## vtt-grid-C090: Map Uploader Component

- **Type:** component
- **Location:** `components/vtt/MapUploader.vue`
- **Game Concept:** Battle map background image upload with drag-and-drop
- **Description:** File upload component with drag-and-drop zone. Validates file type (JPEG/PNG/GIF/WebP) and size (5MB). Converts to base64, POSTs to background endpoint. Shows preview and replace/remove options.
- **Inputs:** Props: encounterId, currentBackground
- **Outputs:** Emits: backgroundChange (url | null)
- **Orphan:** false

## vtt-grid-C091: Terrain Painter Component

- **Type:** component
- **Location:** `components/vtt/TerrainPainter.vue`
- **Game Concept:** Terrain painting toolbar with 6 PTU terrain types
- **Description:** Terrain editing toolbar with: type selector (normal/difficult/blocking/water/hazard/elevated), brush size slider (1-5), tool modes (paint/erase/line/fill), clear all, terrain legend with costs, and keyboard shortcut hints.
- **Inputs:** None (reads directly from terrain store)
- **Outputs:** None (writes directly to terrain store)
- **Orphan:** false

## vtt-grid-C092: Zoom Controls Component

- **Type:** component
- **Location:** `components/vtt/ZoomControls.vue`
- **Game Concept:** Grid zoom navigation
- **Description:** HUD overlay with zoom in (+), zoom out (-), zoom percentage display, and reset view (home icon) buttons.
- **Inputs:** Props: zoom (number)
- **Outputs:** Emits: zoomIn, zoomOut, reset
- **Orphan:** false

## vtt-grid-C093: Measurement Toolbar Component

- **Type:** component
- **Location:** `components/vtt/MeasurementToolbar.vue`
- **Game Concept:** PTU AoE shape tools (distance/burst/cone/line/close-blast)
- **Description:** Measurement mode selector with: 5 mode buttons (distance, burst, cone, line, close-blast), AoE size controls (1-10), direction cycling with arrow display (8 directions), clear button. Shows keyboard shortcut hints (M, B, C, L).
- **Inputs:** Props: mode, aoeSize, aoeDirection
- **Outputs:** Emits: setMode, increaseSize, decreaseSize, cycleDirection, clear
- **Orphan:** false

## vtt-grid-C094: Fog of War Toolbar Component

- **Type:** component
- **Location:** `components/vtt/FogOfWarToolbar.vue`
- **Game Concept:** Fog of war painting tools (reveal/hide/explore) with bulk operations
- **Description:** GM-only toolbar with: fog toggle, tool buttons (reveal/hide/explore), brush size controls (1-10), bulk actions (reveal all/hide all). Shows keyboard shortcut hints (V, H, E).
- **Inputs:** Props: enabled, toolMode, brushSize
- **Outputs:** Emits: toggle, setTool, increaseBrush, decreaseBrush, revealAll, hideAll
- **Orphan:** false

## vtt-grid-C095: Grid Settings Panel Component

- **Type:** component
- **Location:** `components/vtt/GridSettingsPanel.vue`
- **Game Concept:** Grid dimension and background configuration
- **Description:** Settings form with: width input (5-100 cells), height input (5-100 cells), cell size input (20-100px), background image upload/preview/remove, apply and reset buttons.
- **Inputs:** Props: config, isUploading, uploadError
- **Outputs:** Emits: update, apply, reset, uploadBackground, removeBackground
- **Orphan:** false

## vtt-grid-C096: Coordinate Display Component

- **Type:** component
- **Location:** `components/vtt/CoordinateDisplay.vue`
- **Game Concept:** Grid coordinate and measurement readout
- **Description:** HUD overlay showing: current cell coordinates (x,y), active measurement mode, and distance in meters. Positioned bottom-left of canvas.
- **Inputs:** Props: cell (GridPosition | null), mode (MeasurementMode), distance (number)
- **Outputs:** None
- **Orphan:** false

## vtt-grid-C097: Movement Preview WebSocket Event

- **Type:** websocket-event
- **Location:** `server/routes/ws.ts:movement_preview`
- **Game Concept:** Real-time GM movement preview broadcast to group/player view
- **Description:** GM client sends `movement_preview` event with combatant ID, from/to positions, distance, and validity. Server broadcasts to all peers in the same encounter room (excluding sender). Group view renders the preview arrow in real-time.
- **Inputs:** `{ type: 'movement_preview', data: { combatantId, fromPosition, toPosition, distance, isValid } }`
- **Outputs:** Broadcast to encounter room peers
- **Orphan:** false

## vtt-grid-C098: VTT Spatial Types

- **Type:** utility
- **Location:** `types/spatial.ts`
- **Game Concept:** VTT type definitions — GridPosition, GridConfig, TokenState, TerrainType, RangeType, etc.
- **Description:** Core type definitions used across the VTT system: GridPosition, PixelPosition, GridConfig, TokenState (with visible and elevation), MovementSpeeds (overland/swim/sky/burrow/levitate/teleport), TerrainType (6 types), TerrainCell, RangeType (10 types), ParsedRange, AffectedArea, DistanceResult, MovementPath, VTTWebSocketEvent (4 event types defined but not all handled).
- **Inputs:** N/A (type definitions)
- **Outputs:** N/A (type definitions)
- **Orphan:** false

---

## Capability Chains

### Chain 1: Token Movement (Click-to-Move)
1. `vtt-grid-C087` (component: GridCanvas) → 2. `vtt-grid-C058` (composable: handleMouseDown/handleMouseUp) → 3. `vtt-grid-C059` (composable: handleTokenSelect) → 4. `vtt-grid-C055` (composable: isValidMove) → 5. `vtt-grid-C051` (composable: calculateMoveDistance) → 6. `vtt-grid-C015` (store-action: updateCombatantPosition) → 7. `vtt-grid-C004` (api-endpoint: POST position) → 8. `vtt-grid-C001` (prisma-field: gridEnabled for bounds check)
**Breaks at:** complete

### Chain 2: Movement Range Display
1. `vtt-grid-C086` (component: VTTContainer) → 2. `vtt-grid-C087` (component: GridCanvas) → 3. `vtt-grid-C062` (composable: render) → 4. `vtt-grid-C068` (composable: drawMovementRange) → 5. `vtt-grid-C082` (composable: getMovementRangeCells / Dijkstra) → 6. `vtt-grid-C054` (composable: getTerrainCostAt) → 7. `vtt-grid-C040` (store-getter: getMovementCost) → 8. `vtt-grid-C041` (utility: TERRAIN_COSTS)
**Breaks at:** complete

### Chain 3: Movement Preview WebSocket Sync
1. `vtt-grid-C058` (composable: handleMouseMove — generates preview) → 2. `vtt-grid-C086` (component: VTTContainer — emits movementPreviewChange) → 3. `vtt-grid-C097` (websocket: movement_preview broadcast) → 4. `vtt-grid-C088` (component: GroupGridCanvas — receives preview) → 5. `vtt-grid-C087` (component: GridCanvas — passes to rendering) → 6. `vtt-grid-C070` (composable: drawExternalMovementPreview)
**Breaks at:** complete

### Chain 4: Fog of War Paint → Persist → Render
1. `vtt-grid-C094` (component: FogOfWarToolbar — set tool/brush) → 2. `vtt-grid-C023` (store-action: setToolMode) → 3. `vtt-grid-C058` (composable: handleMouseDown/handleMouseMove — fog painting) → 4. `vtt-grid-C025` (store-action: applyTool) → 5. `vtt-grid-C026` (store-action: revealArea/hideArea/exploreArea) → 6. `vtt-grid-C086` (component: VTTContainer — watches fogOfWarStore) → 7. `vtt-grid-C075` (composable: debouncedSave) → 8. `vtt-grid-C074` (composable: saveFogState) → 9. `vtt-grid-C009` (api-endpoint: PUT fog)
**Breaks at:** complete

### Chain 5: Fog of War Load → Store → Render
1. `vtt-grid-C086` (component: VTTContainer — watches encounterId) → 2. `vtt-grid-C073` (composable: loadFogState) → 3. `vtt-grid-C008` (api-endpoint: GET fog) → 4. `vtt-grid-C003` (prisma-field: fogOfWarState) → 5. `vtt-grid-C029` (store-action: importState) → 6. `vtt-grid-C062` (composable: render) → 7. `vtt-grid-C066` (composable: drawFogOfWar — player) / `vtt-grid-C067` (composable: drawFogOfWarPreview — GM)
**Breaks at:** complete

### Chain 6: Terrain Paint → Persist → Render
1. `vtt-grid-C091` (component: TerrainPainter — set paint mode/brush) → 2. `vtt-grid-C032` (store-action: setPaintMode) → 3. `vtt-grid-C058` (composable: handleMouseDown/handleMouseMove — terrain painting) → 4. `vtt-grid-C035` (store-action: applyTool) → 5. `vtt-grid-C086` (component: VTTContainer — watches terrainStore) → 6. `vtt-grid-C078` (composable: debouncedSave) → 7. `vtt-grid-C077` (composable: saveTerrainState) → 8. `vtt-grid-C011` (api-endpoint: PUT terrain)
**Breaks at:** complete

### Chain 7: Terrain Load → Store → Render
1. `vtt-grid-C086` (component: VTTContainer — watches encounterId) → 2. `vtt-grid-C076` (composable: loadTerrainState) → 3. `vtt-grid-C010` (api-endpoint: GET terrain) → 4. `vtt-grid-C003` (prisma-field: terrainState) → 5. `vtt-grid-C039` (store-action: importState) → 6. `vtt-grid-C062` (composable: render) → 7. `vtt-grid-C064` (composable: drawTerrain)
**Breaks at:** complete

### Chain 8: Measurement Tool
1. `vtt-grid-C093` (component: MeasurementToolbar — select mode) → 2. `vtt-grid-C042` (store-action: setMode) → 3. `vtt-grid-C058` (composable: handleMouseDown — starts measurement) → 4. `vtt-grid-C043` (store-action: startMeasurement/updateMeasurement/endMeasurement) → 5. `vtt-grid-C046` (store-getter: affectedCells — geometry computation) → 6. `vtt-grid-C062` (composable: render) → 7. `vtt-grid-C065` (composable: drawMeasurementOverlay)
**Breaks at:** complete

### Chain 9: Grid Configuration
1. `vtt-grid-C095` (component: GridSettingsPanel — width/height/cellSize inputs) → 2. `vtt-grid-C086` (component: VTTContainer — applySettings) → 3. `vtt-grid-C016` (store-action: updateGridConfig) → 4. `vtt-grid-C005` (api-endpoint: PUT grid-config) → 5. `vtt-grid-C002` (prisma-field: gridWidth/gridHeight/gridCellSize)
**Breaks at:** complete

### Chain 10: Background Image Upload
1. `vtt-grid-C095` (component: GridSettingsPanel — file input) / `vtt-grid-C090` (component: MapUploader — drag-and-drop) → 2. `vtt-grid-C086` (component: VTTContainer — handleBackgroundUpload) → 3. `vtt-grid-C018` (store-action: uploadBackgroundImage) → 4. `vtt-grid-C006` (api-endpoint: POST background) → 5. `vtt-grid-C063` (composable: loadBackgroundImage → render)
**Breaks at:** complete

### Chain 11: Token Selection and Marquee
1. `vtt-grid-C087` (component: GridCanvas — mouse events) → 2. `vtt-grid-C058` (composable: handleMouseDown/handleMouseMove/handleMouseUp) → 3. `vtt-grid-C049` (store-action: startMarquee/updateMarquee/endMarquee/selectInRect) → 4. `vtt-grid-C048` (store-action: select/selectMultiple) → 5. `vtt-grid-C050` (store-getter: selectedArray/hasSelection)
**Breaks at:** complete

### Chain 12: Auto-Placement on Combatant Add
1. External: POST `/api/encounters/{id}/combatants` → 2. `vtt-grid-C013` (service: buildOccupiedCellsSet) → 3. `vtt-grid-C014` (service: findPlacementPosition) → 4. `vtt-grid-C012` (service: sizeToTokenSize)
**Breaks at:** complete

### Chain 13: A* Pathfinding
1. `vtt-grid-C084` (composable: calculatePathCost) → 2. `vtt-grid-C054` (composable: getTerrainCostAt) → 3. `vtt-grid-C040` (store-getter: getMovementCost) → 4. `vtt-grid-C041` (utility: TERRAIN_COSTS)
**Breaks at:** complete — but no UI currently invokes A* pathfinding for display

### Chain 14: Range Parsing for Move Targeting
1. `vtt-grid-C079` (composable: parseRange) → 2. `vtt-grid-C080` (composable: isInRange) → 3. `vtt-grid-C081` (composable: getAffectedCells)
**Breaks at:** complete as computation — but no UI currently shows move-specific range/AoE from parsed move data
