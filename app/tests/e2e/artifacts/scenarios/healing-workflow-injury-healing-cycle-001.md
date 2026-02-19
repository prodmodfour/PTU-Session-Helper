---
scenario_id: healing-workflow-injury-healing-cycle-001
loop_id: healing-workflow-injury-healing-cycle
tier: workflow
priority: P0
ptu_assertions: 6
mechanics_tested:
  - natural-injury-healing-timer
  - ap-drain-injury-healing
  - daily-injury-cap
  - last-injury-time-tracking
---

## Narrative

Trainer Oak has 4 injuries from a brutal encounter. One injury was sustained over 25 hours ago, so natural healing is available. The GM heals one injury naturally, then uses AP drain to heal a second. A third AP drain hits the daily cap of 3 (1 was already healed today from a Bandage earlier). The remaining 2 injuries must wait for a new day. Note: natural healing does NOT reset lastInjuryTime (per ptu-rule-034), so the daily cap is the sole limiter for chained heals.

## Entity Data

**Trainer Oak** — Character, level 12, hp 5
- maxHp = (12 × 2) + (5 × 3) + 10 = 49 (not relevant for injury healing, included for completeness)

**Non-deterministic API check:** Character created via explicit `POST` with explicit maxHp/currentHp — deterministic.

## Setup (API)

POST /api/characters {
  "name": "Trainer Oak",
  "level": 12,
  "hp": 5,
  "characterType": "npc",
  "maxHp": 49,
  "currentHp": 49
}
$character_id = response.data.id

PUT /api/characters/$character_id {
  "injuries": 4,
  "injuriesHealedToday": 1,
  "lastInjuryTime": "<25 hours ago ISO timestamp>",
  "lastRestReset": "<today's ISO timestamp>"
}
<!-- injuriesHealedToday: 1 simulates a prior Bandage use; 2 more heals available today -->

## Phase 1: Natural Injury Healing

POST /api/characters/$character_id/heal-injury { "method": "natural" }

### Assertions (Phase 1)

1. **Natural healing succeeds (24h elapsed):**
   lastInjuryTime was 25 hours ago → canHealInjuryNaturally = true
   injuriesHealedToday was 1, under daily cap of 3 → allowed
   **Assert: response.success = true** (App-enforced: canHealInjuryNaturally + daily cap check)
   **Assert: response.data.injuriesHealed = 1** (App-enforced: natural heals 1 at a time)
   **Assert: response.data.injuries = 3** (App-enforced: 4 - 1 = 3)
   **Assert: response.data.injuriesHealedToday = 2** (App-enforced: 1 + 1 = 2)

## Phase 2: AP Drain Injury Healing

POST /api/characters/$character_id/heal-injury { "method": "drain_ap" }

### Assertions (Phase 2)

2. **AP drain succeeds (no time requirement):**
   injuriesHealedToday = 2, under daily cap of 3 → allowed
   **Assert: response.success = true** (App-enforced: daily cap check, no 24h requirement)
   **Assert: response.data.injuries = 2** (App-enforced: 3 - 1 = 2)
   **Assert: response.data.drainedAp = 2** (App-enforced: +2 AP drained)
   **Assert: response.data.injuriesHealedToday = 3** (App-enforced: 2 + 1 = 3)

## Phase 3: Daily Cap Blocks Third Heal

POST /api/characters/$character_id/heal-injury { "method": "drain_ap" }

### Assertions (Phase 3)

3. **Daily cap blocks healing:**
   injuriesHealedToday = 3 (at cap)
   injuries = 2 (still has injuries, but cap reached)
   **Assert: response.success = false** (App-enforced: injuriesHealedToday >= 3)
   **Assert: response.message contains "Daily injury healing limit"** (App-enforced: error message)

4. **Injuries unchanged after blocked attempt:**
   **Assert: response.data.injuries = 2** (App-enforced: no change on failure)
   **Assert: response.data.injuriesHealedToday = 3** (App-enforced: no change on failure)

## Phase 4: Verify Natural Heal Also Blocked by Daily Cap

POST /api/characters/$character_id/heal-injury { "method": "natural" }

### Assertions (Phase 4)

5. **Natural heal blocked by daily cap:**
   injuriesHealedToday = 3 (at cap) → blocked before time check is reached
   Note: lastInjuryTime is still ~25h ago (natural healing does NOT reset it per ptu-rule-034),
   so the timer alone would NOT block this attempt. The daily cap is the sole blocker.
   **Assert: response.success = false** (App-enforced: daily cap checked first)

## Phase 5: Post-Cycle Verification

GET /api/characters/$character_id

### Assertions (Phase 5)

6. **Final state after healing cycle:**
   **Assert: injuries = 2** (App-enforced: 4 - 1 (natural) - 1 (AP drain) = 2)
   **Assert: injuriesHealedToday = 3** (App-enforced: 1 prior + 1 natural + 1 AP drain = 3)
   **Assert: drainedAp = 2** (App-enforced: one AP drain of 2)
   **Assert: lastInjuryTime is not null** (App-enforced: injuries remain, timer set)

## Teardown

DELETE /api/characters/$character_id
