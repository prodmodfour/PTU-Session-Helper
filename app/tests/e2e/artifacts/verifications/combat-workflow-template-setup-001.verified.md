---
scenario_id: combat-workflow-template-setup-001
verified_at: 2026-02-15T12:00:00Z
status: PASS
assertions_checked: 7
assertions_correct: 7
---

## Assertion Verification

### Assertion 1: Template Created
- **Scenario says:** Template exists with name "Gym Battle: Fire Team" and id = $template_id
- **Independent derivation:** API assertion — POST /api/encounter-templates/from-encounter returns a template record with the given name. No PTU math involved.
- **Status:** CORRECT

### Assertion 2: Encounter Created from Template
- **Scenario says:** New encounter exists with id = $encounter_id
- **Independent derivation:** API assertion — POST /api/encounter-templates/:id/load creates a new encounter from template data. No PTU math involved.
- **Status:** CORRECT

### Assertion 3: Template Combatants Present
- **Scenario says:** Charmander HP = 34, Rattata HP = 29
- **Independent derivation:**
  - Charmander HP = 12 + (4 × 3) + 10 = 12 + 12 + 10 = 34. Base HP 4 from gen1/charmander.md.
  - Rattata HP = 10 + (3 × 3) + 10 = 10 + 9 + 10 = 29. Base HP 3 from gen1/rattata.md.
- **Status:** CORRECT

### Assertion 4: Player Combatant Added
- **Scenario says:** 3 total combatants, Squirtle HP = 35 on players side
- **Independent derivation:**
  - Squirtle HP = 13 + (4 × 3) + 10 = 13 + 12 + 10 = 35. Base HP 4 from gen1/squirtle.md.
  - 2 template combatants + 1 player combatant = 3 total.
- **Status:** CORRECT

### Assertion 5: Initiative Calculated
- **Scenario says:** Charmander SPD 7, Rattata SPD 7, Squirtle SPD 4. Squirtle last.
- **Independent derivation:**
  - Charmander SPD 7 (gen1/charmander.md), Rattata SPD 7 (gen1/rattata.md), Squirtle SPD 4 (gen1/squirtle.md)
  - Order: Charmander/Rattata (7, tied — stable sort) > Squirtle (4)
  - Squirtle is last. Per core/07-combat.md p227: "all participants simply go in order from highest to lowest speed".
- **Status:** CORRECT

### Assertion 6: Encounter Started
- **Scenario says:** isActive = true
- **Independent derivation:** POST /api/encounters/:id/start sets encounter to active state.
- **Status:** CORRECT

### Assertion 7: Encounter Served
- **Scenario says:** isServed = true
- **Independent derivation:** POST /api/encounters/:id/serve sets encounter to served state, broadcasting to Group View.
- **Status:** CORRECT

## Data Validity
- [x] Charmander: base stats match gen1/charmander.md (HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7)
- [x] Charmander: type Fire matches gen1/charmander.md
- [x] Rattata: base stats match gen1/rattata.md (HP 3, ATK 6, DEF 4, SpATK 3, SpDEF 4, SPD 7)
- [x] Rattata: type Normal matches gen1/rattata.md
- [x] Squirtle: base stats match gen1/squirtle.md (HP 4, ATK 5, DEF 7, SpATK 5, SpDEF 6, SPD 4)
- [x] Squirtle: type Water matches gen1/squirtle.md

## Completeness Check
- [x] Loop combat-workflow-setup-from-template: Template creation covered
- [x] Template loading into new encounter covered
- [x] Template combatants verified with correct stats
- [x] Player combatant addition covered
- [x] Initiative calculation covered
- [x] Start and serve lifecycle covered

## Errata Check
- No errata in errata-2.md affects encounter templates, initiative, or encounter lifecycle used here.

## Lessons Applied
- [x] Lesson 1 (STAB eligibility): No damage moves in this scenario — N/A
- [x] Lesson 2 (learn level): No moves used in this scenario — N/A
- [x] Lesson 3 (type effectiveness): No type interactions in this scenario — N/A

## Issues Found
<!-- None -->
