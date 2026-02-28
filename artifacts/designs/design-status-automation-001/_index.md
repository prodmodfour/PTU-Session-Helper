---
design_id: design-status-automation-001
ticket_id: feature-010
category: FEATURE
scope: FULL
domain: combat
status: p0-implemented
decrees:
  - decree-005
  - decree-012
affected_files:
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/status.post.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/services/combatant.service.ts
  - app/server/services/entity-update.service.ts
  - app/types/encounter.ts
  - app/constants/statusConditions.ts
  - app/stores/encounter.ts
new_files:
  - app/server/services/status-automation.service.ts
  - app/server/api/encounters/[id]/save-check.post.ts
  - app/components/encounter/SaveCheckBanner.vue
  - app/components/encounter/SaveCheckResult.vue
  - app/composables/useStatusAbilityWarning.ts
---

# Design: Status Condition Automation Engine

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Tick Damage (Burn/Poison/Badly Poisoned/Cursed), B. Badly Poisoned Escalation Tracking, C. Turn-End Processing in next-turn.post.ts | [spec-p0.md](spec-p0.md) |
| P1 | D. Save Check Endpoint, E. Frozen/Paralysis/Sleep/Confused Evaluation, F. Confused Self-Hit, G. Bad Sleep Tick, H. Save Check UI Components | [spec-p1.md](spec-p1.md) |
| P2 | I. Fire Thaw Auto-Cure, J. Wake on Damage Auto-Cure, K. Bad Sleep Cascade Cleanup, L. Weather Constants, M. Ability Interaction Reference | [spec-p2.md](spec-p2.md) |

## Summary

Automate the mechanical effects of PTU status conditions that are currently tracked as labels but require manual GM tracking for HP loss, save checks, and turn restrictions. This is the highest-impact gap in combat automation — 6 matrix rules (R088-R094) classified as Partial.

**What is already implemented** (NOT in scope):
- CS auto-apply: Burn -2 Def, Paralysis -4 Speed, Poison/Badly Poisoned -2 SpDef (ptu-rule-098, decree-005)
- Type immunities: Fire immune to Burn, Electric to Paralysis, etc. (ptu-rule-104, decree-012)
- Zero evasion: Frozen/Asleep/Vulnerable set evasion to 0 (ptu-rule-084)
- Status condition display in UI

**What this design adds:**
- **P0:** Automatic tick damage at turn end (Burn: 1 tick, Poison: 1 tick, Badly Poisoned: escalating, Cursed: 2 ticks)
- **P1:** Save check mechanics (Paralysis DC 5, Confused multi-threshold, Frozen DC 16, Sleep DC 16, Infatuated, Enraged)
- **P2:** Auto-cure triggers (fire thaw, wake on damage), weather save modifiers, ability interaction reference

---

## PTU Rules Reference

### Status Conditions (PTU Core p.246-248)

Each status condition has multiple mechanical effects. The existing implementation handles CS effects and evasion. This design covers the remaining mechanics:

| Condition | CS Effect | Evasion | Tick Damage | Save Check | Auto-Cure |
|-----------|-----------|---------|-------------|------------|-----------|
| Burned | -2 Def (done) | — | 1 tick/turn (P0) | — | — |
| Frozen | — | 0 (done) | — | DC 16 end-of-turn (P1) | Fire/Fight/Rock/Steel hit (P2) |
| Paralyzed | -4 Speed (done) | — | — | DC 5 start-of-turn (P1) | — |
| Poisoned | -2 SpDef (done) | — | 1 tick/turn (P0) | — | — |
| Badly Poisoned | -2 SpDef (done) | — | 5 HP escalating (P0) | — | — |
| Asleep | — | 0 (done) | — | DC 16 end-of-turn (P1) | Attack damage (P2) |
| Bad Sleep | — | — | 2 ticks on save (P1) | — | Sleep cured (P2) |
| Confused | — | — | Self-hit on fail (P1) | Multi-threshold start (P1) | — |
| Cursed | — | — | 2 ticks/turn (P0) | — | — |
| Infatuated | — | — | — | Multi-threshold start (P1) | — |
| Enraged | — | — | — | DC 15 end-of-turn (P1) | — |

### Decree Compliance

- **decree-005:** CS tracking with source remains untouched. Tick damage does not affect combat stages.
- **decree-012:** Type immunity checked at status application time. Tick damage fires regardless of type (the status is already applied).

---

## Priority Map

| # | Mechanic | Current Status | Gap | Priority |
|---|----------|---------------|-----|----------|
| A | Burn tick damage (1/10 maxHp) | NOT_IMPLEMENTED | Manual tracking | **P0** |
| B | Poison tick damage (1/10 maxHp) | NOT_IMPLEMENTED | Manual tracking | **P0** |
| C | Badly Poisoned escalation (5, 10, 20, 40...) | NOT_IMPLEMENTED | No tracking field or damage | **P0** |
| D | Cursed tick damage (2/10 maxHp) | NOT_IMPLEMENTED | Manual tracking | **P0** |
| E | Frozen save check (DC 16, DC 11 Fire) | NOT_IMPLEMENTED | Manual d20 roll | **P1** |
| F | Paralysis save check (DC 5) | NOT_IMPLEMENTED | Manual d20 roll | **P1** |
| G | Sleep save check (DC 16) | NOT_IMPLEMENTED | Manual d20 roll | **P1** |
| H | Confused save check (multi-threshold) | NOT_IMPLEMENTED | Manual d20 roll | **P1** |
| I | Confused self-hit (DB 6 Struggle, 0.5x) | NOT_IMPLEMENTED | Manual damage calc | **P1** |
| J | Bad Sleep tick (2 ticks per save) | NOT_IMPLEMENTED | Manual tracking | **P1** |
| K | Fire thaw (Fire/Fighting/Rock/Steel cures Frozen) | NOT_IMPLEMENTED | Manual condition removal | **P2** |
| L | Wake on damage (attack damage cures Sleep) | NOT_IMPLEMENTED | Manual condition removal | **P2** |
| M | Bad Sleep cascade (Sleep cure -> Bad Sleep cure) | NOT_IMPLEMENTED | Manual tracking | **P2** |
| N | Weather save modifiers (Sunny +4, Hail -2 for Frozen) | NOT_IMPLEMENTED | Manual DC adjustment | **P2** |
| O | Ability interaction reference (Guts, Marvel Scale, etc.) | NOT_IMPLEMENTED | No visibility | **P2** |

---

## Architecture Overview

```
status-automation.service.ts (NEW)
├── calculateTickDamage(maxHp)           -- Pure: floor(maxHp/10), min 1
├── calculateBadlyPoisonedDamage(round)  -- Pure: 5 * 2^(round-1)
├── getTickDamageEntries(combatant, standardActionTaken) -- Which ticks fire
├── evaluateSaveCheck(combatant, condition, weather)     -- Roll + evaluate
├── calculateConfusedSelfHit(combatant)  -- DB 6 Struggle, 0.5x
└── getPendingSaveChecks(combatant, timing)  -- Which saves are needed

next-turn.post.ts (MODIFIED)
├── Existing: mark acted, clear temps, advance turn index
├── NEW: call getTickDamageEntries() for outgoing combatant
├── NEW: apply tick damage via calculateDamage()
├── NEW: process end-of-turn saves (Frozen, Sleep, Enraged)
├── NEW: log tick damage + saves to moveLog
└── NEW: broadcast status_tick + save_check events

save-check.post.ts (NEW)
├── Validate combatant has condition
├── Call evaluateSaveCheck()
├── Apply effects (cure, restrict, self-hit damage)
└── Return result + updated encounter

statusConditions.ts (MODIFIED)
├── Existing: CS effects, zero evasion, condition classes
├── NEW: TICK_DAMAGE_CONDITIONS
├── NEW: SAVE_CHECK_CONDITIONS
├── NEW: FROZEN_THAW_TYPES
├── NEW: WEATHER_SAVE_MODIFIERS
└── NEW: STATUS_INTERACTION_ABILITIES
```

---

## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
