# PTU Session Helper - Implementation Plan

## Overview
Implementing 5 major features for the Pokemon Tabletop United Session Helper application.

---

## Phase 1: Foundation - Data Models & Schema Updates ✅ COMPLETE
**Status**: Complete

### Tasks
- [x] Update Prisma schema with GridConfig, EncounterTable, TableModification models
- [x] Update TypeScript types in `types/index.ts`
- [x] Update all encounter API endpoints to include gridConfig
- [x] Fix test fixtures to match updated types
- [x] Verify build passes
- [x] Verify all unit tests pass (234 tests)

### E2E Testing (Phase 1)
- N/A - Schema/backend changes only, no UI changes

---

## Phase 2: Habitat System (Encounter Tables) ✅ COMPLETE
**Status**: Complete

### Tasks
- [x] Create EncounterTable API endpoints (CRUD)
- [x] Create TableModification API endpoints (CRUD)
- [x] Create ModificationEntry API endpoints (add/remove)
- [x] Create Pinia store for encounter tables
- [x] Create UI page for managing encounter tables (`/gm/habitats`)
- [x] Create EncounterTableCard component
- [x] Create EncounterTableModal component (editor)
- [x] Create SpeciesAutocomplete component (search SpeciesData)
- [x] Add weight presets (common=10, uncommon=5, rare=2, very-rare=1)

### E2E Testing (Phase 2) ✅
- [x] `tests/e2e/habitats.spec.ts`:
  - [x] Navigate to habitats page
  - [x] Create new encounter table
  - [x] Add species entries with weights
  - [x] Edit table metadata (name, description, level range)
  - [x] Create table modification (sub-habitat)
  - [x] Add/remove entries from modification
  - [x] Delete encounter table
  - [x] Verify species autocomplete works

### Playwright MCP Testing (Phase 2)
Interactive testing with Playwright MCP server:

```bash
# 1. Start dev server
npm run dev

# 2. Use Playwright MCP tools for interactive testing
```

**Playwright MCP Tools to Use:**
- `mcp__playwright__browser_navigate` - Navigate to `/gm/habitats`
- `mcp__playwright__browser_click` - Click "New Table" button
- `mcp__playwright__browser_fill` - Fill form inputs
- `mcp__playwright__browser_screenshot` - Capture UI state for verification

**Test Scenarios:**
1. Create table: Navigate → Click "New Table" → Fill name → Save
2. Add entries: Edit table → Use species autocomplete → Verify entry added
3. Modifications: Add modification → Verify it appears in table

---

## Phase 3: Wild Encounter Generation ✅ COMPLETE
**Status**: Complete

### Tasks
- [x] Create encounter generation algorithm (weighted random)
- [x] Create `/api/encounter-tables/[id]/generate` endpoint
- [x] Add level range enforcement
- [x] Add modification selection for generation
- [x] Create GenerateEncounterModal component
- [x] Add batch generation support (generate multiple Pokemon)
- [x] Create `/api/encounters/[id]/wild-spawn` endpoint
- [x] Add `addWildPokemon` action to encounter store
- [x] Integrate generated Pokemon with encounter system

### E2E Testing (Phase 3) ✅
- [x] `tests/e2e/encounter-generation.spec.ts`:
  - [x] Open generate modal from table card
  - [x] Display table info (name, level range)
  - [x] Set generation count
  - [x] Select modification to apply
  - [x] Override level range
  - [x] Cancel modal
  - [x] API endpoint tests (generate, wild-spawn)
  - [x] Add to encounter integration tests

### Playwright MCP Testing (Phase 3)
Interactive testing with Playwright MCP server:

**Playwright MCP Tools to Use:**
- `mcp__playwright__browser_navigate` - Navigate to `/gm/habitats`
- `mcp__playwright__browser_click` - Click "Generate" on table card
- `mcp__playwright__browser_fill` - Set count, level override inputs
- `mcp__playwright__browser_select` - Select modification from dropdown
- `mcp__playwright__browser_screenshot` - Capture generated Pokemon results

**Test Scenarios:**
1. Generate single: Open modal → Click Generate → Verify results
2. Generate batch: Set count=5 → Generate → Verify 5 Pokemon appear
3. With modification: Select modification → Generate → Verify pool reflects mod
4. Add to encounter: Generate → Click "Add to Encounter" → Verify combatants added

---

## Phase 4: VTT Grid System - Foundation ⏳ PENDING
**Status**: Pending

### Tasks
- [ ] Create GridCanvas component (HTML5 Canvas)
- [ ] Implement grid rendering (hex/square options)
- [ ] Add zoom and pan controls
- [ ] Create TokenRenderer component
- [ ] Implement token placement via drag-and-drop
- [ ] Add grid coordinate display
- [ ] Store token positions in combatant data
- [ ] Add background image support

### E2E Testing (Phase 4)
- [ ] `tests/e2e/vtt-grid.spec.ts`:
  - [ ] Enable grid in encounter settings
  - [ ] Verify grid renders correctly
  - [ ] Drag token to new position
  - [ ] Verify token position persists
  - [ ] Test zoom in/out
  - [ ] Test pan functionality
  - [ ] Verify grid shows on Group View

### Playwright MCP Testing (Phase 4)
Interactive testing with Playwright MCP server:

**Playwright MCP Tools to Use:**
- `mcp__playwright__browser_navigate` - Navigate to encounter with grid enabled
- `mcp__playwright__browser_click` - Click on grid cells
- `mcp__playwright__browser_drag_and_drop` - Drag tokens to new positions
- `mcp__playwright__browser_screenshot` - Capture grid state for visual verification
- `mcp__playwright__browser_evaluate` - Execute JS to test canvas interactions

**Test Scenarios:**
1. Grid rendering: Enable grid → Screenshot → Verify grid lines visible
2. Token placement: Drag combatant token → Drop on grid cell → Verify position stored
3. Zoom: Use zoom controls → Verify grid scales correctly
4. Pan: Drag canvas → Verify viewport moves
5. Background: Upload image → Verify renders behind grid

**Canvas-specific Testing:**
```javascript
// Use browser_evaluate to interact with canvas
const canvas = document.querySelector('[data-testid="grid-canvas"]')
const ctx = canvas.getContext('2d')
// Verify canvas dimensions, pixel data, etc.
```

---

## Phase 5: VTT Grid System - Advanced Features ⏳ PENDING
**Status**: Pending

### Tasks
- [ ] Implement distance/range calculation
- [ ] Add movement ruler overlay
- [ ] Create terrain marking tools
- [ ] Add fog of war for GM
- [ ] Implement token size scaling (1x1, 2x2, 3x3)
- [ ] Add initiative order visual indicators
- [ ] Add line-of-sight checking

### E2E Testing (Phase 5)
- [ ] `tests/e2e/vtt-advanced.spec.ts`:
  - [ ] Measure distance between tokens
  - [ ] Place terrain markers
  - [ ] Toggle fog of war
  - [ ] Resize token
  - [ ] Verify large tokens render correctly
  - [ ] Test ruler tool

### Playwright MCP Testing (Phase 5)
Interactive testing with Playwright MCP server:

**Playwright MCP Tools to Use:**
- `mcp__playwright__browser_click` - Select terrain tools, toggle fog
- `mcp__playwright__browser_drag_and_drop` - Draw ruler between points
- `mcp__playwright__browser_screenshot` - Capture fog of war, terrain markers
- `mcp__playwright__browser_evaluate` - Verify distance calculations

**Test Scenarios:**
1. Distance measurement: Select ruler → Drag between tokens → Verify distance display
2. Terrain: Select terrain tool → Click grid → Verify marker appears
3. Fog of war: Toggle fog → Screenshot → Verify areas hidden
4. Token sizes: Select large token → Place on grid → Verify 2x2/3x3 rendering
5. Initiative indicators: Verify current turn token has visual indicator

---

## Phase 6: Encounter Library System ⏳ PENDING
**Status**: Pending

### Tasks
- [ ] Create EncounterTemplate model and API
- [ ] Create template CRUD endpoints
- [ ] Create EncounterLibraryPage component
- [ ] Add "Save as Template" functionality
- [ ] Add "Load from Template" functionality
- [ ] Add template categories/tags
- [ ] Add template search/filter

### E2E Testing (Phase 6)
- [ ] `tests/e2e/encounter-library.spec.ts`:
  - [ ] Create encounter and save as template
  - [ ] Browse encounter templates
  - [ ] Search templates by name
  - [ ] Filter templates by tag
  - [ ] Load template into new encounter
  - [ ] Edit template metadata
  - [ ] Delete template

### Playwright MCP Testing (Phase 6)
Interactive testing with Playwright MCP server:

**Playwright MCP Tools to Use:**
- `mcp__playwright__browser_navigate` - Navigate to `/gm/library`
- `mcp__playwright__browser_click` - Click save/load buttons, select templates
- `mcp__playwright__browser_fill` - Fill search, template name inputs
- `mcp__playwright__browser_screenshot` - Capture library list, template details

**Test Scenarios:**
1. Save template: Create encounter → Click "Save as Template" → Fill name → Save
2. Browse library: Navigate to library → Verify templates listed
3. Search: Type in search → Verify filtering works
4. Load template: Select template → Click "Load" → Verify encounter created
5. Tags: Add tags to template → Filter by tag → Verify results

---

## Phase 7: Set/Rolled Damage Toggle ⏳ PENDING
**Status**: Pending

### Tasks
- [ ] Add damage mode setting (set/rolled) to app config
- [ ] Update damage calculation logic
- [ ] Add dice rolling integration for rolled mode
- [ ] Create DamageRoller component
- [ ] Add damage preview before applying
- [ ] Store damage mode preference

### E2E Testing (Phase 7)
- [ ] `tests/e2e/damage-modes.spec.ts`:
  - [ ] Toggle damage mode in settings
  - [ ] Apply set damage to combatant
  - [ ] Roll damage with dice
  - [ ] Verify damage preview shows correctly
  - [ ] Verify mode persists across sessions

### Playwright MCP Testing (Phase 7)
Interactive testing with Playwright MCP server:

**Playwright MCP Tools to Use:**
- `mcp__playwright__browser_navigate` - Navigate to settings, encounter
- `mcp__playwright__browser_click` - Toggle damage mode, click roll buttons
- `mcp__playwright__browser_screenshot` - Capture damage preview, dice results
- `mcp__playwright__browser_evaluate` - Verify damage calculations

**Test Scenarios:**
1. Set damage mode: Select attack → Verify fixed damage shown → Apply
2. Rolled damage mode: Toggle to rolled → Select attack → Click roll → Verify random result
3. Preview: Initiate attack → Verify preview shows before applying
4. Persistence: Set mode → Reload page → Verify mode remembered

---

## Phase 8: Integration & Polish ⏳ PENDING
**Status**: Pending

### Tasks
- [ ] Integrate wild generation with encounter workflow
- [ ] Add keyboard shortcuts documentation
- [ ] Performance optimization for large encounters
- [ ] Add loading states and error handling
- [ ] Improve mobile responsiveness
- [ ] Add data export/import functionality

### E2E Testing (Phase 8)
- [ ] `tests/e2e/integration.spec.ts`:
  - [ ] Full workflow: create table → generate wild → add to encounter → run combat
  - [ ] Verify WebSocket sync between GM and Group views
  - [ ] Test export/import functionality
  - [ ] Verify performance with 20+ combatants

### Playwright MCP Testing (Phase 8)
Interactive testing with Playwright MCP server:

**Playwright MCP Tools to Use:**
- `mcp__playwright__browser_navigate` - Navigate through full workflow
- `mcp__playwright__browser_click` - Execute complete user journey
- `mcp__playwright__browser_screenshot` - Capture each workflow step
- `mcp__playwright__browser_evaluate` - Measure performance, verify WebSocket

**Test Scenarios:**
1. Full workflow: Create habitat → Generate wild → Add to encounter → Run combat turns
2. WebSocket sync: Open GM view → Open Group view → Make change → Verify sync
3. Export/Import: Export encounter → Delete → Import → Verify restored
4. Performance: Add 20+ combatants → Verify UI remains responsive

**Multi-tab Testing:**
```javascript
// Open GM and Group views in parallel
// Use browser_evaluate to verify WebSocket synchronization
```

---

## Phase 9: Documentation & Deployment ⏳ PENDING
**Status**: Pending

### Tasks
- [ ] Update CLAUDE.md with new features
- [ ] Create user guide documentation
- [ ] Add inline help tooltips
- [ ] Final testing pass
- [ ] Production deployment preparation

### E2E Testing (Phase 9)
- [ ] Full regression test suite
- [ ] Cross-browser testing (Chrome, Firefox)
- [ ] Smoke tests for production

### Playwright MCP Testing (Phase 9)
Interactive testing with Playwright MCP server:

**Playwright MCP Tools to Use:**
- `mcp__playwright__browser_navigate` - Full regression navigation
- `mcp__playwright__browser_screenshot` - Visual regression screenshots
- `mcp__playwright__browser_evaluate` - Cross-browser compatibility checks

**Test Scenarios:**
1. Full regression: Run through all features end-to-end
2. Cross-browser: Test in Chrome, Firefox, Edge
3. Visual regression: Compare screenshots against baseline
4. Smoke tests: Core functionality quick verification

---

## Testing Strategy

### Unit Tests
- All stores, utilities, and API handlers
- Minimum 80% coverage
- Run with: `npm run test`

### E2E Tests (Playwright)
- Critical user journeys
- GM and Group view interactions
- WebSocket synchronization
- Run with: `npx playwright test`

### Playwright MCP Server Integration

The Playwright MCP server enables interactive E2E testing during development. This is especially useful for:
- Testing canvas-based UI (VTT grid)
- Debugging complex interactions
- Visual verification with screenshots
- Testing WebSocket synchronization across tabs

#### Setup

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Playwright MCP is configured in `~/.claude.json`:**
   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["-y", "@anthropics/mcp-playwright"]
       }
     }
   }
   ```

3. **Restart Claude Code after configuration changes**

#### Available Playwright MCP Tools

| Tool | Purpose |
|------|---------|
| `mcp__playwright__browser_navigate` | Navigate to URLs |
| `mcp__playwright__browser_click` | Click elements |
| `mcp__playwright__browser_fill` | Fill input fields |
| `mcp__playwright__browser_select` | Select dropdown options |
| `mcp__playwright__browser_drag_and_drop` | Drag and drop operations |
| `mcp__playwright__browser_screenshot` | Capture screenshots |
| `mcp__playwright__browser_evaluate` | Execute JavaScript |
| `mcp__playwright__browser_wait_for_selector` | Wait for elements |

#### Best Practices

1. **Always screenshot before and after interactions** - Helps verify state changes
2. **Use data-testid selectors** - More reliable than class/tag selectors
3. **Wait for network idle** - Ensure API calls complete before assertions
4. **Test both GM and Group views** - Verify both perspectives work correctly
5. **Check WebSocket sync** - Open multiple tabs to test real-time updates
