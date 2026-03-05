---
cap_id: scenes-C010
name: List All Scenes
type: api-endpoint
domain: scenes
---

### scenes-C010
- **name:** List All Scenes
- **type:** api-endpoint
- **location:** `app/server/api/scenes/index.get.ts`
- **game_concept:** Scene library browsing
- **description:** Returns all scenes ordered by updatedAt desc. Parses JSON fields for client consumption.
- **inputs:** None
- **outputs:** `{ success, data: Scene[] }`
- **accessible_from:** gm
