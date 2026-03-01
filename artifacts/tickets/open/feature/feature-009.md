---
id: feature-009
title: Trainer XP & Advancement Tracking
priority: P1
severity: HIGH
status: in-progress
domain: character-lifecycle
source: matrix-gap (SG-2)
matrix_source: character-lifecycle R053, R054, R060
created_by: master-planner
created_at: 2026-02-28
design_ref: artifacts/designs/design-trainer-xp-001/
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

## Design Reference

**Design spec:** `artifacts/designs/design-trainer-xp-001/`

| Tier | Scope | Key Files |
|------|-------|-----------|
| P0 | Core XP model, XP management endpoints, auto-level trigger, GM XP award UI | `trainerExperience.ts`, `useTrainerXp.ts`, `TrainerXpPanel.vue`, `xp.post.ts` |
| P1 | +1 XP on new species capture, batch trainer XP after encounters, quest/milestone XP from scenes | `attempt.post.ts` (modified), `TrainerXpSection.vue`, `trainer-xp-distribute.post.ts` |

**Applicable decrees:** decree-030 (significance cap at x5)

## Affected Areas

- `app/prisma/schema.prisma` — HumanCharacter: trainerXp, capturedSpecies fields
- `app/server/api/characters/` — XP management endpoints
- `app/server/api/capture/attempt.post.ts` — +1 XP on new species
- `app/server/api/encounters/` — Batch trainer XP distribution
- `app/composables/` — useTrainerXp composable
- `app/components/character/` — TrainerXpPanel
- `app/components/encounter/` — TrainerXpSection, XpDistributionModal integration
- `app/types/character.ts` — HumanCharacter type update

## Resolution Log

- 2026-03-01: Design spec created — `design-trainer-xp-001/` with _index, shared-specs, spec-p0, spec-p1, testing-strategy
- 2026-03-01: P0 implementation complete — 9 commits on `slave/2-dev-feature-009-p0-20260301`
  - `9f2116f8` feat: add trainerExperience.ts pure utility
  - `ffd4e2fa` feat: add trainerXp/capturedSpecies to schema
  - `7a4aceea` feat: add to types, serializers, PUT endpoint
  - `13fc558f` feat: add XP management endpoints (xp.post, xp-history.get)
  - `6c0db88d` feat: add useTrainerXp composable
  - `1044a780` feat: add TrainerXpPanel component
  - `2eff700b` feat: integrate into character sheet and CharacterModal
  - `ff0c62f9` fix: JSDoc comment esbuild parse error
  - `b9f174bb` test: 47 unit tests (T1-T4)
  - Files changed: 10 (4 new, 6 modified) + 3 test files
