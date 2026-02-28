---
id: feature-023
title: Player Capture & Healing Interfaces
priority: P2
severity: MEDIUM
status: open
domain: player-view+capture+healing
source: matrix-gap (GAP-CAP-1 + GAP-HEAL-1)
matrix_source: capture R004, R027, R032, healing R018, R019, R024
created_by: master-planner
created_at: 2026-02-28
---

# feature-023: Player Capture & Healing Interfaces

## Summary

Capture and healing features are implemented for GM view but unreachable from player view. Players cannot throw Poke Balls, use healing items, or trigger Take a Breather from their interface. 6 matrix rules classified as Implemented-Unreachable.

## Gap Analysis

| Rule | Title | Domain | Status |
|------|-------|--------|--------|
| R004 | Throwing Accuracy Check | capture | Impl-Unreachable — GM-only |
| R027 | Capture Workflow | capture | Impl-Unreachable — GM-only |
| R032 | Capture Is Standard Action | capture | Impl-Unreachable — GM-only |
| R018 | Take a Breather — Core Effects | healing | Impl-Unreachable — GM-only |
| R019 | Take a Breather — Action Cost | healing | Impl-Unreachable — GM-only |
| R024 | Trainer AP Drain for Injury | healing | Impl-Unreachable — GM-only |

## Implementation Scope

FULL-scope feature requiring design spec. Extends the player view system (feature-003). Needs player action submission → GM approval workflow via WebSocket.

## Related Tickets

- feature-003 (all tracks complete): Player View core infrastructure
- feature-016 (P2): AoO system — player actions need interrupt awareness
