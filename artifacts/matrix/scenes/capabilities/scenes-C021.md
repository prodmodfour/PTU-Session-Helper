---
cap_id: scenes-C021
name: Remove Pokemon from Scene
type: api-endpoint
domain: scenes
---

### scenes-C021
- **name:** Remove Pokemon from Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/pokemon/[pokemonId].delete.ts`
- **game_concept:** Removing a Pokemon from a scene
- **description:** Removes a Pokemon from the scene by scene-local ID. Broadcasts scene_pokemon_removed.
- **inputs:** Scene ID, Pokemon scene-local ID (URL params)
- **outputs:** `{ success, message }`
- **accessible_from:** gm
