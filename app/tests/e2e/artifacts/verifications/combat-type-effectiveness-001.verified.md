---
scenario_id: combat-type-effectiveness-001
verified_at: 2026-02-15T21:00:00
status: PASS
assertions_checked: 4
assertions_correct: 4
re_verification: true
previous_status: PARTIAL (4 of 4 correct but Water Gun not learnable at L10)
correction_applied: Raised Squirtle from L10 to L13 so Water Gun is available
---

## Assertion Verification

### Assertion 1: Type effectiveness detection
- **Scenario says:** Water vs Fire = Super Effective
- **Independent derivation:** PTU Type Chart: Water attacking Fire = Super Effective (×1.5). Rule: "A Super-Effective hit will deal x1.5 damage" (core/07-combat.md p236).
- **Status:** CORRECT

### Assertion 2: Damage before effectiveness (with STAB)
- **Scenario says:** Water Gun DB 4; STAB applies (Squirtle=Water, Water Gun=Water); DB 4+2=6 → set damage 15; Damage = 15 + SpATK(5) - SpDEF(5) = 15
- **Independent derivation:** STAB check: Squirtle types = [Water], Water Gun type = Water → match → +2 DB. Effective DB = 4 + 2 = 6. Set damage chart DB 6: 10/15/20, average = 15. Damage = 15 + 5 - 5 = 15.
- **Status:** CORRECT
- **Note:** Scenario text contains confusing inline correction ("No STAB...actually this IS STAB!"). The calculation proceeds correctly with STAB. Cosmetic wording issue only — does not affect assertion validity.

### Assertion 3: Damage after Super Effective multiplier
- **Scenario says:** floor(15 × 1.5) = floor(22.5) = 22
- **Independent derivation:** PTU rule: effectiveness applied after defense. floor(15 × 1.5) = floor(22.5) = 22. Rule: "After defenses and damage reduction have been applied, apply Type Weaknesses or Resistances" (core/07-combat.md p236).
- **Status:** CORRECT

### Assertion 4: Charmander HP after super effective hit
- **Scenario says:** HP = level(10) + (baseHp(4) × 3) + 10 = 32; Remaining = 32 - 22 = 10; displays "10/32"
- **Independent derivation:** HP = 10 + (4 × 3) + 10 = 10 + 12 + 10 = 32. Remaining = 32 - 22 = 10.
- **Status:** CORRECT

## Data Validity

- [x] Squirtle: base stats match gen1/squirtle.md (HP 4, ATK 5, DEF 7, SpATK 5, SpDEF 6, SPD 4)
- [x] Squirtle: type Water matches pokedex
- [x] Water Gun: learnable by Squirtle at level 13 (learned at level 13 — exact match with L13 Squirtle)
- [x] Charmander: base stats match gen1/charmander.md (HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7)
- [x] Charmander: type Fire matches pokedex
- [x] DB 6 set damage = 15 matches PTU Damage Chart (core/07-combat.md p237)
- [x] Water vs Fire = SE confirmed on PTU Type Chart
- **Previous issue resolved:** Squirtle raised from L10 to L13, Water Gun now available at exact learn level.

## Completeness Check

- [x] SE detection and indicator — tested
- [x] STAB correctly identified and applied
- [x] Effectiveness applied after defense subtraction (PTU order of operations)
- [x] Floor applied to fractional result
- [x] HP result verified
- [ ] Edge case: Doubly SE — separate scenario if needed
- [ ] Edge case: Immunity — covered by combat-type-immunity-001

## Errata Check

- No errata in errata-2.md affects type effectiveness mechanics or STAB

## Issues Found

1. **Cosmetic (non-blocking):** Assertion 2 text includes "No STAB (Squirtle is Water, Water Gun is Water — actually this IS STAB!)" which reads as a self-correction. The math is correct. Recommend rewording to simply state STAB applies.
