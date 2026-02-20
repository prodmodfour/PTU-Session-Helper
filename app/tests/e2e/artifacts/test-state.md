---
last_updated: 2026-02-20T23:30:00
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

## Ambiguous Items — Resolved

All 9 ambiguous items ruled on in rules-review-047 (2026-02-19). No new ambiguous items.

## Staleness Status

Multiple domains have had Developer fixes since last capability mapping:
- **combat:** bug-008 (temp HP), bug-014 (Cursed breather), bug-023 (Speed Evasion + label)
- **pokemon-lifecycle:** bug-009 (nature adjustments)
- **character-lifecycle:** bug-010, bug-015 (features/edges PUT), bug-024, bug-025
- **encounter-tables:** bug-011 (weight column), bug-016 (spawn cap), bug-027 (min/max clamp)
- **capture:** bug-013 (Trapped bonus)
- **vtt-grid:** bug-012 (terrain-aware movement), bug-017 (Earth/Rough terrain types), bug-018 (LoS function), bug-019 (multi-cell range functions)
- **healing:** bug-006 (injury max HP)

All fixes are correctness improvements. Capability mappings would show higher coverage after re-mapping, but no new incorrect items expected. Re-mapping is **optional** — recommend deferring until bug-018 and bug-019 wiring is complete.

## Recommended Next Steps

1. **Dev ecosystem focus:** Wire bug-018 (LoS) and bug-019 (multi-cell range) functions into UI callers
2. **Continue P3 bug queue:** bug-020, bug-021, bug-022
3. **Re-map after wiring complete:** Once bug-018/019 are fully wired, re-run Capability Mapper + Coverage Analyzer for vtt-grid to update coverage scores
