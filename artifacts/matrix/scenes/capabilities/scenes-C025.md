---
cap_id: scenes-C025
name: Delete Group from Scene
type: api-endpoint
domain: scenes
---

### scenes-C025
- **name:** Delete Group from Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups/[groupId].delete.ts`
- **game_concept:** Removing a group and unassigning its members
- **description:** Removes a group and clears groupId from all assigned pokemon and characters. Broadcasts scene_group_deleted.
- **inputs:** Scene ID, Group ID (URL params)
- **outputs:** `{ success, message }`
- **accessible_from:** gm
