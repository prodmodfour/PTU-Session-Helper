---
cap_id: capture-C040
name: usePlayerCombat.captureTargets
type: composable-function
domain: capture
---

### capture-C040: usePlayerCombat.captureTargets
- **cap_id**: capture-C040
- **name**: Capture Target Filtering
- **type**: composable-function
- **location**: `app/composables/usePlayerCombat.ts` -- `captureTargets` (computed)
- **game_concept**: PTU: only wild (enemy-side) Pokemon can be captured, not trainer-owned
- **description**: Computed property returning enemy-side, non-fainted Pokemon combatants that can be targeted for capture. Filters encounter combatants by type=pokemon, side=enemies, and currentHp > 0.
- **inputs**: encounterStore.encounter.combatants
- **outputs**: Combatant[] (valid capture targets)
- **accessible_from**: player
