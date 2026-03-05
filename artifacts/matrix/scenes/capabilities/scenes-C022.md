---
cap_id: scenes-C022
name: Batch Position Update
type: api-endpoint
domain: scenes
---

### scenes-C022
- **name:** Batch Position Update
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/positions.put.ts`
- **game_concept:** Drag-and-drop layout persistence
- **description:** Lightweight endpoint for batch-updating positions of pokemon, characters, and groups. Updates groupId assignments on drop. Broadcasts scene_positions_updated.
- **inputs:** `{ pokemon?: [{id, position, groupId?}], characters?: [{id, position, groupId?}], groups?: [{id, position, width?, height?}] }`
- **outputs:** `{ success, message }`
- **accessible_from:** gm
