---
cap_id: scenes-C016
name: Activate Scene
type: api-endpoint
domain: scenes
---

### scenes-C016
- **name:** Activate Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/activate.post.ts`
- **game_concept:** Scene serving to Group View
- **description:** Activates a scene: restores AP for characters in active scenes, deactivates others, updates GroupViewState, broadcasts scene_activated.
- **inputs:** Scene ID (URL param)
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm (action), group+player (receive broadcast)
