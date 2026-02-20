---
last_updated: 2026-02-20T23:59:00
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
- **combat:** bug-008 (temp HP), bug-014 (Cursed breather), bug-023 (Speed Evasion + label), ptu-rule-047 (faint conditions, encounter-end volatile clearing)
- **pokemon-lifecycle:** bug-009 (nature adjustments), ptu-rule-043 (level-up notification system)
- **character-lifecycle:** bug-010, bug-015 (features/edges PUT), bug-024, bug-025, ptu-rule-042 (derived trainer stats), bug-022 (AP tracking)
- **encounter-tables:** bug-011 (weight column), bug-016 (spawn cap), bug-027 (min/max clamp)
- **capture:** bug-013 (Trapped bonus), bug-021 (capture action consumption)
- **vtt-grid:** bug-012 (terrain-aware movement), bug-017 (Earth/Rough terrain types), bug-018 (LoS blocking wired), bug-019 (multi-cell range wired)
- **healing:** bug-006 (injury max HP)

All fixes are correctness improvements. Capability mappings would show higher coverage after re-mapping, but no new incorrect items expected. Re-mapping is **optional** — recommend deferring until next feature batch.

## Recommended Next Steps

1. **Dev ecosystem focus:** Work through P2 ptu-rule queue (20 remaining tickets)
2. **High-impact refactoring:** refactoring-043 (Pokemon page EXT-GOD, 1384 lines)
3. **Re-map when ready:** Re-run Capability Mapper + Coverage Analyzer for stale domains to update coverage scores
