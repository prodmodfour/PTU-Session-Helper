---
scenario_id: healing-workflow-global-new-day-reset-001
run_id: 2026-02-19-001
status: ERROR
spec_file: N/A (not written — blocked by FEATURE_GAP)
duration_ms: 0
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | New day reset succeeds | POST /api/game/new-day returns success | N/A | N/A |
| 2 | Character daily counters reset | restMinutesToday=0, injuriesHealedToday=0 | N/A | N/A |
| 3 | Character non-daily state preserved | injuries, drainedAp, lastInjuryTime unchanged | N/A | N/A |
| 4 | Pokemon daily counters reset | restMinutesToday=0, injuriesHealedToday=0 | N/A | N/A |
| 5 | Pokemon non-daily state preserved | injuries, lastInjuryTime unchanged | N/A | N/A |
| 6 | Rest available after reset | Rest succeeds post-reset (restMinutesToday was reset to 0) | N/A | N/A |

## Errors
- FEATURE_GAP: PUT /api/characters/:id does not support setting `injuries`, `restMinutesToday`, `injuriesHealedToday`, `drainedAp`, or `lastInjuryTime`. PUT /api/pokemon/:id does not support setting `injuries`, `restMinutesToday`, `injuriesHealedToday`, or `lastInjuryTime`. Pre-conditions cannot be established without these fields. See bug-003.md.
- SCENARIO_BUG: Character creation uses wrong field names. See correction-006.md.

## Playwright Errors
<!-- N/A - spec not written -->

## Screenshots
<!-- N/A -->

## Self-Correction Log
<!-- N/A - blocked by API gap, not a test infrastructure issue -->
