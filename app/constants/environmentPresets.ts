/**
 * Built-in PTU Environment Presets (P2: ptu-rule-058)
 *
 * These are constant definitions — not DB rows. The GM selects
 * a preset during encounter setup and it is stored as JSON on
 * the Encounter record. Custom presets can be created ad-hoc.
 *
 * PTU rule sources:
 *   - Dark Cave: 07-combat.md Blindness (p.1693-1701), Darkvision/Blindsense
 *   - Frozen Lake: 07-combat.md Slow/Rough Terrain (p.475-481), weight/ice rules
 *   - Hazard Factory: GM-defined interactive machinery and hazard zones
 */

import type { EnvironmentPreset } from '~/types/encounter'

/**
 * Dark Cave — Accuracy penalty in darkness; requires Darkvision,
 * Blindsense, or a light source to see. PTU p.1693-1701:
 * Blindness gives -6 accuracy; Darkvision/Blindsense negates.
 * Simplified to -2 per unilluminated meter distance.
 */
export const DARK_CAVE_PRESET: EnvironmentPreset = {
  id: 'dark-cave',
  name: 'Dark Cave',
  description:
    'Accuracy -2 per unilluminated meter between attacker and target. ' +
    'Requires Darkvision, Blindsense, or a light source (Burst 2/3/4 depending on size). ' +
    'Pokemon with the Illuminate ability extend light radius by +1 burst.',
  effects: [
    {
      type: 'accuracy_penalty',
      accuracyPenaltyPerMeter: -2
    },
    {
      type: 'custom',
      customRule:
        'Darkvision and Blindsense negate darkness penalties. ' +
        'Light sources illuminate Burst 2 (small), Burst 3 (medium), or Burst 4 (large). ' +
        'Illuminate ability: +1 Burst radius to any light source the Pokemon is near.'
    }
  ]
}

/**
 * Frozen Lake — Ice/arctic environment with weight-class breakage,
 * slow terrain, and hazardous water entry.
 * PTU 07-combat.md Slow Terrain (p.475-476), weight class rules.
 */
export const FROZEN_LAKE_PRESET: EnvironmentPreset = {
  id: 'frozen-lake',
  name: 'Frozen Lake',
  description:
    'Weight class 5+ breaks ice. All ice squares are Slow Terrain. ' +
    'Acrobatics check (DC 10) on injury or become Tripped. ' +
    'Falling into water: take hail-equivalent damage per turn, Speed -1 CS.',
  effects: [
    {
      type: 'terrain_override',
      terrainRules: {
        weightClassBreak: 5,
        slowTerrain: true,
        acrobaticsOnInjury: true
      }
    },
    {
      type: 'status_trigger',
      statusOnEntry: {
        terrain: 'water',
        effect: 'hail_damage_per_turn',
        stagePenalty: { stat: 'speed', stages: -1 }
      }
    }
  ]
}

/**
 * Hazard Factory — Industrial/mechanical environment with
 * GM-defined interactive elements and electric/fire hazards.
 * Entirely freeform; the preset provides structure for the GM
 * to define custom hazard zones.
 */
export const HAZARD_FACTORY_PRESET: EnvironmentPreset = {
  id: 'hazard-factory',
  name: 'Hazard Factory',
  description:
    'Interactive machinery and hazard zones. GM defines specific ' +
    'machinery damage zones, electric hazards, and interactive elements. ' +
    'Use terrain painting to mark hazard areas on the VTT grid.',
  effects: [
    {
      type: 'custom',
      customRule:
        'Machinery Damage Zones: GM marks areas on the grid that deal ' +
        'damage (suggested: DB 5-10) to any combatant ending their turn in them.'
    },
    {
      type: 'custom',
      customRule:
        'Electric Hazards: Conductive surfaces or exposed wiring. ' +
        'Water-type and Steel-type Pokemon take +5 DB damage from electric hazard zones.'
    },
    {
      type: 'custom',
      customRule:
        'Interactive Elements: Levers, conveyor belts, pressure plates. ' +
        'GM determines specific interactions as a Standard Action.'
    }
  ]
}

/**
 * All built-in presets, indexed by ID for quick lookup.
 */
export const BUILT_IN_PRESETS: Record<string, EnvironmentPreset> = {
  'dark-cave': DARK_CAVE_PRESET,
  'frozen-lake': FROZEN_LAKE_PRESET,
  'hazard-factory': HAZARD_FACTORY_PRESET
}

/**
 * Built-in preset IDs in display order.
 */
export const BUILT_IN_PRESET_IDS = ['dark-cave', 'frozen-lake', 'hazard-factory'] as const

/**
 * Labels for the preset selector dropdown.
 */
export const PRESET_LABELS: Record<string, string> = {
  'dark-cave': 'Dark Cave',
  'frozen-lake': 'Frozen Lake',
  'hazard-factory': 'Hazard Factory'
}
