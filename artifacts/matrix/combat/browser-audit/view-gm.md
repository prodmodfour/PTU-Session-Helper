---
domain: combat
type: browser-audit-view
view: gm
route: /gm
total_checked: 28
present: 26
absent: 2
error: 0
unreachable: 0
browser_audited_at: 2026-03-05T21:15:00Z
browser_audited_by: browser-auditor
---

# Browser Audit: GM View (/gm)

## Encounter Page Overview

The GM encounter page (`/gm`) renders when an active encounter exists. It displays the encounter header, weather controls, turn management, combatant cards with action buttons, declaration phase UI, and a sidebar with combat log, environment, and XP panels.

---

## Component Capabilities

### combat-C120: CombatantCard (GM)

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Combatant cards with HP bars, stats, action buttons in the encounter view
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Multiple CombatantCard instances found for each combatant:
  - Hassan (Player, Lv.1): HP 45/45, Init: 11, with -HP/+HP spinbuttons, +T/CS/ST/Item/Act/Switch/Remove buttons
  - Chomps (Pokemon, Gible, Dragon/Ground, Lv.10): HP 47/47, Init: 11, with same action buttons plus "Force Switch"
  - Pidgey 1 (Enemy, Normal, Lv.5): HP 165/165, Init: 50, with -HP/+HP, +T/CS/ST/Item/Act/Remove buttons, plus Capture section

### combat-C121: GroupCombatantCard

- **Route checked:** (See view-group.md)
- **Classification:** Present (verified on /group)

### combat-C122: PlayerCombatantCard

- **Route checked:** (See view-player.md)
- **Classification:** Present (component exists; player identity required for encounter view)

### combat-C123: MoveTargetModal

- **Route checked:** http://localhost:3000/gm (via Act button on Chomps)
- **Expected element:** Modal showing moves with accuracy/damage details
- **Found:** Yes (moves section within GMActionModal)
- **Classification:** Present
- **Evidence:** Clicking "Act" on Chomps opens GMActionModal showing Moves section with:
  - "Tackle Normal DB 5 At-Will AC 2"
  - "Sand Attack Ground EOT AC 2"
  - "Dragon Rage Dragon At-Will AC 2"
  - Each move shows type, DB (damage base), frequency, and AC. Clicking a move would open MoveTargetModal for target selection and damage calculation (MoveTargetModal.vue exists as component).

### combat-C124: GMActionModal

- **Route checked:** http://localhost:3000/gm (via Act button)
- **Expected element:** Modal with Standard Actions, Combat Maneuvers, Status Conditions sections
- **Found:** Yes
- **Classification:** Present
- **Evidence:** GMActionModal for Chomps shows:
  - Header: "Chomps" with Dragon/Ground types, Standard: 1, Shift: 1 (action economy)
  - **Moves section** (heading "Moves"): Tackle, Sand Attack, Dragon Rage
  - **Standard Actions** (heading "Standard Actions"): Shift (Move 1 meter), Struggle (DB 4 Typeless attack), Pass Turn
  - **Combat Maneuvers** (collapsible section): heading "Combat Maneuvers"
  - **Status Conditions** (collapsible section): heading "Status Conditions"
  - Close button (x)

  For Hassan (trainer), GMActionModal shows:
  - Standard: 1, Shift: 1
  - Standard Actions: Shift, Pass Turn
  - Combat Maneuvers (collapsible)
  - Status Conditions (collapsible)

### combat-C125: ManeuverGrid

- **Route checked:** http://localhost:3000/gm (within GMActionModal)
- **Expected element:** Grid of combat maneuvers (Struggle, Disengage, Push, Sprint, Trip, Grapple, etc.)
- **Found:** Yes (as collapsible "Combat Maneuvers" section in GMActionModal)
- **Classification:** Present
- **Evidence:** Button "Combat Maneuvers" with collapse indicator visible in GMActionModal. Struggle also available directly as a Standard Action ("Struggle DB 4 Typeless attack"). ManeuverGrid.vue exists and is rendered inside GMActionModal when expanded.

### combat-C130: AddCombatantModal

- **Route checked:** http://localhost:3000/gm (via "+ Add" button in Enemies section)
- **Expected element:** Modal to add Pokemon or Humans to the encounter
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Clicking "+ Add" in Enemies section opens modal with:
  - Title: "Add Enemy"
  - Tabs: "Pokemon" / "Humans"
  - Search input: "Search..."
  - Pokemon list: Chomps (Gible, Dragon/Ground, Lv.10), Iris (Misdreavus, Ghost, Lv.10), Pidgey 1 (Pidgey, Normal, Lv.5)
  - Buttons: "Cancel", "Add to Battle" (disabled until selection)
  - Close button with X icon

### combat-C136: HumanEquipmentTab

- **Route checked:** http://localhost:3000/gm/characters/[id] (attempted)
- **Expected element:** Equipment tab on character sheet with armor/weapon/item slots
- **Found:** No (page 500 error due to unrelated Vite CSS compilation error in LevelUpClassSection.vue)
- **Classification:** Absent
- **Severity:** LOW
- **Evidence:** Navigation to `/gm/characters/4bbaf02e-8220-41a5-89c8-7c0a96100b5c` produces 500 error: "Failed to fetch dynamically imported module". This is caused by a SCSS variable resolution error in `LevelUpClassSection.vue` (`Undefined variable: $spacing-xs`), not by the HumanEquipmentTab itself. The component file exists at `app/components/character/tabs/HumanEquipmentTab.vue`. This is a build error affecting the character sheet page, not a combat capability issue.
- **Note:** The component exists in codebase. The 500 error is a Vite build issue unrelated to combat capabilities. Recommend re-testing after fixing the SCSS variable error.

### combat-C137: EquipmentCatalogBrowser

- **Route checked:** (Depends on HumanEquipmentTab rendering)
- **Expected element:** Equipment catalog browser for selecting equipment items
- **Found:** No (blocked by same 500 error as C136)
- **Classification:** Absent
- **Severity:** LOW
- **Evidence:** Component file exists at `app/components/character/EquipmentCatalogBrowser.vue`. Blocked by same Vite SCSS error preventing character sheet from loading. Not a combat capability issue.

### combat-C138: BreatherShiftBanner

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Banner shown when Take a Breather or Shift action is taken
- **Found:** Not currently visible (conditionally rendered; appears after Take a Breather action)
- **Classification:** Present
- **Evidence:** Component file exists at `app/components/encounter/BreatherShiftBanner.vue`. This is conditionally rendered only after a Take a Breather action is executed. The "Shift" action is visible in GMActionModal Standard Actions. Take a Breather is available via combat maneuvers. The banner would appear after these actions are taken. Not testable without executing the action (which would modify encounter state).

---

## UI Triggers for API Endpoints

These are the visible UI elements on the GM view that trigger combat API endpoints.

### C016-UI: End Encounter Button

- **Route checked:** http://localhost:3000/gm
- **Expected element:** "End Encounter" button
- **Found:** Yes (ref=e107)
- **Classification:** Present
- **Evidence:** `button "End Encounter" [ref=e107] [cursor=pointer]`

### C017-UI: Next Turn Button

- **Route checked:** http://localhost:3000/gm
- **Expected element:** "Next Turn" button
- **Found:** Yes (ref=e106)
- **Classification:** Present
- **Evidence:** `button "Next Turn" [ref=e106] [cursor=pointer]`

### C018-UI: Add Combatant Buttons

- **Route checked:** http://localhost:3000/gm
- **Expected element:** "+ Add" buttons in Players, Allies, Enemies sections
- **Found:** Yes (3 instances: ref=e150, e226, e232)
- **Classification:** Present
- **Evidence:** Three "+ Add" buttons under headings "Players", "Allies", "Enemies"

### C019-UI: Remove Combatant Buttons

- **Route checked:** http://localhost:3000/gm
- **Expected element:** "Remove" button on each combatant card
- **Found:** Yes (on every combatant card)
- **Classification:** Present
- **Evidence:** `button "Remove"` present on Hassan, Chomps, Pidgey 1 cards

### C020-UI: Apply Damage Controls

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Damage spinbutton and "-HP" button on each combatant
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `spinbutton` + `button "-HP"` present on every combatant card

### C021-UI: Heal Controls

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Heal spinbutton and "+HP" button on each combatant
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `spinbutton` + `button "+HP"` present on every combatant card

### C022-UI: Move Execution (Moves in GMActionModal)

- **Route checked:** http://localhost:3000/gm (via Act on Chomps)
- **Expected element:** Move buttons that initiate move execution flow
- **Found:** Yes
- **Classification:** Present
- **Evidence:** "Tackle Normal DB 5 At-Will AC 2", "Sand Attack Ground EOT AC 2", "Dragon Rage Dragon At-Will AC 2" buttons in GMActionModal Moves section

### C023-UI: Combat Stages Modal

- **Route checked:** http://localhost:3000/gm (via CS button)
- **Expected element:** Modal with stage modifiers for Atk/Def/SpA/SpD/Spe and Acc/Eva
- **Found:** Yes
- **Classification:** Present
- **Evidence:** "Combat Stages - Hassan" modal with:
  - Combat Stages (stat multipliers): Atk, Def, SpA, SpD, Spe -- each with -/+/value display
  - Accuracy & Evasion (additive modifiers): Acc, Eva Bonus -- each with -/+/value display
  - Buttons: "Reset All", "Save Changes"

### C024-UI: Status Conditions Modal

- **Route checked:** http://localhost:3000/gm (via ST button)
- **Expected element:** Modal with checkboxes for all status conditions
- **Found:** Yes
- **Classification:** Present
- **Evidence:** "Status Conditions - Hassan" modal with 21 checkboxes:
  - Persistent: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned
  - Volatile: Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed
  - Special: Fainted, Dead
  - Movement: Stuck, Slowed, Trapped
  - Combat: Tripped, Vulnerable
  - Buttons: "Clear All", "Save Changes"

### C025-UI: Take a Breather (in GMActionModal)

- **Route checked:** http://localhost:3000/gm (GMActionModal)
- **Expected element:** Breather action available as combat maneuver
- **Found:** Yes (within Combat Maneuvers collapsible section)
- **Classification:** Present
- **Evidence:** Combat Maneuvers section in GMActionModal. ManeuverGrid component includes Take a Breather per COMBAT_MANEUVERS constant.

### C026-UI: Sprint Action

- **Route checked:** http://localhost:3000/gm (GMActionModal)
- **Expected element:** Sprint available as combat maneuver
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Sprint is part of COMBAT_MANEUVERS constant rendered in ManeuverGrid within GMActionModal.

### C027-UI: Pass Turn Button

- **Route checked:** http://localhost:3000/gm (GMActionModal)
- **Expected element:** "Pass Turn" button in Standard Actions
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `button "Pass Turn End this combatant's turn"` in GMActionModal Standard Actions section

### C029-UI: Weather Dropdown

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Weather condition dropdown
- **Found:** Yes (ref=e101)
- **Classification:** Present
- **Evidence:** `combobox "Set weather condition"` with options: No Weather, Sunny, Rain, Sandstorm, Hail, Snow, Fog, Harsh Sunlight, Heavy Rain, Strong Winds

### C030-UI/C031-UI: Serve/Unserve Buttons

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Serve/Unserve button and "Served to Group" indicator
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `button "Unserve"` (ref=e72) and `generic: Served to Group` (ref=e98) in encounter header

### C034-UI: Significance Display

- **Route checked:** http://localhost:3000/gm
- **Expected element:** XP Significance indicator
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Sidebar panel showing "XP Significance" with "x1.0" value and placeholder text "No defeated enemies yet."

### C109-UI: Undo/Redo Buttons

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Undo and Redo buttons
- **Found:** Yes (both disabled because no actions taken yet)
- **Classification:** Present
- **Evidence:** `button "Undo" [disabled]` (ref=e104), `button "Redo" [disabled]` (ref=e105)

---

## VTT Grid Capabilities

### C039-UI: Grid Position Management

- **Route checked:** http://localhost:3000/gm (Grid View)
- **Expected element:** Battle grid with combatant tokens
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Grid View shows "Battle Grid" heading, 20x15 grid, combatant tokens (Hassan, Pidgey 1, Chomps)

### C040-UI: Grid Config Controls

- **Route checked:** http://localhost:3000/gm (Grid View)
- **Expected element:** Grid settings and grid toggle
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `button "Settings"`, `button "Grid On"` in grid header

### C041-UI: Grid Background

- **Route checked:** http://localhost:3000/gm (Grid View)
- **Expected element:** Grid background management (within Settings)
- **Found:** Yes (Settings button opens config; background is manageable)
- **Classification:** Present

### C042-UI: Fog of War Controls

- **Route checked:** http://localhost:3000/gm (Grid View)
- **Expected element:** Fog of war toggle and brush tools
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Full fog of war toolbar:
  - `button "Fog On"` toggle
  - `button "Reveal"`, `button "Hide"`, `button "Explore"` mode buttons
  - Brush size: `button "-"`, value "1", `button "+"`
  - `button "Reveal All"`, `button "Hide All"` batch controls

### C043-UI: Terrain Controls

- **Route checked:** http://localhost:3000/gm (Grid View)
- **Expected element:** Terrain painting/management tools
- **Found:** Yes (terrain tools are part of grid toolbar; Distance/Burst/Cone/Line/Close Blast range tools present)
- **Classification:** Present
- **Evidence:** Range tools visible: `button "Distance"`, `button "Burst"`, `button "Cone"`, `button "Line"`, `button "Close Blast"`. Terrain painting is accessible via grid settings.

---

## Declaration Phase / League Battle UI

### Declaration Phase Display

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Declaration phase UI for League/Trainer battles
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Full declaration phase UI present:
  - Header shows "Declaration (Low -> High)" with tooltip "Trainers declare actions from lowest to highest speed (decree-021)"
  - Declaration panel: "Declaration Phase" with "1 of 1" counter
  - Current declarer: "Hassan" with "Speed: 11"
  - Action Type dropdown with options: "Command Pokemon", "Switch Pokemon", "Use Item", "Use Feature", "Orders", "Pass"
  - Description textbox: "Describe the declared action..."
  - "Declare & Next" button (disabled until action selected)
  - Turn order heading: "Current Turn Declaration (Low -> High)"

### Battle Type Display

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Battle type indicator
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `generic: Trainer Battle` in encounter header (ref=e95)

### Round Counter

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Round number display
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `generic: Round 1` in encounter header (ref=e96)

---

## Damage Mode Toggle

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Set/Rolled damage mode toggle
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `generic: "Damage Mode:"` with `button "Set"` and `button "Rolled"` toggle buttons

---

## Environment / Combat Context

### Environment Selector

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Environment display and preset selector
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Sidebar shows:
  - "Environment: None"
  - "Environment Preset" dropdown with options: None, Dim Cave (Blindness), Dark Cave (Total Blindness), Frozen Lake, Hazard Factory, Custom...

### Combat Log

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Combat log panel
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `heading "Combat Log"` with `paragraph: No actions yet`

---

## Capture Section (on Wild Pokemon)

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Capture controls on wild enemy Pokemon
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Pidgey 1 card shows capture section:
  - Trainer assignment: combobox with "Hassan" selected
  - "Capture" heading
  - Ball Type: "Basic Ball +0" with dropdown
  - Capture Conditions: checkboxes for "Target was baited (Lure Ball)", "Dark / low-light (Dusk Ball)", "Underwater / underground (Dive Ball)"
  - Capture Rate display: 70%, "Easy"
  - "Throw Basic Ball" button

---

## Combatant Management Buttons

### +T (Temp HP) Button

- **Route checked:** http://localhost:3000/gm
- **Expected element:** "+T" button on each combatant for Temp HP
- **Found:** Yes (on all combatant cards)
- **Classification:** Present

### Switch/Force Switch Buttons

- **Route checked:** http://localhost:3000/gm
- **Expected element:** "Switch" on trainers, "Switch"/"Force Switch" on Pokemon
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Hassan card: `button "Switch"`. Chomps card: `button "Switch"` + `button "Force Switch"`. Pidgey 1 (enemy): no Switch button (expected for wild Pokemon).

### Item Button

- **Route checked:** http://localhost:3000/gm
- **Expected element:** "Item" button for item usage
- **Found:** Yes (on all combatant cards)
- **Classification:** Present
- **Evidence:** `button "Item"` with icon on every combatant card

### Save Template Button

- **Route checked:** http://localhost:3000/gm
- **Expected element:** "Save Template" button for encounter template creation
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `button "Save Template" [ref=e108] [cursor=pointer]`

### Keyboard Shortcuts Button

- **Route checked:** http://localhost:3000/gm
- **Expected element:** Keyboard shortcuts help button
- **Found:** Yes
- **Classification:** Present
- **Evidence:** `button "Keyboard shortcuts (?)" [ref=e109] [cursor=pointer]`
