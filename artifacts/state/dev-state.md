---
last_updated: 2026-03-04T23:35:00
updated_by: survey-1741124400
---

# Dev Ecosystem State

> **Pruning policy:** Only open/in-progress tickets appear here. Resolved tickets live in `tickets/resolved/`. Only the last 3 sessions are kept; older sessions are dropped (review artifacts in `reviews/archive/` preserve full history).

## Open Tickets

### Bug Tickets (`tickets/open/bug/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| bug-047 | P4 | open | Friend Ball loyalty fallback default mismatch (2 vs schema default 3) |
| bug-051 | P1 | open | Tickets index generator uses frontmatter status instead of directory path (fixed, ticket documents the bug) |

### PTU Rule Tickets (`tickets/open/ptu-rule/` + `tickets/in-progress/ptu-rule/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-058 | P3 | **in-progress** | Encounter density/significance + environmental modifiers — P2 fix cycle done, needs re-review |
| ptu-rule-095 | P4 | open | Disengage maneuver missing from combatManeuvers |
| ptu-rule-121 | P4 | open | Sprint endpoint missing action consumption |
| ptu-rule-125 | P4 | open | Populate grantedCapabilities on capability-granting catalog entries |
| ptu-rule-126 | P4 | open | Snow Boots conditional Overland speed penalty not enforced |
| ptu-rule-130 | P4 | open | Fainted recall+release pair should not apply League switch restriction |
| ptu-rule-133 | P4 | open | Permafrost ability weather damage reduction not handled |

### Feature Tickets (`tickets/open/feature/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| feature-025 | P2 | open | Per-combatant Darkvision/Blindsense tracking to auto-negate darkness penalties |

### UX Tickets (`tickets/open/ux/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ux-006 | P4 | open | PTU injury markers may leak precise HP info in player mode |
| ux-011 | P4 | open | Custom item form missing grantedCapabilities input field |
| ux-013 | P4 | open | LevelUpSummary stacked bonus Skill Edge display incorrect progression |
| ux-014 | P4 | open | Evolution undo snapshot staleness warning |
| ux-015 | P4 | open | Replace alert() with inline UI for evolution prevention messages |
| ux-016 | P4 | open | hasActed flag not set when all three actions individually exhausted |

### Refactoring Tickets

#### In-Progress (`tickets/in-progress/refactoring/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-096 | P4 | in-progress | Harmonize tag color styling — needs fix cycle (code-review-224 H1+M1) |
| refactoring-106 | P2 | in-progress | Decouple condition behaviors from category arrays — needs fix cycle (code-review-327 1H+1M) |

#### Open (`tickets/open/refactoring/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-002 | P3 | open | Deprecate legacy terrain types |
| refactoring-086 | P4 | open | Code-review-189 MED-1 (combat) |
| refactoring-087 | P4 | open | Code-review-190 MED-1 (vtt-grid) |
| refactoring-088 | P4 | open | Code-review-195 MED-1 (vtt-grid) |
| refactoring-091 | P4 | open | Code-review-203 M1 (character-lifecycle) |
| refactoring-095 | P4 | open | Guard addEdge() against Skill Edge string injection |
| refactoring-097 | P2 | open | Replace blocking alert() with non-blocking toast for heavily injured/death |
| refactoring-098 | P3 | open | Refactor entity mutation in heavily injured/death paths to immutable patterns |
| refactoring-099 | P4 | open | Extract XP actions from encounter.ts store (806 lines) |
| refactoring-100 | P4 | open | Reset badlyPoisonedRound on faint in applyDamageToEntity |
| refactoring-101 | P4 | open | Deduplicate type-badge SCSS across evolution components |
| refactoring-102 | P4 | open | Extract EvolutionSelectionModal from duplicated branching evolution UI |
| refactoring-103 | P4 | open | damage.post.ts uses species instead of nickname for defeated enemy tracking |
| refactoring-104 | P4 | open | useCharacterCreation.ts has inline rank progression arrays instead of shared constant |
| refactoring-107 | P4 | open | Extract duplicated SCSS from level-up P1 components |
| refactoring-108 | P3 | open | Extract switch button computeds from CombatantCard.vue |
| refactoring-109 | P4 | open | Tighten MoveDetail interface types in MoveLearningPanel |
| refactoring-110 | P4 | open | Hide Level 40 ability button when Level 20 milestone incomplete |
| refactoring-111 | P3 | open | Extract drawMovementArrow from useIsometricRendering.ts |
| refactoring-112 | P3 | open | Decompose encounter store into focused sub-modules (970 lines) |
| refactoring-113 | P3 | open | Wire or remove autoDeclineFaintedReactor in aoo-resolve.post.ts |
| refactoring-115 | P4 | open | switching.service.ts exceeds 800-line limit (811 lines) |
| refactoring-116 | P4 | open | XpDistributionModal.vue exceeds 800-line file limit (1016 lines) |
| refactoring-117 | P3 | open | Extract loyalty calculation to shared utility |
| refactoring-118 | P4 | open | Remove unused flankingMap destructure in GridCanvas.vue |
| refactoring-119 | P4 | open | Update stale interrupt.post.ts file header comment |
| refactoring-121 | P4 | open | Add flanking_update to WebSocketEvent union type |
| refactoring-122 | P3 | open | Wire receivedFlankingMap into group/player views |
| refactoring-123 | P4 | open | Fix distanceMoved to use actual moved value in intercept failure paths |
| refactoring-124 | P4 | open | Replace hardcoded speed=20 in InterceptPrompt.vue |
| refactoring-126 | P4 | open | Pokemon PUT/POST endpoints wrap all errors in statusCode 500 |
| refactoring-128 | P3 | open | Extract getEffectiveEquipBonuses from useMoveCalculation.ts |
| refactoring-129 | P3 | open | Design source-tracking for applied conditions |
| refactoring-130 | P4 | open | Environment preset clearing stores '{}' instead of null in database |

## Active Developer Work

**Current status:** Session 113 collection complete. No active slaves.

**Last session (113, 2026-03-04, plan-20260304-203323):**
- slave-1 (dev): ptu-rule-058-p2-fix + decree-048 — 7 commits. P2 fix cycle done, **needs re-review**
- slave-2 (review): ptu-rule-134 — APPROVED, feature complete
- slave-3 (review): refactoring-125 + bug-050 — both APPROVED, feature complete

**Session 112 (2026-03-04, plan-20260304-172253):**
- slave-1 (dev): ptu-rule-134 + refactoring-106-fix — 2 commits. APPROVED (session 113)
- slave-2 (dev): refactoring-125-fix — 2 commits. APPROVED (session 113)
- slave-3 (review): ptu-rule-058-p2 — CHANGES_REQUIRED (2H+3M). Fix cycle done (session 113)

**Session 111 (2026-03-04, plan-20260304-144401):**
- slave-4 (dev): ptu-rule-058-p2 — 9 commits. Environmental Modifier Framework
- slave-5 (dev): bug-001 — resolved
- slave-1 (review): refactoring-106+ptu-rule-128 — CHANGES_REQUIRED (1H+1M). Needs fix cycle
- slave-2 (review): feature-024-fix — APPROVED, feature complete
- slave-3 (review): refactoring-125 — CHANGES_REQUIRED (1M). Fixed (session 112)

## Code Health

| Metric | Value |
|--------|-------|
| Last updated | 2026-03-04 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 1 (bug-051 — index generator, already fixed) |
| Open tickets (P2) | 2 (feature-025, refactoring-097) |
| Open tickets (P3) | 12 |
| Open tickets (P4) | 34 |
| In-progress tickets | 3 (ptu-rule-058, refactoring-096, refactoring-106) |
| Total open + in-progress | 52 |
| Needing action | ptu-rule-058 (fix cycle from code-review-330), refactoring-096 (fix cycle), refactoring-106 (fix cycle) |
