---
decree_id: decree-014
status: active
domain: capture
topic: stuck-slow-capture-bonus
title: "Stuck/Slow capture bonuses are separate, not stacked with volatile"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-014
implementation_tickets: []
tags: [capture, stuck, slow, volatile, capture-rate]
---

# decree-014: Stuck/Slow capture bonuses are separate, not stacked with volatile

## The Ambiguity

Do Stuck and Slow get ONLY their special capture bonuses (+10/+5), or do they ALSO get the volatile condition +5 bonus on top? The word "Additionally" in PTU p.214 is ambiguous. Surfaced by decree-need-014.

## Options Considered

### Option A: Separate bonuses only (current)
Stuck = +10, Slow = +5. They are not volatile conditions (p.238 separates them explicitly with "AND"), so no volatile +5 bonus applies.

### Option B: Stacking bonuses
Stuck = +10 + +5 = +15, Slow = +5 + +5 = +10. Treats "Additionally" as meaning "in addition to the volatile bonus."

## Ruling

**The true master decrees: Stuck and Slow capture bonuses are separate and do not stack with the volatile +5.**

PTU p.238 explicitly separates Stuck/Slow from volatile conditions: Take a Breather cures "all Volatile Status effects AND the Slow and Stuck conditions." The "AND" makes them distinct categories. The "Additionally" in p.214 introduces independent bonuses for Stuck (+10) and Slow (+5), not bonuses on top of the volatile category they don't belong to. Final values: Stuck = +10, Slow = +5.

## Precedent

When PTU text uses "AND" to separate condition categories, they are mechanically distinct. Bonuses apply per-category only. Stuck/Slow occupy their own category separate from both Persistent and Volatile.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: none (`captureRate.ts` already handles this correctly)
- Skills affected: Capture reviewers should verify Stuck/Slow are in OTHER_CONDITIONS, not VOLATILE
