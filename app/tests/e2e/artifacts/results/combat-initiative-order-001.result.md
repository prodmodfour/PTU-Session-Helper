---
scenario_id: combat-initiative-order-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-initiative-order-001.spec.ts
duration_ms: 8000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Turn order: Pikachu, Charmander, Bulbasaur | [Pikachu, Charmander, Bulbasaur] | [Pikachu, Charmander, Bulbasaur] | PASS |
| 2 | First active = Pikachu | Pikachu | Pikachu | PASS |
| 3 | Initiative values match Speed stats | SPD-based order | SPD-based order | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
