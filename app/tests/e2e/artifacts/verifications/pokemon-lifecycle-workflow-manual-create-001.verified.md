---
scenario_id: pokemon-lifecycle-workflow-manual-create-001
verified_at: 2026-02-19T00:00:00Z
status: PASS
assertions_checked: 11
assertions_correct: 11
---

## Assertion Verification

### Assertion 1: Max HP via PTU formula
- **Scenario says:** maxHp = level(8) + (baseHp(4) * 3) + 10 = 8 + 12 + 10 = 30
- **Independent derivation:** PTU formula: `level + (HP * 3) + 10`. With level=8, baseHp=4: `8 + (4 * 3) + 10 = 8 + 12 + 10 = 30`. The manual create endpoint (`index.post.ts` line 14) calculates `maxHp = body.maxHp || (level + (baseHp * 3) + 10)`. Since no `maxHp` is provided in the request body, it uses the formula.
- **Implementation check:** Verified in `app/server/api/pokemon/index.post.ts` line 14: `const maxHp = body.maxHp || (level + (baseHp * 3) + 10)`. `baseHp` comes from `baseStats.hp || body.baseHp || 50` (line 13), which is `4` from the request.
- **Status:** CORRECT

### Assertion 2: Current HP starts at max
- **Scenario says:** currentHp = 30
- **Independent derivation:** `index.post.ts` line 33: `currentHp: body.currentHp || maxHp`. Since no `currentHp` is in the request body, it defaults to `maxHp` = 30.
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 3: Custom nickname preserved
- **Scenario says:** nickname = "Scout"
- **Independent derivation:** `resolveNickname("Pidgey", "Scout")` -- since `"Scout"?.trim()` is truthy, it returns `"Scout"` unchanged.
- **Implementation check:** Verified in `server/utils/pokemon-nickname.ts` line 4: `if (nickname?.trim()) return nickname.trim()`.
- **Status:** CORRECT

### Assertion 4: Current stats equal base stats (no distribution)
- **Scenario says:** currentStats.attack=5, defense=4, specialAttack=4, specialDefense=4, speed=6
- **Independent derivation:** `index.post.ts` lines 35-39 set current stats: `currentAttack: body.currentStats?.attack || baseStats.attack || body.baseAttack || 50`. Since no `currentStats` is provided in the request, it falls through to `baseStats.attack` = 5. Same pattern for all stats.
- **Implementation check:** Verified. The endpoint uses the fallback chain: `body.currentStats?.X || baseStats.X || body.baseX || 50`. With no currentStats in the body, current stats = base stats.
- **Status:** CORRECT

### Assertion 5: Origin is manual
- **Scenario says:** origin = "manual"
- **Independent derivation:** `index.post.ts` line 66: `origin: body.origin || 'manual'`. No `origin` is specified in the request body, so it defaults to `'manual'`.
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 6: Moves and abilities empty
- **Scenario says:** moves = [], abilities = []
- **Independent derivation:** `index.post.ts` lines 46-47: `abilities: JSON.stringify(body.abilities || [])`, `moves: JSON.stringify(body.moves || [])`. No moves or abilities are provided in the request body, so both default to empty arrays. The response parses them back: `abilities: JSON.parse(pokemon.abilities)` = `[]`, `moves: JSON.parse(pokemon.moves)` = `[]`.
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 7: Types preserved
- **Scenario says:** types = ["Normal", "Flying"]
- **Independent derivation:** `index.post.ts` line 7: `const types = body.types || [body.type1 || 'Normal']`. Request provides `types: ["Normal", "Flying"]`, so `types = ["Normal", "Flying"]`. Stored as `type1: types[0]` = "Normal", `type2: types[1] || null` = "Flying". Response: `types: pokemon.type2 ? [pokemon.type1, pokemon.type2] : [pokemon.type1]` = `["Normal", "Flying"]`.
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 8: Library visible
- **Scenario says:** isInLibrary = true
- **Independent derivation:** `index.post.ts` line 65: `isInLibrary: body.isInLibrary !== false`. Since `body.isInLibrary` is not provided (undefined), `undefined !== false` is `true`.
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 9: Auto-generated nickname for Phase 2
- **Scenario says:** nickname matches `/^Pidgey \d+$/`
- **Independent derivation:** Phase 2 creates a Pidgey without a nickname. `resolveNickname("Pidgey", undefined)` counts existing Pidgey records (at least 1 from Phase 1, "Scout") and returns `"Pidgey ${count + 1}"`. The count includes ALL Pidgey records in the DB (matching by species), so the number depends on pre-existing data. The pattern `/^Pidgey \d+$/` correctly accounts for this.
- **Implementation check:** Verified in `server/utils/pokemon-nickname.ts`. `count` queries `prisma.pokemon.count({ where: { species: "Pidgey" } })`. With at least 1 existing Pidgey from Phase 1, the result will be at least "Pidgey 2".
- **Status:** CORRECT

### Assertion 10: HP formula for level 5
- **Scenario says:** maxHp = level(5) + (baseHp(4) * 3) + 10 = 5 + 12 + 10 = 27
- **Independent derivation:** `5 + (4 * 3) + 10 = 5 + 12 + 10 = 27`. Same formula path as Assertion 1.
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 11: Data persisted correctly (Phase 3)
- **Scenario says:** species = "Pidgey", nickname = "Scout", level = 8, maxHp = 30
- **Independent derivation:** GET endpoint reads from DB and returns the values stored in Phase 1. The Prisma `create` call stores these values, and the `findUnique` in GET retrieves them unchanged.
- **Implementation check:** Verified in `app/server/api/pokemon/[id].get.ts`. Returns the same parsed format as the POST response.
- **Status:** CORRECT

## Data Validity

- [x] Pidgey base stats match `gen1/pidgey.md`: HP=4, ATK=5, DEF=4, SpATK=4, SpDEF=4, SPD=6
- [x] Pidgey types match: Normal / Flying
- [x] HP formula verified for two different levels (8 and 5)
- [x] Pidgey basic abilities in the pokedex are Keen Eye and Tangled Feet (not relevant to manual create since abilities are empty)
- [x] The scenario correctly notes that manual create does NOT use SpeciesData lookup -- values are taken from the request body as-is

## Completeness Check

- [x] Tests both custom nickname and auto-generated nickname paths
- [x] Tests that current stats = base stats (no stat point distribution on manual create)
- [x] Tests persistence via a separate GET call
- [x] Tests two different levels for HP formula verification
- [x] Covers the empty moves/abilities behavior of manual create
- [x] Tests origin default to "manual"
- [x] Tests isInLibrary default to true

## Errata Check

- No errata changes affect the HP formula or manual Pokemon creation.
- The errata revises capture mechanics and some class features, none relevant here.

## Issues Found

None. All 11 assertions are correct and match both the PTU rules and the app implementation.
