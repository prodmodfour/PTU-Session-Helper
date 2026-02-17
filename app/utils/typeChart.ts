/**
 * PTU 1.05 Type Effectiveness Chart & Utilities
 *
 * Canonical source for type matchup data. All type effectiveness
 * calculations should import from this file.
 *
 * Rules reference: 07-combat.md:780-787, 1010-1033
 */

/**
 * Full 18-type effectiveness chart (PTU 07-combat.md:780-787)
 * Super Effective = 1.5 (NOT 2.0 like video games)
 * Only non-1.0 matchups listed per attacking type.
 */
export const TYPE_CHART: Record<string, Record<string, number>> = {
  Normal:   { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire:     { Fire: 0.5, Water: 0.5, Grass: 1.5, Ice: 1.5, Bug: 1.5, Rock: 0.5, Dragon: 0.5, Steel: 1.5 },
  Water:    { Fire: 1.5, Water: 0.5, Grass: 0.5, Ground: 1.5, Rock: 1.5, Dragon: 0.5 },
  Electric: { Water: 1.5, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 1.5, Dragon: 0.5 },
  Grass:    { Fire: 0.5, Water: 1.5, Grass: 0.5, Poison: 0.5, Ground: 1.5, Flying: 0.5, Bug: 0.5, Rock: 1.5, Dragon: 0.5, Steel: 0.5 },
  Ice:      { Fire: 0.5, Water: 0.5, Grass: 1.5, Ice: 0.5, Ground: 1.5, Flying: 1.5, Dragon: 1.5, Steel: 0.5 },
  Fighting: { Normal: 1.5, Ice: 1.5, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 1.5, Ghost: 0, Dark: 1.5, Steel: 1.5, Fairy: 0.5 },
  Poison:   { Grass: 1.5, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 1.5 },
  Ground:   { Fire: 1.5, Electric: 1.5, Grass: 0.5, Poison: 1.5, Flying: 0, Bug: 0.5, Rock: 1.5, Steel: 1.5 },
  Flying:   { Electric: 0.5, Grass: 1.5, Fighting: 1.5, Bug: 1.5, Rock: 0.5, Steel: 0.5 },
  Psychic:  { Fighting: 1.5, Poison: 1.5, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug:      { Fire: 0.5, Grass: 1.5, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 1.5, Ghost: 0.5, Dark: 1.5, Steel: 0.5, Fairy: 0.5 },
  Rock:     { Fire: 1.5, Ice: 1.5, Fighting: 0.5, Ground: 0.5, Flying: 1.5, Bug: 1.5, Steel: 0.5 },
  Ghost:    { Normal: 0, Psychic: 1.5, Ghost: 1.5, Dark: 0.5 },
  Dragon:   { Dragon: 1.5, Steel: 0.5, Fairy: 0 },
  Dark:     { Fighting: 0.5, Psychic: 1.5, Ghost: 1.5, Dark: 0.5, Fairy: 0.5 },
  Steel:    { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 1.5, Rock: 1.5, Steel: 0.5, Fairy: 1.5 },
  Fairy:    { Fire: 0.5, Fighting: 1.5, Poison: 0.5, Dragon: 1.5, Dark: 1.5, Steel: 0.5 },
}

/**
 * PTU net-classification effectiveness lookup (07-combat.md:780-787, 1010-1033)
 * Net = SE count - resist count -> flat multiplier from table.
 * Triply is the maximum tier PTU defines.
 */
export const NET_EFFECTIVENESS: Record<number, number> = {
  [-3]: 0.125,  // Triply resisted (1/8)
  [-2]: 0.25,   // Doubly resisted (1/4)
  [-1]: 0.5,    // Resisted (1/2)
  [0]: 1.0,     // Neutral
  [1]: 1.5,     // Super effective (x1.5)
  [2]: 2.0,     // Doubly super effective (x2)
  [3]: 3.0,     // Triply super effective (x3)
}

/**
 * Compute type effectiveness multiplier across all defender types.
 * PTU uses qualitative classification: count SE/resist/immune per type,
 * net them, and look up the flat multiplier (07-combat.md:1010-1033).
 *
 * Net is clamped to ±3 since PTU defines triply as the maximum tier.
 * (code-review-020 MEDIUM #1)
 */
export function getTypeEffectiveness(moveType: string, defenderTypes: string[]): number {
  const chart = TYPE_CHART[moveType]
  if (!chart) return 1

  let seCount = 0
  let resistCount = 0

  for (const defType of defenderTypes) {
    const value = chart[defType]
    if (value === undefined) continue
    if (value === 0) return 0  // Immunity always wins
    if (value > 1) seCount++
    else if (value < 1) resistCount++
  }

  const net = Math.max(-3, Math.min(3, seCount - resistCount))
  return NET_EFFECTIVENESS[net] ?? 1
}

/**
 * Human-readable label for a type effectiveness multiplier.
 */
export function getEffectivenessLabel(multiplier: number): string {
  if (multiplier === 0) return 'Immune'
  if (multiplier <= 0.125) return 'Triply Resisted'
  if (multiplier <= 0.25) return 'Doubly Resisted'
  if (multiplier < 1) return 'Resisted'
  if (multiplier >= 3) return 'Triply Super Effective'
  if (multiplier >= 2) return 'Doubly Super Effective'
  if (multiplier > 1) return 'Super Effective'
  return 'Neutral'
}
