---
cap_id: scenes-C024
name: Update Group in Scene
type: api-endpoint
domain: scenes
---

### scenes-C024
- **name:** Update Group in Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups/[groupId].put.ts`
- **game_concept:** Group editing (rename, reposition, resize)
- **description:** Partial update of a group's name, position, width, or height. Broadcasts scene_group_updated.
- **inputs:** Scene ID, Group ID, `{ name?, position?, width?, height? }`
- **outputs:** `{ success, data: SceneGroup }`
- **accessible_from:** gm
