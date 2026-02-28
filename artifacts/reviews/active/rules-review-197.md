---
review_id: rules-review-197
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: ptu-rule-107
domain: combat
commits_reviewed:
  - 9a2b7e2
  - 96aee22
  - 3e23317
  - 67a7d39
  - 35d69b9
mechanics_verified:
  - skipFaintedTrainers-logic-correctness
  - skipUndeclaredTrainers-logic-correctness
  - declaration-progress-denominator-fainted-filtering
  - test-fidelity-to-server-implementation
  - decree-021-compliance-post-fix
  - decree-006-interaction-preserved
  - phase-label-scss-variable-consistency
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Page 227 (Initiative - League Battles)
reviewed_at: 2026-02-28T13:25:00Z
follows_up: rules-review-193
---

## Review Scope

Re-review of ptu-rule-107 P1 fix cycle. The previous code-review-217 found 4 issues (1 HIGH, 3 MEDIUM). The developer addressed all 4 across 5 commits. This rules review verifies the fixes do not introduce or reveal any PTU mechanics issues, and that the mechanics verified in rules-review-193 (APPROVED, 13/13 CORRECT) remain intact.

**Previous rules review:** rules-review-193 APPROVED all 13 mechanics. This re-review focuses specifically on the 4 fixed areas and their PTU implications.

**Decrees verified:**
- decree-021: Two-phase trainer system for League Battles. Fix commits do not alter phase flow. COMPLIANT.
- decree-006: Dynamic initiative reorder. Not impacted by fix commits. PRESERVED.

## Mechanics Verified

### 1. skipFaintedTrainers Logic Correctness

- **Rule:** PTU p.227: "Trainers declare their actions in order from lowest to highest speed." A fainted trainer (0 HP) cannot take actions and must be skipped.
- **Implementation:** `next-turn.post.ts` lines 305-318: `skipFaintedTrainers()` iterates from `startIndex` through `turnOrder`, checking `combatant.entity.currentHp > 0`. Stops at the first alive trainer; returns the updated index. Called at three locations: (1) after advancing during declaration phase (line 87), (2) at new round start entering declaration from resolution->no-pokemon path (line 163), (3) at new round start entering declaration from pokemon phase (line 183).
- **Test coverage (commit 9a2b7e2):** Test file lines 624-692 add three test cases: skip single fainted trainer (verifies index jumps from 1 to 2), skip multiple consecutive fainted trainers (verifies index jumps from 1 to 3), cascade to pokemon phase when all trainers fainted (verifies index exceeds turnOrder length). The test helper function (lines 78-91) faithfully mirrors the server implementation.
- **PTU analysis:** A fainted trainer cannot declare because they cannot take any actions. Skipping them preserves the relative order of remaining trainers (still low-to-high speed). The cascading behavior (all fainted -> skip to pokemon phase) is correct: if no trainers can declare, the declaration phase has nothing to produce, and resolution would have no declarations to resolve.
- **Status:** CORRECT

### 2. skipUndeclaredTrainers Logic Correctness

- **Rule:** During resolution phase (high-to-low speed per PTU p.227), trainers with no declaration have nothing to resolve. They must be skipped.
- **Implementation:** `next-turn.post.ts` lines 327-343: `skipUndeclaredTrainers()` iterates from `startIndex`, checking `declarations.some(d => d.combatantId === combatantId && d.round === currentRound)`. Stops at the first trainer with a matching declaration. Called at three locations: (1) after advancing during resolution phase (line 91), (2) at the start of resolution phase after declaration->resolution transition (line 110), (3) after mid-resolution advancement is not applicable here -- the mid-resolution path at line 188 handles normal advancement.
- **Test coverage (commit 9a2b7e2):** Test file lines 694-758 add four test cases: skip trainer with no declaration during resolution (verifies index jumps from 1 to 2), cascade to pokemon phase when all trainers have no declarations (verifies index exceeds turnOrder length), does not skip trainers who have a declaration for current round (verifies index stays at 0), does not match declarations from a different round (verifies round isolation).
- **PTU analysis:** The round-matching check (`d.round === currentRound`) is defense-in-depth: declarations are cleared on new round start via `clearDeclarations = true` / `updateData.declarations = JSON.stringify([])`. The round check prevents any edge case where stale declarations survive. This is PTU-correct: resolution only resolves what was declared in the current round's declaration phase.
- **Status:** CORRECT

### 3. Declaration Progress Denominator Fainted Filtering

- **Rule:** The declaration progress indicator ("X of Y trainers") should reflect the number of trainers who will actually declare, not the total number of trainers. Fainted trainers are auto-skipped and will not declare.
- **Implementation (commit 3e23317):** `DeclarationPanel.vue` line 78: `const aliveTrainers = trainers.filter(t => (t.entity as { currentHp: number }).currentHp > 0)`. Line 80: `return \`${declared + 1} of ${aliveTrainers.length}\``. The denominator now counts only alive trainers (HP > 0), matching the `skipFaintedTrainers()` HP check (`combatant.entity.currentHp > 0`).
- **PTU analysis:** This is a pure UI accuracy fix. The progress indicator now correctly reflects the PTU reality: only alive trainers participate in the declaration phase. The consistency between the server-side skip condition (`currentHp > 0`) and the client-side filter (`currentHp > 0`) ensures the denominator matches the actual number of trainers who will declare.
- **Status:** CORRECT

### 4. Test Fidelity to Server Implementation

- **Rule:** Unit tests must accurately mirror the server-side logic to be meaningful for PTU correctness verification.
- **Implementation (commit 9a2b7e2):** The test file's `skipFaintedTrainers()` helper (lines 78-91) mirrors `next-turn.post.ts` lines 305-318 exactly: same while loop, same HP check, same break condition. The `skipUndeclaredTrainers()` helper (lines 97-113) mirrors lines 327-343 exactly: same `declarations.some()` check with round matching. The `simulateNextTurn()` function (lines 160-305) was updated to include both skip functions at the correct call sites and with the `declarations` parameter.
- **Analysis:** The test helpers are pure function mirrors of the server-side implementations. The `simulateNextTurn` function correctly integrates both skip functions at the same positions as the server code: `skipFaintedTrainers` after advancing during declaration (line 200-202), `skipUndeclaredTrainers` after advancing during resolution (line 204-206), `skipUndeclaredTrainers` at the start of resolution phase (line 220), and `skipFaintedTrainers` at the start of new declaration phases (lines 264, 282-283). This matches the server code at lines 86-88, 90-92, 110, 162-163, and 182-183.
- **Status:** CORRECT

### 5. Decree-021 Compliance Post-Fix

- **Rule:** decree-021 mandates: "In League Battle mode, trainer turns follow a two-phase cycle per PTU p.227: (1) Declaration phase: trainers declare in lowest-to-highest speed order, recorded but NOT executed. (2) Resolution phase: declared actions resolve in highest-to-lowest speed order."
- **Analysis:** None of the 5 fix commits alter the core phase transition logic, turn order generation, or action execution semantics. Commit 9a2b7e2 adds tests that verify the two-phase flow. Commit 96aee22 changes only SCSS styling. Commit 3e23317 changes only a UI progress counter. Commits 67a7d39 and 35d69b9 are documentation-only. The two-phase system remains fully intact.
- **Status:** COMPLIANT

### 6. Decree-006 Interaction Preserved

- **Rule:** decree-006 mandates dynamic initiative reorder on speed changes without granting extra turns.
- **Analysis:** No fix commits modify `reorderInitiativeAfterSpeedChange()` or any initiative sorting logic. The phase-aware sort directions verified in rules-review-178 remain unchanged.
- **Status:** NOT IMPACTED

### 7. Phase Label SCSS Variable Consistency

- **Rule:** Phase labels must accurately reflect PTU p.227's mandated turn order directions.
- **Implementation (commit 96aee22):** Replaced all raw `#7c3aed` hex values with `$color-accent-violet` and all raw `#a78bfa` hex values with `$color-accent-violet-light` in 4 component files. Added `$color-accent-violet-light: #a78bfa` to `_variables.scss`. The phase label text content was not modified -- labels still read "Declaration (Low -> High)", "Resolution (High -> Low)", and "Pokemon Phase".
- **PTU analysis:** The SCSS variable refactor is purely a code quality improvement. The visual appearance of phase labels is unchanged (same hex values, now via variables). The labels accurately represent PTU p.227: "declare their actions in order from lowest to highest speed" (Low -> High) and "resolve from highest to lowest speed" (High -> Low).
- **Status:** CORRECT (visual and textual accuracy preserved)

## Summary

All 4 issues from code-review-217 have been correctly resolved without introducing any PTU mechanics regressions:

1. **HIGH-1 (skip function tests):** 7 test cases added covering `skipFaintedTrainers` (3 cases) and `skipUndeclaredTrainers` (4 cases). Test helper functions faithfully mirror server-side logic. The `simulateNextTurn` function correctly integrates skip calls at matching positions.

2. **MEDIUM-2 (SCSS variables):** All hardcoded `#7c3aed`/`#a78bfa` in the 4 league battle components replaced with `$color-accent-violet`/`$color-accent-violet-light`. New `$color-accent-violet-light` variable defined. Phase labels unchanged -- PTU turn order directions still accurately displayed.

3. **MEDIUM-3 (progress denominator):** `declarationProgress` now filters fainted trainers (`currentHp > 0`) from the denominator, consistent with the server-side `skipFaintedTrainers()` HP check. The progress counter now accurately reflects the number of trainers who will participate in declaration.

4. **MEDIUM-1 (app-surface.md):** `DeclarationPanel.vue` and `DeclarationSummary.vue` added to the "Key encounter components" section. `trainer_declared` and `declaration_update` WebSocket events documented.

The 13 PTU mechanics verified in rules-review-193 remain intact. No phase transition logic, turn order algorithms, action economy resets, or combat calculations were modified by the fix commits. Decree-021 and decree-006 compliance is preserved.

## Rulings

1. **The `currentHp > 0` check is the correct fainted threshold for PTU:** PTU defines "fainted" as reaching 0 HP (or below). The `> 0` check used in both `skipFaintedTrainers()` and the `declarationProgress` filter correctly identifies fainted trainers. A trainer at exactly 0 HP is fainted and cannot act per PTU rules.

2. **Round-scoped declaration matching is correct for skip logic:** The `d.round === currentRound` check in `skipUndeclaredTrainers()` ensures only current-round declarations count. This is defense-in-depth (declarations are cleared on new round), but it prevents any theoretical edge case where stale data could cause a trainer to incorrectly not be skipped. No PTU rule requires cross-round declaration persistence.

## Verdict

**APPROVED** -- All 4 issues from code-review-217 are resolved. The fixes are PTU-correct: fainted trainer skip logic matches PTU's "cannot act" rule, progress denominator accurately reflects declaring trainer count, and all 13 mechanics from rules-review-193 remain intact. No decree violations. No new PTU mechanics issues introduced.

## Required Changes

None.
