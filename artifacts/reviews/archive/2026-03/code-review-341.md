---
review_id: code-review-341
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-122
domain: vtt-grid, player-view
commits_reviewed:
  - 5cdc7a84
  - e752a7fb
  - 8068c5e7
  - d737f8ec
  - d4e576f4
  - 7c43dee4
  - 383e094d
  - 519a1908
files_reviewed:
  - app/pages/group/index.vue
  - app/pages/group/_components/EncounterView.vue
  - app/components/group/InitiativeTracker.vue
  - app/components/group/CombatantDetailsPanel.vue
  - app/composables/usePlayerWebSocket.ts
  - app/pages/player/index.vue
  - app/components/player/PlayerEncounterView.vue
  - app/components/player/PlayerCombatantInfo.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-05T14:32:00Z
follows_up: null
---

## Review Scope

Wiring `receivedFlankingMap` from the WebSocket layer into group and player views so flanking badges render for non-GM clients. Two parallel data paths:

**Group view path (provide/inject):** `group/index.vue` destructures `receivedFlankingMap` from `useWebSocket()` and provides it via `provide()`. `EncounterView.vue` injects it and passes it to `InitiativeTracker` (as `flankingMap` prop) and `CombatantDetailsPanel` (as computed `isFlanked` boolean). 4 commits.

**Player view path (props):** `usePlayerWebSocket.ts` re-exports `receivedFlankingMap` from `useWebSocket()`. `player/index.vue` destructures it and passes it as a prop to `PlayerEncounterView`, which passes `isFlanked` booleans down to each `PlayerCombatantInfo`. 4 commits.

Decree check: decree-040 (flanking penalty after evasion cap) governs the mechanical calculation in `useFlankingDetection`/`useMoveCalculation`, not the badge display. These commits only wire display state; the underlying `FlankingMap` data is already computed correctly per decree-040. No violations.

## Issues

No issues found.

## What Looks Good

1. **Commit granularity is exemplary.** 8 commits, each touching exactly 1 file, each with a clear single-purpose conventional commit message. This is exactly how the project guidelines prescribe.

2. **Prop plumbing is type-safe throughout.** The `FlankingMap` type from `~/types` is imported in every component that uses it. Optional chaining with `?.[combatant.id]?.isFlanked` and nullish coalescing `?? false` correctly handle the case where a combatant has no flanking entry.

3. **Provide/inject for group path is the right call.** `EncounterView` is loaded via dynamic component (`tabComponents[activeTab.value]`), making prop drilling impractical. The inject default `readonly(ref({}))` ensures a safe empty state if provide is missing.

4. **Readonly chain is preserved.** `useWebSocket` returns `readonly(receivedFlankingMap)`. `usePlayerWebSocket` passes it through without re-wrapping. `group/index.vue` provides the readonly ref directly. No mutation paths are exposed.

5. **4K scaling is applied where it matters.** `InitiativeTracker.__flanked` and `PlayerCombatantInfo.__flanked` both have 4K media query overrides. `CombatantDetailsPanel.flanking-badge` uses SCSS variables (`$font-size-xs`, `$spacing-xs`) that already scale via the variable system, consistent with the GM view's `CombatantCard.flanking-badge` which also has no 4K override.

6. **Badge styling is consistent across views.** All three badge variants (group InitiativeTracker, group CombatantDetailsPanel, player PlayerCombatantInfo) use `$color-warning` with matching opacity values for background and border, following the established pattern from the GM view's `CombatantCard`.

7. **Both entity types handled.** `FlankingMap` is keyed by combatant ID, and all three v-for loops (players, allies, enemies in `PlayerEncounterView`) pass `isFlanked` -- covering both HumanCharacter and Pokemon combatants.

8. **No file size concerns.** Largest file is `CombatantDetailsPanel.vue` at 780 lines (under 800 limit). All other files are well under.

## Verdict

**APPROVED.** Clean, minimal wiring change with correct types, correct provide/inject usage, consistent styling, and excellent commit discipline. No regressions, no new patterns introduced -- just connecting existing infrastructure to existing UI patterns.
