---
domain: vtt-grid
mapped_at: 2026-02-28T03:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 95
files_read: 32
---

# App Capabilities: VTT Grid

> Re-mapped capability catalog for the vtt-grid domain.
> Includes: Naturewalk terrain bypass with 36 tests (ptu-rule-112), rough terrain accuracy + terrain penalty
> (ptu-rule-108+093), Naturewalk status immunity (ptu-rule-116), PTU alternating diagonal in measurement
> store (ptu-rule-083), terrain overlay + movement extraction refactoring (refactoring-087+088),
> water terrain cost per decree-008 (refactoring-002), isometric projection, player grid view,
> elevation system, A* pathfinding with terrain-aware speed averaging.

## Stores

### vtt-grid-C001
- **name:** Encounter Grid Store
- **type:** store-action
- **location:** `app/stores/encounterGrid.ts` -- useEncounterGridStore
- **game_concept:** VTT grid configuration and token management
- **description:** Pinia store providing grid-related API actions: updateCombatantPosition (POST position), updateGridConfig (PUT grid-config), setTokenSize, uploadBackgroundImage, removeBackgroundImage, loadFogState, saveFogState. Thin API wrapper -- no local state beyond actions.
- **inputs:** encounterId, position/config/file data
- **outputs:** API responses (position, config, fog state)
- **accessible_from:** gm

### vtt-grid-C002
- **name:** Fog of War Store
- **type:** store-action
- **location:** `app/stores/fogOfWar.ts` -- useFogOfWarStore
- **game_concept:** Fog of war visibility system (3-state: hidden/revealed/explored)
- **description:** Manages per-cell visibility state using Map<string, FogState>. Getters: isVisible, getCellState, revealedCells, exploredCells, visibleCount. Actions: setEnabled, setToolMode (reveal/hide/explore), setBrushSize, revealCell/hideCell/exploreCell, revealArea/hideArea/exploreArea, applyTool, revealRect/hideRect, revealAll/hideAll, reset, importState/exportState.
- **inputs:** Cell positions, brush size, tool mode
- **outputs:** FogState per cell (hidden/revealed/explored), serializable state
- **accessible_from:** gm (control), group (display)

### vtt-grid-C003
- **name:** Terrain Store
- **type:** store-action
- **location:** `app/stores/terrain.ts` -- useTerrainStore
- **game_concept:** Terrain painting and movement cost system
- **description:** Manages terrain cells Map<string, TerrainCell> with base types (normal, blocking, water, earth, hazard, elevated + legacy difficult/rough) and flags (rough: boolean, slow: boolean). Getters: getTerrainAt, getFlagsAt, getCellAt, getMovementCost (with swim/burrow capability checks), isPassable, isRoughAt, isSlowAt, allCells, getCellsByType, terrainCount. Actions: setEnabled, setPaintMode/Flags, togglePaintFlag, setBrushSize, setTerrain, clearTerrain, applyTool, eraseTool, fillRect, drawLine, clearAll, reset, importState, exportState.
- **inputs:** Positions, terrain types, flags, brush size
- **outputs:** Terrain cells with types+flags, movement costs, passability
- **accessible_from:** gm (paint), group (display)

### vtt-grid-C004
- **name:** Measurement Store
- **type:** store-action
- **location:** `app/stores/measurement.ts` -- useMeasurementStore
- **game_concept:** PTU AoE measurement tools (distance, burst, cone, line, close-blast)
- **description:** Manages measurement state: mode (none/distance/burst/cone/line/close-blast), start/end positions, AoE size, direction. Getters: distance (PTU alternating diagonal via ptuDiagonalDistance -- ptu-rule-083), affectedCells (per AoE type), result (combined). Actions: setMode, startMeasurement, updateMeasurement, endMeasurement, clearMeasurement, setAoeSize, setAoeDirection, cycleDirection. AoE shapes: burst (diamond via PTU diagonal distance), cone (fixed 3m-wide per decree-007), line (PTU alternating diagonal shortening per decree-009), close-blast (adjacent square).
- **inputs:** Grid positions, mode, size, direction
- **outputs:** MeasurementResult: { distance, affectedCells, originCell, path }
- **accessible_from:** gm, group (display)

### vtt-grid-C005
- **name:** Selection Store
- **type:** store-action
- **location:** `app/stores/selection.ts`
- **game_concept:** Token selection for multi-select operations
- **description:** Manages selected combatant IDs for batch operations.
- **inputs:** combatantId(s)
- **outputs:** Selected combatant ID set
- **accessible_from:** gm

### vtt-grid-C006
- **name:** Isometric Camera Store
- **type:** store-action
- **location:** `app/stores/isometricCamera.ts`
- **game_concept:** Isometric view camera angle management
- **description:** Manages camera angle (0/1/2/3 for 0/90/180/270 degrees) for isometric grid view.
- **inputs:** Camera angle
- **outputs:** Current angle state
- **accessible_from:** gm, group

## Terrain System

### vtt-grid-C010
- **name:** Terrain Cost Constants
- **type:** constant
- **location:** `app/stores/terrain.ts` -- TERRAIN_COSTS
- **game_concept:** Base movement costs per terrain type
- **description:** Base costs: normal=1, water=1 (decree-008: swim handles constraint), earth=Infinity (requires burrow), blocking=Infinity, hazard=1, elevated=1, difficult=2 (legacy), rough=1 (legacy). Slow flag doubles base cost (decree-010).
- **inputs:** N/A
- **outputs:** Record<TerrainType, number>
- **accessible_from:** gm, group (via store)

### vtt-grid-C011
- **name:** Terrain Display Colors
- **type:** constant
- **location:** `app/stores/terrain.ts` -- TERRAIN_COLORS, FLAG_COLORS
- **game_concept:** Visual terrain rendering
- **description:** Fill and stroke colors for each terrain type and flag overlay. Used by canvas rendering to paint terrain cells.
- **inputs:** N/A
- **outputs:** Color configurations
- **accessible_from:** gm, group (via rendering)

### vtt-grid-C012
- **name:** Legacy Terrain Migration
- **type:** utility
- **location:** `app/stores/terrain.ts` -- migrateLegacyCell
- **game_concept:** Backward compatibility for pre-flag terrain data
- **description:** Converts legacy single-type terrain cells to the multi-tag format: 'difficult' -> normal + slow flag; 'rough' -> normal + rough flag. Applied during importState for backward compatibility.
- **inputs:** Legacy terrain cell data
- **outputs:** TerrainCell with type + flags
- **accessible_from:** gm (via import)

### vtt-grid-C013
- **name:** Movement Cost Getter (with capability checks)
- **type:** store-getter
- **location:** `app/stores/terrain.ts` -- getMovementCost
- **game_concept:** Terrain-aware movement cost calculation
- **description:** Calculates movement cost at a position considering base terrain type, flags, and combatant capabilities. Blocking=Infinity, water=Infinity without swim, earth=Infinity without burrow, earth=1 with burrow. Slow flag doubles base cost (decree-010). Rough flag has no movement cost effect (accuracy only).
- **inputs:** x, y, canSwim, canBurrow
- **outputs:** number (movement cost, Infinity for impassable)
- **accessible_from:** gm, group (via composable)

## Naturewalk System (ptu-rule-112, ptu-rule-116)

### vtt-grid-C015
- **name:** Naturewalk Terrain Constants
- **type:** constant
- **location:** `app/constants/naturewalk.ts` -- NATUREWALK_TERRAIN_MAP, NATUREWALK_TERRAINS
- **game_concept:** PTU Naturewalk terrain-to-base-type mapping (p.322)
- **description:** Maps 9 PTU Naturewalk terrain categories (Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert) to app base terrain types. Multiple Naturewalk types map to 'normal' since the terrain painter uses generic types. NaturewalkTerrain type and NATUREWALK_TERRAINS array for validation.
- **inputs:** N/A
- **outputs:** Record<NaturewalkTerrain, TerrainType[]>, NaturewalkTerrain[]
- **accessible_from:** gm (via movement system)

### vtt-grid-C016
- **name:** getCombatantNaturewalks Utility
- **type:** utility
- **location:** `app/utils/combatantCapabilities.ts` -- getCombatantNaturewalks
- **game_concept:** Extract Naturewalk terrains from Pokemon capabilities
- **description:** Extracts Naturewalk terrain names from a combatant's capabilities. Checks two sources: capabilities.naturewalk (direct array) and capabilities.otherCapabilities (parsed "Naturewalk (Terrain, Terrain)" strings). Merges and deduplicates. Returns empty for human characters.
- **inputs:** combatant: Combatant
- **outputs:** ReadonlyArray<string> of Naturewalk terrain names
- **accessible_from:** gm (via movement composable)

### vtt-grid-C017
- **name:** naturewalkBypassesTerrain Utility
- **type:** utility
- **location:** `app/utils/combatantCapabilities.ts` -- naturewalkBypassesTerrain
- **game_concept:** Check if Naturewalk bypasses terrain flags (PTU p.322)
- **description:** Checks if a combatant's Naturewalk applies to a given base terrain type. If it matches, the slow flag is bypassed (treated as Basic Terrain -- cost 1) and rough flag accuracy penalty is ignored. Per decree-003: enemy-occupied rough terrain is NOT bypassed by Naturewalk.
- **inputs:** combatant: Combatant, baseTerrainType: TerrainType
- **outputs:** boolean
- **accessible_from:** gm (via movement composable)

### vtt-grid-C018
- **name:** findNaturewalkImmuneStatuses Utility (ptu-rule-116)
- **type:** utility
- **location:** `app/utils/combatantCapabilities.ts` -- findNaturewalkImmuneStatuses
- **game_concept:** Naturewalk status immunity on matching terrain (PTU p.276)
- **description:** Checks which status conditions (Slowed, Stuck) a combatant is immune to due to Naturewalk at their current position. Only applies when terrain is enabled and combatant has a position. Checks combatant's Naturewalk against the terrain type at their position. Returns array of blocked statuses.
- **inputs:** combatant, statuses, terrainCells, terrainEnabled
- **outputs:** StatusCondition[] (blocked statuses)
- **accessible_from:** gm (via combat service)

## Combatant Capabilities

### vtt-grid-C020
- **name:** Movement Capability Checks
- **type:** utility
- **location:** `app/utils/combatantCapabilities.ts` -- combatantCanSwim, combatantCanBurrow, combatantCanFly
- **game_concept:** Pokemon movement capability detection
- **description:** Pure functions checking if a combatant (Pokemon) has specific movement capabilities. Swim: capabilities.swim > 0. Burrow: capabilities.burrow > 0. Sky: capabilities.sky > 0. All return false for human characters.
- **inputs:** combatant: Combatant
- **outputs:** boolean
- **accessible_from:** gm (via movement composable)

### vtt-grid-C021
- **name:** Speed Getters
- **type:** utility
- **location:** `app/utils/combatantCapabilities.ts` -- getSkySpeed, getOverlandSpeed, getSwimSpeed, getBurrowSpeed, getSpeedForTerrain
- **game_concept:** Pokemon movement speed values
- **description:** Pure functions returning specific speed values from combatant capabilities. getSpeedForTerrain returns the appropriate speed for a terrain type (water->swim, earth->burrow, else->overland). All return default 5 (human default) for non-Pokemon.
- **inputs:** combatant: Combatant, terrainType?: string
- **outputs:** number (speed value)
- **accessible_from:** gm (via movement composable)

### vtt-grid-C022
- **name:** Speed Averaging (PTU p.231, decree-011)
- **type:** utility
- **location:** `app/utils/combatantCapabilities.ts` -- calculateAveragedSpeed
- **game_concept:** Multi-terrain movement speed averaging
- **description:** Calculates averaged movement speed when a path crosses terrain boundaries. Only averages distinct movement capabilities (Overland, Swim, Burrow) -- multiple terrain types using the same capability don't double-count. Floors the result per PTU convention.
- **inputs:** combatant: Combatant, terrainTypes: Set<string>
- **outputs:** number (averaged speed, floored)
- **accessible_from:** gm (via movement composable)

## Grid Distance

### vtt-grid-C025
- **name:** PTU Diagonal Distance (ptu-rule-083)
- **type:** utility
- **location:** `app/utils/gridDistance.ts` -- ptuDiagonalDistance
- **game_concept:** PTU alternating diagonal movement cost
- **description:** Calculates movement cost using PTU alternating diagonal rule: first diagonal costs 1m, second costs 2m, alternating. Closed-form formula: diagonals + floor(diagonals/2) + straights. Used by measurement store, pathfinding, movement validation.
- **inputs:** dx: number, dy: number
- **outputs:** number (movement cost in meters/cells)
- **accessible_from:** gm, group (via measurement display)

### vtt-grid-C026
- **name:** Max Diagonal Cells (decree-009)
- **type:** utility
- **location:** `app/utils/gridDistance.ts` -- maxDiagonalCells
- **game_concept:** Diagonal Line attack cell count with PTU alternating cost
- **description:** Calculates maximum diagonal cells reachable within a meter budget using PTU alternating diagonal rule. Used for Line attacks going diagonally (decree-009): fewer cells diagonally because each cell alternates 1-2m cost.
- **inputs:** budget: number
- **outputs:** number (cell count)
- **accessible_from:** gm, group (via measurement)

## Movement Composable

### vtt-grid-C030
- **name:** useGridMovement Composable
- **type:** composable-function
- **location:** `app/composables/useGridMovement.ts` -- useGridMovement
- **game_concept:** Comprehensive grid movement system
- **description:** Core movement composable providing: calculateMoveDistance (geometric PTU diagonal), getSpeed (terrain-aware with modifiers), getMaxPossibleSpeed (max across all capabilities), getAveragedSpeedForPath (PTU p.231 speed averaging), buildSpeedAveragingFn (for flood-fill), getTerrainTypeAt, getOccupiedCells, getEnemyOccupiedCells, getTerrainCostAt, getTerrainCostForCombatant (with Naturewalk bypass), getTerrainCostGetter, isValidMove (full validation), findCombatant.
- **inputs:** UseGridMovementOptions: { tokens, getMovementSpeed?, getCombatant?, getTokenElevation?, getTerrainElevation? }
- **outputs:** Movement functions and helpers
- **accessible_from:** gm

### vtt-grid-C031
- **name:** applyMovementModifiers (exported pure function)
- **type:** utility
- **location:** `app/composables/useGridMovement.ts` -- applyMovementModifiers
- **game_concept:** Movement-modifying conditions and combat stages
- **description:** Applies movement modifiers to base speed: Stuck=0 (hard stop, no override possible -- PTU p.231/253), Slowed=half, Speed CS (+/- half stage value, min 2 on negative -- PTU p.234/700), Sprint=+50% (temp condition). Returns max(modifiedSpeed, 1) unless base is 0.
- **inputs:** combatant: Combatant, speed: number
- **outputs:** number (modified speed)
- **accessible_from:** gm (via composable)

### vtt-grid-C032
- **name:** calculateElevationCost (exported pure function)
- **type:** utility
- **location:** `app/composables/useGridMovement.ts` -- calculateElevationCost
- **game_concept:** Elevation-based movement cost
- **description:** Calculates movement cost for elevation changes: 1 MP per level of elevation change. Flying Pokemon (Sky speed > 0) ignore elevation cost within their Sky speed range (excess costs normally).
- **inputs:** fromZ, toZ, combatant?
- **outputs:** number (elevation cost)
- **accessible_from:** gm (via composable)

### vtt-grid-C033
- **name:** Terrain-Aware Movement Validation (isValidMove)
- **type:** composable-function
- **location:** `app/composables/useGridMovement.ts` -- isValidMove
- **game_concept:** Full movement legality check
- **description:** Validates a move considering: bounds checking (with multi-cell token footprint), no-stacking rule (decree-003: cannot end on occupied square), A* pathfinding with terrain costs, elevation costs, Naturewalk bypass, speed averaging across terrain boundaries (decree-011), and movement modifiers (Stuck/Slowed/Speed CS/Sprint). Falls back to geometric check when no terrain is painted.
- **inputs:** fromPos, toPos, combatantId, gridWidth, gridHeight
- **outputs:** { valid: boolean, distance: number, blocked: boolean }
- **accessible_from:** gm

### vtt-grid-C034
- **name:** Terrain Cost for Combatant (with Naturewalk)
- **type:** composable-function
- **location:** `app/composables/useGridMovement.ts` -- getTerrainCostForCombatant
- **game_concept:** Combatant-specific terrain movement cost with Naturewalk bypass
- **description:** Gets terrain cost at a position for a specific combatant. Checks Naturewalk: if combatant has matching Naturewalk, slow flag is bypassed (base cost only, no doubling). Blocking always Infinity. Water without swim = Infinity. Earth without burrow = Infinity. Otherwise delegates to terrain store getMovementCost.
- **inputs:** x, y, combatantId
- **outputs:** number (movement cost)
- **accessible_from:** gm (via composable)

### vtt-grid-C035
- **name:** Enemy-Occupied Cells Detection (decree-003)
- **type:** composable-function
- **location:** `app/composables/useGridMovement.ts` -- getEnemyOccupiedCells
- **game_concept:** Enemy squares as rough terrain for accuracy (PTU p.231)
- **description:** Returns grid positions occupied by enemy combatants relative to a given combatant. Per decree-003: enemy-occupied squares count as rough terrain (accuracy penalty only, no movement cost change). Uses isEnemySide to determine enemy relationships across sides.
- **inputs:** combatantId: string
- **outputs:** GridPosition[]
- **accessible_from:** gm (via composable)

## Pathfinding

### vtt-grid-C040
- **name:** usePathfinding Composable
- **type:** composable-function
- **location:** `app/composables/usePathfinding.ts` -- usePathfinding
- **game_concept:** A* pathfinding with PTU rules
- **description:** Provides A* pathfinding (calculatePathCost), Dijkstra flood-fill (getMovementRangeCells), flood-fill with speed averaging (getMovementRangeCellsWithAveraging), simple cost calculation (calculateMoveCost), and full validation (validateMovement). All support terrain costs, elevation costs, and PTU alternating diagonal rules.
- **inputs:** Various per function (positions, speeds, blocked cells, cost getters)
- **outputs:** Path cost/path pairs, reachable cell sets, validation results
- **accessible_from:** gm (via composable chain)

### vtt-grid-C041
- **name:** A* Path Cost Calculation
- **type:** composable-function
- **location:** `app/composables/usePathfinding.ts` -- calculatePathCost
- **game_concept:** Optimal path finding through terrain
- **description:** A* pathfinding with PTU diagonal rules, terrain cost multipliers, elevation costs, and path reconstruction. Heuristic uses ptuDiagonalDistance + elevation cost (admissible for flying combatants). Tracks diagonal parity and elevation state per node.
- **inputs:** from, to, blockedCells, getTerrainCost?, getElevationCost?, getTerrainElevation?, fromElevation
- **outputs:** { cost: number, path: GridPosition[] } | null
- **accessible_from:** gm (via composable chain)

### vtt-grid-C042
- **name:** Flood-Fill Movement Range
- **type:** composable-function
- **location:** `app/composables/usePathfinding.ts` -- getMovementRangeCells
- **game_concept:** Movement range visualization
- **description:** Dijkstra-like flood-fill finding all reachable cells within a movement budget. Accounts for terrain costs, elevation costs, blocked cells, and PTU diagonal rules. Returns reachable positions with elevation data.
- **inputs:** origin, speed, blockedCells, terrain/elevation cost getters
- **outputs:** GridPosition[] (reachable cells)
- **accessible_from:** gm (via rendering)

### vtt-grid-C043
- **name:** Flood-Fill with Speed Averaging (PTU p.231, decree-011)
- **type:** composable-function
- **location:** `app/composables/usePathfinding.ts` -- getMovementRangeCellsWithAveraging
- **game_concept:** Movement range with terrain-type-aware speed averaging
- **description:** Extended flood-fill that tracks terrain types along each path and constrains reachable cells by averaged speed (not just max speed). Explores with maxSpeed budget, then filters cells where path cost exceeds averaged speed for terrain types encountered. Conservative approximation that never shows unreachable cells.
- **inputs:** origin, maxSpeed, blockedCells, getTerrainCost, getTerrainType, getAveragedSpeed, elevation getters
- **outputs:** GridPosition[] (reachable cells, conservatively constrained)
- **accessible_from:** gm (via rendering)

## Range Parser

### vtt-grid-C045
- **name:** useRangeParser Composable
- **type:** composable-function
- **location:** `app/composables/useRangeParser.ts` -- useRangeParser
- **game_concept:** PTU move range string parsing and AoE calculation
- **description:** Parses PTU range strings (Melee, numeric ranges, Burst N, Cone N, Line N, Close Blast N, Ranged Blast N, Self, Field, Cardinally Adjacent) into structured ParsedRange data. Delegates pathfinding to usePathfinding. Supports multi-cell token footprints for range calculations.
- **inputs:** Range strings, positions, token footprints
- **outputs:** ParsedRange data, pathfinding results
- **accessible_from:** gm (via combat system)

## Interaction

### vtt-grid-C050
- **name:** useGridInteraction Composable
- **type:** composable-function
- **location:** `app/composables/useGridInteraction.ts` -- useGridInteraction
- **game_concept:** Grid mouse/touch interaction handling
- **description:** Manages all grid input: mouse click, drag (panning, token move), zoom (wheel, pinch), hover detection, click-to-move flow, measurement tool interaction, fog of war tool interaction, terrain paint tool interaction, multi-select, touch interaction delegation. Coordinates between measurement store, fog store, terrain store, and selection store.
- **inputs:** UseGridInteractionOptions: { containerRef, config, tokens, zoom, panOffset, callbacks }
- **outputs:** Interaction state (hoveredCell, selectedToken, movementRange, isPanning, etc.)
- **accessible_from:** gm

### vtt-grid-C051
- **name:** Touch Interaction
- **type:** composable-function
- **location:** `app/composables/useTouchInteraction.ts`
- **game_concept:** Touch device grid interaction
- **description:** Handles touch events for grid interaction on mobile/tablet: tap detection, pinch-to-zoom, drag-to-pan. Separated from mouse interaction for clean event handling.
- **inputs:** Touch event streams
- **outputs:** Touch gesture results (tap, pinch zoom, pan offset)
- **accessible_from:** gm, group, player

## Rendering

### vtt-grid-C055
- **name:** useGridRendering Composable
- **type:** composable-function
- **location:** `app/composables/useGridRendering.ts` -- useGridRendering
- **game_concept:** Canvas-based grid rendering
- **description:** Renders the 2D VTT grid using HTML5 Canvas. Draws: grid lines, background image, terrain overlays with flag patterns (refactoring-087), movement range highlights with speed averaging support, AoE measurement shapes, fog of war, movement preview arrows, token sprites/avatars, speed badges, coordinate labels. Uses useCanvasDrawing for drawing primitives.
- **inputs:** UseGridRenderingOptions: { canvas, config, tokens, zoom, panOffset, movement state, speed functions }
- **outputs:** Canvas render function, scaledCellSize, resize handling
- **accessible_from:** gm, group (via components)

### vtt-grid-C056
- **name:** useCanvasDrawing Composable
- **type:** composable-function
- **location:** `app/composables/useCanvasDrawing.ts`
- **game_concept:** Canvas drawing primitives
- **description:** Provides drawing utility functions for the grid canvas: drawArrow, drawDistanceLabel, drawMessageLabel, drawCellHighlight, drawDashedRing, drawSpeedBadge, drawTerrainPattern, drawCrossPattern, drawCenterDot. Used by useGridRendering.
- **inputs:** Canvas context, positions, styles
- **outputs:** Canvas drawing calls
- **accessible_from:** gm, group (via rendering)

### vtt-grid-C057
- **name:** useCanvasRendering Composable
- **type:** composable-function
- **location:** `app/composables/useCanvasRendering.ts`
- **game_concept:** Canvas lifecycle management
- **description:** Manages canvas element lifecycle: resize observer, device pixel ratio handling, render loop coordination.
- **inputs:** Canvas element ref
- **outputs:** Canvas context, dimensions, render trigger
- **accessible_from:** gm, group

### vtt-grid-C058
- **name:** useIsometricProjection Composable
- **type:** composable-function
- **location:** `app/composables/useIsometricProjection.ts`
- **game_concept:** Isometric 2.5D view projection
- **description:** Pure math composable for isometric projection. Converts between world grid coordinates (x, y, z) and screen pixel positions with 2:1 tile ratio. Provides rotateCoords/unrotateCoords for 4 camera angles (0/90/180/270 degrees), worldToScreen/screenToWorld transformations.
- **inputs:** Grid coordinates, camera angle, dimensions
- **outputs:** Screen coordinates, grid coordinates (reverse), rotated coordinates
- **accessible_from:** gm, group (via isometric canvas)

## Terrain Persistence

### vtt-grid-C060
- **name:** useTerrainPersistence Composable
- **type:** composable-function
- **location:** `app/composables/useTerrainPersistence.ts` -- useTerrainPersistence
- **game_concept:** Terrain state save/load to server
- **description:** Persists terrain state to the server for encounter-specific terrain data. loadTerrainState: fetches terrain from API and imports into store (handles legacy migration). saveTerrainState: exports store state and PUTs to API. debouncedSave: 500ms debounced save for live painting. forceSave: immediate save. cancelPendingSave: cleanup.
- **inputs:** encounterId: string
- **outputs:** Loading/saving state, error refs
- **accessible_from:** gm

## Player Grid View

### vtt-grid-C065
- **name:** usePlayerGridView Composable
- **type:** composable-function
- **location:** `app/composables/usePlayerGridView.ts` -- usePlayerGridView
- **game_concept:** Player-facing grid interaction with information asymmetry
- **description:** Manages player grid view state: ownership detection (isOwnCombatant -- checks characterId and pokemonIds), fog-filtered visible tokens, move request flow (select own token -> tap destination -> confirm -> pending), pending move tracking with timeout, and information asymmetry (own = full data, allied = name+exactHP, enemy = name+%HP). Sends player_action WebSocket events for move requests.
- **inputs:** { characterId, pokemonIds, send, onMessage }
- **outputs:** Selection state, pending move, token visibility, ownership checks
- **accessible_from:** player

## Components

### vtt-grid-C070
- **name:** VTTContainer Component
- **type:** component
- **location:** `app/components/vtt/VTTContainer.vue`
- **game_concept:** Main VTT grid container
- **description:** Top-level container component for the VTT grid system. Manages the grid canvas, toolbar controls, and token overlays. Coordinates between rendering, interaction, and data composables.
- **inputs:** Props: encounter data, isGm flag
- **outputs:** Events: token move, token select, various grid interactions
- **accessible_from:** gm, group

### vtt-grid-C071
- **name:** GridCanvas Component
- **type:** component
- **location:** `app/components/vtt/GridCanvas.vue`
- **game_concept:** 2D tactical grid canvas
- **description:** Canvas-based grid for encounter combat. Integrates useGridRendering, useGridInteraction, and useGridMovement composables. Renders terrain, tokens, movement range, fog of war, measurement overlays.
- **inputs:** Props: encounter, config, combatants
- **outputs:** Events: token move, cell click, measurement
- **accessible_from:** gm, group

### vtt-grid-C072
- **name:** GroupGridCanvas Component
- **type:** component
- **location:** `app/components/vtt/GroupGridCanvas.vue`
- **game_concept:** Group/projector view grid canvas
- **description:** Read-only grid canvas for the group (TV/projector) view. Shows tokens, terrain, fog of war, and movement previews but does not allow interaction.
- **inputs:** Props: encounter, config
- **outputs:** N/A (display only)
- **accessible_from:** group

### vtt-grid-C073
- **name:** IsometricCanvas Component
- **type:** component
- **location:** `app/components/vtt/IsometricCanvas.vue`
- **game_concept:** Isometric 2.5D grid view
- **description:** Alternative canvas view rendering the grid in isometric projection. Uses useIsometricProjection for coordinate transformation. Supports camera rotation, elevation visualization, and token rendering in 2.5D perspective.
- **inputs:** Props: encounter, config, camera angle
- **outputs:** Events: token interactions
- **accessible_from:** gm, group

### vtt-grid-C074
- **name:** TerrainPainter Component
- **type:** component
- **location:** `app/components/vtt/TerrainPainter.vue`
- **game_concept:** Terrain painting toolbar
- **description:** Toolbar component for the terrain painting system. Provides terrain type selection (normal, water, earth, blocking, hazard, elevated), flag toggles (rough, slow), brush size slider, and erase tool. Coordinates with terrain store.
- **inputs:** N/A (reads from terrain store)
- **outputs:** Terrain store mutations via painting actions
- **accessible_from:** gm

### vtt-grid-C075
- **name:** FogOfWarToolbar Component
- **type:** component
- **location:** `app/components/vtt/FogOfWarToolbar.vue`
- **game_concept:** Fog of war control toolbar
- **description:** Toolbar for fog of war management: enable/disable toggle, tool mode selection (reveal/hide/explore), brush size, reveal all / hide all buttons.
- **inputs:** N/A (reads from fog store)
- **outputs:** Fog store mutations
- **accessible_from:** gm

### vtt-grid-C076
- **name:** MeasurementToolbar Component
- **type:** component
- **location:** `app/components/vtt/MeasurementToolbar.vue`
- **game_concept:** AoE measurement tool selection
- **description:** Toolbar for measurement tools: mode selection (distance, burst, cone, line, close-blast), AoE size, direction, cycle direction button.
- **inputs:** N/A (reads from measurement store)
- **outputs:** Measurement store mutations
- **accessible_from:** gm

### vtt-grid-C077
- **name:** GridSettingsPanel Component
- **type:** component
- **location:** `app/components/vtt/GridSettingsPanel.vue`
- **game_concept:** Grid configuration panel
- **description:** Panel for editing grid settings: width, height, cell size, grid visibility. Persists config changes via encounter grid store.
- **inputs:** Props: config
- **outputs:** Events: config change
- **accessible_from:** gm

### vtt-grid-C078
- **name:** MapUploader Component
- **type:** component
- **location:** `app/components/vtt/MapUploader.vue`
- **game_concept:** Background image upload for grid
- **description:** File upload component for setting the grid background image. Supports image preview, upload, and removal.
- **inputs:** Props: current background
- **outputs:** Events: upload, remove
- **accessible_from:** gm

### vtt-grid-C079
- **name:** ZoomControls Component
- **type:** component
- **location:** `app/components/vtt/ZoomControls.vue`
- **game_concept:** Grid zoom controls
- **description:** Zoom in/out/reset buttons for the grid view.
- **inputs:** Props: current zoom level
- **outputs:** Events: zoom change
- **accessible_from:** gm, group

### vtt-grid-C080
- **name:** CoordinateDisplay Component
- **type:** component
- **location:** `app/components/vtt/CoordinateDisplay.vue`
- **game_concept:** Grid coordinate readout
- **description:** Displays the current hovered cell coordinates and terrain information.
- **inputs:** Props: hovered cell position
- **outputs:** N/A (display only)
- **accessible_from:** gm

### vtt-grid-C081
- **name:** VTTToken Component
- **type:** component
- **location:** `app/components/vtt/VTTToken.vue`
- **game_concept:** Token sprite/avatar overlay
- **description:** Renders a combatant token on the grid with sprite image, selection indicator, and size-based scaling for multi-cell tokens.
- **inputs:** Props: combatant data, position, size, selected state
- **outputs:** Events: click, select
- **accessible_from:** gm, group

### vtt-grid-C082
- **name:** ElevationToolbar Component
- **type:** component
- **location:** `app/components/vtt/ElevationToolbar.vue`
- **game_concept:** Terrain elevation editing
- **description:** Toolbar for setting terrain elevation levels during terrain painting. Controls elevation value applied with terrain paint operations.
- **inputs:** N/A
- **outputs:** Elevation setting mutations
- **accessible_from:** gm

### vtt-grid-C083
- **name:** CameraControls Component
- **type:** component
- **location:** `app/components/vtt/CameraControls.vue`
- **game_concept:** Isometric camera angle controls
- **description:** Buttons for rotating the isometric camera by 90 degrees. Works with isometric camera store.
- **inputs:** N/A
- **outputs:** Camera angle mutations
- **accessible_from:** gm, group

## WebSocket Events

### vtt-grid-C085
- **name:** movement_preview WebSocket Event
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts`
- **game_concept:** Real-time movement preview on group view
- **description:** Broadcast when GM is previewing a token move. Shows movement arrow/path on group view before confirming the move. Includes from/to positions, combatantId, distance.
- **inputs:** MovementPreview data
- **outputs:** Broadcast to group clients
- **accessible_from:** gm, group

### vtt-grid-C086
- **name:** player_action WebSocket Event (move request)
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts`
- **game_concept:** Player move request flow
- **description:** Sent by player view to request a token move. Routed to GM only. GM can approve/deny. Includes requestId, combatantId, from/to positions, distance.
- **inputs:** PlayerMoveRequest data
- **outputs:** Routed to GM (group->GM only)
- **accessible_from:** player (send), gm (receive)

## Capability Chains

### Chain 1: Token Movement (GM)
1. **GridCanvas** captures click/drag on token
2. **useGridInteraction** manages selection and movement flow
3. **useGridMovement.isValidMove** validates: bounds, no-stacking, A* path, terrain costs, Naturewalk bypass, elevation, speed averaging, movement modifiers
4. **Store** updateCombatantPosition persists via API
5. **WebSocket** movement_preview broadcasts to group
- **Accessible from:** gm (action), group (display)

### Chain 2: Movement Range Display
1. **useGridRendering** detects selected token for movement
2. **useGridMovement.getMaxPossibleSpeed** determines max exploration budget
3. **usePathfinding.getMovementRangeCellsWithAveraging** flood-fills with terrain/elevation/averaging
4. **Canvas** highlights reachable cells in teal, unreachable in red
- **Accessible from:** gm (display)

### Chain 3: Terrain Painting
1. **TerrainPainter** provides type/flag/brush controls
2. **useGridInteraction** captures paint clicks
3. **Terrain store** applyTool/eraseTool modifies cell state
4. **useTerrainPersistence** debounce-saves to server (500ms)
5. **useGridRendering** draws terrain overlays with flag patterns
- **Accessible from:** gm only

### Chain 4: Fog of War
1. **FogOfWarToolbar** provides tool/brush controls
2. **useGridInteraction** captures reveal/hide clicks
3. **Fog store** modifies per-cell visibility
4. **useGridRendering** draws fog overlay (opaque for hidden, semi for explored)
5. **Encounter grid store** saves fog state to server
- **Accessible from:** gm (control), group (display)

### Chain 5: AoE Measurement
1. **MeasurementToolbar** selects mode/size/direction
2. **Measurement store** calculates affected cells using PTU diagonal rules
3. **useGridRendering** highlights affected cells
4. **Display** shows distance labels and AoE shapes
- **Accessible from:** gm (interaction), group (display)

### Chain 6: Player Move Request
1. **Player view** selects own token via usePlayerGridView
2. **Player taps destination**, composable calculates distance
3. **player_action** WebSocket event sent to GM
4. **GM approves/denies**, result broadcast back
5. **Token position updated if approved**
- **Accessible from:** player (request), gm (approve/deny)

### Chain 7: Naturewalk Integration
1. **getCombatantNaturewalks** extracts Naturewalk from Pokemon capabilities
2. **naturewalkBypassesTerrain** checks if Naturewalk matches cell terrain type
3. **getTerrainCostForCombatant** bypasses slow flag when Naturewalk matches
4. **findNaturewalkImmuneStatuses** blocks Slowed/Stuck when on matching terrain
5. **Combat service** uses immunity check during status application
- **Accessible from:** gm (via movement + combat systems)

## Accessibility Summary

| View | Capabilities |
|------|-------------|
| gm-only | C001 (grid store), C050 (interaction), C060 (terrain persistence), C074-C078 (painting/settings/upload toolbars), C082 (elevation toolbar) |
| gm+group | C002-C004 (fog/terrain/measurement stores), C006 (camera store), C055-C058 (rendering), C070-C073 (canvas components), C079-C081 (zoom/coord/token), C083 (camera controls), C085 (movement preview WS) |
| player-only | C065 (player grid view), C086 (player_action WS event) |
| api-only | None |

## Missing Subsystems

### MS-1: Player AoE Visualization
- **subsystem:** Players cannot use AoE measurement tools from their view. They cannot visualize burst, cone, line, or blast ranges for their Pokemon's moves.
- **actor:** player
- **ptu_basis:** PTU combat involves players selecting moves with specific AoE shapes and targeting cells. Players need to see move ranges to make tactical decisions.
- **impact:** Players must ask the GM to show AoE ranges, or estimate them mentally. This slows combat and reduces tactical depth.

### MS-2: Player Terrain Information
- **subsystem:** Players cannot see detailed terrain information (type, flags, movement cost) from their view. The group canvas shows terrain visually but without interactive inspection.
- **actor:** player
- **ptu_basis:** PTU terrain affects movement and accuracy. Players need to know which squares are rough (accuracy penalty), slow (double movement cost), or impassable to plan their turns.
- **impact:** Players can see colored terrain overlays on the group view but cannot inspect specific cell properties. Tactical planning requires GM communication.

### MS-3: Line of Sight / Cover System
- **subsystem:** No line-of-sight (LoS) or cover calculation system exists. Blocking terrain prevents movement but there is no LoS ray-casting for attack validation.
- **actor:** both
- **ptu_basis:** PTU p.229 describes Screened and Invisible targets based on terrain blocking line of sight. Elevated terrain and walls should block attacks.
- **impact:** GMs must manually adjudicate LoS and cover. No visual indicator for whether a target is in line of sight.

### MS-4: Initiative-Gated Movement
- **subsystem:** Movement validation does not gate on initiative or turn state. Any combatant can be moved at any time by the GM, regardless of whose turn it is.
- **actor:** gm
- **ptu_basis:** PTU combat is turn-based. Movement should only be available for the active combatant during their turn.
- **impact:** GM must manually track whose turn it is. The grid allows moving any token at any time, which could lead to accidental out-of-turn moves.
