---
cap_id: scenes-C069
name: QuestXpDialog
type: component
domain: scenes
---

### scenes-C069
- **name:** QuestXpDialog
- **type:** component
- **location:** `app/components/scene/QuestXpDialog.vue`
- **game_concept:** PTU Core p461 -- Trainer XP awards
- **description:** Inline dialog for awarding trainer XP to all scene characters. XP input (1-20), reason field, preview with level-up indicator. Uses applyTrainerXp for preview and useTrainerXp for actual award.
- **inputs:** characters[] (with id, name, level, trainerXp), sceneName
- **outputs:** Events: close, awarded
- **accessible_from:** gm
