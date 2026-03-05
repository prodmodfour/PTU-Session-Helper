---
domain: scenes
type: capabilities
total_capabilities: 54
mapped_at: 2026-03-05T00:00:00Z
mapped_by: app-capability-mapper
---

# App Capabilities: Scenes

> Complete re-map of the scenes domain (2026-03-05). 54 capabilities across Prisma models, types, API endpoints, services, utilities, stores, composables, components, and WebSocket events.

## Capability Listing

| Cap ID | Name | Type |
|--------|------|------|
| scenes-C001 | Scene Prisma Model | prisma-model |
| scenes-C002 | GroupViewState Prisma Model | prisma-model |
| scenes-C003 | Scene TypeScript Types | constant |
| scenes-C004 | SceneSyncPayload Type | constant |
| scenes-C005 | PlayerSceneData Type | constant |
| scenes-C010 | List All Scenes | api-endpoint |
| scenes-C011 | Create Scene | api-endpoint |
| scenes-C012 | Get Scene by ID | api-endpoint |
| scenes-C013 | Get Active Scene | api-endpoint |
| scenes-C014 | Update Scene | api-endpoint |
| scenes-C015 | Delete Scene | api-endpoint |
| scenes-C016 | Activate Scene | api-endpoint |
| scenes-C017 | Deactivate Scene | api-endpoint |
| scenes-C018 | Add Character to Scene | api-endpoint |
| scenes-C019 | Remove Character from Scene | api-endpoint |
| scenes-C020 | Add Pokemon to Scene | api-endpoint |
| scenes-C021 | Remove Pokemon from Scene | api-endpoint |
| scenes-C022 | Batch Position Update | api-endpoint |
| scenes-C023 | Create Group in Scene | api-endpoint |
| scenes-C024 | Update Group in Scene | api-endpoint |
| scenes-C025 | Delete Group from Scene | api-endpoint |
| scenes-C026 | Scene-to-Encounter Conversion | api-endpoint |
| scenes-C030 | Scene-End AP Restoration | service-function |
| scenes-C031 | Calculate Scene-End AP | utility |
| scenes-C032 | Encounter Budget Analysis | utility |
| scenes-C033 | Significance Presets | constant |
| scenes-C034 | Apply Trainer XP | utility |
| scenes-C040 | Scene CRUD Store Actions | store-action |
| scenes-C041 | Scene Activate/Deactivate Store Actions | store-action |
| scenes-C042 | Tab State Management | store-action |
| scenes-C043 | Batch Position Update Store Action | store-action |
| scenes-C044 | Scene WebSocket Event Handlers | store-action |
| scenes-C045 | Scene Store Getters | store-getter |
| scenes-C046 | Cross-Tab Sync via BroadcastChannel | store-action |
| scenes-C050 | Player Scene State | composable-function |
| scenes-C051 | Group View WebSocket Scene Handlers | composable-function |
| scenes-C052 | Player WebSocket Scene Handlers | composable-function |
| scenes-C053 | Encounter Budget for Scene Editor | composable-function |
| scenes-C060 | GM Scenes Manager Page | component |
| scenes-C061 | GM Scene Editor Page | component |
| scenes-C062 | SceneCanvas | component |
| scenes-C063 | ScenePropertiesPanel | component |
| scenes-C064 | SceneAddPanel | component |
| scenes-C065 | ScenePokemonList | component |
| scenes-C066 | SceneGroupsPanel | component |
| scenes-C067 | SceneHabitatPanel | component |
| scenes-C068 | StartEncounterModal | component |
| scenes-C069 | QuestXpDialog | component |
| scenes-C070 | Group View SceneView | component |
| scenes-C071 | Player SceneView | component |
| scenes-C080 | Scene WebSocket Broadcast Functions | websocket-event |
| scenes-C081 | Scene Activation/Deactivation Broadcasts | websocket-event |
| scenes-C082 | scene_sync WebSocket Event | websocket-event |
| scenes-C083 | scene_request WebSocket Event | websocket-event |
