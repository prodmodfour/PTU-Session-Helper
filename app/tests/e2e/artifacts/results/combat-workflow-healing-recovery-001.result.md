---
scenario_id: combat-workflow-healing-recovery-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-workflow-healing-recovery-001.spec.ts
duration_ms: 3600
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Bulbasaur damaged — HP 15/40, injury 1 | HP=15, injuries=1 | HP=15, injuries=1 | PASS |
| 2 | Charmander fainted — HP 0/35, Fainted | HP=0, Fainted | HP=0, Fainted | PASS |
| 3 | Healing capped at max HP | HP=40/40 (not 45) | HP=40/40, healed=25 | PASS |
| 4 | Faint recovery — Fainted removed | HP=20/35, no Fainted | HP=20/35, no Fainted | PASS |
| 5 | Temporary HP granted | HP=35/35, tempHp=15 | HP=35/35, tempHp=15 | PASS |
| 6 | Temp HP absorption | HP=30/35, tempHp=0 | HP=30/35, tempHp=0, absorbed=15 | PASS |
| 7 | Temp HP absorbed correctly | 5 real HP lost (35→30) | hpDamage=5, newHp=30 | PASS |
| 8 | Injury healed (1→0) | injuries=0 | injuries=0 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None — all passed -->

## Self-Correction Log
<!-- None — clean run -->
