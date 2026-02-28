---
id: feature-017
title: Poke Ball Type System
priority: P2
severity: MEDIUM
status: open
domain: capture
source: matrix-gap (GAP-CAP-2)
matrix_source: capture R020, R021, R022, R023, R024, R025, R026
created_by: master-planner
created_at: 2026-02-28
---

# feature-017: Poke Ball Type System

## Summary

No Poke Ball type system exists. The capture rate endpoint uses a flat base rate with no ball-specific modifiers. PTU defines 25+ ball types each with unique capture rate modifiers, conditional bonuses, and post-capture effects. 7 matrix rules classified as Missing.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R020 | Poke Ball Type Modifiers | Missing — no ball catalog, no auto-modifiers |
| R021 | Level Ball Condition | Missing — bonus when user level > target level |
| R022 | Love Ball Condition | Missing — bonus for same species different gender |
| R023 | Timer Ball Scaling | Missing — bonus increases with round count |
| R024 | Quick Ball Decay | Missing — large bonus round 1, decreasing |
| R025 | Heavy Ball Scaling | Missing — bonus/penalty based on weight |
| R026 | Heal Ball Post-Capture Effect | Missing — full heal on capture |

## PTU Rules

- Chapter 9: Poke Ball catalog with modifiers
- Each ball type has: base modifier, conditional bonus, post-capture effect
- Modifier applied to capture rate formula
- Some balls have round-dependent scaling (Timer, Quick)
- Some have conditional checks (Level, Love, Heavy)

## Implementation Scope

FULL-scope feature requiring design spec. Needs ball type catalog, capture rate formula integration, and selection UI.

## Note

ptu-rule-050 (resolved) only removed dead `pokeBallType` code. The actual ball type system was never implemented.
