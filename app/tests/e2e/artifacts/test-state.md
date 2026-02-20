---
last_updated: 2026-02-21T01:30:00
updated_by: orchestrator
---

# Matrix Ecosystem State

## Domain Progress

| Domain | Rules | Capabilities | Matrix | Audit | Tickets | Coverage |
|--------|-------|-------------|--------|-------|---------|----------|
| combat | done (135) | done (210) | done | done | created | 83.0% (73/88) |
| capture | done (33) | done | done | done | created | 75.0% (18/24) |
| healing | done (42) | done | done | done | created | 80.0% (24/30) |
| pokemon-lifecycle | done (68) | done | done | done | created | 75.0% (33/44) |
| character-lifecycle | done (68) | done | done | done | created | 68.3% (28/41) |
| encounter-tables | done (27) | done | done | done | created | 64.3% (9/14) |
| scenes | done (42) | done | done | done | created | 55.6% (10/18) |
| vtt-grid | done (42) | done | done | done | created | 46.7% (7/15) |

**Overall: 202/274 correct (73.7%)**

## Active Work

All 8 domains fully processed through M2 ticket creation. Matrix pipeline is **complete** (M7).

## Staleness Status

Significant code changes this session across 7 domains:
- **combat:** ptu-rule-044 (movement conditions), ptu-rule-059 (scene-frequency moves), ptu-rule-061 (weather duration)
- **capture:** ptu-rule-049 (poison stacking fix, Bad Sleep)
- **healing:** ptu-rule-052 (daily move rolling window), ptu-rule-053 (bound AP)
- **character-lifecycle:** ptu-rule-064 (template HP fallback), ptu-rule-053 (boundAp on characters)
- **vtt-grid:** ptu-rule-044, 062, 063 (terrain-aware movement, swim/burrow, conditions)
- **pokemon-lifecycle:** refactoring-043 (page decomposition, no logic changes)
- **scenes:** ptu-rule-061 (weather duration on encounters)

All fixes are correctness improvements. Coverage scores would increase after re-mapping. Re-mapping is **optional** — recommend deferring until CHANGES_REQUIRED fixes are resolved.

## Recommended Next Steps

1. **Fix CHANGES_REQUIRED:** ptu-rule-067 (Stuck=0), ptu-rule-068 (Speed CS additive), ptu-rule-069 (Sprint persistence) → re-review VTT batch
2. **P1 fix:** ptu-rule-065 (encounter end boundAp clearing)
3. **Mark approved tickets resolved:** ptu-rule-049, 052, 053, 059, 061, 064, refactoring-043
4. **Continue P2 queue:** remaining ptu-rule and refactoring tickets
5. **Re-map when ready:** Capability Mapper + Coverage Analyzer for all stale domains
