---
ticket_id: refactoring-115
category: EXT-GOD
priority: P4
severity: LOW
status: open
domain: combat
source: code-review-256 MEDIUM-001
created_by: slave-collector (plan-20260301-170000)
created_at: 2026-03-01
---

# Refactoring-115: switching.service.ts exceeds 800-line limit (811 lines)

## Summary

The Pokemon switching service (`app/server/services/switching.service.ts`) grew to 811 lines after extracting `applyRecallSideEffects` from the recall endpoint (code-review-249 M2 DRY fix). Currently 11 lines over the project's 800-line file size limit.

## Current Responsibility Clusters

1. **Range validation** — `checkRecallRange`, distance calculations
2. **Removal** — `removeFromEncounter`, cleanup logic
3. **Initiative insertion** — `insertIntoTurnOrder`, `hasInitiativeAlreadyPassed`
4. **Action tracking** — action cost, command restrictions
5. **Placement** — `findAdjacentPosition`, `findPlacementPosition` delegation
6. **Pair detection** — `checkRecallReleasePair`, League restriction
7. **Side effects** — `applyRecallSideEffects` (newly extracted)

## Suggested Fix

Extract placement logic (section 5) or pair detection (section 6) into a dedicated sub-module. Alternatively, combine with refactoring-112 (encounter store decomposition) as a broader combat service cleanup.

## Affected Files

- `app/server/services/switching.service.ts` (currently 811 lines)

## Impact

LOW — 11 lines over limit. Non-urgent but should be addressed before next feature adds to this file.
