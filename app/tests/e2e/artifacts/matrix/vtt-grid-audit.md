---
domain: vtt-grid
audited_at: 2026-02-19T00:00:00Z
audited_by: implementation-auditor
items_audited: 15
correct: 7
incorrect: 3
approximation: 4
ambiguous: 1
---

# Implementation Audit: VTT Grid

## Summary

| Classification | Count |
|---------------|-------|
| Correct | 7 |
| Incorrect | 3 |
| Approximation | 4 |
| Ambiguous | 1 |
| **Total** | **15** |

### Severity Breakdown (Incorrect + Approximation)
- CRITICAL: 0
- HIGH: 1
- MEDIUM: 5
- LOW: 1

---

## Correct Items

### vtt-grid-R001: Square Grid System
- **Classification:** Correct
- **Code:** `prisma/schema.prisma:186` -- `Encounter.gridEnabled`, `components/vtt/GridCanvas.vue` -- GridCanvas component
- **Rule:** "Pokemon Tabletop United uses a square combat grid."
- **Verification:** The Prisma schema defines `gridEnabled Boolean @default(false)` on the Encounter model. When enabled, `GridCanvas.vue` renders a square grid with configurable dimensions. The grid is square-cell-based and uses integer coordinates as expected by PTU.

### vtt-grid-R002: Grid Scale (1 Meter Per Square)
- **Classification:** Correct
- **Code:** `prisma/schema.prisma:187-189` -- `Encounter.gridWidth,gridHeight,gridCellSize`, `stores/terrain.ts:17-24` -- `TERRAIN_COSTS`, `composables/useGridMovement.ts:24-32` -- `calculateMoveDistance`
- **Rule:** "On a grid, both Small and Medium Pokemon would take up one space, or a 1x1m square."
- **Verification:** The grid dimensions are measured in cells, with movement distances calculated in cells (meters). The `gridCellSize` field (default 40px) is purely a rendering scale -- it does not affect game logic. All movement calculations, terrain costs, and distance computations treat 1 cell as 1 meter. The `TERRAIN_COSTS` map uses multipliers relative to a 1-cell base cost. The `calculateMoveDistance` function returns distances in cells (meters). The `MeasurementResult` interface documents `distance: number // In cells (PTU: 1 cell = 1 meter)`.

### vtt-grid-R005: Diagonal Movement Cost (Alternating 1m/2m)
- **Classification:** Correct
- **Code:** `composables/useGridMovement.ts:24-32` -- `calculateMoveDistance`, `composables/useRangeParser.ts:410-418` -- `calculateMoveCost`, `composables/useRangeParser.ts:302-404` -- `getMovementRangeCells`
- **Rule:** "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth."
- **Verification:** The formula `diagonals + floor(diagonals / 2) + straights` correctly computes the PTU alternating diagonal cost. For 1 diagonal: 1 + 0 + 0 = 1m. For 2 diagonals: 2 + 1 + 0 = 3m (1m + 2m). For 3 diagonals: 3 + 1 + 0 = 4m (1m + 2m + 1m). For 4 diagonals: 4 + 2 + 0 = 6m (1m + 2m + 1m + 2m). This matches the rule exactly. The Dijkstra flood-fill in `getMovementRangeCells` also tracks diagonal parity per-path using a `diagonalParity` state variable (0 = next costs 1, 1 = next costs 2), which correctly handles the alternating cost when diagonals are mixed with straight moves along a path.

### vtt-grid-R003: Size Category Footprints
- **Classification:** Correct
- **Code:** `server/services/grid-placement.service.ts:28-42` -- `sizeToTokenSize`
- **Rule:** "Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4"
- **Verification:** The `sizeToTokenSize` function maps: Small/Medium -> 1, Large -> 2, Huge -> 3, Gigantic -> 4. Default (undefined) -> 1. This exactly matches PTU size categories. The `buildOccupiedCellsSet` function correctly iterates dx/dy from 0 to size-1 to mark all cells of multi-cell tokens, and `findPlacementPosition` uses `canFit` which checks that the full token footprint is within bounds and unoccupied.

### vtt-grid-R007: No Split Movement
- **Classification:** Correct
- **Code:** `composables/useGridInteraction.ts:197-224` -- click-to-move in `handleMouseDown`
- **Rule:** "You may not split up a Shift Action. That is, you cannot move a few squares, take a Standard Action, and then continue moving."
- **Verification:** The click-to-move interaction model enforces atomic movement. When a token is in move mode (`movingTokenId.value` is set), clicking an empty cell either completes the full move (origin to destination) or cancels it. There is no mechanism for partial movement followed by an action followed by further movement. The movement is a single discrete event from origin to clicked cell.

### vtt-grid-R016: Blocking Terrain
- **Classification:** Correct
- **Code:** `stores/terrain.ts:20` -- `TERRAIN_COSTS.blocking = Infinity`, `stores/terrain.ts:78-85` -- `isPassable`
- **Rule:** "Blocking Terrain: Straightforwardly, this is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions."
- **Verification:** Blocking terrain is assigned `Infinity` movement cost. The `isPassable` getter returns `false` for blocking terrain. The Dijkstra flood-fill in `getMovementRangeCells` (line 356) skips cells with infinite terrain cost via `if (!isFinite(terrainMultiplier)) { continue }`. The A* pathfinding in `calculatePathCost` also correctly skips infinite-cost cells. Blocking terrain is therefore impassable in all movement calculations.

### vtt-grid-R021: Melee Range (Adjacency)
- **Classification:** Correct
- **Code:** `composables/useRangeParser.ts:57-60` -- `parseRange` melee handling, `composables/useRangeParser.ts:167-171` -- `isInRange` Chebyshev distance
- **Rule:** "Range: Melee, 1 Target" (melee range requires adjacency per the adjacency definition in R006)
- **Verification:** The `parseRange` function parses "Melee" and "Melee, 1 Target" strings as `{ type: 'melee', range: 1 }`. The `isInRange` function for melee calculates Chebyshev distance (max of absolute dx, dy) and checks `distance <= parsedRange.range` (i.e., distance <= 1). This correctly defines melee as requiring the target to be in an adjacent cell (Chebyshev distance of 1), which matches PTU's adjacency definition including diagonals.

---

## Incorrect Items

### vtt-grid-R004: Movement Via Shift Actions
- **Classification:** Incorrect
- **Severity:** HIGH
- **Code:** `composables/useGridInteraction.ts:197-222` -- click-to-move validation in `handleMouseDown`, `composables/useGridMovement.ts:74-92` -- `isValidMove`
- **Rule:** "Movement is done with Shift Actions in combat. You can move a number of squares with a single Shift Action equal to the value of your relevant Movement Capability."
- **Expected:** Movement validation should account for terrain costs along the actual path. A combatant with 5 movement trying to reach a cell 3 cells away through difficult terrain (cost 2x per cell) should be blocked because the effective path cost exceeds their speed.
- **Actual:** The click-to-move validation in `useGridInteraction.ts` (lines 200-208) uses `calculateMoveDistance` which computes only the geometric PTU diagonal distance without terrain cost. The code checks `distance > 0 && distance <= speed && !isBlocked` but `distance` is the straight-line diagonal distance, not the terrain-adjusted path cost. Meanwhile, the movement range display (`drawMovementRange` in `useGridRendering.ts`) correctly uses the Dijkstra-based `getMovementRangeCells` with terrain costs. This creates a mismatch: the highlighted reachable cells correctly reflect terrain, but clicking on a cell outside the highlighted range but within geometric distance will succeed. Conversely, clicking on a cell within highlighted range but at a high geometric distance could fail.
- **Evidence:** `useGridInteraction.ts` line 201: `const distance = options.calculateMoveDistance(token.position, gridPos)` calls `useGridMovement.calculateMoveDistance` which is `diagonals + floor(diagonals/2) + straights` -- no terrain cost. The `isValidMove` function in `useGridMovement.ts` (line 82) also uses `calculateMoveDistance` without terrain.

### vtt-grid-R006: Adjacency Definition
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `stores/measurement.ts:35-43` -- `distance` getter, `composables/useRangeParser.ts:167-171` -- `isInRange` Chebyshev distance
- **Rule:** "Two combatants are Adjacent to one another if any squares they occupy touch each other, even if only the corners touch, as with diagonal squares. Cardinally Adjacent, however, does not count diagonal squares."
- **Expected:** For multi-cell tokens (Large, Huge, Gigantic), adjacency should be checked against any square the token occupies. A combatant is adjacent to a 2x2 Large token if any of their squares touches any of the 4 squares the Large token occupies.
- **Actual:** The `isInRange` function in `useRangeParser.ts` checks Chebyshev distance between two single `GridPosition` points (the token origin positions). For multi-cell tokens, this only checks distance from the top-left corner of each token. A combatant standing next to the bottom-right cell of a 2x2 token would not be recognized as adjacent if the token origin (top-left) is more than 1 cell away by Chebyshev distance. The measurement store's `distance` getter has the same issue -- it measures between single points.
- **Evidence:** `useRangeParser.ts` line 168-171: `const distance = Math.max(Math.abs(target.x - attacker.x), Math.abs(target.y - attacker.y))` -- uses single position coordinates. No multi-cell token size is accounted for anywhere in the range-checking logic.

### vtt-grid-R014: Slow Terrain
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `stores/terrain.ts:19` -- `TERRAIN_COSTS.difficult = 2`, `composables/useGridMovement.ts:74-92` -- `isValidMove`, `composables/useGridInteraction.ts:197-222` -- click-to-move
- **Rule:** "When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead."
- **Expected:** Slow terrain should cost 2x movement when traversing. The movement range display and the click-to-move validation should both reflect this cost.
- **Actual:** The terrain cost constant is correctly set (`difficult = 2`). The Dijkstra-based movement range display (`getMovementRangeCells`) correctly applies the 2x multiplier. However, the actual click-to-move validation in `useGridInteraction.ts` uses `calculateMoveDistance` which ignores terrain costs entirely (see R004 finding). A move through difficult terrain will be allowed if the geometric distance is within speed, even though the terrain-adjusted cost exceeds the movement budget. The rule is partially correct in the movement range display but incorrect in the actual movement execution path.
- **Evidence:** Same root cause as R004. The movement range overlay (Dijkstra) correctly shows terrain-aware reachable cells, but the click-to-move handler bypasses terrain cost validation.

---

## Approximation Items

### vtt-grid-R012: Basic Terrain Types (Partial)
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `types/spatial.ts:44-50` -- `TerrainType`, `stores/terrain.ts:17-24` -- `TERRAIN_COSTS`
- **Rule:** "Regular Terrain: Regular Terrain is dirt, short grass, cement, smooth rock, indoor building etc. [...] Earth Terrain: Earth Terrain is underground terrain that has no existing tunnel [...] you may only Shift through Earth Terrain if you have a Burrow Capability. [...] Underwater: Underwater Terrain is any water that a Pokemon or Trainer can be submerged in."
- **Expected:** PTU defines 5 basic terrain types: Regular, Slow, Rough, Earth, and Underwater, plus Blocking as a special type.
- **Actual:** The app implements 6 terrain types: normal (Regular), difficult (Slow), blocking (Blocking), water (Underwater -- partially, as `getMovementCost` returns Infinity without swim), hazard (not PTU core), and elevated (not PTU core). Earth terrain (requiring Burrow) is absent. The water terrain has a `canSwim` parameter but it is always called with `false` in the movement composable (line 68 of `useGridMovement.ts`: `getMovementCost(x, y, false)`).
- **What's Missing:** Earth terrain type. The app's "water" type approximates Underwater but the `canSwim` parameter is hardcoded to `false`, meaning no combatant can traverse water terrain even if they have Swim capability. The "hazard" and "elevated" types are app-specific extensions not in PTU core terrain rules.

### vtt-grid-R013: Movement Capability Types (Partial)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `types/spatial.ts:34-41` -- `MovementSpeeds`, `composables/useGridMovement.ts:37-42` -- `getSpeed`
- **Rule:** "Overland is a Movement Capability that defines how many meters the Pokemon may shift while on dry land. [...] Swim is a Movement Capability that defines how quickly the Pokemon can move underwater. [...] Sky [...] Burrow [...] Levitate [...] Teleporter"
- **Expected:** The VTT should select the appropriate movement capability based on terrain context. A combatant on water should use Swim speed, in air should use Sky speed, underground should use Burrow speed. Different movement capabilities apply in different terrain contexts.
- **Actual:** The `MovementSpeeds` interface correctly defines all 6 PTU capabilities (overland, swim, sky, burrow, levitate, teleport). However, `getSpeed` in `useGridMovement.ts` (line 37-42) returns a single number from a callback or falls back to `DEFAULT_MOVEMENT_SPEED = 5`. The callback is provided by `GridCanvas.vue` as `props.getMovementSpeed` which is a single-value function. There is no terrain-context-aware speed selection. All movement uses one speed value regardless of whether the combatant is on land, water, or any other terrain type.
- **What's Missing:** Logic to select the appropriate movement capability (overland, swim, sky, etc.) based on the terrain type of cells being traversed. The type definitions exist but the speed selection ignores them entirely.

### vtt-grid-R022: Stuck Condition (Partial)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `composables/useGridMovement.ts:74-92` -- `isValidMove`, `composables/useGridInteraction.ts:197-222` -- click-to-move
- **Rule:** "Stuck means you cannot Shift at all, though you may still use your Shift Action for other effects such as activating Features."
- **Expected:** When a combatant has the Stuck condition, the VTT grid should prevent all movement. The click-to-move validation should check for Stuck status and reject the move. The movement range display should show zero reachable cells.
- **Actual:** The Stuck condition can be tracked in the combat system (volatile status conditions on combatants), but neither `isValidMove` nor the click-to-move handler in `useGridInteraction.ts` checks for the Stuck status. A combatant marked as Stuck can still be moved freely on the grid. The movement range display does not check for Stuck either.
- **What's Missing:** Status condition check in the movement validation path. Neither `isValidMove` nor the interaction handler reads combatant status conditions.

### vtt-grid-R028: Sprint Maneuver (Partial)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `composables/useGridMovement.ts:37-42` -- `getSpeed`, `composables/useGridRendering.ts:331-365` -- `drawMovementRange`
- **Rule:** "Maneuver: Sprint. Action: Standard. Class: Status. Range: Self. Effect: Increase your Movement Speeds by 50% for the rest of your turn."
- **Expected:** After executing Sprint, the combatant's movement speed on the grid should increase by 50%. The movement range overlay should expand to reflect the boosted speed, and click-to-move validation should use the boosted speed.
- **Actual:** Sprint exists as a combat maneuver that can be executed during combat, but its effect is not propagated to the VTT movement system. The `getSpeed` function returns a flat value from a callback and does not account for Sprint's +50% bonus. The movement range display uses the same un-modified speed. After executing Sprint, the token's movement range on the grid does not change.
- **What's Missing:** Integration between the combat maneuver system (where Sprint is executed) and the VTT movement system (where speed is consumed). A Sprint flag or speed modifier needs to flow from the combat state into the `getMovementSpeed` callback.

---

## Ambiguous Items

### vtt-grid-R029: Push Maneuver (Partial)
- **Classification:** Ambiguous
- **Code:** `server/api/encounters/[id]/position.post.ts` -- position update endpoint, `stores/encounterGrid.ts:updateCombatantPosition` -- store action
- **Rule:** "If you win, the target is Pushed back 1 Meter directly away from you. If you have Movement remaining this round, you may then Move into the newly occupied Space, and Push the target again."
- **Interpretation A:** Push forced movement should be a grid operation: the server/client automatically moves the target token 1 meter away and optionally advances the pusher. This requires directional forced-movement logic on the grid (determine "directly away" direction, check for blocking terrain/tokens behind target, etc.).
- **Interpretation B:** Push is a combat-system action whose spatial consequence (token repositioning) is handled by the GM manually moving tokens after the opposed check resolves. The grid only needs the position update endpoint, and the GM clicks to reposition tokens.
- **Code follows:** Interpretation B -- the Push maneuver can be executed via the combat system, but spatial consequences (moving the target token, advancing the pusher) are left to GM manual token movement via the existing click-to-move or position update API.
- **Action:** Escalate to Game Logic Reviewer -- whether a VTT app should automate forced movement from Push (and other forced-movement maneuvers like Trip knockback) or leave it to GM discretion. The PTU rulebook describes Push in pen-and-paper terms where the GM would physically move miniatures. The app could either automate this or leave it manual. The matrix classified this as Partial with P1 gap priority, but the question is whether the "missing" forced-movement API is a correctness issue or a feature gap.

---

## Additional Observations

### Observation 1: Movement validation path inconsistency
The app has two parallel movement validation systems:
1. **Dijkstra flood-fill** (`useRangeParser.ts:getMovementRangeCells`) -- used for movement range display. Correctly handles terrain costs, diagonal parity per-path, and blocked cells.
2. **Simple distance check** (`useGridMovement.ts:calculateMoveDistance` + `isValidMove`) -- used for click-to-move execution. Uses only geometric PTU diagonal distance, ignores terrain costs.

This architectural split means the movement range overlay can show a cell as unreachable (due to terrain costs), but clicking on it may succeed anyway (because the geometric distance is within speed). Conversely, a cell reachable via terrain-aware pathfinding might show as reachable but fail the simple distance check if the geometric distance is high.

The `validateMovement` function in `useRangeParser.ts` (lines 423-460) does use Dijkstra internally and would be the correct validation to use for click-to-move, but it is not wired into the interaction handler. This function exists and is correct, but is unused in the main movement execution path.

### Observation 2: Water terrain always impassable
In `useGridMovement.ts:68`, `getTerrainCostAt` calls `terrainStore.getMovementCost(x, y, false)` with `canSwim` hardcoded to `false`. This means water terrain is always treated as impassable (Infinity cost), even for Pokemon with Swim capability. The `canSwim` parameter exists in the store getter but is never leveraged with actual combatant data.

### Observation 3: Measurement distance uses Chebyshev, not PTU diagonal
The `measurement.ts` store's `distance` getter (line 35-43) uses Chebyshev distance (`Math.max(dx, dy)`) for the distance readout. This is appropriate for adjacency checks and range validation, but differs from PTU movement distance (alternating diagonal 1m/2m). The distance display will show a shorter distance than the actual movement cost for diagonal paths. For example, moving 3 cells diagonally shows "3" in the measurement tool, but the actual movement cost is 4 (1+2+1). This is likely intentional for range checking (PTU ranges use Chebyshev) vs movement (PTU movement uses alternating diagonal), but could confuse users measuring movement distances with the distance tool.
