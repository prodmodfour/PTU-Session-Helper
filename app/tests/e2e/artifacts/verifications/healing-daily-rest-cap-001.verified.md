---
scenario_id: healing-daily-rest-cap-001
verified_at: 2026-02-19T12:00:00Z
status: PASS
assertions_checked: 8
assertions_correct: 8
---

## Assertion Verification

### Test 1: 450 min — one more rest allowed

#### Assertion 1.1: response.success = true
- **Scenario says:** `restMinutesToday = 450 < 480 -> canHeal = true`
- **Independent derivation:** `calculateRestHealing` checks `restMinutesToday >= 480`. Since 450 < 480, gate passes. Also checks `injuries >= 5` (0 < 5, pass) and `currentHp >= maxHp` (20 < 40, pass). All three gates pass so `canHeal = true`.
- **Implementation check:** `app/utils/restHealing.ts` line 40: `if (restMinutesToday >= 480)` — 450 does not trigger. `app/server/api/pokemon/[id]/rest.post.ts` line 51: `if (!result.canHeal)` — canHeal is true, success path taken.
- **Status:** CORRECT

#### Assertion 1.2: response.data.hpHealed = 2
- **Scenario says:** `healAmount = max(1, floor(40/16)) = 2`
- **Independent derivation:** `floor(40 / 16) = floor(2.5) = 2`. `max(1, 2) = 2`. `actualHeal = min(2, 40 - 20) = min(2, 20) = 2`.
- **Implementation check:** `app/utils/restHealing.ts` line 50: `Math.max(1, Math.floor(40 / 16))` = 2. Line 51: `Math.min(2, 40 - 20)` = 2.
- **Status:** CORRECT

#### Assertion 1.3: response.data.restMinutesToday = 480
- **Scenario says:** `450 + 30 = 480`
- **Independent derivation:** `newRestMinutes = restMinutesToday + 30 = 450 + 30 = 480`
- **Implementation check:** `rest.post.ts` line 66: `const newRestMinutes = restMinutesToday + 30` = 480. Returned at line 85.
- **Status:** CORRECT

#### Assertion 1.4: response.data.restMinutesRemaining = 0
- **Scenario says:** `480 - 480 = 0`
- **Independent derivation:** `Math.max(0, 480 - 480) = 0`
- **Implementation check:** `rest.post.ts` line 86: `restMinutesRemaining: Math.max(0, 480 - newRestMinutes)` = `Math.max(0, 0)` = 0.
- **Status:** CORRECT

### Test 2: 480 min — at cap, rest blocked

#### Assertion 2.1: response.success = false
- **Scenario says:** `restMinutesToday = 480 >= 480 -> canHeal = false`
- **Independent derivation:** `calculateRestHealing` checks `restMinutesToday >= 480`. Since 480 >= 480, returns `{ hpHealed: 0, canHeal: false, reason: 'Already rested maximum 8 hours today' }`.
- **Implementation check:** `restHealing.ts` line 40 triggers. `rest.post.ts` line 51 returns `{ success: false, ... }`.
- **Status:** CORRECT

#### Assertion 2.2: response.message contains "8 hours"
- **Scenario says:** App-enforced reason string
- **Independent derivation:** Reason string is `'Already rested maximum 8 hours today'` which contains "8 hours".
- **Implementation check:** `rest.post.ts` line 54: `message: result.reason` = `'Already rested maximum 8 hours today'`.
- **Status:** CORRECT

#### Assertion 2.3: response.data.hpHealed = 0
- **Scenario says:** No healing on block
- **Independent derivation:** Failure response explicitly sets `hpHealed: 0`.
- **Implementation check:** `rest.post.ts` line 56: `hpHealed: 0`.
- **Status:** CORRECT

### Test 3: Over cap (510 min) — also blocked

#### Assertion 3.1: response.success = false
- **Scenario says:** `restMinutesToday = 510 >= 480 -> canHeal = false`
- **Independent derivation:** 510 >= 480 triggers the same gate as Test 2.
- **Implementation check:** Same code path as Test 2.
- **Status:** CORRECT

#### Assertion 3.2: response.data.hpHealed = 0
- **Scenario says:** No healing on block
- **Independent derivation:** Failure response sets `hpHealed: 0`.
- **Implementation check:** `rest.post.ts` line 56: `hpHealed: 0`.
- **Status:** CORRECT

## Data Validity
- [x] Bulbasaur: base HP = 5 (verified against `books/markdown/pokedexes/gen1/bulbasaur.md`)
- [x] Pokemon HP formula: `level + (baseHp * 3) + 10` = `15 + 15 + 10` = 40 (matches scenario)
- [x] Rest heal formula: `max(1, floor(40/16))` = 2 (matches `calculateRestHealing` in `app/utils/restHealing.ts`)
- [x] Daily rest cap: 480 minutes (8 hours) per PTU core/07-combat.md Resting section
- [x] 30-minute rest duration: standard PTU rest period, hardcoded in `app/server/api/pokemon/[id]/rest.post.ts`

## Completeness Check
- [x] Under cap (Test 1): rest succeeds, counter reaches 480
- [x] At cap (Test 2): rest blocked with correct error message
- [x] Over cap (Test 3): rest blocked (boundary above cap)
- [x] Matches expected outcomes in loop `healing-mechanic-daily-rest-cap` (M3 in healing.md)
- [x] Tests both success and failure response field shapes

## Errata Check
- No errata in `books/markdown/errata-2.md` affects rest mechanics or the 8-hour daily cap. Errata covers capture mechanics, class features (Cheerleader, Medic), and move changes.

## Issues Found
None. All 8 assertions match both PTU 1.05 rules and current app implementation. No code changes since last verification affect this scenario.
