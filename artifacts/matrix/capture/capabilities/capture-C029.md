---
cap_id: capture-C029
name: deriveEvoLine
type: service-function
domain: capture
---

### capture-C029: deriveEvoLine
- **cap_id**: capture-C029
- **name**: Evolution Line Derivation
- **type**: service-function
- **location**: `app/server/services/ball-condition.service.ts` -- `deriveEvoLine()`
- **game_concept**: Love Ball condition -- same evolutionary line check
- **description**: Derives a basic evolution line from species name and evolutionTriggers JSON. Returns array containing at minimum the species itself plus any toSpecies from its triggers. Full recursive DB evo line traversal deferred to P2.
- **inputs**: speciesName (string), evolutionTriggersJson (string)
- **outputs**: string[] (species names in evo line)
- **accessible_from**: api-only (used by buildConditionContext)
