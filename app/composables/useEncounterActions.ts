import type { StageModifiers, StatusCondition, GridConfig, GridPosition, MovementPreview, Encounter, WebSocketEvent } from '~/types'

interface EncounterActionsOptions {
  encounter: Ref<Encounter | null>
  send: (event: WebSocketEvent) => void
  refreshUndoRedoState: () => void
}

export function useEncounterActions(options: EncounterActionsOptions) {
  const { encounter, send, refreshUndoRedoState } = options
  const encounterStore = useEncounterStore()
  const { getCombatantName } = useCombatantDisplay()

  // Helper to broadcast encounter updates
  const broadcastUpdate = async () => {
    await nextTick()
    if (encounterStore.encounter) {
      send({ type: 'encounter_update', data: encounterStore.encounter })
    }
  }

  // Helper to find combatant
  const findCombatant = (combatantId: string) => {
    return encounter.value?.combatants.find(c => c.id === combatantId)
  }

  // Combat action handlers
  const handleAction = async (combatantId: string, action: { type: string; data: unknown }) => {
    switch (action.type) {
      case 'standard':
        await encounterStore.useStandardAction(combatantId)
        break
      case 'shift':
        await encounterStore.useShiftAction(combatantId)
        break
      case 'swift':
        await encounterStore.useSwiftAction(combatantId)
        break
    }
  }

  const handleDamage = async (combatantId: string, damage: number) => {
    const combatant = findCombatant(combatantId)
    const name = getCombatantName(combatant)
    encounterStore.captureSnapshot(`Applied ${damage} damage to ${name}`)
    await encounterStore.applyDamage(combatantId, damage)
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  const handleHeal = async (combatantId: string, amount: number, tempHp?: number, healInjuries?: number) => {
    const combatant = findCombatant(combatantId)
    const name = getCombatantName(combatant)
    const parts: string[] = []
    if (amount > 0) parts.push(`${amount} HP`)
    if (tempHp && tempHp > 0) parts.push(`${tempHp} Temp HP`)
    if (healInjuries && healInjuries > 0) parts.push(`${healInjuries} injury`)
    encounterStore.captureSnapshot(`Healed ${name} (${parts.join(', ')})`)
    await encounterStore.healCombatant(combatantId, amount, tempHp ?? 0, healInjuries ?? 0)
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  const handleStages = async (combatantId: string, changes: Partial<StageModifiers>, absolute: boolean) => {
    const combatant = findCombatant(combatantId)
    const name = getCombatantName(combatant)
    encounterStore.captureSnapshot(`Changed ${name}'s combat stages`)
    await encounterStore.setCombatStages(combatantId, changes as Record<string, number>, absolute)
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  const handleStatus = async (combatantId: string, add: StatusCondition[], remove: StatusCondition[]) => {
    const combatant = findCombatant(combatantId)
    const name = getCombatantName(combatant)
    const parts: string[] = []
    if (add.length > 0) parts.push(`added ${add.join(', ')}`)
    if (remove.length > 0) parts.push(`removed ${remove.join(', ')}`)
    encounterStore.captureSnapshot(`${name}: ${parts.join('; ')}`)
    await encounterStore.updateStatusConditions(combatantId, add, remove)
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  // Maneuver name mapping
  const maneuverNames: Record<string, string> = {
    'push': 'Push',
    'sprint': 'Sprint',
    'trip': 'Trip',
    'grapple': 'Grapple',
    'intercept-melee': 'Intercept Melee',
    'intercept-ranged': 'Intercept Ranged',
    'take-a-breather': 'Take a Breather'
  }

  const handleExecuteMove = async (
    combatantId: string,
    moveId: string,
    targetIds: string[],
    damage?: number,
    targetDamages?: Record<string, number>
  ) => {
    const combatant = findCombatant(combatantId)
    if (!combatant) return

    const moveName = moveId === 'struggle' ? 'Struggle' : (combatant.type === 'pokemon'
      ? ((combatant.entity as { moves?: { id: string; name: string }[] }).moves?.find(
          m => m.id === moveId || m.name === moveId
        )?.name || moveId)
      : moveId)

    encounterStore.captureSnapshot(`${getCombatantName(combatant)} used ${moveName}`)
    await encounterStore.executeMove(combatantId, moveId, targetIds, damage, targetDamages)
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  const handleExecuteAction = async (combatantId: string, actionType: string) => {
    const combatant = findCombatant(combatantId)
    if (!combatant) return

    const name = getCombatantName(combatant)

    // Handle maneuvers (prefixed with 'maneuver:')
    if (actionType.startsWith('maneuver:')) {
      const maneuverId = actionType.replace('maneuver:', '')
      const maneuverName = maneuverNames[maneuverId] || maneuverId
      encounterStore.captureSnapshot(`${name} used ${maneuverName}`)

      // Use standard action for most maneuvers
      if (['push', 'sprint', 'trip', 'grapple'].includes(maneuverId)) {
        await encounterStore.useStandardAction(combatantId)
      }
      // Full actions use both standard and shift
      if (['take-a-breather', 'intercept-melee', 'intercept-ranged'].includes(maneuverId)) {
        await encounterStore.useStandardAction(combatantId)
        await encounterStore.useShiftAction(combatantId)
      }
      // Special handling for Take a Breather
      if (maneuverId === 'take-a-breather') {
        await encounterStore.takeABreather(combatantId)
      }
    } else {
      // Handle standard actions
      switch (actionType) {
        case 'shift':
          encounterStore.captureSnapshot(`${name} used Shift action`)
          await encounterStore.useShiftAction(combatantId)
          break
        case 'pass':
          encounterStore.captureSnapshot(`${name} passed their turn`)
          // Mark turn as complete
          if (combatant.turnState) {
            combatant.turnState.hasActed = true
            combatant.turnState.standardActionUsed = true
            combatant.turnState.shiftActionUsed = true
          }
          break
      }
    }

    refreshUndoRedoState()
    await broadcastUpdate()
  }

  // VTT Grid handlers
  const handleGridConfigUpdate = async (config: GridConfig) => {
    await encounterStore.updateGridConfig(config)
  }

  const handleTokenMove = async (combatantId: string, position: GridPosition) => {
    const combatant = findCombatant(combatantId)
    const name = getCombatantName(combatant)
    encounterStore.captureSnapshot(`Moved ${name} to (${position.x}, ${position.y})`)
    await encounterStore.updateCombatantPosition(combatantId, position)
    refreshUndoRedoState()
    await broadcastUpdate()
  }

  const handleBackgroundUpload = async (file: File) => {
    try {
      await encounterStore.uploadBackgroundImage(file)
    } catch (error) {
      console.error('Failed to upload background:', error)
    }
  }

  const handleBackgroundRemove = async () => {
    try {
      await encounterStore.removeBackgroundImage()
    } catch (error) {
      console.error('Failed to remove background:', error)
    }
  }

  const handleMovementPreviewChange = (preview: MovementPreview | null) => {
    send({ type: 'movement_preview', data: preview })
  }

  return {
    // Combat handlers
    handleAction,
    handleDamage,
    handleHeal,
    handleStages,
    handleStatus,
    // Move/action handlers
    handleExecuteMove,
    handleExecuteAction,
    // VTT handlers
    handleGridConfigUpdate,
    handleTokenMove,
    handleBackgroundUpload,
    handleBackgroundRemove,
    handleMovementPreviewChange
  }
}
