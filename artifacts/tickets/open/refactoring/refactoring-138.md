---
id: refactoring-138
title: "Remaining entity mutation sites in aoo-resolve, breather, healing-item, living-weapon"
category: CODE-HEALTH
priority: P4
severity: LOW
status: open
domain: combat
source: refactoring-098 resolution log (L2 grep findings)
created_by: slave-collector (plan-1772695906)
created_at: 2026-03-05
affected_files:
  - app/server/api/encounters/[id]/aoo-resolve.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/services/healing-item.service.ts
  - app/server/services/living-weapon-abilities.service.ts
---

## Summary

Refactoring-098 converted the primary damage/next-turn/move endpoints and combatant.service.ts to immutable patterns. During the L2 grep, additional mutation sites were discovered that follow the same anti-pattern but were out of scope:

1. **aoo-resolve.post.ts** — `trigger.entity.statusConditions` mutation for Dead status
2. **breather.post.ts** — `entity.statusConditions` and `entity.temporaryHp` mutations
3. **healing-item.service.ts** — `entity.currentHp`, `entity.statusConditions`, `entity.injuries` mutations
4. **living-weapon-abilities.service.ts** — `entity.currentHp` and `entity.injuries` mutations

## Suggested Fix

Apply the same immutable spread pattern used in refactoring-098 commits.

## Impact

Low — mutation is safe since objects are freshly parsed, but inconsistent with the now-established immutable convention.
