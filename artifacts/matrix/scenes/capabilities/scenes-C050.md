---
cap_id: scenes-C050
name: Player Scene State
type: composable-function
domain: scenes
---

### scenes-C050
- **name:** Player Scene State
- **type:** composable-function
- **location:** `app/composables/usePlayerScene.ts`
- **game_concept:** Player view of active scene
- **description:** Manages player-side scene state. Handles scene_sync WebSocket events, scene deactivation, and REST fallback. Provides readonly activeScene ref with player-visible fields only.
- **inputs:** SceneSyncPayload (WebSocket) or REST response
- **outputs:** `{ activeScene, handleSceneSync, handleSceneDeactivated, fetchActiveScene }`
- **accessible_from:** player
