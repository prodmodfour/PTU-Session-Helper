---
domain: character-lifecycle
mapped_at: 2026-02-19T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 81
files_read: 34
---

# App Capabilities: Character Lifecycle

## Summary
- Total capabilities: 81
- Types: prisma-model(1), prisma-field(13), api-endpoint(14), service-function(6), utility-function(6), composable-function(8), store-action(7), store-getter(8), component(8), page(3), websocket-event(1), type-definition(6), type-guard(4)
- Orphan capabilities: 3 (CSV import UI, delete UI, link/unlink UI)

---

## character-lifecycle-C001: HumanCharacter Prisma Model

- **Type:** prisma-model
- **Location:** `app/prisma/schema.prisma:11-76` — model HumanCharacter
- **Game Concept:** PTU Trainer / NPC data model
- **Description:** Defines the HumanCharacter database table with all fields for player characters and NPCs. Includes identity, stats, classes/skills/features/edges (JSON), inventory, status/combat state, rest/healing tracking, background info, library flag, and relations to Pokemon.
- **Inputs:** N/A (schema definition)
- **Outputs:** Table with 38 columns, uuid primary key, one-to-many relation to Pokemon
- **Orphan:** false

---

## character-lifecycle-C002: HumanCharacter.characterType field

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:14` — characterType String @default("npc")
- **Game Concept:** Character role — player, npc, or trainer
- **Description:** Discriminates between player characters, NPCs, and trainers. Drives filtering in the library and different UI paths (player section vs NPC-by-location grouping).
- **Inputs:** 'player' | 'npc' | 'trainer'
- **Outputs:** Used by library store filtering, players.get endpoint, create page, and sheets page
- **Orphan:** false

---

## character-lifecycle-C003: HumanCharacter.stats fields (hp, attack, defense, specialAttack, specialDefense, speed)

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:24-30` — 6 integer stat columns
- **Game Concept:** PTU trainer combat stats (HP stat, Attack, Defense, SpAtk, SpDef, Speed)
- **Description:** Base stat values for the character. These are the trainer's permanent stat allocations, separate from currentHp/maxHp which track combat HP.
- **Inputs:** Integer values set at creation or via update
- **Outputs:** Serialized as nested `stats` object in API responses
- **Orphan:** false

---

## character-lifecycle-C004: HumanCharacter.currentHp / maxHp fields

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:31-32` — currentHp Int, maxHp Int
- **Game Concept:** Derived max HP and current hit points for combat tracking
- **Description:** maxHp is the calculated maximum HP (not the hp stat). currentHp tracks actual remaining hit points. Both modified by rest/healing endpoints and combat damage.
- **Inputs:** Set at creation, modified by PUT update, rest, and combat operations
- **Outputs:** Displayed on character cards and character sheet pages
- **Orphan:** false

---

## character-lifecycle-C005: HumanCharacter.trainerClasses / skills / features / edges JSON fields

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:35-38` — JSON string columns
- **Game Concept:** PTU trainer classes, skill ranks, class features, and edges
- **Description:** Stored as JSON strings in SQLite. trainerClasses is a JSON array of class names. skills is a JSON object { skillName: rank }. features is a JSON array of feature names. edges is a JSON array of edge names. Parsed on read, stringified on write.
- **Inputs:** Set via create (POST body), update (PUT body), or CSV import
- **Outputs:** Parsed to arrays/objects in API responses; displayed in Classes and Skills tabs
- **Orphan:** false

---

## character-lifecycle-C006: HumanCharacter.inventory / money fields

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:41-42` — inventory JSON, money Int
- **Game Concept:** Character inventory items and currency
- **Description:** inventory is a JSON array of items. money is an integer for Pokemon dollars. Both editable via the character update endpoint.
- **Inputs:** Set at creation or via PUT update
- **Outputs:** Returned in API responses; money displayed on character sheet Stats tab
- **Orphan:** false

---

## character-lifecycle-C007: HumanCharacter.statusConditions / stageModifiers / injuries / temporaryHp fields

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:45-49` — combat state fields
- **Game Concept:** PTU status conditions, combat stage modifiers, injury count, and temporary HP
- **Description:** statusConditions is a JSON array. stageModifiers is a JSON object with attack/defense/etc modifiers (-6 to +6). injuries is an integer counter. temporaryHp tracks temp HP. These are primarily modified by combat and healing systems but readable/writable via the character update endpoint.
- **Inputs:** Modified by combat damage, healing endpoints, and direct PUT update
- **Outputs:** Displayed on character cards (injuries), healing tab, and combat UI
- **Orphan:** false

---

## character-lifecycle-C008: HumanCharacter rest/healing tracking fields

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:51-55` — lastInjuryTime, restMinutesToday, injuriesHealedToday, lastRestReset, drainedAp
- **Game Concept:** PTU rest and healing daily tracking counters
- **Description:** Tracks daily rest minutes (max 480), injuries healed per day (max 3), last injury timestamp (for 24h natural healing), last daily reset timestamp, and drained AP (restored by extended rest). Cross-domain with healing system.
- **Inputs:** Modified by rest/healing API endpoints, new-day reset, and direct PUT update
- **Outputs:** Used by HealingTab component, rest healing calculations
- **Orphan:** false

---

## character-lifecycle-C009: HumanCharacter.background / personality / goals / location fields

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:61-64` — text fields
- **Game Concept:** Character backstory, personality traits, goals, and current location
- **Description:** Optional text fields for RP information. location is used for NPC grouping in the library (NPCs grouped by location with collapsible sections).
- **Inputs:** Set at creation or via PUT update
- **Outputs:** Displayed on Notes tab of character sheet; location shown on HumanCard and used for NPC grouping on sheets page
- **Orphan:** false

---

## character-lifecycle-C010: HumanCharacter.isInLibrary flag

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:67` — isInLibrary Boolean @default(true)
- **Game Concept:** Library visibility / archive flag
- **Description:** When true, character appears in the library listing. When false, character is archived/hidden. The GET /api/characters endpoint filters to isInLibrary: true only.
- **Inputs:** Set at creation (default true), modifiable via PUT update
- **Outputs:** Controls visibility in library listing
- **Orphan:** false

---

## character-lifecycle-C011: HumanCharacter → Pokemon relation

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:71` — pokemon Pokemon[]
- **Game Concept:** Trainer's team of owned Pokemon
- **Description:** One-to-many relation from HumanCharacter to Pokemon. Pokemon's ownerId foreign key points to the character. Managed through link/unlink endpoints. On character deletion, all owned Pokemon are unlinked (ownerId set to null).
- **Inputs:** Managed via POST /api/pokemon/:id/link and /api/pokemon/:id/unlink
- **Outputs:** Included in character detail (GET /api/characters/:id) as parsed Pokemon array
- **Orphan:** false

---

## character-lifecycle-C012: HumanCharacter player info fields (playedBy, age, gender, height, weight)

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:17-21` — optional player identity fields
- **Game Concept:** Real player name and character physical attributes
- **Description:** playedBy stores the real player's name (for player characters). age, gender, height (cm), weight (kg) are character attributes. All optional, used for display on the character sheet.
- **Inputs:** Set at creation, via PUT update, or CSV import
- **Outputs:** Displayed on character sheet header and Stats tab
- **Orphan:** false

---

## character-lifecycle-C013: HumanCharacter.avatarUrl / notes fields

- **Type:** prisma-field
- **Location:** `app/prisma/schema.prisma:58,68` — display and metadata fields
- **Game Concept:** Character portrait URL and freeform notes
- **Description:** avatarUrl is an optional URL for the character's portrait image. notes is freeform text. Both editable via character update.
- **Inputs:** Set at creation or via PUT update
- **Outputs:** Avatar displayed on HumanCard and character sheet header; notes on Notes tab
- **Orphan:** false

---

## character-lifecycle-C014: GET /api/characters — List Characters

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/index.get.ts:1-75`
- **Game Concept:** Fetch all active characters in the library
- **Description:** Returns all HumanCharacters where isInLibrary is true, ordered by name ascending. Includes linked Pokemon (id, species, nickname). Parses all JSON fields (trainerClasses, skills, features, edges, inventory, statusConditions, stageModifiers). Returns stats as nested object.
- **Inputs:** None (no query params)
- **Outputs:** `{ success: true, data: HumanCharacter[] }` with pokemonIds and pokemon arrays
- **Orphan:** false

---

## character-lifecycle-C015: POST /api/characters — Create Character

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/index.post.ts:1-108`
- **Game Concept:** Create a new human character (player or NPC)
- **Description:** Creates a HumanCharacter record from the request body. Accepts nested stats object or flat stat fields. Defaults: characterType='npc', level=1, stats=5, currentHp/maxHp=10. Stringifies JSON fields for storage. Returns the created character with parsed fields.
- **Inputs:** Request body with name (required), characterType, playedBy, age, gender, level, stats, currentHp, maxHp, trainerClasses, skills, features, edges, inventory, money, statusConditions, stageModifiers, avatarUrl, background, personality, goals, location, isInLibrary, notes
- **Outputs:** `{ success: true, data: HumanCharacter }` with pokemonIds=[]
- **Orphan:** false

---

## character-lifecycle-C016: GET /api/characters/:id — Get Character Detail

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/[id].get.ts:1-131`
- **Game Concept:** Fetch a single character with full Pokemon team data
- **Description:** Retrieves a single HumanCharacter by ID with full Pokemon relation (all Pokemon fields parsed). Returns complete character data including rest/healing tracking fields, injuries, temporaryHp, and the full parsed Pokemon team.
- **Inputs:** Route param `id` (character UUID)
- **Outputs:** `{ success: true, data: HumanCharacter }` with pokemon array containing full Pokemon data (stats, moves, abilities, etc.)
- **Orphan:** false

---

## character-lifecycle-C017: PUT /api/characters/:id — Update Character

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/[id].put.ts:1-92`
- **Game Concept:** Update any character field
- **Description:** Partial update of a HumanCharacter. Only includes fields present in the request body. Supports nested stats object, JSON fields (trainerClasses, skills, inventory, statusConditions, stageModifiers), and healing fields (maxHp, injuries, drainedAp, restMinutesToday, injuriesHealedToday, lastInjuryTime, lastRestReset). Returns updated character with parsed fields.
- **Inputs:** Route param `id`, request body with any subset of character fields
- **Outputs:** `{ success: true, data: HumanCharacter }` with pokemonIds=[] (does not refetch relations)
- **Orphan:** false

---

## character-lifecycle-C018: DELETE /api/characters/:id — Delete Character

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/[id].delete.ts:1-33`
- **Game Concept:** Permanently remove a character from the system
- **Description:** Deletes a HumanCharacter by ID. First unlinks all owned Pokemon (sets ownerId to null), then deletes the character record. Does not delete the Pokemon themselves.
- **Inputs:** Route param `id` (character UUID)
- **Outputs:** `{ success: true }`
- **Orphan:** false

---

## character-lifecycle-C019: GET /api/characters/players — List Player Characters

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/players.get.ts:1-51`
- **Game Concept:** Fetch player characters with their Pokemon teams for encounter/lobby display
- **Description:** Returns characters where isInLibrary=true AND characterType='player', ordered by name. Includes full Pokemon relation with summary fields (id, species, nickname, level, types, currentHp, maxHp, shiny, spriteUrl). Note: uses `hp` stat as maxHp in response (line 36: `maxHp: char.hp`), which differs from the general GET endpoint.
- **Inputs:** None
- **Outputs:** `{ success: true, data: PlayerCharacter[] }` with id, name, playedBy, level, currentHp, maxHp, avatarUrl, trainerClasses, pokemon
- **Orphan:** false

---

## character-lifecycle-C020: POST /api/characters/import-csv — CSV Import

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/import-csv.post.ts:1-48`
- **Game Concept:** Import a character from a PTU character sheet CSV export
- **Description:** Accepts raw CSV content, auto-detects sheet type (trainer vs pokemon), parses the CSV, and creates the appropriate database record. For trainers, creates a HumanCharacter via `createTrainerFromCSV`. For Pokemon, creates a Pokemon record via `createPokemonFromCSV` (routes through pokemon-generator service).
- **Inputs:** `{ csvContent: string }` — raw CSV text
- **Outputs:** `{ success: true, type: 'trainer' | 'pokemon', data: { id, name/species, level, ... } }`
- **Orphan:** false

---

## character-lifecycle-C021: POST /api/characters/:id/rest — 30-Minute Rest (cross-domain: healing)

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/[id]/rest.post.ts:1-90`
- **Game Concept:** PTU 30-minute rest healing — heal 1/16th max HP
- **Description:** Applies 30 minutes of rest healing to a character. Checks daily counter reset, validates against 5+ injuries and 480-minute daily cap. Uses `calculateRestHealing` utility. Cross-domain with healing system.
- **Inputs:** Route param `id`
- **Outputs:** `{ success: boolean, message: string, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }`
- **Orphan:** false

---

## character-lifecycle-C022: POST /api/characters/:id/extended-rest — Extended Rest (cross-domain: healing)

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/[id]/extended-rest.post.ts:1-102`
- **Game Concept:** PTU extended rest — 4+ hours, clears status, restores AP
- **Description:** Applies 8 rest periods (4 hours). Clears persistent status conditions. Restores drained AP to 0. Cross-domain with healing system.
- **Inputs:** Route param `id`
- **Outputs:** `{ success: true, message, data: { hpHealed, newHp, maxHp, clearedStatuses, apRestored, restMinutesToday, restMinutesRemaining } }`
- **Orphan:** false

---

## character-lifecycle-C023: POST /api/characters/:id/pokemon-center — Pokemon Center Healing (cross-domain: healing)

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/[id]/pokemon-center.post.ts:1-95`
- **Game Concept:** PTU Pokemon Center — full HP, status clear, injury healing (max 3/day)
- **Description:** Full HP restoration, all status conditions cleared, injuries healed (up to daily limit of 3). Does NOT restore drained AP. Calculates healing time based on injury count. Cross-domain with healing system.
- **Inputs:** Route param `id`
- **Outputs:** `{ success: true, message, data: { hpHealed, newHp, maxHp, injuriesHealed, injuriesRemaining, clearedStatuses, apRestored:0, healingTime, healingTimeDescription, atDailyInjuryLimit, injuriesHealedToday } }`
- **Orphan:** false

---

## character-lifecycle-C024: POST /api/characters/:id/heal-injury — Heal One Injury (cross-domain: healing)

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/[id]/heal-injury.post.ts:1-133`
- **Game Concept:** PTU injury healing — natural (24h timer) or drain AP (2 AP per injury)
- **Description:** Heals one injury via natural healing (requires 24h since last injury) or AP drain (costs 2 AP). Both methods subject to daily 3-injury limit. Cross-domain with healing system.
- **Inputs:** Route param `id`, body `{ method: 'natural' | 'drain_ap' }`
- **Outputs:** `{ success: boolean, message, data: { injuriesHealed, injuries, drainedAp?, injuriesHealedToday } }`
- **Orphan:** false

---

## character-lifecycle-C025: POST /api/characters/:id/new-day — Reset Daily Counters (cross-domain: healing)

- **Type:** api-endpoint
- **Location:** `app/server/api/characters/[id]/new-day.post.ts:1-54`
- **Game Concept:** PTU new day — reset rest minutes, injuries healed counter, drained AP
- **Description:** Resets restMinutesToday=0, injuriesHealedToday=0, drainedAp=0, and updates lastRestReset timestamp. Cross-domain with healing system.
- **Inputs:** Route param `id`
- **Outputs:** `{ success: true, message, data: { restMinutesToday, injuriesHealedToday, drainedAp, lastRestReset } }`
- **Orphan:** false

---

## character-lifecycle-C026: CSV detectSheetType()

- **Type:** service-function
- **Location:** `app/server/services/csv-import.service.ts:88-101` — detectSheetType()
- **Game Concept:** Auto-detect whether a CSV is a trainer sheet or Pokemon sheet
- **Description:** Examines the first few rows/columns of parsed CSV data. If "species" is found in the first 5 rows and 10 columns, returns 'pokemon'. If the first cell is "name" or "nickname" without species, returns 'trainer'. Otherwise returns 'unknown'.
- **Inputs:** `rows: string[][]` — parsed CSV 2D array
- **Outputs:** `'trainer' | 'pokemon' | 'unknown'`
- **Orphan:** false

---

## character-lifecycle-C027: CSV parseTrainerSheet()

- **Type:** service-function
- **Location:** `app/server/services/csv-import.service.ts:105-183` — parseTrainerSheet()
- **Game Concept:** Parse PTU trainer character sheet CSV into structured data
- **Description:** Extracts trainer data from fixed CSV cell positions: name, playedBy, age, gender, level, maxHp, 6 stats, 17 skills (Acrobatics through Survival with rank and modifier), features, edges, background, and money. Returns a ParsedTrainer object.
- **Inputs:** `rows: string[][]` — parsed CSV 2D array
- **Outputs:** `ParsedTrainer` — structured trainer data
- **Orphan:** false

---

## character-lifecycle-C028: CSV createTrainerFromCSV()

- **Type:** service-function
- **Location:** `app/server/services/csv-import.service.ts:298-336` — createTrainerFromCSV()
- **Game Concept:** Create a database character record from parsed CSV trainer data
- **Description:** Takes a ParsedTrainer and creates a HumanCharacter in the database. Sets characterType to 'player'. Converts skill data to rank-only format for storage. Sets currentHp to maxHp (full health on import).
- **Inputs:** `trainer: ParsedTrainer`
- **Outputs:** `{ id, name, level, playedBy }` — summary of created character
- **Orphan:** false

---

## character-lifecycle-C029: CSV parseCSV()

- **Type:** utility-function
- **Location:** `app/server/utils/csv-parser.ts:10-54` — parseCSV()
- **Game Concept:** RFC 4180 CSV parsing
- **Description:** Parses raw CSV string into a 2D array of trimmed strings. Handles quoted fields, escaped quotes (doubled quotes), and mixed line endings (CRLF, LF). Used by the import-csv endpoint.
- **Inputs:** `content: string` — raw CSV text
- **Outputs:** `string[][]` — 2D array of cell values
- **Orphan:** false

---

## character-lifecycle-C030: CSV getCell()

- **Type:** utility-function
- **Location:** `app/server/utils/csv-parser.ts:59-61` — getCell()
- **Game Concept:** Safe CSV cell access
- **Description:** Safely retrieves a trimmed cell value from a parsed CSV 2D array. Returns empty string if row or column is out of bounds.
- **Inputs:** `rows: string[][], row: number, col: number`
- **Outputs:** `string` — trimmed cell value or ''
- **Orphan:** false

---

## character-lifecycle-C031: CSV parseNumber()

- **Type:** utility-function
- **Location:** `app/server/utils/csv-parser.ts:67-70` — parseNumber()
- **Game Concept:** Numeric CSV cell parsing
- **Description:** Parses a string into an integer, stripping non-numeric characters (except minus sign). Returns 0 if the value cannot be parsed.
- **Inputs:** `val: string`
- **Outputs:** `number` — parsed integer or 0
- **Orphan:** false

---

## character-lifecycle-C032: Entity Update syncEntityToDatabase()

- **Type:** service-function
- **Location:** `app/server/services/entity-update.service.ts:24-77` — syncEntityToDatabase()
- **Game Concept:** Sync combatant combat state changes to the character database record
- **Description:** Updates HumanCharacter (or Pokemon) record with combat state changes (currentHp, temporaryHp, injuries, statusConditions, stageModifiers, lastInjuryTime). Skips template-loaded combatants (no entityId). Dispatches to humanCharacter.update or pokemon.update based on combatant type. Cross-domain with combat system.
- **Inputs:** `combatant: Combatant, updates: EntityUpdateData`
- **Outputs:** `Promise<void>` — updates DB in place
- **Orphan:** false

---

## character-lifecycle-C033: Entity Update syncDamageToDatabase()

- **Type:** service-function
- **Location:** `app/server/services/entity-update.service.ts:83-98` — syncDamageToDatabase()
- **Game Concept:** Convenience wrapper for syncing damage results to DB
- **Description:** Wraps syncEntityToDatabase with damage-specific parameters. Sets lastInjuryTime to now if a new injury was gained. Cross-domain with combat system.
- **Inputs:** `combatant, newHp, newTempHp, newInjuries, statusConditions, injuryGained`
- **Outputs:** `Promise<void>`
- **Orphan:** false

---

## character-lifecycle-C034: HumanCharacter TypeScript Interface

- **Type:** type-definition
- **Location:** `app/types/character.ts:154-211` — interface HumanCharacter
- **Game Concept:** Client-side type for human character data
- **Description:** Full TypeScript interface for HumanCharacter matching the API response shape. Includes: id, name, characterType, player info, level, stats (nested Stats), currentHp, maxHp, trainerClasses, skills, features, edges, pokemonIds, pokemon (optional relation), statusConditions, stageModifiers, injuries, temporaryHp, rest tracking fields, inventory, money, avatarUrl, background, personality, goals, location, isInLibrary, notes.
- **Inputs:** N/A
- **Outputs:** Used across all UI components, stores, and composables
- **Orphan:** false

---

## character-lifecycle-C035: CharacterType Type

- **Type:** type-definition
- **Location:** `app/types/character.ts:12` — type CharacterType
- **Game Concept:** Character role discriminator
- **Description:** `type CharacterType = 'player' | 'npc' | 'trainer'` — union type for the characterType field.
- **Inputs:** N/A
- **Outputs:** Used by HumanCharacter interface and library store filtering
- **Orphan:** false

---

## character-lifecycle-C036: Stats Interface

- **Type:** type-definition
- **Location:** `app/types/character.ts:21-28` — interface Stats
- **Game Concept:** Six-stat block (hp, attack, defense, specialAttack, specialDefense, speed)
- **Description:** Shared interface for the 6 core stats, used by both HumanCharacter.stats and Pokemon baseStats/currentStats.
- **Inputs:** N/A
- **Outputs:** Used throughout stat display components and damage calculations
- **Orphan:** false

---

## character-lifecycle-C037: SkillRank Type

- **Type:** type-definition
- **Location:** `app/types/character.ts:18` — type SkillRank
- **Game Concept:** PTU skill rank levels
- **Description:** `'Pathetic' | 'Untrained' | 'Novice' | 'Adept' | 'Expert' | 'Master'` — union type for human character skill ranks.
- **Inputs:** N/A
- **Outputs:** Used by HumanCharacter.skills Record type and skill display components
- **Orphan:** false

---

## character-lifecycle-C038: InventoryItem Interface

- **Type:** type-definition
- **Location:** `app/types/character.ts:88-93` — interface InventoryItem
- **Game Concept:** Character inventory item
- **Description:** `{ id: string, name: string, quantity: number, effect?: string }` — structure for items in the character's inventory JSON array.
- **Inputs:** N/A
- **Outputs:** Used by HumanCharacter.inventory field
- **Orphan:** false

---

## character-lifecycle-C039: LibraryFilters Interface

- **Type:** type-definition
- **Location:** `app/types/encounter.ts:152-159` — interface LibraryFilters
- **Game Concept:** Filter/sort configuration for the character library
- **Description:** `{ search, type: 'all'|'human'|'pokemon', characterType: 'all'|'player'|'npc', pokemonType, pokemonOrigin, sortBy: 'name'|'level'|'dateAdded', sortOrder: 'asc'|'desc' }`. Controls library listing display.
- **Inputs:** N/A
- **Outputs:** Used by library store and sheets page
- **Orphan:** false

---

## character-lifecycle-C040: isPokemon() Type Guard

- **Type:** type-guard
- **Location:** `app/types/guards.ts:9-11` — isPokemon()
- **Game Concept:** Discriminate Pokemon from HumanCharacter
- **Description:** Checks for 'species' property to identify Pokemon entities. Used by WebSocket handler and CharacterModal to branch logic.
- **Inputs:** `entity: Pokemon | HumanCharacter`
- **Outputs:** `entity is Pokemon` (type narrowing)
- **Orphan:** false

---

## character-lifecycle-C041: isHumanCharacter() Type Guard

- **Type:** type-guard
- **Location:** `app/types/guards.ts:17-19` — isHumanCharacter()
- **Game Concept:** Discriminate HumanCharacter from Pokemon
- **Description:** Checks for 'characterType' property to identify HumanCharacter entities.
- **Inputs:** `entity: Pokemon | HumanCharacter`
- **Outputs:** `entity is HumanCharacter` (type narrowing)
- **Orphan:** false

---

## character-lifecycle-C042: getEntityDisplayName()

- **Type:** type-guard
- **Location:** `app/types/guards.ts:24-29` — getEntityDisplayName()
- **Game Concept:** Get display name for any entity (nickname/species or name)
- **Description:** Returns nickname||species for Pokemon, name for HumanCharacter.
- **Inputs:** `entity: Pokemon | HumanCharacter`
- **Outputs:** `string` — display name
- **Orphan:** false

---

## character-lifecycle-C043: getEntityType()

- **Type:** type-guard
- **Location:** `app/types/guards.ts:34-36` — getEntityType()
- **Game Concept:** Get entity type string
- **Description:** Returns 'pokemon' or 'human' based on entity type.
- **Inputs:** `entity: Pokemon | HumanCharacter`
- **Outputs:** `'pokemon' | 'human'`
- **Orphan:** false

---

## character-lifecycle-C044: Library Store — loadLibrary()

- **Type:** store-action
- **Location:** `app/stores/library.ts:167-182` — loadLibrary()
- **Game Concept:** Fetch all characters and Pokemon from the server
- **Description:** Fetches both /api/characters and /api/pokemon in parallel. Populates the store's `humans` and `pokemon` arrays. Sets loading/error state.
- **Inputs:** None
- **Outputs:** Populates `store.humans: HumanCharacter[]` and `store.pokemon: Pokemon[]`
- **Orphan:** false

---

## character-lifecycle-C045: Library Store — createHuman()

- **Type:** store-action
- **Location:** `app/stores/library.ts:185-197` — createHuman()
- **Game Concept:** Create a character and add to the store
- **Description:** POSTs to /api/characters with partial HumanCharacter data. On success, pushes the new character to `store.humans`. Returns the created character.
- **Inputs:** `data: Partial<HumanCharacter>`
- **Outputs:** `Promise<HumanCharacter>` — the created character
- **Orphan:** false

---

## character-lifecycle-C046: Library Store — updateHuman()

- **Type:** store-action
- **Location:** `app/stores/library.ts:200-215` — updateHuman()
- **Game Concept:** Update a character and sync the store
- **Description:** PUTs to /api/characters/:id with partial data. On success, replaces the matching entry in `store.humans` by index. Returns the updated character.
- **Inputs:** `id: string, data: Partial<HumanCharacter>`
- **Outputs:** `Promise<HumanCharacter>` — the updated character
- **Orphan:** false

---

## character-lifecycle-C047: Library Store — deleteHuman()

- **Type:** store-action
- **Location:** `app/stores/library.ts:218-226` — deleteHuman()
- **Game Concept:** Delete a character and remove from the store
- **Description:** DELETEs /api/characters/:id. On success, filters out the character from `store.humans`.
- **Inputs:** `id: string`
- **Outputs:** `Promise<void>` — removes from store
- **Orphan:** false

---

## character-lifecycle-C048: Library Store — linkPokemonToTrainer()

- **Type:** store-action
- **Location:** `app/stores/library.ts:273-287` — linkPokemonToTrainer()
- **Game Concept:** Link a Pokemon to a trainer (set ownership)
- **Description:** POSTs to /api/pokemon/:id/link with { trainerId }. Updates the Pokemon's ownerId in the store's pokemon array.
- **Inputs:** `pokemonId: string, trainerId: string`
- **Outputs:** `Promise<void>` — updates store.pokemon
- **Orphan:** false

---

## character-lifecycle-C049: Library Store — unlinkPokemon()

- **Type:** store-action
- **Location:** `app/stores/library.ts:290-303` — unlinkPokemon()
- **Game Concept:** Unlink a Pokemon from its trainer (remove ownership)
- **Description:** POSTs to /api/pokemon/:id/unlink. Clears the Pokemon's ownerId in the store's pokemon array.
- **Inputs:** `pokemonId: string`
- **Outputs:** `Promise<void>` — updates store.pokemon
- **Orphan:** false

---

## character-lifecycle-C050: Library Store — setFilters() / resetFilters()

- **Type:** store-action
- **Location:** `app/stores/library.ts:306-321` — setFilters(), resetFilters()
- **Game Concept:** Library filtering and sorting controls
- **Description:** setFilters merges partial filter updates. resetFilters resets to defaults (search='', type/characterType/pokemonType/pokemonOrigin='all', sortBy='name', sortOrder='asc').
- **Inputs:** `filters: Partial<LibraryFilters>` for setFilters; none for reset
- **Outputs:** Updates `store.filters` state
- **Orphan:** false

---

## character-lifecycle-C051: Library Store — filteredHumans getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:22-54` — filteredHumans
- **Game Concept:** Filter and sort characters by search text, character type, and sort preference
- **Description:** Filters the humans array by search (name or location match) and characterType filter. Sorts by name or level in ascending or descending order.
- **Inputs:** Reads from `state.humans` and `state.filters`
- **Outputs:** `HumanCharacter[]` — filtered and sorted list
- **Orphan:** false

---

## character-lifecycle-C052: Library Store — getHumanById getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:102-104` — getHumanById()
- **Game Concept:** Look up a character by ID from the store cache
- **Description:** Returns a single HumanCharacter from the store's humans array by ID, or undefined if not found.
- **Inputs:** `id: string`
- **Outputs:** `HumanCharacter | undefined`
- **Orphan:** false

---

## character-lifecycle-C053: Library Store — getPokemonByOwner getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:110-112` — getPokemonByOwner()
- **Game Concept:** Get all Pokemon owned by a specific character
- **Description:** Filters the Pokemon array to return only those with matching ownerId. Used to display a character's team.
- **Inputs:** `ownerId: string`
- **Outputs:** `Pokemon[]` — Pokemon owned by the character
- **Orphan:** false

---

## character-lifecycle-C054: Library Store — filteredPlayers getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:114-116` — filteredPlayers
- **Game Concept:** Get only player characters from filtered results
- **Description:** Filters filteredHumans to return only characters where characterType === 'player'.
- **Inputs:** Reads from filteredHumans
- **Outputs:** `HumanCharacter[]` — player characters only
- **Orphan:** false

---

## character-lifecycle-C055: Library Store — groupedNpcsByLocation getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:118-139` — groupedNpcsByLocation
- **Game Concept:** Group NPCs by location for library display
- **Description:** Filters filteredHumans to non-player characters, groups them by location field, sorts location groups alphabetically (empty location last), and returns array of { location, humans } objects.
- **Inputs:** Reads from filteredHumans
- **Outputs:** `{ location: string, humans: HumanCharacter[] }[]`
- **Orphan:** false

---

## character-lifecycle-C056: Library Store — groupedPokemonByLocation getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:141-162` — groupedPokemonByLocation
- **Game Concept:** Group Pokemon by location for library display
- **Description:** Groups filteredPokemon by location field, sorts alphabetically (empty location last). Returns array of { location, pokemon } objects.
- **Inputs:** Reads from filteredPokemon
- **Outputs:** `{ location: string, pokemon: Pokemon[] }[]`
- **Orphan:** false

---

## character-lifecycle-C057: Library Store — allFiltered getter

- **Type:** store-getter
- **Location:** `app/stores/library.ts:96-100` — allFiltered
- **Game Concept:** Combined filtered list of humans and Pokemon
- **Description:** Returns combined array of filteredHumans and filteredPokemon, respecting the type filter (human/pokemon/all).
- **Inputs:** Reads from type filter, filteredHumans, filteredPokemon
- **Outputs:** `(HumanCharacter | Pokemon)[]`
- **Orphan:** false

---

## character-lifecycle-C058: useEntityStats — getHumanStat()

- **Type:** composable-function
- **Location:** `app/composables/useEntityStats.ts:148-161` — getHumanStat()
- **Game Concept:** Safely access a human character's stat from various data formats
- **Description:** Handles both nested `stats.attack` and flat `attack` field access patterns. Returns the stat value or 0 if not found.
- **Inputs:** `entity: unknown, stat: 'attack' | 'specialAttack' | 'defense' | 'specialDefense' | 'speed'`
- **Outputs:** `number` — stat value
- **Orphan:** false

---

## character-lifecycle-C059: useRestHealing — rest()

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:16-33` — rest()
- **Game Concept:** Client-side action for 30-minute rest (cross-domain: healing)
- **Description:** Calls POST /api/characters/:id/rest (or /api/pokemon/:id/rest). Manages loading and error state. Returns the rest result.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `Promise<RestResult | null>`
- **Orphan:** false

---

## character-lifecycle-C060: useRestHealing — extendedRest()

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:38-55` — extendedRest()
- **Game Concept:** Client-side action for extended rest (cross-domain: healing)
- **Description:** Calls POST /api/characters/:id/extended-rest. Manages loading state.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `Promise<RestResult | null>`
- **Orphan:** false

---

## character-lifecycle-C061: useRestHealing — pokemonCenter()

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:60-77` — pokemonCenter()
- **Game Concept:** Client-side action for Pokemon Center healing (cross-domain: healing)
- **Description:** Calls POST /api/characters/:id/pokemon-center. Manages loading state.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `Promise<RestResult | null>`
- **Orphan:** false

---

## character-lifecycle-C062: useRestHealing — healInjury()

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:82-106` — healInjury()
- **Game Concept:** Client-side action for injury healing (cross-domain: healing)
- **Description:** Calls POST /api/characters/:id/heal-injury with method (natural or drain_ap).
- **Inputs:** `type, id, method: 'natural' | 'drain_ap'`
- **Outputs:** `Promise<RestResult | null>`
- **Orphan:** false

---

## character-lifecycle-C063: useRestHealing — newDay()

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:139-156` — newDay()
- **Game Concept:** Client-side action for new day reset (cross-domain: healing)
- **Description:** Calls POST /api/characters/:id/new-day to reset daily healing counters.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `Promise<RestResult | null>`
- **Orphan:** false

---

## character-lifecycle-C064: useRestHealing — getHealingInfo() / formatRestTime()

- **Type:** composable-function
- **Location:** `app/composables/useRestHealing.ts:111-134` — getHealingInfo(), formatRestTime()
- **Game Concept:** Calculate and display healing status information
- **Description:** getHealingInfo wraps the utility's getRestHealingInfo with Date conversion. formatRestTime converts minutes to "Xh Ym" format. Used by HealingTab component.
- **Inputs:** Entity healing params (maxHp, injuries, restMinutesToday, lastInjuryTime, injuriesHealedToday)
- **Outputs:** `RestHealingInfo` object and formatted string
- **Orphan:** false

---

## character-lifecycle-C065: restHealing utility functions

- **Type:** utility-function
- **Location:** `app/utils/restHealing.ts:1-181` — shouldResetDailyCounters(), calculateRestHealing(), canHealInjuryNaturally(), calculatePokemonCenterTime(), calculatePokemonCenterInjuryHealing(), getStatusesToClear(), clearPersistentStatusConditions(), getRestHealingInfo()
- **Game Concept:** Pure PTU rest and healing calculation functions (cross-domain: healing)
- **Description:** 8 pure functions implementing PTU rest/healing rules. shouldResetDailyCounters checks calendar day change. calculateRestHealing computes HP healed per 30-min rest (1/16th max HP, min 1). canHealInjuryNaturally checks 24h timer. calculatePokemonCenterTime computes visit duration. calculatePokemonCenterInjuryHealing computes injuries healable within daily cap. getStatusesToClear/clearPersistentStatusConditions handle extended rest status clearing. getRestHealingInfo aggregates all healing info for display.
- **Inputs:** Various params per function
- **Outputs:** Various calculation results
- **Orphan:** false

---

## character-lifecycle-C066: WebSocket character_update Event

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:246-249` (server), `app/composables/useWebSocket.ts:86-101` (client)
- **Game Concept:** Real-time character data sync across views
- **Description:** Server broadcasts character_update events to all connected peers. Client handler (useWebSocket) receives the event and updates the library store's humans or pokemon array by finding and replacing the matching entry by ID. Uses isPokemon() type guard to discriminate.
- **Inputs:** `{ type: 'character_update', data: Pokemon | HumanCharacter }`
- **Outputs:** Updates library store in-memory data
- **Orphan:** false

---

## character-lifecycle-C067: HumanCard Component

- **Type:** component
- **Location:** `app/components/character/HumanCard.vue:1-201`
- **Game Concept:** Character card for library grid display
- **Description:** Displays a character summary card with: avatar (image or initial), name, type badge (Player/NPC), level, location (with PhMapPin icon), HP/Speed stats, and linked Pokemon sprites. Links to `/gm/characters/:id` on click.
- **Inputs:** `{ human: HumanCharacter }` prop
- **Outputs:** Visual card component, navigates to character sheet on click
- **Orphan:** false

---

## character-lifecycle-C068: CharacterModal Component

- **Type:** component
- **Location:** `app/components/character/CharacterModal.vue:1-536`
- **Game Concept:** Full-screen modal for viewing/editing a character or Pokemon sheet
- **Description:** Reusable modal that displays either a HumanCharacter or Pokemon sheet with tabbed interface. Human tabs: Stats, Classes, Skills, Pokemon, Notes. Supports view and edit modes. Uses sub-components (HumanStatsTab, HumanClassesTab, HumanSkillsTab, HumanPokemonTab, NotesTab). Emits save and close events.
- **Inputs:** `{ character: Pokemon | HumanCharacter, mode: 'view' | 'edit' }`
- **Outputs:** Emits `save` with partial update data, `close` to dismiss
- **Orphan:** false

---

## character-lifecycle-C069: HumanStatsTab Component

- **Type:** component
- **Location:** `app/components/character/tabs/HumanStatsTab.vue:1-161`
- **Game Concept:** Stats display tab for human character sheet modal
- **Description:** Displays 6 stats in a 3-column grid, plus height, weight, money fields. Supports edit mode via input fields with update:editData emit.
- **Inputs:** `{ human, currentHp, maxHp, editData, isEditing }`
- **Outputs:** Visual display; emits `update:editData` for edits
- **Orphan:** false

---

## character-lifecycle-C070: HumanClassesTab Component

- **Type:** component
- **Location:** `app/components/character/tabs/HumanClassesTab.vue:1-94`
- **Game Concept:** Classes, features, and edges display tab
- **Description:** Displays trainer classes, features, and edges as styled tag lists. Shows empty state if none recorded.
- **Inputs:** `{ trainerClasses?, features?, edges? }`
- **Outputs:** Visual display only (read-only)
- **Orphan:** false

---

## character-lifecycle-C071: HumanSkillsTab Component

- **Type:** component
- **Location:** `app/components/character/tabs/HumanSkillsTab.vue:1-90`
- **Game Concept:** Skills display tab for human character sheet
- **Description:** Displays all skills in an auto-fill grid. Each skill shows name and rank with rank-based color styling (pathetic=danger, untrained=muted, novice=default, adept=info, expert=success, master=warning).
- **Inputs:** `{ skills?: Record<string, string> }`
- **Outputs:** Visual display only (read-only)
- **Orphan:** false

---

## character-lifecycle-C072: HumanPokemonTab Component

- **Type:** component
- **Location:** `app/components/character/tabs/HumanPokemonTab.vue:1-90`
- **Game Concept:** Pokemon team display tab for human character sheet
- **Description:** Displays the character's linked Pokemon as a list with sprites, names (nickname or species), levels, and HP. Shows empty state if no Pokemon linked.
- **Inputs:** `{ pokemon?: Pokemon[] }`
- **Outputs:** Visual display only (read-only)
- **Orphan:** false

---

## character-lifecycle-C073: NotesTab Component

- **Type:** component
- **Location:** `app/components/character/tabs/NotesTab.vue:1-141`
- **Game Concept:** Notes/background display and edit tab
- **Description:** For human characters: displays background, personality, goals, and notes as editable textareas. For Pokemon: displays notes and held item. Supports view/edit modes. Emits update events for each field.
- **Inputs:** `{ isPokemon, isEditing, notes?, heldItem?, background?, personality?, goals? }`
- **Outputs:** Emits `update:notes`, `update:background`, `update:personality`, `update:goals`
- **Orphan:** false

---

## character-lifecycle-C074: Create Page (pages/gm/create.vue)

- **Type:** page
- **Location:** `app/pages/gm/create.vue:1-479`
- **Game Concept:** Character creation form page
- **Description:** Full-page form for creating either a Human Character or Pokemon. Human form: name (required), characterType (player/npc), level, location (for NPCs), 6 stats, notes. Pokemon form: species, nickname, level, gender, shiny, types, 6 base stats, location, notes. Uses library store's createHuman/createPokemon. PTU HP formula applied for Pokemon (level + baseHp*3 + 10). Navigates to /gm/sheets on success.
- **Inputs:** User form input
- **Outputs:** Creates character via store action, navigates to library
- **Orphan:** false

---

## character-lifecycle-C075: Character Sheet Page (pages/gm/characters/[id].vue)

- **Type:** page
- **Location:** `app/pages/gm/characters/[id].vue:1-681`
- **Game Concept:** Full character sheet page with edit mode
- **Description:** Displays a single character's full sheet with tabbed interface: Stats, Classes, Skills, Pokemon, Healing, Notes. Header shows avatar, name, playedBy, level, age, gender, characterType, and location (for non-players). Edit mode enables inline editing of all fields. Saves via library store's updateHuman. HealingTab component handles rest/healing actions (cross-domain). Pokemon tab links to individual Pokemon sheet pages.
- **Inputs:** Route param `id`, query param `edit=true` for auto-edit mode
- **Outputs:** Character display with edit/save functionality
- **Orphan:** false

---

## character-lifecycle-C076: Sheets Page (pages/gm/sheets.vue)

- **Type:** page
- **Location:** `app/pages/gm/sheets.vue:1-507`
- **Game Concept:** Character & Pokemon library browser with filters and management
- **Description:** Main library listing page. Sections: Players (grid of HumanCards), NPCs grouped by location (collapsible), Pokemon grouped by location (collapsible). Filter bar: search text, entity type (all/human/pokemon), character type (all/player/npc), Pokemon origin filter, sort by name/level. Manage panel: origin counts, bulk archive/delete unowned wild Pokemon. Uses library store for all data and filtering.
- **Inputs:** User filter/search interactions
- **Outputs:** Displays HumanCard and PokemonCard components in filtered/sorted layout
- **Orphan:** false

---

## character-lifecycle-C077: HealingTab Component (cross-domain: healing)

- **Type:** component
- **Location:** `app/components/common/HealingTab.vue:1-315`
- **Game Concept:** Healing actions UI for character sheet
- **Description:** Shared component for rest/healing actions on characters or Pokemon. Displays current status (HP, injuries, rest today, HP per rest, injuries healed today, drained AP, time since last injury). Action buttons: Rest 30 min, Extended Rest, Pokemon Center, Natural Injury Heal, Drain AP to Heal (characters only), New Day. Uses useRestHealing composable. Emits 'healed' event to trigger parent data reload. Cross-domain with healing system.
- **Inputs:** `{ entityType: 'pokemon'|'character', entityId: string, entity: Pokemon|HumanCharacter }`
- **Outputs:** Emits `healed` event; healing actions via composable
- **Orphan:** false

---

## character-lifecycle-C078: POST /api/pokemon/:id/link — Link Pokemon to Trainer

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id]/link.post.ts:1-69`
- **Game Concept:** Set Pokemon ownership to a trainer
- **Description:** Sets the ownerId field on a Pokemon record to the specified trainerId. Validates that the trainer exists. Returns the updated Pokemon with parsed JSON fields. The Pokemon then appears in the trainer's pokemon relation.
- **Inputs:** Route param `id` (Pokemon UUID), body `{ trainerId: string }`
- **Outputs:** `{ data: Pokemon }` — updated Pokemon with ownerId set
- **Orphan:** false

---

## character-lifecycle-C079: POST /api/pokemon/:id/unlink — Unlink Pokemon from Trainer

- **Type:** api-endpoint
- **Location:** `app/server/api/pokemon/[id]/unlink.post.ts:1-48`
- **Game Concept:** Remove Pokemon ownership
- **Description:** Sets the ownerId field on a Pokemon record to null. Returns the updated Pokemon with parsed JSON fields.
- **Inputs:** Route param `id` (Pokemon UUID)
- **Outputs:** `{ data: Pokemon }` — updated Pokemon with ownerId=null
- **Orphan:** false

---

## character-lifecycle-C080: ApiResponse Interface

- **Type:** type-definition
- **Location:** `app/types/api.ts:11-15` — interface ApiResponse<T>
- **Game Concept:** Standard API response wrapper
- **Description:** `{ success: boolean, data?: T, error?: string }` — generic response wrapper used by all character API endpoints.
- **Inputs:** N/A
- **Outputs:** Used as return type by all character endpoints
- **Orphan:** false

---

## character-lifecycle-C081: PokemonCard Component

- **Type:** component
- **Location:** `app/components/character/PokemonCard.vue:1-319`
- **Game Concept:** Pokemon card for library grid display
- **Description:** Displays a Pokemon summary card with: sprite (with shiny indicator), display name, species (if nicknamed), type badges, level, location, HP bar with color-coded health status, status condition badges, injury badge. Origin badge (Wild/Captured/Template/Imported). Links to `/gm/pokemon/:id` on click.
- **Inputs:** `{ pokemon: Pokemon }` prop
- **Outputs:** Visual card component, navigates to Pokemon sheet on click
- **Orphan:** false

---

## Capability Chains

### Chain 1: Character Creation (Manual)
1. `character-lifecycle-C074` (page: create.vue) → 2. `character-lifecycle-C045` (store: createHuman) → 3. `character-lifecycle-C015` (api: POST /api/characters) → 4. `character-lifecycle-C001` (prisma: HumanCharacter)
**Breaks at:** complete

### Chain 2: Character Creation (CSV Import)
1. `character-lifecycle-C020` (api: POST /api/characters/import-csv) → 2. `character-lifecycle-C029` (util: parseCSV) → 3. `character-lifecycle-C026` (service: detectSheetType) → 4. `character-lifecycle-C027` (service: parseTrainerSheet) → 5. `character-lifecycle-C028` (service: createTrainerFromCSV) → 6. `character-lifecycle-C001` (prisma: HumanCharacter)
**Breaks at:** No UI component calls the import-csv endpoint directly. The CSV import flow has an API but no visible UI trigger in the codebase. The sheets page has no import button.

### Chain 3: Character Listing & Filtering
1. `character-lifecycle-C076` (page: sheets.vue) → 2. `character-lifecycle-C044` (store: loadLibrary) → 3. `character-lifecycle-C014` (api: GET /api/characters) → 4. `character-lifecycle-C001` (prisma: HumanCharacter)
Filtering path: `character-lifecycle-C076` (page) → `character-lifecycle-C050` (store: setFilters) → `character-lifecycle-C051` (getter: filteredHumans) → `character-lifecycle-C054` (getter: filteredPlayers) + `character-lifecycle-C055` (getter: groupedNpcsByLocation)
Display: `character-lifecycle-C067` (component: HumanCard) + `character-lifecycle-C081` (component: PokemonCard)
**Breaks at:** complete

### Chain 4: Character Detail View
1. `character-lifecycle-C075` (page: characters/[id].vue) → 2. (direct $fetch) → 3. `character-lifecycle-C016` (api: GET /api/characters/:id) → 4. `character-lifecycle-C001` (prisma: HumanCharacter)
**Breaks at:** complete (Note: page directly $fetch-es the API, bypassing the store)

### Chain 5: Character Update
1. `character-lifecycle-C075` (page: characters/[id].vue saveChanges) → 2. `character-lifecycle-C046` (store: updateHuman) → 3. `character-lifecycle-C017` (api: PUT /api/characters/:id) → 4. `character-lifecycle-C001` (prisma: HumanCharacter)
**Breaks at:** complete

### Chain 6: Character Deletion
1. `character-lifecycle-C076` (page: sheets.vue deleteHuman — defined but not wired to UI) → 2. `character-lifecycle-C047` (store: deleteHuman) → 3. `character-lifecycle-C018` (api: DELETE /api/characters/:id) → 4. `character-lifecycle-C001` (prisma: HumanCharacter)
**Breaks at:** The deleteHuman function exists in sheets.vue (line 325-329) but is never called from the template. There is no delete button on HumanCard or the sheets page. Deletion is orphaned at the UI level.

### Chain 7: Pokemon Link/Unlink
1. `character-lifecycle-C048` (store: linkPokemonToTrainer) → 2. `character-lifecycle-C078` (api: POST /api/pokemon/:id/link) → 3. `character-lifecycle-C001` (prisma: HumanCharacter verify) + Pokemon.update
1. `character-lifecycle-C049` (store: unlinkPokemon) → 2. `character-lifecycle-C079` (api: POST /api/pokemon/:id/unlink) → 3. Pokemon.update
**Breaks at:** No UI component calls linkPokemonToTrainer or unlinkPokemon. The store actions exist but have no UI trigger. Link/unlink is only exercised via capture system (different domain).

### Chain 8: Character Sheet Modal (used from encounter/scene contexts)
1. `character-lifecycle-C068` (component: CharacterModal) → sub-components: `character-lifecycle-C069` (HumanStatsTab) + `character-lifecycle-C070` (HumanClassesTab) + `character-lifecycle-C071` (HumanSkillsTab) + `character-lifecycle-C072` (HumanPokemonTab) + `character-lifecycle-C073` (NotesTab)
**Breaks at:** complete (modal is opened from various contexts, emits save event for parent to handle)

### Chain 9: Character Healing (cross-domain)
1. `character-lifecycle-C075` (page: characters/[id].vue HealingTab) → 2. `character-lifecycle-C077` (component: HealingTab) → 3. `character-lifecycle-C059-C063` (composable: useRestHealing functions) → 4. `character-lifecycle-C021-C025` (api: rest/healing endpoints) → 5. `character-lifecycle-C065` (util: restHealing functions) → 6. `character-lifecycle-C001` (prisma: HumanCharacter)
**Breaks at:** complete

### Chain 10: Player Characters (for encounter/lobby)
1. (external: encounter/lobby pages) → 2. `character-lifecycle-C019` (api: GET /api/characters/players) → 3. `character-lifecycle-C001` (prisma: HumanCharacter)
**Breaks at:** complete

### Chain 11: Real-time Character Sync
1. (any client sends) → 2. `character-lifecycle-C066` (ws: character_update server broadcast) → 3. `character-lifecycle-C066` (ws: character_update client handler) → 4. (library store mutation)
**Breaks at:** complete

### Chain 12: Combat Entity Sync
1. (combat system) → 2. `character-lifecycle-C032` (service: syncEntityToDatabase) / `character-lifecycle-C033` (syncDamageToDatabase) → 3. `character-lifecycle-C001` (prisma: humanCharacter.update)
**Breaks at:** complete (cross-domain with combat)

---

## Identified Gaps

1. **CSV Import has no UI** (Chain 2): The POST /api/characters/import-csv endpoint exists but there is no button or UI component in the application that calls it. Users cannot trigger CSV import through the UI.

2. **Delete has no UI trigger** (Chain 6): The deleteHuman function is defined in sheets.vue but never called from the template. HumanCard has no delete button. Characters can only be deleted via direct API call.

3. **Link/Unlink has no dedicated UI** (Chain 7): The store actions linkPokemonToTrainer and unlinkPokemon exist but no UI component presents link/unlink controls. The only way Pokemon get linked is through the capture system (different domain) or direct API calls.

4. **Character sheet page bypasses store for read** (Chain 4): The characters/[id].vue page directly $fetch-es the API instead of using the library store's getHumanById getter. This means edits on the sheet page don't sync with the library listing until loadLibrary is called again.

5. **PUT /api/characters/:id does not refetch Pokemon relation** (C017): The update endpoint returns pokemonIds=[] regardless of actual linked Pokemon. After an update, the client loses the Pokemon relation data until a full reload.
