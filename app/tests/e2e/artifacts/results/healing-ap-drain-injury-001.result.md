---
scenario_id: healing-ap-drain-injury-001
run_id: 2026-02-19-001
status: ERROR
spec_file: N/A (not written — blocked by FEATURE_GAP)
duration_ms: 0
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | First AP drain costs 2 AP | drainedAp=2, injuries decremented by 1 | N/A | N/A |
| 2 | Second AP drain accumulates | drainedAp=4, injuries decremented by 1 | N/A | N/A |
| 3 | Third drain clears lastInjuryTime | lastInjuryTime=null when injuries reach 0 | N/A | N/A |
| 4 | Timer preserved during drain | lastInjuryTime unchanged when injuries > 0 after drain | N/A | N/A |

## Errors
- FEATURE_GAP: PUT /api/characters/:id does not support setting `injuries`, `injuriesHealedToday`, `drainedAp`, or `lastInjuryTime`. See bug-003.md.
- SCENARIO_BUG: Character creation uses wrong field names. See correction-006.md.

## Playwright Errors
<!-- N/A - spec not written -->

## Screenshots
<!-- N/A -->

## Self-Correction Log
<!-- N/A - blocked by API gap, not a test infrastructure issue -->
