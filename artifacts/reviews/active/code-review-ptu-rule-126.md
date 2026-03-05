---
review_id: code-review-ptu-rule-126
review_type: code-review
reviewer: senior-reviewer
trigger: ptu-rule-126 implementation complete
target_report: ptu-rule-126
domain: combat
commits_reviewed:
  - 8e145b7d  # feat: add Snow Boots conditional Overland speed penalty (PRIMARY)
files_reviewed:
  - app/types/character.ts
  - app/utils/equipmentBonuses.ts
  - app/constants/equipment.ts
  - app/server/api/characters/[id]/equipment.put.ts
  - app/server/services/living-weapon.service.ts
  - app/components/character/tabs/HumanEquipmentTab.vue
  - app/components/character/EquipmentCatalogBrowser.vue
  - app/tests/unit/composables/useMoveCalculation.test.ts
  - app/tests/unit/services/living-weapon.service.test.ts
  - app/tests/unit/utils/equipmentBonuses.test.ts
verdict: PASS
issues_found: 1
reviewed_at: 2026-03-05T12:00:00Z
---

# Code Review: ptu-rule-126 (Snow Boots conditional Overland speed penalty)

## Summary

The implementation adds a `conditionalSpeedPenalty` data field to the equipment system, following the exact pattern already established by `conditionalDR`. Snow Boots are populated with `{ amount: -1, condition: 'On ice or deep snow' }`, matching PTU p.293 verbatim. The penalty is stored and displayed for GM reference but not auto-enforced, because the terrain system lacks ice/deep-snow granularity -- this is an acceptable and explicitly documented limitation.

## PTU Rules Verification

PTU p.293 (09-gear-and-items.md lines 1700-1703): "Snow Boots grant you the Naturewalk (Tundra) capability, but lower your Overland Speed by -1 while on ice or deep snow."

The implementation correctly:
- Stores the penalty amount as `-1` (matches PTU)
- Uses condition text "On ice or deep snow" (matches PTU wording)
- Does NOT auto-enforce (terrain system lacks granularity -- documented limitation)
- Preserves the existing `grantedCapabilities: ['Naturewalk (Tundra)']` on Snow Boots

## Decree Check

No active decrees govern equipment speed penalties or Snow Boots specifically. Decree-006 (dynamic initiative on speed CS changes) is tangentially related but applies to Combat Stage changes, not conditional Overland penalties. No conflict.

## Architecture Assessment

The implementation follows the established `conditionalDR` pattern precisely:

| Layer | conditionalDR (existing) | conditionalSpeedPenalty (new) | Consistent? |
|-------|-------------------------|-------------------------------|-------------|
| Type (character.ts) | Optional object on EquippedItem | Optional object on EquippedItem | Yes |
| Interface (equipmentBonuses.ts) | Array on EquipmentCombatBonuses | Array on EquipmentCombatBonuses | Yes |
| Collection (computeEquipmentBonuses) | Push with spread copy | Push with spread copy | Yes |
| Catalog (equipment.ts) | Inline object | Inline object | Yes |
| Zod (equipment.put.ts) | Validated optional object | Validated optional object | Yes |
| Display (HumanEquipmentTab) | v-for with bonus-tag--conditional | v-for with bonus-tag--conditional | Yes |
| Display (CatalogBrowser) | v-if span with item-bonus--conditional | v-if span with item-bonus--conditional | Yes |
| Living weapon fallback | Empty array in zero-bonus return | Empty array in zero-bonus return | Yes |
| Test mocks | Present in mocks | Present in mocks | Yes |

This is textbook pattern-following. No deviation from existing conventions.

## File-by-File Review

### app/types/character.ts (lines 125-129)
New optional `conditionalSpeedPenalty` field on `EquippedItem`. Correctly typed as `{ amount: number; condition: string }`. Comments are clear and include example. No issues.

### app/utils/equipmentBonuses.ts
- `EquipmentCombatBonuses` interface extended with `conditionalSpeedPenalties` array -- correct.
- `computeEquipmentBonuses()` collects penalties with spread copy (`{ ...item.conditionalSpeedPenalty }`) to avoid mutation -- correct.
- Return value includes the new field -- correct.
- The comment on line 53 mentions "conditional DR" in the iteration description but not conditional speed penalties. This is cosmetic and does not affect correctness.

### app/constants/equipment.ts (line 98)
Snow Boots entry correctly populated: `conditionalSpeedPenalty: { amount: -1, condition: 'On ice or deep snow' }`. Amount is negative (penalty), condition text matches PTU wording. Sits alongside `grantedCapabilities` -- correct.

### app/server/api/characters/[id]/equipment.put.ts (lines 34-37)
Zod validation: `amount: z.number().int().min(-10).max(0)` -- correctly constrains to negative values (penalties). `condition: z.string().min(1)` -- prevents empty strings. The schema uses `.optional()` -- correct since most items don't have this field.

### app/server/services/living-weapon.service.ts (line 408)
Zero-bonus return for non-human combatants includes `conditionalSpeedPenalties: []` -- correct. Prevents runtime errors when destructuring.

### app/components/character/tabs/HumanEquipmentTab.vue
- Lines 148-155: Display loop for conditional speed penalties uses same pattern as conditional DR. Uses `bonus-tag--conditional` class for consistent styling.
- Line 226: `hasBonuses` computed includes `conditionalSpeedPenalties.length > 0` -- correct, ensures the bonuses section shows when penalties exist.

### app/components/character/EquipmentCatalogBrowser.vue (lines 75-77)
Catalog item display shows `conditionalSpeedPenalty` with format `{amount} Overland ({condition})`. Consistent with the HumanEquipmentTab display format.

### Test mocks (2 files)
Both `useMoveCalculation.test.ts` and `living-weapon.service.test.ts` add `conditionalSpeedPenalties: []` to their mock return values. This prevents test failures from the interface change.

## Issues

### MEDIUM-01: No unit test coverage for `conditionalSpeedPenalties` in `computeEquipmentBonuses`

The existing `equipmentBonuses.test.ts` only covers `getEquipmentGrantedCapabilities`. There are no tests for `computeEquipmentBonuses` at all -- which means the new `conditionalSpeedPenalties` collection logic has zero direct test coverage.

Per Lesson 1 (verify test coverage for behavioral changes): this commit adds behavioral scope to `computeEquipmentBonuses()` -- it now collects a new field. The delta (conditional speed penalty collection) has no test coverage.

The test mocks in other files confirm the interface shape but do not exercise the actual collection logic (e.g., verifying that a Snow Boots item in the `feet` slot produces a `conditionalSpeedPenalties` array with one entry of `{ amount: -1, condition: 'On ice or deep snow' }`).

**Severity:** MEDIUM. The logic is simple (push with spread), follows an established pattern, and is unlikely to be wrong. But it is also trivial to test and the developer is already in this code. A test should be added now, not deferred.

**Required fix:** Add at least one test case to `equipmentBonuses.test.ts` (or a new describe block) that calls `computeEquipmentBonuses` with Snow Boots and verifies `conditionalSpeedPenalties` is populated correctly. Optionally test the empty case too.

## Verdict: PASS

One MEDIUM issue (missing unit test). The implementation is correct, follows established patterns precisely, and the PTU rules are accurately represented. The acknowledged limitation (no auto-enforcement due to terrain system constraints) is properly documented in the commit message, ticket resolution log, and code comments.

The MEDIUM issue should be addressed promptly but does not block the implementation from being considered complete for its stated scope.
