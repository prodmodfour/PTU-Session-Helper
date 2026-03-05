---
cap_id: scenes-C042
name: Tab State Management
type: store-action
domain: scenes
---

### scenes-C042
- **name:** Tab State Management
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- fetchTabState, setActiveTab, handleTabChange
- **game_concept:** Group View tab navigation
- **description:** Manages which tab is shown on the Group View (lobby/scene/encounter/map). Reads from server, PUTs to server, handles WebSocket tab_state events.
- **inputs:** Tab name (GroupViewTab), optional sceneId
- **outputs:** Updated activeTab and activeSceneId
- **accessible_from:** gm (modify), group (read via WebSocket)
