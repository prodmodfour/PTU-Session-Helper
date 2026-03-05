---
id: refactoring-137
title: "toggleVisionCapability uses direct getHistory() instead of delegated captureSnapshot"
category: CODE-HEALTH
priority: P4
severity: LOW
status: open
domain: encounter-tables
source: code-review-333 MEDIUM-002
created_by: slave-collector (plan-1772695906)
created_at: 2026-03-05
affected_files:
  - app/stores/encounter.ts
---

## Summary

`toggleVisionCapability` (encounter store line 567) calls `getHistory().pushSnapshot()` directly from the composable module instead of using the delegated `this.captureSnapshot()` action. This bypasses the delegation pattern established by refactoring-112. The direct `getHistory()` import at line 6 could then be removed.

## Suggested Fix

Replace `getHistory().pushSnapshot(...)` with `this.captureSnapshot('Toggle vision capability')` and remove the direct `getHistory` import if no other references remain.

## Impact

Low — cosmetic inconsistency in the delegation pattern. No behavioral difference.
