# Pokemon Lifecycle Domain — Application Capabilities

> Generated: 2026-02-28 | Source: deep-read of all pokemon-lifecycle source files

## Individual Capabilities

### pokemon-lifecycle-C001: Pokemon Data Generation
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` → `generatePokemonData()`
- **game_concept**: PTU Pokemon character sheet creation
- **description**: Pure data generation from species + level. Looks up SpeciesData for base stats, types, abilities, learnset, skills, capabilities, egg groups, size. Selects random nature and applies modifiers (+2/-2 non-HP, +1/-1 HP, min 1). Distributes stat points (level + 10) weighted by nature-adjusted base stats with Base Relations enforcement. Calculates HP via PTU formula: Level + (HP * 3) + 10. Selects up to 6 most recent moves from learnset. Picks random basic ability. Calculates tutor points: 1 + floor(level/5).
- **inputs**: GeneratePokemonInput { speciesName, level, nickname, origin, originLabel, overrideMoves, overrideAbilities }
- **outputs**: GeneratedPokemonData (complete character sheet data)
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C002: Pokemon DB Record Creation
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` → `createPokemonRecord()`
- **game_concept**: Pokemon persistence to database
- **description**: Creates a Pokemon DB record from generated data. Sets isInLibrary: true (visible in sheets). Stores nature, types, base stats, calculated stats, max HP, moves, abilities, capabilities, skills, egg groups, gender, shiny status, tutor points, origin, and notes. Resolves nickname via pokemon-nickname utility.
- **inputs**: GeneratePokemonInput, GeneratedPokemonData
- **outputs**: CreatedPokemon { id, species, level, nickname, data }
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C003: Generate and Create Pokemon
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` → `generateAndCreatePokemon()`
- **game_concept**: Combined generation + persistence entry point
- **description**: Primary entry point combining generatePokemonData() + createPokemonRecord() in one call. Used by wild spawn, template load, and other callers that need a ready-made Pokemon.
- **inputs**: GeneratePokemonInput
- **outputs**: CreatedPokemon
- **accessible_from**: api-only (used by wild-spawn, template load, from-scene endpoints)

### pokemon-lifecycle-C004: Pokemon Combatant Builder
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` → `buildPokemonCombatant()`
- **game_concept**: Pokemon → encounter combatant conversion
- **description**: Maps a newly created Pokemon into a full Combatant wrapper for encounter embedding. Converts CreatedPokemon to Pokemon entity, determines token size from species size, and delegates to buildCombatantFromEntity (canonical combatant builder).
- **inputs**: CreatedPokemon, side (string), position (optional)
- **outputs**: Combatant
- **accessible_from**: api-only (used by wild-spawn, combatants.post endpoints)

### pokemon-lifecycle-C005: Stat Point Distribution
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` → `distributeStatPoints()` (internal)
- **game_concept**: PTU stat point allocation (level + 10 points, Base Relations Rule)
- **description**: Distributes (level + 10) stat points weighted by base stats (random weighted allocation). Enforces PTU Base Relations Rule: the ordering of base stats from highest to lowest must be maintained. Stats with equal base values form a tier and may end up in any order.
- **inputs**: baseStats, level
- **outputs**: calculatedStats (all 6 stats with added points)
- **accessible_from**: api-only (internal function)

### pokemon-lifecycle-C006: Base Relations Enforcement
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` → `enforceBaseRelations()` (internal)
- **game_concept**: PTU Base Relations Rule (Core Chapter 5)
- **description**: Groups stats by base value into tiers, sorts added-point values descending, assigns to tiers top-down. Within each tier, shuffles to preserve randomness while ensuring cross-tier ordering is maintained.
- **inputs**: baseStats, distributedPoints, statKeys
- **outputs**: Reordered distributedPoints
- **accessible_from**: api-only (internal function)

### pokemon-lifecycle-C007: Move Selection from Learnset
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` → `selectMovesFromLearnset()` (internal)
- **game_concept**: PTU move learning from species learnset
- **description**: Selects up to 6 most recent moves from the species learnset at or below the given level. Fetches full MoveData from DB for each move (type, damage class, frequency, AC, DB, range, effect). Falls back to a stub if move not found.
- **inputs**: learnset (array of { level, move }), level
- **outputs**: MoveDetail[]
- **accessible_from**: api-only (internal function)

### pokemon-lifecycle-C008: Random Ability Selection
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` → `pickRandomAbility()` (internal)
- **game_concept**: PTU ability selection (Basic Abilities only for new Pokemon)
- **description**: Picks one random basic ability from the species ability list. PTU rules: new Pokemon get one ability from Basic Abilities only. Advanced Abilities available at Level 20+.
- **inputs**: abilityNames (string[]), numBasicAbilities (number)
- **outputs**: Array of { name, effect }
- **accessible_from**: api-only (internal function)

### pokemon-lifecycle-C009: Manual Pokemon Creation API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/index.post.ts`
- **game_concept**: Manual Pokemon creation with full stat control
- **description**: POST endpoint creating a Pokemon record from explicit data. Accepts all fields (species, level, stats, types, abilities, moves, etc.). Uses PTU HP formula for maxHp if not provided. Sets origin: 'manual' by default. Resolves nickname.
- **inputs**: Full Pokemon data body
- **outputs**: Serialized Pokemon record
- **accessible_from**: gm (via Pokemon management UI)

### pokemon-lifecycle-C010: Pokemon Update API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].put.ts`
- **game_concept**: Pokemon stat/data editing
- **description**: PUT endpoint updating any Pokemon fields. Supports partial updates: scalar fields (species, level, currentHp, maxHp, heldItem, etc.), nested objects (baseStats, currentStats, types, nature), JSON fields (abilities, moves, statusConditions, stageModifiers), healing-related tracking fields, display fields (spriteUrl, shiny, gender), and categorization (isInLibrary, origin, location, notes).
- **inputs**: pokemonId (URL param), partial update body
- **outputs**: Serialized updated Pokemon
- **accessible_from**: gm (via Pokemon sheet/edit UI)

### pokemon-lifecycle-C011: Pokemon Get API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].get.ts`
- **game_concept**: Pokemon data retrieval
- **description**: GET endpoint fetching a single Pokemon by ID with parsed JSON fields.
- **inputs**: pokemonId (URL param)
- **outputs**: Serialized Pokemon record
- **accessible_from**: gm, group, player

### pokemon-lifecycle-C012: Pokemon List API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/index.get.ts`
- **game_concept**: Pokemon listing/filtering
- **description**: GET endpoint listing Pokemon with optional filtering (by owner, library status, etc.).
- **inputs**: Query params for filtering
- **outputs**: Array of serialized Pokemon records
- **accessible_from**: gm, group, player

### pokemon-lifecycle-C013: Pokemon Delete API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].delete.ts`
- **game_concept**: Pokemon record deletion
- **description**: DELETE endpoint permanently removing a Pokemon record from the database.
- **inputs**: pokemonId (URL param)
- **outputs**: Success confirmation
- **accessible_from**: gm

### pokemon-lifecycle-C014: Bulk Pokemon Action API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/bulk-action.post.ts`
- **game_concept**: Bulk archive/delete operations
- **description**: POST endpoint for bulk archive (isInLibrary = false) or delete operations. Accepts explicit pokemonIds or filter criteria (origin, hasOwner). Safety: blocks both archive and delete for Pokemon in active encounters. Checks all active encounters for combatant entity IDs.
- **inputs**: { action: 'archive' | 'delete', pokemonIds[], filter }
- **outputs**: { action, count }
- **accessible_from**: gm

### pokemon-lifecycle-C015: Pokemon Link to Trainer API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/link.post.ts`
- **game_concept**: Trainer-Pokemon ownership assignment
- **description**: POST endpoint linking a Pokemon to a trainer by setting ownerId. Verifies trainer exists.
- **inputs**: pokemonId (URL param), { trainerId }
- **outputs**: Updated Pokemon with ownerId set
- **accessible_from**: gm

### pokemon-lifecycle-C016: Pokemon Unlink from Trainer API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/unlink.post.ts`
- **game_concept**: Trainer-Pokemon ownership removal
- **description**: POST endpoint unlinking a Pokemon from its trainer by clearing ownerId.
- **inputs**: pokemonId (URL param)
- **outputs**: Updated Pokemon with ownerId cleared
- **accessible_from**: gm

### pokemon-lifecycle-C017: Experience Addition API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/add-experience.post.ts`
- **game_concept**: PTU manual XP grants and training XP (p.202)
- **description**: POST endpoint for standalone XP grants (separate from combat XP distribution). Validates amount, calculates level-ups using experience chart, awards tutor points (1 per 5 levels), updates maxHp (level component: +1 per level gained, PTU p.198). Preserves full-HP visual state. Detects new learnset moves. Caps experience at MAX_EXPERIENCE.
- **inputs**: pokemonId (URL param), { amount }
- **outputs**: XpApplicationResult { pokemonId, species, newExperience, newLevel, levelsGained, levelUps, totalStatPoints }
- **accessible_from**: gm

### pokemon-lifecycle-C018: Level-Up Check API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/level-up-check.post.ts`
- **game_concept**: PTU level-up preview (new moves, abilities, tutor points)
- **description**: Read-only POST endpoint returning level-up information for a Pokemon transitioning from current level to a target level. Checks learnset for new moves, ability milestones, tutor point grants, stat point allocation reminders. Does NOT apply changes.
- **inputs**: pokemonId (URL param), { targetLevel }
- **outputs**: LevelUpSummary { currentLevel, targetLevel, totalStatPoints, allNewMoves, abilityMilestones, totalTutorPoints }
- **accessible_from**: gm

### pokemon-lifecycle-C019: Combat XP Distribution API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-distribute.post.ts`
- **game_concept**: PTU post-combat XP application (p.460)
- **description**: POST endpoint distributing combat XP to participating Pokemon. Recalculates XP from encounter data, validates distribution totals and duplicate IDs, applies experience/level/tutorPoints/maxHp updates. Marks encounter as XP distributed.
- **inputs**: { significanceMultiplier, playerCount, distribution[{pokemonId, xpAmount}] }
- **outputs**: Per-Pokemon XP application results with level-up details
- **accessible_from**: gm (via XP distribution modal)

### pokemon-lifecycle-C020: Entity Stats Composable
- **type**: composable-function
- **location**: `app/composables/useEntityStats.ts` → `useEntityStats()`
- **game_concept**: Safe stat access for Pokemon/Character entities
- **description**: Composable for safely accessing entity stats from various formats. Handles nested (currentStats.attack), flat (currentAttack), and base stat (baseStats.attack) formats. Provides damage-class-aware stat selection (getAttackStat, getDefenseStat).
- **inputs**: Entity object (unknown format)
- **outputs**: Typed stat values, stage modifiers, damage-class-aware stat getters
- **accessible_from**: gm, group, player

### pokemon-lifecycle-C021: Pokemon Entity Builder (from DB Record)
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `buildPokemonEntityFromRecord()`
- **game_concept**: DB record to typed entity transformation
- **description**: Transforms a Prisma Pokemon record into a typed Pokemon entity. Parses JSON fields (nature, types, stageModifiers, abilities, moves, capabilities, skills, statusConditions, eggGroups). Maps DB column names to typed interface fields.
- **inputs**: PrismaPokemonRecord
- **outputs**: Pokemon (typed entity)
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C022: Nature System
- **type**: constant
- **location**: `app/constants/natures.ts` → `NATURE_TABLE`, `applyNatureToBaseStats()`
- **game_concept**: PTU Pokemon natures (Chapter 5)
- **description**: Complete nature table with raised/lowered stat modifiers. applyNatureToBaseStats applies +2/-2 for non-HP stats, +1/-1 for HP, minimum 1. Neutral natures (raise==lower) apply no modification.
- **inputs**: baseStats, nature name
- **outputs**: Adjusted base stats
- **accessible_from**: api-only (used by pokemon-generator service)

### pokemon-lifecycle-C023: Nickname Resolution
- **type**: utility
- **location**: `app/server/utils/pokemon-nickname.ts` → `resolveNickname()`
- **game_concept**: Pokemon nickname management
- **description**: Resolves a Pokemon's display nickname. If no nickname provided or empty, generates one from the species name.
- **inputs**: species name, nickname (optional)
- **outputs**: Resolved nickname string
- **accessible_from**: api-only (used by create/update endpoints)

### pokemon-lifecycle-C024: Grid Placement Size Mapping
- **type**: service-function
- **location**: `app/server/services/grid-placement.service.ts` → `sizeToTokenSize()`
- **game_concept**: PTU size category to VTT token size mapping
- **description**: Maps PTU size categories (Small, Medium, Large, Huge, Gigantic) to VTT grid token sizes in cells.
- **inputs**: Size string
- **outputs**: Token size (number of cells)
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C025: Level-Up Check Utility
- **type**: utility
- **location**: `app/utils/levelUpCheck.ts` → `checkLevelUp()`, `summarizeLevelUps()`
- **game_concept**: PTU level-up info (new moves, ability milestones, tutor points)
- **description**: Checks what happens when leveling from oldLevel to newLevel: new learnset moves, ability milestones (every 20 levels), tutor point grants (every 5 levels), stat points to allocate. summarizeLevelUps aggregates across multiple level transitions.
- **inputs**: { oldLevel, newLevel, learnset }
- **outputs**: LevelUpInfo[] or LevelUpSummary
- **accessible_from**: api-only (used by level-up-check and xp-distribute endpoints)

### pokemon-lifecycle-C026: Experience Calculation Utility
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` → `calculateEncounterXp()`, `calculateLevelUps()`, `enrichDefeatedEnemies()`
- **game_concept**: PTU XP calculation and level-up from experience (p.460, p.202-203)
- **description**: calculateEncounterXp: total defeated levels + significance multiplier + boss bonus, divided by player count. calculateLevelUps: applies XP to current experience, determines level transitions using experience chart, detects new learnset moves and tutor points. enrichDefeatedEnemies: adds trainer enemy identification for XP bonus.
- **inputs**: Defeated enemies, significance, player count; or currentExp, level, xpAmount, learnset
- **outputs**: XP breakdown; or level-up results
- **accessible_from**: api-only (used by xp endpoints)

### pokemon-lifecycle-C027: Move Frequency Management
- **type**: utility
- **location**: `app/utils/moveFrequency.ts` → `checkMoveFrequency()`, `incrementMoveUsage()`, `resetSceneUsage()`, `resetDailyUsage()`
- **game_concept**: PTU move frequency restrictions (At-Will, Scene, EOT, Daily)
- **description**: Manages move frequency tracking: checks if a move can be used (Scene limits, EOT cooldown, Daily limits), increments usage counters, resets scene-frequency counters (new encounter/scene), resets daily counters (new day).
- **inputs**: Move object, current round
- **outputs**: { canUse, reason } or updated Move
- **accessible_from**: api-only (used by move.post.ts, start.post.ts, end.post.ts, new-day.post.ts)

## Capability Chains

### Chain 1: Wild Pokemon Generation
**Components**: WildSpawnPanel (gm) → wild-spawn.post.ts → pokemon-generator.service.generateAndCreatePokemon → SpeciesData + MoveData (Prisma) → buildPokemonCombatant → encounter combatants JSON
**Accessibility**: gm-only

### Chain 2: Template Pokemon Generation
**Components**: EncounterTemplateLoad (gm) → template load endpoint → pokemon-generator.service.generateAndCreatePokemon (with overrideMoves/overrideAbilities) → Prisma
**Accessibility**: gm-only

### Chain 3: Manual Pokemon Creation
**Components**: PokemonCreateForm (gm) → pokemon/index.post.ts → Prisma
**Accessibility**: gm-only

### Chain 4: Pokemon Editing
**Components**: PokemonSheet (gm) → pokemon/[id].put.ts → Prisma (partial update)
**Accessibility**: gm-only

### Chain 5: Pokemon Listing and Display
**Components**: PokemonList (gm/group) → pokemon/index.get.ts → Prisma
**Accessibility**: gm, group (read-only)

### Chain 6: Trainer-Pokemon Linking
**Components**: PokemonSheet (gm) → pokemon/[id]/link.post.ts → Prisma (ownerId)
**Accessibility**: gm-only

### Chain 7: Capture → Auto-Link
**Components**: CaptureModal (gm) → capture/attempt.post.ts → Prisma (ownerId = trainerId, origin = 'captured')
**Accessibility**: gm-only (cross-domain with capture)

### Chain 8: XP Distribution → Level-Up
**Components**: XpDistributionModal (gm) → xp-distribute.post.ts → experienceCalculation + levelUpCheck → Prisma (experience, level, tutorPoints, maxHp)
**Accessibility**: gm-only

### Chain 9: Manual XP Addition
**Components**: PokemonSheet (gm) → pokemon/[id]/add-experience.post.ts → experienceCalculation + levelUpCheck → Prisma
**Accessibility**: gm-only

### Chain 10: Bulk Archive/Delete
**Components**: PokemonManagement (gm) → pokemon/bulk-action.post.ts → active encounter safety check → Prisma
**Accessibility**: gm-only

### Chain 11: Level-Up Preview
**Components**: PokemonSheet (gm) → pokemon/[id]/level-up-check.post.ts → levelUpCheck utility → SpeciesData learnset
**Accessibility**: gm-only

## Accessibility Summary

| Access Level | Capabilities |
|-------------|-------------|
| **gm-only** | C009-C010 (CRUD APIs), C013-C019 (management APIs), C022 (rest healing composable for Pokemon) |
| **gm+group+player** | C011-C012 (read APIs), C020 (entity stats composable) |
| **api-only** | C001-C008 (generator service), C021-C027 (internal services and utilities) |
| **group** | Read-only access to Pokemon display data |
| **player** | Read-only access to own Pokemon via player view (limited) |

## Missing Subsystems

### MS-1: Player Pokemon Sheet Access
- **subsystem**: No full player-facing Pokemon character sheet with stat viewing and management
- **actor**: player
- **ptu_basis**: PTU players manage their Pokemon's character sheets: they view stats, track injuries, note abilities, and manage held items. Pokemon sheets are essential player-facing content.
- **impact**: Players cannot view comprehensive details of their own Pokemon from their device. Limited to what the group view or GM verbally communicates.

### MS-2: Player Stat Point Allocation
- **subsystem**: No player-facing UI for allocating stat points when their Pokemon levels up
- **actor**: player
- **ptu_basis**: PTU p.203: "Whenever a Pokemon gains a Level, it gains one Stat Point to place in any of its Stats." Players choose where to allocate stat points — this is a player decision, not a GM decision.
- **impact**: Stat point allocation after level-up requires GM intervention. Players cannot independently customize their Pokemon's growth.

### MS-3: Pokemon Move Management
- **subsystem**: No player-facing UI for managing their Pokemon's known moves (viewing, reordering, learning new moves after level-up)
- **actor**: player
- **ptu_basis**: PTU p.202: Players choose which moves to keep when learning new ones (Pokemon can know up to 6 moves). Tutor moves and TM moves are also player-decided. Move management is core player gameplay.
- **impact**: All move management is GM-proxy. Players cannot view their full movelist or make decisions about move learning/replacement.

### MS-4: Evolution System
- **subsystem**: No evolution mechanic for triggering or managing Pokemon evolution
- **actor**: both
- **ptu_basis**: PTU has level-based evolution, item-based evolution, trade evolution, and other triggers. Evolution changes species, stats, types, abilities, and learnset. This is a fundamental Pokemon lifecycle event.
- **impact**: Evolution must be handled entirely manually by the GM editing the Pokemon record. No automated stat recalculation, type change, or ability update on evolution.

### MS-5: Held Item Management
- **subsystem**: No UI for managing held items on Pokemon with effect integration
- **actor**: both
- **ptu_basis**: PTU Pokemon can hold one item with combat or passive effects (berries, type-boosting items, etc.). Held items affect damage, status recovery, and other mechanics.
- **impact**: Held items can be set as a text field but have no mechanical integration. No automatic effect application.
