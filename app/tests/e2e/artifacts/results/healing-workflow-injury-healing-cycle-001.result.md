---
scenario_id: healing-workflow-injury-healing-cycle-001
run_id: 2026-02-19-001
status: ERROR
spec_file: N/A (not written — blocked by FEATURE_GAP)
duration_ms: 0
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Natural heal succeeds (25h timer elapsed) | injuries decremented, injuriesHealedToday=1 | N/A | N/A |
| 2 | AP drain heal succeeds | injuries decremented, drainedAp+=2, injuriesHealedToday=2 | N/A | N/A |
| 3 | Daily cap blocks third injury heal | Injury heal blocked, injuriesHealedToday=3 already | N/A | N/A |
| 4 | Natural heal also blocked at daily cap | Natural injury heal blocked even with timer elapsed | N/A | N/A |
| 5 | Post-cycle injuries count correct | injuries = initial - 2 (one natural + one AP drain) | N/A | N/A |
| 6 | Post-cycle daily counters correct | injuriesHealedToday=2, drainedAp reflects AP drain cost | N/A | N/A |

## Errors
- FEATURE_GAP: PUT /api/characters/:id does not support setting `injuries`, `injuriesHealedToday`, or `lastInjuryTime`. See bug-003.md.
- SCENARIO_BUG: Character creation uses wrong field names. See correction-006.md.

## Playwright Errors
<!-- N/A - spec not written -->

## Screenshots
<!-- N/A -->

## Self-Correction Log
<!-- N/A - blocked by API gap, not a test infrastructure issue -->
