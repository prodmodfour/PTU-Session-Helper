---
scenario_id: combat-workflow-status-chain-001
verified_at: 2026-02-15T12:00:00Z
status: PASS
assertions_checked: 9
assertions_correct: 9
---

## Assertion Verification

### Assertion 1: HP Values
- **Scenario says:** Eevee HP = 41, Pikachu HP = 36
- **Independent derivation:**
  - Eevee HP = 13 + (6 × 3) + 10 = 13 + 18 + 10 = 41. Base HP 6 from gen1/eevee.md.
  - Pikachu HP = 14 + (4 × 3) + 10 = 14 + 12 + 10 = 36. Base HP 4 from gen1/pikachu.md.
- **Status:** CORRECT

### Assertion 2: Paralyzed Applied to Eevee
- **Scenario says:** Eevee types = [Normal], Normal has no Paralysis immunity
- **Independent derivation:** Per core/07-combat.md p239: "Electric Types are immune to Paralysis". Eevee is Normal, not Electric → not immune → Paralyzed applied.
- **Status:** CORRECT

### Assertion 3: Speed Stage Penalty
- **Scenario says:** Paralyzed lowers Speed by 4 CS → Eevee speed stage = −4
- **Independent derivation:** Per core/07-combat.md p247: "Speed is lowered 4 Combat Stages". −4 CS applied to Eevee's speed.
- **Status:** CORRECT

### Assertion 4: Electric Immunity Blocks Paralysis
- **Scenario says:** Pikachu types = [Electric], immune to Paralysis
- **Independent derivation:** Per core/07-combat.md p239: "Electric Types are immune to Paralysis". Pikachu is Electric → immune → Paralyzed NOT added.
- **Status:** CORRECT

### Assertion 5: Multiple Statuses Stacked
- **Scenario says:** Eevee has both Paralyzed (persistent) and Confused (volatile) simultaneously
- **Independent derivation:** Per core/07-combat.md p246: "there is no limit to the number of Status Afflictions that a single target can have". Both can coexist.
- **Status:** CORRECT

### Assertion 6: Stages Reset by Breather
- **Scenario says:** Speed was −4, after Breather all stages reset to 0
- **Independent derivation:** Per core/07-combat.md p245: "set their Combat Stages back to their default level". Default = 0. Speed −4 → 0.
- **Status:** CORRECT

### Assertion 7: Volatile Cleared, Persistent Remains
- **Scenario says:** Confused (volatile) removed, Paralyzed (persistent) remains after Breather
- **Independent derivation:** Per core/07-combat.md p245: "cured of all Volatile Status effects". Confused is volatile → removed. Paralyzed is persistent → NOT affected by Breather.
- **Status:** CORRECT

### Assertion 8: Breather Penalty Applied
- **Scenario says:** Eevee gains Tripped and Vulnerable
- **Independent derivation:** Per core/07-combat.md p245: "They then become Tripped and are Vulnerable until the end of their next turn".
- **Status:** CORRECT

### Assertion 9: Persistent Status Survives Combat End
- **Scenario says:** Volatile (Tripped, Vulnerable) cleared at end, Persistent (Paralyzed) remains
- **Independent derivation:** Per core/07-combat.md p246: Volatile afflictions are "cured at the end of an encounter". Persistent afflictions survive combat end. Paralyzed persists on the entity record.
- **Status:** CORRECT

## Data Validity
- [x] Eevee: base stats match gen1/eevee.md (HP 6, ATK 6, DEF 5, SpATK 5, SpDEF 7, SPD 6)
- [x] Eevee: type Normal matches gen1/eevee.md
- [x] Pikachu: base stats match gen1/pikachu.md (HP 4, ATK 6, DEF 4, SpATK 5, SpDEF 5, SPD 9)
- [x] Pikachu: type Electric matches gen1/pikachu.md
- [x] Rattata: base stats match gen1/rattata.md (HP 3, ATK 6, DEF 4, SpATK 3, SpDEF 4, SPD 7)
- [x] Rattata: type Normal matches gen1/rattata.md
- [x] Paralyzed, Confused, Tripped, Vulnerable are all valid PTU status conditions
- [x] Status immunities: Electric → Paralysis immunity correctly applied

## Completeness Check
- [x] Loop combat-workflow-status-chain: Status application covered (Paralyzed on Eevee)
- [x] Type-based status immunity covered (Electric blocks Paralysis)
- [x] Persistent status effects covered (Paralyzed with −4 CS)
- [x] Volatile status effects covered (Confused applied)
- [x] Take a Breather covered (stages reset, volatile cleared, penalty applied)
- [x] Status clear on combat end covered (volatile cleared, persistent remains)

## Errata Check
- No errata in errata-2.md affects status conditions, Take a Breather, or type immunities used here.

## Lessons Applied
- [x] Lesson 1 (STAB eligibility): No damage moves in this scenario — N/A
- [x] Lesson 2 (learn level): No moves used in this scenario — N/A
- [x] Lesson 3 (type effectiveness): No damage type interactions — status type immunity verified against rulebook

## Issues Found
<!-- None -->
