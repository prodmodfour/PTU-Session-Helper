---
id: feature-020
title: Healing Item System
priority: P2
severity: MEDIUM
status: in-progress
design_spec: design-healing-items-001
domain: healing
source: matrix-gap (GAP-HEAL-2)
matrix_source: healing R039, R040, R041
created_by: master-planner
created_at: 2026-02-28
---

# feature-020: Healing Item System

## Summary

No item usage system exists for healing items. Potions, status cure items, and other consumables have no catalog, no application workflow, and no action economy tracking. 3 matrix rules (1 Partial, 2 Missing).

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R039 | Basic Restorative Items | Partial — healing endpoints exist but no item catalog or application workflow |
| R040 | Status Cure Items | Missing — no cure item catalog or status removal workflow |
| R041 | Applying Items — Action Economy | Missing — no Standard Action enforcement for item use |

## PTU Rules

- Chapter 9: Items
- Potions: heal fixed HP amounts (Potion 20, Super Potion 35, Hyper Potion 70, Max Potion full)
- Status cures: Antidote (Poison), Burn Heal, Ice Heal, Parlyz Heal, Awakening, Full Heal
- Using an item: Standard Action in combat
- Trainer can use item on adjacent Pokemon (or self)

## Implementation Scope

FULL-scope feature requiring design spec. Needs item catalog, inventory tracking, and combat action integration.

## Design Spec

Design spec: `artifacts/designs/design-healing-items-001/`

| Tier | Scope |
|------|-------|
| P0 | Item catalog constants, apply-item service (HP restoration), API endpoint, store action, basic GM UI |
| P1 | Status cure items, revive items, Full Restore combined, repulsive items |
| P2 | Standard Action enforcement, target action forfeit, self-use Full-Round, adjacency requirement, inventory consumption |

## Resolution Log

- 2026-03-01: Design spec created (`design-healing-items-001`). Status set to design-complete.
- 2026-03-01: P0 implementation complete (6 commits):
  - `c0940d17` Section A: Healing item catalog constants (`app/constants/healingItems.ts`)
  - `10677a83` Section B: Healing item service (`app/server/services/healing-item.service.ts`)
  - `1f6bc2c4` Section C: Use-item API endpoint (`app/server/api/encounters/[id]/use-item.post.ts`)
  - `fa366600` Section D: Encounter store useItem action (`app/stores/encounter.ts`)
  - `3cbd84e2` Section E: useHealingItems composable (`app/composables/useHealingItems.ts`)
  - `4ecf6b19` Section E: UseItemModal component (`app/components/encounter/UseItemModal.vue`)
  - `ca6034d7` Section E: CombatantCard integration (Use Item button + modal wiring)
