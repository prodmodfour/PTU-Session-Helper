---
scenario_id: combat-minimum-damage-001
verified_at: 2026-02-15T21:00:00
status: PASS
assertions_checked: 3
assertions_correct: 3
re_verification: true
previous_status: PARTIAL (2 of 3 correct — derivation missed Rock resists Normal)
correction_applied: Corrected assertion 2 to show Rock resists Normal (×0.5) with full min-1 chain
---

## Assertion Verification

### Assertion 1: Modified DEF with +6 combat stages
- **Scenario says:** Multiplier at +6 = ×2.2; Modified DEF = floor(DEF(10) × 2.2) = floor(22.0) = 22
- **Independent derivation:** CS +6 multiplier = ×2.2 (core/07-combat.md p235). floor(10 × 2.2) = floor(22.0) = 22.
- **Status:** CORRECT

### Assertion 2: Raw damage negative → min 1 → resistance → floor → final min 1
- **Scenario says:** Tackle DB 5 → set damage 13; Raw = 13 + ATK(5) - ModDEF(22) = -4; min 1 → 1; Normal vs Rock/Ground → Rock resists (×0.5), Ground neutral (×1) → combined ×0.5; floor(1 × 0.5) = 0; final min 1 (not immune) → 1
- **Independent derivation:**
  1. DB 5 set damage chart: 9/13/16, average = 13 ✓
  2. Raw = 13 + 5 - 22 = -4
  3. Defense minimum: "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0" (core/07-combat.md p236) → max(1, -4) = 1
  4. Type effectiveness: Normal vs Rock = resisted (×0.5). Normal vs Ground = neutral (×1). Combined = ×0.5.
  5. After effectiveness: floor(1 × 0.5) = floor(0.5) = 0
  6. Final minimum: Normal is resisted by Rock, NOT immune. Per damage formula `max(1, floor(max(1, damage) * effectiveness))` when not immune → max(1, 0) = 1.
  7. Final damage = 1
- **Status:** CORRECT
- **Previous issue resolved:** Original scenario incorrectly claimed Normal vs Rock/Ground = neutral (×1). Corrected derivation now shows the full chain: raw(-4) → min 1 → ×0.5 → floor(0.5)=0 → final min 1 = 1.

### Assertion 3: Geodude HP reduced by exactly 1
- **Scenario says:** Geodude HP = level(10) + (baseHp(4) × 3) + 10 = 32; Remaining = 32 - 1 = 31; displays "31/32"
- **Independent derivation:** HP = 10 + (4 × 3) + 10 = 10 + 12 + 10 = 32. Remaining = 32 - 1 = 31.
- **Status:** CORRECT

## Data Validity

- [x] Bulbasaur: base stats match gen1/bulbasaur.md (HP 5, ATK 5, DEF 5, SpATK 7, SpDEF 7, SPD 5)
- [x] Bulbasaur: types Grass/Poison match pokedex
- [x] Tackle: learnable by Bulbasaur at level 1 (available at level 10)
- [x] Geodude: base stats match gen1/geodude.md (HP 4, ATK 8, DEF 10, SpATK 3, SpDEF 3, SPD 2)
- [x] Geodude: types Rock/Ground match pokedex
- [x] DB 5 set damage = 13 matches PTU Damage Chart (core/07-combat.md p237)
- [x] CS +6 multiplier = ×2.2 matches PTU Combat Stages table (core/07-combat.md p235)
- [x] Normal vs Rock = resisted (×0.5) confirmed on PTU Type Chart

## Completeness Check

- [x] Defense higher than damage + ATK — covered
- [x] Minimum 1 damage after defense — explicitly verified
- [x] Resistance reducing below 1 — explicitly verified (Rock resists Normal)
- [x] Final minimum 1 (non-immune) — explicitly verified
- [x] Full derivation chain: raw → min 1 → effectiveness → final min 1
- [x] HP result verified

## Errata Check

- No errata in errata-2.md affects minimum damage rules, combat stages, or type resistance

## Issues Found

(none — previous Rock-resists-Normal derivation error fully corrected)
