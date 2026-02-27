---
review_id: code-review-211
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-092+refactoring-093
domain: encounter-tables+combat
commits_reviewed:
  - cb5c7ba
  - 28fe875
  - ba78b99
files_reviewed:
  - app/server/api/encounter-tables/[id]/modifications/[modId].put.ts
  - app/utils/typeEffectiveness.ts
  - app/utils/evasionCalculation.ts
  - app/composables/useMoveCalculation.ts
  - artifacts/tickets/in-progress/refactoring/refactoring-092.md
  - artifacts/tickets/in-progress/refactoring/refactoring-093.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-28T01:10:00Z
follows_up: null
---

## Review Scope

Two P4 refactoring tickets resolved in a single dev pass:

- **refactoring-092**: Partial-update merge in `[modId].put.ts` — level range cross-field validation now merges provided body values with existing DB state, matching the entry update endpoint pattern.
- **refactoring-093**: `getEffectivenessClass` relocated from `evasionCalculation.ts` to dedicated `typeEffectiveness.ts`, with import updated in `useMoveCalculation.ts`.

## Commit Analysis

### cb5c7ba — refactor: merge partial-update values with DB state in modification endpoint

**Changes:**
1. Level range validation now merges `body.levelRange.min/max` with `existing.levelMin/levelMax` using `!== undefined` checks (not `??` which conflates `undefined` and `null`).
2. Added explicit `typeof === 'number'` guards before the `min > max` comparison, preventing type coercion edge cases.
3. Switched from writing all fields unconditionally to selective `updateData` building — only fields present in the request body are written to DB.

**Assessment:**
- The merge pattern correctly mirrors the entry update endpoint (`[entryId].put.ts` lines 60-64). Both now use `!== undefined` to distinguish "not provided" from "explicitly set to null".
- The selective update data building prevents overwriting existing values with `undefined` when only a subset of fields is sent. This is the correct pattern for partial updates.
- The `typeof === 'number'` guard is a good defensive addition — prevents `null > null` or `null > 3` comparisons that could produce unexpected results.
- No mutation of the `existing` object — a new `updateData` object is built immutably.

**No issues found.**

### 28fe875 — refactor: relocate getEffectivenessClass to dedicated typeEffectiveness.ts

**Changes:**
1. `getEffectivenessClass` removed from `evasionCalculation.ts` (lines 82-93 deleted).
2. Identical function body placed in new `app/utils/typeEffectiveness.ts`.
3. Import in `useMoveCalculation.ts` updated from `evasionCalculation` to `typeEffectiveness`.

**Assessment:**
- The function is a pure presentational mapper (numeric multiplier to CSS class name) — it has no relation to evasion calculation. The relocation improves SRP compliance.
- The function body is byte-for-byte identical — no behavioral change.
- Grep confirms `getEffectivenessClass` is only imported in `useMoveCalculation.ts`. No other consumers were missed.
- `evasionCalculation.ts` now contains only evasion-related exports: `EvasionValues`, `EvasionDependencies`, and `computeTargetEvasions`. Clean separation.
- The re-export from `useMoveCalculation.ts` (line 750) is preserved, so any component consuming `getEffectivenessClass` via the composable is unaffected.

**No issues found.**

### ba78b99 — chore: update refactoring-092 and refactoring-093 tickets with resolution logs

**Changes:**
- Tickets moved from `open/` to `in-progress/`.
- Resolution logs added with commit SHA and file change summaries.

**Assessment:**
- Standard ticket lifecycle update. Correctly records what changed and where.

**No issues found.**

## Verdict

**APPROVED** — Both refactorings are clean, behavior-preserving changes that improve code organization. The modification endpoint now correctly handles partial updates with cross-field validation, matching the established entry endpoint pattern. The type effectiveness utility is properly isolated in its own file with no dangling imports.
