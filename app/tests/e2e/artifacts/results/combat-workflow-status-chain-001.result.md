---
scenario_id: combat-workflow-status-chain-001
run_id: 2026-02-15-002
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-workflow-status-chain-001.spec.ts
duration_ms: 3200
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Eevee HP 41/41, Pikachu HP 36/36 | Eevee=41, Pikachu=36 | Eevee=41, Pikachu=36 | PASS |
| 2 | Paralyzed applied to Eevee | Paralyzed in status | Paralyzed added | PASS |
| 3 | Speed stage penalty -4 | speed stage=-4 | speed=-4 | PASS |
| 4 | Multiple statuses stacked | Paralyzed + Confused | Paralyzed + Confused | PASS |
| 5 | Stages reset by Breather | speed stage=0 | speed=0 | PASS |
| 6 | Volatile cleared, persistent remains | Paralyzed yes, Confused no | Paralyzed only | PASS |
| 7 | Breather penalty (Tripped + Vulnerable) | Tripped + Vulnerable in tempConditions | Tripped + Vulnerable | PASS |
| 8 | Persistent status survives combat end | Paralyzed remains on entity | Paralyzed present | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None — API-only test -->

## Self-Correction Log
<!-- None needed -->

## Notes
- Previous run (2026-02-15-001) failed at assertion 4: scenario incorrectly tested Electric-type Paralysis immunity via API (the API is a GM tool without type enforcement).
- Fixed by commit `2a4f84e: fix: apply 3 corrections to combat Tier 1 scenarios` which removed the Pikachu immunity assertion from the scenario and spec.
- All 8 scenario assertions now pass.
