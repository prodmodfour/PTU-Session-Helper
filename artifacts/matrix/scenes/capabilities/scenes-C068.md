---
cap_id: scenes-C068
name: StartEncounterModal
type: component
domain: scenes
---

### scenes-C068
- **name:** StartEncounterModal
- **type:** component
- **location:** `app/components/scene/StartEncounterModal.vue`
- **game_concept:** Scene-to-encounter conversion UI
- **description:** Modal showing entity counts, encounter budget difficulty, battle type selection (Full Contact/Trainer League), and significance tier selection (insignificant through legendary). Confirm disabled if no entities.
- **inputs:** sceneName, pokemonCount, characterCount, budgetInfo?
- **outputs:** Events: close, confirm({ battleType, significanceMultiplier, significanceTier })
- **accessible_from:** gm
