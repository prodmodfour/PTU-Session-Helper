---
id: refactoring-086
title: "Deduplicate mount movement reset logic between resetCombatantsForNewRound and resetMountMovement"
priority: P4
severity: LOW
status: open
domain: combat
source: code-review-305 (feature-004 P1 re-review)
created_by: slave-collector (plan-20260303-175043)
created_at: 2026-03-03
affected_files:
  - app/server/utils/turn-helpers.ts
  - app/server/services/mounting.service.ts
---

## Summary

`turn-helpers.ts` lines 112-125 duplicate the mount movement reset logic from `mounting.service.ts:340-371` (`resetMountMovement()`) inline rather than calling the exported function. Both copies now correctly apply `applyMovementModifiers`, but the duplication is a maintenance risk.

## Problem

The `resetCombatantsForNewRound` function in `turn-helpers.ts` inlines the same mount movement budget reset that `resetMountMovement` in `mounting.service.ts` performs. If mount movement reset logic changes in one location, the other must be manually updated.

## Suggested Fix

Have `resetCombatantsForNewRound` in `turn-helpers.ts` delegate to `resetMountMovement` from `mounting.service.ts` instead of duplicating the logic inline.

## Impact

Low — both copies are currently functionally identical after the feature-004 P1 fix cycle. This is a code hygiene improvement to prevent future divergence.
