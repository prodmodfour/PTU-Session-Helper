---
scenario_id: capture-mechanic-status-modifiers-001
loop_id: capture-mechanic-status-modifiers
tier: mechanic
priority: P1
ptu_assertions: 6
---

## Setup (API)

Uses the direct-data mode of the capture rate API. No Pokemon DB record needed.

Requires seeded SpeciesData for Oddish evolution lookup.

All requests use the same base parameters to isolate status effects:
- species: "Oddish" (stage 1/3, evolution modifier +10)
- level: 10 -> levelModifier = -20
- currentHp: 20, maxHp: 40 (50% HP -> hpModifier = 0)
- isShiny: false, injuries: 0

Constant rate without status: 100 + (-20) + 0 + 10 = 90
Each test varies only statusConditions.

**Enforcement boundary:** All assertions are App-enforced (calculateCaptureRate utility).

**PTU Rule (status):** "Persistent Conditions add +10 to the Pokemon's Capture Rate" (core/05-pokemon.md, p215)
**PTU Rule (volatile):** "Injuries and Volatile Conditions add +5" (core/05-pokemon.md, p215)
**PTU Rule (stuck/slow):** "Additionally, Stuck adds +10 to Capture Rate, and Slow adds +5" (core/05-pokemon.md, p215)

**Code note:** Stuck/Trapped and Slowed are in separate lists from Persistent/Volatile. The status loop uses `if/else if` for Persistent vs Volatile, then separate `if` checks for Stuck and Slow. This means Stuck/Slowed add their own modifier fields (stuckModifier, slowModifier) independently of statusModifier.

## Actions & Assertions

### Test 1: Persistent condition (Paralyzed -> +10)

POST /api/capture/rate {
  "level": 10, "currentHp": 20, "maxHp": 40,
  "species": "Oddish", "statusConditions": ["Paralyzed"]
}

1. **Paralyzed (Persistent) -> statusModifier +10:**
   Paralyzed is in PERSISTENT_CONDITIONS -> statusModifier += 10
   captureRate = 90 + 10 = **100**
   **Assert: captureRate = 100, breakdown.statusModifier = 10**

### Test 2: Volatile condition (Confused -> +5)

POST /api/capture/rate {
  "level": 10, "currentHp": 20, "maxHp": 40,
  "species": "Oddish", "statusConditions": ["Confused"]
}

2. **Confused (Volatile) -> statusModifier +5:**
   Confused is in VOLATILE_CONDITIONS -> statusModifier += 5
   captureRate = 90 + 5 = **95**
   **Assert: captureRate = 95, breakdown.statusModifier = 5**

### Test 3: Stuck condition (-> stuckModifier +10)

POST /api/capture/rate {
  "level": 10, "currentHp": 20, "maxHp": 40,
  "species": "Oddish", "statusConditions": ["Stuck"]
}

3. **Stuck -> stuckModifier +10 (separate from statusModifier):**
   Stuck is NOT in PERSISTENT_CONDITIONS or VOLATILE_CONDITIONS (no statusModifier)
   Stuck IS in STUCK_CONDITIONS -> stuckModifier += 10
   captureRate = 90 + 10 = **100**
   **Assert: captureRate = 100, breakdown.stuckModifier = 10, breakdown.statusModifier = 0**

### Test 4: Slow condition (Slowed -> slowModifier +5)

POST /api/capture/rate {
  "level": 10, "currentHp": 20, "maxHp": 40,
  "species": "Oddish", "statusConditions": ["Slowed"]
}

4. **Slowed -> slowModifier +5 (separate from statusModifier):**
   Slowed is NOT in PERSISTENT_CONDITIONS or VOLATILE_CONDITIONS
   Slowed IS in SLOW_CONDITIONS -> slowModifier += 5
   captureRate = 90 + 5 = **95**
   **Assert: captureRate = 95, breakdown.slowModifier = 5, breakdown.statusModifier = 0**

### Test 5: Stacked conditions (Paralyzed + Confused -> +15)

POST /api/capture/rate {
  "level": 10, "currentHp": 20, "maxHp": 40,
  "species": "Oddish", "statusConditions": ["Paralyzed", "Confused"]
}

5. **Stacked Persistent + Volatile:**
   Paralyzed (Persistent) -> statusModifier += 10
   Confused (Volatile) -> statusModifier += 5
   Total statusModifier = 15
   captureRate = 90 + 15 = **105**
   **Assert: captureRate = 105, breakdown.statusModifier = 15**

### Test 6: Mixed conditions (Burned + Stuck + Slowed -> +25)

POST /api/capture/rate {
  "level": 10, "currentHp": 20, "maxHp": 40,
  "species": "Oddish", "statusConditions": ["Burned", "Stuck", "Slowed"]
}

6. **Mixed status + stuck + slow (all three modifier fields):**
   Burned (Persistent) -> statusModifier += 10
   Stuck (not Persistent/Volatile) -> stuckModifier += 10
   Slowed (not Persistent/Volatile) -> slowModifier += 5
   Total contribution = 10 + 10 + 5 = 25
   captureRate = 90 + 25 = **115**
   **Assert: captureRate = 115, breakdown.statusModifier = 10, breakdown.stuckModifier = 10, breakdown.slowModifier = 5**

## Teardown

No cleanup needed.
