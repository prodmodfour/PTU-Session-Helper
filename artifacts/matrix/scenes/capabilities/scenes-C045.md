---
cap_id: scenes-C045
name: Scene Store Getters
type: store-getter
domain: scenes
---

### scenes-C045
- **name:** Scene Store Getters
- **type:** store-getter
- **location:** `app/stores/groupViewTabs.ts` -- isSceneTab, isEncounterTab, isMapTab, isLobbyTab, hasActiveScene
- **game_concept:** Tab state queries
- **description:** Five boolean getters for checking current tab state and active scene existence.
- **inputs:** Store state
- **outputs:** Boolean
- **accessible_from:** gm, group
