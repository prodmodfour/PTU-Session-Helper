---
skill: scenario-crafter
last_analyzed: 2026-02-16T00:30:00
analyzed_by: retrospective-analyst
total_lessons: 5
domains_covered:
  - combat
---

# Lessons: Scenario Crafter

## Summary
Five lessons span two pipeline cycles (Tier 2 + Tier 1). The original three (STAB, learn levels, type effectiveness) were successfully applied in all 7 Tier 1 scenarios and have been **integrated as permanent mandatory process steps** in the Scenario Crafter skill (Step 2). Two new Tier 1 patterns share a common root: assuming app behavior matches PTU rules without verifying against the actual implementation — once for non-deterministic stat generation, once for type-immunity enforcement in a GM-tool API. These have also been integrated as mandatory checks in the skill.

---

## Lesson 1: Verify STAB eligibility for every attacker/move pair

- **Category:** missing-check
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-15
- **Status:** resolved (integrated into Scenario Crafter Step 2 as mandatory STAB validation)

### Pattern
When selecting a Pokemon species and move for a scenario, the Scenario Crafter did not explicitly check whether the attacker's type(s) match the move's type. This caused two opposite failures: one scenario that intended to demonstrate no-STAB accidentally used a type-matching pair (Charmander/Ember), and another that should have applied STAB didn't (Geodude/Earthquake).

### Evidence
- `artifacts/verifications/combat-basic-special-001.verified.md`: STAB omission on Charmander/Ember
- `artifacts/verifications/combat-multi-target-001.verified.md`: Earthquake STAB missing for Geodude
- `git diff 978f1c7`: Replaced Charmander/Ember with Psyduck/Confusion; added STAB to Geodude/Earthquake
- **Tier 1 validation:** All 7 Tier 1 scenarios correctly applied this lesson — 8 attacker/move pairs checked, including 1 explicit no-STAB (Caterpie/Tackle)

### Recommendation
Add an explicit STAB check step to the Scenario Crafter process: after selecting the attacker species and move, compare the attacker's type list against the move's type. Annotate the scenario with either "STAB applies (+2 DB)" or "No STAB (type mismatch: [attacker types] vs [move type])". This check must happen before computing any damage derivation.

---

## Lesson 2: Verify move learn level against pokedex before assigning

- **Category:** data-lookup
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-15
- **Status:** resolved (integrated into Scenario Crafter Step 2 as mandatory learn-level validation)

### Pattern
The Scenario Crafter assigned moves to Pokemon at levels below the actual learn level, assuming common moves (Water Gun, Earthquake) were available at L10 without consulting the pokedex files. Both instances required raising the Pokemon's level to match the move's actual learn level.

### Evidence
- `artifacts/verifications/combat-type-effectiveness-001.verified.md`: Water Gun not learnable at L10 (L13 actual)
- `artifacts/verifications/combat-multi-target-001.verified.md`: Earthquake unavailable at L10 (L34 actual)
- `git diff 978f1c7`: Squirtle L10→L13, Geodude L10→L34
- **Tier 1 validation:** All 7 Tier 1 scenarios correctly applied this lesson — 8 move/level pairs verified with pokedex citations

### Recommendation
Add a mandatory data-lookup step to the Scenario Crafter process: after selecting a species and move, open the species' pokedex file (`books/markdown/pokedexes/<gen>/<species>.md`) and verify the move's learn level. Set the Pokemon's level to at least that learn level. Include the learn-level source in the scenario file as a comment (e.g., "Earthquake learned at L34 per gen1/geodude.md").

---

## Lesson 3: Verify type effectiveness for every type pair in the scenario

- **Category:** data-lookup
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15
- **Status:** resolved (integrated into Scenario Crafter Step 2 as mandatory type-chart validation)

### Pattern
The Scenario Crafter incorrectly stated that Normal vs Rock/Ground = neutral (x1), when Rock actually resists Normal (x0.5). The final damage value happened to be correct (1) due to the minimum damage rule, masking the derivation error.

### Evidence
- `artifacts/verifications/combat-minimum-damage-001.verified.md`: Rock resists Normal, not neutral
- `git diff 978f1c7`: Corrected derivation chain: raw(-4) → min 1 → x0.5 → 0 → final min 1
- **Tier 1 validation:** All 7 Tier 1 scenarios correctly applied this lesson — 10 unique type matchups individually verified against type chart

### Recommendation
When a scenario involves type effectiveness, explicitly look up each type pair individually against the PTU type chart (core/10-indices-and-reference.md). For dual-type targets, check move type vs Type1 AND move type vs Type2 separately, then multiply. Do not assume "neutral" without verification.

---

## Lesson 4: Verify whether APIs produce deterministic output before assuming exact values

- **Category:** missing-check
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-15 (Tier 1)
- **Status:** active

### Pattern
The Scenario Crafter wrote assertions with exact expected HP values for Pokemon created by `wild-spawn` and `template-load` endpoints, assuming stats would be deterministic based on species base stats alone (HP = level + baseHp×3 + 10). In reality, `generateAndCreatePokemon` distributes `level - 1` random stat points via weighted random selection. Each HP point allocated adds 3 to maxHp, producing a range of possible values. This caused failures in 2 of 7 Tier 1 scenarios (correction-002, correction-003), with a third scenario (correction-003) sharing the identical root cause.

### Evidence
- `artifacts/reports/correction-002.md`: Wild-encounter Oddish HP expected 35 but varied (35, 38, 41, 44, 47)
- `artifacts/reports/correction-003.md`: Template-setup Charmander HP expected 34 but varied due to same mechanism
- `git diff 2a4f84e`: Wild-encounter spec reads actual stats via `GET /api/pokemon/$id` after spawn; template-setup spec uses `>= minimum` bounds and `currentHp = maxHp` checks
- Conversation transcripts: Pattern was initially misattributed to parallel test interference by the Playtester, costing a retry cycle before the true root cause was identified

### Recommendation
Before writing any assertion with an exact expected stat value, determine whether the API endpoint that creates the entity produces deterministic or non-deterministic output. For endpoints that use `generateAndCreatePokemon` (wild-spawn, template-load), stats will be non-deterministic. In these cases, either: (a) read actual stats from the API after creation and derive expected values dynamically, or (b) assert minimum bounds and relational properties (e.g., `currentHp = maxHp`, `maxHp >= base-only minimum`). Document which approach is used and why in the scenario file.

---

## Lesson 5: Distinguish between PTU rules the app enforces and rules left to the GM

- **Category:** missing-check
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15 (Tier 1)
- **Status:** active

### Pattern
The Scenario Crafter wrote an assertion expecting the status API to reject Paralysis on Pikachu (Electric type) based on PTU type immunity rules. The API is intentionally a GM tool that applies any valid status without type checking — an existing design decision already documented and tested in Tier 2 (`combat-status-conditions-001.spec.ts`). The scenario conflated "PTU says this should happen" with "the app enforces this."

### Evidence
- `artifacts/reports/correction-001.md`: Status-chain scenario assumed Electric immunity blocks Paralysis via API
- `git diff 2a4f84e`: Removed immunity assertion, reduced `ptu_assertions` from 9 to 8
- Existing test: `combat-status-conditions-001.spec.ts` lines 123-149 already validates that the status API is type-agnostic

### Recommendation
When writing an assertion about a PTU rule, explicitly determine whether the app enforces that rule at the API level or whether it's a GM responsibility. Check existing tests and service code for prior art. If the API is a GM tool (status application, damage application), assertions should test what the API actually does, not what PTU says should happen at the table. Annotate the scenario with the enforcement boundary: "App-enforced" or "GM-enforced (not in API)."
