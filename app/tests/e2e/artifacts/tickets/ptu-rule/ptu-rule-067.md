---
ticket_id: ptu-rule-067
priority: P1
status: open
domain: combat
source: rules-review-067, code-review-077
created_at: 2026-02-20
created_by: orchestrator
severity: CRITICAL
affected_files:
  - app/composables/useGridMovement.ts
---

## Summary

Stuck condition implemented as speed halving instead of full movement block. Both reviewers independently flagged this as incorrect.

## PTU Rule Reference

PTU 1.05 p.231: "Stuck means you cannot Shift at all."
PTU 1.05 p.253: "A Pokemon or Trainer that is Stuck cannot make a Shift Action to move."

## Expected Behavior

Stuck combatants should have effective movement speed of 0 (cannot move at all).

## Current Behavior

`applyMovementModifiers()` in `useGridMovement.ts` halves speed for Stuck (`Math.floor(modifiedSpeed / 2)`), which is Slowed behavior, not Stuck.

## Fix

Change `modifiedSpeed = Math.floor(modifiedSpeed / 2)` for the Stuck condition to `modifiedSpeed = 0`.
