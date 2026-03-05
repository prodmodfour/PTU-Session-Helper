---
cap_id: scenes-C083
name: scene_request WebSocket Event
type: websocket-event
domain: scenes
---

### scenes-C083
- **name:** scene_request WebSocket Event
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts`
- **game_concept:** Player reconnection scene recovery
- **description:** Client-to-server message from player requesting current active scene. Server responds with scene_sync. Used for reconnection recovery.
- **inputs:** `{ type: "scene_request" }`
- **outputs:** scene_sync response
- **accessible_from:** player
