---
scenario_id: healing-workflow-overnight-extended-rest-001
loop_id: healing-workflow-overnight-extended-rest
tier: workflow
priority: P0
ptu_assertions: 8
mechanics_tested:
  - rest-hp-calculation
  - extended-rest-status-clearing
  - drained-ap-restoration
  - daily-move-recovery
  - daily-rest-cap
---

## Narrative

The party camps overnight after a rough day. Trainer Brock has burns and confusion from a Poison/Fire ambush, plus drained AP from healing injuries earlier. His Oddish is paralyzed from a Thunder Wave. The GM runs extended rests for both — Brock recovers HP (8 rest periods), gets his persistent Burned status cleared (Confused survives as volatile), and his drained AP restored. Oddish recovers HP, gets Paralyzed cleared, and has its daily-frequency Stun Spore restored.

## Species Data

**Oddish** (gen1/oddish.md)
- Type: Grass/Poison
- Base Stats: HP 5, ATK 5, DEF 6, SpATK 8, SpDEF 7, SPD 3

**Non-deterministic API check:** Both entities created via explicit `POST` with base stats — deterministic. Character HP = (level × 2) + (baseHp × 3) + 10. Pokemon HP = level + (baseHp × 3) + 10.

## Setup (API)

POST /api/characters {
  "name": "Trainer Brock",
  "level": 10,
  "hp": 5,
  "characterType": "player",
  "maxHp": 45,
  "currentHp": 45
}
$character_id = response.data.id
<!-- Character maxHp = (10 × 2) + (5 × 3) + 10 = 45 -->

PUT /api/characters/$character_id {
  "currentHp": 20,
  "statusConditions": ["Burned", "Confused"],
  "drainedAp": 4
}

POST /api/pokemon {
  "species": "Oddish",
  "level": 10,
  "baseHp": 5,
  "baseAttack": 5,
  "baseDefense": 6,
  "baseSpAtk": 8,
  "baseSpDef": 7,
  "baseSpeed": 3,
  "types": ["Grass", "Poison"],
  "moves": [
    { "name": "Absorb", "type": "Grass", "frequency": "At-Will", "db": 4, "ac": 2, "damageClass": "Special", "usedToday": 3, "usedThisScene": 1 },
    { "name": "Stun Spore", "type": "Grass", "frequency": "Daily x2", "db": 0, "ac": 6, "damageClass": "Status", "usedToday": 2, "usedThisScene": 1 }
  ]
}
$pokemon_id = response.data.id
<!-- Pokemon maxHp = 10 + (5 × 3) + 10 = 35 -->

PUT /api/pokemon/$pokemon_id {
  "currentHp": 10,
  "statusConditions": ["Paralyzed"]
}

## Phase 1: Character Extended Rest

POST /api/characters/$character_id/extended-rest

### Assertions (Phase 1)

1. **Character HP recovery (8 periods):**
   healPerPeriod = max(1, floor(45 / 16)) = max(1, 2) = 2
   8 periods × 2 HP = 16 HP total
   newHp = 20 + 16 = 36 (does not reach maxHp 45)
   **Assert: response.data.hpHealed = 16** (App-enforced: 8 × calculateRestHealing)
   **Assert: response.data.newHp = 36** (App-enforced: currentHp + totalHealed)

2. **Character persistent status cleared, volatile survives:**
   Input: ["Burned", "Confused"]
   Burned = persistent → cleared
   Confused = volatile → survives
   **Assert: response.data.clearedStatuses includes "Burned"** (App-enforced: clearPersistentStatusConditions)
   **Assert: response.data.clearedStatuses does NOT include "Confused"** (App-enforced: volatile conditions survive)

3. **Character drained AP restored:**
   drainedAp was 4, reset to 0
   **Assert: response.data.apRestored = 4** (App-enforced: character extended-rest resets drainedAp)

4. **Character rest minutes tracked:**
   restMinutesToday = 0 + (8 × 30) = 240
   **Assert: response.data.restMinutesToday = 240** (App-enforced: 8 periods × 30 min)

## Phase 2: Pokemon Extended Rest

POST /api/pokemon/$pokemon_id/extended-rest

### Assertions (Phase 2)

5. **Pokemon HP recovery (8 periods):**
   healPerPeriod = max(1, floor(35 / 16)) = max(1, 2) = 2
   8 periods × 2 HP = 16 HP total
   newHp = 10 + 16 = 26 (does not reach maxHp 35)
   **Assert: response.data.hpHealed = 16** (App-enforced: 8 × calculateRestHealing)
   **Assert: response.data.newHp = 26** (App-enforced: currentHp + totalHealed)

6. **Pokemon persistent status cleared:**
   Input: ["Paralyzed"]
   Paralyzed = persistent → cleared
   **Assert: response.data.clearedStatuses includes "Paralyzed"** (App-enforced: clearPersistentStatusConditions)

7. **Pokemon daily moves restored:**
   Absorb (At-Will): usedToday reset to 0, usedThisScene unchanged
   Stun Spore (Daily x2): usedToday reset to 0, usedThisScene reset to 0
   **Assert: response.data.restoredMoves includes "Stun Spore"** (App-enforced: daily frequency detection)

8. **Pokemon rest minutes tracked:**
   restMinutesToday = 0 + (8 × 30) = 240
   **Assert: response.data.restMinutesToday = 240** (App-enforced: 8 periods × 30 min)

## Phase 3: Post-Rest Verification

GET /api/characters/$character_id
- Verify: currentHp = 36, drainedAp = 0
- Verify: statusConditions contains "Confused" but NOT "Burned"

GET /api/pokemon/$pokemon_id
- Verify: currentHp = 26
- Verify: statusConditions is empty (Paralyzed was the only condition)
- Verify: Stun Spore move has usedToday = 0 and usedThisScene = 0

## Teardown

DELETE /api/pokemon/$pokemon_id
DELETE /api/characters/$character_id
