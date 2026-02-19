---
scenario_id: healing-breather-effects-001
verified_at: 2026-02-18T12:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

1. **Stages reset**: atk+2, def-3, spDef-1, spd-6, acc-4, eva+1 → all 0 via createDefaultStageModifiers(). PASS
2. **Volatile conditions cured**: Enraged (volatile) and Suppressed (volatile) → both in BREATHER_CURED_CONDITIONS → cleared. PASS
3. **Slowed + Stuck cured**: Both explicitly in BREATHER_CURED_CONDITIONS (special breather rule, despite being volatile-adjacent). PASS
4. **Paralyzed survives**: Persistent condition → NOT in BREATHER_CURED_CONDITIONS → remains. PASS
5. **Tripped + Vulnerable applied**: Added to combatant.tempConditions as mandatory breather penalties. PASS

## Data Validity

- [x] Geodude — HP 4, ATK 8, DEF 10, SpATK 3, SpDEF 3, SPD 2 — matches gen1/geodude.md
- [x] maxHp = 12 + (4*3) + 10 = 34
- [x] BREATHER_CURED_CONDITIONS = [...VOLATILE_CONDITIONS, 'Slowed', 'Stuck']

## Completeness Check

- [x] Full stage reset (6 non-zero stages)
- [x] Volatile condition clearing (Enraged, Suppressed)
- [x] Special breather conditions (Slowed, Stuck)
- [x] Persistent condition survival (Paralyzed)
- [x] Breather penalty application (Tripped, Vulnerable)

## Errata Check

- No errata affects breather mechanics

## Issues Found

(none)
