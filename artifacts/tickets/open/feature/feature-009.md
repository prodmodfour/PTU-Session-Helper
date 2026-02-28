---
id: feature-009
title: Trainer XP & Advancement Tracking
priority: P1
severity: HIGH
status: open
domain: character-lifecycle
source: matrix-gap (SG-2)
matrix_source: character-lifecycle R053, R054, R060
created_by: master-planner
created_at: 2026-02-28
---

# feature-009: Trainer XP & Advancement Tracking

## Summary

No trainer experience tracking exists. Trainer levels are manually editable but there is no XP bank, no auto-level trigger, and no +1 XP for new species captures. 3 matrix rules (2 Partial, 1 Missing).

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R053 | Leveling Triggers | Partial — level editable, no XP/milestone tracking |
| R054 | Experience Bank | Missing — no trainer XP tracking; no auto-level at 10 XP |
| R060 | Experience From Pokemon | Partial — Pokemon ownership tracked, no +1 XP on new species |

## PTU Rules

- Trainers gain XP from: defeating opponents, catching new species, completing quests, GM milestones
- 10 XP = 1 level
- Catching a new species: +1 XP (first time only)
- GM can award arbitrary XP amounts

## Implementation Scope

FULL-scope feature. Tightly coupled with feature-008 (Level-Up Workflow) — when XP triggers a level-up, the milestone workflow activates.

## Affected Areas

- `app/prisma/schema.prisma` — HumanCharacter: trainerXp field
- `app/server/api/characters/` — XP management endpoints
- `app/stores/` — XP tracking in character store
- `app/components/character/` — XP display and management UI
