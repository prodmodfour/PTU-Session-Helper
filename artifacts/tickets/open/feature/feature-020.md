---
id: feature-020
title: Healing Item System
priority: P2
severity: MEDIUM
status: open
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
