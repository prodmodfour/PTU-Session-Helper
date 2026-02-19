---
scenario_id: healing-daily-injury-cap-001
loop_id: healing-mechanic-daily-injury-cap
tier: mechanic
priority: P1
ptu_assertions: 4
---

## Narrative

Validates the shared daily injury healing cap of 3 across all healing sources. Tests that the cap is correctly enforced by Pokemon Center, natural healing, and AP drain — and that injuries healed earlier in the day (from any source) count toward the shared total.

## Setup (API)

POST /api/pokemon { "species": "Geodude", "level": 15, "baseHp": 4, ... }
$pokemon_id = response.data.id
<!-- maxHp = 37 -->

POST /api/characters { "name": "Trainer Oak", "level": 12, "hp": 5, "characterType": "npc", "maxHp": 49, "currentHp": 49 }
$character_id = response.data.id

**Non-deterministic API check:** Both entities created via explicit `POST` — deterministic.

## Actions & Assertions

### Test 1: Pokemon Center heals up to 3 injuries (from 5)

PUT /api/pokemon/$pokemon_id { "currentHp": 10, "injuries": 5, "injuriesHealedToday": 0, "lastRestReset": "<today's ISO timestamp>" }
POST /api/pokemon/$pokemon_id/pokemon-center

1. **Pokemon Center caps at 3 injuries/day:**
   injuries = 5, injuriesHealedToday = 0
   maxHealable = max(0, 3 - 0) = 3
   injuriesHealed = min(5, 3) = 3
   **Assert: response.data.injuriesHealed = 3** (App-enforced: calculatePokemonCenterInjuryHealing)
   **Assert: response.data.injuriesRemaining = 2** (App-enforced: 5 - 3 = 2)
   **Assert: response.data.injuriesHealedToday = 3** (App-enforced: counter updated)

### Test 2: Pokemon Center with partial prior usage

PUT /api/pokemon/$pokemon_id { "currentHp": 10, "injuries": 4, "injuriesHealedToday": 2, "lastRestReset": "<today's ISO timestamp>" }
POST /api/pokemon/$pokemon_id/pokemon-center

2. **Prior heals reduce remaining capacity:**
   injuries = 4, injuriesHealedToday = 2
   maxHealable = max(0, 3 - 2) = 1
   injuriesHealed = min(4, 1) = 1
   **Assert: response.data.injuriesHealed = 1** (App-enforced: shared daily cap)
   **Assert: response.data.injuriesRemaining = 3** (App-enforced: 4 - 1 = 3)
   **Assert: response.data.injuriesHealedToday = 3** (App-enforced: 2 + 1 = 3)

### Test 3: Pokemon Center at daily cap (0 injuries healed)

PUT /api/pokemon/$pokemon_id { "currentHp": 10, "injuries": 3, "injuriesHealedToday": 3, "lastRestReset": "<today's ISO timestamp>" }
POST /api/pokemon/$pokemon_id/pokemon-center

3. **Already at cap — 0 injuries healed:**
   injuries = 3, injuriesHealedToday = 3
   maxHealable = max(0, 3 - 3) = 0
   HP still fully restored, statuses still cleared — only injury healing is blocked
   **Assert: response.data.injuriesHealed = 0** (App-enforced: daily cap reached)
   **Assert: response.data.atDailyInjuryLimit = true** (App-enforced: boolean flag)
   **Assert: response.data.injuriesRemaining = 3** (App-enforced: unchanged)
   **Assert: response.success = true** (App-enforced: PC still heals HP/status even at injury cap)

### Test 4: Character heal-injury blocked at daily cap

PUT /api/characters/$character_id { "injuries": 2, "injuriesHealedToday": 3, "lastInjuryTime": "<25 hours ago>", "lastRestReset": "<today's ISO timestamp>" }
POST /api/characters/$character_id/heal-injury { "method": "drain_ap" }

4. **AP drain blocked by shared daily cap:**
   injuriesHealedToday = 3 → cap reached
   **Assert: response.success = false** (App-enforced: injuriesHealedToday >= 3)
   **Assert: response.message contains "Daily injury healing limit"** (App-enforced: error message)

## Teardown

DELETE /api/pokemon/$pokemon_id
DELETE /api/characters/$character_id
