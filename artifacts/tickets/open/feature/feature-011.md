---
id: feature-011
title: Pokemon Switching Workflow
priority: P1
severity: HIGH
status: open
domain: combat
source: matrix-gap (Gap 3)
matrix_source: combat R049, R050, R051, R052, R053
created_by: master-planner
created_at: 2026-02-28
---

# feature-011: Pokemon Switching Workflow

## Summary

No formal Pokemon switching workflow exists. GM can add/remove combatants manually, but there is no Standard Action switch with range check, no League Battle switch restrictions, and no recall/release as separate actions. 5 matrix rules (2 Partial, 3 Missing).

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R049 | Full Switch — Standard Action | Partial — GM can add/remove, no 8m range check or action enforcement |
| R050 | League Switch Restriction | Missing — switched Pokemon cannot act rest of round |
| R051 | Fainted Switch — Shift Action | Partial — can replace fainted, no enforcement as Shift Action |
| R052 | Recall and Release as Separate Actions | Missing — no separate recall/release tracked |
| R053 | Released Pokemon Can Act Immediately | Missing — no immediate-act logic for newly released |

## PTU Rules

- Chapter 7: Pokemon switching rules
- Standard Action to switch: recall current + release new within 8m
- League mode: switched Pokemon cannot act rest of round
- Fainted switch: Shift Action (free, but uses shift)
- Release without recall: free action, released Pokemon acts immediately if before its turn

## Implementation Scope

FULL-scope feature requiring design spec. Interacts with encounter store, initiative system, and VTT grid.
