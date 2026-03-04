---
id: refactoring-132
title: Add type-narrowing helper for Combatant entity union to eliminate as Pokemon casts
category: TYPE-SAFETY
priority: P4
severity: LOW
domain: combat
source: useCombatantSwitchButtons.ts (plan-1772661312 slave-5)
created_by: slave-collector (plan-1772661312)
created_at: 2026-03-04
affected_files:
  - app/composables/useCombatantSwitchButtons.ts
  - app/types/encounter.ts
---

# refactoring-132: Add type-narrowing helper for Combatant entity union

## Summary

`useCombatantSwitchButtons.ts` uses 7 unchecked `(c.entity as Pokemon)` casts, guarded only by `c.type === 'pokemon'` checks. This is a pre-existing pattern inherited from CombatantGmActions.vue during extraction. A type-narrowing utility function would eliminate these casts and improve type safety across combat composables.

## Suggested Fix

Add a type guard function like `isPokemonCombatant(c: Combatant): c is PokemonCombatant` that narrows both `c.type` and `c.entity` in one check. Apply across combat composables that access the entity union.

## Impact

- Type safety improvement: eliminates unsafe `as` casts
- Reusable: other combat composables likely have the same pattern
