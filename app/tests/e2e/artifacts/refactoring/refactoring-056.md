---
ticket_id: refactoring-056
priority: P3
status: open
category: TEST-GAP
source: code-review-108
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

No unit tests exist for the encounter generation API endpoint (`/api/encounter-tables/[id]/generate.post.ts`). The existing `encounterTables.test.ts` covers the Pinia store, not the server route. The endpoint now contains non-trivial logic (species diversity enforcement with exponential decay + per-species cap) that should have test coverage.

## Affected Files

- `app/server/api/encounter-tables/[id]/generate.post.ts` — the endpoint with diversity logic
- `app/tests/unit/` — no corresponding test file exists

## Suggested Fix

Add a Vitest unit test file that covers:
1. Basic weighted random selection (single species pool, multi-species pool)
2. Species diversity enforcement (verify cap is respected, verify decay reduces repeats)
3. Edge cases (single-species pool skips diversity, all-capped fallback)
