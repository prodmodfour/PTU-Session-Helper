---
ticket_id: refactoring-096
title: Harmonize tag color styling between character detail and classes tab
severity: LOW
priority: P4
domain: character-lifecycle
source: code-review-215 MED-03
created_by: slave-collector (plan-20260228-072000)
status: open
---

## Summary

Tag styles (`.tag--class`, `.tag--feature`, `.tag--edge`, `.tag--capability`) are duplicated with inconsistent colors between two components:

- `app/pages/gm/characters/[id].vue` uses `rgba($color-accent-scarlet, 0.2)` for features, `rgba($color-info, 0.2)` for edges
- `app/components/character/tabs/HumanClassesTab.vue` uses `rgba($color-accent-teal, 0.15)` for features, `rgba($color-warning, 0.15)` for edges

The `--capability` variant is consistent (both use `$color-success`), but other tag colors diverge.

## Affected Files

- `app/pages/gm/characters/[id].vue` (lines 617-641)
- `app/components/character/tabs/HumanClassesTab.vue` (lines 69-98)

## Suggested Fix

1. Extract shared tag styles to a SCSS partial (e.g., `_tags.scss`) or a shared component
2. Use a single consistent color scheme for all tag variants
3. Ensure `border-color` is consistently applied (currently missing on `--capability` in `[id].vue`)

## Impact

Low — cosmetic inconsistency. Users see different colors for the same tag type depending on which view they're in.
