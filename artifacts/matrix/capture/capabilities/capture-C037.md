---
cap_id: capture-C037
name: useCapture.getAvailableBalls
type: composable-function
domain: capture
---

### capture-C037: useCapture.getAvailableBalls
- **cap_id**: capture-C037
- **name**: Available Balls Filter
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` -- `getAvailableBalls()`
- **game_concept**: Poke Ball selection filtering (Safari excluded by default)
- **description**: Returns all ball definitions from POKE_BALL_CATALOG, filtering out Safari category balls by default. Safari balls are restricted-use items.
- **inputs**: includeSafari (boolean, default false)
- **outputs**: PokeBallDef[]
- **accessible_from**: gm, player
