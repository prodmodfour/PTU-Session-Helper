---
ticket_id: ptu-rule-063
type: ptu-rule
priority: P2
status: open
source_ecosystem: dev
target_ecosystem: dev
created_by: game-logic-reviewer
created_at: 2026-02-19
domain: vtt-grid
severity: MEDIUM
affected_files:
  - app/composables/useGridMovement.ts
---

## Summary

Water terrain swim check is hardcoded to `false` for all combatants. Pokemon and trainers with Swim capabilities are incorrectly blocked from moving through water terrain on the VTT grid.

## PTU Rule Reference

`core/07-combat.md`, p.231:
> "You may not move through Underwater Terrain during battle if you do not have a Swim Capability."

The rule implies that combatants WITH a Swim capability CAN move through water terrain. Currently, `getTerrainCostAt()` in `useGridMovement.ts` line 73 passes `canSwim: false` to the terrain store, treating all combatants as non-swimmers regardless of their actual capabilities.

## Expected Behavior

The `getTerrainCostAt` function (or `isValidMove`) should check whether the specific combatant has a Swim capability and pass the correct `canSwim` value. Combatants with Swim should be able to move through water terrain (at 2x cost per `TERRAIN_COSTS`). Combatants without Swim should be blocked (Infinity cost, current behavior).

## Current Behavior

All combatants are treated as non-swimmers. Water terrain is impassable for everyone, even Pokemon with Swim capabilities.

## Affected Code

```typescript
// app/composables/useGridMovement.ts, line 73
const getTerrainCostAt = (x: number, y: number): number => {
  return terrainStore.getMovementCost(x, y, false) // TODO: Pass canSwim based on combatant
}
```

The TODO comment already acknowledges this gap. The fix would require:
1. Making `getTerrainCostAt` accept a combatant ID parameter
2. Looking up the combatant's Swim capability from encounter data
3. Passing the correct `canSwim` boolean to `terrainStore.getMovementCost`

## Discovery Context

Found during rules-review-050 while verifying bug-012 terrain movement fix (commit `49a7fb2`). This is a pre-existing issue, not introduced by the reviewed commits.
