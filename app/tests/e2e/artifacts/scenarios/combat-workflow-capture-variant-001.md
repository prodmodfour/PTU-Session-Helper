---
scenario_id: combat-workflow-capture-variant-001
loop_id: combat-workflow-wild-encounter-capture-variant
tier: workflow
priority: P1
ptu_assertions: 7
mechanics_tested:
  - wild-spawn
  - damage-formula
  - stab
  - injury-check
  - capture-rate
  - capture-attempt
corrected_by: correction-005
---

## Narrative

During a wild encounter, the player's Squirtle weakens a wild-spawned Rattata with Water Gun instead of knocking it out. The scenario exercises the full wild-spawn → combat → capture pipeline: Rattata is generated via the wild-spawn endpoint (non-deterministic stats from `generateAndCreatePokemon`), the test queries its actual stats after creation, and all combat assertions are derived dynamically from those stats. Only Squirtle has explicit/deterministic stats. This validates internal consistency — damage formula, injury threshold, and capture mechanics — without depending on specific stat rolls.

## Setup (API)

POST /api/encounters { "name": "Route: Wild Rattata Capture" }
$encounter_id = response.data.id

POST /api/characters { "name": "Ash", "level": 30, "isPlayer": true }
$trainer_id = response.data.id
<!-- Trainer level 30 ensures deterministic capture success (see Phase 3 derivation) -->

POST /api/pokemon {
  "species": "Squirtle", "level": 13,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 7,
  "baseSpAtk": 5, "baseSpDef": 6, "baseSpeed": 4,
  "types": ["Water"],
  "ownerId": $trainer_id
}
$squirtle_id = response.data.id
<!-- Explicit creation for deterministic stats. Base stats from gen1/squirtle.md -->
<!-- Squirtle maxHp = level(13) + (baseHp(4) × 3) + 10 = 35 (deterministic) -->

POST /api/encounters/$encounter_id/wild-spawn {
  "pokemon": [{ "speciesName": "Rattata", "level": 10 }],
  "side": "enemies"
}
$rattata_id = response.data.addedPokemon[0].pokemonId
$rattata_combatant_id = response.data.addedPokemon[0].combatantId
<!-- Wild-spawn uses generateAndCreatePokemon — distributes level-1 = 9 random stat points -->
<!-- Stats are non-deterministic. Base stats (gen1/rattata.md): HP 3, ATK 6, DEF 4, SpATK 3, SpDEF 4, SPD 7 -->

POST /api/encounters/$encounter_id/combatants { "entityType": "pokemon", "entityId": $squirtle_id, "side": "players" }
$squirtle_combatant = response.data

## Query Actual Stats (Dynamic Assertion Setup)

GET /api/pokemon/$rattata_id
$rattata = response.data
$rattata_maxHp = $rattata.maxHp
$rattata_attack = $rattata.currentStats.attack
$rattata_spDefense = $rattata.currentStats.specialDefense
$rattata_speed = $rattata.currentStats.speed

<!-- Non-deterministic ranges (base + 0-9 stat points each, sum of all point allocations = 9): -->
<!-- maxHp: 29 (0 HP points) to 56 (all 9 in HP) — formula: level + ((baseHp + hpPoints) × 3) + 10 -->
<!-- attack: 6 to 15, spDefense: 4 to 13, speed: 7 to 16 -->

POST /api/encounters/$encounter_id/start

## Phase 1: Round 1 — Rattata Tackle → Squirtle

Initiative: $rattata_speed (minimum 7) > Squirtle SPD (4)
Rattata acts first — guaranteed regardless of stat roll since min Rattata speed (7) > Squirtle speed (4).

1. Select move: **Tackle** (Normal, Physical, DB 5, AC 4)
   - Learn level: L1 (gen1/rattata.md: Level-Up Moves) ✓
   - STAB check: Rattata is Normal, Tackle is Normal → **STAB applies (+2 DB)**
   - Effective DB = 5 + 2 = 7
2. Set damage for DB 7 = 17
3. Apply to Squirtle

Damage derivation (dynamic):
   Set damage = 17 (DB 7, deterministic from damage chart)
   ATK = $rattata_attack (queried, non-deterministic)
   DEF = 7 (Squirtle, deterministic)
   Raw = max(1, 17 + $rattata_attack − 7) = max(1, 10 + $rattata_attack)
   Type effectiveness:
     Normal vs Water = Neutral (×1) — Normal chart: Water not listed
     Combined = ×1
   $phase1_damage = max(1, 10 + $rattata_attack)
   <!-- ATK min 6 → damage min 16; ATK max 15 → damage max 25; always ≥ 1 -->
   Enforcement: App-enforced (damage formula in combatant service)

$squirtle_hp_after_p1 = 35 − $phase1_damage
<!-- Worst case: 35 − 25 = 10. Best case: 35 − 16 = 19. Squirtle always survives. -->

### Assertions (Phase 1)

1. **Initiative ordering:**
   $rattata_speed ≥ 7 > 4 = Squirtle speed → Rattata acts first
   **Assert: Rattata appears before Squirtle in turn order**
   Enforcement: App-enforced (initiative sorting by speed in start endpoint)

2. **Squirtle HP after damage:**
   **Assert: Squirtle HP = $squirtle_hp_after_p1 / 35**
   **Assert: Squirtle HP > 0 (survives — worst case 35 − 25 = 10)**
   Enforcement: App-enforced (damage formula)

POST /api/encounters/$encounter_id/next-turn

## Phase 2: Round 1 — Squirtle Water Gun → Rattata

1. Select move: **Water Gun** (Water, Special, DB 6, AC 2)
   - Learn level: L13 (gen1/squirtle.md: Level-Up Moves) ✓
   - STAB check: Squirtle is Water, Water Gun is Water → **STAB applies (+2 DB)**
   - Effective DB = 6 + 2 = 8
2. Set damage for DB 8 = 19
3. Apply to Rattata

Damage derivation (dynamic):
   Set damage = 19 (DB 8, deterministic from damage chart)
   SpATK = 5 (Squirtle, deterministic)
   SpDEF = $rattata_spDefense (queried, non-deterministic)
   Raw = max(1, 19 + 5 − $rattata_spDefense) = max(1, 24 − $rattata_spDefense)
   Type effectiveness:
     Water vs Normal = Neutral (×1) — Water chart: Normal not listed
     Combined = ×1
   $phase2_damage = max(1, 24 − $rattata_spDefense)
   <!-- SpDEF min 4 → damage max 20; SpDEF max 13 → damage min 11; always ≥ 1 -->
   Enforcement: App-enforced (damage formula in combatant service)

$rattata_hp_after = $rattata_maxHp − $phase2_damage
<!-- Worst case: maxHp 29, damage 20 → HP 9. Best case: maxHp 56, damage 11 → HP 45. Always survives. -->

### Assertions (Phase 2)

3. **Rattata HP after damage:**
   **Assert: Rattata HP = $rattata_hp_after / $rattata_maxHp**
   **Assert: Rattata HP > 0 (survives — worst case 29 − 20 = 9)**
   Enforcement: App-enforced (damage formula)

4. **Injury check (dynamic conditional):**
   $injury_threshold = $rattata_maxHp / 2
   $injury_expected = ($phase2_damage >= $injury_threshold) ? 1 : 0
   <!-- When maxHp low (29): damage 20 ≥ 14.5 → injury gained -->
   <!-- When maxHp high (56): damage 11 < 28 → no injury -->
   **Assert: Rattata injuries = $injury_expected**
   Enforcement: App-enforced (Massive Damage check in calculateDamage)

## Phase 3: Capture Attempt

The trainer uses a Standard Action to throw a Poke Ball at the weakened Rattata.

POST /api/capture/rate {
  "pokemonId": $rattata_id
}
$capture_rate = response.data.captureRate

<!-- Rate derivation (dynamic): -->
<!-- Base: 100 -->
<!-- Level modifier: -(10 × 2) = -20 -->
<!-- HP modifier: depends on $rattata_hp_after / $rattata_maxHp percentage -->
<!--   HP% ≤ 25%: +15; HP% ≤ 50%: +0; HP% ≤ 75%: -15; HP% > 75%: -30 -->
<!-- Evolution modifier: Rattata stage 1, maxEvolutionStage 3 → remaining 2 → +10 -->
<!-- Injury modifier: $injury_expected × 5 -->
<!-- Range: ~60 (high HP%, no injury) to ~95 (low HP%, with injury) -->

### Assertions (Phase 3)

5. **Capture rate is positive:**
   **Assert: $capture_rate > 0**
   Enforcement: App-enforced (capture rate formula)

POST /api/capture/attempt {
  "pokemonId": $rattata_id,
  "trainerId": $trainer_id,
  "accuracyRoll": 20
}
<!-- accuracyRoll: 20 → criticalHit: true → +10 to effectiveCaptureRate -->
<!-- Capture success derivation: -->
<!--   effectiveCaptureRate = $capture_rate + 10 (crit bonus) -->
<!--   modifiedRoll = d100_roll − trainerLevel(30) − modifiers(0) -->
<!--   Success if modifiedRoll ≤ effectiveCaptureRate -->
<!--   Worst case: effectiveCaptureRate = 70 (captureRate 60 + 10) -->
<!--   Success if d100_roll ≤ 70 + 30 = 100 → always succeeds -->
<!--   Trainer level 30 + crit bonus guarantees capture for all stat configurations -->

### Assertions (Phase 3 — capture result)

6. **Capture succeeds:**
   **Assert: response.data.captured = true**
   Enforcement: App-enforced (capture attempt formula)

GET /api/pokemon/$rattata_id

7. **Pokemon captured and linked to trainer:**
   **Assert: Rattata origin = "captured"**
   **Assert: Rattata ownerId = $trainer_id**
   Enforcement: App-enforced (capture attempt auto-links Pokemon)

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$squirtle_id
DELETE /api/pokemon/$rattata_id
DELETE /api/characters/$trainer_id
