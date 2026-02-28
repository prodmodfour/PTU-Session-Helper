---
cap_id: combat-C070
name: calculateEncounterBudget
type: utility
domain: combat
---

### combat-C070: calculateEncounterBudget
- **cap_id**: combat-C070
- **name**: Level Budget Calculator
- **type**: utility
- **location**: `app/utils/encounterBudget.ts` — `calculateEncounterBudget()`
- **game_concept**: PTU encounter budget guideline (Encounter Creation Guide, Chapter 11)
- **description**: avgLevel * 2 * playerCount.
- **inputs**: BudgetCalcInput
- **outputs**: BudgetCalcResult
- **accessible_from**: gm
