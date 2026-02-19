---
scenario_id: healing-workflow-pokemon-center-full-heal-001
loop_id: healing-workflow-pokemon-center-full-heal
tier: workflow
priority: P0
ptu_assertions: 10
mechanics_tested:
  - pokemon-center-full-heal
  - pokemon-center-injury-cap
  - pokemon-center-time-calculation
  - status-clearing-all
  - drained-ap-not-restored
  - daily-move-recovery
---

## Narrative

The party reaches Pewter City's Pokemon Center after a grueling trek through Mt. Moon. Trainer Misty has 4 injuries, is frozen and confused, and has 2 drained AP. Her Squirtle is poisoned with 2 injuries and depleted moves. The GM runs Pokemon Center healing for both — full HP restore, all status conditions cleared, injuries healed within daily limits, AP/moves restored. Misty has 4 injuries but only 3 can be healed per day, leaving 1 remaining. Squirtle's 2 injuries are fully healed. The GM notes the healing time for narrative pacing.

## Species Data

**Squirtle** (gen1/squirtle.md)
- Type: Water
- Base Stats: HP 4, ATK 5, DEF 7, SpATK 5, SpDEF 6, SPD 4

**Non-deterministic API check:** Both entities created via explicit `POST` with base stats — deterministic. Character HP = (level × 2) + (baseHp × 3) + 10. Pokemon HP = level + (baseHp × 3) + 10.

## Setup (API)

POST /api/characters {
  "name": "Trainer Misty",
  "level": 8,
  "hp": 6,
  "characterType": "player",
  "maxHp": 44,
  "currentHp": 44
}
$character_id = response.data.id
<!-- Character maxHp = (8 × 2) + (6 × 3) + 10 = 16 + 18 + 10 = 44 -->

PUT /api/characters/$character_id {
  "currentHp": 15,
  "injuries": 4,
  "statusConditions": ["Frozen", "Confused"],
  "drainedAp": 2,
  "injuriesHealedToday": 0,
  "restMinutesToday": 120
}

POST /api/pokemon {
  "species": "Squirtle",
  "level": 12,
  "baseHp": 4,
  "baseAttack": 5,
  "baseDefense": 7,
  "baseSpAtk": 5,
  "baseSpDef": 6,
  "baseSpeed": 4,
  "types": ["Water"],
  "moves": [
    { "name": "Water Gun", "type": "Water", "frequency": "At-Will", "db": 6, "ac": 2, "damageClass": "Special", "usedToday": 5, "usedThisScene": 2 },
    { "name": "Bide", "type": "Normal", "frequency": "Daily x1", "db": 0, "ac": 0, "damageClass": "Status", "usedToday": 1, "usedThisScene": 1 }
  ]
}
$pokemon_id = response.data.id
<!-- Pokemon maxHp = 12 + (4 × 3) + 10 = 34 -->

PUT /api/pokemon/$pokemon_id {
  "currentHp": 5,
  "injuries": 2,
  "statusConditions": ["Poisoned"],
  "injuriesHealedToday": 0
}

## Phase 1: Character Pokemon Center

POST /api/characters/$character_id/pokemon-center

### Assertions (Phase 1)

1. **Character full HP restore:**
   hpHealed = 44 - 15 = 29
   **Assert: response.data.hpHealed = 29** (App-enforced: pokemon-center sets currentHp = maxHp)
   **Assert: response.data.newHp = 44** (App-enforced: full restore)
   **Assert: response.data.maxHp = 44** (App-enforced: maxHp unchanged)

2. **Character all statuses cleared (persistent + volatile):**
   Input: ["Frozen", "Confused"]
   Pokemon Center clears ALL status conditions (not just persistent)
   **Assert: response.data.clearedStatuses includes "Frozen"** (App-enforced: all statuses cleared)
   **Assert: response.data.clearedStatuses includes "Confused"** (App-enforced: Pokemon Center clears volatile too)

3. **Character injuries healed (daily cap applied):**
   injuries = 4, injuriesHealedToday = 0
   maxHealable = max(0, 3 - 0) = 3
   injuriesHealed = min(4, 3) = 3
   injuriesRemaining = 4 - 3 = 1
   **Assert: response.data.injuriesHealed = 3** (App-enforced: calculatePokemonCenterInjuryHealing)
   **Assert: response.data.injuriesRemaining = 1** (App-enforced: daily cap of 3)
   **Assert: response.data.injuriesHealedToday = 3** (App-enforced: counter updated)

4. **Character healing time (< 5 injuries uses 30 min/injury):**
   baseTime = 60, injuryTime = 4 × 30 = 120, totalTime = 180
   **Assert: response.data.healingTime = 180** (App-enforced: calculatePokemonCenterTime)
   **Assert: response.data.healingTimeDescription = "3 hours"** (App-enforced: time formatting)

5. **Character AP NOT restored (per ptu-rule-038):**
   Pokemon Centers do NOT restore drained AP — that is exclusively an Extended Rest benefit.
   drainedAp remains at 2 (unchanged).
   **Assert: response.data.apRestored = 0** (App-enforced: Pokemon Centers skip AP restoration)

## Phase 2: Pokemon Pokemon Center

POST /api/pokemon/$pokemon_id/pokemon-center

### Assertions (Phase 2)

6. **Pokemon full HP restore:**
   hpHealed = 34 - 5 = 29
   **Assert: response.data.hpHealed = 29** (App-enforced: pokemon-center full heal)
   **Assert: response.data.newHp = 34** (App-enforced: currentHp = maxHp)

7. **Pokemon statuses cleared:**
   **Assert: response.data.clearedStatuses includes "Poisoned"** (App-enforced: all statuses cleared)

8. **Pokemon injuries fully healed (under cap):**
   injuries = 2, injuriesHealedToday = 0
   maxHealable = max(0, 3 - 0) = 3
   injuriesHealed = min(2, 3) = 2
   injuriesRemaining = 0
   **Assert: response.data.injuriesHealed = 2** (App-enforced: all injuries healed)
   **Assert: response.data.injuriesRemaining = 0** (App-enforced: fully healed)

9. **Pokemon healing time:**
   baseTime = 60, injuryTime = 2 × 30 = 60, totalTime = 120
   **Assert: response.data.healingTime = 120** (App-enforced: calculatePokemonCenterTime)
   **Assert: response.data.healingTimeDescription = "2 hours"** (App-enforced: time formatting)

10. **Pokemon moves restored:**
    Water Gun (At-Will): usedToday → 0, usedThisScene → 0
    Bide (Daily x1): usedToday → 0, usedThisScene → 0
    **Assert: response.data.restoredMoves includes "Water Gun"** (App-enforced: all moves reset)
    **Assert: response.data.restoredMoves includes "Bide"** (App-enforced: daily moves reset)

## Phase 3: Post-Heal Verification

GET /api/characters/$character_id
- Verify: currentHp = 44 (full), injuries = 1, statusConditions = [], drainedAp = 2 (unchanged — Pokemon Centers do not restore AP per ptu-rule-038), restMinutesToday = 120 (unchanged — Pokemon Centers do not consume rest budget per ptu-rule-040)

GET /api/pokemon/$pokemon_id
- Verify: currentHp = 34 (full), injuries = 0, statusConditions = []

## Teardown

DELETE /api/pokemon/$pokemon_id
DELETE /api/characters/$character_id
