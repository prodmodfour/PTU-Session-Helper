---
last_updated: 2026-02-15T21:00:00
updated_by: scenario-verifier
---

## Domain: combat

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | complete | 15 loops (+ 12 sub-loops) | 2026-02-15 |
| Scenarios | complete | 19/19 (6 P0, 8 P1, 5 P2) | 2026-02-15 |
| Verifications | complete | 19/19 PASS | 2026-02-15 |
| Test Runs | not started | — | — |
| Results | not started | — | — |

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

(none — all 19 scenarios verified, ready for Playtester stage)

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
