---
cap_id: scenes-C014
name: Update Scene
type: api-endpoint
domain: scenes
---

### scenes-C014
- **name:** Update Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].put.ts`
- **game_concept:** Scene editing (all fields)
- **description:** Partial update of any scene field. Serializes JSON arrays before storage. Broadcasts WebSocket scene_update if scene is active.
- **inputs:** Scene ID (URL param), partial scene body
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm
