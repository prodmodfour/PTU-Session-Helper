---
ticket_id: ptu-rule-101
ticket_type: ptu-rule
priority: P1
status: in-progress
domain: vtt
source: decree-008
affected_files:
  - app/stores/terrain.ts
  - app/composables/useGridMovement.ts
created_at: 2026-02-26
---

# ptu-rule-101: Change water terrain default cost to 1

## Problem

Water terrain has hardcoded cost of 2 in `terrain.ts`. Per decree-008, water is basic terrain (cost 1). The GM can overlay slow terrain for rough currents.

## Required Changes

1. **terrain.ts**: Change `water` cost from 2 to 1.
2. Ensure the terrain painter can overlay slow/rough terrain modifiers on water cells if the GM wants double-cost for specific areas.
3. Verify `getTerrainAwareSpeed()` still correctly selects Swim speed for water cells (this is the intended movement penalty, not double cost).

## PTU Reference

- p.231: Water/Underwater is "Basic Terrain Type" not Slow Terrain

## Acceptance Criteria

- Default water terrain costs 1 movement per cell
- Swim speed is still selected for water cells
- GM can manually mark water cells as slow terrain (cost 2) via terrain painter
- No double-dip: swimmers use Swim speed at cost 1 by default

## Resolution Log

- **Branch:** `slave/4-dev-terrain-multitag-20260226-154130`
- **Commit:** `8b78c19` — refactor: update terrain store for multi-tag flag system
- **Files changed:**
  - `app/stores/terrain.ts` — Changed `TERRAIN_COSTS.water` from 2 to 1
- **Verification:**
  - [x] Default water terrain costs 1 movement per cell
  - [x] `getTerrainAwareSpeed()` still selects Swim speed for water cells (line 65: `terrainType === 'water' && caps.swim > 0`)
  - [x] GM can mark water cells as slow terrain via the new flag toggle UI (water + slow = cost 2)
  - [x] No double-dip: swim speed selection + cost 1 is the default
