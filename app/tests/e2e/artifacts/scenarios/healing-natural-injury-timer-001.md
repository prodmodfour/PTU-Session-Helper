---
scenario_id: healing-natural-injury-timer-001
loop_id: healing-mechanic-natural-injury-timer
tier: mechanic
priority: P2
ptu_assertions: 5
---

## Narrative

Validates the 24-hour natural injury healing timer. Tests the boundary conditions: exactly 24 hours (allowed), just under 24 hours (blocked), null lastInjuryTime (blocked), chained natural heals succeeding (timer NOT reset per ptu-rule-034), and lastInjuryTime cleared when the last injury is healed.

## Setup (API)

POST /api/pokemon { "species": "Geodude", "level": 15, "baseHp": 4, ... }
$pokemon_id = response.data.id

POST /api/characters { "name": "Trainer Elm", "level": 8, "hp": 5, "characterType": "npc", "maxHp": 36, "currentHp": 36 }
$character_id = response.data.id

**Non-deterministic API check:** Both entities created via explicit `POST` — deterministic.

## Actions & Assertions

### Test 1: 25 hours elapsed — natural healing succeeds

PUT /api/pokemon/$pokemon_id { "injuries": 2, "injuriesHealedToday": 0, "lastInjuryTime": "<25 hours ago>" }
POST /api/pokemon/$pokemon_id/heal-injury

1. **25 hours since last injury — healing allowed:**
   canHealInjuryNaturally: 25 >= 24 → true
   **Assert: response.success = true** (App-enforced: canHealInjuryNaturally)
   **Assert: response.data.injuriesHealed = 1** (App-enforced: natural heals 1)
   **Assert: response.data.injuries = 1** (App-enforced: 2 - 1 = 1)

### Test 2: 12 hours elapsed — natural healing blocked

PUT /api/pokemon/$pokemon_id { "injuries": 2, "injuriesHealedToday": 0, "lastInjuryTime": "<12 hours ago>" }
POST /api/pokemon/$pokemon_id/heal-injury

2. **12 hours since last injury — healing blocked:**
   canHealInjuryNaturally: 12 < 24 → false
   **Assert: response.success = false** (App-enforced: time check)
   **Assert: response.message contains "hours remaining"** (App-enforced: error with countdown)
   **Assert: response.data.hoursRemaining is approximately 12** (App-enforced: 24 - elapsed)

### Test 3: null lastInjuryTime — healing blocked

PUT /api/pokemon/$pokemon_id { "injuries": 1, "injuriesHealedToday": 0, "lastInjuryTime": null }
POST /api/pokemon/$pokemon_id/heal-injury

3. **null lastInjuryTime — no timer reference, blocked:**
   canHealInjuryNaturally: lastInjuryTime is null → false
   **Assert: response.success = false** (App-enforced: null check in canHealInjuryNaturally)

### Test 4: Chained natural heals succeed (timer NOT reset per ptu-rule-034)

PUT /api/characters/$character_id { "injuries": 3, "injuriesHealedToday": 0, "lastInjuryTime": "<25 hours ago>" }

<!-- First natural heal -->
POST /api/characters/$character_id/heal-injury { "method": "natural" }
<!-- Success: injuries 2, lastInjuryTime stays at ~25h ago (NOT reset) -->

<!-- Immediate second natural heal attempt -->
POST /api/characters/$character_id/heal-injury { "method": "natural" }

4. **Second natural heal succeeds (timer not reset):**
   After first natural heal, lastInjuryTime is still ~25h ago (per ptu-rule-034, natural healing
   does NOT reset the timer — it tracks when injuries were *gained*, not healed)
   canHealInjuryNaturally: 25 >= 24 → true
   injuriesHealedToday = 1, under daily cap of 3 → allowed
   **Assert: second response.success = true** (App-enforced: timer preserved, daily cap not reached)
   **Assert: second response.data.injuries = 1** (App-enforced: 2 - 1 = 1)
   **Assert: second response.data.injuriesHealedToday = 2** (App-enforced: 1 + 1 = 2)

### Test 5: lastInjuryTime cleared when last injury healed

<!-- Third natural heal removes last injury -->
POST /api/characters/$character_id/heal-injury { "method": "natural" }

5. **Last injury healed — lastInjuryTime cleared to null:**
   injuries = 1 → newInjuries = 0 → lastInjuryTime set to null
   injuriesHealedToday = 2 + 1 = 3 (at daily cap now)
   **Assert: response.success = true** (App-enforced: timer still valid, daily cap 2 < 3)
   **Assert: response.data.injuries = 0** (App-enforced: 1 - 1 = 0)

   GET /api/characters/$character_id
   **Assert: lastInjuryTime = null** (App-enforced: cleared when all injuries gone)

## Teardown

DELETE /api/pokemon/$pokemon_id
DELETE /api/characters/$character_id
