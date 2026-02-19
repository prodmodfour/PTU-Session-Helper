---
scenario_id: pokemon-lifecycle-workflow-capture-001
verified_at: 2026-02-19T00:00:00Z
status: PASS
assertions_checked: 9
assertions_correct: 9
---

## Assertion Verification

### Assertion 1: Pre-capture ownership
- **Scenario says:** ownerId = null, origin = "wild"
- **Independent derivation:** The setup creates a Caterpie via `POST /api/pokemon` with `origin: "wild"` and no `ownerId` in the body. The endpoint stores `ownerId: body.ownerId` (line 60 of index.post.ts), which is `undefined`. Prisma stores this as `null`. GET returns `ownerId: pokemon.ownerId` = `null`.
- **Implementation check:** Verified in `app/server/api/pokemon/index.post.ts` line 60 and `[id].get.ts` line 63.
- **Status:** CORRECT

### Assertion 2: Capture rate calculation
- **Scenario says:** captureRate = 130, canBeCaptured = true
- **Independent derivation:**
  - Base: 100
  - Level modifier: -(5 * 2) = -10
  - HP modifier: currentHp = 1 (exactly 1 HP) -> +30
  - Evolution: Caterpie is stage 1, maxEvolutionStage = 3 (Caterpie->Metapod->Butterfree). evolutionsRemaining = 3 - 1 = 2 -> +10
  - No status conditions: 0
  - Not shiny: 0
  - Not legendary: 0
  - No injuries: 0
  - Capture rate = 100 + (-10) + 30 + 10 + 0 + 0 + 0 + 0 = **130**
  - canBeCaptured = currentHp > 0 = 1 > 0 = true
- **Implementation check:** Verified in `app/utils/captureRate.ts`:
  - Line 76: `levelModifier = -(level * 2)` = -10
  - Lines 80-81: `if (currentHp === 1) hpModifier = 30` -> +30
  - Lines 94-97: `evolutionsRemaining = maxEvolutionStage - evolutionStage = 3 - 1 = 2`, `if (evolutionsRemaining >= 2) evolutionModifier = 10` -> +10
  - Line 133: `captureRate = 100 + (-10) + 30 + 10 + 0 + 0 + 0 + 0 + 0 + 0 = 130`
  - The rate endpoint (`rate.post.ts`) correctly uses `speciesData.evolutionStage` and `speciesData.maxEvolutionStage`.
- **Species verification:** From `gen1/caterpie.md`: Evolution: 1-Caterpie, 2-Metapod (min 5), 3-Butterfree (min 10). So evolutionStage=1, maxEvolutionStage=3. Confirmed.
- **Status:** CORRECT

### Assertion 3: Capture succeeded
- **Scenario says:** captured = true, captureRate = 130, trainerLevel = 1
- **Independent derivation:** The attempt endpoint recalculates capture rate internally. With captureRate = 130, d100 roll range is 1-100, modified roll = roll - trainerLevel(1) - modifiers(0) = roll - 1. Maximum modified roll = 99 (when roll=100, but natural 100 always captures anyway). Since 99 <= 130 is always true, capture succeeds regardless of roll.
- **Implementation check:** Verified in `app/server/api/capture/attempt.post.ts`:
  - Line 53: `const maxEvolutionStage = Math.max(3, evolutionStage)` -- for Caterpie, `Math.max(3, 1) = 3`, which gives the same result as the correct value of 3. (Note: this line has a latent bug where it hardcodes minimum to 3 instead of using `speciesData.maxEvolutionStage`, but it does not affect this scenario.)
  - Lines 56-66: Recalculates capture rate = 130 (same inputs).
  - Lines 85-89: `attemptCapture(130, 1, 0, false)` -- d100 roll minus 1, always <= 130.
  - Line 106: Response includes `captured: captureResult.success` = true.
  - Line 109: `captureRate: rateResult.captureRate` = 130.
  - Line 115: `trainerLevel: trainer.level` = 1.
- **Status:** CORRECT

### Assertion 4: Ownership transferred in response
- **Scenario says:** pokemon.ownerId = $trainer_id, pokemon.origin = "captured"
- **Independent derivation:** On capture success, the attempt endpoint updates the DB: `{ ownerId: body.trainerId, origin: 'captured' }` (lines 94-99). The response includes `pokemon: { ownerId: captureResult.success ? body.trainerId : pokemon.ownerId }` and `pokemon: { origin: captureResult.success ? 'captured' : pokemon.origin }` (lines 124-125).
- **Implementation check:** Verified in `app/server/api/capture/attempt.post.ts` lines 93-101 (DB update) and lines 117-126 (response construction).
- **Status:** CORRECT

### Assertion 5: Ownership persisted (Phase 4 GET)
- **Scenario says:** ownerId = $trainer_id
- **Independent derivation:** The DB was updated in Phase 3. GET retrieves the updated record. `ownerId` is returned directly as `pokemon.ownerId`.
- **Implementation check:** Verified. The Prisma update in Phase 3 persists the change, and GET reads it back.
- **Status:** CORRECT

### Assertion 6: Origin changed (Phase 4 GET)
- **Scenario says:** origin = "captured"
- **Independent derivation:** Same as above -- the DB was updated to `origin: 'captured'` in Phase 3.
- **Implementation check:** Verified.
- **Status:** CORRECT

### Assertion 7: Stats preserved (no modification on capture)
- **Scenario says:** level = 5, currentHp = 1, maxHp = 30, baseStats.hp = 5, baseStats.attack = 3
- **Independent derivation:** The capture attempt endpoint ONLY updates `ownerId` and `origin` (lines 96-98). No other fields are modified. The Pokemon was created with these exact values in setup, so they remain unchanged.
- **Implementation check:** Verified. The Prisma update in `attempt.post.ts` only touches `ownerId` and `origin`. All other fields retain their setup values.
- **HP verification:** maxHp = 5 + (5 * 3) + 10 = 5 + 15 + 10 = 30. But the setup explicitly sets `maxHp: 30` in the POST body. The endpoint uses `body.maxHp || (level + (baseHp * 3) + 10)` -- since `body.maxHp = 30` is provided, it uses 30 directly. The formula would give the same result anyway.
- **currentHp verification:** Setup sets `currentHp: 1`. The endpoint uses `body.currentHp || maxHp` -- since `1` is truthy, it uses `1`.
- **Status:** CORRECT

### Assertion 8: Moves preserved
- **Scenario says:** moves.length = 2, includes "String Shot" and "Tackle"
- **Independent derivation:** Setup creates the Pokemon with 2 explicit moves. Capture does not modify moves. GET returns `moves: JSON.parse(pokemon.moves)` which contains the original 2 moves.
- **Species verification:** From `gen1/caterpie.md` learnset: L1 String Shot, L1 Tackle, L15 Bug Bite. At level 5, String Shot and Tackle are correct. The scenario uses deterministic setup (explicit moves in POST body) rather than relying on the generator, which is the correct approach per Lesson 4.
- **Status:** CORRECT

### Assertion 9: Abilities preserved
- **Scenario says:** abilities.length = 1, abilities[0].name = "Shield Dust"
- **Independent derivation:** Setup creates the Pokemon with `abilities: [{ name: "Shield Dust", effect: "" }]`. Capture does not modify abilities. GET returns the same.
- **Species verification:** From `gen1/caterpie.md`: Basic Ability 1 = Shield Dust. Only one basic ability listed (no Basic Ability 2). This is correct.
- **Status:** CORRECT

## Data Validity

- [x] Caterpie base stats match `gen1/caterpie.md`: HP=5, ATK=3, DEF=4, SpATK=2, SpDEF=2, SPD=5
- [x] Caterpie type matches: Bug (single type, no type2)
- [x] Caterpie evolution line: 1-Caterpie, 2-Metapod (min 5), 3-Butterfree (min 10) -- 3 stages, stage 1
- [x] Caterpie basic ability: Shield Dust (only 1 basic ability)
- [x] Caterpie learnset at L5: L1 String Shot, L1 Tackle (Bug Bite is L15, too high)
- [x] HP formula for Caterpie at L5: 5 + 15 + 10 = 30
- [x] Capture rate calculation independently verified: 100 - 10 + 30 + 10 = 130

## Completeness Check

- [x] Tests pre-capture state (null owner, wild origin)
- [x] Tests capture rate calculation with full breakdown
- [x] Tests capture execution (guaranteed success due to high rate)
- [x] Tests ownership transfer in capture response
- [x] Tests post-capture persistence (separate GET call)
- [x] Tests stat/move/ability preservation through capture
- [x] Uses deterministic setup (explicit stats, moves, abilities in POST body) to avoid non-determinism from the generator

## Errata Check

- The errata (Sept 2015 Playtest Packet) revises the capture mechanic significantly:
  - Changes to d20 roll (higher is better) instead of d100
  - New capture rate formula based on a base of 10 with +1 per 10 levels
  - Different HP and evolution modifiers
- The app uses the **1.05 base ruleset** capture system (d100, base 100), NOT the errata revision. The scenario correctly tests against the 1.05 rules.
- **No errata impact on this scenario:** The scenario tests the app's implementation, which follows 1.05 rules correctly.

## Issues Found

**Latent Bug (does not affect this scenario):** In `app/server/api/capture/attempt.post.ts` line 53, `const maxEvolutionStage = Math.max(3, evolutionStage)` hardcodes `maxEvolutionStage` to be at least 3 regardless of the species' actual evolution line. This means:
- A Pokemon with only 1 evolution stage (e.g., Tauros) would get `maxEvolutionStage = 3` instead of `1`, giving `evolutionsRemaining = 2` and a +10 bonus instead of the correct -10 penalty (no evolutions remaining).
- This does NOT affect the rate endpoint (`rate.post.ts`), which correctly uses `speciesData.maxEvolutionStage`.
- This does NOT affect the Caterpie scenario (actual maxEvolutionStage = 3, Math.max(3,1) = 3 = correct).
- But it would cause incorrect capture rates in the attempt endpoint for Pokemon with 1 or 2 stage evolution lines.
