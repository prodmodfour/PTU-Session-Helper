# Browser Audit: vtt-grid -- Group View

## Route: `/group` (Encounter tab active, encounter served)

Audited with served encounter "Capture Browser Audit Test" (3 combatants). Group View renders the read-only grid via GroupGridCanvas.

---

### C043 -- GroupGridCanvas component

- **Route checked:** `/group`
- **Expected element:** Read-only grid canvas with tokens, no editing controls
- **Found:** Yes -- "Battle Grid" heading, grid size, tokens visible, zoom controls present, no Settings/Fog/Terrain/Elevation tools
- **Classification:** Present
- **Evidence:**
  - `heading "Battle Grid" [level=3] [ref=e31]`
  - `generic [ref=e32]: 20x15`
  - Tokens: Hassan (`generic [ref=e38]: H`), Pidgey 1 (`img "Pidgey 1" [ref=e43]`), Chomps (`img "Chomps" [ref=e48]`)
  - ZoomControls: `button "+" [ref=e52]`, `generic [ref=e53]: 100%`, `button "-" [ref=e54]`, `button "home" [ref=e55]`
  - No Settings button, no Fog toolbar, no Terrain painter, no Elevation toolbar -- correct read-only behavior

### C001 -- Encounter Grid Store (group display)

- **Route checked:** `/group`
- **Expected element:** Grid config reflected in display
- **Found:** Yes -- Grid size "20x15" matches config
- **Classification:** Present
- **Evidence:** `generic [ref=e32]: 20x15`

### C002 -- Fog of War Store (group display)

- **Route checked:** `/group`
- **Expected element:** Fog of war applied to group view (hidden cells obscured)
- **Found:** Present (fog rendering is canvas-based, not visible in accessibility tree, but GroupGridCanvas component confirmed in source to receive fog state props and apply fog overlay)
- **Classification:** Present
- **Evidence:** GroupGridCanvas.vue receives `config` and renders via GridCanvas/IsometricCanvas with `is-gm="false"`, which triggers fog rendering for non-GM views. Canvas-based rendering cannot be verified via accessibility tree alone.

### C003 -- Terrain Store (group display)

- **Route checked:** `/group`
- **Expected element:** Terrain rendered on canvas
- **Found:** Present (canvas-based rendering, not in accessibility tree, but component renders terrain overlays per source)
- **Classification:** Present
- **Evidence:** GroupGridCanvas passes config to GridCanvas/IsometricCanvas which render terrain from terrain store.

### C049 -- VTTToken (group display)

- **Route checked:** `/group`
- **Expected element:** Token elements visible with names and sprites
- **Found:** Yes -- 3 tokens with names and sprites
- **Classification:** Present
- **Evidence:** Hassan: `generic [ref=e38]: H`, Pidgey 1: `img "Pidgey 1" [ref=e43]`, Chomps: `img "Chomps" [ref=e48]`

### C006 -- Isometric Camera Store (group display)

- **Route checked:** `/group` (not tested in isometric mode, but GroupGridCanvas supports both modes per source)
- **Expected element:** Camera state synced from GM
- **Found:** Present in source -- GroupGridCanvas.vue line 9 renders IsometricCanvas when `config.isometric` is true
- **Classification:** Present
- **Evidence:** Source confirmed; would need isometric mode enabled to verify in browser (tested only in 2D mode on group view)

### Capabilities NOT accessible from group view (correct per design)

The following are GM-only and correctly absent from `/group`:
- C004 Measurement Store (no measurement toolbar)
- C005 Selection Store (no multi-select)
- C013 useGridInteraction (no editing)
- C014 useGridMovement (no movement)
- C044 CameraControls (GM only in isometric)
- C045 ElevationToolbar (GM only)
- C046 TerrainPainter (GM only)
- C047 FogOfWarToolbar (GM only)
- C048 MeasurementToolbar (GM only)
- C050 GridSettingsPanel/MapUploader (no Settings button)

---

## Summary

| Capability | Name | Classification | Notes |
|-----------|------|----------------|-------|
| C001 | Encounter Grid Store | Present | Grid size "20x15" displayed |
| C002 | Fog of War Store | Present | Canvas-based fog rendering (source confirmed) |
| C003 | Terrain Store | Present | Canvas-based terrain rendering (source confirmed) |
| C006 | Isometric Camera Store | Present | Source confirmed, not directly tested in iso mode |
| C043 | GroupGridCanvas | Present | Read-only grid, no editing controls |
| C049 | VTTToken | Present | 3 tokens with sprites |
