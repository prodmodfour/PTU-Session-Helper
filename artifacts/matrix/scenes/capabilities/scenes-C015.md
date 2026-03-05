---
cap_id: scenes-C015
name: Delete Scene
type: api-endpoint
domain: scenes
---

### scenes-C015
- **name:** Delete Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].delete.ts`
- **game_concept:** Scene deletion
- **description:** Deletes a scene by ID. Clears GroupViewState.activeSceneId if scene was active.
- **inputs:** Scene ID (URL param)
- **outputs:** `{ success, message }`
- **accessible_from:** gm
