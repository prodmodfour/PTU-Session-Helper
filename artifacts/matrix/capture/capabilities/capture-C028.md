---
cap_id: capture-C028
name: checkEvolvesWithStone
type: service-function
domain: capture
---

### capture-C028: checkEvolvesWithStone
- **cap_id**: capture-C028
- **name**: Evolution Stone Check
- **type**: service-function
- **location**: `app/server/services/ball-condition.service.ts` -- `checkEvolvesWithStone()`
- **game_concept**: Moon Ball condition -- does species evolve via Evolution Stone
- **description**: Parses the evolutionTriggers JSON field from SpeciesData to check if any trigger requires an Evolution Stone. Checks requiredItem against a list of stone keywords (Fire Stone, Water Stone, etc.). Used for Moon Ball conditional modifier.
- **inputs**: evolutionTriggersJson (string)
- **outputs**: boolean
- **accessible_from**: api-only (used by buildConditionContext)
