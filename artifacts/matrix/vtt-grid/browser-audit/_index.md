---
domain: vtt-grid
type: browser-audit
browser_audited_at: 2026-03-05T20:41:00Z
browser_audited_by: browser-auditor
total_checked: 40
present: 17
absent: 0
error: 0
unreachable: 0
untestable: 23
---

# Browser Audit: vtt-grid

## Summary

All 40 vtt-grid capabilities were assessed. 17 capabilities with direct UI elements were verified as **Present** in the running application. 23 capabilities are composables, utilities, API endpoints, or WebSocket events with no direct UI terminus and are classified as **Untestable** via browser accessibility tree inspection.

No absent, error, or unreachable capabilities were found.

## Environment

- **Server:** Nuxt 3 dev server (`npm run dev`) on `localhost:3000`
- **Encounter:** "Capture Browser Audit Test" (3 combatants: Hassan, Pidgey 1, Chomps)
- **Grid Config:** 20x15, cellSize 40, tested in both 2D and isometric modes
- **Tool:** `playwright-cli` with accessibility tree snapshots
- **Issue:** Vite HMR error (missing icon in `encounter-tables.vue`) caused intermittent SPA navigation; mitigated with route interception

## Action Items

None. All UI-facing capabilities are present and accessible.

## Capability Classification Summary

| Classification | Count | Capability IDs |
|---------------|-------|----------------|
| Present | 17 | C001, C002, C003, C004, C005, C006, C040, C041, C042, C043, C044, C045, C046, C047, C048, C049, C050 |
| Untestable | 23 | C010, C011, C012, C013, C014, C015, C016, C020, C021, C022, C023, C024, C025, C026, C030, C031, C032, C035, C036, C055, C056, C057, C060 |
| Absent | 0 | -- |
| Error | 0 | -- |
| Unreachable | 0 | -- |

## View Files

| View | Route | File | Capabilities Checked |
|------|-------|------|---------------------|
| GM | `/gm` (Grid View tab) | [view-gm.md](view-gm.md) | 16 (C001-C006, C040-C042, C044-C050) |
| Group | `/group` | [view-group.md](view-group.md) | 6 (C001-C003, C006, C043, C049) |
| Player | `/player` (Encounter tab) | [view-player.md](view-player.md) | 3 (C032, C041, C049) |
| Untestable | -- | [untestable-items.md](untestable-items.md) | 23 (composables, utilities, APIs, WS) |

## Observations

### Terrain Types Differ from Matrix
The matrix (R012) lists 6 terrain types: normal, rough, water, ice, lava, blocked. The TerrainPainter UI shows 8 types: Normal, Blocking, Water, Earth, Hazard, Elevated, Rough, Slow. This suggests the terrain type system has been expanded since the capability mapping was done. The matrix should be updated to reflect the current 8-type system.

### Isometric Mode Fully Functional
All isometric-specific components (C042 IsometricCanvas, C044 CameraControls, C045 ElevationToolbar, C046 TerrainPainter) are verified present and rendering correctly in the browser.

### Player Grid View Includes Movement Request UI
The player encounter view includes movement-related UI (Shift button, action buttons) that goes beyond the VTT grid domain into combat action territory. The VTT grid portion (token display, zoom controls) is properly present.

### Cross-View Token Consistency
All three views (GM, Group, Player) render the same 3 tokens (Hassan, Pidgey 1, Chomps) with consistent names and sprites, confirming WebSocket state synchronization for the grid display.

### Vite Build Error (Non-VTT)
The `encounter-tables.vue` page has a missing icon import (`/icons/phosphor/upload-simple.svg`) that causes Vite compilation errors. This is unrelated to the VTT grid domain but interferes with browser testing by triggering SPA router error handling and navigation. This should be fixed as a separate bug.
