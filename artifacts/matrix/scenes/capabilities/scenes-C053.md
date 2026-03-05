---
cap_id: scenes-C053
name: Encounter Budget for Scene Editor
type: composable-function
domain: scenes
---

### scenes-C053
- **name:** Encounter Budget for Scene Editor
- **type:** composable-function
- **location:** `app/pages/gm/scenes/[id].vue` -- budgetInfo computed
- **game_concept:** PTU Encounter Creation Guide difficulty preview
- **description:** Inline computed that calculates encounter difficulty from scene contents. Filters to PC trainers, gathers their Pokemon levels, treats scene wild Pokemon as enemies. Shows in StartEncounterModal.
- **inputs:** Scene characters + allCharacters + allPokemon
- **outputs:** budgetInfo `{ totalBudget, totalEnemyLevels, effectiveEnemyLevels, difficulty }`
- **accessible_from:** gm
