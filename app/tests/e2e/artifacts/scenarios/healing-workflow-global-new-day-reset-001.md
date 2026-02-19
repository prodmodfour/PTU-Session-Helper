---
scenario_id: healing-workflow-global-new-day-reset-001
loop_id: healing-workflow-global-new-day-reset
tier: workflow
priority: P0
ptu_assertions: 6
mechanics_tested:
  - new-day-counter-reset
  - new-day-scope
---

## Narrative

It's a new in-game day. The GM triggers the global new day reset. Trainer Red has been resting all day (300 minutes), healed 2 injuries, and drained 4 AP. His Pikachu has maxed out rest time (480 min) and hit the injury healing cap (3/day). The GM calls the new day endpoint to reset all daily counters. The scenario verifies that daily limits reset but HP, injuries, status conditions, and lastInjuryTime are preserved.

## Entity Data

**Non-deterministic API check:** Both entities created via explicit `POST` with base stats — deterministic.

## Setup (API)

POST /api/characters {
  "name": "Trainer Red",
  "level": 5,
  "hp": 4,
  "characterType": "player",
  "maxHp": 32,
  "currentHp": 32
}
$character_id = response.data.id
<!-- Character maxHp = (5 × 2) + (4 × 3) + 10 = 32 -->

PUT /api/characters/$character_id {
  "currentHp": 25,
  "injuries": 2,
  "statusConditions": ["Burned"],
  "restMinutesToday": 300,
  "injuriesHealedToday": 2,
  "drainedAp": 4,
  "lastInjuryTime": "<12 hours ago ISO timestamp>"
}

POST /api/pokemon {
  "species": "Pikachu",
  "level": 10,
  "baseHp": 4,
  "baseAttack": 6,
  "baseDefense": 3,
  "baseSpAtk": 5,
  "baseSpDef": 4,
  "baseSpeed": 9,
  "types": ["Electric"]
}
$pokemon_id = response.data.id
<!-- Pokemon maxHp = 10 + (4 × 3) + 10 = 32 -->

PUT /api/pokemon/$pokemon_id {
  "currentHp": 20,
  "injuries": 1,
  "restMinutesToday": 480,
  "injuriesHealedToday": 3,
  "lastInjuryTime": "<6 hours ago ISO timestamp>"
}

## Phase 1: Trigger Global New Day

POST /api/game/new-day

### Assertions (Phase 1)

1. **Global reset succeeds:**
   **Assert: response.success = true** (App-enforced: updateMany on both tables)
   **Assert: response.data.pokemonReset >= 1** (App-enforced: at least our test Pokemon)
   **Assert: response.data.charactersReset >= 1** (App-enforced: at least our test character)
   **Assert: response.data.timestamp is a valid ISO datetime** (App-enforced: server timestamp)

## Phase 2: Verify Character Counters Reset

GET /api/characters/$character_id

### Assertions (Phase 2)

2. **Character daily counters reset:**
   **Assert: restMinutesToday = 0** (App-enforced: new-day resets rest counter)
   **Assert: injuriesHealedToday = 0** (App-enforced: new-day resets injury counter)
   **Assert: drainedAp = 0** (App-enforced: new-day resets drained AP for characters)

3. **Character non-daily state preserved:**
   **Assert: currentHp = 25** (App-enforced: new-day does NOT touch HP)
   **Assert: injuries = 2** (App-enforced: new-day does NOT touch injuries)
   **Assert: statusConditions includes "Burned"** (App-enforced: new-day does NOT touch statuses)
   **Assert: lastInjuryTime is not null** (App-enforced: new-day does NOT touch lastInjuryTime)

## Phase 3: Verify Pokemon Counters Reset

GET /api/pokemon/$pokemon_id

### Assertions (Phase 3)

4. **Pokemon daily counters reset:**
   **Assert: restMinutesToday = 0** (App-enforced: new-day resets rest counter)
   **Assert: injuriesHealedToday = 0** (App-enforced: new-day resets injury counter)

5. **Pokemon non-daily state preserved:**
   **Assert: currentHp = 20** (App-enforced: new-day does NOT touch HP)
   **Assert: injuries = 1** (App-enforced: new-day does NOT touch injuries)
   **Assert: lastInjuryTime is not null** (App-enforced: new-day does NOT touch lastInjuryTime)

## Phase 4: Verify Rest Now Available After Reset

POST /api/pokemon/$pokemon_id/rest
<!-- Was blocked at 480 min before new day; now at 0 min, should succeed -->

### Assertions (Phase 4)

6. **Rest now available after daily reset:**
   restMinutesToday was 480 (blocked) → now 0 (available)
   healPerRest = max(1, floor(32 / 16)) = 2
   **Assert: response.success = true** (App-enforced: restMinutesToday < 480 after reset)
   **Assert: response.data.hpHealed = 2** (App-enforced: floor(32/16) = 2)

## Teardown

DELETE /api/pokemon/$pokemon_id
DELETE /api/characters/$character_id
