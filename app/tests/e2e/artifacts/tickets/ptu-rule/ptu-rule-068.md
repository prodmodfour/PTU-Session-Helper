---
ticket_id: ptu-rule-068
priority: P2
status: open
domain: combat
source: rules-review-067, code-review-077
created_at: 2026-02-20
created_by: orchestrator
severity: HIGH
affected_files:
  - app/composables/useGridMovement.ts
---

## Summary

Speed Combat Stage movement modifier uses multiplicative stat table instead of PTU's additive movement rule.

## PTU Rule Reference

PTU 1.05 p.234: "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down." Minimum floor of 2 per PTU p.700.

## Expected Behavior

Speed CS +6 on Overland 5 should yield 5 + 3 = 8 (additive). Minimum floor is 2.

## Current Behavior

Uses `getSpeedStageMultiplier()` which applies the stat multiplier table (x0.4 at -6 through x2.2 at +6). Speed CS +6 on Overland 5 yields 5 x 2.2 = 11 (wrong). Minimum floor is 1 (should be 2).

## Fix

Replace multiplicative stage multiplier with additive `Math.floor(stage / 2)`. Set minimum floor to 2.
