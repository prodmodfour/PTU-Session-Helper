# Shared Specifications

## Size Category Types

### SizeCategory

Already exists as a union type on `PokemonCapabilities.size` in `app/types/character.ts`:

```typescript
size: 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gigantic'
```

No new type needed. This is the canonical size category type.

### Size-to-Footprint Mapping

Already exists in `app/server/services/grid-placement.service.ts`:

```typescript
export function sizeToTokenSize(size: string | undefined): number {
  switch (size) {
    case 'Small':
    case 'Medium':
      return 1
    case 'Large':
      return 2
    case 'Huge':
      return 3
    case 'Gigantic':
      return 4
    default:
      return 1
  }
}
```

This function is server-side only. **P0 requires creating a client-side equivalent** in `app/utils/sizeCategory.ts` for use in composables and components. The server function remains authoritative for combatant creation.

### TokenFootprint

Already exists in `app/composables/useRangeParser.ts`:

```typescript
export interface TokenFootprint {
  position: GridPosition
  size: number // 1 = 1x1, 2 = 2x2, 3 = 3x3, 4 = 4x4
}
```

This is already used by `ptuDistanceTokens()` and `closestCellPair()`. Multi-tile work extends usage to pathfinding, movement, and AoE calculations.

---

## Existing Code Analysis

### Token Data Flow

The `token.size` value flows through the system as follows:

1. **Combatant creation** (`combatant.service.ts` / `combatants.post.ts`):
   - For Pokemon: reads `speciesData.size` field from `SpeciesData` table
   - Calls `sizeToTokenSize(speciesData.size)` to get `tokenSize` (1-4)
   - Stores as `combatant.tokenSize` in the `Encounter.combatants` JSON array

2. **Client-side token list** (encounter store / page components):
   - Builds `TokenData[]` from encounter combatants: `{ combatantId, position, size: combatant.tokenSize }`
   - This `TokenData` interface is defined locally in multiple composables (useGridMovement, useGridInteraction, useGridRendering, VTTToken.vue)

3. **VTTToken.vue rendering**:
   - Uses `props.token.size` to compute `width` and `height` as `cellSize * size`
   - Position uses `token.position.x * cellSize` and `token.position.y * cellSize` (origin cell)
   - In isometric mode, uses pre-computed `isoScreenX`/`isoScreenY`

4. **Grid interaction** (useGridInteraction):
   - `getTokenAtPosition()` already checks multi-cell bounds for hit testing
   - `screenToGrid()` returns the clicked cell, which is then matched against token footprints

5. **Movement validation** (useGridMovement):
   - `isValidMove()` already checks destination bounds for `tokenSize` and checks all destination cells against occupied cells
   - `getOccupiedCells()` already iterates over `token.size` to build the full occupied set
   - `getEnemyOccupiedCells()` already iterates over `token.size`
   - **Gap**: A* pathfinding in `usePathfinding.ts` explores single cells only

6. **Grid placement** (server-side, grid-placement.service.ts):
   - `findPlacementPosition()` already uses `canFit()` to check all cells of a multi-cell token
   - `buildOccupiedCellsSet()` already iterates over `tokenSize`
   - Auto-placement correctly avoids overlapping multi-cell tokens

### What Already Works

The following already correctly handle multi-cell tokens:

| Feature | File | Function |
|---------|------|----------|
| Token sizing in CSS | VTTToken.vue | `tokenStyle` computed property |
| Size badge display | VTTToken.vue | `v-if="token.size > 1"` |
| Hit testing (click detection) | useGridInteraction.ts | `getTokenAtPosition()` |
| Occupied cell tracking | useGridMovement.ts | `getOccupiedCells()` |
| Enemy cell tracking | useGridMovement.ts | `getEnemyOccupiedCells()` |
| Destination bounds check | useGridMovement.ts | `isValidMove()` line 497-498 |
| Destination stacking check | useGridMovement.ts | `isValidMove()` lines 502-511 |
| Multi-cell distance | useRangeParser.ts | `ptuDistanceTokens()` |
| Closest cell pair (LoS) | useRangeParser.ts | `closestCellPair()` |
| Auto-placement on add | grid-placement.service.ts | `findPlacementPosition()` |
| Occupied cells set (server) | grid-placement.service.ts | `buildOccupiedCellsSet()` |

### What Needs Work

| Feature | File | Issue |
|---------|------|-------|
| A* pathfinding | usePathfinding.ts | Explores single cells; must check all NxN cells for passability at each step |
| Flood-fill movement range | usePathfinding.ts | Same single-cell exploration issue |
| Terrain cost at step | useGridMovement.ts | Reads terrain at single cell; must aggregate across footprint |
| Fog of war reveal | fogOfWar store / GridCanvas | Movement only triggers reveal at origin position |
| AoE hit detection | useRangeParser.ts | `getAffectedCells()` returns cells; must check overlap with target footprint |
| Isometric token rendering | useIsometricRendering.ts | Renders tokens at single diamond tile |
| Movement preview arrow | useGridRendering.ts | Arrow targets single cell |
| Canvas movement range | useGridRendering.ts | Highlights single-cell destinations |

---

## Multi-Cell Position Convention

A multi-cell token's `position` field stores the **top-left (minimum x, minimum y) cell** of the footprint. This is already the convention used throughout the codebase:

- A Large (2x2) token at position `{x: 3, y: 5}` occupies cells `(3,5)`, `(4,5)`, `(3,6)`, `(4,6)`
- A Huge (3x3) token at position `{x: 1, y: 1}` occupies cells `(1,1)` through `(3,3)`

The `getOccupiedCells()` functions in both `useGridMovement.ts` and `useRangeParser.ts` already implement this convention.

---

## Terrain Cost Aggregation for Multi-Cell Tokens

When a multi-cell token moves from one position to another, every cell in the new footprint must be checked for terrain passability and cost. The design uses **maximum terrain cost** across all occupied cells at each step:

```
For a 2x2 token moving to position (x, y):
  Check cells: (x,y), (x+1,y), (x,y+1), (x+1,y+1)
  If ANY cell is impassable (Infinity cost) -> step is impassable
  Otherwise: step cost = max(terrain_cost(cell)) for all cells in footprint
```

**Rationale**: The maximum cost model ensures the token pays the price of the hardest terrain it occupies. This is consistent with the PTU principle that terrain affects movement based on the square you're entering, and a large token entering partially into slow terrain is still impeded.

Per decree-011, when crossing terrain boundaries, the speed averaging applies to the terrain types encountered across ALL cells of ALL steps along the path.

---

## Small Pokemon Sharing Rule (Deferred)

PTU p.231 states Small Pokemon "can share their square with one other Small Creature." This is a future enhancement beyond the scope of this design. The current no-stacking rule (decree-003) applies uniformly regardless of size. A decree-need ticket should be filed if this becomes relevant.

---

## Non-Square Footprints (Deferred)

PTU p.231 mentions "you may choose to use other shapes for Pokemon that have different body shapes such as serpents." This design implements only square NxN footprints. Non-square footprint support (e.g., 1x3 for Onix) is deferred as a future enhancement.

---

## WebSocket Events

No new WebSocket events are needed. Existing events handle multi-cell tokens:

- `movement_preview` already includes `combatantId` (the client looks up the token to get size)
- `combatant_added` / `combatant_removed` already transmit full combatant data (including `tokenSize`)
- `encounter_update` transmits the full encounter state

The only change is that `position_update` events continue to transmit the origin cell. Clients reconstruct the full footprint from `combatant.tokenSize`.
