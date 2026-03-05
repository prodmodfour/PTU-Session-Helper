---
cap_id: scenes-C002
name: GroupViewState Prisma Model
type: prisma-model
domain: scenes
---

### scenes-C002
- **name:** GroupViewState Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model GroupViewState
- **game_concept:** Group View tab state singleton tracking active tab and scene
- **description:** Singleton row (id="singleton") tracking which tab is shown on the Group View (lobby/scene/encounter/map) and the activeSceneId reference. Updated when GM switches tabs or activates/deactivates scenes.
- **inputs:** activeTab, activeSceneId
- **outputs:** Persisted group view state
- **accessible_from:** gm (modify), group (read)
