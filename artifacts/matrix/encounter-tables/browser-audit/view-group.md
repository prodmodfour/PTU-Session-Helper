---
domain: encounter-tables
type: browser-audit-view
view: group
routes_checked:
  - /group
total_checked: 0
present: 0
absent: 0
error: 0
unreachable: 0
untestable: 0
browser_audited_at: 2026-03-05T21:11:00Z
browser_audited_by: browser-auditor
---

# Browser Audit: encounter-tables -- Group View

## Summary

No encounter-tables capabilities are accessible from the group view. All 31 capabilities in the encounter-tables domain are GM-only (actor=gm, accessible_from=gm).

The group view was checked at `/group` and shows an encounter display (battle grid, turn order, combatant stats). No encounter-table management, generation, or habitat elements are present, which is the correct behavior per the matrix.

The only indirect encounter-tables interaction on the group view is the TV wild spawn preview (Chain 8 in capabilities), which receives WebSocket broadcasts when the GM generates and serves wild Pokemon. This is a display-only passthrough and does not expose any encounter-table capabilities to the group view.

## Route Snapshot

- **Route:** /group
- **Page Title:** PTU - Group View
- **Content:** Encounter display showing "Capture Browser Audit Test" encounter with combatants (Hassan, Pidgey 1, Chomps)
- **Encounter-table elements found:** None (correct)
