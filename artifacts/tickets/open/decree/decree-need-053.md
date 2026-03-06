---
id: decree-need-053
title: "Does Temporary HP absorb 'lose Hit Points' effects (Belly Drum, Life Orb)?"
priority: P3
severity: MEDIUM
status: open
domain: combat
source: code-review-352 MED-001
created_by: senior-reviewer
created_at: 2026-03-06
affected_files:
  - app/server/services/combatant.service.ts
---

## Summary

The new `HpReductionType` system (bug-058) skips Temporary HP absorption for `hpLoss` type effects (Belly Drum, Life Orb recoil). However, PTU p.247 states Temporary HP is "always lost first from damage or any other effects," which could include HP loss effects.

## Problem

PTU has two relevant rules in tension:

1. **PTU p.236 (line 794-798):** "Effects that say 'loses Hit Points' or that set Hit Points to a certain value instead of 'deals damage' do not have Defensive Stats applied to these Hit Point changes nor cause Injuries from Massive Damage."

2. **PTU p.247 (line 1653-1658):** "Temporary Hit Points are always lost first from damage or any other effects. Damage carries over directly to real Hit Points once the Temporary Hit Points are lost."

Rule 1 exempts HP loss from "Defensive Stats" and "Massive Damage" -- but Temporary HP is neither a Defensive Stat nor Massive Damage. Rule 2 says Temp HP absorbs "any other effects" beyond just damage.

## Current Implementation

`calculateDamage()` in `combatant.service.ts` (line 118) only absorbs temp HP when `lossType === 'damage'`. Both `hpLoss` and `setHp` bypass temp HP entirely. This means Belly Drum's 50% HP loss comes directly from real HP even if the Pokemon has temp HP.

## Decision Needed

Should `hpLoss` type effects (Belly Drum, Life Orb recoil) be absorbed by Temporary HP first?

Options:
1. **Current behavior (bypass temp HP):** "Loses Hit Points" means specifically real HP. Temp HP is a shield against incoming effects but HP loss is an internal cost. Belly Drum sacrifices real HP as a price for the buff.
2. **Absorb temp HP first:** PTU p.247's "any other effects" language encompasses HP loss. A Pokemon with temp HP effectively has a buffer against all HP reduction, including self-inflicted costs.
3. **Type-dependent:** `hpLoss` absorbs temp HP (Life Orb recoil is incoming; Belly Drum is a cost), `setHp` does not (directly sets real HP value). This requires distinguishing sub-types within HP loss.

## Impact

Affects `calculateDamage()` temp HP absorption logic in `combatant.service.ts`. If ruling changes to Option 2, the condition on line 118 would change from `lossType === 'damage'` to `lossType !== 'setHp'`.
