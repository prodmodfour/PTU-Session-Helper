import { getRestHealingInfo, type RestHealingInfo } from '~/utils/restHealing'

interface RestResult {
  success: boolean
  message: string
  data: any
}

export function useRestHealing() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Apply 30 minutes of rest
   */
  async function rest(type: 'pokemon' | 'character', id: string): Promise<RestResult | null> {
    loading.value = true
    error.value = null

    try {
      const endpoint = type === 'pokemon'
        ? `/api/pokemon/${id}/rest`
        : `/api/characters/${id}/rest`

      const result = await $fetch<RestResult>(endpoint, { method: 'POST' })
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to rest'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply extended rest (4+ hours)
   */
  async function extendedRest(type: 'pokemon' | 'character', id: string): Promise<RestResult | null> {
    loading.value = true
    error.value = null

    try {
      const endpoint = type === 'pokemon'
        ? `/api/pokemon/${id}/extended-rest`
        : `/api/characters/${id}/extended-rest`

      const result = await $fetch<RestResult>(endpoint, { method: 'POST' })
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to apply extended rest'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Apply Pokemon Center healing
   */
  async function pokemonCenter(type: 'pokemon' | 'character', id: string): Promise<RestResult | null> {
    loading.value = true
    error.value = null

    try {
      const endpoint = type === 'pokemon'
        ? `/api/pokemon/${id}/pokemon-center`
        : `/api/characters/${id}/pokemon-center`

      const result = await $fetch<RestResult>(endpoint, { method: 'POST' })
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to apply Pokemon Center healing'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Heal one injury (natural or by draining AP)
   */
  async function healInjury(
    type: 'pokemon' | 'character',
    id: string,
    method: 'natural' | 'drain_ap' = 'natural'
  ): Promise<RestResult | null> {
    loading.value = true
    error.value = null

    try {
      const endpoint = type === 'pokemon'
        ? `/api/pokemon/${id}/heal-injury`
        : `/api/characters/${id}/heal-injury`

      const result = await $fetch<RestResult>(endpoint, {
        method: 'POST',
        body: { method }
      })
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to heal injury'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Get rest healing info for display
   */
  function getHealingInfo(params: {
    maxHp: number
    injuries: number
    restMinutesToday: number
    lastInjuryTime: Date | string | null
    injuriesHealedToday: number
  }): RestHealingInfo {
    return getRestHealingInfo({
      ...params,
      lastInjuryTime: params.lastInjuryTime ? new Date(params.lastInjuryTime) : null
    })
  }

  /**
   * Format rest minutes as hours and minutes
   */
  function formatRestTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  /**
   * Reset daily counters for a single Pokemon or Character (new day)
   */
  async function newDay(type: 'pokemon' | 'character', id: string): Promise<RestResult | null> {
    loading.value = true
    error.value = null

    try {
      const endpoint = type === 'pokemon'
        ? `/api/pokemon/${id}/new-day`
        : `/api/characters/${id}/new-day`

      const result = await $fetch<RestResult>(endpoint, { method: 'POST' })
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to reset daily counters'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Reset daily counters for ALL Pokemon and Characters (global new day)
   */
  async function newDayGlobal(): Promise<RestResult | null> {
    loading.value = true
    error.value = null

    try {
      const result = await $fetch<RestResult>('/api/game/new-day', { method: 'POST' })
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to advance day'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    rest,
    extendedRest,
    pokemonCenter,
    healInjury,
    getHealingInfo,
    formatRestTime,
    newDay,
    newDayGlobal
  }
}
