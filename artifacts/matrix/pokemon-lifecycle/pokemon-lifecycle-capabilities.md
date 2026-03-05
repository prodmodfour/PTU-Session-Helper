# Pokemon Lifecycle Domain -- Application Capabilities

> Generated: 2026-03-05 | Source: deep-read of all pokemon-lifecycle source files
> Re-mapped: stale since sessions 12-26 (XP system P0-P2, level-up integration)

## Individual Capabilities

### pokemon-lifecycle-C001: Pokemon Data Generation
- **cap_id**: pokemon-lifecycle-C001
- **name**: Pokemon Data Generation
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -> `generatePokemonData()`
- **game_concept**: PTU Pokemon character sheet creation
- **description**: Pure data generation from species + level. Looks up SpeciesData for base stats, types, abilities, learnset, skills, capabilities, egg groups, size. Selects random nature and applies modifiers (+2/-2 non-HP, +1/-1 HP, min 1). Distributes stat points (level + 10) weighted by nature-adjusted base stats with Base Relations enforcement. Calculates HP via PTU formula: Level + (HP * 3) + 10. Selects up to 6 most recent moves from learnset. Picks random basic ability. Calculates tutor points: 1 + floor(level/5).
- **inputs**: GeneratePokemonInput { speciesName, level, nickname, origin, originLabel, overrideMoves, overrideAbilities }
- **outputs**: GeneratedPokemonData (complete character sheet data including nature, stats, moves, abilities, capabilities, skills, gender, tutorPoints)
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C002: Pokemon DB Record Creation
- **cap_id**: pokemon-lifecycle-C002
- **name**: Pokemon DB Record Creation
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -> `createPokemonRecord()`
- **game_concept**: Pokemon persistence to database
- **description**: Creates a Pokemon DB record from generated data. Sets isInLibrary: true. Stores nature, types, base stats, calculated stats, max HP, moves, abilities, capabilities, skills, egg groups, gender, shiny status, tutor points, origin, loyalty, and notes. Resolves nickname via pokemon-nickname utility. Applies starting loyalty based on origin (captured/wild=2 Wary, others=3 Neutral per PTU Ch.10).
- **inputs**: GeneratePokemonInput, GeneratedPokemonData
- **outputs**: CreatedPokemon { id, species, level, nickname, origin, data }
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C003: Generate-and-Create Combo
- **cap_id**: pokemon-lifecycle-C003
- **name**: Generate-and-Create Combo
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -> `generateAndCreatePokemon()`
- **game_concept**: End-to-end Pokemon creation
- **description**: Convenience wrapper that calls generatePokemonData() then createPokemonRecord() in one call. Primary entry point for most callers (wild spawn, template load, scene load).
- **inputs**: GeneratePokemonInput
- **outputs**: CreatedPokemon
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C004: Build Pokemon Combatant
- **cap_id**: pokemon-lifecycle-C004
- **name**: Build Pokemon Combatant
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -> `buildPokemonCombatant()`
- **game_concept**: Pokemon-to-combatant conversion for encounters
- **description**: Wraps a CreatedPokemon into a Combatant struct for encounter use. Converts generated data into a full Pokemon entity, calculates token size from species size, then delegates to buildCombatantFromEntity(). Bridges pokemon-lifecycle and combat domains.
- **inputs**: CreatedPokemon, side (string), position (optional {x,y})
- **outputs**: Combatant
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C005: Stat Point Distribution
- **cap_id**: pokemon-lifecycle-C005
- **name**: Stat Point Distribution
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -> `distributeStatPoints()` (private)
- **game_concept**: PTU stat point allocation at generation
- **description**: Distributes (level + 10) stat points weighted by base stats. Uses random roll against cumulative base stat values. Enforces Base Relations Rule after distribution: groups stats into tiers by base value, sorts added points so higher tiers get more, shuffles within tiers for randomness.
- **inputs**: baseStats (6 stats), level
- **outputs**: Stats (6 calculated stat values: base + added points)
- **accessible_from**: api-only (internal to generator)

### pokemon-lifecycle-C006: Move Selection from Learnset
- **cap_id**: pokemon-lifecycle-C006
- **name**: Move Selection from Learnset
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -> `selectMovesFromLearnset()` (private)
- **game_concept**: PTU learnset move auto-selection
- **description**: Selects up to 6 most recent moves from learnset at or below the given level. Fetches full MoveData from DB for each move. Falls back to stub move data if MoveData not found.
- **inputs**: learnset (array of {level, move}), level
- **outputs**: MoveDetail[] (up to 6 moves with full data)
- **accessible_from**: api-only (internal to generator)

### pokemon-lifecycle-C007: Random Ability Selection
- **cap_id**: pokemon-lifecycle-C007
- **name**: Random Ability Selection
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -> `pickRandomAbility()` (private)
- **game_concept**: PTU basic ability selection for new Pokemon
- **description**: Picks one random Basic Ability for a newly generated Pokemon. PTU rules: new Pokemon get one ability chosen from their Basic Abilities only. Advanced Abilities are only available at Level 20+.
- **inputs**: abilityNames (string[]), numBasicAbilities (int)
- **outputs**: Array<{ name, effect }> (single ability)
- **accessible_from**: api-only (internal to generator)

### pokemon-lifecycle-C008: Nickname Resolution
- **cap_id**: pokemon-lifecycle-C008
- **name**: Nickname Resolution
- **type**: utility
- **location**: `app/server/utils/pokemon-nickname.ts` -> `resolveNickname()`
- **game_concept**: Pokemon nickname auto-generation
- **description**: If a nickname is provided and non-empty, returns it trimmed. Otherwise, generates an auto-nickname by counting existing Pokemon of the same species and appending count+1 (e.g., "Pikachu 3").
- **inputs**: species (string), nickname (optional string)
- **outputs**: string (resolved nickname)
- **accessible_from**: api-only (internal utility)

### pokemon-lifecycle-C009: Pokemon Serialization
- **cap_id**: pokemon-lifecycle-C009
- **name**: Pokemon Serialization
- **type**: utility
- **location**: `app/server/utils/serializers.ts` -> `serializePokemon()`
- **game_concept**: Pokemon data transformation for API responses
- **description**: Transforms a Prisma Pokemon record into a typed API response. Parses all JSON fields (nature, stageModifiers, abilities, moves, capabilities, skills, statusConditions, eggGroups). Maps DB column names to typed fields (baseHp->baseStats.hp, currentSpAtk->currentStats.specialAttack). Includes rest/healing tracking fields. Applies decree-049 loyalty default.
- **inputs**: Prisma Pokemon record
- **outputs**: Serialized Pokemon object matching the Pokemon type interface
- **accessible_from**: api-only (internal utility)

### pokemon-lifecycle-C010: Pokemon Entity Builder
- **cap_id**: pokemon-lifecycle-C010
- **name**: Pokemon Entity Builder
- **type**: service-function
- **location**: `app/server/services/entity-builder.service.ts` -> `buildPokemonEntityFromRecord()`
- **game_concept**: DB record to typed entity conversion
- **description**: Transforms a Prisma Pokemon record into a typed Pokemon entity for in-memory use. Parses all JSON fields. Maps DB columns to typed interface fields. Applied in encounter loading and combatant building. Applies decree-049 loyalty default.
- **inputs**: PrismaPokemonRecord
- **outputs**: Pokemon (typed entity)
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C011: List All Pokemon
- **cap_id**: pokemon-lifecycle-C011
- **name**: List All Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/index.get.ts` -> GET /api/pokemon
- **game_concept**: Pokemon library browsing
- **description**: Lists all Pokemon records, optionally filtered by origin and archive status. Non-archived by default (isInLibrary=true). Supports origin filter (manual, wild, template, import, captured, all). Returns serialized Pokemon array sorted by species name.
- **inputs**: query params: origin (string), includeArchived (boolean)
- **outputs**: { success, data: Pokemon[] }
- **accessible_from**: gm

### pokemon-lifecycle-C012: Create Pokemon (Manual)
- **cap_id**: pokemon-lifecycle-C012
- **name**: Create Pokemon (Manual)
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/index.post.ts` -> POST /api/pokemon
- **game_concept**: Manual Pokemon creation by GM
- **description**: Creates a Pokemon record from a complete body payload. Supports all fields: species, nickname, level, experience, nature, types, base stats, current stats, stage modifiers, abilities, moves, capabilities, skills, held item, gender, shiny, tutor points, training exp, egg groups, loyalty (validated 0-6), owner, origin, location, notes. HP formula applied. Loyalty defaults to 2 for wild/captured, 3 otherwise (decree-049).
- **inputs**: Full Pokemon body (species required, all others optional with defaults)
- **outputs**: { success, data: serialized Pokemon }
- **accessible_from**: gm

### pokemon-lifecycle-C013: Get Pokemon by ID
- **cap_id**: pokemon-lifecycle-C013
- **name**: Get Pokemon by ID
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].get.ts` -> GET /api/pokemon/:id
- **game_concept**: Pokemon detail retrieval
- **description**: Fetches a single Pokemon by UUID. Returns full serialized Pokemon data including all stats, moves, abilities, capabilities, skills, healing tracking, loyalty, origin, and display info.
- **inputs**: id (path param)
- **outputs**: { success, data: serialized Pokemon }
- **accessible_from**: gm

### pokemon-lifecycle-C014: Update Pokemon
- **cap_id**: pokemon-lifecycle-C014
- **name**: Update Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].put.ts` -> PUT /api/pokemon/:id
- **game_concept**: Pokemon editing (GM sheet editor)
- **description**: Partial update of any Pokemon field. Supports: species, nickname, level, experience, currentHp, maxHp, heldItem, ownerId, spriteUrl, shiny, gender, isInLibrary, origin, notes, location, types, nature, stageModifiers, abilities, moves, statusConditions, loyalty (validated 0-6), injuries, rest tracking fields, base stats, current stats. Nickname goes through resolveNickname().
- **inputs**: id (path param), partial body of Pokemon fields
- **outputs**: { success, data: serialized Pokemon }
- **accessible_from**: gm

### pokemon-lifecycle-C015: Delete Pokemon
- **cap_id**: pokemon-lifecycle-C015
- **name**: Delete Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].delete.ts` -> DELETE /api/pokemon/:id
- **game_concept**: Permanent Pokemon removal
- **description**: Permanently deletes a Pokemon record from the database.
- **inputs**: id (path param)
- **outputs**: { success }
- **accessible_from**: gm

### pokemon-lifecycle-C016: Add Experience
- **cap_id**: pokemon-lifecycle-C016
- **name**: Add Experience
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/add-experience.post.ts` -> POST /api/pokemon/:id/add-experience
- **game_concept**: Pokemon XP gain and level-up
- **description**: Standalone endpoint for manual XP grants and training XP. Validates amount is positive integer, not exceeding MAX_EXPERIENCE. Loads species learnset and evolution triggers. Calculates level-ups via calculateLevelUps() including: new moves available, tutor point gains (levels divisible by 5), evolution eligibility flags. Updates DB with new experience, level, tutorPoints, maxHp (increases by levelsGained). Preserves full-HP visual state.
- **inputs**: id (path param), { amount: number }
- **outputs**: { success, data: XpApplicationResult with levelUps[] }
- **accessible_from**: gm

### pokemon-lifecycle-C017: Allocate Stat Points
- **cap_id**: pokemon-lifecycle-C017
- **name**: Allocate Stat Points
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/allocate-stats.post.ts` -> POST /api/pokemon/:id/allocate-stats
- **game_concept**: PTU stat point allocation (Base Relations Rule)
- **description**: Allocates stat points in incremental or batch mode. Incremental: { stat, points } adds N points to one stat. Batch: { statPoints: Stats } sets full allocation. Validates total does not exceed budget (level+10). Validates Base Relations Rule using nature-adjusted base stats (decree-035). Can bypass with skipBaseRelations flag. Calculates new stats and HP, preserves HP ratio.
- **inputs**: id (path param), { stat + points } OR { statPoints: Stats }, skipBaseRelations (optional boolean)
- **outputs**: { success, data: { statPoints, totalAllocated, budget, remainingUnallocated, validation, newStats } }
- **accessible_from**: gm

### pokemon-lifecycle-C018: Assign Ability
- **cap_id**: pokemon-lifecycle-C018
- **name**: Assign Ability
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/assign-ability.post.ts` -> POST /api/pokemon/:id/assign-ability
- **game_concept**: PTU Level 20/40 ability milestones
- **description**: Assigns a new ability at Level 20 (second) or Level 40 (third) milestone. Validates: level eligibility, current ability count, ability pool (Basic+Advanced for second, all for third via getAbilityPool()), chosen ability is in valid pool. Fetches ability effect from AbilityData. Appends to abilities array.
- **inputs**: id (path param), { abilityName: string, milestone: 'second' | 'third' }
- **outputs**: { success, data: { id, abilities, assignedAbility, milestone } }
- **accessible_from**: gm

### pokemon-lifecycle-C019: Evolution Eligibility Check
- **cap_id**: pokemon-lifecycle-C019
- **name**: Evolution Eligibility Check
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/evolution-check.post.ts` -> POST /api/pokemon/:id/evolution-check
- **game_concept**: PTU evolution trigger check
- **description**: Read-only check of available evolutions. Fetches Pokemon data (species, level, heldItem, abilities, moves, gender). Loads SpeciesData for evolution triggers, abilities, learnset. Checks eligibility per trigger: level, held item, gender (P2), move known (P2), prevention items (Everstone/Eviolite). For available evolutions: fetches target species data (stats, types, abilities, learnset), pre-computes ability remapping via remapAbilities(), enriches ability options with AbilityData effects, pre-computes evolution moves via getEvolutionMoves(), fetches full MoveData for evolution moves.
- **inputs**: id (path param)
- **outputs**: { success, data: { pokemonId, currentSpecies, available[], ineligible[], currentAbilities, currentMoves, oldSpeciesAbilities, preventedByItem } }
- **accessible_from**: gm

### pokemon-lifecycle-C020: Perform Evolution
- **cap_id**: pokemon-lifecycle-C020
- **name**: Perform Evolution
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/evolve.post.ts` -> POST /api/pokemon/:id/evolve
- **game_concept**: PTU evolution execution
- **description**: Performs a Pokemon evolution. Guards against evolution while in active encounter. Delegates to performEvolution() service. Validates targetSpecies is in evolution triggers, stat points total level+10, Base Relations, level/held-item/gender/move requirements. Broadcasts pokemon_evolved WebSocket event. Awards +1 trainer XP for new species (PTU p.461) if owned, updating ownedSpecies and checking for trainer level-up. Returns undo snapshot.
- **inputs**: id (path param), { targetSpecies, statPoints, skipBaseRelations?, abilities?, moves?, consumeItem?, consumeHeldItem? }
- **outputs**: { success, data: { pokemon, changes, undoSnapshot, speciesXp? } }
- **accessible_from**: gm

### pokemon-lifecycle-C021: Evolution Undo
- **cap_id**: pokemon-lifecycle-C021
- **name**: Evolution Undo
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/evolution-undo.post.ts` -> POST /api/pokemon/:id/evolution-undo
- **game_concept**: Evolution reversal (mistake correction)
- **description**: Reverts a Pokemon to its pre-evolution state using a snapshot. Guards against undo while in active encounter. Restores all fields from snapshot (species, types, stats, abilities, moves, capabilities, skills, held item, notes). Restores consumed stone to trainer inventory if tracked. Broadcasts pokemon_evolved WebSocket event with undone flag.
- **inputs**: id (path param), { snapshot: PokemonSnapshot }
- **outputs**: { success, data: { pokemon, revertedFrom, revertedTo } }
- **accessible_from**: gm

### pokemon-lifecycle-C022: Level-Up Check
- **cap_id**: pokemon-lifecycle-C022
- **name**: Level-Up Check
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/level-up-check.post.ts` -> POST /api/pokemon/:id/level-up-check
- **game_concept**: PTU level-up information query
- **description**: Returns level-up information for a Pokemon transitioning from current level to target level. Checks learnset for new moves at each level, ability milestones (Lv20 second, Lv40 third), tutor point gains (every 5 levels), stat point reminders. Read-only.
- **inputs**: id (path param), { targetLevel: number }
- **outputs**: { success, data: LevelUpSummary with totalStatPoints, allNewMoves, abilityMilestones, totalTutorPoints }
- **accessible_from**: gm

### pokemon-lifecycle-C023: Learn Move
- **cap_id**: pokemon-lifecycle-C023
- **name**: Learn Move
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/learn-move.post.ts` -> POST /api/pokemon/:id/learn-move
- **game_concept**: PTU move learning (max 6 moves)
- **description**: Adds a move to a Pokemon's active move set. Validates: move exists in MoveData, not already known, max 6 moves. Supports replacing existing move by index or adding to empty slot. Fetches full MoveData for the new move.
- **inputs**: id (path param), { moveName: string, replaceIndex: number | null }
- **outputs**: { success, data: { id, learnedMove, replacedIndex, totalMoves } }
- **accessible_from**: gm

### pokemon-lifecycle-C024: Link Pokemon to Trainer
- **cap_id**: pokemon-lifecycle-C024
- **name**: Link Pokemon to Trainer
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/link.post.ts` -> POST /api/pokemon/:id/link
- **game_concept**: Pokemon ownership assignment
- **description**: Sets a Pokemon's ownerId to a trainer's ID. Verifies trainer exists before linking. Returns full parsed Pokemon data.
- **inputs**: id (path param), { trainerId: string }
- **outputs**: { data: parsed Pokemon }
- **accessible_from**: gm

### pokemon-lifecycle-C025: Unlink Pokemon from Trainer
- **cap_id**: pokemon-lifecycle-C025
- **name**: Unlink Pokemon from Trainer
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/unlink.post.ts` -> POST /api/pokemon/:id/unlink
- **game_concept**: Pokemon ownership removal
- **description**: Removes a Pokemon's ownerId (sets to null). Returns full parsed Pokemon data.
- **inputs**: id (path param)
- **outputs**: { data: parsed Pokemon }
- **accessible_from**: gm

### pokemon-lifecycle-C026: Short Rest (30 min)
- **cap_id**: pokemon-lifecycle-C026
- **name**: Short Rest (30 min)
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/rest.post.ts` -> POST /api/pokemon/:id/rest
- **game_concept**: PTU rest healing (1/16th max HP per 30 min)
- **description**: Applies 30 minutes of rest to a Pokemon. Heals 1/16th max HP. Cannot heal if 5+ injuries. Max 8 hours (480 min) of rest healing per day. Resets daily counters if new day.
- **inputs**: id (path param)
- **outputs**: { success, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }
- **accessible_from**: gm

### pokemon-lifecycle-C027: Extended Rest (4-8 hours)
- **cap_id**: pokemon-lifecycle-C027
- **name**: Extended Rest (4-8 hours)
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/extended-rest.post.ts` -> POST /api/pokemon/:id/extended-rest
- **game_concept**: PTU extended rest (decree-018 configurable duration)
- **description**: Applies extended rest to a Pokemon. Duration 4-8 hours (default 4), each 30-min period heals 1/16th max HP. Clears all persistent status conditions. Restores daily-frequency moves (rolling window rule via rest-healing.service). Respects daily 8h rest cap.
- **inputs**: id (path param), { duration?: number (4-8) }
- **outputs**: { success, data: { duration, hpHealed, newHp, maxHp, clearedStatuses, restoredMoves, skippedMoves, restMinutesToday, restMinutesRemaining } }
- **accessible_from**: gm

### pokemon-lifecycle-C028: Heal Injury Naturally
- **cap_id**: pokemon-lifecycle-C028
- **name**: Heal Injury Naturally
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/heal-injury.post.ts` -> POST /api/pokemon/:id/heal-injury
- **game_concept**: PTU natural injury healing (24h timer)
- **description**: Heals one injury naturally. Requires 24 hours since last injury. Daily limit of 3 injuries healed. Resets daily counters if new day. Clears lastInjuryTime when all injuries are gone.
- **inputs**: id (path param)
- **outputs**: { success, data: { injuriesHealed, injuries, injuriesHealedToday } }
- **accessible_from**: gm

### pokemon-lifecycle-C029: Pokemon Center Healing
- **cap_id**: pokemon-lifecycle-C029
- **name**: Pokemon Center Healing
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/pokemon-center.post.ts` -> POST /api/pokemon/:id/pokemon-center
- **game_concept**: PTU Pokemon Center (full HP/status/move restoration)
- **description**: Full Pokemon Center healing. Restores HP to effective max (injury-reduced). Clears ALL status conditions. Restores all daily-frequency moves. Heals injuries (max 3/day total). Time: 1 hour base + 30min/injury (or 1hr/injury if 5+).
- **inputs**: id (path param)
- **outputs**: { success, data: { hpHealed, newHp, maxHp, effectiveMaxHp, injuriesHealed, injuriesRemaining, clearedStatuses, restoredMoves, healingTime, atDailyInjuryLimit } }
- **accessible_from**: gm

### pokemon-lifecycle-C030: New Day Reset
- **cap_id**: pokemon-lifecycle-C030
- **name**: New Day Reset
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/new-day.post.ts` -> POST /api/pokemon/:id/new-day
- **game_concept**: Daily healing counter reset
- **description**: Resets daily healing counters for a Pokemon: restMinutesToday, injuriesHealedToday, lastRestReset. Used when starting a new in-game day.
- **inputs**: id (path param)
- **outputs**: { success, data: { restMinutesToday, injuriesHealedToday, lastRestReset } }
- **accessible_from**: gm

### pokemon-lifecycle-C031: Bulk Action (Archive/Delete)
- **cap_id**: pokemon-lifecycle-C031
- **name**: Bulk Action (Archive/Delete)
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/bulk-action.post.ts` -> POST /api/pokemon/bulk-action
- **game_concept**: Batch Pokemon management
- **description**: Archives (isInLibrary=false) or deletes Pokemon in bulk. Accepts pokemonIds array or filter { origin, hasOwner }. Safety: blocks both actions for Pokemon in active encounters. Archive hides from sheets but preserves in DB.
- **inputs**: { action: 'archive' | 'delete', pokemonIds?: string[], filter?: { origin, hasOwner } }
- **outputs**: { success, data: { action, count } }
- **accessible_from**: gm

### pokemon-lifecycle-C032: Evolution Service - Stat Extraction
- **cap_id**: pokemon-lifecycle-C032
- **name**: Evolution Service - Stat Extraction
- **type**: service-function
- **location**: `app/server/services/evolution.service.ts` -> `extractStatPoints()`
- **game_concept**: PTU stat point reverse-engineering from current state
- **description**: Extracts the stat point allocation from a Pokemon's current state. For HP: maxHp = level + (hpStat * 3) + 10, so hpStatPoints = hpStat - baseHp. For other stats: statPoints = currentStat - baseNatureAdjustedStat.
- **inputs**: Pokemon DB fields (base stats, current stats, maxHp, level)
- **outputs**: Stats (6 stat point values)
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C033: Evolution Service - Stat Recalculation
- **cap_id**: pokemon-lifecycle-C033
- **name**: Evolution Service - Stat Recalculation
- **type**: service-function
- **location**: `app/server/services/evolution.service.ts` -> `recalculateStats()`
- **game_concept**: PTU evolution stat recalculation
- **description**: Recalculates stats for a new species after evolution. Applies nature to new species' raw base stats. Validates stat points total = level + 10. Validates no negative stat points. Validates Base Relations Rule (decree-035). Calculates final stats and max HP.
- **inputs**: { newSpeciesBaseStats, natureName, level, statPoints }
- **outputs**: StatRecalculationResult { valid, natureAdjustedBase, calculatedStats, maxHp, violations, error? }
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C034: Evolution Service - Ability Remapping
- **cap_id**: pokemon-lifecycle-C034
- **name**: Evolution Service - Ability Remapping
- **type**: service-function
- **location**: `app/server/services/evolution.service.ts` -> `remapAbilities()`
- **game_concept**: PTU evolution ability positional remapping (R032)
- **description**: Remaps abilities from old species' ability list to new species' list. PTU p.202: "Abilities change to match the Ability in the same spot." Positional match: same index maps directly. Index out of bounds: flags for GM resolution. Not found in old list: preserved as-is (Feature-granted). Pure function.
- **inputs**: currentAbilities, oldSpeciesAbilities, newSpeciesAbilities
- **outputs**: AbilityRemapResult { remappedAbilities, needsResolution, preservedAbilities }
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C035: Evolution Service - Ability Effect Enrichment
- **cap_id**: pokemon-lifecycle-C035
- **name**: Evolution Service - Ability Effect Enrichment
- **type**: service-function
- **location**: `app/server/services/evolution.service.ts` -> `enrichAbilityEffects()`
- **game_concept**: Ability effect text lookup
- **description**: Enriches ability entries with their effect text from AbilityData table. Uses a single batch query. Returns new array without mutating input.
- **inputs**: Array<{ name, effect }>
- **outputs**: Array<{ name, effect }> (with effects populated from DB)
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C036: Evolution Service - Stone Consumption
- **cap_id**: pokemon-lifecycle-C036
- **name**: Evolution Service - Stone Consumption
- **type**: service-function
- **location**: `app/server/services/evolution.service.ts` -> `consumeStoneFromInventory()`
- **game_concept**: PTU evolution stone item consumption
- **description**: Consumes a stone (or other item) from a trainer's inventory. Decrements quantity by 1, removes entry if quantity reaches 0. Throws if item not found.
- **inputs**: ownerId (string), itemName (string)
- **outputs**: void (modifies DB)
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C037: Evolution Service - Stone Restoration
- **cap_id**: pokemon-lifecycle-C037
- **name**: Evolution Service - Stone Restoration
- **type**: service-function
- **location**: `app/server/services/evolution.service.ts` -> `restoreStoneToInventory()`
- **game_concept**: Evolution undo stone restoration
- **description**: Restores a stone to a trainer's inventory (used during evolution undo). Increments quantity by 1, or adds new entry if not in inventory.
- **inputs**: ownerId (string), itemName (string)
- **outputs**: void (modifies DB)
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C038: Evolution Service - Full Execution
- **cap_id**: pokemon-lifecycle-C038
- **name**: Evolution Service - Full Execution
- **type**: service-function
- **location**: `app/server/services/evolution.service.ts` -> `performEvolution()`
- **game_concept**: PTU evolution orchestration
- **description**: Orchestrates a complete Pokemon evolution. Steps: (1) Fetch Pokemon, (2) Validate evolution trigger (level, held item, gender, move), (3) Capture pre-evolution snapshot for undo, (4) Fetch target species data, (5) Recalculate stats with nature, (6) Calculate current HP proportionally, (7) Remap abilities (auto or GM-provided), (8) Update moves (GM-provided or keep current), (9) Update capabilities and skills from target species, (10) Handle held item consumption, (11) Build evolution history note, (12) Write update + stone consumption in DB transaction. Returns changes diff and undo snapshot.
- **inputs**: PerformEvolutionInput { pokemonId, targetSpecies, statPoints, skipBaseRelations?, abilities?, moves?, consumeItem?, consumeHeldItem? }
- **outputs**: EvolutionResult { success, pokemon, changes, undoSnapshot }
- **accessible_from**: api-only (internal service)

### pokemon-lifecycle-C039: Experience Calculation - Encounter XP
- **cap_id**: pokemon-lifecycle-C039
- **name**: Experience Calculation - Encounter XP
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -> `calculateEncounterXp()`
- **game_concept**: PTU post-combat XP calculation (Core p.460)
- **description**: Calculates post-encounter XP per player. Totals defeated enemy levels (trainers counted 2x). Applies GM significance multiplier (1-5, capped at x5 per decree-030). Divides by player count (unless boss encounter). All rounding is floor. Returns full breakdown.
- **inputs**: XpCalculationInput { defeatedEnemies, significanceMultiplier, playerCount, isBossEncounter }
- **outputs**: XpCalculationResult { totalXpPerPlayer, breakdown }
- **accessible_from**: gm (used by XP distribution UI)

### pokemon-lifecycle-C040: Experience Calculation - Level-Up Detection
- **cap_id**: pokemon-lifecycle-C040
- **name**: Experience Calculation - Level-Up Detection
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -> `calculateLevelUps()`
- **game_concept**: PTU level-up from XP gain
- **description**: Given current experience, current level, and XP to add, determines new level and level-up events. Uses EXPERIENCE_CHART (PTU Core p.203, levels 1-100). Caps at MAX_EXPERIENCE. Delegates per-level details to checkLevelUp(). Each LevelUpEvent includes: statPointsGained, tutorPointGained, newMovesAvailable, canEvolve, newAbilitySlot.
- **inputs**: currentExperience, currentLevel, xpToAdd, learnset (optional), evolutionLevels (optional)
- **outputs**: { previousExperience, xpGained, newExperience, previousLevel, newLevel, levelsGained, levelUps[] }
- **accessible_from**: gm (used by add-experience endpoint)

### pokemon-lifecycle-C041: Experience Chart and Helpers
- **cap_id**: pokemon-lifecycle-C041
- **name**: Experience Chart and Helpers
- **type**: constant
- **location**: `app/utils/experienceCalculation.ts` -> `EXPERIENCE_CHART`, `getXpForLevel()`, `getLevelForXp()`, `getXpToNextLevel()`
- **game_concept**: PTU Experience Chart (Core p.203)
- **description**: Complete PTU experience chart mapping level 1-100 to cumulative XP thresholds. Helper functions: getXpForLevel (lookup by level), getLevelForXp (reverse lookup), getXpToNextLevel (remaining XP calculation). MAX_LEVEL=100, MAX_EXPERIENCE=20555.
- **inputs**: level or experience values
- **outputs**: XP thresholds or level values
- **accessible_from**: gm (used in UI computeds and API)

### pokemon-lifecycle-C042: Significance Presets
- **cap_id**: pokemon-lifecycle-C042
- **name**: Significance Presets
- **type**: constant
- **location**: `app/utils/experienceCalculation.ts` -> `SIGNIFICANCE_PRESETS`, `SIGNIFICANCE_PRESET_LABELS`
- **game_concept**: PTU encounter significance (Core p.460, decree-030)
- **description**: Significance multiplier presets derived from encounterBudget.ts. Provides { insignificant: 1.0, everyday: 2.0, significant: 5.0 } with friendly labels. Capped at x5 per decree-030.
- **inputs**: N/A (constants)
- **outputs**: Record<SignificanceTier, number> and Record<SignificanceTier, string>
- **accessible_from**: gm

### pokemon-lifecycle-C043: Defeated Enemy Enrichment
- **cap_id**: pokemon-lifecycle-C043
- **name**: Defeated Enemy Enrichment
- **type**: utility
- **location**: `app/utils/experienceCalculation.ts` -> `enrichDefeatedEnemies()`
- **game_concept**: XP calculation data preparation
- **description**: Enriches raw defeated enemy entries from encounter JSON into DefeatedEnemy shape. Determines isTrainer via type field, fallback trainerEnemyIds, or default false.
- **inputs**: RawDefeatedEnemy[], trainerEnemyIds (optional)
- **outputs**: DefeatedEnemy[]
- **accessible_from**: gm (used by XP distribution endpoint)

### pokemon-lifecycle-C044: Level-Up Checker
- **cap_id**: pokemon-lifecycle-C044
- **name**: Level-Up Checker
- **type**: utility
- **location**: `app/utils/levelUpCheck.ts` -> `checkLevelUp()`
- **game_concept**: PTU per-level-up event detection (Core p.201-202)
- **description**: Returns per-level info for a range of levels gained: +1 stat point (always), new moves from learnset, ability milestones (Lv20 second, Lv40 third), tutor points (every 5 levels starting at Lv5). Pure function.
- **inputs**: LevelUpCheckInput { oldLevel, newLevel, learnset }
- **outputs**: LevelUpInfo[] (one per level gained)
- **accessible_from**: gm (used by API and composables)

### pokemon-lifecycle-C045: Level-Up Summary
- **cap_id**: pokemon-lifecycle-C045
- **name**: Level-Up Summary
- **type**: utility
- **location**: `app/utils/levelUpCheck.ts` -> `summarizeLevelUps()`
- **game_concept**: Multi-level gain summary
- **description**: Summarizes all level-up info into a single combined result. Aggregates totalStatPoints, allNewMoves, abilityMilestones, totalTutorPoints across multiple levels.
- **inputs**: LevelUpInfo[]
- **outputs**: { totalStatPoints, allNewMoves, abilityMilestones, totalTutorPoints }
- **accessible_from**: gm

### pokemon-lifecycle-C046: Evolution Eligibility Check (Pure)
- **cap_id**: pokemon-lifecycle-C046
- **name**: Evolution Eligibility Check (Pure)
- **type**: utility
- **location**: `app/utils/evolutionCheck.ts` -> `checkEvolutionEligibility()`
- **game_concept**: PTU evolution trigger validation (Core p.202)
- **description**: Pure function checking which evolutions are available. Per trigger: checks level requirement, held item requirement, gender requirement (P2), move requirement (P2). Everstone/Eviolite blocks ALL evolutions. Returns available and ineligible lists with reasons.
- **inputs**: EvolutionCheckInput { currentLevel, heldItem, evolutionTriggers, gender?, currentMoves? }
- **outputs**: EvolutionEligibilityResult { available[], ineligible[], preventedByItem? }
- **accessible_from**: gm (used by evolution-check endpoint)

### pokemon-lifecycle-C047: Evolution Levels Extraction
- **cap_id**: pokemon-lifecycle-C047
- **name**: Evolution Levels Extraction
- **type**: utility
- **location**: `app/utils/evolutionCheck.ts` -> `getEvolutionLevels()`
- **game_concept**: Level-based evolution detection for XP system
- **description**: Extracts level-only evolution levels from triggers (excludes item-based). Used to feed calculateLevelUps() for the canEvolve flag on level-up events.
- **inputs**: EvolutionTrigger[]
- **outputs**: number[] (levels at which evolution is possible)
- **accessible_from**: gm (used by add-experience endpoint)

### pokemon-lifecycle-C048: Evolution Move Learning
- **cap_id**: pokemon-lifecycle-C048
- **name**: Evolution Move Learning
- **type**: utility
- **location**: `app/utils/evolutionCheck.ts` -> `getEvolutionMoves()`
- **game_concept**: PTU evolution move learning (Core p.202, decree-036)
- **description**: Gets moves available upon evolution. Level-based evolutions: moves at level < evolutionMinLevel. Stone evolutions (decree-036): moves at level <= currentLevel. Excludes moves in old-form learnset and already-known moves. Deduplicates by name.
- **inputs**: { oldLearnset, newLearnset, evolutionMinLevel, currentLevel, currentMoves }
- **outputs**: EvolutionMoveResult { availableMoves[], currentMoveCount, maxMoves, slotsAvailable }
- **accessible_from**: gm

### pokemon-lifecycle-C049: Evolution Move List Builder
- **cap_id**: pokemon-lifecycle-C049
- **name**: Evolution Move List Builder
- **type**: utility
- **location**: `app/utils/evolutionCheck.ts` -> `buildSelectedMoveList()`
- **game_concept**: Evolution move selection management
- **description**: Builds the selected move list by combining kept current moves with added evolution moves. Shared between EvolutionConfirmModal and EvolutionMoveStep. Pure function.
- **inputs**: { currentMoves, removedMoves, addedMoves, evolutionMoveDetails }
- **outputs**: EvolutionMoveDetail[]
- **accessible_from**: gm

### pokemon-lifecycle-C050: Base Relations Validation
- **cap_id**: pokemon-lifecycle-C050
- **name**: Base Relations Validation
- **type**: utility
- **location**: `app/utils/baseRelations.ts` -> `validateBaseRelations()`
- **game_concept**: PTU Base Relations Rule (Core p.198, decree-035)
- **description**: Validates that a stat point allocation preserves Base Relations ordering. If natureAdjustedBase[A] > natureAdjustedBase[B], then final[A] >= final[B]. Equal base stats may have any relative allocation. Returns violations list and tier display.
- **inputs**: natureAdjustedBase (Stats), statPoints (Stats)
- **outputs**: BaseRelationsValidation { valid, violations[], tiers[] }
- **accessible_from**: gm

### pokemon-lifecycle-C051: Valid Allocation Targets
- **cap_id**: pokemon-lifecycle-C051
- **name**: Valid Allocation Targets
- **type**: utility
- **location**: `app/utils/baseRelations.ts` -> `getValidAllocationTargets()`
- **game_concept**: PTU stat allocation guidance
- **description**: Determines which stats can legally receive the next stat point without violating Base Relations. Tests adding +1 to each stat and validates.
- **inputs**: natureAdjustedBase (Stats), currentStatPoints (Stats)
- **outputs**: Record<StatKey, boolean>
- **accessible_from**: gm

### pokemon-lifecycle-C052: Stat Point Extraction (Client)
- **cap_id**: pokemon-lifecycle-C052
- **name**: Stat Point Extraction (Client)
- **type**: utility
- **location**: `app/utils/baseRelations.ts` -> `extractStatPoints()`
- **game_concept**: Stat allocation reverse-engineering
- **description**: Extracts stat point allocation from a Pokemon's current DB state. HP uses maxHp formula reversal. Other stats: currentStat - baseStat. Includes consistency check (totalAllocated vs expectedTotal) and warnings for negative clamping.
- **inputs**: { level, maxHp, baseStats, currentStats }
- **outputs**: { statPoints, totalAllocated, expectedTotal, isConsistent, warnings }
- **accessible_from**: gm

### pokemon-lifecycle-C053: Ability Pool Computation
- **cap_id**: pokemon-lifecycle-C053
- **name**: Ability Pool Computation
- **type**: utility
- **location**: `app/utils/abilityAssignment.ts` -> `getAbilityPool()`
- **game_concept**: PTU ability milestone pool (Core p.200)
- **description**: Computes the pool of abilities available for a Level 20 or Level 40 milestone. Level 20 (second): Basic + Advanced. Level 40 (third): Basic + Advanced + High. Categorizes abilities by index position. Excludes already-held abilities.
- **inputs**: { speciesAbilities, numBasicAbilities, currentAbilities, milestone }
- **outputs**: AbilityPoolResult { available[], alreadyHas[] }
- **accessible_from**: gm

### pokemon-lifecycle-C054: Ability Categorization
- **cap_id**: pokemon-lifecycle-C054
- **name**: Ability Categorization
- **type**: utility
- **location**: `app/utils/abilityAssignment.ts` -> `categorizeAbilities()`
- **game_concept**: PTU ability classification (Basic/Advanced/High)
- **description**: Categorizes a species' ability list into Basic, Advanced, and High based on index position and numBasicAbilities count. High ability exists only when entries exceed Basic + Advanced count.
- **inputs**: speciesAbilities (string[]), numBasicAbilities (number)
- **outputs**: CategorizedAbility[] { name, category }
- **accessible_from**: gm

### pokemon-lifecycle-C055: Nature Table and Application
- **cap_id**: pokemon-lifecycle-C055
- **name**: Nature Table and Application
- **type**: constant
- **location**: `app/constants/natures.ts` -> `NATURE_TABLE`, `applyNatureToBaseStats()`
- **game_concept**: PTU Nature Chart (Core Ch.5 p.199)
- **description**: Complete PTU nature table (36 natures). Each nature raises one stat and lowers another. HP modifiers: +1/-1. Non-HP modifiers: +2/-2. Neutral natures cancel out. applyNatureToBaseStats() applies the modifiers to raw base stats (min 1).
- **inputs**: baseStats, natureName
- **outputs**: nature-adjusted Stats
- **accessible_from**: gm (used by generator and evolution services)

### pokemon-lifecycle-C056: Pokemon Sprite Resolution
- **cap_id**: pokemon-lifecycle-C056
- **name**: Pokemon Sprite Resolution
- **type**: composable-function
- **location**: `app/composables/usePokemonSprite.ts` -> `usePokemonSprite()`
- **game_concept**: Pokemon visual display (Gen 5 B2W2 sprites, Gen 6+ Showdown sprites)
- **description**: Provides sprite URL generation for Pokemon. Gen 5 and below: B2W2 animated GIF sprites via PokeAPI. Gen 6+: Pokemon Showdown animated sprites. 280+ special name mappings for regional forms, hyphenated names, special characters. Supports shiny variants. Includes fallback chain (Showdown -> PokeAPI animated -> PokeAPI static -> placeholder). Also provides static sprites, official artwork, and dex number lookup.
- **inputs**: species name, shiny flag
- **outputs**: Sprite URL (string)
- **accessible_from**: gm, group, player

### pokemon-lifecycle-C057: Pokemon Sheet Dice Rolls
- **cap_id**: pokemon-lifecycle-C057
- **name**: Pokemon Sheet Dice Rolls
- **type**: composable-function
- **location**: `app/composables/usePokemonSheetRolls.ts` -> `usePokemonSheetRolls()`
- **game_concept**: PTU skill and attack/damage rolls from Pokemon sheet
- **description**: Provides dice rolling functions for Pokemon sheets. rollSkill: rolls a skill check with given notation. rollAttack: rolls 1d20 for accuracy check against move AC, detects nat 20 (crit) and nat 1 (miss). rollDamage: rolls damage dice with optional critical (double dice), adds attack/spAtk stat. getMoveDamageFormula: computes damage formula string.
- **inputs**: Pokemon ref, Move data
- **outputs**: MoveRollState, SkillRollState (reactive)
- **accessible_from**: gm (Pokemon sheet page)

### pokemon-lifecycle-C058: Level-Up Allocation Composable
- **cap_id**: pokemon-lifecycle-C058
- **name**: Level-Up Allocation Composable
- **type**: composable-function
- **location**: `app/composables/useLevelUpAllocation.ts` -> `useLevelUpAllocation()`
- **game_concept**: PTU stat allocation UI state management
- **description**: Reactive state management for Pokemon level-up stat allocation, ability assignment, and move learning. Provides: current stat extraction, pending allocation tracking, unallocated points count, Base Relations validation, valid target computation, allocation actions (allocate/deallocate/reset/submit/cancel). Also tracks pending ability milestones (Lv20/40) and new moves from learnset. Submit calls allocate-stats API.
- **inputs**: pokemonRef (Ref<Pokemon>)
- **outputs**: Reactive state: pendingAllocation, statBudget, unallocatedPoints, validation, validTargets, pendingAbilityMilestone, pendingNewMoves, hasPendingActions + action functions
- **accessible_from**: gm

### pokemon-lifecycle-C059: Evolution Undo Composable
- **cap_id**: pokemon-lifecycle-C059
- **name**: Evolution Undo Composable
- **type**: composable-function
- **location**: `app/composables/useEvolutionUndo.ts` -> `useEvolutionUndo()`
- **game_concept**: Post-evolution undo management
- **description**: Manages post-evolution undo state. Stores pre-evolution snapshots keyed by Pokemon ID using useState (SSR-safe). recordEvolution: saves snapshot. canUndo: checks if snapshot exists. undoEvolution: calls evolution-undo API and removes snapshot. clearUndo/clearAll: cleanup functions. Immutable state management.
- **inputs**: pokemonId, PokemonSnapshot
- **outputs**: Functions: recordEvolution, canUndo, undoEvolution, clearUndo, clearAll
- **accessible_from**: gm

### pokemon-lifecycle-C060: Pokemon Edit Form Component
- **cap_id**: pokemon-lifecycle-C060
- **name**: Pokemon Edit Form Component
- **type**: component
- **location**: `app/components/pokemon/PokemonEditForm.vue`
- **game_concept**: Pokemon header/identity editing
- **description**: Displays and edits Pokemon header information: species, nickname, level, experience, gender, shiny checkbox, location, type badges, and sprite. Emits update:editData on field changes. Supports read-only and edit modes.
- **inputs**: props: pokemon (Pokemon), editData (Partial<Pokemon>), isEditing (boolean), spriteUrl (string)
- **outputs**: emit: update:editData
- **accessible_from**: gm

### pokemon-lifecycle-C061: Pokemon Level-Up Panel Component
- **cap_id**: pokemon-lifecycle-C061
- **name**: Pokemon Level-Up Panel Component
- **type**: component
- **location**: `app/components/pokemon/PokemonLevelUpPanel.vue`
- **game_concept**: PTU level-up workflow UI
- **description**: Displays level-up information panel showing stat points gained, tutor points, new moves available, and ability milestones. Provides inline action buttons to open StatAllocationPanel, MoveLearningPanel, and AbilityAssignmentPanel sub-components. Shows evolution reminder.
- **inputs**: pokemon (Pokemon), levelUpInfo, currentLevel, targetLevel
- **outputs**: Events: allocated, ability-assigned, move-learned
- **accessible_from**: gm

### pokemon-lifecycle-C062: Stat Allocation Panel Component
- **cap_id**: pokemon-lifecycle-C062
- **name**: Stat Allocation Panel Component
- **type**: component
- **location**: `app/components/pokemon/StatAllocationPanel.vue`
- **game_concept**: PTU stat point allocation UI with Base Relations
- **description**: Interactive stat allocation UI. Shows per-stat rows with base, points, pending, final values. Plus/minus buttons for allocation. Displays Base Relations tiers and violations. Shows unallocated badge. Uses useLevelUpAllocation composable. Submits to allocate-stats API.
- **inputs**: props: pokemon, pointsToAllocate
- **outputs**: Events: allocated, cancelled
- **accessible_from**: gm

### pokemon-lifecycle-C063: Move Learning Panel Component
- **cap_id**: pokemon-lifecycle-C063
- **name**: Move Learning Panel Component
- **type**: component
- **location**: `app/components/pokemon/MoveLearningPanel.vue`
- **game_concept**: PTU move learning UI (max 6 moves)
- **description**: Shows current moves (up to 6 slots) and available new moves with full details (type, class, frequency, DB, AC, effect). Supports learning by adding to empty slot or replacing existing move. Calls learn-move API.
- **inputs**: props: pokemon, availableMoves
- **outputs**: Events: learned, cancelled
- **accessible_from**: gm

### pokemon-lifecycle-C064: Ability Assignment Panel Component
- **cap_id**: pokemon-lifecycle-C064
- **name**: Ability Assignment Panel Component
- **type**: component
- **location**: `app/components/pokemon/AbilityAssignmentPanel.vue`
- **game_concept**: PTU ability milestone selection UI
- **description**: Radio-button selection of abilities for Level 20/40 milestones. Shows current abilities, categorized options (Basic/Advanced/High) with effect descriptions, loading state for ability data lookup. Calls assign-ability API.
- **inputs**: props: pokemon, milestone ('second' | 'third'), speciesAbilities, numBasicAbilities
- **outputs**: Events: assigned, cancelled
- **accessible_from**: gm

### pokemon-lifecycle-C065: Evolution Confirm Modal Component
- **cap_id**: pokemon-lifecycle-C065
- **name**: Evolution Confirm Modal Component
- **type**: component
- **location**: `app/components/pokemon/EvolutionConfirmModal.vue`
- **game_concept**: PTU evolution wizard (multi-step)
- **description**: Multi-step evolution wizard modal. Step 1: Stat redistribution (EvolutionStatStep). Step 2: Ability resolution (EvolutionAbilityStep). Step 3: Move learning (EvolutionMoveStep). Shows species change summary, type badges, item requirement notes. Calls evolve API on confirmation. Used from both Pokemon sheet page and XP distribution results.
- **inputs**: Evolution check data (species, stats, abilities, moves, triggers)
- **outputs**: Events: close, evolved
- **accessible_from**: gm

### pokemon-lifecycle-C066: Evolution Stat Step Component
- **cap_id**: pokemon-lifecycle-C066
- **name**: Evolution Stat Step Component
- **type**: component
- **location**: `app/components/pokemon/EvolutionStatStep.vue`
- **game_concept**: PTU evolution stat redistribution UI
- **description**: Step 1 of evolution wizard. Shows old vs new base stats with up/down indicators. Stat point input with increment/decrement. Shows required/current point total. Displays Base Relations violations. HP preview showing old vs new max HP. Skip Base Relations checkbox for GM override.
- **inputs**: props: oldBaseStats, newNatureAdjustedBase, statPointInputs, currentMaxHp, newMaxHp, requiredPointTotal, currentPointTotal, isPointTotalValid, violations, skipBaseRelations
- **outputs**: Events: increment, decrement, update:skip-base-relations
- **accessible_from**: gm

### pokemon-lifecycle-C067: Evolution Ability Step Component
- **cap_id**: pokemon-lifecycle-C067
- **name**: Evolution Ability Step Component
- **type**: component
- **location**: `app/components/pokemon/EvolutionAbilityStep.vue`
- **game_concept**: PTU evolution ability change UI
- **description**: Step 2 of evolution wizard. Shows auto-remapped abilities (positional match), preserved abilities (non-species), and abilities needing GM resolution with selectable options.
- **inputs**: props: abilityRemap (AbilityRemapResult), abilityResolutions
- **outputs**: Events: update:resolutions
- **accessible_from**: gm

### pokemon-lifecycle-C068: Evolution Move Step Component
- **cap_id**: pokemon-lifecycle-C068
- **name**: Evolution Move Step Component
- **type**: component
- **location**: `app/components/pokemon/EvolutionMoveStep.vue`
- **game_concept**: PTU evolution move learning UI
- **description**: Step 3 of evolution wizard. Shows current moves, available evolution moves with full details. Add/remove toggles for evolution moves. Shows move slot count (X/6). Replace existing moves if at capacity.
- **inputs**: props: currentMoves, evolutionMoves, addedMoves, removedMoves
- **outputs**: Events: add-move, remove-move
- **accessible_from**: gm

### pokemon-lifecycle-C069: Pokemon Stats Tab Component
- **cap_id**: pokemon-lifecycle-C069
- **name**: Pokemon Stats Tab Component
- **type**: component
- **location**: `app/components/pokemon/PokemonStatsTab.vue`
- **game_concept**: Pokemon stat display and editing
- **description**: Displays base stats, current stats (HP, Attack, Defense, SpAtk, SpDef, Speed), held item, nature, loyalty, and stage modifiers. Supports inline editing mode for HP, held item, and other fields.
- **inputs**: props: pokemon, editData, isEditing
- **outputs**: Events: update:editData
- **accessible_from**: gm, group (via CharacterModal)

### pokemon-lifecycle-C070: Pokemon Moves Tab Component
- **cap_id**: pokemon-lifecycle-C070
- **name**: Pokemon Moves Tab Component
- **type**: component
- **location**: `app/components/pokemon/PokemonMovesTab.vue`
- **game_concept**: Pokemon move list with dice rolling
- **description**: Lists Pokemon's moves with type badges, damage class, frequency, DB, AC, range, and effect. Provides rollAttack and rollDamage buttons using usePokemonSheetRolls composable. Shows last roll results.
- **inputs**: props: pokemon
- **outputs**: Dice roll results displayed inline
- **accessible_from**: gm, group (via CharacterModal)

### pokemon-lifecycle-C071: Pokemon Capabilities Tab Component
- **cap_id**: pokemon-lifecycle-C071
- **name**: Pokemon Capabilities Tab Component
- **type**: component
- **location**: `app/components/pokemon/PokemonCapabilitiesTab.vue`
- **game_concept**: PTU Pokemon movement and capabilities display
- **description**: Displays Pokemon capabilities: Overland, Swim, Sky, Burrow, Levitate, Teleport movement speeds, Jump (high/long), Power, Weight Class, Size, Naturewalk, and other capabilities.
- **inputs**: props: pokemon
- **outputs**: Display only
- **accessible_from**: gm, group (via CharacterModal)

### pokemon-lifecycle-C072: Pokemon Skills Tab Component
- **cap_id**: pokemon-lifecycle-C072
- **name**: Pokemon Skills Tab Component
- **type**: component
- **location**: `app/components/pokemon/PokemonSkillsTab.vue`
- **game_concept**: PTU Pokemon skill checks
- **description**: Displays Pokemon skills with dice formulas. Clickable skills roll the dice using usePokemonSheetRolls composable. Shows last skill roll result. Also displays egg groups, tutor points, and training exp info.
- **inputs**: props: pokemon
- **outputs**: Dice roll results displayed inline
- **accessible_from**: gm, group (via CharacterModal)

### pokemon-lifecycle-C073: Pokemon Prisma Model
- **cap_id**: pokemon-lifecycle-C073
- **name**: Pokemon Prisma Model
- **type**: prisma-model
- **location**: `app/prisma/schema.prisma` -> model Pokemon
- **game_concept**: Pokemon database entity
- **description**: Core Pokemon data model with 40+ fields. UUID primary key. Foreign key to HumanCharacter (ownerId). JSON TEXT fields for nature, stageModifiers, abilities, moves, capabilities, skills, statusConditions, eggGroups. Scalar fields for all stats (base and current), HP, experience, level, loyalty (0-6), tutorPoints, trainingExp, injuries, rest tracking, display (spriteUrl, shiny, gender), categorization (origin, isInLibrary, location, notes). Timestamps.
- **inputs**: N/A (schema definition)
- **outputs**: N/A (schema definition)
- **accessible_from**: api-only (database layer)

### pokemon-lifecycle-C074: SpeciesData Prisma Model
- **cap_id**: pokemon-lifecycle-C074
- **name**: SpeciesData Prisma Model
- **type**: prisma-model
- **location**: `app/prisma/schema.prisma` -> model SpeciesData
- **game_concept**: Pokemon species reference data
- **description**: Species reference data seeded from pokedex markdown files. Includes base stats, types, abilities (JSON with numBasicAbilities count), learnset (JSON of {level, move}), evolutionTriggers (JSON of EvolutionTrigger), movement capabilities, size, skills, and capabilities. Links to EncounterTableEntry.
- **inputs**: N/A (seeded reference data)
- **outputs**: N/A (seeded reference data)
- **accessible_from**: api-only (database layer)

### pokemon-lifecycle-C075: Pokemon Type Definition
- **cap_id**: pokemon-lifecycle-C075
- **name**: Pokemon Type Definition
- **type**: prisma-field
- **location**: `app/types/character.ts` -> interface Pokemon
- **game_concept**: Pokemon runtime type
- **description**: Complete TypeScript interface for Pokemon entities. 35+ typed fields covering: identity (id, species, nickname, level, experience, nature), stats (baseStats, currentStats, currentHp, maxHp, stageModifiers), combat (abilities, moves, heldItem, capabilities, skills, statusConditions), training (tutorPoints, trainingExp, eggGroups), social (loyalty 0-6), healing (restMinutesToday, lastInjuryTime, injuriesHealedToday), display (spriteUrl, shiny, gender), and categorization (ownerId, isInLibrary, origin, location, notes).
- **inputs**: N/A (type definition)
- **outputs**: N/A (type definition)
- **accessible_from**: all views (shared type)

### pokemon-lifecycle-C076: EvolutionTrigger Type Definition
- **cap_id**: pokemon-lifecycle-C076
- **name**: EvolutionTrigger Type Definition
- **type**: prisma-field
- **location**: `app/types/species.ts` -> interface EvolutionTrigger
- **game_concept**: PTU evolution trigger specification
- **description**: Describes one possible evolution path: toSpecies, targetStage, minimumLevel, requiredItem, itemMustBeHeld, requiredGender (P2), requiredMove (P2).
- **inputs**: N/A (type definition)
- **outputs**: N/A (type definition)
- **accessible_from**: all views (shared type)

### pokemon-lifecycle-C077: PokemonOrigin Type
- **cap_id**: pokemon-lifecycle-C077
- **name**: PokemonOrigin Type
- **type**: prisma-field
- **location**: `app/types/character.ts` -> type PokemonOrigin
- **game_concept**: Pokemon creation origin tracking
- **description**: Discriminated union type: 'manual' | 'wild' | 'template' | 'import' | 'captured'. Stored as plain string in DB. Used for filtering, loyalty defaults, and display.
- **inputs**: N/A (type definition)
- **outputs**: N/A (type definition)
- **accessible_from**: all views (shared type)

### pokemon-lifecycle-C078: WebSocket - Pokemon Evolved Event
- **cap_id**: pokemon-lifecycle-C078
- **name**: WebSocket - Pokemon Evolved Event
- **type**: websocket-event
- **location**: `app/server/utils/websocket.ts` -> `notifyPokemonEvolved()`
- **game_concept**: Real-time evolution notification
- **description**: Broadcasts a 'pokemon_evolved' WebSocket event to all connected clients when a Pokemon evolves or evolution is undone. Includes pokemonId, previousSpecies, newSpecies, ownerId, and changes diff. Enables Group View and Player View to react to evolution in real-time.
- **inputs**: { pokemonId, previousSpecies, newSpecies, ownerId, changes }
- **outputs**: WebSocket broadcast to all clients
- **accessible_from**: gm (triggered by API), group (received), player (received)

### pokemon-lifecycle-C079: CSV Import - Pokemon Sheet Parsing
- **cap_id**: pokemon-lifecycle-C079
- **name**: CSV Import - Pokemon Sheet Parsing
- **type**: service-function
- **location**: `app/server/services/csv-import.service.ts` -> `parsePokemonSheet()`
- **game_concept**: PTU character sheet CSV import
- **description**: Parses a PTU Pokemon character sheet CSV. Extracts species, level, stats, types, moves, abilities, nature, gender, and other fields from the standardized CSV format. Routes through createPokemonRecord for DB creation with origin='import'.
- **inputs**: CSV rows (string[][])
- **outputs**: ParsedPokemon data structure
- **accessible_from**: gm (via character import endpoints)

### pokemon-lifecycle-C080: Starting Loyalty Calculation
- **cap_id**: pokemon-lifecycle-C080
- **name**: Starting Loyalty Calculation
- **type**: service-function
- **location**: `app/server/services/pokemon-generator.service.ts` -> `getStartingLoyalty()` (private)
- **game_concept**: PTU Chapter 10 starting loyalty (decree-049)
- **description**: Maps Pokemon origin to starting loyalty value. Captured/wild: 2 (Wary). Default (manual/template/import): 3 (Neutral).
- **inputs**: PokemonOrigin
- **outputs**: number (0-6 loyalty value)
- **accessible_from**: api-only (internal to generator)

### pokemon-lifecycle-C081: Trainer XP for New Species
- **cap_id**: pokemon-lifecycle-C081
- **name**: Trainer XP for New Species
- **type**: utility
- **location**: `app/utils/trainerExperience.ts` -> `isNewSpecies()`, `applyTrainerXp()`
- **game_concept**: PTU Core p.461 - Trainer XP from new species
- **description**: Checks if a species is new to a trainer's owned species list and applies +1 trainer XP. Used during evolution (evolve.post.ts) and capture. applyTrainerXp handles XP-to-level conversion for trainers (auto-level at 10 XP).
- **inputs**: species name, existingSpecies list; currentXp, currentLevel, xpToAdd
- **outputs**: boolean (isNew); { newXp, newLevel, levelsGained }
- **accessible_from**: gm (used by evolve and capture endpoints)

---

## Capability Chains

### Chain 1: Pokemon Generation (Wild Spawn / Template / Scene Load)
```
SpeciesData (DB) -> generatePokemonData() -> createPokemonRecord() -> buildPokemonCombatant()
    C074             C001                      C002                      C004
Internal functions: distributeStatPoints (C005), selectMovesFromLearnset (C006),
                    pickRandomAbility (C007), getStartingLoyalty (C080)
Nickname: resolveNickname (C008)
```
- **Accessibility**: api-only (triggered internally by encounter/scene/template endpoints)
- **View access**: gm (via encounter creation, scene management)

### Chain 2: Manual Pokemon CRUD
```
GM Page (/gm/pokemon/[id]) -> POST /api/pokemon -> serializePokemon()
                            -> GET /api/pokemon/:id -> serializePokemon()
                            -> PUT /api/pokemon/:id -> serializePokemon()
                            -> DELETE /api/pokemon/:id
PokemonEditForm (C060) -> PokemonStatsTab (C069) / PokemonMovesTab (C070) / etc.
    C012/C013/C014/C015           C009
```
- **Accessibility**: gm only
- **Components**: PokemonEditForm, PokemonStatsTab, PokemonMovesTab, PokemonCapabilitiesTab, PokemonSkillsTab

### Chain 3: Experience and Level-Up
```
POST /api/pokemon/:id/add-experience -> calculateLevelUps() -> checkLevelUp()
    C016                                   C040                  C044
    -> EXPERIENCE_CHART (C041)
    -> getEvolutionLevels (C047)

POST /api/pokemon/:id/level-up-check -> checkLevelUp() -> summarizeLevelUps()
    C022                                  C044             C045

PokemonLevelUpPanel (C061) -> StatAllocationPanel (C062) -> allocate-stats API (C017)
                            -> MoveLearningPanel (C063) -> learn-move API (C023)
                            -> AbilityAssignmentPanel (C064) -> assign-ability API (C018)

useLevelUpAllocation (C058) -> extractStatPoints (C052) -> validateBaseRelations (C050)
                             -> getValidAllocationTargets (C051)
                             -> allocate-stats API (C017)
```
- **Accessibility**: gm only (Pokemon sheet page + XP distribution results)

### Chain 4: Evolution Pipeline
```
POST /api/pokemon/:id/evolution-check -> checkEvolutionEligibility() -> remapAbilities()
    C019                                    C046                          C034
                                         -> getEvolutionMoves() (C048)

EvolutionConfirmModal (C065) -> EvolutionStatStep (C066) + EvolutionAbilityStep (C067) + EvolutionMoveStep (C068)
                              -> POST /api/pokemon/:id/evolve -> performEvolution() (C038)
                                    C020                          -> recalculateStats (C033)
                                                                  -> remapAbilities (C034)
                                                                  -> enrichAbilityEffects (C035)
                                                                  -> consumeStoneFromInventory (C036)
                                                                  -> notifyPokemonEvolved (C078)
                                                                  -> Trainer XP (C081)

useEvolutionUndo (C059) -> POST /api/pokemon/:id/evolution-undo -> restoreStoneToInventory (C037)
                              C021                                   -> notifyPokemonEvolved (C078)
```
- **Accessibility**: gm only (Pokemon sheet page + XP distribution results)

### Chain 5: Pokemon Healing and Rest
```
POST /api/pokemon/:id/rest -> calculateRestHealing()
    C026

POST /api/pokemon/:id/extended-rest -> calculateRestHealing() + clearPersistentStatusConditions()
    C027                               + refreshDailyMoves()

POST /api/pokemon/:id/heal-injury -> canHealInjuryNaturally()
    C028

POST /api/pokemon/:id/pokemon-center -> calculatePokemonCenterTime() + calculatePokemonCenterInjuryHealing()
    C029

POST /api/pokemon/:id/new-day -> daily counter reset
    C030
```
- **Accessibility**: gm only

### Chain 6: Pokemon Ownership Management
```
POST /api/pokemon/:id/link -> set ownerId
    C024
POST /api/pokemon/:id/unlink -> clear ownerId
    C025
```
- **Accessibility**: gm only

### Chain 7: Bulk Management
```
POST /api/pokemon/bulk-action -> archive or delete
    C031
```
- **Accessibility**: gm only

### Chain 8: Pokemon Display (Cross-View)
```
usePokemonSprite (C056) -> getSpriteUrl() / getAnimatedSpriteUrl() / getSpriteWithFallback()
    Used by: PokemonEditForm, PokemonCard, CombatantCard, VTTToken, SceneCanvas, GroupView, PlayerView

usePokemonSheetRolls (C057) -> rollSkill() / rollAttack() / rollDamage()
    Used by: PokemonMovesTab, PokemonSkillsTab
```
- **Accessibility**: gm, group, player (sprite), gm only (dice rolls in sheet context)

### Chain 9: CSV Import
```
CSV Upload -> parsePokemonSheet() -> createPokemonFromCSV() -> createPokemonRecord()
    C079                                                         C002
```
- **Accessibility**: gm only

---

## Accessibility Summary

| Access Level | Capabilities |
|---|---|
| **gm only** | C011 (List), C012 (Create), C013 (Get), C014 (Update), C015 (Delete), C016 (Add XP), C017 (Allocate Stats), C018 (Assign Ability), C019 (Evo Check), C020 (Evolve), C021 (Evo Undo), C022 (Level-Up Check), C023 (Learn Move), C024 (Link), C025 (Unlink), C026 (Rest), C027 (Extended Rest), C028 (Heal Injury), C029 (Pokemon Center), C030 (New Day), C031 (Bulk Action), C039 (Encounter XP Calc), C057 (Sheet Rolls), C058 (Level-Up Allocation), C059 (Evo Undo Composable), C060-C068 (All Pokemon Components), C079 (CSV Import) |
| **gm + group** | C069 (Stats Tab via CharacterModal), C070 (Moves Tab via CharacterModal), C071 (Capabilities Tab via CharacterModal), C072 (Skills Tab via CharacterModal) |
| **gm + group + player** | C056 (Pokemon Sprite), C078 (Evolution WS event received) |
| **api-only** (internal) | C001-C010 (Generator service, serialization, entity builder), C032-C038 (Evolution service functions), C040-C055 (Utility functions), C073-C077 (Types/Schema), C080 (Loyalty calc), C081 (Trainer XP) |

---

## Orphaned Capabilities

| Capability | Status | Notes |
|---|---|---|
| `Pokemon.trainingExp` field (C073) | Stored but unused | Prisma field exists, serialized in API responses, but no API endpoint modifies it and no UI reads/writes it. Intended for PTU daily training XP but workflow not implemented. |
| `Pokemon.eggGroups` field (C073) | Stored but display-only | Field stored and serialized, visible in PokemonSkillsTab, but no breeding or egg-related gameplay feature exists. |
| `Pokemon.location` field (C073) | Editable but informational only | Can be set via PokemonEditForm and API, but not used for any game mechanics. |
| `enrichDefeatedEnemies()` (C043) | Cross-domain | Used by encounter XP distribution, not directly by pokemon-lifecycle APIs. Included here because it feeds calculateEncounterXp(). |

---

## Missing Subsystems

### 1. No Player-Facing Pokemon Management Interface
- **subsystem**: Players cannot view, manage, or interact with their own Pokemon from the Player View beyond seeing them in the team display and combat context. No individual Pokemon sheet, no stat viewing, no move details outside combat.
- **actor**: player
- **ptu_basis**: PTU Chapter 5 (Trainers manage their Pokemon between sessions -- viewing stats, learning moves, allocating stat points on level-up). Chapter 10 (Loyalty management, training).
- **impact**: Players must ask the GM to look up their Pokemon's stats, moves, abilities, and capabilities. GM becomes a proxy for all Pokemon management actions that players should be able to do independently between sessions.

### 2. No Player-Initiated Pokemon Healing
- **subsystem**: All healing actions (rest, extended rest, Pokemon Center, injury healing) can only be triggered from the GM view. Players cannot initiate rest for their own Pokemon.
- **actor**: player
- **ptu_basis**: PTU p.252: Rest healing is a natural activity trainers manage for their Pokemon. Players should be able to rest their Pokemon without GM intervention for routine healing.
- **impact**: GM must manually trigger every healing action for every player's Pokemon, creating bottleneck during downtime scenes.

### 3. No Player-Facing Level-Up Workflow
- **subsystem**: All level-up actions (stat allocation, move learning, ability assignment) exist only in the GM view. After XP distribution, players cannot allocate their own Pokemon's stat points or choose moves.
- **actor**: player
- **ptu_basis**: PTU Core p.198-202: Stat allocation follows Base Relations Rule and is a player decision. Move learning and ability selection at milestones are player choices.
- **impact**: Level-up becomes a GM-managed process. Players cannot make stat allocation choices independently. This is especially problematic when multiple Pokemon level up simultaneously after a battle.

### 4. No Player-Facing Evolution Trigger
- **subsystem**: Evolution checking and execution is entirely GM-side. Players cannot initiate or view evolution options for their own Pokemon.
- **actor**: player
- **ptu_basis**: PTU Core p.202: Evolution is a significant Pokemon milestone. While the GM may adjudicate, the player should be aware of and participate in evolution decisions (stat redistribution, ability selection, move choices).
- **impact**: Players don't know when their Pokemon can evolve. Evolution becomes a surprise GM announcement rather than a player-anticipated event.

### 5. No Pokemon Training XP System
- **subsystem**: The `trainingExp` field exists in the schema but no training XP workflow is implemented -- no endpoint to apply daily training XP, no UI to track or manage it.
- **actor**: both (GM awards, player manages daily training)
- **ptu_basis**: PTU Core p.202: "A Pokemon may gain Experience through Training. Each day, a Pokemon may undergo training to gain Experience Points equal to half the Pokemon's Level, plus any bonuses from the Trainer's Command Rank."
- **impact**: Daily training XP -- a core between-session advancement mechanic -- is entirely absent. Pokemon can only gain XP through combat encounters or manual GM grants.

### 6. No Breeding / Egg System
- **subsystem**: Despite storing eggGroups on every Pokemon, there is no breeding mechanic, egg creation, or egg hatching workflow.
- **actor**: both
- **ptu_basis**: PTU Chapter 10: Breeding rules, egg groups, egg moves, hatch steps.
- **impact**: Breeding is a significant PTU mechanic for obtaining Pokemon with specific moves and abilities. Its absence is acceptable if the campaign doesn't use breeding, but the data model is partially prepared for it.

### 7. No Loyalty/Obedience Check System
- **subsystem**: Loyalty values are stored and displayed but no mechanical effect is enforced. No disobedience checks, no command checks based on loyalty, no loyalty modification workflow.
- **actor**: gm
- **ptu_basis**: PTU Chapter 10 (p.211): Loyalty affects command checks. Low loyalty Pokemon may disobey. Loyalty changes through training, battle, and trainer actions.
- **impact**: Loyalty is decorative. Freshly captured Pokemon (Loyalty 2) behave identically to devoted companions (Loyalty 6) mechanically. No gameplay tension from wild captures.
