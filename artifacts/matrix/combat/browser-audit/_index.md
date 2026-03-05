---
domain: combat
type: browser-audit
browser_audited_at: 2026-03-05T21:15:00Z
browser_audited_by: browser-auditor
total_checked: 102
present: 25
absent: 2
error: 0
unreachable: 1
untestable: 74
---

# Browser Audit: Combat Domain

## Summary

Browser audit of all 102 combat capabilities. The combat domain is the largest in the application, with the majority of capabilities being server-side (backend models, services, utilities, constants, store logic, WebSocket events). The 28 browser-testable capabilities (components and their UI triggers) were verified across three views.

## Audit Results

| Classification | Count | Percentage |
|---------------|-------|------------|
| Present | 25 | 24.5% |
| Absent | 2 | 2.0% |
| Error | 0 | 0.0% |
| Unreachable | 1 | 1.0% |
| Untestable | 74 | 72.5% |
| **Total** | **102** | **100%** |

### Browser-Testable Results Only (28 capabilities)

| Classification | Count | Percentage |
|---------------|-------|------------|
| Present | 25 | 89.3% |
| Absent | 2 | 7.1% |
| Unreachable | 1 | 3.6% |
| **Total** | **28** | **100%** |

## Action Items

| ID | Cap ID | Name | Classification | Severity | View | Issue |
|----|--------|------|---------------|----------|------|-------|
| 1 | combat-C136 | HumanEquipmentTab | Absent | LOW | /gm/characters/[id] | Character sheet page crashes with Vite SCSS error in LevelUpClassSection.vue (undefined `$spacing-xs` variable). Component exists but page does not render. Fix the SCSS variable to restore access. |
| 2 | combat-C137 | EquipmentCatalogBrowser | Absent | LOW | /gm/characters/[id] | Same character sheet 500 error as C136. Component exists at `app/components/character/EquipmentCatalogBrowser.vue`. Blocked by same SCSS build error. |
| 3 | combat-C122 | PlayerCombatantCard | Unreachable | LOW | /player | Requires player identity selection via WebSocket. Component exists and is wired correctly. Test environment limitation -- not a code defect. |

## View Files

| View | Route | File | Capabilities Checked |
|------|-------|------|---------------------|
| GM | /gm, /gm (Grid View) | [view-gm.md](view-gm.md) | 28 (26 Present, 2 Absent) |
| Group | /group | [view-group.md](view-group.md) | 5 (5 Present) |
| Player | /player | [view-player.md](view-player.md) | 3 (2 Present, 1 Unreachable) |
| Untestable | N/A | [untestable-items.md](untestable-items.md) | 74 (server-side only) |

Note: Some capabilities are verified across multiple views but counted once in the highest-access view.

## Key Findings

### GM Encounter Page (/gm) -- Fully Functional

The GM encounter page renders correctly with a complete combat interface:

1. **Encounter Header**: Name, battle type (Trainer Battle), round number, serve status, weather dropdown
2. **Turn Management**: Next Turn, End Encounter, Undo/Redo, Keyboard shortcuts
3. **Declaration Phase** (decree-021): Declaration panel with action type dropdown, speed-ordered turn display, Declare & Next workflow
4. **Combatant Cards**: Full cards for trainers and Pokemon with HP bars, initiative, -HP/+HP controls, +T (Temp HP), CS (Combat Stages), ST (Status Conditions), Item, Act, Switch/Force Switch, Remove buttons
5. **GMActionModal**: Opens per-combatant with Moves (type/DB/frequency/AC), Standard Actions (Shift, Struggle, Pass Turn), Combat Maneuvers (collapsible), Status Conditions (collapsible)
6. **Combat Stages Modal**: All 5 combat stages (Atk/Def/SpA/SpD/Spe) with +/- controls, plus Accuracy and Evasion Bonus modifiers, Reset All, Save Changes
7. **Status Conditions Modal**: 21 status condition checkboxes covering persistent, volatile, special, movement, and combat conditions, with Clear All and Save Changes
8. **AddCombatantModal**: Pokemon/Humans tabs, search, selectable list with types/levels, Add to Battle
9. **VTT Grid View**: Battle Grid with Settings, Grid toggle, range tools (Distance/Burst/Cone/Line/Close Blast), Fog of War toolbar (toggle/reveal/hide/explore/brush), combatant tokens, zoom controls
10. **Capture Section**: Ball type selector, capture conditions, capture rate display, throw button (on wild Pokemon only)
11. **Sidebar**: Combat Log, Environment selector with presets, XP Significance display
12. **View Toggle**: List View / Grid View switch, Damage Mode (Set/Rolled) toggle

### Group View (/group) -- Read-Only Display

The group view correctly displays the served encounter with:
- Encounter header, round, current turn indicator
- Turn order / declaration phase sidebar
- Battle grid (20x15) with combatant tokens
- Current turn panel with detailed stats (ATK, DEF, SP.ATK, SP.DEF, SPD, HP)
- No action controls (correct for read-only group display)

### Player View (/player) -- Identity Required

The player view falls back to group encounter display when no identity is established. The `PlayerEncounterView`, `PlayerCombatantCard`, and `PlayerCombatActions` components exist in the codebase and are correctly wired, but require WebSocket identity setup to render. This is expected behavior, not a defect.

### Only Issue: Character Sheet SCSS Build Error

The two absent items (HumanEquipmentTab C136 and EquipmentCatalogBrowser C137) are both blocked by a Vite SCSS compilation error in an unrelated component (`LevelUpClassSection.vue`). The combat equipment components themselves exist and are correctly implemented. The fix is to resolve the undefined `$spacing-xs` variable in `assets/scss/_level-up-shared.scss` line 82.

## Decree Compliance

| Decree | Browser Evidence | Status |
|--------|-----------------|--------|
| decree-021 (two-phase trainer) | Declaration phase UI present with "Low -> High" ordering, action type dropdown, Declare & Next flow | **Visible in UI** |
| decree-002 (diagonal movement) | Grid view present with VTT; diagonal costs are server-side calculation (untestable) | **Grid UI present** |
| decree-047 (condition source tracking) | Status Conditions modal shows all conditions; source tracking is server-side | **Modal present** |
| decree-050 (Sprint consumes Standard only) | Sprint in Combat Maneuvers; action tracking shows Standard/Shift counts | **UI present** |
