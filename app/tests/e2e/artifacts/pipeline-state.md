---
last_updated: 2026-02-15T19:00:00
updated_by: scenario-verifier
---

## Domain: combat

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | complete | 15 loops (+ 12 sub-loops) | 2026-02-15 |
| Scenarios | complete | 19/19 (6 P0, 8 P1, 5 P2) | 2026-02-15 |
| Verifications | complete | 19/19 (15 PASS, 3 PARTIAL, 1 FAIL) | 2026-02-15 |
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

**PARTIAL (3):** Return to Scenario Crafter for corrections
- combat-basic-special-001 (P0): STAB incorrectly omitted -- Charmander (Fire) using Ember (Fire) triggers STAB. Assertions 3-4 have wrong values (13 should be 17, "28/41" should be "24/41"). Fix: use non-STAB attacker/move combo.
- combat-type-effectiveness-001 (P1): Water Gun not learnable by Squirtle at level 10 (learned at L13). All assertion values are correct. Fix: raise Squirtle to level 13+.
- combat-minimum-damage-001 (P2): Normal vs Rock/Ground incorrectly stated as neutral -- Rock resists Normal (x0.5). Final damage value (1) is coincidentally correct due to min-1 rule. Fix: correct the derivation to show Rock resistance.

**FAIL (1):** Return to Scenario Crafter for rewrite
- combat-multi-target-001 (P2): Two fundamental issues: (1) Geodude at L10 cannot know Earthquake (learned at L34), (2) STAB missed -- Geodude (Rock/Ground) using Earthquake (Ground) should get +2 DB. All 4 assertions have wrong values.

### Open Issues

1. combat-basic-special-001: PARTIAL -- Scenario Crafter must fix STAB omission (P0 priority)
2. combat-type-effectiveness-001: PARTIAL -- Scenario Crafter must fix Squirtle level or move choice
3. combat-minimum-damage-001: PARTIAL -- Scenario Crafter must correct type effectiveness derivation
4. combat-multi-target-001: FAIL -- Scenario Crafter must rewrite with valid move/level and include STAB

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
