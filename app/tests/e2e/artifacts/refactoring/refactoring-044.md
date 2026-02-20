---
ticket_id: refactoring-044
priority: P2
status: open
category: EXT-DUPLICATE
source: code-review-074, code-review-075
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Capture action consumption error is silently swallowed with `console.error` in `useCapture.ts`. When the standard action POST fails after a successful capture, the GM gets no indication the action economy is broken.

## Affected Files

- `app/composables/useCapture.ts` (~line 246-253)

## Suggested Refactoring

Surface the error via the composable's `error` ref or emit a warning notification so the GM knows the action was not consumed. The capture succeeded (irreversible), so the error should be a warning, not a blocking error.
