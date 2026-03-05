---
last_updated: 2026-03-05T23:10:00
updated_by: orchestrator-survey
---

# Dev Ecosystem State

> **Pruning policy:** Only open/in-progress tickets appear here. Resolved tickets live in `tickets/resolved/`. Only the last 3 sessions are kept; older sessions are dropped (review artifacts in `reviews/archive/` preserve full history).

## Open Tickets

### Bug Tickets (`tickets/open/bug/`) — 13 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| bug-056 | P1 | open | Character auto-level past milestone skips milestone grants |
| bug-064 | P1 | open | Character detail page fails — SCSS $spacing-xs undefined |
| bug-065 | P1 | open | Encounter tables page HTTP 500 — missing upload-simple.svg |
| bug-066 | P1 | open | Encounter table editor name mismatch (EncounterTableTableEditor) |
| bug-057 | P2 | open | Character POST/PUT missing max stat enforcement |
| bug-058 | P2 | open | No distinction between HP loss and damage for Belly Drum etc |
| bug-060 | P2 | open | Encounter table export/import loses density significance |
| bug-062 | P2 | open | resetSceneUsage() exists but scene-frequency move counts not cleared |
| bug-063 | P2 | open | Slowed speed floor applied after condition instead of before |
| bug-067 | P2 | open | PlayerPokemonCard expansion crash |
| bug-059 | P3 | open | Math.trunc vs Math.floor in movementModifier |
| bug-061 | P3 | open | AP drain injury healing missing validation |
| bug-052 | P4 | open | PlayerCharacterSheet.vue uses bare tag class instead of tag--feature variant |

### PTU Rule Tickets (`tickets/open/ptu-rule/`) — 15 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| ptu-rule-151 | P1 | open | Heavily Injured trigger on 50%+ single-hit missing |
| ptu-rule-147 | P2 | open | No per-effect duration tracking for combat stages |
| ptu-rule-149 | P2 | open | VTT allows free token repositioning without movement enforcement |
| ptu-rule-150 | P2 | open | No "set HP" vs "lose HP" flag for direct HP modification |
| ptu-rule-155 | P2 | open | Player-view R156-R160 implementation gaps |
| ptu-rule-143 | P3 | open | Sprint should not consume Shift Action (decree-050) |
| ptu-rule-144 | P3 | open | Amateur milestone lifestyle stat points missing |
| ptu-rule-145 | P3 | open | Level 30/40 milestones missing bonus edges/features |
| ptu-rule-146 | P3 | open | App defaults to set damage instead of rolled damage |
| ptu-rule-148 | P3 | open | Pokemon released mid-round after initiative passed |
| ptu-rule-152 | P3 | open | No distinction between natural and move-created weather |
| ptu-rule-153 | P3 | open | Nature Walk terrain bypass utility incomplete |
| ptu-rule-154 | P3 | open | Hazard terrain has no mechanical effect |
| ptu-rule-141 | P4 | open | Gas Mask uses fabricated capability name in grantedCapabilities |
| ptu-rule-142 | P4 | open | Implement Permafrost Burn/Poison status tick damage reduction |

### Feature Tickets (`tickets/open/feature/`) — 2 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| feature-026 | P2 | open | Auto-parse [+Stat] feature tags for stat bonuses |
| feature-027 | P2 | open | Migrate edge data model from string[] to structured objects |

### UX Tickets (`tickets/open/ux/`) — 8 open
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

### Refactoring Tickets (`tickets/open/refactoring/`) — 27 open
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
| refactoring-115 | P4 | open | switching.service.ts exceeds 800-line limit (now 839 lines) |
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

### Docs Tickets (`tickets/open/docs/`) — 1 open
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| docs-017 | P4 | open | bug-047 resolution log has stale commit hashes and missing affected_files |

### Decree-Need Tickets (`tickets/open/decree/`)
*(All decree-needs resolved)*

### In-Progress Tickets — 1
| Ticket | Priority | Status | Summary |
|--------|----------|--------|---------|
| refactoring-129 | P3 | **in-progress** | Condition source-tracking — implemented (P0+P1 complete), needs code+rules review |

## Active Developer Work

**Current status:** Session 120 collection complete. No active slaves.

**Last session (120, 2026-03-05, plan-1772711294):**
- slave-1 (dev): refactoring-129 — 15 commits. Full condition source-tracking implementation (P0+P1): ConditionSourceType/ConditionInstance types, conditionSourceRules.ts, source-aware faint/recall/encounter-end clearing, GM view source labels, Dead/Fainted instance tracking.
- slave-2–9 (matrix): Re-mapped 8 domains (combat, character-lifecycle, encounter-tables, pokemon-lifecycle, vtt-grid, healing, scenes, capture).
- slave-10–14 (review): ptu-rule-121 **APPROVED**, ptu-rule-125 **APPROVED**, ptu-rule-126 **PASS**, ptu-rule-130 **APPROVED**, ptu-rule-133 **APPROVED**. All 5 tickets resolved.

**Session 119 (2026-03-05, plan-1772707228):**
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

## Code Health

| Metric | Value |
|--------|-------|
| Last updated | 2026-03-05 |
| Open tickets (P0) | 0 |
| Open tickets (P1) | 5 |
| Open tickets (P2) | 12 |
| Open tickets (P3) | 10 |
| Open tickets (P4) | 39 |
| In-progress tickets | 1 (refactoring-129) |
| Total open + in-progress | 67 |
| Decree-needs pending | 0 |
| Needing review | refactoring-129 |
| Resolved this session | ptu-rule-121, ptu-rule-125, ptu-rule-126, ptu-rule-130, ptu-rule-133 |
