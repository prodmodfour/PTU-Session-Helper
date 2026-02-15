---
scenario_id: combat-workflow-capture-variant-001
verified_at: 2026-02-15T12:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

### Assertion 1: Damage — Squirtle Water Gun → Rattata
- **Scenario says:** Water Gun DB 6 + STAB 2 = DB 8, set damage 19, SpATK 5 − SpDEF 4 = 1, raw 20, Water vs Normal = ×1, final 20, Rattata HP 29 − 20 = 9
- **Independent derivation:**
  - Rattata HP = 10 + (3 × 3) + 10 = 29. Base HP 3 from gen1/rattata.md.
  - Squirtle HP = 13 + (4 × 3) + 10 = 35. Base HP 4 from gen1/squirtle.md.
  - Water Gun: Water, Special, DB 6, AC 2
  - STAB check: Squirtle(Water) + Water Gun(Water) → match → +2 DB ✓
  - Effective DB = 6 + 2 = 8, set damage DB 8 = 19
  - SpATK(Squirtle) = 5, SpDEF(Rattata) = 4
  - Raw = max(1, 19 + 5 − 4) = 20
  - Type: Water vs Normal = Neutral (×1)
  - Final = 20
  - Rattata HP: 29 − 20 = 9
- **Status:** CORRECT

### Assertion 2: Injury Check — Rattata
- **Scenario says:** Damage 20, maxHP 29, threshold 14.5, 20 ≥ 14.5 → injuries = 1
- **Independent derivation:** 20 ≥ (29 / 2 = 14.5) → Massive Damage → injuries = 1
- **Status:** CORRECT

### Assertion 3: Capture Rate Calculated
- **Scenario says:** HP at ≈31%, capture rate > 0
- **Independent derivation:**
  - Rattata HP = 9/29 ≈ 31%. Under 50% threshold.
  - Per errata-2.md p8: Base rate = 10 + floor(10/10) = 11. Checkboxes: HP ≤ 50% (−2), 1 evolution stage remaining (−2). Rate = 11 − 2 − 2 = 7. 7 > 0 ✓
  - Scenario only asserts rate > 0, which is correct regardless of exact formula.
- **Status:** CORRECT

### Assertion 4: Pokemon Captured
- **Scenario says:** On successful capture, Rattata origin = "captured"
- **Independent derivation:** Per app's pokemon-generator.service.ts: capture sets origin to 'captured'. This is an app behavior assertion, consistent with the capture workflow.
- **Status:** CORRECT

### Assertion 5: Pokemon Linked to Trainer
- **Scenario says:** Rattata linked to the capturing trainer's character
- **Independent derivation:** Per capture workflow: successful capture links the wild Pokemon to the trainer and sets origin to 'captured'. App behavior assertion.
- **Status:** CORRECT

## Pre-Phase Verification: Phase 1 (Rattata Tackle → Squirtle)

The scenario includes an unasserted Phase 1 damage calculation. Independently verified:
- Tackle: Normal, Physical, DB 5
- STAB check: Rattata(Normal) + Tackle(Normal) → match → +2 DB ✓
- Effective DB = 5 + 2 = 7, set damage DB 7 = 17
- ATK(Rattata) = 6, DEF(Squirtle) = 7
- Raw = max(1, 17 + 6 − 7) = 16
- Type: Normal vs Water = Neutral (×1)
- Final = 16
- Squirtle HP: 35 − 16 = 19 — matches scenario narrative ✓

## Data Validity
- [x] Squirtle: base stats match gen1/squirtle.md (HP 4, ATK 5, DEF 7, SpATK 5, SpDEF 6, SPD 4)
- [x] Squirtle: type Water matches gen1/squirtle.md
- [x] Rattata: base stats match gen1/rattata.md (HP 3, ATK 6, DEF 4, SpATK 3, SpDEF 4, SPD 7)
- [x] Rattata: type Normal matches gen1/rattata.md
- [x] Water Gun: learnable by Squirtle at L13 (learned at L13 per gen1/squirtle.md) — exact match
- [x] Tackle: learnable by Rattata at L10 (learned at L1 per gen1/rattata.md)
- [x] STAB: Squirtle(Water) + Water Gun(Water) → correctly applied
- [x] STAB: Rattata(Normal) + Tackle(Normal) → correctly applied
- [x] Type effectiveness: Water vs Normal = Neutral (×1) — verified
- [x] Type effectiveness: Normal vs Water = Neutral (×1) — verified
- [x] Initiative: Rattata SPD 7 > Squirtle SPD 4 → Rattata first ✓

## Completeness Check
- [x] Loop combat-workflow-wild-encounter-capture-variant: Damage to weaken wild Pokemon covered
- [x] Wild Pokemon survives at low HP (not fainted) covered
- [x] Capture rate calculation covered
- [x] Capture attempt covered
- [x] Capture success: origin = "captured", linked to trainer covered
- [ ] Capture failure path not tested (noted as variation, acceptable for P1 scenario)

## Errata Check
- Capture mechanics revised in errata-2.md p8: d20 roll-over system replaces original. The scenario uses POST /api/capture/rate and POST /api/capture/attempt which abstract the mechanic. Assertion only checks rate > 0, which is compatible with either formula. No conflict.

## Lessons Applied
- [x] Lesson 1 (STAB eligibility): Both pairs verified — Squirtle/Water Gun ✓, Rattata/Tackle ✓
- [x] Lesson 2 (learn level): Water Gun L13 ≤ Squirtle L13 ✓ (exact match), Tackle L1 ≤ Rattata L10 ✓
- [x] Lesson 3 (type effectiveness): Water vs Normal and Normal vs Water individually verified

## Issues Found
<!-- None -->
