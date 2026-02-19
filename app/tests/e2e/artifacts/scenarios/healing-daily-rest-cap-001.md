---
scenario_id: healing-daily-rest-cap-001
loop_id: healing-mechanic-daily-rest-cap
tier: mechanic
priority: P1
ptu_assertions: 3
---

## Narrative

Validates the 480-minute daily rest cap. A Pokemon that has already rested 450 minutes can rest once more (reaching 480), but a subsequent rest attempt is blocked. Also tests that an entity already at 480 minutes is immediately rejected.

## Setup (API)

POST /api/pokemon { "species": "Bulbasaur", "level": 15, "baseHp": 5, ... }
$pokemon_id = response.data.id
<!-- maxHp = 15 + (5 × 3) + 10 = 40 -->

**Non-deterministic API check:** Pokemon created via explicit `POST` with base stats — deterministic.

## Actions & Assertions

### Test 1: 450 min — one more rest allowed

PUT /api/pokemon/$pokemon_id { "currentHp": 20, "restMinutesToday": 450, "lastRestReset": "<today's ISO timestamp>" }
POST /api/pokemon/$pokemon_id/rest

1. **450 minutes — under cap, rest succeeds:**
   restMinutesToday = 450 < 480 → canHeal = true
   healAmount = max(1, floor(40/16)) = 2
   newRestMinutes = 450 + 30 = 480
   **Assert: response.success = true** (App-enforced: restMinutesToday < 480)
   **Assert: response.data.hpHealed = 2** (App-enforced: calculateRestHealing)
   **Assert: response.data.restMinutesToday = 480** (App-enforced: 450 + 30)
   **Assert: response.data.restMinutesRemaining = 0** (App-enforced: 480 - 480)

### Test 2: 480 min — at cap, rest blocked

PUT /api/pokemon/$pokemon_id { "currentHp": 20, "restMinutesToday": 480, "lastRestReset": "<today's ISO timestamp>" }
POST /api/pokemon/$pokemon_id/rest

2. **480 minutes — at cap, rest blocked:**
   restMinutesToday = 480 >= 480 → canHeal = false
   **Assert: response.success = false** (App-enforced: restMinutesToday >= 480)
   **Assert: response.message contains "8 hours"** (App-enforced: reason string)
   **Assert: response.data.hpHealed = 0** (App-enforced: no healing on block)

### Test 3: Over cap (510 min) — also blocked

PUT /api/pokemon/$pokemon_id { "currentHp": 20, "restMinutesToday": 510, "lastRestReset": "<today's ISO timestamp>" }
POST /api/pokemon/$pokemon_id/rest

3. **Over cap — blocked:**
   restMinutesToday = 510 >= 480 → canHeal = false
   **Assert: response.success = false** (App-enforced: restMinutesToday >= 480)
   **Assert: response.data.hpHealed = 0**

## Teardown

DELETE /api/pokemon/$pokemon_id
