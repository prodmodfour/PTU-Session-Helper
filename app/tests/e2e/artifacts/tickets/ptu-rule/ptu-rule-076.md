---
ticket_id: ptu-rule-076
priority: P3
status: open
domain: combat
source: rules-review-101
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

The breather server endpoint (`/api/encounters/[id]/breather.post.ts`) does not independently set `shiftActionUsed = true`. It relies on a prior client-side `useAction(combatantId, 'shift')` call in the composable. This is fragile coupling — if the endpoint is called without the client-side action tracking (e.g., from a different client or test), the shift action goes untracked.

## Expected Behavior

The server endpoint should authoritatively mark `shiftActionUsed = true` on the combatant, since Take a Breather is a Full Action that consumes both Standard and Shift actions (PTU p.245).

## Actual Behavior

The endpoint sets `standardActionUsed = true` and `hasActed = true` but omits `shiftActionUsed = true`. The shift flag is only set by the client-side composable before the API call.

## Affected Files

- `app/server/api/encounters/[id]/breather.post.ts` — lines 97-99
