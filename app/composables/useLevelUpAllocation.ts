/**
 * Composable for managing Pokemon level-up stat allocation,
 * ability assignment, and move learning.
 *
 * Provides reactive state for:
 * - Current stat point allocation (extracted from Pokemon data)
 * - Unallocated points remaining
 * - Which stats are valid targets for the next point
 * - Base Relations validation result
 * - Allocation submission
 * - Ability milestone detection (Level 20/40)
 * - New moves available from learnset
 * - Overall pending actions tracking
 *
 * PTU Core p.198: Base Relations Rule
 * PTU Core p.198: Stat point budget = level + 10
 * PTU Core p.200: Level 20 = Second Ability, Level 40 = Third Ability
 * PTU Core p.200: Max 6 moves
 */

import type { Ref } from 'vue'
import type { Pokemon } from '~/types'
import type { Stats } from '~/types/character'
import {
  extractStatPoints,
  validateBaseRelations,
  getValidAllocationTargets,
  STAT_KEYS
} from '~/utils/baseRelations'
import type { BaseRelationsValidation } from '~/utils/baseRelations'

/** Zero-value stats constant for initialization */
function zeroStats(): Stats {
  return { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 }
}

export function useLevelUpAllocation(pokemonRef: Ref<Pokemon | null>) {
  // --- State ---
  const pendingAllocation = ref<Stats>(zeroStats())
  const isAllocating = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)

  // --- Computed ---

  /** Nature-adjusted base stats (from the Pokemon record's baseStats field) */
  const natureAdjustedBase = computed((): Stats | null => {
    if (!pokemonRef.value) return null
    return pokemonRef.value.baseStats
  })

  /** Current stat points already allocated (extracted from DB state) */
  const currentExtraction = computed(() => {
    if (!pokemonRef.value) return null
    return extractStatPoints(pokemonRef.value)
  })

  /** Total points that should be allocated at current level (level + 10) */
  const statBudget = computed(() => {
    if (!pokemonRef.value) return 0
    return pokemonRef.value.level + 10
  })

  /** Points allocated so far (existing + pending) */
  const totalAllocated = computed(() => {
    if (!currentExtraction.value) return 0
    const existing = currentExtraction.value.totalAllocated
    const pending = STAT_KEYS.reduce(
      (sum, key) => sum + pendingAllocation.value[key], 0
    )
    return existing + pending
  })

  /** Unallocated points remaining */
  const unallocatedPoints = computed(() => {
    return statBudget.value - totalAllocated.value
  })

  /** Combined allocation (existing + pending) for validation */
  const combinedAllocation = computed((): Stats => {
    if (!currentExtraction.value) return zeroStats()
    const existing = currentExtraction.value.statPoints
    return {
      hp: existing.hp + pendingAllocation.value.hp,
      attack: existing.attack + pendingAllocation.value.attack,
      defense: existing.defense + pendingAllocation.value.defense,
      specialAttack: existing.specialAttack + pendingAllocation.value.specialAttack,
      specialDefense: existing.specialDefense + pendingAllocation.value.specialDefense,
      speed: existing.speed + pendingAllocation.value.speed
    }
  })

  /** Base Relations validation of the combined allocation */
  const validation = computed((): BaseRelationsValidation | null => {
    if (!natureAdjustedBase.value) return null
    return validateBaseRelations(natureAdjustedBase.value, combinedAllocation.value)
  })

  /** Which stats can receive the next point */
  const validTargets = computed((): Record<keyof Stats, boolean> => {
    const allFalse = { hp: false, attack: false, defense: false, specialAttack: false, specialDefense: false, speed: false }
    if (!natureAdjustedBase.value || unallocatedPoints.value <= 0) {
      return allFalse
    }
    return getValidAllocationTargets(natureAdjustedBase.value, combinedAllocation.value)
  })

  // --- Actions ---

  /** Start the allocation workflow */
  function startAllocation() {
    pendingAllocation.value = zeroStats()
    isAllocating.value = true
    error.value = null
  }

  /** Add one stat point to a stat */
  function allocatePoint(stat: keyof Stats) {
    if (!validTargets.value[stat] || unallocatedPoints.value <= 0) return
    pendingAllocation.value = {
      ...pendingAllocation.value,
      [stat]: pendingAllocation.value[stat] + 1
    }
  }

  /** Remove one pending stat point from a stat */
  function deallocatePoint(stat: keyof Stats) {
    if (pendingAllocation.value[stat] <= 0) return
    pendingAllocation.value = {
      ...pendingAllocation.value,
      [stat]: pendingAllocation.value[stat] - 1
    }
  }

  /** Reset pending allocation to zero */
  function resetAllocation() {
    pendingAllocation.value = zeroStats()
  }

  /** Submit the allocation to the server */
  async function submitAllocation(): Promise<boolean> {
    if (!pokemonRef.value) return false
    isSaving.value = true
    error.value = null

    try {
      await $fetch(`/api/pokemon/${pokemonRef.value.id}/allocate-stats`, {
        method: 'POST',
        body: { statPoints: combinedAllocation.value }
      })
      isAllocating.value = false
      pendingAllocation.value = zeroStats()
      return true
    } catch (e: unknown) {
      const fetchError = e as { data?: { message?: string } }
      error.value = fetchError.data?.message || 'Failed to allocate stat points'
      return false
    } finally {
      isSaving.value = false
    }
  }

  /** Cancel allocation and reset */
  function cancelAllocation() {
    isAllocating.value = false
    resetAllocation()
    error.value = null
  }

  // --- Ability Milestone State (P1) ---

  /** Check if an ability milestone is pending */
  const pendingAbilityMilestone = computed((): 'second' | 'third' | null => {
    if (!pokemonRef.value) return null
    const abilities = pokemonRef.value.abilities || []
    if (pokemonRef.value.level >= 40 && abilities.length < 3) return 'third'
    if (pokemonRef.value.level >= 20 && abilities.length < 2) return 'second'
    return null
  })

  // --- Move Learning State (P1) ---

  /** New moves available from learnset at the current level */
  const pendingNewMoves = ref<string[]>([])

  /** Fetch learnset moves for the current level from the server */
  async function checkNewMoves() {
    if (!pokemonRef.value) return
    try {
      const response = await $fetch<{
        success: boolean
        data: { allNewMoves?: string[] }
      }>(`/api/pokemon/${pokemonRef.value.id}/level-up-check`, {
        method: 'POST',
        body: { targetLevel: pokemonRef.value.level }
      })
      if (response.success) {
        pendingNewMoves.value = response.data.allNewMoves || []
      }
    } catch {
      pendingNewMoves.value = []
    }
  }

  /** Whether the full level-up workflow has pending actions */
  const hasPendingActions = computed(() => {
    return unallocatedPoints.value > 0 ||
           pendingAbilityMilestone.value !== null ||
           pendingNewMoves.value.length > 0
  })

  return {
    // State
    pendingAllocation: readonly(pendingAllocation),
    isAllocating: readonly(isAllocating),
    isSaving: readonly(isSaving),
    error: readonly(error),

    // Computed
    natureAdjustedBase,
    currentExtraction,
    statBudget,
    totalAllocated,
    unallocatedPoints,
    combinedAllocation,
    validation,
    validTargets,

    // Actions
    startAllocation,
    allocatePoint,
    deallocatePoint,
    resetAllocation,
    submitAllocation,
    cancelAllocation,

    // Ability Milestone (P1)
    pendingAbilityMilestone,

    // Move Learning (P1)
    pendingNewMoves: readonly(pendingNewMoves),
    checkNewMoves,

    // Overall status
    hasPendingActions
  }
}
