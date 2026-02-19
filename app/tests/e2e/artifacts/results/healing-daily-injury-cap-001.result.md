---
scenario_id: healing-daily-injury-cap-001
run_id: 2026-02-19-001
status: ERROR
spec_file: N/A (not written — blocked by FEATURE_GAP)
duration_ms: 0
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Pokemon Center heals up to 3 injuries/day | injuriesHealedToday=3, injuries reduced by 3 | N/A | N/A |
| 2 | Partial prior usage limits remaining heals | injuriesHealedToday increments correctly from prior value | N/A | N/A |
| 3 | At daily cap, no more injury healing | Injury heal blocked, injuriesHealedToday=3 | N/A | N/A |
| 4 | Character heal-injury blocked at cap | Character injury heal blocked when injuriesHealedToday=3 | N/A | N/A |

## Errors
- FEATURE_GAP: PUT /api/pokemon/:id does not support setting `injuries` or `injuriesHealedToday`. PUT /api/characters/:id does not support setting `injuries` or `injuriesHealedToday`. See bug-003.md.
- SCENARIO_BUG: Character creation uses wrong field names. See correction-006.md.

## Playwright Errors
<!-- N/A - spec not written -->

## Screenshots
<!-- N/A -->

## Self-Correction Log
<!-- N/A - blocked by API gap, not a test infrastructure issue -->
