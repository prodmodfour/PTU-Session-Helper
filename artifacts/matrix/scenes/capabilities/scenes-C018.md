---
cap_id: scenes-C018
name: Add Character to Scene
type: api-endpoint
domain: scenes
---

### scenes-C018
- **name:** Add Character to Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/characters.post.ts`
- **game_concept:** Placing a trainer/NPC into a scene
- **description:** Adds a character to the scene's JSON characters array with position and group assignment. Validates not already present. Broadcasts scene_character_added.
- **inputs:** `{ characterId, name, avatarUrl?, position?, groupId? }`
- **outputs:** `{ success, data: SceneCharacter }`
- **accessible_from:** gm
