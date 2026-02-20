---
ticket_id: refactoring-043
priority: P2
status: open
category: EXT-GOD
source: code-review-074, code-review-075
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Pokemon detail page (`app/pages/gm/pokemon/[id].vue`) is at 1384 lines, well over the 800-line project limit. Was already at 1242 lines before the level-up info panel addition (+142 lines).

## Affected Files

- `app/pages/gm/pokemon/[id].vue` (1384 lines)

## Suggested Refactoring

Extract tab content into separate components:
1. Stats tab → `PokemonStatsTab.vue`
2. Moves tab → `PokemonMovesTab.vue`
3. Level-up info panel → `PokemonLevelUpPanel.vue`
4. Edit form sections → `PokemonEditForm.vue`

Target: main page file under 400 lines, tab components 200-300 lines each.
