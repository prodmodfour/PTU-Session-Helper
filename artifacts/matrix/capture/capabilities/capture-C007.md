---
cap_id: capture-C007
name: getBallDef
type: utility
domain: capture
---

### capture-C007: getBallDef
- **cap_id**: capture-C007
- **name**: Ball Definition Lookup
- **type**: utility
- **location**: `app/constants/pokeBalls.ts` -- `getBallDef()`
- **game_concept**: Look up a specific Poke Ball type's definition
- **description**: Returns the PokeBallDef for a given ball type name, or undefined if not found.
- **inputs**: ballType (string)
- **outputs**: PokeBallDef | undefined
- **accessible_from**: gm, player (auto-imported utility)
