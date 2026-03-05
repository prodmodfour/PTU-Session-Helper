---
cap_id: scenes-C040
name: Scene CRUD Store Actions
type: store-action
domain: scenes
---

### scenes-C040
- **name:** Scene CRUD Store Actions
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- fetchScenes, fetchScene, fetchActiveScene, createScene, updateScene, deleteScene
- **game_concept:** Scene library management
- **description:** Pinia store providing full scene CRUD. Maintains scenes[] array and activeScene ref. Updates both list and activeScene when relevant.
- **inputs:** Scene data matching API expectations
- **outputs:** Updated store state (scenes[], activeScene)
- **accessible_from:** gm
