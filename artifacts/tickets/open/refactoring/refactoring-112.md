---
ticket_id: refactoring-112
category: EXT-GOD
priority: P3
severity: MEDIUM
status: open
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
