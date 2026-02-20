---
ticket_id: refactoring-047
priority: P2
status: open
category: EXT-DUPLICATE
source: code-review-076
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

~200 lines of SCSS duplicated across the 6 extracted Pokemon sheet components (`fadeIn`, `rollIn`, `roll-result`, `empty-state`, `info-section`, `tab-content`, `type-badge` styles).

## Affected Files

- `app/components/pokemon/PokemonStatsTab.vue`
- `app/components/pokemon/PokemonMovesTab.vue`
- `app/components/pokemon/PokemonSkillsTab.vue`
- `app/components/pokemon/PokemonEditForm.vue`
- `app/components/pokemon/PokemonLevelUpPanel.vue`
- `app/components/pokemon/PokemonCapabilitiesTab.vue`

## Suggested Refactoring

Extract shared styles into `app/assets/scss/_pokemon-sheet.scss` partial and import in each component.
