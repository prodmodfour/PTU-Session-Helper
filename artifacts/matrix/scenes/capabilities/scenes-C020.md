---
cap_id: scenes-C020
name: Add Pokemon to Scene
type: api-endpoint
domain: scenes
---

### scenes-C020
- **name:** Add Pokemon to Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/pokemon.post.ts`
- **game_concept:** Placing a Pokemon into a scene
- **description:** Adds a Pokemon to the scene's JSON pokemon array with species, level, position. Broadcasts scene_pokemon_added.
- **inputs:** `{ species, speciesId?, level?, nickname?, position?, groupId? }`
- **outputs:** `{ success, data: ScenePokemon }`
- **accessible_from:** gm
