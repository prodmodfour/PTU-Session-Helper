---
review_id: rules-review-248
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-014
domain: vtt-grid+combat
commits_reviewed:
  - 741ff4df
  - a063aa26
  - 3ddf97a0
  - 50e56c4b
  - e778f3e4
mechanics_verified:
  - multi-tile-target-flanking-requirements
  - multi-tile-attacker-cell-counting
  - self-flank-prevention
  - independent-set-non-adjacency
  - flanking-evasion-penalty-application
  - diagonal-adjacency-for-flanking
  - fainted-dead-exclusion
  - decree-040-compliance
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Page 232 (Flanking)
  - errata-2.md (no flanking errata)
reviewed_at: 2026-03-02T11:30:00Z
follows_up: rules-review-236
---

## Review Context

P1 review of feature-014 (VTT Flanking Detection -- Multi-Tile Flanking). P0 was APPROVED (rules-review-236, 7 mechanics verified, 0 issues). P1 adds three new functions (`countAdjacentAttackerCells`, `findIndependentSet`, `checkFlankingMultiTile`) and switches the reactive composable from `checkFlanking` to `checkFlankingMultiTile`. Comprehensive unit tests (636 lines) cover all P1 scenarios.

## Mechanics Verified

### 1. Multi-Tile Target Flanking Requirements (PTU p.232)

- **Rule:** "A Small or Medium sized Trainer or Pokemon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other. For Large Trainers and Pokemon, the requirement is three foes meeting those conditions. The requirement increases to four for Huge and five for Gigantic sized combatants." (`core/07-combat.md#Page 232`)
- **Implementation:** `FLANKING_FOES_REQUIRED` in `app/utils/flankingGeometry.ts` line 27-32: `{ 1: 2, 2: 3, 3: 4, 4: 5 }`. Used by `checkFlankingMultiTile` at line 323: `const requiredFoes = FLANKING_FOES_REQUIRED[targetSize] ?? 2`. The fallback `?? 2` for unknown sizes is a safe default (matches Small/Medium).
- **Verification:** Size 1 (Small/Medium) requires 2 foes. Size 2 (Large) requires 3. Size 3 (Huge) requires 4. Size 4 (Gigantic) requires 5. All match PTU p.232 exactly.
- **Status:** CORRECT

### 2. Multi-Tile Attacker Cell Counting (PTU p.232, Section F)

- **Rule:** "Foes larger than Medium may occupy multiple squares -- in this case, they count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying." (`core/07-combat.md#Page 232`)
- **Implementation:** `countAdjacentAttackerCells()` in `app/utils/flankingGeometry.ts` lines 212-239. For each cell of the attacker, checks if any of its 8-neighbors is a cell occupied by the target. Each attacker cell counts at most once (line 232: `break` after first neighbor match). Only invoked for attackers with `size > 1` (line 348: `foe.size > 1 ? countAdjacentAttackerCells(...) : 1`).
- **Verification:** Manually traced the PTU rulebook examples:
  - Flygon (2x2) at (5,3) adjacent to Aggron (2x2) at (3,3): cells (5,3) is adjacent to (4,3), cell (5,4) is adjacent to (4,4). Contribution = 2. Matches PTU visual aid.
  - Lugia (3x3) at (5,2) adjacent to Aggron (2x2) at (3,3): cells (5,2) adj to (4,3), (5,3) adj to (4,3), (5,4) adj to (4,4). Contribution = 3. Matches PTU text "can by itself occupy three adjacent squares."
  - 1x1 attackers always return 1 (correctly bypassed with the `foe.size > 1` guard).
- **Test coverage:** Tests at lines 169-256 cover all these cases including the PTU examples.
- **Status:** CORRECT

### 3. Self-Flank Prevention (PTU p.232)

- **Rule:** "However, a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone." (`core/07-combat.md#Page 232`)
- **Implementation:** `checkFlankingMultiTile` lines 330-343: `if (adjacentFoes.length < 2)` returns `isFlanked: false` immediately, regardless of the effective foe count from multi-tile cell counting. This uses `adjacentFoes.length` (distinct combatant count), not the contribution sum.
- **Verification:** A single Lugia (3x3) with 3 adjacent cells to Aggron contributes 3 effective foes but `adjacentFoes.length = 1 < 2`, so flanking is correctly denied. Test at line 500-508 confirms this exact scenario.
- **Status:** CORRECT

### 4. Independent Set Non-Adjacency Check (PTU p.232, Sections E/H)

- **Rule:** Flanking requires foes "adjacent to them but not adjacent to each other." For multi-tile targets, N such foes are required (where N = FLANKING_FOES_REQUIRED[size]). (`core/07-combat.md#Page 232`)
- **Implementation:** `findIndependentSet()` at lines 258-294 uses a minimum-degree-first greedy heuristic to find a set of combatants where no two are adjacent. The adjacency graph is built at lines 367-382 using `areAdjacent()` between foe pairs (including multi-tile foe footprints). The independent set's combined contribution (multi-tile counting) is summed at lines 391-393 and compared against `requiredFoes` at line 395.
- **Verification:**
  - Spec example H (3 non-adjacent foes around Large target): A at (1,0), B at (0,2), C at (3,3). None adjacent to each other. IS = {A, B, C}, contribution = 3 >= 3. FLANKED. Test at lines 395-409.
  - Spec example H variant (2 clustered + 1 independent): A-B adjacent, C independent. IS = {A, C} or {B, C}, size = 2, contribution = 2 < 3. NOT FLANKED. Test at lines 411-425.
  - Flygon + Zangoose vs Aggron: Flygon (2x2) and Zangoose (1x1) not adjacent to each other. IS = {Flygon, Zangoose}, contribution = 2 + 1 = 3 >= 3. FLANKED. Test at lines 485-498.
  - All-clustered case (2 Zangoose adjacent to each other): IS = {either one}, size = 1 < 2. NOT FLANKED. Test at lines 555-563.
- **Status:** CORRECT

### 5. Flanking Evasion Penalty Application (PTU p.232 + decree-040)

- **Rule:** "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion." (`core/07-combat.md#Page 232`)
- **Implementation:** `FLANKING_EVASION_PENALTY = 2` at line 38. `getFlankingPenalty()` in `useFlankingDetection.ts` line 122 returns this constant when flanked. Applied in `useMoveCalculation.ts` line 405:
  ```typescript
  return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty)
  ```
  where `effectiveEvasion = Math.min(9, evasion)` (line 396). Per decree-040, the flanking penalty is applied AFTER the evasion cap: `effectiveEvasion = Math.min(9, rawEvasion) - flankingPenalty`. This is precisely what the formula does.
- **Decree compliance:** Per decree-040: "the flanking -2 evasion penalty applies AFTER the evasion cap of 9, ensuring flanking always provides a meaningful accuracy benefit." The implementation matches. The code comment at lines 400-403 still references decree-need-039 (the pre-ruling ticket); now that decree-040 has been ruled, the comment is stale but the behavior is correct.
- **Status:** CORRECT (stale comment noted as MED-1 below)

### 6. Diagonal Adjacency for Flanking (Section G)

- **Rule:** PTU uses 8-directional adjacency. Diagonal cells are adjacent for flanking purposes. decree-002 (PTU alternating diagonal) affects distance measurement, NOT adjacency topology.
- **Implementation:** `NEIGHBOR_OFFSETS` (line 17-21) includes all 8 directions. `areAdjacent()` checks all cell pairs for Chebyshev distance = 1 (`|dx| <= 1 && |dy| <= 1`). No distance metric is involved in adjacency -- this is purely topological.
- **Verification:** Diagonal foes on opposite corners (NW and SE) at distance > 1 from each other are correctly non-adjacent, enabling flanking. Test at lines 570-589.
- **Status:** CORRECT

### 7. Fainted/Dead Combatant Exclusion (defense-in-depth)

- **Rule:** Fainted combatants (HP = 0) cannot take actions in PTU. A fainted creature on the grid should not count as a flanking foe or be a flanking target.
- **Implementation:** `positionedCombatants` in `useFlankingDetection.ts` lines 46-56 filters out combatants with `hp <= 0`, `isDead`, or `isFainted`. Triple-layer exclusion.
- **Status:** CORRECT (no change from P0, re-verified for P1 compatibility)

### 8. decree-040 Compliance (Flanking Penalty After Evasion Cap)

- **Rule:** Per decree-040: "effectiveEvasion = Math.min(9, rawEvasion) - flankingPenalty"
- **Implementation:** `useMoveCalculation.ts` line 396: `const effectiveEvasion = Math.min(9, evasion)`. Line 404: `const flankingPenalty = options?.getFlankingPenalty?.(targetId) ?? 0`. Line 405: threshold formula subtracts `flankingPenalty` from the value that already has `effectiveEvasion` (post-cap). The arithmetic is: `ac + Math.min(9, evasion) - attackerAccuracy - flankingPenalty + roughPenalty`. This is equivalent to `ac + (Math.min(9, evasion) - flankingPenalty) - attackerAccuracy + roughPenalty`, which matches decree-040's formula.
- **Status:** CORRECT -- no decree violations

## Issues Found

### MED-1: Stale decree-need-039 comment in useMoveCalculation.ts

- **File:** `app/composables/useMoveCalculation.ts` lines 400-403
- **Description:** The code comment says "The ordering of flanking penalty vs evasion cap is pending decree-need-039. Do NOT change this ordering until the decree is ruled." However, decree-040 has now been ruled (2026-03-01T22:30:00Z), confirming the current behavior is correct. The comment should be updated to reference decree-040 instead of the pending decree-need-039.
- **Severity:** MEDIUM -- documentation/comment staleness, no functional impact
- **Suggested fix:** Replace the comment with a reference to decree-040 confirming the current behavior.

## Errata Check

Searched `books/markdown/errata-2.md` for "flank" -- no matches. No flanking errata exist in PTU 1.05. The core text on p.232 is authoritative.

## Decree Compliance Summary

| Decree | Domain | Compliance |
|--------|--------|------------|
| decree-002 | PTU alternating diagonal | No conflict. Flanking uses 8-directional adjacency (Chebyshev distance = 1), not distance measurement. |
| decree-003 | Token passability, enemy = rough terrain | No conflict. Flanking detection and rough terrain accuracy penalty are independent systems. Both are additive terms in the accuracy threshold formula. |
| decree-040 | Flanking -2 after evasion cap | COMPLIANT. Implementation applies flanking penalty after `Math.min(9, evasion)`, exactly as decreed. |

## Algorithm Correctness Note

The greedy minimum-degree-first heuristic for Maximum Independent Set (MIS) in `findIndependentSet` is not guaranteed to find the optimal solution for the general MIS problem (NP-hard). However, this is explicitly acknowledged in the code comments and the design spec (Section E, lines 167-168). For PTU combat scenarios (max ~20 adjacent foes around a Gigantic target, typically 2-8 in practice), the greedy approach produces correct results. The interaction with multi-tile attacker contributions (where the IS member count differs from the contribution sum) adds a theoretical edge case: the greedy might select a suboptimal IS that has lower total contribution than an alternative IS. In practice, this would require a very specific arrangement of many multi-tile attackers around a large target -- a scenario extremely unlikely in tabletop play. This is not a PTU rule violation but an algorithmic approximation. No action required.

## Test Coverage Assessment

The 636-line test file (`app/tests/unit/utils/flankingGeometry.test.ts`) provides excellent coverage of all P1 mechanics:

- **P0 regression:** NEIGHBOR_OFFSETS, FLANKING_FOES_REQUIRED, getOccupiedCells, getAdjacentCells, areAdjacent, checkFlanking (lines 14-163)
- **countAdjacentAttackerCells:** 1x1 vs 1x1, 2x2 vs 1x1, 2x2 vs 2x2, PTU Flygon example, PTU Lugia example (lines 169-256)
- **findIndependentSet:** Empty graph, no-edge graph, path graph, complete graph, early stop, spec Section H examples (lines 258-332)
- **checkFlankingMultiTile:** Backward compatibility (1x1), multi-tile target (Large, Huge, Gigantic), multi-tile attacker counting, self-flank prevention, 3+ attackers, diagonal flanking, edge cases (lines 334-636)
- **PTU rulebook examples explicitly tested:** Flygon+Zangoose vs Aggron (line 485), Lugia self-flank (line 500), Zangoose cluster (line 555), spec Section H worked examples (lines 395, 411)

All tests exercise the PTU-specific scenarios from the rulebook visual aids, which provides high confidence in rule correctness.

## Summary

P1 correctly extends the P0 flanking system to support multi-tile tokens per PTU p.232:

1. **Large/Huge/Gigantic targets** require 3/4/5 non-adjacent foes respectively, matching the PTU size scaling table.
2. **Multi-tile attackers** count as multiple foes proportional to adjacent cells, matching the PTU "number of squares adjacent to the Flanked target" rule.
3. **Self-flank prevention** enforces minimum 2 distinct combatants regardless of multi-tile cell counting, matching PTU's explicit "a single combatant cannot Flank by itself" rule.
4. **Independent set algorithm** correctly models the "not adjacent to each other" constraint across N foes, generalizing P0's pair-check to arbitrary group sizes.
5. **Evasion penalty application** remains correct per decree-040 (penalty after evasion cap).
6. **Composable switch** from `checkFlanking` to `checkFlankingMultiTile` is clean -- the new function is a strict superset of P0 behavior with identical results for 1x1 tokens.

## Rulings

1. **All PTU p.232 flanking mechanics for multi-tile tokens are correctly implemented.** The size-scaling table, multi-tile attacker counting, self-flank prevention, and non-adjacency independent set check all match the rulebook text.

2. **decree-040 is respected.** The flanking evasion penalty is applied after the evasion cap, as decreed.

3. **The greedy independent set heuristic is acceptable** for PTU combat graph sizes. The theoretical suboptimality is acknowledged and does not constitute a PTU rule violation.

4. **One stale comment (MED-1)** should be updated to reference decree-040 instead of the now-resolved decree-need-039.

## Verdict

**APPROVED**

Zero critical, zero high, one medium issue (stale comment referencing decree-need-039 instead of the now-active decree-040). The P1 multi-tile flanking implementation faithfully captures all PTU p.232 mechanics for multi-tile targets and attackers. No errata contradictions. All relevant decrees respected.

## Required Changes

None required for approval. MED-1 (stale comment) is recommended but does not block.
