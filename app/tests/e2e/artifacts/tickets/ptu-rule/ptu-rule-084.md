---
id: ptu-rule-084
title: Vulnerable condition does not zero evasion
priority: P2
severity: HIGH
status: open
domain: combat
source: combat-audit.md (combat-R108)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-084: Vulnerable condition does not zero evasion

## Summary

The `getTargetEvasion` function in `useMoveCalculation.ts` does NOT check for the Vulnerable condition. PTU rules state that Vulnerable targets have 0 evasion, but the code calculates evasion normally regardless. This also affects Frozen and Asleep conditions, which both should zero evasion per PTU.

## Affected Files

- `app/composables/useMoveCalculation.ts` (lines 237-250, `getTargetEvasion` function)
- `app/constants/statusConditions.ts` (Vulnerable, Frozen, Asleep definitions)

## PTU Rule Reference

- Vulnerable: "The target's evasion becomes 0"
- Frozen: "Evasion becomes 0" (in addition to action blocking)
- Asleep: "Evasion becomes 0" (in addition to action blocking)

## Suggested Fix

In `getTargetEvasion`, check the target's active conditions. If Vulnerable, Frozen, or Asleep, return `{ physical: 0, special: 0, speed: 0 }` immediately before computing normal evasion values.

## Impact

- Take a Breather (applies Tripped + Vulnerable) does not create the intended attack opening
- Low Blow dirty trick does not work as intended
- Frozen/Asleep targets are harder to hit than PTU intends
