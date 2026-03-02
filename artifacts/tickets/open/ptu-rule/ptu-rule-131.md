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
blocked_by: null
unblocked_by: decree-042
---

## Summary

`rollAccuracyCheck()` in `app/composables/useCapture.ts` reimplements its own d20 accuracy logic with a hardcoded `roll >= 6` check. The codebase already has a central accuracy system: `calculateAccuracyThreshold(moveAC, attackerAccuracyStage, defenderEvasion)` in `utils/damageCalculation.ts`, used by `useMoveCalculation.ts` for all move accuracy rolls.

The Poke Ball check should call `calculateAccuracyThreshold(6, trainerAccuracyStage, targetSpeedEvasion)` instead of hardcoding the threshold, so it stays consistent with the move system and automatically picks up any future modifier changes.

## Context

This is a pre-existing gap identified during the bug-043 review (AC 6 enforcement fix). The bug-043 fix correctly scoped to just enforcing the AC 6 threshold. Unifying with the central utility is a separate concern.

**decree-042 resolved:** Poke Ball throws use the full accuracy system — thrower's accuracy stages, target's Speed Evasion, flanking penalties, and rough terrain modifiers all apply. This means the full utility integration is required with real modifier values, not zeros.

## Current State (two separate systems)

1. **Moves** (`useMoveCalculation.ts:407`): Rolls 1d20, computes threshold via `calculateAccuracyThreshold(moveAC, accuracyStage, evasion)`, applies flanking penalty, rough terrain penalty. Per-target comparison.
2. **Poke Ball** (`useCapture.ts:234`): Rolls its own 1d20, hardcodes `roll >= 6`, ignores all modifiers.

## PTU Reference

- PTU p.236: "An Accuracy Roll is always simply 1d20, but is modified by the user's Accuracy and by certain Moves and other effects."
- PTU p.214: Poke Ball throws are "AC6 Status Attack Roll"
- PTU ch9 p.271: "Resolve the attack like you would any other."
- PTU ch9 p.1810 (Snag Machine): "-2 penalty on all Poke Ball attack rolls" — confirms Poke Ball throws are modifiable attack rolls
- **decree-042**: Full accuracy system applies (accuracy stages, Speed Evasion, flanking, terrain)

## Affected Files

- `app/composables/useCapture.ts` — `rollAccuracyCheck()` → refactor to use `calculateAccuracyThreshold()`
- `app/server/api/capture/attempt.post.ts` — server-side validation must mirror the same threshold logic

## Suggested Fix

1. Refactor `rollAccuracyCheck()` to call `calculateAccuracyThreshold(6, trainerAccuracyStage, targetSpeedEvasion)` with real modifier values
2. Pass thrower's accuracy combat stages and target's Speed Evasion into the capture flow
3. Apply flanking and rough terrain penalties consistent with the move accuracy system
4. Update server-side validation in `capture/attempt.post.ts` to mirror the same threshold calculation

## Impact

Low gameplay impact — modifiers only matter in edge cases with extreme combat stage shifts. High code health impact — eliminates a duplicated accuracy system and ensures consistency.
