---
domain: scenes
mapped_at: 2026-02-19T00:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 76
files_read: 28
---

# App Capabilities: Scenes

## Summary
- Total capabilities: 76
- Types: api-endpoint(19), store-action(25), store-getter(5), component(10), composable-function(2), websocket-event(11), prisma-model(2), prisma-field(2)
- Orphan capabilities: 1

---

## scenes-C001: Scene Prisma Model

- **Type:** prisma-model
- **Location:** `app/prisma/schema.prisma:Scene`
- **Game Concept:** Narrative scene — links characters, Pokemon, groups to a location with weather
- **Description:** Scene model stores id, name, description, locationName, locationImage, pokemon (JSON), characters (JSON), groups (JSON), weather, terrains (JSON), modifiers (JSON), habitatId, isActive, createdAt, updatedAt.
- **Inputs:** N/A (data model definition)
- **Outputs:** All scene fields
- **Orphan:** false

## scenes-C002: GroupViewState Prisma Model

- **Type:** prisma-model
- **Location:** `app/prisma/schema.prisma:GroupViewState`
- **Game Concept:** Singleton tracking which tab and scene is shown on Group View
- **Description:** Singleton model with activeTab (lobby|scene|encounter|map) and activeSceneId. Controls what the Group View displays.
- **Inputs:** N/A (data model definition)
- **Outputs:** activeTab, activeSceneId
- **Orphan:** false

## scenes-C003: Scene Type Definitions

- **Type:** prisma-field
- **Location:** `app/types/scene.ts:Scene`
- **Game Concept:** Scene data shape
- **Description:** TypeScript interfaces: GroupViewTab, ScenePosition, ScenePokemon, SceneCharacter, SceneGroup, SceneModifier, Scene. Defines the client-side representation of scene data with parsed JSON fields.
- **Inputs:** N/A (type definitions)
- **Outputs:** GroupViewTab, ScenePosition, ScenePokemon, SceneCharacter, SceneGroup, SceneModifier, Scene interfaces
- **Orphan:** false

## scenes-C004: Terrains and Modifiers Fields (Deferred)

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:Scene.terrains` and `app/prisma/schema.prisma:Scene.modifiers`
- **Game Concept:** Scene terrain types and custom modifiers
- **Description:** DB columns and type definitions exist (Scene.terrains as string[], Scene.modifiers as SceneModifier[]) but UI was removed. API still reads/writes them. Deferred for future re-implementation.
- **Inputs:** terrains: string[], modifiers: SceneModifier[]
- **Outputs:** Serialized in API responses but no UI to set them
- **Orphan:** true

## scenes-C005: List All Scenes API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/index.get.ts:default`
- **Game Concept:** Scene management — list all scenes
- **Description:** GET /api/scenes — returns all scenes ordered by updatedAt desc. Parses JSON fields (pokemon, characters, groups, terrains, modifiers) from DB.
- **Inputs:** None
- **Outputs:** `{ success: true, data: Scene[] }`
- **Orphan:** false

## scenes-C006: Create Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/index.post.ts:default`
- **Game Concept:** Scene creation
- **Description:** POST /api/scenes — creates a new scene. Requires name. Optional: description, locationName, locationImage, weather, terrains, modifiers, habitatId. Returns created scene with empty pokemon/characters/groups arrays.
- **Inputs:** `{ name: string, description?, locationName?, locationImage?, weather?, terrains?, modifiers?, habitatId? }`
- **Outputs:** `{ success: true, data: Scene }`
- **Orphan:** false

## scenes-C007: Get Active Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/active.get.ts:default`
- **Game Concept:** Scene serving — get currently active scene
- **Description:** GET /api/scenes/active — returns the first scene with isActive=true, or null if none active. Used by Group View to display the current scene.
- **Inputs:** None
- **Outputs:** `{ success: true, data: Scene | null }`
- **Orphan:** false

## scenes-C008: Get Scene By ID API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id].get.ts:default`
- **Game Concept:** Scene detail retrieval
- **Description:** GET /api/scenes/:id — returns a single scene by ID with all parsed JSON fields. Returns 404 if not found.
- **Inputs:** Route param: id
- **Outputs:** `{ success: true, data: Scene }`
- **Orphan:** false

## scenes-C009: Update Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id].put.ts:default`
- **Game Concept:** Scene editing
- **Description:** PUT /api/scenes/:id — partial update of scene fields. Supports name, description, locationName, locationImage, pokemon, characters, groups, weather, terrains, modifiers, habitatId. Broadcasts scene_update via WebSocket if scene is active.
- **Inputs:** Route param: id; Body: partial Scene fields
- **Outputs:** `{ success: true, data: Scene }`
- **Orphan:** false

## scenes-C010: Delete Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id].delete.ts:default`
- **Game Concept:** Scene deletion
- **Description:** DELETE /api/scenes/:id — deletes a scene. If the scene was active, clears GroupViewState.activeSceneId. Returns 404 if not found.
- **Inputs:** Route param: id
- **Outputs:** `{ success: true, message: 'Scene deleted successfully' }`
- **Orphan:** false

## scenes-C011: Activate Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id]/activate.post.ts:default`
- **Game Concept:** Scene serving — activate a scene for Group View display
- **Description:** POST /api/scenes/:id/activate — deactivates all other scenes, activates this one, updates GroupViewState singleton. Broadcasts scene_activated to group clients.
- **Inputs:** Route param: id
- **Outputs:** `{ success: true, data: Scene }`
- **Orphan:** false

## scenes-C012: Deactivate Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id]/deactivate.post.ts:default`
- **Game Concept:** Scene serving — deactivate a scene
- **Description:** POST /api/scenes/:id/deactivate — sets isActive=false, clears GroupViewState.activeSceneId. Broadcasts scene_deactivated to group clients.
- **Inputs:** Route param: id
- **Outputs:** `{ success: true, message: 'Scene deactivated successfully' }`
- **Orphan:** false

## scenes-C013: Add Character To Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id]/characters.post.ts:default`
- **Game Concept:** Scene character management
- **Description:** POST /api/scenes/:id/characters — adds a character to the scene's characters JSON array. Generates UUID for the scene-local entry. Prevents duplicate characterId. Default position {x:50, y:50}. Broadcasts scene_character_added if active.
- **Inputs:** Route param: id; Body: `{ characterId, name, avatarUrl?, position?, groupId? }`
- **Outputs:** `{ success: true, data: SceneCharacter }`
- **Orphan:** false

## scenes-C014: Remove Character From Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id]/characters/[charId].delete.ts:default`
- **Game Concept:** Scene character management
- **Description:** DELETE /api/scenes/:id/characters/:charId — removes a character from the scene's characters JSON array by scene-local ID. Broadcasts scene_character_removed if active.
- **Inputs:** Route params: id, charId
- **Outputs:** `{ success: true, message: 'Character removed from scene' }`
- **Orphan:** false

## scenes-C015: Add Pokemon To Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id]/pokemon.post.ts:default`
- **Game Concept:** Scene Pokemon management — add wild Pokemon
- **Description:** POST /api/scenes/:id/pokemon — adds a Pokemon entry to the scene's pokemon JSON array. Generates UUID. Requires species. Default position {x:50, y:50}. Broadcasts scene_pokemon_added if active.
- **Inputs:** Route param: id; Body: `{ species, speciesId?, level?, nickname?, position?, groupId? }`
- **Outputs:** `{ success: true, data: ScenePokemon }`
- **Orphan:** false

## scenes-C016: Remove Pokemon From Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id]/pokemon/[pokemonId].delete.ts:default`
- **Game Concept:** Scene Pokemon management
- **Description:** DELETE /api/scenes/:id/pokemon/:pokemonId — removes a Pokemon from the scene's pokemon JSON array by scene-local ID. Broadcasts scene_pokemon_removed if active.
- **Inputs:** Route params: id, pokemonId
- **Outputs:** `{ success: true, message: 'Pokemon removed from scene' }`
- **Orphan:** false

## scenes-C017: Create Group In Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id]/groups.post.ts:default`
- **Game Concept:** Scene group management — visual grouping containers
- **Description:** POST /api/scenes/:id/groups — creates a group in the scene's groups JSON array. Generates UUID. Auto-offsets position to prevent stacking. Default size 150x100. Broadcasts scene_group_created if active.
- **Inputs:** Route param: id; Body: `{ name?, position?, width?, height? }`
- **Outputs:** `{ success: true, data: SceneGroup }`
- **Orphan:** false

## scenes-C018: Update Group In Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id]/groups/[groupId].put.ts:default`
- **Game Concept:** Scene group management — rename, move, resize
- **Description:** PUT /api/scenes/:id/groups/:groupId — partial update of a group (name, position, width, height). Broadcasts scene_group_updated if active.
- **Inputs:** Route params: id, groupId; Body: `{ name?, position?, width?, height? }`
- **Outputs:** `{ success: true, data: SceneGroup }`
- **Orphan:** false

## scenes-C019: Delete Group From Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id]/groups/[groupId].delete.ts:default`
- **Game Concept:** Scene group management
- **Description:** DELETE /api/scenes/:id/groups/:groupId — removes a group. Also clears groupId from all pokemon and characters that belonged to it. Broadcasts scene_group_deleted if active.
- **Inputs:** Route params: id, groupId
- **Outputs:** `{ success: true, message: 'Group deleted from scene' }`
- **Orphan:** false

## scenes-C020: Batch Update Positions API

- **Type:** api-endpoint
- **Location:** `app/server/api/scenes/[id]/positions.put.ts:default`
- **Game Concept:** Scene layout — drag-and-drop position persistence
- **Description:** PUT /api/scenes/:id/positions — batch updates positions (and optionally groupId) for pokemon, characters, and groups. Lightweight alternative to full scene PUT. Broadcasts scene_positions_updated if active.
- **Inputs:** Route param: id; Body: `{ pokemon?: [{id, position, groupId?}], characters?: [{id, position, groupId?}], groups?: [{id, position, width?, height?}] }`
- **Outputs:** `{ success: true, message: 'Positions updated successfully' }`
- **Orphan:** false

## scenes-C021: Store — Fetch Tab State

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:fetchTabState`
- **Game Concept:** Group View tab routing
- **Description:** Fetches current tab state (activeTab, activeSceneId) from GET /api/group/tab. Updates store state.
- **Inputs:** None
- **Outputs:** Updates store.activeTab, store.activeSceneId
- **Orphan:** false

## scenes-C022: Store — Set Active Tab

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:setActiveTab`
- **Game Concept:** Group View tab routing
- **Description:** Sets the active tab via PUT /api/group/tab. Used when activating a scene to switch Group View to 'scene' tab.
- **Inputs:** tab: GroupViewTab, sceneId?: string | null
- **Outputs:** Updates store.activeTab, store.activeSceneId; broadcasts tab_change via WebSocket
- **Orphan:** false

## scenes-C023: Store — Handle Tab Change (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleTabChange`
- **Game Concept:** Group View tab sync
- **Description:** Handles incoming WebSocket tab_change/tab_state events. Updates local store state.
- **Inputs:** `{ tab: string, sceneId?: string | null }`
- **Outputs:** Updates store.activeTab, store.activeSceneId
- **Orphan:** false

## scenes-C024: Store — Fetch Scenes

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:fetchScenes`
- **Game Concept:** Scene listing
- **Description:** Fetches all scenes from GET /api/scenes. Stores in store.scenes array. Uses cache-busting timestamp.
- **Inputs:** None
- **Outputs:** Updates store.scenes
- **Orphan:** false

## scenes-C025: Store — Fetch Active Scene

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:fetchActiveScene`
- **Game Concept:** Scene serving — get active scene for Group View
- **Description:** Fetches the currently active scene from GET /api/scenes/active. Stores as store.activeScene.
- **Inputs:** None
- **Outputs:** Updates store.activeScene
- **Orphan:** false

## scenes-C026: Store — Fetch Scene By ID

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:fetchScene`
- **Game Concept:** Scene detail loading
- **Description:** Fetches a single scene by ID from GET /api/scenes/:id. Returns the scene data.
- **Inputs:** id: string
- **Outputs:** Returns Scene | null
- **Orphan:** false

## scenes-C027: Store — Create Scene

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:createScene`
- **Game Concept:** Scene creation
- **Description:** Creates a new scene via POST /api/scenes. Prepends to store.scenes array.
- **Inputs:** `{ name, description?, locationName?, locationImage?, weather?, terrains?, modifiers?, habitatId? }`
- **Outputs:** Updates store.scenes; returns Scene
- **Orphan:** false

## scenes-C028: Store — Update Scene

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:updateScene`
- **Game Concept:** Scene editing
- **Description:** Updates a scene via PUT /api/scenes/:id. Immutably updates store.scenes array and store.activeScene if matched.
- **Inputs:** id: string, data: Partial<Scene>
- **Outputs:** Updates store.scenes, store.activeScene
- **Orphan:** false

## scenes-C029: Store — Delete Scene

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:deleteScene`
- **Game Concept:** Scene deletion
- **Description:** Deletes a scene via DELETE /api/scenes/:id. Removes from store.scenes, clears store.activeScene/activeSceneId if matched.
- **Inputs:** id: string
- **Outputs:** Updates store.scenes, store.activeScene, store.activeSceneId
- **Orphan:** false

## scenes-C030: Store — Activate Scene

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:activateScene`
- **Game Concept:** Scene serving
- **Description:** Activates a scene via POST /api/scenes/:id/activate. Updates all scenes' isActive flags, sets store.activeScene and activeSceneId. Posts BroadcastChannel message for cross-tab sync.
- **Inputs:** id: string
- **Outputs:** Updates store.scenes, store.activeScene, store.activeSceneId; BroadcastChannel 'scene_activated'
- **Orphan:** false

## scenes-C031: Store — Deactivate Scene

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:deactivateScene`
- **Game Concept:** Scene serving
- **Description:** Deactivates a scene via POST /api/scenes/:id/deactivate. Clears isActive flag, resets activeScene/activeSceneId. Posts BroadcastChannel message.
- **Inputs:** id: string
- **Outputs:** Updates store.scenes, store.activeScene, store.activeSceneId; BroadcastChannel 'scene_deactivated'
- **Orphan:** false

## scenes-C032: Store — Handle Scene Update (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleSceneUpdate`
- **Game Concept:** Real-time scene sync
- **Description:** Handles scene_update WebSocket event. Updates activeScene and scenes array with new scene data.
- **Inputs:** `{ sceneId: string, scene: Scene }`
- **Outputs:** Updates store.activeScene, store.scenes
- **Orphan:** false

## scenes-C033: Store — Handle Scene Activated (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleSceneActivated`
- **Game Concept:** Real-time scene activation sync
- **Description:** Handles scene_activated WebSocket event. Sets active scene and updates all scenes' isActive flags.
- **Inputs:** `{ scene: Scene }`
- **Outputs:** Updates store.activeScene, store.activeSceneId, store.scenes
- **Orphan:** false

## scenes-C034: Store — Handle Scene Deactivated (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleSceneDeactivated`
- **Game Concept:** Real-time scene deactivation sync
- **Description:** Handles scene_deactivated WebSocket event. Clears active scene if matched, updates isActive flags.
- **Inputs:** `{ sceneId: string }`
- **Outputs:** Updates store.activeScene, store.activeSceneId, store.scenes
- **Orphan:** false

## scenes-C035: Store — Update Positions

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:updatePositions`
- **Game Concept:** Scene layout — position persistence
- **Description:** Sends position updates via PUT /api/scenes/:id/positions. Lightweight batch endpoint for drag-and-drop.
- **Inputs:** sceneId: string, positions: `{ pokemon?, characters?, groups? }`
- **Outputs:** Triggers API call; no local state update (caller handles optimistic update)
- **Orphan:** false

## scenes-C036: Store — Handle Scene Positions Updated (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleScenePositionsUpdated`
- **Game Concept:** Real-time position sync
- **Description:** Handles scene_positions_updated WebSocket event. Selectively merges position updates into activeScene's pokemon, characters, and groups.
- **Inputs:** `{ pokemon?, characters?, groups? }` (each with id and position)
- **Outputs:** Updates store.activeScene positions
- **Orphan:** false

## scenes-C037: Store — Handle Scene Character Added (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleSceneCharacterAdded`
- **Game Concept:** Real-time scene entity sync
- **Description:** Handles scene_character_added WebSocket event. Appends character to activeScene.characters if scene matches.
- **Inputs:** `{ sceneId: string, character: SceneCharacter }`
- **Outputs:** Updates store.activeScene.characters
- **Orphan:** false

## scenes-C038: Store — Handle Scene Character Removed (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleSceneCharacterRemoved`
- **Game Concept:** Real-time scene entity sync
- **Description:** Handles scene_character_removed WebSocket event. Removes character from activeScene.characters.
- **Inputs:** `{ sceneId: string, characterId: string }`
- **Outputs:** Updates store.activeScene.characters
- **Orphan:** false

## scenes-C039: Store — Handle Scene Pokemon Added (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleScenePokemonAdded`
- **Game Concept:** Real-time scene entity sync
- **Description:** Handles scene_pokemon_added WebSocket event. Appends pokemon to activeScene.pokemon.
- **Inputs:** `{ sceneId: string, pokemon: ScenePokemon }`
- **Outputs:** Updates store.activeScene.pokemon
- **Orphan:** false

## scenes-C040: Store — Handle Scene Pokemon Removed (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleScenePokemonRemoved`
- **Game Concept:** Real-time scene entity sync
- **Description:** Handles scene_pokemon_removed WebSocket event. Removes pokemon from activeScene.pokemon.
- **Inputs:** `{ sceneId: string, pokemonId: string }`
- **Outputs:** Updates store.activeScene.pokemon
- **Orphan:** false

## scenes-C041: Store — Handle Scene Group Created (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleSceneGroupCreated`
- **Game Concept:** Real-time scene entity sync
- **Description:** Handles scene_group_created WebSocket event. Appends group to activeScene.groups.
- **Inputs:** `{ sceneId: string, group: SceneGroup }`
- **Outputs:** Updates store.activeScene.groups
- **Orphan:** false

## scenes-C042: Store — Handle Scene Group Updated (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleSceneGroupUpdated`
- **Game Concept:** Real-time scene entity sync
- **Description:** Handles scene_group_updated WebSocket event. Replaces matching group in activeScene.groups.
- **Inputs:** `{ sceneId: string, group: SceneGroup }`
- **Outputs:** Updates store.activeScene.groups
- **Orphan:** false

## scenes-C043: Store — Handle Scene Group Deleted (WS)

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:handleSceneGroupDeleted`
- **Game Concept:** Real-time scene entity sync
- **Description:** Handles scene_group_deleted WebSocket event. Removes group from activeScene.groups.
- **Inputs:** `{ sceneId: string, groupId: string }`
- **Outputs:** Updates store.activeScene.groups
- **Orphan:** false

## scenes-C044: Store — Setup Cross-Tab Sync

- **Type:** store-action
- **Location:** `app/stores/groupViewTabs.ts:setupCrossTabSync`
- **Game Concept:** Multi-tab synchronization
- **Description:** Creates a BroadcastChannel ('ptu-scene-sync') for cross-tab communication within the same browser. Handles scene_activated and scene_deactivated messages to keep multiple GM tabs in sync.
- **Inputs:** None
- **Outputs:** Registers BroadcastChannel listener
- **Orphan:** false

## scenes-C045: Store Getter — isSceneTab

- **Type:** store-getter
- **Location:** `app/stores/groupViewTabs.ts:isSceneTab`
- **Game Concept:** Tab routing
- **Description:** Returns true if activeTab === 'scene'.
- **Inputs:** None
- **Outputs:** boolean
- **Orphan:** false

## scenes-C046: Store Getter — isLobbyTab

- **Type:** store-getter
- **Location:** `app/stores/groupViewTabs.ts:isLobbyTab`
- **Game Concept:** Tab routing
- **Description:** Returns true if activeTab === 'lobby'.
- **Inputs:** None
- **Outputs:** boolean
- **Orphan:** false

## scenes-C047: Store Getter — hasActiveScene

- **Type:** store-getter
- **Location:** `app/stores/groupViewTabs.ts:hasActiveScene`
- **Game Concept:** Scene availability check
- **Description:** Returns true if activeScene !== null.
- **Inputs:** None
- **Outputs:** boolean
- **Orphan:** false

## scenes-C048: Store Getter — isEncounterTab

- **Type:** store-getter
- **Location:** `app/stores/groupViewTabs.ts:isEncounterTab`
- **Game Concept:** Tab routing (cross-domain reference)
- **Description:** Returns true if activeTab === 'encounter'. Used by encounter domain, included for completeness.
- **Inputs:** None
- **Outputs:** boolean
- **Orphan:** false

## scenes-C049: Store Getter — isMapTab

- **Type:** store-getter
- **Location:** `app/stores/groupViewTabs.ts:isMapTab`
- **Game Concept:** Tab routing (cross-domain reference)
- **Description:** Returns true if activeTab === 'map'. Used by map domain, included for completeness.
- **Inputs:** None
- **Outputs:** boolean
- **Orphan:** false

## scenes-C050: WebSocket — scene_update

- **Type:** websocket-event
- **Location:** `app/server/utils/websocket.ts:notifySceneUpdate`
- **Game Concept:** Real-time scene sync — full scene update
- **Description:** Broadcasts full scene data to group clients when scene is updated via PUT. Event: scene_update, payload: { sceneId, scene }.
- **Inputs:** sceneId: string, scene: parsed Scene object
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C051: WebSocket — scene_activated

- **Type:** websocket-event
- **Location:** `app/server/api/scenes/[id]/activate.post.ts` via `broadcastToGroup`
- **Game Concept:** Real-time scene activation notification
- **Description:** Broadcasts scene activation to group clients. Event: scene_activated, payload: { scene }. Triggers Group View to display the scene.
- **Inputs:** scene: parsed Scene object
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C052: WebSocket — scene_deactivated

- **Type:** websocket-event
- **Location:** `app/server/api/scenes/[id]/deactivate.post.ts` via `broadcastToGroup`
- **Game Concept:** Real-time scene deactivation notification
- **Description:** Broadcasts scene deactivation to group clients. Event: scene_deactivated, payload: { sceneId }. Triggers Group View to clear scene display.
- **Inputs:** sceneId: string
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C053: WebSocket — scene_character_added

- **Type:** websocket-event
- **Location:** `app/server/utils/websocket.ts:notifySceneCharacterAdded`
- **Game Concept:** Real-time scene entity sync
- **Description:** Broadcasts when a character is added to an active scene. Event: scene_character_added, payload: { sceneId, character }.
- **Inputs:** sceneId: string, character: SceneCharacter
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C054: WebSocket — scene_character_removed

- **Type:** websocket-event
- **Location:** `app/server/utils/websocket.ts:notifySceneCharacterRemoved`
- **Game Concept:** Real-time scene entity sync
- **Description:** Broadcasts when a character is removed from an active scene. Event: scene_character_removed, payload: { sceneId, characterId }.
- **Inputs:** sceneId: string, characterId: string
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C055: WebSocket — scene_pokemon_added

- **Type:** websocket-event
- **Location:** `app/server/utils/websocket.ts:notifyScenePokemonAdded`
- **Game Concept:** Real-time scene entity sync
- **Description:** Broadcasts when a Pokemon is added to an active scene. Event: scene_pokemon_added, payload: { sceneId, pokemon }.
- **Inputs:** sceneId: string, pokemon: ScenePokemon
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C056: WebSocket — scene_pokemon_removed

- **Type:** websocket-event
- **Location:** `app/server/utils/websocket.ts:notifyScenePokemonRemoved`
- **Game Concept:** Real-time scene entity sync
- **Description:** Broadcasts when a Pokemon is removed from an active scene. Event: scene_pokemon_removed, payload: { sceneId, pokemonId }.
- **Inputs:** sceneId: string, pokemonId: string
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C057: WebSocket — scene_group_created

- **Type:** websocket-event
- **Location:** `app/server/utils/websocket.ts:notifySceneGroupCreated`
- **Game Concept:** Real-time scene entity sync
- **Description:** Broadcasts when a group is created in an active scene. Event: scene_group_created, payload: { sceneId, group }.
- **Inputs:** sceneId: string, group: SceneGroup
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C058: WebSocket — scene_group_updated

- **Type:** websocket-event
- **Location:** `app/server/utils/websocket.ts:notifySceneGroupUpdated`
- **Game Concept:** Real-time scene entity sync
- **Description:** Broadcasts when a group is updated in an active scene. Event: scene_group_updated, payload: { sceneId, group }.
- **Inputs:** sceneId: string, group: SceneGroup
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C059: WebSocket — scene_group_deleted

- **Type:** websocket-event
- **Location:** `app/server/utils/websocket.ts:notifySceneGroupDeleted`
- **Game Concept:** Real-time scene entity sync
- **Description:** Broadcasts when a group is deleted from an active scene. Event: scene_group_deleted, payload: { sceneId, groupId }.
- **Inputs:** sceneId: string, groupId: string
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C060: WebSocket — scene_positions_updated

- **Type:** websocket-event
- **Location:** `app/server/utils/websocket.ts:notifyScenePositionsUpdated`
- **Game Concept:** Real-time scene layout sync
- **Description:** Broadcasts position updates to group clients. Event: scene_positions_updated, payload: { sceneId, positions: { pokemon?, characters?, groups? } }.
- **Inputs:** sceneId: string, positions: object
- **Outputs:** WebSocket broadcast to group clients
- **Orphan:** false

## scenes-C061: Composable — useGroupViewWebSocket (Scene Events)

- **Type:** composable-function
- **Location:** `app/composables/useGroupViewWebSocket.ts:useGroupViewWebSocket`
- **Game Concept:** Group View WebSocket event routing for scenes
- **Description:** Registers WebSocket message listener on the Group View. Routes scene_activated, scene_deactivated, scene_update, scene_positions_updated, scene_character_added/removed, scene_pokemon_added/removed, scene_group_created/updated/deleted events to the appropriate store handlers. Also handles tab_change/tab_state events.
- **Inputs:** WebSocket options (send, isConnected, onMessage)
- **Outputs:** Calls store handlers for each event type
- **Orphan:** false

## scenes-C062: Composable — usePokemonSprite (Scene Usage)

- **Type:** composable-function
- **Location:** `app/composables/usePokemonSprite.ts:usePokemonSprite`
- **Game Concept:** Pokemon sprite rendering in scenes
- **Description:** Provides getSpriteUrl() for rendering Pokemon sprites in scene canvas and Group View. Used by SceneCanvas, SceneHabitatPanel, ScenePokemonList, and SceneView. Shared with other domains (encounter, character sheets).
- **Inputs:** species: string, shiny?: boolean
- **Outputs:** URL string for Pokemon sprite image
- **Orphan:** false

## scenes-C063: Scene Manager Page (GM)

- **Type:** component
- **Location:** `app/pages/gm/scenes/index.vue`
- **Game Concept:** Scene listing and management UI
- **Description:** GM page for listing all scenes in a grid layout with thumbnail, name, location, entity counts, weather. Supports create, activate/deactivate, navigate to editor, delete (with confirmation modal). Uses groupViewTabsStore for all operations. Calls setupCrossTabSync on mount.
- **Inputs:** User interactions (create, activate, deactivate, delete, navigate)
- **Outputs:** UI rendering; store action calls
- **Orphan:** false

## scenes-C064: Scene Editor Page (GM)

- **Type:** component
- **Location:** `app/pages/gm/scenes/[id].vue`
- **Game Concept:** Scene editing — full editor with canvas, panels, and entity management
- **Description:** Full scene editor with header (name editing, activate/deactivate, start encounter), 5-panel layout: SceneGroupsPanel (left), SceneCanvas (center), ScenePropertiesPanel, SceneAddPanel, SceneHabitatPanel (right, collapsible). Handles position updates with group member movement, encounter generation from habitat, and scene-to-encounter conversion. Fetches characters, Pokemon, and encounter tables on mount.
- **Inputs:** Route param: id; user interactions (drag, edit, add/remove entities)
- **Outputs:** UI rendering; API calls for all scene mutations
- **Orphan:** false

## scenes-C065: Scene Canvas Component

- **Type:** component
- **Location:** `app/components/scene/SceneCanvas.vue`
- **Game Concept:** Scene visual layout — drag-and-drop canvas
- **Description:** Renders scene entities (Pokemon sprites, character avatars, groups) on a canvas with background image. Supports drag-and-drop for sprites and groups (with member sprite co-movement), group resize via corner handles, group drop-target highlighting for entity assignment. Uses percentage-based positioning. Emits position updates, group selection/deletion, entity removal.
- **Inputs:** scene: Scene, selectedGroupId: string | null
- **Outputs:** Emits update:positions, resize-group, select-group, delete-group, remove-pokemon, remove-character
- **Orphan:** false

## scenes-C066: Scene Add Panel Component

- **Type:** component
- **Location:** `app/components/scene/SceneAddPanel.vue`
- **Game Concept:** Scene entity addition — character and Pokemon picker
- **Description:** Collapsible right panel with tabs for Characters and Pokemon. Characters tab shows available characters (not already in scene) with click-to-add. Pokemon tab shows ScenePokemonList (trainer's Pokemon) and a manual wild Pokemon form (species + level). Collapsible with icon strip.
- **Inputs:** availableCharacters, charactersWithPokemon, collapsed
- **Outputs:** Emits add-character, add-pokemon, toggle-collapse
- **Orphan:** false

## scenes-C067: Scene Properties Panel Component

- **Type:** component
- **Location:** `app/components/scene/ScenePropertiesPanel.vue`
- **Game Concept:** Scene metadata editing — location, weather, description
- **Description:** Collapsible right panel for editing scene properties: locationName (text input), locationImage (URL input), description (textarea), weather (select with 9 PTU weather options + none). Emits field-level updates.
- **Inputs:** scene: Scene, collapsed
- **Outputs:** Emits update:scene (field, value), toggle-collapse
- **Orphan:** false

## scenes-C068: Scene Groups Panel Component

- **Type:** component
- **Location:** `app/components/scene/SceneGroupsPanel.vue`
- **Game Concept:** Scene group management — list and rename groups
- **Description:** Collapsible left panel showing all groups with inline rename, member count, and click-to-select. Has create group button. Shows group count badge when collapsed.
- **Inputs:** scene: Scene, selectedGroupId, collapsed
- **Outputs:** Emits create-group, delete-group, select-group, rename-group, toggle-collapse
- **Orphan:** false

## scenes-C069: Scene Habitat Panel Component

- **Type:** component
- **Location:** `app/components/scene/SceneHabitatPanel.vue`
- **Game Concept:** Scene habitat link — encounter table integration
- **Description:** Collapsible right panel for linking a scene to an encounter table (habitat). Shows habitat selector dropdown, level range, density, and entry list with sprites. Supports adding individual species to scene and generating random encounters from the table. Calculates rarity labels from weights.
- **Inputs:** encounterTables, sceneHabitatId, collapsed, generating
- **Outputs:** Emits select-habitat, add-pokemon, generate-encounter, toggle-collapse
- **Orphan:** false

## scenes-C070: Scene Pokemon List Component

- **Type:** component
- **Location:** `app/components/scene/ScenePokemonList.vue`
- **Game Concept:** Trainer Pokemon picker for scenes
- **Description:** Expandable list of characters with their owned Pokemon. Each character is collapsible; clicking a Pokemon's add button emits species and level. Shows sprite, species, nickname, and level.
- **Inputs:** charactersWithPokemon
- **Outputs:** Emits add-pokemon (species, level)
- **Orphan:** false

## scenes-C071: Start Encounter Modal Component

- **Type:** component
- **Location:** `app/components/scene/StartEncounterModal.vue`
- **Game Concept:** Scene-to-encounter conversion
- **Description:** Modal dialog for starting an encounter from a scene. Shows entity counts (Pokemon as enemies, characters as players). Offers battle type selection: Full Contact or Trainer (League). Disabled if no entities in scene.
- **Inputs:** sceneName, pokemonCount, characterCount
- **Outputs:** Emits confirm({ battleType }), close
- **Orphan:** false

## scenes-C072: Scene View Component (Group View)

- **Type:** component
- **Location:** `app/pages/group/_components/SceneView.vue`
- **Game Concept:** Scene display on Group View (TV/projector)
- **Description:** Read-only display of the active scene on the Group View. Shows background image, location header with description, positioned Pokemon sprites and character avatars, groups with labels and member counts. Weather effects via CSS (background gradients, animated overlays for rain, snow, hail, sandstorm, fog, wind, sunlight). Falls back to "No Active Scene" waiting card.
- **Inputs:** Reads from groupViewTabsStore.activeScene (synced via WebSocket)
- **Outputs:** Visual rendering only (no mutations)
- **Orphan:** false

## scenes-C073: Get Tab State API

- **Type:** api-endpoint
- **Location:** `app/server/api/group/tab.get.ts:default`
- **Game Concept:** Group View tab state persistence
- **Description:** GET /api/group/tab — returns the GroupViewState singleton (activeTab, activeSceneId). Creates the singleton if it doesn't exist.
- **Inputs:** None
- **Outputs:** `{ success: true, data: { activeTab, activeSceneId } }`
- **Orphan:** false

## scenes-C074: Set Tab State API

- **Type:** api-endpoint
- **Location:** `app/server/api/group/tab.put.ts:default`
- **Game Concept:** Group View tab state management
- **Description:** PUT /api/group/tab — upserts the GroupViewState singleton. Validates tab is one of lobby|scene|encounter|map. Broadcasts tab_change to group clients via WebSocket.
- **Inputs:** `{ activeTab: string, activeSceneId?: string }`
- **Outputs:** `{ success: true, data: { activeTab, activeSceneId } }`
- **Orphan:** false

## scenes-C075: Create Encounter From Scene API

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/from-scene.post.ts:default`
- **Game Concept:** Scene-to-encounter conversion
- **Description:** POST /api/encounters/from-scene — creates a new encounter from a scene. Scene Pokemon become wild enemy combatants (creates full DB Pokemon records via generateAndCreatePokemon). Scene characters become player combatants referencing existing HumanCharacter records. Enables grid with auto-placement. Inherits scene weather.
- **Inputs:** `{ sceneId, battleType? }`
- **Outputs:** `{ success: true, data: Encounter }`
- **Orphan:** false

## scenes-C076: Store — Create From Scene (Encounter Store)

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:createFromScene`
- **Game Concept:** Scene-to-encounter conversion (client)
- **Description:** Client-side action that calls POST /api/encounters/from-scene. Stores the created encounter. Used by the scene editor's Start Encounter button.
- **Inputs:** sceneId: string, battleType: 'trainer' | 'full_contact'
- **Outputs:** Updates encounter store; returns Encounter
- **Orphan:** false

---

## Capability Chains

### Chain 1: Scene CRUD Lifecycle
1. `scenes-C063` (component — Scene Manager Page) → 2. `scenes-C027` (store — createScene) → 3. `scenes-C006` (api — POST /api/scenes) → 4. `scenes-C001` (prisma — Scene)
**Breaks at:** complete

### Chain 2: Scene Editing
1. `scenes-C064` (component — Scene Editor Page) → 2. `scenes-C028` (store — updateScene) → 3. `scenes-C009` (api — PUT /api/scenes/:id) → 4. `scenes-C001` (prisma — Scene) → 5. `scenes-C050` (ws — scene_update)
**Breaks at:** complete

### Chain 3: Scene Deletion
1. `scenes-C063` (component — Scene Manager Page) → 2. `scenes-C029` (store — deleteScene) → 3. `scenes-C010` (api — DELETE /api/scenes/:id) → 4. `scenes-C001` (prisma — Scene)
**Breaks at:** complete

### Chain 4: Scene Activation (GM → Group View)
1. `scenes-C063`/`scenes-C064` (component) → 2. `scenes-C030` (store — activateScene) → 3. `scenes-C011` (api — activate) → 4. `scenes-C002` (prisma — GroupViewState) → 5. `scenes-C051` (ws — scene_activated) → 6. `scenes-C061` (composable — useGroupViewWebSocket) → 7. `scenes-C033` (store — handleSceneActivated) → 8. `scenes-C072` (component — SceneView)
**Breaks at:** complete

### Chain 5: Scene Deactivation (GM → Group View)
1. `scenes-C063`/`scenes-C064` (component) → 2. `scenes-C031` (store — deactivateScene) → 3. `scenes-C012` (api — deactivate) → 4. `scenes-C002` (prisma — GroupViewState) → 5. `scenes-C052` (ws — scene_deactivated) → 6. `scenes-C061` (composable) → 7. `scenes-C034` (store — handleSceneDeactivated) → 8. `scenes-C072` (component — SceneView)
**Breaks at:** complete

### Chain 6: Add Character to Scene (GM → Group View)
1. `scenes-C064` (component — Scene Editor) → 2. `scenes-C013` (api — POST characters) → 3. `scenes-C053` (ws — scene_character_added) → 4. `scenes-C061` (composable) → 5. `scenes-C037` (store — handleSceneCharacterAdded) → 6. `scenes-C072` (SceneView)
**Breaks at:** complete

### Chain 7: Remove Character from Scene (GM → Group View)
1. `scenes-C064`/`scenes-C065` (component) → 2. `scenes-C014` (api — DELETE characters) → 3. `scenes-C054` (ws — scene_character_removed) → 4. `scenes-C061` (composable) → 5. `scenes-C038` (store — handleSceneCharacterRemoved) → 6. `scenes-C072` (SceneView)
**Breaks at:** complete

### Chain 8: Add Pokemon to Scene (GM → Group View)
1. `scenes-C064` (component — Scene Editor) → 2. `scenes-C015` (api — POST pokemon) → 3. `scenes-C055` (ws — scene_pokemon_added) → 4. `scenes-C061` (composable) → 5. `scenes-C039` (store — handleScenePokemonAdded) → 6. `scenes-C072` (SceneView)
**Breaks at:** complete

### Chain 9: Remove Pokemon from Scene (GM → Group View)
1. `scenes-C064`/`scenes-C065` (component) → 2. `scenes-C016` (api — DELETE pokemon) → 3. `scenes-C056` (ws — scene_pokemon_removed) → 4. `scenes-C061` (composable) → 5. `scenes-C040` (store — handleScenePokemonRemoved) → 6. `scenes-C072` (SceneView)
**Breaks at:** complete

### Chain 10: Group CRUD in Scene (GM → Group View)
1. `scenes-C064`/`scenes-C068` (component — Groups Panel) → 2. `scenes-C017`/`scenes-C018`/`scenes-C019` (api — groups CRUD) → 3. `scenes-C057`/`scenes-C058`/`scenes-C059` (ws — group events) → 4. `scenes-C061` (composable) → 5. `scenes-C041`/`scenes-C042`/`scenes-C043` (store handlers) → 6. `scenes-C072` (SceneView)
**Breaks at:** complete

### Chain 11: Drag-and-Drop Position Updates (GM → Group View)
1. `scenes-C065` (component — SceneCanvas drag) → 2. `scenes-C064` (page — handlePositionUpdate) → 3. `scenes-C035` (store — updatePositions) → 4. `scenes-C020` (api — PUT positions) → 5. `scenes-C060` (ws — scene_positions_updated) → 6. `scenes-C061` (composable) → 7. `scenes-C036` (store — handleScenePositionsUpdated) → 8. `scenes-C072` (SceneView)
**Breaks at:** complete

### Chain 12: Scene-to-Encounter Conversion
1. `scenes-C064` (component — Scene Editor) → 2. `scenes-C071` (component — StartEncounterModal) → 3. `scenes-C076` (store — createFromScene) → 4. `scenes-C075` (api — POST /api/encounters/from-scene) → 5. `scenes-C001` (prisma — Scene read) → 6. Pokemon generation service → 7. Encounter Prisma model (cross-domain)
**Breaks at:** complete

### Chain 13: Habitat-Linked Pokemon Generation
1. `scenes-C069` (component — SceneHabitatPanel) → 2. `scenes-C064` (page — handleGenerateEncounter) → 3. Encounter Table API (cross-domain: POST /api/encounter-tables/:id/generate) → 4. `scenes-C015` (api — POST pokemon to scene) → 5. `scenes-C055` (ws — scene_pokemon_added) → 6. `scenes-C072` (SceneView)
**Breaks at:** complete

### Chain 14: Tab Routing (Scene Tab Activation)
1. `scenes-C063`/`scenes-C064` (GM page — activate button) → 2. `scenes-C022` (store — setActiveTab) → 3. `scenes-C074` (api — PUT /api/group/tab) → 4. `scenes-C002` (prisma — GroupViewState) → 5. WebSocket tab_change → 6. `scenes-C061` (composable) → 7. `scenes-C023` (store — handleTabChange) → 8. Group View index.vue → 9. `scenes-C072` (SceneView)
**Breaks at:** complete

### Chain 15: Cross-Tab Sync (BroadcastChannel)
1. `scenes-C030`/`scenes-C031` (store — activate/deactivate posts to BroadcastChannel) → 2. `scenes-C044` (store — setupCrossTabSync listener) → 3. `scenes-C025` (store — fetchActiveScene)
**Breaks at:** complete
