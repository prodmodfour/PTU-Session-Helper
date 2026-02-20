---
last_updated: 2026-02-20T23:59:00
updated_by: orchestrator
---

# Dev Ecosystem State

## Open Tickets

### Bug Tickets (`tickets/bug/`)
| Ticket | Priority | Severity | Status | Summary |
|--------|----------|----------|--------|---------|
| bug-001 | P2 | — | resolved | CSV parser swim/sky read same cell |
| bug-002 | P1 | — | resolved | CSV parser capability rows off by +1 |
| bug-003 | P1 | — | resolved | `other` → `otherCapabilities` JSON key migration |
| bug-004 | P1 | — | resolved | Capture attempt hardcodes maxEvolutionStage |
| bug-005 | P1 | — | resolved | pickRandomAbility selects Advanced Abilities |
| bug-006 | P0 | CRITICAL | resolved | Injury-reduced max HP never computed |
| bug-007 | P0 | CRITICAL | resolved | Stat point allocation uses level-1 instead of level+10 |
| bug-008 | P1 | HIGH | resolved | Temp HP stacks additively instead of max(old,new) |
| bug-009 | P1 | HIGH | resolved | Nature stat adjustments never applied |
| bug-010 | P1 | HIGH | resolved | Trainer HP formula never computed on manual creation |
| bug-011 | P1 | HIGH | resolved | Int weight column truncates fractional weights |
| bug-012 | P1 | HIGH | resolved | Click-to-move ignores terrain costs |
| bug-013 | P2 | MEDIUM | resolved | Trapped +10 capture bonus incorrect |
| bug-014 | P2 | MEDIUM | resolved | Breather removes Cursed without checking source |
| bug-015 | P2 | MEDIUM | resolved | Features/edges not editable via PUT |
| bug-016 | P2 | MEDIUM | resolved | Spawn count hard-capped at 10 |
| bug-017 | P2 | MEDIUM | resolved | Missing Earth and Rough terrain types |
| bug-018 | P2 | MEDIUM | resolved | Blocking terrain doesn't block LoS — fully wired into targeting |
| bug-019 | P2 | MEDIUM | resolved | Multi-cell token range — fully wired into targeting |
| bug-020 | P3 | LOW | resolved | Disarm and Dirty Trick maneuvers missing |
| bug-021 | P3 | LOW | resolved | Capture doesn't consume standard action |
| bug-022 | P3 | LOW | resolved | No scene-end AP restoration |
| bug-023 | P2 | MEDIUM | resolved | Speed Evasion auto-selection — fully fixed with per-target label |
| bug-024 | P2 | MEDIUM | resolved | Encounter template trainer HP formula missing hpStat |
| bug-025 | P2 | MEDIUM | resolved | players.get.ts returns raw hp stat as maxHp |
| bug-026 | P2 | MEDIUM | resolved | Template load type shape mismatches — fully fixed with statusConditions + entityId |
| bug-027 | P2 | MEDIUM | resolved | scaledMin > scaledMax density inversion |
| bug-028 | P3 | LOW | resolved | E2E test for Cursed breather exclusion |

### PTU Rule Tickets (`tickets/ptu-rule/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-029–041 | P1–P3 | resolved | (all resolved — see previous state) |
| ptu-rule-042 | P2 | resolved | 7 derived trainer stats |
| ptu-rule-043 | P2 | resolved | 7 level-up automation items (5/7 implemented, 2 deferred) |
| ptu-rule-044 | P2 | **open** | Movement conditions not enforced on grid |
| ptu-rule-045 | P3 | **open** | Equipment/armor system |
| ptu-rule-046 | P2 | **open** | League battle declaration phase |
| ptu-rule-047 | P2 | resolved | Condition clearing on faint/encounter-end |
| ptu-rule-048 | P3 | **open** | Evasion CS treatment |
| ptu-rule-049 | P2 | **open** | Capture status condition definitions |
| ptu-rule-050 | P3 | **open** | pokeBallType dead code |
| ptu-rule-051 | P3 | **open** | Breather shift movement |
| ptu-rule-052 | P2 | **open** | Extended Rest daily move refresh |
| ptu-rule-053 | P2 | **open** | AP pool tracking |
| ptu-rule-054 | P3 | **open** | Base Relations Rule |
| ptu-rule-055 | P3 | **open** | XP calculation |
| ptu-rule-056 | P3 | **open** | Character creation form |
| ptu-rule-057 | P3 | **open** | Species diversity |
| ptu-rule-058 | P3 | **open** | Encounter density/significance mismatch |
| ptu-rule-059 | P2 | **open** | Scene-frequency move enforcement |
| ptu-rule-060 | P3 | **open** | Level-budget/significance |
| ptu-rule-061 | P2 | **open** | Weather duration |
| ptu-rule-062 | P2 | **open** | Terrain/movement types |
| ptu-rule-063 | P2 | **open** | Water terrain canSwim hardcoded to false |
| ptu-rule-064 | P2 | **open** | Template HP stat fallback defaults to 0 instead of 10 |

### Feature Tickets (`tickets/feature/`)
(none)

### UX Tickets (`tickets/ux/`)
(none)

## Active Developer Work

**Current task:** Idle — end of session.

**Next session queue (by priority):**
1. ptu-rule-044–064 (P2–P3) — 20 approximation tickets
2. refactoring-043 (P2, EXT-GOD) — Pokemon page over 800-line limit (1384 lines)
3. refactoring-032, 033, 035, 039, 041, 042, 044, 045, 046 (P2–P3) — 9 open refactoring tickets

## Review Status

### Recently Completed Reviews (this session)
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-073 | bug-018, bug-019 (wiring) | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-063 | bug-018, bug-019 (wiring) | APPROVED | game-logic-reviewer | 2026-02-20 |
| code-review-074 | bug-020, bug-021, bug-022 | APPROVED_WITH_ISSUES | senior-reviewer | 2026-02-20 |
| rules-review-064 | bug-020, bug-021, bug-022 | APPROVED_WITH_NOTES | game-logic-reviewer | 2026-02-20 |
| code-review-075 | ptu-rule-042, 043, 047 | REVISE→APPROVED (C1 fixed: 65612c3) | senior-reviewer | 2026-02-20 |
| rules-review-065 | ptu-rule-042, 043, 047 | PASS | game-logic-reviewer | 2026-02-20 |

**Pending reviews:** None.

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
| refactoring-043 | P2 | open | Pokemon detail page over 800 lines (EXT-GOD) |
| refactoring-044 | P2 | open | Surface capture action error to user (EXT-DUPLICATE) |
| refactoring-045 | P3 | open | N+1 query in new-day/activate AP updates (PERF) |
| refactoring-046 | P3 | open | Duplicate capabilities display + AP restore loop (EXT-DUPLICATE) |

**Open totals:** 0 P0, 0 P1, 7 P2 + 3 P3 (refactoring)

## Code Health

| Metric | Value |
|--------|-------|
| Last audited | 2026-02-18T12:00:00 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 18 (11 ptu-rules + 7 refactoring) |
| Open tickets (P3) | 12 (9 ptu-rules + 3 refactoring) |
| Awaiting review | 0 |
| Changes required | 0 |
| Total open | 30 |
| Total resolved | 72 |

## Session Summary (2026-02-20, session 4)

**Resolved this session:** 6 tickets + 1 critical fix
- bug-020 (P3 LOW) — Disarm and Dirty Trick maneuvers added, both reviews approved
- bug-021 (P3 LOW) — Capture consumes standard action, both reviews approved
- bug-022 (P3 LOW) — Full AP tracking system with scene-end restoration, both reviews approved
- ptu-rule-042 (P2) — 7 derived trainer stats computed from skills, both reviews approved
- ptu-rule-043 (P2) — Level-up notification system (5/7 items), both reviews approved
- ptu-rule-047 (P2) — Faint preserves Other conditions, encounter-end clears Volatile, both reviews approved
- Critical fix: 65612c3 — prevent duplicate Fainted on re-faint (from code-review-075 C1)

**New tickets filed:** 4 refactoring tickets from review findings
- refactoring-043 (P2, EXT-GOD) — Pokemon page 1384 lines
- refactoring-044 (P2, EXT-DUPLICATE) — Surface capture action error
- refactoring-045 (P3, PERF) — N+1 query in AP updates
- refactoring-046 (P3, EXT-DUPLICATE) — Duplicate capabilities + AP restore

**Reviews completed:** 4
- code-review-074 (APPROVED_WITH_ISSUES)
- rules-review-064 (APPROVED_WITH_NOTES)
- code-review-075 (REVISE→APPROVED after C1 fix)
- rules-review-065 (PASS)

**All P0 and P1 bugs remain resolved. All P3 bugs now resolved. 3 P2 ptu-rules resolved.** Remaining work is P2/P3 approximation tickets and refactoring.
