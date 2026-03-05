---
cap_id: scenes-C005
name: PlayerSceneData Type
type: constant
domain: scenes
---

### scenes-C005
- **name:** PlayerSceneData Type
- **type:** constant
- **location:** `app/composables/usePlayerScene.ts` -- PlayerSceneData interface
- **game_concept:** Player-side scene representation
- **description:** Client-side interface for player scene state. Maps from SceneSyncPayload or REST response. Fields: id, name, description, locationName, locationImage, weather, isActive, characters, pokemon, groups.
- **inputs:** SceneSyncPayload or REST /api/scenes/active response
- **outputs:** Reactive ref consumed by PlayerSceneView component
- **accessible_from:** player
