---
ticket_id: decree-need-041
category: decree-need
severity: MEDIUM
priority: P3
domain: capture
title: "Do Accuracy/Evasion modifiers apply to Poke Ball throws?"
source: code-review-281 M2 + rules-review-257 observation
created_by: slave-collector (plan-20260302-150500)
created_at: 2026-03-02
blocks: ptu-rule-131
---

## Ambiguity

PTU p.214 describes Poke Ball throws as an "AC6 Status Attack Roll." PTU p.236 says accuracy rolls are "modified by the user's Accuracy and by certain Moves and other effects." However, PTU p.234 says "Evasion helps Pokemon avoid being hit by **moves**" — and Poke Ball throws are item usage, not Moves.

**The question:** When a Trainer throws a Poke Ball, should the d20 roll be compared against a flat AC 6, or should the threshold be modified by:
1. The thrower's Accuracy combat stages (if any)?
2. The target Pokemon's Speed Evasion?
3. Flanking penalties on the target?
4. Rough terrain penalties?

## Arguments For Flat Check (AC 6 only)

- Poke Ball throws are explicitly "item usage as a Standard Action", not a Move
- PTU evasion text specifically says "avoid being hit by **moves**"
- Community convention widely treats Poke Ball AC 6 as a flat check
- Trainers don't normally have Accuracy combat stages (those are Pokemon stats)
- Simpler to adjudicate at the table

## Arguments For Applying Modifiers

- PTU calls it a "Status Attack Roll" — the word "Attack Roll" implies the full accuracy system
- PTU p.236 says accuracy rolls are modified by "the user's Accuracy" (general rule)
- Some Trainer Features (e.g., Ace Trainer abilities) explicitly modify "attack rolls"
- Consistency: all d20 accuracy checks in the system should work the same way

## Current Implementation

Flat check: `roll >= 6` with nat 1/nat 20 handling. No modifiers applied.

## Impact of Ruling

- **Flat check:** ptu-rule-131 becomes a small refactor (use `calculateAccuracyThreshold(6, 0, 0)` for consistency, no behavioral change)
- **Apply modifiers:** ptu-rule-131 becomes a functional change (pass real accuracy/evasion values, update server validation, may affect capture success rates in edge cases)
