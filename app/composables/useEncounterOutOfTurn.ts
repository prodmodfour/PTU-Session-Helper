import type { Encounter } from '~/types'
import type { OutOfTurnAction, AoOTrigger, InterruptTrigger } from '~/types/combat'
import type { GridPosition } from '~/types/spatial'

/**
 * Composable for encounter out-of-turn actions.
 * Handles AoO detection/resolution, Hold Action, Priority, Interrupt,
 * Intercept Melee/Ranged, and Disengage.
 */

interface EncounterOutOfTurnContext {
  getEncounter: () => Encounter | null
  setEncounter: (enc: Encounter) => void
  setError: (msg: string) => void
  setBetweenTurns: (val: boolean) => void
}

export function useEncounterOutOfTurn(ctx: EncounterOutOfTurnContext) {

  // ===========================================
  // Attack of Opportunity (feature-016)
  // ===========================================

  /** Detect AoO triggers for a given action */
  async function detectAoO(
    actorId: string,
    triggerType: AoOTrigger,
    context?: {
      previousPosition?: GridPosition
      newPosition?: GridPosition
      maneuverTargetIds?: string[]
      hasAdjacentTarget?: boolean
    }
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: {
          triggeredActions: OutOfTurnAction[]
          encounter: Encounter
        }
      }>(`/api/encounters/${encounter.id}/aoo-detect`, {
        method: 'POST',
        body: {
          actorId,
          triggerType,
          ...context
        }
      })
      ctx.setEncounter(response.data.encounter)
      return response.data.triggeredActions
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to detect AoO triggers')
      throw e
    }
  }

  /** Resolve a pending AoO (accept or decline) */
  async function resolveAoO(actionId: string, resolution: 'accept' | 'decline', damageRoll?: number) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: {
          encounter: Encounter
          resolution: 'accept' | 'decline'
          struggleAttack?: {
            actorId: string
            targetId: string
            damage: number
            hit: boolean
            fainted: boolean
            isDead: boolean
          }
        }
      }>(`/api/encounters/${encounter.id}/aoo-resolve`, {
        method: 'POST',
        body: { actionId, resolution, damageRoll }
      })
      ctx.setEncounter(response.data.encounter)
      return response.data
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to resolve AoO')
      throw e
    }
  }

  // ===========================================
  // Hold Action (P1 — feature-016)
  // ===========================================

  /** Declare a Hold Action for the current combatant */
  async function holdAction(combatantId: string, holdUntilInitiative: number | null) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{ data: Encounter }>(
        `/api/encounters/${encounter.id}/hold-action`,
        {
          method: 'POST',
          body: { combatantId, holdUntilInitiative }
        }
      )
      ctx.setEncounter(response.data)
      return response.data
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to hold action')
      throw e
    }
  }

  /** Release a held action (GM manual release) */
  async function releaseHold(combatantId: string) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{ data: Encounter }>(
        `/api/encounters/${encounter.id}/release-hold`,
        {
          method: 'POST',
          body: { combatantId }
        }
      )
      ctx.setEncounter(response.data)
      return response.data
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to release hold')
      throw e
    }
  }

  // ===========================================
  // Priority Action (P1 — feature-016)
  // ===========================================

  /** Declare a Priority action between turns */
  async function declarePriority(
    combatantId: string,
    variant: 'standard' | 'limited' | 'advanced',
    actionDescription?: string
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: {
          encounter: Encounter
          turnInserted: boolean
          skipNextRound: boolean
        }
      }>(`/api/encounters/${encounter.id}/priority`, {
        method: 'POST',
        body: { combatantId, variant, actionDescription }
      })
      ctx.setEncounter(response.data.encounter)
      ctx.setBetweenTurns(false)
      return response.data
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to declare Priority')
      throw e
    }
  }

  /** Enter between-turns state (Priority declaration window) */
  function enterBetweenTurns() {
    ctx.setBetweenTurns(true)
  }

  /** Exit between-turns state (GM clicks Continue) */
  function exitBetweenTurns() {
    ctx.setBetweenTurns(false)
  }

  // ===========================================
  // Interrupt Action (P1 — feature-016)
  // ===========================================

  /** Declare an Interrupt action during another combatant's turn */
  async function declareInterrupt(
    combatantId: string,
    triggerId: string,
    triggerType: InterruptTrigger,
    options?: {
      interruptAction?: string
      resolution?: 'accept' | 'decline'
      context?: {
        moveName?: string
        originalTargetId?: string
        attackerId?: string
      }
    }
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: {
          encounter: Encounter
          interruptResolved: boolean
          pendingActionId?: string
        }
      }>(`/api/encounters/${encounter.id}/interrupt`, {
        method: 'POST',
        body: {
          combatantId,
          triggerId,
          triggerType,
          interruptAction: options?.interruptAction,
          resolution: options?.resolution,
          context: options?.context
        }
      })
      ctx.setEncounter(response.data.encounter)
      return response.data
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to declare Interrupt')
      throw e
    }
  }

  // ===========================================
  // Intercept Melee/Ranged (P2 — feature-016)
  // ===========================================

  /** Execute Intercept Melee maneuver */
  async function interceptMelee(
    interceptorId: string,
    targetId: string,
    attackerId: string,
    actionId: string,
    skillCheck: number
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: {
          encounter: Encounter
          interceptSuccess: boolean
          distanceMoved: number
          dcRequired: number
          interceptorNewPosition?: GridPosition
          targetNewPosition?: GridPosition
        }
      }>(`/api/encounters/${encounter.id}/intercept-melee`, {
        method: 'POST',
        body: { interceptorId, targetId, attackerId, actionId, skillCheck }
      })
      ctx.setEncounter(response.data.encounter)
      return response.data
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to execute Intercept Melee')
      throw e
    }
  }

  /** Execute Intercept Ranged maneuver */
  async function interceptRanged(
    interceptorId: string,
    targetSquare: GridPosition,
    attackerId: string,
    actionId: string,
    skillCheck: number
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: {
          encounter: Encounter
          interceptSuccess: boolean
          distanceMoved: number
          interceptorNewPosition?: GridPosition
          reachedTarget: boolean
        }
      }>(`/api/encounters/${encounter.id}/intercept-ranged`, {
        method: 'POST',
        body: { interceptorId, targetSquare, attackerId, actionId, skillCheck }
      })
      ctx.setEncounter(response.data.encounter)
      return response.data
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to execute Intercept Ranged')
      throw e
    }
  }

  // ===========================================
  // Disengage (P2 — feature-016)
  // ===========================================

  /** Execute Disengage maneuver */
  async function disengage(combatantId: string) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: Encounter
        disengageResult: {
          combatantId: string
          combatantName: string
          disengaged: boolean
        }
      }>(`/api/encounters/${encounter.id}/disengage`, {
        method: 'POST',
        body: { combatantId }
      })
      ctx.setEncounter(response.data)
      return response.disengageResult
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to disengage')
      throw e
    }
  }

  return {
    detectAoO,
    resolveAoO,
    holdAction,
    releaseHold,
    declarePriority,
    enterBetweenTurns,
    exitBetweenTurns,
    declareInterrupt,
    interceptMelee,
    interceptRanged,
    disengage
  }
}
