---
scenario_id: pokemon-lifecycle-stat-distribution-001
loop_id: pokemon-lifecycle-mechanic-stat-distribution
tier: mechanic
priority: P1
ptu_assertions: 4
non_deterministic: true
non_deterministic_strategy: query-then-compute
---

## Description

Validates that the stat point distribution algorithm distributes exactly `level - 1` points
and that all calculated stats are >= base stats. Tests level 1 edge case (0 points) and
level 20 (19 points). Uses wild spawn to exercise the generator's distribution logic, then
queries actual values for relational assertions (Lesson 4).

## PTU Rule

"Next, add +X Stat Points, where X is the Pokemon's Level plus 10." The app distributes
`level - 1` points because base stats already represent species defaults.
(core/05-pokemon.md, Managing Pokemon — Combat Stats)

## Species Data

**Zubat (gen1/zubat.md):**

| Stat | Base |
|------|------|
| HP | 4 |
| ATK | 5 |
| DEF | 4 |
| SpATK | 3 |
| SpDEF | 4 |
| SPD | 6 |
| **Total** | **26** |

## Setup (API)

```
POST /api/encounters { name: "Stat Distribution Test" }
$encounter_id = response.data.id
```

## Actions

### Test 1: Level 1 — Zero Points Distributed

```
POST /api/encounters/$encounter_id/wild-spawn {
  pokemon: [{ speciesName: "Zubat", level: 1 }],
  side: "enemies"
}
$zubat1_id = response.data.addedPokemon[0].pokemonId

GET /api/pokemon/$zubat1_id
$z1 = response.data
```

### Test 2: Level 20 — Nineteen Points Distributed

```
POST /api/encounters/$encounter_id/wild-spawn {
  pokemon: [{ speciesName: "Zubat", level: 20 }],
  side: "enemies"
}
$zubat20_id = response.data.addedPokemon[0].pokemonId

GET /api/pokemon/$zubat20_id
$z20 = response.data
```

## Assertions

### Test 1: Level 1

1. **Zero points distributed — calculated stats equal base stats:** (App-enforced: stat-point-distribution)
   At level 1, `level - 1 = 0` points distributed. All calculated stats should equal base stats.

   Non-HP stats:
   **Assert: $z1.currentStats.attack = 5** (base ATK)
   **Assert: $z1.currentStats.defense = 4** (base DEF)
   **Assert: $z1.currentStats.specialAttack = 3** (base SpATK)
   **Assert: $z1.currentStats.specialDefense = 4** (base SpDEF)
   **Assert: $z1.currentStats.speed = 6** (base SPD)

2. **HP formula with base HP (no distributed points):** (App-enforced: hp-formula)
   calculatedHp = baseHp = 4 (0 points to HP)
   maxHp = level(1) + (4 × 3) + 10 = 1 + 12 + 10 = **23**
   **Assert: $z1.maxHp = 23**

### Test 2: Level 20

3. **All calculated stats >= base stats:** (App-enforced: stat-point-distribution)
   Points are added, never subtracted.
   **Assert: $z20.currentStats.attack >= 5**
   **Assert: $z20.currentStats.defense >= 4**
   **Assert: $z20.currentStats.specialAttack >= 3**
   **Assert: $z20.currentStats.specialDefense >= 4**
   **Assert: $z20.currentStats.speed >= 6**

4. **Total distributed points = level - 1 = 19:** (App-enforced: stat-point-distribution)
   Derive calculatedHp from maxHp, then sum all point deltas.

   ```
   calculatedHp = ($z20.maxHp - 20 - 10) / 3
   hpDistributed = calculatedHp - 4         (base HP)
   atkDistributed = $z20.currentStats.attack - 5
   defDistributed = $z20.currentStats.defense - 4
   spAtkDistributed = $z20.currentStats.specialAttack - 3
   spDefDistributed = $z20.currentStats.specialDefense - 4
   spdDistributed = $z20.currentStats.speed - 6
   totalDistributed = sum of all 6
   ```

   **Assert: ($z20.maxHp - 20 - 10) is divisible by 3** (HP formula produces integer)
   **Assert: totalDistributed = 19**

5. **HP within valid range for level 20:**
   Minimum maxHp (0 HP points): 20 + (4 × 3) + 10 = 42
   Maximum maxHp (all 19 points in HP): 20 + (23 × 3) + 10 = 99
   **Assert: $z20.maxHp >= 42**
   **Assert: $z20.maxHp <= 99**

## Teardown

```
POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$zubat1_id
DELETE /api/pokemon/$zubat20_id
```
