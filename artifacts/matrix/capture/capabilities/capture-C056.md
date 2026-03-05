---
cap_id: capture-C056
name: BallConditionContext
type: constant
domain: capture
---

### capture-C056: BallConditionContext Interface
- **cap_id**: capture-C056
- **name**: Ball Condition Context Type
- **type**: constant
- **location**: `app/constants/pokeBalls.ts` -- `BallConditionContext` interface
- **game_concept**: Context data needed to evaluate conditional Poke Ball modifiers
- **description**: Interface defining all context fields for conditional ball evaluation: encounterRound (Timer/Quick Ball), targetLevel (Level/Nest Ball), activePokemonLevel (Level Ball), targetTypes (Net Ball), targetGender/activePokemonGender (Love Ball), targetSpecies/activePokemonEvoLine/targetEvoLine (Love Ball), targetEvolvesWithStone (Moon Ball), targetWeightClass (Heavy Ball), targetMovementSpeed (Fast Ball), targetWasBaited (Lure Ball), trainerOwnsSpecies (Repeat Ball), isDarkOrLowLight (Dusk Ball), isUnderwaterOrUnderground (Dive Ball).
- **inputs**: N/A (type definition)
- **outputs**: Used as parameter type across ball condition system
- **accessible_from**: gm, player (auto-imported type)
