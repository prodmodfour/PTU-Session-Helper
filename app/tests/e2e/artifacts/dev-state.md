---
last_updated: 2026-02-20T23:30:00
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
| bug-018 | P2 | MEDIUM | **in-progress** | Blocking terrain doesn't block LoS — LoS function written (72d383c), reviewed APPROVED, not yet wired into callers |
| bug-019 | P2 | MEDIUM | **in-progress** | Multi-cell token range uses single point — range functions written (6ff3b0a), reviewed APPROVED, not yet wired into callers |
| bug-020 | P3 | LOW | **open** | Disarm and Dirty Trick maneuvers missing |
| bug-021 | P3 | LOW | **open** | Capture doesn't consume standard action |
| bug-022 | P3 | LOW | **open** | No scene-end AP restoration |
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

**Current task:** Idle — end of session.

**Next session queue (by priority):**
1. bug-018 (P2, MEDIUM) — Wire `hasLineOfSight` into targeting flow (function exists, needs integration)
2. bug-019 (P2, MEDIUM) — Wire multi-cell token size params into `isInRange` callers (function exists, needs integration)
3. bug-020–022 (P3, LOW) — 3 low bugs
4. ptu-rule-042–064 (P2–P3) — 23 approximation tickets
5. refactoring-032, 033, 035, 039, 041 (P2–P3) — 5 open refactoring tickets

## Review Status

### Recently Completed Reviews (this session)
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-066 | bug-017 | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-067 | bug-027 | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-068 | bug-028 | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-069 | bug-023 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-070 | bug-026 (follow-up) | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-071 | bug-018 | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-072 | bug-019 | APPROVED | senior-reviewer | 2026-02-20 |
| rules-review-059 | bug-017 | APPROVED | game-logic-reviewer | 2026-02-20 |
| rules-review-060 | bug-027 | APPROVED | game-logic-reviewer | 2026-02-20 |
| rules-review-061 | bug-018 | APPROVED | game-logic-reviewer | 2026-02-20 |
| rules-review-062 | bug-019 | APPROVED | game-logic-reviewer | 2026-02-20 |

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

**Open totals:** 0 P0, 0 P1, 4 P2 + 1 P3 (refactoring)

## Code Health

| Metric | Value |
|--------|-------|
| Last audited | 2026-02-18T12:00:00 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 22 (2 bugs in-progress + 14 ptu-rules + 4 refactoring + 2 review-discovered) |
| Open tickets (P3) | 13 (3 bugs + 9 ptu-rules + 1 refactoring) |
| Awaiting review | 0 |
| Changes required | 0 |
| Total open | 35 |
| Total resolved | 63 |

## Session Summary (2026-02-20, session 2)

**Resolved this session:** 5 tickets
- bug-017 (P2 MEDIUM) — Earth/Rough terrain types, both reviews APPROVED
- bug-023 (P2 MEDIUM) — Speed Evasion label follow-up, code-review-069 APPROVED
- bug-026 (P2 MEDIUM) — statusConditions + entityId follow-up, code-review-070 APPROVED
- bug-027 (P2 MEDIUM) — scaledMin clamp, both reviews APPROVED
- bug-028 (P3 LOW) — Cursed breather E2E test, code-review-068 APPROVED

**Implementation committed (awaiting wiring):** 2
- bug-018 (72d383c) — LoS blocking terrain function in useRangeParser.ts, both reviews APPROVED
- bug-019 (6ff3b0a) — Multi-cell token range functions in useRangeParser.ts, both reviews APPROVED

**Reviews completed:** 11
- 7 code reviews (066–072)
- 4 rules reviews (059–062)

**All P0 and P1 bugs remain resolved.** Remaining work is P2/P3.
