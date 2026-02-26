---
ticket_id: ptu-rule-100
ticket_type: ptu-rule
priority: P1
status: open
domain: vtt
source: decree-007, decree-024
affected_files:
  - app/composables/useRangeParser.ts
  - app/stores/measurement.ts
created_at: 2026-02-26
---

# ptu-rule-100: Fix cone shape to fixed 3-wide rows

## Problem

Cone shapes currently expand proportionally with distance (`halfWidth = Math.floor(d / 2)`). Per decree-007, cones should use fixed 3m-wide rows per PTU literal text.

## Required Changes

1. Change cone calculation: d=1 is 1 cell, d=2+ is always 3 cells wide (1 center + 1 on each side).
2. For diagonal cones: use three push groups (horizontal, vertical, AND diagonal corner cell) per decree-024. The `useRangeParser.ts` diagonal cone must match `measurement.ts` behavior (7 cells for Cone 2 diagonal, not 6).
3. Update both `useRangeParser.ts` and `measurement.ts` cone rendering.
4. Update any tests asserting expanding cone shapes.

## PTU Reference

- p.343: "3m wide rows extending from that square up to X meters away"

## Acceptance Criteria

- Cone 2 cardinal: d=1 (1 cell), d=2 (3 cells) = 4 cells total
- Cone 2 diagonal: 7 cells (tip + 3-wide row with diagonal corner fill)
- Cone 4: d=1 (1 cell), d=2-4 (3 cells each)
- Cone 6: d=1 (1 cell), d=2-6 (3 cells each)
- `useRangeParser.ts` and `measurement.ts` produce identical cell sets for all directions
- Visual rendering matches fixed-width pattern
