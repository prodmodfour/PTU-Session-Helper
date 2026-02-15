---
skill: scenario-crafter
last_analyzed: 2026-02-15T23:59:00
analyzed_by: retrospective-analyst
total_lessons: 3
domains_covered:
  - combat
---

# Lessons: Scenario Crafter

## Summary
All 4 corrected scenarios in the combat domain trace back to the Scenario Crafter. Two recurring patterns dominate: failing to verify STAB eligibility when choosing attacker/move pairs (2 scenarios), and failing to verify move learn levels against pokedex files (2 scenarios). A third isolated pattern involved a type effectiveness lookup error.

---

## Lesson 1: Verify STAB eligibility for every attacker/move pair

- **Category:** missing-check
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-15
- **Status:** active

### Pattern
When selecting a Pokemon species and move for a scenario, the Scenario Crafter did not explicitly check whether the attacker's type(s) match the move's type. This caused two opposite failures: one scenario that intended to demonstrate no-STAB accidentally used a type-matching pair (Charmander/Ember), and another that should have applied STAB didn't (Geodude/Earthquake).

### Evidence
- `artifacts/verifications/combat-basic-special-001.verified.md`: Previous status PARTIAL — "STAB omission on Charmander/Ember". Charmander(Fire) + Ember(Fire) triggers STAB, but scenario was testing basic special attack without STAB.
- `artifacts/verifications/combat-multi-target-001.verified.md`: Previous status FAIL — "Earthquake unavailable at L10, STAB missing". Geodude(Rock/Ground) + Earthquake(Ground) triggers STAB but DB was left at 10 (no +2).
- `git diff 978f1c7`: combat-basic-special-001 replaced Charmander/Ember with Psyduck(Water)/Confusion(Psychic) to isolate no-STAB. combat-multi-target-001 added STAB: DB 10+2=12, set damage 30.

### Recommendation
Add an explicit STAB check step to the Scenario Crafter process: after selecting the attacker species and move, compare the attacker's type list against the move's type. Annotate the scenario with either "STAB applies (+2 DB)" or "No STAB (type mismatch: [attacker types] vs [move type])". This check must happen before computing any damage derivation.

---

## Lesson 2: Verify move learn level against pokedex before assigning

- **Category:** data-lookup
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-15
- **Status:** active

### Pattern
The Scenario Crafter assigned moves to Pokemon at levels below the actual learn level, assuming common moves (Water Gun, Earthquake) were available at L10 without consulting the pokedex files. Both instances required raising the Pokemon's level to match the move's actual learn level.

### Evidence
- `artifacts/verifications/combat-type-effectiveness-001.verified.md`: Previous status PARTIAL — "Water Gun not learnable at L10". Squirtle learns Water Gun at L13, not L10. Fix: raised Squirtle to L13.
- `artifacts/verifications/combat-multi-target-001.verified.md`: Previous status FAIL — "Earthquake unavailable at L10". Geodude learns Earthquake at L34, not L10. Fix: raised Geodude to L34.
- `git diff 978f1c7`: combat-type-effectiveness-001 changed `"level": 10` to `"level": 13`. combat-multi-target-001 changed `"level": 10` to `"level": 34`.

### Recommendation
Add a mandatory data-lookup step to the Scenario Crafter process: after selecting a species and move, open the species' pokedex file (`books/markdown/pokedexes/<gen>/<species>.md`) and verify the move's learn level. Set the Pokemon's level to at least that learn level. Include the learn-level source in the scenario file as a comment (e.g., "Earthquake learned at L34 per gen1/geodude.md").

---

## Lesson 3: Verify type effectiveness for every type pair in the scenario

- **Category:** data-lookup
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15
- **Status:** active

### Pattern
The Scenario Crafter incorrectly stated that Normal vs Rock/Ground = neutral (x1), when Rock actually resists Normal (x0.5). The final damage value happened to be correct (1) due to the minimum damage rule, masking the derivation error. The wrong intermediate step would have been invisible to the Playtester since the expected final value was coincidentally right.

### Evidence
- `artifacts/verifications/combat-minimum-damage-001.verified.md`: Previous status PARTIAL — "derivation missed Rock resists Normal". Original claimed neutral (x1), corrected to show full chain: raw(-4) -> min 1 -> x0.5 -> 0 -> final min 1.
- `git diff 978f1c7`: combat-minimum-damage-001 replaced "Normal vs Rock/Ground = neutral (×1)" with full type-by-type breakdown showing Rock resists Normal.

### Recommendation
When a scenario involves type effectiveness, explicitly look up each type pair individually against the PTU type chart (core/10-indices-and-reference.md). For dual-type targets, check move type vs Type1 AND move type vs Type2 separately, then multiply. Do not assume "neutral" without verification, especially for Normal-type moves which are resisted by Rock and Steel and immune by Ghost.
