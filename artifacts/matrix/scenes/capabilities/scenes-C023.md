---
cap_id: scenes-C023
name: Create Group in Scene
type: api-endpoint
domain: scenes
---

### scenes-C023
- **name:** Create Group in Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups.post.ts`
- **game_concept:** Grouping entities on the scene canvas
- **description:** Creates a new group with auto-offset positioning. Default size 150x100px. Broadcasts scene_group_created.
- **inputs:** `{ name?, position?, width?, height? }`
- **outputs:** `{ success, data: SceneGroup }`
- **accessible_from:** gm
