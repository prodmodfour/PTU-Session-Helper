---
cap_id: scenes-C082
name: scene_sync WebSocket Event
type: websocket-event
domain: scenes
---

### scenes-C082
- **name:** scene_sync WebSocket Event
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` -- sendActiveScene()
- **game_concept:** Player scene initial sync on connect
- **description:** Server queries DB for active scene, enriches with isPlayerCharacter and ownerId, sends scene_sync to specific player peer. Called on identify and scene_request.
- **inputs:** Player WebSocket peer connection
- **outputs:** scene_sync message with SceneSyncPayload
- **accessible_from:** player
