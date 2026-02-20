---
last_updated: 2026-02-20T23:45:00
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

All 8 domains are stale due to sessions 5–11 code changes. Re-mapping deferred until design implementations begin.

**Session 11 changes (5 fixes + 5 designs):**
- **combat:** ptu-rule-048 — UI label changes + documentation (no formula changes, no coverage impact)
- **healing/combat:** ptu-rule-051 — New BreatherShiftBanner component, shift movement prompt (new capability to map)
- **pokemon-lifecycle:** ptu-rule-054 — Base Relations enforcement in stat distribution (correctness fix, may change coverage)
- **encounter-tables:** ptu-rule-057 — Species diversity enforcement in generation (new capability to map)
- **encounter-tables (SCSS):** refactoring-054 — encounters.vue mixin inlining (no coverage impact)
- **5 design specs written** — equipment, XP, char creation, density/significance, level-budget (no code changes yet)

## Audit Correction

- **combat-R010** (evasion CS treatment): Original audit classified as "Approximation" — Game Logic Reviewer (rules-review-102) independently confirmed the implementation was already correct per PTU's two-part evasion system. Audit item should be reclassified as "Correct" on next re-audit.

## Recommended Next Steps

1. Begin P0 implementation of independent design specs (045 equipment, 055 XP, 056 char creation)
2. Re-map all 8 domains after P0 implementations land (significant new capabilities to map)
3. Combat and encounter-tables domains most impacted by session 11 changes
