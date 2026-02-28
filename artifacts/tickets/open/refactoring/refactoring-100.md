---
ticket_id: refactoring-100
category: refactoring
priority: P4
status: open
title: "Reset badlyPoisonedRound on faint in applyDamageToEntity"
source: rules-review-203 (Medium-2)
created_by: slave-collector (plan-20260228-205826)
created_at: 2026-02-28
---

## Summary

When a combatant faints from any damage source, `applyDamageToEntity()` in `combatant.service.ts` clears all Persistent and Volatile status conditions (including Badly Poisoned) but does NOT reset `combatant.badlyPoisonedRound` back to 0. The field lives on the Combatant (not the entity), so the entity-level status clear doesn't touch it.

## Impact

Practically zero — the stale `badlyPoisonedRound` value cannot cause incorrect behavior because:
1. Tick damage checks for the 'Badly Poisoned' condition in `statusConditions` (already cleared on faint)
2. Re-applying Badly Poisoned via `status.post.ts` always sets `badlyPoisonedRound = 1`, overwriting any stale value

This is a data hygiene improvement to prevent future confusion and improve defensive correctness.

## Affected Files

- `app/server/services/combatant.service.ts` — in `applyDamageToEntity()`, add `combatant.badlyPoisonedRound = 0` when clearing conditions on faint

## Suggested Fix

In the faint handling path of `applyDamageToEntity()`, after clearing Persistent/Volatile conditions, add:
```typescript
combatant.badlyPoisonedRound = 0
```
