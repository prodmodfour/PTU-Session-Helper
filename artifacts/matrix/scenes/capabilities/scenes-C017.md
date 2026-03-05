---
cap_id: scenes-C017
name: Deactivate Scene
type: api-endpoint
domain: scenes
---

### scenes-C017
- **name:** Deactivate Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/deactivate.post.ts`
- **game_concept:** Scene end with AP restoration
- **description:** Deactivates a scene: restores AP for all characters (PTU Core p221), clears GroupViewState, broadcasts scene_deactivated.
- **inputs:** Scene ID (URL param)
- **outputs:** `{ success, message }`
- **accessible_from:** gm (action), group+player (receive broadcast)
