---
cap_id: scenes-C051
name: Group View WebSocket Scene Handlers
type: composable-function
domain: scenes
---

### scenes-C051
- **name:** Group View WebSocket Scene Handlers
- **type:** composable-function
- **location:** `app/composables/useGroupViewWebSocket.ts`
- **game_concept:** Group View real-time scene updates
- **description:** Routes 11 scene-related WebSocket events to groupViewTabs store handlers. Also handles tab_state events.
- **inputs:** WebSocket messages
- **outputs:** Store state updates via handler delegation
- **accessible_from:** group
