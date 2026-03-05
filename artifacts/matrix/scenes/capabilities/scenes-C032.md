---
cap_id: scenes-C032
name: Encounter Budget Analysis
type: utility
domain: scenes
---

### scenes-C032
- **name:** Encounter Budget Analysis
- **type:** utility
- **location:** `app/utils/encounterBudget.ts` -- analyzeEncounterBudget()
- **game_concept:** PTU Encounter Creation Guide -- difficulty estimation
- **description:** Analyzes encounter difficulty based on party level, player count, and enemy levels. Returns budget and difficulty rating (trivial/easy/balanced/hard/deadly).
- **inputs:** `{ averagePokemonLevel, playerCount }`, enemies `[{ level, isTrainer }]`
- **outputs:** BudgetAnalysis with difficulty rating
- **accessible_from:** gm
