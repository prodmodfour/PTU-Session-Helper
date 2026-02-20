---
ticket_id: refactoring-050
priority: P3
status: open
category: UI-CONVENTION
source: code-review-076
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

`PokemonEditForm.vue` line 5 uses `&#9733;` (Unicode star) for the shiny badge instead of a Phosphor Icon, violating the project convention of using Phosphor Icons over emojis/Unicode characters. Also affects `CharacterModal.vue`.

## Affected Files

- `app/components/pokemon/PokemonEditForm.vue`
- `app/components/encounter/CharacterModal.vue`

## Fix

Replace Unicode star character with appropriate Phosphor Icon (e.g., `PhStar` or `PhSparkle`).
