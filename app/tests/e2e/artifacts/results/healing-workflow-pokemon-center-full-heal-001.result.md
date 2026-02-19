---
scenario_id: healing-workflow-pokemon-center-full-heal-001
run_id: 2026-02-19-001
status: ERROR
spec_file: N/A (not written — blocked by FEATURE_GAP)
duration_ms: 0
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Character full HP restored | currentHp = maxHp | N/A | N/A |
| 2 | Character all statuses cleared | statusConditions = [] | N/A | N/A |
| 3 | Character injuries healed (capped at 3/day) | injuries reduced by min(current, 3 - injuriesHealedToday) | N/A | N/A |
| 4 | Character healing time correct | healingTimeMinutes matches formula | N/A | N/A |
| 5 | Character AP NOT restored by Pokemon Center | drainedAp unchanged | N/A | N/A |
| 6 | Pokemon full HP restored | currentHp = maxHp | N/A | N/A |
| 7 | Pokemon all statuses cleared | statusConditions = [] | N/A | N/A |
| 8 | Pokemon injuries healed (capped at 3/day) | injuries reduced by min(current, 3 - injuriesHealedToday) | N/A | N/A |
| 9 | Pokemon healing time correct | healingTimeMinutes matches formula | N/A | N/A |
| 10 | Pokemon daily moves restored | All move dailyUses reset | N/A | N/A |

## Errors
- FEATURE_GAP: PUT /api/characters/:id does not support setting `injuries`, `statusConditions`, `drainedAp`, `injuriesHealedToday`, or `restMinutesToday`. PUT /api/pokemon/:id does not support setting `injuries`. See bug-003.md.
- SCENARIO_BUG: Character creation uses wrong field names. See correction-006.md.

## Playwright Errors
<!-- N/A - spec not written -->

## Screenshots
<!-- N/A -->

## Self-Correction Log
<!-- N/A - blocked by API gap, not a test infrastructure issue -->
