---
ticket_id: ptu-rule-126
title: "Snow Boots conditional Overland speed penalty not mechanically enforced"
priority: P4
severity: LOW
domain: combat
source: rules-review-198 MED-01
created_by: slave-collector (plan-20260228-153856)
created_at: 2026-02-28
status: open
---

# ptu-rule-126: Snow Boots conditional Overland speed penalty not mechanically enforced

## Summary

PTU p.293: Snow Boots "lower your Overland Speed by -1 while on ice or deep snow." The ptu-rule-120 implementation stores the Naturewalk (Tundra) capability from Snow Boots but does not mechanically enforce the conditional -1 Overland penalty. The penalty is documented in the item description for GM reference only.

## PTU References

- `core/09-gear-and-items.md` line 1701-1702: "Snow Boots grant you the Naturewalk (Tundra) capability, but lower your Overland Speed by -1 while on ice or deep snow."

## Affected Files

- `app/utils/equipmentBonuses.ts` — would need a `conditionalSpeedPenalty` mechanism
- `app/constants/equipment.ts` — Snow Boots entry would need conditional penalty data
- Terrain system would need "ice or deep snow" granularity within Tundra terrain

## Dependencies

Requires the terrain system to distinguish "ice or deep snow" from general Tundra terrain. The current terrain painter does not have this granularity (Tundra maps to `'normal'` base type).

## Impact

Minor — a trainer wearing Snow Boots on Tundra terrain has Overland Speed 1 higher than it should be. The penalty is documented in the item description for manual GM adjustment.
