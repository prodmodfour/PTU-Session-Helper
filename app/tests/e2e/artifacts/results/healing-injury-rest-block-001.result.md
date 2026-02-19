---
scenario_id: healing-injury-rest-block-001
run_id: 2026-02-19-001
status: ERROR
spec_file: N/A (not written — blocked by FEATURE_GAP)
duration_ms: 0
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | 4 injuries allows rest healing | Rest succeeds, HP restored | N/A | N/A |
| 2 | 5 injuries blocks rest healing | Rest blocked, error returned | N/A | N/A |
| 3 | 7 injuries blocks rest healing | Rest blocked, error returned | N/A | N/A |

## Errors
- FEATURE_GAP: PUT /api/pokemon/:id does not support setting `injuries` (needed values: 4, 5, 7). See bug-003.md.
- SCENARIO_BUG: Character creation uses wrong field names. See correction-006.md.

## Playwright Errors
<!-- N/A - spec not written -->

## Screenshots
<!-- N/A -->

## Self-Correction Log
<!-- N/A - blocked by API gap, not a test infrastructure issue -->
