/**
 * Weather Automation Service
 * Pure functions for weather effect processing at turn start.
 *
 * PTU pp.341-342: Hail and Sandstorm deal 1 Tick of HP damage
 * at the beginning of a Pokemon's turn. Type and ability immunities apply.
 *
 * A Tick = 1/10th max HP (PTU p.246), minimum 1.
 */

import type { Combatant } from '~/types'
import type { Pokemon, HumanCharacter } from '~/types/character'
import {
  isDamagingWeather,
  isImmuneToWeatherDamage
} from '~/utils/weatherRules'
import { calculateTickDamage } from '~/server/services/status-automation.service'

// ============================================
// TYPES
// ============================================

export interface WeatherTickResult {
  combatantId: string
  combatantName: string
  weather: string
  effect: 'damage' | 'immune'
  amount: number
  formula: string
  newHp: number
  injuryGained: boolean
  fainted: boolean
  immuneReason?: string
  immuneAbility?: string
}

// ============================================
// PURE FUNCTIONS
// ============================================

/**
 * Determine if a combatant should take weather damage at turn start,
 * and if so, calculate the amount.
 *
 * Returns null if no weather is active or weather is non-damaging.
 * Returns a WeatherTickResult with effect='immune' if combatant is immune.
 * Returns a WeatherTickResult with effect='damage' and the amount to apply.
 *
 * NOTE: This function does NOT apply the damage. The caller (next-turn endpoint)
 * uses combatant.service.calculateDamage + applyDamageToEntity for that.
 */
export function getWeatherTickForCombatant(
  combatant: Combatant,
  weather: string | null | undefined,
  allCombatants: Combatant[]
): { shouldApply: boolean; tick: WeatherTickResult | null } {
  // No weather or non-damaging weather: nothing to do
  if (!weather || !isDamagingWeather(weather)) {
    return { shouldApply: false, tick: null }
  }

  // Skip if combatant is fainted
  if (combatant.entity.currentHp <= 0) {
    return { shouldApply: false, tick: null }
  }

  const name = combatant.type === 'pokemon'
    ? (combatant.entity as Pokemon).nickname || (combatant.entity as Pokemon).species
    : (combatant.entity as HumanCharacter).name

  // Check immunity
  const immunity = isImmuneToWeatherDamage(combatant, weather, allCombatants)

  if (immunity.immune) {
    return {
      shouldApply: false,
      tick: {
        combatantId: combatant.id,
        combatantName: name,
        weather,
        effect: 'immune',
        amount: 0,
        formula: `Immune (${immunity.reason}: ${immunity.detail})`,
        newHp: combatant.entity.currentHp,
        injuryGained: false,
        fainted: false,
        immuneReason: immunity.reason,
        immuneAbility: immunity.detail
      }
    }
  }

  // Calculate weather tick damage
  const tickDamage = calculateTickDamage(combatant.entity.maxHp)
  const weatherLabel = weather === 'hail' ? 'Hail' : 'Sandstorm'

  return {
    shouldApply: true,
    tick: {
      combatantId: combatant.id,
      combatantName: name,
      weather,
      effect: 'damage',
      amount: tickDamage,
      formula: `${weatherLabel}: 1/10 max HP (${tickDamage})`,
      // newHp, injuryGained, fainted will be filled by the caller after applying damage
      newHp: 0,
      injuryGained: false,
      fainted: false
    }
  }
}
