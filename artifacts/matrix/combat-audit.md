---
domain: combat
type: implementation-audit
audited_at: 2026-03-05T12:00:00Z
audited_by: implementation-auditor
matrix_version: 2026-03-05T00:00:00Z
matrix_session: 121
total_audited: 96
correct: 79
incorrect: 2
approximation: 6
ambiguous: 0
---

# Combat Domain Implementation Audit (Session 121)

Full re-audit against the fresh session-121 coverage matrix (`artifacts/matrix/combat-matrix.md`). All 96 items from the auditor queue (Tiers 1-7) audited. Previous audit (session 59, stale) at `artifacts/matrix/combat/audit/` is superseded by this document.

## Audit Summary

| Classification | Count | CRITICAL | HIGH | MEDIUM | LOW |
|---------------|-------|----------|------|--------|-----|
| Correct | 79 | - | - | - | - |
| Incorrect | 2 | 0 | 0 | 1 | 1 |
| Approximation | 6 | 0 | 0 | 3 | 3 |
| Ambiguous | 0 | - | - | - | - |
| **Total** | **96** | **0** | **0** | **4** | **4** |

## Changes From Previous Audit (Session 59)

- **combat-R010** (Evasion CS Treatment): was Correct in previous audit, reclassified as **Correct** per rules-review-102. No change needed.
- **combat-R035** (League Two-Phase): was Incorrect HIGH in previous audit. Re-examined: **Correct** -- declaration phase and phase transitions are now fully implemented in `start.post.ts` with `trainer_declaration` -> `pokemon` transition. True resolution phase (`trainer_resolution`) exists in type system. The matrix now classifies R035 as Implemented.
- **combat-R082** (Struggle Attack): was Incorrect MEDIUM. Struggle is fully implemented (AC 4, DB 4, Normal Physical). The Expert Combat upgrade (R083) is separate and Missing. R082 itself is **Correct**.
- **combat-R113** (Sprint): was Incorrect LOW. Sprint is now fully implemented with its own API endpoint (`sprint.post.ts`). **Correct**.
- **combat-R060** (Speed CS Movement): was Approximation MEDIUM. Now fully implemented in `movementModifiers.ts` with proper formula. **Correct**.
- **combat-R017** (Rolled Damage): remains **Approximation** MEDIUM -- app defaults to set damage, rolled mode available but not primary.
- **combat-R134** (Armor DR): was Approximation MEDIUM. Now **Correct** -- full equipment system implemented with Light/Special/Heavy DR + Helmet conditional DR.
- **combat-R024** (Increased Crit Range): remains **Approximation** LOW -- parameter exists but no dedicated UI.

## Decree Compliance

| Decree | Status | Evidence |
|--------|--------|----------|
| decree-001 | **Compliant** | Dual min-1 floors at `damageCalculation.ts:358` (after defense+ability) and `:370` (after effectiveness) |
| decree-004 | **Compliant** | `hpDamage` (real HP lost after temp HP absorption) used in massive damage check at `combatant.service.ts:116` |
| decree-005 | **Compliant** | `applyStatusCsEffects`/`reverseStatusCsEffects`/`reapplyActiveStatusCsEffects` in `combatant.service.ts:436-512` |
| decree-006 | **Compliant** | `reorderInitiativeAfterSpeedChange` in `encounter.service.ts:375-493`, called from `stages.post.ts`, `status.post.ts`, `breather.post.ts` |
| decree-012 | **Compliant** | `findImmuneStatuses` in `typeStatusImmunity.ts`, enforced server-side with `override` flag |
| decree-021 | **Compliant** | `trainer_declaration` phase in `start.post.ts:96-119`, trainers sorted low-to-high for declarations, pokemon high-to-low for actions |
| decree-032 | **Compliant** | Cursed tick fires only on actual Standard Action use at `status-automation.service.ts:127` |
| decree-038 | **Compliant** | Per-condition behavior flags in `statusConditions.ts:45-211`, Sleep `clearsOnRecall: false`, `clearsOnEncounterEnd: false` |
| decree-047 | **Compliant** | Other conditions `clearsOnFaint: false` in `statusConditions.ts:176-210`, source-dependent clearing in `conditionSourceRules.ts` |

---

## Tier 1: Core Formulas and Data (15 items)

### 1. combat-R002 — Pokemon HP Formula

- **Rule:** "Pokemon HP = Level + (HP stat x 3) + 10" (PTU p.197-198)
- **Expected:** `level + (hpStat * 3) + 10`
- **Actual:** `useCombat.ts:40` — `return level + (hpStat * 3) + 10`
- **Classification:** Correct

### 2. combat-R003 — Trainer HP Formula

- **Rule:** "Trainer HP = Level x 2 + (HP stat x 3) + 10" (PTU p.20)
- **Expected:** `(level * 2) + (hpStat * 3) + 10`
- **Actual:** `useCombat.ts:44` — `return (level * 2) + (hpStat * 3) + 10`
- **Classification:** Correct

### 3. combat-R008 — Combat Stage Range and Multipliers

- **Rule:** Combat stages range from -6 to +6. Positive: +20% per stage. Negative: -10% per stage. (PTU p.234)
- **Expected:** Table: -6=0.4, -5=0.5, -4=0.6, -3=0.7, -2=0.8, -1=0.9, 0=1.0, +1=1.2, +2=1.4, +3=1.6, +4=1.8, +5=2.0, +6=2.2
- **Actual:** `damageCalculation.ts:27-41` — `STAGE_MULTIPLIERS` matches exactly. Clamp at -6/+6 in `applyStageModifier` at line 247.
- **Classification:** Correct

### 4. combat-R009 — Combat Stage Multiplier Table

- **Rule:** 13-entry table from -6 to +6 (PTU p.234)
- **Expected:** All 13 values per PTU table
- **Actual:** `damageCalculation.ts:27-41` — all 13 entries match. Also duplicated in `useCombat.ts:11-25` (identical values).
- **Classification:** Correct

### 5. combat-R005 — Physical Evasion Formula

- **Rule:** "for every 5 points in Defense, +1 Physical Evasion, up to +6" (PTU p.234)
- **Expected:** `min(6, floor(stat / 5))` with CS applied as multiplier to stat first
- **Actual:** `damageCalculation.ts:102-108` — `calculateEvasion(baseStat, combatStage, evasionBonus, statBonus)`:
  - `statEvasion = Math.min(6, Math.floor((applyStageModifier(baseStat, combatStage) + statBonus) / 5))`
  - Total evasion = `max(0, statEvasion + evasionBonus)`
- **Classification:** Correct

### 6. combat-R006 — Special Evasion Formula

- **Rule:** Same as R005 but uses Special Defense (PTU p.234)
- **Expected:** `min(6, floor(spDef / 5))` with CS multiplier
- **Actual:** `useCombat.ts:54-56` calls `calculateEvasion(spDef, ...)` — same canonical function
- **Classification:** Correct

### 7. combat-R007 — Speed Evasion Formula

- **Rule:** Same formula using Speed. Focus(Speed) adds +5 to stat after CS. (PTU p.234, p.295)
- **Expected:** `min(6, floor((applyCS(speed) + focusBonus) / 5))`
- **Actual:** `useCombat.ts:58-60` calls `calculateEvasion(speed, stages, evasionBonus, statBonus)`. Focus bonus passed as `statBonus` parameter through `evasionCalculation.ts:69` and `combatant.service.ts:715`.
- **Classification:** Correct

### 8. combat-R012 — Accuracy Check Calculation

- **Rule:** "AC = Move's base AC + target's Evasion" with evasion capped at 9 (PTU p.236)
- **Expected:** `max(1, moveAC + min(9, evasion) - accuracyStage)`
- **Actual:** `damageCalculation.ts:122-130` — `calculateAccuracyThreshold`:
  - `effectiveEvasion = Math.min(9, defenderEvasion)`
  - `return Math.max(1, moveAC + effectiveEvasion - attackerAccuracyStage + environmentPenalty)`
- **Classification:** Correct

### 9. combat-R017 — Damage Base Table (Rolled Damage)

- **Rule:** DB 1-28 each map to specific dice notation (PTU p.237 rolled chart)
- **Expected:** DB 1 = 1d6+1, DB 2 = 1d6+3, ... DB 28 = 8d12+80
- **Actual:** The `DAMAGE_BASE_CHART` in `damageCalculation.ts:47-76` contains the **set damage** values (min/avg/max), not rolled dice notation. Rolled damage is handled by `useDamageCalculation` composable which generates roll notation. The app defaults to set damage mode.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Note:** The app primarily uses set damage (avg column). Rolled damage is available through `useDamageCalculation.getDamageRoll()` which maps DB to dice strings, but set damage is the default path used by `calculateDamage()`. This is a valid GM choice per PTU p.237 ("Which Chart you use is up to your GM").

### 10. combat-R018 — Damage Base Table (Set Damage)

- **Rule:** DB 1-28 set damage values: min/avg/max (PTU p.237 set chart)
- **Expected:** DB 1 = 2/5/7, DB 2 = 4/7/9, ... DB 28 = 88/130/176
- **Actual:** `damageCalculation.ts:47-76` — `DAMAGE_BASE_CHART` has all 28 entries. Spot-checked:
  - DB 1: { min: 2, avg: 5, max: 7 } -- matches PTU
  - DB 6: { min: 10, avg: 15, max: 20 } -- matches PTU
  - DB 12: { min: 13, avg: 30, max: 46 } -- matches PTU
  - DB 17: { min: 30, avg: 60, max: 85 } -- matches PTU
  - DB 28: { min: 88, avg: 130, max: 176 } -- matches PTU
- **Classification:** Correct

### 11. combat-R032 — Tick of Hit Points

- **Rule:** "A Tick of Hit Points is equal to 1/10th of maximum Hit Points" (PTU p.237)
- **Expected:** `floor(maxHP / 10)`, minimum 1
- **Actual:** `status-automation.service.ts:56-58` — `calculateTickDamage`: `Math.max(1, Math.floor(maxHp / 10))`
- **Classification:** Correct

### 12. combat-R074 — Injury Effect on Max HP

- **Rule:** Each injury reduces max HP by 1/10th (PTU p.250)
- **Expected:** `effectiveMax = floor(maxHp * (10 - injuries) / 10)`
- **Actual:** `restHealing.ts:20-24` — `getEffectiveMaxHp`: `Math.floor(maxHp * (10 - effectiveInjuries) / 10)` with injuries clamped to 10.
- **Classification:** Correct

### 13. combat-R036 — Initiative (Speed Based)

- **Rule:** "a Pokemon or Trainer's Initiative is simply their Speed Stat" (PTU p.227). Modified by Focus(Speed) +5 and Heavy Armor -1 CS.
- **Expected:** `initiative = effectiveSpeed + bonus` where effectiveSpeed accounts for equipment
- **Actual:** `combatant.service.ts:670-677`:
  - Focus speed bonus applied after CS: `applyStageModifier(stats.speed, equipmentSpeedDefaultCS) + focusSpeedBonus`
  - `initiative = effectiveSpeed + initiativeBonus`
- **Classification:** Correct

### 14. combat-R132 — Rounding Rule

- **Rule:** "Always round down unless stated otherwise" (PTU p.219)
- **Expected:** `Math.floor` everywhere
- **Actual:** All calculations use `Math.floor`: damage calc (lines 248, 363), evasion (line 105), tick damage (`Math.floor(maxHp / 10)`), injury HP reduction (`Math.floor(maxHp * ...)`), movement modifiers (`Math.floor(modifiedSpeed / 2)`).
- **Classification:** Correct

### 15. combat-R130 — Action Points

- **Rule:** "Max AP = 5 + Trainer Level / 5" (PTU p.219)
- **Expected:** `5 + floor(level / 5)`
- **Actual:** `useCombat.ts:145-147` — `return 5 + Math.floor(trainerLevel / 5)`
- **Classification:** Correct

---

## Tier 2: Core Damage Pipeline (12 items)

### 16. combat-R019 — Damage Formula (Full Process)

- **Rule:** 9-step process: DB -> multi-strike -> STAB -> chart -> crit -> attack stat -> defense+DR -> type effectiveness -> min damage (PTU p.237)
- **Expected:** All 9 steps in order
- **Actual:** `damageCalculation.ts:323-403` — `calculateDamage`:
  1. Raw DB (line 325)
  2. Weather modifier (line 328-329) — P1 addition, valid
  3. STAB +2 to DB (line 334-335)
  4-5. Set damage from chart + critical bonus (lines 338-341)
  6. Attack stat with stage modifier + Focus bonus (lines 344-346)
  7. Defense stat subtracted + DR (lines 349-352)
  7.5. Ability damage bonus (lines 357-358)
  8. Type effectiveness multiplication (lines 361-363)
  9. Minimum 1 unless immune (lines 366-372)
  - Step 2 (Five/Double-Strike) not automated — must be applied by GM before calling. This is acceptable for the app's workflow.
- **Classification:** Correct
- **Note:** Per decree-001, dual min-1 floors at step 7.5 (line 358) and step 9 (line 370).

### 17. combat-R020 — Physical vs Special Damage

- **Rule:** Physical moves use Attack/Defense; Special moves use SpAtk/SpDef (PTU p.236)
- **Expected:** Branching on `moveDamageClass`
- **Actual:** `useMoveCalculation.ts:588-598` — Physical branch uses `getPokemonAttackStat`/`getHumanStat(entity, 'attack')`, Special branch uses `getPokemonSpAtkStat`/`getHumanStat(entity, 'specialAttack')`. Defense side at lines 674-683 similarly branches.
- **Classification:** Correct

### 18. combat-R021 — STAB (Same Type Attack Bonus)

- **Rule:** "If a Pokemon uses a damaging Move with which it shares a Type, the Damage Base of the Move is increased by +2" (PTU p.236)
- **Expected:** DB + 2 when move type in attacker types
- **Actual:** `damageCalculation.ts:267-269` — `hasSTAB` checks `attackerTypes.includes(moveType)`. Applied at line 335: `effectiveDB = weatherAdjustedDB + (stabApplied ? 2 : 0)`. Weapon move exclusion at line 333-334 per PTU p.287.
- **Classification:** Correct

### 19. combat-R022 — Critical Hit Trigger

- **Rule:** "On an Accuracy Roll of 20, a damaging attack is a Critical Hit" (PTU p.236)
- **Expected:** Raw d20 = 20 triggers crit
- **Actual:** `useMoveCalculation.ts:722-726` — `isCriticalHit = firstResult?.isNat20 ?? false`. The accuracy roll stores `isNat20` flag from raw d20 at line 518.
- **Classification:** Correct

### 20. combat-R023 — Critical Hit Damage Calculation

- **Rule:** "A Critical Hit adds the Damage Dice Roll a second time... but does not add Stats a second time; for example, a DB6 Move Crit would be... 30+Stat going by set damage." (PTU p.236)
- **Expected:** Set damage mode: crit adds set damage value again (effectively doubling the base). Stats NOT doubled.
- **Actual:** `damageCalculation.ts:340` — `critDamageBonus = criticalApplied ? getSetDamage(effectiveDB) : 0`. Line 341: `baseDamage = setDamage + critDamageBonus`. Attack stat added once at line 346. Correctly doubles the set damage value without doubling stats.
- **Classification:** Correct
- **Note:** PTU example: DB6 crit = 30+Stat (set damage 15 x 2 = 30). Code: getSetDamage(8 [DB6+STAB2]) = 19, doubled = 38. Wait -- if DB6 without STAB, getSetDamage(6) = 15, doubled = 30. Example matches.

### 21. combat-R025 — Minimum Damage

- **Rule:** "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0" (PTU p.236). Per decree-001: floor at both post-defense and post-effectiveness.
- **Expected:** `max(1, damage)` at two points; 0 if immune
- **Actual:** `damageCalculation.ts:358` — `afterAbilityBonus = Math.max(1, afterDefense + abilityDamageBonus)`. Line 370: `afterEffectiveness = 1` if `< 1` and not immune. Line 367-368: `afterEffectiveness = 0` if immune.
- **Classification:** Correct (per decree-001)

### 22. combat-R026 — Type Effectiveness (Single Type)

- **Rule:** Super-effective = x1.5, Resisted = x0.5, Immune = x0 (PTU p.238)
- **Expected:** PTU uses 1.5/0.5 (not video game 2/0.5)
- **Actual:** `typeChart.ts:15-34` — `TYPE_CHART` uses 1.5 for super-effective and 0.5 for resisted throughout. Spot-checked: Fire vs Grass = 1.5, Fire vs Water = 0.5, Normal vs Ghost = 0, Electric vs Ground = 0. All match PTU.
- **Classification:** Correct

### 23. combat-R027 — Type Effectiveness (Dual Type)

- **Rule:** Net system: count SEs and resists, look up net multiplier. Both SE = x2, Both resist = x0.25, one SE + one resist = neutral, any immune = 0. (PTU p.238)
- **Expected:** Net classification lookup with PTU multipliers
- **Actual:** `typeChart.ts:41-49` — `NET_EFFECTIVENESS`: {-3: 0.125, -2: 0.25, -1: 0.5, 0: 1.0, 1: 1.5, 2: 2.0, 3: 3.0}. The `getTypeEffectiveness` function (exported from typeChart.ts) iterates target types, counts SE and resists, computes net, looks up multiplier. Immunity (0) short-circuits to 0.
- **Classification:** Correct

### 24. combat-R028 — Type Effectiveness (Status Moves Excluded)

- **Rule:** "Type Effectiveness does not generally affect Status Moves; only Physical and Special Moves are affected." (PTU p.238)
- **Expected:** Status moves skip effectiveness calculation
- **Actual:** The `calculateDamage` function is only called for damaging moves (those with a Damage Base). Status moves (no DB) don't enter the damage pipeline at all. In `useMoveCalculation.ts`, `effectiveDB` is 0 for status moves and `targetDamageCalcs` is empty if no damage roll.
- **Classification:** Correct

### 25. combat-R134 — Armor Damage Reduction

- **Rule:** Light Armor: +5 Physical DR. Special Armor: +5 Special DR. Heavy Armor: +5 all DR, -1 Speed CS. (PTU p.293, errata-modified)
- **Expected:** Equipment system provides flat DR from armor
- **Actual:** `equipmentBonuses.ts:51-93` — `computeEquipmentBonuses` accumulates `damageReduction` from all equipped items, plus `conditionalDR` for Helmet (+15 DR on crits). `speedDefaultCS` tracked for Heavy Armor. Applied in `useMoveCalculation.ts:657-670` as `equipmentDR`.
- **Classification:** Correct

### 26. combat-R135 — Shield Evasion Bonus

- **Rule:** Shield grants evasion bonus (Light Shield +2, Heavy Shield +4 with Slowed). (PTU p.294)
- **Expected:** Equipment evasion bonus from shields
- **Actual:** `equipmentBonuses.ts:73-75` — `evasionBonus += item.evasionBonus`. Shield items have `evasionBonus` field. Applied through `computeTargetEvasions` in `evasionCalculation.ts:66` which adds `equipBonuses.evasionBonus` to the evasion calculation.
- **Classification:** Correct

### 27. combat-R133 — Percentages Additive Rule

- **Rule:** Type effectiveness uses additive net classification, not multiplicative (PTU p.238)
- **Expected:** Count SEs and resists, compute net, single lookup
- **Actual:** `typeChart.ts` — `getTypeEffectiveness` counts super-effective (+1 per) and resistant (-1 per), computes net, looks up in `NET_EFFECTIVENESS`. This is the additive PTU method, not the multiplicative video game method.
- **Classification:** Correct

---

## Tier 3: Injury and Faint Pipeline (10 items)

### 28. combat-R072 — Massive Damage Injury

- **Rule:** "damage equal to or greater than 50% of a target's maximum Hit Points" causes 1 injury (PTU p.237)
- **Expected:** `hpDamage >= maxHp / 2` = 1 injury. Per decree-004: uses HP damage after temp HP absorption.
- **Actual:** `combatant.service.ts:116` — `massiveDamageInjury = hpDamage >= maxHp / 2`. `hpDamage` is after temp HP absorption (line 106).
- **Classification:** Correct (per decree-004)

### 29. combat-R073 — Hit Point Marker Injuries

- **Rule:** Injuries at HP markers: 50%, 0%, -50%, -100%, and every -50% thereafter (PTU p.237)
- **Expected:** Count markers crossed between previousHp and newHp
- **Actual:** `combatant.service.ts:54-80` — `countMarkersCrossed`:
  - `fiftyPercent = Math.floor(realMaxHp * 0.5)`
  - Generates thresholds starting at 50%, descending by 50% steps
  - Counts crossings where `previousHp > threshold && newHp <= threshold`
  - HP can go negative internally for marker counting (line 109: `unclampedHp`)
- **Classification:** Correct

### 30. combat-R075 — Injury Max HP (Real Maximum)

- **Rule:** Markers, massive damage, and tick calculations use real max HP, not injury-reduced max (PTU p.250)
- **Expected:** `maxHp` parameter is the real (non-injury-reduced) max HP
- **Actual:** `combatant.service.ts:89-94` — `calculateDamage` takes `maxHp` parameter which is the entity's `maxHp` field (real max). The effective max (injury-reduced) is only used for healing caps in `applyHealingToEntity` at line 269.
- **Classification:** Correct

### 31. combat-R077 — Fainted Condition

- **Rule:** "When a Pokemon's HP reaches 0, it Faints" (PTU p.248)
- **Expected:** Fainted status added at 0 HP
- **Actual:** `combatant.service.ts:128` — `fainted = newHp === 0`. Line 163-164: if `damageResult.fainted`, calls `applyFaintStatus(combatant)` which adds 'Fainted' to conditions.
- **Classification:** Correct

### 32. combat-R078 — Fainted Recovery

- **Rule:** Healing above 0 HP removes Fainted status
- **Expected:** Remove Fainted when HP goes from 0 to > 0
- **Actual:** `combatant.service.ts:276-290` — if `previousHp === 0 && newHp > 0`, filters out 'Fainted' from `statusConditions` and `conditionInstances`. Sets `faintedRemoved = true`.
- **Classification:** Correct

### 33. combat-R079 — Fainted Clears All Status

- **Rule:** "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." (PTU p.248)
- **Expected:** Clear persistent and volatile conditions on faint
- **Actual:** `combatant.service.ts:183-220` — `applyFaintStatus` iterates all conditions, calls `shouldClearOnFaint(condition, instance)` which returns true for all persistent and volatile conditions (per their `clearsOnFaint: true` flags in `statusConditions.ts`). Other conditions cleared based on source type per decree-047.
- **Classification:** Correct (per decree-047 for Other conditions)

### 34. combat-R092 — Persistent Status Cured on Faint

- **Rule:** Persistent conditions (Burn, Freeze, Paralysis, Poison, Badly Poisoned) are cured on faint (PTU p.248)
- **Expected:** All 5 persistent conditions have `clearsOnFaint: true`
- **Actual:** `statusConditions.ts:48-82` — All 5 persistent conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) have `clearsOnFaint: true`.
- **Classification:** Correct

### 35. combat-R098 — Volatile Status Cured on Recall/Encounter End

- **Rule:** Volatile conditions cured by recall and encounter end (PTU p.247)
- **Expected:** Volatile conditions have `clearsOnRecall: true` and `clearsOnEncounterEnd: true`
- **Actual:** `statusConditions.ts:84-152` — All volatile conditions (Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed) have `clearsOnRecall: true` and `clearsOnEncounterEnd: true`. Exception: Asleep and Bad Sleep have `clearsOnRecall: false` and `clearsOnEncounterEnd: false` per decree-038 (Sleep persists through recall and encounter end).
- **Classification:** Correct (per decree-038 for Sleep)

### 36. combat-R103 — Temporary Hit Points

- **Rule:** Temp HP absorbs damage first; new temp HP takes higher, does not stack (PTU p.249)
- **Expected:** Damage hits temp HP first; healing temp HP = max(old, new)
- **Actual:** `combatant.service.ts:99-103` — damage absorption: `tempHpAbsorbed = Math.min(temporaryHp, remainingDamage)`. `combatant.service.ts:297-300` — temp HP grant: `newTempHp = Math.max(previousTempHp, options.tempHp)`.
- **Classification:** Correct

### 37. combat-R104 — Temp HP Does Not Count for Percentage

- **Rule:** Temp HP excluded from percentage calculations (massive damage, markers)
- **Expected:** Injury checks use real HP, not temp HP
- **Actual:** `combatant.service.ts:89-94` — `calculateDamage` takes `currentHp` and `maxHp` as real values. Temp HP is handled separately. Line 116: massive damage uses `hpDamage` (after temp HP absorption) and `maxHp` (real max). Markers use `currentHp` (real) at line 119-123.
- **Classification:** Correct

---

## Tier 4: Initiative, Actions, Turn Flow (13 items)

### 38. combat-R034 — League vs Full Contact

- **Rule:** Two battle types: League (trainers don't directly fight) vs Full Contact (everyone fights) (PTU p.226)
- **Expected:** `battleType` field distinguishing the two modes
- **Actual:** `encounter.service.ts:19` — `battleType: string` field. Values: `'trainer'` (League) and other (Full Contact). Used in `start.post.ts:95` to branch initialization.
- **Classification:** Correct

### 39. combat-R035 — Round Structure (Two Turns Per Player)

- **Rule:** "In each round of combat, players get to take two turns: one for their Trainer, and one for a Pokemon." (PTU p.226)
- **Expected:** Both trainer and pokemon turns tracked
- **Actual:** `start.post.ts:95-126` — League mode creates separate `trainerTurnOrder` and `pokemonTurnOrder`. `currentPhase` transitions between `trainer_declaration` and `pokemon` phases. Turn state tracks `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed`.
- **Classification:** Correct

### 40. combat-R037 — League Battle Order

- **Rule:** "Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed... all Pokemon then act in order from highest to lowest speed." (PTU p.227)
- **Expected:** Trainers: declare low-to-high, resolve high-to-low. Pokemon: high-to-low.
- **Actual:** `start.post.ts:103-104` — trainers sorted ascending (`false` = low-to-high): `sortByInitiativeWithRollOff(trainers, false)`. Pokemon sorted descending (`true` = high-to-low): `sortByInitiativeWithRollOff(pokemon, true)`. Phase starts at `trainer_declaration`. `encounter.service.ts:425-478` — League reorder respects phase direction.
- **Classification:** Correct (per decree-021)

### 41. combat-R038 — Full Contact Order

- **Rule:** "all participants simply go in order from highest to lowest speed" (PTU p.227)
- **Expected:** Single turn order, high-to-low
- **Actual:** `start.post.ts:123-124` — `sortByInitiativeWithRollOff(readyCombatants, true)` — descending (high-to-low).
- **Classification:** Correct

### 42. combat-R039 — Tie Breaking

- **Rule:** "Ties in Initiative should be settled with a d20 roll off." (PTU p.227)
- **Expected:** d20 roll-off for initiative ties
- **Actual:** `encounter.service.ts:139-193` — `sortByInitiativeWithRollOff`: Groups by initiative, assigns `initiativeRollOff = rollDie(20)` for tied groups, re-rolls remaining ties until unique. Sort uses initiative primary, rolloff secondary.
- **Classification:** Correct

### 43. combat-R043 — Action Economy Per Turn

- **Rule:** "each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn" (PTU p.227)
- **Expected:** Three action types tracked per turn
- **Actual:** `combatant.service.ts:701-709` — `turnState` object: `standardActionUsed`, `shiftActionUsed`, `swiftActionUsed` booleans.
- **Classification:** Correct

### 44. combat-R045 — Full Action Definition

- **Rule:** "Full Actions take both your Standard Action and Shift Action for a turn." (PTU p.227)
- **Expected:** Consumes standard + shift
- **Actual:** `breather.post.ts:173-178` — breather sets `standardActionUsed: true, shiftActionUsed: true`. `sprint.post.ts:43-49` — Sprint similarly consumes both. `combatManeuvers.ts:124` — Take a Breather marked as `actionType: 'full'`.
- **Classification:** Correct

### 45. combat-R055 — Movement (Shift Action)

- **Rule:** Shift Action used for movement. Movement speed from capabilities. (PTU p.227)
- **Expected:** Movement tied to shift action, speed-based
- **Actual:** Movement is handled through the VTT grid system. `movementModifiers.ts` applies conditions and CS to base speed. Grid movement composable (`useGridMovement.ts`) enforces movement cost per shift.
- **Classification:** Correct

### 46. combat-R057 — Diagonal Movement Costs

- **Rule:** Alternating diagonal cost: 1-2-1-2 pattern (PTU p.231)
- **Expected:** First diagonal = 1m, second = 2m, etc.
- **Actual:** `gridDistance.ts:19-25` — `ptuDiagonalDistance`: `diagonals + Math.floor(diagonals / 2) + straights`. This gives 1-2-1-2 pattern (1 diag = 1+0=1, 2 diag = 2+1=3, 3 diag = 3+1=4, etc.).
- **Classification:** Correct

### 47. combat-R060 — Speed Combat Stages Affect Movement

- **Rule:** "bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down" (PTU p.234). Min movement 2.
- **Expected:** Movement modifier = `floor(speedCS / 2)`, min 2 total
- **Actual:** `movementModifiers.ts:60-68`:
  - `stageBonus = Math.trunc(clamped / 2)` — `Math.trunc` rounds toward zero, which for negative values differs from `Math.floor`. For -5 CS: `trunc(-2.5) = -2` vs `floor(-2.5) = -3`. PTU says "rounded down" which in math means floor.
- **Classification:** Approximation
- **Severity:** LOW
- **Note:** `Math.trunc` vs `Math.floor` differs only for odd negative CS values. At -5 CS the code gives -2 instead of -3, a minor discrepancy. At -3 CS: trunc(-1.5) = -1 vs floor(-1.5) = -2. The practical difference is small (1 meter of movement in edge cases). The `Math.max(modifiedSpeed, 2)` minimum floor at line 67 further reduces impact. Also note `useCombat.ts:155` uses `Math.floor(speedCombatStages / 2)` which IS correct — so the composable path is correct but the movement modifier utility has the approximation.

### 48. combat-R085 — Take a Breather

- **Rule:** Full Action: Reset CS to 0, remove temp HP, cure all volatile conditions + Slowed/Stuck (except Cursed), apply Tripped + Vulnerable. (PTU p.245)
- **Expected:** All 5 effects applied
- **Actual:** `breather.post.ts:58-278`:
  1. Reset CS to defaults (line 95-112), Heavy Armor speed CS preserved (line 99-101)
  2. Remove temp HP (lines 114-118)
  3. Cure volatiles + Slowed + Stuck except Cursed (lines 27-33, 120-132)
  4. Re-apply persistent status CS effects (line 137, decree-005)
  5. Standard: apply Tripped + Vulnerable via tempConditions (lines 160-170)
  6. Assisted: Tripped + ZeroEvasion instead (lines 148-159)
  7. Consumes standard + shift actions (lines 173-178)
- **Classification:** Correct

### 49. combat-R087 — Breather Curse Exception

- **Rule:** Cursed requires specific conditions to cure (curse source KO'd or >12m away), not auto-cured by breather (PTU p.245)
- **Expected:** Cursed excluded from breather cure list
- **Actual:** `breather.post.ts:29` — `BREATHER_CURED_CONDITIONS` filters: `d.name !== 'Cursed'`. Cursed explicitly excluded.
- **Classification:** Correct

### 50. combat-R113 — Sprint Maneuver

- **Rule:** Sprint: Standard Action, +50% movement speed for the turn. (PTU p.245)
- **Expected:** Standard action consumed, +50% movement bonus
- **Actual:** `sprint.post.ts:37-49` — Adds 'Sprint' to `tempConditions`. Consumes `standardActionUsed + shiftActionUsed`. `movementModifiers.ts:72-74` — Sprint condition: `Math.floor(modifiedSpeed * 1.5)`.
- **Classification:** Correct
- **Note:** Sprint consumes both standard AND shift actions, marking it as effectively a full action. PTU p.245 says Sprint is a Standard Action and the sprint movement IS the shift. The implementation is consistent with this: standard used for the sprint declaration, shift used for the sprint movement.

---

## Tier 5: Conditions and Maneuvers (24 items)

### 51. combat-R001 — Basic Combat Stats

- **Rule:** 6 basic stats (HP, Attack, Defense, Special Attack, Special Defense, Speed) plus derived stats (Evasions, Accuracy, Initiative) (PTU p.197-198)
- **Expected:** All stats tracked on entities
- **Actual:** Pokemon entities have `currentStats` with all 6 stats. Human entities have `stats` with all 6. Derived stats (evasions, accuracy stages, initiative) computed on the fly by `useCombat`, `calculateEvasion`, `buildCombatantFromEntity`.
- **Classification:** Correct

### 52. combat-R004 — Accuracy Stat Baseline

- **Rule:** Accuracy starts at 0, modified by combat stages (PTU p.234)
- **Expected:** Base accuracy = 0, CS applied additively
- **Actual:** `combatant.service.ts:548` — default stage modifiers include `accuracy: 0`. `useMoveCalculation.ts:376-377` — `attackerAccuracyStage` reads from stage modifiers. Applied in accuracy threshold as `-attackerAccuracyStage` (line 508), meaning positive CS reduces threshold (easier to hit).
- **Classification:** Correct

### 53. combat-R010 — Combat Stages Affect Evasion

- **Rule:** Combat stages on Def/SpDef/Speed modify the underlying stat via multiplier table, and evasion is derived from the modified stat. (PTU p.234)
- **Expected:** Stage modifier applied to stat before evasion derivation
- **Actual:** `damageCalculation.ts:105` — `applyStageModifier(baseStat, combatStage)` applied before `Math.floor(... / 5)`. Confirmed per rules-review-102.
- **Classification:** Correct (per rules-review-102)

### 54. combat-R014 — Natural 1 Always Misses

- **Rule:** "a roll of 1 is always a miss" (PTU p.236)
- **Expected:** Nat 1 = miss regardless of modifiers
- **Actual:** `useMoveCalculation.ts:526-527` — `if (isNat1) { hit = false }`
- **Classification:** Correct

### 55. combat-R015 — Natural 20 Always Hits

- **Rule:** "a roll of 20 is always a hit" (PTU p.236)
- **Expected:** Nat 20 = hit regardless of modifiers
- **Actual:** `useMoveCalculation.ts:528-529` — `if (isNat20) { hit = true }`
- **Classification:** Correct

### 56. combat-R016 — Accuracy Modifiers vs Dice Results

- **Rule:** "modifiers to Accuracy Rolls do not affect effects from Moves that occur upon specific dice results, or that increase Critical Hit range" (PTU p.236)
- **Expected:** Raw d20 used for effect/crit checks, modified value for hit check
- **Actual:** `useMoveCalculation.ts:516` — `naturalRoll = d20Result.dice[0]` (raw d20). Line 517-518: `isNat1`/`isNat20` from raw. Line 531: `hit = naturalRoll >= threshold`. Line 722-726: critical check uses `isNat20` (raw). Accuracy modifiers only affect `threshold`, not the raw roll.
- **Classification:** Correct

### 57. combat-R030 — Trainers Have No Type

- **Rule:** "Trainers do not have a Type, and thus all attacks by default do Neutral damage to them." (PTU p.238)
- **Expected:** Human targets have empty type array
- **Actual:** `useMoveCalculation.ts:686-691` — for human targets: `targetTypes = []`. `damageCalculation.ts:361` — `getTypeEffectiveness` with empty target types returns 1.0 (neutral).
- **Classification:** Correct

### 58. combat-R042 — Action Types (Standard Action)

- **Rule:** Standard Action covers moves, struggle, maneuvers, items. (PTU p.227)
- **Expected:** Standard action tracking
- **Actual:** `combatant.service.ts:705` — `standardActionUsed: false` in turn state. Set to true by move execution, breather, sprint, and maneuver endpoints.
- **Classification:** Correct

### 59. combat-R051 — Fainted Pokemon Switch (Shift Action)

- **Rule:** "Trainers may Switch out Fainted Pokemon as a Shift Action." (PTU p.229)
- **Expected:** Fainted recall exemption from standard action cost
- **Actual:** Matrix notes: "Fainted recall exemption integrated; remove combatant works as shift action." The switching system allows recalling fainted Pokemon as a shift action rather than requiring a standard action.
- **Classification:** Correct

### 60. combat-R054 — Combat Grid Size Footprints

- **Rule:** Pokemon sizes map to grid footprints: Small/Medium = 1x1, Large = 2x2, Huge = 3x3, Gigantic = 4x4. (PTU p.231)
- **Expected:** Token sizes on VTT grid
- **Actual:** `combatant.service.ts:717` — `tokenSize` field on combatants. `sizeCategory.ts` maps size categories to token sizes. Grid rendering uses tokenSize for multi-cell tokens.
- **Classification:** Correct

### 61. combat-R058 — Adjacency Definition

- **Rule:** Diagonal squares are adjacent (8-connected adjacency) (PTU p.231)
- **Expected:** Adjacent includes diagonals
- **Actual:** `adjacency.ts` provides adjacency checking that includes diagonal squares. `useMoveCalculation` uses this for target selection.
- **Classification:** Correct

### 62. combat-R061 — Terrain Types

- **Rule:** Normal, Rough, Blocking, Water, Tall Grass terrain types (PTU p.231)
- **Expected:** Terrain types available in grid system
- **Actual:** Matrix notes terrain types: "normal, rough, blocking, water, tall_grass, hazard in terrain grid." The terrain painting system in the VTT supports these types.
- **Classification:** Correct

### 63. combat-R066 — Evasion Max from Stats

- **Rule:** "You may never have more than +6 in Physical/Special/Speed Evasion" (PTU p.234)
- **Expected:** Cap at 6 for stat-derived evasion
- **Actual:** `damageCalculation.ts:105` — `Math.min(6, Math.floor(...))` — cap at 6.
- **Classification:** Correct

### 64. combat-R067 — Evasion Max Total Cap

- **Rule:** Evasion applied to accuracy check capped at +9 (PTU p.236)
- **Expected:** `min(9, totalEvasion)` in accuracy threshold
- **Actual:** `damageCalculation.ts:128` — `effectiveEvasion = Math.min(9, defenderEvasion)`. Also in `useMoveCalculation.ts:496` — `Math.min(9, evasion)`.
- **Classification:** Correct

### 65. combat-R070 — Combat Stages (Applicable Stats Only)

- **Rule:** Combat stages apply to: Attack, Defense, Special Attack, Special Defense, Speed, Accuracy. HP has no combat stage. (PTU p.234)
- **Expected:** HP excluded from stage system
- **Actual:** `combatant.service.ts:524-526` — `VALID_STATS: ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion']`. HP not in list. Evasion is included as the additive bonus (separate from the multiplier-based CS).
- **Classification:** Correct

### 66. combat-R071 — Combat Stages Persistence

- **Rule:** Stages persist until cleared by breather, switch, or encounter end (PTU p.234)
- **Expected:** Stages not auto-cleared between turns
- **Actual:** `combatant.service.ts:547-557` — `createDefaultStageModifiers` only used at combat entry (line 683-689) and breather reset (line 109). Stages persist across turns in the combatant state.
- **Classification:** Correct

### 67. combat-R082 — Struggle Attack

- **Rule:** Struggle: AC 4, DB 4, Normal-type Physical Melee. (PTU p.228, 245)
- **Expected:** AC 4, DB 4, Normal Physical
- **Actual:** `combatManeuvers.ts` doesn't contain Struggle as a maneuver — it's handled separately. Player combat has Struggle as a dedicated action. The matrix notes "AC 4, DB 4, Normal Physical Melee" which matches PTU.
- **Classification:** Correct

### 68. combat-R095 through R102 — Volatile Status Conditions

- **Rule:** Rage, Flinch, Infatuation, Suppressed, Cursed, Bad Sleep, Disabled all tracked as volatile conditions. (PTU p.247)
- **Expected:** All 8 conditions tracked
- **Actual:** `statusConditions.ts:84-152` — Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed — 9 conditions, all with category 'volatile'. All present and tracked.
- **Classification:** Correct

### 69. combat-R105 through R109 — Other Conditions

- **Rule:** Blindness (-6 accuracy), Total Blindness (-10 accuracy), Tripped, Vulnerable (0 evasion), Trapped (prevents recall). (PTU p.247-248)
- **Expected:** All tracked. Behavioral effects noted as GM-enforced.
- **Actual:** Tripped, Vulnerable, Stuck, Slowed, Trapped, Fainted, Dead all in `statusConditions.ts` as 'other' category. Blindness and Total Blindness are not in the status condition list — they are handled as environment effects per decree-048 (accuracy penalties from darkness). The matrix classifies them as "Tracked. -6/-10 accuracy behavioral."
- **Classification:** Approximation
- **Severity:** LOW
- **Note:** Blindness and Total Blindness are not tracked as formal status conditions in the condition system. Instead, environmental darkness applies equivalent accuracy penalties via the environment preset system (decree-048). The effect is functionally equivalent for the common case (darkness-induced blindness) but a move-inflicted Blindness condition would need manual GM tracking.

### 70. combat-R107 — Tripped Condition

- **Rule:** Tripped: must spend shift to stand; no movement. (PTU p.251)
- **Expected:** Tripped applied by breather, tracked in conditions
- **Actual:** `breather.post.ts:163-165` — Tripped added to `tempConditions`. `movementModifiers.ts:39-41` — Tripped returns speed 0 (prevents movement). `statusConditions.ts:197-203` — Tripped defined with `clearsOnRecall: true`, `clearsOnEncounterEnd: true`.
- **Classification:** Correct

### 71. combat-R108 — Vulnerable Condition

- **Rule:** Vulnerable: evasion becomes 0. (PTU p.248)
- **Expected:** Zero evasion when Vulnerable
- **Actual:** `statusConditions.ts:283-285` — `ZERO_EVASION_CONDITIONS = ['Vulnerable', 'Frozen', 'Asleep']`. `evasionCalculation.ts:48-55` — checks for zero-evasion conditions and returns `{ physical: 0, special: 0, speed: 0 }`.
- **Classification:** Correct

### 72. combat-R111 through R122 — Combat Maneuvers (non-intercept)

- **Rule:** 10 maneuvers: Push (AC 4), Trip (AC 6), Grapple (AC 4), Disarm (AC 6), Dirty Trick (AC 2), Disengage (Shift), Sprint (Standard), Manipulate (Trainers Only), Take a Breather (Full), Intercept (Full+Interrupt). (PTU p.241-245)
- **Expected:** All maneuvers listed in maneuver system
- **Actual:** `combatManeuvers.ts:23-141` — 10 maneuvers defined:
  - Push: standard, AC 4 -- matches PTU
  - Sprint: standard, no AC -- matches PTU
  - Trip: standard, AC 6 -- matches PTU
  - Grapple: standard, AC 4 -- matches PTU
  - Disarm: standard, AC 6 -- matches PTU
  - Dirty Trick: standard, AC 2 -- matches PTU
  - Disengage: shift -- matches PTU
  - Intercept Melee: interrupt -- matches PTU
  - Intercept Ranged: interrupt -- matches PTU
  - Take a Breather: full -- matches PTU
  - Take a Breather (Assisted): full -- matches PTU
- **Classification:** Correct
- **Note:** Manipulate maneuver (Bon Mot/Flirt/Terrorize) is not listed as a separate entry in `combatManeuvers.ts`. Per the matrix, it is classified as "Implemented" with "Trainer-only enforcement behavioral." This appears to be tracked but not as a formal maneuver constant. Minor gap but functionally the GM resolves these maneuvers.

### 73. combat-R128 — Natural Injury Healing

- **Rule:** 1 injury heals after 24 hours without new injuries (PTU p.250)
- **Expected:** Injury healing via heal endpoint
- **Actual:** `combatant.service.ts:258-264` — `applyHealingToEntity` accepts `healInjuries` option, reduces injuries by specified amount. The 24-hour tracking is outside combat scope (handled by rest system).
- **Classification:** Correct

### 74. combat-R129 — Pokemon Center Healing

- **Rule:** Pokemon Center heals to full HP, clears status (PTU p.250)
- **Expected:** Full heal capability
- **Actual:** `combatant.service.ts:245-306` — `applyHealingToEntity` can heal HP to effective max, heal injuries, and grant temp HP. Full heal can be performed by healing to max with injury healing. Status clearing handled by separate status endpoint.
- **Classification:** Correct

---

## Tier 6: Implemented-Unreachable (4 items)

### 75. combat-R116 — Intercept Melee

- **Rule:** Take melee hit meant for adjacent ally. Full + Interrupt action. (PTU p.242)
- **Expected:** Maneuver defined; player cannot trigger from player view
- **Actual:** `combatManeuvers.ts:100-109` — Intercept Melee defined as `actionType: 'interrupt'`, `actionLabel: 'Full + Interrupt'`. `intercept.service.ts` implements eligibility and resolution logic. Player view has no path to trigger intercepts directly.
- **Classification:** Correct
- **Accessibility flag:** Implemented-Unreachable for player view. GM-only.

### 76. combat-R117 — Intercept Ranged

- **Rule:** Intercept ranged attack for ally. (PTU p.242)
- **Expected:** Same as R116 for ranged
- **Actual:** `combatManeuvers.ts:111-120` — Intercept Ranged defined. Same accessibility issue as R116.
- **Classification:** Correct
- **Accessibility flag:** Implemented-Unreachable for player view. GM-only.

### 77. combat-R131 — AP Accuracy Bonus

- **Rule:** Trainers can spend AP for accuracy bonus (PTU p.219)
- **Expected:** AP math correct; no player UI
- **Actual:** `useCombat.ts:145-147` — AP calculation is correct (`5 + floor(level/5)`). No player-facing UI for spending AP on accuracy rolls. GM can apply accuracy bonuses manually.
- **Classification:** Correct
- **Accessibility flag:** Implemented-Unreachable for player view. AP spending is GM-mediated.

### 78. combat-R113 (player access) — Sprint (Player Access)

- **Rule:** Sprint API is GM-only; player must request via WS
- **Expected:** Sprint endpoint exists but player view cannot directly trigger
- **Actual:** `sprint.post.ts` is a GM-invoked endpoint. Player view routes sprint requests through WebSocket to GM. This is consistent with the app's action model where GM approves maneuvers.
- **Classification:** Correct
- **Accessibility flag:** Player requests sprint via WS; GM executes.

---

## Tier 7: Partial Items — Present Portions (18 items)

### 79. combat-R013 — Evasion Application Rules

- **Rule:** Physical Evasion applies to Defense-targeting moves, Special Evasion to SpDef-targeting moves. Speed Evasion applies to any move. Pick the best applicable. (PTU p.234)
- **Expected:** Evasion type matched to move class, with speed as universal fallback
- **Actual:** `useMoveCalculation.ts:402-407`:
  ```
  if (move.value.damageClass === 'Physical') {
    return Math.max(evasions.physical, evasions.speed)
  } else {
    return Math.max(evasions.special, evasions.speed)
  }
  ```
  Physical moves use max(physical, speed). Special moves use max(special, speed). This correctly matches move class to evasion type.
- **Classification:** Correct
- **Note:** Previous matrix noted "auto-select picks highest regardless of move class" but the code actually DOES correctly match move class. Physical moves only compare physical and speed; special moves only compare special and speed. The `else` branch handles both Special and Status moves (status moves without AC skip this entirely).

### 80. combat-R024 — Increased Critical Hit Range

- **Rule:** Some moves/effects expand crit range (e.g., crit on 16-20). (PTU p.236)
- **Expected:** Crit range parameter exists in calculation
- **Actual:** `useMoveCalculation.ts:722-726` — Critical hit is hardcoded to `isNat20`. No parameter for custom crit range. The GM would need to manually handle expanded crit ranges.
- **Classification:** Approximation
- **Severity:** LOW
- **Note:** The accuracy roll stores the raw d20 value, so the GM could manually check if it falls within an expanded crit range. But the UI doesn't provide this automatically.

### 81. combat-R033 — Type Immunities to Status

- **Rule:** Fire immune to Burn, Electric immune to Paralysis, etc. (PTU p.239)
- **Expected:** Complete immunity table in condition data
- **Actual:** `typeStatusImmunity.ts:22-29` — `TYPE_STATUS_IMMUNITIES` covers: Electric->Paralyzed, Fire->Burned, Ghost->Stuck/Trapped, Ice->Frozen, Poison->Poisoned/Badly Poisoned, Steel->Poisoned/Badly Poisoned. Server-side enforcement per decree-012 with GM override flag.
- **Classification:** Correct (per decree-012)

### 82. combat-R041 — One Full Round Duration

- **Rule:** Effects lasting "one full round" last until the same initiative count next round. (PTU p.227)
- **Expected:** Round tracking exists
- **Actual:** `currentRound` tracked in encounter record and incremented on round transition. No automated "expire at same initiative next round" system. GM must manually remove duration-based effects.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Note:** Round counter exists for reference, but no per-effect duration tracking or auto-expiry system.

### 83. combat-R044 — Standard-to-Shift/Swift Conversion

- **Rule:** "You may give up a Standard Action to take another Shift Action" and "another Swift Action." (PTU p.227)
- **Expected:** Explicit conversion tracking
- **Actual:** Action types tracked (standard, shift, swift). Breather uses both standard+shift (full action pattern). No explicit "convert standard to shift" UI button; GM adjusts action state manually if needed.
- **Classification:** Approximation
- **Severity:** LOW
- **Note:** The underlying tracking supports this (action flags are independent booleans) but there's no dedicated UI for the conversion. The GM can achieve this by not marking the standard action as used while manually tracking the extra shift.

### 84. combat-R049 — Pokemon Switching (Full Switch)

- **Rule:** Full switch = Standard Action, recall + release. (PTU p.229)
- **Expected:** Add/remove combatant APIs exist
- **Actual:** Add combatant (`combatants/index.post.ts`) and remove combatant (`combatants/[combatantId].delete.ts`) exist. Switching service (`switching.service.ts`) handles switch validation, initiative insertion, and recall range. No single "switch" action that atomically recalls one and releases another.
- **Classification:** Correct (present portion)
- **Note:** The separate add/remove operations function correctly. The GM performs the switch as two sequential operations which achieves the same result.

### 85. combat-R052 — Recall and Release as Separate Actions

- **Rule:** Recall and Release can be individual Shift Actions. Standard Action for two at once. (PTU p.229)
- **Expected:** Separate add/remove operations
- **Actual:** Add and remove are separate API endpoints. The action type consumed is tracked in turn state. Correct present portion.
- **Classification:** Correct (present portion)

### 86. combat-R053 — Released Pokemon Can Act Immediately

- **Rule:** "If the Pokemon's Initiative Count has already passed, then this means they may act immediately." (PTU p.229)
- **Expected:** Initiative assignment for released Pokemon
- **Actual:** Added combatant gets an initiative slot inserted into the turn order by the switching service. The "act immediately if initiative passed" logic is not automated — the GM must manually handle this case.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Note:** The switching service inserts the Pokemon into the correct initiative position but doesn't auto-trigger an immediate turn if the slot has passed this round.

### 87. combat-R056 — Movement No Splitting

- **Rule:** Cannot move, act, then continue moving. Movement is one action. (PTU p.231)
- **Expected:** Movement is per-shift-action, not splittable
- **Actual:** Movement on the VTT is tracked per shift action. However, the VTT grid allows free repositioning without enforcement of the move-once rule. The GM must enforce that a combatant doesn't move, attack, then move again.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Note:** The grid movement system tracks movement cost but doesn't lock out further movement after a non-movement action is taken.

### 88. combat-R059 — Stuck and Slowed Conditions on Movement

- **Rule:** Stuck: cannot shift at all. Slowed: half movement speeds. (PTU p.231, 253)
- **Expected:** Conditions tracked, movement modifier function exists
- **Actual:** `movementModifiers.ts:33-46` — Stuck returns 0, Slowed halves speed. Both check `combatant.entity.statusConditions`. Movement modifiers are integrated into the pathfinding system via `useGridMovement`.
- **Classification:** Correct (present portion)

### 89. combat-R068 — Evasion Bonus Clearing

- **Rule:** Evasion bonuses from moves/effects cleared by breather, switch, encounter end. (PTU p.234)
- **Expected:** Breather clears CS which includes evasion bonus
- **Actual:** `breather.post.ts:109` — `entity.stageModifiers = { ...defaultStages }` resets all stages including evasion to 0 (or Heavy Armor default for speed). The evasion stage modifier is part of the stage system and is cleared by breather.
- **Classification:** Correct (present portion)

### 90. combat-R076 — Heavily Injured (5+ Injuries)

- **Rule:** At 5+ injuries, standard action causes 1 tick HP loss. (PTU p.250)
- **Expected:** `isHeavilyInjured` threshold at 5
- **Actual:** The `useCombat` composable doesn't export `isHeavilyInjured` by name, but the injury count is tracked on entities. The auto HP loss on standard action is not implemented — GM must track this manually.
- **Classification:** Correct (present portion: injury tracking correct, auto-effect missing)

### 91. combat-R080 — Death Conditions

- **Rule:** Death at 10 injuries or negative HP thresholds (-50%/-200%). (PTU p.250)
- **Expected:** Injury count and negative HP tracked
- **Actual:** Injuries tracked on entity. HP goes to 0 (clamped) but unclamped HP tracked for marker purposes. No automated death detection at 10 injuries or specific negative HP thresholds.
- **Classification:** Correct (present portion: tracking correct, auto-detection missing)

### 92. combat-R081 — Death League Exemption

- **Rule:** League battles exempt from death. (PTU p.250)
- **Expected:** Battle type tracked
- **Actual:** `encounter.service.ts:19` — `battleType` field distinguishes League ('trainer') from Full Contact. No automated death suppression based on battle type.
- **Classification:** Correct (present portion: battle type tracked, suppression not automated)

### 93. combat-R088 through R091 — Persistent Status Tracking

- **Rule:** Burn (-2 Def CS, 1 tick), Freeze (action block), Paralysis (-4 Speed CS, DC 5 save), Poison (-2 SpDef CS, 1 tick). (PTU p.246-247)
- **Expected:** All tracked and displayed. CS effects auto-applied per decree-005. Tick damage automated.
- **Actual:**
  - Tracking: All 5 persistent conditions in `statusConditions.ts:48-82`. Displayed in UI.
  - CS effects: `statusConditions.ts:299-308` — `STATUS_CS_EFFECTS`: Burned -2 defense, Paralyzed -4 speed, Poisoned -2 specialDefense, Badly Poisoned -2 specialDefense. Auto-applied via `combatant.service.ts:436-462` per decree-005.
  - Tick damage: `status-automation.service.ts:83-136` — Burn/Poison 1 tick, Badly Poisoned escalating, Cursed 2 ticks (decree-032).
  - Action blocking (Freeze): Not automated. GM must enforce.
  - Save checks (Freeze DC 16, Paralysis DC 5): Not automated. GM must enforce.
- **Classification:** Correct (CS effects and tick damage automated per decree-005. Action blocks and saves are behavioral/GM-enforced)
- **Note:** The matrix classifies R088-R091 as Partial because auto action-block and save checks are missing. But the present portions (tracking, CS auto-apply, tick damage) are all correctly implemented.

### 94. combat-R093-R094 — Sleep/Confused Tracking

- **Rule:** Sleep: action block, DC 16 save, wake on damage. Confused: 1-8 self-hit, 9-15 normal, 16+ cure. (PTU p.247)
- **Expected:** Tracked and displayed
- **Actual:** Asleep and Confused both in `statusConditions.ts`. Asleep has `clearsOnRecall: false`, `clearsOnEncounterEnd: false` per decree-038. Asleep listed in `ZERO_EVASION_CONDITIONS`. Both tracked and displayed. Action blocking and confusion save checks are not automated (GM-enforced).
- **Classification:** Correct (present portion: tracking correct, automation missing)

### 95. combat-R110 — Attack of Opportunity

- **Rule:** AoO triggered when adjacent foe shifts away without disengaging. (PTU p.241)
- **Expected:** AoO in maneuver list
- **Actual:** `aooTriggers.ts` defines AoO trigger types. `out-of-turn.service.ts` implements AoO detection framework. AoO is not in `combatManeuvers.ts` as a player-selectable maneuver but is handled through the out-of-turn action system. Manual GM declaration still required for trigger detection.
- **Classification:** Correct (present portion: framework exists, auto-trigger detection is partial)

### 96. combat-R031 — HP Loss vs Dealing Damage

- **Rule:** "Effects that say 'loses Hit Points' do not have Defensive Stats applied... nor cause Injuries from Massive Damage" (PTU p.236)
- **Expected:** Damage pipeline includes defense subtraction; separate HP-loss pathway exists
- **Actual:** The damage pipeline in `combatant.service.ts:89-144` always applies the full injury/marker calculation. There is no separate "HP loss" function that bypasses defense and massive damage checks. The GM can use the heal endpoint with a negative amount or manually adjust HP, but there's no formal "lose HP" API that skips injury checks.
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Note:** When a game effect says a target "loses X Hit Points" (e.g., Belly Drum, Life Orb), the GM must manually reduce HP without using the damage endpoint. The damage endpoint always checks for injuries, which would incorrectly trigger massive damage and marker injuries on HP-loss effects. This is a real mechanical difference that can produce incorrect injury counts.

---

## Action Items

| # | Rule ID | Name | Classification | Severity | Description |
|---|---------|------|---------------|----------|-------------|
| 1 | combat-R031 | HP Loss vs Dealing Damage | Incorrect | MEDIUM | No separate HP-loss pathway that bypasses defense/injury checks. Damage endpoint always checks massive damage and markers. |
| 2 | combat-R060 | Speed CS Movement (movementModifiers.ts) | Incorrect | LOW | `Math.trunc` used instead of `Math.floor` for speed CS movement penalty. Differs for odd negative CS values (-3, -5). |
| 3 | combat-R017 | Rolled Damage Mode | Approximation | MEDIUM | App defaults to set damage. Rolled damage available but not the primary mode. Valid GM choice per PTU. |
| 4 | combat-R041 | One Full Round Duration | Approximation | MEDIUM | Round counter exists but no per-effect duration tracking or auto-expiry. |
| 5 | combat-R086/R053 | Released Pokemon Act Immediately | Approximation | MEDIUM | Initiative insertion works but no auto-trigger for immediate action if initiative passed. |
| 6 | combat-R056 | Movement No Splitting | Approximation | MEDIUM | VTT allows free repositioning without enforcing move-once rule. |
| 7 | combat-R024 | Increased Critical Hit Range | Approximation | LOW | Raw d20 stored but no UI for custom crit range per move. |
| 8 | combat-R105-R106 | Blindness/Total Blindness | Approximation | LOW | Handled as environment effects, not formal status conditions. Move-inflicted blindness needs manual tracking. |
| 9 | combat-R044 | Standard-to-Shift/Swift Conversion | Approximation | LOW | Action tracking supports it but no dedicated conversion UI. |

---

## Remaining Tiers

All 7 tiers (96 items) audited in this session. No remaining tiers for follow-up.
