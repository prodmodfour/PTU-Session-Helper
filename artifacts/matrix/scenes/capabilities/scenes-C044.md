---
cap_id: scenes-C044
name: Scene WebSocket Event Handlers
type: store-action
domain: scenes
---

### scenes-C044
- **name:** Scene WebSocket Event Handlers
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- 11 handler methods
- **game_concept:** Real-time scene synchronization
- **description:** Eleven handler methods for WebSocket scene events: handleSceneUpdate, handleSceneActivated, handleSceneDeactivated, handleScenePositionsUpdated, handleSceneCharacterAdded/Removed, handleScenePokemonAdded/Removed, handleSceneGroupCreated/Updated/Deleted. Immutable updates to activeScene or scenes[].
- **inputs:** WebSocket event data
- **outputs:** Updated activeScene and/or scenes[]
- **accessible_from:** gm, group
