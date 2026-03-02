---
review_id: rules-review-247
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-020
domain: healing
commits_reviewed:
  - 327239ed
  - 67b4b170
  - 6229e6ba
  - f2147e4c
  - e9f42b61
mechanics_verified:
  - hp-restoration-amounts-unchanged
  - injury-capped-effective-max-hp-ui
  - item-healing-no-minimum
  - fainted-target-validation-unchanged
  - target-refusal-unchanged
  - full-hp-validation-uses-effective-max
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/09-gear-and-items.md#Basic-Restoratives
  - core/07-combat.md#Dealing-with-Injuries
reviewed_at: 2026-03-02T11:20:00Z
follows_up: rules-review-243
---

## Review Scope

Rules re-review of feature-020 P0 fix cycle. rules-review-243 APPROVED the original implementation with 0 issues. This review verifies that the 5 fix commits did not alter any PTU game mechanics.

## Mechanics Verified

### 1. HP Restoration Amounts -- UNCHANGED

The fix commits did not modify `applyHealingItem` lines 96-118 in `healing-item.service.ts`. The three healing paths (`hpAmount`, `healToFull`, `healToPercent`) remain identical to the original reviewed code. All item amounts still match PTU 1.05 p.276:

| Item | Code HP | PTU HP | Match |
|------|---------|--------|-------|
| Potion | 20 | 20 | Yes |
| Super Potion | 35 | 35 | Yes |
| Hyper Potion | 70 | 70 | Yes |
| Energy Powder | 25 | 25 | Yes |
| Energy Root | 70 | 70 | Yes |

The `HEALING_ITEM_CATALOG` in `healingItems.ts` was modified only to remove the dead `getApplicableItems` stub (15 lines deleted). All 14 item definitions remain byte-identical to the original.

### 2. Injury-Capped Effective Max HP -- UI NOW CORRECT (decree-017)

**Fix commit `67b4b170`** corrected the UseItemModal target dropdown to display `getEffectiveMaxHp(maxHp, injuries)` instead of raw `maxHp`.

**Rule:** PTU p.250: "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th." Per decree-017, this cap is universal.

**Verification:** The dropdown now shows the same effective max that the healing system uses internally. A Pokemon with 50 maxHp and 3 injuries will display `35 HP` ceiling -- matching the actual healing cap in `applyHealingToEntity`. This is a pure UI correctness improvement; the underlying mechanics were already correct per rules-review-243.

### 3. No Minimum Healing for Items -- UNCHANGED (decree-029)

The fix commits did not modify any healing calculation logic. `applyHealingToEntity` continues to use `Math.min(effectiveMax, previousHp + options.amount)` with no `Math.max(1, ...)` floor. Per decree-029, the minimum-1-HP rule applies only to rest healing, not items.

### 4. Fainted Target Validation -- UNCHANGED

The `validateItemApplication` function in `healing-item.service.ts` was modified only at line 58 (display name in error message, from nested ternary to `getEntityDisplayName(target)`). The actual validation logic at lines 44-51 (revive requires Fainted, non-revive rejects Fainted except Full Restore) is untouched.

### 5. Target Refusal -- UNCHANGED

The refusal handling at `use-item.post.ts` lines 57-66 was not modified by any fix commit. Items are still not consumed on refusal per PTU p.276.

### 6. Full HP Validation Uses Effective Max -- UNCHANGED

The full-HP check at `healing-item.service.ts` lines 54-60 already used `getEffectiveMaxHp` prior to the fix cycle. The only change was replacing the error message's display name logic (M2 fix). The comparison `entity.currentHp >= effectiveMax` is untouched. This correctly prevents using restoratives on targets already at their injury-reduced maximum.

### 7. P0 Category Gating -- UNCHANGED

The P0 category restriction at `use-item.post.ts` lines 48-53 (`p0AllowedCategories = ['restorative']`) was not modified. Non-restorative items continue to return a 400 error.

## Summary

The 5 fix commits addressed code quality issues (double validation, code duplication, dead code, display correctness, styling, documentation) without altering any PTU game mechanics. The only rules-relevant change is the UI now correctly displaying effective max HP in the target dropdown (decree-017 compliance in the presentation layer), which was already correct in the calculation layer.

All 14 catalog items, HP restoration logic, injury cap, fainted validation, target refusal, and P0 scoping remain identical to the code approved in rules-review-243.

## Verdict

**APPROVED** -- No PTU rule changes or regressions. Fix cycle was purely code quality improvements with one decree-017 UI correctness fix.

## Required Changes

None.
