---
last_updated: 2026-02-20T21:00:00
updated_by: orchestrator
---

# Dev Ecosystem State

## Open Tickets

### Bug Tickets (`tickets/bug/`)
| Ticket | Priority | Severity | Status | Summary |
|--------|----------|----------|--------|---------|
| bug-001–028 | P0–P3 | — | resolved | (all resolved — see previous sessions) |
| bug-029 | P3 | LOW | resolved | Character PUT AP validation — both reviews APPROVED (session 9) |

### PTU Rule Tickets (`tickets/ptu-rule/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-029–073 | P1–P3 | resolved | (all resolved — see sessions 1–7) |
| ptu-rule-037 | P3 | **open** | Seed parser name-detection regex false-positive |
| ptu-rule-045 | P3 | **open** | Equipment/armor system |
| ptu-rule-046 | P2 | resolved | League battle declaration phase — both reviews APPROVED (session 9) |
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
| ptu-rule-075 | P3 | resolved | Breather tempConditions push mutation — both reviews APPROVED (session 9) |

### Feature Tickets (`tickets/feature/`)
(none)

### UX Tickets (`tickets/ux/`)
(none)

## Active Developer Work

**Current task:** Idle — end of session 9.

**Session 9 completed:**
- 8 tickets resolved (2 P2 + 6 P3) — all reviewed + approved
- 22 review artifacts created (11 code reviews, 11 rules reviews)
- 3 follow-up fix cycles (refactoring-041 HP formula, ptu-rule-046 delete endpoint + JSDoc, refactoring-032 h2/h3 styling)
- P2 queue fully cleared (0 remaining)
- 2 new refactoring tickets filed from review (refactoring-052, refactoring-053)

**Next session queue (by priority):**
1. P3 ptu-rule tickets (074 — pass action mutation, then remaining 037/045/048/050/051/054–058/060)
2. P3 refactoring (046 — capabilities/AP dedup, then 052/053 from session 9 reviews)
3. Re-map all 8 stale matrix domains (P2 queue now clear)

## Review Status

### Session 9 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-094 | ptu-rule-075 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-084 | ptu-rule-075 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-095 | refactoring-041 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-085 | refactoring-041 | FAIL | game-logic-reviewer | 2026-02-20 |
| code-review-095b | refactoring-041 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-085b | refactoring-041 (follow-up) | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-096 | bug-029 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-086 | bug-029 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-097 | refactoring-045 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-087 | refactoring-045 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-098 | refactoring-050 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-088 | refactoring-050 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-099 | refactoring-048 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-089 | refactoring-048 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-100 | refactoring-032 | CHANGES_REQUIRED | senior-reviewer | 2026-02-20 |
| rules-review-090 | refactoring-032 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-100b | refactoring-032 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-101 | ptu-rule-046 | CHANGES_REQUIRED | senior-reviewer | 2026-02-20 |
| rules-review-091 | ptu-rule-046 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-101b | ptu-rule-046 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-091b | ptu-rule-046 (follow-up) | PASS | game-logic-reviewer | 2026-02-20 |

## Refactoring Tickets (`refactoring/`)

| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-032 | P2 | resolved | Extract shared SCSS partials — both reviews APPROVED (session 9) |
| refactoring-033 | P2 | resolved | Density dropdown labels (session 8) |
| refactoring-041 | P3 | resolved | Stale test mock — both reviews APPROVED after follow-up (session 9) |
| refactoring-042 | P2 | resolved | MoveTargetModal SCSS extraction (session 8) |
| refactoring-044 | P2 | resolved | Surface capture action error (session 8) |
| refactoring-045 | P3 | resolved | N+1 query batch optimization — both reviews APPROVED (session 9) |
| refactoring-046 | P3 | open | Duplicate capabilities display + AP restore loop (EXT-DUPLICATE) |
| refactoring-047 | P2 | resolved | Pokemon sheet SCSS dedup (session 8) |
| refactoring-048 | P3 | resolved | Capture rate deduplication — both reviews APPROVED (session 9) |
| refactoring-050 | P3 | resolved | Unicode star → Phosphor Icon — both reviews APPROVED (session 9) |
| refactoring-051 | P2 | resolved | 8 encounter endpoints → buildEncounterResponse (session 8) |
| refactoring-052 | P3 | open | encounters.vue overflow model change (from code-review-100) |
| refactoring-053 | P3 | open | Unused enhanced modal mixins in _modal.scss (from code-review-100) |

## Code Health

| Metric | Value |
|--------|-------|
| Last audited | 2026-02-18T12:00:00 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 0 |
| Open tickets (P3) | 14 (11 ptu-rules + 3 refactoring) |
| Total open | 14 |
| Total resolved | 114 |

## Session Summary (2026-02-20, session 9)

**Resolved this session:** 8 tickets (2 P2 + 6 P3)
- refactoring-032 (P2 — SCSS partial extraction, ~640 lines dedup — CHANGES_REQUIRED → follow-up → APPROVED)
- ptu-rule-046 (P2 — League battle declaration phase, 11 commits — CHANGES_REQUIRED → follow-up → APPROVED)
- bug-029 (P3 — Character PUT AP validation — APPROVED)
- ptu-rule-075 (P3 — Breather mutation fix — APPROVED)
- refactoring-041 (P3 — Stale test mock — FAIL → follow-up → APPROVED)
- refactoring-045 (P3 — N+1 query batch — APPROVED)
- refactoring-048 (P3 — Capture rate dedup — APPROVED)
- refactoring-050 (P3 — Unicode → Phosphor Icon — APPROVED)

**Reviews completed:** 22 reviews (11 code, 11 rules) — 16 APPROVED/PASS, 3 CHANGES_REQUIRED/FAIL (all addressed same session), 3 follow-up APPROVED/PASS

**Tickets created:** 2 (refactoring-052, refactoring-053 from review findings)

**Net movement:** 19→14 open (-5 net, -8 resolved +2 new +1 already resolved bug-029), 106→114 resolved (+8)

**All P0, P1, and P2 tickets are now at 0.**
