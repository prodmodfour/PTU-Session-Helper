---
cap_id: scenes-C041
name: Scene Activate/Deactivate Store Actions
type: store-action
domain: scenes
---

### scenes-C041
- **name:** Scene Activate/Deactivate Store Actions
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- activateScene, deactivateScene
- **game_concept:** Scene serving to Group View
- **description:** Activate: calls API, updates isActive flags, posts BroadcastChannel message. Deactivate: calls API, clears activeScene/activeSceneId, posts BroadcastChannel message.
- **inputs:** Scene ID
- **outputs:** Updated store state, BroadcastChannel notification
- **accessible_from:** gm
