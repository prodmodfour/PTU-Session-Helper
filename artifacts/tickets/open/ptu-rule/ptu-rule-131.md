---
ticket_id: ptu-rule-131
category: PTU-INCORRECT
severity: MEDIUM
priority: P3
domain: capture
title: "Poke Ball accuracy check should use central calculateAccuracyThreshold utility"
source: code-review-281 M2
created_by: slave-collector (plan-20260302-150500)
created_at: 2026-03-02
blocked_by: decree-need-041
---

## Summary

`rollAccuracyCheck()` in `app/composables/useCapture.ts` reimplements its own d20 accuracy logic with a hardcoded `roll >= 6` check. The codebase already has a central accuracy system: `calculateAccuracyThreshold(moveAC, attackerAccuracyStage, defenderEvasion)` in `utils/damageCalculation.ts`, used by `useMoveCalculation.ts` for all move accuracy rolls.

The Poke Ball check should call `calculateAccuracyThreshold(6, trainerAccuracyStage, targetSpeedEvasion)` instead of hardcoding the threshold, so it stays consistent with the move system and automatically picks up any future modifier changes.

## Context

This is a pre-existing gap identified during the bug-043 review (AC 6 enforcement fix). The bug-043 fix correctly scoped to just enforcing the AC 6 threshold. Unifying with the central utility is a separate concern.

**Blocked by decree-need-041:** Whether Poke Ball throws (item use as "AC 6 Status Attack Roll", NOT a Move) should apply target evasion and attacker accuracy stages. If the decree rules "flat check only", this ticket becomes a smaller refactor (use the utility with evasion=0, accuracyStage=0). If the decree rules "apply modifiers", the full utility integration applies.

## Current State (two separate systems)

1. **Moves** (`useMoveCalculation.ts:407`): Rolls 1d20, computes threshold via `calculateAccuracyThreshold(moveAC, accuracyStage, evasion)`, applies flanking penalty, rough terrain penalty. Per-target comparison.
2. **Poke Ball** (`useCapture.ts:234`): Rolls its own 1d20, hardcodes `roll >= 6`, ignores all modifiers.

## PTU Reference

- PTU p.236: "An Accuracy Roll is always simply 1d20, but is modified by the user's Accuracy and by certain Moves and other effects."
- PTU p.214: Poke Ball throws are "AC6 Status Attack Roll"
- PTU p.234: "Evasion helps Pokemon avoid being hit by moves" — Poke Ball throws are NOT moves
- rules-review-257 observation: Community convention treats AC 6 as a flat check

## Affected Files

- `app/composables/useCapture.ts` — `rollAccuracyCheck()` → refactor to use `calculateAccuracyThreshold()`
- `app/server/api/capture/attempt.post.ts` — server-side validation must mirror the same threshold logic

## Suggested Fix

1. Await decree-need-041 ruling on evasion/accuracy applicability
2. Refactor `rollAccuracyCheck()` to call `calculateAccuracyThreshold(6, accuracyStage, evasion)` with parameters determined by the decree
3. Update server-side validation to use the same threshold calculation
4. If modifiers apply: accept combatant data (accuracy stage, target speed evasion) as parameters

## Impact

Low gameplay impact — modifiers only matter in edge cases with extreme combat stage shifts. High code health impact — eliminates a duplicated accuracy system and ensures consistency.
