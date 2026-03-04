/**
 * Living Weapon Abilities Service
 *
 * Soulstealer, Weaponize, No Guard suppression, and
 * Aegislash Blade Forme management for Living Weapon Pokemon.
 *
 * PTU pp.305-306: Living Weapon ability interactions.
 *
 * Extracted from living-weapon.service.ts for file size compliance (C1).
 */

import type { Combatant } from '~/types/encounter'
import type { WieldRelationship } from '~/types/combat'
import type { Pokemon } from '~/types/character'

// ============================================================
// P2: No Guard Ability Suppression (Section K -- PTU p.306)
// ============================================================

/**
 * Check if a Pokemon's No Guard ability is currently active.
 * No Guard is suppressed while the Pokemon is wielded as a Living Weapon.
 *
 * PTU p.306: "While Wielded, a Living Weapon cannot benefit from
 * its No Guard Ability."
 */
export function isNoGuardActive(
  combatant: Combatant,
  wieldRelationships: WieldRelationship[]
): boolean {
  if (combatant.type !== 'pokemon') return false

  const pokemon = combatant.entity as Pokemon
  const hasNoGuard = pokemon.abilities?.some(
    (a: { name: string }) => a.name === 'No Guard'
  ) ?? false
  if (!hasNoGuard) return false

  // Suppressed while wielded
  const isCurrentlyWielded = wieldRelationships.some(
    r => r.weaponId === combatant.id
  )
  return !isCurrentlyWielded
}

/**
 * Check if a target's opponent has No Guard active, granting +3 to
 * attack rolls against the No Guard user.
 *
 * Per decree-046: No Guard uses playtest +3/-3 flat accuracy version.
 * +3 bonus to all Attack Rolls for the user, AND +3 bonus to all
 * Attack Rolls against the user.
 *
 * @param target - The target combatant being attacked
 * @param wieldRelationships - Current wield relationships (for suppression check)
 * @returns true if the target has active No Guard (attacker gets +3 bonus)
 */
export function targetHasNoGuard(
  target: Combatant,
  wieldRelationships: WieldRelationship[]
): boolean {
  return isNoGuardActive(target, wieldRelationships)
}

// ============================================================
// P2: Aegislash Forced Blade Forme (Section L -- PTU p.306)
// ============================================================

/**
 * Swap Aegislash between Shield Stance and Sword Stance (Blade forme).
 * Swaps Attack<->Defense and SpAtk<->SpDef in currentStats.
 *
 * Returns a new Pokemon entity (immutable).
 */
export function swapAegislashStance(pokemon: Pokemon): Pokemon {
  const stats = pokemon.currentStats
  return {
    ...pokemon,
    currentStats: {
      ...stats,
      attack: stats.defense,
      defense: stats.attack,
      specialAttack: stats.specialDefense,
      specialDefense: stats.specialAttack,
    },
  }
}

/**
 * Check if an Aegislash is currently in Blade forme (Sword Stance).
 * Heuristic: Blade forme has higher Attack than Defense.
 */
export function isAegislashBladeForm(pokemon: Pokemon): boolean {
  return pokemon.currentStats.attack > pokemon.currentStats.defense
}

// ============================================================
// P2: Weaponize Ability -- Free Action Intercept (Section M)
// ============================================================

/**
 * Check if a Pokemon can use Weaponize to intercept for its wielder.
 *
 * PTU p.2874-2878: "While being wielded as a Living Weapon and being
 * actively Commanded as a Pokemon, the user may Intercept for its
 * Wielder as a Free Action."
 *
 * Requirements:
 * 1. The Pokemon has the Weaponize ability
 * 2. The Pokemon is currently wielded as a Living Weapon
 * 3. The Pokemon is NOT fainted (must be "actively commanded")
 */
export function canUseWeaponize(
  combatant: Combatant,
  wieldRelationships: WieldRelationship[]
): boolean {
  if (combatant.type !== 'pokemon') return false

  const pokemon = combatant.entity as Pokemon
  const hasWeaponize = pokemon.abilities?.some(
    (a: { name: string }) => a.name === 'Weaponize'
  ) ?? false
  if (!hasWeaponize) return false

  // Must be wielded
  const relationship = wieldRelationships.find(
    r => r.weaponId === combatant.id
  )
  if (!relationship) return false

  // Must not be fainted (PTU: "actively Commanded")
  if (relationship.isFainted) return false

  return true
}

// ============================================================
// P2: Soulstealer Ability -- Heal on Faint/Kill (Section N)
// ============================================================

/**
 * Check if Soulstealer should trigger after a faint.
 *
 * PTU p.2417-2423:
 * - Scene frequency, Free Action
 * - Trigger: the user's attack causes a foe to Faint
 * - Effect: remove 1 Injury + heal 25% max HP
 * - If the attack killed: full heal + remove all Injuries
 *
 * Now enforces scene frequency (M3): checks combatant.featureUsage
 * to ensure Soulstealer has not already been used this scene.
 *
 * Returns trigger info if Soulstealer should fire, null otherwise.
 */
export function checkSoulstealer(
  attacker: Combatant,
  targetFainted: boolean
): { triggered: boolean; isKill: boolean } | null {
  if (!targetFainted) return null
  if (attacker.type !== 'pokemon') return null

  const pokemon = attacker.entity as Pokemon
  const hasSoulstealer = pokemon.abilities?.some(
    (a: { name: string }) => a.name === 'Soulstealer'
  ) ?? false
  if (!hasSoulstealer) return null

  // M3: Enforce scene frequency (once per scene per PTU rules)
  const usage = attacker.featureUsage?.['Soulstealer']
  if (usage && usage.usedThisScene >= usage.maxPerScene) {
    return null
  }

  // Kill detection is deferred to GM input (PTU kill rules are
  // complex and GM-adjudicated). For now, all faints are non-kill.
  return { triggered: true, isKill: false }
}

/**
 * Apply Soulstealer healing to the attacker.
 * - Faint (non-kill): remove 1 Injury + heal 25% max HP
 * - Kill: remove all Injuries + full heal
 *
 * **Mutation note (M2):** This function mutates `combatant.entity` in place,
 * following the same mutation pattern used by `applyDamageToEntity` in
 * `combatant.service.ts` and `damage.post.ts`. The caller is responsible
 * for persisting changes to the database via `syncEntityToDatabase`.
 *
 * Also records Soulstealer usage in combatant.featureUsage (M3).
 *
 * Returns info about the healing applied.
 */
export function applySoulstealerHealing(
  combatant: Combatant,
  isKill: boolean
): { hpHealed: number; injuriesRemoved: number } {
  const entity = combatant.entity
  const maxHp = entity.maxHp

  // M3: Record usage for scene frequency tracking
  const currentUsage = combatant.featureUsage ?? {}
  const soulstealerUsage = currentUsage['Soulstealer'] ?? { usedThisScene: 0, maxPerScene: 1 }
  combatant.featureUsage = {
    ...currentUsage,
    Soulstealer: {
      usedThisScene: soulstealerUsage.usedThisScene + 1,
      maxPerScene: 1,
    },
  }

  if (isKill) {
    const hpHealed = maxHp - entity.currentHp
    const injuriesRemoved = entity.injuries || 0
    entity.currentHp = maxHp
    entity.injuries = 0
    return { hpHealed, injuriesRemoved }
  } else {
    const healAmount = Math.floor(maxHp * 0.25)
    const hpHealed = Math.min(healAmount, maxHp - entity.currentHp)
    entity.currentHp = Math.min(maxHp, entity.currentHp + healAmount)
    const injuriesRemoved = entity.injuries > 0 ? 1 : 0
    entity.injuries = Math.max(0, (entity.injuries || 0) - 1)
    return { hpHealed, injuriesRemoved }
  }
}
