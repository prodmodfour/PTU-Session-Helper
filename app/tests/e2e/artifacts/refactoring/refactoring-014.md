---
ticket_id: refactoring-014
priority: P1
categories:
  - TYPE-ERROR
affected_files:
  - app/server/api/characters/import-csv.post.ts
  - app/stores/groupViewTabs.ts
  - app/tests/e2e/scenarios/capture/capture-helpers.ts
  - app/tests/e2e/scenarios/combat/combat-helpers.ts
estimated_scope: small
status: open
created_at: 2026-02-16T22:00:00
---

## Summary
`npx nuxi typecheck` reports 4 pre-existing type errors across 4 files. These were discovered during the refactoring-001 typecheck verification step and are unrelated to that refactoring.

## Findings

### Finding 1: Null/undefined mismatch in import-csv.post.ts
- **File:** `app/server/api/characters/import-csv.post.ts`
- **Errors:**
  - `Type 'undefined' is not assignable to type 'string | null'`
  - `Type 'string | null' is not assignable to type 'string | undefined'` (null vs undefined mismatch)
- **Likely cause:** Prisma schema uses `String?` (nullable) but the code passes `undefined` instead of `null`, or vice versa.

### Finding 2: Invalid HTTP method type in groupViewTabs.ts
- **File:** `app/stores/groupViewTabs.ts`
- **Error:** `Type '"DELETE"' is not assignable to type '"get" | "GET" | undefined'`
- **Line:** 260
- **Likely cause:** `$fetch` method option type doesn't include `"DELETE"` — may need explicit type assertion or the fetch call structure needs adjustment.

### Finding 3: verbatimModuleSyntax in e2e test helpers
- **Files:**
  - `app/tests/e2e/scenarios/capture/capture-helpers.ts`
  - `app/tests/e2e/scenarios/combat/combat-helpers.ts`
- **Error:** `'APIRequestContext' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled`
- **Fix:** Change `import { APIRequestContext }` to `import type { APIRequestContext }`

## Suggested Refactoring
1. Fix null/undefined mismatches in `import-csv.post.ts` (align with Prisma's nullable types)
2. Fix `$fetch` method type in `groupViewTabs.ts` (likely needs `method: 'DELETE' as const` or similar)
3. Add `type` keyword to `APIRequestContext` imports in both test helper files

Estimated commits: 2-3

## Resolution Log
<!-- Developer fills this in after refactoring -->
- Commits: ___
- Files changed: ___
- New files created: ___
- Tests passing: ___
