---
scenario_id: combat-workflow-wild-encounter-001
verified_at: 2026-02-15T12:00:00Z
status: PASS
assertions_checked: 10
assertions_correct: 10
---

## Assertion Verification

### Assertion 1: Growlithe HP
- **Scenario says:** HP = level(15) + (baseHp(6) × 3) + 10 = 15 + 18 + 10 = 43
- **Independent derivation:** HP = 15 + (6 × 3) + 10 = 15 + 18 + 10 = 43. Base HP 6 confirmed from gen1/growlithe.md.
- **Status:** CORRECT

### Assertion 2: Oddish HP
- **Scenario says:** HP = level(10) + (baseHp(5) × 3) + 10 = 10 + 15 + 10 = 35
- **Independent derivation:** HP = 10 + (5 × 3) + 10 = 10 + 15 + 10 = 35. Base HP 5 confirmed from gen1/oddish.md.
- **Status:** CORRECT

### Assertion 3: Initiative Order
- **Scenario says:** Growlithe Speed = 6, Oddish Speed = 3, so Growlithe first.
- **Independent derivation:** Growlithe SPD 6 (gen1/growlithe.md), Oddish SPD 3 (gen1/oddish.md). 6 > 3 → Growlithe acts first.
- **Status:** CORRECT

### Assertion 4: Damage — Growlithe Ember → Oddish
- **Scenario says:** Ember DB 4 + STAB 2 = DB 6, set damage 15, raw = max(1, 15 + 7 − 7) = 15, Fire vs Grass/Poison = 1.5 × 1 = ×1.5, final = floor(15 × 1.5) = 22, Oddish HP 35 − 22 = 13
- **Independent derivation:**
  - Ember: Fire, Special, DB 4, AC 2
  - STAB check: Growlithe(Fire) + Ember(Fire) → match → +2 DB ✓
  - Effective DB = 4 + 2 = 6
  - Set damage DB 6 = 15 (core/07-combat.md set damage table: 10/15/20)
  - SpATK(Growlithe) = 7, SpDEF(Oddish) = 7
  - Raw = max(1, 15 + 7 − 7) = 15
  - Type: Fire vs Grass = SE (×1.5), Fire vs Poison = Neutral (×1), combined = ×1.5
  - Final = floor(15 × 1.5) = floor(22.5) = 22
  - Oddish HP: 35 − 22 = 13
- **Status:** CORRECT

### Assertion 5: Injury Check — Oddish Massive Damage
- **Scenario says:** Damage 22, maxHP 35, threshold 17.5, 22 ≥ 17.5 → injury = 1
- **Independent derivation:** 22 ≥ (35 / 2 = 17.5) → Massive Damage → injuries = 1
- **Status:** CORRECT

### Assertion 6: Damage — Oddish Acid → Growlithe
- **Scenario says:** Acid DB 4 + STAB 2 = DB 6, set damage 15, raw = max(1, 15 + 8 − 5) = 18, Poison vs Fire = ×1, final = 18, Growlithe HP 43 − 18 = 25
- **Independent derivation:**
  - Acid: Poison, Special, DB 4, AC 2
  - STAB check: Oddish(Grass/Poison) + Acid(Poison) → Poison matches Poison → +2 DB ✓
  - Effective DB = 4 + 2 = 6, set damage = 15
  - SpATK(Oddish) = 8, SpDEF(Growlithe) = 5
  - Raw = max(1, 15 + 8 − 5) = 18
  - Type: Poison vs Fire = Neutral (×1)
  - Final = 18
  - Growlithe HP: 43 − 18 = 25
- **Status:** CORRECT

### Assertion 7: Injury Check — Growlithe
- **Scenario says:** Damage 18, maxHP 43, threshold 21.5, 18 < 21.5 → no injury
- **Independent derivation:** 18 < (43 / 2 = 21.5) → no Massive Damage → injuries = 0
- **Status:** CORRECT

### Assertion 8: Oddish Faints
- **Scenario says:** Oddish HP 13 − 22 = −9 → 0 (floor)
- **Independent derivation:** Same Ember calc: 22 damage. 13 − 22 = −9, floored to 0.
- **Status:** CORRECT

### Assertion 9: Faint Status
- **Scenario says:** HP = 0 → Fainted added, all other statuses cleared
- **Independent derivation:** Per core/07-combat.md p248: "at 0 Hit Points or less is Fainted" and "automatically cured of all Persistent and Volatile Status Conditions". No prior statuses in this case.
- **Status:** CORRECT

### Assertion 10: Encounter Lifecycle
- **Scenario says:** End → isActive = false, Unserve → isServed = false
- **Independent derivation:** Per encounter lifecycle loop: end sets isActive false, unserve sets isServed false.
- **Status:** CORRECT

## Data Validity
- [x] Growlithe: base stats match gen1/growlithe.md (HP 6, ATK 7, DEF 5, SpATK 7, SpDEF 5, SPD 6)
- [x] Growlithe: type Fire matches gen1/growlithe.md
- [x] Oddish: base stats match gen1/oddish.md (HP 5, ATK 5, DEF 6, SpATK 8, SpDEF 7, SPD 3)
- [x] Oddish: types Grass/Poison match gen1/oddish.md
- [x] Ember: learnable by Growlithe at L15 (learned at L6 per gen1/growlithe.md)
- [x] Acid: learnable by Oddish at L10 (learned at L9 per gen1/oddish.md)
- [x] STAB: Growlithe(Fire) + Ember(Fire) → correctly applied
- [x] STAB: Oddish(Grass/Poison) + Acid(Poison) → correctly applied
- [x] Type effectiveness: Fire vs Grass = SE (×1.5) — verified against type chart
- [x] Type effectiveness: Fire vs Poison = Neutral (×1) — verified against type chart
- [x] Type effectiveness: Poison vs Fire = Neutral (×1) — verified against type chart

## Completeness Check
- [x] Loop combat-workflow-full-wild-encounter: Setup (create, wild-spawn, add combatant) covered
- [x] Start encounter covered
- [x] Serve encounter covered
- [x] Turn progression (multiple rounds, next-turn) covered
- [x] Damage formula with STAB and type effectiveness covered
- [x] Injury check (Massive Damage) covered — both positive and negative cases
- [x] Faint check covered
- [x] End and unserve covered
- [x] Teardown with cleanup covered

## Errata Check
- No errata in errata-2.md affects Ember, Acid, damage formula, or type effectiveness rules used here.

## Lessons Applied
- [x] Lesson 1 (STAB eligibility): Both attacker/move pairs explicitly verified — Growlithe/Ember ✓, Oddish/Acid ✓
- [x] Lesson 2 (learn level): Ember L6 ≤ Growlithe L15 ✓, Acid L9 ≤ Oddish L10 ✓
- [x] Lesson 3 (type effectiveness): All 3 type pairs individually verified against type chart

## Issues Found
<!-- None -->
