---
decree_id: decree-023
status: active
domain: vtt-grid
topic: burst-shape-uses-ptu-diagonal
title: "Use PTU alternating diagonal rule for burst shapes"
ruled_at: 2026-02-26T23:30:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-023
implementation_tickets: [ptu-rule-113]
tags: [vtt, burst, attack-shapes, diagonal, measurement, chebyshev]
---

# decree-023: Use PTU alternating diagonal rule for burst shapes

## The Ambiguity

Burst shapes currently use Chebyshev distance (`Math.max(|dx|, |dy|) <= radius`) producing filled squares. Decree-002 established "All grid distance measurements use PTU's alternating diagonal rule. No Chebyshev distance in the app." However, PTU p.343 describes bursts as "squares," which is consistent with Chebyshev containment.

Source: decree-need-023, code-review-183 HIGH-3.

## Options Considered

### Option A: Chebyshev squares (current behavior)
PTU literally calls bursts "squares" (p.343). Bursts are a containment/area check, not a point-to-point distance measurement. Add an explicit exception to decree-002 for burst shapes. Keeps current behavior.

### Option B: PTU alternating diagonal
Apply the same alternating diagonal rule to burst containment, per decree-002's "all distance" precedent. Corner cells at diagonal distances beyond the burst radius get excluded, producing diamond-like shapes. Consistent with decree-002 but deviates from PTU's literal "square" description.

## Ruling

**The true master decrees: burst shapes use PTU alternating diagonal distance, consistent with decree-002.**

Decree-002 established a universal principle: all grid distance uses PTU's alternating diagonal rule. Bursts are not exempt. Under this rule, a cell's inclusion in a burst is determined by its PTU diagonal distance from the center, not Chebyshev distance. This produces diamond-like shapes rather than filled squares, but maintains consistency across the entire distance system. The word "squares" in PTU p.343 refers to grid cells, not geometric squares.

## Precedent

Burst shapes are NOT exempt from the alternating diagonal rule. Burst N includes all cells whose PTU alternating diagonal distance from the center is <= N. No Chebyshev distance anywhere in the app — decree-002 has no exceptions.

## Implementation Impact

- Tickets created: ptu-rule-113 (switch burst shapes from Chebyshev to PTU diagonal distance)
- Files affected: `app/stores/measurement.ts` (`getBurstCells`), `app/composables/useRangeParser.ts`
- Skills affected: all VTT reviewers, developer implementing burst changes
