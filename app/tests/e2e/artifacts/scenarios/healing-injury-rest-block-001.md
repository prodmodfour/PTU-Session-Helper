---
scenario_id: healing-injury-rest-block-001
loop_id: healing-mechanic-injury-rest-block
tier: mechanic
priority: P1
ptu_assertions: 3
---

## Narrative

Validates that rest healing is blocked when an entity has 5 or more injuries, and re-enabled when injuries drop to 4. Tests the exact boundary at 5 injuries.

## Setup (API)

POST /api/pokemon { "species": "Geodude", "level": 15, "baseHp": 4, ... }
$pokemon_id = response.data.id
<!-- maxHp = 15 + (4 × 3) + 10 = 37 -->

**Non-deterministic API check:** Pokemon created via explicit `POST` with base stats — deterministic.

## Actions & Assertions

### Test 1: 4 injuries — rest allowed

PUT /api/pokemon/$pokemon_id { "currentHp": 20, "injuries": 4 }
POST /api/pokemon/$pokemon_id/rest

1. **4 injuries allows rest healing:**
   injuries = 4, threshold is >= 5
   4 < 5 → canHeal = true
   healAmount = max(1, floor(37/16)) = max(1, 2) = 2
   **Assert: response.success = true** (App-enforced: injuries < 5)
   **Assert: response.data.hpHealed = 2** (App-enforced: calculateRestHealing)

### Test 2: 5 injuries — rest blocked

PUT /api/pokemon/$pokemon_id { "currentHp": 20, "injuries": 5, "restMinutesToday": 0 }
POST /api/pokemon/$pokemon_id/rest

2. **Exactly 5 injuries blocks rest healing:**
   injuries = 5, threshold is >= 5
   5 >= 5 → canHeal = false
   **Assert: response.success = false** (App-enforced: injuries >= 5 guard)
   **Assert: response.message contains "5+ injuries"** (App-enforced: reason string)
   **Assert: response.data.hpHealed = 0** (App-enforced: no healing on block)

### Test 3: 7 injuries — rest blocked

PUT /api/pokemon/$pokemon_id { "currentHp": 20, "injuries": 7, "restMinutesToday": 0 }
POST /api/pokemon/$pokemon_id/rest

3. **High injury count (7) also blocks:**
   injuries = 7 >= 5 → canHeal = false
   **Assert: response.success = false** (App-enforced: injuries >= 5 guard)
   **Assert: response.data.hpHealed = 0** (App-enforced: no healing)

## Teardown

DELETE /api/pokemon/$pokemon_id
