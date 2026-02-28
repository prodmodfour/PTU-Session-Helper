---
ticket_id: ptu-rule-120
title: Equipment-granted Naturewalk not auto-derived from equipped items
severity: LOW
priority: P4
domain: combat+character-lifecycle
source: rules-review-191 MED-01
created_by: slave-collector (plan-20260228-072000)
status: open
---

## Summary

Trainers can gain Naturewalk from equipped items (Snow Boots grant Naturewalk Tundra, Jungle Boots grant Naturewalk Forest — PTU 09-gear-and-items.md:1701-1714). Currently, the `capabilities` field on HumanCharacter is manually edited by the GM, separate from the equipment system. If a trainer equips Jungle Boots, the GM must manually add `"Naturewalk (Forest)"` to capabilities. If the trainer unequips, the GM must manually remove it.

The equipment system already tracks equipped items with stat bonuses and DR, but capabilities from equipment are not auto-derived.

## Affected Files

- `app/utils/equipmentBonuses.ts` — currently computes stat/DR bonuses but not capabilities
- `app/utils/combatantCapabilities.ts` — consumes capabilities but doesn't source from equipment
- `app/constants/equipment.ts` — item catalog (needs capability annotations)

## PTU References

- PTU 09-gear-and-items.md:1701-1714 (Snow Boots, Jungle Boots)
- PTU 04-trainer-classes.md:2798-2801 (Naturewalk capability definition)

## Suggested Fix

1. Add a `grantedCapabilities: string[]` field to equipment item definitions
2. In `equipmentBonuses.ts` or a new utility, compute derived capabilities from equipped items
3. Merge equipment-derived capabilities with manually-entered capabilities in `getCombatantNaturewalks`
4. Auto-add/remove capabilities when equipment changes (or display a union of manual + equipment-derived)

## Impact

Low — current manual approach works. This is a convenience/consistency improvement.
