---
last_updated: 2026-02-20T22:00:00
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
| bug-017 | P2 | MEDIUM | **in-progress** | Missing Earth and Rough terrain types — fix committed, awaiting review |
| bug-018 | P2 | MEDIUM | **open** | Blocking terrain doesn't block LoS |
| bug-019 | P2 | MEDIUM | **open** | Multi-cell token range uses single point |
| bug-020 | P3 | LOW | **open** | Disarm and Dirty Trick maneuvers missing |
| bug-021 | P3 | LOW | **open** | Capture doesn't consume standard action |
| bug-022 | P3 | LOW | **open** | No scene-end AP restoration |
| bug-023 | P2 | MEDIUM | **changes-required** | Speed Evasion auto-selection — fix done, code-review-064 CHANGES_REQUIRED |
| bug-024 | P2 | MEDIUM | resolved | Encounter template trainer HP formula missing hpStat |
| bug-025 | P2 | MEDIUM | resolved | players.get.ts returns raw hp stat as maxHp |
| bug-026 | P2 | MEDIUM | **changes-required** | Template load type shape mismatches — fix done, code-review-065 CHANGES_REQUIRED |
| bug-027 | P2 | MEDIUM | **in-progress** | scaledMin > scaledMax density inversion — fix committed, awaiting review |
| bug-028 | P3 | LOW | **in-progress** | E2E test for Cursed breather exclusion — test written, awaiting review |

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
1. bug-023 (P2, MEDIUM) — CHANGES_REQUIRED: add evasion type label that reflects Speed Evasion selection
2. bug-026 (P2, MEDIUM) — CHANGES_REQUIRED: move statusConditions to entity level, add entityId to combatant
3. bug-017 (P2, MEDIUM) — fix committed (f2fe6a1), awaiting both reviews
4. bug-027 (P2, MEDIUM) — fix committed (dc65a10), awaiting both reviews
5. bug-028 (P3, LOW) — test written (ef1fe54), awaiting both reviews
6. bug-018 (P2, MEDIUM) — Blocking terrain doesn't block LoS
7. bug-019 (P2, MEDIUM) — Multi-cell token range uses single point
8. bug-020–022 (P3, LOW) — 3 low bugs
9. ptu-rule-042–064 (P2–P3) — 23 approximation tickets
10. refactoring-032, 033, 035, 039, 041 (P2–P3) — 5 open refactoring tickets

## Review Status

### Recently Completed Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-060 | bug-011 (re-review) | APPROVED | senior-reviewer | 2026-02-19 |
| code-review-061 | bug-015 | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-062 | bug-016 | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-063 | bug-014 | APPROVED | senior-reviewer | 2026-02-20 |
| code-review-064 | bug-023 | CHANGES_REQUIRED | senior-reviewer | 2026-02-20 |
| code-review-065 | bug-026 | CHANGES_REQUIRED | senior-reviewer | 2026-02-20 |
| rules-review-054 | bug-014 | APPROVED | game-logic-reviewer | 2026-02-20 |
| rules-review-055 | bug-016 | APPROVED | game-logic-reviewer | 2026-02-20 |
| rules-review-056 | bug-015 | APPROVED | game-logic-reviewer | 2026-02-20 |
| rules-review-057 | bug-023 | APPROVED | game-logic-reviewer | 2026-02-20 |
| rules-review-058 | bug-026 | APPROVED | game-logic-reviewer | 2026-02-20 |

**Pending reviews (next session):**
- bug-017 fix (f2fe6a1) — needs both code-review + rules-review
- bug-027 fix (dc65a10) — needs both code-review + rules-review
- bug-028 test (ef1fe54) — needs code-review only (no game logic)

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
| Open tickets (P2) | 27 (5 bugs + 14 ptu-rules + 4 refactoring + 4 review-discovered) |
| Open tickets (P3) | 13 (3 bugs + 9 ptu-rules + 1 refactoring) |
| Awaiting review | 3 (bug-017, bug-027, bug-028) |
| Changes required | 2 (bug-023, bug-026) |
| Total open | 40 |
| Total resolved | 58 |

## Session Summary (2026-02-20)

**Resolved this session:** 3 tickets
- bug-014 (P2 MEDIUM) — Cursed breather exclusion, both reviews APPROVED
- bug-015 (P2 MEDIUM) — Features/edges PUT, both reviews APPROVED
- bug-016 (P2 MEDIUM) — Spawn count cap, both reviews APPROVED

**Fixes committed (awaiting review):** 3
- bug-017 (f2fe6a1) — Earth + Rough terrain types added (6 files, 42 unit tests pass)
- bug-027 (dc65a10) — scaledMin clamped to not exceed scaledMax (3 files)
- bug-028 (ef1fe54) — E2E regression test for Cursed surviving breather

**Reviews completed:** 11
- 6 code reviews (060–065)
- 5 rules reviews (054–058)

**Changes required (route back to Developer):** 2
- bug-023: evasion label misleading when Speed Evasion wins (code-review-064 HIGH)
- bug-026: statusConditions on wrong level + missing entityId (code-review-065 HIGH x2)

**New tickets filed:** 2
- bug-027 (from code-review-062) — density min/max inversion
- bug-028 (from code-review-063) — Cursed breather regression test

**All P0 and P1 bugs remain resolved.** Remaining work is P2/P3.
