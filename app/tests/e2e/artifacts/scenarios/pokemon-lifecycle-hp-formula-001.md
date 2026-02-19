---
scenario_id: pokemon-lifecycle-hp-formula-001
loop_id: pokemon-lifecycle-mechanic-hp-formula
tier: mechanic
priority: P1
ptu_assertions: 6
---

## Description

Validates the PTU HP formula `maxHp = level + (baseHp × 3) + 10` across edge cases:
minimum values, high base stats, and default maxHp calculation. All tests use deterministic
`POST /api/pokemon` with explicit base stats (Lesson 4: no non-deterministic endpoints).

## PTU Rule

"Pokemon Hit Points = Pokemon Level + (HP × 3) + 10" (core/05-pokemon.md, Managing Pokemon — Combat Stats)

## Setup (API)

No pre-existing entities needed.

## Actions

### Test 1: Minimum HP (Level 1, Base HP 1)

```
POST /api/pokemon {
  species: "TestMinHP",
  level: 1,
  types: ["Normal"],
  baseStats: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 }
}
$min_id = response.data.id
```

### Test 2: Moderate HP (Level 5, Base HP 5 — Caterpie-like)

```
POST /api/pokemon {
  species: "Caterpie",
  level: 5,
  types: ["Bug"],
  baseStats: { hp: 5, attack: 3, defense: 4, specialAttack: 2, specialDefense: 2, speed: 5 }
}
$cat_id = response.data.id
```

### Test 3: High HP (Level 50, Base HP 10)

```
POST /api/pokemon {
  species: "TestHighHP",
  level: 50,
  types: ["Normal"],
  baseStats: { hp: 10, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 }
}
$high_id = response.data.id
```

### Test 4: Very High HP (Level 100, Base HP 25)

```
POST /api/pokemon {
  species: "TestVeryHighHP",
  level: 100,
  types: ["Normal"],
  baseStats: { hp: 25, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 }
}
$vhigh_id = response.data.id
```

### Test 5: Explicit maxHp Override

When maxHp is explicitly provided, it should be stored as-is (no formula recalculation).

```
POST /api/pokemon {
  species: "TestOverride",
  level: 10,
  types: ["Normal"],
  maxHp: 999,
  baseStats: { hp: 5, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 }
}
$override_id = response.data.id
```

## Assertions

1. **Test 1 — Minimum HP:** (App-enforced: hp-formula)
   maxHp = level(1) + (baseHp(1) × 3) + 10 = 1 + 3 + 10 = **14**
   **Assert: $min response.data.maxHp = 14**
   **Assert: $min response.data.currentHp = 14**

2. **Test 2 — Caterpie HP:** (App-enforced: hp-formula)
   maxHp = level(5) + (baseHp(5) × 3) + 10 = 5 + 15 + 10 = **30**
   **Assert: $cat response.data.maxHp = 30**
   **Assert: $cat response.data.currentHp = 30**

3. **Test 3 — High level + base:** (App-enforced: hp-formula)
   maxHp = level(50) + (baseHp(10) × 3) + 10 = 50 + 30 + 10 = **90**
   **Assert: $high response.data.maxHp = 90**
   **Assert: $high response.data.currentHp = 90**

4. **Test 4 — Very high:** (App-enforced: hp-formula)
   maxHp = level(100) + (baseHp(25) × 3) + 10 = 100 + 75 + 10 = **185**
   **Assert: $vhigh response.data.maxHp = 185**
   **Assert: $vhigh response.data.currentHp = 185**

5. **Test 5 — Explicit override:** (App-enforced)
   Formula would give: 10 + (5 × 3) + 10 = 35. But explicit maxHp = 999 should win.
   **Assert: $override response.data.maxHp = 999**
   **Assert: $override response.data.currentHp = 999**

6. **All start at full HP:** (App-enforced)
   For every created Pokemon: currentHp = maxHp.
   **Assert: all 5 Pokemon have currentHp = maxHp**

## Teardown

```
DELETE /api/pokemon/$min_id
DELETE /api/pokemon/$cat_id
DELETE /api/pokemon/$high_id
DELETE /api/pokemon/$vhigh_id
DELETE /api/pokemon/$override_id
```
