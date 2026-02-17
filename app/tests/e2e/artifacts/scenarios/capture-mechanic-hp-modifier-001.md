---
scenario_id: capture-mechanic-hp-modifier-001
loop_id: capture-mechanic-hp-modifier
tier: mechanic
priority: P1
ptu_assertions: 6
---

## Setup (API)

Uses the direct-data mode of the capture rate API (`POST /api/capture/rate` with level, currentHp, maxHp). No Pokemon DB record created for most tests.

Requires seeded SpeciesData for Oddish evolution lookup.

All requests use the same base parameters to isolate the HP modifier:
- species: "Oddish" (SpeciesData lookup: stage 1, `Math.max(3,1)` = 3, remaining 2, modifier +10)
- level: 10 -> levelModifier = -20
- maxHp: 40
- isShiny: false, no statusConditions, injuries: 0

Constant rate components: 100 + (-20) + 10 = 90
Each test varies only currentHp.

**Enforcement boundary:** All assertions are App-enforced (calculateCaptureRate utility, tested via rate API).

**PTU Rule:** "If the Pokemon is above 75% Hit Points, subtract 30...at 75% or lower, subtract 15...at 50% or lower, the Capture Rate is unmodified...at 25% or lower, add a total of +15...at exactly 1 Hit Point, add a total of +30" (core/05-pokemon.md, p214)

## Actions & Assertions

### Test 1: Above 75% HP -> -30

POST /api/capture/rate {
  "level": 10, "currentHp": 40, "maxHp": 40, "species": "Oddish"
}

1. **Full HP (100%) -> hpModifier = -30:**
   hpPercentage = (40/40) x 100 = 100%
   100% > 75% -> hpModifier = -30
   captureRate = 90 + (-30) = **60**
   **Assert: captureRate = 60, breakdown.hpModifier = -30**

### Test 2: At exactly 75% HP -> -15

POST /api/capture/rate {
  "level": 10, "currentHp": 30, "maxHp": 40, "species": "Oddish"
}

2. **Boundary: 75% HP -> hpModifier = -15:**
   hpPercentage = (30/40) x 100 = 75%
   Code: currentHp !== 1, then hpPercentage <= 25? No (75 > 25). hpPercentage <= 50? No (75 > 50). hpPercentage <= 75? Yes -> -15
   captureRate = 90 + (-15) = **75**
   **Assert: captureRate = 75, breakdown.hpModifier = -15**

### Test 3: At exactly 50% HP -> 0

POST /api/capture/rate {
  "level": 10, "currentHp": 20, "maxHp": 40, "species": "Oddish"
}

3. **Boundary: 50% HP -> hpModifier = 0:**
   hpPercentage = (20/40) x 100 = 50%
   Code: currentHp !== 1, hpPercentage <= 25? No. hpPercentage <= 50? Yes -> 0
   captureRate = 90 + 0 = **90**
   **Assert: captureRate = 90, breakdown.hpModifier = 0**

### Test 4: At exactly 25% HP -> +15

POST /api/capture/rate {
  "level": 10, "currentHp": 10, "maxHp": 40, "species": "Oddish"
}

4. **Boundary: 25% HP -> hpModifier = +15:**
   hpPercentage = (10/40) x 100 = 25%
   Code: currentHp !== 1 (10 != 1), hpPercentage <= 25? Yes (25 <= 25) -> +15
   captureRate = 90 + 15 = **105**
   **Assert: captureRate = 105, breakdown.hpModifier = 15**

### Test 5: Exactly 1 HP -> +30 (special case)

POST /api/capture/rate {
  "level": 10, "currentHp": 1, "maxHp": 40, "species": "Oddish"
}

5. **Special case: 1 HP -> hpModifier = +30 (checked before percentage tiers):**
   Code: currentHp === 1 -> +30 (line 90, before any percentage check)
   hpPercentage = (1/40) x 100 = 2.5%, but the 1 HP check takes priority
   Even with high maxHp (e.g., 200), currentHp === 1 always gets +30
   captureRate = 90 + 30 = **120**
   **Assert: captureRate = 120, breakdown.hpModifier = 30**

### Test 6: At 0 HP -> cannot be captured

POST /api/capture/rate {
  "level": 10, "currentHp": 0, "maxHp": 40, "species": "Oddish"
}

6. **0 HP -> canBeCaptured = false:**
   canBeCaptured = currentHp > 0 -> 0 > 0 = false
   PTU: "Pokemon reduced to 0 Hit Points or less cannot be captured"
   **Assert: canBeCaptured = false**

## Teardown

No cleanup needed (no DB records created by direct-data rate calls).
