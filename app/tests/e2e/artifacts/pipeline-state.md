---
last_updated: 2026-02-15T20:00:00
updated_by: scenario-crafter
---

## Domain: combat

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | complete | 15 loops (+ 12 sub-loops) | 2026-02-15 |
| Scenarios | corrected | 19/19 (6 P0, 8 P1, 5 P2) — 4 fixed | 2026-02-15 |
| Verifications | needs re-verify | 15/19 PASS, 4 corrected awaiting re-verification | 2026-02-15 |
| Test Runs | not started | — | — |
| Results | not started | — | — |

### Verification Results

**PASS (15):** Ready for Playtester
- combat-basic-physical-001 (P0): All 4 assertions correct
- combat-initiative-order-001 (P0): All 3 assertions correct
- combat-turn-progression-001 (P0): All 4 assertions correct
- combat-damage-and-faint-001 (P0): All 5 assertions correct
- combat-encounter-lifecycle-001 (P0): All 5 assertions correct
- combat-stab-001 (P1): All 4 assertions correct
- combat-type-immunity-001 (P1): All 3 assertions correct
- combat-critical-hit-001 (P1): All 4 assertions correct
- combat-combat-stages-001 (P1): All 5 assertions correct
- combat-healing-001 (P1): All 4 assertions correct
- combat-status-conditions-001 (P1): All 4 assertions correct
- combat-take-a-breather-001 (P1): All 5 assertions correct
- combat-struggle-attack-001 (P2): All 4 assertions correct
- combat-temporary-hp-001 (P2): All 3 assertions correct
- combat-injury-massive-damage-001 (P2): All 4 assertions correct

**CORRECTED (4):** Awaiting re-verification by Scenario Verifier
- combat-basic-special-001 (P0): Replaced Charmander/Ember with Psyduck(Water)/Confusion(Psychic) to eliminate STAB. Target changed to Charmander(Fire) for neutral effectiveness. All 4 assertions rewritten.
- combat-type-effectiveness-001 (P1): Raised Squirtle from L10 to L13 so Water Gun is available. All assertion math unchanged (base stats don't vary with level, Charmander target stays L10).
- combat-minimum-damage-001 (P2): Corrected derivation to show Rock resists Normal (×0.5). Full path: raw(-4) → min 1 → ×0.5 → floor(0.5)=0 → final min 1. Same final value, correct reasoning.
- combat-multi-target-001 (P2): Full rewrite. Geodude raised to L34 for Earthquake access. STAB applied (DB 10+2=12, set=30). Charmander: 51 damage (fainted). Machop: 33 damage (HP "8/41").

### Open Issues

(none — all 4 corrections applied, awaiting re-verification)

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
