---
cap_id: capture-C047
name: PlayerCapturePanel
type: component
domain: capture
---

### capture-C047: PlayerCapturePanel
- **cap_id**: capture-C047
- **name**: Player Capture Panel
- **type**: component
- **location**: `app/components/player/PlayerCapturePanel.vue`
- **game_concept**: Player-facing capture request interface (select target, preview rate, request GM approval)
- **description**: Two-step player capture flow: (1) Select target from captureTargets list (enemy-side, non-fainted Pokemon with sprites and HP), (2) View capture rate preview (server-side fetch with fallback to local estimate), see action cost reminder (Standard Action), then "Request Capture" button sends WebSocket request to GM. Cancel returns to target list.
- **inputs**: None (uses usePlayerCombat and usePlayerCapture composables)
- **outputs**: Emits 'request-sent', 'cancel'
- **accessible_from**: player (rendered inside PlayerCombatActions)
