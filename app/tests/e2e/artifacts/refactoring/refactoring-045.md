---
ticket_id: refactoring-045
priority: P3
status: open
category: PERF
source: code-review-074, code-review-075
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

N+1 query pattern in `game/new-day.post.ts` and `scenes/[id]/activate.post.ts`. Both do per-character sequential DB updates instead of batching. Non-blocking for TTRPG scale (typically <10 characters) but inefficient.

## Affected Files

- `app/server/api/game/new-day.post.ts` — findMany + N individual updates
- `app/server/api/scenes/[id]/activate.post.ts` — per-character AP restore

## Suggested Refactoring

Group characters by level and use `updateMany` per level group (L+1 queries instead of N+1). Or use a transaction with batch updates.
