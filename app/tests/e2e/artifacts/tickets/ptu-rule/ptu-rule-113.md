---
ticket_id: ptu-rule-113
ticket_type: ptu-rule
priority: P2
status: open
domain: vtt
source: decree-023
affected_files:
  - app/stores/measurement.ts
  - app/composables/useRangeParser.ts
created_at: 2026-02-26
---

# ptu-rule-113: Switch burst shapes from Chebyshev to PTU diagonal distance

## Problem

Burst shapes currently use Chebyshev distance (`Math.max(|dx|, |dy|) <= radius`) producing filled squares. Per decree-023 (reaffirming decree-002), all grid distance uses PTU's alternating diagonal rule with no exceptions. Bursts must use PTU diagonal distance, producing diamond-like shapes instead of squares.

## Required Changes

1. In `measurement.ts` `getBurstCells` (lines ~184-198): Replace `Math.max(Math.abs(dx), Math.abs(dy)) <= radius` with PTU alternating diagonal distance calculation.
2. In `useRangeParser.ts` burst case in `getAffectedCells`: Same change — use PTU diagonal distance.
3. Remove the comment "Use Chebyshev distance for PTU" on line ~186.
4. Update any tests asserting square burst shapes.

## PTU Reference

- p.231: Alternating diagonal rule (1-2-1)
- decree-002: "All grid distance measurements use PTU's alternating diagonal rule. No Chebyshev distance in the app."
- decree-023: "Burst shapes are NOT exempt from the alternating diagonal rule."

## Acceptance Criteria

- Burst 1: 5 cells (center + 4 cardinal) — not 9 (3x3 square)
- Burst 2: 13 cells (diamond) — not 25 (5x5 square)
- Both measurement preview and move targeting produce identical burst shapes
- No Chebyshev distance calls remain in burst logic
