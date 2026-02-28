---
id: feature-016
title: Priority / Interrupt / Attack of Opportunity System
priority: P2
severity: MEDIUM
status: open
domain: combat+vtt-grid
source: matrix-gap (combat Gap 2 + VTT SG-5)
matrix_source: combat R040, R046, R047, R048, R110, R116, R117, vtt-grid R031
created_by: master-planner
created_at: 2026-02-28
---

# feature-016: Priority / Interrupt / Attack of Opportunity System

## Summary

No mechanism for out-of-turn actions. PTU has three categories: Priority (act before initiative), Interrupt (act during another's turn), and Attack of Opportunity (triggered by specific actions). The app has AoO and Intercept entries in `COMBAT_MANEUVERS` but no trigger detection, interrupt flow, or out-of-turn action resolution. 8 matrix rules across combat and vtt-grid.

## Gap Analysis

| Rule | Title | Domain | Status |
|------|-------|--------|--------|
| R040 | Initiative — Holding Action | combat | Missing — no hold-action mechanism |
| R046 | Priority Action Rules | combat | Missing — no Priority action system |
| R047 | Priority Limited/Advanced Variants | combat | Missing — depends on R046 |
| R048 | Interrupt Actions | combat | Missing — no Interrupt mechanism |
| R110 | Attack of Opportunity | combat | Partial — constant exists, no trigger detection |
| R116 | Intercept Melee | combat | Impl-Unreachable — in constant, no interrupt flow |
| R117 | Intercept Ranged | combat | Impl-Unreachable — in constant, no interrupt flow |
| R031 | AoO Movement Trigger | vtt-grid | Missing — no alert when moving from adjacent enemy |

## PTU Rules

- Chapter 7: Priority, Interrupt, and AoO rules
- Priority: declare before initiative, resolve first (1/round)
- Interrupt: act during another's turn in response to trigger (1/round)
- AoO triggers: adjacent foe shifts away, uses ranged attack, stands up, uses maneuver not targeting you, retrieves item
- Disengage maneuver: shift 1m without provoking AoO
- Intercept: melee (free redirect of attack) or ranged (block attack aimed at ally)

## Implementation Scope

FULL-scope feature requiring design spec. This is a fundamental combat system change affecting turn flow.

## Related Tickets

- ptu-rule-095 (P4, open): Disengage maneuver — explicitly deferred until AoO is implemented
