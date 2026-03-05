---
id: refactoring-128
title: "Extract getEffectiveEquipBonuses from useMoveCalculation.ts (806 lines)"
priority: P3
severity: MEDIUM
status: in-progress
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

## Resolution Log

- The shared utility `getEffectiveEquipBonuses` already exists in `app/utils/equipmentBonuses.ts` (extracted in a prior commit). `useMoveCalculation.ts` already imports and uses it.
- `8863cabc` — Updated `app/utils/evasionCalculation.ts` to use the shared `getEffectiveEquipBonuses` instead of inline duplicate logic. Removed imports of `computeEquipmentBonuses`, `computeEffectiveEquipment`, and `LIVING_WEAPON_CONFIG` that were only needed for the inline path. Both call sites now route through the same canonical function.
- Note: `useMoveCalculation.ts` remains at 871 lines (above 800-line threshold). The `getEffectiveEquipBonuses` extraction is complete, but the file grew due to other features added since the ticket was filed. A separate ticket may be needed for further decomposition.
