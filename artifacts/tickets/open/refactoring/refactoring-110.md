---
ticket_id: refactoring-110
category: UX-IMPROVEMENT
priority: P4
severity: LOW
domain: pokemon-lifecycle
source: code-review-243 M2
created_by: slave-collector (plan-20260301-130000)
created_at: 2026-03-01
---

# Hide Level 40 ability button when Level 20 milestone incomplete

## Summary

`canAssignAbility('third')` in `PokemonLevelUpPanel.vue` returns true for a Pokemon at Level 40+ with only 1 ability because `1 < 3`. The UI shows both "Assign Ability" buttons (Level 20 and Level 40). Clicking the Level 40 button always fails with a server error (the server correctly rejects it), but presenting a button that will always fail is poor UX.

## Affected Files

- `app/components/pokemon/PokemonLevelUpPanel.vue` (lines 133-139)

## Suggested Fix

Add milestone ordering to the client-side check:
```typescript
if (type === 'third') return abilities.length >= 2 && abilities.length < 3
```

This hides the Level 40 button until the Level 20 milestone is completed.

## Impact

Low — server-side enforcement already prevents incorrect assignments. This is a UX polish to avoid showing a button that will always fail.
