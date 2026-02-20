import { defineStore } from 'pinia'
import type { Encounter, StatusCondition } from '~/types'

/**
 * Store for PTU combat-related API calls.
 * Handles status conditions, combat stages, injuries, and special actions.
 */
export const useEncounterCombatStore = defineStore('encounterCombat', {
  actions: {
    // ===========================================
    // Status Condition Management
    // ===========================================

    /**
     * Add status condition to a combatant
     */
    async addStatusCondition(encounterId: string, combatantId: string, condition: StatusCondition) {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/status`, {
        method: 'POST',
        body: { combatantId, add: [condition] }
      })
      return response.data
    },

    /**
     * Remove status condition from a combatant
     */
    async removeStatusCondition(encounterId: string, combatantId: string, condition: StatusCondition) {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/status`, {
        method: 'POST',
        body: { combatantId, remove: [condition] }
      })
      return response.data
    },

    /**
     * Update status conditions (bulk add/remove)
     */
    async updateStatusConditions(
      encounterId: string,
      combatantId: string,
      add: StatusCondition[] = [],
      remove: StatusCondition[] = []
    ) {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/status`, {
        method: 'POST',
        body: { combatantId, add, remove }
      })
      return response.data
    },

    // ===========================================
    // Combat Stage Management
    // ===========================================

    /**
     * Modify combat stage for a combatant (delta change)
     */
    async modifyStage(encounterId: string, combatantId: string, stat: string, amount: number) {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/stages`, {
        method: 'POST',
        body: { combatantId, changes: { [stat]: amount } }
      })
      return response.data
    },

    /**
     * Set combat stages (absolute or relative values)
     */
    async setCombatStages(
      encounterId: string,
      combatantId: string,
      stages: Record<string, number>,
      absolute: boolean = true
    ) {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/stages`, {
        method: 'POST',
        body: { combatantId, changes: stages, absolute }
      })
      return response.data
    },

    // ===========================================
    // Injury Management
    // ===========================================

    /**
     * Add injury to a combatant
     */
    async addInjury(encounterId: string, combatantId: string, source: string) {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/injury`, {
        method: 'POST',
        body: { combatantId, source }
      })
      return response.data
    },

    /**
     * Remove injury from a combatant (healing)
     */
    async removeInjury(encounterId: string, combatantId: string) {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/injury`, {
        method: 'DELETE',
        body: { combatantId }
      })
      return response.data
    },

    // ===========================================
    // Special Actions
    // ===========================================

    /**
     * Take a Breather - Full Action that resets stages, removes temp HP, cures volatile status
     */
    async takeABreather(encounterId: string, combatantId: string) {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/breather`, {
        method: 'POST',
        body: { combatantId }
      })
      return response.data
    },

    /**
     * Sprint - Standard Action that adds +50% movement speed until next turn
     */
    async sprint(encounterId: string, combatantId: string) {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/sprint`, {
        method: 'POST',
        body: { combatantId }
      })
      return response.data
    },

    // ===========================================
    // League Battle Phase Management
    // ===========================================

    /**
     * Set battle phase (trainer or pokemon)
     */
    async setPhase(encounterId: string, phase: 'trainer' | 'pokemon') {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/phase`, {
        method: 'POST',
        body: { phase }
      })
      return response.data
    },

    // ===========================================
    // Scene Management
    // ===========================================

    /**
     * Advance to next scene (reset scene-frequency moves)
     */
    async nextScene(encounterId: string) {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounterId}/next-scene`, {
        method: 'POST'
      })
      return response.data
    }
  }
})
