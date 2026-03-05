---
cap_id: scenes-C012
name: Get Scene by ID
type: api-endpoint
domain: scenes
---

### scenes-C012
- **name:** Get Scene by ID
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].get.ts`
- **game_concept:** Scene retrieval
- **description:** Fetches a single scene by ID with all JSON fields parsed.
- **inputs:** Scene ID (URL param)
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm
