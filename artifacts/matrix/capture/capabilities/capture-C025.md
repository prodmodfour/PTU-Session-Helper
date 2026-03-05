---
cap_id: capture-C025
name: isLegendarySpecies
type: utility
domain: capture
---

### capture-C025: isLegendarySpecies
- **cap_id**: capture-C025
- **name**: Legendary Species Detection
- **type**: utility
- **location**: `app/constants/legendarySpecies.ts` -- `isLegendarySpecies()`
- **game_concept**: PTU p.310: Legendary Pokemon subtract 30 from capture rate
- **description**: Checks if a species name corresponds to a legendary/mythical Pokemon. Uses a ReadonlySet of ~70 species covering Gen 1-8 + Hisui. Direct lookup first, then case-insensitive fallback. Used by both capture APIs for automatic legendary detection.
- **inputs**: speciesName (string)
- **outputs**: boolean
- **accessible_from**: api-only (used by capture/rate.post.ts and capture/attempt.post.ts)
