---
scenario_id: capture-mechanic-worked-examples-001
run_id: 2026-02-16-001
status: PASS
spec_file: tests/e2e/scenarios/capture/capture-mechanic-worked-examples-001.spec.ts
duration_ms: 135
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | PTU Example 1: L10 Pikachu, 70% HP, Confused | captureRate=70, evolutionModifier=0 | captureRate=70, evolutionModifier=0 | PASS |
| 2 | PTU Example 2: Shiny L30 Caterpie, 40% HP, 1 Injury | captureRate=45, evolutionModifier=10 | captureRate=45, evolutionModifier=10 | PASS |
| 3 | PTU Example 3: L80 Hydreigon, 1 HP, Burned+Poisoned+1 Injury | captureRate=-15, evolutionModifier=-10 | captureRate=-15, evolutionModifier=-10 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None — all passed -->

## Self-Correction Log
<!-- None — clean run -->

## Notes
- **Retest of run 2026-02-15-001** which failed due to APP_BUG: `evolutionStage` was hardcoded to 1 for all species in SpeciesData.
- The evolution stage bug has been fixed. Pikachu now correctly returns `evolutionStage=2` (evoMod=0) and Hydreigon returns `evolutionStage=3` (evoMod=-10).
- All three PTU worked examples now match the rulebook exactly.
