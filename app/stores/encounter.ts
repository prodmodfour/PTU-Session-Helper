import { defineStore } from 'pinia'
import type { Encounter, Combatant, MoveLogEntry, CombatSide, TurnPhase, BattleType, TrainerDeclaration, StatusCondition } from '~/types'
import type { AoOTrigger, InterruptTrigger } from '~/types/combat'
import type { GridPosition } from '~/types/spatial'
import type { SignificanceTier } from '~/utils/encounterBudget'
import { getHistory } from '~/composables/useEncounterUndoRedo'

export const useEncounterStore = defineStore('encounter', {
  state: () => ({
    encounter: null as Encounter | null,
    loading: false,
    error: null as string | null,
    /** P1: Between-turns state for Priority declaration window */
    betweenTurns: false,
  }),

  getters: {
    isActive: (state) => state.encounter?.isActive ?? false,
    isPaused: (state) => state.encounter?.isPaused ?? false,
    isServed: (state) => state.encounter?.isServed ?? false,
    currentRound: (state) => state.encounter?.currentRound ?? 0,
    sceneNumber: (state) => state.encounter?.sceneNumber ?? 1,

    battleType: (state): BattleType => state.encounter?.battleType ?? 'full_contact',
    isLeagueBattle: (state): boolean => state.encounter?.battleType === 'trainer',
    currentPhase: (state): TurnPhase => state.encounter?.currentPhase ?? 'pokemon',
    activeEnvironmentPreset: (state) => state.encounter?.environmentPreset ?? null,

    combatantsByInitiative: (state): Combatant[] => {
      if (!state.encounter) return []
      const order = state.encounter.turnOrder
      if (order.length > 0) {
        return order.map(id => state.encounter!.combatants.find(c => c.id === id)).filter(Boolean) as Combatant[]
      }
      return [...state.encounter.combatants].sort((a, b) => b.initiative - a.initiative)
    },

    trainersByTurnOrder: (state): Combatant[] => {
      if (!state.encounter) return []
      const order = state.encounter.trainerTurnOrder ?? []
      return order.map(id => state.encounter!.combatants.find(c => c.id === id)).filter(Boolean) as Combatant[]
    },

    pokemonByTurnOrder: (state): Combatant[] => {
      if (!state.encounter) return []
      const order = state.encounter.pokemonTurnOrder ?? []
      return order.map(id => state.encounter!.combatants.find(c => c.id === id)).filter(Boolean) as Combatant[]
    },

    currentCombatant: (state): Combatant | null => {
      if (!state.encounter || state.encounter.turnOrder.length === 0) return null
      const currentId = state.encounter.turnOrder[state.encounter.currentTurnIndex]
      return state.encounter.combatants.find(c => c.id === currentId) ?? null
    },

    playerCombatants: (state): Combatant[] => {
      return state.encounter?.combatants.filter(c => c.side === 'players') ?? []
    },

    allyCombatants: (state): Combatant[] => {
      return state.encounter?.combatants.filter(c => c.side === 'allies') ?? []
    },

    enemyCombatants: (state): Combatant[] => {
      return state.encounter?.combatants.filter(c => c.side === 'enemies') ?? []
    },

    injuredCombatants: (state): Combatant[] => {
      return state.encounter?.combatants.filter(c => c.injuries.count > 0) ?? []
    },

    combatantsWithActions: (state): Combatant[] => {
      return state.encounter?.combatants.filter(c => {
        const ts = c.turnState
        return !ts.hasActed || !ts.standardActionUsed || !ts.shiftActionUsed || !ts.swiftActionUsed
      }) ?? []
    },

    moveLog: (state): MoveLogEntry[] => {
      return state.encounter?.moveLog ?? []
    },

    currentDeclarations: (state): TrainerDeclaration[] => {
      if (!state.encounter) return []
      return (state.encounter.declarations ?? []).filter(
        d => d.round === state.encounter!.currentRound
      )
    },

    currentResolutionDeclaration: (state): TrainerDeclaration | null => {
      if (!state.encounter) return null
      if (state.encounter.currentPhase !== 'trainer_resolution') return null
      const currentId = state.encounter.turnOrder[state.encounter.currentTurnIndex]
      return (state.encounter.declarations ?? []).find(
        d => d.combatantId === currentId && d.round === state.encounter!.currentRound
      ) ?? null
    },

    // Out-of-turn getters extracted to useOutOfTurnState composable (refactoring-117)

    mountedRiders: (state): Combatant[] => {
      if (!state.encounter) return []
      return state.encounter.combatants.filter(c => c.mountState?.isMounted === true)
    },

    isMountedRider: (state) => (combatantId: string): boolean => {
      if (!state.encounter) return false
      const c = state.encounter.combatants.find(c => c.id === combatantId)
      return c?.mountState?.isMounted === true
    },

    isBeingRidden: (state) => (combatantId: string): boolean => {
      if (!state.encounter) return false
      const c = state.encounter.combatants.find(c => c.id === combatantId)
      return c?.mountState !== undefined && c.mountState.isMounted === false
    },

    getMountPartner: (state) => (combatantId: string): Combatant | null => {
      if (!state.encounter) return null
      const c = state.encounter.combatants.find(c => c.id === combatantId)
      if (!c?.mountState) return null
      return state.encounter.combatants.find(p => p.id === c.mountState!.partnerId) ?? null
    },

    getMountState: (state) => (combatantId: string) => {
      if (!state.encounter) return undefined
      const c = state.encounter.combatants.find(c => c.id === combatantId)
      return c?.mountState
    },

    mountedPairs: (state): { riderId: string; mountId: string }[] => {
      if (!state.encounter) return []
      return state.encounter.combatants
        .filter(c => c.mountState?.isMounted === true)
        .map(c => ({ riderId: c.id, mountId: c.mountState!.partnerId }))
    },

    canDismount: (state): boolean => {
      if (!state.encounter) return false
      const currentId = state.encounter.turnOrder[state.encounter.currentTurnIndex]
      const current = state.encounter.combatants.find(c => c.id === currentId)
      return current?.mountState?.isMounted === true
    },

    isWieldingWeapon: (state) => (combatantId: string): boolean => {
      if (!state.encounter) return false
      const c = state.encounter.combatants.find(c => c.id === combatantId)
      return c?.wieldingWeaponId !== undefined
    },

    isBeingWielded: (state) => (combatantId: string): boolean => {
      if (!state.encounter) return false
      const c = state.encounter.combatants.find(c => c.id === combatantId)
      return c?.wieldedByTrainerId !== undefined
    },

    getWieldedWeapon: (state) => (combatantId: string): Combatant | null => {
      if (!state.encounter) return null
      const c = state.encounter.combatants.find(c => c.id === combatantId)
      if (!c?.wieldingWeaponId) return null
      return state.encounter.combatants.find(w => w.id === c.wieldingWeaponId) ?? null
    },

    getWeaponWielder: (state) => (combatantId: string): Combatant | null => {
      if (!state.encounter) return null
      const c = state.encounter.combatants.find(c => c.id === combatantId)
      if (!c?.wieldedByTrainerId) return null
      return state.encounter.combatants.find(w => w.id === c.wieldedByTrainerId) ?? null
    },

    wieldPairs: (state): { wielderId: string; weaponId: string }[] => {
      if (!state.encounter) return []
      return state.encounter.combatants
        .filter(c => c.wieldingWeaponId !== undefined)
        .map(c => ({ wielderId: c.id, weaponId: c.wieldingWeaponId! }))
    },
  },

  actions: {
    _buildContext() {
      return {
        getEncounter: () => this.encounter,
        setEncounter: (enc: Encounter) => { this.encounter = enc },
        setError: (msg: string) => { this.error = msg },
        setBetweenTurns: (val: boolean) => { this.betweenTurns = val }
      }
    },

    // Encounter CRUD Actions

    async loadEncounter(id: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${id}`)
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to load encounter'
      } finally {
        this.loading = false
      }
    },

    async createEncounter(
      name: string,
      battleType: 'trainer' | 'full_contact',
      weather?: string | null,
      significance?: { multiplier: number; tier: SignificanceTier }
    ) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Encounter }>('/api/encounters', {
          method: 'POST',
          body: {
            name, battleType, weather,
            ...(significance && {
              significanceMultiplier: significance.multiplier,
              significanceTier: significance.tier
            })
          }
        })
        this.encounter = response.data
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to create encounter'
        throw e
      } finally {
        this.loading = false
      }
    },

    async createFromScene(
      sceneId: string,
      battleType: 'trainer' | 'full_contact',
      significance?: { multiplier: number; tier: SignificanceTier }
    ) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Encounter }>('/api/encounters/from-scene', {
          method: 'POST',
          body: {
            sceneId, battleType,
            ...(significance && {
              significanceMultiplier: significance.multiplier,
              significanceTier: significance.tier
            })
          }
        })
        this.encounter = response.data
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to create encounter from scene'
        throw e
      } finally {
        this.loading = false
      }
    },

    async loadFromTemplate(templateId: string, encounterName?: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounter-templates/${templateId}/load`, {
          method: 'POST',
          body: encounterName ? { name: encounterName } : {}
        })
        this.encounter = response.data
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to create encounter from template'
        throw e
      } finally {
        this.loading = false
      }
    },

    async addCombatant(entityId: string, entityType: 'pokemon' | 'human', side: CombatSide, initiativeBonus: number = 0) {
      if (!this.encounter) return
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/combatants`, {
          method: 'POST',
          body: { entityId, entityType, side, initiativeBonus }
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to add combatant'
        throw e
      }
    },

    async removeCombatant(combatantId: string) {
      if (!this.encounter) return
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/combatants/${combatantId}`, {
          method: 'DELETE'
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to remove combatant'
        throw e
      }
    },

    async endAndClear() {
      if (!this.encounter) return
      try {
        await this.endEncounter()
        this.encounter = null
      } catch (e: any) {
        this.error = e.message || 'Failed to end encounter'
        throw e
      }
    },

    async startEncounter() {
      if (!this.encounter) return
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/start`, { method: 'POST' })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to start encounter'
        throw e
      }
    },

    async endEncounter() {
      if (!this.encounter) return
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/end`, { method: 'POST' })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to end encounter'
        throw e
      }
    },

    clearEncounter() {
      this.encounter = null
      this.error = null
    },

    // Serve/Unserve Actions (Group View)
    async serveEncounter() {
      if (!this.encounter) return
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/serve`, { method: 'POST' })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to serve encounter'
        throw e
      }
    },

    async unserveEncounter() {
      if (!this.encounter) return
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/unserve`, { method: 'POST' })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to unserve encounter'
        throw e
      }
    },

    async loadServedEncounter() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ data: Encounter | null }>('/api/encounters/served')
        this.encounter = response.data
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to load served encounter'
        return null
      } finally {
        this.loading = false
      }
    },

    // WebSocket Update
    updateFromWebSocket(data: Encounter) {
      if (!this.encounter) {
        this.encounter = data
        return
      }

      this.encounter.name = data.name ?? this.encounter.name
      this.encounter.battleType = data.battleType ?? this.encounter.battleType
      if (data.weather !== undefined) this.encounter.weather = data.weather
      if (data.weatherDuration !== undefined) this.encounter.weatherDuration = data.weatherDuration
      if (data.weatherSource !== undefined) this.encounter.weatherSource = data.weatherSource
      this.encounter.currentRound = data.currentRound ?? this.encounter.currentRound
      this.encounter.currentTurnIndex = data.currentTurnIndex ?? this.encounter.currentTurnIndex
      this.encounter.isPaused = data.isPaused ?? this.encounter.isPaused
      this.encounter.currentPhase = data.currentPhase ?? this.encounter.currentPhase
      this.encounter.turnOrder = data.turnOrder ?? this.encounter.turnOrder
      this.encounter.trainerTurnOrder = data.trainerTurnOrder ?? this.encounter.trainerTurnOrder
      this.encounter.pokemonTurnOrder = data.pokemonTurnOrder ?? this.encounter.pokemonTurnOrder
      if (data.isServed !== undefined) this.encounter.isServed = data.isServed
      if (data.declarations !== undefined) this.encounter.declarations = data.declarations
      if (data.switchActions !== undefined) this.encounter.switchActions = data.switchActions
      if (data.pendingOutOfTurnActions !== undefined) this.encounter.pendingOutOfTurnActions = data.pendingOutOfTurnActions
      if (data.holdQueue !== undefined) this.encounter.holdQueue = data.holdQueue
      if (data.wieldRelationships !== undefined) this.encounter.wieldRelationships = data.wieldRelationships
      this.encounter.moveLog = data.moveLog ?? this.encounter.moveLog
      if (data.significanceMultiplier !== undefined) this.encounter.significanceMultiplier = data.significanceMultiplier
      if (data.significanceTier !== undefined) this.encounter.significanceTier = data.significanceTier
      if (data.gridConfig !== undefined) this.encounter.gridConfig = data.gridConfig
      if (data.environmentPreset !== undefined) this.encounter.environmentPreset = data.environmentPreset

      // Surgically update combatants to preserve reactivity
      for (const incomingCombatant of data.combatants) {
        const existingIndex = this.encounter.combatants.findIndex(c => c.id === incomingCombatant.id)
        if (existingIndex !== -1) {
          const existing = this.encounter.combatants[existingIndex]
          existing.initiative = incomingCombatant.initiative
          existing.hasActed = incomingCombatant.hasActed
          existing.side = incomingCombatant.side
          existing.position = incomingCombatant.position
          existing.turnState = incomingCombatant.turnState
          existing.outOfTurnUsage = incomingCombatant.outOfTurnUsage
          existing.disengaged = incomingCombatant.disengaged
          existing.holdAction = incomingCombatant.holdAction
          existing.skipNextRound = incomingCombatant.skipNextRound
          existing.mountState = incomingCombatant.mountState
          existing.wieldingWeaponId = incomingCombatant.wieldingWeaponId
          existing.wieldedByTrainerId = incomingCombatant.wieldedByTrainerId
          existing.visionState = incomingCombatant.visionState
          Object.assign(existing.entity, incomingCombatant.entity)
        } else {
          this.encounter.combatants.push(incomingCombatant)
        }
      }

      const incomingIds = new Set(data.combatants.map(c => c.id))
      this.encounter.combatants = this.encounter.combatants.filter(c => incomingIds.has(c.id))
    },

    // Weather Management
    async setWeather(weather: string | null, source: 'move' | 'ability' | 'manual' = 'manual', duration?: number) {
      if (!this.encounter) return
      try {
        const response = await $fetch<{ data: Encounter }>(`/api/encounters/${this.encounter.id}/weather`, {
          method: 'POST',
          body: { weather, source, duration }
        })
        this.encounter = response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to set weather'
        throw e
      }
    },

    // Wild Pokemon Spawning
    async addWildPokemon(
      pokemon: Array<{ speciesId?: string; speciesName: string; level: number }>,
      side: CombatSide = 'enemies'
    ): Promise<Array<{ pokemonId: string; combatantId: string; species: string; level: number }>> {
      if (!this.encounter) throw new Error('No active encounter')
      try {
        const response = await $fetch<{
          data: { encounter: Encounter; addedPokemon: Array<{ pokemonId: string; combatantId: string; species: string; level: number }> }
        }>(`/api/encounters/${this.encounter.id}/wild-spawn`, {
          method: 'POST',
          body: { pokemon, side }
        })
        this.encounter = response.data.encounter
        return response.data.addedPokemon
      } catch (e: any) {
        this.error = e.message || 'Failed to add wild Pokemon'
        throw e
      }
    },

    // Environment Preset (P2: ptu-rule-058)
    async setEnvironmentPreset(encounterId: string, preset: import('~/types').EnvironmentPreset | null) {
      try {
        await $fetch(`/api/encounters/${encounterId}/environment-preset`, {
          method: 'PUT',
          body: { environmentPreset: preset }
        })
        if (this.encounter && this.encounter.id === encounterId) {
          this.encounter = { ...this.encounter, environmentPreset: preset }
        }
      } catch (e: any) {
        this.error = e.message || 'Failed to update environment preset'
        throw e
      }
    },

    // Vision Capabilities (decree-048, feature-025)
    async toggleVisionCapability(
      combatantId: string,
      capability: import('~/utils/visionRules').VisionCapability,
      enabled: boolean
    ) {
      if (!this.encounter) return
      try {
        const response = await $fetch<{ success: boolean; data: Encounter }>(
          `/api/encounters/${this.encounter.id}/combatants/${combatantId}/vision`,
          { method: 'POST', body: { capability, enabled, source: 'manual' } }
        )
        if (response.success) {
          this.encounter = response.data
          getHistory().pushSnapshot('Toggle vision capability')
        }
      } catch (e: any) {
        this.error = e?.message || 'Failed to toggle vision capability'
        throw e
      }
    },

    // Significance Multiplier
    async setSignificance(encounterId: string, significanceMultiplier: number, significanceTier?: SignificanceTier) {
      try {
        await $fetch(`/api/encounters/${encounterId}/significance`, {
          method: 'PUT',
          body: { significanceMultiplier, ...(significanceTier && { significanceTier }) }
        })
        if (this.encounter && this.encounter.id === encounterId) {
          this.encounter = {
            ...this.encounter,
            significanceMultiplier,
            ...(significanceTier && { significanceTier })
          }
        }
      } catch (e: any) {
        this.error = e.message || 'Failed to update significance'
        throw e
      }
    },

    // Delegated: Combat Actions
    async nextTurn() {
      const { nextTurn } = useEncounterCombatActions(this._buildContext())
      return nextTurn()
    },

    async submitDeclaration(
      combatantId: string,
      actionType: TrainerDeclaration['actionType'],
      description: string,
      targetIds?: string[]
    ) {
      const { submitDeclaration } = useEncounterCombatActions(this._buildContext())
      return submitDeclaration(combatantId, actionType, description, targetIds)
    },

    async executeMove(
      actorId: string, moveId: string, targetIds: string[],
      damage?: number, targetDamages?: Record<string, number>, notes?: string
    ) {
      const { executeMove } = useEncounterCombatActions(this._buildContext())
      return executeMove(actorId, moveId, targetIds, damage, targetDamages, notes)
    },

    async applyDamage(combatantId: string, damage: number, suppressDeath: boolean = false, lossType?: 'damage' | 'hpLoss' | 'setHp') {
      const { applyDamage } = useEncounterCombatActions(this._buildContext())
      return applyDamage(combatantId, damage, suppressDeath, lossType)
    },

    async healCombatant(combatantId: string, amount: number = 0, tempHp: number = 0, healInjuries: number = 0) {
      const { healCombatant } = useEncounterCombatActions(this._buildContext())
      return healCombatant(combatantId, amount, tempHp, healInjuries)
    },

    async useItem(
      itemName: string, userId: string, targetId: string,
      options?: { targetAccepts?: boolean; skipInventory?: boolean }
    ) {
      const { useItem } = useEncounterCombatActions(this._buildContext())
      return useItem(itemName, userId, targetId, options)
    },

    async setReadyAction(combatantId: string, readyAction: string) {
      const { setReadyAction } = useEncounterCombatActions(this._buildContext())
      return setReadyAction(combatantId, readyAction)
    },

    async useAction(combatantId: string, actionType: 'standard' | 'shift' | 'swift') {
      const { useAction } = useEncounterCombatActions(this._buildContext())
      return useAction(combatantId, actionType)
    },

    // Delegated: Undo/Redo Actions
    captureSnapshot(actionName: string) {
      const { captureSnapshot } = useEncounterUndoRedo(this._buildContext())
      captureSnapshot(actionName)
    },

    async undoAction() {
      const { undoAction } = useEncounterUndoRedo(this._buildContext())
      return undoAction()
    },

    async redoAction() {
      const { redoAction } = useEncounterUndoRedo(this._buildContext())
      return redoAction()
    },

    getUndoRedoState() {
      const { getUndoRedoState } = useEncounterUndoRedo(this._buildContext())
      return getUndoRedoState()
    },

    initializeHistory() {
      const { initializeHistory } = useEncounterUndoRedo(this._buildContext())
      initializeHistory()
    },

    // Delegated: Pokemon Switching Actions
    async switchPokemon(
      trainerId: string, recallCombatantId: string, releaseEntityId: string,
      options?: { faintedSwitch?: boolean; forced?: boolean; releasePosition?: { x: number; y: number } }
    ) {
      const { switchPokemon } = useEncounterSwitching(this._buildContext())
      return switchPokemon(trainerId, recallCombatantId, releaseEntityId, options)
    },

    async recallPokemon(trainerId: string, pokemonCombatantIds: string[]) {
      const { recallPokemon } = useEncounterSwitching(this._buildContext())
      return recallPokemon(trainerId, pokemonCombatantIds)
    },

    async releasePokemon(trainerId: string, pokemonEntityIds: string[], positions?: Array<{ x: number; y: number } | null>) {
      const { releasePokemon } = useEncounterSwitching(this._buildContext())
      return releasePokemon(trainerId, pokemonEntityIds, positions)
    },

    // Delegated: Out-of-Turn Actions
    async detectAoO(
      actorId: string, triggerType: AoOTrigger,
      context?: { previousPosition?: GridPosition; newPosition?: GridPosition; maneuverTargetIds?: string[]; hasAdjacentTarget?: boolean }
    ) {
      const { detectAoO } = useEncounterOutOfTurn(this._buildContext())
      return detectAoO(actorId, triggerType, context)
    },

    async resolveAoO(actionId: string, resolution: 'accept' | 'decline', damageRoll?: number) {
      const { resolveAoO } = useEncounterOutOfTurn(this._buildContext())
      return resolveAoO(actionId, resolution, damageRoll)
    },

    async holdAction(combatantId: string, holdUntilInitiative: number | null) {
      const { holdAction } = useEncounterOutOfTurn(this._buildContext())
      return holdAction(combatantId, holdUntilInitiative)
    },

    async releaseHold(combatantId: string) {
      const { releaseHold } = useEncounterOutOfTurn(this._buildContext())
      return releaseHold(combatantId)
    },

    async declarePriority(combatantId: string, variant: 'standard' | 'limited' | 'advanced', actionDescription?: string) {
      const { declarePriority } = useEncounterOutOfTurn(this._buildContext())
      return declarePriority(combatantId, variant, actionDescription)
    },

    enterBetweenTurns() { this.betweenTurns = true },
    exitBetweenTurns() { this.betweenTurns = false },

    async declareInterrupt(
      combatantId: string, triggerId: string, triggerType: InterruptTrigger,
      options?: { interruptAction?: string; resolution?: 'accept' | 'decline'; context?: { moveName?: string; originalTargetId?: string; attackerId?: string } }
    ) {
      const { declareInterrupt } = useEncounterOutOfTurn(this._buildContext())
      return declareInterrupt(combatantId, triggerId, triggerType, options)
    },

    async interceptMelee(interceptorId: string, targetId: string, attackerId: string, actionId: string, skillCheck: number) {
      const { interceptMelee } = useEncounterOutOfTurn(this._buildContext())
      return interceptMelee(interceptorId, targetId, attackerId, actionId, skillCheck)
    },

    async interceptRanged(interceptorId: string, targetSquare: GridPosition, attackerId: string, actionId: string, skillCheck: number) {
      const { interceptRanged } = useEncounterOutOfTurn(this._buildContext())
      return interceptRanged(interceptorId, targetSquare, attackerId, actionId, skillCheck)
    },

    async disengage(combatantId: string) {
      const { disengage } = useEncounterOutOfTurn(this._buildContext())
      return disengage(combatantId)
    },

    // Delegated: Mount/Dismount & Rider Features
    async mountRider(riderId: string, mountId: string, skipCheck?: boolean) {
      const { mountRider } = useEncounterMounts(this._buildContext())
      return mountRider(riderId, mountId, skipCheck)
    },

    async dismountRider(riderId: string, forced?: boolean, skipCheck?: boolean) {
      const { dismountRider } = useEncounterMounts(this._buildContext())
      return dismountRider(riderId, forced, skipCheck)
    },

    toggleAgilityTraining(combatantId: string) {
      const { toggleAgilityTraining } = useEncounterMounts(this._buildContext())
      toggleAgilityTraining(combatantId)
    },

    activateConquerorsMarch(riderId: string, mountId: string) {
      const { activateConquerorsMarch } = useEncounterMounts(this._buildContext())
      activateConquerorsMarch(riderId, mountId)
    },

    useSceneFeature(combatantId: string, featureName: string, maxPerScene: number) {
      const { useSceneFeature } = useEncounterMounts(this._buildContext())
      return useSceneFeature(combatantId, featureName, maxPerScene)
    },

    setRideAsOneSwapped(combatantId: string, swapped: boolean) {
      const { setRideAsOneSwapped } = useEncounterMounts(this._buildContext())
      setRideAsOneSwapped(combatantId, swapped)
    },

    addDistanceMoved(combatantId: string, distance: number) {
      const { addDistanceMoved } = useEncounterMounts(this._buildContext())
      addDistanceMoved(combatantId, distance)
    },
  }
})
