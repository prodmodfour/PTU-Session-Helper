---
scenario_id: combat-multi-target-001
verified_at: 2026-02-15T21:00:00
status: PASS
assertions_checked: 4
assertions_correct: 4
re_verification: true
previous_status: FAIL (0 of 4 correct — Earthquake unavailable at L10, STAB missing)
correction_applied: Geodude raised to L34 for Earthquake access, STAB applied (DB 10+2=12, set=30)
---

## Assertion Verification

### Assertion 1: Single set damage roll with STAB
- **Scenario says:** Geodude is Rock/Ground, Earthquake is Ground → STAB; DB 10 + 2 = 12 → set damage 30
- **Independent derivation:** STAB check: Geodude types = [Rock, Ground], Earthquake type = Ground → match on Ground → +2 DB. Effective DB = 10 + 2 = 12. Set damage chart DB 12: 13/30/46, average = 30. Rule: "If a Pokémon uses a damaging Move with which it shares a Type, the Damage Base of the Move is increased by +2" (core/07-combat.md p236).
- **Status:** CORRECT
- **Previous issue resolved:** Original scenario used DB 10 (no STAB, set damage 24). Now correctly applies STAB for DB 12, set damage 30.

### Assertion 2: Charmander damage — Ground vs Fire = SE
- **Scenario says:** Damage before effectiveness = max(1, 30 + ATK(8) - DEF(4)) = 34; Ground vs Fire = SE (×1.5); Final = floor(34 × 1.5) = 51; Charmander HP 32 → fainted
- **Independent derivation:** Damage before effectiveness = max(1, 30 + 8 - 4) = max(1, 34) = 34. Type: Ground vs Fire = Super Effective (×1.5). Final = floor(34 × 1.5) = floor(51.0) = 51. Charmander HP = 10 + (4 × 3) + 10 = 32. 51 > 32 → HP = 0, Fainted.
- **Status:** CORRECT

### Assertion 3: Machop damage — Ground vs Fighting = neutral
- **Scenario says:** Damage before effectiveness = max(1, 30 + ATK(8) - DEF(5)) = 33; Ground vs Fighting = neutral (×1); Final = 33; Machop HP = 41; Remaining = 8
- **Independent derivation:** Damage before effectiveness = max(1, 30 + 8 - 5) = max(1, 33) = 33. Type: Ground vs Fighting = neutral (×1). Final = 33. Machop HP = 10 + (7 × 3) + 10 = 10 + 21 + 10 = 41. Remaining = 41 - 33 = 8.
- **Status:** CORRECT

### Assertion 4: Different final damage per target
- **Scenario says:** Charmander 51 (SE ×1.5, DEF 4) vs Machop 33 (neutral ×1, DEF 5)
- **Independent derivation:** Same base damage (30) → Charmander: (30+8-4)×1.5 = 51. Machop: (30+8-5)×1 = 33. 51 ≠ 33 confirms per-target calculation with different DEF and type effectiveness.
- **Status:** CORRECT

## Data Validity

- [x] Geodude: base stats match gen1/geodude.md (HP 4, ATK 8, DEF 10, SpATK 3, SpDEF 3, SPD 2)
- [x] Geodude: types Rock/Ground match pokedex
- [x] Earthquake: learnable by Geodude at level 34 (learned at level 34 — exact match with L34 Geodude)
- [x] Charmander: base stats match gen1/charmander.md (HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7)
- [x] Charmander: type Fire matches pokedex
- [x] Machop: base stats match gen1/machop.md (HP 7, ATK 8, DEF 5, SpATK 4, SpDEF 4, SPD 4)
- [x] Machop: type Fighting matches pokedex
- [x] DB 12 set damage = 30 matches PTU Damage Chart (core/07-combat.md p237)
- [x] Ground vs Fire = SE confirmed on PTU Type Chart
- [x] Ground vs Fighting = neutral confirmed on PTU Type Chart
- **Previous issues resolved:** Geodude raised from L10 to L34 (Earthquake learn level). STAB now applied.

## Completeness Check

- [x] Single damage roll shared across targets (loop requirement)
- [x] Per-target defense subtraction demonstrated (DEF 4 vs DEF 5)
- [x] Per-target type effectiveness demonstrated (SE vs neutral)
- [x] Different final damage per target explicitly asserted
- [x] Faint condition on overkill verified (Charmander: 51 > 32)
- [x] STAB correctly applied to multi-target move
- [ ] Edge case: mixed hit/miss — separate scenario if needed

## Errata Check

- No errata in errata-2.md affects multi-target mechanics, STAB, or type effectiveness

## Issues Found

(none — previous Earthquake access and STAB issues fully resolved)
