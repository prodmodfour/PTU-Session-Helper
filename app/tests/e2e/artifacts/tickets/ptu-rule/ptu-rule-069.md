---
ticket_id: ptu-rule-069
priority: P2
status: open
domain: combat
source: code-review-077
created_at: 2026-02-20
created_by: orchestrator
severity: HIGH
affected_files:
  - app/composables/useEncounterActions.ts
  - app/composables/useGridMovement.ts
---

## Summary

Sprint tempCondition is applied via direct reactive mutation and not persisted to database.

## Issues

1. `combatant.tempConditions.push('Sprint')` in `useEncounterActions.ts` directly mutates the reactive store object, violating the project's immutability rules.
2. Sprint is applied client-side only — page refresh loses the Sprint state. Compare with Take a Breather which persists via a server endpoint.

## Fix

1. Replace direct push with immutable array creation: `{ ...combatant, tempConditions: [...(combatant.tempConditions || []), 'Sprint'] }`
2. Persist Sprint via a server endpoint (similar to breather.post.ts) so it survives page refresh.
