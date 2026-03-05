---
cap_id: scenes-C065
name: ScenePokemonList
type: component
domain: scenes
---

### scenes-C065
- **name:** ScenePokemonList
- **type:** component
- **location:** `app/components/scene/ScenePokemonList.vue`
- **game_concept:** Per-character Pokemon browsing for scene setup
- **description:** Expandable per-character accordion showing owned Pokemon with sprite, species, nickname, level. Click + to add to scene.
- **inputs:** charactersWithPokemon[]
- **outputs:** Events: add-pokemon (species, level)
- **accessible_from:** gm
