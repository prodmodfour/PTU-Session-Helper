---
review_id: code-review-330
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: ptu-rule-058
domain: encounter-tables
commits_reviewed:
  - 45fe9e6e
  - cf4dbadc
  - 2481e439
  - ec286f45
  - 7b79c592
  - a4c95a9e
  - 05935473
  - 2c89a931
  - 3199dce6
files_reviewed:
  - app/types/encounter.ts
  - app/constants/environmentPresets.ts
  - app/prisma/schema.prisma
  - app/server/api/encounters/[id]/environment-preset.put.ts
  - app/server/services/encounter.service.ts
  - app/stores/encounter.ts
  - app/components/encounter/EnvironmentSelector.vue
  - app/composables/useMoveCalculation.ts
  - app/utils/damageCalculation.ts
  - app/components/encounter/MoveTargetModal.vue
  - app/pages/gm/index.vue
  - app/assets/scss/components/_environment-selector.scss
  - app/assets/scss/components/_move-target-modal.scss
  - app/server/api/encounters/[id].put.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 3
reviewed_at: 2026-03-04T18:00:00Z
follows_up: null
---

## Review Scope

P2 implementation of the Environmental Modifier Framework for ptu-rule-058. 9 commits across 14 app files. Adds type definitions, 3 built-in presets (Dark Cave, Frozen Lake, Hazard Factory), a Prisma JSON field, a dedicated PUT endpoint, an EnvironmentSelector GM component, and accuracy penalty integration into the move calculation flow.

No active decrees directly govern environment presets. Decree-030 (significance cap) and decree-031 (encounter budget) are adjacent but not applicable. No new decree-need tickets warranted -- the implementation takes a deliberately simplified approach to darkness penalties (GM reference tool, not automated illumination tracking), which is a reasonable design decision, not a rule ambiguity.

## Issues

### HIGH

**HIGH-1: `getEnvironmentAccuracyPenalty()` called as function in template -- redundant evaluation on every render**

File: `app/components/encounter/MoveTargetModal.vue` (lines 119-120)
File: `app/composables/useMoveCalculation.ts` (lines 482-494)

The MoveTargetModal template calls `getEnvironmentAccuracyPenalty()` twice (once in `v-if`, once in the interpolation). Since this is a plain function, not a computed property, it executes on every render cycle. While the function itself is lightweight (iterates preset effects), this is inconsistent with the codebase pattern -- every other accuracy modifier is either a computed or a single-call-cached value. More importantly, the penalty is encounter-scoped, not target-scoped, so it should be a `computed` in `useMoveCalculation`.

Fix: Convert `getEnvironmentAccuracyPenalty` to a computed property (e.g., `environmentAccuracyPenalty`) in `useMoveCalculation.ts`, return it from the composable, and reference it as a reactive value in the template. This also eliminates the double-call in the template.

**HIGH-2: `dismissEffect` mutates the active preset by filtering effects, but does not update `selectedPresetId` to reflect divergence from the built-in preset**

File: `app/components/encounter/EnvironmentSelector.vue` (lines 221-241)

When the GM dismisses an individual effect from a built-in preset (e.g., removes the accuracy_penalty from Dark Cave), the preset is saved with the same `id` as the original built-in but with fewer effects. If the GM then selects a different preset from the dropdown and comes back to "dark-cave", the dropdown will re-load the full built-in preset, silently overriding the customized version. The UX gives no indication that the active preset has diverged from the built-in definition.

Fix: When `dismissEffect` modifies a built-in preset, either (a) change the preset id to a custom variant (e.g., `dark-cave-custom-${Date.now()}`) and set `selectedPresetId` to `'custom'`, or (b) at minimum display a visual indicator that the preset has been modified from its built-in definition.

### MEDIUM

**MED-1: Dark Cave accuracy penalty is hardcoded as a single flat value, but the type definition and description say "per unilluminated meter"**

File: `app/composables/useMoveCalculation.ts` (lines 471-494)
File: `app/constants/environmentPresets.ts` (line 33)

The `accuracyPenaltyPerMeter` field is set to `-2` and the comment says "per unilluminated meter distance." However, `getEnvironmentAccuracyPenalty()` simply returns `Math.abs(accuracyPenaltyPerMeter)` as a flat +2 penalty regardless of distance. The comment at line 479 acknowledges this ("returns the base penalty value for a single meter of darkness"), but the type field name `accuracyPenaltyPerMeter` and the preset description ("Accuracy -2 per unilluminated meter") strongly imply distance-based scaling that does not happen.

This creates a correctness gap: in PTU, the Blindness penalty is -6 flat (not per-meter), and the description's "per unilluminated meter" formula is a homebrew simplification. The current implementation applies +2 regardless of actual distance, which is neither the RAW -6 nor the described per-meter scaling.

Fix: Either (a) rename the field to `accuracyPenalty` (dropping "PerMeter") and update the description to match the flat penalty behavior, or (b) if per-meter scaling is intended for future work, add a clear `// TODO` and document the current simplification in the preset description. The field name and behavior must agree.

**MED-2: Accuracy penalty sign convention is confusing across the codebase**

File: `app/constants/environmentPresets.ts` (line 33): `accuracyPenaltyPerMeter: -2`
File: `app/composables/useMoveCalculation.ts` (line 490): `penalty += Math.abs(effect.accuracyPenaltyPerMeter)`
File: `app/utils/damageCalculation.ts` (line 126): `environmentPenalty: number = 0` (documented as "Positive value = harder to hit")
File: `app/components/encounter/MoveTargetModal.vue` (line 120): `+{{ getEnvironmentAccuracyPenalty() }} Environment`

The preset stores the value as negative (-2), the composable negates it to positive via `Math.abs`, `calculateAccuracyThreshold` documents it as positive, and the template displays it with an explicit `+` prefix. This works but the sign flip between storage and usage is fragile. If someone later defines a custom preset with `accuracyPenaltyPerMeter: 2` (positive, thinking "2 penalty"), the `Math.abs` would produce the same result, masking the intent mismatch.

Fix: Store the penalty as a positive number in the preset (it is a penalty, so positive = worse). Remove the `Math.abs` in the composable. Update the DARK_CAVE_PRESET to use `accuracyPenaltyPerMeter: 2`. This makes the data flow transparent: positive in, positive through, positive applied.

**MED-3: `EnvironmentEffect` type uses `accuracyPenaltyPerMeter` as an optional field on ALL effect types, not scoped to `accuracy_penalty` type**

File: `app/types/encounter.ts` (lines 231-255)

The `EnvironmentEffect` interface has a `type` discriminator field but all optional payload fields (`accuracyPenaltyPerMeter`, `terrainRules`, `statusOnEntry`, `customRule`) live as flat optional properties on every effect instance. This means TypeScript does not enforce that `accuracyPenaltyPerMeter` is only present when `type === 'accuracy_penalty'`. A discriminated union would be more type-safe:

```typescript
type EnvironmentEffect =
  | { type: 'accuracy_penalty'; accuracyPenaltyPerMeter: number }
  | { type: 'terrain_override'; terrainRules: { ... } }
  | ...
```

However, since these are JSON-serialized to the DB and the current shape works with runtime guards (`effect.type === 'accuracy_penalty' && effect.accuracyPenaltyPerMeter`), this is a design quality issue rather than a correctness bug. The flat structure is simpler for JSON round-tripping but sacrifices compile-time safety.

Fix: Convert to a discriminated union type. The JSON serialization works identically (discriminated unions serialize to the same flat shape), but consumers get compile-time exhaustiveness checking. If this is deferred, add a comment explaining the flat structure is intentional for JSON compatibility.

## What Looks Good

1. **Clean layer separation.** The implementation follows the project's established patterns: types in `types/`, constants in `constants/`, dedicated PUT endpoint, store action, composable integration. Each commit is a single logical unit with good granularity.

2. **WebSocket sync is handled correctly.** The `updateFromWebSocket` method in the encounter store includes surgical `environmentPreset` patching (line 866-868), matching the existing pattern for other fields. The EnvironmentSelector broadcasts via `send({ type: 'encounter_update', data: encounterStore.encounter })` which is consistent with other GM controls.

3. **Backward compatibility.** The Prisma schema default of `"{}"` and the `parseEnvironmentPreset` function that returns `null` for `"{}"` ensures existing encounters without environment presets parse cleanly. The `calculateAccuracyThreshold` change uses a default parameter (`environmentPenalty: number = 0`), so all existing callers are unaffected.

4. **Server-side validation.** The `environment-preset.put.ts` endpoint validates the preset shape (requires `id`, `name`, and `effects` array). Error handling follows the project pattern of re-throwing H3 errors and wrapping unknown errors.

5. **SCSS follows project conventions.** BEM naming, glass morphism variables, scoped import. The `--env` modifier on the accuracy badge uses a distinct color to differentiate environment penalties from other accuracy modifiers.

6. **Immutable state updates in the store.** `setEnvironmentPreset` spreads the encounter object rather than mutating in place, consistent with the project's immutability conventions for non-WebSocket store updates.

7. **`damageCalculation.ts` pure function signature.** Adding the optional `environmentPenalty` parameter with a default of 0 preserves the pure function contract and keeps all existing callers working. Good forward-thinking API design.

## Verdict

**CHANGES_REQUIRED** -- 2 HIGH issues, 3 MEDIUM issues.

The HIGH-1 issue (function-in-template double evaluation) is a straightforward conversion to a computed. HIGH-2 (preset divergence on effect dismissal) is a UX correctness issue that will confuse GMs who customize built-in presets.

The MEDIUM issues (field naming, sign convention, type structure) are design quality issues that should be fixed now while the developer is already in the code. Deferring them will make the API surface harder to change later as more consumers are added.

## Required Changes

1. **HIGH-1:** Convert `getEnvironmentAccuracyPenalty()` to a computed property `environmentAccuracyPenalty` in `useMoveCalculation.ts`. Update MoveTargetModal to use the computed value instead of function calls.

2. **HIGH-2:** When `dismissEffect` modifies a built-in preset, mutate the preset id to a custom variant so re-selecting the original built-in from the dropdown restores the full preset definition. Alternatively, show a "(modified)" label next to the preset badge.

3. **MED-1:** Rename `accuracyPenaltyPerMeter` to `accuracyPenalty` (or similar) across types, constants, and composable to match the actual flat-penalty behavior. Update the Dark Cave description accordingly.

4. **MED-2:** Store accuracy penalty as a positive number in the preset constant. Remove the `Math.abs` wrapper in the composable.

5. **MED-3:** Convert `EnvironmentEffect` to a discriminated union type, or add a comment explaining the flat structure trade-off.
