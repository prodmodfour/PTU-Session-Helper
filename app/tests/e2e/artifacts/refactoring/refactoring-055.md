---
ticket_id: refactoring-055
priority: P3
status: open
category: EXT-DUPLICATE
source: code-review-112
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

`calculateEvasion` is duplicated in both `app/composables/useCombat.ts` and `app/utils/damageCalculation.ts` with identical logic. Consolidate into a single canonical location.

## Affected Files

- `app/composables/useCombat.ts` — `calculateEvasion()` (lines ~64-70)
- `app/utils/damageCalculation.ts` — `calculateEvasion()` (lines ~102-108)

## Suggested Fix

Keep the utility version in `damageCalculation.ts` (pure function, no Vue dependencies) and have `useCombat.ts` import and re-export or call it directly. Both compute `min(6, floor(applyStageModifier(baseStat, combatStage) / 5))`.
