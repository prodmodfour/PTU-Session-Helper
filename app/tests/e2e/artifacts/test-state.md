---
last_updated: 2026-02-20T21:00:00
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

All 8 domains are stale due to sessions 5–9 code changes. **P2 queue is now clear** — re-mapping is unblocked.

**Session 9 changes (8 tickets resolved):**
- **combat:** ptu-rule-046 — League battle declaration phase (new feature, significant combat domain change — re-map needed)
- **combat:** ptu-rule-075 — Breather immutability fix (no coverage impact)
- **combat:** refactoring-032 — SCSS extraction in CombatantDetailsPanel (no coverage impact)
- **capture:** refactoring-048 — Capture rate dedup (structural, no coverage impact)
- **character-lifecycle:** bug-029 — AP validation in character PUT (minor coverage improvement)
- **character-lifecycle:** refactoring-041 — Test mock fix (no coverage impact)
- **healing:** refactoring-045 — N+1 query optimization in new-day + activate (no coverage impact)
- **pokemon-lifecycle:** refactoring-050 — Shiny badge icon (no coverage impact)

**Session 9 significantly impacts the combat domain** — League battle phases are a new feature that adds capabilities not in the current capability mapping.

## Recommended Next Steps

1. **Re-map combat domain first** — ptu-rule-046 added League battle phases (new capabilities to map)
2. Re-map remaining 7 domains (mostly structural changes, lower priority)
3. Continue P3 ticket queue in Dev ecosystem
