---
ticket_id: refactoring-048
priority: P3
status: open
category: EXT-DUPLICATE
source: code-review-078
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Capture rate calculation logic is duplicated between `app/utils/captureRate.ts` (server-side) and `app/composables/useCapture.ts` (client-side `calculateCaptureRateLocal`). Both paths maintain identical arithmetic independently.

## Suggested Refactoring

Have `useCapture.ts:calculateCaptureRateLocal` delegate to `captureRate.ts:calculateCaptureRate` instead of reimplementing the formula. The utility is already a pure function usable in both contexts.
