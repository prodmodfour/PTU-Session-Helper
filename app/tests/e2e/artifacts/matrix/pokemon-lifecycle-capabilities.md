---
domain: pokemon-lifecycle
mapped_at: 2026-02-19T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 92
files_read: 32
---

# App Capabilities: Pokemon Lifecycle

## Summary
- Total capabilities: 92
- Types: prisma-model(2), prisma-field(6), api-endpoint(22), service-function(11), composable-function(18), store-action(7), store-getter(5), component(7), utility(9), page(3), type-definition(2)
- Orphan capabilities: 3

---

## pokemon-lifecycle-C001: Pokemon Prisma Model

- **Type:** prisma-model
- **Location:** `app/prisma/schema.prisma:Pokemon`
- **Game Concept:** Pokemon data storage
- **Description:** Core data model for all Pokemon. 40+ columns storing species, stats, moves, abilities, capabilities, healing tracking, ownership, and metadata. JSON-stringified columns for complex nested data (nature, stageModifiers, abilities, moves, statusConditions, capabilities, skills, eggGroups).
- **Inputs:** N/A (schema definition)
- **Outputs:** Defines DB structure: id, species, nickname, level, experience, nature, type1/type2, base stats (6), current stats (7), stageModifiers, abilities, moves, heldItem, capabilities, skills, statusConditions, injuries, temporaryHp, rest/healing tracking (4 fields), tutorPoints, trainingExp, spriteUrl, shiny, gender, eggGroups, isInLibrary (archive flag), origin, location, notes, ownerId (FK to HumanCharacter)
- **Orphan:** false

## pokemon-lifecycle-C002: SpeciesData Prisma Model

- **Type:** prisma-model
- **Location:** `app/prisma/schema.prisma:SpeciesData`
- **Game Concept:** Pokemon species reference data
- **Description:** Reference data for all Pokemon species. Contains base stats, abilities, learnset, capabilities, evolution info, skills, and size. Seeded from pokedex files. Immutable during gameplay.
- **Inputs:** N/A (schema definition)
- **Outputs:** Defines DB structure: id, name (unique), type1/type2, base stats (6), abilities (JSON), numBasicAbilities, eggGroups (JSON), evolutionStage, maxEvolutionStage, movement capabilities (6), power, jumpHigh, jumpLong, weightClass, learnset (JSON), skills (JSON), capabilities (JSON), size
- **Orphan:** false

## pokemon-lifecycle-C003: Pokemon.isInLibrary Archive Flag

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:Pokemon.isInLibrary`
- **Game Concept:** Pokemon library visibility / archival
- **Description:** Boolean flag repurposed as archive flag. `true` = visible in library sheets, `false` = archived/hidden. Default `true`. Used by list endpoint to filter archived Pokemon and by bulk-action to archive.
- **Inputs:** Boolean value
- **Outputs:** Controls visibility in GET /api/pokemon listing
- **Orphan:** false

## pokemon-lifecycle-C004: Pokemon.origin Field

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:Pokemon.origin`
- **Game Concept:** Pokemon creation provenance tracking
- **Description:** Tracks how a Pokemon was created. Values: `'manual'` (form), `'wild'` (scene/wild spawn), `'template'` (encounter template), `'import'` (CSV import), `'captured'` (capture system). Default `'manual'`. Used for filtering in library and bulk actions.
- **Inputs:** PokemonOrigin string
- **Outputs:** Filterable metadata for library management
- **Orphan:** false

## pokemon-lifecycle-C005: Pokemon.ownerId Ownership Relation

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:Pokemon.ownerId`
- **Game Concept:** Pokemon-to-Trainer ownership link
- **Description:** Foreign key to HumanCharacter. Nullable — unowned Pokemon have `null`. Set by link/unlink endpoints and capture system. Used to group Pokemon by trainer.
- **Inputs:** HumanCharacter ID or null
- **Outputs:** Links Pokemon to owner; enables getPokemonByOwner queries
- **Orphan:** false

## pokemon-lifecycle-C006: Pokemon Healing Tracking Fields

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:Pokemon.lastInjuryTime,restMinutesToday,injuriesHealedToday,lastRestReset`
- **Game Concept:** PTU rest and healing daily counters
- **Description:** Four fields tracking healing state: `lastInjuryTime` (DateTime for 24h natural healing timer), `restMinutesToday` (Int, max 480 for HP regen cap), `injuriesHealedToday` (Int, max 3), `lastRestReset` (DateTime for daily counter auto-reset).
- **Inputs:** Updated by rest/healing API endpoints
- **Outputs:** Controls healing eligibility and daily limits
- **Orphan:** false

## pokemon-lifecycle-C007: Pokemon Injury Field

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:Pokemon.injuries`
- **Game Concept:** PTU injury tracking
- **Description:** Integer count of current injuries. At 5+ injuries, rest healing is blocked. Injuries are gained from HP thresholds (50%, 0%, -50%, -100%) during combat. Healed by Pokemon Center (max 3/day) or natural healing (24h timer).
- **Inputs:** Incremented by combat damage, decremented by healing
- **Outputs:** Affects rest eligibility and capture rate
- **Orphan:** false

## pokemon-lifecycle-C008: Pokemon Status Conditions Field

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:Pokemon.statusConditions`
- **Game Concept:** PTU status conditions (persistent + volatile)
- **Description:** JSON array of status conditions. Each has name, type (persistent/volatile), and effects. Persistent conditions cleared by extended rest; all conditions cleared by Pokemon Center. Affect capture rate (persistent +10, volatile +5).
- **Inputs:** Added/removed by combat status endpoints
- **Outputs:** Affects rest healing, capture rate, combat behavior
- **Orphan:** false

---

## pokemon-lifecycle-C009: List All Pokemon API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/index.get.ts:default`
- **Game Concept:** Pokemon library browsing
- **Description:** Returns all Pokemon, filtered by archive status and optionally by origin. Default: only non-archived (`isInLibrary: true`). Parses JSON fields and reshapes to nested objects. Does NOT include injuries, temporaryHp, capabilities, skills, rest/healing tracking, tutorPoints, trainingExp, or eggGroups.
- **Inputs:** Query: `origin` (optional filter, 'all' = no filter), `includeArchived` ('true' to include archived)
- **Outputs:** `{ success: true, data: Pokemon[] }` — species, nickname, level, experience, nature, types, baseStats, currentStats, currentHp, maxHp, stageModifiers, abilities, moves, heldItem, statusConditions, ownerId, spriteUrl, shiny, gender, isInLibrary, origin, location, notes
- **Orphan:** false

## pokemon-lifecycle-C010: Create Pokemon API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/index.post.ts:default`
- **Game Concept:** Manual Pokemon creation
- **Description:** Creates a new Pokemon from form data. Auto-resolves nickname via `resolveNickname()`. Applies PTU HP formula (`level + baseHp*3 + 10`) when maxHp not provided. JSON-stringifies complex fields for storage. Sets `origin: 'manual'` by default.
- **Inputs:** Body: species (required), nickname, level, experience, types/type1/type2, baseStats, maxHp, currentHp, currentStats, nature, stageModifiers, abilities, moves, heldItem, capabilities, skills, statusConditions, tutorPoints, trainingExp, eggGroups, ownerId, spriteUrl, shiny, gender, isInLibrary, origin, location, notes
- **Outputs:** `{ success: true, data: Pokemon }` — full parsed Pokemon including capabilities, skills, training fields
- **Orphan:** false

## pokemon-lifecycle-C011: Get Single Pokemon API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id].get.ts:default`
- **Game Concept:** Pokemon sheet data retrieval
- **Description:** Returns the most complete Pokemon data including all fields. This is the only endpoint that returns injuries, temporaryHp, capabilities, skills, tutorPoints, trainingExp, eggGroups, and rest/healing tracking fields.
- **Inputs:** URL param: `id` (required)
- **Outputs:** `{ success: true, data: Pokemon }` — all fields including injuries, temporaryHp, capabilities, skills, tutorPoints, trainingExp, eggGroups, lastInjuryTime, restMinutesToday, injuriesHealedToday, lastRestReset
- **Orphan:** false

## pokemon-lifecycle-C012: Update Pokemon API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id].put.ts:default`
- **Game Concept:** Pokemon sheet editing
- **Description:** Partial update of any Pokemon fields. Supports nested updates for baseStats and currentStats. Auto-resolves nickname if blank. Converts date strings for healing fields. Response omits injuries, capabilities, skills, training, and healing tracking fields.
- **Inputs:** URL param: `id`. Body: any subset of Pokemon fields including species, nickname, level, types, baseStats, currentStats, currentHp, maxHp, nature, stageModifiers, abilities, moves, heldItem, statusConditions, injuries, restMinutesToday, injuriesHealedToday, lastInjuryTime, lastRestReset, ownerId, spriteUrl, shiny, gender, isInLibrary, origin, notes, location
- **Outputs:** `{ success: true, data: Pokemon }` — list-level response (excludes injuries, capabilities, skills, rest tracking)
- **Orphan:** false

## pokemon-lifecycle-C013: Delete Pokemon API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id].delete.ts:default`
- **Game Concept:** Pokemon deletion
- **Description:** Deletes a Pokemon by ID. Does NOT check active encounters (unlike bulk-action). Relies on Prisma error for non-existent records.
- **Inputs:** URL param: `id` (required)
- **Outputs:** `{ success: true }`
- **Orphan:** false

## pokemon-lifecycle-C014: Link Pokemon to Trainer API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id]/link.post.ts:default`
- **Game Concept:** Pokemon ownership assignment
- **Description:** Links a Pokemon to a trainer by setting `ownerId`. Validates trainer exists. Response format inconsistent (no `success` field, raw DB fields leaked).
- **Inputs:** URL param: `id`. Body: `trainerId` (required)
- **Outputs:** `{ data: Pokemon }` — includes raw DB columns and parsed versions
- **Orphan:** false

## pokemon-lifecycle-C015: Unlink Pokemon from Trainer API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id]/unlink.post.ts:default`
- **Game Concept:** Pokemon ownership removal
- **Description:** Unlinks a Pokemon from its trainer by setting `ownerId` to null. Response format inconsistent (no `success` field, raw DB fields leaked).
- **Inputs:** URL param: `id`
- **Outputs:** `{ data: Pokemon }` — includes raw DB columns and parsed versions
- **Orphan:** false

## pokemon-lifecycle-C016: Pokemon 30-Minute Rest API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id]/rest.post.ts:default`
- **Game Concept:** PTU 30-minute rest healing
- **Description:** Applies one 30-minute rest period. Heals 1/16 maxHp. Blocked at 5+ injuries, daily rest cap of 480 minutes, or full HP. Auto-resets daily counters if new day. Returns success:false with reason if blocked.
- **Inputs:** URL param: `id`
- **Outputs:** `{ success: bool, message: string, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }`
- **Orphan:** false

## pokemon-lifecycle-C017: Pokemon Extended Rest API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id]/extended-rest.post.ts:default`
- **Game Concept:** PTU 4+ hour extended rest
- **Description:** Simulates 8 rest periods (4 hours). Each period heals 1/16 maxHp (subject to same blocks as regular rest). Also clears persistent status conditions and restores daily-frequency moves.
- **Inputs:** URL param: `id`
- **Outputs:** `{ success: true, message, data: { hpHealed, newHp, maxHp, clearedStatuses[], restoredMoves[], restMinutesToday, restMinutesRemaining } }`
- **Orphan:** false

## pokemon-lifecycle-C018: Pokemon Center Healing API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id]/pokemon-center.post.ts:default`
- **Game Concept:** PTU Pokemon Center full heal
- **Description:** Full HP restoration. Clears ALL status conditions. Restores ALL move usage. Heals injuries (max 3/day, daily limit). Calculates healing time (1hr base + 30min/injury, or 1hr/injury at 5+).
- **Inputs:** URL param: `id`
- **Outputs:** `{ success: true, message, data: { hpHealed, newHp, maxHp, injuriesHealed, injuriesRemaining, clearedStatuses[], restoredMoves[], healingTime, healingTimeDescription, atDailyInjuryLimit, injuriesHealedToday } }`
- **Orphan:** false

## pokemon-lifecycle-C019: Natural Injury Healing API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id]/heal-injury.post.ts:default`
- **Game Concept:** PTU natural injury healing (24h timer)
- **Description:** Heals one injury naturally. Requires 24 hours since last injury. Subject to daily limit of 3 injuries healed. Returns success:false with reason if blocked (no injuries, timer not elapsed, daily limit).
- **Inputs:** URL param: `id`
- **Outputs:** Success: `{ success: true, data: { injuriesHealed: 1, injuries, injuriesHealedToday } }`. Failure: `{ success: false, message, data: varies }`
- **Orphan:** false

## pokemon-lifecycle-C020: Pokemon New Day Reset API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id]/new-day.post.ts:default`
- **Game Concept:** PTU daily counter reset (single Pokemon)
- **Description:** Unconditionally resets daily healing counters for a single Pokemon: restMinutesToday → 0, injuriesHealedToday → 0, lastRestReset → now.
- **Inputs:** URL param: `id`
- **Outputs:** `{ success: true, message, data: { restMinutesToday: 0, injuriesHealedToday: 0, lastRestReset } }`
- **Orphan:** false

## pokemon-lifecycle-C021: Bulk Archive/Delete API

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/bulk-action.post.ts:default`
- **Game Concept:** Pokemon library management (bulk operations)
- **Description:** Bulk archive (set isInLibrary:false) or delete multiple Pokemon. Supports filtering by IDs or by origin/hasOwner. Safety check: blocks operations on Pokemon in active encounters (HTTP 409).
- **Inputs:** Body: `action` ('archive'|'delete'), `pokemonIds[]` or `filter` ({ origin, hasOwner })
- **Outputs:** `{ success: true, data: { action, count } }`
- **Orphan:** false

## pokemon-lifecycle-C022: Species List API

- **Type:** api-endpoint
- **Location:** `app/server/api/species/index.get.ts:default`
- **Game Concept:** Species reference data lookup
- **Description:** Returns species reference data for autocomplete and creation. Searchable by name (case-insensitive), paginated up to 500. Returns id, name, types, baseStats, abilities (parsed), evolutionStage.
- **Inputs:** Query: `search` (optional), `limit` (optional, max 500, default 100)
- **Outputs:** `{ success: true, data: SpeciesData[] }` with types array and baseStats object
- **Orphan:** false

## pokemon-lifecycle-C023: Calculate Capture Rate API

- **Type:** api-endpoint
- **Location:** `app/server/api/capture/rate.post.ts:default`
- **Game Concept:** PTU capture rate calculation
- **Description:** Calculates capture rate for a Pokemon. Accepts either pokemonId (auto-lookup) or raw data (level, currentHp, maxHp). Looks up species for evolution stage. Returns rate, difficulty description, and full breakdown.
- **Inputs:** Body: `pokemonId` OR (`level`, `currentHp`, `maxHp`, optional: `species`, `statusConditions`, `injuries`, `isShiny`)
- **Outputs:** `{ success: true, data: { species, level, currentHp, maxHp, captureRate, difficulty, canBeCaptured, hpPercentage, breakdown } }`
- **Orphan:** false

## pokemon-lifecycle-C024: Execute Capture Attempt API

- **Type:** api-endpoint
- **Location:** `app/server/api/capture/attempt.post.ts:default`
- **Game Concept:** PTU capture execution
- **Description:** Executes a capture attempt. Calculates capture rate, rolls 1d100, applies trainer level modifier. On success: auto-links Pokemon to trainer (`ownerId = trainerId`) and sets `origin: 'captured'`. Handles natural 100 (auto-capture) and critical hits (nat 20 accuracy).
- **Inputs:** Body: `pokemonId` (required), `trainerId` (required), `accuracyRoll` (optional), `modifiers` (optional), `pokeBallType` (optional, future)
- **Outputs:** `{ success: true, data: { captured: bool, roll, modifiedRoll, captureRate, effectiveCaptureRate, naturalHundred, criticalHit, trainerLevel, difficulty, breakdown, pokemon: {...}, trainer: {...} } }`
- **Orphan:** false

## pokemon-lifecycle-C025: CSV Import API

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/import-csv.post.ts:default`
- **Game Concept:** PTU character sheet CSV import
- **Description:** Imports a PTU character sheet from CSV. Detects sheet type (trainer or pokemon). For Pokemon sheets: parses all fields from CSV grid, routes through `createPokemonFromCSV()` → `createPokemonRecord()` with `origin: 'import'`.
- **Inputs:** Body: `csvContent` (required string)
- **Outputs:** `{ success: true, type: 'pokemon', data: { id, species, nickname, level } }`
- **Orphan:** false

## pokemon-lifecycle-C026: Global New Day Reset API

- **Type:** api-endpoint
- **Location:** `app/server/api/game/new-day.post.ts:default`
- **Game Concept:** PTU new day (global daily reset)
- **Description:** Resets daily healing counters for ALL Pokemon and ALL characters in a single operation. Resets restMinutesToday, injuriesHealedToday, lastRestReset. Also resets drainedAp on characters.
- **Inputs:** None
- **Outputs:** `{ success: true, message, data: { pokemonReset: count, charactersReset: count, timestamp } }`
- **Orphan:** false

## pokemon-lifecycle-C027: Scene-to-Encounter Pokemon Creation

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/from-scene.post.ts:default`
- **Game Concept:** Wild Pokemon spawning from scene
- **Description:** Creates an encounter from a scene. Each scene Pokemon entry generates a real DB record via `generateAndCreatePokemon()` with `origin: 'wild'`. Wraps each in a combatant via `buildPokemonCombatant()` on the 'enemies' side with auto-placement.
- **Inputs:** Body: `sceneId` (required), `battleType` (optional)
- **Outputs:** `{ success: true, data: Encounter }` with Pokemon as combatants
- **Orphan:** false

---

## pokemon-lifecycle-C028: Generate Pokemon Data (Pure)

- **Type:** service-function
- **Location:** `app/server/services/pokemon-generator.service.ts:generatePokemonData`
- **Game Concept:** Pokemon character sheet generation
- **Description:** Pure data generation from species + level. Looks up SpeciesData for base stats, types, abilities, learnset, capabilities. Distributes stat points weighted by base stats (level-1 points). Calculates HP via PTU formula (`level + baseHp*3 + 10`). Auto-selects moves from learnset. Picks random Basic Ability. Supports overrides for moves/abilities (template preservation).
- **Inputs:** `GeneratePokemonInput`: speciesName, level, nickname, origin, originLabel, overrideMoves, overrideAbilities
- **Outputs:** `GeneratedPokemonData`: species, level, nickname, types, baseStats, calculatedStats, maxHp, moves, abilities, gender, movementCaps, power, jump, weightClass, otherCapabilities, skills, eggGroups, size
- **Orphan:** false

## pokemon-lifecycle-C029: Create Pokemon DB Record

- **Type:** service-function
- **Location:** `app/server/services/pokemon-generator.service.ts:createPokemonRecord`
- **Game Concept:** Pokemon database persistence
- **Description:** Writes a Pokemon to the database from generated data. Resolves nickname via `resolveNickname()`. JSON-stringifies all complex fields. Sets `isInLibrary: true`. Stores origin and originLabel (in notes).
- **Inputs:** `GeneratePokemonInput` + `GeneratedPokemonData`
- **Outputs:** `CreatedPokemon`: id, species, level, nickname, data
- **Orphan:** false

## pokemon-lifecycle-C030: Generate and Create Pokemon

- **Type:** service-function
- **Location:** `app/server/services/pokemon-generator.service.ts:generateAndCreatePokemon`
- **Game Concept:** Pokemon creation (combined pipeline)
- **Description:** Convenience wrapper that calls `generatePokemonData()` then `createPokemonRecord()`. Primary entry point for most callers (scene, template, wild spawn).
- **Inputs:** `GeneratePokemonInput`
- **Outputs:** `CreatedPokemon`
- **Orphan:** false

## pokemon-lifecycle-C031: Build Pokemon Combatant

- **Type:** service-function
- **Location:** `app/server/services/pokemon-generator.service.ts:buildPokemonCombatant`
- **Game Concept:** Pokemon-to-combatant conversion for encounters
- **Description:** Converts a CreatedPokemon into a full Combatant for encounter use. Builds Pokemon entity with defaults, maps size to token size, delegates to `buildCombatantFromEntity()`.
- **Inputs:** CreatedPokemon, side (string), position (optional {x,y})
- **Outputs:** Combatant (embedded in encounter's combatants JSON)
- **Orphan:** false

## pokemon-lifecycle-C032: Distribute Stat Points

- **Type:** service-function
- **Location:** `app/server/services/pokemon-generator.service.ts:distributeStatPoints`
- **Game Concept:** PTU stat point distribution
- **Description:** Distributes (level - 1) stat points weighted by base stats. Uses random weighted selection — higher base stats get proportionally more points. Internal helper used by generatePokemonData.
- **Inputs:** baseStats (6 stats), level
- **Outputs:** calculatedStats (base + distributed points for each stat)
- **Orphan:** false

## pokemon-lifecycle-C033: Select Moves From Learnset

- **Type:** service-function
- **Location:** `app/server/services/pokemon-generator.service.ts:selectMovesFromLearnset`
- **Game Concept:** PTU level-up move selection
- **Description:** Selects up to 6 most recent moves from species learnset at or below the given level. Fetches full MoveData from DB for each. Falls back to stub if move not found in DB.
- **Inputs:** learnset (array of {level, move}), level
- **Outputs:** MoveDetail[] (up to 6 moves with full data)
- **Orphan:** false

## pokemon-lifecycle-C034: Pick Random Ability

- **Type:** service-function
- **Location:** `app/server/services/pokemon-generator.service.ts:pickRandomAbility`
- **Game Concept:** PTU ability assignment
- **Description:** Picks one random Basic Ability from the species ability list. Respects `numBasicAbilities` to limit selection pool to basic abilities only (Advanced Abilities are for level 20+).
- **Inputs:** abilityNames[], numBasicAbilities
- **Outputs:** Array of one {name, effect} (empty string effect)
- **Orphan:** false

## pokemon-lifecycle-C035: Resolve Nickname

- **Type:** service-function
- **Location:** `app/server/utils/pokemon-nickname.ts:resolveNickname`
- **Game Concept:** Pokemon auto-naming
- **Description:** If nickname provided and non-empty, returns trimmed nickname. Otherwise counts existing Pokemon of that species in DB and returns `"Species N+1"` (e.g., "Pikachu 3").
- **Inputs:** species (string), nickname (optional string)
- **Outputs:** Resolved nickname string
- **Orphan:** false

## pokemon-lifecycle-C036: Detect CSV Sheet Type

- **Type:** service-function
- **Location:** `app/server/services/csv-import.service.ts:detectSheetType`
- **Game Concept:** PTU sheet CSV detection
- **Description:** Detects whether a CSV is a trainer sheet or pokemon sheet by examining the first few rows for 'species' keyword. Returns 'trainer', 'pokemon', or 'unknown'.
- **Inputs:** rows (string[][])
- **Outputs:** 'trainer' | 'pokemon' | 'unknown'
- **Orphan:** false

## pokemon-lifecycle-C037: Parse Pokemon CSV Sheet

- **Type:** service-function
- **Location:** `app/server/services/csv-import.service.ts:parsePokemonSheet`
- **Game Concept:** PTU Pokemon sheet CSV parsing
- **Description:** Extracts all Pokemon data from a CSV grid: nickname, species, level, nature, gender, shiny, types, base stats, calculated stats, maxHp, moves (up to 11), abilities (up to 8), capabilities (overland/swim/sky/burrow/levitate/power/jump), skills, held item. Uses fixed grid positions for each field.
- **Inputs:** rows (string[][])
- **Outputs:** ParsedPokemon object with all extracted fields
- **Orphan:** false

## pokemon-lifecycle-C038: Create Pokemon From CSV

- **Type:** service-function
- **Location:** `app/server/services/csv-import.service.ts:createPokemonFromCSV`
- **Game Concept:** CSV-imported Pokemon DB creation
- **Description:** Routes parsed CSV Pokemon through `createPokemonRecord()` for consistent DB creation. Looks up SpeciesData for authoritative types. Maps CSV move format to MoveDetail. Preserves nature, shiny, heldItem from CSV. Sets `origin: 'import'`, `originLabel: 'Imported from PTU sheet'`.
- **Inputs:** ParsedPokemon
- **Outputs:** { id, species, nickname, level }
- **Orphan:** false

---

## pokemon-lifecycle-C039: Calculate Capture Rate (Pure)

- **Type:** utility
- **Location:** `app/utils/captureRate.ts:calculateCaptureRate`
- **Game Concept:** PTU 1.05 capture rate formula
- **Description:** Pure calculation: base 100, minus level*2, HP% modifier, evolution stage penalty, shiny/legendary modifiers, status condition bonuses (persistent +10, volatile +5 each), injury bonus (+5 each), stuck/slow modifiers. Caps at 0 minimum. Returns canBeCaptured flag (false at 0 HP).
- **Inputs:** { level, currentHp, maxHp, evolutionStage, maxEvolutionStage, statusConditions, injuries, isShiny, isLegendary }
- **Outputs:** { captureRate, canBeCaptured, hpPercentage, breakdown }
- **Orphan:** false

## pokemon-lifecycle-C040: Execute Capture Roll (Pure)

- **Type:** utility
- **Location:** `app/utils/captureRate.ts:attemptCapture`
- **Game Concept:** PTU capture dice roll
- **Description:** Rolls 1d100. Natural 100 = auto-capture. Effective rate = captureRate + trainerLevel + modifiers. Critical hit doubles effective rate. Success if roll <= effectiveCaptureRate.
- **Inputs:** captureRate, trainerLevel, modifiers, criticalHit
- **Outputs:** { success, roll, modifiedRoll, effectiveCaptureRate, naturalHundred }
- **Orphan:** false

## pokemon-lifecycle-C041: Capture Difficulty Description

- **Type:** utility
- **Location:** `app/utils/captureRate.ts:getCaptureDescription`
- **Game Concept:** Capture difficulty display
- **Description:** Converts numeric capture rate to human-readable difficulty string (e.g., "Very Easy", "Moderate", "Nearly Impossible").
- **Inputs:** captureRate (number)
- **Outputs:** Difficulty string
- **Orphan:** true

## pokemon-lifecycle-C042: Should Reset Daily Counters

- **Type:** utility
- **Location:** `app/utils/restHealing.ts:shouldResetDailyCounters`
- **Game Concept:** PTU new day detection
- **Description:** Compares `lastRestReset` timestamp to current time to detect if a new calendar day has begun. Used by all rest/healing endpoints.
- **Inputs:** lastRestReset (Date or null)
- **Outputs:** boolean
- **Orphan:** false

## pokemon-lifecycle-C043: Calculate Rest Healing

- **Type:** utility
- **Location:** `app/utils/restHealing.ts:calculateRestHealing`
- **Game Concept:** PTU 30-minute rest HP formula
- **Description:** Calculates HP restored from one 30-minute rest period: 1/16 of maxHp (rounded down). Returns 0 if blocked: 5+ injuries, daily rest cap (480 min), or already at full HP.
- **Inputs:** { currentHp, maxHp, injuries, restMinutesToday }
- **Outputs:** { hpHealed, blocked, blockReason }
- **Orphan:** false

## pokemon-lifecycle-C044: Can Heal Injury Naturally

- **Type:** utility
- **Location:** `app/utils/restHealing.ts:canHealInjuryNaturally`
- **Game Concept:** PTU 24-hour natural injury healing timer
- **Description:** Checks if 24 hours have passed since the last injury. Returns eligibility with hours remaining if not eligible.
- **Inputs:** lastInjuryTime (Date or null)
- **Outputs:** { canHeal, hoursSinceLastInjury, hoursRemaining }
- **Orphan:** false

## pokemon-lifecycle-C045: Calculate Pokemon Center Time

- **Type:** utility
- **Location:** `app/utils/restHealing.ts:calculatePokemonCenterTime`
- **Game Concept:** PTU Pokemon Center healing time
- **Description:** Calculates healing time at a Pokemon Center: base 1 hour, +30 min per injury (or +1 hour per injury at 5+).
- **Inputs:** injuries (number)
- **Outputs:** { totalMinutes, description }
- **Orphan:** false

## pokemon-lifecycle-C046: Calculate Pokemon Center Injury Healing

- **Type:** utility
- **Location:** `app/utils/restHealing.ts:calculatePokemonCenterInjuryHealing`
- **Game Concept:** PTU Pokemon Center injury healing with daily limit
- **Description:** Calculates how many injuries a Pokemon Center heals: up to 3 per day, subject to daily limit across all healing types.
- **Inputs:** { injuries, injuriesHealedToday }
- **Outputs:** { injuriesHealed, atDailyLimit }
- **Orphan:** false

## pokemon-lifecycle-C047: Clear Persistent Status Conditions

- **Type:** utility
- **Location:** `app/utils/restHealing.ts:clearPersistentStatusConditions`
- **Game Concept:** PTU extended rest status clearing
- **Description:** Filters out persistent status conditions from an array. Used by extended rest endpoint. `getStatusesToClear()` companion returns list of cleared names for reporting.
- **Inputs:** statusConditions array
- **Outputs:** Filtered array (persistent removed) and names of cleared conditions
- **Orphan:** false

---

## pokemon-lifecycle-C048: Library Store - Pokemon State

- **Type:** store-action
- **Location:** `app/stores/library.ts:loadLibrary`
- **Game Concept:** Pokemon library data loading
- **Description:** Fetches all Pokemon and Human Characters in parallel from `/api/pokemon` and `/api/characters`. Stores results in `state.pokemon[]` and `state.humans[]`. Sets loading/error state.
- **Inputs:** None (action)
- **Outputs:** Populates `state.pokemon[]` and `state.humans[]`
- **Orphan:** false

## pokemon-lifecycle-C049: Library Store - Create Pokemon

- **Type:** store-action
- **Location:** `app/stores/library.ts:createPokemon`
- **Game Concept:** Pokemon creation (client-side)
- **Description:** POSTs to `/api/pokemon`, pushes created Pokemon to local state array.
- **Inputs:** Partial<Pokemon>
- **Outputs:** Returns created Pokemon, updates `state.pokemon[]`
- **Orphan:** false

## pokemon-lifecycle-C050: Library Store - Update Pokemon

- **Type:** store-action
- **Location:** `app/stores/library.ts:updatePokemon`
- **Game Concept:** Pokemon editing (client-side)
- **Description:** PUTs to `/api/pokemon/:id`, replaces Pokemon in local state array by index.
- **Inputs:** id, Partial<Pokemon>
- **Outputs:** Returns updated Pokemon, updates `state.pokemon[]`
- **Orphan:** false

## pokemon-lifecycle-C051: Library Store - Delete Pokemon

- **Type:** store-action
- **Location:** `app/stores/library.ts:deletePokemon`
- **Game Concept:** Pokemon deletion (client-side)
- **Description:** DELETEs `/api/pokemon/:id`, filters Pokemon from local state array.
- **Inputs:** id (string)
- **Outputs:** Removes Pokemon from `state.pokemon[]`
- **Orphan:** false

## pokemon-lifecycle-C052: Library Store - Link Pokemon

- **Type:** store-action
- **Location:** `app/stores/library.ts:linkPokemonToTrainer`
- **Game Concept:** Pokemon ownership (client-side)
- **Description:** POSTs to `/api/pokemon/:id/link`, replaces Pokemon in local state with response data.
- **Inputs:** pokemonId, trainerId
- **Outputs:** Updates Pokemon in `state.pokemon[]` with new ownerId
- **Orphan:** false

## pokemon-lifecycle-C053: Library Store - Unlink Pokemon

- **Type:** store-action
- **Location:** `app/stores/library.ts:unlinkPokemon`
- **Game Concept:** Pokemon ownership removal (client-side)
- **Description:** POSTs to `/api/pokemon/:id/unlink`, replaces Pokemon in local state with response data.
- **Inputs:** pokemonId
- **Outputs:** Updates Pokemon in `state.pokemon[]` with ownerId: null
- **Orphan:** false

## pokemon-lifecycle-C054: Library Store - Set Filters

- **Type:** store-action
- **Location:** `app/stores/library.ts:setFilters`
- **Game Concept:** Pokemon library filtering
- **Description:** Updates filter state including `pokemonOrigin`, `pokemonType`, `search`, `sortBy`, `sortOrder`. Filters are applied reactively by getters.
- **Inputs:** Partial<LibraryFilters>
- **Outputs:** Updates `state.filters`
- **Orphan:** false

---

## pokemon-lifecycle-C055: Filtered Pokemon Getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:filteredPokemon`
- **Game Concept:** Pokemon library search and filter
- **Description:** Returns Pokemon filtered by: search text (species, nickname, location), pokemonType (type filter), pokemonOrigin (origin filter). Sorted by name or level, ascending or descending.
- **Inputs:** Reads from `state.filters` and `state.pokemon[]`
- **Outputs:** Pokemon[] (filtered and sorted)
- **Orphan:** false

## pokemon-lifecycle-C056: Get Pokemon By ID Getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:getPokemonById`
- **Game Concept:** Single Pokemon lookup
- **Description:** Returns a Pokemon from the store by ID. Used by sheet pages and modals.
- **Inputs:** id (string)
- **Outputs:** Pokemon | undefined
- **Orphan:** false

## pokemon-lifecycle-C057: Get Pokemon By Owner Getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:getPokemonByOwner`
- **Game Concept:** Trainer's Pokemon team lookup
- **Description:** Returns all Pokemon owned by a specific trainer. Used by character sheet's Pokemon tab.
- **Inputs:** ownerId (string)
- **Outputs:** Pokemon[]
- **Orphan:** false

## pokemon-lifecycle-C058: Grouped Pokemon By Location Getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:groupedPokemonByLocation`
- **Game Concept:** Location-based Pokemon grouping
- **Description:** Groups filtered Pokemon by their `location` field. Sorted alphabetically with "No Location" last. Used by the sheets page for organized display.
- **Inputs:** Reads from `filteredPokemon`
- **Outputs:** Array of { location: string, pokemon: Pokemon[] }
- **Orphan:** false

## pokemon-lifecycle-C059: All Filtered Getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:allFiltered`
- **Game Concept:** Combined entity listing
- **Description:** Combines filteredHumans and filteredPokemon based on `state.filters.type` ('all', 'human', 'pokemon'). Used for unified library browsing.
- **Inputs:** Reads from other getters and `state.filters.type`
- **Outputs:** (HumanCharacter | Pokemon)[]
- **Orphan:** false

---

## pokemon-lifecycle-C060: Pokemon Sprite URL Generator

- **Type:** composable-function
- **Location:** `app/composables/usePokemonSprite.ts:getSpriteUrl`
- **Game Concept:** Pokemon sprite display
- **Description:** Returns animated sprite URL for a Pokemon. Gen 1-5 use B2W2 animated GIFs, Gen 6+ use Pokemon Showdown. Contains dex number map (649 entries) and special name map (~100 entries for regional forms). Primary entry point for all sprite rendering.
- **Inputs:** species (string), shiny (boolean)
- **Outputs:** URL string for animated GIF
- **Orphan:** false

## pokemon-lifecycle-C061: Static Sprite URL

- **Type:** composable-function
- **Location:** `app/composables/usePokemonSprite.ts:getStaticSpriteUrl`
- **Game Concept:** Pokemon sprite fallback
- **Description:** Returns static (non-animated) sprite URL. Fallback when animated sprite is unavailable.
- **Inputs:** species (string), shiny (boolean)
- **Outputs:** URL string
- **Orphan:** true

## pokemon-lifecycle-C062: Sprite With Fallback

- **Type:** composable-function
- **Location:** `app/composables/usePokemonSprite.ts:getSpriteWithFallback`
- **Game Concept:** Pokemon sprite with error recovery
- **Description:** Attempts animated sprite, falls back to static, then to official artwork. Ensures a valid sprite is always available.
- **Inputs:** species (string), shiny (boolean)
- **Outputs:** URL string
- **Orphan:** false

## pokemon-lifecycle-C063: Roll Skill Check

- **Type:** composable-function
- **Location:** `app/composables/usePokemonSheetRolls.ts:rollSkill`
- **Game Concept:** PTU Pokemon skill check
- **Description:** Rolls a skill check using dice notation (e.g., "2d6+2"). Returns roll result and total.
- **Inputs:** skill name, dice notation string
- **Outputs:** Roll result object
- **Orphan:** false

## pokemon-lifecycle-C064: Roll Attack

- **Type:** composable-function
- **Location:** `app/composables/usePokemonSheetRolls.ts:rollAttack`
- **Game Concept:** PTU accuracy check
- **Description:** Rolls 1d20 for move accuracy. Handles natural 1 (auto-miss) and natural 20 (auto-hit/crit).
- **Inputs:** Move object
- **Outputs:** Roll result with hit/miss/crit
- **Orphan:** false

## pokemon-lifecycle-C065: Roll Damage

- **Type:** composable-function
- **Location:** `app/composables/usePokemonSheetRolls.ts:rollDamage`
- **Game Concept:** PTU damage roll
- **Description:** Rolls damage for a move with stat modifier addition. Handles critical hit flag.
- **Inputs:** Move object, isCrit boolean
- **Outputs:** Damage total
- **Orphan:** false

## pokemon-lifecycle-C066: Client Capture Rate Calculator

- **Type:** composable-function
- **Location:** `app/composables/useCapture.ts:calculateCaptureRateLocal`
- **Game Concept:** PTU capture rate (client-side mirror)
- **Description:** Pure client-side capture rate calculation that mirrors the server-side implementation. Used for real-time UI updates without API calls.
- **Inputs:** Same as server-side calculateCaptureRate
- **Outputs:** Capture rate and breakdown
- **Orphan:** true

## pokemon-lifecycle-C067: Get Capture Rate (API)

- **Type:** composable-function
- **Location:** `app/composables/useCapture.ts:getCaptureRate`
- **Game Concept:** Capture rate API call
- **Description:** Calls `/api/capture/rate` to get authoritative capture rate from server.
- **Inputs:** pokemonId (string)
- **Outputs:** Capture rate data from server
- **Orphan:** false

## pokemon-lifecycle-C068: Attempt Capture (API)

- **Type:** composable-function
- **Location:** `app/composables/useCapture.ts:attemptCapture`
- **Game Concept:** Capture execution API call
- **Description:** Calls `/api/capture/attempt` to execute a capture attempt.
- **Inputs:** { pokemonId, trainerId, accuracyRoll, modifiers }
- **Outputs:** Capture result from server
- **Orphan:** false

## pokemon-lifecycle-C069: Roll Accuracy Check (Capture)

- **Type:** composable-function
- **Location:** `app/composables/useCapture.ts:rollAccuracyCheck`
- **Game Concept:** Poke Ball accuracy check (AC 6)
- **Description:** Rolls 1d20 for Poke Ball throw accuracy check against AC 6.
- **Inputs:** None
- **Outputs:** Roll result (hit/miss)
- **Orphan:** false

## pokemon-lifecycle-C070: Rest Composable (30-min)

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:rest`
- **Game Concept:** PTU rest (client-side wrapper)
- **Description:** Calls `/api/pokemon/:id/rest` or `/api/characters/:id/rest`. Polymorphic for both entity types.
- **Inputs:** type ('pokemon'|'character'), id
- **Outputs:** Rest result from server
- **Orphan:** false

## pokemon-lifecycle-C071: Extended Rest Composable

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:extendedRest`
- **Game Concept:** PTU extended rest (client-side wrapper)
- **Description:** Calls `/api/pokemon/:id/extended-rest` or `/api/characters/:id/extended-rest`.
- **Inputs:** type ('pokemon'|'character'), id
- **Outputs:** Extended rest result from server
- **Orphan:** false

## pokemon-lifecycle-C072: Pokemon Center Composable

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:pokemonCenter`
- **Game Concept:** PTU Pokemon Center (client-side wrapper)
- **Description:** Calls `/api/pokemon/:id/pokemon-center` or `/api/characters/:id/pokemon-center`.
- **Inputs:** type ('pokemon'|'character'), id
- **Outputs:** Pokemon Center result from server
- **Orphan:** false

## pokemon-lifecycle-C073: Heal Injury Composable

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:healInjury`
- **Game Concept:** PTU injury healing (client-side wrapper)
- **Description:** Calls `/api/pokemon/:id/heal-injury` or corresponding character endpoint. Supports natural and drain AP methods.
- **Inputs:** type ('pokemon'|'character'), id, method
- **Outputs:** Injury healing result from server
- **Orphan:** false

## pokemon-lifecycle-C074: New Day Composable (Single)

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:newDay`
- **Game Concept:** PTU new day (single entity, client-side)
- **Description:** Calls `/api/pokemon/:id/new-day` or corresponding character endpoint for a single entity.
- **Inputs:** type ('pokemon'|'character'), id
- **Outputs:** Reset result from server
- **Orphan:** false

## pokemon-lifecycle-C075: New Day Global Composable

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:newDayGlobal`
- **Game Concept:** PTU new day (global, client-side)
- **Description:** Calls `/api/game/new-day` to reset all entities at once.
- **Inputs:** None
- **Outputs:** Global reset result from server
- **Orphan:** false

## pokemon-lifecycle-C076: Get Healing Info

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:getHealingInfo`
- **Game Concept:** Healing status display
- **Description:** Aggregates healing display information for an entity: current rest minutes, daily injury count, rest eligibility, etc.
- **Inputs:** Entity data
- **Outputs:** Healing info summary for UI display
- **Orphan:** false

## pokemon-lifecycle-C077: Entity Stats Accessor

- **Type:** composable-function
- **Location:** `app/composables/useEntityStats.ts:getStageModifiers`
- **Game Concept:** Pokemon stat access (polymorphic)
- **Description:** Safe accessor for stage modifiers and stats. Handles both nested (client-side) and flat (DB) formats. Functions: `getPokemonAttackStat()`, `getPokemonSpAtkStat()`, `getPokemonDefenseStat()`, `getPokemonSpDefStat()`, `getPokemonSpeedStat()`, `getAttackStat()`, `getDefenseStat()`.
- **Inputs:** Entity object, isPokemon boolean, damageClass
- **Outputs:** Stat value (number)
- **Orphan:** false

---

## pokemon-lifecycle-C078: Pokemon Card Component

- **Type:** component
- **Location:** `app/components/character/PokemonCard.vue`
- **Game Concept:** Pokemon list display
- **Description:** Card component for Pokemon library listing. Shows sprite (with shiny indicator), nickname/species, types, level, location, HP bar, status conditions, injuries, origin badge. Clickable to navigate to Pokemon sheet.
- **Inputs:** Pokemon data object
- **Outputs:** Rendered card with click navigation to `/gm/pokemon/:id`
- **Orphan:** false

## pokemon-lifecycle-C079: Trainer Pokemon Tab Component

- **Type:** component
- **Location:** `app/components/character/tabs/HumanPokemonTab.vue`
- **Game Concept:** Trainer's Pokemon team display
- **Description:** Tab on human character sheet showing linked Pokemon team. Displays sprites, names, levels, HP for each Pokemon. Uses `getPokemonByOwner()` getter.
- **Inputs:** trainer ID (from parent page)
- **Outputs:** Rendered Pokemon team list
- **Orphan:** false

## pokemon-lifecycle-C080: Pokemon Stats Tab Component

- **Type:** component
- **Location:** `app/components/character/tabs/PokemonStatsTab.vue`
- **Game Concept:** Pokemon stat display
- **Description:** Stats display tab for Pokemon sheets. Shows base stats vs current stats grid, nature with raised/lowered stat indicators.
- **Inputs:** Pokemon data
- **Outputs:** Rendered stats grid
- **Orphan:** false

## pokemon-lifecycle-C081: Pokemon Capabilities Tab Component

- **Type:** component
- **Location:** `app/components/character/tabs/PokemonCapabilitiesTab.vue`
- **Game Concept:** Pokemon capability display
- **Description:** Capabilities display tab: overland, swim, sky, burrow, levitate, jump, power, weight class, size, other capabilities.
- **Inputs:** Pokemon capabilities data
- **Outputs:** Rendered capabilities grid
- **Orphan:** false

## pokemon-lifecycle-C082: Pokemon Search Input Component

- **Type:** component
- **Location:** `app/components/common/PokemonSearchInput.vue`
- **Game Concept:** Species autocomplete for Pokemon creation
- **Description:** Autocomplete search input. Loads species from `/api/species` on mount, filters client-side, shows type badges in dropdown. Emits `select` with species id/name. Used by creation forms and encounter table editors.
- **Inputs:** None (self-loading)
- **Outputs:** Emits selected species { id, name }
- **Orphan:** false

## pokemon-lifecycle-C083: Healing Tab Component

- **Type:** component
- **Location:** `app/components/common/HealingTab.vue`
- **Game Concept:** PTU healing UI
- **Description:** Shared healing tab used by both Pokemon and human character sheets. Provides buttons for rest, extended rest, Pokemon Center, heal injury, new day. Shows current rest minutes, injury count, healing eligibility. Uses `useRestHealing` composable.
- **Inputs:** Entity data, entity type ('pokemon'|'character')
- **Outputs:** Rendered healing controls and status display
- **Orphan:** false

## pokemon-lifecycle-C084: Species Autocomplete Component

- **Type:** component
- **Location:** `app/components/habitat/SpeciesAutocomplete.vue`
- **Game Concept:** Species selection for encounter tables
- **Description:** Autocomplete for encounter table use. Loads species list, filters, emits `update:modelValue` with species ID. Similar to PokemonSearchInput but for encounter table context.
- **Inputs:** modelValue (species ID)
- **Outputs:** Emits species ID
- **Orphan:** false

---

## pokemon-lifecycle-C085: Pokemon Sheet Page

- **Type:** page
- **Location:** `app/pages/gm/pokemon/[id].vue`
- **Game Concept:** Pokemon character sheet
- **Description:** Full Pokemon sheet page (574 lines + 668 lines SCSS). Tabbed interface: Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes. Edit mode with save. Uses `usePokemonSheetRolls` for dice rolling, `usePokemonSprite` for sprites, HealingTab for rest. Fetches full Pokemon data via GET /api/pokemon/:id.
- **Inputs:** Route param: `id`
- **Outputs:** Full interactive Pokemon sheet
- **Orphan:** false

## pokemon-lifecycle-C086: Pokemon Creation Page

- **Type:** page
- **Location:** `app/pages/gm/create.vue`
- **Game Concept:** Manual Pokemon/Character creation
- **Description:** Character creation page with Human/Pokemon toggle. Pokemon form: species (autocomplete), nickname, level, gender, shiny, location, types (primary/secondary), base stats (6 fields), notes. Applies PTU HP formula on submit. Creates via library store action.
- **Inputs:** User form input
- **Outputs:** Creates Pokemon and navigates to sheet or library
- **Orphan:** false

## pokemon-lifecycle-C087: Library Sheets Page

- **Type:** page
- **Location:** `app/pages/gm/sheets.vue`
- **Game Concept:** Pokemon library management UI
- **Description:** Character library page. Shows Players, NPCs (grouped by location), Pokemon (grouped by location). Filters: search, type, characterType, pokemonOrigin, sortBy. Manage panel with origin counts, bulk archive/delete unowned wild Pokemon. Uses PokemonCard components.
- **Inputs:** None (loads via store)
- **Outputs:** Rendered library with filters and bulk actions
- **Orphan:** false

---

## pokemon-lifecycle-C088: Pokemon Type Interface

- **Type:** type-definition
- **Location:** `app/types/character.ts:Pokemon`
- **Game Concept:** Pokemon data shape (TypeScript)
- **Description:** Core TypeScript interface defining the Pokemon data shape used across the entire client. Includes all fields: species, nickname, level, experience, nature, types, baseStats, currentStats, currentHp, maxHp, stageModifiers, abilities, moves, heldItem, capabilities, skills, statusConditions, injuries, temporaryHp, rest/healing tracking, tutorPoints, trainingExp, eggGroups, ownerId, spriteUrl, shiny, gender, isInLibrary, origin, location, notes. Also defines: PokemonOrigin, PokemonType, Stats, PokemonCapabilities, Move, Ability, Nature.
- **Inputs:** N/A (type definition)
- **Outputs:** Used by stores, composables, components, and API response typing
- **Orphan:** false

## pokemon-lifecycle-C089: Type Guards

- **Type:** type-definition
- **Location:** `app/types/guards.ts:isPokemon`
- **Game Concept:** Pokemon/Human entity discrimination
- **Description:** Type guards for polymorphic entity handling: `isPokemon()` checks for `species` property, `isHumanCharacter()` checks for `characterType`. `getEntityDisplayName()` returns nickname/species for Pokemon. `getEntityType()` returns 'pokemon' or 'human'.
- **Inputs:** Any entity object
- **Outputs:** Type narrowing boolean or entity type string
- **Orphan:** false

---

## pokemon-lifecycle-C090: Encounter Table Generate (Wild Spawn List)

- **Type:** api-endpoint
- **Location:** `app/server/api/encounter-tables/[id]/generate.post.ts:default`
- **Game Concept:** Wild Pokemon spawn generation from encounter table
- **Description:** Generates a list of wild Pokemon species/levels from an encounter table using weighted random selection. Does NOT create DB records — just returns species names and levels for preview. Respects density tiers and sub-habitat modifications. Count based on density (1-10) or manual override.
- **Inputs:** URL param: tableId. Body: modificationId (optional), levelRange (optional), count (optional)
- **Outputs:** `{ success: true, data: { generated: [{speciesId, speciesName, level, weight, source}], meta: {tableName, density, spawnCount, ...} } }`
- **Orphan:** false

## pokemon-lifecycle-C091: Wild Spawn Preview API

- **Type:** api-endpoint
- **Location:** `app/server/api/group/wild-spawn.post.ts:default`
- **Game Concept:** Wild spawn preview display on group view
- **Description:** Stores a wild spawn preview in server memory (not DB). Used to show generated wild Pokemon on the group/TV view before committing to an encounter. Preview contains species names, levels, and source table name.
- **Inputs:** Body: pokemon array [{speciesId, speciesName, level}], tableName
- **Outputs:** `{ success: true, data: WildSpawnPreview }` with generated UUID
- **Orphan:** false

## pokemon-lifecycle-C092: Template Load Pokemon Creation

- **Type:** api-endpoint
- **Location:** `app/server/api/encounter-templates/[id]/load.post.ts:default`
- **Game Concept:** Pokemon creation from encounter template
- **Description:** Creates an encounter from a template. Each Pokemon combatant generates a real DB record via `generateAndCreatePokemon()` with `origin: 'template'`. Preserves saved moves/abilities from template as overrides. Sets originLabel to template name.
- **Inputs:** URL param: templateId. Body: name (optional)
- **Outputs:** `{ success: true, data: Encounter }` with Pokemon as combatants
- **Orphan:** false

---

## Capability Chains

### Chain 1: Manual Pokemon Creation
1. `pokemon-lifecycle-C086` (page — creation form) → 2. `pokemon-lifecycle-C049` (store-action — createPokemon) → 3. `pokemon-lifecycle-C010` (api-endpoint — POST /api/pokemon) → 4. `pokemon-lifecycle-C035` (service-function — resolveNickname) → 5. `pokemon-lifecycle-C001` (prisma-model — Pokemon)
**Breaks at:** complete

### Chain 2: CSV Import Pokemon Creation
1. `pokemon-lifecycle-C025` (api-endpoint — import-csv) → 2. `pokemon-lifecycle-C036` (service-function — detectSheetType) → 3. `pokemon-lifecycle-C037` (service-function — parsePokemonSheet) → 4. `pokemon-lifecycle-C038` (service-function — createPokemonFromCSV) → 5. `pokemon-lifecycle-C029` (service-function — createPokemonRecord) → 6. `pokemon-lifecycle-C035` (service-function — resolveNickname) → 7. `pokemon-lifecycle-C001` (prisma-model — Pokemon)
**Breaks at:** complete

### Chain 3: Wild Spawn Pokemon Creation (from Scene)
1. `pokemon-lifecycle-C027` (api-endpoint — from-scene) → 2. `pokemon-lifecycle-C030` (service-function — generateAndCreatePokemon) → 3. `pokemon-lifecycle-C028` (service-function — generatePokemonData) → 4. `pokemon-lifecycle-C032` (service-function — distributeStatPoints) + `pokemon-lifecycle-C033` (service-function — selectMovesFromLearnset) + `pokemon-lifecycle-C034` (service-function — pickRandomAbility) → 5. `pokemon-lifecycle-C029` (service-function — createPokemonRecord) → 6. `pokemon-lifecycle-C031` (service-function — buildPokemonCombatant) → 7. `pokemon-lifecycle-C001` (prisma-model — Pokemon)
**Breaks at:** complete

### Chain 4: Template Pokemon Creation
1. `pokemon-lifecycle-C092` (api-endpoint — template load) → 2. `pokemon-lifecycle-C030` (service-function — generateAndCreatePokemon with overrides) → 3. `pokemon-lifecycle-C028` (service-function — generatePokemonData) → 4. `pokemon-lifecycle-C029` (service-function — createPokemonRecord) → 5. `pokemon-lifecycle-C031` (service-function — buildPokemonCombatant) → 6. `pokemon-lifecycle-C001` (prisma-model — Pokemon)
**Breaks at:** complete

### Chain 5: Wild Spawn Preview Flow
1. `pokemon-lifecycle-C090` (api-endpoint — encounter table generate) → 2. `pokemon-lifecycle-C091` (api-endpoint — wild spawn preview POST)
**Breaks at:** complete (preview only — actual DB creation happens via Chain 3 when scene encounter is started)

### Chain 6: Pokemon Sheet View & Edit
1. `pokemon-lifecycle-C085` (page — pokemon sheet) → 2. `pokemon-lifecycle-C011` (api-endpoint — GET /api/pokemon/:id) → 3. `pokemon-lifecycle-C001` (prisma-model — Pokemon)
Edit: → 4. `pokemon-lifecycle-C050` (store-action — updatePokemon) → 5. `pokemon-lifecycle-C012` (api-endpoint — PUT /api/pokemon/:id) → 6. `pokemon-lifecycle-C001` (prisma-model — Pokemon)
**Breaks at:** complete

### Chain 7: Pokemon Library Browse & Filter
1. `pokemon-lifecycle-C087` (page — sheets) → 2. `pokemon-lifecycle-C048` (store-action — loadLibrary) → 3. `pokemon-lifecycle-C009` (api-endpoint — GET /api/pokemon) → 4. `pokemon-lifecycle-C001` (prisma-model — Pokemon)
Filter: → 5. `pokemon-lifecycle-C054` (store-action — setFilters) → 6. `pokemon-lifecycle-C055` (store-getter — filteredPokemon) → 7. `pokemon-lifecycle-C058` (store-getter — groupedPokemonByLocation) → 8. `pokemon-lifecycle-C078` (component — PokemonCard)
**Breaks at:** complete

### Chain 8: Pokemon Ownership (Link/Unlink)
Link: 1. `pokemon-lifecycle-C052` (store-action — linkPokemonToTrainer) → 2. `pokemon-lifecycle-C014` (api-endpoint — link) → 3. `pokemon-lifecycle-C001` (prisma-model — Pokemon.ownerId)
Unlink: 1. `pokemon-lifecycle-C053` (store-action — unlinkPokemon) → 2. `pokemon-lifecycle-C015` (api-endpoint — unlink) → 3. `pokemon-lifecycle-C001` (prisma-model — Pokemon.ownerId)
**Breaks at:** complete

### Chain 9: Pokemon Capture
1. `pokemon-lifecycle-C069` (composable — rollAccuracyCheck) → 2. `pokemon-lifecycle-C067` (composable — getCaptureRate) → 3. `pokemon-lifecycle-C023` (api-endpoint — capture rate) → 4. `pokemon-lifecycle-C039` (utility — calculateCaptureRate) → 5. `pokemon-lifecycle-C068` (composable — attemptCapture) → 6. `pokemon-lifecycle-C024` (api-endpoint — capture attempt) → 7. `pokemon-lifecycle-C040` (utility — attemptCapture roll) → 8. `pokemon-lifecycle-C001` (prisma-model — Pokemon.ownerId, origin = 'captured')
**Breaks at:** complete

### Chain 10: Pokemon Rest Healing (30-min)
1. `pokemon-lifecycle-C083` (component — HealingTab) → 2. `pokemon-lifecycle-C070` (composable — rest) → 3. `pokemon-lifecycle-C016` (api-endpoint — rest) → 4. `pokemon-lifecycle-C042` (utility — shouldResetDailyCounters) + `pokemon-lifecycle-C043` (utility — calculateRestHealing) → 5. `pokemon-lifecycle-C001` (prisma-model — Pokemon HP/rest tracking)
**Breaks at:** complete

### Chain 11: Pokemon Extended Rest
1. `pokemon-lifecycle-C083` (component — HealingTab) → 2. `pokemon-lifecycle-C071` (composable — extendedRest) → 3. `pokemon-lifecycle-C017` (api-endpoint — extended-rest) → 4. `pokemon-lifecycle-C043` (utility — calculateRestHealing) + `pokemon-lifecycle-C047` (utility — clearPersistentStatusConditions) → 5. `pokemon-lifecycle-C001` (prisma-model — Pokemon HP/statuses/moves)
**Breaks at:** complete

### Chain 12: Pokemon Center Healing
1. `pokemon-lifecycle-C083` (component — HealingTab) → 2. `pokemon-lifecycle-C072` (composable — pokemonCenter) → 3. `pokemon-lifecycle-C018` (api-endpoint — pokemon-center) → 4. `pokemon-lifecycle-C045` (utility — calculatePokemonCenterTime) + `pokemon-lifecycle-C046` (utility — calculatePokemonCenterInjuryHealing) → 5. `pokemon-lifecycle-C001` (prisma-model — Pokemon full heal)
**Breaks at:** complete

### Chain 13: Natural Injury Healing
1. `pokemon-lifecycle-C083` (component — HealingTab) → 2. `pokemon-lifecycle-C073` (composable — healInjury) → 3. `pokemon-lifecycle-C019` (api-endpoint — heal-injury) → 4. `pokemon-lifecycle-C044` (utility — canHealInjuryNaturally) → 5. `pokemon-lifecycle-C001` (prisma-model — Pokemon injuries)
**Breaks at:** complete

### Chain 14: New Day Reset
Single entity: 1. `pokemon-lifecycle-C083` (component — HealingTab) → 2. `pokemon-lifecycle-C074` (composable — newDay) → 3. `pokemon-lifecycle-C020` (api-endpoint — new-day) → 4. `pokemon-lifecycle-C001` (prisma-model)
Global: 1. `pokemon-lifecycle-C075` (composable — newDayGlobal) → 2. `pokemon-lifecycle-C026` (api-endpoint — game/new-day) → 3. `pokemon-lifecycle-C001` (prisma-model — all Pokemon)
**Breaks at:** complete

### Chain 15: Bulk Archive/Delete
1. `pokemon-lifecycle-C087` (page — sheets manage panel) → 2. `pokemon-lifecycle-C021` (api-endpoint — bulk-action) → 3. `pokemon-lifecycle-C001` (prisma-model — isInLibrary or delete)
**Breaks at:** complete

### Chain 16: Species Autocomplete
1. `pokemon-lifecycle-C082` (component — PokemonSearchInput) → 2. `pokemon-lifecycle-C022` (api-endpoint — GET /api/species) → 3. `pokemon-lifecycle-C002` (prisma-model — SpeciesData)
**Breaks at:** complete

### Chain 17: Pokemon Dice Rolling (Sheet)
1. `pokemon-lifecycle-C085` (page — pokemon sheet) → 2. `pokemon-lifecycle-C063` (composable — rollSkill) / `pokemon-lifecycle-C064` (composable — rollAttack) / `pokemon-lifecycle-C065` (composable — rollDamage)
**Breaks at:** complete (client-only, no server round-trip)

### Chain 18: Trainer Pokemon Tab
1. `pokemon-lifecycle-C079` (component — HumanPokemonTab) → 2. `pokemon-lifecycle-C057` (store-getter — getPokemonByOwner) → 3. `pokemon-lifecycle-C060` (composable — getSpriteUrl)
**Breaks at:** complete

---

## Orphan Capabilities

### pokemon-lifecycle-C061: Static Sprite URL
- **Orphan:** true
- **Reason:** `getStaticSpriteUrl()` is exported but no component directly calls it — all sprite rendering goes through `getSpriteUrl()` or `getSpriteWithFallback()`.

### pokemon-lifecycle-C066: Client Capture Rate Calculator
- **Orphan:** true
- **Reason:** `calculateCaptureRateLocal()` is exported from `useCapture.ts` but current UI uses the server-side API (`getCaptureRate()`) for authoritative calculation. The local calculator exists for potential real-time UI updates but no component currently calls it directly.

### pokemon-lifecycle-C041: Capture Difficulty Description (Client)
- **Orphan:** true
- **Reason:** `getCaptureDescription()` in `captureRate.ts` is used server-side by the capture rate and attempt APIs. It's also importable client-side but the capture UI relies on the server response `difficulty` field rather than calling this locally.
