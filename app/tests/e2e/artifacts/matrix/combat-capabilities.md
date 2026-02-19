---
domain: combat
mapped_at: 2026-02-19T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 197
files_read: 52
---

# App Capabilities: Combat

## Summary
- Total capabilities: 197
- Types: api-endpoint(29), service-function(30), composable-function(28), store-action(35), store-getter(18), component(17), constant(10), utility(17), websocket-event(13)
- Orphan capabilities: 6

---

## combat-C001: List Encounters

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/index.get.ts:defineEventHandler`
- **Game Concept:** Encounter management
- **Description:** Lists all encounters ordered by last update. Parses JSON fields (combatants, turnOrder, moveLog, defeatedEnemies) from DB.
- **Inputs:** None
- **Outputs:** `{ success, data: Encounter[] }` with parsed combatants and grid config
- **Orphan:** false

## combat-C002: Create Encounter

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/index.post.ts:defineEventHandler`
- **Game Concept:** Encounter creation
- **Description:** Creates a new encounter with name, battleType (trainer/full_contact), weather, and default grid configuration.
- **Inputs:** `{ name, battleType, weather?, gridEnabled?, gridWidth?, gridHeight?, gridCellSize?, gridBackground? }`
- **Outputs:** `{ success, data: Encounter }` with empty combatants
- **Orphan:** false

## combat-C003: Get Encounter By ID

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id].get.ts:defineEventHandler`
- **Game Concept:** Encounter retrieval
- **Description:** Fetches a single encounter by ID with all parsed JSON fields.
- **Inputs:** `id` (URL param)
- **Outputs:** `{ success, data: Encounter }`
- **Orphan:** false

## combat-C004: Update Encounter (Full State)

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id].put.ts:defineEventHandler`
- **Game Concept:** Encounter state persistence
- **Description:** Full-state update of an encounter (used by undo/redo). Accepts complete encounter state and persists to DB.
- **Inputs:** `id` (URL param), full encounter body including combatants, turnOrder, gridConfig, moveLog, defeatedEnemies
- **Outputs:** `{ success, data: Encounter }`
- **Orphan:** false

## combat-C005: Get Served Encounter

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/served.get.ts:defineEventHandler`
- **Game Concept:** Group View encounter display
- **Description:** Fetches the currently served encounter (isServed=true). Returns null if none served.
- **Inputs:** None
- **Outputs:** `{ success, data: Encounter | null }`
- **Orphan:** false

## combat-C006: Create Encounter From Scene

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/from-scene.post.ts:defineEventHandler`
- **Game Concept:** Scene-to-encounter conversion
- **Description:** Creates an encounter from a scene. Scene Pokemon become wild enemy combatants (generates full DB records via pokemon-generator). Scene characters become player combatants. Auto-places tokens on grid.
- **Inputs:** `{ sceneId, battleType? }`
- **Outputs:** `{ success, data: Encounter }` with generated combatants
- **Orphan:** false

## combat-C007: Start Encounter

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/start.post.ts:defineEventHandler`
- **Game Concept:** Combat initiation with initiative sorting
- **Description:** Starts combat by resetting turn states, sorting initiative with d20 roll-offs for ties. For League battles, separates trainer/pokemon turn orders. Sets isActive=true.
- **Inputs:** `id` (URL param)
- **Outputs:** `{ success, data: Encounter }` with turnOrder, trainerTurnOrder, pokemonTurnOrder
- **Orphan:** false

## combat-C008: End Encounter

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/end.post.ts:defineEventHandler`
- **Game Concept:** Combat termination
- **Description:** Ends combat by setting isActive=false and isPaused=false. Preserves combatant state and move log.
- **Inputs:** `id` (URL param)
- **Outputs:** `{ success, data: Encounter }` with isActive=false
- **Orphan:** false

## combat-C009: Advance Turn

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/next-turn.post.ts:defineEventHandler`
- **Game Concept:** Turn progression
- **Description:** Marks current combatant as acted, advances turnIndex. On round wrap, increments round and resets all combatant actions (actionsRemaining=2, shiftActionsRemaining=1).
- **Inputs:** `id` (URL param)
- **Outputs:** `{ success, data: Encounter }` with updated round/turnIndex
- **Orphan:** false

## combat-C010: Add Combatant

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/combatants.post.ts:defineEventHandler`
- **Game Concept:** Adding combatants to encounter
- **Description:** Loads a Pokemon or HumanCharacter from DB, builds typed entity, calculates initiative and evasions, auto-places on grid. Uses combatant.service.ts builders.
- **Inputs:** `id` (URL param), `{ entityId, entityType, side, initiativeBonus? }`
- **Outputs:** `{ success, data: Encounter }` with new combatant appended
- **Orphan:** false

## combat-C011: Remove Combatant

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts:defineEventHandler`
- **Game Concept:** Removing combatants from encounter
- **Description:** Removes a combatant from the combatants array and turnOrder. Adjusts currentTurnIndex if needed.
- **Inputs:** `id`, `combatantId` (URL params)
- **Outputs:** `{ data: Encounter }` with combatant removed
- **Orphan:** false

## combat-C012: Apply Damage

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/damage.post.ts:defineEventHandler`
- **Game Concept:** PTU damage application
- **Description:** Applies damage with PTU mechanics: temp HP absorption, massive damage injury check, HP marker crossing injuries, faint + status clearing. Syncs to DB and tracks defeated enemies for XP.
- **Inputs:** `id` (URL param), `{ combatantId, damage }`
- **Outputs:** `{ success, data: Encounter, damageResult: DamageResult }`
- **Orphan:** false

## combat-C013: Heal Combatant

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/heal.post.ts:defineEventHandler`
- **Game Concept:** PTU healing
- **Description:** Applies healing to a combatant: HP (capped at max), temporary HP (stacks), or injury reduction. Removes Fainted status if healed from 0 HP. Syncs to DB.
- **Inputs:** `id` (URL param), `{ combatantId, amount?, tempHp?, healInjuries? }`
- **Outputs:** `{ success, data: Encounter, healResult: HealResult }`
- **Orphan:** false

## combat-C014: Execute Move

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/move.post.ts:defineEventHandler`
- **Game Concept:** Move execution with damage pipeline
- **Description:** Executes a move: finds actor and move data, applies per-target damage using PTU mechanics pipeline, syncs DB, creates move log entry, decrements actions.
- **Inputs:** `id` (URL param), `{ actorId, moveId, targetIds, damage?, targetDamages?, notes? }`
- **Outputs:** `{ success, data: Encounter }` with updated moveLog
- **Orphan:** false

## combat-C015: Update Combat Stages

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/stages.post.ts:defineEventHandler`
- **Game Concept:** PTU combat stage modifiers (-6 to +6)
- **Description:** Modifies combat stage modifiers (attack, defense, spAtk, spDef, speed, accuracy, evasion). Supports delta and absolute modes. Clamps to -6/+6. Syncs to DB.
- **Inputs:** `id` (URL param), `{ combatantId, changes: Record<stat, number>, absolute? }`
- **Outputs:** `{ success, data: Encounter, stageChanges }`
- **Orphan:** false

## combat-C016: Update Status Conditions

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/status.post.ts:defineEventHandler`
- **Game Concept:** PTU status conditions (persistent, volatile, other)
- **Description:** Adds or removes status conditions on a combatant. Validates against known PTU conditions. Prevents duplicates. Syncs to DB.
- **Inputs:** `id` (URL param), `{ combatantId, add?: StatusCondition[], remove?: StatusCondition[] }`
- **Outputs:** `{ success, data: Encounter, statusChange }`
- **Orphan:** false

## combat-C017: Serve Encounter

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/serve.post.ts:defineEventHandler`
- **Game Concept:** Encounter broadcast to Group View
- **Description:** Atomically unserves all encounters then serves this one (transaction). Sets isServed=true for Group View display.
- **Inputs:** `id` (URL param)
- **Outputs:** `{ success, data: Encounter }` with isServed=true
- **Orphan:** false

## combat-C018: Unserve Encounter

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/unserve.post.ts:defineEventHandler`
- **Game Concept:** Remove encounter from Group View
- **Description:** Sets isServed=false on the encounter.
- **Inputs:** `id` (URL param)
- **Outputs:** `{ success, data: Encounter }` with isServed=false
- **Orphan:** false

## combat-C019: Update Combatant Position

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/position.post.ts:defineEventHandler`
- **Game Concept:** VTT token movement
- **Description:** Updates a combatant's grid position. Validates position is within grid bounds.
- **Inputs:** `id` (URL param), `{ combatantId, position: { x, y } }`
- **Outputs:** `{ success, data: { combatantId, position } }`
- **Orphan:** false

## combat-C020: Update Grid Config

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/grid-config.put.ts:defineEventHandler`
- **Game Concept:** VTT grid settings
- **Description:** Updates grid configuration (enabled, width 5-100, height 5-100, cellSize 20-100, background). Validates dimension bounds.
- **Inputs:** `id` (URL param), `Partial<GridConfig>`
- **Outputs:** `{ success, data: GridConfig }`
- **Orphan:** false

## combat-C021: Upload Grid Background

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/background.post.ts:defineEventHandler`
- **Game Concept:** VTT map upload
- **Description:** Accepts multipart file upload (JPEG/PNG/GIF/WebP, max 5MB). Converts to data URL and stores as gridBackground.
- **Inputs:** `id` (URL param), multipart form with `file` field
- **Outputs:** `{ success, data: { background: dataURL } }`
- **Orphan:** false

## combat-C022: Delete Grid Background

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/background.delete.ts:defineEventHandler`
- **Game Concept:** VTT map removal
- **Description:** Removes grid background image by setting gridBackground to null.
- **Inputs:** `id` (URL param)
- **Outputs:** `{ success, data: { background: null } }`
- **Orphan:** false

## combat-C023: Get Fog of War State

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/fog.get.ts:defineEventHandler`
- **Game Concept:** Fog of war persistence
- **Description:** Returns fog of war enabled status, cell states array, and default state.
- **Inputs:** `id` (URL param)
- **Outputs:** `{ success, data: { enabled, cells, defaultState } }`
- **Orphan:** false

## combat-C024: Update Fog of War State

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/fog.put.ts:defineEventHandler`
- **Game Concept:** Fog of war persistence
- **Description:** Updates fog of war enabled, cells (key-state pairs), and defaultState (hidden/revealed/explored). Merges with existing state.
- **Inputs:** `id` (URL param), `{ enabled?, cells?, defaultState? }`
- **Outputs:** `{ success, data: { enabled, cells, defaultState } }`
- **Orphan:** false

## combat-C025: Get Terrain State

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/terrain.get.ts:defineEventHandler`
- **Game Concept:** Terrain persistence
- **Description:** Returns terrain enabled status and cells array.
- **Inputs:** `id` (URL param)
- **Outputs:** `{ success, data: { enabled, cells } }`
- **Orphan:** false

## combat-C026: Update Terrain State

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/terrain.put.ts:defineEventHandler`
- **Game Concept:** Terrain persistence
- **Description:** Updates terrain enabled status and cells (position, type, elevation, note). Merges with existing state.
- **Inputs:** `id` (URL param), `{ enabled?, cells?: TerrainCellData[] }`
- **Outputs:** `{ success, data: { enabled, cells } }`
- **Orphan:** false

## combat-C027: Take a Breather

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/breather.post.ts:defineEventHandler`
- **Game Concept:** PTU Take a Breather maneuver (p.245)
- **Description:** Full action: resets all combat stages to 0, removes temporary HP, cures volatile status conditions + Slowed/Stuck, applies Tripped + Vulnerable as tempConditions. Marks standard action used. Logs to moveLog.
- **Inputs:** `id` (URL param), `{ combatantId }`
- **Outputs:** `{ success, data: Encounter, breatherResult }`
- **Orphan:** false

## combat-C028: Wild Pokemon Spawn

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/wild-spawn.post.ts:defineEventHandler`
- **Game Concept:** Spawning wild Pokemon into encounters
- **Description:** Generates and creates Pokemon DB records via pokemon-generator service, builds combatant wrappers, auto-places on grid by side. Adds to encounter combatants.
- **Inputs:** `id` (URL param), `{ pokemon: [{ speciesName, level }], side? }`
- **Outputs:** `{ success, data: { encounter, addedPokemon } }`
- **Orphan:** false

## combat-C029: Calculate Damage (Read-Only)

- **Type:** api-endpoint
- **Location:** `app/server/api/encounters/[id]/calculate-damage.post.ts:defineEventHandler`
- **Game Concept:** PTU 9-step damage formula preview
- **Description:** Read-only endpoint that calculates damage for a move without modifying state. Returns full breakdown (STAB, set damage, critical, attack/defense stats with stages, type effectiveness) plus accuracy calculation (dynamic evasions, threshold).
- **Inputs:** `id` (URL param), `{ attackerId, targetId, moveName, isCritical?, damageReduction? }`
- **Outputs:** `{ success, data: { finalDamage, breakdown, accuracy, meta } }`
- **Orphan:** false

## combat-C030: Load Encounter (Service)

- **Type:** service-function
- **Location:** `app/server/services/encounter.service.ts:loadEncounter`
- **Game Concept:** Encounter data access
- **Description:** Loads encounter by ID from Prisma, parses combatants JSON. Throws 404 if not found. Used by damage, heal, move, stages, status, breather, wild-spawn, calculate-damage endpoints.
- **Inputs:** `id: string`
- **Outputs:** `{ record: EncounterRecord, combatants: Combatant[] }`
- **Orphan:** false

## combat-C031: Find Combatant (Service)

- **Type:** service-function
- **Location:** `app/server/services/encounter.service.ts:findCombatant`
- **Game Concept:** Combatant lookup
- **Description:** Finds a combatant by ID in the combatants array. Throws 404 if not found.
- **Inputs:** `combatants: Combatant[], combatantId: string`
- **Outputs:** `Combatant`
- **Orphan:** false

## combat-C032: Sort By Initiative With Roll-Off

- **Type:** service-function
- **Location:** `app/server/services/encounter.service.ts:sortByInitiativeWithRollOff`
- **Game Concept:** PTU initiative ordering
- **Description:** Sorts combatants by initiative (speed + bonus) with d20 roll-off for ties. Mutates initiativeRollOff on tied combatants. Re-rolls any remaining ties.
- **Inputs:** `combatants: Combatant[], descending?: boolean`
- **Outputs:** `Combatant[]` sorted by initiative
- **Orphan:** false

## combat-C033: Build Encounter Response

- **Type:** service-function
- **Location:** `app/server/services/encounter.service.ts:buildEncounterResponse`
- **Game Concept:** Standardized API response
- **Description:** Builds a standardized ParsedEncounter response object from a DB record and combatants array. Parses JSON fields, constructs gridConfig.
- **Inputs:** `record: EncounterRecord, combatants: Combatant[], options?`
- **Outputs:** `ParsedEncounter`
- **Orphan:** false

## combat-C034: Save Encounter Combatants

- **Type:** service-function
- **Location:** `app/server/services/encounter.service.ts:saveEncounterCombatants`
- **Game Concept:** Encounter persistence
- **Description:** Persists combatants JSON to the encounter record. Optionally saves defeatedEnemies and moveLog.
- **Inputs:** `id: string, combatants: Combatant[], additionalData?`
- **Outputs:** `void`
- **Orphan:** false

## combat-C035: Get Entity Name (Service)

- **Type:** service-function
- **Location:** `app/server/services/encounter.service.ts:getEntityName`
- **Game Concept:** Name resolution for logging
- **Description:** Returns display name: Pokemon nickname or species, or Human name.
- **Inputs:** `combatant: Combatant`
- **Outputs:** `string`
- **Orphan:** false

## combat-C036: Calculate Damage (Combatant Service)

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:calculateDamage`
- **Game Concept:** PTU damage mechanics (temp HP, massive damage, HP markers)
- **Description:** Calculates damage with PTU mechanics: temp HP absorbs first, massive damage rule (50%+ maxHP = injury), HP marker crossing injuries (50%, 0%, -50%, -100%). Returns unclamped HP for marker detection, clamped for storage.
- **Inputs:** `damage, currentHp, maxHp, temporaryHp, currentInjuries`
- **Outputs:** `DamageResult { finalDamage, tempHpAbsorbed, hpDamage, newHp, newTempHp, injuryGained, massiveDamageInjury, markerInjuries, markersCrossed, totalNewInjuries, newInjuries, fainted }`
- **Orphan:** false

## combat-C037: Count Markers Crossed

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:countMarkersCrossed`
- **Game Concept:** PTU HP marker injury system
- **Description:** Counts HP markers crossed between previousHp and newHp. Markers at 50%, 0%, -50%, -100% (and every -50% below) of realMaxHp. Uses real (non-injury-reduced) maxHp per PTU rules.
- **Inputs:** `previousHp, newHp, realMaxHp`
- **Outputs:** `{ count: number, markers: number[] }`
- **Orphan:** false

## combat-C038: Apply Damage To Entity

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:applyDamageToEntity`
- **Game Concept:** Entity mutation after damage
- **Description:** Mutates combatant entity with damage results: currentHp, temporaryHp, injuries. On faint, clears all status conditions and sets Fainted.
- **Inputs:** `combatant: Combatant, damageResult: DamageResult`
- **Outputs:** `void` (mutates combatant.entity)
- **Orphan:** false

## combat-C039: Apply Healing To Entity

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:applyHealingToEntity`
- **Game Concept:** PTU healing (HP, temp HP, injuries)
- **Description:** Heals HP (capped at max), grants temp HP (stacks), heals injuries (min 0). Removes Fainted if healed from 0 HP.
- **Inputs:** `combatant: Combatant, options: HealOptions`
- **Outputs:** `HealResult { hpHealed, tempHpGained, injuriesHealed, newHp, newTempHp, newInjuries, faintedRemoved }`
- **Orphan:** false

## combat-C040: Update Status Conditions (Service)

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:updateStatusConditions`
- **Game Concept:** PTU status condition management
- **Description:** Adds and removes status conditions on entity. Removes first, then adds. Prevents duplicates. Returns actually added/removed lists.
- **Inputs:** `combatant: Combatant, addStatuses: StatusCondition[], removeStatuses: StatusCondition[]`
- **Outputs:** `StatusChangeResult { added, removed, current }`
- **Orphan:** false

## combat-C041: Validate Status Conditions

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:validateStatusConditions`
- **Game Concept:** Input validation
- **Description:** Validates that all status conditions in the array are valid PTU conditions. Throws 400 error if invalid.
- **Inputs:** `statuses: StatusCondition[]`
- **Outputs:** `void` or throws
- **Orphan:** false

## combat-C042: Update Stage Modifiers (Service)

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:updateStageModifiers`
- **Game Concept:** PTU combat stages (-6 to +6)
- **Description:** Modifies combat stage modifiers. Supports delta (add to current) or absolute (set directly) modes. Clamps all values to -6/+6 range.
- **Inputs:** `combatant: Combatant, changes: Record<string, number>, isAbsolute?: boolean`
- **Outputs:** `StageChangeResult { changes, currentStages }`
- **Orphan:** false

## combat-C043: Validate Stage Stats

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:validateStageStats`
- **Game Concept:** Input validation
- **Description:** Validates stat names against VALID_STATS (attack, defense, specialAttack, specialDefense, speed, accuracy, evasion). Throws 400 if invalid.
- **Inputs:** `stats: string[]`
- **Outputs:** `void` or throws
- **Orphan:** false

## combat-C044: Create Default Stage Modifiers

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:createDefaultStageModifiers`
- **Game Concept:** Stage modifier initialization
- **Description:** Creates a StageModifiers object with all stats at 0.
- **Inputs:** None
- **Outputs:** `StageModifiers` (all zeros)
- **Orphan:** false

## combat-C045: Build Pokemon Entity From Record

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:buildPokemonEntityFromRecord`
- **Game Concept:** Prisma record to typed entity transform
- **Description:** Transforms a Prisma Pokemon record into a typed Pokemon entity. Parses all JSON fields (nature, moves, abilities, capabilities, stageModifiers, statusConditions, skills, eggGroups).
- **Inputs:** `record: PrismaPokemonRecord`
- **Outputs:** `Pokemon` (typed entity)
- **Orphan:** false

## combat-C046: Build Human Entity From Record

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:buildHumanEntityFromRecord`
- **Game Concept:** Prisma record to typed entity transform
- **Description:** Transforms a Prisma HumanCharacter record into a typed HumanCharacter entity. Parses JSON fields (trainerClasses, skills, features, edges, statusConditions, stageModifiers, inventory).
- **Inputs:** `record: PrismaHumanRecord`
- **Outputs:** `HumanCharacter` (typed entity)
- **Orphan:** false

## combat-C047: Initial Evasion

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:initialEvasion`
- **Game Concept:** PTU evasion from stats
- **Description:** Computes initial evasion for a stat: floor(stat / 5), capped at +6 per PTU rules.
- **Inputs:** `stat: number`
- **Outputs:** `number` (0-6)
- **Orphan:** false

## combat-C048: Build Combatant From Entity

- **Type:** service-function
- **Location:** `app/server/services/combatant.service.ts:buildCombatantFromEntity`
- **Game Concept:** Combatant wrapper construction
- **Description:** Builds a full Combatant wrapper from a typed entity. Calculates initiative (speed + bonus), evasions (physical, special, speed), sets default turn state.
- **Inputs:** `BuildCombatantOptions { entityType, entityId, entity, side, initiativeBonus?, position?, tokenSize? }`
- **Outputs:** `Combatant` with initiative, evasions, position, turnState
- **Orphan:** false

## combat-C049: Sync Entity To Database

- **Type:** service-function
- **Location:** `app/server/services/entity-update.service.ts:syncEntityToDatabase`
- **Game Concept:** Entity persistence
- **Description:** Syncs combatant changes to Pokemon or HumanCharacter DB table. Skips if no entityId (template-loaded combatants). Handles currentHp, temporaryHp, injuries, statusConditions, stageModifiers, lastInjuryTime.
- **Inputs:** `combatant: Combatant, updates: EntityUpdateData`
- **Outputs:** `void` (persists to DB)
- **Orphan:** false

## combat-C050: Sync Damage To Database

- **Type:** service-function
- **Location:** `app/server/services/entity-update.service.ts:syncDamageToDatabase`
- **Game Concept:** Damage persistence convenience
- **Description:** Convenience wrapper for syncEntityToDatabase that passes HP, tempHP, injuries, status, and lastInjuryTime if injury gained.
- **Inputs:** `combatant, newHp, newTempHp, newInjuries, statusConditions, injuryGained`
- **Outputs:** `void`
- **Orphan:** false

## combat-C051: Sync Healing To Database

- **Type:** service-function
- **Location:** `app/server/services/entity-update.service.ts:syncHealingToDatabase`
- **Game Concept:** Healing persistence convenience
- **Description:** Convenience wrapper for syncEntityToDatabase that passes HP, tempHP, injuries, status after healing.
- **Inputs:** `combatant, currentHp, temporaryHp, injuries, statusConditions`
- **Outputs:** `void`
- **Orphan:** false

## combat-C052: Sync Status To Database

- **Type:** service-function
- **Location:** `app/server/services/entity-update.service.ts:syncStatusToDatabase`
- **Game Concept:** Status persistence convenience
- **Description:** Convenience wrapper to persist status condition changes.
- **Inputs:** `combatant, statusConditions`
- **Outputs:** `void`
- **Orphan:** false

## combat-C053: Sync Stages To Database

- **Type:** service-function
- **Location:** `app/server/services/entity-update.service.ts:syncStagesToDatabase`
- **Game Concept:** Stage modifier persistence convenience
- **Description:** Convenience wrapper to persist stage modifier changes.
- **Inputs:** `combatant, stageModifiers`
- **Outputs:** `void`
- **Orphan:** false

## combat-C054: Size To Token Size

- **Type:** service-function
- **Location:** `app/server/services/grid-placement.service.ts:sizeToTokenSize`
- **Game Concept:** PTU size class to grid token mapping
- **Description:** Maps PTU size capability (Small/Medium=1, Large=2, Huge=3, Gigantic=4) to grid token size in cells.
- **Inputs:** `size: string | undefined`
- **Outputs:** `number` (1-4)
- **Orphan:** false

## combat-C055: Build Occupied Cells Set

- **Type:** service-function
- **Location:** `app/server/services/grid-placement.service.ts:buildOccupiedCellsSet`
- **Game Concept:** Grid collision detection
- **Description:** Builds a Set of all occupied grid cell keys from existing combatants. Multi-cell tokens mark all cells they cover.
- **Inputs:** `combatants: Combatant[]`
- **Outputs:** `Set<string>` ("x,y" keys)
- **Orphan:** false

## combat-C056: Find Placement Position

- **Type:** service-function
- **Location:** `app/server/services/grid-placement.service.ts:findPlacementPosition`
- **Game Concept:** Auto-placement of tokens on grid
- **Description:** Finds next available grid position for a token. Tries side-designated columns first (players=1-4, allies=5-8, enemies=right side), then falls back anywhere. Mutates occupiedCells for successive calls.
- **Inputs:** `occupiedCells, side, tokenSize, gridWidth, gridHeight`
- **Outputs:** `Position { x, y }`
- **Orphan:** false

## combat-C057: Apply Stage Modifier (Composable)

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:applyStageModifier`
- **Game Concept:** PTU stage multiplier application
- **Description:** Client-side stage modifier application. Multiplies baseStat by stage multiplier table (+20% per positive, -10% per negative). Clamps stage to -6/+6.
- **Inputs:** `baseStat: number, stage: number`
- **Outputs:** `number` (modified stat, floored)
- **Orphan:** false

## combat-C058: Calculate Pokemon Max HP

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:calculatePokemonMaxHP`
- **Game Concept:** PTU Pokemon HP formula
- **Description:** Level + (HP stat x 3) + 10.
- **Inputs:** `level: number, hpStat: number`
- **Outputs:** `number`
- **Orphan:** false

## combat-C059: Calculate Trainer Max HP

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:calculateTrainerMaxHP`
- **Game Concept:** PTU Trainer HP formula
- **Description:** (Level x 2) + (HP stat x 3) + 10.
- **Inputs:** `level: number, hpStat: number`
- **Outputs:** `number`
- **Orphan:** false

## combat-C060: Calculate Evasion (Composable)

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:calculateEvasion`
- **Game Concept:** PTU evasion calculation
- **Description:** Client-side: min(6, floor(stageModifiedStat / 5)) + evasionBonus, floored at 0. Stage-modified stat used per PTU rules.
- **Inputs:** `stat, combatStages?, evasionBonus?`
- **Outputs:** `number` (0-6+)
- **Orphan:** false

## combat-C061: Calculate Physical Evasion

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:calculatePhysicalEvasion`
- **Game Concept:** PTU physical evasion
- **Description:** Wrapper calling calculateEvasion with defense stat.
- **Inputs:** `defense, defenseStages?, evasionBonus?`
- **Outputs:** `number`
- **Orphan:** false

## combat-C062: Calculate Special Evasion

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:calculateSpecialEvasion`
- **Game Concept:** PTU special evasion
- **Description:** Wrapper calling calculateEvasion with spDef stat.
- **Inputs:** `spDef, spDefStages?, evasionBonus?`
- **Outputs:** `number`
- **Orphan:** false

## combat-C063: Calculate Speed Evasion

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:calculateSpeedEvasion`
- **Game Concept:** PTU speed evasion
- **Description:** Wrapper calling calculateEvasion with speed stat.
- **Inputs:** `speed, speedStages?, evasionBonus?`
- **Outputs:** `number`
- **Orphan:** false

## combat-C064: Calculate Initiative (Composable)

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:calculateInitiative`
- **Game Concept:** PTU initiative (modified speed + bonus)
- **Description:** Calculates initiative from entity: stage-modified speed + bonus. Works for both Pokemon and Human entities.
- **Inputs:** `entity: Pokemon | HumanCharacter, bonus?: number`
- **Outputs:** `number`
- **Orphan:** false

## combat-C065: Check For Injury (Composable)

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:checkForInjury`
- **Game Concept:** PTU injury detection
- **Description:** Client-side injury check: massive damage (50%+ maxHP in one hit) or HP marker crossing (50%, 0%, -50%, -100%).
- **Inputs:** `previousHp, currentHp, maxHp, damageTaken`
- **Outputs:** `{ injured: boolean, reason: string }`
- **Orphan:** false

## combat-C066: Get Health Percentage

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:getHealthPercentage`
- **Game Concept:** HP display calculation
- **Description:** Calculates health percentage rounded to nearest integer.
- **Inputs:** `current: number, max: number`
- **Outputs:** `number` (0-100)
- **Orphan:** false

## combat-C067: Get Health Status

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:getHealthStatus`
- **Game Concept:** HP status classification
- **Description:** Returns health status class: healthy (>50%), warning (25-50%), critical (1-25%), fainted (0%).
- **Inputs:** `percentage: number`
- **Outputs:** `'healthy' | 'warning' | 'critical' | 'fainted'`
- **Orphan:** false

## combat-C068: Calculate XP Gain

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:calculateXPGain`
- **Game Concept:** PTU XP formula
- **Description:** Base XP = defeatedLevel x 10, divided by participant count.
- **Inputs:** `defeatedLevel, participantCount`
- **Outputs:** `number`
- **Orphan:** false

## combat-C069: Can Act Check

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:canAct`
- **Game Concept:** Action eligibility
- **Description:** Returns false if entity currentHp <= 0, or has Frozen or Asleep status.
- **Inputs:** `entity: Pokemon | HumanCharacter`
- **Outputs:** `boolean`
- **Orphan:** false

## combat-C070: Get Accuracy Threshold (Composable)

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:getAccuracyThreshold`
- **Game Concept:** PTU accuracy check threshold
- **Description:** Calculates d20 threshold: max(1, baseAC - accuracyStages + min(9, evasion)).
- **Inputs:** `baseAC, attackerAccuracy, defenderEvasion`
- **Outputs:** `number` (d20 roll needed to hit)
- **Orphan:** false

## combat-C071: Calculate Max Action Points

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:calculateMaxActionPoints`
- **Game Concept:** PTU Action Points
- **Description:** Max AP = 5 + floor(trainerLevel / 5).
- **Inputs:** `trainerLevel: number`
- **Outputs:** `number`
- **Orphan:** true

## combat-C072: Calculate Effective Movement

- **Type:** composable-function
- **Location:** `app/composables/useCombat.ts:calculateEffectiveMovement`
- **Game Concept:** PTU movement from speed combat stages
- **Description:** Effective movement = max(2, baseMovement + floor(speedCombatStages / 2)). Minimum movement is 2.
- **Inputs:** `baseMovement, speedCombatStages`
- **Outputs:** `number`
- **Orphan:** true

## combat-C073: Get Combatant Name

- **Type:** composable-function
- **Location:** `app/composables/useCombatantDisplay.ts:getCombatantName`
- **Game Concept:** Display name resolution
- **Description:** Returns display name for a combatant: Pokemon nickname/species or Human name. Returns 'Unknown' if no entity.
- **Inputs:** `combatant?: Combatant`
- **Outputs:** `string`
- **Orphan:** false

## combat-C074: Get Combatant Name By ID

- **Type:** composable-function
- **Location:** `app/composables/useCombatantDisplay.ts:getCombatantNameById`
- **Game Concept:** Display name resolution by ID
- **Description:** Finds combatant in array by ID and returns display name. Returns '???' if not found.
- **Inputs:** `combatants: Combatant[], id: string`
- **Outputs:** `string`
- **Orphan:** false

## combat-C075: Encounter History Push Snapshot

- **Type:** composable-function
- **Location:** `app/composables/useEncounterHistory.ts:pushSnapshot`
- **Game Concept:** Undo/redo state capture
- **Description:** Deep-copies encounter state and pushes to history. Truncates redo history beyond current. Enforces max 50 snapshots.
- **Inputs:** `actionName: string, state: Encounter`
- **Outputs:** `void` (modifies history array)
- **Orphan:** false

## combat-C076: Encounter History Undo

- **Type:** composable-function
- **Location:** `app/composables/useEncounterHistory.ts:undo`
- **Game Concept:** Undo combat action
- **Description:** Decrements currentIndex and returns deep copy of previous state. Returns null if can't undo.
- **Inputs:** None
- **Outputs:** `Encounter | null`
- **Orphan:** false

## combat-C077: Encounter History Redo

- **Type:** composable-function
- **Location:** `app/composables/useEncounterHistory.ts:redo`
- **Game Concept:** Redo combat action
- **Description:** Increments currentIndex and returns deep copy of next state. Returns null if can't redo.
- **Inputs:** None
- **Outputs:** `Encounter | null`
- **Orphan:** false

## combat-C078: Calculate Move Distance (Grid)

- **Type:** composable-function
- **Location:** `app/composables/useGridMovement.ts:calculateMoveDistance`
- **Game Concept:** PTU diagonal movement distance
- **Description:** Calculates distance using PTU alternating diagonal rules: diagonals cost 1,2,1,2... = diagonals + floor(diagonals/2) + straights.
- **Inputs:** `from: GridPosition, to: GridPosition`
- **Outputs:** `number` (cells)
- **Orphan:** false

## combat-C079: Is Valid Move (Grid)

- **Type:** composable-function
- **Location:** `app/composables/useGridMovement.ts:isValidMove`
- **Game Concept:** Movement validation
- **Description:** Checks if a grid move is valid considering movement speed, blocked cells, and grid bounds.
- **Inputs:** `fromPos, toPos, combatantId, gridWidth, gridHeight`
- **Outputs:** `{ valid, distance, blocked }`
- **Orphan:** false

## combat-C080: Parse Range

- **Type:** composable-function
- **Location:** `app/composables/useRangeParser.ts:parseRange`
- **Game Concept:** PTU move range parsing
- **Description:** Parses PTU range strings (Melee, Burst N, Cone N, Close Blast N, Line N, Ranged Blast N, Self, Field, Cardinally Adjacent, or numeric range) into structured RangeParseResult.
- **Inputs:** `rangeString: string`
- **Outputs:** `RangeParseResult { type, range, aoeSize?, targetCount?, width? }`
- **Orphan:** false

## combat-C081: Is In Range Check

- **Type:** composable-function
- **Location:** `app/composables/useRangeParser.ts:isInRange`
- **Game Concept:** Range validation for targeting
- **Description:** Checks if a target position is within range using Chebyshev distance. Handles self, field, melee, ranged, cardinally-adjacent.
- **Inputs:** `attacker: GridPosition, target: GridPosition, parsedRange: RangeParseResult`
- **Outputs:** `boolean`
- **Orphan:** false

## combat-C082: Get Affected Cells (AoE)

- **Type:** composable-function
- **Location:** `app/composables/useRangeParser.ts:getAffectedCells`
- **Game Concept:** Area of effect calculation
- **Description:** Calculates all cells affected by an AoE move (burst, cone, close-blast, ranged-blast, line). Uses Chebyshev distance for burst shapes.
- **Inputs:** `origin: GridPosition, direction, parsedRange`
- **Outputs:** `GridPosition[]`
- **Orphan:** false

## combat-C083: Get Movement Range Cells

- **Type:** composable-function
- **Location:** `app/composables/useRangeParser.ts:getMovementRangeCells`
- **Game Concept:** Movement range visualization with terrain
- **Description:** Flood-fill algorithm finding all reachable cells within movement budget. Accounts for terrain costs and PTU diagonal rules (alternating 1/2 cost). Uses Dijkstra-like exploration.
- **Inputs:** `origin, speed, blockedCells?, getTerrainCost?`
- **Outputs:** `GridPosition[]` (all reachable cells)
- **Orphan:** false

## combat-C084: Calculate Path Cost (A*)

- **Type:** composable-function
- **Location:** `app/composables/useRangeParser.ts:calculatePathCost`
- **Game Concept:** A* pathfinding with PTU diagonals
- **Description:** A* pathfinding with diagonal parity tracking. Handles terrain costs and blocked cells. Returns optimal path cost or null if unreachable.
- **Inputs:** `from, to, blockedCells?, getTerrainCost?`
- **Outputs:** `{ cost, path } | null`
- **Orphan:** false

## combat-C085: Encounter Store - loadEncounter

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:loadEncounter`
- **Game Concept:** Encounter state loading
- **Description:** Fetches encounter by ID from API and sets store state.
- **Inputs:** `id: string`
- **Outputs:** Sets `this.encounter`
- **Orphan:** false

## combat-C086: Encounter Store - createEncounter

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:createEncounter`
- **Game Concept:** Encounter creation
- **Description:** POSTs to create encounter API, sets store state.
- **Inputs:** `name, battleType, weather?`
- **Outputs:** `Encounter`
- **Orphan:** false

## combat-C087: Encounter Store - createFromScene

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:createFromScene`
- **Game Concept:** Scene-to-encounter conversion
- **Description:** Creates encounter from scene via API.
- **Inputs:** `sceneId, battleType`
- **Outputs:** `Encounter`
- **Orphan:** false

## combat-C088: Encounter Store - loadFromTemplate

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:loadFromTemplate`
- **Game Concept:** Template-based encounter creation
- **Description:** Creates encounter from template via API.
- **Inputs:** `templateId, encounterName?`
- **Outputs:** `Encounter`
- **Orphan:** false

## combat-C089: Encounter Store - addCombatant

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:addCombatant`
- **Game Concept:** Adding combatants
- **Description:** POSTs to add combatant API, updates store state.
- **Inputs:** `entityId, entityType, side, initiativeBonus?`
- **Outputs:** Updates `this.encounter`
- **Orphan:** false

## combat-C090: Encounter Store - removeCombatant

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:removeCombatant`
- **Game Concept:** Removing combatants
- **Description:** DELETEs combatant from encounter.
- **Inputs:** `combatantId`
- **Outputs:** Updates `this.encounter`
- **Orphan:** false

## combat-C091: Encounter Store - startEncounter

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:startEncounter`
- **Game Concept:** Starting combat
- **Description:** POSTs to start encounter API.
- **Inputs:** None (uses current encounter)
- **Outputs:** Updates `this.encounter` with initiative order
- **Orphan:** false

## combat-C092: Encounter Store - nextTurn

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:nextTurn`
- **Game Concept:** Turn advancement
- **Description:** POSTs to next-turn API.
- **Inputs:** None
- **Outputs:** Updates `this.encounter` with new turn/round
- **Orphan:** false

## combat-C093: Encounter Store - executeMove

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:executeMove`
- **Game Concept:** Move execution
- **Description:** POSTs to move API with actor, targets, damage info.
- **Inputs:** `actorId, moveId, targetIds, damage?, targetDamages?, notes?`
- **Outputs:** Updates `this.encounter`
- **Orphan:** false

## combat-C094: Encounter Store - applyDamage

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:applyDamage`
- **Game Concept:** Damage application
- **Description:** POSTs to damage API.
- **Inputs:** `combatantId, damage`
- **Outputs:** Updates `this.encounter`
- **Orphan:** false

## combat-C095: Encounter Store - healCombatant

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:healCombatant`
- **Game Concept:** Healing application
- **Description:** POSTs to heal API with HP, temp HP, and/or injury healing.
- **Inputs:** `combatantId, amount?, tempHp?, healInjuries?`
- **Outputs:** Updates `this.encounter`
- **Orphan:** false

## combat-C096: Encounter Store - serveEncounter

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:serveEncounter`
- **Game Concept:** Serve to Group View
- **Description:** POSTs to serve API.
- **Inputs:** None
- **Outputs:** Updates `this.encounter` with isServed=true
- **Orphan:** false

## combat-C097: Encounter Store - unserveEncounter

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:unserveEncounter`
- **Game Concept:** Unserve from Group View
- **Description:** POSTs to unserve API.
- **Inputs:** None
- **Outputs:** Updates `this.encounter` with isServed=false
- **Orphan:** false

## combat-C098: Encounter Store - loadServedEncounter

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:loadServedEncounter`
- **Game Concept:** Group View encounter loading
- **Description:** GETs served encounter for Group View display.
- **Inputs:** None
- **Outputs:** `Encounter | null`
- **Orphan:** false

## combat-C099: Encounter Store - updateFromWebSocket

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:updateFromWebSocket`
- **Game Concept:** Real-time sync from WS
- **Description:** Surgical update of encounter state from WebSocket data. Patches top-level fields and combatants in-place to minimize Vue reactivity cascade. Handles add/remove of combatants.
- **Inputs:** `data: Encounter`
- **Outputs:** Mutates `this.encounter`
- **Orphan:** false

## combat-C100: Encounter Store - captureSnapshot

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:captureSnapshot`
- **Game Concept:** Undo/redo state capture
- **Description:** Captures current encounter state to history before an action.
- **Inputs:** `actionName: string`
- **Outputs:** Pushes to history
- **Orphan:** false

## combat-C101: Encounter Store - undoAction

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:undoAction`
- **Game Concept:** Undo combat action
- **Description:** Reverts to previous state via undo, PUTs to persist, sets encounter.
- **Inputs:** None
- **Outputs:** `boolean` (success)
- **Orphan:** false

## combat-C102: Encounter Store - redoAction

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:redoAction`
- **Game Concept:** Redo combat action
- **Description:** Advances to next state via redo, PUTs to persist, sets encounter.
- **Inputs:** None
- **Outputs:** `boolean` (success)
- **Orphan:** false

## combat-C103: Encounter Store - addWildPokemon

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:addWildPokemon`
- **Game Concept:** Wild spawn into encounter
- **Description:** POSTs to wild-spawn API with array of Pokemon data.
- **Inputs:** `pokemon: [{ speciesName, level }], side?`
- **Outputs:** `[{ pokemonId, combatantId, species, level }]`
- **Orphan:** false

## combat-C104: Encounter Store - setReadyAction

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:setReadyAction`
- **Game Concept:** PTU ready/held action
- **Description:** POSTs to set a ready action for a combatant. Note: backend endpoint `/api/encounters/:id/ready` is referenced but not found in API directory.
- **Inputs:** `combatantId, readyAction`
- **Outputs:** Updates `this.encounter`
- **Orphan:** true

## combat-C105: Encounter Store - useAction

- **Type:** store-action
- **Location:** `app/stores/encounter.ts:useAction`
- **Game Concept:** PTU action usage tracking
- **Description:** POSTs to action API to mark standard/shift/swift action as used. Note: backend endpoint `/api/encounters/:id/action` is referenced but not found in API directory.
- **Inputs:** `combatantId, actionType`
- **Outputs:** Updates `this.encounter`
- **Orphan:** true

## combat-C106: EncounterCombat Store - addStatusCondition

- **Type:** store-action
- **Location:** `app/stores/encounterCombat.ts:addStatusCondition`
- **Game Concept:** Add status condition
- **Description:** Calls status API to add a single condition.
- **Inputs:** `encounterId, combatantId, condition`
- **Outputs:** `Encounter`
- **Orphan:** false

## combat-C107: EncounterCombat Store - removeStatusCondition

- **Type:** store-action
- **Location:** `app/stores/encounterCombat.ts:removeStatusCondition`
- **Game Concept:** Remove status condition
- **Description:** Calls status API to remove a single condition.
- **Inputs:** `encounterId, combatantId, condition`
- **Outputs:** `Encounter`
- **Orphan:** false

## combat-C108: EncounterCombat Store - modifyStage

- **Type:** store-action
- **Location:** `app/stores/encounterCombat.ts:modifyStage`
- **Game Concept:** Modify single combat stage
- **Description:** Calls stages API with delta change for a single stat.
- **Inputs:** `encounterId, combatantId, stat, amount`
- **Outputs:** `Encounter`
- **Orphan:** false

## combat-C109: EncounterCombat Store - setCombatStages

- **Type:** store-action
- **Location:** `app/stores/encounterCombat.ts:setCombatStages`
- **Game Concept:** Set multiple combat stages
- **Description:** Calls stages API with multiple stats, absolute or relative.
- **Inputs:** `encounterId, combatantId, stages, absolute?`
- **Outputs:** `Encounter`
- **Orphan:** false

## combat-C110: EncounterCombat Store - takeABreather

- **Type:** store-action
- **Location:** `app/stores/encounterCombat.ts:takeABreather`
- **Game Concept:** PTU Take a Breather
- **Description:** Calls breather API for a combatant.
- **Inputs:** `encounterId, combatantId`
- **Outputs:** `Encounter`
- **Orphan:** false

## combat-C111: EncounterCombat Store - addInjury

- **Type:** store-action
- **Location:** `app/stores/encounterCombat.ts:addInjury`
- **Game Concept:** Manual injury management
- **Description:** Calls injury POST API to add an injury with source description. Note: backend endpoint `/api/encounters/:id/injury` is referenced but not found in API directory.
- **Inputs:** `encounterId, combatantId, source`
- **Outputs:** `Encounter`
- **Orphan:** true

## combat-C112: EncounterCombat Store - removeInjury

- **Type:** store-action
- **Location:** `app/stores/encounterCombat.ts:removeInjury`
- **Game Concept:** Manual injury removal
- **Description:** Calls injury DELETE API to remove an injury. Note: backend endpoint `/api/encounters/:id/injury` is referenced but not found in API directory.
- **Inputs:** `encounterId, combatantId`
- **Outputs:** `Encounter`
- **Orphan:** true

## combat-C113: EncounterCombat Store - setPhase

- **Type:** store-action
- **Location:** `app/stores/encounterCombat.ts:setPhase`
- **Game Concept:** League battle phase switching
- **Description:** Calls phase API to switch between trainer and pokemon phases. Note: backend endpoint `/api/encounters/:id/phase` is referenced but not found in API directory.
- **Inputs:** `encounterId, phase: 'trainer' | 'pokemon'`
- **Outputs:** `Encounter`
- **Orphan:** true

## combat-C114: EncounterCombat Store - nextScene

- **Type:** store-action
- **Location:** `app/stores/encounterCombat.ts:nextScene`
- **Game Concept:** Scene advancement (move frequency tracking)
- **Description:** Calls next-scene API to advance scene number (resets scene-frequency moves). Note: backend endpoint `/api/encounters/:id/next-scene` is referenced but not found in API directory.
- **Inputs:** `encounterId`
- **Outputs:** `Encounter`
- **Orphan:** true

## combat-C115: EncounterGrid Store - updateCombatantPosition

- **Type:** store-action
- **Location:** `app/stores/encounterGrid.ts:updateCombatantPosition`
- **Game Concept:** Token position update
- **Description:** Calls position API to move a combatant on the grid.
- **Inputs:** `encounterId, combatantId, position`
- **Outputs:** `GridPosition`
- **Orphan:** false

## combat-C116: EncounterGrid Store - updateGridConfig

- **Type:** store-action
- **Location:** `app/stores/encounterGrid.ts:updateGridConfig`
- **Game Concept:** Grid settings update
- **Description:** Calls grid-config API to update grid dimensions and settings.
- **Inputs:** `encounterId, config`
- **Outputs:** `Partial<GridConfig>`
- **Orphan:** false

## combat-C117: EncounterGrid Store - uploadBackgroundImage

- **Type:** store-action
- **Location:** `app/stores/encounterGrid.ts:uploadBackgroundImage`
- **Game Concept:** Map upload
- **Description:** Uploads background image file via FormData to background API.
- **Inputs:** `encounterId, file: File`
- **Outputs:** `string` (data URL)
- **Orphan:** false

## combat-C118: EncounterGrid Store - loadFogState

- **Type:** store-action
- **Location:** `app/stores/encounterGrid.ts:loadFogState`
- **Game Concept:** Fog of war loading
- **Description:** GETs fog state from API and returns data.
- **Inputs:** `encounterId`
- **Outputs:** `{ enabled, cells, defaultState }`
- **Orphan:** false

## combat-C119: EncounterGrid Store - saveFogState

- **Type:** store-action
- **Location:** `app/stores/encounterGrid.ts:saveFogState`
- **Game Concept:** Fog of war persistence
- **Description:** PUTs fog state to API.
- **Inputs:** `encounterId, fogState`
- **Outputs:** `void`
- **Orphan:** false

## combat-C120: Encounter Store Getter - combatantsByInitiative

- **Type:** store-getter
- **Location:** `app/stores/encounter.ts:combatantsByInitiative`
- **Game Concept:** Initiative-ordered combatant list
- **Description:** Returns combatants ordered by turnOrder array. Falls back to descending initiative sort.
- **Inputs:** Store state
- **Outputs:** `Combatant[]`
- **Orphan:** false

## combat-C121: Encounter Store Getter - currentCombatant

- **Type:** store-getter
- **Location:** `app/stores/encounter.ts:currentCombatant`
- **Game Concept:** Active turn combatant
- **Description:** Returns the combatant whose turn it currently is based on turnOrder and currentTurnIndex.
- **Inputs:** Store state
- **Outputs:** `Combatant | null`
- **Orphan:** false

## combat-C122: Encounter Store Getter - playerCombatants

- **Type:** store-getter
- **Location:** `app/stores/encounter.ts:playerCombatants`
- **Game Concept:** Side filtering
- **Description:** Filters combatants by side='players'.
- **Inputs:** Store state
- **Outputs:** `Combatant[]`
- **Orphan:** false

## combat-C123: Encounter Store Getter - allyCombatants

- **Type:** store-getter
- **Location:** `app/stores/encounter.ts:allyCombatants`
- **Game Concept:** Side filtering
- **Description:** Filters combatants by side='allies'.
- **Inputs:** Store state
- **Outputs:** `Combatant[]`
- **Orphan:** false

## combat-C124: Encounter Store Getter - enemyCombatants

- **Type:** store-getter
- **Location:** `app/stores/encounter.ts:enemyCombatants`
- **Game Concept:** Side filtering
- **Description:** Filters combatants by side='enemies'.
- **Inputs:** Store state
- **Outputs:** `Combatant[]`
- **Orphan:** false

## combat-C125: Encounter Store Getter - injuredCombatants

- **Type:** store-getter
- **Location:** `app/stores/encounter.ts:injuredCombatants`
- **Game Concept:** Injury filtering
- **Description:** Filters combatants that have injuries > 0.
- **Inputs:** Store state
- **Outputs:** `Combatant[]`
- **Orphan:** false

## combat-C126: Encounter Store Getter - combatantsWithActions

- **Type:** store-getter
- **Location:** `app/stores/encounter.ts:combatantsWithActions`
- **Game Concept:** Action availability filtering
- **Description:** Filters combatants that still have unused actions this turn.
- **Inputs:** Store state
- **Outputs:** `Combatant[]`
- **Orphan:** false

## combat-C127: Encounter Store Getter - trainersByTurnOrder

- **Type:** store-getter
- **Location:** `app/stores/encounter.ts:trainersByTurnOrder`
- **Game Concept:** League battle trainer order
- **Description:** Returns trainers in their turn order for League battles.
- **Inputs:** Store state
- **Outputs:** `Combatant[]`
- **Orphan:** false

## combat-C128: Encounter Store Getter - pokemonByTurnOrder

- **Type:** store-getter
- **Location:** `app/stores/encounter.ts:pokemonByTurnOrder`
- **Game Concept:** League battle pokemon order
- **Description:** Returns Pokemon in their turn order for League battles.
- **Inputs:** Store state
- **Outputs:** `Combatant[]`
- **Orphan:** false

## combat-C129: Encounter Store Getter - isLeagueBattle

- **Type:** store-getter
- **Location:** `app/stores/encounter.ts:isLeagueBattle`
- **Game Concept:** Battle type check
- **Description:** Returns true if battleType is 'trainer' (League Battle).
- **Inputs:** Store state
- **Outputs:** `boolean`
- **Orphan:** false

## combat-C130: Fog of War Store - applyTool

- **Type:** store-action
- **Location:** `app/stores/fogOfWar.ts:applyTool`
- **Game Concept:** Fog of war painting
- **Description:** Applies current tool mode (reveal/hide/explore) at position with brush size using Chebyshev distance.
- **Inputs:** `x, y`
- **Outputs:** Modifies cellStates map
- **Orphan:** false

## combat-C131: Fog of War Store - revealAll

- **Type:** store-action
- **Location:** `app/stores/fogOfWar.ts:revealAll`
- **Game Concept:** Clear all fog
- **Description:** Reveals all cells on the grid (sets all to 'revealed').
- **Inputs:** `gridWidth, gridHeight`
- **Outputs:** Modifies cellStates map
- **Orphan:** false

## combat-C132: Fog of War Store Getter - isVisible

- **Type:** store-getter
- **Location:** `app/stores/fogOfWar.ts:isVisible`
- **Game Concept:** Cell visibility check
- **Description:** Returns true if cell is 'revealed' or 'explored'. Used for rendering fog overlay.
- **Inputs:** `x, y`
- **Outputs:** `boolean`
- **Orphan:** false

## combat-C133: Fog of War Store Getter - getCellState

- **Type:** store-getter
- **Location:** `app/stores/fogOfWar.ts:getCellState`
- **Game Concept:** Cell fog state query
- **Description:** Returns the fog state (hidden/revealed/explored) of a cell. Falls back to defaultState.
- **Inputs:** `x, y`
- **Outputs:** `FogState`
- **Orphan:** false

## combat-C134: Terrain Store - setTerrain

- **Type:** store-action
- **Location:** `app/stores/terrain.ts:setTerrain`
- **Game Concept:** Terrain painting
- **Description:** Sets terrain type at a single cell. Removes from map if setting to normal (default).
- **Inputs:** `x, y, type, elevation?, note?`
- **Outputs:** Modifies cells map
- **Orphan:** false

## combat-C135: Terrain Store Getter - getMovementCost

- **Type:** store-getter
- **Location:** `app/stores/terrain.ts:getMovementCost`
- **Game Concept:** Terrain movement cost
- **Description:** Returns movement cost multiplier for a cell. Normal=1, Difficult=2, Water=2 (or Infinity without swim), Blocking=Infinity.
- **Inputs:** `x, y, canSwim?`
- **Outputs:** `number` (1, 2, or Infinity)
- **Orphan:** false

## combat-C136: Terrain Store Getter - isPassable

- **Type:** store-getter
- **Location:** `app/stores/terrain.ts:isPassable`
- **Game Concept:** Terrain passability check
- **Description:** Returns false for blocking terrain, or water without swim capability.
- **Inputs:** `x, y, canSwim?`
- **Outputs:** `boolean`
- **Orphan:** false

## combat-C137: Measurement Store Getter - distance

- **Type:** store-getter
- **Location:** `app/stores/measurement.ts:distance`
- **Game Concept:** PTU Chebyshev distance measurement
- **Description:** Calculates Chebyshev distance between start and end positions (max of dx, dy). PTU standard: diagonal = 1 for measurement.
- **Inputs:** Store state (startPosition, endPosition)
- **Outputs:** `number` (cells)
- **Orphan:** false

## combat-C138: Measurement Store Getter - affectedCells

- **Type:** store-getter
- **Location:** `app/stores/measurement.ts:affectedCells`
- **Game Concept:** AoE visualization
- **Description:** Calculates affected cells based on current mode: distance (line), burst, cone, line, close-blast. Uses helper functions for each shape.
- **Inputs:** Store state
- **Outputs:** `GridPosition[]`
- **Orphan:** false

## combat-C139: Component - CombatantCard

- **Type:** component
- **Location:** `app/components/encounter/CombatantCard.vue`
- **Game Concept:** GM combatant display
- **Description:** GM-side combatant card showing HP, status, injuries, actions, and combat controls.
- **Inputs:** Combatant data via props
- **Outputs:** UI rendering + event emissions
- **Orphan:** false

## combat-C140: Component - GMActionModal

- **Type:** component
- **Location:** `app/components/encounter/GMActionModal.vue`
- **Game Concept:** GM combat action panel
- **Description:** Modal for GM to select and execute combat actions (moves, maneuvers, damage, healing).
- **Inputs:** Actor/target combatants
- **Outputs:** Action execution events
- **Orphan:** false

## combat-C141: Component - StatusConditionsModal

- **Type:** component
- **Location:** `app/components/encounter/StatusConditionsModal.vue`
- **Game Concept:** Status condition management UI
- **Description:** Modal for adding/removing status conditions on a combatant.
- **Inputs:** Combatant
- **Outputs:** Status change events
- **Orphan:** false

## combat-C142: Component - CombatStagesModal

- **Type:** component
- **Location:** `app/components/encounter/CombatStagesModal.vue`
- **Game Concept:** Combat stage management UI
- **Description:** Modal for viewing/modifying combat stages (-6 to +6).
- **Inputs:** Combatant
- **Outputs:** Stage change events
- **Orphan:** false

## combat-C143: Component - MoveTargetModal

- **Type:** component
- **Location:** `app/components/encounter/MoveTargetModal.vue`
- **Game Concept:** Move targeting UI
- **Description:** Modal for selecting targets when executing a move.
- **Inputs:** Actor, move data, combatant list
- **Outputs:** Target selection + damage values
- **Orphan:** false

## combat-C144: Component - DamageSection

- **Type:** component
- **Location:** `app/components/encounter/DamageSection.vue`
- **Game Concept:** Damage/heal input UI
- **Description:** UI section for entering damage or healing amounts.
- **Inputs:** Combatant
- **Outputs:** Damage/heal events
- **Orphan:** false

## combat-C145: Component - ManeuverGrid

- **Type:** component
- **Location:** `app/components/encounter/ManeuverGrid.vue`
- **Game Concept:** PTU maneuver selection
- **Description:** Grid display of available PTU combat maneuvers (Push, Sprint, Trip, Grapple, Intercept, Take a Breather).
- **Inputs:** None (uses COMBAT_MANEUVERS constant)
- **Outputs:** Maneuver selection event
- **Orphan:** false

## combat-C146: Component - AddCombatantModal

- **Type:** component
- **Location:** `app/components/encounter/AddCombatantModal.vue`
- **Game Concept:** Combatant addition UI
- **Description:** Modal for searching and adding Pokemon or Human characters to the encounter.
- **Inputs:** Encounter
- **Outputs:** Add combatant events
- **Orphan:** false

## combat-C147: Component - CaptureRateDisplay

- **Type:** component
- **Location:** `app/components/encounter/CaptureRateDisplay.vue`
- **Game Concept:** Capture rate visualization
- **Description:** Displays calculated capture rate for a wild Pokemon combatant with breakdown.
- **Inputs:** Pokemon combatant data
- **Outputs:** UI rendering
- **Orphan:** false

## combat-C148: Component - TargetSelector

- **Type:** component
- **Location:** `app/components/encounter/TargetSelector.vue`
- **Game Concept:** Target selection UI
- **Description:** UI component for selecting targets from combatant list.
- **Inputs:** Combatant list, selection mode
- **Outputs:** Target selection events
- **Orphan:** false

## combat-C149: Component - TargetDamageList

- **Type:** component
- **Location:** `app/components/encounter/TargetDamageList.vue`
- **Game Concept:** Per-target damage display
- **Description:** Displays damage results per target after a move execution.
- **Inputs:** Target damage data
- **Outputs:** UI rendering
- **Orphan:** false

## combat-C150: Component - MoveButton

- **Type:** component
- **Location:** `app/components/encounter/MoveButton.vue`
- **Game Concept:** Move action button
- **Description:** Button component for selecting a Pokemon move during combat.
- **Inputs:** Move data
- **Outputs:** Move selection event
- **Orphan:** false

## combat-C151: Component - MoveInfoCard

- **Type:** component
- **Location:** `app/components/encounter/MoveInfoCard.vue`
- **Game Concept:** Move detail display
- **Description:** Card showing move details (type, power, AC, range, effect, frequency).
- **Inputs:** Move data
- **Outputs:** UI rendering
- **Orphan:** false

## combat-C152: Component - TempHpModal

- **Type:** component
- **Location:** `app/components/encounter/TempHpModal.vue`
- **Game Concept:** Temporary HP management
- **Description:** Modal for granting or removing temporary HP.
- **Inputs:** Combatant
- **Outputs:** Temp HP change events
- **Orphan:** false

## combat-C153: Component - PlayerActionPanel

- **Type:** component
- **Location:** `app/components/encounter/PlayerActionPanel.vue`
- **Game Concept:** Player-side action UI
- **Description:** Action panel for player view showing available moves and actions.
- **Inputs:** Player combatant
- **Outputs:** Action submission events
- **Orphan:** false

## combat-C154: Component - PlayerCombatantCard

- **Type:** component
- **Location:** `app/components/encounter/PlayerCombatantCard.vue`
- **Game Concept:** Player view combatant display
- **Description:** Combatant card for player view with limited information (no enemy stats).
- **Inputs:** Combatant data
- **Outputs:** UI rendering
- **Orphan:** false

## combat-C155: Component - GroupCombatantCard

- **Type:** component
- **Location:** `app/components/encounter/GroupCombatantCard.vue`
- **Game Concept:** Group view combatant display
- **Description:** Combatant card for group/projector view with public information.
- **Inputs:** Combatant data
- **Outputs:** UI rendering
- **Orphan:** false

## combat-C156: Constant - COMBAT_MANEUVERS

- **Type:** constant
- **Location:** `app/constants/combatManeuvers.ts:COMBAT_MANEUVERS`
- **Game Concept:** PTU combat maneuvers (p.245)
- **Description:** Array of 7 PTU maneuvers: Push (AC 4, standard), Sprint (standard), Trip (AC 6, standard), Grapple (AC 4, standard), Intercept Melee (full+interrupt), Intercept Ranged (full+interrupt), Take a Breather (full).
- **Inputs:** N/A (constant)
- **Outputs:** `Maneuver[]`
- **Orphan:** false

## combat-C157: Constant - PERSISTENT_CONDITIONS

- **Type:** constant
- **Location:** `app/constants/statusConditions.ts:PERSISTENT_CONDITIONS`
- **Game Concept:** PTU persistent status conditions
- **Description:** Array of persistent conditions: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Orphan:** false

## combat-C158: Constant - VOLATILE_CONDITIONS

- **Type:** constant
- **Location:** `app/constants/statusConditions.ts:VOLATILE_CONDITIONS`
- **Game Concept:** PTU volatile status conditions
- **Description:** Array of volatile conditions: Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Orphan:** false

## combat-C159: Constant - OTHER_CONDITIONS

- **Type:** constant
- **Location:** `app/constants/statusConditions.ts:OTHER_CONDITIONS`
- **Game Concept:** PTU other status conditions
- **Description:** Array of other conditions: Fainted, Stuck, Slowed, Trapped, Tripped, Vulnerable.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Orphan:** false

## combat-C160: Constant - STAGE_MULTIPLIERS

- **Type:** constant
- **Location:** `app/utils/damageCalculation.ts:STAGE_MULTIPLIERS`
- **Game Concept:** PTU combat stage multiplier table
- **Description:** Maps stage -6 to +6 to multiplier (0.4 to 2.2). Positive: +20%/stage, Negative: -10%/stage.
- **Inputs:** N/A (constant)
- **Outputs:** `Record<number, number>`
- **Orphan:** false

## combat-C161: Constant - DAMAGE_BASE_CHART

- **Type:** constant
- **Location:** `app/utils/damageCalculation.ts:DAMAGE_BASE_CHART`
- **Game Concept:** PTU damage base to set damage lookup
- **Description:** Maps DB values 1-28 to { min, avg, max } damage. Used for set damage mode.
- **Inputs:** N/A (constant)
- **Outputs:** `Record<number, { min, avg, max }>`
- **Orphan:** false

## combat-C162: Constant - TYPE_CHART

- **Type:** constant
- **Location:** `app/utils/typeChart.ts:TYPE_CHART`
- **Game Concept:** PTU 18-type effectiveness chart
- **Description:** Full type chart with PTU values (1.5 for SE, not 2.0). Only non-1.0 matchups listed per attacking type.
- **Inputs:** N/A (constant)
- **Outputs:** `Record<string, Record<string, number>>`
- **Orphan:** false

## combat-C163: Constant - NET_EFFECTIVENESS

- **Type:** constant
- **Location:** `app/utils/typeChart.ts:NET_EFFECTIVENESS`
- **Game Concept:** PTU net effectiveness multiplier table
- **Description:** Maps net SE-resist count (-3 to +3) to flat multipliers (0.125 to 3.0). PTU qualitative system.
- **Inputs:** N/A (constant)
- **Outputs:** `Record<number, number>`
- **Orphan:** false

## combat-C164: Constant - TERRAIN_COSTS

- **Type:** constant
- **Location:** `app/stores/terrain.ts:TERRAIN_COSTS`
- **Game Concept:** Terrain movement cost multipliers
- **Description:** Movement costs: normal=1, difficult=2, blocking=Infinity, water=2, hazard=1, elevated=1.
- **Inputs:** N/A (constant)
- **Outputs:** `Record<TerrainType, number>`
- **Orphan:** false

## combat-C165: Constant - TERRAIN_COLORS

- **Type:** constant
- **Location:** `app/stores/terrain.ts:TERRAIN_COLORS`
- **Game Concept:** Terrain visual styling
- **Description:** Fill and stroke colors for each terrain type rendering on the grid canvas.
- **Inputs:** N/A (constant)
- **Outputs:** `Record<TerrainType, { fill, stroke }>`
- **Orphan:** false

## combat-C166: Utility - Calculate Damage Formula (9-Step)

- **Type:** utility
- **Location:** `app/utils/damageCalculation.ts:calculateDamage`
- **Game Concept:** PTU 9-step damage formula
- **Description:** Pure function implementing full PTU 9-step damage: DB + STAB -> chart lookup -> critical -> add attack stat -> subtract defense + DR -> type effectiveness -> min 1 (unless immune).
- **Inputs:** `DamageCalcInput { attackerTypes, attackStat, attackStage, moveType, moveDamageBase, moveDamageClass, targetTypes, defenseStat, defenseStage, isCritical?, damageReduction? }`
- **Outputs:** `DamageCalcResult { finalDamage, breakdown }`
- **Orphan:** false

## combat-C167: Utility - Calculate Evasion (Pure)

- **Type:** utility
- **Location:** `app/utils/damageCalculation.ts:calculateEvasion`
- **Game Concept:** PTU dynamic evasion calculation
- **Description:** Pure function: min(6, floor(stageModifiedStat / 5)) + evasionBonus, min 0. Uses stage-modified stat per PTU rules.
- **Inputs:** `baseStat, combatStage?, evasionBonus?`
- **Outputs:** `number`
- **Orphan:** false

## combat-C168: Utility - Calculate Accuracy Threshold (Pure)

- **Type:** utility
- **Location:** `app/utils/damageCalculation.ts:calculateAccuracyThreshold`
- **Game Concept:** PTU accuracy check
- **Description:** Pure function: max(1, moveAC + min(9, evasion) - attackerAccuracyStage). Natural 1/20 handled by caller.
- **Inputs:** `moveAC, attackerAccuracyStage, defenderEvasion`
- **Outputs:** `number`
- **Orphan:** false

## combat-C169: Utility - Get Type Effectiveness

- **Type:** utility
- **Location:** `app/utils/typeChart.ts:getTypeEffectiveness`
- **Game Concept:** PTU type effectiveness (1.5x SE, not 2x)
- **Description:** Computes net type effectiveness across all defender types. PTU qualitative classification: count SE/resist/immune, net to +-3, lookup multiplier. Immunity always wins (returns 0).
- **Inputs:** `moveType: string, defenderTypes: string[]`
- **Outputs:** `number` (0, 0.125, 0.25, 0.5, 1.0, 1.5, 2.0, 3.0)
- **Orphan:** false

## combat-C170: Utility - Get Effectiveness Label

- **Type:** utility
- **Location:** `app/utils/typeChart.ts:getEffectivenessLabel`
- **Game Concept:** Type effectiveness display text
- **Description:** Returns human-readable label for type effectiveness multiplier (Immune, Triply Resisted, ... Triply Super Effective).
- **Inputs:** `multiplier: number`
- **Outputs:** `string`
- **Orphan:** false

## combat-C171: Utility - Get Set Damage

- **Type:** utility
- **Location:** `app/utils/damageCalculation.ts:getSetDamage`
- **Game Concept:** PTU damage base chart lookup
- **Description:** Looks up set (average) damage from the DB chart for a given damage base value (1-28). Clamps to valid range.
- **Inputs:** `db: number`
- **Outputs:** `number` (average damage)
- **Orphan:** false

## combat-C172: Utility - Has STAB

- **Type:** utility
- **Location:** `app/utils/damageCalculation.ts:hasSTAB`
- **Game Concept:** Same Type Attack Bonus check
- **Description:** Returns true if the move type matches any of the attacker's types. STAB adds +2 to DB.
- **Inputs:** `moveType, attackerTypes`
- **Outputs:** `boolean`
- **Orphan:** false

## combat-C173: Utility - Apply Stage Modifier (Pure)

- **Type:** utility
- **Location:** `app/utils/damageCalculation.ts:applyStageModifier`
- **Game Concept:** Pure stage modifier application
- **Description:** Pure function: floor(baseStat * stageMultiplier). Clamps stage to -6/+6.
- **Inputs:** `baseStat, stage`
- **Outputs:** `number`
- **Orphan:** false

## combat-C174: Utility - Dice Roll

- **Type:** utility
- **Location:** `app/utils/diceRoller.ts:roll`
- **Game Concept:** Dice rolling (XdY+Z)
- **Description:** Rolls dice from notation string. Returns total, individual dice, modifier, and breakdown string.
- **Inputs:** `notation: string` (e.g. "2d6+8")
- **Outputs:** `DiceRollResult { total, dice, modifier, notation, breakdown }`
- **Orphan:** false

## combat-C175: Utility - Roll Critical

- **Type:** utility
- **Location:** `app/utils/diceRoller.ts:rollCritical`
- **Game Concept:** PTU critical hit dice
- **Description:** Critical hit: rolls dice portion twice, doubles modifier. Per PTU critical hit rules.
- **Inputs:** `notation: string`
- **Outputs:** `DiceRollResult`
- **Orphan:** false

## combat-C176: Utility - Parse Dice Notation

- **Type:** utility
- **Location:** `app/utils/diceRoller.ts:parseDiceNotation`
- **Game Concept:** Dice notation parsing
- **Description:** Parses XdY+Z format into { count, sides, modifier } components. Returns null if invalid.
- **Inputs:** `notation: string`
- **Outputs:** `{ count, sides, modifier } | null`
- **Orphan:** false

## combat-C177: Utility - Get Average Roll

- **Type:** utility
- **Location:** `app/utils/diceRoller.ts:getAverageRoll`
- **Game Concept:** Expected dice result
- **Description:** Calculates average result: count * (sides + 1) / 2 + modifier.
- **Inputs:** `notation: string`
- **Outputs:** `number`
- **Orphan:** false

## combat-C178: Utility - Capture Rate Calculation

- **Type:** utility
- **Location:** `app/utils/captureRate.ts:calculateCaptureRate`
- **Game Concept:** PTU capture rate formula
- **Description:** Base 100 - (level x 2) + HP modifier + evolution modifier + status/injury/rarity modifiers. Used during combat for capture attempts on wild Pokemon.
- **Inputs:** `CaptureRateInput { level, currentHp, maxHp, evolutionStage, maxEvolutionStage, statusConditions, injuries, isShiny, isLegendary? }`
- **Outputs:** `CaptureRateResult { captureRate, breakdown, canBeCaptured, hpPercentage }`
- **Orphan:** false

## combat-C179: Utility - Attempt Capture

- **Type:** utility
- **Location:** `app/utils/captureRate.ts:attemptCapture`
- **Game Concept:** PTU capture attempt roll
- **Description:** Rolls 1d100, applies trainer level and modifiers, checks against capture rate. Natural 100 always captures.
- **Inputs:** `captureRate, trainerLevel, modifiers?, criticalHit?`
- **Outputs:** `{ success, roll, modifiedRoll, effectiveCaptureRate, naturalHundred }`
- **Orphan:** false

## combat-C180: Utility - Get Condition Class

- **Type:** utility
- **Location:** `app/constants/statusConditions.ts:getConditionClass`
- **Game Concept:** Status condition CSS styling
- **Description:** Maps status condition name to CSS class name for visual styling.
- **Inputs:** `condition: StatusCondition`
- **Outputs:** `string` (CSS class)
- **Orphan:** false

## combat-C181: Utility - Wild Spawn State (Server Singleton)

- **Type:** utility
- **Location:** `app/server/utils/wildSpawnState.ts:getWildSpawnPreview`
- **Game Concept:** Wild spawn preview state
- **Description:** In-memory singleton for wild spawn preview data. Set/get/clear functions for transient state that doesn't need DB persistence.
- **Inputs:** `WildSpawnPreview | void`
- **Outputs:** `WildSpawnPreview | null`
- **Orphan:** false

## combat-C182: Utility - Broadcast To Encounter

- **Type:** utility
- **Location:** `app/server/utils/websocket.ts:broadcastToEncounter`
- **Game Concept:** Encounter-scoped broadcast
- **Description:** Broadcasts a WebSocket event to all peers watching a specific encounter. Excludes sender.
- **Inputs:** `encounterId, event, excludePeer?`
- **Outputs:** Sends to matching peers
- **Orphan:** false

## combat-C183: Utility - Notify Encounter Update

- **Type:** utility
- **Location:** `app/server/utils/websocket.ts:notifyEncounterUpdate`
- **Game Concept:** Encounter update notification helper
- **Description:** Convenience function wrapping broadcastToEncounter with type='encounter_update'.
- **Inputs:** `encounterId, encounter`
- **Outputs:** Broadcasts to encounter peers
- **Orphan:** false

## combat-C184: Utility - Notify Turn Change

- **Type:** utility
- **Location:** `app/server/utils/websocket.ts:notifyTurnChange`
- **Game Concept:** Turn change notification helper
- **Description:** Convenience function wrapping broadcastToEncounter with type='turn_change'.
- **Inputs:** `encounterId, turnData`
- **Outputs:** Broadcasts to encounter peers
- **Orphan:** false

## combat-C185: WebSocket Event - encounter_update

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:encounter_update`
- **Game Concept:** Encounter state broadcast
- **Description:** GM broadcasts encounter state changes to all viewers in the encounter room.
- **Inputs:** Full encounter data
- **Outputs:** Broadcast to encounter peers
- **Orphan:** false

## combat-C186: WebSocket Event - turn_change

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:turn_change`
- **Game Concept:** Turn change notification
- **Description:** Notifies all encounter viewers when turn changes.
- **Inputs:** Turn change data
- **Outputs:** Broadcast to encounter peers
- **Orphan:** false

## combat-C187: WebSocket Event - damage_applied

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:damage_applied`
- **Game Concept:** Damage notification
- **Description:** Notifies all encounter viewers when damage is applied.
- **Inputs:** Damage data
- **Outputs:** Broadcast to encounter peers
- **Orphan:** false

## combat-C188: WebSocket Event - heal_applied

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:heal_applied`
- **Game Concept:** Healing notification
- **Description:** Notifies all encounter viewers when healing is applied.
- **Inputs:** Heal data
- **Outputs:** Broadcast to encounter peers
- **Orphan:** false

## combat-C189: WebSocket Event - status_change

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:status_change`
- **Game Concept:** Status condition change notification
- **Description:** Notifies all encounter viewers when status conditions change.
- **Inputs:** Status change data
- **Outputs:** Broadcast to encounter peers
- **Orphan:** false

## combat-C190: WebSocket Event - move_executed

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:move_executed`
- **Game Concept:** Move execution notification
- **Description:** Notifies all encounter viewers when a move is used.
- **Inputs:** Move data
- **Outputs:** Broadcast to encounter peers
- **Orphan:** false

## combat-C191: WebSocket Event - combatant_added

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:combatant_added`
- **Game Concept:** Combatant addition notification
- **Description:** Notifies all encounter viewers when a combatant is added.
- **Inputs:** Combatant data
- **Outputs:** Broadcast to encounter peers
- **Orphan:** false

## combat-C192: WebSocket Event - combatant_removed

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:combatant_removed`
- **Game Concept:** Combatant removal notification
- **Description:** Notifies all encounter viewers when a combatant is removed.
- **Inputs:** Combatant data
- **Outputs:** Broadcast to encounter peers
- **Orphan:** false

## combat-C193: WebSocket Event - serve_encounter

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:serve_encounter`
- **Game Concept:** Encounter serve notification
- **Description:** GM serves encounter, broadcast to all encounter viewers and all group clients.
- **Inputs:** `{ encounterId }`
- **Outputs:** Broadcast `encounter_served` to groups
- **Orphan:** false

## combat-C194: WebSocket Event - encounter_unserved

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:encounter_unserved`
- **Game Concept:** Encounter unserve notification
- **Description:** GM unserves encounter, broadcast to all group clients.
- **Inputs:** `{ encounterId }`
- **Outputs:** Broadcast to group peers
- **Orphan:** false

## combat-C195: WebSocket Event - movement_preview

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:movement_preview`
- **Game Concept:** VTT movement preview
- **Description:** GM previewing a token move, broadcast to group views for real-time display.
- **Inputs:** Movement preview data
- **Outputs:** Broadcast to encounter peers
- **Orphan:** false

## combat-C196: WebSocket Event - player_action

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:player_action`
- **Game Concept:** Group-to-GM action submission
- **Description:** Group client submits an action, forwarded only to GM peers in the same encounter.
- **Inputs:** Action data
- **Outputs:** Forwarded to GM peers only
- **Orphan:** false

## combat-C197: WebSocket Event - character_update

- **Type:** websocket-event
- **Location:** `app/server/routes/ws.ts:character_update`
- **Game Concept:** Character data change broadcast
- **Description:** Character data changed, broadcast to all connected peers.
- **Inputs:** Character update data
- **Outputs:** Broadcast to all peers
- **Orphan:** false

---

## Capability Chains

### Chain 1: Encounter Lifecycle
1. `combat-C086` (store-action: createEncounter) → 2. `combat-C002` (api-endpoint: create) → 3. `combat-C085` (store-action: loadEncounter) → 4. `combat-C089` (store-action: addCombatant) → 5. `combat-C010` (api-endpoint: combatants.post) → 6. `combat-C048` (service: buildCombatantFromEntity) → 7. `combat-C045`/`combat-C046` (service: entity builders) → 8. `combat-C091` (store-action: startEncounter) → 9. `combat-C007` (api-endpoint: start) → 10. `combat-C032` (service: sortByInitiativeWithRollOff) → 11. `combat-C092` (store-action: nextTurn) → 12. `combat-C009` (api-endpoint: next-turn) → END: `combat-C008` (api-endpoint: end)
**Breaks at:** complete

### Chain 2: Damage Pipeline
1. `combat-C094` (store-action: applyDamage) → 2. `combat-C012` (api-endpoint: damage) → 3. `combat-C030` (service: loadEncounter) → 4. `combat-C031` (service: findCombatant) → 5. `combat-C036` (service: calculateDamage) → 6. `combat-C037` (service: countMarkersCrossed) → 7. `combat-C038` (service: applyDamageToEntity) → 8. `combat-C050` (service: syncDamageToDatabase) → 9. `combat-C049` (service: syncEntityToDatabase) → 10. `combat-C034` (service: saveEncounterCombatants)
**Breaks at:** complete

### Chain 3: Move Execution Pipeline
1. `combat-C093` (store-action: executeMove) → 2. `combat-C014` (api-endpoint: move) → 3. `combat-C030`/`combat-C031` (service: load/find) → 4. `combat-C036` (service: calculateDamage per target) → 5. `combat-C038` (service: applyDamageToEntity) → 6. `combat-C050` (service: syncDamageToDatabase) → 7. moveLog append → 8. `combat-C190` (ws: move_executed notification)
**Breaks at:** complete

### Chain 4: Calculate Damage (Read-Only Preview)
1. `combat-C029` (api-endpoint: calculate-damage) → 2. `combat-C030`/`combat-C031` (service: load/find) → 3. `combat-C166` (utility: calculateDamage 9-step) → 4. `combat-C172` (utility: hasSTAB) → 5. `combat-C171` (utility: getSetDamage) → 6. `combat-C169` (utility: getTypeEffectiveness) → 7. `combat-C167` (utility: calculateEvasion) → 8. `combat-C168` (utility: calculateAccuracyThreshold)
**Breaks at:** complete

### Chain 5: Status Condition Pipeline
1. `combat-C106`/`combat-C107` (store-action: add/remove status) → 2. `combat-C016` (api-endpoint: status) → 3. `combat-C041` (service: validateStatusConditions) → 4. `combat-C040` (service: updateStatusConditions) → 5. `combat-C052` (service: syncStatusToDatabase) → 6. `combat-C049` (service: syncEntityToDatabase) → 7. `combat-C189` (ws: status_change)
**Breaks at:** complete

### Chain 6: Combat Stage Pipeline
1. `combat-C108`/`combat-C109` (store-action: modify/set stages) → 2. `combat-C015` (api-endpoint: stages) → 3. `combat-C043` (service: validateStageStats) → 4. `combat-C042` (service: updateStageModifiers) → 5. `combat-C053` (service: syncStagesToDatabase) → 6. `combat-C049` (service: syncEntityToDatabase)
**Breaks at:** complete

### Chain 7: Take a Breather Pipeline
1. `combat-C110` (store-action: takeABreather) → 2. `combat-C027` (api-endpoint: breather) → 3. `combat-C044` (service: createDefaultStageModifiers) → 4. `combat-C049` (service: syncEntityToDatabase) → 5. moveLog append
**Breaks at:** complete

### Chain 8: Healing Pipeline
1. `combat-C095` (store-action: healCombatant) → 2. `combat-C013` (api-endpoint: heal) → 3. `combat-C039` (service: applyHealingToEntity) → 4. `combat-C051` (service: syncHealingToDatabase) → 5. `combat-C049` (service: syncEntityToDatabase)
**Breaks at:** complete

### Chain 9: VTT Grid Position Update
1. `combat-C115` (store-action: updateCombatantPosition) → 2. `combat-C019` (api-endpoint: position) → 3. DB update → 4. `combat-C195` (ws: movement_preview)
**Breaks at:** complete

### Chain 10: Fog of War Pipeline
1. `combat-C118` (store-action: loadFogState) → 2. `combat-C023` (api-endpoint: fog.get) → 3. DB read → 4. `combat-C130` (store: applyTool) → 5. `combat-C119` (store-action: saveFogState) → 6. `combat-C024` (api-endpoint: fog.put)
**Breaks at:** complete

### Chain 11: Wild Pokemon Spawn Pipeline
1. `combat-C103` (store-action: addWildPokemon) → 2. `combat-C028` (api-endpoint: wild-spawn) → 3. pokemon-generator service (external) → 4. `combat-C054` (service: sizeToTokenSize) → 5. `combat-C056` (service: findPlacementPosition) → 6. DB update
**Breaks at:** complete

### Chain 12: Serve/Unserve to Group View
1. `combat-C096` (store-action: serveEncounter) → 2. `combat-C017` (api-endpoint: serve) → 3. DB transaction → 4. `combat-C193` (ws: serve_encounter) → 5. `combat-C098` (store-action: loadServedEncounter) → 6. `combat-C005` (api-endpoint: served.get)
**Breaks at:** complete

### Chain 13: Undo/Redo Pipeline
1. `combat-C100` (store-action: captureSnapshot) → 2. `combat-C075` (composable: pushSnapshot) → 3. `combat-C101` (store-action: undoAction) → 4. `combat-C076` (composable: undo) → 5. `combat-C004` (api-endpoint: PUT full state) → 6. DB update
**Breaks at:** complete

### Chain 14: Scene-to-Encounter Pipeline
1. `combat-C087` (store-action: createFromScene) → 2. `combat-C006` (api-endpoint: from-scene) → 3. pokemon-generator service (external: generateAndCreatePokemon) → 4. `combat-C046` (service: buildHumanEntityFromRecord) → 5. `combat-C048` (service: buildCombatantFromEntity) → 6. `combat-C055`/`combat-C056` (service: grid placement)
**Breaks at:** complete

### Chain 15: Terrain System Pipeline
1. `combat-C134` (store: setTerrain) → 2. `combat-C135` (store-getter: getMovementCost) → 3. `combat-C083` (composable: getMovementRangeCells) → 4. `combat-C084` (composable: calculatePathCost) → 5. `combat-C026` (api-endpoint: terrain.put) → 6. DB update
**Breaks at:** complete

### Chain 16: Capture Rate Display (In-Combat)
1. `combat-C147` (component: CaptureRateDisplay) → 2. `combat-C178` (utility: calculateCaptureRate) → 3. `combat-C157`/`combat-C158`/`combat-C159` (constants: status condition categories) → 4. `combat-C179` (utility: attemptCapture)
**Breaks at:** complete
