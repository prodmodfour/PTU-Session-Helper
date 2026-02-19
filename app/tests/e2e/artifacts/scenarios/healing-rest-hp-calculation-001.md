---
scenario_id: healing-rest-hp-calculation-001
loop_id: healing-mechanic-rest-hp-calculation
tier: mechanic
priority: P1
ptu_assertions: 5
---

## Narrative

Validates the rest healing formula `max(1, floor(maxHp / 16))` across 5 different maxHp values to test standard healing, the floor rounding, the minimum-of-1 rule, and the near-full-HP cap.

## Setup (API)

Create 5 Pokemon with different baseHp values at level 20, each with reduced currentHp:

POST /api/pokemon { "species": "Geodude", "level": 20, "baseHp": 10, ... }
$high_hp_id = response.data.id
<!-- maxHp = 20 + (10 × 3) + 10 = 60. healAmt = floor(60/16) = 3 -->
PUT /api/pokemon/$high_hp_id { "currentHp": 40 }

POST /api/pokemon { "species": "Oddish", "level": 20, "baseHp": 5, ... }
$mid_hp_id = response.data.id
<!-- maxHp = 20 + (5 × 3) + 10 = 45. healAmt = floor(45/16) = 2 -->
PUT /api/pokemon/$mid_hp_id { "currentHp": 30 }

POST /api/pokemon { "species": "Pikachu", "level": 1, "baseHp": 4, ... }
$low_hp_id = response.data.id
<!-- maxHp = 1 + (4 × 3) + 10 = 23. healAmt = floor(23/16) = 1 -->
PUT /api/pokemon/$low_hp_id { "currentHp": 15 }

POST /api/pokemon { "species": "Caterpie", "level": 1, "baseHp": 4, ... }
$min_hp_id = response.data.id
<!-- maxHp = 1 + (4 × 3) + 10 = 23. healAmt = floor(23/16) = 1 -->
PUT /api/pokemon/$min_hp_id { "currentHp": 5 }

POST /api/pokemon { "species": "Bulbasaur", "level": 15, "baseHp": 5, ... }
$cap_hp_id = response.data.id
<!-- maxHp = 15 + (5 × 3) + 10 = 40. healAmt = floor(40/16) = 2 -->
PUT /api/pokemon/$cap_hp_id { "currentHp": 39 }
<!-- Only 1 HP from full — heal amount (2) capped at deficit (1) -->

**Non-deterministic API check:** All Pokemon created via explicit `POST` with base stats — deterministic.

## Actions

### Test 1: Standard healing (maxHp 60)
POST /api/pokemon/$high_hp_id/rest

### Test 2: Floor rounding (maxHp 45)
POST /api/pokemon/$mid_hp_id/rest

### Test 3: Low maxHp (maxHp 23)
POST /api/pokemon/$low_hp_id/rest

### Test 4: Minimum-of-1 rule (maxHp 23, different start)
POST /api/pokemon/$min_hp_id/rest

### Test 5: Near-full cap (maxHp 40, deficit 1)
POST /api/pokemon/$cap_hp_id/rest

## Assertions

1. **Standard healing — floor(60/16) = 3:**
   healAmount = max(1, floor(60/16)) = max(1, 3) = 3
   newHp = 40 + 3 = 43
   **Assert: response.data.hpHealed = 3** (App-enforced: calculateRestHealing)
   **Assert: response.data.newHp = 43** (App-enforced: currentHp + healAmount)

2. **Floor rounding — floor(45/16) = 2:**
   healAmount = max(1, floor(45/16)) = max(1, 2) = 2
   newHp = 30 + 2 = 32
   **Assert: response.data.hpHealed = 2** (App-enforced: calculateRestHealing)
   **Assert: response.data.newHp = 32**

3. **Low maxHp — floor(23/16) = 1:**
   healAmount = max(1, floor(23/16)) = max(1, 1) = 1
   newHp = 15 + 1 = 16
   **Assert: response.data.hpHealed = 1** (App-enforced: calculateRestHealing)
   **Assert: response.data.newHp = 16**

4. **Minimum rule still applies (same formula, different start HP):**
   healAmount = max(1, floor(23/16)) = 1
   newHp = 5 + 1 = 6
   **Assert: response.data.hpHealed = 1** (App-enforced: max(1, ...))
   **Assert: response.data.newHp = 6**

5. **Near-full HP cap — heal capped at deficit:**
   healAmount = max(1, floor(40/16)) = 2, but deficit = 40 - 39 = 1
   actualHeal = min(2, 1) = 1
   newHp = 39 + 1 = 40 (full)
   **Assert: response.data.hpHealed = 1** (App-enforced: clamped to maxHp - currentHp)
   **Assert: response.data.newHp = 40** (App-enforced: reaches maxHp)

## Teardown

DELETE /api/pokemon/$high_hp_id
DELETE /api/pokemon/$mid_hp_id
DELETE /api/pokemon/$low_hp_id
DELETE /api/pokemon/$min_hp_id
DELETE /api/pokemon/$cap_hp_id
