---
domain: encounter-tables
mapped_at: 2026-02-19T00:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 58
sources:
  api: 18 endpoints
  stores: 1 primary + 2 supporting
  composables: 2
  components: 11
  pages: 4
  types: 1 file (habitat.ts)
  prisma_models: 4
---

# App Capabilities: Encounter Tables

## Summary
- Total capabilities: 58
- Categories: CRUD(22), generation(8), UI-state(10), integration(10), data-transform(8)
- Layers: API(18), store(17), composable(8), component(11), page(4)

---

## Data Model Layer

### Prisma Models (4 models)

#### DM-001: EncounterTable Model
- **Fields:** id (uuid), name (string), description (string?), imageUrl (string?), levelMin (int, default 1), levelMax (int, default 10), density (string, default "moderate"), createdAt, updatedAt
- **Relations:** entries[] (EncounterTableEntry), modifications[] (TableModification)
- **File:** `app/prisma/schema.prisma`

#### DM-002: EncounterTableEntry Model
- **Fields:** id (uuid), speciesId (FK to SpeciesData), weight (int, default 10), levelMin (int?), levelMax (int?), tableId (FK to EncounterTable)
- **Constraints:** `@@unique([tableId, speciesId])` -- one entry per species per table
- **Cascade:** onDelete from parent EncounterTable
- **File:** `app/prisma/schema.prisma`

#### DM-003: TableModification Model (Sub-habitat)
- **Fields:** id (uuid), name (string), description (string?), parentTableId (FK to EncounterTable), levelMin (int?), levelMax (int?), densityMultiplier (float, default 1.0), createdAt, updatedAt
- **Relations:** entries[] (ModificationEntry)
- **Cascade:** onDelete from parent EncounterTable
- **File:** `app/prisma/schema.prisma`

#### DM-004: ModificationEntry Model
- **Fields:** id (uuid), speciesName (string -- NOT FK), weight (int?), remove (boolean, default false), levelMin (int?), levelMax (int?), modificationId (FK to TableModification)
- **Constraints:** `@@unique([modificationId, speciesName])` -- one entry per species per modification
- **Cascade:** onDelete from parent TableModification
- **Design note:** Uses speciesName (string) instead of speciesId (FK) to allow referencing species not in the parent table
- **File:** `app/prisma/schema.prisma`

### TypeScript Types (`app/types/habitat.ts`)

#### DM-005: Type System Constants
- `RarityPreset`: `'common' | 'uncommon' | 'rare' | 'very-rare' | 'legendary'`
- `RARITY_WEIGHTS`: `{ common: 10, uncommon: 5, rare: 3, 'very-rare': 1, legendary: 0.1 }`
- `DensityTier`: `'sparse' | 'moderate' | 'dense' | 'abundant'`
- `DENSITY_RANGES`: `{ sparse: {2,4}, moderate: {4,8}, dense: {8,12}, abundant: {12,16} }`

#### DM-006: Derived Types
- `LevelRange`: `{ min: number; max: number }`
- `ResolvedTableEntry`: parent + modification merge result with `source: 'parent' | 'modification' | 'added'`
- `GeneratedPokemon`: `{ speciesName, level, weight, source, rerolled }`

---

## API Layer (18 endpoints)

### Table CRUD

#### API-001: List All Tables
- **Route:** `GET /api/encounter-tables`
- **Response:** All tables with entries (species joined) and modifications (shallow -- no nested modification entries)
- **Sorting:** Alphabetical by name
- **Serialization:** `levelMin`/`levelMax` -> `{ min, max }` object; entry-level levelRange only included when both min/max non-null
- **File:** `app/server/api/encounter-tables/index.get.ts`

#### API-002: Create Table
- **Route:** `POST /api/encounter-tables`
- **Body:** `{ name (required), description?, imageUrl?, levelRange?: {min, max}, density? }`
- **Defaults:** levelMin=1, levelMax=10, density='moderate'
- **Validation:** name required (400); density validated against `['sparse', 'moderate', 'dense', 'abundant']` -- invalid values silently default to 'moderate'
- **File:** `app/server/api/encounter-tables/index.post.ts`

#### API-003: Get Single Table
- **Route:** `GET /api/encounter-tables/:id`
- **Response:** Full table with entries (species joined) and modifications (deep -- includes nested modification entries)
- **Validation:** id required (400), table must exist (404)
- **File:** `app/server/api/encounter-tables/[id].get.ts`

#### API-004: Update Table
- **Route:** `PUT /api/encounter-tables/:id`
- **Body:** `{ name?, description?, imageUrl?, levelRange?: {min, max}, density? }`
- **Behavior:** Density only updated if valid; otherwise silently preserved. Level range defaults to 1-10 if not provided.
- **Validation:** id required (400)
- **Note:** No explicit 404 check -- relies on Prisma throwing for missing records (hits generic 500 catch)
- **File:** `app/server/api/encounter-tables/[id].put.ts`

#### API-005: Delete Table
- **Route:** `DELETE /api/encounter-tables/:id`
- **Behavior:** Cascade deletes entries and modifications via Prisma schema
- **Validation:** id required (400), handles Prisma P2025 (record not found) as 404
- **File:** `app/server/api/encounter-tables/[id].delete.ts`

### Entry CRUD

#### API-006: Add Entry
- **Route:** `POST /api/encounter-tables/:id/entries`
- **Body:** `{ speciesId (required), weight? (default 10), levelRange?: {min, max} }`
- **Validation:** id required (400), speciesId required (400), table must exist (404), species must exist in SpeciesData (404), duplicate species in same table returns 409
- **File:** `app/server/api/encounter-tables/[id]/entries/index.post.ts`

#### API-007: Update Entry
- **Route:** `PUT /api/encounter-tables/:id/entries/:entryId`
- **Body:** `{ weight?, levelMin?: number|null, levelMax?: number|null }`
- **Validation:** weight >= 0.1 (400), levelMin/levelMax 1-100 or null (400), entry must exist and belong to table (404)
- **Note:** Does NOT validate levelMin <= levelMax
- **File:** `app/server/api/encounter-tables/[id]/entries/[entryId].put.ts`

#### API-008: Delete Entry
- **Route:** `DELETE /api/encounter-tables/:id/entries/:entryId`
- **Validation:** id required (400), entryId required (400), entry must exist (404), entry must belong to table (400)
- **File:** `app/server/api/encounter-tables/[id]/entries/[entryId].delete.ts`

### Modification CRUD

#### API-009: List Modifications
- **Route:** `GET /api/encounter-tables/:id/modifications`
- **Response:** All modifications for a table, ordered alphabetically, with their entries
- **Validation:** id required (400), table must exist (404)
- **Note:** Response does NOT include `densityMultiplier` -- unlike all other modification responses (likely a bug)
- **File:** `app/server/api/encounter-tables/[id]/modifications/index.get.ts`

#### API-010: Create Modification
- **Route:** `POST /api/encounter-tables/:id/modifications`
- **Body:** `{ name (required), description?, levelRange?: {min, max}, densityMultiplier? }`
- **Defaults:** densityMultiplier = 1.0
- **Validation:** id required (400), name required (400), table must exist (404), densityMultiplier clamped to [0.1, 5.0]
- **File:** `app/server/api/encounter-tables/[id]/modifications/index.post.ts`

#### API-011: Get Single Modification
- **Route:** `GET /api/encounter-tables/:id/modifications/:modId`
- **Response:** Modification with entries, includes densityMultiplier
- **Validation:** id, modId required (400), modification must exist (404), must belong to table (400)
- **File:** `app/server/api/encounter-tables/[id]/modifications/[modId].get.ts`

#### API-012: Update Modification
- **Route:** `PUT /api/encounter-tables/:id/modifications/:modId`
- **Body:** `{ name?, description?, levelRange?: {min, max}, densityMultiplier? }`
- **Behavior:** densityMultiplier clamped to [0.1, 5.0] if provided; not updated if omitted
- **Validation:** id, modId required (400), modification must exist (404), must belong to table (400)
- **File:** `app/server/api/encounter-tables/[id]/modifications/[modId].put.ts`

#### API-013: Delete Modification
- **Route:** `DELETE /api/encounter-tables/:id/modifications/:modId`
- **Behavior:** Cascade deletes modification entries via Prisma schema
- **Validation:** id, modId required (400), modification must exist (404), must belong to table (400)
- **File:** `app/server/api/encounter-tables/[id]/modifications/[modId].delete.ts`

### Modification Entry CRUD

#### API-014: Add Modification Entry
- **Route:** `POST /api/encounter-tables/:id/modifications/:modId/entries`
- **Body:** `{ speciesName (required), weight? (default 10), remove? (default false), levelRange?: {min, max} }`
- **Behavior:** If `remove=true`, weight stored as null. Uses speciesName (string) not speciesId (FK).
- **Validation:** speciesName required (400), modification must exist (404), must belong to table (400), duplicate speciesName in same modification returns 409
- **File:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts`

#### API-015: Delete Modification Entry
- **Route:** `DELETE /api/encounter-tables/:id/modifications/:modId/entries/:entryId`
- **Validation:** Full chain validation: id, modId, entryId required (400), modification must exist (404), mod belongs to table (400), entry must exist (404), entry belongs to modification (400)
- **File:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/[entryId].delete.ts`

### Generation

#### API-016: Generate Random Pokemon Encounter
- **Route:** `POST /api/encounter-tables/:id/generate`
- **Body:** `{ modificationId?, levelRange?: {min, max}, count? }`
- **Algorithm:**
  1. Build entry pool from parent table entries (Map by speciesName)
  2. Apply modification if provided: remove flagged entries, add/override others
  3. Determine spawn count: manual `count` clamped [1,10] OR density-based from `DENSITY_RANGES` scaled by `densityMultiplier`, clamped [1,10]
  4. Weighted random selection: random [0, totalWeight), iterate entries subtracting weights
  5. Per-Pokemon level: random within entry-specific or table-default range
- **Response:** `{ generated: [{speciesId, speciesName, level, weight, source}], meta: {tableId, tableName, modificationId, levelRange, density, densityMultiplier, spawnCount, totalPoolSize, totalWeight} }`
- **Validation:** id required (400), table not found (404), modification not found (404 if specified), empty pool or zero weight (400)
- **Note:** Hard cap of 10 truncates `dense` (8-12) and `abundant` (12-16) tiers
- **File:** `app/server/api/encounter-tables/[id]/generate.post.ts`

### Import/Export

#### API-017: Export Table as JSON
- **Route:** `GET /api/encounter-tables/:id/export`
- **Response:** Raw JSON file download (not `{success, data}` envelope)
- **Format:** `{ version: '1.0', exportedAt, table: { name, description, imageUrl, levelRange, entries: [{speciesName, weight, levelRange}], modifications: [{name, description, levelRange, entries: [{speciesName, weight, remove, levelRange}]}] } }`
- **Behavior:** Uses species names (not IDs) for portability. Sets Content-Disposition for file download. Filename sanitized (non-alphanumeric -> underscore).
- **Note:** Density is NOT included in the export format
- **File:** `app/server/api/encounter-tables/[id]/export.get.ts`

#### API-018: Import Table from JSON
- **Route:** `POST /api/encounter-tables/import`
- **Body:** Full export JSON format
- **Behavior:**
  1. Structural validation (version, table.name, levelRange)
  2. Name deduplication: appends `(1)`, `(2)`, etc. if name exists
  3. Species resolution: case-insensitive name lookup against SpeciesData; unmatched species silently skipped
  4. Nested creation via Prisma
- **Response:** `{ success, data: table, warnings?: string }` -- warnings list unmatched species
- **Note:** Does NOT validate/import density field
- **File:** `app/server/api/encounter-tables/import.post.ts`

---

## Store Layer

### Primary: `encounterTables` Store (`app/stores/encounterTables.ts`)

#### ST-001: State Management
- `tables: EncounterTable[]` -- cached table data
- `selectedTableId: string | null` -- UI selection tracking
- `loading: boolean` -- async loading indicator
- `error: string | null` -- last error message
- `filters: { search: string, sortBy: 'name'|'createdAt'|'updatedAt', sortOrder: 'asc'|'desc' }`

#### ST-002: Filtered/Sorted Tables Getter
- `filteredTables` -- case-insensitive search on name/description, then sort by selected field/direction
- Used by both encounter-tables list page and habitats list page

#### ST-003: Selected Table Getter
- `selectedTable` -- finds table by `selectedTableId`
- `getTableById(id)` -- parameterized getter for any table by ID

#### ST-004: Resolved Entries Getter (Core Business Logic)
- `getResolvedEntries(tableId, modificationId?)` -- merges parent table entries with optional modification
- Algorithm: Map keyed by speciesName, parent entries as base, then modification entries applied:
  - `remove=true` -> delete from map
  - Has weight -> override/add with `source: 'modification'` or `source: 'added'`
  - Level range cascade: modification entry > modification-level > existing entry > table default
- Returns `ResolvedTableEntry[]`

#### ST-005: Total Weight Getter
- `getTotalWeight(tableId, modificationId?)` -- sum of resolved entry weights

#### ST-006: Table CRUD Actions
- `loadTables()` -- GET all, replaces tables array
- `loadTable(id)` -- GET single, updates in-place or pushes
- `createTable(data)` -- POST, pushes to array
- `updateTable(id, data)` -- PUT, replaces at index
- `deleteTable(id)` -- DELETE, filters out, clears selection if matched

#### ST-007: Entry CRUD Actions
- `addEntry(tableId, data)` -- POST, reloads entire table (server generates ID + denormalized fields)
- `updateEntry(tableId, entryId, data)` -- PUT, mutates entry in-place (direct mutation, not immutable)
  - Transforms client `LevelRange` to API `levelMin`/`levelMax`
- `removeEntry(tableId, entryId)` -- DELETE, filters entry from local state

#### ST-008: Modification CRUD Actions
- `createModification(tableId, data)` -- POST, pushes with synthesized timestamps
- `updateModification(tableId, modId, data)` -- PUT, replaces at index preserving createdAt
- `deleteModification(tableId, modId)` -- DELETE, filters out

#### ST-009: Modification Entry CRUD Actions
- `addModificationEntry(tableId, modId, data)` -- POST, reloads entire table
- `removeModificationEntry(tableId, modId, entryId)` -- DELETE, filters entry

#### ST-010: Generation Action
- `generateFromTable(tableId, options?)` -- POST to generate endpoint
- Options: `{ count?, modificationId?, levelRange? }`
- Returns: `{ generated[], meta }` with full metadata

#### ST-011: UI State Actions
- `selectTable(id | null)` -- sets selectedTableId
- `setFilters(partial)` -- merges filters (immutable spread)
- `resetFilters()` -- resets to defaults

#### ST-012: Import/Export Actions
- `exportTable(tableId)` -- `window.location.href` navigation to export GET endpoint (browser download)
- `importTable(jsonData)` -- POST to import, pushes to local state, returns `{ table, warnings }`

#### ST-013: No WebSocket Integration
- Encounter tables store is purely REST-based
- Consistent with being a GM-only authoring tool, not a real-time collaborative feature

### Supporting: `groupView` Store (wild spawn subset, `app/stores/groupView.ts`)

#### ST-014: Wild Spawn Preview State
- `wildSpawnPreview: WildSpawnPreview | null`
- `hasWildSpawn` getter
- Interface: `{ id, pokemon: [{speciesId, speciesName, level}], tableName, timestamp }`

#### ST-015: Wild Spawn Actions
- `fetchWildSpawnPreview()` -- GET `/api/group/wild-spawn`
- `serveWildSpawn(tableName, pokemon[])` -- POST `/api/group/wild-spawn`
- `clearWildSpawnPreview()` -- DELETE `/api/group/wild-spawn`
- `setWildSpawnPreview(preview)` -- local state setter

### Supporting: Wild Spawn Server State (`app/server/utils/wildSpawnState.ts`)

#### ST-016: In-Memory Wild Spawn Singleton
- `getWildSpawnPreview()` / `setWildSpawnPreview()` / `clearWildSpawnPreview()`
- Server-side transient state (no DB persistence)
- Shared between GM POST and Group GET via 3 endpoints:
  - `GET /api/group/wild-spawn` -- fetch current preview
  - `POST /api/group/wild-spawn` -- set preview (validates non-empty pokemon array + tableName)
  - `DELETE /api/group/wild-spawn` -- clear preview

---

## Composable Layer

### `useTableEditor` (`app/composables/useTableEditor.ts`)

#### CO-001: Table Editor State Management
- Wraps `encounterTables` store with UI-specific form state
- Internal form interfaces: `NewEntryForm`, `NewModForm`, `EditModForm`, `EditSettingsForm`
- Factory functions for default form values
- Returns: table, loading, 4 modal visibility refs, 4 form state refs

#### CO-002: Computed Helpers
- `totalWeight` -- sum of entry weights
- `sortedEntries` -- entries sorted by weight descending

#### CO-003: Display Helpers
- `getDensityLabel(density)` -- capitalizes tier name (e.g., "moderate" -> "Moderate")
- `getSpawnRange(density)` -- returns min-max string from DENSITY_RANGES

#### CO-004: Entry Management Actions
- `handleSpeciesSelect(species)` -- updates form with selected species (immutable)
- `addEntry()` -- resolves weight from rarity preset or custom, creates entry via store, resets form
- `removeEntry(entry)` -- confirmation dialog, then store remove
- `updateEntryWeight(entry, weight)` -- store update for single field
- `updateEntryLevelRange(entry, levelRange | null)` -- store update + table reload

#### CO-005: Modification Management Actions
- `addModification()` -- creates sub-habitat with optional level range
- `editModification(mod)` -- populates edit form, opens modal
- `saveModification()` -- saves edited metadata via store
- `deleteModification(mod)` -- confirmation dialog, then store delete

#### CO-006: Settings Management
- `saveSettings()` -- saves table-level name, description, levelRange, density

#### CO-007: Lifecycle
- `onMounted` -> `refreshTable()` (loads table data)
- `useHead` -> dynamic page title "GM - {tableName}"

### `useEncounterCreation` (`app/composables/useEncounterCreation.ts`)

#### CO-008: Encounter/Scene Creation from Generated Pokemon
- `creating` / `error` -- reactive state
- `createWildEncounter(pokemon[], tableName)`:
  1. Creates encounter via `encounterStore.createEncounter(tableName, 'full_contact')`
  2. Adds wild Pokemon via `encounterStore.addWildPokemon(pokemon, 'enemies')`
  3. Serves encounter via `encounterStore.serveEncounter()`
  4. Navigates to `/gm`
- `addToScene(sceneId, pokemon[])` -- adds Pokemon one-by-one via `POST /api/scenes/{sceneId}/pokemon`
- `clearError()` -- resets error state

---

## Component Layer (11 components)

### encounter-table/ directory (5 components)

#### CP-001: EntryRow (`app/components/encounter-table/EntryRow.vue`)
- Single entry row with editable weight, chance percentage, level range override
- Props: entry, totalWeight, tableLevelRange
- Emits: remove, update-weight, update-level-range
- Computes chance as `(weight / totalWeight) * 100`
- Uses `usePokemonSprite()` for species sprite display

#### CP-002: TableCard (`app/components/encounter-table/TableCard.vue`)
- Clickable summary card linking to `/gm/encounter-tables/{id}`
- Shows: name, description, level badge, density badge (color-coded), entry count, modification count
- Top 5 Pokemon preview with rarity labels (>=10 Common, >=5 Uncommon, >=3 Rare, >=1 Very Rare, <1 Legendary)
- Sub-habitat modification tags

#### CP-003: ModificationCard (`app/components/encounter-table/ModificationCard.vue`)
- Sub-habitat editor with entries list and density controls
- Density preset buttons: 0.5x, 1x, 1.5x, 2x
- Shows effective spawn range based on parent density x multiplier
- Color-coded changes: green=add, red=remove, yellow=override
- Inline "Add Change" modal with PokemonSearchInput, action choice (Override/Remove), weight input
- Store actions: `updateModification()`, `addModificationEntry()`

#### CP-004: TableEditor (`app/components/encounter-table/TableEditor.vue`)
- Main full-page editor component with entries list, sub-habitats section, 4 inline modals
- Props: tableId, backLink, backLabel
- Slots: header-actions (scoped: {table}), after (scoped: {table})
- Add Entry modal: PokemonSearchInput, rarity dropdown (Common/Uncommon/Rare/Very Rare/Legendary/Custom), custom weight, level range override
- Add/Edit Modification modals: name, description, level range
- Settings modal: name, description, level range, density dropdown
- Delegates all state/actions to `useTableEditor` composable

#### CP-005: ImportTableModal (`app/components/encounter-table/ImportTableModal.vue`)
- JSON file import via drag-and-drop or file picker
- Accepts `.json` files
- Displays errors for invalid JSON, warnings for unmatched species
- Store action: `importTable(jsonData)`

### habitat/ directory (4 components)

#### CP-006: EncounterTableCard (`app/components/habitat/EncounterTableCard.vue`)
- Richer summary card linking to `/gm/habitats/{id}`
- Image (or tree icon placeholder), sprite grid (up to 8 previews with "+N" overflow)
- Density badge with spawn range numbers
- Modification tags
- `data-testid="encounter-table-card"` for Playwright tests

#### CP-007: EncounterTableModal (`app/components/habitat/EncounterTableModal.vue`)
- Create/edit modal for the Habitats page
- Create mode: name, description, level range, density, image URL
- Edit mode: additionally shows inline species entry management + modification management
- Weight presets: Common=10, Uncommon=5, Rare=2, Very Rare=1 (differs from TableEditor: no Legendary, Rare=2 vs 3)
- Store actions: `createTable()`, `updateTable()`, `addEntry()`, `loadTable()`, `removeEntry()`, `createModification()`, `deleteModification()`

#### CP-008: GenerateEncounterModal (`app/components/habitat/GenerateEncounterModal.vue`)
- Most feature-rich modal: generates wild Pokemon with multiple output targets
- Generation options: spawn count (auto/manual 1-10), modification selector, level range override
- Pool preview: top 10 resolved entries with weight percentages
- Results: selectable list with checkboxes, species name, level, source tag
- Select All / Select None bulk actions
- Output targets:
  - "Show on TV" -- serves wild spawn to Group View via `serveWildSpawn()`
  - "Clear TV" -- clears wild spawn overlay via `clearWildSpawnPreview()`
  - "New Encounter" -- creates combat encounter via `@add-to-encounter` emit
  - "Add to Scene" -- adds to narrative scene via `@add-to-scene` emit with scene selector dropdown
- Store usage: `encounterTables` (getResolvedEntries, generateFromTable), `groupView` (wild spawn)

#### CP-009: SpeciesAutocomplete (`app/components/habitat/SpeciesAutocomplete.vue`)
- Species search/autocomplete dropdown
- Loads all species from `/api/species` on mount
- Filters by name substring, shows max 20 results with type badges
- v-model binding returns speciesId

### scene/ directory (1 component)

#### CP-010: SceneHabitatPanel (`app/components/scene/SceneHabitatPanel.vue`)
- Collapsible side panel linking encounter tables to scenes
- Habitat selector dropdown for linking/unlinking
- Shows entry list with sprites, rarity labels, level info
- Per-entry "+" button for adding individual Pokemon (random level from entry range)
- "Generate Random" button for bulk generation
- Rarity labels: >=20% Common, >=10% Uncommon, >=5% Rare, <5% Very Rare (different thresholds from TableCard)
- Locally defines its own interfaces (does NOT import from types/habitat.ts)

### group/ directory (1 component)

#### CP-011: WildSpawnOverlay (`app/components/group/WildSpawnOverlay.vue`)
- Full-screen "Wild Pokemon Appeared!" display for Group View (TV/projector)
- Pokemon grid with circular sprite containers, level badges, species names
- Staggered pop-in animation (0.1s delay per slot)
- 4K media query support (3000px+ breakpoint, 144px sprites)
- Vue Transition for fade enter/leave
- Display-only -- no game logic or interaction

---

## Page Layer (4 pages)

#### PG-001: Encounter Tables List (`app/pages/gm/encounter-tables.vue`)
- Primary list page with filter bar (search, sort by, sort order)
- Create modal (inline, not using EncounterTableModal component)
- Import modal via ImportTableModal component
- Generate modal via `?generate=tableId` query parameter (deep-linkable)
- Scene integration: loads available scenes for add-to-scene action
- Uses `useEncounterCreation` for encounter/scene output
- Navigates to `/gm/encounter-tables/{id}` after create or import

#### PG-002: Encounter Table Detail (`app/pages/gm/encounter-tables/[id].vue`)
- Wraps `TableEditor` component with back-link to `/gm/encounter-tables`
- Header action: "Generate" button navigates to list page with `?generate={id}` query param

#### PG-003: Habitats List (`app/pages/gm/habitats/index.vue`)
- Alternative list page using EncounterTableCard and EncounterTableModal components
- Local search/sort (not using store filters -- implements its own computed)
- Create/edit via EncounterTableModal, delete via ConfirmModal
- Generate via GenerateEncounterModal (inline, no query param pattern)
- Encounter creation handled inline (not using useEncounterCreation composable)
- No import functionality

#### PG-004: Habitat Detail (`app/pages/gm/habitats/[id].vue`)
- Wraps `TableEditor` component with back-link to `/gm/habitats`
- Header actions: "Generate" button (opens modal inline), "Delete" button (opens ConfirmModal)
- Scene integration: loads available scenes for add-to-scene action
- Uses `useEncounterCreation` for encounter/scene output

---

## Cross-Cutting Capabilities

### INT-001: Encounter Table -> Combat Encounter Pipeline
- GenerateEncounterModal generates Pokemon -> "New Encounter" creates encounter + adds wild Pokemon + auto-serves to Group View + navigates to `/gm`
- Full workflow: `encounterStore.createEncounter()` -> `encounterStore.addWildPokemon()` -> `encounterStore.serveEncounter()`
- Available from: encounter-tables page (PG-001), habitats list (PG-003), habitat detail (PG-004)

### INT-002: Encounter Table -> Scene Integration
- GenerateEncounterModal "Add to Scene" -> adds Pokemon one-by-one via `POST /api/scenes/{sceneId}/pokemon`
- SceneHabitatPanel links habitat to scene, allows per-entry and bulk generation
- Available from: encounter-tables page (PG-001), habitat detail (PG-004), scene detail page

### INT-003: Wild Spawn TV Display Pipeline
- GenerateEncounterModal "Show on TV" -> `groupView.serveWildSpawn()` -> POST `/api/group/wild-spawn` -> in-memory singleton -> Group View polls/fetches -> WildSpawnOverlay renders
- "Clear TV" -> `groupView.clearWildSpawnPreview()` -> DELETE `/api/group/wild-spawn`
- No WebSocket push for wild spawn -- uses REST polling

### INT-004: JSON Import/Export Portability
- Export: species names (not IDs) for cross-instance portability
- Import: case-insensitive species name resolution, name deduplication, unmatched species warnings
- Density NOT included in export format (lost on round-trip)
- No authentication/authorization on import

### INT-005: Dual Page System (Encounter Tables vs Habitats)
- Two parallel page hierarchies: `/gm/encounter-tables` and `/gm/habitats`
- Both manage the same underlying data (EncounterTable model)
- Different component sets: TableCard vs EncounterTableCard, inline create modal vs EncounterTableModal
- Different feature coverage: encounter-tables has import, habitats has delete from detail page
- Habitats list does its own filtering (not using store filters)

---

## Capability Gaps and Inconsistencies

### GAP-001: Missing `densityMultiplier` in GET Modifications List
- `GET /api/encounter-tables/:id/modifications` (API-009) does not include `densityMultiplier` in response
- All other modification endpoints include it
- Store's `getResolvedEntries` getter may use stale multiplier data if loaded from this endpoint

### GAP-002: No Modification Entry Update Endpoint
- Can add and delete modification entries, but cannot update them
- To change a modification entry's weight/remove/levelRange, must delete and recreate

### GAP-003: Spawn Count Cap Truncates Density Tiers
- Generate endpoint (API-016) clamps spawn count to max 10
- `dense` tier (8-12) and `abundant` tier (12-16) are truncated
- DENSITY_RANGES constants suggest counts up to 16 should be possible

### GAP-004: Rarity Weight Inconsistencies Across Components
- TableEditor (CP-004): Common=10, Uncommon=5, Rare=3, Very Rare=1, Legendary=0.1
- EncounterTableModal (CP-007): Common=10, Uncommon=5, Rare=2, Very Rare=1 (no Legendary, Rare differs)
- habitat.ts constants (DM-005): Common=10, Uncommon=5, Rare=3, Very Rare=1, Legendary=0.1

### GAP-005: Rarity Label Inconsistencies Across Components
- TableCard (CP-002): >=10 Common, >=5 Uncommon, >=3 Rare, >=1 Very Rare, <1 Legendary
- SceneHabitatPanel (CP-010): >=20% Common, >=10% Uncommon, >=5% Rare, <5% Very Rare (percentage-based vs weight-based)

### GAP-006: Direct Mutation in Store
- `updateEntry` action directly mutates `entry.weight` and `entry.levelRange` in state (ST-007)
- Violates immutable patterns used elsewhere in the store

### GAP-007: Export/Import Density Loss
- Export format (API-017) does not include density field
- Import (API-018) does not read/apply density
- Round-trip export->import loses the table's density setting (defaults to 'moderate')

### GAP-008: SceneHabitatPanel Local Type Definitions
- CP-010 defines its own `EncounterTable` and `EncounterTableEntry` interfaces locally
- Does not import from `types/habitat.ts` -- risk of drift

### GAP-009: No Pagination
- `GET /api/encounter-tables` returns all tables with all entries and modifications
- No pagination, limit, or cursor support on any endpoint

### GAP-010: EncounterTableEntry Weight Type Mismatch
- Prisma model uses `Int` for weight
- API-007 update validates weight >= 0.1 (fractional)
- RARITY_WEIGHTS includes `legendary: 0.1` (fractional)
- Int storage would truncate 0.1 to 0
