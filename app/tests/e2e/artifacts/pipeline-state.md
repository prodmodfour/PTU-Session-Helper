---
last_updated: 2026-02-16T12:00:00
updated_by: scenario-verifier
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

### Tier 1 (Session Workflows) — IN PROGRESS

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | complete | 6 workflows (+ 1 sub-workflow) | 2026-02-15 |
| Scenarios | complete | 7/7 (6 P0, 1 P1) | 2026-02-15 |
| Verifications | complete | 7/7 PASS | 2026-02-16 |
| Test Runs | not started | — | — |
| Results | not started | — | — |

Workflows: W1 (full wild encounter), W2 (stage buffs + matchups), W3 (faint + replacement), W4 (status chain), W5 (healing + recovery), W6 (template setup). Sub-workflow: W1 capture variant. 3 mechanics remain Tier 2 only (critical hit, struggle, multi-target).

### Tier 1 Scenario Summary (Scenario Crafter)

| Scenario ID | Loop | Priority | PTU Assertions | Key Mechanics |
|-------------|------|----------|---------------|---------------|
| combat-workflow-wild-encounter-001 | W1 | P0 | 10 | HP, initiative, STAB, type-eff, injury, faint, lifecycle |
| combat-workflow-stage-buffs-001 | W2 | P0 | 8 | Combat stages, stage multiplier, STAB, type-eff, evasion-from-stages |
| combat-workflow-faint-replacement-001 | W3 | P0 | 10 | Faint, status-clear-on-faint, initiative insertion, replacement |
| combat-workflow-status-chain-001 | W4 | P0 | 9 | Status application, type immunity, Take a Breather, persistent vs volatile |
| combat-workflow-healing-recovery-001 | W5 | P0 | 8 | Heal cap, faint recovery, temp HP, injury healing |
| combat-workflow-template-setup-001 | W6 | P0 | 7 | Template load, initiative, serve to group |
| combat-workflow-capture-variant-001 | W1-sub | P1 | 5 | Damage, STAB, capture rate, capture attempt |

**Total: 7 scenarios, 57 PTU assertions**

**Species used:** Growlithe, Oddish, Bulbasaur, Caterpie, Pidgey, Charmander, Eevee, Pikachu, Squirtle, Rattata

**Lessons applied:**
- Lesson 1 (STAB): Every attacker/move pair explicitly checked for type match. Annotated in every damage phase.
- Lesson 2 (Learn levels): Every move verified against pokedex file with citation (e.g., "L6, gen1/growlithe.md").
- Lesson 3 (Type effectiveness): Every type pair checked against chart individually. Dual-type targets show both lookups.

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

### Tier 1 Verification Results (Scenario Verifier)

**ALL PASS (7/7) — 57/57 assertions correct**

| Scenario ID | Assertions | Status | Key Checks |
|-------------|-----------|--------|------------|
| combat-workflow-wild-encounter-001 | 10/10 | PASS | HP, initiative, STAB×2, type-eff (Fire vs Grass/Poison), injury, faint, lifecycle |
| combat-workflow-stage-buffs-001 | 8/8 | PASS | Stages (+2/−1 net), multiplier ×1.2, modified stat, evasion recalc |
| combat-workflow-faint-replacement-001 | 10/10 | PASS | STAB/no-STAB contrast, Burn on non-Fire, status-clear-on-faint, replacement initiative |
| combat-workflow-status-chain-001 | 9/9 | PASS | Paralysis immunity (Electric), stacked statuses, Take a Breather, persistent survives end |
| combat-workflow-healing-recovery-001 | 8/8 | PASS | Heal cap, faint recovery, temp HP grant + absorption, injury heal |
| combat-workflow-template-setup-001 | 7/7 | PASS | Template save/load, HP derivation, initiative with ties |
| combat-workflow-capture-variant-001 | 5/5 | PASS | Water Gun STAB, injury, capture rate, origin linkage |

**Species verified (10):** Growlithe, Oddish, Bulbasaur, Caterpie, Pidgey, Charmander, Eevee, Pikachu, Rattata, Squirtle — all base stats, types, and move learn levels confirmed against `books/markdown/pokedexes/gen1/` files.

**Lessons applied from scenario-crafter.lessons.md:**
- Lesson 1 (STAB): 8 attacker/move pairs checked — all correct (including 1 explicit no-STAB: Caterpie/Tackle)
- Lesson 2 (Learn levels): 8 move/level pairs verified — all at or above learn level (Squirtle/Water Gun at exact L13)
- Lesson 3 (Type effectiveness): 10 unique type matchups individually verified against type chart

**Errata:** errata-2.md checked for all 7 scenarios. Only capture mechanic errata applies (scenario 7); scenario's assertion is compatible with revised d20 system.

All 7 scenarios proceed to Playtester.

### Open Issues

(none)

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
