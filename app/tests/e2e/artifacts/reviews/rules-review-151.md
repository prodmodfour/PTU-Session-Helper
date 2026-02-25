---
review_id: rules-review-151
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-082, ptu-rule-083
domain: pokemon-lifecycle, vtt-grid
commits_reviewed:
  - eb4d6b2
  - f366514
  - 1151a18
  - f0b2f14
mechanics_verified:
  - pokemon-hp-formula
  - diagonal-movement
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Base-Stats
  - core/07-combat.md#Movement
reviewed_at: 2026-02-25T05:30:00Z
follows_up: rules-review-144, rules-review-147, rules-review-149
---

## Mechanics Verified

### 1. Pokemon HP Formula (ptu-rule-082)

- **Rule:** "Pokemon Hit Points = Pokemon Level + (HP x3) + 10" (`core/05-pokemon.md`, line 118)
- **Errata:** No errata modifies the Pokemon HP formula. The errata section on capture rates (errata-2.md) uses a different system entirely and does not affect the HP formula.
- **Implementation:** Both XP endpoints (`xp-distribute.post.ts:191`, `add-experience.post.ts:102`) compute `maxHpIncrease = levelResult.levelsGained` and apply it as `pokemon.maxHp + maxHpIncrease` when `maxHpIncrease > 0`.
- **Analysis:**

  The PTU HP formula is `Level + (HP_stat * 3) + 10`. When a Pokemon gains N levels through XP:
  - The Level component increases by N (each level adds +1 to maxHp).
  - The HP stat component (`HP_stat * 3`) does NOT change automatically -- stat points are manually allocated by the GM/player after level-up.
  - The constant `+10` does not change.

  Therefore, `maxHp += levelsGained` is the correct delta. This was verified against:
  - The `calculateLevelUps()` function in `experienceCalculation.ts:315-353`, which correctly computes `levelsGained = newLevel - currentLevel`.
  - The `pokemon-generator.service.ts:150` which uses the full formula `level + (calculatedStats.hp * 3) + 10` for initial Pokemon creation (confirming the formula is consistent across the codebase).
  - The `useCombat.ts:39-41` which defines `calculatePokemonMaxHP = level + (hpStat * 3) + 10` (consistent).

  **Edge cases verified:**
  - Zero levels gained: The conditional spread `...(maxHpIncrease > 0 ? { maxHp: ... } : {})` correctly skips the maxHp update when no levels are gained, avoiding unnecessary DB writes.
  - Multi-level gain: If a Pokemon goes from level 5 to level 8 (3 levels gained), maxHp increases by 3. This is mathematically correct: `(8 + HP*3 + 10) - (5 + HP*3 + 10) = 3`.
  - Level 100 cap: `calculateLevelUps` returns `levelsGained = 0` when already at max level (via `getLevelForXp` capping at `MAX_LEVEL`), so maxHp is not incorrectly increased.
  - Both XP endpoints: The fix is applied to BOTH `xp-distribute.post.ts` (combat XP) and `add-experience.post.ts` (manual/training XP). These are the only two code paths that grant XP and cause level-ups.

- **Status:** CORRECT

### 2. Diagonal Movement Rule (ptu-rule-083)

- **Rule:** "Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth." (`core/07-combat.md`, lines 425-428)
- **Errata:** No errata modifies the diagonal movement rule.
- **Implementation:** Three files were fixed to replace `Math.max(dx, dy)` (Chebyshev distance) with the PTU alternating diagonal formula:

  ```typescript
  const diagonals = Math.min(dx, dy)
  const straights = Math.abs(dx - dy)
  const distance = diagonals + Math.floor(diagonals / 2) + straights
  ```

  Applied in:
  1. `stores/measurement.ts:43-46` -- the `distance` getter used by the measurement toolbar
  2. `components/player/PlayerGridView.vue:128-130` -- the `handleCellClick` distance calculation for player move requests
  3. `components/vtt/VTTContainer.vue:313-315` -- the `isometric3dDistance` computed property's flat distance component

- **Formula verification against PTU rulebook:**

  | Diagonals | PTU Cost (1+2+1+2...) | Formula: `d + floor(d/2)` | Match? |
  |-----------|----------------------|---------------------------|--------|
  | 1 | 1m | 1 + 0 = 1 | Yes |
  | 2 | 3m (1+2) | 2 + 1 = 3 | Yes |
  | 3 | 4m (1+2+1) | 3 + 1 = 4 | Yes |
  | 4 | 6m (1+2+1+2) | 4 + 2 = 6 | Yes |
  | 5 | 7m (1+2+1+2+1) | 5 + 2 = 7 | Yes |
  | 6 | 9m (1+2+1+2+1+2) | 6 + 3 = 9 | Yes |

  **Mixed movement (diagonal + straight) example:**
  Moving 3 squares diagonally then 2 squares straight = `(3 + floor(3/2)) + 2 = 4 + 2 = 6m`. This is equivalent to walking diagonally (1+2+1=4) then straight (1+1=2) = 6m total. Correct.

- **Consistency check:** The PTU alternating diagonal formula was already correctly implemented in:
  - `composables/useGridMovement.ts:141-148` -- the `calculateMoveDistance` function
  - `composables/usePathfinding.ts:158-165` -- the `calculateMoveCost` function
  - `composables/usePathfinding.ts:100-109` -- the flood-fill movement range (step-by-step diagonal parity tracking)
  - `composables/usePathfinding.ts:329-338` -- the A* pathfinding (step-by-step diagonal parity tracking)

  The three fixed files were the ONLY places still using Chebyshev distance for point-to-point distance measurement.

- **Remaining Chebyshev uses verified as correct:**

  The following uses of `Math.max(Math.abs(dx), Math.abs(dy)) <= radius` are AoE shape containment checks (not distance measurements) and correctly use Chebyshev distance for "is this cell within N squares of center":
  - `stores/measurement.ts:196` -- `getBurstCells()` burst AoE shape
  - `stores/terrain.ts:157,170` -- terrain brush radius
  - `stores/fogOfWar.ts:121,132,143` -- fog of war brush radius
  - `composables/useRangeParser.ts:380` -- range containment check

  PTU burst shapes are defined as squares (all cells within N meters), not circles. A cell at (3,3) from center is 3 squares away in PTU's grid system for containment purposes. Chebyshev is the correct metric for "within N squares" containment. The alternating diagonal rule applies to movement cost, not shape containment.

- **Status:** CORRECT

## Summary

Both fixes are **PTU-correct**.

**ptu-rule-082:** The `maxHp += levelsGained` approach correctly applies the level component of the PTU HP formula (`Level + HP*3 + 10`) during level-up. Since only the Level term changes on level-up (the HP stat term requires manual stat point allocation), adding `levelsGained` to `maxHp` produces the exact same result as recomputing the full formula. Both XP endpoints are patched, and the edge cases (zero gain, multi-level gain, level 100 cap) are handled correctly.

**ptu-rule-083:** The `diagonals + floor(diagonals / 2) + straights` formula is a mathematically precise closed-form expression of PTU's alternating 1m/2m diagonal rule. All three distance-measurement code paths are fixed. The existing correct implementations in `useGridMovement` and `usePathfinding` remain untouched. The remaining Chebyshev uses are AoE containment checks, which are correct for PTU's square-based area definitions.

## Rulings

No new rulings. This review resolves RULING-1 from rules-review-144 (measurement store Chebyshev distance) and the follow-up note in rules-review-147 (VTTContainer 3D distance flat component). The PlayerGridView Chebyshev issue flagged in rules-review-149 is also resolved.

## Verdict

**APPROVED** -- Both fixes correctly implement PTU 1.05 rules. No game-logic issues found.

## Required Changes

None.
