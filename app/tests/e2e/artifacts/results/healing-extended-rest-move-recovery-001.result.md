---
scenario_id: healing-extended-rest-move-recovery-001
run_id: 2026-02-19-001
status: PASS
spec_file: tests/e2e/scenarios/healing/healing-extended-rest-move-recovery-001.spec.ts
duration_ms: 723
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Daily moves in restoredMoves | Contains Sleep Powder, Solar Beam | Match | PASS |
| 2 | All moves usedToday=0 | All 4 moves have usedToday=0 | Match | PASS |
| 3 | Daily usedThisScene=0, non-daily preserved | Sleep Powder/Solar Beam scene=0, Tackle scene=2, Leech Seed scene=1 | Match | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
