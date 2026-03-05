---
cap_id: scenes-C026
name: Scene-to-Encounter Conversion
type: api-endpoint
domain: scenes
---

### scenes-C026
- **name:** Scene-to-Encounter Conversion
- **type:** api-endpoint
- **location:** `app/server/api/encounters/from-scene.post.ts`
- **game_concept:** Transitioning from narrative scene to combat encounter
- **description:** Creates a new Encounter from a scene. Scene Pokemon become wild enemy combatants with full DB sheets, scene characters become player combatants. Grid auto-placement. Inherits scene weather. Supports battleType and significance tier.
- **inputs:** `{ sceneId, battleType?, significanceMultiplier?, significanceTier? }`
- **outputs:** `{ success, data: Encounter }`
- **accessible_from:** gm
