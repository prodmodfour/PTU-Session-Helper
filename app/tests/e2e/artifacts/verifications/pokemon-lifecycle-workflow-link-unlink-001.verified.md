---
scenario_id: pokemon-lifecycle-workflow-link-unlink-001
verified_at: 2026-02-19T00:00:00Z
status: PASS
assertions_checked: 9
assertions_correct: 9
---

## Assertion Verification

### Assertion 1: Initially unowned
- **Scenario says:** `response.data.ownerId = null`
- **Independent derivation:** The `POST /api/pokemon` endpoint (`index.post.ts` line 60) stores `ownerId: body.ownerId`. The setup request does not include `ownerId`, so it defaults to `undefined` which Prisma stores as `null`. The GET endpoint (`[id].get.ts` line 63) returns `ownerId: pokemon.ownerId`, which will be `null`.
- **Implementation check:** Verified in `app/server/api/pokemon/[id].get.ts` line 63 and `app/server/api/pokemon/index.post.ts` line 60.
- **Status:** CORRECT

### Assertion 2: Link response shows ownership
- **Scenario says:** `response.data.ownerId = $trainer_id`
- **Independent derivation:** The link endpoint (`[id]/link.post.ts` lines 36-38) calls `prisma.pokemon.update({ where: { id }, data: { ownerId: trainerId } })` and returns the updated record in `{ data: parsedPokemon }`. `parsedPokemon` is spread from the Prisma record, which includes the updated `ownerId`.
- **Implementation check:** Verified in `app/server/api/pokemon/[id]/link.post.ts` lines 36-68. The response contains `data.ownerId = trainerId`.
- **Status:** CORRECT

### Assertion 3: Verify via GET after link
- **Scenario says:** `response.data.ownerId = $trainer_id`
- **Independent derivation:** After the link operation persists `ownerId = trainerId` to DB, a subsequent GET returns `ownerId` from the DB record (line 63 of `[id].get.ts`).
- **Implementation check:** The GET endpoint reads directly from Prisma and includes `ownerId` in the response.
- **Status:** CORRECT

### Assertion 4: All other fields unchanged after link
- **Scenario says:** `response.data.species = "Rattata"`, `response.data.nickname = "Nibbles"`, `response.data.level = 7`
- **Independent derivation:** The link endpoint only modifies `ownerId` (line 38: `data: { ownerId: trainerId }`). No other fields are touched. Species, nickname, and level remain as created.
- **Implementation check:** The `link.post.ts` only updates `ownerId` in the Prisma update call. All other columns remain unchanged.
- **Status:** CORRECT
- **Note on nickname:** The setup sends `nickname: "Nibbles"`. The `POST /api/pokemon` endpoint (line 19) passes it through `resolveNickname(body.species, body.nickname)`. Since "Nibbles" is a non-empty string, `resolveNickname` returns "Nibbles" as-is (after trim). So `nickname = "Nibbles"` is correct.

### Assertion 5: Unlink response shows no owner
- **Scenario says:** `response.data.ownerId = null`
- **Independent derivation:** The unlink endpoint (`[id]/unlink.post.ts` lines 14-17) calls `prisma.pokemon.update({ where: { id }, data: { ownerId: null } })`. The returned record has `ownerId = null`.
- **Implementation check:** Verified in `app/server/api/pokemon/[id]/unlink.post.ts` line 16.
- **Status:** CORRECT

### Assertion 6: Verify via GET after unlink
- **Scenario says:** `response.data.ownerId = null`
- **Independent derivation:** After unlink persists `ownerId = null`, subsequent GET returns `null` for `ownerId`.
- **Implementation check:** Same GET path as assertion 3, reading from DB.
- **Status:** CORRECT

### Assertion 7: All other fields unchanged after unlink
- **Scenario says:** `response.data.species = "Rattata"`, `response.data.nickname = "Nibbles"`, `response.data.level = 7`
- **Independent derivation:** Unlink only modifies `ownerId` (line 16: `data: { ownerId: null }`). All other fields are unchanged.
- **Implementation check:** Only `ownerId` is in the Prisma update data.
- **Status:** CORRECT

### Assertion 8: 404 for non-existent trainer
- **Scenario says:** `response.statusCode = 404`
- **Independent derivation:** The link endpoint (lines 24-33) does a `prisma.humanCharacter.findUnique({ where: { id: trainerId } })`. If `trainer` is null, it throws `createError({ statusCode: 404, message: 'Trainer not found' })`.
- **Implementation check:** Verified in `app/server/api/pokemon/[id]/link.post.ts` lines 24-33. The trainerId `"non-existent-trainer-id-12345"` will not match any record, so `trainer` will be null and 404 is thrown.
- **Status:** CORRECT

### Assertion 9: Pokemon ownership unchanged after failed link
- **Scenario says:** `response.data.ownerId = null` (still unowned)
- **Independent derivation:** The 404 error is thrown before the `prisma.pokemon.update()` call (line 36) is reached. The Pokemon's `ownerId` remains `null` from the previous unlink operation.
- **Implementation check:** The control flow goes: validate trainerId -> findUnique trainer -> throw 404 if not found. The `pokemon.update` on line 36 is never executed.
- **Status:** CORRECT

## Data Validity

- [x] Rattata base stats match PTU 1.05 pokedex: HP 3, Atk 6, Def 4, SpAtk 3, SpDef 4, Spd 7
- [x] Rattata type is Normal (from `gen1/rattata.md`)
- [x] Setup creates Pokemon via `POST /api/pokemon` (manual create path, not generator service) so no random stat distribution occurs
- [x] The scenario correctly sets `non_deterministic: false` since manual creation with explicit base stats is deterministic

## Completeness Check

- [x] All 4 phases tested: initial state, link, unlink, error handling
- [x] Both happy paths (link succeeds, unlink succeeds) covered
- [x] Error path (non-existent trainer 404) covered
- [x] State persistence verified via GET after each operation
- [x] Field immutability checked after link and unlink operations
- [x] Teardown cleans up created entities

## Errata Check

No errata items in `books/markdown/errata-2.md` affect the link/unlink mechanics. The errata covers Cheerleader, Medic, Capture mechanics, Poke Edges, and Tutor moves. None relate to trainer-Pokemon relationship management.

## Issues Found

**No issues found.** All 9 assertions are correct and match both PTU rules (where applicable) and the app implementation.

### Implementation Note (non-blocking)

The `link.post.ts` response wraps the result in `{ data: parsedPokemon }` without a `success: true` field, while the GET endpoint returns `{ success: true, data: parsed }`. The scenario assertions only check `response.data.*` fields so this inconsistency does not affect the test, but the Playtester should be aware of the different response envelope shapes between the two endpoints.
