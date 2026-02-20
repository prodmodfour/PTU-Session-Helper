---
ticket_id: refactoring-046
priority: P3
status: open
category: EXT-DUPLICATE
source: code-review-075
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Trainer capabilities display (markup + SCSS) is duplicated between `gm/characters/[id].vue` and `HumanStatsTab.vue`. AP restore loop is duplicated between `scenes/[id]/activate.post.ts` and `scenes/[id]/deactivate.post.ts`.

## Affected Files

- `app/pages/gm/characters/[id].vue` — capabilities section
- `app/components/character/tabs/HumanStatsTab.vue` — capabilities section (duplicate)
- `app/server/api/scenes/[id]/activate.post.ts` — AP restore loop
- `app/server/api/scenes/[id]/deactivate.post.ts` — AP restore loop (duplicate)

## Suggested Refactoring

1. Extract `CapabilitiesDisplay.vue` component used by both character views
2. Extract `restoreSceneAp()` helper used by both scene endpoints
