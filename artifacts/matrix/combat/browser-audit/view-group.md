---
domain: combat
type: browser-audit-view
view: group
route: /group
total_checked: 5
present: 5
absent: 0
error: 0
unreachable: 0
browser_audited_at: 2026-03-05T21:15:00Z
browser_audited_by: browser-auditor
---

# Browser Audit: Group View (/group)

## Overview

The Group View displays the served encounter on a shared screen (TV/projector). It shows the encounter header, turn order, battle grid, and current turn details. The encounter was served to group ("Served to Group" indicator confirmed on GM view).

---

## Component Capabilities

### combat-C121: GroupCombatantCard

- **Route checked:** http://localhost:3000/group
- **Expected element:** Combatant display cards in the group encounter view
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Group view shows combatant tokens in the battle grid:
  - Hassan (H initial, Lv.1)
  - Pidgey 1 (sprite, Lv.5)
  - Chomps (sprite, Lv.10)

  Current turn panel shows detailed GroupCombatantCard for Hassan:
  - Name: Hassan, Role: Player
  - HP: 45 / 45
  - Stats display: ATK 5, DEF 7, SP.ATK 5, SP.DEF 7, SPD 11

---

## Encounter Display Elements

### Encounter Header

- **Route checked:** http://localhost:3000/group
- **Expected element:** Encounter name, round number, current turn indicator
- **Found:** Yes
- **Classification:** Present
- **Evidence:**
  - `heading "Capture Browser Audit Test"` (encounter name)
  - `generic: Round 1` (round counter)
  - `generic: "Current Turn:"` + `generic: Hassan` (turn indicator)

### Turn Order / Declaration Phase

- **Route checked:** http://localhost:3000/group
- **Expected element:** Declaration phase display showing turn order
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Sidebar shows:
  - `heading "Declaration (Low -> High)"` with order entry:
  - Position "1", initial "H", name "Hassan", speed "11"

### Battle Grid (Group View)

- **Route checked:** http://localhost:3000/group
- **Expected element:** Battle grid with combatant tokens
- **Found:** Yes
- **Classification:** Present
- **Evidence:**
  - `heading "Battle Grid"` with dimensions "20x15"
  - Three combatant tokens: Hassan, Pidgey 1, Chomps
  - Zoom controls: "+" button, "100%" display, "-" button, home button

### Current Turn Panel

- **Route checked:** http://localhost:3000/group
- **Expected element:** Detailed info for current turn's combatant
- **Found:** Yes
- **Classification:** Present
- **Evidence:** Right sidebar:
  - `heading "Current Turn"`
  - Hassan initial "H", name "Hassan", role "Player"
  - HP: 45 / 45
  - Stats: ATK 5, DEF 7, SP.ATK 5, SP.DEF 7, SPD 11

---

## Notes

- The Group View is a read-only display. No action buttons (Act, CS, ST, -HP, +HP) are present, which is correct behavior.
- The encounter is displayed because it was served to group (confirmed via "Served to Group" indicator and "Unserve" button on GM view).
- Fog of war is respected in group view (tokens visible on grid represent non-hidden combatants).
- Status conditions and combat stages would be visible on combatant cards when present.
