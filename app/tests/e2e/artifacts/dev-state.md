---
last_updated: 2026-02-19T23:45:00
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
| bug-014 | P2 | MEDIUM | **open** | Breather removes Cursed without checking source |
| bug-015 | P2 | MEDIUM | **open** | Features/edges not editable via PUT |
| bug-016 | P2 | MEDIUM | **open** | Spawn count hard-capped at 10 |
| bug-017 | P2 | MEDIUM | **open** | Missing Earth and Rough terrain types |
| bug-018 | P2 | MEDIUM | **open** | Blocking terrain doesn't block LoS |
| bug-019 | P2 | MEDIUM | **open** | Multi-cell token range uses single point |
| bug-020 | P3 | LOW | **open** | Disarm and Dirty Trick maneuvers missing |
| bug-021 | P3 | LOW | **open** | Capture doesn't consume standard action |
| bug-022 | P3 | LOW | **open** | No scene-end AP restoration |
| bug-023 | P2 | MEDIUM | **open** | Speed Evasion auto-selection ignores defender choice |
| bug-024 | P2 | MEDIUM | resolved | Encounter template trainer HP formula missing hpStat |
| bug-025 | P2 | MEDIUM | resolved | players.get.ts returns raw hp stat as maxHp |
| bug-026 | P2 | MEDIUM | **open** | Template load type shape mismatches (injuries, combatStages, tempHp) |

### PTU Rule Tickets (`tickets/ptu-rule/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-029–041 | P1–P3 | resolved | (all resolved — see previous state) |
| ptu-rule-042 | P2 | **open** | 7 derived trainer stats |
| ptu-rule-043 | P2 | **open** | 7 level-up automation items |
| ptu-rule-044 | P2 | **open** | Movement conditions not enforced on grid |
| ptu-rule-045 | P3 | **open** | Equipment/armor system |
| ptu-rule-046 | P2 | **open** | League battle declaration phase |
| ptu-rule-047 | P2 | **open** | Condition clearing on faint/encounter-end |
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

**Current task:** Idle — all assigned bugs resolved and reviewed.

**Queue (by priority):**
1. bug-014 (P2, MEDIUM) — Breather removes Cursed without checking source
2. bug-015 (P2, MEDIUM) — Features/edges not editable via PUT
3. bug-016 (P2, MEDIUM) — Spawn count hard-capped at 10
4. bug-017 (P2, MEDIUM) — Missing Earth and Rough terrain types
5. bug-018 (P2, MEDIUM) — Blocking terrain doesn't block LoS
6. bug-019 (P2, MEDIUM) — Multi-cell token range uses single point
7. bug-023 (P2, MEDIUM) — Speed Evasion auto-selection
8. bug-026 (P2, MEDIUM) — Template load type shape mismatches
9. bug-020–022 (P3, LOW) — 3 low bugs
10. ptu-rule-042–064 (P2–P3) — 23 approximation tickets
11. refactoring-032, 033, 035, 039, 041 (P2–P3) — 5 open refactoring tickets

## Review Status

### Recently Completed Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-053 | refactoring-040 | APPROVED | senior-reviewer | 2026-02-19 |
| code-review-054 | bug-006, bug-007 | CHANGES_REQUIRED | senior-reviewer | 2026-02-19 |
| code-review-055 | bug-006 (re-review) | CHANGES_REQUIRED (dead var) | senior-reviewer | 2026-02-19 |
| code-review-056 | bug-008/009/010/012 | APPROVED | senior-reviewer | 2026-02-19 |
| code-review-057 | bug-011 | CHANGES_REQUIRED (3 MEDIUM) | senior-reviewer | 2026-02-19 |
| code-review-058 | bug-013, bug-025 | APPROVED | senior-reviewer | 2026-02-19 |
| code-review-059 | bug-024 | APPROVED | senior-reviewer | 2026-02-19 |
| rules-review-047 | 9 ambiguous items | MIXED (rulings) | game-logic-reviewer | 2026-02-19 |
| rules-review-048 | bug-006, bug-007 | CHANGES_REQUIRED | game-logic-reviewer | 2026-02-19 |
| rules-review-049 | bug-006 (re-verify) | APPROVED | game-logic-reviewer | 2026-02-19 |
| rules-review-050 | bug-008/009/010/012 | APPROVED | game-logic-reviewer | 2026-02-19 |
| rules-review-051 | bug-011 | APPROVED | game-logic-reviewer | 2026-02-19 |
| rules-review-052 | bug-013, bug-025 | APPROVED | game-logic-reviewer | 2026-02-19 |
| rules-review-053 | bug-024 | APPROVED | game-logic-reviewer | 2026-02-19 |

**Pending review:** code-review-060 (re-review of bug-011 review feedback, commit 2b2f804) — in progress

## Refactoring Tickets (`refactoring/`)

| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-032 | P2 | open | Extract shared SCSS partials (EXT-DUPLICATE) |
| refactoring-033 | P2 | open | TableEditor density dropdown labels (DATA-INCORRECT) |
| refactoring-035 | P2 | open | Inconsistent error wiring in encounter-tables (EXT-DUPLICATE) |
| refactoring-039 | P2 | open | habitats/index.vue duplicated encounter creation (EXT-DUPLICATE) |
| refactoring-040 | P2 | resolved | PUT response shapes — reviewed, APPROVED |
| refactoring-041 | P3 | open | Stale test in characters.test.ts (TEST-STALE) |

**Open totals:** 0 P0, 0 P1, 4 P2 + 1 P3 (refactoring)

## Code Health

| Metric | Value |
|--------|-------|
| Last audited | 2026-02-18T12:00:00 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 30 (8 bugs + 14 ptu-rules + 4 refactoring + 4 review-discovered) |
| Open tickets (P3) | 13 (3 bugs + 9 ptu-rules + 1 refactoring) |
| In review | 1 (code-review-060 for bug-011 feedback) |
| Total open | 43 |
| Total resolved | 55 |

## Session Summary (2026-02-19)

**Resolved this session:** 12 tickets
- bug-006, bug-007 (P0 CRITICAL) — both fixed and fully reviewed
- bug-008, bug-009, bug-010, bug-011, bug-012 (P1 HIGH) — all fixed and fully reviewed
- bug-013, bug-024, bug-025 (P2 MEDIUM) — fixed and fully reviewed
- refactoring-040 (P2) — reviewed, APPROVED
- Dead variable fix (4a84e18) — trivial, resolved

**New tickets filed this session:** 4
- bug-023 (from rules-review-047 ambiguous ruling)
- bug-025 (from code-review-056)
- bug-026 (from code-review-059)
- refactoring-041 (from code-review-058)
- ptu-rule-063 (from rules-review-050)
- ptu-rule-064 (from rules-review-053)

**All P0 and P1 bugs are now resolved.** Remaining work is P2/P3.
