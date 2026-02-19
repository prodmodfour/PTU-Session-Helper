---
scenario_id: pokemon-lifecycle-move-selection-001
verified_at: 2026-02-19T00:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

### Assertion 1: Caterpie L5 -- 2 Moves Selected (All Available)
- **Scenario says:** $cat.moves.length = 2. Move names include "String Shot" and "Tackle". Bug Bite NOT included.
- **Independent derivation:** Caterpie learnset from `books/markdown/pokedexes/gen1/caterpie.md`:
  - Level 1: String Shot
  - Level 1: Tackle
  - Level 15: Bug Bite
  At level 5, filter to `entry.level <= 5`: String Shot (1), Tackle (1). Bug Bite (15) is excluded. That gives 2 entries. `.slice(-6)` on 2 entries = both. Result: ["String Shot", "Tackle"].
- **Implementation check:** `selectMovesFromLearnset()` (pokemon-generator.service.ts lines 371-409):
  - `learnset.filter(entry => entry.level <= level)` -- filters to L1 entries only
  - `.slice(-6)` -- takes last 6 of 2 = both
  - Each move looked up in MoveData for full definition
  - Returns array of 2 MoveDetail objects
  The seed sorts the learnset by level (seed.ts line 410), so order is: String Shot, Tackle, Bug Bite. After filter: String Shot, Tackle. After slice: both.
- **Status:** CORRECT

### Assertion 2: Bug Bite NOT Included
- **Scenario says:** Move names do NOT include "Bug Bite"
- **Independent derivation:** Bug Bite is at level 15. Filter `entry.level <= 5` excludes it.
- **Implementation check:** Confirmed by filter logic.
- **Status:** CORRECT (sub-assertion of Assertion 1, counted together)

### Assertion 3: Eevee L9 -- 6 Moves Selected (All Available)
- **Scenario says:** $ev9.moves.length = 6. Includes: Helping Hand, Growl, Tackle, Tail Whip, Sand Attack, Baby-Doll Eyes.
- **Independent derivation:** Eevee learnset from `books/markdown/pokedexes/gen1/eevee.md`:
  - Level 1: Helping Hand, Growl, Tackle, Tail Whip
  - Level 5: Sand Attack
  - Level 9: Baby-Doll Eyes
  - Level 13+: Quick Attack, Bite, Covet, Take Down, Charm, Baton Pass, Double-Edge, Last Resort, Trump Card
  At level 9, filter to `entry.level <= 9`: 6 entries (4 at L1, 1 at L5, 1 at L9). `.slice(-6)` on 6 = all 6.
- **Implementation check:** Learnset sorted by level in seed. After filter: [Helping Hand(1), Growl(1), Tackle(1), Tail Whip(1), Sand Attack(5), Baby-Doll Eyes(9)]. Slice(-6) = all 6. Each looked up in MoveData.
- **Status:** CORRECT

### Assertion 4: Eevee L25 -- 6 Most Recent Moves Selected
- **Scenario says:** $ev25.moves.length = 6. Includes: Sand Attack (L5), Baby-Doll Eyes (L9), Quick Attack (L13), Bite (L17), Covet (L21), Take Down (L25).
- **Independent derivation:** At level 25, Eevee has 10 entries at or below L25:
  - Index 0-3: Helping Hand(1), Growl(1), Tackle(1), Tail Whip(1)
  - Index 4: Sand Attack(5)
  - Index 5: Baby-Doll Eyes(9)
  - Index 6: Quick Attack(13)
  - Index 7: Bite(17)
  - Index 8: Covet(21)
  - Index 9: Take Down(25)
  `.slice(-6)` takes indices 4-9: Sand Attack, Baby-Doll Eyes, Quick Attack, Bite, Covet, Take Down. Exactly 6.
- **Implementation check:** Confirmed. The `.slice(-6)` operation on the level-sorted, filtered array produces exactly these 6 moves.
- **Status:** CORRECT

### Assertion 5: Older Moves Dropped at L25
- **Scenario says:** Move names do NOT include Helping Hand, Growl, Tackle, Tail Whip.
- **Independent derivation:** These are at indices 0-3. `.slice(-6)` on a 10-element array starts at index 4, excluding indices 0-3.
- **Implementation check:** Confirmed by the slice logic.
- **Status:** CORRECT

## Data Validity
- [x] Caterpie learnset verified from gen1/caterpie.md: L1 String Shot, L1 Tackle, L15 Bug Bite. Matches scenario exactly.
- [x] Eevee learnset verified from gen1/eevee.md: L1 Helping Hand, L1 Growl, L1 Tackle, L1 Tail Whip, L5 Sand Attack, L9 Baby-Doll Eyes, L13 Quick Attack, L17 Bite, L21 Covet, L25 Take Down. Matches scenario exactly.
- [x] Caterpie type verified: Bug (single type). Matches scenario.
- [x] Caterpie has only 1 basic ability (Shield Dust), no Basic Ability 2 listed.

## Completeness Check
- [x] Fewer than 6 moves available: tested (Caterpie L5 = 2 moves)
- [x] Exactly 6 moves available: tested (Eevee L9 = 6 moves)
- [x] More than 6 moves available: tested (Eevee L25 = 10 available, 6 selected)
- [x] Confirms oldest moves are dropped (LIFO from the learnset)
- [x] Confirms above-level moves are excluded
- [x] Uses wild-spawn path which exercises `generateAndCreatePokemon()` -> `selectMovesFromLearnset()`
- [x] Scenario correctly labels move selection as deterministic (unlike stat distribution)

## Errata Check
- No errata corrections affect the level-up move selection logic. The errata document introduces tutor move restrictions by level (page 9) but does not change how level-up moves are selected.

## Issues Found
- None. All 5 assertions are correct. Move selection is deterministic for a given species and level, and the scenario correctly predicts the exact moves.
