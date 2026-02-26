---
decree_id: decree-024
status: active
domain: vtt-grid
topic: diagonal-cone-includes-corner-cell
title: "Diagonal cones include the diagonal corner cell (diamond pattern)"
ruled_at: 2026-02-26T23:30:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-024
implementation_tickets: []
tags: [vtt, cone, attack-shapes, diagonal, measurement]
---

# decree-024: Diagonal cones include the diagonal corner cell (diamond pattern)

## The Ambiguity

Two implementations of diagonal cone shapes produce different cell sets. Decree-007 says "cone shapes use fixed 3m-wide rows" but does not specify how "3m wide" maps to diagonal expansion. For Cone 2 aimed diagonally, `useRangeParser.ts` produces 6 cells (cross pattern) while `measurement.ts` produces 7 cells (diamond pattern with the diagonal corner cell included).

Source: decree-need-024, rules-review-160 M1.

## Options Considered

### Option A: 7 cells — diamond pattern (measurement.ts behavior)
Include the diagonal corner cell. The "row" of 3 cells wraps around the diagonal, filling the corner. Wider coverage, more intuitive cone shape. Three push groups: horizontal, vertical, and diagonal corner.

### Option B: 6 cells — cross pattern (useRangeParser.ts behavior)
Exclude the diagonal corner cell. The 3-wide row expands only along cardinal axes perpendicular to the diagonal direction. Narrower, more conservative. Two push groups only.

## Ruling

**The true master decrees: diagonal cones include the diagonal corner cell, producing the 7-cell diamond pattern.**

For a cone aimed diagonally, the 3-wide row wraps around the diagonal axis, filling the corner cell at `(baseX + w, baseY + w)`. This produces a wider, more natural cone shape. The `useRangeParser.ts` implementation must be updated to match `measurement.ts` behavior.

## Precedent

Diagonal cone expansion uses three push groups: horizontal axis, vertical axis, AND the diagonal corner cell. For Cone N aimed diagonally, each expansion row beyond the tip includes the diagonal corner fill. Both move targeting and measurement preview must produce identical cell sets.

## Implementation Impact

- Tickets created: none — ptu-rule-100 (cone shape fix from decree-007) updated to incorporate diagonal corner cell
- Files affected: `app/composables/useRangeParser.ts` (add diagonal corner cell to match measurement.ts)
- Skills affected: all VTT reviewers, developer implementing cone fixes
