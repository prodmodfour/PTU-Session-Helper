---
last_updated: 2026-02-20T17:00:00
updated_by: orchestrator
---

# Dev Ecosystem State

## Open Tickets

### Bug Tickets (`tickets/bug/`)
| Ticket | Priority | Severity | Status | Summary |
|--------|----------|----------|--------|---------|
| bug-001–028 | P0–P3 | — | resolved | (all resolved — see previous sessions) |
| bug-029 | P3 | LOW | **open** | Character PUT accepts AP fields without bounds validation |

### PTU Rule Tickets (`tickets/ptu-rule/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-029–073 | P1–P3 | resolved | (all resolved — see sessions 1–7) |
| ptu-rule-045 | P3 | **open** | Equipment/armor system |
| ptu-rule-046 | P2 | **open** | League battle declaration phase |
| ptu-rule-048 | P3 | **open** | Evasion CS treatment |
| ptu-rule-050 | P3 | **open** | pokeBallType dead code |
| ptu-rule-051 | P3 | **open** | Breather shift movement |
| ptu-rule-054 | P3 | **open** | Base Relations Rule |
| ptu-rule-055 | P3 | **open** | XP calculation |
| ptu-rule-056 | P3 | **open** | Character creation form |
| ptu-rule-057 | P3 | **open** | Species diversity |
| ptu-rule-058 | P3 | **open** | Encounter density/significance mismatch |
| ptu-rule-060 | P3 | **open** | Level-budget/significance |
| ptu-rule-074 | P3 | **open** | Pass action reactive mutation |
| ptu-rule-075 | P3 | **open** | Breather tempConditions push mutation |

### Feature Tickets (`tickets/feature/`)
(none)

### UX Tickets (`tickets/ux/`)
(none)

## Active Developer Work

**Current task:** Idle — end of session 7.

**Session 7 completed:**
- Reviewed + resolved 12 tickets from sessions 5–6 (ptu-rule-044, 062, 063, 065, 066, 067, 068, 069, 070, 071, 072, 073)
- Fixed 3 refactoring tickets (refactoring-035, 039, 049) — all reviewed + approved
- Created 3 new tickets (ptu-rule-074, ptu-rule-075, refactoring-051)

**Next session queue (by priority):**
1. P2 ptu-rule tickets (046)
2. P2 refactoring (032, 033, 042, 044, 047, 051)
3. P3 tickets (bug-029, ptu-rule-045/048/050/051/054–058/060/074/075, refactoring-041/045/046/048/050)

## Review Status

### Session 7 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-082 | session 6 batch (7 tickets) | CHANGES_REQUIRED | senior-reviewer | 2026-02-20 |
| rules-review-072 | session 6 batch (7 tickets) | CHANGES_REQUIRED | game-logic-reviewer | 2026-02-20 |
| code-review-083 | VTT re-review (067, 068, 069) | CHANGES_REQUIRED | senior-reviewer | 2026-02-20 |
| rules-review-073 | VTT re-review (044, 062, 063) | CHANGES_REQUIRED | game-logic-reviewer | 2026-02-20 |
| code-review-084 | resetDailyUsage tests + weather fields | CHANGES_REQUIRED | senior-reviewer | 2026-02-20 |
| rules-review-074 | resetDailyUsage tests + weather fields | APPROVED | game-logic-reviewer | 2026-02-20 |
| code-review-085 | Stuck fix + Math.trunc + 38 tests | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-075 | Stuck fix + Math.trunc + 38 tests | APPROVED | game-logic-reviewer | 2026-02-20 |
| code-review-086 | buildEncounterResponse refactor | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-076 | buildEncounterResponse refactor | APPROVED | game-logic-reviewer | 2026-02-20 |
| code-review-087 | refactoring-039 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-077 | refactoring-039 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-088 | refactoring-049 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-078 | refactoring-049 | PASS | game-logic-reviewer | 2026-02-20 |

## Refactoring Tickets (`refactoring/`)

| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-032 | P2 | open | Extract shared SCSS partials (EXT-DUPLICATE) |
| refactoring-033 | P2 | open | TableEditor density dropdown labels (DATA-INCORRECT) |
| refactoring-035 | P2 | resolved | Error wiring in encounter-tables — already fixed by refactoring-034 (session 7) |
| refactoring-039 | P2 | resolved | habitats/index.vue encounter creation — both reviews APPROVED (session 7) |
| refactoring-040 | P2 | resolved | PUT response shapes — reviewed, APPROVED |
| refactoring-041 | P3 | open | Stale test in characters.test.ts (TEST-STALE) |
| refactoring-042 | P2 | open | MoveTargetModal SCSS extraction (EXT-DUPLICATE) |
| refactoring-043 | P2 | resolved | Pokemon detail page — 6 components extracted, both reviews APPROVED |
| refactoring-044 | P2 | open | Surface capture action error to user (EXT-DUPLICATE) |
| refactoring-045 | P3 | open | N+1 query in new-day/activate AP updates (PERF) |
| refactoring-046 | P3 | open | Duplicate capabilities display + AP restore loop (EXT-DUPLICATE) |
| refactoring-047 | P2 | open | Pokemon sheet SCSS duplication across 6 extracted components (EXT-DUPLICATE) |
| refactoring-048 | P3 | open | Capture rate calculation duplication (EXT-DUPLICATE) |
| refactoring-049 | P2 | resolved | Scene-frequency move.post.ts mutation + cleanup — both reviews APPROVED (session 7) |
| refactoring-050 | P3 | open | Unicode star shiny badge → Phosphor Icon (UI-CONVENTION) |
| refactoring-051 | P2 | open | Migrate 8 encounter endpoints to buildEncounterResponse (EXT-DUPLICATE, from code-review-086) |

## Code Health

| Metric | Value |
|--------|-------|
| Last audited | 2026-02-18T12:00:00 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 7 (1 ptu-rule + 6 refactoring) |
| Open tickets (P3) | 17 (12 ptu-rules + 1 bug + 4 refactoring) |
| Total open | 24 |
| Total resolved | 101 |

## Session Summary (2026-02-20, session 7)

**Resolved this session:** 15 tickets (12 ptu-rule + 3 refactoring)
- ptu-rule-044, 062, 063, 065, 066, 067, 068, 069, 070, 071, 072 (marked resolved — both reviews APPROVED)
- ptu-rule-073 (buildEncounterResponse refactor — both reviews APPROVED)
- refactoring-035 (already fixed by refactoring-034)
- refactoring-039 (composable replacement — both reviews APPROVED)
- refactoring-049 (move mutation + cleanup — both reviews APPROVED)

**Reviews completed:** 14 reviews (7 code, 7 rules) — 10 APPROVED, 4 CHANGES_REQUIRED (all addressed)

**Tickets created:** 3 (ptu-rule-074, ptu-rule-075, refactoring-051)

**Net movement:** 31→24 open (-7), 87→101 resolved (+14)

**All P0 and P1 tickets remain at 0.**
