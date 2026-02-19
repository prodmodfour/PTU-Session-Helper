---
scenario_id: healing-workflow-overnight-extended-rest-001
verified_at: 2026-02-20T00:10:00Z
status: PASS
assertions_checked: 8
assertions_correct: 8
---

## Assertion Verification

### Assertion 1: Character HP recovery (8 periods)
- **Scenario says:** healPerPeriod = max(1, floor(45 / 16)) = 2; 8 periods x 2 = 16 HP; newHp = 20 + 16 = 36
- **Independent derivation:** floor(45/16) = floor(2.8125) = 2; max(1, 2) = 2; 8 x 2 = 16; 20 + 16 = 36 (< maxHp 45)
- **Status:** CORRECT
- **Implementation check:** Extended-rest loops 8 iterations of calculateRestHealing. Formula `max(1, floor(maxHp/16))` confirmed in `utils/restHealing.ts`. Response returns `hpHealed` and `newHp`. Deterministic.

### Assertion 2: Character persistent status cleared, volatile survives
- **Scenario says:** Burned (persistent) cleared; Confused (volatile) survives
- **Independent derivation:** PERSISTENT_CONDITIONS = ['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']. clearPersistentStatusConditions removes Burned, keeps Confused.
- **Status:** CORRECT
- **Implementation check:** `extended-rest.post.ts` calls `clearPersistentStatusConditions()` from `utils/restHealing.ts`. Volatile conditions untouched.

### Assertion 3: Character drained AP restored
- **Scenario says:** drainedAp was 4, reset to 0; response.data.apRestored = 4
- **Independent derivation:** Extended rest sets `drainedAp = 0` for characters. apRestored = previous drainedAp = 4.
- **Status:** CORRECT
- **Implementation check:** Character extended-rest endpoint explicitly sets `drainedAp: 0` in DB update.

### Assertion 4: Character rest minutes tracked
- **Scenario says:** restMinutesToday = 0 + (8 x 30) = 240
- **Independent derivation:** 8 periods x 30 min = 240. Starting from 0.
- **Status:** CORRECT

### Assertion 5: Pokemon HP recovery (8 periods)
- **Scenario says:** healPerPeriod = max(1, floor(35 / 16)) = 2; 8 x 2 = 16; newHp = 10 + 16 = 26
- **Independent derivation:** floor(35/16) = floor(2.1875) = 2; max(1, 2) = 2; 8 x 2 = 16; 10 + 16 = 26 (< maxHp 35)
- **Status:** CORRECT

### Assertion 6: Pokemon persistent status cleared
- **Scenario says:** Paralyzed (persistent) cleared
- **Independent derivation:** Paralyzed is in PERSISTENT_CONDITIONS. clearPersistentStatusConditions removes it.
- **Status:** CORRECT

### Assertion 7: Pokemon daily moves restored
- **Scenario says:** Absorb (At-Will) usedToday reset to 0, usedThisScene unchanged; Stun Spore (Daily x2) usedToday and usedThisScene both reset to 0
- **Independent derivation:** Pokemon extended-rest resets `usedToday = 0` for ALL moves and additionally resets `usedThisScene = 0` for moves whose frequency starts with 'Daily'. Absorb is At-Will so only usedToday resets. Stun Spore is Daily so both reset.
- **Status:** CORRECT
- **Implementation check:** Confirmed in `pokemon/[id]/extended-rest.post.ts` — iterates moves array, resets counters by frequency type.

### Assertion 8: Pokemon rest minutes tracked
- **Scenario says:** restMinutesToday = 0 + (8 x 30) = 240
- **Independent derivation:** 8 periods x 30 min = 240.
- **Status:** CORRECT

## Data Validity
- [x] Oddish: base stats match gen1/oddish.md (HP 5, ATK 5, DEF 6, SpATK 8, SpDEF 7, SPD 3)
- [x] Oddish type: Grass/Poison matches gen1/oddish.md
- [x] Character uses `characterType: "player"` (correction-006 fix applied)
- [x] Character uses `hp: 5` (correction-006 fix applied)
- [x] Character has explicit `maxHp: 45` and `currentHp: 45` (correction-006 fix applied)
- [x] Character maxHp formula: (10 x 2) + (5 x 3) + 10 = 45 matches explicit value
- [x] Pokemon maxHp formula: 10 + (5 x 3) + 10 = 35 matches scenario comment

## Completeness Check
- [x] All steps from loop healing-workflow-overnight-extended-rest (W2) covered
- [x] Character extended rest: HP, status, AP, rest minutes all tested
- [x] Pokemon extended rest: HP, status, moves, rest minutes all tested
- [x] Post-rest verification phase confirms final state via GET
- [x] Phase 3 cross-checks character (Confused remains, Burned gone) and Pokemon (Paralyzed gone)

## Errata Check
- No errata in errata-2.md affects rest/extended-rest HP calculation, status clearing, AP restoration, or move recovery mechanics

## Issues Found
<!-- None -->
