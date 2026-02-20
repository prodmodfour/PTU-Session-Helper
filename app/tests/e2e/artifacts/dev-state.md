---
last_updated: 2026-02-20T03:15:00
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
| ptu-rule-029–043 | P1–P3 | resolved | (all resolved — see previous sessions) |
| ptu-rule-044 | P2 | **in-progress** | Movement conditions not enforced on grid — implemented, CHANGES_REQUIRED (session 5). Stuck/Speed CS fixed in 067/068 (session 6) |
| ptu-rule-045 | P3 | **open** | Equipment/armor system |
| ptu-rule-046 | P2 | **open** | League battle declaration phase |
| ptu-rule-047 | P2 | resolved | Condition clearing on faint/encounter-end |
| ptu-rule-048 | P3 | **open** | Evasion CS treatment |
| ptu-rule-049 | P2 | resolved | Capture status condition definitions — both reviews APPROVED |
| ptu-rule-050 | P3 | **open** | pokeBallType dead code |
| ptu-rule-051 | P3 | **open** | Breather shift movement |
| ptu-rule-052 | P2 | resolved | Extended Rest daily move refresh — both reviews APPROVED |
| ptu-rule-053 | P2 | resolved | AP pool tracking — both reviews APPROVED |
| ptu-rule-054 | P3 | **open** | Base Relations Rule |
| ptu-rule-055 | P3 | **open** | XP calculation |
| ptu-rule-056 | P3 | **open** | Character creation form |
| ptu-rule-057 | P3 | **open** | Species diversity |
| ptu-rule-058 | P3 | **open** | Encounter density/significance mismatch |
| ptu-rule-059 | P2 | resolved | Scene-frequency move enforcement — both reviews APPROVED |
| ptu-rule-060 | P3 | **open** | Level-budget/significance |
| ptu-rule-061 | P2 | resolved | Weather duration — both reviews APPROVED |
| ptu-rule-062 | P2 | **in-progress** | Terrain/movement types — implemented, CHANGES_REQUIRED (session 5) |
| ptu-rule-063 | P2 | **in-progress** | Water terrain canSwim — implemented, CHANGES_REQUIRED (session 5) |
| ptu-rule-064 | P3 | resolved | Template HP stat fallback — both reviews APPROVED |
| ptu-rule-065 | P1 | **in-progress** | Encounter end boundAp clearing — implemented session 6, pending review |
| ptu-rule-066 | P2 | **in-progress** | New-day Pokemon daily move counter reset — implemented session 6, pending review |
| ptu-rule-067 | P1 | **in-progress** | Stuck condition = speed 0 — implemented session 6, pending review |
| ptu-rule-068 | P2 | **in-progress** | Speed CS additive movement formula — implemented session 6, pending review |
| ptu-rule-069 | P2 | **in-progress** | Sprint server persistence + immutability fix — implemented session 6, pending review |
| ptu-rule-070 | P2 | **in-progress** | Scene x2/x3 EOT + Daily x2/x3 per-scene cap — implemented session 6, pending review |
| ptu-rule-071 | P2 | **in-progress** | Weather undo/redo snapshot — implemented session 6, pending review |

### Feature Tickets (`tickets/feature/`)
(none)

### UX Tickets (`tickets/ux/`)
(none)

## Active Developer Work

**Current task:** Idle — end of session 6.

**Session 6 implemented (pending review):**
- ptu-rule-067 (P1) — Stuck = speed 0, not halved
- ptu-rule-068 (P2) — Speed CS additive formula with floor of 2
- ptu-rule-065 (P1) — Encounter end clears boundAp per PTU Core p.59
- ptu-rule-069 (P2) — Sprint server persistence endpoint + immutability fix
- ptu-rule-066 (P2) — New-day resets Pokemon daily move counters (both endpoints)
- ptu-rule-070 (P2) — Scene x2/x3 EOT enforcement + Daily x2/x3 per-scene cap (16 new tests)
- ptu-rule-071 (P2) — Weather undo/redo snapshot capture

**Housekeeping completed:**
- Marked resolved: ptu-rule-049, 052, 053, 059, 061, 064, refactoring-043

**Next session queue (by priority):**
1. Review all 7 session 6 implementations (Senior Reviewer + Game Logic Reviewer parallel)
2. Address any CHANGES_REQUIRED from reviews
3. Re-review VTT batch (ptu-rule-044, 062, 063) — original CHANGES_REQUIRED issues (Stuck, Speed CS) now fixed via 067/068
4. Remaining P2 ptu-rule tickets (046)
5. Remaining P2 refactoring (032, 033, 035, 039, 042, 044, 047, 049)
6. P3 tickets (045, 048, 050–051, 054–058, 060)

## Review Status

### Session 5 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-076 | refactoring-043, ptu-rule-064 | APPROVED_WITH_ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-066 | refactoring-043, ptu-rule-064 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-077 | ptu-rule-044, 062, 063 | APPROVED_WITH_ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-067 | ptu-rule-044, 062, 063 | CHANGES_REQUIRED | game-logic-reviewer | 2026-02-20 |
| code-review-078 | ptu-rule-049 | APPROVED_WITH_ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-068 | ptu-rule-049 | APPROVED_WITH_NOTES | game-logic-reviewer | 2026-02-20 |
| code-review-079 | ptu-rule-052, 053 | APPROVED_WITH_ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-069 | ptu-rule-052, 053 | APPROVED_WITH_NOTES | game-logic-reviewer | 2026-02-20 |
| code-review-080 | ptu-rule-059 | APPROVED_WITH_ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-070 | ptu-rule-059 | APPROVED_WITH_NOTES | game-logic-reviewer | 2026-02-20 |
| code-review-081 | ptu-rule-061 | APPROVED_WITH_ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-071 | ptu-rule-061 | APPROVED_WITH_NOTES | game-logic-reviewer | 2026-02-20 |

### Session 6 Reviews
**Pending:** 7 implementations awaiting review next session.

## Refactoring Tickets (`refactoring/`)

| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-032 | P2 | open | Extract shared SCSS partials (EXT-DUPLICATE) |
| refactoring-033 | P2 | open | TableEditor density dropdown labels (DATA-INCORRECT) |
| refactoring-035 | P2 | open | Inconsistent error wiring in encounter-tables (EXT-DUPLICATE) |
| refactoring-039 | P2 | open | habitats/index.vue duplicated encounter creation (EXT-DUPLICATE) |
| refactoring-040 | P2 | resolved | PUT response shapes — reviewed, APPROVED |
| refactoring-041 | P3 | open | Stale test in characters.test.ts (TEST-STALE) |
| refactoring-042 | P2 | open | MoveTargetModal SCSS extraction (EXT-DUPLICATE) |
| refactoring-043 | P2 | resolved | Pokemon detail page — 6 components extracted, both reviews APPROVED |
| refactoring-044 | P2 | open | Surface capture action error to user (EXT-DUPLICATE) |
| refactoring-045 | P3 | open | N+1 query in new-day/activate AP updates (PERF) |
| refactoring-046 | P3 | open | Duplicate capabilities display + AP restore loop (EXT-DUPLICATE) |
| refactoring-047 | P2 | open | Pokemon sheet SCSS duplication across 6 extracted components (EXT-DUPLICATE) |
| refactoring-048 | P3 | open | Capture rate calculation duplication (EXT-DUPLICATE) |
| refactoring-049 | P2 | open | Scene-frequency move.post.ts mutation + cleanup (EXT-DUPLICATE) |
| refactoring-050 | P3 | open | Unicode star shiny badge → Phosphor Icon (UI-CONVENTION) |

## Code Health

| Metric | Value |
|--------|-------|
| Last audited | 2026-02-18T12:00:00 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 16 (1 ptu-rule + 8 refactoring + 7 in-progress pending review) |
| Open tickets (P3) | 15 (10 ptu-rules + 1 bug + 4 refactoring) |
| In-progress (pending review) | 7 (ptu-rule-065, 066, 067, 068, 069, 070, 071) |
| In-progress (CHANGES_REQUIRED from session 5) | 3 (ptu-rule-044, 062, 063 — root causes fixed via 067/068) |
| Total open | 31 |
| Total resolved | 87 |

## Session Summary (2026-02-20, session 6)

**Implemented this session:** 7 tickets across 6 parallel Developer agents (~14 commits)
- ptu-rule-067 (P1, CRITICAL) — Stuck condition sets speed to 0 (was halving)
- ptu-rule-068 (P2, HIGH) — Speed CS additive movement bonus with floor of 2 (was multiplicative)
- ptu-rule-065 (P1) — Encounter end clears boundAp for all trainers (PTU Core p.59)
- ptu-rule-069 (P2, HIGH) — Sprint server persistence endpoint + immutability fix (4 commits)
- ptu-rule-066 (P2) — New-day resets Pokemon daily move counters (both global + per-character endpoints)
- ptu-rule-070 (P2, MEDIUM) — Scene x2/x3 EOT enforcement + Daily x2/x3 per-scene cap (16 new tests, 54 total)
- ptu-rule-071 (P2, HIGH) — Weather undo/redo snapshot capture

**Housekeeping:** 7 approved tickets marked resolved (ptu-rule-049, 052, 053, 059, 061, 064, refactoring-043)

**Reviews:** Pending — all 7 implementations need Senior Reviewer + Game Logic Reviewer next session.

**All P0 bugs remain resolved. P1 count dropped from 2 to 0 (both fixed). Net ticket count: 39→31 open (-8).**
