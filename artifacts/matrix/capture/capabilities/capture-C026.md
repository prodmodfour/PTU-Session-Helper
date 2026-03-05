---
cap_id: capture-C026
name: LEGENDARY_SPECIES
type: constant
domain: capture
---

### capture-C026: LEGENDARY_SPECIES
- **cap_id**: capture-C026
- **name**: Legendary Species Set
- **type**: constant
- **location**: `app/constants/legendarySpecies.ts` -- `LEGENDARY_SPECIES`
- **game_concept**: Canonical legendary/mythical Pokemon list for capture penalty
- **description**: ReadonlySet of ~70 legendary and mythical Pokemon species names from Gen 1-8 plus Hisui (Enamorus). Names in Title Case matching SpeciesData.name format. Includes Ultra Beasts (e.g. Nihilego, Buzzwole). Used by isLegendarySpecies() for automatic detection.
- **inputs**: N/A (constant)
- **outputs**: ReadonlySet<string>
- **accessible_from**: api-only (used by legendarySpecies.ts utility)
