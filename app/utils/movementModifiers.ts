/**
 * Movement modifier calculations for PTU combat.
 *
 * Extracted to a shared utility so both client-side composables
 * and server-side services can apply movement modifiers consistently.
 *
 * PTU Rules & Application Order:
 * 1. Stuck: cannot Shift at all — effective speed 0 (PTU 1.05 p.231)
 * 2. Tripped: must spend Shift Action to stand up — effective speed 0 (PTU 1.05 p.251)
 * 3. Speed CS: additive bonus/penalty of half stage value (PTU 1.05 p.234), min 2
 *    — The floor of 2 is specific to the CS reduction itself (PTU 1.05 p.700)
 * 4. Slowed: halve movement speed, minimum 1 (PTU 1.05 p.1718)
 * 5. Thermosensitive: halve movement in Hail (PTU p.331)
 * 6. Sprint (tempCondition): +50% movement speed for the turn
 *
 * Speed CS is applied BEFORE Slowed so that Slowed can meaningfully reduce
 * speed below the CS floor of 2. The CS floor only prevents CS penalties
 * from reducing below 2; conditions like Slowed operate independently.
 */

import type { Combatant } from '~/types/encounter'
import { getCombatantAbilities } from '~/utils/weatherRules'

/**
 * Apply movement-modifying conditions and combat stage effects to base speed.
 *
 * Exported as a pure function for use in both client composables and server services.
 *
 * @param combatant - The combatant whose conditions affect the speed
 * @param speed - The base speed to modify
 * @param weather - Optional encounter weather (P2: Thermosensitive halves movement in Hail)
 * @returns The modified speed after applying all movement conditions
 */
export function applyMovementModifiers(combatant: Combatant, speed: number, weather?: string | null): number {
  let modifiedSpeed = speed
  const conditions = combatant.entity.statusConditions ?? []
  const tempConditions = combatant.tempConditions ?? []

  // Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
  if (conditions.includes('Stuck')) {
    return 0
  }

  // Tripped: must spend Shift Action to stand up before moving (PTU 1.05 p.251)
  if (conditions.includes('Tripped') || tempConditions.includes('Tripped')) {
    return 0
  }

  // Speed Combat Stage modifier (-6 to +6): additive bonus/penalty
  // PTU 1.05 p.234: "bonus or penalty to all Movement Speeds equal to
  // half your current Speed Combat Stage value rounded down"
  // Applied BEFORE conditions so Slowed/Thermosensitive can reduce below CS floor.
  const speedStage = combatant.entity.stageModifiers?.speed ?? 0
  if (speedStage !== 0) {
    const clamped = Math.max(-6, Math.min(6, speedStage))
    const stageBonus = Math.trunc(clamped / 2)
    modifiedSpeed = modifiedSpeed + stageBonus
    // PTU 1.05 p.700: negative CS may never reduce movement below 2
    if (stageBonus < 0) {
      modifiedSpeed = Math.max(modifiedSpeed, 2)
    }
  }

  // Slowed: halve movement speed (PTU 1.05 p.1718: "Movement halved (minimum 1)")
  // Applied AFTER Speed CS so it can meaningfully reduce speed below CS floor of 2.
  if (conditions.includes('Slowed')) {
    modifiedSpeed = Math.floor(modifiedSpeed / 2)
  }

  // P2: Thermosensitive movement halving in Hail (PTU p.331)
  // "While Hailing, the user's movement capabilities are reduced by half."
  if (weather === 'hail') {
    const abilities = getCombatantAbilities(combatant)
    if (abilities.some(a => a.toLowerCase() === 'thermosensitive')) {
      modifiedSpeed = Math.floor(modifiedSpeed / 2)
    }
  }

  // Sprint: +50% movement speed for the turn (tracked as tempCondition)
  if (tempConditions.includes('Sprint')) {
    modifiedSpeed = Math.floor(modifiedSpeed * 1.5)
  }

  // Minimum speed is 1 (can always move at least 1 cell unless at 0)
  return Math.max(modifiedSpeed, speed > 0 ? 1 : 0)
}
