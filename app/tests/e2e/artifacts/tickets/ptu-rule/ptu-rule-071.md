---
ticket_id: ptu-rule-071
priority: P2
status: open
domain: scenes
source: code-review-081
created_at: 2026-02-20
created_by: orchestrator
severity: HIGH
affected_files:
  - app/pages/gm/index.vue
---

## Summary

Weather changes skip undo/redo snapshot capture, making weather actions non-undoable.

## Issue

In `handleSetWeather()` (gm/index.vue line ~375), `encounterStore.captureSnapshot()` is not called before `encounterStore.setWeather()`, and `refreshUndoRedoState()` is not called after. Every other encounter action (damage, heal, stages, status, move execution, token movement) follows the snapshot-before-mutation pattern.

## Fix

Add `captureSnapshot('Set Weather')` before the weather change and `refreshUndoRedoState()` after, matching the pattern of all other action handlers.
