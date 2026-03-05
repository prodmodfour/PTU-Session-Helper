---
cap_id: capture-C050
name: capture_attempt WebSocket event
type: websocket-event
domain: capture
---

### capture-C050: capture_attempt WebSocket Event
- **cap_id**: capture-C050
- **name**: Capture Attempt Broadcast
- **type**: websocket-event
- **location**: `app/server/api/capture/attempt.post.ts` (broadcast), `app/composables/useWebSocket.ts` (handler), `app/types/api.ts` (type)
- **game_concept**: Real-time capture event notification to Group View and Player View
- **description**: After every capture attempt (success or failure), the server broadcasts a capture_attempt WebSocket event to all connected clients. Event data: pokemonId, trainerId, trainerName, pokemonSpecies, ballType, captured (boolean), roll, modifiedRoll, captureRate, ballModifier, postCaptureEffect?. Client handler in useWebSocket stores in lastCaptureAttempt ref. On successful capture, triggers encounter reload to reflect Pokemon ownership change.
- **inputs**: Broadcast from attempt.post.ts
- **outputs**: lastCaptureAttempt reactive ref updated in useWebSocket
- **accessible_from**: gm, group, player (all connected WebSocket clients)
