---
cap_id: capture-C008
name: getAvailableBallNames
type: utility
domain: capture
---

### capture-C008: getAvailableBallNames
- **cap_id**: capture-C008
- **name**: Available Ball Names List
- **type**: utility
- **location**: `app/constants/pokeBalls.ts` -- `getAvailableBallNames()`
- **game_concept**: Poke Ball selection filtering
- **description**: Returns an array of ball name strings, optionally including Safari-only balls. Safari balls excluded by default since they are restricted-use.
- **inputs**: includeSafari (boolean, default false)
- **outputs**: string[]
- **accessible_from**: gm, player (auto-imported utility)
