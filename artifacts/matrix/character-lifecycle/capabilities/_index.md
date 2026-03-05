---
domain: character-lifecycle
artifact_type: capability-catalog
generated: 2026-03-05
status: complete
capability_count: 91
---

# Character-Lifecycle Capability Catalog

Complete catalog of all app capabilities in the character-lifecycle domain, covering character creation, editing, level-up, equipment, healing, XP, import/export, and player view.

## Prisma Models

### character-lifecycle-C001: HumanCharacter Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` (model HumanCharacter)
- **game_concept:** Trainer / NPC entity
- **description:** Core data model for all human characters (players, NPCs, trainers). 40+ fields covering identity, stats, combat state, classes, skills, features, edges, capabilities, equipment, inventory, AP tracking, XP, healing counters, and avatar.
- **inputs:** N/A (schema definition)
- **outputs:** N/A (schema definition)
- **accessible_from:** all (underlies all character operations)

Key fields: id, name, characterType (player|npc|trainer), playedBy, level, hp/attack/defense/specialAttack/specialDefense/speed, currentHp, maxHp, trainerClasses (JSON), skills (JSON), features (JSON), edges (JSON), capabilities (JSON), equipment (JSON EquipmentSlots), inventory (JSON), money, statusConditions (JSON), stageModifiers (JSON), injuries, temporaryHp, drainedAp, boundAp, currentAp, avatarUrl, trainerXp, ownedSpecies (JSON), isInLibrary, notes. Relations: pokemon (Pokemon[]).

---

## API Endpoints

### character-lifecycle-C002: List Characters
- **type:** api-endpoint
- **location:** `app/server/api/characters/index.get.ts`
- **game_concept:** Character library browsing
- **description:** Lists all library characters (isInLibrary=true) with Pokemon summaries, sorted by name.
- **inputs:** None (query all)
- **outputs:** Serialized Character[] with pokemon summaries (id, species, nickname)
- **accessible_from:** gm

### character-lifecycle-C003: Create Character
- **type:** api-endpoint
- **location:** `app/server/api/characters/index.post.ts`
- **game_concept:** Character creation
- **description:** Creates a new HumanCharacter. Computes maxHp via PTU formula (level*2 + hp*3 + 10).
- **inputs:** Body: name, characterType, level, stats, skills, trainerClasses, features, edges, equipment, inventory, money, avatarUrl, background, personality, goals, location, notes, capabilities
- **outputs:** Serialized Character with pokemon
- **accessible_from:** gm

### character-lifecycle-C004: Get Character
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].get.ts`
- **game_concept:** Character detail view
- **description:** Fetches a single character by ID with all linked Pokemon.
- **inputs:** Path param: id
- **outputs:** Serialized Character with pokemon
- **accessible_from:** gm, player

### character-lifecycle-C005: Update Character
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].put.ts`
- **game_concept:** Character editing
- **description:** Partial update of any character field. Auto-stringifies JSON fields, clamps AP to valid range via calculateMaxAp.
- **inputs:** Path param: id; Body: partial character fields
- **outputs:** Serialized Character with pokemon
- **accessible_from:** gm

### character-lifecycle-C006: Delete Character
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].delete.ts`
- **game_concept:** Character removal
- **description:** Deletes a character. First unlinks all owned Pokemon (sets ownerId=null), then deletes the HumanCharacter record.
- **inputs:** Path param: id
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### character-lifecycle-C007: List Player Characters
- **type:** api-endpoint
- **location:** `app/server/api/characters/players.get.ts`
- **game_concept:** Player character roster
- **description:** Lists all player-type characters (characterType='player', isInLibrary=true) with full Pokemon team data.
- **inputs:** None
- **outputs:** Player summaries with parsed trainerClasses and Pokemon array (id, species, nickname, level, types, currentHp, maxHp, shiny, spriteUrl)
- **accessible_from:** gm, group, player

### character-lifecycle-C008: Import Character from CSV
- **type:** api-endpoint
- **location:** `app/server/api/characters/import-csv.post.ts`
- **game_concept:** Character import from spreadsheet
- **description:** Imports a character from CSV content. Auto-detects sheet type (trainer or pokemon), parses, creates entity in DB.
- **inputs:** Body: `{ csvContent: string }`
- **outputs:** `{ type: 'trainer'|'pokemon', data: { id, name, level, ... } }`
- **accessible_from:** gm

### character-lifecycle-C009: Player View
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/player-view.get.ts`
- **game_concept:** Player character sheet data
- **description:** Returns full character + Pokemon team in a single request optimized for Player View.
- **inputs:** Path param: id
- **outputs:** `{ character: {..., pokemonIds}, pokemon: Pokemon[] }`
- **accessible_from:** player

### character-lifecycle-C010: Get Equipment
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/equipment.get.ts`
- **game_concept:** Equipment inspection
- **description:** Returns equipment slots with computed aggregate bonuses (DR, evasion, stat bonuses) and granted capabilities.
- **inputs:** Path param: id
- **outputs:** `{ slots: EquipmentSlots, aggregateBonuses, grantedCapabilities }`
- **accessible_from:** gm

### character-lifecycle-C011: Update Equipment
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/equipment.put.ts`
- **game_concept:** Equip/unequip items
- **description:** Equips/unequips items. Validates via Zod schema, enforces slot-key match, handles two-handed auto-clear.
- **inputs:** Path param: id; Body: `{ slots: { [slotName]: EquippedItem | null } }`
- **outputs:** `{ slots, aggregateBonuses, grantedCapabilities }`
- **accessible_from:** gm

### character-lifecycle-C012: Rest Healing
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/rest.post.ts`
- **game_concept:** Short rest (30 min)
- **description:** Applies 30 minutes of rest healing. Heals 1/16th maxHp per period, blocked if 5+ injuries or at daily 480-min cap.
- **inputs:** Path param: id
- **outputs:** `{ hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining }`
- **accessible_from:** gm, player

### character-lifecycle-C013: Extended Rest
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/extended-rest.post.ts`
- **game_concept:** Extended rest (4-8 hours)
- **description:** Applies extended rest (configurable via decree-018). Heals HP, clears persistent statuses, restores drained AP (bound AP preserved per decree-016), refreshes daily-frequency Pokemon moves.
- **inputs:** Path param: id; Body: `{ duration?: number }`
- **outputs:** `{ duration, hpHealed, newHp, clearedStatuses, apRestored, boundAp, restMinutesToday, restMinutesRemaining, pokemonMoveRefresh }`
- **accessible_from:** gm, player

### character-lifecycle-C014: Pokemon Center Healing
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/pokemon-center.post.ts`
- **game_concept:** Full Pokemon Center healing
- **description:** Restores HP to effective max, clears all status conditions, heals injuries (max 3/day). Does NOT restore drained AP.
- **inputs:** Path param: id
- **outputs:** `{ hpHealed, newHp, effectiveMaxHp, injuriesHealed, injuriesRemaining, clearedStatuses, healingTime, healingTimeDescription, atDailyInjuryLimit }`
- **accessible_from:** gm, player

### character-lifecycle-C015: New Day Reset
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/new-day.post.ts`
- **game_concept:** Daily counter reset
- **description:** Resets daily healing counters (restMinutesToday, injuriesHealedToday, drainedAp, currentAp). Resets daily Pokemon move usage. Bound AP intentionally NOT reset (decree-016).
- **inputs:** Path param: id
- **outputs:** Counter values + pokemonReset count
- **accessible_from:** gm

### character-lifecycle-C016: Heal Injury
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/heal-injury.post.ts`
- **game_concept:** Injury recovery
- **description:** Heals one injury via natural healing (24h cooldown) or AP drain (costs 2 AP). Daily limit: 3 injuries/day.
- **inputs:** Path param: id; Body: `{ method?: 'natural' | 'drain_ap' }`
- **outputs:** `{ injuriesHealed, injuries, drainedAp?, currentAp?, injuriesHealedToday }`
- **accessible_from:** gm

### character-lifecycle-C017: Award Trainer XP
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/xp.post.ts`
- **game_concept:** Trainer experience / level-up
- **description:** Awards or deducts trainer XP. Amount must be integer, non-zero, range [-100, 100]. Auto-levels when bank >= 10. Broadcasts character_update via WebSocket on level-up.
- **inputs:** Path param: id; Body: `{ amount: number, reason?: string }`
- **outputs:** `{ previousXp, previousLevel, xpAdded, newXp, newLevel, levelsGained, character }`
- **accessible_from:** gm

### character-lifecycle-C018: Get XP History
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/xp-history.get.ts`
- **game_concept:** XP tracking
- **description:** Returns current XP state. No server-side history stored (P0 implementation).
- **inputs:** Path param: id
- **outputs:** `{ trainerXp, level, xpToNextLevel, ownedSpecies[] }`
- **accessible_from:** gm

---

## Services

### character-lifecycle-C019: Build Human Entity from Record
- **type:** service-function
- **location:** `app/server/services/entity-builder.service.ts:buildHumanEntityFromRecord`
- **game_concept:** Data transformation
- **description:** Transforms a raw Prisma HumanCharacter DB record into a typed HumanCharacter entity, parsing all JSON fields.
- **inputs:** PrismaHumanRecord
- **outputs:** HumanCharacter
- **accessible_from:** api-only (internal service)

### character-lifecycle-C020: Build Pokemon Entity from Record
- **type:** service-function
- **location:** `app/server/services/entity-builder.service.ts:buildPokemonEntityFromRecord`
- **game_concept:** Data transformation
- **description:** Transforms a raw Prisma Pokemon DB record into a typed Pokemon entity, parsing all JSON fields.
- **inputs:** PrismaPokemonRecord
- **outputs:** Pokemon
- **accessible_from:** api-only (internal service)

### character-lifecycle-C021: Sync Entity to Database
- **type:** service-function
- **location:** `app/server/services/entity-update.service.ts:syncEntityToDatabase`
- **game_concept:** Combat state persistence
- **description:** Syncs combat state changes back to the DB for either Pokemon or HumanCharacter entities.
- **inputs:** Combatant, EntityUpdateData
- **outputs:** void (side effect: DB update)
- **accessible_from:** api-only (internal service, called by combat endpoints)

### character-lifecycle-C022: Sync Damage to Database
- **type:** service-function
- **location:** `app/server/services/entity-update.service.ts:syncDamageToDatabase`
- **game_concept:** Damage persistence
- **description:** Persists damage results (HP + temp HP) to DB.
- **inputs:** Combatant, newHp, newTempHp
- **outputs:** void
- **accessible_from:** api-only (internal service)

### character-lifecycle-C023: Sync Healing to Database
- **type:** service-function
- **location:** `app/server/services/entity-update.service.ts:syncHealingToDatabase`
- **game_concept:** Healing persistence
- **description:** Persists healing results to DB.
- **inputs:** Combatant, currentHp, temporaryHp
- **outputs:** void
- **accessible_from:** api-only (internal service)

### character-lifecycle-C024: Sync Status to Database
- **type:** service-function
- **location:** `app/server/services/entity-update.service.ts:syncStatusToDatabase`
- **game_concept:** Status condition persistence
- **description:** Persists status condition changes to DB.
- **inputs:** Combatant, StatusCondition[]
- **outputs:** void
- **accessible_from:** api-only (internal service)

### character-lifecycle-C025: Sync Stages to Database
- **type:** service-function
- **location:** `app/server/services/entity-update.service.ts:syncStagesToDatabase`
- **game_concept:** Combat stage persistence
- **description:** Persists combat stage modifier changes to DB.
- **inputs:** Combatant, StageModifiers
- **outputs:** void
- **accessible_from:** api-only (internal service)

### character-lifecycle-C026: Detect CSV Sheet Type
- **type:** service-function
- **location:** `app/server/services/csv-import.service.ts:detectSheetType`
- **game_concept:** Import format detection
- **description:** Inspects CSV headers to determine sheet type (trainer or pokemon).
- **inputs:** rows: string[][]
- **outputs:** 'trainer' | 'pokemon' | 'unknown'
- **accessible_from:** api-only (internal service)

### character-lifecycle-C027: Parse Trainer Sheet
- **type:** service-function
- **location:** `app/server/services/csv-import.service.ts:parseTrainerSheet`
- **game_concept:** Trainer CSV parsing
- **description:** Extracts trainer data (name, playedBy, age, gender, level, stats, maxHp, skills) from CSV rows.
- **inputs:** rows: string[][]
- **outputs:** ParsedTrainer
- **accessible_from:** api-only (internal service)

### character-lifecycle-C028: Create Trainer from CSV
- **type:** service-function
- **location:** `app/server/services/csv-import.service.ts:createTrainerFromCSV`
- **game_concept:** Trainer creation from import
- **description:** Persists parsed trainer to database.
- **inputs:** ParsedTrainer
- **outputs:** `{ id, name, level, playedBy }`
- **accessible_from:** api-only (internal service)

---

## Composables

### character-lifecycle-C029: Character Creation Composable
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts:useCharacterCreation`
- **game_concept:** Character creation workflow
- **description:** Manages the full character creation form state including stat allocation, skill backgrounds, class/feature/edge selection, biography, and validation. Enforces decree-027 (Pathetic skills cannot be raised during creation).
- **inputs:** None (reactive form state)
- **outputs:** form, statPointsUsed, statPointsRemaining, computedStats, maxHp, evasions, incrementStat/decrementStat, applyBackground/clearBackground/enableCustomBackground, setSkillRank, addPatheticSkill/removePatheticSkill, addClass/removeClass, addFeature/removeFeature, setTrainingFeature, addEdge/removeEdge/addSkillEdge, statWarnings/skillWarnings/classFeatureEdgeWarnings/allWarnings, sectionCompletion, buildCreatePayload
- **accessible_from:** gm

### character-lifecycle-C030: Character Export/Import Composable
- **type:** composable-function
- **location:** `app/composables/useCharacterExportImport.ts:useCharacterExportImport`
- **game_concept:** Character data portability
- **description:** Handles JSON export/import for characters. Export fetches from `/api/player/export/:id` and triggers file download. Import parses JSON, POSTs to `/api/player/import/:id`, reports conflicts.
- **inputs:** characterId: Ref<string>, characterName: Ref<string>
- **outputs:** exporting, importing, operationResult, operationResultClass, handleExport, handleImportFile, clearOperationResult
- **accessible_from:** player

---

## Utilities

### character-lifecycle-C031: Validate Stat Allocation
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts:validateStatAllocation`
- **game_concept:** Character creation rules enforcement
- **description:** Validates stat point total against level budget, per-stat cap at level 1 (max 5).
- **inputs:** statPoints: Record<string, number>, level: number
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via useCharacterCreation)

### character-lifecycle-C032: Validate Skill Background
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts:validateSkillBackground`
- **game_concept:** Background skill rules enforcement
- **description:** Validates background skill allocation (1 Adept, 1 Novice, 3 Pathetic), skill rank cap by level, decree-027 Pathetic-locked skill edge violations.
- **inputs:** skills: Record<string, string>, level: number, edges?: string[], patheticSkills?: string[]
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via useCharacterCreation)

### character-lifecycle-C033: Validate Edges and Features
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts:validateEdgesAndFeatures`
- **game_concept:** Class/feature/edge rules enforcement
- **description:** Validates edge count, feature count, class count (max 4), milestone bonus info.
- **inputs:** edges: string[], features: string[], trainerClasses: string[], level: number
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via useCharacterCreation)

---

## Store Actions & Getters

### character-lifecycle-C034: Load Library
- **type:** store-action
- **location:** `app/stores/library.ts:useLibraryStore.loadLibrary`
- **game_concept:** Character library initialization
- **description:** Fetches all characters + Pokemon from `/api/characters` and `/api/pokemon`, populates local state.
- **inputs:** None
- **outputs:** void (populates store state)
- **accessible_from:** gm

### character-lifecycle-C035: Create Human (Store)
- **type:** store-action
- **location:** `app/stores/library.ts:useLibraryStore.createHuman`
- **game_concept:** Character creation
- **description:** POSTs to `/api/characters`, pushes new character to local state.
- **inputs:** Character creation data
- **outputs:** Created character
- **accessible_from:** gm

### character-lifecycle-C036: Update Human (Store)
- **type:** store-action
- **location:** `app/stores/library.ts:useLibraryStore.updateHuman`
- **game_concept:** Character editing
- **description:** PUTs to `/api/characters/[id]`, patches local state.
- **inputs:** id, partial character data
- **outputs:** Updated character
- **accessible_from:** gm

### character-lifecycle-C037: Delete Human (Store)
- **type:** store-action
- **location:** `app/stores/library.ts:useLibraryStore.deleteHuman`
- **game_concept:** Character removal
- **description:** DELETEs `/api/characters/[id]`, removes from local state.
- **inputs:** id
- **outputs:** void
- **accessible_from:** gm

### character-lifecycle-C038: Link Pokemon to Trainer
- **type:** store-action
- **location:** `app/stores/library.ts:useLibraryStore.linkPokemonToTrainer`
- **game_concept:** Pokemon ownership
- **description:** POSTs `/api/pokemon/[id]/link` to assign Pokemon to a trainer.
- **inputs:** pokemonId, trainerId
- **outputs:** void
- **accessible_from:** gm

### character-lifecycle-C039: Unlink Pokemon
- **type:** store-action
- **location:** `app/stores/library.ts:useLibraryStore.unlinkPokemon`
- **game_concept:** Pokemon release/transfer
- **description:** POSTs `/api/pokemon/[id]/unlink` to remove Pokemon from trainer.
- **inputs:** pokemonId
- **outputs:** void
- **accessible_from:** gm

### character-lifecycle-C040: Filtered Humans (Getter)
- **type:** store-getter
- **location:** `app/stores/library.ts:useLibraryStore.filteredHumans`
- **game_concept:** Library filtering
- **description:** Filters humans by search text and characterType with sorting.
- **inputs:** Filter state (reactive)
- **outputs:** Filtered HumanCharacter[]
- **accessible_from:** gm

### character-lifecycle-C041: Filtered Players (Getter)
- **type:** store-getter
- **location:** `app/stores/library.ts:useLibraryStore.filteredPlayers`
- **game_concept:** Player roster
- **description:** Subset of filteredHumans where characterType === 'player'.
- **inputs:** Filter state (reactive)
- **outputs:** Filtered player HumanCharacter[]
- **accessible_from:** gm

### character-lifecycle-C042: Grouped NPCs by Location (Getter)
- **type:** store-getter
- **location:** `app/stores/library.ts:useLibraryStore.groupedNpcsByLocation`
- **game_concept:** NPC organization
- **description:** NPCs grouped by location field for collapsible display sections.
- **inputs:** Filter state (reactive)
- **outputs:** Record<string, HumanCharacter[]>
- **accessible_from:** gm

### character-lifecycle-C043: Get Human by ID (Getter)
- **type:** store-getter
- **location:** `app/stores/library.ts:useLibraryStore.getHumanById`
- **game_concept:** Character lookup
- **description:** Lookup single human by ID from local state.
- **inputs:** id
- **outputs:** HumanCharacter | undefined
- **accessible_from:** gm

### character-lifecycle-C044: Get Pokemon by Owner (Getter)
- **type:** store-getter
- **location:** `app/stores/library.ts:useLibraryStore.getPokemonByOwner`
- **game_concept:** Trainer's team lookup
- **description:** All Pokemon owned by a given trainer from local state.
- **inputs:** ownerId
- **outputs:** Pokemon[]
- **accessible_from:** gm

### character-lifecycle-C045: Set Library Filters
- **type:** store-action
- **location:** `app/stores/library.ts:useLibraryStore.setFilters`
- **game_concept:** Library search
- **description:** Updates library filter/search state.
- **inputs:** Filter criteria
- **outputs:** void
- **accessible_from:** gm

### character-lifecycle-C046: Set Player Identity
- **type:** store-action
- **location:** `app/stores/playerIdentity.ts:usePlayerIdentityStore.setIdentity`
- **game_concept:** Player character selection
- **description:** Sets the player's selected character for the session.
- **inputs:** characterId, characterName
- **outputs:** void
- **accessible_from:** player

### character-lifecycle-C047: Set Character Data (Player)
- **type:** store-action
- **location:** `app/stores/playerIdentity.ts:usePlayerIdentityStore.setCharacterData`
- **game_concept:** Player data loading
- **description:** Loads full character + Pokemon data into player store.
- **inputs:** character, pokemon[]
- **outputs:** void
- **accessible_from:** player

### character-lifecycle-C048: Clear Player Identity
- **type:** store-action
- **location:** `app/stores/playerIdentity.ts:usePlayerIdentityStore.clearIdentity`
- **game_concept:** Character switching
- **description:** Resets player identity to allow character re-selection.
- **inputs:** None
- **outputs:** void
- **accessible_from:** player

### character-lifecycle-C049: Is Identified (Getter)
- **type:** store-getter
- **location:** `app/stores/playerIdentity.ts:usePlayerIdentityStore.isIdentified`
- **game_concept:** Player session state
- **description:** Whether a player has selected a character.
- **inputs:** None (reactive)
- **outputs:** boolean
- **accessible_from:** player

### character-lifecycle-C050: Distribute Trainer XP (Store)
- **type:** store-action
- **location:** `app/stores/encounterXp.ts:useEncounterXpStore.distributeTrainerXp`
- **game_concept:** Post-encounter trainer XP
- **description:** Batch distributes trainer XP to multiple trainers after an encounter.
- **inputs:** Distribution params
- **outputs:** void
- **accessible_from:** gm

### character-lifecycle-C051: Scene Character Added (Group)
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts:useGroupViewTabsStore.handleSceneCharacterAdded`
- **game_concept:** Scene character tracking
- **description:** Adds character to active scene's character list via WebSocket event.
- **inputs:** Character added data
- **outputs:** void
- **accessible_from:** group

### character-lifecycle-C052: Scene Character Removed (Group)
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts:useGroupViewTabsStore.handleSceneCharacterRemoved`
- **game_concept:** Scene character tracking
- **description:** Removes character from active scene via WebSocket event.
- **inputs:** Character removed data
- **outputs:** void
- **accessible_from:** group

---

## Components

### character-lifecycle-C053: Human Card
- **type:** component
- **location:** `app/components/character/HumanCard.vue`
- **game_concept:** Trainer summary display
- **description:** Displays a trainer summary card (name, level, HP, location, team sprites) that links to `/gm/characters/[id]`.
- **inputs:** Props: character data
- **outputs:** Navigation to character detail
- **accessible_from:** gm

### character-lifecycle-C054: Pokemon Card
- **type:** component
- **location:** `app/components/character/PokemonCard.vue`
- **game_concept:** Pokemon summary display
- **description:** Displays a Pokemon summary card (species, level, HP, origin) that links to `/gm/pokemon/[id]`.
- **inputs:** Props: Pokemon data
- **outputs:** Navigation to Pokemon detail
- **accessible_from:** gm

### character-lifecycle-C055: Character Modal (ORPHAN)
- **type:** component
- **location:** `app/components/character/CharacterModal.vue`
- **game_concept:** Character view/edit modal
- **description:** Modal for viewing/editing a character or Pokemon with tabbed interface. Contains TrainerSpritePicker, TrainerXpPanel, LevelUpModal. NOT rendered by any page or parent component — dead code.
- **inputs:** Props: character/pokemon data
- **outputs:** Edit events
- **accessible_from:** none (dead code)

### character-lifecycle-C056: Trainer XP Panel
- **type:** component
- **location:** `app/components/character/TrainerXpPanel.vue`
- **game_concept:** XP management UI
- **description:** XP award UI with preset amounts and custom input; emits `level-up` and `xp-changed` events.
- **inputs:** Props: character XP data
- **outputs:** Events: level-up, xp-changed
- **accessible_from:** gm

### character-lifecycle-C057: Equipment Catalog Browser
- **type:** component
- **location:** `app/components/character/EquipmentCatalogBrowser.vue`
- **game_concept:** Equipment shopping/equipping
- **description:** Searchable equipment catalog with slot filtering for equipping items.
- **inputs:** Props: slot filter, current equipment
- **outputs:** Event: equipped
- **accessible_from:** gm

### character-lifecycle-C058: Trainer Sprite Picker
- **type:** component
- **location:** `app/components/character/TrainerSpritePicker.vue`
- **game_concept:** Trainer avatar selection
- **description:** Modal grid of trainer sprite options for avatar selection.
- **inputs:** v-model: sprite key
- **outputs:** Selected sprite key
- **accessible_from:** gm

### character-lifecycle-C059: Capabilities Display
- **type:** component
- **location:** `app/components/character/CapabilitiesDisplay.vue`
- **game_concept:** Trainer movement/capability view
- **description:** Read-only display of derived trainer capabilities (Overland, Swim, etc.).
- **inputs:** Props: capabilities array
- **outputs:** Display only
- **accessible_from:** gm

### character-lifecycle-C060: Human Stats Tab
- **type:** component
- **location:** `app/components/character/tabs/HumanStatsTab.vue`
- **game_concept:** Trainer stat sheet
- **description:** Displays/edits trainer stats (HP bar, base stats, combat stages); includes CapabilitiesDisplay.
- **inputs:** Props: character data
- **outputs:** Stat update events
- **accessible_from:** gm

### character-lifecycle-C061: Human Classes Tab
- **type:** component
- **location:** `app/components/character/tabs/HumanClassesTab.vue`
- **game_concept:** Trainer class/feature view
- **description:** Read-only display of trainer classes, features, edges, capabilities.
- **inputs:** Props: character data
- **outputs:** Display only
- **accessible_from:** gm

### character-lifecycle-C062: Human Skills Tab
- **type:** component
- **location:** `app/components/character/tabs/HumanSkillsTab.vue`
- **game_concept:** Trainer skill ranks
- **description:** Read-only display of trainer skill ranks.
- **inputs:** Props: character skills
- **outputs:** Display only
- **accessible_from:** gm

### character-lifecycle-C063: Human Pokemon Tab
- **type:** component
- **location:** `app/components/character/tabs/HumanPokemonTab.vue`
- **game_concept:** Trainer's Pokemon team list
- **description:** Read-only list of trainer's owned Pokemon with sprites.
- **inputs:** Props: pokemon array
- **outputs:** Display only
- **accessible_from:** gm

### character-lifecycle-C064: Human Equipment Tab
- **type:** component
- **location:** `app/components/character/tabs/HumanEquipmentTab.vue`
- **game_concept:** Equipment slot management
- **description:** Equipment slot management with catalog browser. Emits equipment-changed and equipment-changed-in-encounter events.
- **inputs:** Props: character equipment data
- **outputs:** Events: equipment-changed, equipment-changed-in-encounter
- **accessible_from:** gm

### character-lifecycle-C065: Notes Tab
- **type:** component
- **location:** `app/components/character/tabs/NotesTab.vue`
- **game_concept:** Character notes/biography
- **description:** Editable notes/background/personality/goals fields for both humans and Pokemon.
- **inputs:** Props: character data
- **outputs:** Note update events
- **accessible_from:** gm

### character-lifecycle-C066: Pokemon Stats Tab
- **type:** component
- **location:** `app/components/character/tabs/PokemonStatsTab.vue`
- **game_concept:** Pokemon stat block
- **description:** Displays Pokemon stat block with HP, nature, stat stages.
- **inputs:** Props: Pokemon data
- **outputs:** Display only
- **accessible_from:** gm

### character-lifecycle-C067: Pokemon Moves Tab
- **type:** component
- **location:** `app/components/character/tabs/PokemonMovesTab.vue`
- **game_concept:** Pokemon moveset view
- **description:** Read-only list of Pokemon moves with type/frequency/damage/range.
- **inputs:** Props: Pokemon moves
- **outputs:** Display only
- **accessible_from:** gm

### character-lifecycle-C068: Pokemon Skills Tab
- **type:** component
- **location:** `app/components/character/tabs/PokemonSkillsTab.vue`
- **game_concept:** Pokemon skills/training
- **description:** Read-only Pokemon skills with tutor points, training XP, egg groups.
- **inputs:** Props: Pokemon data
- **outputs:** Display only
- **accessible_from:** gm

### character-lifecycle-C069: Pokemon Abilities Tab
- **type:** component
- **location:** `app/components/character/tabs/PokemonAbilitiesTab.vue`
- **game_concept:** Pokemon ability list
- **description:** Read-only list of Pokemon abilities.
- **inputs:** Props: Pokemon abilities
- **outputs:** Display only
- **accessible_from:** gm

### character-lifecycle-C070: Pokemon Capabilities Tab
- **type:** component
- **location:** `app/components/character/tabs/PokemonCapabilitiesTab.vue`
- **game_concept:** Pokemon movement capabilities
- **description:** Read-only display of Pokemon movement capabilities (Overland, Swim, etc.).
- **inputs:** Props: Pokemon capabilities
- **outputs:** Display only
- **accessible_from:** gm

### character-lifecycle-C071: Quick Create Form
- **type:** component
- **location:** `app/components/create/QuickCreateForm.vue`
- **game_concept:** NPC scaffolding
- **description:** Minimal NPC creation form (name, type, level, sprite, location); emits submit with QuickCreatePayload.
- **inputs:** None (form state)
- **outputs:** Event: submit (QuickCreatePayload)
- **accessible_from:** gm

### character-lifecycle-C072: Stat Allocation Section
- **type:** component
- **location:** `app/components/create/StatAllocationSection.vue`
- **game_concept:** Character creation stats
- **description:** Stat point allocation with derived combat stats (HP, evasions).
- **inputs:** Props: form state from useCharacterCreation
- **outputs:** Stat changes via composable
- **accessible_from:** gm

### character-lifecycle-C073: Skill Background Section
- **type:** component
- **location:** `app/components/create/SkillBackgroundSection.vue`
- **game_concept:** Character creation skills
- **description:** Skill rank assignment with background presets and pathetic skill management.
- **inputs:** Props: form state from useCharacterCreation
- **outputs:** Skill changes via composable
- **accessible_from:** gm

### character-lifecycle-C074: Class Feature Section
- **type:** component
- **location:** `app/components/create/ClassFeatureSection.vue`
- **game_concept:** Character creation classes
- **description:** Trainer class picking and feature assignment.
- **inputs:** Props: form state from useCharacterCreation
- **outputs:** Class/feature changes via composable
- **accessible_from:** gm

### character-lifecycle-C075: Edge Selection Section
- **type:** component
- **location:** `app/components/create/EdgeSelectionSection.vue`
- **game_concept:** Character creation edges
- **description:** Edge selection with skill-edge validation.
- **inputs:** Props: form state from useCharacterCreation
- **outputs:** Edge changes via composable
- **accessible_from:** gm

### character-lifecycle-C076: Biography Section
- **type:** component
- **location:** `app/components/create/BiographySection.vue`
- **game_concept:** Character creation biography
- **description:** Optional biography fields (age, gender, height, weight, story, personality, goals, money).
- **inputs:** Props: form state from useCharacterCreation
- **outputs:** Biography changes via composable
- **accessible_from:** gm

### character-lifecycle-C077: Level Up Modal
- **type:** component
- **location:** `app/components/levelup/LevelUpModal.vue`
- **game_concept:** Trainer level-up wizard
- **description:** Multi-step level-up wizard for trainers; receives character + targetLevel, emits complete with updated data.
- **inputs:** Props: character, targetLevel
- **outputs:** Event: complete (updated character data)
- **accessible_from:** gm

### character-lifecycle-C078: Level Up Stat Section
- **type:** component
- **location:** `app/components/levelup/LevelUpStatSection.vue`
- **game_concept:** Level-up stat allocation
- **description:** Stat point allocation within the level-up flow.
- **inputs:** Props: level-up form state
- **outputs:** Stat changes
- **accessible_from:** gm

### character-lifecycle-C079: Level Up Class Section
- **type:** component
- **location:** `app/components/levelup/LevelUpClassSection.vue`
- **game_concept:** Level-up class selection
- **description:** Class selection during level-up.
- **inputs:** Props: level-up form state
- **outputs:** Class changes
- **accessible_from:** gm

### character-lifecycle-C080: Level Up Feature Section
- **type:** component
- **location:** `app/components/levelup/LevelUpFeatureSection.vue`
- **game_concept:** Level-up feature selection
- **description:** Feature selection during level-up.
- **inputs:** Props: level-up form state
- **outputs:** Feature changes
- **accessible_from:** gm

### character-lifecycle-C081: Level Up Edge Section
- **type:** component
- **location:** `app/components/levelup/LevelUpEdgeSection.vue`
- **game_concept:** Level-up edge selection
- **description:** Edge selection during level-up.
- **inputs:** Props: level-up form state
- **outputs:** Edge changes
- **accessible_from:** gm

### character-lifecycle-C082: Level Up Milestone Section
- **type:** component
- **location:** `app/components/levelup/LevelUpMilestoneSection.vue`
- **game_concept:** Milestone tracking
- **description:** Milestone tracking during level-up.
- **inputs:** Props: level-up form state
- **outputs:** Milestone changes
- **accessible_from:** gm

### character-lifecycle-C083: Level Up Summary
- **type:** component
- **location:** `app/components/levelup/LevelUpSummary.vue`
- **game_concept:** Level-up confirmation
- **description:** Summary of all level-up changes before confirmation.
- **inputs:** Props: level-up form state
- **outputs:** Display only
- **accessible_from:** gm

### character-lifecycle-C084: Player Character Sheet
- **type:** component
- **location:** `app/components/player/PlayerCharacterSheet.vue`
- **game_concept:** Player character view
- **description:** Self-contained read-only trainer sheet (stats, skills, features, equipment, inventory) with JSON export/import capability.
- **inputs:** Props: character data
- **outputs:** Event: imported
- **accessible_from:** player

### character-lifecycle-C085: Player Identity Picker
- **type:** component
- **location:** `app/components/player/PlayerIdentityPicker.vue`
- **game_concept:** Player character selection
- **description:** Character selection screen for player identity at session start.
- **inputs:** Props: available player characters
- **outputs:** Event: select (characterId)
- **accessible_from:** player

### character-lifecycle-C086: Player Healing Panel
- **type:** component
- **location:** `app/components/player/PlayerHealingPanel.vue`
- **game_concept:** Player-side healing actions
- **description:** Player-side healing actions (rest, Pokemon Center, items).
- **inputs:** Props: character data
- **outputs:** Healing action events
- **accessible_from:** player

---

## Types

### character-lifecycle-C087: Character Type Definitions
- **type:** constant
- **location:** `app/types/character.ts`
- **game_concept:** Character data contracts
- **description:** Core type definitions: CharacterType, SkillRank, Stats, EquipmentSlot, EquippedItem, EquipmentSlots, InventoryItem, HumanCharacter, QuickCreatePayload, and Pokemon-related types (PokemonType, PokemonOrigin, PokemonCapabilities, Move, Ability, Nature, Pokemon).
- **inputs:** N/A (type definitions)
- **outputs:** N/A (type definitions)
- **accessible_from:** all (shared types)

---

## WebSocket Events

### character-lifecycle-C088: Character Update Broadcast
- **type:** websocket-event
- **location:** `app/server/api/characters/[id]/xp.post.ts` (broadcast on level-up)
- **game_concept:** Real-time character sync
- **description:** Broadcasts `character_update` event via WebSocket when a character levels up, enabling real-time sync across GM, player, and group views.
- **inputs:** Character ID, updated character data
- **outputs:** WebSocket message to connected clients
- **accessible_from:** gm, group, player (receivers)

---

## Page Integration

### character-lifecycle-C089: GM Sheets Page
- **type:** component
- **location:** `app/pages/gm/sheets.vue`
- **game_concept:** Character library browser
- **description:** Character library browser page. Uses HumanCard, PokemonCard. Links to /gm/create and /gm/characters/[id].
- **inputs:** Library store data
- **outputs:** Navigation
- **accessible_from:** gm

### character-lifecycle-C090: GM Create Page
- **type:** component
- **location:** `app/pages/gm/create.vue`
- **game_concept:** Character creation page
- **description:** Full character creation page with quick/full modes. Uses QuickCreateForm, TrainerSpritePicker, all creation section components.
- **inputs:** useCharacterCreation composable
- **outputs:** Created character (navigates to detail)
- **accessible_from:** gm

### character-lifecycle-C091: GM Character Detail Page
- **type:** component
- **location:** `app/pages/gm/characters/[id].vue`
- **game_concept:** Character detail/edit page
- **description:** Individual trainer detail/edit page. Uses TrainerSpritePicker, TrainerXpPanel, CapabilitiesDisplay, LevelUpModal, and all character tab components.
- **inputs:** Route param: id
- **outputs:** Character updates via store
- **accessible_from:** gm

---

## Capability Chains

### Chain 1: Character Creation (Full)
`StatAllocationSection` + `SkillBackgroundSection` + `ClassFeatureSection` + `EdgeSelectionSection` + `BiographySection` -> `useCharacterCreation` -> `buildCreatePayload()` -> `library.createHuman()` -> `POST /api/characters` -> `prisma.humanCharacter.create()` -> DB
- **Accessibility:** gm only

### Chain 2: Character Creation (Quick)
`QuickCreateForm` -> `library.createHuman()` -> `POST /api/characters` -> `prisma.humanCharacter.create()` -> DB
- **Accessibility:** gm only

### Chain 3: Character Editing
`HumanStatsTab` / `NotesTab` / tabs -> `library.updateHuman()` -> `PUT /api/characters/[id]` -> `prisma.humanCharacter.update()` -> DB
- **Accessibility:** gm only

### Chain 4: Character Viewing (GM)
`gm/sheets.vue` -> `library.loadLibrary()` -> `GET /api/characters` -> `buildHumanEntityFromRecord()` -> DB
`gm/characters/[id].vue` -> `GET /api/characters/[id]` -> `buildHumanEntityFromRecord()` -> DB
- **Accessibility:** gm only

### Chain 5: Character Viewing (Player)
`PlayerIdentityPicker` -> `playerIdentity.setIdentity()` -> `GET /api/characters/[id]/player-view` -> `buildHumanEntityFromRecord()` -> DB -> `playerIdentity.setCharacterData()` -> `PlayerCharacterSheet` (read-only)
- **Accessibility:** player only

### Chain 6: Character Viewing (Group)
`LobbyView` -> `GET /api/characters/players` -> DB -> display
- **Accessibility:** group only

### Chain 7: Level-Up
`TrainerXpPanel` -> `POST /api/characters/[id]/xp` -> DB + WebSocket broadcast -> `LevelUpModal` -> `LevelUpStatSection` + `LevelUpClassSection` + `LevelUpFeatureSection` + `LevelUpEdgeSection` + `LevelUpMilestoneSection` -> `LevelUpSummary` -> `PUT /api/characters/[id]` -> DB
- **Accessibility:** gm only (XP award + level-up wizard)

### Chain 8: Equipment Management
`HumanEquipmentTab` -> `EquipmentCatalogBrowser` -> `PUT /api/characters/[id]/equipment` -> DB -> aggregateBonuses + grantedCapabilities
- **Accessibility:** gm only

### Chain 9: Rest Healing
`PlayerHealingPanel` / GM UI -> `POST /api/characters/[id]/rest` -> rest-healing.service -> DB
- **Accessibility:** gm, player

### Chain 10: Extended Rest
GM UI / `PlayerHealingPanel` -> `POST /api/characters/[id]/extended-rest` -> rest-healing.service -> DB (+ refreshes Pokemon daily moves)
- **Accessibility:** gm, player

### Chain 11: Pokemon Center Healing
GM UI / `PlayerHealingPanel` -> `POST /api/characters/[id]/pokemon-center` -> DB
- **Accessibility:** gm, player

### Chain 12: New Day Reset
GM UI -> `POST /api/characters/[id]/new-day` -> DB (resets dailies + Pokemon move usage)
- **Accessibility:** gm only

### Chain 13: Injury Healing
GM UI -> `POST /api/characters/[id]/heal-injury` -> DB
- **Accessibility:** gm only

### Chain 14: CSV Import
GM UI -> `POST /api/characters/import-csv` -> `csv-import.service` -> `createTrainerFromCSV()` -> DB
- **Accessibility:** gm only

### Chain 15: JSON Export/Import (Player)
`PlayerCharacterSheet` -> `useCharacterExportImport` -> `GET /api/player/export/[id]` (export) / `POST /api/player/import/[id]` (import)
- **Accessibility:** player only

### Chain 16: Character Deletion
`library.deleteHuman()` -> `DELETE /api/characters/[id]` -> unlink Pokemon -> delete record -> DB
- **Accessibility:** gm only

### Chain 17: Trainer Sprite Selection
`TrainerSpritePicker` -> `library.updateHuman()` -> `PUT /api/characters/[id]` (avatarUrl field) -> DB
- **Accessibility:** gm only

### Chain 18: Post-Encounter XP Distribution
`encounterXp.distributeTrainerXp()` -> `POST /api/characters/[id]/xp` (batch) -> DB + WebSocket
- **Accessibility:** gm only

---

## Accessibility Summary

| Access Level | Capabilities | Count |
|---|---|---|
| **GM only** | C002, C003, C005, C006, C008, C010, C011, C015-C018, C029, C031-C045, C050, C053-C083, C089-C091 | 62 |
| **Player only** | C009, C030, C046-C049, C084-C086 | 8 |
| **GM + Player** | C004, C012-C014 | 4 |
| **GM + Group + Player** | C007, C088 | 2 |
| **Group only** | C051, C052 | 2 |
| **All views** | C001, C087 | 2 |
| **API-only (internal)** | C019-C028 | 10 |
| **Dead code** | C055 | 1 |

---

## Orphans

### C055: CharacterModal (Dead Code)
Full character view/edit modal with tabbed interface, TrainerSpritePicker, TrainerXpPanel, and LevelUpModal integration. Defined in `app/components/character/CharacterModal.vue` but not rendered by any page or parent component. Likely a legacy component superseded by the inline character detail page (`gm/characters/[id].vue`).

---

## Missing Subsystems

### 1. No Player-Side Character Creation
- **subsystem:** Players cannot create their own characters
- **actor:** player
- **ptu_basis:** PTU character creation (Ch. 4) is a collaborative process where players choose stats, skills, classes, and features
- **impact:** GM must create all player characters on their behalf; players cannot experiment with builds or prepare characters before sessions

### 2. No Player-Side Level-Up
- **subsystem:** LevelUpModal only accessible from GM view; players cannot manage their own level-up choices
- **actor:** player
- **ptu_basis:** PTU level-up involves player decisions: stat allocation, class selection, feature picks, edge choices
- **impact:** GM must proxy all level-up decisions; players cannot level up between sessions

### 3. No Player-Side Stat/Skill Editing
- **subsystem:** PlayerCharacterSheet is fully read-only; no player editing of stats, skills, features, or equipment
- **actor:** player
- **ptu_basis:** Players manage their own character sheets in tabletop play
- **impact:** Every character change requires GM intervention

### 4. No Player-Side Equipment Management
- **subsystem:** Equipment slot management (HumanEquipmentTab + EquipmentCatalogBrowser) only in GM view
- **actor:** player
- **ptu_basis:** Players buy, sell, equip, and unequip items during gameplay
- **impact:** Players cannot equip items or adjust loadout without GM assistance

### 5. No Player-Side Inventory Management
- **subsystem:** No UI for players to add/remove/use inventory items
- **actor:** player
- **ptu_basis:** Players use consumable items (potions, status healers, Poke Balls) during play
- **impact:** Players cannot use items from their inventory without GM proxying

### 6. No Character Transfer/Trade System
- **subsystem:** No UI workflow for transferring Pokemon ownership between trainers
- **actor:** both
- **ptu_basis:** Pokemon trading is a core social mechanic in PTU
- **impact:** Pokemon transfers require GM to use link/unlink store actions directly; no trade confirmation or history

### 7. No Injury Healing UI for Players
- **subsystem:** Heal-injury endpoint exists but no player-facing UI to trigger it
- **actor:** player
- **ptu_basis:** Injury healing (natural or AP drain) is a player-managed resource decision
- **impact:** Players must ask GM to heal their injuries

### 8. No New Day Reset UI for Players
- **subsystem:** New-day endpoint is GM-only with no player access
- **actor:** player
- **ptu_basis:** Daily resets affect player resource management (rest minutes, injury limits, AP)
- **impact:** Minor — typically a GM-initiated action, but players have no visibility into when resets occur
