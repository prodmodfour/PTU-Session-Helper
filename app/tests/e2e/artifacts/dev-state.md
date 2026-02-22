---
last_updated: 2026-02-22T23:00:00
updated_by: slave-collector (plan-20260222-214423)
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
| ptu-rule-045 | P3 | **resolved** | Equipment/armor system — P0+P1+P2 all APPROVED. code-review-132 APPROVED (M1: SLOT_ICONS duplication → refactoring-069), rules-review-122 APPROVED |
| ptu-rule-055 | P3 | **resolved** | XP calculation — P0+P1+P2 all APPROVED. code-review-131 APPROVED, rules-review-121 APPROVED |
| ptu-rule-056 | P3 | **in-progress** | Character creation form — P0+P1 approved, P2 fixes re-reviewed: code-review-133 **CHANGES_REQUIRED** (H1: scoped CSS styling regression, M1: type safety), rules-review-123 APPROVED. Needs fix cycle |
| ptu-rule-058 | P3 | **resolved** | Encounter density/significance — P0+P1+H1 fix all APPROVED. code-review-131 APPROVED, rules-review-121 APPROVED |
| ptu-rule-060 | P3 | **in-progress** | Level-budget/significance — **P0 fixes applied** (4 commits): SCSS mixin ancestor selector, BudgetGuide extraction, PC-only player count, ticket update. Needs re-review |
| ptu-rule-077 | P3 | **resolved** | Focus (Speed) initiative/evasion — fix implemented, APPROVED (code-review-125 + rules-review-115) |
| ptu-rule-078 | P3 | **in-progress** | Trainer class associated skills — **fix applied** (5 commits): corrected ~28 class associatedSkills entries. Needs review |
| ptu-rule-079 | P3 | **in-progress** | Helmet conditional DR — **fix applied** (2 commits): helmet +15 DR on crits now stacks with manual DR override. Needs review |
| ptu-rule-080 | P3 | **in-progress** | Higher-level char creation validation — **fix applied** (6 commits): stat points, skill caps, edges/features, level-aware UI. Needs review |
| ptu-rule-081 | P4 | **open** | Multiple Focus items not explicitly prevented (from rules-review-115 M2) |
| ptu-rule-082 | P4 | **open** | Pokemon maxHp not auto-updated on level-up (from rules-review-118) |

### Feature Tickets (`tickets/feature/`)
| Ticket | Priority | Status | Summary | Design Complexity |
|--------|----------|--------|---------|-------------------|
| feature-001 | P3 | **design-complete** | B2W2 trainer sprites for NPC/player avatars — design spec written (design-trainer-sprites-001.md) | single-phase |
| feature-002 | P2 | **design-complete** | 3D isometric rotatable grid for VTT — design spec written (design-isometric-grid-001.md) | multi-phase |
| feature-003 | P1 | **design-complete** | Full Player View — Track A (core) + Track B (infra) + Track C (integration) all design specs written | multi-phase-parallel |

### UX Tickets (`tickets/ux/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ux-001 | P4 | **open** | Equipment catalog browser closes on equip, forces re-open for multi-item sessions (from code-review-127 M3) |

## Active Developer Work

**Current task:** Slave collection for plan-20260222-214423 completed — 8 slaves merged (25 commits total).

**Session 16 (2026-02-22, continued):**
- ptu-rule-060 P0 fixes applied (slave-1, 4 commits) — SCSS mixin ancestor selector, BudgetGuide extraction, PC-only player count, ticket update
- ptu-rule-058+055 re-reviewed (slave-2) — code-review-131 APPROVED, rules-review-121 APPROVED → **both resolved**
- ptu-rule-045 P2 re-reviewed (slave-3) — code-review-132 APPROVED (M1: SLOT_ICONS duplication), rules-review-122 APPROVED → **resolved**
- ptu-rule-056 P2 re-reviewed (slave-4) — code-review-133 CHANGES_REQUIRED (H1: scoped CSS, M1: type safety), rules-review-123 APPROVED → needs fix cycle
- ptu-rule-078 fix applied (slave-5, 5 commits) — corrected associatedSkills for ~28 trainer classes against PTU Chapter 4
- ptu-rule-079 fix applied (slave-6, 2 commits) — helmet +15 DR on crits now stacks with manual DR override
- ptu-rule-080 fix applied (slave-7, 6 commits) — level-aware stat points, skill rank caps, edges/features validation
- feature-003 Track C design written (slave-8, 2 commits) — Player View integration design spec (WebSocket protocol, Group View control, VTT grid, scene view)

**Next actions (by priority — "finish all tiers" rule):**
1. **Fix** ptu-rule-056 P2 issues from code-review-133 (CHANGES_REQUIRED — H1: scoped CSS styling regression in QuickCreateForm, M1: type safety regression)
2. **Re-review** ptu-rule-060 P0 fixes (4 commits applied — SCSS mixin, BudgetGuide extraction, PC player count)
3. **Review** ptu-rule-078 (5 commits — trainer class skills data correction)
4. **Review** ptu-rule-079 (2 commits — helmet conditional DR fix)
5. **Review** ptu-rule-080 (6 commits — higher-level char creation validation)
6. ptu-rule-060 P1+ (level budget remaining tiers)
7. ptu-rule-081 P4 (multiple Focus items enforcement)
8. ptu-rule-082 P4 (Pokemon maxHp auto-update on level-up)

## Review Status

### Session 16 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-131 | ptu-rule-058+055 re-review | APPROVED | senior-reviewer | 2026-02-22 |
| rules-review-121 | ptu-rule-058+055 re-review | APPROVED | game-logic-reviewer | 2026-02-22 |
| code-review-132 | ptu-rule-045 P2 re-review | APPROVED | senior-reviewer | 2026-02-22 |
| rules-review-122 | ptu-rule-045 P2 re-review | APPROVED | game-logic-reviewer | 2026-02-22 |
| code-review-133 | ptu-rule-056 P2 re-review | CHANGES_REQUIRED | senior-reviewer | 2026-02-22 |
| rules-review-123 | ptu-rule-056 P2 re-review | APPROVED | game-logic-reviewer | 2026-02-22 |

### Session 15 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-130 | ptu-rule-060 P0 re-review | CHANGES_REQUIRED | senior-reviewer | 2026-02-22 |
| rules-review-120 | ptu-rule-060 P0 re-review | APPROVED | game-logic-reviewer | 2026-02-22 |

### Session 14 Reviews
| Review ID | Target | Verdict | Reviewer | Date |
|-----------|--------|---------|----------|------|
| code-review-123 | ptu-rule-058 P1 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-113 | ptu-rule-058 P1 | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-124 | ptu-rule-060 P0 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-114 | ptu-rule-060 P0 | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-125 | ptu-rule-077 fix | APPROVED | senior-reviewer | 2026-02-21 |
| rules-review-115 | ptu-rule-077 fix | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-126 | ptu-rule-058 P1 re-review | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-116 | ptu-rule-058 P1 re-review | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-127 | ptu-rule-045 P2 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-117 | ptu-rule-045 P2 | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-128 | ptu-rule-055 P2 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-118 | ptu-rule-055 P2 | APPROVED | game-logic-reviewer | 2026-02-21 |
| code-review-129 | ptu-rule-056 P2 | CHANGES_REQUIRED | senior-reviewer | 2026-02-21 |
| rules-review-119 | ptu-rule-056 P2 | PASS WITH ISSUES | game-logic-reviewer | 2026-02-21 |

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
| refactoring-063 | P4 | **resolved** | Extract shared significance preset utilities (from code-review-123 M2 + rules-review-113 M2) — resolved by slave-1 |
| refactoring-064 | P4 | **resolved** | Extract shared difficulty color styles (from code-review-124 H2) — resolved by slave-1 (plan-20260221-215717) |
| refactoring-065 | P4 | open | Extract shared evasion computation helper in useMoveCalculation (from code-review-125 M1) |
| refactoring-066 | P4 | open | Use calculateEvasion for initial evasion in combatant builder (from code-review-125 M2) |
| refactoring-067 | P4 | open | Dead calculateInitiative in useCombat missing Focus bonus (from rules-review-115 M1) |
| refactoring-068 | P4 | open | Equipment dropdown uses DOM manipulation instead of reactive ref (from code-review-127 M2) |
| refactoring-069 | P4 | open | SLOT_ICONS duplicated between HumanEquipmentTab and EquipmentCatalogBrowser (from code-review-132 M1) |

## Code Health

| Metric | Value |
|--------|-------|
| Last audited | 2026-02-18T12:00:00 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 1 (feature-003 — design-complete) |
| Open tickets (P2) | 1 (feature-002 — design-complete) |
| Open tickets (P3) | 5 (ptu-rule-056 needs fix + ptu-rule-060 needs re-review + ptu-rule-078, 079, 080 need review + feature-001 design-complete) |
| Open tickets (P4) | 12 (refactoring-059, 060, 061, 062, 065, 066, 067, 068, 069 + ptu-rule-081, 082 + ux-001) |
| Total open | 19 |
| Total resolved | 145 |

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

**Slave collection plan-20260221-071325:** 6 slaves merged (26 commits total)
- **slave-1** (developer): ptu-rule-058 P1 fixes — 7 commits (NaN guards, null guard, WS broadcast, utility extraction, fallback fix, app-surface, ticket update)
- **slave-2** (reviewers): ptu-rule-060 P0 review — code-review-124 CHANGES_REQUIRED + rules-review-114 APPROVED
- **slave-3** (reviewers): ptu-rule-077 review — code-review-125 APPROVED + rules-review-115 APPROVED
- **slave-4** (developer): ptu-rule-045 P2 — 6 commits (HumanEquipmentTab, EquipmentCatalogBrowser, CharacterModal, GM page, design+ticket update)
- **slave-5** (developer): ptu-rule-055 P2 — 4 commits (LevelUpNotification, add-experience endpoint, XpDistributionModal integration, ticket update)
- **slave-6** (developer): ptu-rule-056 P2 — 5 commits (BiographySection, useCharacterCreation, create page mode toggle, design+ticket update)

**Tickets filed:** 5 (refactoring-064, 065, 066, 067, ptu-rule-081)
**Tickets resolved:** 1 (refactoring-063 — by slave-1)
**Net movement:** 14→18 open (+4 net: +5 new tickets, -1 resolved)

**Slave collection plan-20260221-215717:** 5 slaves merged (15 commits total)
- **slave-1** (developer): ptu-rule-060 P0 fixes — 7 commits (rename field, player count filter, SCSS extraction, wire props, manual party input, app-surface, ticket update). Also resolved refactoring-064.
- **slave-2** (reviewers): ptu-rule-058 P1 re-review — code-review-126 CHANGES_REQUIRED (H1: XpDistributionModal NaN guards) + rules-review-116 APPROVED
- **slave-3** (reviewers): ptu-rule-045 P2 review — code-review-127 CHANGES_REQUIRED (C1: malformed WS event, H1: duplicated constants, H2: app-surface) + rules-review-117 APPROVED
- **slave-4** (reviewers): ptu-rule-055 P2 review — code-review-128 CHANGES_REQUIRED (H1: duplicate level-up display) + rules-review-118 APPROVED
- **slave-5** (reviewers): ptu-rule-056 P2 review — code-review-129 CHANGES_REQUIRED (C1: file >800 lines, H1: cmToFeetInches bug, H2: wrong weight class) + rules-review-119 PASS WITH ISSUES (H1: weight class)

**Tickets filed:** 3 (ptu-rule-082, refactoring-068, ux-001)
**Tickets resolved:** 1 (refactoring-064 — by slave-1)
**Net movement:** 18→21 open (+3 net: +3 new tickets, -1 resolved, +1 ptu-rule-082 new)

## Session Summary (2026-02-22, session 15)

**Slave collection plan-20260222-204629:** 8 slaves merged (32 commits total)
- **slave-1** (developer): ptu-rule-058 H1 + ptu-rule-055 P2 fixes — 6 commits (NaN-safe computed, remove duplicate level-up, upper bound validation, v-for key, app-surface, ticket update)
- **slave-2** (developer): ptu-rule-045 P2 fixes — 5 commits (WS broadcast to parent, shared constants extraction, input max, app-surface, ticket update)
- **slave-3** (developer): ptu-rule-056 P2 fixes — 7 commits (cmToFeetInches, trainer weight class, negative int guard, magic number, money, QuickCreateForm extraction, ticket update)
- **slave-4** (reviewers): ptu-rule-060 P0 re-review — code-review-130 CHANGES_REQUIRED (C2: SCSS mixin selector, M3: file >800 lines, M4: NPC player count) + rules-review-120 APPROVED
- **slave-5** (developer): feature-001 design — 1 commit (design-trainer-sprites-001.md)
- **slave-6** (developer): feature-002 design — 1 commit (design-isometric-grid-001.md)
- **slave-7** (developer): feature-003 Track A design — 5 commits (design-player-view-core-001.md + PTU rule corrections)
- **slave-8** (developer): feature-003 Track B design — 5 commits (design-player-view-infra-001.md + infrastructure corrections)

**Tickets filed:** 0
**Tickets resolved:** 0
**Design specs created:** 4 (trainer sprites, isometric grid, player view core, player view infra)
**Net movement:** 21→21 open (no change — all work was fix cycles and design specs)

**All P0 tickets remain at 0.**

## Session Summary (2026-02-22, session 16 — plan-20260222-214423)

**Slave collection plan-20260222-214423:** 8 slaves merged (25 commits total)
- **slave-1** (developer): ptu-rule-060 P0 fixes — 4 commits (SCSS mixin ancestor selector, BudgetGuide extraction, PC-only player count, ticket update)
- **slave-2** (reviewers): ptu-rule-058+055 re-review — code-review-131 APPROVED + rules-review-121 APPROVED → **both tickets resolved**
- **slave-3** (reviewers): ptu-rule-045 P2 re-review — code-review-132 APPROVED (M1: SLOT_ICONS duplication) + rules-review-122 APPROVED → **ticket resolved**
- **slave-4** (reviewers): ptu-rule-056 P2 re-review — code-review-133 CHANGES_REQUIRED (H1: scoped CSS styling, M1: type safety) + rules-review-123 APPROVED → needs fix cycle
- **slave-5** (developer): ptu-rule-078 fix — 5 commits (corrected ~28 trainer class associatedSkills against PTU Chapter 4)
- **slave-6** (developer): ptu-rule-079 fix — 2 commits (helmet +15 DR on crits stacks with manual DR override)
- **slave-7** (developer): ptu-rule-080 fix — 6 commits (level-aware stat points, skill rank caps, edges/features, composable + UI)
- **slave-8** (developer): feature-003 Track C design — 2 commits (Player View integration design spec)

**Tickets filed:** 1 (refactoring-069 — SLOT_ICONS duplication from code-review-132 M1)
**Tickets resolved:** 5 (ptu-rule-045, ptu-rule-055, ptu-rule-058, ptu-rule-077 reclassified to resolved)
**Design specs created:** 1 (player view integration — Track C)
**Net movement:** 21→19 open (-2 net: -5 resolved + 1 new ticket + feature-003 track C completed, ptu-rule-060/078/079/080 already open)

**All P0 tickets remain at 0.**
