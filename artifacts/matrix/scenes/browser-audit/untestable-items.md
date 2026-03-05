# Browser Audit: Untestable Items — Scenes Domain

These capabilities are server-side only (Prisma models, API endpoints, services, utilities, constants, store actions, store getters, composables, WebSocket events) with no direct UI element to verify in the browser. They are classified as **Untestable** per the audit protocol.

## Prisma Models

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| scenes-C001 | Scene Prisma Model | prisma-model | Database schema definition; no UI terminus |
| scenes-C002 | GroupViewState Prisma Model | prisma-model | Database schema definition; no UI terminus |

## Type Definitions / Constants

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| scenes-C003 | Scene TypeScript Types | constant | TypeScript interface definitions; no UI terminus |
| scenes-C004 | SceneSyncPayload Type | constant | TypeScript interface for WebSocket payloads; no UI terminus |
| scenes-C005 | PlayerSceneData Type | constant | TypeScript interface for player scene data; no UI terminus |
| scenes-C033 | Significance Presets | constant | Constant data definitions; consumed by StartEncounterModal but not directly testable |

## API Endpoints

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| scenes-C010 | List All Scenes | api-endpoint | REST endpoint; UI terminus is C060 (verified separately) |
| scenes-C011 | Create Scene | api-endpoint | REST endpoint; UI terminus is C060 "New Scene" button (verified) |
| scenes-C012 | Get Scene by ID | api-endpoint | REST endpoint; UI terminus is C061 scene editor load (verified) |
| scenes-C013 | Get Active Scene | api-endpoint | REST endpoint; consumed by stores/composables |
| scenes-C014 | Update Scene | api-endpoint | REST endpoint; UI terminus is C063 property fields (verified) |
| scenes-C015 | Delete Scene | api-endpoint | REST endpoint; UI terminus is C060 delete button (verified) |
| scenes-C016 | Activate Scene | api-endpoint | REST endpoint; UI terminus is C060/C061 activate button (verified) |
| scenes-C017 | Deactivate Scene | api-endpoint | REST endpoint; UI terminus is C060/C061 deactivate button (verified) |
| scenes-C018 | Add Character to Scene | api-endpoint | REST endpoint; UI terminus is C064 character add (verified) |
| scenes-C019 | Remove Character from Scene | api-endpoint | REST endpoint; UI terminus is C062 canvas remove action |
| scenes-C020 | Add Pokemon to Scene | api-endpoint | REST endpoint; UI terminus is C064 pokemon add |
| scenes-C021 | Remove Pokemon from Scene | api-endpoint | REST endpoint; UI terminus is C062 canvas remove action |
| scenes-C022 | Batch Position Update | api-endpoint | REST endpoint; UI terminus is C062 canvas drag |
| scenes-C023 | Create Group in Scene | api-endpoint | REST endpoint; UI terminus is C066 add group button (verified) |
| scenes-C024 | Update Group in Scene | api-endpoint | REST endpoint; UI terminus is C066 rename/resize |
| scenes-C025 | Delete Group from Scene | api-endpoint | REST endpoint; UI terminus is C066 delete group |
| scenes-C026 | Scene-to-Encounter Conversion | api-endpoint | REST endpoint; UI terminus is C068 modal confirm |

## Service Functions / Utilities

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| scenes-C030 | Scene-End AP Restoration | service-function | Server-side service; no direct UI trigger |
| scenes-C031 | Calculate Scene-End AP | utility | Pure calculation utility; no UI terminus |
| scenes-C032 | Encounter Budget Analysis | utility | Pure calculation utility; consumed by C068 StartEncounterModal |
| scenes-C034 | Apply Trainer XP | utility | Pure calculation utility; consumed by C069 QuestXpDialog |

## Store Actions / Getters

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| scenes-C040 | Scene CRUD Store Actions | store-action | Pinia store methods; UI termini are C060/C061 (verified) |
| scenes-C041 | Scene Activate/Deactivate Store Actions | store-action | Pinia store methods; UI termini are activate/deactivate buttons (verified) |
| scenes-C042 | Tab State Management | store-action | Pinia store methods; UI terminus is GM header tab buttons (verified) |
| scenes-C043 | Batch Position Update Store Action | store-action | Pinia store method; UI terminus is C062 canvas drag |
| scenes-C044 | Scene WebSocket Event Handlers | store-action | Pinia store methods; WebSocket-triggered, no direct UI element |
| scenes-C045 | Scene Store Getters | store-getter | Pinia computed properties; no direct UI element |
| scenes-C046 | Cross-Tab Sync via BroadcastChannel | store-action | BroadcastChannel sync; no direct UI element |

## Composable Functions

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| scenes-C050 | Player Scene State | composable-function | Composable providing scene data to PlayerSceneView; no direct UI element |
| scenes-C051 | Group View WebSocket Scene Handlers | composable-function | WebSocket event handlers; no direct UI element |
| scenes-C052 | Player WebSocket Scene Handlers | composable-function | WebSocket event handlers; no direct UI element |
| scenes-C053 | Encounter Budget for Scene Editor | composable-function | Budget calculation composable; consumed by C068 StartEncounterModal |

## WebSocket Events

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| scenes-C080 | Scene WebSocket Broadcast Functions | websocket-event | Server-side broadcast; no direct UI element |
| scenes-C081 | Scene Activation/Deactivation Broadcasts | websocket-event | Server-side broadcast; no direct UI element |
| scenes-C082 | scene_sync WebSocket Event | websocket-event | WebSocket protocol event; no direct UI element |
| scenes-C083 | scene_request WebSocket Event | websocket-event | WebSocket protocol event; no direct UI element |
