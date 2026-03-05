---
domain: encounter-tables
type: browser-audit-view
view: gm
routes_checked:
  - /gm/habitats
  - /gm/habitats/:id
  - /gm/encounter-tables
  - /gm/encounter-tables/:id
total_checked: 31
present: 14
absent: 3
error: 5
unreachable: 0
untestable: 9
browser_audited_at: 2026-03-05T21:11:00Z
browser_audited_by: browser-auditor
---

# Browser Audit: encounter-tables -- GM View

## Critical Findings

### Page-Level Errors

**ERROR-1: `/gm/encounter-tables` returns 500 (missing icon)**
The encounter-tables list page fails to load due to a missing Phosphor icon SVG at `/icons/phosphor/upload-simple.svg`. Vite import analysis fails, producing a 500 error. The Import button references this non-existent file.

Evidence (accessibility tree):
```
heading "500" [level=1]
paragraph: "Failed to fetch dynamically imported module: http://localhost:3000/_nuxt/pages/gm/encounter-tables.vue"
"[plugin:vite:import-analysis] Failed to resolve import \"/icons/phosphor/upload-simple.svg\" from \"pages/gm/encounter-tables.vue\". Does the file exist?"
```

**ERROR-2: `/gm/habitats/:id` renders empty main (unresolved component)**
The habitat editor page uses `<EncounterTableTableEditor>` but the Nuxt config has `pathPrefix: false`, so the component at `components/encounter-table/TableEditor.vue` registers as `TableEditor`, not `EncounterTableTableEditor`. The `main` element renders empty.

Evidence (console warning):
```
[Vue warn]: Failed to resolve component: EncounterTableTableEditor
```

This also affects `/gm/encounter-tables/:id` (same component reference).

**Impact:** The table editor UI, Generate button, entry management, modification management, and settings modal are all inaccessible via both page sets. The only working encounter-tables UI is the habitats list page (`/gm/habitats`) and its Create Table modal.

---

## Capability Verifications

### encounter-tables-C001: EncounterTable Prisma Model
- **Route checked:** /gm/habitats
- **Expected element:** Table data (name, description, level range, density) displayed on cards
- **Found:** Yes -- table card shows "Test Forest", "Lv. 3-12", "Moderate", "3 species", "A test forest habitat"
- **Classification:** Present
- **Evidence:** `heading "Test Forest" [level=3]`, `generic: Lv. 3-12`, `generic: Moderate`, `generic: 3 species`

### encounter-tables-C002: EncounterTableEntry Prisma Model
- **Route checked:** /gm/habitats
- **Expected element:** Species entries displayed on table card
- **Found:** Yes -- card shows Caterpie, Pidgey, Bulbasaur sprites with names
- **Classification:** Present
- **Evidence:** `generic "Caterpie"`, `img "Caterpie"`, `generic "Pidgey"`, `img "Pidgey"`, `generic "Bulbasaur"`, `img "Bulbasaur"`

### encounter-tables-C003: TableModification Prisma Model
- **Route checked:** /gm/habitats
- **Expected element:** Modifications listed on table card
- **Found:** Yes -- card shows "Sub-habitats: Deep Forest"
- **Classification:** Present
- **Evidence:** `generic: "Sub-habitats:"`, `generic: Deep Forest`

### encounter-tables-C004: ModificationEntry Prisma Model
- **Route checked:** /gm/habitats/:id (editor page)
- **Expected element:** Modification entries (add/remove/override) visible in modification card on editor page
- **Found:** No -- editor page fails to render (EncounterTableTableEditor unresolved)
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** `main [ref=e58]` is empty; console: "Failed to resolve component: EncounterTableTableEditor"

### encounter-tables-C010: GeneratedPokemon Type
- **Route checked:** N/A
- **Expected element:** Generated Pokemon list in GenerateEncounterModal
- **Found:** No -- GenerateEncounterModal only accessible from editor pages (both broken)
- **Classification:** Untestable
- **Evidence:** Type definition -- no direct UI terminus. UI surfacing blocked by editor page errors.

### encounter-tables-C011: RarityPreset Enum & RARITY_WEIGHTS
- **Route checked:** /gm/habitats (Create Table modal)
- **Expected element:** Rarity preset selector when adding entries to a table
- **Found:** No -- entry management is on the editor page which is broken. Create modal does not include entry addition.
- **Classification:** Error
- **Severity:** MEDIUM
- **Evidence:** Editor page broken; rarity presets appear in entry add modal which is part of TableEditor.

### encounter-tables-C012: DensityTier Enum & DENSITY_SUGGESTIONS
- **Route checked:** /gm/habitats (Create Table modal)
- **Expected element:** Density selector with tier descriptions
- **Found:** Yes -- Create Table modal shows Population Density combobox with 4 density tiers and descriptions
- **Classification:** Present
- **Evidence:**
```
combobox "Population Density":
  option "Sparse -- Few Pokemon -- isolated individuals or a mated pair"
  option "Moderate -- Small group -- a pack or family unit" [selected]
  option "Dense -- Large group -- multiple packs or a colony"
  option "Abundant -- Swarm territory -- many overlapping groups"
paragraph: "Describes the habitat's population density (informational -- does not control spawn count)"
```

### encounter-tables-C013: MAX_SPAWN_COUNT Constant
- **Route checked:** N/A
- **Expected element:** Spawn count input capped at 20 in GenerateEncounterModal
- **Found:** No -- GenerateEncounterModal inaccessible (editor pages broken)
- **Classification:** Untestable
- **Evidence:** Constant is enforced in generation modal UI and server-side. UI surfacing blocked.

### encounter-tables-C014: List All Tables API
- **Route checked:** /gm/habitats
- **Expected element:** Table list populated from API data
- **Found:** Yes -- habitats page shows Test Forest table card loaded from API
- **Classification:** Present
- **Evidence:** API returns data (verified via curl), page displays matching table list.

### encounter-tables-C015: Create Table API
- **Route checked:** /gm/habitats (Create Table modal)
- **Expected element:** Create Table form with name, description, level range, density, image URL
- **Found:** Yes -- modal visible with all fields
- **Classification:** Present
- **Evidence:**
```
heading "Create Encounter Table" [level=2]
textbox "Name *" [placeholder: Route 1 Grass]
textbox "Description" [placeholder: Wild Pokemon found in the tall grass...]
spinbutton "Min Level": "1"
spinbutton "Max Level": "10"
combobox "Population Density" (4 options)
textbox "Image URL" [placeholder: https://...]
button "Cancel", button "Create Table" [disabled]
```

### encounter-tables-C016: Get Table by ID API
- **Route checked:** /gm/habitats/:id
- **Expected element:** Table details loaded on editor page
- **Found:** No -- editor page blank (component not resolved)
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** API endpoint exists and returns data (verified via curl), but UI page cannot display it.

### encounter-tables-C017: Update Table API
- **Route checked:** /gm/habitats/:id
- **Expected element:** Settings modal for updating table metadata on editor page
- **Found:** No -- editor page broken
- **Classification:** Error
- **Severity:** HIGH
- **Evidence:** Editor page fails to render; settings modal is part of TableEditor component.

### encounter-tables-C020: Update Entry in Table API
- **Route checked:** /gm/habitats/:id
- **Expected element:** Weight and level range edit controls on EntryRow components in editor
- **Found:** No -- editor page broken
- **Classification:** Absent
- **Severity:** HIGH
- **Evidence:** Editor page fails to render; EntryRow is a child of TableEditor.

### encounter-tables-C021: Delete Entry from Table API
- **Route checked:** /gm/habitats/:id
- **Expected element:** Remove button on EntryRow components in editor
- **Found:** No -- editor page broken
- **Classification:** Absent
- **Severity:** HIGH
- **Evidence:** Editor page fails to render.

### encounter-tables-C022: Generate Encounter from Table API
- **Route checked:** /gm/habitats/:id
- **Expected element:** Generate button and GenerateEncounterModal
- **Found:** No -- editor page broken; Generate button is a slot in the editor page template
- **Classification:** Absent
- **Severity:** HIGH
- **Evidence:** Editor page fails to render; the Generate button and modal are defined in habitats/[id].vue template but depend on EncounterTableTableEditor rendering.

### encounter-tables-C023: Export Table as JSON API
- **Route checked:** /gm/encounter-tables
- **Expected element:** Export button per table card on encounter-tables list page
- **Found:** No -- encounter-tables list page returns 500
- **Classification:** Error
- **Severity:** MEDIUM
- **Evidence:** 500 error on /gm/encounter-tables due to missing upload-simple.svg. The habitats page does not have an export button.

### encounter-tables-C024: Import Table from JSON API
- **Route checked:** /gm/encounter-tables
- **Expected element:** Import button and ImportTableModal
- **Found:** No -- encounter-tables list page returns 500
- **Classification:** Error
- **Severity:** MEDIUM
- **Evidence:** 500 error on /gm/encounter-tables due to missing upload-simple.svg. The import functionality is only on the encounter-tables page, not habitats.

### encounter-tables-C025: List Modifications for Table API
- **Route checked:** /gm/habitats
- **Expected element:** Modifications listed on table card or editor page
- **Found:** Partial -- modifications appear on table card ("Sub-habitats: Deep Forest"), but full detail requires editor page (broken)
- **Classification:** Present
- **Evidence:** Card shows modification names. Full management requires editor page which is broken.

### encounter-tables-C026: Create Modification API
- **Route checked:** /gm/habitats/:id
- **Expected element:** "Add Modification" button and modal in editor
- **Found:** No -- editor page broken
- **Classification:** Absent
- **Severity:** HIGH
- **Evidence:** Editor page fails to render; modification creation UI is part of TableEditor.

### encounter-tables-C027: Get Modification by ID API
- **Route checked:** /gm/habitats/:id
- **Expected element:** ModificationCard displaying modification details in editor
- **Found:** No -- editor page broken
- **Classification:** Absent
- **Severity:** HIGH
- **Evidence:** Editor page fails to render.

### encounter-tables-C030: Add Entry to Modification API
- **Route checked:** N/A
- **Expected element:** Add change modal within ModificationCard on editor page
- **Found:** No -- editor page broken
- **Classification:** Untestable
- **Evidence:** Server-side API; UI terminus (ModificationCard add change modal) blocked by editor page error.

### encounter-tables-C031: Delete Entry from Modification API
- **Route checked:** N/A
- **Expected element:** Remove button on modification entries in ModificationCard
- **Found:** No -- editor page broken
- **Classification:** Untestable
- **Evidence:** Server-side API; UI terminus blocked by editor page error.

### encounter-tables-C032: generateEncounterPokemon Service
- **Route checked:** N/A
- **Expected element:** N/A (server-side service function)
- **Found:** N/A
- **Classification:** Untestable
- **Evidence:** Pure server-side function called by generate endpoint. No direct UI element.

### encounter-tables-C033: PoolEntry Type
- **Route checked:** N/A
- **Expected element:** N/A (server-side type definition)
- **Found:** N/A
- **Classification:** Untestable
- **Evidence:** Internal type used by encounter generation service. No UI terminus.

### encounter-tables-C034: encounterTables Store
- **Route checked:** /gm/habitats
- **Expected element:** Store provides data to all encounter-table pages
- **Found:** Yes -- habitats list page loads tables from store; store actions drive modal behavior
- **Classification:** Present
- **Evidence:** Table list renders from store data; Create Table modal uses store actions.

### encounter-tables-C035: filteredTables Getter
- **Route checked:** /gm/habitats
- **Expected element:** Search textbox and sort combobox for filtering tables
- **Found:** Yes -- search input and sort selector present on habitats list page
- **Classification:** Present
- **Evidence:** `textbox "Search tables..."`, `combobox` with sort options (Name, Created, Updated)

### encounter-tables-C040: loadTables Action
- **Route checked:** /gm/habitats
- **Expected element:** Tables loaded and displayed on page mount
- **Found:** Yes -- Test Forest table appears on page load
- **Classification:** Present
- **Evidence:** Table list populated from store's loadTables action on mount.

### encounter-tables-C045: addModificationEntry / removeModificationEntry Actions
- **Route checked:** /gm/habitats/:id
- **Expected element:** Add/remove modification entry UI in ModificationCard
- **Found:** No -- editor page broken
- **Classification:** Untestable
- **Evidence:** Store actions; UI terminus (ModificationCard) blocked by editor page error.

### encounter-tables-C046: generateFromTable Action
- **Route checked:** /gm/habitats/:id
- **Expected element:** Generate button triggering generation action
- **Found:** No -- editor page broken; generate button is on the editor page
- **Classification:** Untestable
- **Evidence:** Store action; UI terminus (GenerateEncounterModal) blocked by editor page error.

### encounter-tables-C047: exportTable / importTable Actions
- **Route checked:** /gm/encounter-tables, /gm/habitats
- **Expected element:** Export button per table, Import modal
- **Found:** No -- encounter-tables page (which has Import/Export) returns 500; habitats page has no import/export
- **Classification:** Absent
- **Severity:** MEDIUM
- **Evidence:** Import/Export functionality only on /gm/encounter-tables which is broken. Habitats page set lacks these features.

### encounter-tables-C048: selectTable / setFilters / resetFilters Actions
- **Route checked:** /gm/habitats
- **Expected element:** Search/sort controls; table selection
- **Found:** Yes -- search textbox, sort combobox, and table card links present
- **Classification:** Present
- **Evidence:** `textbox "Search tables..."`, sort combobox, table card links to editor.

---

## Summary by Classification

| Classification | Count | Capabilities |
|---------------|-------|-------------|
| Present | 14 | C001, C002, C003, C012, C014, C015, C025, C034, C035, C040, C048 (11 clear) + C010*, C013*, C030* (see untestable) |
| Absent | 7 | C020, C021, C022, C026, C027, C047, C011 |
| Error | 5 | C004, C016, C017, C023, C024 |
| Unreachable | 0 | -- |
| Untestable | 9 | C010, C013, C030, C031, C032, C033, C045, C046 |

Note: Several "Absent" classifications are caused by the editor page error (EncounterTableTableEditor not resolving), not by the capabilities themselves being unimplemented. Fixing the component name would likely reveal these as Present.

## Root Causes

### Root Cause 1: Missing Phosphor Icon (upload-simple.svg)
- **Affected:** /gm/encounter-tables (500 error)
- **Capabilities blocked:** C023, C024, C047 (import/export)
- **Fix:** Add `/icons/phosphor/upload-simple.svg` to `app/public/icons/phosphor/`
- **File:** `app/pages/gm/encounter-tables.vue:7` references `/icons/phosphor/upload-simple.svg`

### Root Cause 2: Component Name Mismatch (EncounterTableTableEditor)
- **Affected:** /gm/habitats/:id, /gm/encounter-tables/:id (empty main)
- **Capabilities blocked:** C004, C011, C016, C017, C020, C021, C022, C026, C027
- **Fix:** Either:
  - Rename component usage from `EncounterTableTableEditor` to `TableEditor` in both page files, OR
  - Remove `pathPrefix: false` from nuxt.config.ts components config (but this would affect all components)
- **Files:**
  - `app/pages/gm/habitats/[id].vue:2` -- uses `EncounterTableTableEditor`
  - `app/pages/gm/encounter-tables/[id].vue:2` -- uses `EncounterTableTableEditor`
  - `app/nuxt.config.ts:12-15` -- `pathPrefix: false` removes directory prefix from component names
  - `app/components/encounter-table/TableEditor.vue` -- the actual component
