---
scenario_id: healing-injury-rest-block-001
verified_at: 2026-02-18T12:00:00Z
status: PASS
assertions_checked: 3
assertions_correct: 3
---

## Assertion Verification

1. **4 injuries (below threshold)**: 4 < 5 → canHeal = true. maxHp = 15 + (4*3) + 10 = 37. healAmount = max(1, floor(37/16)) = 2. hpHealed = 2. PASS
2. **5 injuries (at threshold)**: 5 >= 5 → blocked. success = false, message contains "5+ injuries". PASS
3. **7 injuries (above threshold)**: 7 >= 5 → blocked. success = false. PASS

## Data Validity

- [x] maxHp = 15 + (4*3) + 10 = 37
- [x] Threshold: injuries >= 5 blocks rest healing

## Completeness Check

- [x] Below threshold (4 injuries) — healing allowed
- [x] At threshold (5 injuries) — healing blocked
- [x] Above threshold (7 injuries) — healing blocked

## Errata Check

- No errata affects injury rest-block threshold

## Issues Found

(none)
