---
scenario_id: healing-workflow-mid-combat-breather-001
verified_at: 2026-02-18T12:00:00Z
status: PASS
assertions_checked: 7
assertions_correct: 7
---

## Assertion Verification

1. **Stages reset**: atk+3, def-2, spd-4 → all 0 via createDefaultStageModifiers(). PASS
2. **Confused cured**: volatile condition → in BREATHER_CURED_CONDITIONS. PASS
3. **Stuck cured**: explicitly listed in BREATHER_CURED_CONDITIONS alongside Slowed. PASS
4. **Burned survives**: persistent condition → NOT in BREATHER_CURED_CONDITIONS. PASS
5. **Tripped + Vulnerable applied**: added to combatant.tempConditions as breather penalties. PASS
6. **Turn consumed**: standardActionUsed = true, hasActed = true. PASS
7. **Post-breather composite state**: stages zero, Burned remains, Confused/Stuck gone. PASS

## Data Validity

- [x] Machop — HP 7, ATK 8, DEF 5, SpATK 4, SpDEF 4, SPD 4 — matches gen1/machop.md
- [x] Geodude — HP 4, ATK 8, DEF 10, SpATK 3, SpDEF 3, SPD 2 — matches gen1/geodude.md
- [x] Machop maxHp = 15 + (7*3) + 10 = 46

## Completeness Check

- [x] Stage reset to zero
- [x] Volatile condition clearing (Confused)
- [x] Special breather conditions (Stuck, Slowed)
- [x] Persistent condition survival (Burned)
- [x] Breather penalties (Tripped + Vulnerable)
- [x] FEATURE_GAPs (Cursed distance, assisted breather) not exercised — no feasibility warning needed

## Errata Check

- No errata affects breather mechanics

## Issues Found

(none)
