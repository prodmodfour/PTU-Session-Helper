---
scenario_id: healing-pokemon-center-time-001
loop_id: healing-mechanic-pokemon-center-time
tier: mechanic
priority: P1
ptu_assertions: 4
---

## Narrative

Validates the Pokemon Center healing time formula: base 60 minutes + 30 minutes per injury (< 5 injuries) or 60 minutes per injury (>= 5 injuries). Tests the threshold at 4 vs 5 injuries where the formula switches, producing a dramatic jump in healing time.

## Setup (API)

Create 4 Pokemon with different injury counts:

POST /api/pokemon { "species": "Bulbasaur", "level": 15, "baseHp": 5, ... }
$no_injury_id = response.data.id
PUT /api/pokemon/$no_injury_id { "currentHp": 20, "injuries": 0 }

POST /api/pokemon { "species": "Oddish", "level": 10, "baseHp": 5, ... }
$low_injury_id = response.data.id
PUT /api/pokemon/$low_injury_id { "currentHp": 15, "injuries": 3 }

POST /api/pokemon { "species": "Geodude", "level": 12, "baseHp": 4, ... }
$threshold_id = response.data.id
PUT /api/pokemon/$threshold_id { "currentHp": 10, "injuries": 4 }

POST /api/pokemon { "species": "Machop", "level": 15, "baseHp": 7, ... }
$high_injury_id = response.data.id
PUT /api/pokemon/$high_injury_id { "currentHp": 10, "injuries": 5 }

**Non-deterministic API check:** All Pokemon created via explicit `POST` with base stats — deterministic.

## Actions & Assertions

### Test 1: No injuries — base time only
POST /api/pokemon/$no_injury_id/pokemon-center

1. **0 injuries — 60 min base time:**
   baseTime = 60, injuryTime = 0 × 30 = 0, totalTime = 60
   **Assert: response.data.healingTime = 60** (App-enforced: calculatePokemonCenterTime)
   **Assert: response.data.healingTimeDescription = "1 hour"** (App-enforced: time formatting)

### Test 2: 3 injuries — 30 min each (under threshold)
POST /api/pokemon/$low_injury_id/pokemon-center

2. **3 injuries at 30 min each:**
   baseTime = 60, injuryTime = 3 × 30 = 90, totalTime = 150
   **Assert: response.data.healingTime = 150** (App-enforced: injuries < 5 path)
   **Assert: response.data.healingTimeDescription = "2 hours 30 min"** (App-enforced: formatting)

### Test 3: 4 injuries — still 30 min each (just under threshold)
POST /api/pokemon/$threshold_id/pokemon-center

3. **4 injuries — last value before threshold switch:**
   baseTime = 60, injuryTime = 4 × 30 = 120, totalTime = 180
   **Assert: response.data.healingTime = 180** (App-enforced: 4 < 5, uses 30-min path)
   **Assert: response.data.healingTimeDescription = "3 hours"** (App-enforced: formatting)

### Test 4: 5 injuries — 60 min each (at threshold)
POST /api/pokemon/$high_injury_id/pokemon-center

4. **5 injuries — switches to 60 min per injury:**
   baseTime = 60, injuryTime = 5 × 60 = 300, totalTime = 360
   Jump from 4→5 injuries: 180 → 360 min (doubles!)
   **Assert: response.data.healingTime = 360** (App-enforced: injuries >= 5 path)
   **Assert: response.data.healingTimeDescription = "6 hours"** (App-enforced: formatting)

## Teardown

DELETE /api/pokemon/$no_injury_id
DELETE /api/pokemon/$low_injury_id
DELETE /api/pokemon/$threshold_id
DELETE /api/pokemon/$high_injury_id
