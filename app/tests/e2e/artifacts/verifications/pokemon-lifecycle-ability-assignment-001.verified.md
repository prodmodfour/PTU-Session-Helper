---
scenario_id: pokemon-lifecycle-ability-assignment-001
verified_at: 2026-02-19T00:00:00Z
status: PARTIAL
assertions_checked: 6
assertions_correct: 5
---

## Assertion Verification

### Assertion 1: Zubat -- Exactly 1 Ability Assigned
- **Scenario says:** $zubat.abilities.length = 1
- **Independent derivation:** `pickRandomAbility()` (pokemon-generator.service.ts lines 415-419) returns an array with a single element when `abilityNames.length > 0`. Zubat has 5 abilities in the SpeciesData table (basic + advanced + high). The function selects one and returns `[{ name: selected, effect: '' }]`.
- **Implementation check:** Line 417: `const selected = abilityNames[Math.floor(Math.random() * Math.min(2, abilityNames.length))]`. Returns `[{ name: selected, effect: '' }]` -- always exactly 1 element. Stored via `JSON.stringify()` in `createPokemonRecord()`, parsed back by GET endpoint. `abilities.length = 1`.
- **Status:** CORRECT

### Assertion 2: Zubat -- Ability Is from Basic List
- **Scenario says:** $zubat.abilities[0].name is one of ["Inner Focus", "Infiltrator"]
- **Independent derivation:** Zubat pokedex (gen1/zubat.md) lists: Basic Ability 1: Inner Focus, Basic Ability 2: Infiltrator, plus 3 advanced/high abilities. The seed (seed.ts lines 290-304) parses ALL abilities (basic, advanced, high) in pokedex order and stores them as a JSON array. For Zubat: ["Inner Focus", "Infiltrator", "Insomnia", "Vanguard", "Ambush"]. `pickRandomAbility()` picks from the first `Math.min(2, 5) = 2` entries: index 0 (Inner Focus) or index 1 (Infiltrator). Both are basic abilities, so the set membership assertion is correct.
- **Implementation check:** Confirmed. The first 2 in Zubat's stored list are both basic abilities. The assertion correctly uses set membership for the non-deterministic pick.
- **Status:** CORRECT

### Assertion 3: Zubat -- Ability Effect Is Empty
- **Scenario says:** $zubat.abilities[0].effect = ""
- **Independent derivation:** `pickRandomAbility()` returns `[{ name: selected, effect: '' }]` (line 418). Effect is hardcoded as empty string. No AbilityData lookup occurs.
- **Implementation check:** Confirmed.
- **Status:** CORRECT

### Assertion 4: Caterpie -- Exactly 1 Ability Assigned
- **Scenario says:** $caterpie.abilities.length = 1
- **Independent derivation:** Same logic as Assertion 1. Caterpie has 5 abilities stored, so `pickRandomAbility()` returns a 1-element array.
- **Implementation check:** Confirmed. Same code path.
- **Status:** CORRECT

### Assertion 5: Caterpie -- Only Option Selected (Shield Dust)
- **Scenario says:** $caterpie.abilities[0].name = "Shield Dust"
- **Independent derivation:** Caterpie pokedex (gen1/caterpie.md) lists only 1 basic ability: "Basic Ability 1: Shield Dust". There is no "Basic Ability 2". The advanced abilities are: Run Away, Silk Threads, Stench. High ability: Suction Cups.

  The seed parses ALL abilities in pokedex order (seed.ts lines 291-294 -- three regex patterns executed in sequence: Basic, then Adv, then High). For Caterpie, the stored array is: `["Shield Dust", "Run Away", "Silk Threads", "Stench", "Suction Cups"]`.

  `pickRandomAbility()` computes `Math.min(2, 5) = 2` and picks randomly from index 0 (Shield Dust -- basic) or index 1 (Run Away -- advanced). The code does NOT distinguish basic from advanced abilities; it simply takes the first 2 from the full stored list.

  The assertion that the result is always "Shield Dust" is **not guaranteed** -- there is a 50% chance of "Run Away" being selected instead.

- **Implementation check:** Confirmed via seed.ts ability parsing (lines 290-304) and `pickRandomAbility()` logic (line 417). The app stores basic + advanced + high abilities in a single array and picks from the first 2 regardless of classification.
- **Status:** INCORRECT
- **Fix:** Change the assertion from exact match to set membership:
  `Assert: $caterpie.abilities[0].name is one of ["Shield Dust", "Run Away"]`
  Additionally, update the scenario description: the generator picks from "the first 2 abilities in the stored list" (not "the first 2 basic abilities"), which for species with only 1 basic ability means the selection pool includes the first advanced ability.

### Assertion 6: Caterpie -- Ability Effect Is Empty
- **Scenario says:** $caterpie.abilities[0].effect = ""
- **Independent derivation:** Same as Assertion 3. `pickRandomAbility()` always returns `effect: ''`.
- **Implementation check:** Confirmed.
- **Status:** CORRECT

## Data Validity
- [x] Zubat abilities verified from gen1/zubat.md: Basic Ability 1: Inner Focus, Basic Ability 2: Infiltrator. First 2 in stored list are both basic.
- [x] Caterpie abilities verified from gen1/caterpie.md: Basic Ability 1: Shield Dust (only 1 basic), Adv Ability 1: Run Away. First 2 in stored list are Shield Dust (basic) and Run Away (advanced).

## Completeness Check
- [x] Species with 2 basic abilities tested (Zubat)
- [x] Species with 1 basic ability tested (Caterpie) -- but assertion needs fix
- [x] Empty effect string verified for both species
- [ ] Species with 0 abilities not tested (edge case: `pickRandomAbility` returns empty array)
- [x] Uses wild-spawn path which exercises `generateAndCreatePokemon()` -> `pickRandomAbility()`

## Errata Check
- No errata corrections affect ability assignment. The errata document (September 2015 playtest) does not modify how basic abilities are chosen at creation.

## Issues Found
1. **Assertion 5 is INCORRECT:** The scenario asserts `$caterpie.abilities[0].name = "Shield Dust"` as a deterministic result, but the app picks from the first 2 abilities in the full stored list (basic + advanced + high). For Caterpie, the first 2 are Shield Dust (basic) and Run Away (advanced). The test will fail approximately 50% of the time.
   - **Fix:** Change to set membership: `$caterpie.abilities[0].name is one of ["Shield Dust", "Run Away"]`
2. **Scenario description inaccuracy:** The description says the generator picks from "the species' first 2 basic abilities." It should say "the first 2 abilities in the stored list" since the app does not distinguish basic from advanced abilities. For species with only 1 basic ability, the second candidate is an advanced ability.
