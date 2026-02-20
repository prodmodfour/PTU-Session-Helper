---
ticket_id: refactoring-049
priority: P2
status: open
category: EXT-DUPLICATE
source: code-review-080
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Scene-frequency move enforcement has several code quality issues flagged by code-review-080.

## Issues

1. `move.post.ts` line 113 mutates `pokemonEntity.moves` directly (should use immutable pattern)
2. `dbUpdates` array is `Promise.all`-ed twice — second call re-awaits already-resolved promises
3. `start.post.ts` mutates combatants directly in forEach (unlike `end.post.ts` which uses immutable `.map()`)
4. Missing test: `resetSceneUsage` preserving `usedToday` on Daily moves
5. `incrementMoveUsage` tracks `usedThisScene` for Daily moves but `checkMoveFrequency` never reads it (dead data)
6. Dead reference check in `next-scene.post.ts` line 41

## Affected Files

- `app/server/api/encounters/[id]/move.post.ts`
- `app/server/api/encounters/[id]/start.post.ts`
- `app/server/api/encounters/[id]/next-scene.post.ts`
- `app/utils/moveFrequency.ts`
- `app/tests/unit/utils/moveFrequency.test.ts`
