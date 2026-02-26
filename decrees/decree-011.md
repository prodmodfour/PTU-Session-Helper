---
decree_id: decree-011
status: active
domain: vtt
topic: mixed-terrain-speed-averaging
title: "Average movement speeds when path crosses terrain boundaries"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-011
implementation_tickets:
  - ptu-rule-103
tags: [vtt, movement, terrain, speed-averaging, pathfinding]
---

# decree-011: Average movement speeds when path crosses terrain boundaries

## The Ambiguity

When a Pokemon's movement path crosses terrain boundaries (e.g., land to water), should the app average the movement speeds, use a single speed, or leave it to GM judgment? Surfaced by decree-need-011 from multiple rules reviews (rules-review-067, 073, 075).

## Options Considered

### Option A: Path-based speed averaging
Detect terrain transitions along the A* path and average applicable movement capabilities. Most faithful to PTU p.231. Requires path analysis before movement validation.

### Option B: Minimum of relevant speeds
Use the lowest applicable speed for the entire move. Conservative and always legal but overly restrictive.

### Option C: Starting terrain only (current)
Keep current behavior — speed based on starting position. GM manually adjusts. Acceptable simplification.

### Option D: Destination terrain speed
Use terrain type at destination. Still imprecise in multi-terrain cases.

## Ruling

**The true master decrees: implement path-based speed averaging per PTU p.231.**

When a movement path crosses terrain boundaries, the app must detect which terrain types are traversed, identify the applicable movement capabilities for each terrain type, and average them to determine the maximum movement distance for that turn. For example, a Pokemon with Overland 7 and Swim 5 crossing from land to water gets a maximum of 6 meters of movement. This applies to the A* pathfinding and movement validation in `useGridMovement.ts`.

Additional context established during ruling: PTU movement cannot be split around actions (p.227-228). Each turn has one Shift Action for movement as a continuous path, so averaging only needs to be calculated once per movement action.

## Precedent

When PTU specifies an explicit formula or rule for a mechanical interaction, implement it faithfully rather than using simplified approximations. Movement capability averaging across terrain boundaries is a core PTU mechanic, not an optional refinement. Related: decree-008 (water terrain cost), decree-010 (multi-tag terrain).

## Implementation Impact

- Tickets created: ptu-rule-103
- Files affected: `app/composables/useGridMovement.ts` (getSpeed, path validation)
- Skills affected: VTT-related reviewers and auditors must verify terrain transition detection
