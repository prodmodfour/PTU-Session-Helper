---
scenario_id: combat-healing-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-healing-001.spec.ts
duration_ms: 10000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Full healing flow: 32 to 12 to 27 to 32 | HP=32 | HP=32 | PASS |
| 2 | Heal at full HP = 0 | healAmount=0 | healAmount=0 | PASS |
| 3 | Heal from 0 removes Fainted | fainted=false | fainted=false | PASS |
| 4 | Temp HP stacks with heal | tempHP+realHP correct | tempHP+realHP correct | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
