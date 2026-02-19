---
scenario_id: healing-pokemon-center-time-001
verified_at: 2026-02-19T10:00:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1: 0 injuries — 60 min base time
- **Scenario says:** healingTime = 60, healingTimeDescription = "1 hour"
- **Independent derivation:** PTU p.252: "In a mere hour, Pokemon Centers can heal..." — base time is 60 minutes. 0 injuries means 0 extra time. `calculatePokemonCenterTime(0)`: baseTime=60, injuryTime = 0 * 30 = 0, totalTime = 60. Format: 60/60 = 1 hour, 0 min remainder -> "1 hour".
- **Implementation check:** `utils/restHealing.ts` lines 68-98 — `calculatePokemonCenterTime(0)` returns `{ baseTime: 60, injuryTime: 0, totalTime: 60, timeDescription: "1 hour" }`. Confirmed.
- **Status:** CORRECT

### Assertion 2: 3 injuries at 30 min each
- **Scenario says:** healingTime = 150, healingTimeDescription = "2 hours 30 min"
- **Independent derivation:** PTU p.252: "For each Injury ... Healing takes an additional 30 minutes." 3 < 5, so 30 min/injury. baseTime=60, injuryTime = 3 * 30 = 90, totalTime = 150. Format: 150/60 = 2 hours, 30 min remainder -> "2 hours 30 min".
- **Implementation check:** `calculatePokemonCenterTime(3)`: injuries < 5, so `injuryTime = 3 * 30 = 90`. totalTime = 60 + 90 = 150. timeDescription = "2 hours 30 min". Confirmed.
- **Status:** CORRECT

### Assertion 3: 4 injuries — just under threshold
- **Scenario says:** healingTime = 180, healingTimeDescription = "3 hours"
- **Independent derivation:** 4 < 5, uses 30 min/injury path. baseTime=60, injuryTime = 4 * 30 = 120, totalTime = 180. Format: 180/60 = 3 hours, 0 min remainder -> "3 hours".
- **Implementation check:** `calculatePokemonCenterTime(4)`: 4 < 5 -> injuryTime = 4 * 30 = 120. totalTime = 60 + 120 = 180. timeDescription = "3 hours". Confirmed.
- **Status:** CORRECT

### Assertion 4: 5 injuries — at threshold, switches to 60 min each
- **Scenario says:** healingTime = 360, healingTimeDescription = "6 hours"
- **Independent derivation:** PTU p.252: "If the Trainer or Pokemon has five or more Injuries, it takes one additional hour per Injury instead." 5 >= 5, so 60 min/injury. baseTime=60, injuryTime = 5 * 60 = 300, totalTime = 360. Format: 360/60 = 6 hours, 0 min remainder -> "6 hours".
- **Implementation check:** `calculatePokemonCenterTime(5)`: injuries >= 5 -> injuryTime = 5 * 60 = 300. totalTime = 60 + 300 = 360. timeDescription = "6 hours". Confirmed.
- **Status:** CORRECT

## Data Validity

- [x] Bulbasaur (gen1/bulbasaur.md): HP 5 — scenario uses baseHp 5. Match.
- [x] Oddish (gen1/oddish.md): HP 5 — scenario uses baseHp 5. Match.
- [x] Geodude (gen1/geodude.md): HP 4 — scenario uses baseHp 4. Match.
- [x] Machop (gen1/machop.md): HP 7 — scenario uses baseHp 7. Match.
- [x] All Pokemon created via explicit POST with base stats — deterministic creation confirmed.

## Completeness Check

- [x] Zero injuries (base time only)
- [x] Below threshold (3 injuries at 30 min each)
- [x] Boundary just below threshold (4 injuries at 30 min each)
- [x] At threshold (5 injuries switches to 60 min each)
- [x] Dramatic jump from 180 min (4 injuries) to 360 min (5 injuries) correctly documented
- [x] No AP-related assertions in this scenario — unaffected by ptu-rule-038 code change

## Errata Check

- No errata in errata-2.md affects Pokemon Center time calculation. The errata covers Cheerleader, Medic, Capture mechanics, Poke Edges, and Tutor Move changes — none relevant.

## Issues Found

None. This scenario is purely about healing time calculation. The ptu-rule-038 code change (removing AP restoration from Pokemon Centers) does not affect this scenario because it never asserts on AP.
