# Combat Domain — Gameplay Loops

## Loop 1: Basic Physical Attack

---
loop_id: combat-basic-physical-attack
domain: combat
ptu_refs:
  - core/07-combat.md#Making Attacks
  - core/07-combat.md#Dealing Damage
  - core/07-combat.md#Damage Charts
app_features:
  - composables/useCombat.ts
  - composables/useMoveCalculation.ts
  - composables/useEncounterActions.ts
  - server/services/combatant.service.ts
  - server/api/encounters/[id]/move.post.ts
  - server/api/encounters/[id]/damage.post.ts
sub_loops:
  - combat-minimum-damage
  - combat-stab
  - combat-type-effectiveness
  - combat-critical-hit
---

### Preconditions
- An encounter exists with at least two combatants on opposing sides
- The encounter has been started (`POST /api/encounters/:id/start`)
- The active combatant has at least one Physical move
- It is the active combatant's turn

### Steps
1. GM selects the active combatant's Physical move (e.g., Tackle — DB 5, AC 4, Normal, Physical)
2. GM selects one or more targets
3. System calculates accuracy threshold: `AC = Move AC + Target Evasion - Attacker Accuracy Stages`
   - Evasion for Physical moves = Physical Evasion = `floor(modifiedDefense / 5)`, max +6
   - Target may also add Speed Evasion (whichever is higher), but max combined Evasion applied to any check = +9
4. GM rolls accuracy (1d20). Hit if `roll >= threshold`
   - Natural 1 always misses
   - Natural 20 always hits
5. On hit, system calculates damage:
   a. Start with Move's Damage Base
   b. Apply STAB if applicable (+2 to DB)
   c. Look up Actual Damage from DB chart (set damage = average value)
   d. Add attacker's Attack stat (modified by Combat Stages: `ATK * stageMultiplier`)
   e. Subtract target's Defense stat (modified by Combat Stages: `DEF * stageMultiplier`)
   f. Minimum 1 damage after defense subtraction
   g. Apply type effectiveness multiplier (after defense)
   h. Final minimum 1 damage (or 0 if immune)
6. System subtracts damage from target: Temporary HP absorbs first, then real HP
7. System checks for injury (Massive Damage or HP marker crossing)
8. System checks for faint (HP <= 0)
9. Move execution is broadcast via WebSocket (`encounter_update`)

### PTU Rules Applied
- **Accuracy Roll**: "An Accuracy Roll is always simply 1d20" (core/07-combat.md, p236)
- **Accuracy Check**: "It's determined first taking the Move's base AC and adding the target's Evasion" (core/07-combat.md, p236)
- **Natural 1/20**: "a roll of 1 is always a miss...a roll of 20 is always a hit" (core/07-combat.md, p236)
- **Damage Formula**: "Damage = Actual Damage from chart + Attack Stat - Defense Stat" (core/07-combat.md, p236)
- **Minimum Damage**: "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0" (core/07-combat.md, p236)
- **Type Effectiveness Applied After Defense**: "After defenses and damage reduction have been applied, apply Type Weaknesses or Resistances" (core/07-combat.md, p236)

### Expected Outcomes
- Accuracy threshold = `MoveAC + min(9, targetPhysicalEvasion) - attackerAccuracyStages`
- On hit: `damage = max(1, floor(max(1, setDamage(DB) + modifiedATK - modifiedDEF) * effectiveness))`
- Target HP reduced; faint status added if HP reaches 0
- Injury gained if damage >= 50% of target max HP (Massive Damage)
- Move recorded in encounter history; WebSocket broadcasts update

### Edge Cases
- Defense higher than damage roll + ATK → still deals 1 damage minimum
- Target has 0 evasion (e.g., Vulnerable) → threshold = Move AC only
- Target is immune (effectiveness = 0) → 0 damage dealt
- Attacker has negative accuracy stages → threshold increases

---

## Loop 2: Basic Special Attack

---
loop_id: combat-basic-special-attack
domain: combat
ptu_refs:
  - core/07-combat.md#Dealing Damage
app_features:
  - composables/useCombat.ts
  - composables/useMoveCalculation.ts
sub_loops: []
---

### Preconditions
- Same as combat-basic-physical-attack, but active combatant has a Special move

### Steps
1. GM selects a Special move (e.g., Ember — DB 4, AC 2, Fire, Special)
2. GM selects target(s)
3. System calculates accuracy threshold using **Special Evasion**: `floor(modifiedSpDef / 5)`, max +6
4. GM rolls accuracy (1d20)
5. On hit, damage uses **Special Attack** stat (modified by CS) vs **Special Defense** stat (modified by CS)
6. All other damage steps identical to physical attack

### PTU Rules Applied
- **Physical vs Special**: "Physical Attacks have Defense subtracted from them; Special Attacks have Special Defense subtracted from them" (core/07-combat.md, p236)
- **Special Evasion**: "for every 5 points a Pokémon or Trainer has in Special Defense, they gain +1 Special Evasion, up to a maximum of +6" (core/07-combat.md, p234)

### Expected Outcomes
- Evasion check uses SpDef-derived evasion instead of Def-derived
- Damage = `max(1, floor(max(1, setDamage(DB) + modifiedSpATK - modifiedSpDEF) * effectiveness))`

### Edge Cases
- Same edge cases as physical attack, but with Special stats
- Speed Evasion can still be applied to Special moves (target chooses higher)

---

## Loop 3: STAB (Same Type Attack Bonus)

---
loop_id: combat-stab
domain: combat
ptu_refs:
  - core/07-combat.md#Same Type Attack Bonus
app_features:
  - composables/useCombat.ts (hasSTAB)
  - composables/useMoveCalculation.ts (effectiveDB)
sub_loops: []
---

### Preconditions
- Attacker is a Pokemon with at least one type matching the move's type
- Move is a damaging move (has Damage Base)

### Steps
1. System checks if move type matches any of the attacker's types
2. If match: Damage Base is increased by +2 before chart lookup
3. Damage calculation proceeds with the modified DB

### PTU Rules Applied
- **STAB**: "If a Pokémon uses a damaging Move with which it shares a Type, the Damage Base of the Move is increased by +2" (core/07-combat.md, p236)
- **Never apply STAB to Struggle Attacks**: "Never apply STAB to Struggle Attacks" (core/07-combat.md, p240)

### Expected Outcomes
- A Fire-type Pokemon using Ember (DB 4) gets effective DB 6
- Set damage for DB 6 = 15 (average), vs DB 4 = 11 (average) — a +4 damage increase from STAB
- STAB does NOT apply to Struggle Attacks even if type matches

### Edge Cases
- Dual-type Pokemon: STAB applies if move matches either type
- Trainers do not have types → STAB never applies to Trainer attacks
- Struggle Attacks: explicitly excluded from STAB

---

## Loop 4: Type Effectiveness

---
loop_id: combat-type-effectiveness
domain: combat
ptu_refs:
  - core/07-combat.md#Type Effectiveness
  - core/10-indices-and-reference.md#Type Chart
app_features:
  - composables/useCombat.ts (typeEffectiveness, getTypeEffectiveness)
sub_loops:
  - combat-type-immunity
---

### Preconditions
- A damaging move hits a target
- Move has a type (non-Typeless)
- Target is a Pokemon with one or two types

### Steps
1. System looks up move type vs each of the target's types
2. Multipliers are combined multiplicatively:
   - Neutral × Neutral = ×1
   - SE × Neutral = ×1.5
   - SE × SE = ×2 (doubly super effective)
   - Resisted × Neutral = ×0.5
   - Resisted × Resisted = ×0.25
   - SE × Resisted = ×1 (cancels out)
   - Immune × anything = ×0
3. Multiplier is applied **after** defense subtraction

### PTU Rules Applied
- **Super Effective**: "A Super-Effective hit will deal x1.5 damage" (core/07-combat.md, p236)
- **Doubly SE**: "A Doubly Super-Effective hit will deal x2 damage" (core/07-combat.md, p236)
- **Triply SE**: "Rare Triply-Effective Hits will deal x3 damage" (core/07-combat.md, p236)
- **Resisted**: "A Resisted Hit deals 1/2 damage; a doubly Resisted hit deals 1/4th damage" (core/07-combat.md, p236)
- **Immunity**: "If either Type is Immune, the attack does 0 damage" (core/07-combat.md, p238)
- **Trainers**: "Unlike Pokémon, Trainers do not have a Type, and thus all attacks by default do Neutral damage to them" (core/07-combat.md, p238)

### Expected Outcomes
- Damage after defense is multiplied by the combined effectiveness
- Result is floored: `Math.floor(damageAfterDefense * effectiveness)`
- Immune attacks deal 0 damage regardless of other factors

### Edge Cases
- Trainer targets always take neutral damage (no types)
- Moves like Sonic Boom or Counter: "affected by Immunity, though not by resistance" (core/07-combat.md, p239)
- Status moves are NOT affected by type effectiveness

### Sub-Loop: Type Immunity

---
loop_id: combat-type-immunity
domain: combat
ptu_refs:
  - core/07-combat.md#Type Effectiveness
app_features:
  - composables/useCombat.ts (getTypeEffectiveness)
sub_loops: []
---

#### Preconditions
- Target has a type that grants immunity to the move's type (e.g., Normal → Ghost, Ground → Flying)

#### Steps
1. System looks up effectiveness; one type returns 0
2. Combined multiplier = 0 regardless of other type
3. Damage = 0

#### Expected Outcomes
- 0 damage dealt, no injury check, no HP change
- Move is still "used" (frequency consumed) even on immunity

---

## Loop 5: Critical Hit

---
loop_id: combat-critical-hit
domain: combat
ptu_refs:
  - core/07-combat.md#Critical Hits
app_features:
  - composables/useCombat.ts (calculateDamage, rollDamageBase, getDamageByMode)
  - composables/useMoveCalculation.ts
sub_loops: []
---

### Preconditions
- A damaging move's accuracy roll results in a natural 20 (or within expanded crit range)
- Move is a damaging attack (has Damage Base)

### Steps
1. Accuracy roll results in natural 20
2. System flags the attack as a critical hit
3. Damage calculation: "adds the Damage Dice Roll a second time to the total damage dealt, but does not add Stats a second time"
   - Set damage mode: `setDamage(effectiveDB) * 2` (average doubled, stat added once)
   - Rolled mode: roll dice twice, add flat modifier twice, add stat once
4. Defense is subtracted normally
5. Type effectiveness applied normally

### PTU Rules Applied
- **Critical Hit on 20**: "On an Accuracy Roll of 20, a damaging attack is a Critical Hit" (core/07-combat.md, p236)
- **Crit Damage**: "A Critical Hit adds the Damage Dice Roll a second time to the total damage dealt, but does not add Stats a second time; for example, a DB6 Move Crit would be 4d6+16+Stat, or 30+Stat going by set damage" (core/07-combat.md, p236)
- **Expanded Crit Range**: "Some Moves or effects may cause increased critical ranges" (core/07-combat.md, p236)

### Expected Outcomes
- DB 6 normal set damage = 15. DB 6 crit set damage = 30 (15 × 2). Then + ATK - DEF.
- The app's `calculateDamage` adds `getSetDamage(effectiveDB)` twice for crits
- In `getDamageByMode`, set damage critical = `value *= 2`

### Edge Cases
- Crit + STAB: STAB modifies DB first, then crit doubles the chart damage
- Crit + type effectiveness: effectiveness applied after defense on the full crit damage
- Crit does NOT double the attacker's stat contribution
- Coup de Grâce: auto-crit with +5 bonus damage (multiplied as part of crit = +10 normally)

---

## Loop 6: Combat Stages

---
loop_id: combat-combat-stages
domain: combat
ptu_refs:
  - core/07-combat.md#Combat Stages
app_features:
  - composables/useCombat.ts (stageMultipliers, applyStageModifier)
  - server/services/combatant.service.ts (updateStageModifiers, VALID_STATS)
  - server/api/encounters/[id]/stages.post.ts
  - composables/useEncounterActions.ts (handleStages)
sub_loops:
  - combat-stages-speed-movement
  - combat-stages-evasion-bonus
---

### Preconditions
- A combatant exists in an active encounter
- A move, ability, or feature modifies combat stages

### Steps
1. GM or move effect applies stage change (e.g., Growl: -1 ATK to target)
2. System applies delta to current stage value
3. Stage is clamped to [-6, +6] range
4. Modified stat = `baseStat * stageMultiplier[stage]`
5. All calculations using that stat now use the modified value

### PTU Rules Applied
- **Stage Range**: "they may never be raised higher than +6 or lower than -6" (core/07-combat.md, p235)
- **Positive Stages**: "For every Combat Stage above 0, a Stat is raised by 20%, rounded down" (core/07-combat.md, p235)
- **Negative Stages**: "For every Combat Stage below 0, a Stat is lowered by 10%, rounded down" (core/07-combat.md, p235)
- **Multiplier Table**: -6=×0.4, -5=×0.5, -4=×0.6, -3=×0.7, -2=×0.8, -1=×0.9, 0=×1, +1=×1.2, +2=×1.4, +3=×1.6, +4=×1.8, +5=×2.0, +6=×2.2 (core/07-combat.md, p235)
- **Stages Clear on Switch/End**: "Combat Stages remain until the Pokémon or Trainer is switched out, or until the end of the encounter" (core/07-combat.md, p235)
- **HP Never Has Stages**: "Only Attack, Defense, Special Attack, Special Defense, and Speed may have Combat Stages. HP and Hit Points never have Combat Stages" (core/07-combat.md, p235)

### Expected Outcomes
- ATK at +3 CS: `floor(ATK * 1.6)`
- DEF at -2 CS: `floor(DEF * 0.8)`
- Stage at +6: stat is 220% of base (×2.2)
- Stage at -6: stat is 40% of base (×0.4)
- API returns previous value, change delta, and new value for each stat modified

### Edge Cases
- Attempting to raise beyond +6 → clamped, no error
- Attempting to lower beyond -6 → clamped, no error
- Accuracy stages: directly modify accuracy rolls (not multiplicative)
- Evasion stages: separate from stat-based evasion

### Sub-Loop: Speed Stages and Movement

---
loop_id: combat-stages-speed-movement
domain: combat
ptu_refs:
  - core/07-combat.md#Speed Combat Stages and Movement
app_features:
  - composables/useCombat.ts (calculateMovementModifier, calculateEffectiveMovement)
sub_loops: []
---

#### Preconditions
- A combatant has non-zero Speed combat stages

#### Steps
1. Speed CS is applied
2. Movement bonus/penalty = `floor(speedCS / 2)`
3. All Movement Speeds adjusted: `max(2, baseMovement + modifier)`

#### PTU Rules Applied
- **Speed CS Movement**: "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down" (core/07-combat.md, p235)
- **Minimum Movement**: "may never reduce it below 2" (core/07-combat.md, p235)

#### Expected Outcomes
- Speed CS +6 → +3 to all movement
- Speed CS -4 → -2 to all movement
- Speed CS +1 → +0 to movement (floor(1/2) = 0)

### Sub-Loop: Stage-Based Evasion Bonus

---
loop_id: combat-stages-evasion-bonus
domain: combat
ptu_refs:
  - core/07-combat.md#Combat Stages
  - core/07-combat.md#Evasion
app_features:
  - composables/useCombat.ts (calculateEvasion)
sub_loops: []
---

#### Preconditions
- A combatant has positive Defense, SpDef, or Speed combat stages

#### Steps
1. Stage modifier increases the stat (e.g., DEF at +2 CS → DEF × 1.4)
2. Evasion recalculated from modified stat: `floor(modifiedStat / 5)`, max +6
3. Higher stat → higher evasion

#### PTU Rules Applied
- **Stages Affect Evasion**: "Raising your Defense, Special Defense, and Speed Combat Stages can give you additional evasion from the artificially increased defense score" (core/07-combat.md, p234)
- **Evasion Cap from Stats**: "you can never gain more than +6 Evasion from Stats" (core/07-combat.md, p234)

#### Expected Outcomes
- DEF 15, +0 CS → Physical Evasion = floor(15/5) = 3
- DEF 15, +3 CS → modified DEF = floor(15 × 1.6) = 24 → Physical Evasion = floor(24/5) = 4
- Evasion from stats capped at +6 regardless of how high the modified stat gets

---

## Loop 7: Initiative and Turn Order

---
loop_id: combat-initiative-order
domain: combat
ptu_refs:
  - core/07-combat.md#Initiative
app_features:
  - composables/useCombat.ts (calculateInitiative)
  - server/api/encounters/[id]/start.post.ts
  - stores/encounter.ts
sub_loops:
  - combat-initiative-league-battle
---

### Preconditions
- An encounter exists with combatants added to all sides
- Encounter has not been started yet

### Steps
1. GM clicks Start Combat
2. System calculates initiative for each combatant: `modifiedSpeed + bonus`
   - Modified Speed = `Speed * stageMultiplier[speedCS]`
3. Combatants sorted highest to lowest initiative
4. Ties resolved (d20 roll off per PTU, app uses stable sort)
5. First combatant in order becomes the active turn

### PTU Rules Applied
- **Initiative = Speed**: "a Pokémon or Trainer's Initiative is simply their Speed Stat" (core/07-combat.md, p227)
- **Full Contact Order**: "all participants simply go in order from highest to lowest speed" (core/07-combat.md, p227)
- **Tie Breaking**: "Ties in Initiative should be settled with a d20 roll off" (core/07-combat.md, p227)
- **Hold Action**: "Combatants can choose to hold their action until a specified lower Initiative value once per round" (core/07-combat.md, p227)

### Expected Outcomes
- Combatant list is sorted by speed (descending)
- Active turn indicator on the first combatant
- Group View shows turn order and active combatant highlight

### Edge Cases
- Speed combat stages at encounter start (from pre-battle effects) → affect initiative
- Combatants added mid-encounter → inserted at correct initiative position
- All combatants same speed → arbitrary but stable order

### Sub-Loop: League Battle Initiative

---
loop_id: combat-initiative-league-battle
domain: combat
ptu_refs:
  - core/07-combat.md#Initiative
app_features:
  - stores/encounter.ts
sub_loops: []
---

#### Preconditions
- Encounter is configured as a League Battle (battle mode flag)

#### Steps
1. All Trainers take turns first (declare low→high speed, resolve high→low speed)
2. Then all Pokemon act in order from highest to lowest speed
3. App currently uses Full Contact ordering for all encounters

#### PTU Rules Applied
- **League Initiative**: "In League Battles only, Trainers declare their actions in order from lowest to highest speed, and then the actions take place and resolve from highest to lowest speed" (core/07-combat.md, p227)

#### Expected Outcomes
- Note: The app currently implements Full Contact ordering. League Battle initiative ordering is a potential future feature.

---

## Loop 8: Turn Progression

---
loop_id: combat-turn-progression
domain: combat
ptu_refs:
  - core/07-combat.md#Action Types
app_features:
  - composables/useEncounterActions.ts (handleAction, handleExecuteAction)
  - server/api/encounters/[id]/next-turn.post.ts
  - stores/encounter.ts
sub_loops: []
---

### Preconditions
- An encounter is active (started)
- It is a combatant's turn

### Steps
1. Active combatant has action budget: 1 Standard, 1 Shift, 1 Swift per turn
2. GM performs actions for the combatant:
   - Use a Move (Standard Action)
   - Shift/Move on grid (Shift Action)
   - Use a Swift Action feature
   - Execute a combat maneuver
   - Pass turn
3. After all desired actions, GM clicks "Next Turn"
4. System advances to next combatant in initiative order
5. When all combatants have acted, a new round begins (back to top of initiative)
6. Turn change broadcast via WebSocket (`turn_change`)

### PTU Rules Applied
- **Action Budget**: "each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order" (core/07-combat.md, p227)
- **Free Actions**: "they may take any number of Free Actions" (core/07-combat.md, p227)
- **Standard → Shift/Swift conversion**: "You may give up a Standard Action to take another Shift Action...You may give up a Standard Action to take another Swift Action" (core/07-combat.md, p227)
- **Full Action**: "Full Actions take both your Standard Action and Shift Action for a turn" (core/07-combat.md, p228)

### Expected Outcomes
- Turn state tracks which actions have been used
- Next Turn advances active combatant index
- Round counter increments when wrapping back to first combatant
- Group View updates to show new active combatant

### Edge Cases
- Fainted combatant's turn → skipped automatically
- Combatant removed mid-round → next combatant takes over
- Only one combatant remaining → encounter can be ended

---

## Loop 9: Struggle Attack

---
loop_id: combat-struggle-attack
domain: combat
ptu_refs:
  - core/07-combat.md#Struggle Attacks
app_features:
  - constants/combatManeuvers.ts
  - composables/useEncounterActions.ts (handleExecuteMove with moveId='struggle')
sub_loops: []
---

### Preconditions
- A combatant needs to attack but has no usable Moves (or chooses Struggle)
- Struggle is available as a Standard Action

### Steps
1. GM selects Struggle Attack for the combatant
2. Struggle stats: AC 4, DB 4, Melee range, Physical, Normal Type
3. Accuracy check as normal (d20 >= 4 + target evasion - accuracy stages)
4. On hit, damage calculated with DB 4, Physical (ATK vs DEF)
5. STAB is **never** applied to Struggle Attacks
6. Type effectiveness applies normally (Normal type)

### PTU Rules Applied
- **Struggle Stats**: "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type" (core/07-combat.md, p240)
- **No STAB**: "Never apply STAB to Struggle Attacks" (core/07-combat.md, p240)
- **Not a Move**: "Struggle Attacks do not count as Moves, and effects that alter Moves do not apply to them" (core/07-combat.md, p240)
- **Expert Combat Upgrade**: "if a Trainer or Pokémon has a Combat Skill Rank of Expert or higher, Struggle Attacks instead have an AC of 3 and a Damage Base of 5" (core/07-combat.md, p240)

### Expected Outcomes
- DB 4 set damage (avg) = 11. With ATK of 10 vs DEF of 5 → `max(1, 11 + 10 - 5) = 16` damage
- Normal-type move: immune to Ghost types, resisted by Rock and Steel
- No STAB bonus even for Normal-type Pokemon

### Edge Cases
- Capability modifiers (Firestarter, Fountain, etc.) can change Struggle type and damage class
- Telekinetic allows ranged Struggle Attacks
- Expert Combat rank → AC 3, DB 5

---

## Loop 10: Combat Maneuvers

---
loop_id: combat-maneuvers
domain: combat
ptu_refs:
  - core/07-combat.md#Combat Maneuvers
app_features:
  - constants/combatManeuvers.ts (COMBAT_MANEUVERS)
  - composables/useEncounterActions.ts (handleExecuteAction)
  - stores/encounter.ts (useStandardAction, useShiftAction, takeABreather)
sub_loops:
  - combat-maneuver-take-a-breather
---

### Preconditions
- An encounter is active
- It is the combatant's turn with available actions

### Steps
1. GM opens action menu for the active combatant
2. GM selects a Combat Maneuver:
   - **Push** (Standard, AC 4): opposed Combat/Athletics check, push target 1m
   - **Sprint** (Standard): +50% movement speed this turn
   - **Trip** (Standard, AC 6): opposed Combat/Acrobatics check, target is Tripped
   - **Grapple** (Standard, AC 4): opposed Combat/Athletics check, both become Grappled
   - **Intercept Melee** (Full + Interrupt): take melee hit for adjacent ally
   - **Intercept Ranged** (Full + Interrupt): intercept ranged attack for ally
   - **Take a Breather** (Full Action): reset stages, cure volatile status
3. System consumes appropriate actions:
   - Standard maneuvers: Standard Action consumed
   - Full Action maneuvers: both Standard and Shift consumed
4. System applies maneuver effects (status changes, stage resets, etc.)

### PTU Rules Applied
- **Push**: "You and the target each make opposed Combat or Athletics Checks. If you win, the target is Pushed back 1 Meter" (core/07-combat.md, p242)
- **Sprint**: "Increase your Movement Speeds by 50% for the rest of your turn" (core/07-combat.md, p242)
- **Trip**: "You and the target each make opposed Combat or Acrobatics Checks. If you win, the target is knocked over and Tripped" (core/07-combat.md, p242)
- **Grapple**: "you and the target each become Grappled, and you gain Dominance in the Grapple" (core/07-combat.md, p243)

### Expected Outcomes
- Standard-action maneuvers consume Standard Action
- Full-action maneuvers consume both Standard and Shift
- Status conditions applied to targets as appropriate (Tripped, Grappled, etc.)
- WebSocket broadcast reflects state changes

### Edge Cases
- Maneuver with AC (Push AC 4, Trip AC 6) → accuracy roll required against target
- Attack of Opportunity: triggered by adjacent foe using certain maneuvers
- Disengage: Shift 1m without provoking Attack of Opportunity

### Sub-Loop: Take a Breather

---
loop_id: combat-maneuver-take-a-breather
domain: combat
ptu_refs:
  - core/07-combat.md#Take a Breather
app_features:
  - stores/encounter.ts (takeABreather)
  - server/api/encounters/[id]/breather.post.ts
  - composables/useEncounterActions.ts
sub_loops: []
---

#### Preconditions
- A combatant has volatile status afflictions or non-zero combat stages
- Combatant has both Standard and Shift actions available (Full Action)

#### Steps
1. GM selects Take a Breather for the combatant
2. System consumes Standard + Shift actions
3. System resets all combat stages to 0
4. System removes all Volatile status afflictions (Confused, Cursed, Rage, Infatuation, etc.)
5. System removes Temporary Hit Points
6. System removes Slow and Stuck conditions
7. Combatant becomes Tripped and Vulnerable until end of next turn

#### PTU Rules Applied
- **Breather Effects**: "they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions" (core/07-combat.md, p245)
- **Breather Penalty**: "They then become Tripped and are Vulnerable until the end of their next turn" (core/07-combat.md, p245)
- **Full Action**: "Taking a Breather is a Full Action" (core/07-combat.md, p245)

#### Expected Outcomes
- All combat stages reset to 0
- All volatile statuses cleared
- Temp HP removed
- Tripped and Vulnerable added
- WebSocket broadcasts updated combatant state

---

## Loop 11: Status Conditions

---
loop_id: combat-status-conditions
domain: combat
ptu_refs:
  - core/07-combat.md#Status Afflictions
app_features:
  - server/services/combatant.service.ts (VALID_STATUS_CONDITIONS, updateStatusConditions)
  - server/api/encounters/[id]/status.post.ts
  - composables/useEncounterActions.ts (handleStatus)
  - composables/useCombat.ts (typeImmunities, isImmuneToStatus)
sub_loops:
  - combat-status-persistent
  - combat-status-volatile
  - combat-status-type-immunity
---

### Preconditions
- An encounter is active with combatants
- A move, ability, or GM action inflicts a status condition

### Steps
1. GM applies a status condition to a combatant via the status panel
2. System validates the status is in `VALID_STATUS_CONDITIONS`
3. System checks for type-based immunity (e.g., Electric immune to Paralysis)
4. If not immune, status is added to the combatant's `statusConditions` array
5. Duplicate statuses are not added
6. Status effects modify combat behavior on subsequent turns

### PTU Rules Applied
- **No Limit on Statuses**: "Unlike the video games, there is no limit to the number of Status Afflictions that a single target can have" (core/07-combat.md, p246)
- **Persistent vs Volatile**: "There are two main kinds of Status Afflictions; Persistent and Volatile" (core/07-combat.md, p246)

### Expected Outcomes
- Status added to combatant's status list
- Type immunities prevent application (Electric → no Paralysis, Fire → no Burn, etc.)
- No duplicate statuses in the list
- WebSocket broadcasts status change

### Sub-Loop: Persistent Status Afflictions

---
loop_id: combat-status-persistent
domain: combat
ptu_refs:
  - core/07-combat.md#Persistent Afflictions
app_features:
  - server/services/combatant.service.ts
sub_loops: []
---

#### Preconditions
- Status being applied is Burned, Frozen, Paralyzed, Poisoned, or Badly Poisoned

#### Steps and Rules
- **Burned**: Defense lowered by 2 CS; lose 1 Tick HP (1/10 max) when taking Standard Action
- **Frozen**: Cannot act; no evasion bonus; DC 16 save at end of turn; cured by Fire/Fighting/Rock/Steel damaging hit
- **Paralyzed**: Speed lowered by 4 CS; DC 5 save at start of turn to act
- **Poisoned**: SpDef lowered by 2 CS; lose 1 Tick HP when taking Standard Action
- **Badly Poisoned**: Lose 5 HP; doubles each round (5, 10, 20, 40...)
- All Persistent afflictions: retained in Poke Ball, cured on Faint

#### Expected Outcomes
- Burned/Poisoned: stage modifiers applied (DEF -2 CS or SpDEF -2 CS)
- Paralyzed: SPD -4 CS
- Frozen: evasion treated as 0
- These stages are in addition to any existing stage changes

### Sub-Loop: Volatile Status Afflictions

---
loop_id: combat-status-volatile
domain: combat
ptu_refs:
  - core/07-combat.md#Volatile Afflictions
app_features:
  - server/services/combatant.service.ts
sub_loops: []
---

#### Preconditions
- Status being applied is Confused, Cursed, Disabled, Rage, Flinch, Infatuation, Sleep, or Suppressed

#### Steps and Rules
- **Confused**: Save at start of turn: 1-8 = hit self (Typeless Physical Struggle, resisted 1 step), 9-15 = act normally, 16+ = cured
- **Cursed**: Lose 2 Ticks HP when taking Standard Action
- **Rage**: Must use damaging Move or Struggle; DC 15 save at end of turn to cure
- **Flinch**: Cannot take actions during next turn that round; does not carry to next round
- **Sleep**: No evasion, no actions (except cure-related); DC 16 save at end of turn; waking on damage
- **Infatuation**: Save at start of turn: 1-10 = cannot target source, 11-18 = normal, 19+ = cured
- All Volatile afflictions: cured at end of encounter, cured by recalling into Poke Ball, cured on Faint

#### Expected Outcomes
- Status conditions tracked in combatant entity
- GM manually handles save checks and behavioral restrictions
- Take a Breather cures all volatile statuses

### Sub-Loop: Type-Based Status Immunity

---
loop_id: combat-status-type-immunity
domain: combat
ptu_refs:
  - core/07-combat.md#Type Effectiveness (type quirks section)
app_features:
  - composables/useCombat.ts (typeImmunities, isImmuneToStatus)
sub_loops: []
---

#### Preconditions
- A status condition is being applied to a Pokemon with a type granting immunity

#### Type Immunity Table
- Electric Types → immune to Paralysis
- Fire Types → immune to Burn
- Ghost Types → immune to Stuck and Trapped
- Grass Types → immune to Powder moves
- Ice Types → immune to Frozen
- Poison and Steel Types → immune to Poisoned/Badly Poisoned

#### Expected Outcomes
- `isImmuneToStatus(['Electric'], 'Paralyzed')` returns true
- `isImmuneToStatus(['Fire'], 'Burned')` returns true
- `isImmuneToStatus(['Steel'], 'Poisoned')` returns true
- Status is not added to the combatant's condition list

---

## Loop 12: Damage Application and HP System

---
loop_id: combat-damage-application
domain: combat
ptu_refs:
  - core/07-combat.md#Dealing Damage
  - core/07-combat.md#Hit Point Loss
app_features:
  - server/services/combatant.service.ts (calculateDamage, applyDamageToEntity)
  - server/api/encounters/[id]/damage.post.ts
  - composables/useEncounterActions.ts (handleDamage)
sub_loops:
  - combat-temporary-hp
  - combat-injuries
  - combat-faint
---

### Preconditions
- A combatant is taking damage from any source
- Combatant has known current HP, max HP, temp HP, and injury count

### Steps
1. Damage amount determined (from move calculation or direct input)
2. Temporary HP absorbs damage first:
   - `tempHpAbsorbed = min(temporaryHp, damage)`
   - `remainingDamage = damage - tempHpAbsorbed`
3. Remaining damage subtracted from current HP: `newHp = max(0, currentHp - remainingDamage)`
4. Check for Massive Damage injury: `hpDamage >= maxHp / 2`
5. Check for faint: `newHp === 0`
6. Update entity state (HP, temp HP, injuries, status)
7. Broadcast update via WebSocket

### PTU Rules Applied
- **Temp HP Absorbs First**: "Temporary Hit Points are always lost first from damage" (core/07-combat.md, p247)
- **Damage Carries Over**: "Damage carries over directly to real Hit Points once the Temporary Hit Points are lost" (core/07-combat.md, p247)

### Expected Outcomes
- HP updated; temp HP reduced or zeroed
- Injury count incremented if massive damage threshold met
- Fainted status added if HP reaches 0
- HP floor is 0 in the app (PTU allows negative HP for injury markers but app caps at 0)

### Sub-Loop: Temporary HP

---
loop_id: combat-temporary-hp
domain: combat
ptu_refs:
  - core/07-combat.md#Temporary Hit Points
app_features:
  - server/services/combatant.service.ts (calculateDamage)
sub_loops: []
---

#### Preconditions
- A combatant has Temporary Hit Points (> 0)

#### Rules
- Temp HP stacks on top of real HP
- Temp HP lost first from damage
- Temp HP does NOT stack: only highest value applies
- Temp HP does NOT count for HP percentage calculations
- Temp HP disappears after 5 minutes outside combat
- Temp HP lost when recalled into Poke Ball

#### Expected Outcomes
- `calculateDamage(20, 30, 50, 10, 0)` → tempHpAbsorbed=10, hpDamage=10, newHp=20
- Damage of 8 with 10 temp HP → all absorbed by temp HP, real HP unchanged

### Sub-Loop: Injury System

---
loop_id: combat-injuries
domain: combat
ptu_refs:
  - core/07-combat.md#Injuries
  - core/07-combat.md#Gaining Injuries
app_features:
  - composables/useCombat.ts (checkForInjury)
  - server/services/combatant.service.ts (calculateDamage)
sub_loops: []
---

#### Preconditions
- A combatant takes damage

#### Steps
1. Check Massive Damage: single hit deals >= 50% of max HP → 1 injury
2. Check HP Markers: crossing 50%, 0%, -50%, -100% (and every -50% thereafter) → 1 injury per marker
3. Each injury reduces effective max HP by 1/10

#### PTU Rules Applied
- **Massive Damage**: "any single attack or damage source that does damage equal to 50% or more of their Max Hit Points" → 1 injury (core/07-combat.md, p250)
- **HP Markers**: "50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter" → 1 injury each (core/07-combat.md, p250)
- **Injury Effect**: "For each Injury...Maximum Hit Points are reduced by 1/10th" (core/07-combat.md, p250)
- **Heavily Injured**: "5 or more injuries" → additional HP loss on Standard Action or taking damage (core/07-combat.md, p250)
- **Death**: "10 injuries, or goes down to -50 Hit Points or -200% Hit Points" (core/07-combat.md, p251)

#### Expected Outcomes
- `checkForInjury(40, 15, 50, 25)` → `{injured: true, reason: 'Massive Damage'}` (25 >= 50*0.5)
- `checkForInjury(30, 20, 50, 10)` → `{injured: true, reason: 'Crossed 50% HP marker'}` (was 60% now 40%)
- `checkForInjury(30, 28, 50, 2)` → `{injured: false}` (no markers crossed, damage < 50%)
- App currently checks one injury source; PTU allows multiple injuries from a single hit (massive + markers)

### Sub-Loop: Faint

---
loop_id: combat-faint
domain: combat
ptu_refs:
  - core/07-combat.md#Fainted
app_features:
  - server/services/combatant.service.ts (calculateDamage, applyDamageToEntity)
sub_loops: []
---

#### Preconditions
- A combatant's HP reaches 0 or below

#### Steps
1. System sets HP to 0 (floored)
2. 'Fainted' status added to statusConditions
3. All Persistent and Volatile statuses cleared (per PTU)
4. Fainted combatant's turn is skipped in initiative order

#### PTU Rules Applied
- **Fainted**: "A Pokémon or Trainer that is at 0 Hit Points or less is Fainted...cannot use any Actions" (core/07-combat.md, p248)
- **Statuses Cleared**: "When a Pokémon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions" (core/07-combat.md, p248)

#### Expected Outcomes
- `calculateDamage(100, 30, 50, 0, 0)` → `{newHp: 0, fainted: true}`
- Fainted status present in statusConditions
- Turn skipped in subsequent rounds

---

## Loop 13: Healing in Combat

---
loop_id: combat-healing
domain: combat
ptu_refs:
  - core/07-combat.md#Resting
app_features:
  - server/services/combatant.service.ts (applyHealingToEntity)
  - server/api/encounters/[id]/heal.post.ts
  - composables/useEncounterActions.ts (handleHeal)
sub_loops: []
---

### Preconditions
- An encounter is active
- A combatant needs healing (HP below max, or has injuries, or is fainted)

### Steps
1. GM selects a combatant and opens heal panel
2. GM enters heal amount (HP, temp HP, and/or injuries)
3. System applies healing:
   - HP healed: `min(maxHp, currentHp + amount)` — capped at max HP
   - Temp HP: added to existing temp HP
   - Injuries: reduced (min 0)
4. If fainted and healed above 0 HP → Fainted status removed
5. Broadcast update

### PTU Rules Applied
- **Faint Recovery**: The Fainted Condition is removed by Revive or being brought to positive HP by healing Moves (core/07-combat.md, p248)
- **Potion on Fainted**: "Potions and other healing items may still bring a Pokémon above 0 Hit Points, but it remains Fainted for another 10 minutes" (core/07-combat.md, p248)

### Expected Outcomes
- `applyHealingToEntity(combatant, {amount: 20})` → HP increased, capped at max
- Healing from 0 HP → Fainted removed, combatant can act again
- Temp HP grants bonus health beyond max HP
- Injury healing reduces injury count, raising effective max HP

---

## Loop 14: Encounter Lifecycle

---
loop_id: combat-encounter-lifecycle
domain: combat
ptu_refs:
  - core/07-combat.md#Types and Contexts of Combat
app_features:
  - server/api/encounters/[id]/start.post.ts
  - server/api/encounters/[id]/end.post.ts
  - server/api/encounters/[id]/serve.post.ts
  - server/api/encounters/[id]/unserve.post.ts
  - stores/encounter.ts
sub_loops: []
---

### Preconditions
- An encounter has been created with combatants

### Steps
1. **Create**: `POST /api/encounters` with name, battle mode, sides configuration
2. **Add Combatants**: `POST /api/encounters/:id/combatants` for each participant
3. **Start**: `POST /api/encounters/:id/start` → calculates initiative, sets first turn
4. **Serve**: `POST /api/encounters/:id/serve` → makes encounter visible on Group View
5. **Run Combat**: turns, moves, damage, healing, status changes (loops above)
6. **End**: `POST /api/encounters/:id/end` → marks encounter as complete
7. **Unserve**: `POST /api/encounters/:id/unserve` → removes from Group View

### Expected Outcomes
- Encounter progresses through lifecycle states: created → started → ended
- Serving broadcasts encounter to Group View via WebSocket
- Combat stages cleared at end of encounter
- Volatile statuses cleared at end of encounter

### Edge Cases
- Encounter ended while combatants still active → all volatile effects cleared
- Encounter served mid-combat → Group View catches up to current state
- Multiple encounters can exist but only one can be served at a time

---

## Loop 15: Multi-Target Moves

---
loop_id: combat-multi-target
domain: combat
ptu_refs:
  - core/07-combat.md#Making Attacks
app_features:
  - composables/useMoveCalculation.ts (selectedTargets, hitTargets, targetDamageCalcs)
  - composables/useEncounterActions.ts (handleExecuteMove with targetDamages)
sub_loops: []
---

### Preconditions
- Active combatant uses a move that can target multiple combatants (e.g., Earthquake — Burst, hits all adjacent)
- Multiple targets are available and selected

### Steps
1. GM selects the multi-target move
2. GM selects all affected targets
3. System rolls accuracy **separately for each target** (individual d20 rolls)
4. Each target has its own evasion applied to the AC threshold
5. Damage is rolled **once** for the move
6. For each target that was hit:
   - Target's own defense stat is subtracted
   - Target's own type effectiveness multiplier is applied
   - Final damage calculated per target
7. `handleExecuteMove` receives `targetDamages` map (targetId → damage)
8. Each hit target takes their individual damage amount

### PTU Rules Applied
- **Individual Accuracy**: Each target gets its own accuracy check
- **Single Damage Roll**: "you add your Attack or Special Attack Stat" once, dice rolled once
- **Per-Target Defense/Effectiveness**: Each target subtracts their own defense and has their own type effectiveness applied

### Expected Outcomes
- One accuracy roll per target (some may hit, some may miss)
- One damage base roll shared across all hit targets
- Different final damage values per target based on their defense and types
- `targetDamageCalcs` computed property contains per-target breakdown

### Edge Cases
- All targets miss → no damage phase shown
- Mixed immunities: one target immune (0 damage), another takes full damage
- Status move targeting multiple targets: no damage, but status applied to each hit target individually
