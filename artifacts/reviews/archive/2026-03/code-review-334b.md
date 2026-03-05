---
review_id: code-review-334b
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-131
domain: multiple
commits_reviewed:
  - 474531a3
  - 8a7e3f64
  - e35fdc66
  - cc568cd8
  - c3b8e334
  - 144e6831
  - b2ca1b1c
  - eae076a8
files_reviewed:
  - app/composables/useGmToast.ts
  - app/components/encounter/GmToastContainer.vue
  - app/layouts/gm.vue
  - app/pages/gm/index.vue
  - app/pages/gm/scenes/[id].vue
  - app/pages/gm/scenes/index.vue
  - app/pages/gm/pokemon/[id].vue
  - app/pages/gm/characters/[id].vue
  - app/pages/gm/sheets.vue
  - app/composables/useEvolutionUndo.ts
  - app/components/character/EquipmentCatalogBrowser.vue
  - app/components/character/tabs/HumanEquipmentTab.vue
  - app/components/character/TrainerXpPanel.vue
  - app/components/encounter/MountControls.vue
  - app/components/encounter/EnvironmentSelector.vue
  - app/components/encounter/DeclarationPanel.vue
  - app/components/encounter/XpDistributionModal.vue
  - app/components/encounter/XpDistributionResults.vue
  - app/components/pokemon/EvolutionConfirmModal.vue
  - app/components/scene/QuestXpDialog.vue
  - app/stores/encounter.ts
  - app/assets/scss/components/_gm-toast.scss
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-05T14:30:00Z
follows_up: code-review-334
---

## Review Scope

Reviewed 8 commits implementing refactoring-131: replacement of 49 `alert()` calls across 16 non-combat files with `useGmToast().showToast()`, plus moving `GmToastContainer` from `pages/gm/index.vue` to `layouts/gm.vue` so toasts work on all GM pages. Verified completeness of alert replacement, severity mapping consistency, decree compliance (decree-012, decree-048), and status of prior code-review-334 issues.

Checked applicable decrees:
- decree-012 (type-immunity-enforcement): No status immunity toasts were touched in this ticket. Existing enforcement in `useEncounterActions.ts` is unchanged. No violation.
- decree-048 (dark-cave-blindness-penalties): EnvironmentSelector toasts are generic error messages ("Failed to set environment preset"), not darkness-specific. No darkness penalty information is lost. No violation.

Intentional exclusions verified: 2 `alert()` calls remain in group views (`EncounterView.vue` line 137, `LobbyView.vue` line 59) -- these use the `group` layout which has no `GmToastContainer`. This is correct; those are TV/projector-facing views not intended for GM toast notifications.

## Issues

### HIGH

**H1. Timer leak on navigation -- code-review-334 HIGH-1 still unfixed.**

File: `app/components/encounter/GmToastContainer.vue`
File: `app/composables/useGmToast.ts` (module-level `timers` Map, line 25)

Code-review-334 required adding `onUnmounted(() => dismissAll())` to `GmToastContainer.vue`. This fix was never applied. Now that GmToastContainer has been moved from the encounter page to the GM layout, the impact is different but the bug persists:

- **Before the move:** Timers leaked when navigating from `/gm` to other non-GM pages.
- **After the move:** The GM layout persists across all `/gm/*` routes, so intra-GM navigation no longer leaks. However, navigating from any GM page to a non-GM page (e.g., opening `/group` in the same tab, or navigating to `/player`) still leaks timers. The module-scoped `timers` Map and `toasts` ref survive indefinitely.

Moving GmToastContainer to the layout actually reduces the frequency of the leak (the layout unmounts less often than individual pages), but does not eliminate it. The fix remains the same: add `onUnmounted(() => dismissAll())` to GmToastContainer.vue.

### MEDIUM

**M1. `dismissAll` iterates Map while deleting from it -- code-review-334 MEDIUM-1 still unfixed.**

File: `app/composables/useGmToast.ts`, lines 72-78

```typescript
const dismissAll = (): void => {
  toasts.value = []
  for (const [id, timer] of timers) {
    clearTimeout(timer)
    timers.delete(id)
  }
}
```

The idiomatic fix from code-review-334 still applies: iterate `timers.values()` then call `timers.clear()`.

**M2. Evolution ineligibility toast uses `\n` which renders as a space in HTML toast.**

File: `app/pages/gm/pokemon/[id].vue`, lines 418-421

```typescript
const reasons = response.data.ineligible
  .map(i => `${i.toSpecies}: ${i.reason}`)
  .join('\n')
showToast(`No evolutions currently available. ${reasons}`, 'warning')
```

The original `alert()` rendered `\n` as visible line breaks. The toast container uses `<span>{{ toast.message }}</span>`, and the SCSS for `.gm-toast__message` has no `white-space: pre-line` rule. Newlines are collapsed to spaces, making multi-species ineligibility reasons run together into an unreadable sentence. Fix by either:
- Adding `white-space: pre-line` to `.gm-toast__message` in `_gm-toast.scss`, or
- Changing `join('\n')` to `join('; ')` so it reads naturally as inline text.

The second option (semicolons) is preferred since `pre-line` would affect all toast messages globally and could cause unexpected wrapping behavior.

## What Looks Good

1. **GmToastContainer placement in GM layout is the correct architectural decision.** Moving from `pages/gm/index.vue` to `layouts/gm.vue` means all GM pages (scenes, sheets, pokemon, characters, encounters) can display toasts without each page needing to include the container. This eliminates a class of bugs where toasts silently fail on pages that forgot to include the container.

2. **All 49 alert() calls correctly replaced.** Grep for `\balert\(` in the app directory confirms only 2 intentional exclusions remain (group views). Each replacement uses appropriate severity levels: `'error'` for failures, `'warning'` for validation/rule messages, `'success'` for confirmations. No alert calls were missed.

3. **Severity mapping is consistent.** All error catch blocks use `'error'` severity (8s auto-dismiss). Evolution warnings use `'warning'` (8s). Success toasts use `'success'` (4s). No severity mismatches.

4. **Immutability patterns maintained.** `useGmToast` continues to use `[...toasts.value, toast]` for additions and `.filter()` for removals. No direct mutation of the reactive array.

5. **Encounter store usage is safe.** The `useGmToast().showToast()` call inside the Pinia store action (`encounter.ts` line 570) works correctly because it's invoked at runtime inside an action, not at store definition time. The module-scoped refs are available.

6. **Commit granularity is appropriate.** Eight commits organized by domain (layout, scenes, pokemon, equipment, encounter, evolution, character, extras). Each commit is focused and produces a working state.

7. **Group view exclusion is well-documented.** The ticket resolution log explicitly notes the 2 excluded group-view alerts and the 3 additional files found beyond the original ticket scope.

8. **Decree compliance verified.** No decree-012 or decree-048 violations in the changed files.

## Verdict

**CHANGES_REQUIRED** -- The three issues from code-review-334 (H1 timer leak, M1 map iteration, M2 message length) were never fixed in the parent ticket and remain outstanding. Since refactoring-131 moved GmToastContainer to the layout (touching both the composable and the container), these fixes are now squarely in scope. Additionally, the new M2 (newline rendering) introduced by this ticket must be addressed.

## Required Changes

1. **H1 (must fix):** Add `onUnmounted(() => dismissAll())` to `GmToastContainer.vue`. Destructure `dismissAll` from `useGmToast()` (already partially done -- just needs the lifecycle hook).
2. **M1 (fix now):** In `useGmToast.ts`, refactor `dismissAll` to iterate `timers.values()` then call `timers.clear()` instead of deleting during iteration.
3. **M2 (fix now):** In `app/pages/gm/pokemon/[id].vue` line 420, change `.join('\n')` to `.join('; ')` so ineligibility reasons render correctly in the HTML toast. The same pattern appears in `XpDistributionResults.vue` if it has a similar join -- verify and fix if present.
