---
domain: encounter-tables
mapped_at: 2026-02-28T03:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 52
files_read: 24
---

# App Capabilities: Encounter Tables

> Re-mapped capability catalog for the encounter-tables domain.
> Includes: significance tier presets (ptu-rule-088), levelMin<=levelMax validation (bug-032),
> partial-update merge on entry PUT (refactoring-092), encounter budget calculator,
> XP distribution, density tiers, JSON import/export.

## Prisma Models

### encounter-tables-C001
- **name:** EncounterTable Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model EncounterTable
- **game_concept:** PTU Habitat/encounter table for wild Pokemon spawning
- **description:** Root table storing name, description, imageUrl, level range (levelMin/levelMax), density tier, and timestamps. Has relations to entries (EncounterTableEntry) and modifications (TableModification).
- **inputs:** name, description, imageUrl, levelMin, levelMax, density
- **outputs:** Persisted encounter table record
- **accessible_from:** gm

### encounter-tables-C002
- **name:** EncounterTableEntry Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model EncounterTableEntry
- **game_concept:** Weighted Pokemon species in an encounter table
- **description:** Links a species to a table with weight (spawn probability) and optional per-entry level range override. Unique constraint on (tableId, speciesId).
- **inputs:** tableId, speciesId, weight, levelMin, levelMax
- **outputs:** Persisted table entry with species relation
- **accessible_from:** gm

### encounter-tables-C003
- **name:** TableModification Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model TableModification
- **game_concept:** Sub-habitat modification of an encounter table
- **description:** Named modification that can add, remove, or re-weight species in the parent table's pool. Has optional level range override and child ModificationEntry records.
- **inputs:** name, description, levelMin, levelMax, parentTableId
- **outputs:** Persisted modification record
- **accessible_from:** gm

### encounter-tables-C004
- **name:** ModificationEntry Prisma Model
- **type:** prisma-model
- **location:** `app/prisma/schema.prisma` -- model ModificationEntry
- **game_concept:** Species change in a sub-habitat modification
- **description:** Entry in a modification: speciesName (string, not FK), optional weight override, remove flag, optional per-entry level range. If remove=true, species is excluded from pool.
- **inputs:** modificationId, speciesName, weight, remove, levelMin, levelMax
- **outputs:** Persisted modification entry record
- **accessible_from:** gm

## API Endpoints

### encounter-tables-C010
- **name:** List Tables API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/index.get.ts`
- **game_concept:** Browse encounter tables
- **description:** Returns all encounter tables with entries (including species data) and modifications. Parses levelMin/levelMax into levelRange objects.
- **inputs:** None
- **outputs:** `{ success, data: EncounterTable[] }`
- **accessible_from:** gm

### encounter-tables-C011
- **name:** Get Table API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id].get.ts`
- **game_concept:** Single table details
- **description:** Returns a single encounter table by ID with all entries and modifications.
- **inputs:** URL param: id
- **outputs:** `{ success, data: EncounterTable }`
- **accessible_from:** gm

### encounter-tables-C012
- **name:** Create Table API (with levelMin<=levelMax validation)
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/index.post.ts`
- **game_concept:** Create new encounter table
- **description:** Creates an encounter table with name, description, imageUrl, levelRange, and density. Validates levelMin<=levelMax (bug-032). Defaults density to 'moderate' if invalid. Validates density against ['sparse', 'moderate', 'dense', 'abundant'].
- **inputs:** Body: { name, description?, imageUrl?, levelRange?: { min, max }, density?: DensityTier }
- **outputs:** `{ success, data: EncounterTable }`
- **accessible_from:** gm

### encounter-tables-C013
- **name:** Update Table API (with levelMin<=levelMax validation)
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id].put.ts`
- **game_concept:** Edit encounter table
- **description:** Updates table name, description, imageUrl, levelRange, density. Validates levelMin<=levelMax (bug-032). Returns full table with entries and modifications.
- **inputs:** URL param: id. Body: { name?, description?, imageUrl?, levelRange?, density? }
- **outputs:** `{ success, data: EncounterTable }`
- **accessible_from:** gm

### encounter-tables-C014
- **name:** Delete Table API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id].delete.ts`
- **game_concept:** Remove encounter table
- **description:** Deletes an encounter table and all cascading entries/modifications.
- **inputs:** URL param: id
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### encounter-tables-C015
- **name:** Add Entry API (with levelMin<=levelMax validation)
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/entries/index.post.ts`
- **game_concept:** Add Pokemon species to table
- **description:** Adds a species to the table with weight and optional level range. Verifies table and species exist, validates weight>=0.1, validates levelMin<=levelMax (bug-032), rejects duplicate species (409 conflict).
- **inputs:** URL param: tableId. Body: { speciesId, weight?, levelRange? }
- **outputs:** `{ success, data: EncounterTableEntry }`
- **accessible_from:** gm

### encounter-tables-C016
- **name:** Update Entry API (partial-update merge, refactoring-092)
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/entries/[entryId].put.ts`
- **game_concept:** Modify entry weight or level range
- **description:** Updates weight and/or level range on an entry. Supports partial updates -- merges provided values with existing (refactoring-092). Validates weight>=0.1, levels 1-100. Cross-field validation: merges effectiveLevelMin/Max to ensure levelMin<=levelMax even on partial updates (bug-032).
- **inputs:** URL params: tableId, entryId. Body: { weight?, levelMin?, levelMax? }
- **outputs:** `{ success, data: { id, speciesId, speciesName, weight, levelRange } }`
- **accessible_from:** gm

### encounter-tables-C017
- **name:** Remove Entry API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/entries/[entryId].delete.ts`
- **game_concept:** Remove species from table
- **description:** Deletes an entry from an encounter table.
- **inputs:** URL params: tableId, entryId
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### encounter-tables-C018
- **name:** List Modifications API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/index.get.ts`
- **game_concept:** Browse sub-habitat modifications
- **description:** Returns all modifications for a table with their entries.
- **inputs:** URL param: tableId
- **outputs:** `{ success, data: TableModification[] }`
- **accessible_from:** gm

### encounter-tables-C019
- **name:** Get Modification API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId].get.ts`
- **game_concept:** Single modification details
- **description:** Returns a single modification by ID with all entries.
- **inputs:** URL params: tableId, modId
- **outputs:** `{ success, data: TableModification }`
- **accessible_from:** gm

### encounter-tables-C020
- **name:** Create Modification API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/index.post.ts`
- **game_concept:** Create sub-habitat modification
- **description:** Creates a new modification for a table with name, description, and optional level range.
- **inputs:** URL param: tableId. Body: { name, description?, levelRange? }
- **outputs:** `{ success, data: TableModification }`
- **accessible_from:** gm

### encounter-tables-C021
- **name:** Update Modification API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId].put.ts`
- **game_concept:** Edit sub-habitat modification
- **description:** Updates modification name, description, and level range.
- **inputs:** URL params: tableId, modId. Body: { name?, description?, levelRange? }
- **outputs:** `{ success, data: TableModification }`
- **accessible_from:** gm

### encounter-tables-C022
- **name:** Delete Modification API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId].delete.ts`
- **game_concept:** Remove sub-habitat modification
- **description:** Deletes a modification and all its entries.
- **inputs:** URL params: tableId, modId
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### encounter-tables-C023
- **name:** Add Modification Entry API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts`
- **game_concept:** Add/override/remove species in modification
- **description:** Adds an entry to a modification. Supports add (with weight), override (with weight), or remove (remove=true flag).
- **inputs:** URL params: tableId, modId. Body: { speciesName, weight?, remove?, levelRange? }
- **outputs:** `{ success, data: ModificationEntry }`
- **accessible_from:** gm

### encounter-tables-C024
- **name:** Remove Modification Entry API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/[entryId].delete.ts`
- **game_concept:** Remove entry from modification
- **description:** Deletes a modification entry.
- **inputs:** URL params: tableId, modId, entryId
- **outputs:** `{ success: true }`
- **accessible_from:** gm

### encounter-tables-C025
- **name:** Generate Wild Pokemon API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/generate.post.ts`
- **game_concept:** Wild Pokemon encounter generation
- **description:** Generates random wild Pokemon from a table's species pool using diversity-enforced weighted selection. Builds resolved pool (parent + modification), selects count Pokemon with random levels. Count is provided directly by client (capped at MAX_SPAWN_COUNT). Uses encounter-generation.service.ts.
- **inputs:** URL param: tableId. Body: { count, modificationId?, levelRange? }
- **outputs:** `{ success, data: { generated[], meta: { tableId, tableName, modificationId, levelRange, density, spawnCount, totalPoolSize, totalWeight } } }`
- **accessible_from:** gm

### encounter-tables-C026
- **name:** Export Table API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/export.get.ts`
- **game_concept:** Table data export as JSON file
- **description:** Downloads the table as a JSON file for sharing/backup. Includes version, table metadata, entries, and modifications.
- **inputs:** URL param: tableId
- **outputs:** JSON file download
- **accessible_from:** gm

### encounter-tables-C027
- **name:** Import Table API (with levelMin<=levelMax validation)
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/import.post.ts`
- **game_concept:** Table data import from JSON
- **description:** Imports a table from JSON data. Validates structure, version, and levelMin<=levelMax at all levels (table, entry, modification, modification entry -- bug-032). Auto-deduplicates table names. Looks up species by name, reports unmatched species as warnings.
- **inputs:** Body: ImportData JSON object
- **outputs:** `{ success, data: EncounterTable, warnings: string|null }`
- **accessible_from:** gm

## Service

### encounter-tables-C030
- **name:** Encounter Generation Service
- **type:** service-function
- **location:** `app/server/services/encounter-generation.service.ts` -- generateEncounterPokemon
- **game_concept:** Weighted random species selection with diversity enforcement
- **description:** Pure function for generating wild Pokemon from a weighted pool. Uses diversity-enforced selection (avoids repeating same species unless pool is small). Generates random levels within levelMin-levelMax range per entry. Injectable RNG for testing.
- **inputs:** GenerateEncounterInput: { entries: PoolEntry[], count, levelMin, levelMax, randomFn? }
- **outputs:** GeneratedPokemon[]
- **accessible_from:** api-only (called by generate.post.ts)

## Utilities

### encounter-tables-C035
- **name:** Encounter Budget Calculator
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- calculateEncounterBudget
- **game_concept:** PTU encounter budget guideline (Encounter Creation Guide, Chapter 11)
- **description:** Calculates encounter level budget: averagePokemonLevel * 2 * playerCount. Pure function with typed input/output and breakdown.
- **inputs:** BudgetCalcInput: { averagePokemonLevel, playerCount }
- **outputs:** BudgetCalcResult: { totalBudget, levelBudgetPerPlayer, breakdown }
- **accessible_from:** gm (via encounter UI)

### encounter-tables-C036
- **name:** Effective Enemy Levels Calculator
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- calculateEffectiveEnemyLevels
- **game_concept:** PTU XP: trainer levels count double (p.460)
- **description:** Sums enemy combatant levels, doubling trainer levels per PTU XP rules. Returns both raw and effective totals.
- **inputs:** enemies: Array<{ level, isTrainer }>
- **outputs:** { totalLevels, effectiveLevels }
- **accessible_from:** gm (via encounter UI)

### encounter-tables-C037
- **name:** Difficulty Assessment
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- assessDifficulty
- **game_concept:** Encounter difficulty rating
- **description:** Maps budget ratio to difficulty tier: trivial (<40%), easy (40-70%), balanced (70-130%), hard (130-180%), deadly (>180%).
- **inputs:** budgetRatio: number
- **outputs:** 'trivial' | 'easy' | 'balanced' | 'hard' | 'deadly'
- **accessible_from:** gm (via encounter UI)

### encounter-tables-C038
- **name:** Full Budget Analysis
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- analyzeEncounterBudget
- **game_concept:** Complete encounter balance analysis
- **description:** Combines budget calculation, effective enemy levels, budget ratio, and difficulty assessment into a single analysis result.
- **inputs:** BudgetCalcInput, enemies[]
- **outputs:** BudgetAnalysis: { totalEnemyLevels, budget, budgetRatio, difficulty, hasTrainerEnemies, effectiveEnemyLevels }
- **accessible_from:** gm (via encounter UI)

### encounter-tables-C039
- **name:** Encounter XP Calculator
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- calculateEncounterXp
- **game_concept:** PTU XP distribution after battle (p.460)
- **description:** Calculates XP from a completed encounter: effectiveLevels * significanceMultiplier / playerCount. Returns total, per-player, and base XP.
- **inputs:** enemies[], significanceMultiplier, playerCount
- **outputs:** { totalXp, xpPerPlayer, baseXp }
- **accessible_from:** gm (via XP distribution modal)

### encounter-tables-C040
- **name:** Significance Tier Presets (ptu-rule-088)
- **type:** constant
- **location:** `app/utils/encounterBudget.ts` -- SIGNIFICANCE_PRESETS
- **game_concept:** PTU encounter significance categories
- **description:** 5 significance tiers: insignificant (x1-1.5), everyday (x2-3), significant (x4-5), climactic (x5-7, extended), legendary (x7-10, extended). Each has label, multiplier range, default multiplier, and description.
- **inputs:** N/A
- **outputs:** SignificancePreset[]
- **accessible_from:** gm (via encounter UI)

### encounter-tables-C041
- **name:** Difficulty Thresholds
- **type:** constant
- **location:** `app/utils/encounterBudget.ts` -- DIFFICULTY_THRESHOLDS
- **game_concept:** Budget ratio breakpoints
- **description:** Threshold constants for mapping budget ratios to difficulty: trivial (0.4), easy (0.7), balanced (1.3), hard (1.8).
- **inputs:** N/A
- **outputs:** Constant object
- **accessible_from:** gm (via utility functions)

## Store

### encounter-tables-C045
- **name:** Encounter Tables Store
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` -- useEncounterTablesStore
- **game_concept:** Client-side encounter table management
- **description:** Pinia store managing tables[] state with full CRUD. Actions: loadTables, loadTable, createTable, updateTable, deleteTable, addEntry, updateEntry, removeEntry, createModification, updateModification, deleteModification, addModificationEntry, removeModificationEntry, generateFromTable, exportTable, importTable, selectTable, setFilters, resetFilters.
- **inputs:** Various per action
- **outputs:** Reactive state with tables, filters, selectedTableId
- **accessible_from:** gm

### encounter-tables-C046
- **name:** Resolved Entries Getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` -- getResolvedEntries
- **game_concept:** Merged parent+modification species pool
- **description:** Computes the resolved entry pool for a table with optional modification applied. Starts with parent entries, then applies modification add/remove/override operations. Each resolved entry has speciesName, weight, levelRange (inheriting from parent/modification/table), and source ('parent'|'modification'|'added').
- **inputs:** tableId: string, modificationId?: string
- **outputs:** ResolvedTableEntry[]
- **accessible_from:** gm

### encounter-tables-C047
- **name:** Total Weight Getter
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` -- getTotalWeight
- **game_concept:** Encounter probability display
- **description:** Sums weights of resolved entries for a table/modification combination. Used to calculate and display spawn probabilities.
- **inputs:** tableId: string, modificationId?: string
- **outputs:** number (total weight)
- **accessible_from:** gm

### encounter-tables-C048
- **name:** Table Filter Getters
- **type:** store-getter
- **location:** `app/stores/encounterTables.ts` -- filteredTables, selectedTable, getTableById
- **game_concept:** Table browsing with search/sort
- **description:** filteredTables: filters by search (name, description) and sorts by name/createdAt/updatedAt in asc/desc. selectedTable: returns currently selected table. getTableById: lookup by ID.
- **inputs:** filters: { search, sortBy, sortOrder }
- **outputs:** Filtered/found EncounterTable(s)
- **accessible_from:** gm

## Components

### encounter-tables-C050
- **name:** TableEditor Component
- **type:** component
- **location:** `app/components/encounter-table/TableEditor.vue`
- **game_concept:** Encounter table editing UI
- **description:** Full editing interface for a single encounter table. Manages entries, modifications, density, level range, image URL. Contains species search/add, weight adjustment, modification management.
- **inputs:** Props: table (EncounterTable)
- **outputs:** Various events for CRUD operations
- **accessible_from:** gm

### encounter-tables-C051
- **name:** TableCard Component
- **type:** component
- **location:** `app/components/encounter-table/TableCard.vue`
- **game_concept:** Encounter table summary card
- **description:** Card displaying table name, description, entry count, density tier, level range. Links to table detail/edit.
- **inputs:** Props: table (EncounterTable)
- **outputs:** Selection/navigation
- **accessible_from:** gm

### encounter-tables-C052
- **name:** EntryRow Component
- **type:** component
- **location:** `app/components/encounter-table/EntryRow.vue`
- **game_concept:** Single species entry in table editor
- **description:** Displays species name, weight, probability percentage, optional level range override. Supports inline weight editing and removal.
- **inputs:** Props: entry, totalWeight
- **outputs:** Events: update, remove
- **accessible_from:** gm

### encounter-tables-C053
- **name:** ModificationCard Component
- **type:** component
- **location:** `app/components/encounter-table/ModificationCard.vue`
- **game_concept:** Sub-habitat modification card
- **description:** Displays a modification's name, entries (add/remove/override), and level range. Supports editing and deletion.
- **inputs:** Props: modification
- **outputs:** Events: edit, delete, manage entries
- **accessible_from:** gm

### encounter-tables-C054
- **name:** ImportTableModal Component
- **type:** component
- **location:** `app/components/encounter-table/ImportTableModal.vue`
- **game_concept:** JSON table import dialog
- **description:** Modal for pasting or uploading JSON to import an encounter table. Validates format and shows warnings for unmatched species.
- **inputs:** N/A
- **outputs:** Events: import, close
- **accessible_from:** gm

### encounter-tables-C055
- **name:** SignificancePanel Component (ptu-rule-088)
- **type:** component
- **location:** `app/components/encounter/SignificancePanel.vue`
- **game_concept:** Encounter significance tier selection
- **description:** Panel for selecting encounter significance tier (insignificant through legendary). Displays preset descriptions and allows custom multiplier within tier range.
- **inputs:** Props: significance settings
- **outputs:** Events: significance change
- **accessible_from:** gm

### encounter-tables-C056
- **name:** BudgetIndicator Component
- **type:** component
- **location:** `app/components/encounter/BudgetIndicator.vue`
- **game_concept:** Visual encounter balance indicator
- **description:** Displays the encounter budget analysis: enemy levels vs budget, ratio, difficulty assessment, color-coded indicator.
- **inputs:** Props: budget analysis data
- **outputs:** N/A (display only)
- **accessible_from:** gm

### encounter-tables-C057
- **name:** XpDistributionModal Component
- **type:** component
- **location:** `app/components/encounter/XpDistributionModal.vue`
- **game_concept:** Post-battle XP distribution
- **description:** Modal for distributing XP after encounter completion. Calculates total XP from enemy levels * significance, divides by player count. Shows per-player amounts.
- **inputs:** Props: encounter data, significance
- **outputs:** Events: distribute, close
- **accessible_from:** gm

### encounter-tables-C058
- **name:** XpDistributionResults Component
- **type:** component
- **location:** `app/components/encounter/XpDistributionResults.vue`
- **game_concept:** XP distribution results display
- **description:** Shows the results of XP distribution with per-player breakdowns.
- **inputs:** Props: distribution results
- **outputs:** N/A (display only)
- **accessible_from:** gm

## Capability Chains

### Chain 1: Table CRUD
1. **GM page** renders table list with TableCard components
2. **Store** manages tables state (loadTables, createTable, updateTable, deleteTable)
3. **API endpoints** handle DB operations with levelMin<=levelMax validation (bug-032)
4. **TableEditor** provides full editing interface
- **Accessible from:** gm only

### Chain 2: Entry Management
1. **TableEditor** displays EntryRow components
2. **Store** addEntry/updateEntry/removeEntry actions
3. **API endpoints** validate species existence, weight, level range
4. **Entry PUT** uses partial-update merge (refactoring-092)
- **Accessible from:** gm only

### Chain 3: Modification Management
1. **TableEditor** includes modification management
2. **ModificationCard** displays modification data
3. **Store** CRUD actions for modifications and their entries
4. **getResolvedEntries** getter merges parent+modification pools
- **Accessible from:** gm only

### Chain 4: Wild Pokemon Generation
1. **GM page** triggers generation from a table
2. **Store** generateFromTable action with count, modificationId, levelRange
3. **API** builds resolved pool, calls encounter-generation.service
4. **Service** performs diversity-enforced weighted random selection
5. **Results** include generated Pokemon with species, level, and metadata
- **Accessible from:** gm only

### Chain 5: Import/Export
1. **Export:** Store.exportTable triggers browser download via API URL
2. **Import:** ImportTableModal -> Store.importTable -> API validates and creates
3. **Import API** validates all level ranges, deduplicates names, reports unmatched species
- **Accessible from:** gm only

### Chain 6: Budget & XP Analysis
1. **Encounter UI** shows BudgetIndicator and SignificancePanel
2. **encounterBudget.ts** calculates budget, effective levels, difficulty
3. **XpDistributionModal** calculates and distributes post-battle XP
- **Accessible from:** gm only

## Accessibility Summary

| View | Capabilities |
|------|-------------|
| gm-only | ALL capabilities (C001-C058) |
| group | None |
| player | None |
| api-only | C030 (encounter-generation service, only called internally) |

## Missing Subsystems

### MS-1: Player Wild Encounter Interaction
- **subsystem:** No player-facing interface for wild encounters. Players cannot choose to flee, fight, or interact with generated wild Pokemon from their view.
- **actor:** player
- **ptu_basis:** PTU Chapter 8 (Wild Pokemon) describes players deciding whether to fight, capture, or flee from wild encounters.
- **impact:** Wild encounter management is entirely GM-driven. Players cannot respond to encounters from their own device.

### MS-2: Group View Wild Spawn Display
- **subsystem:** Wild spawn preview is served to group view via WildSpawnPreview state, but there is no interactive encounter table browsing for the group display.
- **actor:** group
- **ptu_basis:** In tabletop play, the table/projector would show the habitat and wild Pokemon visually.
- **impact:** Group view can show wild spawn previews but cannot browse or interact with encounter tables. Minimal gap -- appropriate for display-only projector.
