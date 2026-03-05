---
cap_id: scenes-C061
name: GM Scene Editor Page
type: component
domain: scenes
---

### scenes-C061
- **name:** GM Scene Editor Page
- **type:** component
- **location:** `app/pages/gm/scenes/[id].vue`
- **game_concept:** Scene editing workspace
- **description:** Full-featured editor with: name editing, activate/deactivate, quest XP, start encounter. Contains SceneGroupsPanel, SceneCanvas, ScenePropertiesPanel, SceneAddPanel, SceneHabitatPanel. Computes encounter budget info.
- **inputs:** Scene ID from route params
- **outputs:** Scene mutations via API calls
- **accessible_from:** gm
