---
scenario_id: pokemon-lifecycle-stat-distribution-001
verified_at: 2026-02-19T00:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

### Assertion 1: Zero Points Distributed -- Calculated Stats Equal Base Stats (Level 1 Zubat)
- **Scenario says:** At level 1, `level - 1 = 0` points distributed. All calculated stats should equal base stats: attack=5, defense=4, specialAttack=3, specialDefense=4, speed=6.
- **Independent derivation:** `distributeStatPoints()` in pokemon-generator.service.ts line 343: `let remainingPoints = Math.max(0, level - 1)`. At level 1: `Math.max(0, 0) = 0`. The while loop never executes. Returned stats = `baseStats[key] + distributedPoints[key]` where all `distributedPoints` are 0. So calculatedStats = baseStats exactly. Zubat base stats from pokedex (gen1/zubat.md): HP=4, ATK=5, DEF=4, SpATK=3, SpDEF=4, SPD=6. The GET endpoint returns `currentStats.attack = pokemon.currentAttack`, which was set from `data.calculatedStats.attack` during creation (pokemon-generator.service.ts line 200).
- **Implementation check:** Confirmed. At level 1, `distributeStatPoints()` returns base stats unchanged. `createPokemonRecord()` sets `currentAttack: data.calculatedStats.attack` etc. GET endpoint returns these as `currentStats.attack` etc.
- **Status:** CORRECT

### Assertion 2: HP Formula with Base HP at Level 1
- **Scenario says:** calculatedHp = baseHp = 4, maxHp = 1 + (4 x 3) + 10 = **23**
- **Independent derivation:** At level 1, 0 points distributed to HP. `calculatedStats.hp = 4`. HP formula (line 135): `maxHp = 1 + (4 * 3) + 10 = 1 + 12 + 10 = 23`.
- **Implementation check:** The generator uses `calculatedStats.hp` (not `baseStats.hp`) in the HP formula. At level 1, these are equal (0 points distributed). maxHp = 23 is stored. GET endpoint returns `maxHp` directly.
- **Status:** CORRECT

### Assertion 3: All Calculated Stats >= Base Stats at Level 20
- **Scenario says:** `$z20.currentStats.attack >= 5`, `defense >= 4`, `specialAttack >= 3`, `specialDefense >= 4`, `speed >= 6`
- **Independent derivation:** `distributeStatPoints()` initializes all `distributedPoints` to 0, then adds points one at a time via `distributedPoints[key]++`. Points are never subtracted. Final stat = `baseStats[key] + distributedPoints[key]` where `distributedPoints[key] >= 0`. Therefore all final stats >= base stats.
- **Implementation check:** The code at lines 357-364 confirms: each final stat = `baseStats[key] + distributedPoints[key]`. Since `distributedPoints` only increments (line 349: `distributedPoints[key]++`), the inequality always holds.
- **Status:** CORRECT

### Assertion 4: Total Distributed Points = 19 at Level 20
- **Scenario says:** Back-derive calculatedHp from maxHp, sum all deltas from base stats, total = 19. Also checks `(maxHp - 20 - 10)` is divisible by 3.
- **Independent derivation:**
  - `remainingPoints = Math.max(0, 20 - 1) = 19`
  - The while loop runs exactly 19 iterations, each decrementing `remainingPoints` by 1 (line 350: `remainingPoints--`)
  - Total distributed = sum of all `distributedPoints[key]` values = 19
  - Each `distributedPoints[key]` contributes to `calculatedStats[key] - baseStats[key]`
  - Sum of `(calculatedStats[key] - baseStats[key])` for all 6 stats = 19
  - For HP: `calculatedStats.hp = (maxHp - level - 10) / 3`. Rearranging `maxHp = level + (calculatedStats.hp * 3) + 10` gives `calculatedStats.hp = (maxHp - 30) / 3`. Since `calculatedStats.hp` is an integer (base 4 + integer distributed points), `maxHp - 30` is divisible by 3.
  - The back-derivation formula in the scenario correctly computes: `hpDistributed = calculatedHp - 4`, `atkDistributed = attack - 5`, etc., summing to 19.
- **Implementation check:** Confirmed. The `distributeStatPoints()` function distributes exactly `level - 1` points via a counted while loop. The back-derivation algebra is mathematically valid.
- **Status:** CORRECT

### Assertion 5: HP Within Valid Range for Level 20
- **Scenario says:** Minimum maxHp = 42 (0 HP points), Maximum maxHp = 99 (all 19 points in HP)
- **Independent derivation:**
  - Minimum: calculatedHp = baseHp = 4 (no HP points). maxHp = 20 + (4 * 3) + 10 = **42**
  - Maximum: calculatedHp = baseHp + 19 = 23 (all 19 points to HP). maxHp = 20 + (23 * 3) + 10 = 20 + 69 + 10 = **99**
  - In practice, the weighted random distribution makes it very unlikely all 19 go to HP, but it is theoretically possible. The range is mathematically correct.
- **Implementation check:** The distribution is weighted by base stats (line 345-354). Zubat's base stats sum to 26; HP is 4/26 of the total. On average, about `19 * 4/26 ~ 2.9` points go to HP. But min=0, max=19 are both possible outcomes.
- **Status:** CORRECT

## Data Validity
- [x] Species checks: Zubat base stats verified from `books/markdown/pokedexes/gen1/zubat.md`: HP=4, ATK=5, DEF=4, SpATK=3, SpDEF=4, SPD=6. Total = 26. All match the scenario's species data table.

## Completeness Check
- [x] Level 1 edge case (0 points) covered
- [x] Level 20 (19 points) covered with non-deterministic-safe assertions
- [x] Back-derivation of calculatedHp from maxHp is algebraically valid
- [x] Uses wild-spawn path which exercises `generateAndCreatePokemon()` -> `distributeStatPoints()`
- [x] Correctly uses `query-then-compute` strategy (read actual values, then assert relationships)

## Errata Check
- No errata corrections affect stat point distribution. The errata document covers capture mechanics, cheerleader, medic, and poke edges but does not modify stat allocation rules.
- Note: PTU says "add +X Stat Points where X is the Pokemon's Level plus 10" but the app uses `level - 1` because base stats already represent species defaults. The scenario correctly documents this deviation.

## Issues Found
- None. All 5 assertions are correct. The scenario properly handles non-deterministic stat distribution by using relational assertions (`>=`, computed totals) instead of exact values.
