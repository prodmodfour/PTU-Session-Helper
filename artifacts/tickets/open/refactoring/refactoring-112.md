---
ticket_id: refactoring-112
category: EXT-GOD
priority: P3
severity: MEDIUM
status: in-progress
domain: combat
source: code-review-249 MEDIUM-001
created_by: slave-collector (plan-20260301-143720)
created_at: 2026-03-01
---

# Refactoring-112: Decompose encounter store into focused sub-modules

## Summary

The encounter store (`app/stores/encounter.ts`) is at 970 lines, exceeding the project's 800-line maximum. It mixes encounter CRUD, combat actions, undo/redo, serve/unserve, weather, AoO, wild spawn, significance, and switching — at least 5 distinct responsibility clusters.

This is pre-existing debt compounded by P2 additions (recallPokemon, releasePokemon store actions added +63 lines).

## Affected Files

- `app/stores/encounter.ts` (970 lines)

## Suggested Fix

Extract the encounter store into focused sub-modules:
- `useCombatActions` — turn progression, damage, healing, status
- `useEncounterCrud` — create, load, save, delete, serve/unserve
- `useUndoRedo` — snapshot history, undo, redo
- `useSwitching` store actions — recall, release, switch
- `useAoO` store actions — AoO detection, resolution, pending actions

The main `encounter` store would compose these sub-modules.

## Impact

Medium — the store is a central bottleneck. Every new combat feature adds to it. Decomposition enables parallel development and reduces merge conflicts.

## Resolution Log

### Commits
- `4871f86b` — Extract `useEncounterUndoRedo` composable (undo/redo, history init, snapshot)
- `640796b6` — Extract `useEncounterSwitching` composable (switch, recall, release)
- `8f005abf` — Extract `useEncounterOutOfTurn` composable (AoO, hold, priority, interrupt, intercept, disengage)
- `eb42e347` — Extract `useEncounterMounts` composable (mount/dismount, rider features, distance tracking)
- `19379430` — Extract `useEncounterCombatActions` composable (turn progression, damage, healing, items, actions)
- `8997dbdc` — Rewrite main store to delegate to composables (970 -> 782 lines)

### Files Changed
- `app/stores/encounter.ts` — Reduced from 970 to 782 lines
- `app/composables/useEncounterUndoRedo.ts` — New (112 lines)
- `app/composables/useEncounterSwitching.ts` — New (132 lines)
- `app/composables/useEncounterOutOfTurn.ts` — New (339 lines)
- `app/composables/useEncounterMounts.ts` — New (223 lines)
- `app/composables/useEncounterCombatActions.ts` — New (278 lines)

### Approach
Each composable accepts a context object (`getEncounter`, `setEncounter`, `setError`, `setBetweenTurns`) and returns action functions. The main store's `_buildContext()` helper creates this context from the Pinia `this` reference, and delegated actions are thin wrappers that forward to composable methods. All 58 consumer-referenced properties verified present on the store interface.
