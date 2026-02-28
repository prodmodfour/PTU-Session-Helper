---
id: feature-021
title: Derived Capability Calculations
priority: P2
severity: MEDIUM
status: open
domain: character-lifecycle
source: matrix-gap (Character SG-3)
matrix_source: character-lifecycle R013, R014, R015, R016, R017, R018
created_by: master-planner
created_at: 2026-02-28
---

# feature-021: Derived Capability Calculations

## Summary

Trainer movement capabilities (Overland, Swimming, Throwing Range, Power, High Jump, Long Jump) are not auto-calculated from stats and skills. Values can be stored manually but are not derived from the formulas in PTU. 6 matrix rules (3 Partial, 3 Missing).

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R013 | Power Capability | Missing — base 4 + Athletics/Combat modifiers not computed |
| R014 | High Jump Capability | Missing — no calculation from Acrobatics |
| R015 | Long Jump Capability | Missing — half Acrobatics rank not computed |
| R016 | Overland Movement Speed | Partial — raw stats stored, `3 + (Athletics+Acrobatics)/2` not implemented |
| R017 | Swimming Speed | Partial — can store manually, half Overland not auto-calculated |
| R018 | Throwing Range | Partial — can store manually, `4 + Athletics rank` not auto-calculated |

## PTU Rules

- Chapter 3/5: Trainer Physical Capabilities
- Overland = 3 + floor((Athletics rank + Acrobatics rank) / 2)
- Swimming = floor(Overland / 2)
- Throwing Range = 4 + Athletics rank
- Power = 4 + Athletics rank modifier
- High Jump = Acrobatics rank / 2
- Long Jump = Acrobatics rank

## Implementation Scope

PARTIAL-scope — can be implemented as computed properties. No design spec needed.

## Affected Areas

- `app/utils/` or `app/composables/` — capability calculation utility
- `app/components/character/` — display computed values
- `app/server/services/combatant.service.ts` — use computed movement for grid
