---
scenario_id: combat-workflow-faint-replacement-001
run_id: 2026-02-15-002
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-workflow-faint-replacement-001.spec.ts
duration_ms: 3700
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Caterpie HP | 33/33 | 33/33 | PASS |
| 2 | Pidgey HP | 32/32 | 32/32 | PASS |
| 3 | Initiative — Pidgey first (SPD 6 > 5) | Pidgey active | Pidgey active | PASS |
| 4 | Pidgey STAB Tackle -> Caterpie: 18 dmg | HP=15, injury=1 | HP=15, injury=1 | PASS |
| 5 | Caterpie Tackle (no STAB) -> Pidgey: 12 dmg | HP=20 | HP=20 | PASS |
| 6 | Burned applied to Caterpie | Burned in statusConditions | Burned in statusConditions | PASS |
| 7 | Caterpie faints — HP 0 | HP=0, fainted=true | HP=0, fainted=true | PASS |
| 8 | Burned cleared on faint | Burned NOT in statusConditions, Fainted present | Fainted only | PASS |
| 9 | Charmander replacement — HP 35/35, before Pidgey in order | HP=35/35, turnIdx < Pidgey | HP=35/35, before Pidgey | PASS |
| 10 | Charmander STAB Ember -> Pidgey: 17 dmg | HP=3/32 | HP=3/32 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None — API-only test -->

## Self-Correction Log
<!-- None needed -->

## Notes
- Previous run (2026-02-15-001) failed at assertion 8: Burned was not cleared on faint.
- Fixed by commit `72df77b: fix: clear all statuses on faint per PTU p248`.
- All 10 assertions now pass including the faint-clears-status mechanic.
