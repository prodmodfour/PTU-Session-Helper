---
cap_id: scenes-C062
name: SceneCanvas
type: component
domain: scenes
---

### scenes-C062
- **name:** SceneCanvas
- **type:** component
- **location:** `app/components/scene/SceneCanvas.vue`
- **game_concept:** Visual scene layout with drag-and-drop
- **description:** Drag-and-drop canvas rendering groups, Pokemon sprites, and character avatars at percentage-based positions. Supports sprite drag with group drop detection, group drag with member movement, and corner-handle resize.
- **inputs:** scene (Scene), selectedGroupId
- **outputs:** Events: update:positions, resize-group, select-group, delete-group, remove-pokemon, remove-character
- **accessible_from:** gm
