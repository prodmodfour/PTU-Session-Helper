/**
 * Naturewalk terrain mapping constants.
 *
 * PTU p.322: "Naturewalk is always listed with Terrain types in parentheses,
 * such as Naturewalk (Forest and Grassland). Pokemon with Naturewalk treat
 * all listed terrains as Basic Terrain."
 *
 * Basic Terrain = no movement cost modifier (no slow penalty), no accuracy
 * penalty (no rough penalty).
 *
 * This file maps PTU Naturewalk terrain names to the app's terrain painter
 * base types. When a combatant has a Naturewalk that matches a cell's base
 * terrain type, the rough and slow flags on that cell are bypassed.
 *
 * Per decree-003: enemy-occupied rough terrain is a game mechanic (not painted
 * terrain) and is NEVER bypassed by Naturewalk.
 *
 * Terrain list from PTU Survivalist class (p.4694):
 * Grassland, Forest, Wetlands, Ocean, Tundra, Mountain, Cave, Urban, Desert
 */

import type { TerrainType } from '~/types'

/**
 * PTU Naturewalk terrain category — the names that appear in parentheses
 * after "Naturewalk" in capability lists.
 */
export type NaturewalkTerrain =
  | 'Grassland'
  | 'Forest'
  | 'Wetlands'
  | 'Ocean'
  | 'Tundra'
  | 'Mountain'
  | 'Cave'
  | 'Urban'
  | 'Desert'

/**
 * Mapping from PTU Naturewalk terrain names to the app's base terrain types.
 *
 * Because the terrain painter uses generic base types (normal, water, earth,
 * elevated) without PTU terrain categories, multiple Naturewalk types map to
 * the same base types. This is a known limitation — the GM must set up terrain
 * appropriately for the encounter's environment.
 *
 * The mapping represents: "cells with this base type COULD be this PTU terrain."
 * When Naturewalk matches, the rough/slow flags on those cells are bypassed.
 *
 * - Grassland, Forest, Tundra, Desert, Urban: normal terrain with flags
 * - Ocean, Wetlands: water terrain (and normal for wetland edges)
 * - Mountain: elevated terrain (and normal for foothills)
 * - Cave: earth terrain (and normal for cave floors)
 */
export const NATUREWALK_TERRAIN_MAP: Record<NaturewalkTerrain, ReadonlyArray<TerrainType>> = {
  Grassland: ['normal'],
  Forest: ['normal'],
  Wetlands: ['water', 'normal'],
  Ocean: ['water'],
  Tundra: ['normal'],
  Mountain: ['elevated', 'normal'],
  Cave: ['earth', 'normal'],
  Urban: ['normal'],
  Desert: ['normal'],
}

/**
 * All recognized Naturewalk terrain names (for validation/parsing).
 */
export const NATUREWALK_TERRAINS: ReadonlyArray<NaturewalkTerrain> = [
  'Grassland', 'Forest', 'Wetlands', 'Ocean', 'Tundra',
  'Mountain', 'Cave', 'Urban', 'Desert',
]
