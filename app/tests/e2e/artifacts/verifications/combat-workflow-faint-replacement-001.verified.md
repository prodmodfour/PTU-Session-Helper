---
scenario_id: combat-workflow-faint-replacement-001
verified_at: 2026-02-15T12:00:00Z
status: PASS
assertions_checked: 10
assertions_correct: 10
---

## Assertion Verification

### Assertion 1: HP Values
- **Scenario says:** Caterpie HP = 33, Pidgey HP = 32
- **Independent derivation:**
  - Caterpie HP = 8 + (5 × 3) + 10 = 8 + 15 + 10 = 33. Base HP 5 from gen1/caterpie.md.
  - Pidgey HP = 10 + (4 × 3) + 10 = 10 + 12 + 10 = 32. Base HP 4 from gen1/pidgey.md.
- **Status:** CORRECT

### Assertion 2: Initiative Order
- **Scenario says:** Pidgey Speed = 6 > Caterpie Speed = 5, Pidgey first
- **Independent derivation:** Pidgey SPD 6 (gen1/pidgey.md), Caterpie SPD 5 (gen1/caterpie.md). 6 > 5 → Pidgey first.
- **Status:** CORRECT

### Assertion 3: Damage — Pidgey Tackle → Caterpie
- **Scenario says:** Tackle DB 5 + STAB 2 = DB 7, set damage 17, ATK 5 − DEF 4 = 1, raw 18, Normal vs Bug = ×1, final 18, Caterpie HP 33 − 18 = 15
- **Independent derivation:**
  - Tackle: Normal, Physical, DB 5, AC 4
  - STAB check: Pidgey(Normal/Flying) + Tackle(Normal) → Normal matches Normal → +2 DB ✓
  - Effective DB = 5 + 2 = 7, set damage DB 7 = 17
  - ATK(Pidgey) = 5, DEF(Caterpie) = 4
  - Raw = max(1, 17 + 5 − 4) = 18
  - Type: Normal vs Bug = Neutral (×1)
  - Final = 18
  - Caterpie HP: 33 − 18 = 15
- **Status:** CORRECT

### Assertion 4: Injury Check — Caterpie
- **Scenario says:** Damage 18, maxHP 33, threshold 16.5, 18 ≥ 16.5 → injury = 1
- **Independent derivation:** 18 ≥ (33 / 2 = 16.5) → Massive Damage → injuries = 1
- **Status:** CORRECT

### Assertion 5: Damage — Caterpie Tackle → Pidgey (No STAB)
- **Scenario says:** Tackle DB 5 (no STAB), set damage 13, ATK 3 − DEF 4, raw 12, Normal vs Normal/Flying = ×1, final 12, Pidgey HP 32 − 12 = 20
- **Independent derivation:**
  - Tackle: Normal, Physical, DB 5
  - STAB check: Caterpie(Bug) + Tackle(Normal) → Bug ≠ Normal → NO STAB ✓
  - Set damage DB 5 = 13
  - ATK(Caterpie) = 3, DEF(Pidgey) = 4
  - Raw = max(1, 13 + 3 − 4) = 12
  - Type: Normal vs Normal = Neutral (×1), Normal vs Flying = Neutral (×1), combined = ×1
  - Final = 12
  - Pidgey HP: 32 − 12 = 20
- **Status:** CORRECT

### Assertion 6: Burned Status Applied
- **Scenario says:** Caterpie types = [Bug], not immune to Burn (only Fire is immune)
- **Independent derivation:** Per core/07-combat.md p239: "Fire Types are immune to Burn". Bug is not Fire → not immune → Burned applied.
- **Status:** CORRECT

### Assertion 7: Caterpie Faints
- **Scenario says:** Caterpie HP 15 − 18 = −3 → 0 (floor)
- **Independent derivation:** Same Tackle calc: 18 damage. 15 − 18 = −3, floored to 0.
- **Status:** CORRECT

### Assertion 8: Status Cleared on Faint
- **Scenario says:** On faint, Burned cleared, only "Fainted" remains
- **Independent derivation:** Per core/07-combat.md p248: "automatically cured of all Persistent and Volatile Status Conditions". Burned is persistent → cleared. Only Fainted remains.
- **Status:** CORRECT

### Assertion 9: Replacement Combatant — Charmander
- **Scenario says:** Charmander HP = 35, Speed 7 > Pidgey Speed 6, Charmander before Pidgey
- **Independent derivation:**
  - Charmander HP = 13 + (4 × 3) + 10 = 13 + 12 + 10 = 35. Base HP 4 from gen1/charmander.md.
  - Charmander SPD 7 (gen1/charmander.md) > Pidgey SPD 6 → Charmander acts first.
- **Status:** CORRECT

### Assertion 10: Damage — Charmander Ember → Pidgey
- **Scenario says:** Ember DB 6 (STAB), set damage 15, SpATK 6 − SpDEF 4 = 2, raw 17, Fire vs Normal/Flying = ×1, final 17, Pidgey HP 20 − 17 = 3
- **Independent derivation:**
  - Ember: Fire, Special, DB 4 + STAB 2 = 6
  - STAB check: Charmander(Fire) + Ember(Fire) → match → +2 DB ✓
  - Set damage DB 6 = 15
  - SpATK(Charmander) = 6, SpDEF(Pidgey) = 4
  - Raw = max(1, 15 + 6 − 4) = 17
  - Type: Fire vs Normal = Neutral (×1), Fire vs Flying = Neutral (×1), combined = ×1
  - Final = 17
  - Pidgey HP: 20 − 17 = 3
- **Status:** CORRECT

## Data Validity
- [x] Caterpie: base stats match gen1/caterpie.md (HP 5, ATK 3, DEF 4, SpATK 2, SpDEF 2, SPD 5)
- [x] Caterpie: type Bug matches gen1/caterpie.md
- [x] Pidgey: base stats match gen1/pidgey.md (HP 4, ATK 5, DEF 4, SpATK 4, SpDEF 4, SPD 6)
- [x] Pidgey: types Normal/Flying match gen1/pidgey.md
- [x] Charmander: base stats match gen1/charmander.md (HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7)
- [x] Charmander: type Fire matches gen1/charmander.md
- [x] Tackle: learnable by Pidgey at L10 (learned at L1 per gen1/pidgey.md)
- [x] Tackle: learnable by Caterpie at L8 (learned at L1 per gen1/caterpie.md)
- [x] Ember: learnable by Charmander at L13 (learned at L7 per gen1/charmander.md)
- [x] STAB: Pidgey(Normal/Flying) + Tackle(Normal) → correctly applied
- [x] STAB: Caterpie(Bug) + Tackle(Normal) → correctly NOT applied
- [x] STAB: Charmander(Fire) + Ember(Fire) → correctly applied
- [x] Type effectiveness: Normal vs Bug = Neutral (×1) — verified
- [x] Type effectiveness: Normal vs Normal/Flying = Neutral (×1) — verified
- [x] Type effectiveness: Fire vs Normal/Flying = Neutral (×1) — verified

## Completeness Check
- [x] Loop combat-workflow-faint-and-replacement: Damage application covered (multiple rounds)
- [x] Faint check covered (HP reaches 0)
- [x] Injury check covered (Massive Damage)
- [x] Status clear on faint covered (Burned → cleared)
- [x] Initiative insertion covered (Charmander enters at correct position)
- [x] Turn progression covered (replacement acts on its initiative)

## Errata Check
- No errata in errata-2.md affects Tackle, Ember, damage formula, or faint mechanics used here.

## Lessons Applied
- [x] Lesson 1 (STAB eligibility): All 3 pairs verified — Pidgey/Tackle ✓, Caterpie/Tackle (no STAB) ✓, Charmander/Ember ✓
- [x] Lesson 2 (learn level): Tackle L1 ≤ Pidgey L10 ✓, Tackle L1 ≤ Caterpie L8 ✓, Ember L7 ≤ Charmander L13 ✓
- [x] Lesson 3 (type effectiveness): All 3 type pair sets individually verified

## Issues Found
<!-- None -->
