---
domain: scenes
mapped_at: 2026-02-28T03:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 55
files_read: 26
---

# App Capabilities: Scenes

> Re-mapped capability catalog for the scenes domain.
> Minimal changes since session 41 -- mostly downstream of encounter-tables significance work.
> Scene system provides narrative contexts linking characters, Pokemon, and groups to locations
> with weather, terrain data, and habitat references. Supports activation/deactivation with
> AP restoration, WebSocket sync, BroadcastChannel cross-tab sync, and position updates.

## Prisma Model

### scenes-C001
- **name:** Scene Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model Scene
- **game_concept:** Narrative scene context for RPG sessions
- **description:** Stores scene name, description, location (name + image), weather, terrain data (JSON), modifiers (JSON), habitat link, active flag, and timestamps. Characters/Pokemon/Groups stored as JSON arrays (not relational). isActive flag: only one scene active at a time.
- **inputs:** name, description, locationName, locationImage, weather, terrains (JSON string), modifiers (JSON string), habitatId, pokemon (JSON), characters (JSON), groups (JSON), isActive
- **outputs:** Persisted scene record
- **accessible_from:** gm, group (active scene only)

### scenes-C002
- **name:** GroupViewState Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model GroupViewState
- **game_concept:** Singleton tracking active tab and scene for group view
- **description:** Singleton record (id='singleton') storing activeTab and activeSceneId. Used by group view to know which tab to display.
- **inputs:** activeTab, activeSceneId
- **outputs:** Persisted tab state
- **accessible_from:** gm, group

## API Endpoints

### scenes-C010
- **name:** List Scenes API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/index.get.ts`
- **game_concept:** Browse all scenes
- **description:** Returns all scenes with parsed JSON fields (pokemon, characters, groups, terrains, modifiers).
- **inputs:** None
- **outputs:** `{ success, data: Scene[] }`
- **accessible_from:** gm

### scenes-C011
- **name:** Create Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/index.post.ts`
- **game_concept:** Create narrative scene
- **description:** Creates a new scene with name, description, locationName, locationImage, weather, terrains, modifiers, and habitatId. Initializes pokemon/characters/groups as empty arrays.
- **inputs:** Body: { name, description?, locationName?, locationImage?, weather?, terrains?, modifiers?, habitatId? }
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm

### scenes-C012
- **name:** Get Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].get.ts`
- **game_concept:** Single scene details
- **description:** Returns a single scene by ID with all parsed JSON fields.
- **inputs:** URL param: id
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm, group

### scenes-C013
- **name:** Update Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].put.ts`
- **game_concept:** Edit scene properties and entities
- **description:** Partial update of scene fields. Stringifies JSON fields (pokemon, characters, groups, terrains, modifiers). Broadcasts scene_update WebSocket event if scene is active.
- **inputs:** URL param: id. Body: any subset of scene fields
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm

### scenes-C014
- **name:** Delete Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].delete.ts`
- **game_concept:** Remove scene
- **description:** Deletes a scene record.
- **inputs:** URL param: id
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### scenes-C015
- **name:** Activate Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/activate.post.ts`
- **game_concept:** Set active scene for group display
- **description:** Activates a scene: restores AP for characters in any currently active scenes (PTU p.221: AP completely regained at scene end minus drained), deactivates all other scenes, sets this scene as active, updates GroupViewState singleton, broadcasts scene_activated to group+player clients.
- **inputs:** URL param: id
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm

### scenes-C016
- **name:** Deactivate Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/deactivate.post.ts`
- **game_concept:** Remove active scene
- **description:** Deactivates a scene by setting isActive=false.
- **inputs:** URL param: id
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### scenes-C017
- **name:** Get Active Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/active.get.ts`
- **game_concept:** Fetch currently active scene
- **description:** Returns the currently active scene (isActive=true), or null if none is active. Used by group view on initial load.
- **inputs:** None
- **outputs:** `{ success, data: Scene | null }`
- **accessible_from:** gm, group, player

### scenes-C018
- **name:** Add Character to Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/characters.post.ts`
- **game_concept:** Add trainer/NPC to scene
- **description:** Adds a character to the scene's characters JSON array with position, groupId, and character metadata (name, avatarUrl, characterType). Broadcasts scene_character_added WebSocket event.
- **inputs:** URL param: id. Body: { characterId, position?, groupId? }
- **outputs:** `{ success, data: SceneCharacter }`
- **accessible_from:** gm

### scenes-C019
- **name:** Remove Character from Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/characters/[charId].delete.ts`
- **game_concept:** Remove trainer/NPC from scene
- **description:** Removes a character from the scene's characters array. Broadcasts scene_character_removed WebSocket event.
- **inputs:** URL params: id, charId
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### scenes-C020
- **name:** Add Pokemon to Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/pokemon.post.ts`
- **game_concept:** Add Pokemon to scene
- **description:** Adds a Pokemon to the scene's pokemon JSON array with position, groupId, and Pokemon metadata (species, nickname, spriteUrl). Broadcasts scene_pokemon_added WebSocket event.
- **inputs:** URL param: id. Body: { pokemonId, position?, groupId? }
- **outputs:** `{ success, data: ScenePokemon }`
- **accessible_from:** gm

### scenes-C021
- **name:** Remove Pokemon from Scene API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/pokemon/[pokemonId].delete.ts`
- **game_concept:** Remove Pokemon from scene
- **description:** Removes a Pokemon from the scene's pokemon array. Broadcasts scene_pokemon_removed WebSocket event.
- **inputs:** URL params: id, pokemonId
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### scenes-C022
- **name:** Create Scene Group API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups.post.ts`
- **game_concept:** Create grouping zone on scene canvas
- **description:** Adds a named group to the scene with position, dimensions (width, height), and color. Groups are visual containers for characters/Pokemon on the scene canvas. Broadcasts scene_group_created WebSocket event.
- **inputs:** URL param: id. Body: { name, position?, width?, height?, color? }
- **outputs:** `{ success, data: SceneGroup }`
- **accessible_from:** gm

### scenes-C023
- **name:** Update Scene Group API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups/[groupId].put.ts`
- **game_concept:** Edit scene group properties
- **description:** Updates group name, position, dimensions, or color. Broadcasts scene_group_updated WebSocket event.
- **inputs:** URL params: id, groupId. Body: { name?, position?, width?, height?, color? }
- **outputs:** `{ success, data: SceneGroup }`
- **accessible_from:** gm

### scenes-C024
- **name:** Delete Scene Group API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups/[groupId].delete.ts`
- **game_concept:** Remove scene group
- **description:** Deletes a group from the scene. Broadcasts scene_group_deleted WebSocket event.
- **inputs:** URL params: id, groupId
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### scenes-C025
- **name:** Update Positions API
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/positions.put.ts`
- **game_concept:** Batch position update for scene entities
- **description:** Lightweight endpoint for updating positions of pokemon, characters, and groups within a scene. Avoids full scene PUT for simple drag operations. Broadcasts scene_positions_updated WebSocket event.
- **inputs:** URL param: id. Body: { pokemon?: [{ id, position, groupId? }], characters?: [{ id, position, groupId? }], groups?: [{ id, position }] }
- **outputs:** `{ success: true }`
- **accessible_from:** gm

## Service

### scenes-C030
- **name:** Scene AP Restoration Service
- **type:** service-function
- **location:** `app/server/services/scene.service.ts` -- restoreSceneAp
- **game_concept:** PTU AP restoration at scene end (p.221)
- **description:** Restores AP for all characters in a scene's characters JSON array. Per PTU p.221: AP is completely regained at scene end, minus drained AP. Called by scene activation (to restore AP from previously active scenes).
- **inputs:** characters: JSON string (scene characters array)
- **outputs:** Updates character AP in database
- **accessible_from:** api-only (called by activate endpoint)

## Store

### scenes-C035
- **name:** GroupViewTabs Store (Scene CRUD)
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- useGroupViewTabsStore
- **game_concept:** Client-side scene management and tab state
- **description:** Pinia store managing scenes[], activeScene, activeTab, activeSceneId. Scene CRUD: fetchScenes, fetchScene, fetchActiveScene, createScene, updateScene, deleteScene, activateScene, deactivateScene. Tab management: fetchTabState, setActiveTab, handleTabChange. Position updates: updatePositions. WebSocket handlers for all scene entity events.
- **inputs:** Various per action
- **outputs:** Reactive state with scenes, activeScene, activeTab
- **accessible_from:** gm, group

### scenes-C036
- **name:** Scene Activation/Deactivation
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- activateScene, deactivateScene
- **game_concept:** Set/clear active scene for group display
- **description:** activateScene: calls API, updates all scenes' isActive flags, sets activeScene/Id, broadcasts via BroadcastChannel. deactivateScene: calls API, clears active state, broadcasts via BroadcastChannel.
- **inputs:** sceneId: string
- **outputs:** Updates activeScene, activeSceneId state
- **accessible_from:** gm

### scenes-C037
- **name:** WebSocket Scene Event Handlers
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- handleSceneUpdate, handleSceneActivated, handleSceneDeactivated, handleScenePositionsUpdated, handleSceneCharacterAdded/Removed, handleScenePokemonAdded/Removed, handleSceneGroupCreated/Updated/Deleted
- **game_concept:** Real-time scene sync
- **description:** 11 WebSocket event handlers for scene state synchronization. Handles full scene updates, activation/deactivation events, position-only updates (selective merge), and individual entity add/remove events for characters, Pokemon, and groups. All handlers use immutable state updates.
- **inputs:** Various event payloads (sceneId, scene, character, pokemon, group, positions)
- **outputs:** Mutates activeScene, scenes state
- **accessible_from:** gm, group, player

### scenes-C038
- **name:** Cross-Tab Sync via BroadcastChannel
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- setupCrossTabSync
- **game_concept:** Multi-tab scene synchronization
- **description:** Establishes a BroadcastChannel ('ptu-scene-sync') for cross-tab communication. Handles scene_activated and scene_deactivated messages to keep multiple browser tabs in sync.
- **inputs:** N/A (self-initializing)
- **outputs:** Cross-tab state synchronization
- **accessible_from:** gm, group

### scenes-C039
- **name:** Tab State Getters
- **type:** store-getter
- **location:** `app/stores/groupViewTabs.ts` -- isSceneTab, isEncounterTab, isMapTab, isLobbyTab, hasActiveScene
- **game_concept:** Active tab detection
- **description:** Computed getters for checking current tab state. Used by group view components to conditionally render content.
- **inputs:** N/A (reads state)
- **outputs:** boolean
- **accessible_from:** gm, group

## Components

### scenes-C040
- **name:** SceneCanvas Component
- **type:** component
- **location:** `app/components/scene/SceneCanvas.vue`
- **game_concept:** Visual scene canvas with draggable entities
- **description:** Interactive canvas displaying scene background image, groups (with resize handles), Pokemon sprites, and character avatars. Supports drag-and-drop positioning, group selection, entity removal, and snap-to-group behavior. Uses percentage-based positioning relative to container.
- **inputs:** Props: scene, selectedGroupId
- **outputs:** Emits: select-group, delete-group, remove-pokemon, remove-character, position-update
- **accessible_from:** gm, group (display only)

### scenes-C041
- **name:** ScenePropertiesPanel Component
- **type:** component
- **location:** `app/components/scene/ScenePropertiesPanel.vue`
- **game_concept:** Scene metadata editing
- **description:** Panel for editing scene name, description, location name, location image URL, weather, and habitat link. Provides form inputs for all scene properties.
- **inputs:** Props: scene
- **outputs:** Events: property changes
- **accessible_from:** gm

### scenes-C042
- **name:** SceneAddPanel Component
- **type:** component
- **location:** `app/components/scene/SceneAddPanel.vue`
- **game_concept:** Add characters and Pokemon to scene
- **description:** Panel for adding characters and Pokemon to the active scene. Provides searchable lists of available characters and Pokemon.
- **inputs:** Props: scene
- **outputs:** Events: add-character, add-pokemon
- **accessible_from:** gm

### scenes-C043
- **name:** SceneGroupsPanel Component
- **type:** component
- **location:** `app/components/scene/SceneGroupsPanel.vue`
- **game_concept:** Scene group management
- **description:** Panel for creating, editing, and deleting groups within a scene. Groups organize characters and Pokemon into visual clusters on the scene canvas.
- **inputs:** Props: scene
- **outputs:** Events: create-group, update-group, delete-group
- **accessible_from:** gm

### scenes-C044
- **name:** ScenePokemonList Component
- **type:** component
- **location:** `app/components/scene/ScenePokemonList.vue`
- **game_concept:** Scene Pokemon roster display
- **description:** Displays all Pokemon currently in the scene with species, nickname, and group assignment.
- **inputs:** Props: pokemon[], groups
- **outputs:** Events: remove-pokemon
- **accessible_from:** gm

### scenes-C045
- **name:** SceneHabitatPanel Component
- **type:** component
- **location:** `app/components/scene/SceneHabitatPanel.vue`
- **game_concept:** Link scene to encounter table for wild spawns
- **description:** Panel for linking a scene to an encounter table (habitat). Enables wild Pokemon generation within the scene context.
- **inputs:** Props: habitatId
- **outputs:** Events: habitat-change
- **accessible_from:** gm

### scenes-C046
- **name:** StartEncounterModal Component
- **type:** component
- **location:** `app/components/scene/StartEncounterModal.vue`
- **game_concept:** Scene-to-encounter conversion
- **description:** Modal for converting a scene into a combat encounter. Allows selecting which characters and Pokemon from the scene should be combatants, and assigning sides (players, allies, enemies).
- **inputs:** Props: scene
- **outputs:** Events: start-encounter, close
- **accessible_from:** gm

## WebSocket Events

### scenes-C050
- **name:** scene_update WebSocket Event
- **type:** websocket-event
- **location:** `app/server/utils/websocket.ts` -- notifySceneUpdate
- **game_concept:** Full scene state broadcast
- **description:** Broadcast when scene properties change. Sends full parsed scene object. Only sent for active scenes.
- **inputs:** sceneId, parsed scene object
- **outputs:** Broadcast to group+player clients
- **accessible_from:** gm, group, player

### scenes-C051
- **name:** scene_activated / scene_deactivated Events
- **type:** websocket-event
- **location:** `app/server/utils/websocket.ts` -- broadcastToGroupAndPlayers
- **game_concept:** Scene lifecycle events
- **description:** Broadcast when a scene is activated or deactivated. scene_activated includes full scene data. scene_deactivated includes sceneId only.
- **inputs:** scene or sceneId
- **outputs:** Broadcast to group+player clients
- **accessible_from:** gm, group, player

### scenes-C052
- **name:** Scene Entity WebSocket Events (6 events)
- **type:** websocket-event
- **location:** `app/server/utils/websocket.ts` -- notifySceneCharacterAdded/Removed, notifyScenePokemonAdded/Removed, notifySceneGroupCreated/Updated/Deleted
- **game_concept:** Granular scene entity changes
- **description:** Individual events for each scene entity operation: character add/remove, Pokemon add/remove, group create/update/delete. Each carries sceneId plus the entity data or entityId. Enables efficient partial updates without full scene reload.
- **inputs:** sceneId + entity data
- **outputs:** Broadcast to group+player clients
- **accessible_from:** gm, group, player

### scenes-C053
- **name:** scene_positions_updated WebSocket Event
- **type:** websocket-event
- **location:** `app/server/utils/websocket.ts`
- **game_concept:** Lightweight position sync
- **description:** Broadcast when entity positions are updated via the positions endpoint. Carries selective position data (only changed entities). Store handler performs selective merge without full scene reload.
- **inputs:** position arrays for pokemon/characters/groups
- **outputs:** Broadcast to group+player clients
- **accessible_from:** gm, group, player

## Capability Chains

### Chain 1: Scene CRUD
1. **GM page** renders scene list and editor
2. **Store** manages scene state (fetchScenes, createScene, updateScene, deleteScene)
3. **API endpoints** handle DB operations
4. **ScenePropertiesPanel** provides editing UI
- **Accessible from:** gm only (CRUD); group (read active scene)

### Chain 2: Scene Entity Management
1. **SceneAddPanel** provides add character/Pokemon UI
2. **API endpoints** add/remove entities from scene JSON arrays
3. **WebSocket events** broadcast individual entity changes
4. **Store** handlers update activeScene state immutably
5. **SceneCanvas** renders entities at their positions
- **Accessible from:** gm (add/remove); group (display via WebSocket)

### Chain 3: Scene Activation/Display
1. **GM** activates scene via activateScene action
2. **API** restores AP for characters in previously active scenes
3. **API** deactivates all scenes, activates target, updates GroupViewState
4. **WebSocket** broadcasts scene_activated to group+player clients
5. **BroadcastChannel** syncs cross-tab state
6. **Group view** displays active scene canvas
- **Accessible from:** gm (activation); group, player (display)

### Chain 4: Position Drag & Drop
1. **SceneCanvas** handles drag events for sprites/groups
2. **Store** updatePositions action calls positions endpoint
3. **API** updates scene JSON and broadcasts positions event
4. **Other clients** receive selective position merge via WebSocket
- **Accessible from:** gm (drag); group (display via WebSocket)

### Chain 5: Scene to Encounter Conversion
1. **StartEncounterModal** selects combatants and sides
2. Triggers encounter creation with selected entities
3. Scene entities become encounter combatants
- **Accessible from:** gm only

## Accessibility Summary

| View | Capabilities |
|------|-------------|
| gm-only | C010 (list), C011 (create), C013 (update), C014 (delete), C015 (activate), C016 (deactivate), C018-C025 (entity management), C040-C046 (all editing components) |
| gm+group | C001 (model), C012 (get scene), C017 (get active), C035-C039 (store), C040 (canvas display), C050-C053 (WebSocket events) |
| gm+group+player | C017 (active scene), C051 (activation events) |
| api-only | C030 (AP restoration service) |

## Missing Subsystems

### MS-1: Player Scene Interaction
- **subsystem:** No player-facing scene interaction exists. Players cannot see the active scene from their player view, nor can they position their characters/Pokemon.
- **actor:** player
- **ptu_basis:** PTU scenes involve player characters interacting with the environment. Players should see the scene context (location, weather, NPCs present) and potentially move their tokens.
- **impact:** Players cannot see the current scene on their device. All scene awareness must come from verbal communication or the group TV display.

### MS-2: Scene History / Session Log
- **subsystem:** No scene history or session log exists. When a scene is deactivated and replaced, its context is lost from active state.
- **actor:** both
- **ptu_basis:** PTU sessions involve multiple scenes in sequence. Having a record of past scenes (what happened, who was present) aids continuity.
- **impact:** GMs must manually track scene progression. No way to review previous session scenes or replay events.

### MS-3: Scene Weather Mechanics
- **subsystem:** Weather is stored as a text field but has no mechanical integration. No weather-based combat modifiers or visual effects.
- **actor:** both
- **ptu_basis:** PTU Chapter 11 describes weather effects that modify combat (Sandstorm damage, Rain boosting Water moves, etc.).
- **impact:** Weather is flavor text only. GMs must manually track and apply weather-based combat effects.
