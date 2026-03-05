---
decree_id: decree-051
status: active
domain: character-lifecycle
topic: auto-parse-stat-feature-tags
title: "Auto-parse [+Stat] feature tags and apply stat bonuses automatically"
ruled_at: 2026-03-05T12:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-050
implementation_tickets:
  - feature-026
tags: [character-lifecycle, features, stat-bonus, auto-parse, trainer-stats]
---

# decree-051: Auto-parse [+Stat] feature tags and apply stat bonuses automatically

## The Ambiguity

Some PTU features include `[+Stat]` tags (e.g., `[+Attack]`) in their text that grant stat bonuses when the feature is taken. The question arose whether the app should automatically detect and apply these bonuses, or leave it as a manual GM/player responsibility. Surfaced by character-lifecycle-audit.md (session 121, R033), filed as decree-need-050.

## Options Considered

### Option A: Auto-parse
App reads feature text, detects `[+Stat]` patterns (e.g., `[+Attack]`, `[+Special Defense]`), and applies the corresponding stat bonuses automatically to the character sheet.

**Pros:** Most convenient for users. Eliminates a common source of bookkeeping errors. Stat totals are always accurate.
**Cons:** Requires robust parsing of feature text. Edge cases in feature wording could cause mis-parses.

### Option B: Manual only
Features are stored as raw strings. Stat bonuses are tracked and applied manually by the GM or player.

**Pros:** Simplest implementation. No parsing risk.
**Cons:** Error-prone. Easy to forget a bonus, leading to inaccurate character sheets.

### Option C: Hybrid (flag + confirm)
App detects `[+Stat]` tags and surfaces them in the UI, but requires user confirmation before applying.

**Pros:** Catches errors while keeping human in the loop.
**Cons:** Extra clicks for a routine operation. Most confirmations would be rubber-stamped.

## Ruling

**The true master decrees: the app shall auto-parse `[+Stat]` tags in feature text and apply stat bonuses automatically.**

When a trainer feature is added that contains `[+Stat]` patterns, the app should detect the pattern and automatically add the corresponding stat bonus to the character's stat calculations. This eliminates manual bookkeeping and ensures stat totals are always accurate.

## Precedent

When PTU feature text contains machine-parseable mechanical effects (like stat bonuses), the app should auto-detect and apply them rather than relying on manual tracking. Automation of routine bookkeeping is preferred over manual processes.

## Implementation Impact

- Tickets created: feature-026
- Files affected: Feature parsing utilities, stat calculation composables/services, character sheet components
- Skills affected: Developer, senior-reviewer, game-logic-reviewer (must validate parsing accuracy against PTU feature text)
