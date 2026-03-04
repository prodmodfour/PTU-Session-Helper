/**
 * PTU 1.05 Vision Capability Rules
 *
 * Pure functions for Darkvision/Blindsense checks against
 * darkness-based accuracy penalties (decree-048).
 *
 * Darkvision (PTU 10-indices:65-68):
 *   "Never has their vision hampered by a loss of light.
 *    They can even see in total darkness and are never Blind
 *    or affected by Total Blindness due to low-light conditions."
 *
 * Blindsense (PTU 10-indices:37-46):
 *   "Can function even in complete darkness, as if they had Darkvision,
 *    and they can never be Blinded."
 */

import type { Combatant, EnvironmentPreset } from '~/types/encounter'

// ============================================
// TYPES
// ============================================

/**
 * Vision capabilities that negate darkness-based accuracy penalties.
 * PTU 10-indices-and-reference.md pp.37-46, 65-68.
 *
 * - 'darkvision': Negates Blindness and Total Blindness from low-light (PTU p.65-68)
 * - 'blindsense': Negates Blindness and Total Blindness; functions in complete darkness (PTU p.37-46)
 *
 * Both are functionally equivalent for darkness penalty negation.
 * The distinction matters for non-darkness effects (Flash, Illuminate)
 * which are out of scope for this feature.
 */
export type VisionCapability = 'darkvision' | 'blindsense'

/**
 * Per-combatant vision state.
 * Stored on the Combatant struct (JSON within encounter combatants blob).
 * Combat-scoped -- not persisted to entity DB records.
 */
export interface CombatantVisionState {
  /** Active vision capabilities for this combatant */
  capabilities: VisionCapability[]
  /** Source of each capability: 'manual' (GM toggle), 'species' (auto-detected), 'equipment' (goggles) */
  sources: Record<VisionCapability, VisionCapabilitySource>
}

export type VisionCapabilitySource = 'manual' | 'species' | 'equipment'

// ============================================
// CONSTANTS
// ============================================

/** Preset IDs whose accuracy penalties are negated by Darkvision/Blindsense */
export const DARKNESS_PRESET_IDS = ['dim-cave', 'dark-cave'] as const

/** All vision capabilities */
export const ALL_VISION_CAPABILITIES: VisionCapability[] = ['darkvision', 'blindsense']

/** Display labels */
export const VISION_CAPABILITY_LABELS: Record<VisionCapability, string> = {
  darkvision: 'Darkvision',
  blindsense: 'Blindsense'
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Check if a preset's accuracy penalties are darkness-based
 * and therefore negatable by vision capabilities.
 *
 * Only canonical darkness presets (dim-cave, dark-cave) qualify.
 * Custom presets with accuracy penalties are NOT auto-negated.
 */
export function isDarknessBasedPreset(presetId: string): boolean {
  return (DARKNESS_PRESET_IDS as readonly string[]).includes(presetId)
}

/**
 * Check if a combatant has any vision capability.
 */
export function hasVisionCapability(combatant: Combatant): boolean {
  return (combatant.visionState?.capabilities?.length ?? 0) > 0
}

/**
 * Check if a combatant has a specific vision capability.
 */
export function hasSpecificVision(
  combatant: Combatant,
  capability: VisionCapability
): boolean {
  return combatant.visionState?.capabilities?.includes(capability) ?? false
}

/**
 * Calculate the effective environment accuracy penalty for the attacker,
 * accounting for their vision capabilities.
 *
 * The penalty applies to the ATTACKER (the one rolling accuracy).
 * A combatant with Darkvision sees in darkness and is not penalized.
 *
 * @param preset - Active environment preset (null = no preset)
 * @param attackerVisionState - Attacker's vision capabilities
 * @returns Total accuracy penalty after vision negation
 */
export function getEffectiveEnvironmentPenalty(
  preset: EnvironmentPreset | null | undefined,
  attackerVisionState: CombatantVisionState | undefined
): number {
  if (!preset) return 0

  let penalty = 0
  for (const effect of preset.effects) {
    if (effect.type !== 'accuracy_penalty' || !effect.accuracyPenalty) continue

    // Check if this penalty is darkness-based and negatable
    if (isDarknessBasedPreset(preset.id) && attackerVisionState?.capabilities?.length) {
      // Any vision capability (Darkvision or Blindsense) negates darkness penalties
      // per PTU RAW: both fully negate Blindness and Total Blindness from darkness
      continue // Skip this penalty -- negated by vision
    }

    penalty += effect.accuracyPenalty
  }

  return penalty
}
