---
scenario_id: healing-rest-hp-calculation-001
verified_at: 2026-02-18T12:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

1. **maxHp=60**: healAmount = max(1, floor(60/16)) = max(1, 3) = 3. newHp = 40 + 3 = 43. PASS
2. **maxHp=45**: healAmount = max(1, floor(45/16)) = max(1, 2) = 2. newHp = 30 + 2 = 32. PASS
3. **maxHp=23**: healAmount = max(1, floor(23/16)) = max(1, 1) = 1. newHp = 15 + 1 = 16. PASS
4. **maxHp=23, low HP**: healAmount = 1. newHp = 5 + 1 = 6. PASS
5. **maxHp=40, deficit=1**: healAmount = max(1, floor(40/16)) = 2. min(2, 1) = 1. newHp = 39 + 1 = 40. PASS

## Data Validity

- [x] Uses custom base stats per test case — mechanic validation, not species-specific
- [x] Formula: max(1, floor(maxHp / 16)) per 30-min rest period

## Completeness Check

- [x] Standard healing (multiple maxHp values)
- [x] Minimum floor of 1 HP per rest
- [x] Heal capped at deficit (assertion 5)

## Errata Check

- No errata affects rest healing formula

## Issues Found

(none)
