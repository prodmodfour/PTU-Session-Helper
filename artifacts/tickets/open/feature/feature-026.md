---
id: feature-026
title: "Auto-parse [+Stat] feature tags and apply stat bonuses"
priority: P2
severity: MEDIUM
status: in-progress
domain: character-lifecycle
source: decree-051
created_by: decree-facilitator
created_at: 2026-03-05
affected_files: []
---

## Summary

Implement automatic parsing of `[+Stat]` tags in PTU feature text (e.g., `[+Attack]`, `[+Special Defense]`) and apply the corresponding stat bonuses to trainer stat calculations.

## Required Implementation

1. Create a utility/parser that detects `[+Stat]` patterns in feature description text
2. When a trainer gains a feature containing `[+Stat]` tags, automatically add the stat bonus to the character's stat calculations
3. Stat bonuses from features should be visible in the character sheet breakdown (so the user can see where bonuses come from)
4. Handle edge cases: features with multiple stat bonuses, conditional bonuses, etc.

## Notes

- Per decree-051: automation of routine bookkeeping is preferred over manual processes
- Parse accuracy should be validated against actual PTU feature text in `books/markdown/`
- Consider creating a mapping of known features → stat bonuses as a fallback for features with unusual wording

## Design Spec

Design directory: `artifacts/designs/design-stat-feature-tags-026/`

- `_index.md` — Overview, tier summary, dependencies, implementation order
- `shared-specs.md` — Parser interfaces, FEATURE_STAT_MAP (100+ features), STAT_TAG_MAP, priority chain
- `spec-p0.md` — P0: Pure parser utility + stat calculation integration (creation, level-up, server API)
- `spec-p1.md` — P1: UI stat bonus source display in character sheets and creation/level-up flows
- `testing-strategy.md` — 8 test categories with 25+ test cases, manual test scenarios, PTU example validation

## Resolution Log

| Commit | Description | Files |
|--------|-------------|-------|
| `aaab92a0` | Design spec for feature-026 | 5 new files in `artifacts/designs/design-stat-feature-tags-026/` |
