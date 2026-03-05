---
last_updated: 2026-03-05T20:00:00
updated_by: orchestrator-survey (0b refresh)
---

# Dev Ecosystem State

> **Pruning policy:** Only open/in-progress tickets appear here. Resolved tickets live in `tickets/resolved/`. Only the last 3 sessions are kept; older sessions are dropped (review artifacts in `reviews/archive/` preserve full history).

## Open Tickets

### Bug Tickets (`tickets/open/bug/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| bug-052 | P4 | open | PlayerCharacterSheet.vue uses bare tag class instead of tag--feature variant |

### UX Tickets (`tickets/open/ux/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ux-006 | P4 | open | PTU injury markers may leak precise HP info in player mode |
| ux-011 | P4 | open | Custom item form missing grantedCapabilities input field |
| ux-013 | P4 | open | LevelUpSummary stacked bonus Skill Edge display incorrect progression |
| ux-014 | P4 | open | Evolution undo snapshot staleness warning |
| ux-015 | P4 | open | Replace alert() with inline UI for evolution prevention messages |
| ux-016 | P4 | open | hasActed flag not set when all three actions individually exhausted |
| ux-017 | P4 | open | Preset descriptions misleadingly imply tier-specific vision negation |
| ux-018 | P4 | open | Environment preset descriptions imply tier-specific vision negation |

### Docs Tickets (`tickets/open/docs/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| docs-017 | P4 | open | bug-047 resolution log has stale commit hashes and missing affected_files |

### Refactoring Tickets (`tickets/open/refactoring/`)
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-099 | P4 | open | Extract XP actions from encounter.ts store (806 lines) |
| refactoring-100 | P4 | open | Reset badlyPoisonedRound on faint in applyDamageToEntity |
| refactoring-101 | P4 | open | Deduplicate type-badge SCSS across evolution components |
| refactoring-102 | P4 | open | Extract EvolutionSelectionModal from duplicated branching evolution UI |
| refactoring-103 | P4 | open | damage.post.ts uses species instead of nickname for defeated enemy tracking |
| refactoring-104 | P4 | open | useCharacterCreation.ts has inline rank progression arrays instead of shared constant |
| refactoring-107 | P4 | open | Extract duplicated SCSS from level-up P1 components |
| refactoring-109 | P4 | open | Tighten MoveDetail interface types in MoveLearningPanel |
| refactoring-110 | P4 | open | Hide Level 40 ability button when Level 20 milestone incomplete |
| refactoring-115 | P4 | open | switching.service.ts exceeds 800-line limit (811 lines) |
| refactoring-116 | P4 | open | XpDistributionModal.vue exceeds 800-line file limit (1016 lines) |
| refactoring-118 | P4 | open | Remove unused flankingMap destructure in GridCanvas.vue |
| refactoring-119 | P4 | open | Update stale interrupt.post.ts file header comment |
| refactoring-121 | P4 | open | Add flanking_update to WebSocketEvent union type |
| refactoring-123 | P4 | open | Fix distanceMoved to use actual moved value in intercept failure paths |
| refactoring-124 | P4 | open | Replace hardcoded speed=20 in InterceptPrompt.vue |
| refactoring-126 | P4 | open | Pokemon PUT/POST endpoints wrap all errors in statusCode 500 |
| refactoring-130 | P4 | open | Environment preset clearing stores '{}' instead of null in database |
| refactoring-132 | P4 | open | Extract shared significance preset utilities |
| refactoring-136 | P4 | open | Remove dead enterBetweenTurns/exitBetweenTurns exports from useEncounterOutOfTurn |
| refactoring-137 | P4 | open | toggleVisionCapability uses direct getHistory() instead of delegated captureSnapshot |
| refactoring-138 | P4 | open | Remaining entity mutation sites in aoo-resolve, breather, healing-item, living-weapon |
| refactoring-140 | P4 | open | Update stale 'mutates entity' comment in damage.post.ts |

### In-Progress Tickets
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-121 | P4 | **in-progress** | Sprint endpoint action consumption — implemented (slave-6), needs review |
| ptu-rule-125 | P4 | **in-progress** | grantedCapabilities on equipment — implemented (slave-7), needs review |
| ptu-rule-126 | P4 | **in-progress** | Snow Boots conditional penalty — implemented (slave-7), needs review |
| ptu-rule-130 | P4 | **in-progress** | Fainted recall+release League exemption — implemented (slave-8), needs review |
| ptu-rule-133 | P4 | **in-progress** | Permafrost weather damage reduction — implemented (slave-9), needs review |
| refactoring-129 | P3 | **in-progress** | Condition source-tracking design spec — complete (slave-10), needs review |

## Active Developer Work

**Current status:** Session 119 collection complete. No active slaves.

**Last session (119, 2026-03-05, plan-1772707228):**
- slave-1–5 (review): bug-054+refactoring-139 **APPROVED**, refactoring-117 **APPROVED**, refactoring-128 **APPROVED**, bug-055 **APPROVED**, ptu-rule-135 **APPROVED**. All 6 tickets resolved.
- slave-6 (dev): ptu-rule-121 — 2 commits. Sprint action consumption added.
- slave-7 (dev): ptu-rule-125+126 — 3 commits. Equipment grantedCapabilities + Snow Boots penalty.
- slave-8 (dev): ptu-rule-130 — 2 commits. Fainted recall+release League switch exemption.
- slave-9 (dev): ptu-rule-133 — 3 commits. Permafrost weather damage reduction.
- slave-10 (dev): refactoring-129 — 2 commits. Full design spec for condition source tracking.

**Session 118 (2026-03-05, plan-1772702519):**
- slave-1 (review): feature-025 re-review → code-review-339 **APPROVED**. Feature complete.
- slave-2 (review): refactoring-098 → code-review-340 **APPROVED**. Immutable patterns verified.
- slave-3 (review): refactoring-122 → code-review-341 **APPROVED**. Flanking badge wiring verified.
- slave-4 (dev): bug-054+055+refactoring-139 — 4 commits. Timer leak cleanup, Map iteration fix, newline→semicolons in toast.
- slave-5 (dev): refactoring-113+117+128 — 7 commits. Removed dead import, extracted useOutOfTurnState (encounter store 1132→723 lines), shared getEffectiveEquipBonuses.
- slave-6 (dev): ptu-rule-135 fix cycle — 3 commits. Added 'captured' origin check, origin-aware serializer fallbacks.

**Session 117 (2026-03-05, plan-1772695906):**
- slave-1 (dev): feature-025 — 6 commits. Fixed all 5 code-review-331 issues (CRIT-1 WS propagation, HIGH-1 broadcast, HIGH-2 alert→error, MED-1 source validation, MED-2 app-surface). Also resolves bug-053, refactoring-133, refactoring-134, refactoring-135, docs-018.
- slave-2 (review): ptu-rule-135 — 2 commits. code-review-332 **CHANGES_REQUIRED** (2 issues). rules-review-313 APPROVED WITH NOTES.
- slave-3 (review): refactoring-112 — 1 commit. code-review-333 **APPROVED**.
- slave-4 (review): refactoring-131 — 1 commit. code-review-334b **CHANGES_REQUIRED** (H1 timer leak, M1 map iteration, M2 newline — tickets filed).
- slave-5 (dev): refactoring-098 — 5 commits. Immutable spread patterns in damage/next-turn/move endpoints + combatant.service.ts.
- slave-6 (dev): refactoring-122 — 9 commits. Wired receivedFlankingMap into group + player views.

## Code Health

| Metric | Value |
|--------|-------|
| Last updated | 2026-03-05 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 0 |
| Open tickets (P3) | 0 |
| Open tickets (P4) | 33 |
| In-progress tickets | 6 (ptu-rule-121, ptu-rule-125, ptu-rule-126, ptu-rule-130, ptu-rule-133, refactoring-129) |
| Total open + in-progress | 39 |
| Needing review | ptu-rule-121, ptu-rule-125, ptu-rule-126, ptu-rule-130, ptu-rule-133, refactoring-129 |
| Resolved this session | bug-054, bug-055, refactoring-117, refactoring-128, refactoring-139, ptu-rule-135 |
