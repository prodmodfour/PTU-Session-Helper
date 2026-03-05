---
domain: encounter-tables
type: browser-audit-view
view: player
routes_checked:
  - /player
total_checked: 0
present: 0
absent: 0
error: 0
unreachable: 0
untestable: 0
browser_audited_at: 2026-03-05T21:11:00Z
browser_audited_by: browser-auditor
---

# Browser Audit: encounter-tables -- Player View

## Summary

No encounter-tables capabilities are accessible from the player view. All 31 capabilities in the encounter-tables domain are GM-only (actor=gm, accessible_from=gm).

The player view was checked at `/player` and shows a character selection screen (Hassan, Marilena). No encounter-table management, generation, or habitat elements are present, which is the correct behavior per the matrix.

## Route Snapshot

- **Route:** /player
- **Page Title:** PTU - Player View
- **Content:** Character selection ("Select your character to continue") with two trainer options
- **Encounter-table elements found:** None (correct)
