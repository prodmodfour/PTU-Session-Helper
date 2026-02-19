---
scenario_id: healing-workflow-overnight-extended-rest-001
run_id: 2026-02-19-001
status: ERROR
spec_file: N/A (not written — blocked by FEATURE_GAP)
duration_ms: 0
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Character HP recovery (extended rest formula) | currentHp restored by extended rest amount | N/A | N/A |
| 2 | Character persistent status cleared, volatile survives | Persistent conditions removed, volatile retained | N/A | N/A |
| 3 | Character drained AP restored | drainedAp=0, AP fully restored | N/A | N/A |
| 4 | Character rest minutes tracked | restMinutesToday incremented by extended rest duration | N/A | N/A |
| 5 | Pokemon HP recovery (extended rest formula) | currentHp restored by extended rest amount | N/A | N/A |
| 6 | Pokemon statuses cleared | All conditions removed | N/A | N/A |
| 7 | Pokemon daily moves restored | All move dailyUses reset | N/A | N/A |
| 8 | Pokemon rest minutes tracked | restMinutesToday incremented by extended rest duration | N/A | N/A |

## Errors
- FEATURE_GAP: PUT /api/characters/:id does not support setting `drainedAp`. Most assertions are testable EXCEPT assertion 3 (drainedAp/apRestored). See bug-003.md.
- SCENARIO_BUG: Character creation uses wrong field names. See correction-006.md.

## Playwright Errors
<!-- N/A - spec not written -->

## Screenshots
<!-- N/A -->

## Self-Correction Log
<!-- N/A - blocked by API gap, not a test infrastructure issue -->
