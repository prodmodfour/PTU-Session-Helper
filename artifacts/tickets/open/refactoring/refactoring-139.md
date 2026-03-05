---
id: refactoring-139
title: "dismissAll iterates Map while deleting from it"
category: CODE-HEALTH
priority: P4
severity: LOW
status: open
domain: multiple
source: code-review-334 MEDIUM-1 + code-review-334b M1
created_by: slave-collector (plan-1772695906)
created_at: 2026-03-05
affected_files:
  - app/composables/useGmToast.ts
---

## Summary

In `useGmToast.ts` (lines 72-78), `dismissAll()` iterates the `timers` Map with `for...of` while calling `timers.delete(id)` inside the loop. While this works in V8 (Map iteration is safe during deletion per spec), the idiomatic pattern is cleaner.

## Suggested Fix

Iterate `timers.values()` to clear timeouts, then call `timers.clear()`.

## Impact

Low — functionally correct but non-idiomatic. Quick fix.
