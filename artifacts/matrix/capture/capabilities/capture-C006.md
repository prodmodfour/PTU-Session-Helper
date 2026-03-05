---
cap_id: capture-C006
name: getBallsByCategory
type: utility
domain: capture
---

### capture-C006: getBallsByCategory
- **cap_id**: capture-C006
- **name**: Ball Category Grouping
- **type**: utility
- **location**: `app/constants/pokeBalls.ts` -- `getBallsByCategory()`
- **game_concept**: UI grouping of Poke Ball types by category
- **description**: Returns all 25 ball types grouped into four categories: basic, apricorn, special, safari. Used by BallSelector component for organized dropdown display.
- **inputs**: None
- **outputs**: Record<PokeBallCategory, PokeBallDef[]>
- **accessible_from**: gm, player (auto-imported utility)
