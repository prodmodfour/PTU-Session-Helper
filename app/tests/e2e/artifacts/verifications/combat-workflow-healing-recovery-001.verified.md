---
scenario_id: combat-workflow-healing-recovery-001
verified_at: 2026-02-15T12:00:00Z
status: PASS
assertions_checked: 8
assertions_correct: 8
---

## Assertion Verification

### Assertion 1: Bulbasaur Damaged
- **Scenario says:** Bulbasaur maxHP = 40, after 25 damage: HP = 15, injury: 25 ≥ 20 → injuries = 1
- **Independent derivation:**
  - Bulbasaur HP = 15 + (5 × 3) + 10 = 40. Base HP 5 from gen1/bulbasaur.md.
  - 40 − 25 = 15. Massive Damage: 25 ≥ (40 / 2 = 20) → injuries = 1.
- **Status:** CORRECT

### Assertion 2: Charmander Fainted
- **Scenario says:** Charmander maxHP = 35, after 50 damage: HP = 0, Fainted
- **Independent derivation:**
  - Charmander HP = 13 + (4 × 3) + 10 = 35. Base HP 4 from gen1/charmander.md.
  - 35 − 50 = −15, floored to 0. HP = 0 → Fainted status added.
- **Status:** CORRECT

### Assertion 3: Healing Capped at Max HP
- **Scenario says:** newHp = min(40, 15 + 30) = min(40, 45) = 40
- **Independent derivation:** currentHp(15) + heal(30) = 45, capped at maxHp(40) = 40. Per healing rules: HP cannot exceed max.
- **Status:** CORRECT

### Assertion 4: Faint Recovery
- **Scenario says:** newHp = min(35, 0 + 20) = 20, Fainted removed
- **Independent derivation:** currentHp(0) + heal(20) = 20, capped at maxHp(35) = 20. HP > 0 → Fainted removed. Per core/07-combat.md p248: "The Fainted Condition is removed by Revive or being brought to positive HP".
- **Status:** CORRECT

### Assertion 5: Temporary HP Granted
- **Scenario says:** Squirtle HP stays 35/35, temporaryHp = 15
- **Independent derivation:**
  - Squirtle HP = 13 + (4 × 3) + 10 = 35. Base HP 4 from gen1/squirtle.md.
  - Heal amount = 0 (real HP unchanged), tempHp = 15 added to entity. Real HP remains 35/35.
- **Status:** CORRECT

### Assertion 6: Temp HP Absorption
- **Scenario says:** Damage 20, temp absorbs 15, remaining 5, HP 35 → 30, tempHp = 0
- **Independent derivation:**
  - Per core/07-combat.md p247: "Temporary Hit Points are always lost first from damage"
  - tempAbsorbed = min(15, 20) = 15
  - remainingDamage = 20 − 15 = 5
  - realHp = 35 − 5 = 30
  - tempHp = 15 − 15 = 0
- **Status:** CORRECT

### Assertion 7: Temp HP Absorbed Correctly
- **Scenario says:** Squirtle lost exactly 5 real HP (from 35 to 30)
- **Independent derivation:** Same as assertion 6. Temp HP absorbed 15 of 20 damage → 5 real HP lost. 35 − 5 = 30.
- **Status:** CORRECT

### Assertion 8: Injury Healed
- **Scenario says:** Previous injuries = 1, heal 1 → 0
- **Independent derivation:** injuries = max(0, 1 − 1) = 0. Per injury healing rules: injury count reduced by heal amount, min 0.
- **Status:** CORRECT

## Data Validity
- [x] Bulbasaur: base stats match gen1/bulbasaur.md (HP 5, ATK 5, DEF 5, SpATK 7, SpDEF 7, SPD 5)
- [x] Bulbasaur: types Grass/Poison match gen1/bulbasaur.md
- [x] Charmander: base stats match gen1/charmander.md (HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7)
- [x] Charmander: type Fire matches gen1/charmander.md
- [x] Squirtle: base stats match gen1/squirtle.md (HP 4, ATK 5, DEF 7, SpATK 5, SpDEF 6, SPD 4)
- [x] Squirtle: type Water matches gen1/squirtle.md
- [x] Rattata: base stats match gen1/rattata.md (HP 3, ATK 6, DEF 4, SpATK 3, SpDEF 4, SPD 7)
- [x] Rattata: type Normal matches gen1/rattata.md

## Completeness Check
- [x] Loop combat-workflow-healing-and-recovery: Healing capped at max HP covered
- [x] Faint recovery covered (heal from 0 HP, Fainted removed)
- [x] Temporary HP grant covered
- [x] Temporary HP absorption on damage covered
- [x] Injury healing covered
- [x] All four healing paths (heal, revive, temp HP, injury heal) tested

## Errata Check
- No errata in errata-2.md affects healing mechanics, temporary HP, or injury healing used here.

## Lessons Applied
- [x] Lesson 1 (STAB eligibility): No damage moves in this scenario — N/A
- [x] Lesson 2 (learn level): No moves used in this scenario — N/A
- [x] Lesson 3 (type effectiveness): No type interactions in this scenario — N/A

## Issues Found
<!-- None -->
