---
scenario_id: pokemon-lifecycle-workflow-sheet-edit-001
verified_at: 2026-02-19T00:00:00Z
status: PASS
assertions_checked: 10
assertions_correct: 10
---

## Assertion Verification

### Assertion 1: Header info display
- **Scenario says:** species = "Eevee", nickname = "Fluffy", level = 10, gender = "Female"
- **Independent derivation:** The setup creates an Eevee via `POST /api/pokemon` with these exact values. The GET endpoint reads the stored record and returns these fields directly.
- **Implementation check:** Verified in `app/server/api/pokemon/[id].get.ts`. Response includes `species: pokemon.species`, `nickname: pokemon.nickname`, `level: pokemon.level`, `gender: pokemon.gender`.
- **Status:** CORRECT

### Assertion 2: HP display
- **Scenario says:** maxHp = 38, currentHp = 38
- **Independent derivation:** PTU formula: `level + (baseHp * 3) + 10` = `10 + (6 * 3) + 10` = `10 + 18 + 10` = **38**. The `POST /api/pokemon` endpoint (line 14) calculates `maxHp = body.maxHp || (level + (baseHp * 3) + 10)`. No `maxHp` in the body, so it uses the formula = 38. `currentHp: body.currentHp || maxHp` = 38 (no currentHp provided).
- **Implementation check:** Verified.
- **Species verification:** From `gen1/eevee.md`: Base HP = 6. Confirmed.
- **Status:** CORRECT

### Assertion 3: Base stats displayed
- **Scenario says:** hp=6, attack=6, defense=5, specialAttack=5, specialDefense=7, speed=6
- **Independent derivation:** These are the exact values provided in the setup request body. The POST endpoint stores them and GET returns them.
- **Species verification:** From `gen1/eevee.md`: HP=6, ATK=6, DEF=5, SpATK=5, SpDEF=7, SPD=6. All match.
- **Implementation check:** Verified. POST stores as `baseHp`, `baseAttack`, etc. GET returns as `baseStats: { hp: pokemon.baseHp, ... }`.
- **Status:** CORRECT

### Assertion 4: Moves tab with metadata
- **Scenario says:** 3 moves -- Tackle (Normal, Physical, At-Will, AC 2, DB 5), Sand Attack (Ground, Status, At-Will, AC 2), Quick Attack (Normal, Physical, At-Will, AC 2, DB 4)
- **Independent derivation:** The setup provides 3 explicit move objects in the request body. These are stored as JSON and returned unchanged.
- **Species verification:** From `gen1/eevee.md` learnset: L1 Tackle (Normal), L5 Sand Attack (Ground), L9 Baby-Doll Eyes (Fairy), L13 Quick Attack (Normal). At level 10, the available moves would be Helping Hand, Growl, Tackle, Tail Whip, Sand Attack, Baby-Doll Eyes. However, the scenario uses manual create with explicit moves, not the generator's auto-selection. The chosen moves (Tackle, Sand Attack, Quick Attack) are all valid Eevee moves from the learnset, though Quick Attack is actually learned at L13 (above L10). This is acceptable because manual create allows any moves to be specified -- it does not enforce learnset restrictions.
- **Implementation check:** Verified. POST stores `moves: JSON.stringify(body.moves)`. GET returns `moves: JSON.parse(pokemon.moves)`.
- **Status:** CORRECT
- **Note:** Quick Attack is listed in the Eevee learnset at L13, not L10, but manual create does not validate against the learnset. The test is about data display/persistence, not learnset enforcement.

### Assertion 5: Abilities tab
- **Scenario says:** abilities.length = 1, abilities[0].name = "Run Away"
- **Independent derivation:** Setup provides `abilities: [{ name: "Run Away", effect: "" }]`. Stored and returned as-is.
- **Species verification:** From `gen1/eevee.md`: Basic Ability 1 = Run Away, Basic Ability 2 = Sprint. Run Away is a valid basic ability.
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 6: Notes tab
- **Scenario says:** notes = "Test Eevee for sheet edit"
- **Independent derivation:** Setup provides `notes: "Test Eevee for sheet edit"`. Stored as `notes: body.notes` (line 68 of index.post.ts). GET returns `notes: pokemon.notes`.
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 7: Changed fields updated (Phase 2 PUT response)
- **Scenario says:** nickname = "Sparkle", level = 12
- **Independent derivation:** PUT with `{ nickname: "Sparkle", level: 12, notes: "Renamed and leveled up" }`. The endpoint:
  - `body.nickname !== undefined` -> true, so it resolves via `resolveNickname(existing.species, "Sparkle")`. Since `"Sparkle"?.trim()` is truthy, it returns `"Sparkle"`.
  - `body.level !== undefined` -> true, so `updateData.level = 12`.
  - Prisma update applies these changes.
- **Implementation check:** Verified in `app/server/api/pokemon/[id].put.ts` lines 17-23. The nickname goes through `resolveNickname` which preserves custom nicknames. Level is set directly.
- **Status:** CORRECT

### Assertion 8: maxHp NOT recalculated on level change
- **Scenario says:** maxHp = 38 (unchanged from original, NOT recalculated to 40)
- **Independent derivation:** The PUT endpoint does NOT recalculate maxHp when level changes. Looking at the endpoint code, `maxHp` is only updated if `body.maxHp !== undefined` (line 26). Since the PUT request does not include `maxHp`, it remains unchanged at 38. If the formula were re-applied with level 12: `12 + (6 * 3) + 10 = 40`, but this does NOT happen.
- **Implementation check:** Verified in `app/server/api/pokemon/[id].put.ts` line 26: `if (body.maxHp !== undefined) updateData.maxHp = body.maxHp`. Since `body.maxHp` is `undefined`, no update occurs. The original value of 38 persists.
- **Status:** CORRECT

### Assertion 9: Edited fields persisted (Phase 3 GET)
- **Scenario says:** nickname = "Sparkle", level = 12, notes = "Renamed and leveled up"
- **Independent derivation:** Phase 2 updated these three fields in the DB. GET reads them back from the updated record.
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 10: Unchanged fields preserved (Phase 3 GET)
- **Scenario says:** maxHp = 38, currentHp = 38, species = "Eevee", gender = "Female", types = ["Normal"], moves.length = 3, abilities.length = 1, abilities[0].name = "Run Away", baseStats.hp = 6, baseStats.attack = 6
- **Independent derivation:** The PUT endpoint only updates fields explicitly provided in the request body. The request only contained `nickname`, `level`, and `notes`. All other fields (`maxHp`, `currentHp`, `species`, `gender`, `types`, `moves`, `abilities`, `baseStats`) were NOT in the request body, so their `body.X !== undefined` checks fail and they are not included in `updateData`. The original values persist.
- **Implementation check:** Verified. Each field in the PUT endpoint is gated by an `if (body.X !== undefined)` check. Only `nickname`, `level`, and `notes` were provided.
- **Status:** CORRECT

## Data Validity

- [x] Eevee base stats match `gen1/eevee.md`: HP=6, ATK=6, DEF=5, SpATK=5, SpDEF=7, SPD=6
- [x] Eevee type matches: Normal (single type)
- [x] Eevee basic abilities match: Run Away, Sprint
- [x] HP formula: 10 + (6 * 3) + 10 = 38 (verified)
- [x] Quick Attack in Eevee learnset at L13 (not L10, but manual create does not enforce learnset)
- [x] Tackle in Eevee learnset at L1, Sand Attack at L5 (both valid at L10)

## Completeness Check

- [x] Tests data display across all major categories: header, HP, base stats, moves, abilities, notes
- [x] Tests partial update behavior (only changed fields updated)
- [x] Tests that maxHp is NOT recalculated when level changes -- this is an important behavioral test
- [x] Tests persistence of both changed and unchanged fields via separate GET call
- [x] Move metadata (type, damageClass, frequency, AC, damageBase) is tested
- [x] Covers the "no auto-recalculation on level change" gap documented in the lifecycle loop

## Errata Check

- No errata changes affect Pokemon sheet display, partial updates, or the HP formula.
- The errata revises capture mechanics and some class features, none relevant here.

## Issues Found

None. All 10 assertions are correct and match both the PTU rules and the app implementation. The key behavioral assertion (maxHp not recalculated on level change) is correctly documented and verified against the actual endpoint code.
