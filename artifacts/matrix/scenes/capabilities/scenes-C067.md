---
cap_id: scenes-C067
name: SceneHabitatPanel
type: component
domain: scenes
---

### scenes-C067
- **name:** SceneHabitatPanel
- **type:** component
- **location:** `app/components/scene/SceneHabitatPanel.vue`
- **game_concept:** Linking scene to encounter table for wild spawns
- **description:** Collapsible sidebar linking scene to habitat. Dropdown to select, shows level range and density. Generate Random button. Entry list with sprites and rarity labels.
- **inputs:** encounterTables[], sceneHabitatId, collapsed, generating
- **outputs:** Events: select-habitat, add-pokemon, generate-encounter, toggle-collapse
- **accessible_from:** gm
