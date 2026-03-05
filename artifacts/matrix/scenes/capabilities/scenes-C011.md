---
cap_id: scenes-C011
name: Create Scene
type: api-endpoint
domain: scenes
---

### scenes-C011
- **name:** Create Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/index.post.ts`
- **game_concept:** Scene creation
- **description:** Creates a new scene with name (required), optional description, locationName, locationImage, weather, terrains, modifiers, habitatId.
- **inputs:** `{ name, description?, locationName?, locationImage?, weather?, terrains?, modifiers?, habitatId? }`
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm
