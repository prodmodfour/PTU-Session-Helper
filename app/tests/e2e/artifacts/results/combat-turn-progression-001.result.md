---
scenario_id: combat-turn-progression-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-turn-progression-001.spec.ts
duration_ms: 6000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | After start: Pikachu active, round 1 | active=Pikachu, round=1 | active=Pikachu, round=1 | PASS |
| 2 | After 1st next-turn: Charmander, round 1 | active=Charmander, round=1 | active=Charmander, round=1 | PASS |
| 3 | After 2nd next-turn: Bulbasaur, round 1 | active=Bulbasaur, round=1 | active=Bulbasaur, round=1 | PASS |
| 4 | After 3rd next-turn: Pikachu, round 2 | active=Pikachu, round=2 | active=Pikachu, round=2 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
