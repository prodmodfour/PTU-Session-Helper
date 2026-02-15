---
skill: playtester
last_analyzed: 2026-02-15T23:59:00
analyzed_by: retrospective-analyst
total_lessons: 2
domains_covered:
  - combat
---

# Lessons: Playtester

## Summary
The Playtester silently worked around two API-level discoveries during spec authoring instead of filing reports. Adapting specs to match undocumented API behavior hides potentially valuable feedback from the rest of the pipeline — both for the Scenario Crafter (wrong field names in scenarios) and for the Developer (API surface inconsistencies, missing response fields).

---

## Lesson 1: File a report when scenario API payloads don't match the actual API

- **Category:** process-gap
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15
- **Status:** active

### Pattern
The Playtester discovered that the Pokemon creation API requires `baseSpAtk`/`baseSpDef` field names, but scenario files used `baseSpAttack`/`baseSpDefense`. Rather than filing a SCENARIO_BUG correction (or an APP_BUG for inconsistent API naming), the Playtester silently adapted the field names in the spec files and noted it only as a "Test Architecture Note" in pipeline-state.md.

This silent adaptation has two consequences:
1. The scenario files still contain the wrong field names — any future skill reading them will hit the same mismatch
2. The API naming inconsistency (`baseAttack` vs `baseSpAtk` — full word for one, abbreviation for the other) was never evaluated as a potential APP_BUG

### Evidence
- `artifacts/pipeline-state.md` line 70: "Field mapping fix: Pokemon creation API requires `baseSpAtk`/`baseSpDef` (not `baseSpAttack`/`baseSpDefense`)"
- No corresponding entry in `artifacts/reports/` — the reports directory is empty
- Spec files silently use the corrected field names without the scenario files being updated

### Recommendation
When the Playtester discovers that a scenario's API payload field names don't match what the app accepts, file a SCENARIO_BUG correction report so the Scenario Crafter can update the scenario file. If the API naming itself is inconsistent (mixing full words and abbreviations for the same concept), also file an APP_BUG report for the Developer to evaluate. Never silently adapt — the pipeline depends on reports to propagate discoveries.

---

## Lesson 2: File a report when scenario assertions can't be verified through the API

- **Category:** process-gap
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15
- **Status:** active

### Pattern
Several scenarios include evasion-related assertions (e.g., "Special Evasion = 1, threshold = 3"). The Playtester discovered that the combatant API response does not include a `specialEvasion` field — evasion is computed client-side from `entity.currentStats.specialDefense`. The Playtester worked around this by replicating the evasion formula in the test code itself.

This means the test is verifying its own evasion calculation against itself, not verifying the app's evasion calculation. The assertion passes by definition rather than by testing real behavior.

### Evidence
- `artifacts/pipeline-state.md` line 71: "No `specialEvasion` on combatant: Evasion is computed client-side from `entity.currentStats.specialDefense`"
- No corresponding entry in `artifacts/reports/` — gap in testability was not reported
- Evasion assertions in combat-basic-physical-001, combat-basic-special-001, combat-combat-stages-001 are effectively self-referential

### Recommendation
When a scenario assertion requires data that isn't available in the API response, file an AMBIGUOUS report flagging the testability gap. The report should state: (a) which assertion can't be verified end-to-end, (b) what data is missing from the API, and (c) whether the assertion should be removed, converted to a UI-only check, or whether the API should be extended. Never replicate app logic in test code to fill the gap — that defeats the purpose of the test.
