---
last_updated: 2026-02-20T22:30:00
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

All 8 domains are stale due to sessions 5–10 code changes. Re-mapping deferred until P3 dev queue is smaller.

**Session 10 changes (6 tickets resolved):**
- **combat:** ptu-rule-074 — New pass server endpoint (new capability to map)
- **capture:** ptu-rule-050 — Removed dead pokeBallType parameter (minor capability change)
- **character-lifecycle:** refactoring-046 — Extracted CapabilitiesDisplay.vue (structural, no coverage impact)
- **scenes:** refactoring-046 — Extracted restoreSceneAp() service (structural, no coverage impact)
- **combat/scenes/capture:** refactoring-052, refactoring-053 — SCSS-only changes (no coverage impact)
- **pokemon-generation:** ptu-rule-037 — Seed parser skip list fix (no coverage impact)

## Recommended Next Steps

1. Continue burning through P3 dev ticket queue (9 ptu-rule + 1 refactoring remaining)
2. Re-map all 8 domains once P3 queue is clear or nearly clear
3. Combat domain is most impacted — pass endpoint + League battle phases are new capabilities
