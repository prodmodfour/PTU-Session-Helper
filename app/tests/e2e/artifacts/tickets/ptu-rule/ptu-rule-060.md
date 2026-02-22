---
ticket_id: ptu-rule-060
priority: P3
status: in-progress
design_spec: designs/design-level-budget-001.md
domain: scenes
matrix_source:
  rule_ids:
    - scenes-R029
    - scenes-R030
  audit_file: matrix/scenes-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

No PTU level-budget encounter creation formula or significance multiplier. PTU uses level*2*players budget for encounter difficulty and x1-x5 significance for XP scaling. The app uses a density-based spawn system instead.

## Expected Behavior (PTU Rules)

Encounter difficulty is determined by total level budget (sum of opponent levels vs. player level * 2 * party size). Significance multiplier (x1-x5) scales XP rewards.

## Actual Behavior

The density tier system controls spawn count but has no connection to level-based budgeting or significance-based XP scaling.

## Fix Log (P0 Review Fixes)

| Issue | Commit | Description |
|-------|--------|-------------|
| M2 | `9f43e79` | Rename `baselineXpPerPlayer` to `levelBudgetPerPlayer` in `encounterBudget.ts` |
| M1 / HIGH-1 | `107cc67` | Fix playerCount to count only human trainers (PTU p.460) in `useEncounterBudget.ts` |
| H2 | `1c4a6cc` | Extract shared difficulty color styles to `_difficulty.scss`, add `$color-neutral` variable |
| C1 (scene) | `6fcd1d7` | Wire `budgetInfo` prop to StartEncounterModal from `pages/gm/scenes/[id].vue` |
| C1 (generate) | `65e5b77` | Add manual party input to GenerateEncounterModal budget guide |
| H1 | `05f5847` | Update `app-surface.md` with budget system files |

## Fix Log (P0 Re-review Fixes — code-review-130)

| Issue | Commit | Description |
|-------|--------|-------------|
| C2 | `6654e05` | Add `difficulty-bg-colors-ancestor` mixin for ancestor-context selectors; fix BudgetIndicator fill bar |
| M3 | `9bed26f` | Extract BudgetGuide.vue from GenerateEncounterModal.vue (834 → 690 lines) |
| M4 | `e80fb27` | Filter budgetInfo playerCount to PC trainers only (PTU p.473) |

### Files Changed (Re-review)
- `app/assets/scss/_difficulty.scss` — added `difficulty-bg-colors-ancestor` mixin variant
- `app/components/encounter/BudgetIndicator.vue` — use ancestor mixin for fill bar
- `app/components/habitat/BudgetGuide.vue` — new component (extracted from GenerateEncounterModal)
- `app/components/habitat/GenerateEncounterModal.vue` — replaced inline budget guide with BudgetGuide component
- `app/pages/gm/scenes/[id].vue` — filter playerCount and ownedPokemonLevels to PC characters only

### Files Changed (Original)
- `app/utils/encounterBudget.ts` — renamed field + JSDoc
- `app/composables/useEncounterBudget.ts` — human-only player filter
- `app/assets/scss/_variables.scss` — added `$color-neutral`
- `app/assets/scss/_difficulty.scss` — new shared mixin partial
- `app/nuxt.config.ts` — added `_difficulty.scss` to SCSS preprocessor
- `app/components/encounter/BudgetIndicator.vue` — use shared mixin
- `app/components/scene/StartEncounterModal.vue` — use shared mixin
- `app/components/habitat/GenerateEncounterModal.vue` — manual party input + effective context
- `app/pages/gm/scenes/[id].vue` — compute and pass budgetInfo prop
- `.claude/skills/references/app-surface.md` — document budget system files
