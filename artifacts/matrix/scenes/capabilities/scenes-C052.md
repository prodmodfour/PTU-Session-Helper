---
cap_id: scenes-C052
name: Player WebSocket Scene Handlers
type: composable-function
domain: scenes
---

### scenes-C052
- **name:** Player WebSocket Scene Handlers
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts`
- **game_concept:** Player real-time scene updates
- **description:** Handles scene_sync, scene_deactivated, and scene_activated WebSocket events for the player view. On scene_activated: calls fetchActiveScene (REST) for enriched data.
- **inputs:** WebSocket messages
- **outputs:** Updated PlayerSceneData via usePlayerScene
- **accessible_from:** player
