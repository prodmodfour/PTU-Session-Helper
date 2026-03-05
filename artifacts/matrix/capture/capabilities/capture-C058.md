---
cap_id: capture-C058
name: player.index.captureAckDisplay
type: component
domain: capture
---

### capture-C058: Player View Capture Ack Display
- **cap_id**: capture-C058
- **name**: Player View Capture Result Toast
- **type**: component
- **location**: `app/pages/player/index.vue` -- isCaptureAckMiss computed, actionAckClass/actionAckMessage
- **game_concept**: Player receives feedback on their capture request outcome
- **description**: After GM processes a capture request, the player_action_ack is received. Player View displays the result as a toast: if accuracy missed (isCaptureAckMiss), shows error-style toast with miss reason. Otherwise shows success/failure of the capture attempt. Uses CaptureAckResult type from player-sync.ts.
- **inputs**: lastActionAck from usePlayerWebSocket
- **outputs**: Toast notification display
- **accessible_from**: player
