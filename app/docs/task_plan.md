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

## Phase 2: Habitat System (Encounter Tables) 🔄 IN PROGRESS
**Status**: In Progress

### Tasks
- [x] Create EncounterTable API endpoints (CRUD)
- [x] Create TableModification API endpoints (CRUD)
- [x] Create ModificationEntry API endpoints (add/remove)
- [x] Create Pinia store for encounter tables
- [ ] Create UI page for managing encounter tables (`/gm/habitats`)
- [ ] Create EncounterTableCard component
- [ ] Create EncounterTableEditor component
- [ ] Create ModificationEditor component
- [ ] Create SpeciesAutocomplete component (search SpeciesData)
- [ ] Add weight presets (common=10, uncommon=5, rare=2, very-rare=1)

### E2E Testing (Phase 2)
- [ ] `tests/e2e/habitats.spec.ts`:
  - [ ] Navigate to habitats page
  - [ ] Create new encounter table
  - [ ] Add species entries with weights
  - [ ] Edit table metadata (name, description, level range)
  - [ ] Create table modification (sub-habitat)
  - [ ] Add/remove entries from modification
  - [ ] Delete encounter table
  - [ ] Verify species autocomplete works

---

## Phase 3: Wild Encounter Generation
**Status**: Pending

### Tasks
- [ ] Create encounter generation algorithm (weighted random)
- [ ] Create `/api/encounter-tables/[id]/generate` endpoint
- [ ] Add level range enforcement
- [ ] Add modification selection for generation
- [ ] Create GenerateEncounterModal component
- [ ] Add batch generation support (generate multiple Pokemon)
- [ ] Add "shiny chance" optional modifier

### E2E Testing (Phase 3)
- [ ] `tests/e2e/encounter-generation.spec.ts`:
  - [ ] Select encounter table
  - [ ] Generate single wild Pokemon
  - [ ] Verify generated Pokemon is from table entries
  - [ ] Verify level is within table range
  - [ ] Generate with modification applied
  - [ ] Generate batch of Pokemon
  - [ ] Add generated Pokemon to encounter

---

## Phase 4: VTT Grid System - Foundation
**Status**: Pending

### Tasks
- [ ] Create GridCanvas component (HTML5 Canvas)
- [ ] Implement grid rendering (hex/square options)
- [ ] Add zoom and pan controls
- [ ] Create TokenRenderer component
- [ ] Implement token placement via drag-and-drop
- [ ] Add grid coordinate display
- [ ] Store token positions in combatant data

### E2E Testing (Phase 4)
- [ ] `tests/e2e/vtt-grid.spec.ts`:
  - [ ] Enable grid in encounter settings
  - [ ] Verify grid renders correctly
  - [ ] Drag token to new position
  - [ ] Verify token position persists
  - [ ] Test zoom in/out
  - [ ] Test pan functionality
  - [ ] Verify grid shows on Group View

---

## Phase 5: VTT Grid System - Advanced Features
**Status**: Pending

### Tasks
- [ ] Implement distance/range calculation
- [ ] Add movement ruler overlay
- [ ] Create terrain marking tools
- [ ] Add fog of war for GM
- [ ] Implement token size scaling (1x1, 2x2, 3x3)
- [ ] Add initiative order visual indicators
- [ ] Background image support

### E2E Testing (Phase 5)
- [ ] `tests/e2e/vtt-advanced.spec.ts`:
  - [ ] Measure distance between tokens
  - [ ] Place terrain markers
  - [ ] Toggle fog of war
  - [ ] Resize token
  - [ ] Upload background image
  - [ ] Verify large tokens render correctly

---

## Phase 6: Encounter Library System
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

---

## Phase 7: Set/Rolled Damage Toggle
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

---

## Phase 8: Integration & Polish
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

---

## Phase 9: Documentation & Deployment
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

### Playwright MCP Integration
For interactive E2E testing during development:
1. Start dev server: `npm run dev`
2. Use Puppeteer MCP tools to interact with browser
3. Capture screenshots for visual verification
4. Test real-time WebSocket updates
