---
review_id: code-review-334
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-097
domain: combat
commits_reviewed:
  - 531a6969
  - f246663d
  - be601ee1
  - 1c984251
  - 7aa773ff
  - 1e07ff90
files_reviewed:
  - app/composables/useGmToast.ts
  - app/components/encounter/GmToastContainer.vue
  - app/assets/scss/components/_gm-toast.scss
  - app/composables/useEncounterActions.ts
  - app/pages/gm/index.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 2
reviewed_at: 2026-03-04T12:00:00Z
follows_up: null
---

## Review Scope

Reviewed 6 commits implementing refactoring-097: replacement of 11 blocking `alert()` calls in the combat domain with a new `useGmToast` singleton composable and `GmToastContainer` overlay component. Verified singleton pattern, toast queue management, severity mapping, auto-dismiss timers, component lifecycle cleanup, SCSS BEM conventions, immutable state handling, and completeness of `alert()` replacement within scope.

Checked applicable decrees: decree-012 (type-based status immunities) is correctly referenced in the `handleStatus` catch block, and the toast message appropriately guides the GM to use "Force Apply (GM Override)" to bypass. No decree violations found.

## Issues

### HIGH

**H1. Timer leak: no cleanup of pending timers when GM navigates away from encounter page.**

File: `app/composables/useGmToast.ts` (module-level `timers` Map, lines 25-26)
File: `app/pages/gm/index.vue` (no `onUnmounted` cleanup for toasts)

The `timers` Map and `toasts` ref are module-scoped singletons. When the GM navigates away from the encounter page (`/gm` to another route), the `GmToastContainer` unmounts but pending `setTimeout` callbacks remain active. These callbacks will fire and mutate the `toasts` ref after the component is gone. While this won't crash (the ref still exists at module scope), it means:

1. Stale timers keep running across page navigations, accumulating if the GM navigates back and forth.
2. If a toast fires after navigation and the GM returns, old toasts may briefly appear.

**Fix:** Call `dismissAll()` in an `onUnmounted` hook in `GmToastContainer.vue`, or in the GM page's existing `onUnmounted` block. Since the state is singleton, `GmToastContainer` is the right place:

```typescript
// In GmToastContainer.vue <script setup>
const { toasts, dismissToast, dismissAll } = useGmToast()

onUnmounted(() => {
  dismissAll()
})
```

This clears all pending timers when the encounter page is torn down.

### MEDIUM

**M1. `dismissAll` iterates Map while deleting from it -- works but fragile.**

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

While ECMAScript specifies that Map iteration tolerates in-flight deletions, this pattern is unusual and could confuse future maintainers. The idiomatic approach is:

```typescript
const dismissAll = (): void => {
  toasts.value = []
  for (const timer of timers.values()) {
    clearTimeout(timer)
  }
  timers.clear()
}
```

**M2. Dismount check toast message is very long and may overflow the 420px toast container.**

File: `app/composables/useEncounterActions.ts`, lines 71-77

The dismount check toast concatenates four sentences into a single toast message:
```
"Dismount Check Triggered! Sparky took >= 1/4 max HP damage while mounted. Rider must make Acrobatics/Athletics DC 12 (+2 Mounted Prowess) to remain mounted. If failed, use Dismount button in Mount Controls."
```

At 420px max-width, this will wrap to 5+ lines, making it harder to read at a glance compared to the other toast messages which are 1-2 lines. Consider splitting into two shorter sentences or truncating the instructional suffix. The DC and bonus are the critical info; "use Dismount button" is a reminder that could be shortened to "Dismount if failed."

## What Looks Good

1. **Singleton pattern is correct.** Module-scoped `ref`, `Map`, and counter outside the composable function ensure a single shared toast queue. The `readonly(toasts)` return prevents consumers from mutating the array directly. Immutable array updates (`[...toasts.value, toast]` and `.filter()`) avoid direct mutation of the reactive array.

2. **Severity mapping matches ticket spec exactly.** All six severity categories (warning/8s, critical/12s, info/5s, error/8s) match the ticket's documented mapping. The `success` (4s) severity is forward-looking for future use (e.g., the `handleTemplateSaved` TODO comment on line 694 of gm/index.vue).

3. **Complete alert() replacement in scope.** All 11 `alert()` calls in `useEncounterActions.ts` (9) and `gm/index.vue` (2) have been replaced. Zero `alert()` calls remain in either file. The remaining `confirm()` calls (endEncounter, removeCombatant) are intentionally retained as they are blocking-by-design user confirmations, not notifications.

4. **Decree-012 compliance.** The status immunity rejection handler (line 122-130 of useEncounterActions.ts) correctly catches 409 status codes and directs the GM to use the override. Per decree-012, type-based status immunities are enforced server-side, and this client-side toast correctly informs the GM of the rejection and override path.

5. **SCSS follows BEM conventions.** Block: `.gm-toast`, elements: `__icon`, `__message`, `__dismiss`, modifiers: `--warning`, `--critical`, `--error`, `--info`, `--success`. TransitionGroup animation classes use Vue's expected naming (`gm-toast-enter-active`, etc.). The `pointer-events: none` on container with `pointer-events: auto` on individual toasts is a clean pattern that prevents the overlay from blocking clicks on the page below.

6. **z-index layering is correct.** `$z-index-toast: 400` is above overlays (300) but below the hardcoded modal `z-index: 1000` in gm/index.vue. Toasts remain visible during normal gameplay but don't cover modal dialogs.

7. **Phosphor Icons used correctly** per project convention (PhWarning, PhSkull, PhWarningCircle, PhInfo, PhCheckCircle, PhX).

8. **Commit granularity is good.** Six commits for six logical units: composable, component+styles, encounter actions replacement, page integration, page handler replacement, ticket update.

9. **Accessibility.** `aria-live="polite"` on the container and `role="alert"` on individual toasts ensure screen readers announce notifications without interrupting current speech.

## Verdict

**CHANGES_REQUIRED** -- One HIGH issue (H1: timer leak on navigation) must be fixed before approval. The two MEDIUM issues (M1, M2) should also be addressed in the same pass since the developer is already in these files.

## Required Changes

1. **H1 (must fix):** Add `onUnmounted(() => dismissAll())` to `GmToastContainer.vue` to clear pending timers when the GM navigates away from the encounter page.
2. **M1 (fix now):** Refactor `dismissAll` to use `timers.clear()` after iterating values, instead of deleting during iteration.
3. **M2 (fix now):** Shorten the dismount check toast message to reduce visual clutter. Suggested: `"Dismount Check! ${name} took >= 1/4 max HP. DC ${dc}${bonusText} Acrobatics/Athletics or dismount."` -- keep the critical info, drop the instructional text.
