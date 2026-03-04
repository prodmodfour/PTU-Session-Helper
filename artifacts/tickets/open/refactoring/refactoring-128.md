---
id: refactoring-128
title: "Extract getEffectiveEquipBonuses from useMoveCalculation.ts (806 lines)"
priority: P3
severity: MEDIUM
status: open
domain: combat
source: code-review-316 MED-001
created_by: slave-collector (plan-20260304-085746)
created_at: 2026-03-04
affected_files:
  - app/composables/useMoveCalculation.ts
  - app/utils/evasionCalculation.ts
---

## Summary

`useMoveCalculation.ts` is now 806 lines, exceeding the 800-line CRITICAL threshold. The addition of `getEffectiveEquipBonuses` (22 lines) for Living Weapon P1 integration pushed it over.

## Problem

The `getEffectiveEquipBonuses` function (lines 87-102) duplicates logic from `getEffectiveEquipmentBonuses` in `living-weapon.service.ts` and from the equipment overlay in `evasionCalculation.ts`. Three call sites compute the same effective equipment bonuses independently.

## Suggested Fix

Extract `getEffectiveEquipBonuses` into a shared client-side utility that all three call sites (`useMoveCalculation.ts`, `evasionCalculation.ts`, and any future consumers) can import. This reduces duplication and brings the file under 800 lines.

## Impact

Code hygiene / maintainability. No behavioral impact.
