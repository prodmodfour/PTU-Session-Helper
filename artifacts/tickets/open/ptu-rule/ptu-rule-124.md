---
id: ptu-rule-124
title: "Replace bogus encounter budget formula with PTU-sourced guidance"
priority: P4
severity: LOW
category: ptu-rule
source: decree-031
created_at: 2026-02-28
status: open
---

## Summary

The encounter budget uses `avgPokemonLevel * 2 * playerCount` citing "Core p.473" which does not exist in PTU 1.05. Per decree-031, replace with PTU-sourced encounter design guidance from Chapter 11.

## Requirements

1. Research PTU Chapter 11 (Running the Game) in `books/markdown/core/11-running-the-game.md` for encounter balancing guidance
2. Find the current encounter budget formula in the codebase
3. Remove the false "Core p.473" citation immediately
4. Replace the formula with guidance derived from actual PTU encounter design principles
5. If PTU provides no concrete formula, implement a heuristic clearly labeled as app-specific (no PTU claim)
6. Update any UI that shows "recommended budget" or "level budget"
7. Update related tests

## PTU Reference

- PTU Core Chapter 11: encounter design guidance
- PTU Core p.460: significance and XP (related)
- "Core p.473" — does NOT exist, must be removed
- decree-031: replace with PTU-sourced guidance

## Affected Code

- Encounter budget calculation (find via searching for the formula or "p.473")
- Encounter table / template UI showing budget recommendations
