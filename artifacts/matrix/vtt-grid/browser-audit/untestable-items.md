# Browser Audit: vtt-grid -- Untestable Items

Items classified as Untestable because they are composables, utilities, API endpoints, or WebSocket events with no direct UI terminus. Their effects are visible through the components that consume them, but they cannot be independently verified via the accessibility tree.

---

## Composables (no direct UI element)

### C010 -- useCanvasRendering composable
- **Type:** composable-function
- **Location:** `app/composables/useCanvasRendering.ts`
- **Reason:** Canvas setup/lifecycle management. No UI output -- consumed by GridCanvas and IsometricCanvas. Canvas element itself is verified through C041/C042.

### C011 -- useCanvasDrawing composable
- **Type:** composable-function
- **Location:** `app/composables/useCanvasDrawing.ts`
- **Reason:** Low-level canvas drawing primitives. Visual output verified through rendered grid (C041/C042), but drawing functions have no independent UI presence.

### C012 -- useGridRendering composable
- **Type:** composable-function
- **Location:** `app/composables/useGridRendering.ts`
- **Reason:** 2D render pipeline. Visual output verified through GridCanvas (C041) rendering tokens, grid lines, and overlays.

### C013 -- useGridInteraction composable
- **Type:** composable-function
- **Location:** `app/composables/useGridInteraction.ts`
- **Reason:** Mouse/touch event handling for 2D grid. No UI element -- produces click/drag events consumed by GridCanvas. Token cursor=pointer hints at interaction support.

### C014 -- useGridMovement composable
- **Type:** composable-function
- **Location:** `app/composables/useGridMovement.ts`
- **Reason:** Movement validation and range calculation. No direct UI -- consumed by grid interaction composables. Movement range overlay is canvas-drawn, not in accessibility tree.

### C015 -- useTerrainPersistence composable
- **Type:** composable-function
- **Location:** `app/composables/useTerrainPersistence.ts`
- **Reason:** Terrain save/load to server. No UI -- operates between terrain store and API endpoints.

### C016 -- useRangeParser composable
- **Type:** composable-function
- **Location:** `app/composables/useRangeParser.ts`
- **Reason:** Range notation parsing and AoE calculation. No UI -- consumed by measurement store and grid rendering.

### C020 -- useIsometricProjection composable
- **Type:** composable-function
- **Location:** `app/composables/useIsometricProjection.ts`
- **Reason:** Pure math for isometric coordinate transforms. No UI output.

### C021 -- useIsometricCamera composable
- **Type:** composable-function
- **Location:** `app/composables/useIsometricCamera.ts`
- **Reason:** Camera control logic wrapping store. UI terminus is CameraControls (C044), verified there.

### C022 -- useIsometricRendering composable
- **Type:** composable-function
- **Location:** `app/composables/useIsometricRendering.ts`
- **Reason:** Full isometric render pipeline. Visual output verified through IsometricCanvas (C042) rendering.

### C023 -- useIsometricInteraction composable
- **Type:** composable-function
- **Location:** `app/composables/useIsometricInteraction.ts`
- **Reason:** Mouse/touch event handling for isometric grid. No independent UI element.

### C024 -- useIsometricOverlays composable
- **Type:** composable-function
- **Location:** `app/composables/useIsometricOverlays.ts`
- **Reason:** Fog/terrain/measurement overlay rendering. Canvas-drawn, not in accessibility tree.

### C025 -- useDepthSorting composable
- **Type:** composable-function
- **Location:** `app/composables/useDepthSorting.ts`
- **Reason:** Painter's algorithm depth ordering. Pure logic, no UI.

### C026 -- useElevation composable
- **Type:** composable-function
- **Location:** `app/composables/useElevation.ts`
- **Reason:** Elevation state management. UI terminus is ElevationToolbar (C045), verified there.

### C030 -- usePathfinding composable
- **Type:** composable-function
- **Location:** `app/composables/usePathfinding.ts`
- **Reason:** A* pathfinding algorithm. No UI -- produces reachable cell arrays consumed by rendering composables.

### C031 -- useTouchInteraction composable
- **Type:** composable-function
- **Location:** `app/composables/useTouchInteraction.ts`
- **Reason:** Touch gesture handling. No UI -- provides touch event handlers to grid canvases.

---

## Utilities (no direct UI element)

### C035 -- ptuDiagonalDistance utility
- **Type:** utility
- **Location:** `app/utils/gridDistance.ts`
- **Reason:** Pure function for diagonal movement cost calculation. No UI.

### C036 -- combatantCapabilities utility
- **Type:** utility
- **Location:** `app/utils/combatantCapabilities.ts`
- **Reason:** Pure functions for capability queries (canFly, canSwim, etc.). No UI.

---

## API Endpoints (server-side only)

### C055 -- Grid Position/Config/Background APIs
- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/position.post.ts`, `grid-config.put.ts`, `background.post.ts`, `background.delete.ts`
- **Reason:** Server-side REST endpoints. No direct UI -- consumed by client stores and composables. API functionality confirmed via `curl` (grid-config.put successfully toggled isometric mode).

### C056 -- Fog of War APIs
- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/fog.get.ts`, `fog.put.ts`
- **Reason:** Server-side REST endpoints for fog persistence. No direct UI.

### C057 -- Terrain APIs
- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/terrain.get.ts`, `terrain.put.ts`
- **Reason:** Server-side REST endpoints for terrain persistence. No direct UI.

---

## WebSocket Events (no direct UI element)

### C060 -- movement_preview WebSocket event
- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts`
- **Reason:** Real-time movement preview broadcast. No direct UI -- effect is canvas-drawn movement ghost on group view.

---

## Summary

| Category | Count | Capability IDs |
|----------|-------|----------------|
| Composables | 17 | C010, C011, C012, C013, C014, C015, C016, C020, C021, C022, C023, C024, C025, C026, C030, C031, C032 |
| Utilities | 2 | C035, C036 |
| API Endpoints | 3 | C055, C056, C057 |
| WebSocket Events | 1 | C060 |
| **Total Untestable** | **23** | |

Note: C032 (usePlayerGridView) is listed as a composable but its UI terminus (PlayerGridView component) was verified in the player view audit. It is counted here because the composable itself has no independent UI, but its effect is confirmed present.
