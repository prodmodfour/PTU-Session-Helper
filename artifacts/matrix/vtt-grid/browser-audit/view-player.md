# Browser Audit: vtt-grid -- Player View

## Route: `/player` (Encounter tab active, character selected)

Audited with Hassan selected, encounter served. Player Encounter View renders PlayerGridView (C032) which wraps GridCanvas in player mode.

---

### C032 -- usePlayerGridView composable / PlayerGridView component

- **Route checked:** `/player` (Encounter tab)
- **Expected element:** Read-only grid canvas with tokens, zoom controls, no editing tools
- **Found:** Yes -- Grid canvas with 3 tokens visible, zoom controls, no GM editing tools
- **Classification:** Present
- **Evidence:**
  - Tokens: Hassan (`generic [ref=e247]: H`), Pidgey 1 (`img "Pidgey 1" [ref=e252]`), Chomps (`img "Chomps" [ref=e257]`)
  - ZoomControls: `button "+" [ref=e261]`, `generic [ref=e262]: 100%`, `button "-" [ref=e263]`, `button "home" [ref=e264]`
  - No Settings, Fog, Terrain, Elevation, or Measurement controls

### C041 -- GridCanvas (player mode)

- **Route checked:** `/player` (Encounter tab)
- **Expected element:** Grid canvas rendering tokens in player mode (restricted visibility)
- **Found:** Yes -- Canvas renders with tokens. Enemy shows percentage HP (not exact values)
- **Classification:** Present
- **Evidence:** Pidgey 1 (enemy) shows `generic [ref=e305]: 100%` (percentage display), not exact HP numbers. Player side shows exact HP: `generic [ref=e279]: 45 / 45`.

### C049 -- VTTToken (player display)

- **Route checked:** `/player` (Encounter tab)
- **Expected element:** Token elements visible
- **Found:** Yes -- 3 tokens rendered
- **Classification:** Present
- **Evidence:** Hassan: `generic [ref=e247]: H`, Pidgey 1: `img "Pidgey 1" [ref=e252]`, Chomps: `img "Chomps" [ref=e257]`

### Capabilities NOT accessible from player view (correct per design)

The matrix shows 0 rules assigned to the player actor. The player grid is read-only with movement request capabilities (not VTT-grid domain).

---

## Summary

| Capability | Name | Classification | Notes |
|-----------|------|----------------|-------|
| C032 | usePlayerGridView / PlayerGridView | Present | Grid with tokens, zoom controls, no GM tools |
| C041 | GridCanvas (player mode) | Present | Restricted visibility (% HP for enemies) |
| C049 | VTTToken | Present | 3 tokens rendered |
