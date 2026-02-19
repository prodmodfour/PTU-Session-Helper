---
scenario_id: healing-daily-rest-cap-001
run_id: 2026-02-19-001
status: ERROR
spec_file: N/A (not written — blocked by FEATURE_GAP)
duration_ms: 0
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | 450 min allows one more rest | Rest succeeds, restMinutesToday incremented | N/A | N/A |
| 2 | 480 min blocks further rest | Rest blocked, daily cap reached | N/A | N/A |
| 3 | 510 min blocks further rest | Rest blocked, daily cap reached | N/A | N/A |

## Errors
- FEATURE_GAP: PUT /api/pokemon/:id does not support setting `restMinutesToday` (needed values: 450, 480, 510). See bug-003.md.
- SCENARIO_BUG: Character creation uses wrong field names. See correction-006.md.

## Playwright Errors
<!-- N/A - spec not written -->

## Screenshots
<!-- N/A -->

## Self-Correction Log
<!-- N/A - blocked by API gap, not a test infrastructure issue -->
