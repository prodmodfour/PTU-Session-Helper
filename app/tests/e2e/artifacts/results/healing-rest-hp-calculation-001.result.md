---
scenario_id: healing-rest-hp-calculation-001
run_id: 2026-02-19-001
status: PASS
spec_file: tests/e2e/scenarios/healing/healing-rest-hp-calculation-001.spec.ts
duration_ms: 2900
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | High HP (maxHp=60) heals 3 | hpHealed=3, newHp=43 | 3, 43 | PASS |
| 2 | Mid HP (maxHp=45) heals 2 | hpHealed=2, newHp=32 | 2, 32 | PASS |
| 3 | Low HP (maxHp=23) heals 1 | hpHealed=1, newHp=16 | 1, 16 | PASS |
| 4 | Min HP (maxHp=23) heals 1 | hpHealed=1, newHp=6 | 1, 6 | PASS |
| 5 | Near-cap (39/40) heals 1 | hpHealed=1, newHp=40 | 1, 40 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
