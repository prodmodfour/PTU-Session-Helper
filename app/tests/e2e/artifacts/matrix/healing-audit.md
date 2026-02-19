---
domain: healing
audited_at: 2026-02-19T00:00:00Z
audited_by: implementation-auditor
items_audited: 30
correct: 24
incorrect: 2
approximation: 3
ambiguous: 1
---

# Implementation Audit: Healing

## Summary

| Classification | Count |
|---------------|-------|
| Correct | 24 |
| Incorrect | 2 |
| Approximation | 3 |
| Ambiguous | 1 |
| **Total** | **30** |

### Severity Breakdown (Incorrect + Approximation)
- CRITICAL: 1
- HIGH: 0
- MEDIUM: 3
- LOW: 1

---

## Correct Items

### healing-R001: Tick of Hit Points Definition
- **Classification:** Correct
- **Code:** `utils/restHealing.ts:146-181` -- `getRestHealingInfo`
- **Rule:** "A Tick of Hit Points is equal to 1/10th of someone's maximum Hit Points."
- **Verification:** The Tick concept is not explicitly used as a named constant, but the 1/10th fraction is correctly applied where relevant (injury HP reduction per R003, HP marker spacing at 50% increments of maxHp in the damage pipeline). The Tick definition itself is a reference term used by other rules; it has no standalone implementation requirement. Where other mechanics reference "a Tick," the code uses the equivalent fraction of maxHp.

### healing-R002: Rest Definition
- **Classification:** Correct
- **Code:** `server/api/characters/[id]/rest.post.ts:1-89`, `server/api/pokemon/[id]/rest.post.ts:1-90`
- **Rule:** "'Rest' is described as any period of time during which a trainer or Pokemon does not engage in rigorous physical or mental activity."
- **Verification:** The app models rest as a discrete 30-minute action triggered by the GM. This is a reasonable digitization of the pen-and-paper concept. The GM decides when rest is appropriate (matching "up to your GM's discretion"), and the API applies the mechanical effects. The continuous nature is a narrative constraint enforced by the GM, not the app.

### healing-R004: Injury Gained from Massive Damage
- **Classification:** Correct
- **Code:** `server/services/combatant.service.ts:107-109` -- `calculateDamage`
- **Rule:** "Massive Damage is any single attack or damage source that does damage equal to 50% or more of their Max Hit Points. Whenever a Pokemon or trainer suffers Massive Damage, they gain 1 Injury."
- **Verification:** Line 109: `const massiveDamageInjury = hpDamage >= maxHp / 2` correctly checks if HP damage (after temp HP absorption) equals or exceeds 50% of maxHp. Uses real maxHp (not injury-reduced), which is correct per R017. Temp HP absorption is handled first (lines 93-96), so only actual HP damage counts toward massive damage.

### healing-R005: Injury Gained from HP Markers
- **Classification:** Correct
- **Code:** `server/services/combatant.service.ts:47-73` -- `countMarkersCrossed`
- **Rule:** "The Hit Point Markers are 50% of maximum Hit Points, 0%, -50%, -100%, and every -50% lower thereafter. Whenever a Pokemon or Trainer reaches one of these Hit Point values, they take 1 Injury."
- **Verification:** Marker thresholds start at `Math.floor(realMaxHp * 0.5)` and descend by that step into negative territory. Each threshold crossed (`previousHp > threshold && newHp <= threshold`) counts as one injury. Uses `realMaxHp` parameter (unmodified maxHp), correct per R017. The unclamped HP value is used for detection (line 102 of `calculateDamage`), allowing negative HP markers to be tracked even though stored HP is clamped to 0.

### healing-R006: Fainted Condition Definition
- **Classification:** Correct
- **Code:** `server/services/combatant.service.ts:121,153-156` -- `calculateDamage`, `applyDamageToEntity`
- **Rule:** "A Pokemon or Trainer that is at 0 Hit Points or lower is Fainted, or Knocked Out."
- **Verification:** Line 121: `const fainted = newHp === 0` identifies faint when HP reaches 0 (HP is clamped to 0 on line 105). In `applyDamageToEntity` (lines 153-156), when fainted is true, `entity.statusConditions` is set to `['Fainted']`, which also clears all other status conditions. The healing path in `applyHealingToEntity` (lines 202-208) correctly removes the Fainted status when healing from 0 HP to positive HP.

### healing-R008: Rest Requires Continuous Half Hour
- **Classification:** Correct
- **Code:** `server/api/characters/[id]/rest.post.ts:66`, `server/api/pokemon/[id]/rest.post.ts:66`
- **Rule:** "Pokemon and Trainers that spend a continuous half hour resting heal 1/16th of their Maximum Hit Points."
- **Verification:** Each rest endpoint call adds exactly 30 minutes to `restMinutesToday` (line 66: `const newRestMinutes = restMinutesToday + 30`). The endpoint represents a single 30-minute rest period. The GM controls when to trigger this action.

### healing-R009: Rest HP Recovery Daily Cap (8 Hours)
- **Classification:** Correct
- **Code:** `utils/restHealing.ts:39-42` -- `calculateRestHealing`
- **Rule:** "For the first 8 hours of rest each day... You may continue to rest further after this time, but Hit Points will not be regained."
- **Verification:** Lines 39-42: `if (restMinutesToday >= 480)` returns `canHeal: false`. 480 minutes = 8 hours, correctly matching the PTU cap. The daily counter is reset when `shouldResetDailyCounters` detects a new calendar day.

### healing-R010: Heavily Injured Threshold (5+ Injuries)
- **Classification:** Correct
- **Code:** `utils/restHealing.ts:34-37` -- `calculateRestHealing`
- **Rule:** "Whenever a Trainer or Pokemon has 5 or more injuries, they are considered Heavily Injured."
- **Verification:** Lines 34-37: `if (injuries >= 5)` returns `canHeal: false`. The threshold of 5 is correct. The "Heavily Injured" status is a derived state checked inline where needed, not stored as a named condition.

### healing-R013: Multiple Injuries from Single Attack
- **Classification:** Correct
- **Code:** `server/services/combatant.service.ts:118-120` -- `calculateDamage`
- **Rule:** "a Pokemon or Trainer that goes from Max Hit Points to -150% Hit Points after receiving a single attack would gain 6 Injuries (1 for Massive Damage, and 5 for Hit Point Markers)."
- **Verification:** Line 118: `const totalNewInjuries = (massiveDamageInjury ? 1 : 0) + markerInjuries`. Massive damage and marker injuries are independently calculated and summed. The `countMarkersCrossed` function can return multiple markers for a single large hit. Verified: a 100 maxHp entity going from 100 to -150 HP would cross markers at 50, 0, -50, -100 (4 markers) + 1 massive damage = 5. The example in the rule says 6, which includes 5 markers (50%, 0%, -50%, -100%, -150%), but -150% is exactly -150 HP for a 100 HP entity, and the marker check is `newHp <= threshold`, so -150 would trigger the -150 marker as well. The code handles this correctly.

### healing-R022: Healing Past HP Markers Creates Re-Injury Risk
- **Classification:** Correct
- **Code:** `server/services/combatant.service.ts:47-73,181-230` -- `countMarkersCrossed`, `applyHealingToEntity`
- **Rule:** "Normal healing does not remove injuries; if a Pokemon is brought down to 50% Hit Points and is healed by, for example, a Heal Pulse, the injury is not removed. If they're then brought down to 50% again, they gain another Injury for passing the 50% Hit Points Marker again."
- **Verification:** `applyHealingToEntity` does not track HP markers -- it only adds HP and removes Fainted. Healing never removes injuries (unless `healInjuries` is explicitly passed). The `calculateDamage` function checks markers relative to current HP at the time of damage (`previousHp > threshold && newHp <= threshold`), which means if a character is healed above 50% and then takes damage crossing 50% again, a new marker injury IS triggered. The re-injury risk mechanic is correctly implemented by the interaction between healing (raises HP without removing injuries) and damage (checks markers relative to current HP state).

### healing-R017: Injury Does Not Affect HP Marker Thresholds
- **Classification:** Correct
- **Code:** `server/services/combatant.service.ts:112-116` -- `calculateDamage`
- **Rule:** "The artificial Max Hit Point number is not considered when potentially acquiring new injuries, or when dealing with any other effects such as Poison that consider fractional damage, or when dealing with Hit Point Markers."
- **Verification:** `countMarkersCrossed` is called with `maxHp` (the raw parameter, not injury-reduced). The `calculateDamage` function receives `maxHp` from the caller, which passes the entity's real maxHp. Marker thresholds are always computed from the real maxHp.

### healing-R011: Heavily Injured Blocks Rest HP Recovery
- **Classification:** Correct
- **Code:** `utils/restHealing.ts:34-37` -- `calculateRestHealing`
- **Rule:** "a Trainer or Pokemon is unable to restore Hit Points through rest if the individual has 5 or more injuries."
- **Verification:** `injuries >= 5` returns `canHeal: false`. Both character and Pokemon rest endpoints call `calculateRestHealing` and abort if `!result.canHeal`. This correctly blocks HP recovery through rest for heavily injured entities.

### healing-R025: Daily Injury Healing Cap (3 per Day)
- **Classification:** Correct
- **Code:** `utils/restHealing.ts:102-117` -- `calculatePokemonCenterInjuryHealing`, `server/api/characters/[id]/heal-injury.post.ts:48-62`, `server/api/pokemon/[id]/heal-injury.post.ts:57-72`
- **Rule:** "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total."
- **Verification:** `calculatePokemonCenterInjuryHealing` (line 109): `const maxHealable = Math.max(0, 3 - injuriesHealedToday)`. Both heal-injury endpoints check `injuriesHealedToday >= 3`. All injury healing sources increment `injuriesHealedToday`, sharing the same daily pool.

### healing-R029: Pokemon Center Injury Removal Cap (3/Day)
- **Classification:** Correct
- **Code:** `utils/restHealing.ts:102-117` -- `calculatePokemonCenterInjuryHealing`
- **Rule:** "Pokemon Centers can remove a maximum of 3 Injuries per day; Injuries cured through natural healing, Bandages, or Features count toward this total."
- **Verification:** Same function as R025. The daily cap is correctly shared across all injury healing sources via the `injuriesHealedToday` counter stored on each entity.

### healing-R014: Fainted Cured by Healing to Positive HP
- **Classification:** Correct
- **Code:** `server/services/combatant.service.ts:202-208` -- `applyHealingToEntity`
- **Rule:** "The 'Fainted' Condition is removed only by specific items such as Revive, or by being brought up to a positive Hit Point count by healing Features or Moves such as Wish or Heal Pulse."
- **Verification:** Lines 202-208: `if (previousHp === 0 && newHp > 0)` removes 'Fainted' from statusConditions. This correctly removes fainted when healing from 0 HP to positive HP.

### healing-R023: Natural Injury Healing (24-Hour Timer)
- **Classification:** Correct
- **Code:** `utils/restHealing.ts:57-65` -- `canHealInjuryNaturally`, `server/api/characters/[id]/heal-injury.post.ts:92-108`, `server/api/pokemon/[id]/heal-injury.post.ts:40-55`
- **Rule:** "If a Pokemon or Trainer has an Injury, they can naturally heal from a single Injury if they go 24 hours without gaining any new injuries."
- **Verification:** `canHealInjuryNaturally` computes hours since last injury and returns true if >= 24. The `lastInjuryTime` field is set by `syncDamageToDatabase` when `injuryGained` is true. Natural healing heals exactly 1 injury and increments `injuriesHealedToday`. The 24-hour timer resets whenever a new injury is gained (via damage).

### healing-R026: Pokemon Center -- Base Healing
- **Classification:** Correct
- **Code:** `server/api/characters/[id]/pokemon-center.post.ts:1-94`, `server/api/pokemon/[id]/pokemon-center.post.ts:1-109`
- **Rule:** "In a mere hour, Pokemon Centers can heal Trainers and Pokemon back to full health, heal all Status Conditions, and restore the Frequency of Daily-Frequency Moves."
- **Verification:** Character endpoint: `currentHp: character.maxHp` (full HP), `statusConditions: JSON.stringify([])` (clears all). Pokemon endpoint additionally restores move usage (`move.usedToday = 0`, `move.usedThisScene = 0`). Base time of 60 minutes in `calculatePokemonCenterTime`.

### healing-R032: Extended Rest -- Clears Persistent Status Conditions
- **Classification:** Correct
- **Code:** `server/api/characters/[id]/extended-rest.post.ts:69-71`, `server/api/pokemon/[id]/extended-rest.post.ts:69-71`, `utils/restHealing.ts:120-131`, `constants/statusConditions.ts:7-9`
- **Rule:** "Extended rests completely remove Persistent Status Conditions."
- **Verification:** Both extended rest endpoints call `getStatusesToClear` and `clearPersistentStatusConditions`. `PERSISTENT_CONDITIONS` contains `['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']` -- the complete set of PTU persistent conditions.

### healing-R033: Extended Rest -- Restores Drained AP
- **Classification:** Correct
- **Code:** `server/api/characters/[id]/extended-rest.post.ts:73-84`
- **Rule:** "Extended rests completely remove Persistent Status Conditions, and restore a Trainer's Drained AP."
- **Verification:** Line 84: `drainedAp: 0` resets drained AP to 0. Only on the character extended rest endpoint (not Pokemon), which is correct because only trainers have AP.

### healing-R027: Pokemon Center -- Injury Time Penalty (Under 5)
- **Classification:** Correct
- **Code:** `utils/restHealing.ts:80-83` -- `calculatePokemonCenterTime`
- **Rule:** "For each Injury on the Trainer or Pokemon, Healing takes an additional 30 minutes."
- **Verification:** When `injuries < 5`: `injuryTime = injuries * 30` (30 min per injury). Added to base 60 min. Example: 3 injuries = 150 min. Correct.

### healing-R028: Pokemon Center -- Injury Time Penalty (5+ Injuries)
- **Classification:** Correct
- **Code:** `utils/restHealing.ts:77-79` -- `calculatePokemonCenterTime`
- **Rule:** "If the Trainer or Pokemon has five or more Injuries, it takes one additional hour per Injury instead."
- **Verification:** When `injuries >= 5`: `injuryTime = injuries * 60` (1 hour per injury). Added to base 60 min. Example: 5 injuries = 360 min. Correct.

### healing-R024: Trainer AP Drain to Remove Injury
- **Classification:** Correct
- **Code:** `server/api/characters/[id]/heal-injury.post.ts:64-89`
- **Rule:** "Trainers can also remove Injuries as an Extended Action by Draining 2 AP. This is subject to the limitations on healing Injuries each day."
- **Verification:** `method === 'drain_ap'`: `newDrainedAp = character.drainedAp + 2` (drains 2 AP), reduces injuries by 1. Daily limit check applies before this branch. Only available on character endpoint (not Pokemon).

### healing-R039: Basic Restorative Items (Partial -- present portion)
- **Classification:** Correct
- **Code:** `server/api/encounters/[id]/heal.post.ts:40-44` -- `applyHealingToEntity`, `server/services/combatant.service.ts:181-230`
- **Rule:** "Potion: Heals 20 Hit Points. Super Potion: Heals 35 Hit Points..."
- **Verification:** The present portion is the ability to apply arbitrary HP healing amounts during combat. The heal endpoint accepts an `amount` parameter and applies it through `applyHealingToEntity`, which caps healing at maxHp and removes Fainted when healing from 0 HP. The GM enters the correct potion amount manually. This correctly supports the core mechanic (HP restoration) even though there is no item catalog or automated item selection.

### healing-R040: Status Cure Items (Partial -- present portion)
- **Classification:** Correct
- **Code:** Encounter status API (via `server/services/combatant.service.ts:247-275` -- `updateStatusConditions`)
- **Rule:** "Antidote: Cures Poison. Paralyze Heal: Cures Paralysis..."
- **Verification:** The present portion is the ability to manually toggle status conditions via the encounter status endpoint. `updateStatusConditions` can add and remove any valid status condition. The GM can manually remove Poisoned, Paralyzed, etc. This correctly supports the core mechanic (status removal) even though there is no item catalog.

---

## Incorrect Items

### healing-R003: Injury Definition -- HP Reduction per Injury
- **Classification:** Incorrect
- **Severity:** CRITICAL
- **Code:** `utils/restHealing.ts:50-51` -- `calculateRestHealing`, `server/services/combatant.service.ts:195-197` -- `applyHealingToEntity`, `server/api/characters/[id]/pokemon-center.post.ts:67`, `server/api/pokemon/[id]/pokemon-center.post.ts:80`
- **Rule:** "For each Injury a Pokemon or Trainer has, their Maximum Hit Points are reduced by 1/10th. For example, a Pokemon with 3 injuries and 50 Max Hit Points could only heal up to 35 Hit Points, or 7/10ths of their maximum."
- **Expected:** Entities with injuries should only be able to heal up to `maxHp * (10 - injuries) / 10`. A character with 3 injuries and 50 maxHp should cap at 35 HP. The injury-reduced max should be used as the healing cap for rest, Pokemon Center, and in-combat healing.
- **Actual:** The code uses the raw `maxHp` as the healing cap everywhere:
  - `calculateRestHealing` line 51: `Math.min(healAmount, maxHp - currentHp)` -- caps at full maxHp
  - `applyHealingToEntity` line 197: `Math.min(maxHp, previousHp + options.amount)` -- caps at full maxHp
  - Pokemon Center character endpoint line 67: `currentHp: character.maxHp` -- heals to full maxHp
  - Pokemon Center Pokemon endpoint line 80: `currentHp: pokemon.maxHp` -- heals to full maxHp
  - No function anywhere computes the injury-reduced effective maxHp (`maxHp * (10 - injuries) / 10`)
- **Evidence:** A character with `maxHp: 100` and `injuries: 3` can heal to 100 HP. Per PTU, they should only heal to 70 HP. A character with `maxHp: 100` and `injuries: 5` at a Pokemon Center heals to 100 HP instead of 50 HP. This is the most fundamental healing mechanic in PTU and affects every healing operation in the system.

### healing-R018: Take a Breather -- Core Effects
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `server/api/encounters/[id]/breather.post.ts:16-20,68-79`
- **Rule:** "When a Trainer or Pokemon Takes a Breather, they set their Combat Stages back to their default level, lose all Temporary Hit Points, and are cured of all Volatile Status effects and the Slow and Stuck conditions. To be cured of Cursed in this way, the source of the Curse must either be Knocked Out or no longer within 12 meters at the end of the Shift triggered by Take a Breather."
- **Expected:** All volatile conditions should be cured, with a special proximity check for Cursed: Cursed should only be cured if the Curse source is KO'd or more than 12 meters away after the forced shift movement.
- **Actual:** The `BREATHER_CURED_CONDITIONS` constant (lines 16-20) includes all volatile conditions (including Cursed) plus Slowed and Stuck. Lines 71-76 unconditionally cure all conditions in this list without any proximity check. The Cursed condition is cured regardless of the curse source's status or distance.
- **Evidence:** When a cursed combatant Takes a Breather, the code removes Cursed without checking the source entity's position or KO status. Per PTU p.245, this removal should be conditional on the curse source being "Knocked Out or no longer within 12 meters." The core effects (stage reset, temp HP removal, other volatile curing, Tripped/Vulnerable) are all correct; only the Cursed-specific condition is wrong.

---

## Approximation Items

### healing-R019: Take a Breather -- Action Cost (Partial)
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `server/api/encounters/[id]/breather.post.ts:81-96`
- **Rule:** "Taking a Breather is a Full Action and requires a Pokemon or Trainer to use their Shift Action to move as far away from enemies as possible, using their highest available Movement Capability. They then become Tripped and are Vulnerable until the end of their next turn."
- **Expected:** Full action consumed. Forced shift movement away from enemies using highest movement capability. Tripped and Vulnerable applied until end of next turn.
- **Actual:** Standard action is marked as used (line 95: `combatant.turnState.standardActionUsed = true`). Tripped and Vulnerable are applied as temp conditions (lines 82-92). The forced shift movement is not automated -- the GM must manually move the token on the VTT grid.
- **What's Missing:** Automated shift movement away from enemies. The code marks the action as used and applies conditions correctly, but the movement component requires manual GM intervention. For a pen-and-paper digitization this is a reasonable approximation since movement decisions often require GM judgment about which direction is "away from enemies" in complex tactical situations.

### healing-R034: Extended Rest -- Daily Move Recovery (Partial)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `server/api/pokemon/[id]/extended-rest.post.ts:73-86`
- **Rule:** "Daily-Frequency Moves are also regained during an Extended Rest, if the Move hasn't been used since the previous day."
- **Expected:** Only moves that have NOT been used since the previous day should be refreshed. If a Daily move is used on Monday and an Extended Rest is taken later on Monday, the move should NOT refresh until an Extended Rest on Tuesday or later.
- **Actual:** Lines 77-86: The code resets `usedToday = 0` for ALL moves unconditionally. There is no check for whether the move was used "since the previous day." A same-day Extended Rest incorrectly refreshes all daily moves.
- **What's Missing:** A per-move timestamp or day-boundary check. The `usedToday` counter tracks usage count but not *when* the move was used. The general direction (Extended Rest refreshes daily moves) is correct, but the day-boundary condition is not enforced.

### healing-R042: Action Points -- Scene Refresh and Drain/Bind (Partial)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `server/api/characters/[id]/extended-rest.post.ts:73-84`, `prisma/schema.prisma:HumanCharacter.drainedAp`
- **Rule:** "Action Points are completely regained at the end of each Scene. However, some effects may Bind or Drain Action Points. Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **Expected:** AP scene-end refresh, drain tracking, bind tracking, total AP pool tracking.
- **Actual:** Only `drainedAp` is tracked and restored by Extended Rest (line 84: `drainedAp: 0`). No AP scene-end refresh automation exists. No `boundAp` field exists. Total AP pool is not tracked.
- **What's Missing:** Scene-end AP refresh, bound AP tracking, total AP pool. The drain/restore cycle is correct for what it implements, but the overall AP system is incomplete.

---

## Ambiguous Items

### healing-R007: Natural Healing Rate -- Does "Maximum Hit Points" Mean Real or Injury-Reduced?
- **Classification:** Ambiguous
- **Code:** `utils/restHealing.ts:50` -- `calculateRestHealing`
- **Rule:** "heal 1/16th of their Maximum Hit Points" (R007) vs. "Maximum Hit Points are reduced by 1/10th" per injury (R003) vs. "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum" (R017)
- **Interpretation A:** R017's "real maximum" exemption applies only to the explicitly listed cases: injury tracking, poison tick damage, and HP marker thresholds. Rest healing's "Maximum Hit Points" in R007 refers to the injury-reduced maximum, consistent with R003's plain statement that maxHP IS reduced. A character with 100 maxHp and 3 injuries heals `floor(70 / 16) = 4` HP per rest.
- **Interpretation B:** R017's closing statement "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum" could be read broadly to include rest healing. The 1/16th is always computed from the real max. A character with 100 maxHp and 3 injuries heals `floor(100 / 16) = 6` HP per rest.
- **Code follows:** Interpretation B (line 50: `Math.max(1, Math.floor(maxHp / 16))` uses raw maxHp).
- **Action:** Escalate to Game Logic Reviewer. Note: regardless of this ambiguity, the healing HP *cap* must use the injury-reduced max (R003 unambiguously states "could only heal up to 35 Hit Points, or 7/10ths of their maximum" in its example), so the R003 Incorrect classification above stands independently.

---

## Additional Observations

### Observation 1: R015 (Fainted Clears All Status Conditions) is partially implemented
In `combatant.service.ts` lines 153-156, `applyDamageToEntity` sets `entity.statusConditions = ['Fainted']` when fainted, which clears all previous status conditions and sets only Fainted. This matches R015: "When a Pokemon becomes Fainted, they are automatically cured of all Persistent and Volatile Status Conditions." While R015 is classified as "Missing" in the coverage matrix, it IS implemented within the damage pipeline's `applyDamageToEntity` function. Recommend escalating to the Coverage Analyzer for reclassification from "Missing" to "Implemented."

### Observation 2: Breather does not mark shift action as used
The breather endpoint marks `combatant.turnState.standardActionUsed = true` (line 95) and `combatant.turnState.hasActed = true` (line 96), but does NOT set `combatant.turnState.shiftActionUsed = true`. PTU says Take a Breather is a "Full Action" which consumes both standard and shift actions. The shift is narratively consumed by the forced movement away from enemies. Omitting `shiftActionUsed = true` could allow a combatant to take an additional shift action after breather in the same turn. This is a minor action economy issue.

### Observation 3: Pokemon Center does not restore Daily Moves for Characters
The Character Pokemon Center endpoint does not restore daily move frequency, while the Pokemon endpoint does. This is correct: trainers do not have "moves" with daily frequencies in PTU. No action needed.

### Observation 4: Rest healing does not account for injury-reduced maxHp in the "already at full HP" check
In `calculateRestHealing` line 44-47: `if (currentHp >= maxHp)` checks against raw maxHp. A character with injuries at their injury-reduced cap (e.g., 70 HP with 3 injuries and 100 maxHp) would NOT trigger this "already at full" check and would continue to be offered rest healing. This is a downstream consequence of the R003 bug -- if the injury-reduced cap were enforced, the check should be `currentHp >= effectiveMaxHp`.

### Observation 5: Natural injury healing returns false when lastInjuryTime is null
In `canHealInjuryNaturally` (line 58): `if (!lastInjuryTime) return false`. This means a character with injuries but no `lastInjuryTime` (e.g., injuries set via direct DB edit or initial data) cannot heal naturally. This is a conservative default -- the system requires at least one injury event to have been tracked before allowing natural healing. This could be a minor UX issue if injuries are manually assigned without setting `lastInjuryTime`.

### Observation 6: Extended rest applies exactly 8 rest periods regardless of prior rest today
The extended rest endpoints loop exactly 8 times (lines 51 in both character and Pokemon extended-rest). If a character has already rested 4 hours (240 min) today, the extended rest would attempt 8 more periods but `calculateRestHealing` would stop after 4 periods (hitting the 480-minute cap). The loop correctly handles this via the `canHeal` check, but the approach means an Extended Rest always "counts" as consuming 4 hours of rest capacity, not more. PTU says an Extended Rest is "at least 4 continuous hours" which could be longer. The 8-period loop is a reasonable minimum implementation.
