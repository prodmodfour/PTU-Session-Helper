---
cap_id: scenes-C046
name: Cross-Tab Sync via BroadcastChannel
type: store-action
domain: scenes
---

### scenes-C046
- **name:** Cross-Tab Sync via BroadcastChannel
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- setupCrossTabSync
- **game_concept:** Multi-tab browser synchronization
- **description:** BroadcastChannel ('ptu-scene-sync') for cross-tab sync of scene_activated and scene_deactivated. Ensures GM tab and Group tab stay synchronized without server round-trip.
- **inputs:** BroadcastChannel messages from other tabs
- **outputs:** Updated store state in receiving tab
- **accessible_from:** gm, group
