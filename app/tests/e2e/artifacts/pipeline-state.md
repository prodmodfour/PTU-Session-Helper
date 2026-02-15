---
last_updated: 2026-02-15T23:59:00
updated_by: orchestrator
---

## Domain: combat

### Tier 2 (Mechanic Validations) — COMPLETE

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | complete | 15 mechanic loops (+ 12 sub-loops) | 2026-02-15 |
| Scenarios | complete | 19/19 (6 P0, 8 P1, 5 P2) | 2026-02-15 |
| Verifications | complete | 19/19 PASS | 2026-02-15 |
| Test Runs | complete | 80/80 PASS (19 specs) | 2026-02-15 |
| Results | complete | 19/19 result files | 2026-02-15 |
| Triage | complete | 19/19 PASS — 0 failures to triage | 2026-02-15 |

### Tier 1 (Session Workflows) — NOT STARTED

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

Note: Existing Tier 2 artifacts remain valid. Tier 1 workflow loops need to be synthesized and added to `loops/combat.md`, then new workflow scenarios crafted.

### Results Verification Summary (Result Verifier)

**CLEAN RUN — 0 failures to triage**

- Results analyzed: 19
- Passed: 19
- Failed: 0

| Category | Count | Reports Generated |
|----------|-------|-------------------|
| APP_BUG | 0 | — |
| SCENARIO_BUG | 0 | — |
| TEST_BUG | 0 | — |
| AMBIGUOUS | 0 | — |

76 assertions across 19 scenarios all confirmed PASS. No retries, no Playwright errors, no self-corrections. The `artifacts/reports/` directory remains empty — no reports needed.

**Combat domain pipeline: COMPLETE.** All stages from Gameplay Loop Synthesizer through Result Verifier have passed. Ready for Retrospective Analyst.

### Test Run Results (Playtester)

**ALL PASS (80/80 tests across 19 spec files)**

Run: `npx playwright test tests/e2e/scenarios/combat/ --reporter=list`
Duration: ~26s, 6 workers, 0 retries needed

| Spec File | Tests | Status | Duration |
|-----------|-------|--------|----------|
| combat-basic-physical-001.spec.ts | 7 | PASS | ~2s |
| combat-basic-special-001.spec.ts | 7 | PASS | ~2s |
| combat-encounter-lifecycle-001.spec.ts | 7 | PASS | ~4s |
| combat-initiative-order-001.spec.ts | 6 | PASS | ~8s |
| combat-turn-progression-001.spec.ts | 7 | PASS | ~6s |
| combat-damage-and-faint-001.spec.ts | 8 | PASS | ~4s |
| combat-critical-hit-001.spec.ts | 3 | PASS | ~8s |
| combat-stab-001.spec.ts | 3 | PASS | ~8s |
| combat-type-effectiveness-001.spec.ts | 3 | PASS | ~5s |
| combat-type-immunity-001.spec.ts | 3 | PASS | ~6s |
| combat-healing-001.spec.ts | 4 | PASS | ~10s |
| combat-combat-stages-001.spec.ts | 6 | PASS | ~14s |
| combat-status-conditions-001.spec.ts | 6 | PASS | ~13s |
| combat-take-a-breather-001.spec.ts | 5 | PASS | ~14s |
| combat-injury-massive-damage-001.spec.ts | 1 | PASS | ~2s |
| combat-minimum-damage-001.spec.ts | 1 | PASS | ~2s |
| combat-multi-target-001.spec.ts | 1 | PASS | ~3s |
| combat-struggle-attack-001.spec.ts | 1 | PASS | ~2s |
| combat-temporary-hp-001.spec.ts | 1 | PASS | ~2s |

### Test Architecture Notes

- **API-first approach**: Setup, actions, and primary assertions use REST API calls
- **UI verification**: 3 specs include UI assertions (initiative-order, turn-progression, encounter-lifecycle)
- **Parallel-safe**: Tests run with 6 workers; serve-based UI tests converted to API-only to avoid race conditions
- **Field mapping fix**: Pokemon creation API requires `baseSpAtk`/`baseSpDef` (not `baseSpAttack`/`baseSpDefense`)
- **No `specialEvasion` on combatant**: Evasion is computed client-side from `entity.currentStats.specialDefense`

### Verification Results

**PASS (19/19):** All scenarios verified and ready for Playtester

- combat-basic-physical-001 (P0): All 4 assertions correct
- combat-basic-special-001 (P0): All 4 assertions correct (re-verified after correction)
- combat-initiative-order-001 (P0): All 3 assertions correct
- combat-turn-progression-001 (P0): All 4 assertions correct
- combat-damage-and-faint-001 (P0): All 5 assertions correct
- combat-encounter-lifecycle-001 (P0): All 5 assertions correct
- combat-stab-001 (P1): All 4 assertions correct
- combat-type-effectiveness-001 (P1): All 4 assertions correct (re-verified after correction)
- combat-type-immunity-001 (P1): All 3 assertions correct
- combat-critical-hit-001 (P1): All 4 assertions correct
- combat-combat-stages-001 (P1): All 5 assertions correct
- combat-healing-001 (P1): All 4 assertions correct
- combat-status-conditions-001 (P1): All 4 assertions correct
- combat-take-a-breather-001 (P1): All 5 assertions correct
- combat-struggle-attack-001 (P2): All 4 assertions correct
- combat-minimum-damage-001 (P2): All 3 assertions correct (re-verified after correction)
- combat-multi-target-001 (P2): All 4 assertions correct (re-verified after correction)
- combat-temporary-hp-001 (P2): All 3 assertions correct
- combat-injury-massive-damage-001 (P2): All 4 assertions correct

### Re-Verification Summary (4 corrected scenarios)

All 4 previously corrected scenarios now PASS:
1. **combat-basic-special-001:** Psyduck(Water)/Confusion(Psychic) correctly isolates no-STAB case. All 4 assertions independently verified.
2. **combat-type-effectiveness-001:** Squirtle L13 has Water Gun at exact learn level. All 4 assertions independently verified. (Cosmetic note: assertion 2 has confusing inline STAB correction text.)
3. **combat-minimum-damage-001:** Rock-resists-Normal derivation now correct. Full chain: raw(-4) → min 1 → ×0.5 → 0 → final min 1. All 3 assertions independently verified.
4. **combat-multi-target-001:** Geodude L34 has Earthquake at exact learn level. STAB correctly applied (DB 12, set 30). Charmander: 51 damage (fainted). Machop: 33 damage (HP "8/41"). All 4 assertions independently verified.

### Open Issues

- Combat Tier 1 workflow loops not yet synthesized. Existing Tier 2 mechanic tests remain valid and passing.

### Lessons (Retrospective Analyst)

| Metric | Value |
|--------|-------|
| Last analyzed | 2026-02-15T23:59:00 |
| Total lessons | 5 |
| Active | 5 |
| Resolved | 0 |
| Systemic patterns | 0 |

Lessons written for: scenario-crafter (3 lessons — 1 missing-check, 2 data-lookup), playtester (2 lessons — 2 process-gap). See `artifacts/lessons/` for details.

## Domain: capture

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: character-lifecycle

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: pokemon-lifecycle

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: healing

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: encounter-tables

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: scenes

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)

## Domain: vtt-grid

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
| Scenarios | not started | — | — |
| Verifications | not started | — | — |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Open Issues

(none)
