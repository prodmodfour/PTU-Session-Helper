---
scenario_id: capture-mechanic-cannot-capture-fainted-001
loop_id: capture-mechanic-cannot-capture-fainted
tier: mechanic
priority: P2
ptu_assertions: 3
---

## Setup (API)

POST /api/characters {
  "name": "Trainer Dawn",
  "level": 5,
  "type": "player"
}
$trainer_id = response.data.id

POST /api/pokemon {
  "species": "Oddish",
  "level": 5,
  "baseHp": 5,
  "baseAttack": 5,
  "baseDefense": 6,
  "baseSpAtk": 8,
  "baseSpDef": 7,
  "baseSpeed": 3,
  "types": ["Grass", "Poison"]
}
$oddish_id = response.data.id
<!-- maxHp = 5 + (5 x 3) + 10 = 30 -->

<!-- Set HP to 0 to simulate a fainted Pokemon -->
PUT /api/pokemon/$oddish_id { "currentHp": 0 }

**PTU Rule:** "Pokemon reduced to 0 Hit Points or less cannot be captured. Poke Balls will simply fail to attempt to energize them." (core/05-pokemon.md, p214)

**Enforcement boundary:** Faint check is App-enforced. `canBeCaptured = currentHp > 0` in calculateCaptureRate (line 77). Early return in attempt.post.ts before `attemptCapture()` is called — no roll is made.

## Actions & Assertions

### Test 1: Rate API rejects fainted Pokemon

POST /api/capture/rate { "pokemonId": $oddish_id }

1. **canBeCaptured is false when currentHp = 0:**
   canBeCaptured = currentHp > 0 -> 0 > 0 = false
   **Assert: response.data.canBeCaptured === false**
   (App-enforced: calculateCaptureRate)

### Test 2: Attempt API rejects fainted Pokemon

POST /api/capture/attempt {
  "pokemonId": $oddish_id,
  "trainerId": $trainer_id
}

2. **Capture rejected with reason — no roll made:**
   attempt.post.ts checks `rateResult.canBeCaptured` before calling `attemptCapture()`
   Returns early with `success: false` and a reason string
   **Assert: response.data.captured === false**
   **Assert: response.data.reason === "Pokemon is at 0 HP and cannot be captured"**
   (App-enforced: attempt.post.ts early return)

3. **No capture roll was made:**
   Since the early return happens before `attemptCapture()`, no 1d100 roll is generated.
   The response should not contain roll/modifiedRoll fields (different response shape than normal attempts).
   **Assert: response.data.roll is undefined** (no roll field in fainted-rejection response)
   (App-enforced: early return produces minimal response shape)

## Teardown

DELETE /api/pokemon/$oddish_id
DELETE /api/characters/$trainer_id
