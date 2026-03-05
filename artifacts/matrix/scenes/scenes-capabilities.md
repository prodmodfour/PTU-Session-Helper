---
domain: scenes
type: capabilities
total_capabilities: 54
mapped_at: 2026-03-05T00:00:00Z
mapped_by: app-capability-mapper
stale_since: null
---

# App Capabilities: Scenes

> Complete re-map of the scenes domain. Refreshed from source code deep read on 2026-03-05. Previous catalog had 26 entries (stale since sessions 12-26: level budget P0-P1, weather P0-P2, Permafrost). This catalog has 54 entries reflecting: encounter budget analysis, quest XP awards, weather visual effects, significance tier selection, player scene view, and all WebSocket event handlers.

---

## Prisma Models

### scenes-C001: Scene Prisma Model
- **cap_id:** scenes-C001
- **name:** Scene Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model Scene
- **game_concept:** Narrative scene with characters, Pokemon, and environment
- **description:** Scene with name, description, location (name + image URL), JSON-stored pokemon/characters/groups arrays with positions, weather (9 weather types matching PTU), terrains (JSON array -- UI deferred), modifiers (JSON array -- UI deferred), habitat link (habitatId), active state flag. Timestamps.
- **inputs:** name, description, locationName, locationImage, pokemon[], characters[], groups[], weather, terrains[], modifiers[], habitatId, isActive
- **outputs:** Persisted scene record with cuid primary key
- **accessible_from:** gm, group (display), player (read-only via WebSocket)

### scenes-C002: GroupViewState Prisma Model
- **cap_id:** scenes-C002
- **name:** GroupViewState Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model GroupViewState
- **game_concept:** Group View tab state singleton tracking active tab and scene
- **description:** Singleton row (id="singleton") tracking which tab is shown on the Group View (lobby/scene/encounter/map) and the activeSceneId reference. Updated when GM switches tabs or activates/deactivates scenes.
- **inputs:** activeTab, activeSceneId
- **outputs:** Persisted group view state
- **accessible_from:** gm (modify), group (read)

---

## Type Definitions

### scenes-C003: Scene TypeScript Types
- **cap_id:** scenes-C003
- **name:** Scene TypeScript Types
- **type:** constant
- **location:** `app/types/scene.ts`
- **game_concept:** Type-safe scene data contract
- **description:** Defines Scene, ScenePokemon (id, species, level, nickname, position, groupId), SceneCharacter (id, characterId, name, avatarUrl, position, groupId), SceneGroup (id, name, position, width, height), SceneModifier (name, description, effect), ScenePosition (x, y), GroupViewTab union. All types hand-written (not Prisma-generated).
- **inputs:** N/A
- **outputs:** TypeScript interfaces consumed by store, API, and components
- **accessible_from:** gm, group, player (shared type)

### scenes-C004: SceneSyncPayload Type
- **cap_id:** scenes-C004
- **name:** SceneSyncPayload Type
- **type:** constant
- **location:** `app/types/player-sync.ts` -- SceneSyncPayload
- **game_concept:** Player-visible scene data contract for WebSocket sync
- **description:** Stripped-down scene payload pushed to players on connect and scene activation. Excludes terrains, modifiers, positions, and GM-only metadata. Contains scene.{id, name, description, locationName, locationImage, weather, isActive, characters[{id, name, isPlayerCharacter}], pokemon[{id, nickname, species, ownerId}], groups[{id, name}]}.
- **inputs:** Active scene data from DB
- **outputs:** WebSocket message payload to player clients
- **accessible_from:** player

### scenes-C005: PlayerSceneData Type
- **cap_id:** scenes-C005
- **name:** PlayerSceneData Type
- **type:** constant
- **location:** `app/composables/usePlayerScene.ts` -- PlayerSceneData interface
- **game_concept:** Player-side scene representation
- **description:** Client-side interface for player scene state. Maps from SceneSyncPayload or REST response. Fields: id, name, description, locationName, locationImage, weather, isActive, characters[{id, name, isPlayerCharacter}], pokemon[{id, nickname, species, ownerId}], groups[{id, name}].
- **inputs:** SceneSyncPayload or REST /api/scenes/active response
- **outputs:** Reactive ref consumed by PlayerSceneView component
- **accessible_from:** player

---

## API Endpoints

### scenes-C010: GET /api/scenes (List All Scenes)
- **cap_id:** scenes-C010
- **name:** List All Scenes
- **type:** api-endpoint
- **location:** `app/server/api/scenes/index.get.ts`
- **game_concept:** Scene library browsing
- **description:** Returns all scenes ordered by updatedAt desc. Parses JSON fields (pokemon, characters, groups, terrains, modifiers) for client consumption.
- **inputs:** None
- **outputs:** `{ success, data: Scene[] }`
- **accessible_from:** gm

### scenes-C011: POST /api/scenes (Create Scene)
- **cap_id:** scenes-C011
- **name:** Create Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/index.post.ts`
- **game_concept:** Scene creation
- **description:** Creates a new scene with name (required), optional description, locationName, locationImage, weather, terrains, modifiers, habitatId. Pokemon, characters, and groups start as empty arrays.
- **inputs:** `{ name, description?, locationName?, locationImage?, weather?, terrains?, modifiers?, habitatId? }`
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm

### scenes-C012: GET /api/scenes/:id (Get Scene)
- **cap_id:** scenes-C012
- **name:** Get Scene by ID
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].get.ts`
- **game_concept:** Scene retrieval
- **description:** Fetches a single scene by ID with all JSON fields parsed.
- **inputs:** Scene ID (URL param)
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm

### scenes-C013: GET /api/scenes/active (Get Active Scene)
- **cap_id:** scenes-C013
- **name:** Get Active Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/active.get.ts`
- **game_concept:** Active scene retrieval with enrichment
- **description:** Returns the currently active scene (isActive=true), enriched with isPlayerCharacter flags on characters (from HumanCharacter DB lookup) and ownerId on Pokemon (from Pokemon DB lookup). Returns null if no scene is active.
- **inputs:** None
- **outputs:** `{ success, data: EnrichedScene | null }`
- **accessible_from:** gm, group, player

### scenes-C014: PUT /api/scenes/:id (Update Scene)
- **cap_id:** scenes-C014
- **name:** Update Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].put.ts`
- **game_concept:** Scene editing (all fields)
- **description:** Partial update of any scene field: name, description, locationName, locationImage, pokemon, characters, groups, weather, terrains, modifiers, habitatId. Serializes JSON arrays before storage. Broadcasts WebSocket scene_update if scene is active.
- **inputs:** Scene ID (URL param), partial scene body
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm

### scenes-C015: DELETE /api/scenes/:id (Delete Scene)
- **cap_id:** scenes-C015
- **name:** Delete Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id].delete.ts`
- **game_concept:** Scene deletion
- **description:** Deletes a scene by ID. If the scene was active, clears the GroupViewState.activeSceneId reference before deletion.
- **inputs:** Scene ID (URL param)
- **outputs:** `{ success, message }`
- **accessible_from:** gm

### scenes-C016: POST /api/scenes/:id/activate (Activate Scene)
- **cap_id:** scenes-C016
- **name:** Activate Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/activate.post.ts`
- **game_concept:** Scene serving to Group View
- **description:** Activates a scene: restores AP for characters in any currently active scenes (via restoreSceneAp), deactivates all other scenes, sets this scene as active, updates GroupViewState singleton, broadcasts scene_activated to group and player WebSocket clients.
- **inputs:** Scene ID (URL param)
- **outputs:** `{ success, data: Scene }`
- **accessible_from:** gm (action), group+player (receive broadcast)

### scenes-C017: POST /api/scenes/:id/deactivate (Deactivate Scene)
- **cap_id:** scenes-C017
- **name:** Deactivate Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/deactivate.post.ts`
- **game_concept:** Scene end with AP restoration
- **description:** Deactivates a scene: restores AP for all characters in the scene (PTU Core p221 -- AP regained at scene end, bound AP released, drained AP stays), clears GroupViewState reference, broadcasts scene_deactivated to group and player clients. Returns count of characters whose AP was restored.
- **inputs:** Scene ID (URL param)
- **outputs:** `{ success, message: "Scene deactivated... AP restored for N character(s)." }`
- **accessible_from:** gm (action), group+player (receive broadcast)

### scenes-C018: POST /api/scenes/:id/characters (Add Character)
- **cap_id:** scenes-C018
- **name:** Add Character to Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/characters.post.ts`
- **game_concept:** Placing a trainer/NPC into a scene
- **description:** Adds a character to the scene's JSON characters array. Creates a scene-local entry with UUID, characterId (DB reference), name, avatarUrl, position (default {x:50,y:50}), groupId. Validates character is not already in scene. Broadcasts scene_character_added via WebSocket if scene is active.
- **inputs:** `{ characterId, name, avatarUrl?, position?, groupId? }`
- **outputs:** `{ success, data: SceneCharacter }`
- **accessible_from:** gm

### scenes-C019: DELETE /api/scenes/:id/characters/:charId (Remove Character)
- **cap_id:** scenes-C019
- **name:** Remove Character from Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/characters/[charId].delete.ts`
- **game_concept:** Removing a trainer/NPC from a scene
- **description:** Removes a character from the scene's JSON characters array by scene-local ID. Broadcasts scene_character_removed via WebSocket if scene is active.
- **inputs:** Scene ID, Character scene-local ID (URL params)
- **outputs:** `{ success, message }`
- **accessible_from:** gm

### scenes-C020: POST /api/scenes/:id/pokemon (Add Pokemon)
- **cap_id:** scenes-C020
- **name:** Add Pokemon to Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/pokemon.post.ts`
- **game_concept:** Placing a Pokemon into a scene (wild or from sheet)
- **description:** Adds a Pokemon to the scene's JSON pokemon array. Creates a scene-local entry with UUID, speciesId, species (required), level, nickname, position (default {x:50,y:50}), groupId. Broadcasts scene_pokemon_added via WebSocket if scene is active.
- **inputs:** `{ species, speciesId?, level?, nickname?, position?, groupId? }`
- **outputs:** `{ success, data: ScenePokemon }`
- **accessible_from:** gm

### scenes-C021: DELETE /api/scenes/:id/pokemon/:pokemonId (Remove Pokemon)
- **cap_id:** scenes-C021
- **name:** Remove Pokemon from Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/pokemon/[pokemonId].delete.ts`
- **game_concept:** Removing a Pokemon from a scene
- **description:** Removes a Pokemon from the scene's JSON pokemon array by scene-local ID. Broadcasts scene_pokemon_removed via WebSocket if scene is active.
- **inputs:** Scene ID, Pokemon scene-local ID (URL params)
- **outputs:** `{ success, message }`
- **accessible_from:** gm

### scenes-C022: PUT /api/scenes/:id/positions (Batch Position Update)
- **cap_id:** scenes-C022
- **name:** Batch Position Update
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/positions.put.ts`
- **game_concept:** Drag-and-drop layout persistence
- **description:** Lightweight endpoint for batch-updating positions of pokemon, characters, and groups within a scene. Updates groupId assignments when sprites are dropped onto groups. Broadcasts scene_positions_updated via WebSocket if scene is active.
- **inputs:** `{ pokemon?: [{id, position, groupId?}], characters?: [{id, position, groupId?}], groups?: [{id, position, width?, height?}] }`
- **outputs:** `{ success, message }`
- **accessible_from:** gm

### scenes-C023: POST /api/scenes/:id/groups (Create Group)
- **cap_id:** scenes-C023
- **name:** Create Group in Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups.post.ts`
- **game_concept:** Grouping entities on the scene canvas
- **description:** Creates a new group in the scene's JSON groups array. Auto-offsets position based on existing group count to prevent stacking. Default size 150x100px. Broadcasts scene_group_created via WebSocket if scene is active.
- **inputs:** `{ name?, position?, width?, height? }`
- **outputs:** `{ success, data: SceneGroup }`
- **accessible_from:** gm

### scenes-C024: PUT /api/scenes/:id/groups/:groupId (Update Group)
- **cap_id:** scenes-C024
- **name:** Update Group in Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups/[groupId].put.ts`
- **game_concept:** Group editing (rename, reposition, resize)
- **description:** Partial update of a group's name, position, width, or height. Broadcasts scene_group_updated via WebSocket if scene is active.
- **inputs:** Scene ID, Group ID (URL params), `{ name?, position?, width?, height? }`
- **outputs:** `{ success, data: SceneGroup }`
- **accessible_from:** gm

### scenes-C025: DELETE /api/scenes/:id/groups/:groupId (Delete Group)
- **cap_id:** scenes-C025
- **name:** Delete Group from Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/[id]/groups/[groupId].delete.ts`
- **game_concept:** Removing a group and unassigning its members
- **description:** Removes a group from the scene's JSON groups array. Also clears groupId from all pokemon and characters that were assigned to this group. Broadcasts scene_group_deleted via WebSocket if scene is active.
- **inputs:** Scene ID, Group ID (URL params)
- **outputs:** `{ success, message }`
- **accessible_from:** gm

### scenes-C026: POST /api/encounters/from-scene (Scene-to-Encounter Conversion)
- **cap_id:** scenes-C026
- **name:** Scene-to-Encounter Conversion
- **type:** api-endpoint
- **location:** `app/server/api/encounters/from-scene.post.ts`
- **game_concept:** Transitioning from narrative scene to combat encounter
- **description:** Creates a new Encounter from a scene. Scene Pokemon become wild enemy combatants with full DB sheets (via generateAndCreatePokemon), scene characters become player combatants referencing existing DB records (via buildCombatantFromEntity). Grid auto-placement via findPlacementPosition. Inherits scene weather. Supports battleType (full_contact/trainer) and significance tier (for XP scaling). Validates significance tier.
- **inputs:** `{ sceneId, battleType?, significanceMultiplier?, significanceTier? }`
- **outputs:** `{ success, data: Encounter }`
- **accessible_from:** gm

---

## Service Layer

### scenes-C030: restoreSceneAp Service Function
- **cap_id:** scenes-C030
- **name:** Scene-End AP Restoration
- **type:** service-function
- **location:** `app/server/services/scene.service.ts` -- restoreSceneAp()
- **game_concept:** PTU Core p221 -- AP regained at scene end
- **description:** Restores Action Points for all characters in a scene at scene end. Groups characters by (level, drainedAp) to batch identical updates into fewer updateMany calls within a single transaction. Unbinds all bound AP and restores currentAp to max minus drainedAp. Uses calculateSceneEndAp from restHealing utility.
- **inputs:** charactersJson (raw JSON string from scene.characters)
- **outputs:** Number of characters whose AP was restored
- **accessible_from:** api-only (called from activate/deactivate endpoints)

---

## Utility Functions

### scenes-C031: calculateSceneEndAp Utility
- **cap_id:** scenes-C031
- **name:** Calculate Scene-End AP
- **type:** utility
- **location:** `app/utils/restHealing.ts` -- calculateSceneEndAp()
- **game_concept:** PTU Core p221 -- AP restoration math
- **description:** Pure function calculating available AP after scene-end restoration. AP = maxAp(level) - drainedAp. Drained AP remains unavailable until Extended Rest. Bound AP is released at scene end (set to 0).
- **inputs:** level (number), drainedAp (number), boundAp (number, optional)
- **outputs:** Restored AP value (number)
- **accessible_from:** api-only (called from scene.service.ts)

### scenes-C032: analyzeEncounterBudget Utility
- **cap_id:** scenes-C032
- **name:** Encounter Budget Analysis
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- analyzeEncounterBudget()
- **game_concept:** PTU Encounter Creation Guide -- difficulty estimation
- **description:** Analyzes encounter difficulty based on average party Pokemon level, player count, and enemy levels. Returns budget, totalEnemyLevels, effectiveEnemyLevels, and difficulty rating (trivial/easy/balanced/hard/deadly). Used by the scene editor to show budget info before starting an encounter.
- **inputs:** `{ averagePokemonLevel, playerCount }`, enemies array `[{ level, isTrainer }]`
- **outputs:** BudgetAnalysis with difficulty rating
- **accessible_from:** gm (used in scene editor page)

### scenes-C033: SIGNIFICANCE_PRESETS Constant
- **cap_id:** scenes-C033
- **name:** Significance Presets
- **type:** constant
- **location:** `app/utils/encounterBudget.ts` -- SIGNIFICANCE_PRESETS
- **game_concept:** PTU Core p460 -- XP significance tiers
- **description:** Array of significance presets for XP scaling: insignificant (x1), everyday (x1.5-x2), significant (x2-x3), Pokemon League (x3-x4), legendary (x4-x5). Capped at x5 per decree-030. Each preset has tier, label, multiplierRange, defaultMultiplier, and description.
- **inputs:** N/A (constant)
- **outputs:** SignificancePreset[]
- **accessible_from:** gm (via StartEncounterModal)

### scenes-C034: applyTrainerXp Utility
- **cap_id:** scenes-C034
- **name:** Apply Trainer XP
- **type:** utility
- **location:** `app/utils/trainerExperience.ts` -- applyTrainerXp()
- **game_concept:** PTU Core p461 -- Trainer Experience Bank
- **description:** Calculates the result of adding XP to a trainer's experience bank. Computes new XP, new level, and levels gained (auto-levels at 10 XP). Used by QuestXpDialog for level-up preview.
- **inputs:** `{ currentXp, currentLevel, xpToAdd }`
- **outputs:** `{ newXp, newLevel, levelsGained }`
- **accessible_from:** gm (via QuestXpDialog)

---

## Store (Pinia)

### scenes-C040: groupViewTabs Store -- Scene CRUD Actions
- **cap_id:** scenes-C040
- **name:** Scene CRUD Store Actions
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- fetchScenes, fetchScene, fetchActiveScene, createScene, updateScene, deleteScene
- **game_concept:** Scene library management
- **description:** Pinia store providing full scene CRUD: fetch all scenes, fetch single scene, fetch active scene, create, update, delete. Maintains scenes[] array and activeScene ref. Updates both list and activeScene when relevant.
- **inputs:** Scene data matching API expectations
- **outputs:** Updated store state (scenes[], activeScene)
- **accessible_from:** gm

### scenes-C041: groupViewTabs Store -- Activate/Deactivate Actions
- **cap_id:** scenes-C041
- **name:** Scene Activate/Deactivate Store Actions
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- activateScene, deactivateScene
- **game_concept:** Scene serving to Group View
- **description:** Activate: calls POST /api/scenes/:id/activate, updates all scenes' isActive flags, sets activeScene/activeSceneId, posts BroadcastChannel message. Deactivate: calls POST /api/scenes/:id/deactivate, clears activeScene/activeSceneId, posts BroadcastChannel message.
- **inputs:** Scene ID
- **outputs:** Updated store state, BroadcastChannel notification
- **accessible_from:** gm

### scenes-C042: groupViewTabs Store -- Tab State Actions
- **cap_id:** scenes-C042
- **name:** Tab State Management
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- fetchTabState, setActiveTab, handleTabChange
- **game_concept:** Group View tab navigation
- **description:** Manages which tab is shown on the Group View (lobby/scene/encounter/map). fetchTabState reads from server, setActiveTab PUTs to server, handleTabChange processes incoming WebSocket tab_state events.
- **inputs:** Tab name (GroupViewTab), optional sceneId
- **outputs:** Updated activeTab and activeSceneId in store
- **accessible_from:** gm (modify), group (read via WebSocket)

### scenes-C043: groupViewTabs Store -- Position Update Action
- **cap_id:** scenes-C043
- **name:** Batch Position Update Store Action
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- updatePositions
- **game_concept:** Scene drag-and-drop persistence
- **description:** Sends batch position updates to PUT /api/scenes/:id/positions. Lightweight (no local state update -- relies on server response or WebSocket echo).
- **inputs:** sceneId, positions object with pokemon/characters/groups arrays
- **outputs:** Server response (void -- fire-and-forget)
- **accessible_from:** gm

### scenes-C044: groupViewTabs Store -- WebSocket Handlers
- **cap_id:** scenes-C044
- **name:** Scene WebSocket Event Handlers
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- handleSceneUpdate, handleSceneActivated, handleSceneDeactivated, handleScenePositionsUpdated, handleSceneCharacterAdded, handleSceneCharacterRemoved, handleScenePokemonAdded, handleScenePokemonRemoved, handleSceneGroupCreated, handleSceneGroupUpdated, handleSceneGroupDeleted
- **game_concept:** Real-time scene synchronization
- **description:** Eleven handler methods for WebSocket scene events. Each applies immutable updates to activeScene or scenes[] array. Granular handlers for individual entity add/remove avoid full scene re-fetch.
- **inputs:** WebSocket event data (varies per event type)
- **outputs:** Updated activeScene and/or scenes[] in store
- **accessible_from:** gm, group (both receive WebSocket events)

### scenes-C045: groupViewTabs Store -- Getters
- **cap_id:** scenes-C045
- **name:** Scene Store Getters
- **type:** store-getter
- **location:** `app/stores/groupViewTabs.ts` -- isSceneTab, isEncounterTab, isMapTab, isLobbyTab, hasActiveScene
- **game_concept:** Tab state queries
- **description:** Five boolean getters for checking current tab state and whether an active scene exists. Used by pages and components for conditional rendering.
- **inputs:** Store state
- **outputs:** Boolean
- **accessible_from:** gm, group

### scenes-C046: groupViewTabs Store -- BroadcastChannel Cross-Tab Sync
- **cap_id:** scenes-C046
- **name:** Cross-Tab Sync via BroadcastChannel
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- setupCrossTabSync
- **game_concept:** Multi-tab browser synchronization
- **description:** Creates a BroadcastChannel ('ptu-scene-sync') for cross-tab communication. Listens for scene_activated and scene_deactivated messages from other tabs. Posts scene_activated/scene_deactivated when GM activates/deactivates scenes. Ensures both GM tab and Group tab stay synchronized without server round-trip.
- **inputs:** BroadcastChannel messages from other tabs
- **outputs:** Updated store state in receiving tab
- **accessible_from:** gm, group

---

## Composables

### scenes-C050: usePlayerScene Composable
- **cap_id:** scenes-C050
- **name:** Player Scene State
- **type:** composable-function
- **location:** `app/composables/usePlayerScene.ts`
- **game_concept:** Player view of active scene
- **description:** Manages player-side scene state. Handles scene_sync WebSocket events (maps SceneSyncPayload to PlayerSceneData), scene deactivation (clears state), and REST fallback (fetches GET /api/scenes/active on reconnect). Provides readonly activeScene ref. Maps scene data to player-visible fields only (no terrains, modifiers, or positions).
- **inputs:** SceneSyncPayload (WebSocket) or REST response
- **outputs:** `{ activeScene: Readonly<Ref<PlayerSceneData|null>>, handleSceneSync, handleSceneDeactivated, fetchActiveScene }`
- **accessible_from:** player

### scenes-C051: useGroupViewWebSocket (Scene Handlers)
- **cap_id:** scenes-C051
- **name:** Group View WebSocket Scene Handlers
- **type:** composable-function
- **location:** `app/composables/useGroupViewWebSocket.ts`
- **game_concept:** Group View real-time scene updates
- **description:** Routes 11 scene-related WebSocket events to the groupViewTabs store handlers: scene_activated, scene_deactivated, scene_update, scene_positions_updated, scene_character_added/removed, scene_pokemon_added/removed, scene_group_created/updated/deleted. Also handles tab_state events.
- **inputs:** WebSocket messages
- **outputs:** Store state updates via handler delegation
- **accessible_from:** group

### scenes-C052: usePlayerWebSocket (Scene Handlers)
- **cap_id:** scenes-C052
- **name:** Player WebSocket Scene Handlers
- **type:** composable-function
- **location:** `app/composables/usePlayerWebSocket.ts`
- **game_concept:** Player real-time scene updates
- **description:** Handles scene_sync, scene_deactivated, and scene_activated WebSocket events for the player view. On scene_sync: delegates to usePlayerScene.handleSceneSync. On scene_deactivated: clears player scene. On scene_activated: calls fetchActiveScene (REST) to get enriched data with isPlayerCharacter flags.
- **inputs:** WebSocket messages
- **outputs:** Updated PlayerSceneData via usePlayerScene
- **accessible_from:** player

### scenes-C053: Encounter Budget Computation (Scene Editor)
- **cap_id:** scenes-C053
- **name:** Encounter Budget for Scene Editor
- **type:** composable-function
- **location:** `app/pages/gm/scenes/[id].vue` -- budgetInfo computed
- **game_concept:** PTU Encounter Creation Guide difficulty preview
- **description:** Inline computed property in scene editor page that calculates encounter difficulty from scene contents. Filters to PC trainers only, gathers their Pokemon levels, treats scene wild Pokemon as enemies, calls analyzeEncounterBudget. Shows totalBudget, effectiveEnemyLevels, and difficulty rating in StartEncounterModal.
- **inputs:** Scene characters + allCharacters + allPokemon
- **outputs:** budgetInfo `{ totalBudget, totalEnemyLevels, effectiveEnemyLevels, difficulty }`
- **accessible_from:** gm

---

## Components

### scenes-C060: GM Scenes Manager Page
- **cap_id:** scenes-C060
- **name:** GM Scenes Manager Page
- **type:** component
- **location:** `app/pages/gm/scenes/index.vue`
- **game_concept:** Scene library overview
- **description:** Grid display of all scenes with thumbnail, name, location, entity counts, weather display. Provides create, activate/deactivate, edit (navigates to editor), and delete (with confirmation modal) actions. Uses groupViewTabsStore for all operations. Sets up BroadcastChannel cross-tab sync on mount.
- **inputs:** Store state (scenes[])
- **outputs:** User actions routed through store actions
- **accessible_from:** gm

### scenes-C061: GM Scene Editor Page
- **cap_id:** scenes-C061
- **name:** GM Scene Editor Page
- **type:** component
- **location:** `app/pages/gm/scenes/[id].vue`
- **game_concept:** Scene editing workspace
- **description:** Full-featured scene editor with: inline name editing, activate/deactivate, award quest XP, start encounter button. Contains SceneGroupsPanel (left), SceneCanvas (center), ScenePropertiesPanel + SceneAddPanel + SceneHabitatPanel (right, collapsible). Manages local scene state, fetches characters and Pokemon for add panels, computes encounter budget info, handles position/group/entity CRUD. Cross-tab sync via BroadcastChannel.
- **inputs:** Scene ID from route params
- **outputs:** Scene mutations via API calls
- **accessible_from:** gm

### scenes-C062: SceneCanvas Component
- **cap_id:** scenes-C062
- **name:** SceneCanvas
- **type:** component
- **location:** `app/components/scene/SceneCanvas.vue`
- **game_concept:** Visual scene layout with drag-and-drop
- **description:** Main drag-and-drop canvas for scene editing. Renders groups (dashed borders with resize handles), Pokemon sprites, and character avatars at percentage-based positions. Supports: sprite drag with group drop-target detection (visual highlight), group drag that moves member sprites, group resize from corner handles (4 corners). Uses direct DOM manipulation during drag for performance, emits events on mouseUp.
- **inputs:** scene (Scene), selectedGroupId
- **outputs:** Events: update:positions, resize-group, select-group, delete-group, remove-pokemon, remove-character
- **accessible_from:** gm

### scenes-C063: ScenePropertiesPanel Component
- **cap_id:** scenes-C063
- **name:** ScenePropertiesPanel
- **type:** component
- **location:** `app/components/scene/ScenePropertiesPanel.vue`
- **game_concept:** Scene metadata editing
- **description:** Collapsible right sidebar for editing scene properties: location name, background image URL, description (textarea), weather (dropdown with 9 PTU weather types: sunny, rain, sandstorm, hail, snow, fog, harsh_sunlight, heavy_rain, strong_winds, or none).
- **inputs:** scene (Scene), collapsed state
- **outputs:** Events: update:scene (field, value), toggle-collapse
- **accessible_from:** gm

### scenes-C064: SceneAddPanel Component
- **cap_id:** scenes-C064
- **name:** SceneAddPanel
- **type:** component
- **location:** `app/components/scene/SceneAddPanel.vue`
- **game_concept:** Adding entities to a scene
- **description:** Collapsible right sidebar with two tabs: Characters (shows available characters not yet in scene, click to add) and Pokemon (shows ScenePokemonList for owned Pokemon, plus manual wild Pokemon entry form with species/level inputs).
- **inputs:** availableCharacters[], charactersWithPokemon[], collapsed state
- **outputs:** Events: add-character, add-pokemon (species, level), toggle-collapse
- **accessible_from:** gm

### scenes-C065: ScenePokemonList Component
- **cap_id:** scenes-C065
- **name:** ScenePokemonList
- **type:** component
- **location:** `app/components/scene/ScenePokemonList.vue`
- **game_concept:** Per-character Pokemon browsing for scene setup
- **description:** Expandable per-character accordion showing each character's owned Pokemon with sprite, species, nickname, and level. Click + button to add any Pokemon to the scene. Used inside SceneAddPanel's Pokemon tab.
- **inputs:** charactersWithPokemon[]
- **outputs:** Events: add-pokemon (species, level)
- **accessible_from:** gm

### scenes-C066: SceneGroupsPanel Component
- **cap_id:** scenes-C066
- **name:** SceneGroupsPanel
- **type:** component
- **location:** `app/components/scene/SceneGroupsPanel.vue`
- **game_concept:** Visual entity grouping management
- **description:** Collapsible left sidebar for managing scene groups. Shows group list with inline rename input and member count badge. Create group button and select-to-highlight interaction. Collapsed state shows dashed-rectangle icon with count badge.
- **inputs:** scene (Scene), selectedGroupId, collapsed state
- **outputs:** Events: create-group, delete-group, select-group, rename-group, toggle-collapse
- **accessible_from:** gm

### scenes-C067: SceneHabitatPanel Component
- **cap_id:** scenes-C067
- **name:** SceneHabitatPanel
- **type:** component
- **location:** `app/components/scene/SceneHabitatPanel.vue`
- **game_concept:** Linking scene to encounter table for wild spawns
- **description:** Collapsible right sidebar linking a scene to an encounter table (habitat). Shows dropdown to select habitat, displays level range and density tier. "Generate Random" button triggers encounter generation from table. Lists habitat entries with species sprite, name, rarity label (Common/Uncommon/Rare/Very Rare based on weight percentage), and per-entry add button.
- **inputs:** encounterTables[], sceneHabitatId, collapsed, generating
- **outputs:** Events: select-habitat, add-pokemon (species, level), generate-encounter (tableId), toggle-collapse
- **accessible_from:** gm

### scenes-C068: StartEncounterModal Component
- **cap_id:** scenes-C068
- **name:** StartEncounterModal
- **type:** component
- **location:** `app/components/scene/StartEncounterModal.vue`
- **game_concept:** Scene-to-encounter conversion UI
- **description:** Modal for initiating encounter from scene. Shows entity counts (wild Pokemon, characters), encounter budget difficulty analysis (level budget/difficulty rating). Battle type selection: Full Contact (speed order) or Trainer League (declare-then-act). Significance tier selection (insignificant through legendary) with XP multiplier display. Confirm button disabled if no entities.
- **inputs:** sceneName, pokemonCount, characterCount, budgetInfo?
- **outputs:** Events: close, confirm({ battleType, significanceMultiplier, significanceTier })
- **accessible_from:** gm

### scenes-C069: QuestXpDialog Component
- **cap_id:** scenes-C069
- **name:** QuestXpDialog
- **type:** component
- **location:** `app/components/scene/QuestXpDialog.vue`
- **game_concept:** PTU Core p461 -- Trainer XP awards
- **description:** Inline dialog for awarding trainer XP to all characters in a scene. Shows XP amount input (1-20), optional reason field, and preview showing each character's current level/XP bank with level-up indicator. Uses applyTrainerXp for preview calculation and useTrainerXp composable for actual award via REST.
- **inputs:** characters[] (with id, name, level, trainerXp), sceneName
- **outputs:** Events: close, awarded
- **accessible_from:** gm

### scenes-C070: Group View SceneView Component
- **cap_id:** scenes-C070
- **name:** Group View SceneView
- **type:** component
- **location:** `app/pages/group/_components/SceneView.vue`
- **game_concept:** Scene display on shared TV/projector
- **description:** Display-only rendering of the active scene for the Group View. Shows: weather-themed background gradients and CSS particle overlays for all 9 weather types, background image, location header with name/description, groups with labels and member counts, Pokemon sprites with species name and level, character avatars. No interactivity (no drag, no edit). Reads from groupViewTabsStore.activeScene.
- **inputs:** Store state (activeScene via computed)
- **outputs:** Visual display only
- **accessible_from:** group

### scenes-C071: Player SceneView Component
- **cap_id:** scenes-C071
- **name:** Player SceneView
- **type:** component
- **location:** `app/components/player/PlayerSceneView.vue`
- **game_concept:** Player view of active scene
- **description:** Mobile-friendly read-only display of active scene for players. Shows scene name, weather badge, location image or name, description, character list (with PC/NPC tags based on isPlayerCharacter flag), Pokemon list (with nickname/species), and groups list. No positions or visual layout -- presents as a structured card/list view.
- **inputs:** scene (PlayerSceneData | null)
- **outputs:** Visual display only
- **accessible_from:** player

---

## WebSocket Events

### scenes-C080: Scene WebSocket Broadcast Functions
- **cap_id:** scenes-C080
- **name:** Scene WebSocket Broadcast Functions
- **type:** websocket-event
- **location:** `app/server/utils/websocket.ts`
- **game_concept:** Scene real-time synchronization
- **description:** Nine broadcast functions for scene events, all using broadcastToGroupAndPlayers (sends to group + player clients): notifySceneUpdate (scene_update), notifyScenePokemonAdded (scene_pokemon_added), notifyScenePokemonRemoved (scene_pokemon_removed), notifySceneCharacterAdded (scene_character_added), notifySceneCharacterRemoved (scene_character_removed), notifyScenePositionsUpdated (scene_positions_updated), notifySceneGroupCreated (scene_group_created), notifySceneGroupUpdated (scene_group_updated), notifySceneGroupDeleted (scene_group_deleted).
- **inputs:** Scene change from API endpoint
- **outputs:** WebSocket message to group + player clients
- **accessible_from:** gm (triggers), group (receives), player (receives)

### scenes-C081: Scene Activation/Deactivation Broadcasts
- **cap_id:** scenes-C081
- **name:** Scene Activation/Deactivation Broadcasts
- **type:** websocket-event
- **location:** `app/server/api/scenes/[id]/activate.post.ts`, `app/server/api/scenes/[id]/deactivate.post.ts`
- **game_concept:** Scene serving state changes
- **description:** Activate endpoint broadcasts scene_activated with full scene data. Deactivate endpoint broadcasts scene_deactivated with sceneId. Both use broadcastToGroupAndPlayers. These are separate from the utility functions in websocket.ts -- they are called directly in the API handlers.
- **inputs:** Scene activation/deactivation from API
- **outputs:** WebSocket message to group + player clients
- **accessible_from:** gm (triggers), group (receives), player (receives)

### scenes-C082: scene_sync WebSocket Event
- **cap_id:** scenes-C082
- **name:** scene_sync WebSocket Event
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` -- sendActiveScene()
- **game_concept:** Player scene initial sync on connect
- **description:** Server-side helper that queries DB for the active scene, enriches characters with isPlayerCharacter and Pokemon with ownerId, and sends a scene_sync message to a specific player peer. Called on player identify and on scene_request. Payload matches SceneSyncPayload type.
- **inputs:** Player WebSocket peer connection
- **outputs:** scene_sync message with enriched scene data
- **accessible_from:** player

### scenes-C083: scene_request WebSocket Event
- **cap_id:** scenes-C083
- **name:** scene_request WebSocket Event
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts`
- **game_concept:** Player reconnection scene recovery
- **description:** Client-to-server message from player clients requesting the current active scene. Server responds by calling sendActiveScene() which sends scene_sync back. Used for reconnection recovery when WebSocket drops and reconnects.
- **inputs:** Player WebSocket message `{ type: "scene_request" }`
- **outputs:** scene_sync response
- **accessible_from:** player

---

## Capability Chains

### Chain 1: Scene CRUD (GM)
`GM Scenes Page (C060)` -> `GroupViewTabs Store CRUD (C040)` -> `Scene CRUD APIs (C010-C015)` -> `Prisma Scene (C001)`
- **Accessibility:** gm only

### Chain 2: Scene Entity Management (GM)
`Scene Editor (C061)` -> `SceneAddPanel (C064)` / `ScenePokemonList (C065)` -> `Add/Remove APIs (C018-C021)` -> `Prisma Scene JSON fields (C001)` -> `WebSocket Broadcasts (C080)` -> `Store Handlers (C044)` / `Group SceneView (C070)`
- **Accessibility:** gm (modify), group (display via WebSocket), player (display via WebSocket)

### Chain 3: Scene Group Management (GM)
`Scene Editor (C061)` -> `SceneGroupsPanel (C066)` + `SceneCanvas (C062)` -> `Group APIs (C023-C025)` -> `Prisma Scene.groups JSON (C001)` -> `WebSocket Broadcasts (C080)` -> `Store Handlers (C044)`
- **Accessibility:** gm (modify), group (receive updates)

### Chain 4: Scene Activation/Serving
`GM Scenes Page (C060)` or `Scene Editor (C061)` -> `Store activate/deactivate (C041)` -> `Activate/Deactivate APIs (C016-C017)` -> `Scene AP Restoration (C030, C031)` + `GroupViewState (C002)` -> `WebSocket Broadcasts (C081)` + `BroadcastChannel (C046)`
- **Accessibility:** gm (trigger), group (display tab change), player (receive active scene)

### Chain 5: Scene Position Drag-and-Drop (GM)
`SceneCanvas (C062)` drag -> `Scene Editor handlers (C061)` -> `Store updatePositions (C043)` -> `Batch Positions API (C022)` -> `WebSocket Broadcasts (C080)` -> `Store handleScenePositionsUpdated (C044)` -> `Group SceneView (C070)` updated display
- **Accessibility:** gm (drag), group (display updated positions)

### Chain 6: Scene-to-Encounter Conversion (GM)
`Scene Editor (C061)` -> `StartEncounterModal (C068)` -> `Encounter Store createFromScene` -> `POST /api/encounters/from-scene (C026)` -> Pokemon generation + combatant building -> Encounter created
- **Accessibility:** gm only

### Chain 7: Encounter Budget Preview (GM)
`Scene Editor (C061)` -> `budgetInfo computed (C053)` -> `analyzeEncounterBudget (C032)` + `SIGNIFICANCE_PRESETS (C033)` -> `StartEncounterModal (C068)` display
- **Accessibility:** gm only

### Chain 8: Quest XP Award (GM)
`Scene Editor (C061)` -> `QuestXpDialog (C069)` -> `applyTrainerXp (C034)` preview + `useTrainerXp.awardXp()` REST -> Character XP/level updated in DB
- **Accessibility:** gm only

### Chain 9: Active Scene Display (Group View)
`Group Page /group` -> `SceneView tab (C070)` -> `Store fetchActiveScene (C040)` + `WebSocket handlers (C051)` -> `Active Scene API (C013)` + `WebSocket events (C080, C081)`
- **Accessibility:** group

### Chain 10: Active Scene Display (Player View)
`Player Page /player` -> `PlayerSceneView (C071)` -> `usePlayerScene (C050)` -> `usePlayerWebSocket (C052)` -> `scene_sync (C082)` / `scene_request (C083)` / `REST fallback (C013)`
- **Accessibility:** player

### Chain 11: Scene Properties Editing (GM)
`ScenePropertiesPanel (C063)` -> `Scene Editor handleSceneFieldUpdate (C061)` -> `Store updateScene (C040)` -> `PUT /api/scenes/:id (C014)` -> `WebSocket scene_update (C080)` -> `Group SceneView (C070)` updated
- **Accessibility:** gm (edit), group (display), player (weather field via scene_sync)

### Chain 12: Habitat-Linked Generation (GM)
`SceneHabitatPanel (C067)` -> `Scene Editor handleGenerateEncounter (C061)` -> `POST /api/encounter-tables/:tableId/generate` (external) -> generated species -> `addWildPokemon (C061)` -> `Add Pokemon API (C020)` -> scene pokemon array updated
- **Accessibility:** gm only

---

## Accessibility Summary

| Access Level | Capability IDs |
|---|---|
| **gm-only** | C010, C011, C012, C014, C015, C018, C019, C020, C021, C022, C023, C024, C025, C026, C032, C033, C034, C040, C041, C043, C053, C060, C061, C062, C063, C064, C065, C066, C067, C068, C069 |
| **gm+group** | C002, C042, C044, C045, C046, C051 |
| **gm+group+player** | C001 (read), C013, C080, C081 |
| **group-only** | C070 |
| **player-only** | C004, C005, C050, C052, C071, C082, C083 |
| **api-only** | C030, C031 |

---

## Orphan Analysis

No orphan capabilities detected. All capabilities are connected to at least one chain. The `Scene.terrains` and `Scene.modifiers` fields exist in the Prisma model (C001) and pass through API serialization (C010-C014) and store (C040), but their UI was intentionally removed (see MS-2 below). They are not orphans -- they are deferred features with intact data plumbing.

---

## Missing Subsystems

### MS-1: No player-facing scene interaction
- **subsystem:** Players can view the active scene via WebSocket sync but cannot interact with it (no drag, no add, no modify)
- **actor:** player
- **ptu_basis:** PTU scenes are GM-managed narrative tools. Players observe but do not manipulate the scene layout. This is working as designed.
- **impact:** Low -- by design, players observe scenes through the player view. No PTU rule requires player scene editing.

### MS-2: Terrain and modifier UI deferred
- **subsystem:** Scene terrains and modifiers have DB storage (JSON fields), API serialization, and TypeScript types, but no UI for viewing or editing in any view
- **actor:** gm
- **ptu_basis:** PTU terrains (grassy/electric/psychic/misty) affect move power and battle mechanics. Scene-level terrain could provide context before encounter conversion. Modifiers could represent custom environmental effects.
- **impact:** Medium -- terrain data flows through the full stack (DB -> API -> store) but is invisible. The `Scene.terrains` column persists data that no one can see or change through the UI. The `SceneModifier` type exists but is unused.

### MS-3: No scene template/preset system
- **subsystem:** No ability to save or load scene templates for recurring locations (unlike encounter templates which have a full CRUD system)
- **actor:** gm
- **ptu_basis:** PTU campaigns revisit locations (towns, gyms, routes, Pokemon Centers). A template system would speed up repeated scene setup.
- **impact:** Low-medium -- GM must manually recreate scenes for recurring locations.

### MS-4: No weather effect propagation preview
- **subsystem:** Scene weather is stored and displayed visually, and the from-scene conversion copies weather to the encounter, but there is no UI in the scene editor showing what mechanical effects the selected weather will have in combat
- **actor:** gm
- **ptu_basis:** PTU weather has significant combat effects (Hail/Sandstorm damage, type move boosts, ability interactions). Knowing the mechanical implications during scene setup would help GMs plan encounters.
- **impact:** Low -- weather does propagate correctly to encounters. The gap is informational (no preview of mechanical effects in the scene editor).

### MS-5: No scene-to-scene navigation or campaign timeline
- **subsystem:** Scenes are flat list items with no ordering, linking, or timeline relationship
- **actor:** gm
- **ptu_basis:** PTU campaigns progress through narrative scenes. A timeline or scene-linking system would help GMs plan session flow.
- **impact:** Low -- scenes function independently. GM uses scene names for organization.
