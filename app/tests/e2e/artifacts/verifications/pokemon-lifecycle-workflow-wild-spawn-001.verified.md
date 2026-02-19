---
scenario_id: pokemon-lifecycle-workflow-wild-spawn-001
verified_at: 2026-02-19T00:00:00Z
status: PASS
assertions_checked: 16
assertions_correct: 16
---

## Assertion Verification

### Assertion 1: Spawn response structure
- **Scenario says:** `response.data.addedPokemon[0].species = "Zubat"` and `response.data.addedPokemon[0].level = 10`
- **Independent derivation:** The wild-spawn endpoint (`encounters/[id]/wild-spawn.post.ts`) calls `generateAndCreatePokemon()` with `speciesName: "Zubat"` and `level: 10`, then pushes `{ pokemonId, combatantId, species: created.species, level: created.level }` into `createdPokemon`. The response shape is `{ success, data: { encounter, addedPokemon } }`. So `addedPokemon[0].species` = `"Zubat"` and `addedPokemon[0].level` = `10`.
- **Implementation check:** Verified in `app/server/api/encounters/[id]/wild-spawn.post.ts` lines 52-70. The response returns `species` and `level` from `created.species` and `created.level`.
- **Status:** CORRECT

### Assertion 2: Encounter includes new combatant on enemies side
- **Scenario says:** Encounter combatants include `$combatant_id` on side `"enemies"`
- **Independent derivation:** The endpoint builds a combatant via `buildPokemonCombatant(created, side, position)` where `side` defaults to `"enemies"` (line 27: `body.side || 'enemies'`). The combatant is pushed into the encounter's combatants array (line 64) and the encounter is updated in the DB (line 75).
- **Implementation check:** Verified. The combatant is added with the specified side.
- **Status:** CORRECT

### Assertion 3: Species and types from SpeciesData
- **Scenario says:** `$pokemon.species = "Zubat"`, `$pokemon.types = ["Poison", "Flying"]`
- **Independent derivation:** From `gen1/zubat.md`: Type = Poison / Flying. The generator looks up SpeciesData and sets `types = speciesData.type2 ? [speciesData.type1, speciesData.type2] : [speciesData.type1]`. Zubat has type1=Poison, type2=Flying, so types = `["Poison", "Flying"]`.
- **Implementation check:** Verified in `pokemon-generator.service.ts` line 111. GET endpoint returns `types: pokemon.type2 ? [pokemon.type1, pokemon.type2] : [pokemon.type1]`.
- **Status:** CORRECT

### Assertion 4: Level preserved from request
- **Scenario says:** `$pokemon.level = 10`
- **Independent derivation:** The generator passes `input.level` through to the created record. Level is set to 10 in the request.
- **Implementation check:** Verified in `pokemon-generator.service.ts` line 134 (`level: data.level`). `createPokemonRecord` stores `level: data.level` in Prisma.
- **Status:** CORRECT

### Assertion 5: Base stats match SpeciesData
- **Scenario says:** hp=4, attack=5, defense=4, specialAttack=3, specialDefense=4, speed=6
- **Independent derivation:** From `gen1/zubat.md`: HP=4, Attack=5, Defense=4, Special Attack=3, Special Defense=4, Speed=6. These match exactly.
- **Implementation check:** Generator reads `speciesData.baseHp`, `speciesData.baseAttack`, etc. and stores them in `baseStats`. The `createPokemonRecord` stores these as `baseHp`, `baseAttack`, etc. GET returns them in `baseStats` object.
- **Status:** CORRECT

### Assertion 6: Stat points total distributed = level - 1 = 9
- **Scenario says:** `totalDistributed = 9`, and `(maxHp - 10 - 10) is divisible by 3`
- **Independent derivation:** `distributeStatPoints()` allocates `Math.max(0, level - 1)` = `Math.max(0, 9)` = 9 points. Each point is added to a stat weighted by base stat proportions. The HP formula is `level + (calculatedHp * 3) + 10`, so `maxHp = 10 + (calculatedHp * 3) + 10`, meaning `(maxHp - 10 - 10)` = `calculatedHp * 3`, which is always divisible by 3.
- **Implementation check:** Verified in `pokemon-generator.service.ts` lines 333-365. The while loop distributes exactly `remainingPoints = Math.max(0, level - 1) = 9` points. Each iteration decrements `remainingPoints` by 1 and increments one stat.
- **Status:** CORRECT
- **Note:** The derivation formula in the scenario (`calculatedHp = (maxHp - level - 10) / 3`) is correct. `hpDistributed = calculatedHp - baseStats.hp` and the sum across all 6 stats equals 9.

### Assertion 7: Each calculated stat >= base stat
- **Scenario says:** currentStats.attack >= 5, defense >= 4, specialAttack >= 3, specialDefense >= 4, speed >= 6, calculatedHp >= 4
- **Independent derivation:** `distributeStatPoints` returns `baseStat + distributedPoints[key]` for each stat. `distributedPoints[key]` starts at 0 and is only incremented (never decremented). Therefore each final stat >= base stat.
- **Implementation check:** Verified in `pokemon-generator.service.ts` lines 357-364. Return values are `baseStats[key] + distributedPoints[key]` where distributedPoints are non-negative integers.
- **Status:** CORRECT

### Assertion 8: HP formula bounds
- **Scenario says:** maxHp >= 32, maxHp <= 59, currentHp = maxHp
- **Independent derivation:** Minimum maxHp (0 HP stat points): `10 + (4 * 3) + 10 = 32`. Maximum maxHp (all 9 points to HP): `10 + (13 * 3) + 10 = 59`. currentHp is set to `data.maxHp` in `createPokemonRecord` (line 195).
- **Implementation check:** Verified. `maxHp = input.level + (calculatedStats.hp * 3) + 10` (line 135). `currentHp: data.maxHp` (line 195).
- **Status:** CORRECT

### Assertion 9: Moves from learnset at or below level 10
- **Scenario says:** 3 moves: Leech Life, Supersonic, Astonish
- **Independent derivation:** From `gen1/zubat.md` learnset: L1 Leech Life, L5 Supersonic, L7 Astonish, L11 Bite (too high). At level 10, only 3 moves qualify. `selectMovesFromLearnset` filters `entry.level <= 10` then takes `.slice(-6)`. With only 3 entries, all 3 are included.
- **Implementation check:** Verified in `pokemon-generator.service.ts` lines 371-408. Filter is `entry.level <= level`, then `.slice(-6)`.
- **Status:** CORRECT

### Assertion 10: Single ability from basic list
- **Scenario says:** abilities.length = 1, abilities[0].name is one of ["Inner Focus", "Infiltrator"]
- **Independent derivation:** From `gen1/zubat.md`: Basic Ability 1 = Inner Focus, Basic Ability 2 = Infiltrator. `pickRandomAbility` takes `Math.min(2, abilityNames.length) = 2` abilities and picks one randomly.
- **Implementation check:** Verified in `pokemon-generator.service.ts` lines 415-419. `Math.random() * Math.min(2, abilityNames.length)` selects index 0 or 1 from the array.
- **Status:** CORRECT

### Assertion 11: Auto-generated nickname
- **Scenario says:** nickname matches `/^Zubat \d+$/`
- **Independent derivation:** No nickname is provided in the wild spawn request (the `GeneratePokemonInput` has `nickname` as undefined). `resolveNickname("Zubat", undefined)` counts existing Zubat records and returns `"Zubat ${count + 1}"`.
- **Implementation check:** Verified in `server/utils/pokemon-nickname.ts`. If `nickname?.trim()` is falsy, returns `"${species} ${count + 1}"`. The space and trailing number match the regex pattern.
- **Status:** CORRECT

### Assertion 12: Origin and library flags
- **Scenario says:** origin = "wild", isInLibrary = true
- **Independent derivation:** Wild spawn calls `generateAndCreatePokemon` with `origin: 'wild'` (line 55 of wild-spawn.post.ts). `createPokemonRecord` stores `origin: input.origin` and `isInLibrary: true` (line 222).
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 13: Gender is valid
- **Scenario says:** gender is one of ["Male", "Female"]
- **Independent derivation:** `generatePokemonData` sets `gender = ['Male', 'Female'][Math.floor(Math.random() * 2)]` (line 148). This always produces either "Male" or "Female".
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 14: Fresh combat state
- **Scenario says:** injuries = 0, statusConditions = []
- **Independent derivation:** `createPokemonRecord` stores `statusConditions: JSON.stringify([])` (line 219). `injuries` is not set in the create call, so it defaults to the Prisma schema default. The GET endpoint returns `injuries: pokemon.injuries`.
- **Implementation check:** Verified. Prisma schema has `injuries Int @default(0)`. Status conditions are explicitly set to empty array.
- **Status:** CORRECT

### Assertion 15: Capabilities inherited from SpeciesData
- **Scenario says:** capabilities includes overland=2, sky=5, power=1
- **Independent derivation:** From `gen1/zubat.md`: Overland 2, Swim 1, Sky 5, Jump 1/1, Power 1. The generator copies these from SpeciesData into `movementCaps` and `power`. `createPokemonRecord` stores them as `capabilities: JSON.stringify({ ...data.movementCaps, power, jump, weightClass, size, otherCapabilities })`.
- **Implementation check:** Verified in `pokemon-generator.service.ts` lines 116-128 and 209-216. GET endpoint parses and returns `capabilities`.
- **Status:** CORRECT

### Assertion 16: Skills inherited from SpeciesData
- **Scenario says:** skills is a non-empty object
- **Independent derivation:** From `gen1/zubat.md`: Skills include Athl 1d6+2, Acro 2d6+2, Combat 2d6, Stealth 3d6, Percep 1d6+2, Focus 2d6. The seed parses these into a JSON object stored in SpeciesData. The generator reads `skills = JSON.parse(speciesData.skills || '{}')` (line 114).
- **Implementation check:** Verified. `createPokemonRecord` stores `skills: JSON.stringify(data.skills)`. GET returns `skills: JSON.parse(pokemon.skills)`.
- **Status:** CORRECT

## Data Validity

- [x] Zubat base stats match `gen1/zubat.md`: HP=4, ATK=5, DEF=4, SpATK=3, SpDEF=4, SPD=6
- [x] Zubat types match: Poison / Flying
- [x] Zubat basic abilities match: Inner Focus, Infiltrator
- [x] Zubat learnset at L10 matches: L1 Leech Life, L5 Supersonic, L7 Astonish (next is L11 Bite)
- [x] Zubat capabilities match: Overland 2, Swim 1, Sky 5, Jump 1/1, Power 1
- [x] Evolution line: 1-Zubat, 2-Golbat (min 20), 3-Crobat (min 30) -- 3 stages total
- [x] Gender ratio: 50% M / 50% F (app uses 50/50 for all species -- matches Zubat but is a deviation from species-specific ratios)

## Completeness Check

- [x] All 8 mechanics listed in the scenario header are covered by assertions: hp-formula, stat-point-distribution, move-selection-from-learnset, ability-assignment, nickname-resolution, species-data-lookup, capability-inheritance, skill-inheritance
- [x] Scenario correctly identifies the non-deterministic nature of the test (stat distribution is random)
- [x] The `query-then-compute` strategy is appropriate -- read the generated values and verify invariants rather than exact values
- [x] All assertions use appropriate bound checks (>=, <=, range) for non-deterministic values
- [x] Teardown cleans up created resources

## Errata Check

- The errata (Sept 2015 Playtest Packet) revises the capture mechanic to use d20 instead of the d100 system. The app uses the 1.05 base ruleset capture system, NOT the errata. This is irrelevant to the wild-spawn scenario since capture is not exercised here.
- No errata changes affect Pokemon stat generation, HP formula, move selection, or ability assignment.

## Issues Found

None. All 16 assertions are correct and well-structured for the non-deterministic nature of wild Pokemon generation.
