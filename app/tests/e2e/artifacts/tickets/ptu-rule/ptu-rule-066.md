---
ticket_id: ptu-rule-066
priority: P2
status: open
domain: healing
source: code-review-079
created_at: 2026-02-20
created_by: senior-reviewer
---

## Summary

Global new-day endpoint does not reset Pokemon daily move usage counters (`usedToday`, `lastUsedAt`) inside the `moves` JSON column.

## Expected Behavior (PTU Rules)

A new day should be a clean slate. All daily move usage counters should reset so Pokemon start the new day with full daily move availability.

## Actual Behavior

`POST /api/game/new-day` uses `prisma.pokemon.updateMany()` to reset `restMinutesToday` and `injuriesHealedToday`, but cannot touch the `moves` JSON column via `updateMany`. Each Pokemon's `moves` JSON retains stale `usedToday` and `lastUsedAt` values from the previous day.

While `isDailyMoveRefreshable` would correctly identify yesterday's moves as refreshable during the next extended rest, the `usedToday` counter remains non-zero. This means:
1. UI would show daily moves as "used" even after a new day
2. The counter is semantically wrong (it says "used today" but it means "used yesterday")

## Files to Change

- `app/server/api/game/new-day.post.ts` -- iterate all Pokemon, parse their `moves` JSON, reset `usedToday: 0` and `lastUsedAt: undefined` for all moves, save back

## Notes

The individual `characters/[id]/new-day.post.ts` has the same gap but is lower priority since it targets characters, not their Pokemon directly.
