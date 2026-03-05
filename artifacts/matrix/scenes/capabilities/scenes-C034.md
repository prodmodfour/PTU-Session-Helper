---
cap_id: scenes-C034
name: Apply Trainer XP
type: utility
domain: scenes
---

### scenes-C034
- **name:** Apply Trainer XP
- **type:** utility
- **location:** `app/utils/trainerExperience.ts` -- applyTrainerXp()
- **game_concept:** PTU Core p461 -- Trainer Experience Bank
- **description:** Calculates result of adding XP to trainer's experience bank. Auto-levels at 10 XP. Used by QuestXpDialog for level-up preview.
- **inputs:** `{ currentXp, currentLevel, xpToAdd }`
- **outputs:** `{ newXp, newLevel, levelsGained }`
- **accessible_from:** gm
