---
ticket_id: refactoring-015
priority: P2
categories:
  - RACE-CONDITION
  - TEST-FLAKINESS
affected_files:
  - app/server/api/encounters/[id]/serve.post.ts
discovered_by: playtester
discovered_during: refactoring-010 regression run (2026-02-16)
---

# refactoring-015: Non-atomic serve mutex causes flaky parallel test failures

## Problem

`serve.post.ts` uses a two-step, non-atomic operation to ensure only one encounter is served at a time:

```typescript
// Step 1: Unserve all encounters
await prisma.encounter.updateMany({
  where: { isServed: true },
  data: { isServed: false }
})

// Step 2: Serve this encounter
const encounter = await prisma.encounter.update({
  where: { id },
  data: { isServed: true }
})
```

Between steps 1 and 2 (or between step 2 and a subsequent read), another request can call the same endpoint — its step 1 unserves everything, including the encounter that was just served by the first request.

## Impact

- `combat-workflow-wild-encounter-001` Phase 1c intermittently fails: `expect(encounter.isServed).toBe(true)` gets `false`
- 5+ test files call `serveEncounter()` concurrently with `fullyParallel: true`
- The race window is small, so failures are intermittent (~1 in 3-5 runs)
- 11 downstream tests are skipped when Phase 1c fails (serial test suite)

## Suggested Fix

Wrap both operations in a Prisma transaction:

```typescript
const encounter = await prisma.$transaction(async (tx) => {
  await tx.encounter.updateMany({
    where: { isServed: true },
    data: { isServed: false }
  })
  return tx.encounter.update({
    where: { id },
    data: { isServed: true }
  })
})
```

This ensures atomicity — no other request can interleave between the unserve-all and the serve-one.

## Evidence

- Regression run 2026-02-16: failed 1/3 runs, passed 2/3 runs (timing-dependent)
- Previous result (`run_id: 2026-02-15-002`) passed — consistent with intermittent race
- No refactoring-010 code touches serve/unserve logic; failure is purely from parallel test contention
