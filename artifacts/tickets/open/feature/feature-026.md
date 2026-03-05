---
id: feature-026
title: "Auto-parse [+Stat] feature tags and apply stat bonuses"
priority: P2
severity: MEDIUM
status: open
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
