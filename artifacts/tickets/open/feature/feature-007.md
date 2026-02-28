---
id: feature-007
title: Pokemon Level-Up Allocation UI
priority: P1
severity: HIGH
status: open
domain: pokemon-lifecycle
source: matrix-gap (GAP-PLC-2)
matrix_source: pokemon-lifecycle R014, R015, R027, R028
created_by: master-planner
created_at: 2026-02-28
---

# feature-007: Pokemon Level-Up Allocation UI

## Summary

Level-up milestones are detected and displayed (`checkLevelUp`, `PokemonLevelUpPanel`, `LevelUpNotification`) but there is no UI for the GM to act on them. Stat point allocation, ability assignment at levels 20/40, and move learning all require manual JSON editing. 4 matrix rules classified as Partial.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R014 | Abilities — Level 20 | Partial — milestone detected, no assignment UI |
| R015 | Abilities — Level 40 | Partial — milestone detected, no assignment UI |
| R027 | Level Up — Stat Point | Partial — +1 stat point reported, no allocation UI enforcing Base Relations Rule |
| R028 | Level Up — Move Check | Partial — new moves reported from learnset, no UI to add to active set |

## PTU Rules

- Level 20: choose second ability from Basic/Advanced list
- Level 40: choose third ability from any list (Basic/Advanced/High)
- Each level: +1 stat point allocated to any base stat (must respect Base Relations Rule)
- Each level: check learnset for new moves, optionally add to active move set (max 6)

## Implementation Scope

FULL-scope feature requiring design spec. Interacts with existing `PokemonLevelUpPanel` and `LevelUpNotification` components.

## Affected Areas

- `app/components/pokemon/PokemonLevelUpPanel.vue` — add allocation controls
- `app/components/pokemon/LevelUpNotification.vue` — add action buttons
- `app/server/api/pokemon/` — stat allocation + ability assignment endpoints
- `app/composables/` — level-up allocation logic
