---
id: refactoring-136
title: "Remove dead enterBetweenTurns/exitBetweenTurns exports from useEncounterOutOfTurn"
category: DEAD-CODE
priority: P4
severity: LOW
status: open
domain: encounter-tables
source: code-review-333 MEDIUM-001
created_by: slave-collector (plan-1772695906)
created_at: 2026-03-05
affected_files:
  - app/composables/useEncounterOutOfTurn.ts
  - app/stores/encounter.ts
---

## Summary

`useEncounterOutOfTurn` defines and exports `enterBetweenTurns()` and `exitBetweenTurns()` (lines 171-178, 332-333), but the main encounter store keeps these as inline one-liners (lines 720-721) rather than delegating. The composable functions are dead code.

## Suggested Fix

Either delegate from the store to the composable (consistent with other actions) or remove the dead exports from the composable's return object.

## Impact

Low — dead code, no behavioral effect. Cleanup for consistency with the delegation pattern.
