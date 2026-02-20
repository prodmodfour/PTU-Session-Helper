---
last_updated: 2026-02-20T19:00:00
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
| ptu-rule-037 | P3 | **open** | Seed parser name-detection regex false-positive |
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

**Current task:** Idle — end of session 8.

**Session 8 completed:**
- 5 P2 refactoring tickets resolved (refactoring-033, 042, 044, 047, 051) — all reviewed + approved
- 12 review artifacts created (7 code reviews, 5 rules reviews) — all APPROVED/PASS
- 2 follow-up fixes from CHANGES_REQUIRED reviews (033 EncounterTableModal, 047 hex colors)
- P2 refactoring queue reduced from 7 to 2

**Next session queue (by priority):**
1. P2 refactoring (032 — type badge + modal SCSS extraction, now safe after 047)
2. P2 ptu-rule (046 — League battle declaration phase)
3. P3 tickets (bug-029, ptu-rule-037/045/048/050/051/054–058/060/074/075, refactoring-041/045/046/048/050)

## Review Status

### Session 8 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-089 | refactoring-044 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-079 | refactoring-044 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-090 | refactoring-033 | CHANGES_REQUIRED | senior-reviewer | 2026-02-20 |
| code-review-090b | refactoring-033 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-080 | refactoring-033 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-091 | refactoring-042 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-081 | refactoring-042 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-092 | refactoring-051 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-082 | refactoring-051 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-093 | refactoring-047 | APPROVED_WITH_ISSUES | senior-reviewer | 2026-02-20 |
| code-review-093b | refactoring-047 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-083 | refactoring-047 | PASS | game-logic-reviewer | 2026-02-20 |

## Refactoring Tickets (`refactoring/`)

| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-032 | P2 | open | Extract shared SCSS partials (EXT-DUPLICATE) |
| refactoring-033 | P2 | resolved | Density dropdown labels — both reviews APPROVED (session 8) |
| refactoring-035 | P2 | resolved | Error wiring — already fixed by refactoring-034 (session 7) |
| refactoring-039 | P2 | resolved | habitats/index.vue — both reviews APPROVED (session 7) |
| refactoring-040 | P2 | resolved | PUT response shapes — reviewed, APPROVED |
| refactoring-041 | P3 | open | Stale test in characters.test.ts (TEST-STALE) |
| refactoring-042 | P2 | resolved | MoveTargetModal SCSS extraction — both reviews APPROVED (session 8) |
| refactoring-043 | P2 | resolved | Pokemon detail page — 6 components extracted (session 5) |
| refactoring-044 | P2 | resolved | Surface capture action error — both reviews APPROVED (session 8) |
| refactoring-045 | P3 | open | N+1 query in new-day/activate AP updates (PERF) |
| refactoring-046 | P3 | open | Duplicate capabilities display + AP restore loop (EXT-DUPLICATE) |
| refactoring-047 | P2 | resolved | Pokemon sheet SCSS dedup — both reviews APPROVED (session 8) |
| refactoring-048 | P3 | open | Capture rate calculation duplication (EXT-DUPLICATE) |
| refactoring-049 | P2 | resolved | Scene-frequency mutation + cleanup — both reviews APPROVED (session 7) |
| refactoring-050 | P3 | open | Unicode star shiny badge → Phosphor Icon (UI-CONVENTION) |
| refactoring-051 | P2 | resolved | 8 encounter endpoints → buildEncounterResponse — both reviews APPROVED (session 8) |

## Code Health

| Metric | Value |
|--------|-------|
| Last audited | 2026-02-18T12:00:00 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 2 (1 ptu-rule + 1 refactoring) |
| Open tickets (P3) | 17 (13 ptu-rules + 1 bug + 3 refactoring) |
| Total open | 19 |
| Total resolved | 106 |

## Session Summary (2026-02-20, session 8)

**Resolved this session:** 5 refactoring tickets
- refactoring-033 (density dropdown labels — CHANGES_REQUIRED → follow-up → APPROVED)
- refactoring-042 (MoveTargetModal SCSS extraction — APPROVED)
- refactoring-044 (capture action error surfacing — APPROVED)
- refactoring-047 (Pokemon sheet SCSS dedup — APPROVED_WITH_ISSUES → follow-up → APPROVED)
- refactoring-051 (8 encounter endpoints → buildEncounterResponse — APPROVED)

**Reviews completed:** 12 reviews (7 code, 5 rules) — 10 APPROVED, 2 CHANGES_REQUIRED (both addressed same session)

**Tickets created:** 0

**Net movement:** 24→19 open (-5), 101→106 resolved (+5)

**All P0 and P1 tickets remain at 0.**
