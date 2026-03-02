---
id: ptu-rule-095
title: Disengage maneuver missing from combatManeuvers
priority: P4
severity: LOW
status: resolved
domain: vtt-grid
source: vtt-grid-audit.md (R030)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-095: Disengage maneuver missing from combatManeuvers

## Summary

The Disengage maneuver ("Shift 1 Meter without provoking Attack of Opportunity") is missing from `combatManeuvers.ts`. Currently has zero practical impact since Attack of Opportunity (R031) is also not implemented, making all movement AoO-free by default.

## Affected Files

- `app/constants/combatManeuvers.ts`

## PTU Rule Reference

Disengage: Standard Action — Shift 1 Meter without provoking AoO.

## Suggested Fix

Add Disengage entry to `combatManeuvers.ts`. Best implemented alongside AoO system (R031).

## Impact

None currently (AoO not implemented). Should be added when AoO is implemented.

## Resolution

Resolved as part of feature-016 P2 (design-priority-interrupt-001/spec-p2.md, Section C).
Disengage added to COMBAT_MANEUVERS with 'shift' actionType, new disengage.post.ts endpoint,
and 1m movement clamp in useGridMovement.ts. Commits: 93f0017f, d7ce2f76.
