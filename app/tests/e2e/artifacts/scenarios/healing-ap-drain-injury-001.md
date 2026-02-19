---
scenario_id: healing-ap-drain-injury-001
loop_id: healing-mechanic-ap-drain-injury
tier: mechanic
priority: P2
ptu_assertions: 4
---

## Narrative

Validates the AP drain injury healing mechanic — trainers only. Drains 2 AP per injury healed, no 24-hour timer required (unlike natural healing). Tests the AP accumulation across multiple drains, the daily cap interaction, and that the lastInjuryTime is NOT reset by AP drain (only natural healing resets it).

## Setup (API)

POST /api/characters { "name": "Trainer Surge", "level": 15, "hp": 6, "characterType": "npc", "maxHp": 58, "currentHp": 58 }
$character_id = response.data.id
<!-- maxHp = (15 × 2) + (6 × 3) + 10 = 58 -->

**Non-deterministic API check:** Character created via explicit `POST` — deterministic.

## Actions & Assertions

### Test 1: First AP drain — costs 2 AP

PUT /api/characters/$character_id {
  "injuries": 3,
  "injuriesHealedToday": 0,
  "drainedAp": 0,
  "lastInjuryTime": "<2 hours ago>"
}
<!-- lastInjuryTime only 2h ago — natural healing unavailable, but AP drain doesn't check time -->

POST /api/characters/$character_id/heal-injury { "method": "drain_ap" }

1. **AP drain succeeds without time requirement:**
   No 24h timer check for drain_ap method
   **Assert: response.success = true** (App-enforced: drain_ap skips time check)
   **Assert: response.data.injuries = 2** (App-enforced: 3 - 1 = 2)
   **Assert: response.data.drainedAp = 2** (App-enforced: 0 + 2 = 2)
   **Assert: response.data.injuriesHealedToday = 1** (App-enforced: counter incremented)

### Test 2: Second AP drain — AP accumulates

POST /api/characters/$character_id/heal-injury { "method": "drain_ap" }

2. **AP accumulates across drains:**
   **Assert: response.data.injuries = 1** (App-enforced: 2 - 1 = 1)
   **Assert: response.data.drainedAp = 4** (App-enforced: 2 + 2 = 4)
   **Assert: response.data.injuriesHealedToday = 2** (App-enforced: 1 + 1 = 2)

### Test 3: Third AP drain — heals last injury, nulls lastInjuryTime

POST /api/characters/$character_id/heal-injury { "method": "drain_ap" }

3. **Last injury healed — lastInjuryTime set to null:**
   injuries = 1 - 1 = 0 → no injuries remain → lastInjuryTime = null
   **Assert: response.data.injuries = 0** (App-enforced: 1 - 1 = 0)
   **Assert: response.data.drainedAp = 6** (App-enforced: 4 + 2 = 6)
   **Assert: response.data.injuriesHealedToday = 3** (App-enforced: at daily cap now)
   Verify via GET: lastInjuryTime = null

### Test 4: Verify lastInjuryTime was NOT reset during AP drain (before final heal)

This test verifies the distinction from natural healing. Set up a character with lastInjuryTime, drain AP, and confirm lastInjuryTime is preserved (not reset to now).

PUT /api/characters/$character_id {
  "injuries": 2,
  "injuriesHealedToday": 0,
  "drainedAp": 0,
  "lastInjuryTime": "<25 hours ago>"
}

POST /api/characters/$character_id/heal-injury { "method": "drain_ap" }
<!-- 1 injury remains after drain -->

GET /api/characters/$character_id

4. **AP drain preserves lastInjuryTime (unlike natural healing):**
   After AP drain with 1 injury remaining:
   Natural healing would reset lastInjuryTime to now
   AP drain does NOT modify lastInjuryTime
   **Assert: lastInjuryTime is still ~25 hours ago (not reset to now)** (App-enforced: drain_ap doesn't touch lastInjuryTime)
   This means natural healing is still available immediately if the 24h has passed.

## Teardown

DELETE /api/characters/$character_id
