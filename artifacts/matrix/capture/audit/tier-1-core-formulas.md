## Tier 1: Core Formulas

### 1. capture-R001 — Capture Rate Base Formula

- **Rule:** "First, begin with 100. Then subtract the Pokemon's Level x2." (05-pokemon.md:1719-1720)
- **Expected behavior:** `captureRate = 100 - (level * 2) + modifiers`
- **Actual behavior:** `app/utils/captureRate.ts:73-76` — `base = 100; levelModifier = -(level * 2)`. Final sum includes base + levelModifier + all other modifiers.
- **Classification:** Correct

### 2. capture-R006 — HP Modifier (Above 75%)

- **Rule:** "If the Pokemon is above 75% Hit Points, subtract 30 from the Pokemon's Capture Rate." (05-pokemon.md:1721)
- **Expected behavior:** hpPercentage > 75 → -30
- **Actual behavior:** `app/utils/captureRate.ts:88-89` — `else { hpModifier = -30 }` (the final else branch, reached when hpPercentage > 75 after checking currentHp === 1, then <= 25, <= 50, <= 75).
- **Classification:** Correct
- **Note:** Per decree-015, real max HP is used for percentage calculation. Code at line 70 does `hpPercentage = (currentHp / maxHp) * 100`, where maxHp is the real max HP passed in. Correct.

### 3. capture-R007 — HP Modifier (51-75%)

- **Rule:** "If the Pokemon is at 75% Hit Points or lower, subtract 15 from the Pokemon's Capture Rate." (05-pokemon.md:1722)
- **Expected behavior:** 50 < hpPercentage <= 75 → -15
- **Actual behavior:** `app/utils/captureRate.ts:86-87` — `else if (hpPercentage <= 75) { hpModifier = -15 }`
- **Classification:** Correct

### 4. capture-R008 — HP Modifier (26-50%)

- **Rule:** "If the Pokemon is at 50% or lower, the Capture Rate is unmodified." (05-pokemon.md:1723)
- **Expected behavior:** 25 < hpPercentage <= 50 → 0
- **Actual behavior:** `app/utils/captureRate.ts:84-85` — `else if (hpPercentage <= 50) { hpModifier = 0 }`
- **Classification:** Correct

### 5. capture-R009 — HP Modifier (1-25%)

- **Rule:** "If the Pokemon is at 25% Hit Points or lower, add a total of +15 to the Pokemon's Capture Rate." (05-pokemon.md:1723-1724)
- **Expected behavior:** currentHp > 1 and hpPercentage <= 25 → +15
- **Actual behavior:** `app/utils/captureRate.ts:82-83` — `else if (hpPercentage <= 25) { hpModifier = 15 }`. This branch is reached after the `currentHp === 1` check at line 80, so exactly 1 HP goes to the +30 branch first.
- **Classification:** Correct

### 6. capture-R010 — HP Modifier (Exactly 1 HP)

- **Rule:** "And if the Pokemon is at exactly 1 Hit Point, add a total of +30 to the Pokemon's Capture Rate." (05-pokemon.md:1724-1725)
- **Expected behavior:** currentHp === 1 → +30
- **Actual behavior:** `app/utils/captureRate.ts:80-81` — `if (currentHp === 1) { hpModifier = 30 }`
- **Classification:** Correct

### 7. capture-R011 — Evolution Stage (+10 for 2 Remaining)

- **Rule:** "If the Pokemon has two evolutions remaining, add +10 to the Pokemon's Capture Rate." (05-pokemon.md:1727)
- **Expected behavior:** `maxEvolutionStage - evolutionStage >= 2` → +10
- **Actual behavior:** `app/utils/captureRate.ts:93-97` — `evolutionsRemaining = maxEvolutionStage - evolutionStage; if (evolutionsRemaining >= 2) { evolutionModifier = 10 }`
- **Classification:** Correct
- **Note:** SpeciesData model provides `evolutionStage` and `maxEvolutionStage` fields (schema.prisma:277-278). API endpoints look up species data from DB (rate.post.ts:54-61, attempt.post.ts:48-53).

### 8. capture-R012 — Evolution Stage (One Remaining = 0)

- **Rule:** "If the Pokemon has one evolution remaining, don't change the Capture Rate." (05-pokemon.md:1728)
- **Expected behavior:** `evolutionsRemaining === 1` → 0
- **Actual behavior:** `app/utils/captureRate.ts:98-99` — `else if (evolutionsRemaining === 1) { evolutionModifier = 0 }`
- **Classification:** Correct

### 9. capture-R013 — Evolution Stage (-10 for No Remaining)

- **Rule:** "If the Pokemon has no evolutions remaining, subtract 10 from the Pokemon's Capture Rate." (05-pokemon.md:1728-1729)
- **Expected behavior:** `evolutionsRemaining === 0` → -10
- **Actual behavior:** `app/utils/captureRate.ts:100-101` — `else { evolutionModifier = -10 }` (final else after checking >= 2 and === 1).
- **Classification:** Correct

### 10. capture-R014 — Persistent Status (+10 Each)

- **Rule:** "Persistent Conditions add +10 to the Pokemon's Capture Rate" (05-pokemon.md:1732)
- **Expected behavior:** +10 per persistent condition. Poisoned/Badly Poisoned variants count once.
- **Actual behavior:** `app/utils/captureRate.ts:116-128` — Loops through statusConditions. For PERSISTENT_CONDITIONS: +10 each. Special de-duplication: Poisoned/Badly Poisoned count as one (lines 118-125 use `hasPoisonBonus` flag).
- **Classification:** Correct
- **Note:** The Poisoned/Badly Poisoned de-duplication is correct. PTU p.246 describes them as variants of the same affliction.

### 11. capture-R015 — Volatile/Injury Modifiers

- **Rule:** "Injuries and Volatile Conditions add +5. Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5." (05-pokemon.md:1733)
- **Expected behavior:** +5 per volatile condition, +5 per injury, +10 for Stuck (separate), +5 for Slowed (separate). Per decree-014: Stuck/Slow bonuses are separate from volatile, not stacked.
- **Actual behavior:** `app/utils/captureRate.ts:116-140` — Loop structure:
  1. Check PERSISTENT_CONDITIONS → +10 (lines 117-125)
  2. Else if VOLATILE_CONDITIONS → +5 (lines 126-128)
  3. Separately: check STUCK_CONDITIONS → +10 (lines 131-133)
  4. Separately: check SLOW_CONDITIONS → +5 (lines 134-136)
  5. After loop: injuryModifier = injuries * 5 (line 140)

  Stuck is in OTHER_CONDITIONS (statusConditions.ts:17), not VOLATILE_CONDITIONS. So for 'Stuck': step 1 = false, step 2 = false, step 3 = +10. Total: +10. Correct per decree-014.
  Slowed is also in OTHER_CONDITIONS. For 'Slowed': step 1 = false, step 2 = false, step 3 = false, step 4 = +5. Total: +5. Correct per decree-014.
- **Classification:** Correct (per decree-014)

### 12. capture-R016 — Rarity Modifier (Shiny/Legendary)

- **Rule:** "Shiny Pokemon subtract 10 from the Pokemon's Capture Rate. Legendary Pokemon subtract 30 from the Pokemon's Capture Rate." (05-pokemon.md:1730-1731)
- **Expected behavior:** Shiny: -10. Legendary: -30. Both can stack.
- **Actual behavior:** `app/utils/captureRate.ts:104-106` — `shinyModifier = isShiny ? -10 : 0; legendaryModifier = isLegendary ? -30 : 0`. Both added to final sum.
  - Legendary detection in API: `rate.post.ts:93` — `const isLegendary = body.isLegendary ?? isLegendarySpecies(species)` (GM override or auto-detect). `attempt.post.ts:56` — `const isLegendary = isLegendarySpecies(pokemon.species)` (auto-detect only).
  - `isLegendarySpecies()` in `app/constants/legendarySpecies.ts:129-143` checks against a comprehensive Set of 83 legendary/mythical species (Gen 1-8 + Hisui). Case-insensitive fallback.
- **Classification:** Correct

### 13. capture-R005 — Capture Roll Mechanic

- **Rule:** "Roll 1d100, and subtract the Trainer's Level, and any modifiers from equipment or Features. If you roll under or equal to the Pokemon's Capture Rate, the Pokemon is Captured! A natural roll of 100 always captures the target without fail." (05-pokemon.md:1712-1717). Per decree-013: use the 1d100 system, not the errata d20 playtest.
- **Expected behavior:** Roll 1d100. `modifiedRoll = roll - trainerLevel + ballModifiers`. Success if `modifiedRoll <= captureRate` or natural 100.
- **Actual behavior:** `app/utils/captureRate.ts:187-204`:
  - `roll = Math.floor(Math.random() * 100) + 1` (range: 1-100). Correct.
  - `naturalHundred = roll === 100`. Uses raw roll, not modified roll. Correct.
  - `modifiedRoll = roll - trainerLevel + modifiers` (line 201). The comment at lines 199-200 explains: "PTU ball modifiers are negative (e.g., Great Ball = -10), so adding them correctly reduces the roll, making capture easier." This matches PTU convention: Great Ball = -10 → `roll - trainerLevel + (-10)` = lower modified roll = easier capture. Correct.
  - `success = naturalHundred || modifiedRoll <= effectiveCaptureRate` (line 204). Correct.
- **Classification:** Correct (per decree-013)

---

## Verification Cross-Checks

### PTU Example 1 (05-pokemon.md:1735-1736)

> "A level 10 Pikachu that is at 70% Hit Points and Confused would have a Capture Rate of 70."
> Math: Level (+80), Health (-15), One Evolution (+0), Confused (+5)

Code trace: `calculateCaptureRate({ level: 10, currentHp: 35, maxHp: 50, evolutionStage: 1, maxEvolutionStage: 2, statusConditions: ['Confused'], injuries: 0, isShiny: false })`:
- base = 100
- levelModifier = -(10*2) = -20 → running total: 80
- hpPercentage = 70% → hpModifier = -15 → running total: 65
- evolutionsRemaining = 2 - 1 = 1 → evolutionModifier = 0 → running total: 65
- Confused is in VOLATILE_CONDITIONS → statusModifier = +5 → running total: 70
- **Result: 70** — matches PTU example.

### PTU Example 2 (05-pokemon.md:1737-1738)

> "A Shiny level 30 Caterpie that is at 40% Hit Points and has one injury would have a Capture Rate of 45."
> Math: Level (+40), Health (+0), Two Evolutions (+10), Shiny (-10), Injury (+5).

Code trace: `calculateCaptureRate({ level: 30, currentHp: 20, maxHp: 50, evolutionStage: 1, maxEvolutionStage: 3, statusConditions: [], injuries: 1, isShiny: true })`:
- base = 100
- levelModifier = -(30*2) = -60 → running total: 40
- hpPercentage = 40% → hpModifier = 0 → running total: 40
- evolutionsRemaining = 3 - 1 = 2 → evolutionModifier = +10 → running total: 50
- shinyModifier = -10 → running total: 40
- injuryModifier = 1 * 5 = +5 → running total: 45
- **Result: 45** — matches PTU example.

### PTU Example 3 (05-pokemon.md:1739-1741)

> "A level 80 Hydreigon that is at exactly 1 Hit Point, and is Burned, Poisoned, and has one Injury would have a Capture Rate of -15."
> Math: Level (-60), Health (+30), No Evolutions (-10), Burned (+10), Poisoned (+10), Injury (+5).

Code trace: `calculateCaptureRate({ level: 80, currentHp: 1, maxHp: 200, evolutionStage: 3, maxEvolutionStage: 3, statusConditions: ['Burned', 'Poisoned'], injuries: 1, isShiny: false })`:
- base = 100
- levelModifier = -(80*2) = -160 → running total: -60
- currentHp === 1 → hpModifier = +30 → running total: -30
- evolutionsRemaining = 3 - 3 = 0 → evolutionModifier = -10 → running total: -40
- Burned: persistent → statusModifier += 10 → running total: -30
- Poisoned: persistent → statusModifier += 10 → running total: -20
- injuryModifier = 1 * 5 = +5 → running total: -15
- **Result: -15** — matches PTU example.

All three PTU verification examples produce correct results.
