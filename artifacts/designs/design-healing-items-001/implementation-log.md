# Implementation Log: design-healing-items-001

## P0 Implementation (2026-03-01)

Branch: `slave/2-dev-feature-020-p0-20260301`

### Section A: Healing Item Catalog Constants
- **Commit:** `c0940d17`
- **File:** `app/constants/healingItems.ts` (new)
- HealingItemDef interface with all PTU fields
- Full 14-item catalog (restoratives, cures, combined, revives)
- Helper functions: getRestorativeItems(), getCureItems(), getApplicableItems()
- ITEM_CATEGORY_LABELS for UI display

### Section B: Apply-Item Service
- **Commit:** `10677a83`
- **File:** `app/server/services/healing-item.service.ts` (new)
- validateItemApplication(): checks item exists, target state (fainted, full HP)
- applyHealingItem(): HP restoration via existing applyHealingToEntity (respects decree-017 injury cap)
- getEntityDisplayName(): extracts display name from combatant
- P0 processes hpAmount, healToFull, healToPercent. Status cure/revive stubbed for P1.

### Section C: Apply-Item API Endpoint
- **Commit:** `1f6bc2c4`
- **File:** `app/server/api/encounters/[id]/use-item.post.ts` (new)
- POST with {itemName, userId, targetId, targetAccepts}
- P0 category restriction: only 'restorative' items allowed
- Target refusal returns success without consuming item
- DB sync via syncHealingToDatabase, encounter state save
- WebSocket broadcast: item_used event

### Section D: Encounter Store Action
- **Commit:** `fa366600`
- **File:** `app/stores/encounter.ts` (modified)
- Added useItem() action calling POST /api/encounters/:id/use-item
- Returns itemResult with hpHealed, refused, repulsive flags
- Added StatusCondition to imports

### Section E: Basic GM UI
- **Commit:** `3cbd84e2` - useHealingItems composable
  - **File:** `app/composables/useHealingItems.ts` (new)
  - getApplicableItems() filters by category and target state
  - useItem() delegates to store with loading/error tracking
  - getItemsByCategory() for grouped display
- **Commit:** `4ecf6b19` - UseItemModal component
  - **File:** `app/components/encounter/UseItemModal.vue` (new)
  - Target selector dropdown (all alive combatants)
  - Applicable item list with PhFirstAidKit icons, HP amount, cost, description
  - Apply Item button, Target Refuses button, Cancel
  - Result display (success with HP healed, or refusal warning)
  - Error display for validation failures
- **Commit:** `ca6034d7` - CombatantCard integration
  - **File:** `app/components/encounter/CombatantCard.vue` (modified)
  - Added "Item" button with PhFirstAidKit icon in GM actions area
  - UseItemModal rendered conditionally, closes on item use

### Deviations from Spec
- None. Implementation follows spec-p0.md exactly.

### P1 Readiness
- Catalog includes all P1 items (cures, revives, combined) with data
- Service has validation stubs for non-restorative categories
- API endpoint has P0 category whitelist (easy to expand)
- Composable getApplicableItems has allowedCategories parameter

## P0 Fix Cycle (2026-03-02)

Branch: `slave/2-dev-feature-020-fix-20260302`
Review: code-review-267 CHANGES_REQUIRED (3H + 4M), rules-review-243 APPROVED.

### H1: Remove Double Validation
- **Commit:** `188a1257`
- **File:** `app/server/api/encounters/[id]/use-item.post.ts` (modified)
- Removed explicit validateItemApplication() call — applyHealingItem() validates internally
- Removed unused validateItemApplication import

### H2 + M1: UseItemModal Composable Reuse + Effective Max HP
- **Commit:** `50e5a29d`
- **File:** `app/components/encounter/UseItemModal.vue` (modified)
- Replaced local getCombatantName() with useCombatantDisplay() composable
- Target dropdown now shows effective max HP (injury-reduced, decree-017) instead of raw maxHp
- Removed unused Pokemon/HumanCharacter type imports

### H3 + M2: Dead Stub Removal + Ternary Cleanup
- **Commit:** `c5847923`
- **Files:** `app/constants/healingItems.ts`, `app/server/services/healing-item.service.ts` (modified)
- Deleted getApplicableItems() stub from constants (real logic in composable)
- Replaced convoluted nested ternary with getEntityDisplayName(target) call

### M4: Hardcoded Gap Fix
- **Commit:** `cae215af`
- **File:** `app/components/encounter/CombatantCard.vue` (modified)
- Replaced `gap: 3px` with `gap: $spacing-xs` (4px) for use-item button

### M3: App Surface Documentation
- **Commit:** `976d9bc6`
- **File:** `.claude/skills/references/app-surface.md` (modified)
- Added use-item endpoint to encounters API list
- Added healing item system paragraph (constants, service, composable, modal, store, WebSocket)
- Added healing-item.service.ts to server services table
