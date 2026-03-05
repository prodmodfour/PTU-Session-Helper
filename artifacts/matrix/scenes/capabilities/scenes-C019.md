---
cap_id: scenes-C019
name: Remove Character from Scene
type: api-endpoint
domain: scenes
---

### scenes-C019
- **name:** Remove Character from Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/characters/[charId].delete.ts`
- **game_concept:** Removing a trainer/NPC from a scene
- **description:** Removes a character from the scene by scene-local ID. Broadcasts scene_character_removed.
- **inputs:** Scene ID, Character scene-local ID (URL params)
- **outputs:** `{ success, message }`
- **accessible_from:** gm
