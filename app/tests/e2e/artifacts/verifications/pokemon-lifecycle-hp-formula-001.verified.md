---
scenario_id: pokemon-lifecycle-hp-formula-001
verified_at: 2026-02-19T00:00:00Z
status: PASS
assertions_checked: 6
assertions_correct: 6
---

## Assertion Verification

### Assertion 1: Test 1 -- Minimum HP (Level 1, Base HP 1)
- **Scenario says:** maxHp = 1 + (1 x 3) + 10 = **14**, currentHp = 14
- **Independent derivation:** PTU formula: `level + (baseHp * 3) + 10` = 1 + 3 + 10 = **14**. Confirmed from core/05-pokemon.md page 198: "Pokemon Hit Points = Pokemon Level + (HP x3) + 10"
- **Implementation check:** `POST /api/pokemon` (index.post.ts line 14): `const maxHp = body.maxHp || (level + (baseHp * 3) + 10)`. No `maxHp` in body, so formula fires: `1 + (1 * 3) + 10 = 14`. `currentHp` defaults to `maxHp` (line 33: `body.currentHp || maxHp`). Response returns `maxHp` and `currentHp` directly from the created record.
- **Status:** CORRECT

### Assertion 2: Test 2 -- Caterpie HP (Level 5, Base HP 5)
- **Scenario says:** maxHp = 5 + (5 x 3) + 10 = **30**, currentHp = 30
- **Independent derivation:** `5 + 15 + 10 = 30`. Verified Caterpie base HP = 5 from `books/markdown/pokedexes/gen1/caterpie.md`.
- **Implementation check:** Same formula path as Test 1. `5 + (5 * 3) + 10 = 30`. No `maxHp` override, no `currentHp` override.
- **Status:** CORRECT

### Assertion 3: Test 3 -- High HP (Level 50, Base HP 10)
- **Scenario says:** maxHp = 50 + (10 x 3) + 10 = **90**, currentHp = 90
- **Independent derivation:** `50 + 30 + 10 = 90`
- **Implementation check:** `50 + (10 * 3) + 10 = 90`. Same endpoint path.
- **Status:** CORRECT

### Assertion 4: Test 4 -- Very High HP (Level 100, Base HP 25)
- **Scenario says:** maxHp = 100 + (25 x 3) + 10 = **185**, currentHp = 185
- **Independent derivation:** `100 + 75 + 10 = 185`
- **Implementation check:** `100 + (25 * 3) + 10 = 185`. Same endpoint path.
- **Status:** CORRECT

### Assertion 5: Test 5 -- Explicit maxHp Override
- **Scenario says:** Formula would give 35, but explicit maxHp = 999 should win. Assert maxHp = 999, currentHp = 999.
- **Independent derivation:** Formula: `10 + (5 * 3) + 10 = 35`. But the endpoint code is `const maxHp = body.maxHp || (level + (baseHp * 3) + 10)`. Since `body.maxHp = 999` (truthy), the formula is skipped and maxHp = 999. `currentHp = body.currentHp || maxHp = 999`.
- **Implementation check:** Confirmed in index.post.ts line 14. The `||` operator short-circuits when `body.maxHp` is truthy (999). Both maxHp and currentHp stored as 999.
- **Status:** CORRECT

### Assertion 6: All Start at Full HP
- **Scenario says:** For every created Pokemon: currentHp = maxHp
- **Independent derivation:** In the POST endpoint, `currentHp: body.currentHp || maxHp` (line 33). None of the test payloads include `currentHp`, so all default to `maxHp`.
- **Implementation check:** Confirmed. No test provides `currentHp` or `body.currentHp`, so all 5 Pokemon get `currentHp = maxHp`.
- **Status:** CORRECT

## Data Validity
- [x] Species checks: Tests 1-5 use custom species names (TestMinHP, Caterpie, TestHighHP, TestVeryHighHP, TestOverride) with explicit base stats. The scenario correctly provides baseStats in the POST body, bypassing any species lookup. Caterpie base HP = 5 matches pokedex (gen1/caterpie.md).

## Completeness Check
- [x] HP formula tested at extremes: minimum (L1/HP1), moderate (L5/HP5), high (L50/HP10), very high (L100/HP25)
- [x] Explicit override path tested
- [x] currentHp = maxHp invariant tested for all 5
- [x] Covers the `POST /api/pokemon` path correctly. Note: the generator service (used by wild-spawn) has its own HP formula at line 135 of pokemon-generator.service.ts: `const maxHp = input.level + (calculatedStats.hp * 3) + 10`. That path uses `calculatedStats.hp` (base + distributed points), which is different from this scenario's `baseStats.hp` only path. Both are valid PTU formula implementations; this scenario correctly isolates the POST endpoint path by providing explicit baseStats.

## Errata Check
- No errata corrections affect the HP formula. The errata-2 document (September 2015 playtest) covers capture mechanics, cheerleader, medic, and poke edges but does not modify the Pokemon HP formula.

## Issues Found
- None. All 6 assertions are correct.
