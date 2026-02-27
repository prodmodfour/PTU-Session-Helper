---
domain: character-lifecycle
mapped_at: 2026-02-28T03:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 72
files_read: 42
---

# App Capabilities: Character Lifecycle

> Re-mapped capability catalog for the character-lifecycle domain.
> Includes: branching class specialization (decree-022), Pathetic skill enforcement (ptu-rule-092),
> Pathetic skill edge guard (decree-027), trainer class associated skills (ptu-rule-078),
> alert replacement (refactoring-091), character creation validation, equipment system,
> trainer sprites, CSV import, player-view endpoint.

## Prisma Model

### character-lifecycle-C001
- **name:** HumanCharacter Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model HumanCharacter
- **game_concept:** Trainer / NPC data record
- **description:** Core data model for human characters (players, NPCs, trainers). Stores stats, classes, skills, features, edges, equipment, inventory, status conditions, stage modifiers, injuries, rest/healing tracking, AP pool, avatar, background/biography, and library membership.
- **inputs:** All fields defined on the model (id, name, characterType, playedBy, age, gender, height, weight, level, stats, currentHp, maxHp, trainerClasses, skills, features, edges, equipment, inventory, money, statusConditions, stageModifiers, injuries, temporaryHp, rest tracking fields, drainedAp, boundAp, currentAp, avatarUrl, background, personality, goals, location, isInLibrary, notes, pokemon relation)
- **outputs:** Persisted character record with all fields
- **accessible_from:** gm, player (read-only via player-view endpoint), api-only

### character-lifecycle-C002
- **name:** HumanCharacter.avatarUrl field
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` -- HumanCharacter.avatarUrl
- **game_concept:** Trainer sprite / avatar
- **description:** Optional string storing either a Showdown sprite key (e.g., 'acetrainer') or a full URL. Used by useTrainerSprite composable to resolve display URL.
- **inputs:** String (sprite key or URL) or null
- **outputs:** Persisted avatar reference
- **accessible_from:** gm, player

### character-lifecycle-C003
- **name:** HumanCharacter.trainerClasses field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` -- HumanCharacter.trainerClasses
- **game_concept:** PTU Trainer Classes (max 4), with branching specializations (decree-022)
- **description:** JSON-stringified array of class name strings. Branching classes include specialization suffix (e.g., 'Type Ace: Fire'). Stored as text, parsed on read.
- **inputs:** Array of class name strings (including specialization suffix for branching classes)
- **outputs:** JSON string in DB, parsed array on API read
- **accessible_from:** gm, player (read-only)

### character-lifecycle-C004
- **name:** HumanCharacter.skills field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` -- HumanCharacter.skills
- **game_concept:** PTU Trainer Skills (17 skills with ranks)
- **description:** JSON-stringified object mapping skill names to rank strings (Pathetic/Untrained/Novice/Adept/Expert/Master).
- **inputs:** Record<string, SkillRank>
- **outputs:** JSON string in DB, parsed object on API read
- **accessible_from:** gm, player (read-only)

### character-lifecycle-C005
- **name:** HumanCharacter.features field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` -- HumanCharacter.features
- **game_concept:** PTU Trainer Features
- **description:** JSON-stringified array of feature name strings. Includes class features and training feature.
- **inputs:** Array of feature name strings
- **outputs:** JSON string in DB, parsed array on API read
- **accessible_from:** gm, player (read-only)

### character-lifecycle-C006
- **name:** HumanCharacter.edges field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` -- HumanCharacter.edges
- **game_concept:** PTU Trainer Edges (including Skill Edges)
- **description:** JSON-stringified array of edge name strings. Skill Edges formatted as "Skill Edge: [Skill Name]".
- **inputs:** Array of edge name strings
- **outputs:** JSON string in DB, parsed array on API read
- **accessible_from:** gm, player (read-only)

### character-lifecycle-C007
- **name:** HumanCharacter.equipment field (JSON)
- **type:** prisma-field
- **location:** `app/prisma/schema.prisma` -- HumanCharacter.equipment
- **game_concept:** PTU Equipment Slots (head, body, mainHand, offHand, feet, accessory)
- **description:** JSON-stringified EquipmentSlots object mapping slot names to equipped item objects with bonuses.
- **inputs:** EquipmentSlots object
- **outputs:** JSON string in DB, parsed EquipmentSlots on API read
- **accessible_from:** gm, player (read-only)

## API Endpoints

### character-lifecycle-C010
- **name:** List Characters API
- **type:** api-endpoint
- **location:** `app/server/api/characters/index.get.ts`
- **game_concept:** Character library browsing
- **description:** Returns all characters where isInLibrary=true, ordered by name, with summary Pokemon data. Uses serializeCharacterSummary.
- **inputs:** None (no query params)
- **outputs:** `{ success, data: CharacterSummary[] }` -- id, name, characterType, level, location, avatarUrl, pokemon summaries
- **accessible_from:** gm

### character-lifecycle-C011
- **name:** Create Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/index.post.ts`
- **game_concept:** Character creation
- **description:** Creates a new HumanCharacter with all PTU fields. Computes maxHp via PTU Trainer HP formula (Level * 2 + HP Stat * 3 + 10). Accepts nested stats object or flat stat fields. Stringifies JSON fields (classes, skills, features, edges, equipment, inventory, statusConditions, stageModifiers).
- **inputs:** Body: name, characterType, playedBy, age, gender, height, weight, level, stats/hp/attack/etc., maxHp, currentHp, trainerClasses[], skills{}, features[], edges[], equipment{}, inventory[], money, statusConditions[], stageModifiers{}, avatarUrl, background, personality, goals, location, isInLibrary, notes
- **outputs:** `{ success, data: Character }` -- full serialized character with pokemon
- **accessible_from:** gm

### character-lifecycle-C012
- **name:** Get Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].get.ts`
- **game_concept:** Character sheet reading
- **description:** Returns a single character by ID with all linked Pokemon. Uses serializeCharacter for JSON field parsing.
- **inputs:** URL param: id
- **outputs:** `{ success, data: Character }` -- full character with parsed JSON fields and pokemon
- **accessible_from:** gm, player

### character-lifecycle-C013
- **name:** Update Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].put.ts`
- **game_concept:** Character sheet editing
- **description:** Partial update of any character fields. Handles nested stats object, JSON-stringifies arrays/objects, validates AP fields against level-based maxAp with clamping. Imports calculateMaxAp from restHealing.
- **inputs:** URL param: id. Body: any subset of character fields
- **outputs:** `{ success, data: Character }` -- updated character
- **accessible_from:** gm

### character-lifecycle-C014
- **name:** Delete Character API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id].delete.ts`
- **game_concept:** Character removal
- **description:** Deletes a character. First unlinks all owned Pokemon (sets ownerId to null), then deletes the character record.
- **inputs:** URL param: id
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### character-lifecycle-C015
- **name:** List Player Characters API
- **type:** api-endpoint
- **location:** `app/server/api/characters/players.get.ts`
- **game_concept:** Player roster for encounters/scenes/player-identity
- **description:** Returns all characters where isInLibrary=true AND characterType='player', with full Pokemon team data (id, species, nickname, level, types, HP, shiny, sprite).
- **inputs:** None
- **outputs:** `{ success, data: PlayerCharacter[] }` -- id, name, playedBy, level, currentHp, maxHp, avatarUrl, trainerClasses, pokemon[]
- **accessible_from:** gm, player

### character-lifecycle-C016
- **name:** CSV Import API
- **type:** api-endpoint
- **location:** `app/server/api/characters/import-csv.post.ts`
- **game_concept:** Bulk character import from spreadsheets
- **description:** Accepts raw CSV text, auto-detects trainer vs Pokemon sheet type, parses the sheet, and creates the appropriate record. Delegates to csv-import.service.ts.
- **inputs:** Body: { csvContent: string }
- **outputs:** `{ success, type: 'trainer'|'pokemon', data: Character|Pokemon }`
- **accessible_from:** gm

### character-lifecycle-C017
- **name:** Player View API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/player-view.get.ts`
- **game_concept:** Player character sheet access
- **description:** Returns a full character with all linked Pokemon data in a single request. Splits response into { character, pokemon } structure. Used by Player View to load player sheet and team.
- **inputs:** URL param: id
- **outputs:** `{ success, data: { character, pokemon[] } }`
- **accessible_from:** player

### character-lifecycle-C018
- **name:** Get Equipment API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/equipment.get.ts`
- **game_concept:** Equipment slot reading with bonus computation
- **description:** Returns current equipment slots and aggregate bonuses (DR, evasion, stat bonuses) computed via computeEquipmentBonuses.
- **inputs:** URL param: id
- **outputs:** `{ success, data: { slots: EquipmentSlots, aggregateBonuses } }`
- **accessible_from:** gm

### character-lifecycle-C019
- **name:** Update Equipment API
- **type:** api-endpoint
- **location:** `app/server/api/characters/[id]/equipment.put.ts`
- **game_concept:** Equipment management (equip/unequip with Zod validation)
- **description:** Equips or unequips items with full Zod schema validation. Validates slot assignment, handles two-handed item auto-clear, returns updated slots with aggregate bonuses. Each item validated for name, slot, DR, evasion, stat bonus, conditional DR, speed CS, ready mechanics.
- **inputs:** URL param: id. Body: { slots: { [slotName]: EquippedItem | null } }
- **outputs:** `{ success, data: { slots, aggregateBonuses } }`
- **accessible_from:** gm

## Constants

### character-lifecycle-C020
- **name:** Trainer Classes Constant
- **type:** constant
- **location:** `app/constants/trainerClasses.ts` -- TRAINER_CLASSES
- **game_concept:** PTU Trainer Class definitions (Chapter 4)
- **description:** Array of 37 trainer class definitions with name, category (6 categories: Introductory, Battling Style, Specialist Team, Professional, Fighter, Supernatural), associated skills, and description. Includes isBranching flag for classes supporting specialization.
- **inputs:** N/A (constant data)
- **outputs:** TrainerClassDef[]
- **accessible_from:** gm (via character creation UI)

### character-lifecycle-C021
- **name:** Branching Class Specializations (decree-022)
- **type:** constant
- **location:** `app/constants/trainerClasses.ts` -- BRANCHING_CLASS_SPECIALIZATIONS
- **game_concept:** Per-class specialization options for branching classes
- **description:** Maps 4 branching classes to their valid specialization lists: Type Ace (18 Pokemon types), Stat Ace (5 combat stats), Style Expert (5 contest stats), Researcher (9 Fields of Study). Per decree-022 and decree-026.
- **inputs:** N/A (constant data)
- **outputs:** Record<string, readonly string[]>
- **accessible_from:** gm (via character creation UI)

### character-lifecycle-C022
- **name:** Branching Class Utility Functions
- **type:** utility
- **location:** `app/constants/trainerClasses.ts` -- getBranchingSpecializations, hasBaseClass, getBaseClassName, getSpecialization, getClassesByCategory
- **game_concept:** Branching class name parsing and categorization
- **description:** Pure utility functions for working with branching class entries. getBranchingSpecializations returns valid options. hasBaseClass checks prefix match. getBaseClassName strips specialization suffix. getSpecialization extracts suffix. getClassesByCategory groups all classes.
- **inputs:** Class entry strings
- **outputs:** Various (specializations array, boolean, string, grouped record)
- **accessible_from:** gm (via composable/component)

### character-lifecycle-C023
- **name:** Trainer Stats Constants
- **type:** constant
- **location:** `app/constants/trainerStats.ts` -- BASE_HP, BASE_OTHER, TOTAL_STAT_POINTS, MAX_POINTS_PER_STAT
- **game_concept:** PTU stat allocation rules (Chapter 2)
- **description:** Starting stat bases (HP=10, other=5), total points at level 1 (10), per-stat cap at level 1 (5). Used by character creation.
- **inputs:** N/A
- **outputs:** Numeric constants
- **accessible_from:** gm (via character creation)

### character-lifecycle-C024
- **name:** Stat Points Level Scaling
- **type:** utility
- **location:** `app/constants/trainerStats.ts` -- getStatPointsForLevel
- **game_concept:** PTU stat point progression by level
- **description:** Returns total stat points available at a given level: 10 + (level - 1). Does not include optional milestone bonuses.
- **inputs:** level: number
- **outputs:** number (total stat points)
- **accessible_from:** gm (via character creation)

### character-lifecycle-C025
- **name:** Skill Rank Cap by Level
- **type:** utility
- **location:** `app/constants/trainerStats.ts` -- getMaxSkillRankForLevel, isSkillRankAboveCap
- **game_concept:** PTU skill rank progression (p.19)
- **description:** Returns maximum skill rank for a level (Novice at L1, Adept at L2, Expert at L6, Master at L12). isSkillRankAboveCap validates a rank against the level cap.
- **inputs:** level: number, rank: string
- **outputs:** SkillRankName, boolean
- **accessible_from:** gm (via character creation validation)

### character-lifecycle-C026
- **name:** Expected Edges/Features for Level
- **type:** utility
- **location:** `app/constants/trainerStats.ts` -- getExpectedEdgesForLevel, getExpectedFeaturesForLevel
- **game_concept:** PTU edge/feature progression (p.19-21)
- **description:** Calculates expected edges (4 base + 1 per even level + bonus skill edges at L2/6/12) and features (5 + 1 per odd level from 3 onwards) at a given level.
- **inputs:** level: number
- **outputs:** { base, bonusSkillEdges, total } for edges; number for features
- **accessible_from:** gm (via character creation validation)

### character-lifecycle-C027
- **name:** Trainer Skills Reference
- **type:** constant
- **location:** `app/constants/trainerSkills.ts` -- PTU_SKILL_CATEGORIES, PTU_ALL_SKILLS, SKILL_RANKS
- **game_concept:** PTU 17 trainer skills with categories and dice
- **description:** All 17 PTU skills organized by Body/Mind/Spirit categories. SKILL_RANKS maps rank names to values and dice expressions. SKILL_RANK_LEVEL_REQS defines level prerequisites. getDefaultSkills returns all-Untrained baseline.
- **inputs:** N/A
- **outputs:** Skill name arrays, rank definitions, default skill object
- **accessible_from:** gm (via character creation)

### character-lifecycle-C028
- **name:** Trainer Backgrounds
- **type:** constant
- **location:** `app/constants/trainerBackgrounds.ts` -- SAMPLE_BACKGROUNDS
- **game_concept:** PTU Background presets (Chapter 2 p.14)
- **description:** 11 sample backgrounds from PTU Core, each with adeptSkill, noviceSkill, and 3 patheticSkills. Used by character creation background selection.
- **inputs:** N/A
- **outputs:** TrainerBackground[]
- **accessible_from:** gm (via character creation)

### character-lifecycle-C029
- **name:** Trainer Class Associated Skills (ptu-rule-078)
- **type:** constant
- **location:** `app/constants/trainerClasses.ts` -- TrainerClassDef.associatedSkills
- **game_concept:** Class-skill associations from PTU Chapter 4
- **description:** Each trainer class definition includes an associatedSkills array listing which PTU skills are associated with that class. Used for informational display during character creation (H1+H2: display & Skill Edge suggestion).
- **inputs:** N/A (per class definition)
- **outputs:** string[] of skill names per class
- **accessible_from:** gm (via character creation UI)

## Composable

### character-lifecycle-C030
- **name:** useCharacterCreation Composable
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts`
- **game_concept:** Full PTU character creation workflow
- **description:** Manages reactive form state for character creation: basic info, background/skills, stat allocation, classes/features/edges, biography. Tracks stat points, computes HP/evasions, applies backgrounds, validates all sections, builds API payload. Supports both quick and full creation modes.
- **inputs:** N/A (self-contained reactive state)
- **outputs:** form, computed stats/warnings/sections, mutation functions, buildCreatePayload
- **accessible_from:** gm

### character-lifecycle-C031
- **name:** Background Application Logic
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts` -- applyBackground, clearBackground, enableCustomBackground
- **game_concept:** PTU Background skill modification (p.14)
- **description:** Applies a preset background (sets 1 Adept, 1 Novice, 3 Pathetic skills), clears background to all-Untrained, or enables custom background mode for manual skill assignment.
- **inputs:** TrainerBackground (for applyBackground)
- **outputs:** Mutates form.skills, form.patheticSkills, form.backgroundPreset
- **accessible_from:** gm

### character-lifecycle-C032
- **name:** Pathetic Skill Enforcement (ptu-rule-092, decree-027)
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts` -- setSkillRank, addPatheticSkill, removePatheticSkill
- **game_concept:** Pathetic skill lock during character creation
- **description:** Tracks skills marked Pathetic during background selection. setSkillRank blocks raising Pathetic-locked skills above Pathetic. addPatheticSkill marks a skill as Pathetic. removePatheticSkill removes the lock (with safety check for outstanding Skill Edges). Per PTU pp.14,18 and decree-027.
- **inputs:** skill: PtuSkillName, rank: SkillRank
- **outputs:** Error string or null; mutates form.skills and form.patheticSkills
- **accessible_from:** gm

### character-lifecycle-C033
- **name:** Skill Edge with Pathetic Guard (decree-027)
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts` -- addSkillEdge
- **game_concept:** Skill Edge that raises skill rank with Pathetic blocking
- **description:** Adds a Skill Edge that bumps skill rank by one step. Blocks Pathetic-locked skills from being raised via Skill Edge during creation (decree-027). Validates against skill rank cap for the current level. Formats edge as "Skill Edge: [Skill Name]".
- **inputs:** skill: PtuSkillName
- **outputs:** Error string or null; mutates form.skills and form.edges
- **accessible_from:** gm

### character-lifecycle-C034
- **name:** Trainer Class Management (decree-022)
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts` -- addClass, removeClass
- **game_concept:** Add/remove trainer classes with specialization support
- **description:** Adds a trainer class (enforces MAX_TRAINER_CLASSES=4 cap, blocks exact duplicates). For branching classes per decree-022, className includes specialization suffix (e.g., 'Type Ace: Fire'). Different specializations of the same base class are allowed.
- **inputs:** className: string
- **outputs:** Mutates form.trainerClasses
- **accessible_from:** gm

### character-lifecycle-C035
- **name:** Feature Management
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts` -- addFeature, removeFeature, setTrainingFeature, allFeatures
- **game_concept:** PTU class features and training feature
- **description:** Manages class features and the single training feature slot. allFeatures computed combines both. addFeature adds to class features, removeFeature removes by index, setTrainingFeature sets the training slot.
- **inputs:** featureName: string, index: number
- **outputs:** Mutates form.features, form.trainingFeature; allFeatures computed
- **accessible_from:** gm

### character-lifecycle-C036
- **name:** Edge Management with Skill Edge Revert
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts` -- addEdge, removeEdge
- **game_concept:** PTU Edge selection and skill edge reversion
- **description:** addEdge appends an edge. removeEdge removes by index and, if the removed edge is a Skill Edge, automatically reverts the associated skill rank down one step (rank progression revert).
- **inputs:** edgeName: string, index: number
- **outputs:** Mutates form.edges, form.skills (for skill edge revert)
- **accessible_from:** gm

### character-lifecycle-C037
- **name:** Stat Allocation
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts` -- incrementStat, decrementStat, computedStats, maxHp, evasions
- **game_concept:** PTU stat point distribution (Chapter 2 p.15)
- **description:** Manages stat point allocation with per-stat cap at level 1 (MAX_POINTS_PER_STAT=5), total budget tracking (statPointsUsed/Remaining). Computes derived stats (base + points), PTU HP formula (level*2 + hpStat*3 + 10), and evasions (floor(stat/5), capped at +6).
- **inputs:** stat: keyof StatPoints
- **outputs:** computedStats, maxHp, evasions, statPointsUsed, statPointsRemaining
- **accessible_from:** gm

### character-lifecycle-C038
- **name:** Section Completion Tracking
- **type:** composable-function
- **location:** `app/composables/useCharacterCreation.ts` -- sectionCompletion
- **game_concept:** Character creation progress indicators
- **description:** Computed record of 6 sections (basicInfo, background, edges, classes, stats, biography) with label, complete boolean, and detail string showing progress counts. Used by full create mode UI indicators.
- **inputs:** N/A (reads form state)
- **outputs:** Record<string, SectionCompletion>
- **accessible_from:** gm

## Validation Utilities

### character-lifecycle-C040
- **name:** Stat Allocation Validation
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts` -- validateStatAllocation
- **game_concept:** PTU stat point rule enforcement
- **description:** Validates stat point total against expected points for level, and per-stat cap at level 1. Returns CreationWarning[] (soft warnings, not errors). Includes informational messages about milestone bonuses for higher-level characters.
- **inputs:** statPoints: Record<string, number>, level: number
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via composable)

### character-lifecycle-C041
- **name:** Skill Background Validation (ptu-rule-092, decree-027)
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts` -- validateSkillBackground
- **game_concept:** PTU background skill count validation with Pathetic edge guard
- **description:** Validates exactly 1 Adept, 1 Novice, 3 Pathetic skills in background. Warns if Skill Edges reference Pathetic-locked skills (decree-027). Validates skill rank cap based on level. Severity downgrades to 'info' when Skill Edges modify counts. Includes informational messages about rank caps and Pathetic persistence.
- **inputs:** skills: Record, level: number, edges: string[], patheticSkills: string[]
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via composable)

### character-lifecycle-C042
- **name:** Edges and Features Validation
- **type:** utility
- **location:** `app/utils/characterCreationValidation.ts` -- validateEdgesAndFeatures
- **game_concept:** PTU edge/feature/class count validation
- **description:** Validates edge count (4 starting + bonus per level), feature count (4 + training + level progression), and class cap (max 4). Includes milestone bonus informational messages for levels 5/10/20/30/40.
- **inputs:** edges: string[], features: string[], trainerClasses: string[], level: number
- **outputs:** CreationWarning[]
- **accessible_from:** gm (via composable)

## Store

### character-lifecycle-C045
- **name:** Library Store
- **type:** store-action
- **location:** `app/stores/library.ts` -- useLibraryStore
- **game_concept:** Character and Pokemon library management
- **description:** Pinia store managing humans[] and pokemon[] state with full CRUD operations. Actions: loadLibrary, createHuman, updateHuman, deleteHuman, createPokemon, updatePokemon, deletePokemon, linkPokemonToTrainer, unlinkPokemon. Getters: filteredHumans/Pokemon (search, type, sort), getHumanById, getPokemonById, getPokemonByOwner, filteredPlayers, groupedNpcsByLocation, groupedPokemonByLocation.
- **inputs:** Various per action (character data, pokemon data, filters)
- **outputs:** Reactive state arrays, filtered/grouped getters
- **accessible_from:** gm

### character-lifecycle-C046
- **name:** Library Filter System
- **type:** store-getter
- **location:** `app/stores/library.ts` -- filteredHumans, filteredPokemon, allFiltered
- **game_concept:** Library browsing with search and type filters
- **description:** Computed getters filtering humans by search (name, location) and characterType, and Pokemon by search (species, nickname, location), pokemonType, and origin. Both support sorting by name or level in asc/desc order.
- **inputs:** filters: LibraryFilters (search, type, characterType, pokemonType, pokemonOrigin, sortBy, sortOrder)
- **outputs:** Filtered arrays of HumanCharacter or Pokemon
- **accessible_from:** gm

### character-lifecycle-C047
- **name:** NPC Location Grouping
- **type:** store-getter
- **location:** `app/stores/library.ts` -- groupedNpcsByLocation
- **game_concept:** NPC organization by game location
- **description:** Groups non-player characters by their location field into { location, humans[] } entries, sorted alphabetically with empty-location at end.
- **inputs:** N/A (reads state)
- **outputs:** Array of { location: string, humans: HumanCharacter[] }
- **accessible_from:** gm

## Components

### character-lifecycle-C050
- **name:** CharacterModal Component
- **type:** component
- **location:** `app/components/character/CharacterModal.vue`
- **game_concept:** Character/Pokemon sheet view and edit modal
- **description:** Full-sheet modal for viewing/editing both human characters and Pokemon. Human sheet has 6 tabs (Stats, Classes, Skills, Equipment, Pokemon, Notes). Pokemon sheet has 6 tabs (Stats, Moves, Abilities, Capabilities, Skills, Notes). Supports edit mode with save emit, trainer sprite picker integration, and WebSocket broadcast for equipment changes during encounters.
- **inputs:** Props: character (Pokemon|HumanCharacter), mode ('view'|'edit')
- **outputs:** Emits: close, save(data)
- **accessible_from:** gm

### character-lifecycle-C051
- **name:** HumanCard Component
- **type:** component
- **location:** `app/components/character/HumanCard.vue`
- **game_concept:** Character library card display
- **description:** Card component displaying character summary: avatar (trainer sprite), name, type badge (Player/NPC), level, location, HP/Speed stats, and Pokemon team sprites. Links to /gm/characters/:id.
- **inputs:** Props: human: HumanCharacter
- **outputs:** Navigation to character detail page
- **accessible_from:** gm

### character-lifecycle-C052
- **name:** TrainerSpritePicker Component
- **type:** component
- **location:** `app/components/character/TrainerSpritePicker.vue`
- **game_concept:** Avatar selection for trainers
- **description:** Modal sprite picker with search, category tabs, and sprite grid. Uses Showdown sprite keys. Allows selecting from categorized trainer sprites. Bound via v-model to avatarUrl.
- **inputs:** Props: show (boolean), modelValue (string|null)
- **outputs:** Emits: close, update:modelValue
- **accessible_from:** gm

### character-lifecycle-C053
- **name:** HumanStatsTab Component
- **type:** component
- **location:** `app/components/character/tabs/HumanStatsTab.vue`
- **game_concept:** Trainer stat display (HP, Atk, Def, SpA, SpD, Spe)
- **description:** Displays 6 combat stats with HP current/max. Shows height and weight fields. Supports edit mode for modifying stats inline.
- **inputs:** Props: human, currentHp, maxHp, editData, isEditing
- **outputs:** Emits: update:editData
- **accessible_from:** gm

### character-lifecycle-C054
- **name:** HumanClassesTab Component
- **type:** component
- **location:** `app/components/character/tabs/HumanClassesTab.vue`
- **game_concept:** Display trainer classes, features, and edges
- **description:** Read-only display of the character's trainer classes, features list, and edges list. Shows data from the character record.
- **inputs:** Props: trainerClasses, features, edges
- **outputs:** N/A (display only)
- **accessible_from:** gm

### character-lifecycle-C055
- **name:** HumanSkillsTab Component
- **type:** component
- **location:** `app/components/character/tabs/HumanSkillsTab.vue`
- **game_concept:** Display trainer skill ranks
- **description:** Displays the character's 17 PTU skills with their current ranks.
- **inputs:** Props: skills
- **outputs:** N/A (display only)
- **accessible_from:** gm

### character-lifecycle-C056
- **name:** HumanEquipmentTab Component
- **type:** component
- **location:** `app/components/character/tabs/HumanEquipmentTab.vue`
- **game_concept:** Equipment slot management
- **description:** Displays 6 equipment slots with equip/unequip actions. Integrates with EquipmentCatalogBrowser for item selection. Handles equipment changes via API and broadcasts via WebSocket when in an active encounter.
- **inputs:** Props: characterId, equipment, isInEncounter
- **outputs:** Emits: equipment-changed, equipment-changed-in-encounter
- **accessible_from:** gm

### character-lifecycle-C057
- **name:** EquipmentCatalogBrowser Component
- **type:** component
- **location:** `app/components/character/EquipmentCatalogBrowser.vue`
- **game_concept:** Equipment item browsing and selection
- **description:** Browse and select equipment items from a catalog. Used within the HumanEquipmentTab for equipping items.
- **inputs:** Equipment catalog data
- **outputs:** Selected item
- **accessible_from:** gm

### character-lifecycle-C058
- **name:** HumanPokemonTab Component
- **type:** component
- **location:** `app/components/character/tabs/HumanPokemonTab.vue`
- **game_concept:** Trainer's Pokemon team display
- **description:** Displays the character's linked Pokemon team within the character sheet.
- **inputs:** Props: pokemon[]
- **outputs:** N/A (display only)
- **accessible_from:** gm

### character-lifecycle-C059
- **name:** NotesTab Component
- **type:** component
- **location:** `app/components/character/tabs/NotesTab.vue`
- **game_concept:** Character/Pokemon notes and biography
- **description:** Editable notes tab. For humans, also shows background, personality, and goals fields. For Pokemon, shows held item.
- **inputs:** Props: isPokemon, isEditing, notes, background, personality, goals, heldItem
- **outputs:** Emits: update:notes, update:background, update:personality, update:goals
- **accessible_from:** gm

### character-lifecycle-C060
- **name:** PokemonCard Component
- **type:** component
- **location:** `app/components/character/PokemonCard.vue`
- **game_concept:** Pokemon library card display
- **description:** Card component displaying Pokemon summary with sprite, species, nickname, level, types, and basic stats.
- **inputs:** Props: pokemon
- **outputs:** Navigation or selection
- **accessible_from:** gm

### character-lifecycle-C061
- **name:** CapabilitiesDisplay Component
- **type:** component
- **location:** `app/components/character/CapabilitiesDisplay.vue`
- **game_concept:** Pokemon capability display
- **description:** Renders a Pokemon's movement capabilities (Overland, Swim, Burrow, Sky) and other capabilities in a structured display.
- **inputs:** Props: capabilities
- **outputs:** N/A (display only)
- **accessible_from:** gm

## WebSocket Events

### character-lifecycle-C065
- **name:** character_update WebSocket Event
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts` -- character_update
- **game_concept:** Real-time character sync between GM and Group views
- **description:** Broadcast event sent when a character is updated (e.g., equipment change during encounter). Relayed to all connected clients.
- **inputs:** { type: 'character_update', data: Character }
- **outputs:** Broadcast to all clients
- **accessible_from:** gm, group, player

## Capability Chains

### Chain 1: Character Creation (Full Create Mode)
1. **GM page** renders character creation form
2. **useCharacterCreation** composable manages form state, validation
3. **trainerBackgrounds** constant provides preset backgrounds
4. **trainerClasses** constant provides class definitions with branching specializations (decree-022)
5. **trainerStats** constant provides stat/edge/feature formulas
6. **trainerSkills** constant provides skill categories and ranks
7. **characterCreationValidation** utility validates all sections with Pathetic edge guard (decree-027)
8. **buildCreatePayload** assembles API body
9. **POST /api/characters** creates the DB record
- **Accessible from:** gm only

### Chain 2: Character Sheet View/Edit
1. **Library page** or **encounter** opens CharacterModal
2. **CharacterModal** displays tabs (Stats, Classes, Skills, Equipment, Pokemon, Notes)
3. **Tab components** render read-only or editable views
4. **Save** emits update data
5. **PUT /api/characters/:id** persists changes
6. **character_update** WebSocket event broadcasts (if in encounter)
- **Accessible from:** gm (edit), player (read-only via player-view)

### Chain 3: Equipment Management
1. **HumanEquipmentTab** renders equipment slots
2. **EquipmentCatalogBrowser** provides item selection
3. **PUT /api/characters/:id/equipment** validates with Zod schema, handles two-handed logic
4. **computeEquipmentBonuses** calculates aggregate bonuses
5. **character_update** WebSocket broadcast (if in encounter)
- **Accessible from:** gm only

### Chain 4: CSV Import
1. **GM page** provides CSV text input
2. **POST /api/characters/import-csv** detects sheet type
3. **csv-import.service** parses and creates record
- **Accessible from:** gm only

### Chain 5: Player View Character Access
1. **Player page** identifies character via playerIdentity store
2. **GET /api/characters/:id/player-view** returns character + Pokemon
3. **Player view** renders read-only character data
- **Accessible from:** player only

## Accessibility Summary

| View | Capabilities |
|------|-------------|
| gm-only | C010, C011, C013, C014, C016, C018, C019, C020-C042, C045-C047, C050-C061 (all creation, editing, library, equipment) |
| gm+player | C003-C006 (read-only), C012, C015, C065 |
| player-only | C017 (player-view endpoint) |
| api-only | None (all endpoints have at least one UI caller) |

## Missing Subsystems

### MS-1: Player Character Editing Interface
- **subsystem:** No player-facing character edit interface exists. Players can view their sheet but cannot update stats, skills, inventory, or equipment from the player view.
- **actor:** player
- **ptu_basis:** PTU is a pen-and-paper RPG where players manage their own character sheets -- leveling up, spending stat points, selecting features/edges, managing inventory.
- **impact:** The GM must proxy all character modifications. Players cannot level up, equip items, spend money, or update notes from their own device.

### MS-2: Player Character Creation Flow
- **subsystem:** No player-facing character creation wizard exists. Only the GM can create characters.
- **actor:** player
- **ptu_basis:** PTU Chapter 2 describes character creation as a player activity guided by the GM. Players choose their own backgrounds, stat allocations, classes, and features.
- **impact:** Players cannot create their own characters. The GM must enter all creation data on behalf of each player.

### MS-3: Inventory Management Interface
- **subsystem:** No dedicated inventory management UI exists. Inventory is stored as a JSON array but there is no component for viewing, adding, removing, or using items.
- **actor:** both
- **ptu_basis:** PTU has extensive item systems (medicines, Poke Balls, vitamins, TMs, evolution stones, hold items). Items affect combat, healing, and Pokemon management.
- **impact:** Items can only be managed by directly editing the character record JSON. No item catalog, no use/consume flow, no item-to-Pokemon assignment UI.

### MS-4: Money/Economy Interface
- **subsystem:** No money management UI exists beyond the creation form's starting money field. No shop/purchase flow.
- **actor:** both
- **ptu_basis:** PTU Core Chapter 5 covers economy, item purchasing, and trainer funds.
- **impact:** Money field exists on the character record but there is no UI for spending, earning, or tracking transactions.
