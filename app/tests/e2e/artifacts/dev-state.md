---
last_updated: 2026-02-21T20:00:00
updated_by: slave-collector (plan-20260221-063148)
---

# Dev Ecosystem State

## Open Tickets

### Bug Tickets (`tickets/bug/`)
| Ticket | Priority | Severity | Status | Summary |
|--------|----------|----------|--------|---------|
| bug-001–029 | P0–P3 | — | resolved | (all resolved — see sessions 1–9) |

### PTU Rule Tickets (`tickets/ptu-rule/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-029–076 | P1–P3 | resolved | (all resolved — see sessions 1–12) |
| ptu-rule-045 | P3 | **in-progress** | Equipment/armor system — P0+P1 reviewed+approved, P2 remains (UI) |
| ptu-rule-055 | P3 | **in-progress** | XP calculation — P0+P1 reviewed+approved, P2 remains (level-up notifications) |
| ptu-rule-056 | P3 | **in-progress** | Character creation form — P0+P1 reviewed+approved, P2 remains (bio fields, mode toggle) |
| ptu-rule-058 | P3 | **in-progress** | Encounter density/significance — P0+P1 complete, P2 remains (environmental modifiers) |
| ptu-rule-060 | P3 | **in-progress** | Level-budget/significance — **P0 complete** (budget utility, composable, component, modal extensions) |
| ptu-rule-077 | P3 | **in-progress** | Focus (Speed) initiative/evasion — **fix implemented** (7 commits), pending review |
| ptu-rule-078 | P3 | **open** | Trainer class associated skills data mismatch (from rules-review-111) |
| ptu-rule-079 | P3 | **open** | Helmet conditional DR not applied with manual DR override (from code-review-120) |
| ptu-rule-080 | P3 | **open** | Higher-level char creation validation missing (from code-review-121) |

### Feature Tickets (`tickets/feature/`)
(none)

### UX Tickets (`tickets/ux/`)
(none)

## Active Developer Work

**Current task:** Slave collection for plan-20260221-063148 — 4 slaves merged.

**Session 14 (2026-02-21):**
- ptu-rule-058 P1 implemented (11 commits) — reviewed: code-review-123 CHANGES_REQUIRED, rules-review-113 APPROVED
- ptu-rule-060 P0 implemented (5 commits) — pending review
- ptu-rule-077 fix implemented (7 commits) — pending review

**Next actions (by priority — "finish all tiers" rule):**
1. **Fix** ptu-rule-058 P1 issues from code-review-123 (CHANGES_REQUIRED)
2. **Review** ptu-rule-060 P0 (level budget utility + modal extensions)
3. **Review** ptu-rule-077 (Focus Speed initiative/evasion fix)
4. ptu-rule-045 P2 (equipment tab UI, catalog browser)
5. ptu-rule-055 P2 (level-up notifications)
6. ptu-rule-056 P2 (biographical fields, quick/full-create toggle)
7. ptu-rule-060 P1+ (level budget remaining tiers)
8. ptu-rule-078 P3 (trainer class skills data correction)
9. ptu-rule-079 P3 (helmet DR parity gap)
10. ptu-rule-080 P3 (higher-level char creation validation)

**Design spec dependency graph (updated):**
- ptu-rule-058 P1 (significance multiplier) — **DONE**, code review CHANGES_REQUIRED
- ptu-rule-060 P0 (level budget) — **DONE**, pending review
- ptu-rule-045 P2 (equipment UI) — independent, can start immediately
- ptu-rule-055 P2 (level-up notifications) — independent, can start immediately
- ptu-rule-056 P2 (bio fields) — independent, can start immediately

## Review Status

### Session 14 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-123 | ptu-rule-058 P1 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-113 | ptu-rule-058 P1 | APPROVED | game-logic-reviewer | 2026-02-21 |

### Session 13 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-119 | ptu-rule-055 P1 | CHANGES_REQUIRED | senior-reviewer | 2026-02-20 |
| rules-review-109 | ptu-rule-055 P1 | APPROVED | game-logic-reviewer | 2026-02-20 |
| code-review-119b | ptu-rule-055 P1 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-120 | ptu-rule-045 P1 | APPROVED_WITH_ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-110 | ptu-rule-045 P1 | PASS WITH NOTES | game-logic-reviewer | 2026-02-20 |
| code-review-120b | ptu-rule-045 P1 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-121 | ptu-rule-056 P1 | PASS WITH ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-111 | ptu-rule-056 P1 | PASS | game-logic-reviewer | 2026-02-20 |
| code-review-121b | ptu-rule-056 P1 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-122 | ptu-rule-058 P0 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-112 | ptu-rule-058 P0 | PASS | game-logic-reviewer | 2026-02-20 |

### Sessions 9-12 Reviews
(see previous state — 54 review artifacts, all resolved)

## Refactoring Tickets (`refactoring/`)

| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-032–056 | P2–P3 | resolved | (all resolved — see sessions 8–12) |
| refactoring-057 | P4 | resolved | Zero-weight selection guard (session 12-13) |
| refactoring-058 | P4 | resolved | Immutable turnState pattern (session 12-13) |
| refactoring-059 | P4 | open | densityMultiplier API serialization cleanup (from code-review-122) |
| refactoring-060 | P4 | open | Count clamping test coverage (from code-review-122) |
| refactoring-061 | P4 | open | CSS duplication in create components (from code-review-121) |
| refactoring-062 | P4 | open | buildCombatantFromEntity test coverage (from code-review-120b) |
| refactoring-063 | P4 | open | Extract shared significance preset utilities (from code-review-123 M2 + rules-review-113 M2) |

## Code Health

| Metric | Value |
|--------|-------|
| Last audited | 2026-02-18T12:00:00 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 0 |
| Open tickets (P3) | 9 (5 ptu-rules in-progress + 4 open ptu-rules) |
| Open tickets (P4) | 5 (refactoring-059, 060, 061, 062, 063) |
| Total open | 14 |
| Total resolved | 138 |

## Session Summary (2026-02-20, session 13)

**Review cycle completed:** 4 P1/P0 implementations reviewed and approved
- ptu-rule-045 P1 (equipment combat — APPROVED_WITH_ISSUES → follow-up APPROVED)
- ptu-rule-055 P1 (XP distribution — CHANGES_REQUIRED → follow-up APPROVED)
- ptu-rule-056 P1 (char creation classes/features — PASS WITH ISSUES → follow-up APPROVED)
- ptu-rule-058 P0 (density/significance — APPROVED + PASS)

**Follow-up fix cycles:** 3 (all resolved same session)
- 045: immutability fix + let→const
- 055: double API calls + stale response protection + SCSS extraction
- 056: skill edge rank reversion + validation clarity + dead code + shared constants

**Refactorings resolved:** 2 (057 zero-weight guard, 058 immutable turnState)

**Tickets created:** 4 (ptu-rule-077, ptu-rule-078, refactoring-059, refactoring-060)

**Reviews completed:** 14 artifacts (5 initial code reviews, 4 rules reviews, 3 follow-up code reviews, 2 pre-existing reviews confirmed)

**Net movement:** 6→9 open (+3 net: +4 new tickets, -2 refactorings resolved, +1 from reclassification), 134→138 resolved (+4)

**All P0, P1, and P2 tickets remain at 0.**

## Session Summary (2026-02-21, session 14)

**Orchestrator orch-1771652588:** ptu-rule-058 P1 (significance multiplier + XP UI)
- 11 commits merged to master via worktree `agent/dev-058-p1-1771652588`
- New: SignificancePanel component, significance PUT endpoint, SCSS partial
- Modified: encounter schema, type, service, store, GM page, XpDistributionModal, encounter list/put endpoints
- ptu-rule-060 is now **unblocked** (058 P1 dependency satisfied)
- Pending: code review + game logic review for 058 P1

**Slave collection plan-20260221-063148:** 4 slaves merged (14 commits total)
- **slave-1** (senior-reviewer): code-review-123 for ptu-rule-058 P1 — verdict: **CHANGES_REQUIRED**
- **slave-2** (game-logic-reviewer): rules-review-113 for ptu-rule-058 P1 — verdict: **APPROVED**
- **slave-4** (developer): ptu-rule-077 Focus (Speed) fix — 7 commits (evasion calc, combatant builder, move calc, damage endpoint, tests)
- **slave-3** (developer): ptu-rule-060 P0 level budget — 5 commits (encounterBudget.ts, useEncounterBudget, BudgetIndicator, modal extensions)
