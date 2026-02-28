---
id: feature-012
title: Death & Heavily Injured Automation
priority: P1
severity: HIGH
status: open
domain: combat
source: matrix-gap (combat R076, R080, R081 + healing R016, R030)
matrix_source: combat R076, R080, R081, healing R016, R030
created_by: master-planner
created_at: 2026-02-28
---

# feature-012: Death & Heavily Injured Automation

## Summary

The app tracks injury count and HP thresholds visually but does not automate the mechanical consequences. No death check at 10 injuries or extreme negative HP. No heavily injured penalty automation. 5 matrix rules across combat and healing domains.

## Gap Analysis

| Rule | Title | Domain | Status |
|------|-------|--------|--------|
| R076 | Heavily Injured — 5+ Injuries | combat | Partial — visual detection, no auto HP loss on Standard Action or damage taken |
| R080 | Death Conditions | combat | Partial — injury count tracked, no auto death check at 10 injuries or -50%/-200% HP |
| R081 | Death — League Exemption | combat | Partial — League mode tracked, no auto death suppression |
| R016 | Heavily Injured Combat Penalty | healing | Missing — same as combat R076 |
| R030 | Death from 10 Injuries | healing | Missing — same as combat R080 |

## PTU Rules

- Chapter 7: Heavily Injured (5+ injuries) — HP loss equal to injury count on Standard Action or when taking damage
- Death at: 10+ injuries OR current HP <= -50% max HP (Pokemon) / -200% max HP (Trainers)
- League Battles: death rules suppressed, faint at 0 HP instead
- GM can suppress death for narrative reasons

## Implementation Scope

PARTIAL-scope — checks and warnings can be added without a full design spec. Could be implemented as server-side validation + client warnings.
