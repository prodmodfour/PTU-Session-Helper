# Codebase Refactoring Plan

## Overview

This plan identifies files requiring refactoring based on size, mixed concerns, code duplication, and architectural improvements. The codebase is a PTU (Pokemon Tabletop United) session helper with Vue 3, Pinia stores, and a Nuxt server.

## Current Large Files

| File | Lines | Issue |
|------|-------|-------|
| `app/pages/gm/index.vue` | 1,245 | Monolithic page with mixed concerns |
| `app/components/encounter/MoveTargetModal.vue` | 1,214 | Large modal with complex logic |
| `app/stores/encounter.ts` | 924 | Large store (already partially split) |
| `app/components/encounter/GMActionModal.vue` | 916 | Large modal with extensive styling |
| `app/composables/useGridRendering.ts` | 747 | Long rendering composable |
| `app/composables/useGridInteraction.ts` | 589 | Complex interaction handling |
| `app/components/encounter/CombatantCard.vue` | 574 | Many responsibilities |
| `app/components/character/CharacterModal.vue` | 536 | Pokemon/Human dual handling |

---

## Phase 1: Extract Shared Utilities (High Impact, Low Risk)

### 1.1 Create `useCombatantDisplay` Composable

**Files affected:** 8+ files with duplicated `getCombatantName` function

**Action:** Create `app/composables/useCombatantDisplay.ts`
- Extract `getCombatantName(combatant)` function
- Extract `getDisplayName(entity)` function
- Consolidate Pokemon vs Human type checking logic

**Expected benefit:** Removes ~100 lines of duplicated code

---

### 1.2 Create Shared Type Badge Styles

**Files affected:** 13 files with type badge styling

**Action:** Extract to `app/assets/scss/components/_type-badges.scss`
- Move all `type-badge--{type}` styles to shared partial
- Import in files that need type badges

**Expected benefit:** Removes ~400 lines of duplicated SCSS

---

### 1.3 Create Shared Modal Styles

**Files affected:** 18 files with modal overlay patterns

**Action:** Extract to `app/assets/scss/components/_modal.scss`
- Move `.modal-overlay` base styles
- Move `.modal`, `.modal__header`, `.modal__body`, `.modal__footer` patterns

**Expected benefit:** Removes ~300 lines of duplicated modal styling

---

## Phase 2: Split Encounter Store Further

### 2.1 Remove Wrapper Methods

**File:** `app/stores/encounter.ts` (924 lines)

**Action:** The store already delegates to `encounterGrid` and `encounterCombat` stores. Consider having consumers use domain stores directly for VTT and combat operations.

**Expected benefit:** Reduces encounter.ts by ~200 lines

---

## Phase 3: Split GM Index Page

### 3.1 Extract EncounterHeader Component

**Action:** Create `app/components/gm/EncounterHeader.vue`
- Extract header template and styles
- Include serve/unserve, undo/redo, start/next turn buttons

**Expected benefit:** Removes ~150 lines

---

### 3.2 Extract CombatantSides Component

**Action:** Create `app/components/gm/CombatantSides.vue`
- Extract three-column sides grid
- Accept combatants as props, emit add/remove/action events

**Expected benefit:** Removes ~100 lines

---

### 3.3 Extract ViewTabsRow Component

**Action:** Create `app/components/gm/ViewTabsRow.vue`
- Extract view tabs and damage mode toggle

**Expected benefit:** Removes ~80 lines

---

### 3.4 Extract Action Handlers to Composable

**Action:** Create `app/composables/useEncounterActions.ts`
- Extract handler functions (handleDamage, handleHeal, handleStages, etc.)

**Expected benefit:** Removes ~230 lines, testable logic

---

## Phase 4: Refactor Large Modals

### 4.1 Refactor MoveTargetModal (1,214 lines)

**Action:**
- Move effectiveness badge styles to shared SCSS
- Extract combat calculation logic to `useMoveCalculation.ts`

**Expected benefit:** Reduces modal to ~600 lines

---

### 4.2 Refactor GMActionModal (916 lines)

**Action:**
- Move type badge and condition styling to shared SCSS

**Expected benefit:** Reduces modal to ~500 lines

---

## Phase 5: Optional Grid Composable Splits

### 5.1 Extract Drawing Functions

**File:** `app/composables/useGridRendering.ts` (747 lines)

**Action:** Create `app/composables/useCanvasDrawing.ts`
- Extract `drawGrid`, `drawTerrain`, `drawTerrainPattern` functions
- Extract measurement and fog of war drawing functions

**Expected benefit:** Smaller files, focused concerns

---

## Priority Order

| Priority | Phase | Effort | Impact | Description |
|----------|-------|--------|--------|-------------|
| 1 | 1.1 | Low | High | Extract useCombatantDisplay composable |
| 2 | 1.2 | Low | Medium | Shared type badge styles |
| 3 | 1.3 | Low | Medium | Shared modal styles |
| 4 | 3.1 | Low | Medium | Extract EncounterHeader |
| 5 | 3.4 | Medium | High | Extract useEncounterActions |
| 6 | 3.2 | Low | Medium | Extract CombatantSides |
| 7 | 4.1 | Medium | Medium | Refactor MoveTargetModal |
| 8 | 4.2 | Low | Medium | Refactor GMActionModal |
| 9 | 2.1 | Medium | Medium | Split encounter store |
| 10 | 5.1 | Low | Low | Split grid composables (optional) |

---

## Success Criteria

- [ ] No file exceeds 800 lines (soft limit 500)
- [ ] `getCombatantName` function exists in only one location
- [ ] Type badge styles defined in single SCSS partial
- [ ] Modal overlay styles defined in single SCSS partial
- [ ] encounter.ts under 500 lines
- [ ] gm/index.vue under 600 lines
- [ ] All existing tests pass
- [ ] No visual regressions

---

## Progress Tracking

### Completed
- [x] Phase 1 (prior session): Split GridCanvas.vue into composables (1,518 → 307 lines)
- [x] Phase 1 (prior session): Split group/index.vue into components (1,757 → 346 lines)
- [x] Phase 1 (prior session): Extract NewEncounterForm and CombatLogPanel from gm/index.vue
- [x] Phase 1 (prior session): Create encounterGrid.ts and encounterCombat.ts stores

### In Progress
- [ ] Phase 1.1: Create useCombatantDisplay composable
- [ ] Phase 1.2: Shared type badge styles
- [ ] Phase 1.3: Shared modal styles
