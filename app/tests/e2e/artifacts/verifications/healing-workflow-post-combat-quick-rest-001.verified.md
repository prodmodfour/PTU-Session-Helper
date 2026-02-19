---
scenario_id: healing-workflow-post-combat-quick-rest-001
verified_at: 2026-02-18T12:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

1. **Initial HP setup**: maxHp = level(15) + baseHp(5)*3 + 10 = 40. PUT sets currentHp = 30. PASS
2. **First rest heal**: healPerPeriod = max(1, floor(40/16)) = max(1, 2) = 2. newHp = 30 + 2 = 32. PASS
3. **Rest minutes after first rest**: 0 + 30 = 30 min used, 480 - 30 = 450 remaining. PASS
4. **Second rest heal**: same formula, healPerPeriod = 2. newHp = 32 + 2 = 34. PASS
5. **Cumulative rest minutes**: 30 + 30 = 60 min used, 480 - 60 = 420 remaining. PASS

## Data Validity

- [x] Bulbasaur — HP 5, ATK 5, DEF 5, SpATK 7, SpDEF 7, SPD 5 — matches gen1/bulbasaur.md
- [x] HP formula: level(15) + baseHp(5)*3 + 10 = 40

## Completeness Check

- [x] rest-hp-calculation: floor(maxHp/16) heal per 30-min period
- [x] daily-rest-cap: restMinutesToday tracking verified across two rests
- [x] daily-counter-auto-reset: exercised trivially (fresh entity, counters at 0)

## Errata Check

- No errata affects rest healing formula

## Issues Found

(none)
