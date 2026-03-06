---
last_updated: 2026-03-06T23:00:00
updated_by: slave-collector (plan-1772814666)
---

# Dev Ecosystem State

> **Pruning policy:** Only open/in-progress tickets appear here. Resolved tickets live in `tickets/resolved/`. Only the last 3 sessions are kept; older sessions are dropped (review artifacts in `reviews/archive/` preserve full history).

## Open Tickets

### Bug Tickets (`tickets/open/bug/`) -- 3 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| bug-059 | P3 | open | Math.trunc vs Math.floor in movementModifier |
| bug-069 | P3 | open | Split HpReductionType to distinguish recoil from self-cost (decree-054) |
| bug-052 | P4 | open | PlayerCharacterSheet.vue uses bare tag class instead of tag--feature variant |

### PTU Rule Tickets (`tickets/open/ptu-rule/`) -- 14 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-147 | P2 | open | No per-effect duration tracking for combat stages |
| ptu-rule-149 | P2 | open | VTT allows free token repositioning without movement enforcement |
| ptu-rule-155 | P2 | open | Player-view R156-R160 implementation gaps (R156/R159/R160 reclassified to Partial) |
| ptu-rule-143 | P3 | open | Sprint should not consume Shift Action (decree-050) |
| ptu-rule-144 | P3 | open | Amateur milestone lifestyle stat points missing |
| ptu-rule-145 | P3 | open | Level 30/40 milestones missing bonus edges/features |
| ptu-rule-146 | P3 | open | App defaults to set damage instead of rolled damage |
| ptu-rule-148 | P3 | open | Pokemon released mid-round after initiative passed |
| ptu-rule-153 | P3 | open | Nature Walk terrain bypass utility incomplete |
| ptu-rule-154 | P3 | open | Hazard terrain has no mechanical effect |
| ptu-rule-158 | P3 | open | pass.post.ts incorrectly triggers Heavily Injured deferred penalty |
| ptu-rule-141 | P4 | open | Gas Mask grantedCapabilities uses fabricated capability name |
| ptu-rule-142 | P4 | open | Implement Permafrost Burn/Poison status tick damage reduction |
| ptu-rule-159 | P4 | open | Pain Split marker injury deferral not implemented |

### Feature Tickets (`tickets/open/feature/`) -- 1 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| feature-027 | P2 | open | Migrate edge data model from string[] to structured objects |

### UX Tickets (`tickets/open/ux/`) -- 8 open
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

### Refactoring Tickets (`tickets/open/refactoring/`) -- 30 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-145 | P3 | open | Extract duplicated heavily injured penalty block into shared server utility |
| refactoring-099 | P4 | open | Extract XP actions from encounter.ts store (806 lines) |
| refactoring-100 | P4 | open | Reset badlyPoisonedRound on faint in applyDamageToEntity |
| refactoring-101 | P4 | open | Deduplicate type-badge SCSS across evolution components |
| refactoring-102 | P4 | open | Extract EvolutionSelectionModal from duplicated branching evolution UI |
| refactoring-103 | P4 | open | damage.post.ts uses species instead of nickname for defeated enemy tracking |
| refactoring-104 | P4 | open | useCharacterCreation.ts has inline rank progression arrays instead of shared constant |
| refactoring-107 | P4 | open | Extract duplicated SCSS from level-up P1 components |
| refactoring-109 | P4 | open | Tighten MoveDetail interface types in MoveLearningPanel |
| refactoring-110 | P4 | open | Hide Level 40 ability button when Level 20 milestone incomplete |
| refactoring-115 | P4 | open | switching.service.ts exceeds 800-line limit (now 927 lines) |
| refactoring-116 | P4 | open | XpDistributionModal.vue exceeds 800-line file limit (1016 lines) |
| refactoring-118 | P4 | open | Remove unused flankingMap destructure in GridCanvas.vue |
| refactoring-119 | P4 | open | Update stale interrupt.post.ts file header comment |
| refactoring-121 | P4 | open | Add flanking_update to WebSocketEvent union type |
| refactoring-123 | P4 | open | Fix distanceMoved to use actual moved value in intercept failure paths |
| refactoring-124 | P4 | open | Replace hardcoded speed=20 in InterceptPrompt.vue |
| refactoring-126 | P4 | open | Pokemon PUT/POST endpoints wrap all errors in statusCode 500 |
| refactoring-130 | P4 | open | Environment preset clearing stores '{}' instead of null in database |
| refactoring-132 | P4 | open | Add type-narrowing helper for Combatant entity access |
| refactoring-136 | P4 | open | Remove dead enterBetweenTurns/exitBetweenTurns exports from useEncounterOutOfTurn |
| refactoring-137 | P4 | open | toggleVisionCapability uses direct getHistory() instead of delegated captureSnapshot |
| refactoring-138 | P4 | open | Remaining entity mutation sites in aoo-resolve, breather, healing-item, living-weapon |
| refactoring-140 | P4 | open | Update stale 'mutates entity' comment in damage.post.ts |
| refactoring-141 | P4 | open | Remove redundant useAction('standard') call for Sprint and Breather |
| refactoring-142 | P4 | open | Add unit tests for computeEquipmentBonuses including conditionalSpeedPenalties |
| refactoring-143 | P4 | open | Add unit tests for checkRecallReleasePair including isFaintedSwitch path |
| refactoring-144 | P4 | open | Update decree-001 citation comments in weather tick minimum floor |
| refactoring-146 | P4 | open | breather.post.ts clears volatile conditions without filtering conditionInstances |
| refactoring-147 | P4 | open | next-turn.post.ts adds Dead from HI penalty without updating conditionInstances |

### Docs Tickets (`tickets/open/docs/`) -- 1 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| docs-017 | P4 | open | bug-047 resolution log has stale commit hashes and missing affected_files |

### Decree-Need Tickets (`tickets/open/decree/`) -- 0 open

All decree-needs addressed (decree-need-053 resolved by decree-054).

### In-Progress Tickets -- 5
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-156 | P2 | **in-progress** | Terrain/weather recall clearing + send-out re-apply (6 commits, needs review) |
| feature-026 | P2 | **in-progress** | Auto-parse [+Stat] feature tags -- design spec written, needs review |
| ptu-rule-152 | P3 | **in-progress** | Natural weather vs game Weather Conditions distinction (5 commits, needs review) |
| bug-061 | P3 | **in-progress** | AP drain injury healing validation (3 commits, needs review) |
| bug-068 | P3 | **in-progress** | densityMultiplier export/import round-trip (4 commits, needs review) |

## Active Developer Work

**Current status:** Session 125 full collection complete. 7/7 slaves merged. 2 APPROVED re-reviews (bug-057, bug-058 resolved), 5 dev implementations.

**Last session (125, 2026-03-06, plan-1772814666):**
- slave-1 (reviewers): bug-057 -- APPROVED (code-review-362). All 3 D2 issues resolved. Bug resolved.
- slave-2 (reviewers): bug-058 -- APPROVED (code-review-363). All 3 D2 issues resolved. Bug resolved.
- slave-3 (dev): ptu-rule-156 -- 6 commits. Set terrain/weather clearsOnRecall=true, added send-out re-apply hook wired into switch/release/combatants endpoints.
- slave-4 (dev): feature-026 -- 2 commits. Full design spec at artifacts/designs/design-stat-feature-tags-026/ (P0+P1 tiers).
- slave-5 (dev): bug-061 -- 3 commits. AP >= 2 validation on server, disabled drain button when AP < 2 on frontend.
- slave-6 (dev): bug-068 -- 4 commits. Added densityMultiplier to export serialization, restore on import, 232-line integration test.
- slave-7 (dev): ptu-rule-152 -- 5 commits. Stopped copying scene weather to encounter, clarified UI labels, added weatherRules.ts docs.

**Session 124 (2026-03-06, plan-1772810718):**
- slave-1 (reviewers): bug-056 -- APPROVED (code-review-358, rules-review-318). D2 fixes verified correct.
- slave-2 (reviewers): ptu-rule-151 -- APPROVED (code-review-359, rules-review-319). D2 fixes verified correct. ptu-rule-157 confirmed resolved.
- slave-3 (dev): bug-057 -- 4 commits. D2 fix: moved validation before try block (C1), added 9 unit tests for validateTrainerLevel (H1), updated app-surface.md (M1).
- slave-4 (dev): bug-058+ptu-rule-150 -- 4 commits. D2 fix: reset lossType selector (H2), centralized HpReductionType to ~/types/combat.ts (H1), added 21 calculateDamage lossType tests (M2).
- slave-5 (reviewers): bug-060 -- APPROVED (code-review-360, rules-review-321). D2 fixes verified correct.
- slave-6 (reviewers): refactoring-129 -- APPROVED (code-review-361, rules-review-320). All CRIT/HIGH/MED fixes verified. 2 out-of-scope desyncs filed as refactoring-146/147.

**Session 123 (2026-03-06, plan-1772804713):**
- slave-1 (dev): bug-056 -- 4 commits. D2 fix: passed fromLevel to LevelUpSummary (HIGH-001), flex-wrap milestone row (MED-001), memoized QuestXpDialog preview (MED-002).
- slave-2 (dev): ptu-rule-151 -- 4 commits. D2 fix: added heavily injured penalty to standard switch (H1), awaited actor penalty DB sync in move.post.ts (H2), updated refactoring-145.
- slave-3 (dev): bug-060 -- 3 commits. D2 fix: added density fallback tests (H1), fixed modal dismiss navigation (M1).

## Code Health

| Metric | Value |
|--------|-------|
| Last updated | 2026-03-06 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 0 |
| Open tickets (P2) | 4 |
| Open tickets (P3) | 13 |
| Open tickets (P4) | 40 |
| In-progress tickets | 5 (all dev-complete, needs review) |
| Total open + in-progress | 62 |
| Decree-needs pending | 0 |
| Needing review | ptu-rule-156, feature-026, ptu-rule-152, bug-061, bug-068 |
| Smoke test | PASSED (all 3 views render) |
