---
scenario_id: healing-workflow-post-combat-quick-rest-001
loop_id: healing-workflow-post-combat-quick-rest
tier: workflow
priority: P0
ptu_assertions: 5
mechanics_tested:
  - rest-hp-calculation
  - daily-rest-cap
  - daily-counter-auto-reset
---

## Narrative

Combat just ended and the party's Bulbasaur took a beating. The GM navigates to the Pokemon's sheet and uses the 30-minute rest option twice to patch it up before the next encounter. Each rest heals 1/16th of max HP (minimum 1). The scenario verifies the rest formula, cumulative HP recovery, and rest minute tracking.

## Species Data

**Bulbasaur** (gen1/bulbasaur.md)
- Type: Grass/Poison
- Base Stats: HP 5, ATK 5, DEF 5, SpATK 7, SpDEF 7, SPD 5

**Non-deterministic API check:** Pokemon created via `POST /api/pokemon` with explicit base stats — deterministic. HP = level + (baseHp × 3) + 10. No random stat points distributed.

## Setup (API)

POST /api/pokemon {
  "species": "Bulbasaur",
  "level": 15,
  "baseHp": 5,
  "baseAttack": 5,
  "baseDefense": 5,
  "baseSpAtk": 7,
  "baseSpDef": 7,
  "baseSpeed": 5,
  "types": ["Grass", "Poison"]
}
$pokemon_id = response.data.id
<!-- maxHp = 15 + (5 × 3) + 10 = 40 -->

PUT /api/pokemon/$pokemon_id {
  "currentHp": 30
}
<!-- Simulate post-combat damage: 10 HP lost -->

## Phase 1: Pre-Rest State Verification

GET /api/pokemon/$pokemon_id

### Assertions (Phase 1)

1. **Initial HP state:**
   maxHp = level(15) + (baseHp(5) × 3) + 10 = 40
   currentHp = 30 (set in setup)
   **Assert: currentHp = 30, maxHp = 40** (App-enforced: explicit creation + PUT)

## Phase 2: First 30-Minute Rest

POST /api/pokemon/$pokemon_id/rest

### Assertions (Phase 2)

2. **Rest healing calculation:**
   healAmount = max(1, floor(40 / 16)) = max(1, 2) = 2
   newHp = 30 + 2 = 32
   **Assert: response.success = true** (App-enforced: calculateRestHealing)
   **Assert: response.data.hpHealed = 2** (App-enforced: floor(maxHp/16))
   **Assert: response.data.newHp = 32** (App-enforced: currentHp + hpHealed)

3. **Rest minutes tracked:**
   restMinutesToday: 0 + 30 = 30
   restMinutesRemaining: 480 - 30 = 450
   **Assert: response.data.restMinutesToday = 30** (App-enforced: increment by 30)
   **Assert: response.data.restMinutesRemaining = 450** (App-enforced: 480 - restMinutesToday)

## Phase 3: Second 30-Minute Rest

POST /api/pokemon/$pokemon_id/rest

### Assertions (Phase 3)

4. **Cumulative healing:**
   healAmount = max(1, floor(40 / 16)) = 2 (same formula, same maxHp)
   newHp = 32 + 2 = 34
   **Assert: response.data.hpHealed = 2** (App-enforced: calculateRestHealing)
   **Assert: response.data.newHp = 34** (App-enforced: cumulative)

5. **Cumulative rest minutes:**
   restMinutesToday: 30 + 30 = 60
   restMinutesRemaining: 480 - 60 = 420
   **Assert: response.data.restMinutesToday = 60** (App-enforced: increment by 30)
   **Assert: response.data.restMinutesRemaining = 420** (App-enforced: 480 - restMinutesToday)

## Phase 4: Post-Rest Verification

GET /api/pokemon/$pokemon_id

### Assertions (Phase 4 — implicit)

Verify the DB was updated correctly:
- currentHp = 34 (30 + 2 + 2)
- restMinutesToday = 60

These are already covered by Phase 2-3 response assertions but confirm DB persistence.

## Teardown

DELETE /api/pokemon/$pokemon_id
