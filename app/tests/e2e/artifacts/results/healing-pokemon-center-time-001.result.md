---
scenario_id: healing-pokemon-center-time-001
run_id: 2026-02-19-001
status: ERROR
spec_file: N/A (not written — blocked by FEATURE_GAP)
duration_ms: 0
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | 0 injuries = 60 min healing time | healingTimeMinutes=60 | N/A | N/A |
| 2 | 3 injuries = 150 min healing time | healingTimeMinutes=150 (60 + 3*30) | N/A | N/A |
| 3 | 4 injuries = 180 min healing time | healingTimeMinutes=180 (60 + 4*30) | N/A | N/A |
| 4 | 5 injuries = 360 min healing time | healingTimeMinutes=360 (60 + 5*60) | N/A | N/A |

## Errors
- FEATURE_GAP: PUT /api/pokemon/:id does not support setting `injuries` (needed values: 0, 3, 4, 5). See bug-003.md.
- SCENARIO_BUG: Character creation uses wrong field names. See correction-006.md.

## Playwright Errors
<!-- N/A - spec not written -->

## Screenshots
<!-- N/A -->

## Self-Correction Log
<!-- N/A - blocked by API gap, not a test infrastructure issue -->
