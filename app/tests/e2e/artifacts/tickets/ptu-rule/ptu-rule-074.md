---
ticket_id: ptu-rule-074
priority: P3
status: open
domain: combat
source: code-review-083
created_at: 2026-02-20
created_by: orchestrator
severity: MEDIUM
affected_files:
  - app/composables/useEncounterActions.ts
---

## Summary

The `pass` action in `handleExecuteAction()` directly mutates the reactive `combatant.turnState` object instead of using an immutable update or server endpoint. This is the same class of bug that was fixed for Sprint in ptu-rule-069.

## Code Location

`app/composables/useEncounterActions.ts`, lines 163-167:

```typescript
if (combatant.turnState) {
  combatant.turnState.hasActed = true
  combatant.turnState.standardActionUsed = true
  combatant.turnState.shiftActionUsed = true
}
```

## Issue

The `combatant` is a reference into the reactive store via `findCombatant()`. Directly mutating `.turnState` properties violates the project's immutability rules. The Sprint mutation (ptu-rule-069) was fixed by creating a server endpoint — the `pass` action should follow the same pattern.

## Expected Fix

Either:
1. Create a `pass` server endpoint (like `sprint.post.ts`) that persists the turn state change, OR
2. Use an immutable store update method that creates a new combatant object with the updated turnState

## Discovery Context

Flagged as M1 in code-review-083 (re-review of VTT batch). Originally flagged as M3 in code-review-077 but never ticketed.
