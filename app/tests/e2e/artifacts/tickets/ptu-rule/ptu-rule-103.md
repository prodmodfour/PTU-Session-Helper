---
ticket_id: ptu-rule-103
ticket_type: ptu-rule
priority: P1
status: open
domain: vtt
topic: mixed-terrain-speed-averaging
source: decree-011
affected_files:
  - app/composables/useGridMovement.ts
created_at: 2026-02-26T18:00:00
---

## Summary

Implement path-based speed averaging when movement crosses terrain boundaries, per PTU p.231.

## PTU Rule

"When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value." (p.231)

## Current Behavior

`useGridMovement.ts:getSpeed()` selects movement speed based on terrain at the combatant's starting position only. No terrain boundary detection or speed averaging.

## Required Behavior

1. Detect which terrain types are traversed along the A* path
2. Identify the applicable movement capability for each terrain type (Overland, Swim, etc.)
3. Average the movement capabilities to determine max movement distance for that turn
4. Example: Overland 7 + Swim 5 = 6 meters maximum when crossing land/water boundary

## Notes

- Movement is always one continuous path per turn (PTU p.227-228 — cannot split movement)
- Related decrees: decree-008 (water terrain cost), decree-010 (multi-tag terrain), decree-011 (this ruling)
