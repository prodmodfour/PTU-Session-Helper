---
scenario_id: healing-natural-injury-timer-001
run_id: 2026-02-19-001
status: ERROR
spec_file: N/A (not written — blocked by FEATURE_GAP)
duration_ms: 0
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | 25h elapsed succeeds | Natural injury heal succeeds, injuries decremented | N/A | N/A |
| 2 | 12h elapsed blocks | Natural injury heal blocked, timer not met | N/A | N/A |
| 3 | null lastInjuryTime blocks | Natural injury heal blocked, no timer set | N/A | N/A |
| 4 | Chained heals succeed (timer NOT reset) | Second natural heal succeeds without waiting another 24h | N/A | N/A |
| 5 | lastInjuryTime cleared when last injury healed | lastInjuryTime=null when injuries reaches 0 | N/A | N/A |

## Errors
- FEATURE_GAP: PUT /api/pokemon/:id does not support setting `injuries` or `lastInjuryTime` (needed timestamps: 25h ago, 12h ago, null). PUT /api/characters/:id does not support setting `injuries` or `lastInjuryTime`. See bug-003.md.
- SCENARIO_BUG: Character creation uses wrong field names. See correction-006.md.

## Playwright Errors
<!-- N/A - spec not written -->

## Screenshots
<!-- N/A -->

## Self-Correction Log
<!-- N/A - blocked by API gap, not a test infrastructure issue -->
