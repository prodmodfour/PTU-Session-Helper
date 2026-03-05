---
cap_id: capture-C046
name: CombatantCaptureSection
type: component
domain: capture
---

### capture-C046: CombatantCaptureSection
- **cap_id**: capture-C046
- **name**: Combatant Capture Section (GM)
- **type**: component
- **location**: `app/components/encounter/CombatantCaptureSection.vue`
- **game_concept**: GM capture UI embedded in wild Pokemon's combatant card
- **description**: Wrapper component rendered in CombatantCard for wild Pokemon. Provides: (1) Trainer selector dropdown (lists player/ally human combatants), (2) Species data fetch for evolution stage (accurate capture rate), (3) Accuracy params computation from encounter combatant data (decree-042: thrower accuracy stage, target speed evasion), (4) Delegates to CapturePanel for actual capture workflow. On successful capture, reloads encounter to reflect ownership change.
- **inputs**: pokemonId, pokemonSpecies, pokemonEntity, encounterId?
- **outputs**: Emits 'captured'
- **accessible_from**: gm (rendered in CombatantCard when isGm && isWildPokemon)
