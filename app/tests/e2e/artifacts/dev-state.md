---
last_updated: 2026-02-21T01:30:00
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
| ptu-rule-044 | P2 | **in-progress** | Movement conditions not enforced on grid — implemented, CHANGES_REQUIRED |
| ptu-rule-045 | P3 | **open** | Equipment/armor system |
| ptu-rule-046 | P2 | **open** | League battle declaration phase |
| ptu-rule-047 | P2 | resolved | Condition clearing on faint/encounter-end |
| ptu-rule-048 | P3 | **open** | Evasion CS treatment |
| ptu-rule-049 | P2 | **in-progress** | Capture status condition definitions — implemented, both reviews APPROVED |
| ptu-rule-050 | P3 | **open** | pokeBallType dead code |
| ptu-rule-051 | P3 | **open** | Breather shift movement |
| ptu-rule-052 | P2 | **in-progress** | Extended Rest daily move refresh — implemented, both reviews APPROVED |
| ptu-rule-053 | P2 | **in-progress** | AP pool tracking — implemented, both reviews APPROVED |
| ptu-rule-054 | P3 | **open** | Base Relations Rule |
| ptu-rule-055 | P3 | **open** | XP calculation |
| ptu-rule-056 | P3 | **open** | Character creation form |
| ptu-rule-057 | P3 | **open** | Species diversity |
| ptu-rule-058 | P3 | **open** | Encounter density/significance mismatch |
| ptu-rule-059 | P2 | **in-progress** | Scene-frequency move enforcement — implemented, both reviews APPROVED |
| ptu-rule-060 | P3 | **open** | Level-budget/significance |
| ptu-rule-061 | P2 | **in-progress** | Weather duration — implemented, both reviews APPROVED |
| ptu-rule-062 | P2 | **in-progress** | Terrain/movement types — implemented, CHANGES_REQUIRED |
| ptu-rule-063 | P2 | **in-progress** | Water terrain canSwim — implemented, CHANGES_REQUIRED |
| ptu-rule-064 | P3 | **in-progress** | Template HP stat fallback — implemented, both reviews APPROVED |
| ptu-rule-065 | P1 | **open** | Encounter end doesn't clear boundAp (from code-review-079) |
| ptu-rule-066 | P2 | **open** | Global new-day doesn't reset Pokemon daily move counters (from code-review-079) |
| ptu-rule-067 | P1 | **open** | Stuck condition halves speed instead of blocking movement (from reviews 067, 077) |
| ptu-rule-068 | P2 | **open** | Speed CS movement uses multiplicative instead of additive formula (from reviews 067, 077) |
| ptu-rule-069 | P2 | **open** | Sprint tempCondition mutation + no DB persistence (from code-review-077) |
| ptu-rule-070 | P2 | **open** | Scene x2/x3 missing EOT + Daily x2/x3 missing per-scene cap (from rules-review-070) |
| ptu-rule-071 | P2 | **open** | Weather undo/redo snapshot missing (from code-review-081) |

### Feature Tickets (`tickets/feature/`)
(none)

### UX Tickets (`tickets/ux/`)
(none)

## Active Developer Work

**Current task:** Idle — end of session 5.

**CHANGES_REQUIRED (must fix next session):**
1. ptu-rule-067 (P1, CRITICAL) — Stuck = speed 0, not halved
2. ptu-rule-068 (P2, HIGH) — Speed CS additive not multiplicative
3. ptu-rule-069 (P2, HIGH) — Sprint mutation + persistence

**Approved work awaiting resolution:**
- ptu-rule-049, 052, 053, 059, 061, 064 — all APPROVED by both reviewers, can be marked resolved
- refactoring-043 — APPROVED by both reviewers, can be marked resolved

**Next session queue (by priority):**
1. Fix CHANGES_REQUIRED items (ptu-rule-067, 068, 069) — re-review needed for VTT batch
2. ptu-rule-065 (P1) — encounter end boundAp clearing
3. Remaining P2 ptu-rule tickets (046, 066, 070, 071)
4. Remaining P2 refactoring (032, 033, 035, 039, 042, 044, 047, 049)
5. P3 tickets (045, 048, 050–051, 054–058, 060)

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

**Pending reviews:** VTT batch re-review after CHANGES_REQUIRED fixes.

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
| Open tickets (P1) | 2 (ptu-rule-065, ptu-rule-067) |
| Open tickets (P2) | 22 (12 ptu-rules + 10 refactoring) |
| Open tickets (P3) | 15 (10 ptu-rules + 1 bug + 4 refactoring) |
| In-progress (approved) | 7 (ptu-rule-049, 052, 053, 059, 061, 064 + refactoring-043) |
| Changes required | 3 (ptu-rule-044, 062, 063 — VTT batch) |
| Total open | 39 |
| Total resolved | 79 |

## Session Summary (2026-02-20, session 5)

**Implemented this session:** 13 tickets across 7 parallel Developer agents (~33 commits)
- refactoring-043 (P2) — Pokemon page 1384→388 lines, 6 components extracted
- ptu-rule-044 + 062 + 063 — VTT terrain/movement (swim, burrow, speed selection, movement conditions)
- ptu-rule-049 (P2) — Poison stacking fix + Bad Sleep volatile condition
- ptu-rule-052 (P2) — Extended Rest daily move rolling window
- ptu-rule-053 (P2) — Bound AP tracking with full lifecycle
- ptu-rule-059 (P2) — Scene-frequency move enforcement (216-line utility + 39 tests)
- ptu-rule-061 (P2) — Weather duration counter with auto-expiration (full stack)
- ptu-rule-064 (P3) — Template HP stat fallback 0→10

**Reviews completed:** 12 (6 batches x 2 reviewers)
- 5 batches APPROVED (with issues/notes → new tickets filed)
- 1 batch CHANGES_REQUIRED (VTT terrain — Stuck and Speed CS formula wrong per PTU)

**New tickets filed from reviews:** 12
- ptu-rule-065 through 071 (7 ptu-rule tickets from review findings)
- bug-029 (AP bounds validation)
- refactoring-047 through 050 (4 refactoring tickets)

**All P0 bugs remain resolved. 2 new P1 tickets from reviews (ptu-rule-065, 067).** Session was the most productive: 7 parallel dev agents + 12 parallel review agents.
