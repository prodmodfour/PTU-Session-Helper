---
cap_id: scenes-C080
name: Scene WebSocket Broadcast Functions
type: websocket-event
domain: scenes
---

### scenes-C080
- **name:** Scene WebSocket Broadcast Functions
- **type:** websocket-event
- **location:** `app/server/utils/websocket.ts`
- **game_concept:** Scene real-time synchronization
- **description:** Nine broadcast functions using broadcastToGroupAndPlayers: scene_update, scene_pokemon_added/removed, scene_character_added/removed, scene_positions_updated, scene_group_created/updated/deleted.
- **inputs:** Scene change from API endpoint
- **outputs:** WebSocket message to group + player clients
- **accessible_from:** gm (triggers), group (receives), player (receives)
