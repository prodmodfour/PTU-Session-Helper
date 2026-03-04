import type { Combatant, Pokemon } from '~/types'

/**
 * Composable that encapsulates switch button visibility and disabled logic
 * for CombatantGmActions. Extracted from CombatantGmActions.vue (refactoring-108).
 *
 * Pure extraction — no logic changes from the original computed properties.
 */
export function useCombatantSwitchButtons(
  combatant: Ref<Combatant>,
  entity: Ref<Combatant['entity']>,
  isPokemon: Ref<boolean>
) {
  const encounterStore = useEncounterStore()

  // Show switch button for trainers who own Pokemon in encounter, or for Pokemon owned by a trainer
  const canShowSwitchButton = computed(() => {
    if (combatant.value.type === 'human') {
      const trainerEntityId = combatant.value.entityId
      return encounterStore.encounter?.combatants.some(
        c => c.type === 'pokemon' && (c.entity as Pokemon).ownerId === trainerEntityId
      ) ?? false
    }
    if (combatant.value.type === 'pokemon') {
      const pokemon = entity.value as Pokemon
      return !!pokemon.ownerId
    }
    return false
  })

  /**
   * Determine if the switch button should be disabled.
   * Switch can be initiated on either the trainer's or their Pokemon's turn,
   * and the Standard Action is consumed on whichever combatant's turn it is.
   */
  const isSwitchDisabled = computed(() => {
    const encounter = encounterStore.encounter
    if (!encounter) return true

    const currentId = encounter.turnOrder[encounter.currentTurnIndex]

    if (combatant.value.type === 'human') {
      // Trainer card: check if it's the trainer's turn or any of their Pokemon's turns
      const trainerEntityId = combatant.value.entityId
      const isTrainerTurn = currentId === combatant.value.id
      const isOwnedPokemonTurn = encounter.combatants.some(
        c => c.id === currentId && c.type === 'pokemon' && (c.entity as Pokemon).ownerId === trainerEntityId
      )
      if (!isTrainerTurn && !isOwnedPokemonTurn) return true

      // Check Standard Action on the initiating combatant (whoever's turn it is)
      const initiator = encounter.combatants.find(c => c.id === currentId)
      return initiator?.turnState.standardActionUsed ?? true
    }

    if (combatant.value.type === 'pokemon') {
      // Pokemon card: check if it's this Pokemon's turn or its trainer's turn
      const pokemon = entity.value as Pokemon
      const isPokemonTurn = currentId === combatant.value.id
      const isTrainerTurn = encounter.combatants.some(
        c => c.id === currentId && c.type === 'human' && c.entityId === pokemon.ownerId
      )
      if (!isPokemonTurn && !isTrainerTurn) return true

      const initiator = encounter.combatants.find(c => c.id === currentId)
      return initiator?.turnState.standardActionUsed ?? true
    }

    return true
  })

  /**
   * Show fainted switch button when:
   * - Combatant is a trainer who has a fainted Pokemon in the encounter
   * - OR combatant is a fainted Pokemon owned by a trainer
   */
  const canShowFaintedSwitchButton = computed(() => {
    if (combatant.value.type === 'human') {
      const trainerEntityId = combatant.value.entityId
      return encounterStore.encounter?.combatants.some(
        c => c.type === 'pokemon' &&
          (c.entity as Pokemon).ownerId === trainerEntityId &&
          c.entity.currentHp <= 0
      ) ?? false
    }
    if (combatant.value.type === 'pokemon') {
      const pokemon = entity.value as Pokemon
      return pokemon.ownerId && pokemon.currentHp <= 0
    }
    return false
  })

  /**
   * Disable fainted switch when:
   * - Not the trainer's turn
   * - Trainer's Shift Action already used
   */
  const isFaintedSwitchDisabled = computed(() => {
    const encounter = encounterStore.encounter
    if (!encounter) return true

    const currentId = encounter.turnOrder[encounter.currentTurnIndex]

    // Find the trainer
    let trainerCombatantId: string
    if (combatant.value.type === 'human') {
      trainerCombatantId = combatant.value.id
    } else {
      const pokemon = entity.value as Pokemon
      const trainer = encounter.combatants.find(
        c => c.type === 'human' && c.entityId === pokemon.ownerId
      )
      if (!trainer) return true
      trainerCombatantId = trainer.id
    }

    // Must be the trainer's turn
    if (currentId !== trainerCombatantId) return true

    // Trainer must have Shift Action
    const trainer = encounter.combatants.find(c => c.id === trainerCombatantId)
    return trainer?.turnState.shiftActionUsed ?? true
  })

  /**
   * Show force switch button for Pokemon that are owned by a trainer.
   * GM can trigger this on any Pokemon to simulate Roar effects.
   * Only shown on Pokemon combatants (not trainers).
   * Note: Whirlwind is a push, not a forced switch (decree-034).
   */
  const canShowForceSwitchButton = computed(() => {
    if (combatant.value.type !== 'pokemon') return false
    const pokemon = entity.value as Pokemon
    return !!pokemon.ownerId
  })

  return {
    canShowSwitchButton,
    isSwitchDisabled,
    canShowFaintedSwitchButton,
    isFaintedSwitchDisabled,
    canShowForceSwitchButton
  }
}
