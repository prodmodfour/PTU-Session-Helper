---
cap_id: scenes-C081
name: Scene Activation/Deactivation Broadcasts
type: websocket-event
domain: scenes
---

### scenes-C081
- **name:** Scene Activation/Deactivation Broadcasts
- **type:** websocket-event
- **location:** `app/server/api/scenes/[id]/activate.post.ts`, `app/server/api/scenes/[id]/deactivate.post.ts`
- **game_concept:** Scene serving state changes
- **description:** Activate broadcasts scene_activated with full scene data. Deactivate broadcasts scene_deactivated with sceneId. Called directly in API handlers.
- **inputs:** Scene activation/deactivation
- **outputs:** WebSocket message to group + player clients
- **accessible_from:** gm (triggers), group (receives), player (receives)
