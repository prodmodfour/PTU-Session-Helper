---
scenario_id: pokemon-lifecycle-workflow-capture-001
loop_id: pokemon-lifecycle-workflow-capture
tier: workflow
priority: P0
ptu_assertions: 4
mechanics_tested:
  - capture-rate-formula
  - ownership-transfer
  - origin-change
non_deterministic: false
non_deterministic_strategy: deterministic-setup
---

## Narrative

During a combat encounter, a player's trainer wants to capture a weakened wild Caterpie.
The GM calculates the capture rate (which is very high due to low HP and low level), then
executes the capture attempt. On success, the Caterpie's ownership transfers to the trainer
and its origin changes from 'wild' to 'captured'. All stats, moves, and abilities are preserved.

## Species Data (from gen1/caterpie.md)

| Field | Value |
|-------|-------|
| Species | Caterpie |
| Types | Bug |
| Base HP | 5 |
| Evolution Stage | 1 of 3 (Caterpie -> Metapod -> Butterfree) |

## Setup (API)

Create the Caterpie via explicit `POST /api/pokemon` (deterministic stats — Lesson 4)
with origin set to 'wild' and HP reduced to 1 to guarantee capture success.

```
POST /api/pokemon {
  species: "Caterpie",
  level: 5,
  types: ["Bug"],
  origin: "wild",
  gender: "Male",
  currentHp: 1,
  maxHp: 30,
  baseStats: {
    hp: 5,
    attack: 3,
    defense: 4,
    specialAttack: 2,
    specialDefense: 2,
    speed: 5
  },
  moves: [
    { name: "String Shot", type: "Bug", damageClass: "Status", frequency: "At-Will", ac: 2, damageBase: null, range: "4, 1 Target" },
    { name: "Tackle", type: "Normal", damageClass: "Physical", frequency: "At-Will", ac: 2, damageBase: "5", range: "Melee" }
  ],
  abilities: [{ name: "Shield Dust", effect: "" }]
}
$caterpie_id = response.data.id
```

HP verification: maxHp = level(5) + (baseHp(5) * 3) + 10 = 5 + 15 + 10 = **30** ✓

```
POST /api/characters {
  name: "Ash",
  level: 1,
  isPlayer: true
}
$trainer_id = response.data.id
```

```
POST /api/encounters { name: "Route 2: Caterpie Capture Test" }
$encounter_id = response.data.id

POST /api/encounters/$encounter_id/combatants {
  pokemonId: $caterpie_id,
  side: "enemy"
}
```

## Phase 1: Verify Pre-Capture State

```
GET /api/pokemon/$caterpie_id
```

### Assertions (Phase 1)

1. **Pre-capture ownership:**
   **Assert: response.data.ownerId = null**
   **Assert: response.data.origin = "wild"**

## Phase 2: Calculate Capture Rate

```
POST /api/capture/rate {
  pokemonId: $caterpie_id
}
$rate = response.data.captureRate
```

### Assertions (Phase 2 — Capture Rate)

2. **Capture rate calculation:** (App-enforced: capture-rate-formula)
   PTU formula:
   - Base: 100
   - Level modifier: -(5 × 2) = -10
   - HP modifier: at 1 HP (exactly 1 HP) → +30
   - Evolution stage: stage 1, maxEvolutionStage 3, two evolutions remaining → +10
   - No status conditions: 0
   - Not shiny: 0
   - Not legendary: 0
   - No injuries: 0
   - Capture rate = 100 - 10 + 30 + 10 = **130**
   **Assert: response.data.captureRate = 130**
   **Assert: response.data.canBeCaptured = true**

## Phase 3: Execute Capture Attempt

With capture rate 130 and trainer level 1:
- The d100 roll (1-100) minus trainer level (1) gives modified roll 0-99
- Modified roll ≤ 130 is always true → capture guaranteed regardless of roll

```
POST /api/capture/attempt {
  pokemonId: $caterpie_id,
  trainerId: $trainer_id
}
```

### Assertions (Phase 3 — Capture Result)

3. **Capture succeeded:**
   **Assert: response.data.captured = true**
   **Assert: response.data.captureRate = 130**
   **Assert: response.data.trainerLevel = 1**

4. **Ownership transferred in response:**
   **Assert: response.data.pokemon.ownerId = $trainer_id**
   **Assert: response.data.pokemon.origin = "captured"**

## Phase 4: Verify Post-Capture State

```
GET /api/pokemon/$caterpie_id
```

### Assertions (Phase 4 — Ownership Transfer + Origin Change)

5. **Ownership persisted:** (App-enforced: ownership-transfer)
   **Assert: response.data.ownerId = $trainer_id**

6. **Origin changed:** (App-enforced: origin-change)
   **Assert: response.data.origin = "captured"**

7. **Stats preserved (no modification on capture):**
   **Assert: response.data.level = 5**
   **Assert: response.data.currentHp = 1** (HP NOT restored on capture)
   **Assert: response.data.maxHp = 30**
   **Assert: response.data.baseStats.hp = 5**
   **Assert: response.data.baseStats.attack = 3**

8. **Moves preserved:**
   **Assert: response.data.moves.length = 2**
   **Assert: move names include "String Shot"**
   **Assert: move names include "Tackle"**

9. **Abilities preserved:**
   **Assert: response.data.abilities.length = 1**
   **Assert: response.data.abilities[0].name = "Shield Dust"**

## Teardown

```
POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$caterpie_id
DELETE /api/characters/$trainer_id
```
