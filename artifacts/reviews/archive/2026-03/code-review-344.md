---
review_id: code-review-344
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-128
domain: combat
commits_reviewed:
  - 8ebb6a20
files_reviewed:
  - app/utils/evasionCalculation.ts
  - app/utils/equipmentBonuses.ts
  - app/composables/useMoveCalculation.ts
  - app/server/services/living-weapon.service.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-05T10:15:00Z
follows_up: null
---

## Review Scope

Commit `8ebb6a20` replaces inline equipment bonus computation in `evasionCalculation.ts` with a call to the shared `getEffectiveEquipBonuses` utility extracted in prior commit `dcf159e6`. This is the final step in refactoring-128: all three client-side call sites (useMoveCalculation.ts, evasionCalculation.ts, and conceptually the server-side living-weapon.service.ts) now use a single source of truth for equipment bonus calculation.

**Decree check:** decree-040 (flanking penalty after evasion cap) and decree-043 (combat skill rank gates move access, not engagement) are not affected by this refactoring. The change is purely structural -- no calculation logic was altered.

## Issues

No issues found.

## What Looks Good

1. **Behavioral equivalence verified.** The removed inline code in evasionCalculation.ts performed the exact same sequence as `getEffectiveEquipBonuses`: cast entity to HumanCharacter, get equipment, find wieldRel by combatant id, look up LIVING_WEAPON_CONFIG, apply computeEffectiveEquipment, then call computeEquipmentBonuses. The shared utility reproduces this logic identically.

2. **Null safety preserved.** The old code guarded `wieldRelationships` with `if (wieldRelationships)` before searching. The new code uses `wieldRelationships ?? []`, which produces the same result: `[].find(...)` returns `undefined`, so no Living Weapon overlay is applied when wield relationships are absent.

3. **Clean import pruning.** The old imports (`computeEquipmentBonuses`, `computeEffectiveEquipment` from equipmentBonuses, `LIVING_WEAPON_CONFIG` from livingWeapon) are replaced by a single `getEffectiveEquipBonuses` import. No orphaned imports remain.

4. **Net reduction of 11 lines** in evasionCalculation.ts (from ~98 to ~88 lines). The file remains clean and well under the 800-line threshold.

5. **Consistent call pattern.** Both useMoveCalculation.ts (via `getEquipBonuses` wrapper at line 84) and evasionCalculation.ts (direct call at line 65) now delegate to the same shared utility, eliminating the last duplicate code path for equipment bonus calculation on the client side.

6. **Commit granularity is correct.** Single file changed, single logical purpose, clear commit message citing the ticket.

## Acknowledged: useMoveCalculation.ts at 871 lines

The file exceeds the 800-line threshold. Per ticket notes, this growth is due to other features added since the extraction, not a regression from this refactoring (the extraction in `dcf159e6` actually reduced the file). A separate ticket (refactoring-086) tracks the file size issue. Not blocking.

## Verdict

**APPROVED.** The refactoring is correct, minimal, and behaviorally equivalent to the replaced inline code. No issues found.

## Required Changes

None.
