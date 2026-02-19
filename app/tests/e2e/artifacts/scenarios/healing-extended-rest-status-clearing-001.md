---
scenario_id: healing-extended-rest-status-clearing-001
loop_id: healing-mechanic-extended-rest-status-clearing
tier: mechanic
priority: P1
ptu_assertions: 4
---

## Narrative

Validates that extended rest clears only persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) while leaving volatile conditions (Confused, Enraged, etc.) and other conditions (Slowed, Stuck, etc.) intact. Tests with different combinations of persistent, volatile, and other conditions.

## Setup (API)

**Non-deterministic API check:** All entities created via explicit `POST` with base stats — deterministic.

### Test Entity 1: Mix of persistent + volatile
POST /api/pokemon { "species": "Bulbasaur", "level": 15, "baseHp": 5, ... }
$pokemon_1_id = response.data.id
<!-- maxHp = 40 -->
PUT /api/pokemon/$pokemon_1_id {
  "currentHp": 40,
  "statusConditions": ["Burned", "Confused"]
}

### Test Entity 2: All persistent
POST /api/pokemon { "species": "Oddish", "level": 10, "baseHp": 5, ... }
$pokemon_2_id = response.data.id
<!-- maxHp = 35 -->
PUT /api/pokemon/$pokemon_2_id {
  "currentHp": 35,
  "statusConditions": ["Frozen", "Paralyzed", "Poisoned"]
}

### Test Entity 3: All volatile + other (nothing to clear)
POST /api/pokemon { "species": "Geodude", "level": 12, "baseHp": 4, ... }
$pokemon_3_id = response.data.id
<!-- maxHp = 34 -->
PUT /api/pokemon/$pokemon_3_id {
  "currentHp": 34,
  "statusConditions": ["Asleep", "Flinched", "Stuck"]
}

### Test Entity 4: Badly Poisoned + volatile mix
POST /api/pokemon { "species": "Pikachu", "level": 10, "baseHp": 4, ... }
$pokemon_4_id = response.data.id
<!-- maxHp = 32 -->
PUT /api/pokemon/$pokemon_4_id {
  "currentHp": 32,
  "statusConditions": ["Badly Poisoned", "Enraged", "Slowed"]
}

## Actions & Assertions

### Test 1: Burned cleared, Confused survives
POST /api/pokemon/$pokemon_1_id/extended-rest

1. **Persistent Burned cleared, volatile Confused survives:**
   Burned → persistent → cleared
   Confused → volatile → survives
   **Assert: response.data.clearedStatuses = ["Burned"]** (App-enforced: clearPersistentStatusConditions)
   Verify via GET: statusConditions = ["Confused"]

### Test 2: All three persistent conditions cleared
POST /api/pokemon/$pokemon_2_id/extended-rest

2. **All persistent cleared:**
   Frozen → cleared, Paralyzed → cleared, Poisoned → cleared
   **Assert: response.data.clearedStatuses contains "Frozen", "Paralyzed", "Poisoned"** (App-enforced)
   Verify via GET: statusConditions = []

### Test 3: No persistent conditions — nothing cleared
POST /api/pokemon/$pokemon_3_id/extended-rest

3. **No persistent conditions to clear:**
   Asleep → volatile → survives
   Flinched → volatile → survives
   Stuck → other → survives
   **Assert: response.data.clearedStatuses = []** (App-enforced: no persistent found)
   Verify via GET: statusConditions = ["Asleep", "Flinched", "Stuck"]

### Test 4: Badly Poisoned cleared, Enraged + Slowed survive
POST /api/pokemon/$pokemon_4_id/extended-rest

4. **Badly Poisoned cleared, others survive:**
   Badly Poisoned → persistent → cleared
   Enraged → volatile → survives
   Slowed → other → survives
   **Assert: response.data.clearedStatuses = ["Badly Poisoned"]** (App-enforced)
   Verify via GET: statusConditions = ["Enraged", "Slowed"]

## Teardown

DELETE /api/pokemon/$pokemon_1_id
DELETE /api/pokemon/$pokemon_2_id
DELETE /api/pokemon/$pokemon_3_id
DELETE /api/pokemon/$pokemon_4_id
