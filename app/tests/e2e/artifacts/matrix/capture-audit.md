---
domain: capture
audited_at: 2026-02-19T00:00:00Z
audited_by: implementation-auditor
items_audited: 24
correct: 18
incorrect: 2
approximation: 3
ambiguous: 1
---

# Implementation Audit: Capture

## Summary

| Classification | Count |
|---------------|-------|
| Correct | 18 |
| Incorrect | 2 |
| Approximation | 3 |
| Ambiguous | 1 |
| **Total** | **24** |

### Severity Breakdown (Incorrect + Approximation)
- CRITICAL: 0
- HIGH: 1
- MEDIUM: 3
- LOW: 1

---

## Correct Items

### capture-R001: Capture Rate Base Formula
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:73-76` — `calculateCaptureRate`
- **Rule:** "A Pokemon's Capture Rate depends on its Level, Hit Points, Status Afflictions, Evolutionary Stage, and Rarity. First, begin with 100. Then subtract the Pokemon's Level x2."
- **Verification:** The function starts with `base = 100` (line 73) and computes `levelModifier = -(level * 2)` (line 76). Verified against all three worked examples in the rulebook: level 10 Pikachu yields base 80, level 30 Caterpie yields base 40, level 80 Hydreigon yields base -60. All match.

### capture-R005: Capture Roll Mechanic
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:164-201` — `attemptCapture`
- **Rule:** "If it hits, and the Pokemon is able to be Captured, you then make a Capture Roll by rolling 1d100 and subtracting the Trainer's Level. The Type of Ball will also modify the Capture Roll."
- **Verification:** The function rolls `Math.floor(Math.random() * 100) + 1` giving 1-100 range (line 177). It computes `modifiedRoll = roll - trainerLevel - modifiers` (line 189). Success check is `modifiedRoll <= effectiveCaptureRate` (line 192). The `modifiers` parameter is correctly passed from the API endpoint (line 88 of `attempt.post.ts`). Ball type modifiers can be passed through the `modifiers` parameter. Matches PTU roll-under mechanic.

### capture-R006: HP Modifier — Above 75%
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:88-90` — `calculateCaptureRate`
- **Rule:** "If the Pokemon is above 75% Hit Points, subtract 30 from the Pokemon's Capture Rate."
- **Verification:** The `else` branch at line 88-90 triggers when `hpPercentage > 75`, setting `hpModifier = -30`. Boundary: a Pokemon at exactly 75.01% gets -30, a Pokemon at 75% gets -15 (falls into `<= 75` branch). The rule says "above 75%" which means >75%, so 75% itself should get -15. This matches.

### capture-R007: HP Modifier — 51-75%
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:86-87` — `calculateCaptureRate`
- **Rule:** "If the Pokemon is at 75% Hit Points or lower, subtract 15 from the Pokemon's Capture Rate."
- **Verification:** The branch `else if (hpPercentage <= 75)` at line 86 sets `hpModifier = -15`. This covers 51-75% because the preceding branch captures <=50%. Verified with Pikachu example at 70% HP getting -15. Correct.

### capture-R008: HP Modifier — 26-50%
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:84-85` — `calculateCaptureRate`
- **Rule:** "If the Pokemon is at 50% or lower, the Capture Rate is unmodified."
- **Verification:** The branch `else if (hpPercentage <= 50)` at line 84 sets `hpModifier = 0`. This covers 26-50% because the preceding branch captures <=25%. Verified with Caterpie example at 40% HP getting +0. Correct.

### capture-R009: HP Modifier — 1-25%
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:82-83` — `calculateCaptureRate`
- **Rule:** "If the Pokemon is at 25% Hit Points or lower, add a total of +15 to the Pokemon's Capture Rate."
- **Verification:** The branch `else if (hpPercentage <= 25)` at line 82 sets `hpModifier = 15`. This covers 2-25% HP (since 1 HP is handled first). The +15 modifier matches the rule exactly.

### capture-R010: HP Modifier — Exactly 1 HP
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:80-81` — `calculateCaptureRate`
- **Rule:** "And if the Pokemon is at exactly 1 Hit Point, add a total of +30 to the Pokemon's Capture Rate."
- **Verification:** The first branch `if (currentHp === 1)` at line 80 sets `hpModifier = 30`. This correctly checks for exactly 1 HP using strict equality. Takes priority over percentage-based checks due to branch ordering. Correct.

### capture-R011: Evolution Stage Modifier — Two Evolutions Remaining
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:94-97` — `calculateCaptureRate`
- **Rule:** "If the Pokemon has two evolutions remaining, add +10 to the Pokemon's Capture Rate."
- **Verification:** Computes `evolutionsRemaining = maxEvolutionStage - evolutionStage` (line 94). When `evolutionsRemaining >= 2`, sets `evolutionModifier = 10` (line 96-97). Verified with Caterpie example (stage 1, max 3, remaining 2) yielding +10. Correct.

### capture-R012: Evolution Stage Modifier — One Evolution Remaining
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:98-99` — `calculateCaptureRate`
- **Rule:** "If the Pokemon has one evolution remaining, don't change the Capture Rate."
- **Verification:** When `evolutionsRemaining === 1`, sets `evolutionModifier = 0` (line 98-99). Verified with Pikachu example (stage 1, max 2, remaining 1) yielding +0. Correct.

### capture-R013: Evolution Stage Modifier — No Evolutions Remaining
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:100-101` — `calculateCaptureRate`
- **Rule:** "If the Pokemon has no evolutions remaining, subtract 10 from the Pokemon's Capture Rate."
- **Verification:** The `else` branch at line 100-101 catches `evolutionsRemaining <= 0`, setting `evolutionModifier = -10`. Verified with Hydreigon example (fully evolved) yielding -10. Correct.

### capture-R014: Status Affliction Modifier — Persistent
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:113-115` — `calculateCaptureRate`, `constants/statusConditions.ts:7-9` — `PERSISTENT_CONDITIONS`
- **Rule:** "Persistent Conditions add +10 to the Pokemon's Capture Rate"
- **Verification:** Loop at lines 113-127 iterates over `statusConditions`. When a condition is in `PERSISTENT_CONDITIONS` (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned), adds +10 to `statusModifier` (line 115). Each persistent condition contributes independently. Verified with Hydreigon example: Burned (+10) + Poisoned (+10) = +20 total status modifier. Correct.

### capture-R016: Rarity Modifier — Shiny and Legendary
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:105-106` — `calculateCaptureRate`
- **Rule:** "Shiny Pokemon subtract 10 from the Pokemon's Capture Rate. Legendary Pokemon subtract 30 from the Pokemon's Capture Rate."
- **Verification:** `shinyModifier = isShiny ? -10 : 0` (line 105), `legendaryModifier = isLegendary ? -30 : 0` (line 106). Both modifiers are additive and can stack (a Shiny Legendary gets -40). Verified with Caterpie example: Shiny yields -10. Correct.

### capture-R017: Fainted Cannot Be Captured
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:67` — `calculateCaptureRate`, `server/api/capture/attempt.post.ts:69-79`
- **Rule:** "Pokemon reduced to 0 Hit Points or less cannot be captured. Poke Balls will simply fail to attempt to energize them."
- **Verification:** The utility sets `canBeCaptured = currentHp > 0` (line 67). The API endpoint checks `rateResult.canBeCaptured` and returns early with an error if false (lines 69-79 of attempt.post.ts). A Pokemon at exactly 0 HP or below produces `canBeCaptured: false`. Correct.

### capture-R019: Fainted Pokemon Capture Failsafe
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:67` — `calculateCaptureRate`
- **Rule:** "Poke Balls cannot ever capture a Pokemon that's been reduced to 0 Hit Points or less."
- **Verification:** Same check as R017. The `canBeCaptured = currentHp > 0` check at line 67 covers both the base rule (R017) and the failsafe restatement (R019). Correct.

### capture-R028: Natural 20 Accuracy Bonus
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:183-186` — `attemptCapture`, `server/api/capture/attempt.post.ts:82`
- **Rule:** "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll."
- **Verification:** The API endpoint determines `criticalHit = body.accuracyRoll === 20` (line 82 of attempt.post.ts). The `attemptCapture` function handles this by adding +10 to `effectiveCaptureRate` (line 185), which is mathematically equivalent to subtracting 10 from the roll. The code comment at line 185 documents this equivalence. Correct.

### capture-R029: Natural 100 Auto-Capture
- **Classification:** Correct
- **Code:** `utils/captureRate.ts:180,192` — `attemptCapture`
- **Rule:** "A natural roll of 100 always captures the target without fail."
- **Verification:** `naturalHundred = roll === 100` (line 180). Success check is `naturalHundred || modifiedRoll <= effectiveCaptureRate` (line 192). A natural 100 bypasses all other checks and guarantees capture. Correct.

### capture-R004: Throwing Accuracy Check (present portion)
- **Classification:** Correct
- **Code:** `composables/useCapture.ts:243-250` — `rollAccuracyCheck`
- **Rule:** "Throwing Poke Balls is an AC6 Status Attack, with a range equal to the Trainer's Throwing Range: 4 plus their Athletics Rank."
- **Verification:** The `rollAccuracyCheck` function at lines 243-250 correctly rolls `Math.floor(Math.random() * 20) + 1` (d20 range 1-20) and returns `{ roll, isNat20: roll === 20, total: roll }`. The d20 roll mechanic itself is correctly implemented. The AC 6 comparison and range calculation are documented in comments but not enforced in code — which is already noted as the "Missing" portion in the matrix. The present portion (d20 roll + nat20 detection) is correct.

### capture-R018: Owned Pokemon Cannot Be Captured (present portion)
- **Classification:** Correct
- **Code:** `components/encounter/CombatantCard.vue:272-277` — `isWildPokemon`
- **Rule:** "And of course, Poke Balls fail to activate against owned Pokemon already registered to a Trainer and Ball!"
- **Verification:** The `isWildPokemon` computed property at lines 272-277 checks: (1) `isPokemon.value` — must be a Pokemon, (2) `combatant.side !== 'enemies'` — must be on enemy side, (3) `!pokemon.ownerId` — must not have an owner. CaptureRateDisplay is only rendered when `isWildPokemon` is true (line 91). This UI-level gatekeeping correctly prevents the GM from seeing capture UI on owned Pokemon. The present portion is correct; server-side validation gap is noted in the matrix as "Missing."

---

## Incorrect Items

### capture-R015: Status Affliction Modifier — Volatile and Injuries
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `utils/captureRate.ts:113-127` — `calculateCaptureRate`, `constants/statusConditions.ts:11-14` — `VOLATILE_CONDITIONS`
- **Rule:** "Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5."
- **Expected:** Each Volatile Condition adds +5 to capture rate. Stuck adds +10 (as a separate addition on top of any volatile bonus). Slow adds +5 (as a separate addition). Stuck and Trapped are classified as "Other Afflictions" in PTU, not Volatile Afflictions — they should only contribute their specific +10 bonus, not an additional +5 volatile bonus.
- **Actual:** The code at lines 113-127 uses `else if` logic: if a condition matches `PERSISTENT_CONDITIONS`, it adds +10; `else if` it matches `VOLATILE_CONDITIONS`, it adds +5. Then separately, if it matches `STUCK_CONDITIONS` (Stuck, Trapped), it adds +10, and if `SLOW_CONDITIONS` (Slowed), it adds +5. However, Stuck, Trapped, and Slowed are NOT in either `PERSISTENT_CONDITIONS` or `VOLATILE_CONDITIONS` — they are in `OTHER_CONDITIONS`. This means the `else if` chain skips them entirely for the volatile +5, and they only get their special bonus (+10 for Stuck/Trapped, +5 for Slowed). This is actually the CORRECT behavior per PTU rules, since Stuck/Slowed are "Other Afflictions, not true Status Afflictions."

  **However**, the actual issue is with `Trapped`. The PTU capture rate section says "Stuck adds +10 to Capture Rate" but does NOT mention Trapped specifically. The code treats Trapped identically to Stuck (both in `STUCK_CONDITIONS` at `utils/captureRate.ts:17`), giving Trapped +10 capture bonus. Per PTU 07-combat.md, Trapped means "cannot be recalled" — it is a completely different condition from Stuck ("cannot Shift"). The capture rate section only mentions "Stuck" not "Trapped," so Trapped should NOT add +10.
- **Evidence:** A Pokemon that is Trapped (cannot be recalled) but not Stuck (can still move) incorrectly gets +10 capture rate bonus. A level 20 wild Pokemon at 50% HP with only Trapped status would show capture rate 70 (base 100 - 40 level + 0 HP + 10 "stuck" bonus) instead of correct 60.

### capture-R032: Capture Is a Standard Action (present portion)
- **Classification:** Incorrect
- **Severity:** LOW
- **Code:** `components/encounter/CombatantCard.vue:90-95` — CaptureRateDisplay rendering
- **Rule:** "Throwing a Poke Ball to Capture a wild Pokemon" (listed under Standard Actions in PTU 07-combat.md)
- **Expected:** When a capture attempt is made during combat, it should consume the trainer's Standard Action for that turn. The action economy system should prevent a trainer from both using a move AND throwing a Poke Ball in the same turn.
- **Actual:** The CaptureRateDisplay component is rendered inside CombatantCard but the capture attempt workflow (Chain 3) is disconnected — the `@attempt` event from CaptureRateDisplay is not wired to any handler. Since the capture attempt cannot actually be executed from the UI, there is no action economy integration at all. Even if the workflow were connected, there is no code in CombatantCard or the encounter action system that would deduct a Standard Action on capture attempt.
- **Evidence:** The CaptureRateDisplay at line 90-95 does not pass `showAttemptButton` prop, so the button is not even visible. Even if it were, CombatantCard does not have an `@attempt` handler. The encounter's turn/action tracking system is completely separate from the capture flow.

---

## Approximation Items

### capture-R002: Persistent Status Condition Definition
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `constants/statusConditions.ts:7-9` — `PERSISTENT_CONDITIONS`
- **Rule:** "Persistent Afflictions are retained even if the Pokemon is recalled into its Poke Ball. Sleeping Pokemon will naturally awaken given time, and Frozen Pokemon can be thawed as an Extended Action after combat. Burned, Paralyzed, and Poisoned Pokemon must be treated with items or at a Pokemon Center to be cured, however."
- **Expected:** The PTU rulebook lists the following under the Persistent Afflictions header with individual entries: Burned, Frozen, Paralysis (Paralyzed), Poisoned. Sleep is mentioned in the intro text of the Persistent section ("Sleeping Pokemon will naturally awaken") but its detailed entry appears under Volatile Afflictions. Badly Poisoned is described as a variant of Poisoned, not a separate persistent condition name.
- **Actual:** The app defines `PERSISTENT_CONDITIONS` as `['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']`. Including "Badly Poisoned" as a separate persistent entry means a Pokemon that is both Poisoned AND Badly Poisoned would get +20 to capture rate (two persistent conditions) instead of +10 (one persistent condition with a severity variant).
- **What's Missing:** The PTU treats Badly Poisoned as a variant of Poisoned, not an independent condition. The code should either prevent a Pokemon from having both Poisoned and Badly Poisoned simultaneously, or treat them as one condition for capture rate calculation purposes. In practice, a Pokemon is typically either Poisoned OR Badly Poisoned (not both), so this approximation rarely manifests. The capture rate impact is correct in the normal case.

### capture-R003: Volatile Status Condition Definition
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `constants/statusConditions.ts:11-14` — `VOLATILE_CONDITIONS`
- **Rule:** "Volatile Afflictions are cured completely at the end of the encounter, and from Pokemon by recalling them into their Poke Balls."
- **Expected:** PTU lists these Volatile conditions with individual entries: Bad Sleep, Confused, Cursed, Disabled, Rage, Flinch, Infatuation, Sleep, Suppressed. The app should have corresponding entries for all 9.
- **Actual:** The app defines `VOLATILE_CONDITIONS` as `['Asleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed', 'Disabled', 'Enraged', 'Suppressed']` — 8 entries. Naming differences (Asleep vs Sleep, Enraged vs Rage, Flinched vs Flinch, Infatuated vs Infatuation) are cosmetic and internally consistent since the app's `StatusCondition` type uses these names everywhere. However, "Bad Sleep" is missing entirely from the volatile list and from the `StatusCondition` type union. A Pokemon suffering from Bad Sleep in PTU would get +5 volatile capture bonus, but the app has no way to represent this condition.
- **What's Missing:** Bad Sleep is not representable in the app. Bad Sleep is a separate volatile condition in PTU that afflicts only sleeping targets and causes them to lose HP when making save checks against Sleep. Since the app does not model Bad Sleep, a Pokemon with both Sleep and Bad Sleep in a tabletop scenario would only get +5 (for Asleep) instead of +10 (Sleep +5, Bad Sleep +5). This is an edge case since Bad Sleep is relatively uncommon.

### capture-R020: Poke Ball Type Modifiers (present portion)
- **Classification:** Approximation
- **Severity:** HIGH
- **Code:** `server/api/capture/attempt.post.ts:10-11,88` — `pokeBallType` parameter
- **Rule:** "Basic Ball: +0; Great Ball: -10; Ultra Ball: -15; Master Ball: -100" (and 21 more ball types with various modifiers)
- **Expected:** The app should either (a) map `pokeBallType` to the correct numeric modifier from a lookup table, or (b) clearly require the caller to pass the already-resolved numeric modifier. The full PTU ball chart defines 25 ball types, many with conditional modifiers (Level Ball: -20 if target under half user's level, Timer Ball: starts +5 and decreases by 5 per round, etc.).
- **Actual:** The API accepts `pokeBallType` as a string parameter (line 10 of attempt.post.ts) but never uses it to look up a modifier. The `modifiers` parameter (line 9) is passed directly to `attemptCapture()` as a numeric value (line 88). The `pokeBallType` is effectively dead code — it does not affect the capture calculation at all. The GM or client must manually calculate the ball modifier and pass it as `modifiers`. No constant, enum, or lookup table for ball modifiers exists anywhere in the codebase.
- **What's Missing:** A `POKE_BALL_MODIFIERS` constant mapping ball names to their base modifiers, plus logic for conditional modifiers (Timer Ball round scaling, Level Ball level comparison, etc.). Currently the entire ball type system is a pass-through that relies on external calculation.

---

## Ambiguous Items

### capture-R027: Capture Workflow (present portion)
- **Classification:** Ambiguous
- **Code:** `server/api/capture/attempt.post.ts:82-89` — criticalHit and modifiers handling, `utils/captureRate.ts:183-192` — attemptCapture
- **Rule:** "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features. If you roll under or equal to the Pokemon's Capture Rate, the Pokemon is Captured!"
- **Interpretation A:** The Poke Ball type modifier is applied to the capture ROLL (subtracted from the d100 result alongside trainer level). The rule says "The Type of Ball will also modify the Capture Roll" — meaning it modifies the roll itself, not the capture rate. So: `modifiedRoll = d100 - trainerLevel - ballModifier - equipmentModifiers`. A negative ball modifier (like Great Ball -10) would be subtracted from the roll, meaning `roll - (-10) = roll + 10`, making the roll higher and harder to capture. Wait — this doesn't make sense with the sign convention in the ball chart. If Great Ball has modifier "-10" and we subtract it from the roll, we get `roll + 10`, which is worse. But Great Balls should be BETTER.
- **Interpretation B:** The Poke Ball modifier in the chart represents a BONUS to capture (negative = easier). The chart shows Great Ball at "-10" meaning the effective capture threshold improves. The modifier should be subtracted from the roll in the same direction as trainer level: `modifiedRoll = d100 - trainerLevel - ballModifier`. With Great Ball (-10): `modifiedRoll = roll - trainerLevel - (-10) = roll - trainerLevel + 10`. This makes the modified roll HIGHER, which means it's LESS likely to be under the capture rate — contradicting the intent.
- **Interpretation C (most likely correct):** The ball modifier adjusts the Capture Roll downward (like trainer level). The chart values represent how much is subtracted: Great Ball -10 means subtract 10 from the roll. So `modifiedRoll = d100 - trainerLevel + ballModifier` where ballModifier is negative. This gives `roll - trainerLevel + (-10) = roll - trainerLevel - 10`, which lowers the roll and makes capture more likely. The current code does `roll - trainerLevel - modifiers` which means a positive `modifiers` value lowers the roll. For Great Ball, the caller should pass `modifiers = 10` (positive) to get `roll - level - 10`.
- **Code follows:** The code uses `modifiedRoll = roll - trainerLevel - modifiers` where `modifiers` is a positive number that reduces the roll. This means the caller must invert the sign from the ball chart (Great Ball chart says -10, caller passes +10). This works but the sign convention is undocumented and could confuse integrators.
- **Action:** Escalate to Game Logic Reviewer to confirm the correct sign convention for ball modifiers and whether the current implementation matches PTU intent. The ambiguity arises from PTU using "modify the Capture Roll" without specifying the exact arithmetic, combined with the ball chart using negative numbers for beneficial modifiers.

---

## Additional Observations

### Observation 1: CombatantCard hardcodes evolution stage
The CombatantCard component at `components/encounter/CombatantCard.vue:287-288` passes `evolutionStage: 1, maxEvolutionStage: 3` to `calculateCaptureRateLocal()` instead of looking up the actual species data from SpeciesData. This means every wild Pokemon displays as having "two evolutions remaining" (+10 capture rate bonus), regardless of actual evolution stage. A fully-evolved Hydreigon in combat would incorrectly show +10 instead of -10 for the evolution modifier — a 20-point swing. This is noted in the matrix as a known UI integration issue (not a formula issue) but it significantly affects the displayed capture rate accuracy.

### Observation 2: Server-side rate.post.ts hardcodes isLegendary to false
The `server/api/capture/rate.post.ts:99` hardcodes `isLegendary: false` with a comment "Could add legendary detection later." Similarly, `attempt.post.ts:65` hardcodes `isLegendary: false`. There is no field on the Pokemon or SpeciesData model to indicate legendary status, so the -30 legendary penalty can never be triggered through the API. The `calculateCaptureRate` utility correctly supports the `isLegendary` parameter, but the API layer never passes `true`.

### Observation 3: No minimum/maximum capture rate clamping
The `calculateCaptureRate` function does not clamp the final capture rate to any bounds. A high-level fully-evolved Pokemon with no conditions can have a negative capture rate (e.g., level 80 Hydreigon = -15 per the rulebook example). The `attemptCapture` function compares `modifiedRoll <= effectiveCaptureRate` which works correctly with negative rates (only natural 100 can capture). However, there's no explicit "impossible" classification — the rate can be deeply negative. The PTU rulebook does not mention a minimum capture rate floor, so this appears intentional.

### Observation 4: Errata playtest capture system not implemented
The errata file (`errata-2.md`) contains a completely different d20-based capture system (page 8). The app correctly implements the base PTU 1.05 d100 system, not the errata playtest system. The errata is clearly labeled as "playtest material" and "subject to change," so this is correct behavior. No action needed.
