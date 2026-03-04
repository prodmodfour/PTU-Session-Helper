---
review_id: code-review-336
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-108
domain: combat
commits_reviewed:
  - c4df4def
  - 2284d5de
files_reviewed:
  - app/composables/useCombatantSwitchButtons.ts
  - app/components/encounter/CombatantGmActions.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-04T12:00:00Z
follows_up: null
---

## Review Scope

Refactoring-108 extracted 5 switch-related computed properties from CombatantGmActions.vue into a new useCombatantSwitchButtons.ts composable. This was a pure extraction with no logic changes. The original ticket referenced CombatantCard.vue, but the computeds had already been moved to CombatantGmActions.vue in a prior extraction -- the resolution log documents this correctly.

Computeds extracted: `canShowSwitchButton`, `isSwitchDisabled`, `canShowFaintedSwitchButton`, `isFaintedSwitchDisabled`, `canShowForceSwitchButton`.

Note: The ticket's "Suggested Fix" listed `leagueRestrictionText` as one of the five computeds, but this computed does not exist anywhere in the codebase. The developer correctly extracted all five switch-related computeds that actually existed. No missing extraction.

## Issues

### MEDIUM

**M1: Unused `isPokemon` parameter in composable signature**

File: `app/composables/useCombatantSwitchButtons.ts`, line 12.

The composable accepts `isPokemon: Ref<boolean>` as its third parameter, but this ref is never read in the function body. The local variable `isPokemonTurn` on line 59 is unrelated -- it is a boolean derived from comparing IDs, not from the `isPokemon` parameter.

The caller in CombatantGmActions.vue passes `isPokemon` (line 194), creating a false impression of a dependency. This dead parameter should be removed from both the composable signature and the call site.

```typescript
// Current (line 9-13):
export function useCombatantSwitchButtons(
  combatant: Ref<Combatant>,
  entity: Ref<Combatant['entity']>,
  isPokemon: Ref<boolean>    // <-- never used
)

// Should be:
export function useCombatantSwitchButtons(
  combatant: Ref<Combatant>,
  entity: Ref<Combatant['entity']>
)
```

## What Looks Good

1. **Faithful extraction.** Diff confirms the logic is identical between the original inline computeds and the extracted composable. No accidental changes to conditions, return values, or branching.

2. **Reactivity preserved correctly.** The call site wraps `props.combatant` in `computed(() => props.combatant)` to pass a Ref, and `entity` is already a computed ref. This maintains Vue's reactivity tracking through the composable boundary.

3. **Decree compliance.** The `canShowForceSwitchButton` computed retains the decree-034 comment ("Whirlwind is a push, not a forced switch") in both the original and extracted code. No decree violations found. Decree-033 (fainted switch on trainer's next turn) is consistent with `isFaintedSwitchDisabled` requiring the trainer's turn. Decree-044 (no phantom Bound condition) -- no references to "Bound" exist in this code, which is correct.

4. **Clean component reduction.** CombatantGmActions went from 396 to 284 lines (112 lines removed, matching the ~125 lines of logic plus whitespace compression). Well under any size threshold.

5. **Single `encounterStore` instance.** The composable calls `useEncounterStore()` once at the top and shares it across all computeds, avoiding redundant store lookups that existed when each computed called it individually.

6. **Good documentation.** The composable header comment notes it was extracted from CombatantGmActions.vue and references the ticket. Each computed retains its original JSDoc.

7. **Ticket resolution log is accurate.** The resolution log correctly documents that the computeds were in CombatantGmActions.vue (not CombatantCard.vue) and references the prior extraction commits.

## Verdict

CHANGES_REQUIRED -- one medium issue must be fixed before approval.

## Required Changes

1. **Remove the unused `isPokemon` parameter** from `useCombatantSwitchButtons` (both the function signature and the call site in CombatantGmActions.vue). Dead parameters create confusion about actual dependencies and violate Interface Segregation.
