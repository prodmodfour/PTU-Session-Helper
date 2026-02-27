---
review_id: code-review-201
review_type: code
reviewer: game-logic-reviewer
trigger: first-review
target_report: ptu-rule-112
domain: vtt-grid
commits_reviewed:
  - 0dd3605
  - c274156
  - a9cedd3
  - 3c287c8
  - 9fd4d12
files_reviewed:
  - app/constants/naturewalk.ts
  - app/utils/combatantCapabilities.ts
  - app/composables/useGridMovement.ts
  - app/composables/useMoveCalculation.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-27T20:30:00Z
follows_up: null
---

## Files Reviewed

### app/constants/naturewalk.ts (NEW -- commit c274156)

**Purpose:** Maps PTU Naturewalk terrain category names to the app's `TerrainType` base types.

**Assessment:**

- Well-documented JSDoc header explains the mapping rationale, PTU reference (p.322), and decree-003 exclusion.
- `NaturewalkTerrain` type union covers all 9 PTU terrain categories from the Survivalist class list (p.4694): Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert.
- `NATUREWALK_TERRAIN_MAP` uses `ReadonlyArray<TerrainType>` for immutability -- correct per coding style guidelines.
- The mapping logic is sound: water-based terrains map to `'water'`, underground to `'earth'`, elevated to `'elevated'`, and ground-level terrains to `'normal'`. Multi-mappings (e.g., Wetlands -> `['water', 'normal']`) account for terrain painter ambiguity.
- `NATUREWALK_TERRAINS` array exported for validation/parsing use -- good defensive design.

**Verdict:** Clean, focused, single-responsibility constant file. No issues.

### app/utils/combatantCapabilities.ts (commit a9cedd3)

**Purpose:** Adds `getCombatantNaturewalks()` and `naturewalkBypassesTerrain()` utility functions.

**Assessment:**

- `getCombatantNaturewalks()` correctly returns early for non-Pokemon combatants (human characters cannot have Naturewalk in the current data model).
- Dual-source extraction: checks `capabilities.naturewalk` (direct field) and parses `capabilities.otherCapabilities` (string format). This matches the actual `PokemonCapabilities` interface in `types/character.ts` (lines 42-43).
- Deduplication via `Set` when both sources have data -- prevents double-counting if the same terrain appears in both sources.
- `parseNaturewalksFromOtherCaps()` regex `/^Naturewalk\s*\(([^)]+)\)$/i`:
  - Case-insensitive matching (good for data robustness).
  - Anchored with `^` and `$` -- only matches strings that are entirely a Naturewalk entry, not substrings.
  - Split on `/[,]|\band\b/i` handles both "Forest, Grassland" and "Forest and Grassland" formats.
  - Trims whitespace and filters empty strings.
- `naturewalkBypassesTerrain()` iterates the combatant's Naturewalk terrains and checks `NATUREWALK_TERRAIN_MAP` for a match against the provided base terrain type. The `as NaturewalkTerrain` cast is safe because unrecognized terrain names will simply return `undefined` from the map lookup, and the `if (mappedTypes && ...)` guard handles that case.

**Verdict:** Clean utility functions with good separation of concerns. No issues.

### app/composables/useGridMovement.ts (commit 3c287c8)

**Purpose:** Integrates Naturewalk bypass into movement cost calculation.

**Assessment:**

- New imports: `naturewalkBypassesTerrain` from utils and `TERRAIN_COSTS`, `DEFAULT_FLAGS` from terrain store.
- `getTerrainCostForCombatant()` modifications (lines 367-391):
  - When a combatant is available, the function now performs an early check using `terrainStore.getCellAt()` to get the full cell data (type + flags).
  - Impassable terrain checks (blocking, water without swim, earth without burrow) are evaluated BEFORE the Naturewalk check -- correct, since Naturewalk does not grant passage through impassable terrain.
  - If `flags.slow` is true and `naturewalkBypassesTerrain()` returns true, the function returns `TERRAIN_COSTS[terrain]` (base cost without slow doubling).
  - The fallback path (`terrainStore.getMovementCost()`) handles all other cases including non-Naturewalk combatants.
- The approach of checking slow flag specifically (rather than bypassing all terrain effects) is correct because:
  - Rough flag has no movement cost effect (accuracy only, per decree-010).
  - Slow flag is the only movement-cost-relevant modifier that Naturewalk should bypass.
  - Impassable terrain types are excluded by the earlier checks.
- Pathfinding automatically benefits because A* uses `getTerrainCostGetter()` which delegates to `getTerrainCostForCombatant()`.

**Note:** The function only checks `flags.slow` for the Naturewalk bypass. If a cell has the rough flag but NOT the slow flag, and the combatant has matching Naturewalk, no special path is taken -- the function falls through to `terrainStore.getMovementCost()`. This is correct behavior since rough has no movement cost effect, but the early-return pattern means the impassable checks are duplicated (once in the `if (combatant)` block, once inside `getMovementCost`). This is a minor redundancy, not a bug -- the results are identical.

**Verdict:** Correct integration. The Naturewalk bypass is properly scoped to slow flag movement cost only.

### app/composables/useMoveCalculation.ts (commit 9fd4d12)

**Purpose:** Bypasses painted rough terrain accuracy penalty for Naturewalk-matching attackers.

**Assessment:**

- New import: `naturewalkBypassesTerrain` from utils.
- `targetsThroughRoughTerrain()` modifications (lines 153-227):
  - The Bresenham line trace now has two distinct checks per intermediate cell:
    1. **Enemy-occupied check (line 200):** Returns `true` immediately if cell is enemy-occupied. No Naturewalk bypass attempted. This is correct per decree-003.
    2. **Painted rough check (lines 205-209):** If `terrainStore.isRoughAt()` is true, gets the base terrain type and checks `naturewalkBypassesTerrain(actor.value, baseType)`. Only returns `true` (rough penalty applies) if the attacker does NOT have matching Naturewalk.
  - The order is critical and correct: enemy-occupied is checked FIRST. Even if an enemy stands on a cell that also has painted rough terrain with a matching Naturewalk type, the enemy-occupied check triggers the penalty before the painted check can bypass it.
  - JSDoc updated to document Naturewalk behavior, decree-003 exclusion, and decree-025 endpoint exclusion.

**Verdict:** Correct implementation of the accuracy penalty bypass. The separation between enemy-occupied rough and painted rough is clean and well-ordered.

## Summary

The implementation across 4 commits is well-structured, following single-responsibility patterns:
1. **Constants** (naturewalk.ts): Pure data mapping, no logic.
2. **Utilities** (combatantCapabilities.ts): Pure functions for extraction and matching.
3. **Movement** (useGridMovement.ts): Integrates bypass into existing movement cost function.
4. **Accuracy** (useMoveCalculation.ts): Integrates bypass into existing rough terrain penalty function.

The code is readable, well-documented with JSDoc comments citing PTU pages and decrees, and follows the immutability principle (no mutations, all pure function returns). File sizes remain well within the 800-line guideline.

## Issues

### MED-1: Duplicated impassable terrain checks in getTerrainCostForCombatant

The early-return block added for Naturewalk (lines 379-381) duplicates the impassable terrain checks that also exist inside `terrainStore.getMovementCost()`. When the combatant does NOT have matching Naturewalk (or the cell has no slow flag), the function falls through to `getMovementCost()` which repeats the blocking/water/earth checks. This is not a bug (both paths produce identical results), but it adds unnecessary code surface area.

**Recommendation:** Accept as-is. The duplication is a minor style issue, and the early-return approach is clearer to read. The performance impact is negligible (a few extra comparisons per cell).

### MED-2: No unit tests for Naturewalk bypass logic

The `useMoveCalculation.test.ts` file was added in this batch (for the rough terrain penalty feature from commit 0dd3605) but does not include test cases exercising Naturewalk bypass. No tests exist for:
- `getCombatantNaturewalks()` with various capability data shapes
- `naturewalkBypassesTerrain()` with matching/non-matching terrain types
- `parseNaturewalksFromOtherCaps()` with different string formats
- `getTerrainCostForCombatant()` with Naturewalk-enabled combatants on slow terrain
- `targetsThroughRoughTerrain()` with Naturewalk actors attacking through painted rough

**Recommendation:** Create follow-up ticket for unit test coverage. The utility functions in `combatantCapabilities.ts` are pure and highly testable.

## Verdict

**APPROVED** -- The code correctly implements Naturewalk terrain bypass for both movement cost and accuracy penalty. Decree compliance is thorough. The two MEDIUM issues (minor code duplication and missing unit tests) are non-blocking.
