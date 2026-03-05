---
last_updated: 2026-03-06T00:10:00
updated_by: slave-collector (matrix-1772718722)
---

# Matrix Ecosystem State

## Domain Progress

| Domain | Rules | Capabilities | Matrix | Audit | Tickets | Coverage |
|--------|-------|-------------|--------|-------|---------|----------|
| combat | done (135) | **FRESH** (session 120) | **FRESH** (session 121) | stale | created | 74.8% |
| capture | done (33) | **FRESH** (session 120) | **FRESH** (session 121) | stale | created | 96.9% |
| healing | done (42) | **FRESH** (session 120) | **FRESH** (session 121) | stale | created | 66.7% |
| pokemon-lifecycle | done (68) | **FRESH** (session 120) | **FRESH** (session 121) | stale | created | 68.6% |
| character-lifecycle | done (68) | **FRESH** (session 120) | **FRESH** (session 121) | stale | created | 86.1% |
| encounter-tables | done (27) | **FRESH** (session 120) | **FRESH** (session 121) | stale | created | 77.5% |
| scenes | done (42) | **FRESH** (session 120) | **FRESH** (session 121) | stale | created | 70.0% |
| vtt-grid | done (42) | **FRESH** (session 120) | **FRESH** (session 121) | stale | created | 83.3% |
| player-view | done (207) | **FRESH** (session 120) | — (needs coverage analysis) | — | — | — |

**Overall: Matrix re-analyzed in session 121 (matrix-1772718722) for all 8 domains against fresh session-120 capabilities. player-view rules extracted (207 rules) — needs coverage analysis next. Audit column remains stale from session 59.**

## Active Work

Session 121 (matrix-1772718722) re-analyzed all 8 domain matrices and extracted player-view rules (207). Audit pipeline is next.

## Staleness Status

Capabilities and Matrices are now **FRESH** for all 8 established domains. player-view has rules + capabilities but no matrix yet. Audit column is stale — last run session 59.

## Audit Correction

- **combat-R010** (evasion CS treatment): Should be reclassified as "Correct" on next re-audit per rules-review-102.

## Recommended Next Steps

1. Run coverage analysis for player-view domain (207 rules vs 89 capabilities)
2. Re-run Audit against updated matrices for all 9 domains
3. Create M2 tickets from audit findings
