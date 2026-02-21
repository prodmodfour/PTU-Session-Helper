---
ticket_id: ptu-rule-055
priority: P3
status: in-progress
design_spec: designs/design-xp-system-001.md
domain: pokemon-lifecycle
matrix_source:
  rule_id: pokemon-lifecycle-R058
  audit_file: matrix/pokemon-lifecycle-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

No post-combat XP calculation exists. Experience points are manually entered by the GM after encounters.

## Expected Behavior (PTU Rules)

Per PTU Core: after combat, XP is calculated based on opponent levels and distributed to participating Pokemon.

## Actual Behavior

No XP calculation or distribution system. The GM manually updates each Pokemon's experience field.

## Implementation Status

**P0 complete (2026-02-20):** XP calculation utility, calculation preview API, distribution API, and damage.post.ts type field edit.

**P1 complete (2026-02-20):** XpDistributionModal with full per-player validation, live XP calculation, level-up previews, results summary, xpDistributed safety flag, and end-encounter integration.

**P2 complete (2026-02-21):** LevelUpNotification component, add-experience endpoint, XpDistributionModal integration.

## Resolution Log

**code-review-119 fixes (2026-02-20):** Fixed 3 HIGH issues and 1 MEDIUM issue from P1 code review.

- **H1:** Removed redundant `handlePresetChange` handler that duplicated the `watch(effectiveMultiplier)` watcher, causing double API calls on preset dropdown change.
- **H2:** Added `initialized` guard flag so watchers do not fire during `onMounted`, preventing a second redundant `recalculate()` when `playerCount` is set to the detected value.
- **H3:** Added request version counter (`requestVersion`) to `recalculate()` so stale API responses from rapid parameter changes are discarded instead of overwriting fresh data.
- **M1:** Extracted 490 lines of SCSS to `app/assets/scss/components/_xp-distribution-modal.scss`, bringing the SFC from 1053 lines down to 572.

**P2 implementation (2026-02-21):**

- **253e3cb:** Created `LevelUpNotification.vue` component with per-Pokemon level-up display (stat points, tutor points, new moves, ability milestones, evolution eligibility) and `_level-up-notification.scss`.
- **f4bf446:** Created `add-experience.post.ts` endpoint for standalone manual/training XP grants with full level-up detection and learnset loading.
- **1735d09:** Integrated `LevelUpNotification` into `XpDistributionModal` results phase, displayed conditionally when any Pokemon leveled up.
