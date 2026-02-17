// PTU 1.05 type effectiveness and immunity utilities
export function useTypeChart() {
  // ===========================================
  // PTU Type Effectiveness
  // Super Effective: ×1.5
  // Double Super Effective: ×2
  // Triple Super Effective: ×3
  // Resisted: ×0.5
  // Double Resisted: ×0.25
  // Triple Resisted: ×0.125
  // Immune: ×0
  // ===========================================
  const typeEffectiveness: Record<string, Record<string, number>> = {
    Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
    Fire: { Fire: 0.5, Water: 0.5, Grass: 1.5, Ice: 1.5, Bug: 1.5, Rock: 0.5, Dragon: 0.5, Steel: 1.5 },
    Water: { Fire: 1.5, Water: 0.5, Grass: 0.5, Ground: 1.5, Rock: 1.5, Dragon: 0.5 },
    Electric: { Water: 1.5, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 1.5, Dragon: 0.5 },
    Grass: { Fire: 0.5, Water: 1.5, Grass: 0.5, Poison: 0.5, Ground: 1.5, Flying: 0.5, Bug: 0.5, Rock: 1.5, Dragon: 0.5, Steel: 0.5 },
    Ice: { Fire: 0.5, Water: 0.5, Grass: 1.5, Ice: 0.5, Ground: 1.5, Flying: 1.5, Dragon: 1.5, Steel: 0.5 },
    Fighting: { Normal: 1.5, Ice: 1.5, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 1.5, Ghost: 0, Dark: 1.5, Steel: 1.5, Fairy: 0.5 },
    Poison: { Grass: 1.5, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0, Fairy: 1.5 },
    Ground: { Fire: 1.5, Electric: 1.5, Grass: 0.5, Poison: 1.5, Flying: 0, Bug: 0.5, Rock: 1.5, Steel: 1.5 },
    Flying: { Electric: 0.5, Grass: 1.5, Fighting: 1.5, Bug: 1.5, Rock: 0.5, Steel: 0.5 },
    Psychic: { Fighting: 1.5, Poison: 1.5, Psychic: 0.5, Dark: 0, Steel: 0.5 },
    Bug: { Fire: 0.5, Grass: 1.5, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 1.5, Ghost: 0.5, Dark: 1.5, Steel: 0.5, Fairy: 0.5 },
    Rock: { Fire: 1.5, Ice: 1.5, Fighting: 0.5, Ground: 0.5, Flying: 1.5, Bug: 1.5, Steel: 0.5 },
    Ghost: { Normal: 0, Psychic: 1.5, Ghost: 1.5, Dark: 0.5 },
    Dragon: { Dragon: 1.5, Steel: 0.5, Fairy: 0 },
    Dark: { Fighting: 0.5, Psychic: 1.5, Ghost: 1.5, Dark: 0.5, Fairy: 0.5 },
    Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Ice: 1.5, Rock: 1.5, Steel: 0.5, Fairy: 1.5 },
    Fairy: { Fire: 0.5, Fighting: 1.5, Poison: 0.5, Dragon: 1.5, Dark: 1.5, Steel: 0.5 }
  }

  // PTU net-classification effectiveness lookup (07-combat.md:780-787, 1010-1033)
  // Net = SE count - resist count → flat multiplier from table
  const NET_EFFECTIVENESS: Record<number, number> = {
    [-3]: 0.125,  // Triply resisted (1/8)
    [-2]: 0.25,   // Doubly resisted (1/4)
    [-1]: 0.5,    // Resisted (1/2)
    [0]: 1.0,     // Neutral
    [1]: 1.5,     // Super effective (×1.5)
    [2]: 2.0,     // Doubly super effective (×2)
    [3]: 3.0,     // Triply super effective (×3)
  }

  // Get type effectiveness multiplier using PTU qualitative classification
  const getTypeEffectiveness = (attackType: string, defenderTypes: string[]): number => {
    const chart = typeEffectiveness[attackType]
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

    const net = seCount - resistCount
    return NET_EFFECTIVENESS[net] ?? 1
  }

  // Get effectiveness description
  const getEffectivenessDescription = (effectiveness: number): string => {
    if (effectiveness === 0) return 'Immune'
    if (effectiveness <= 0.125) return 'Triply Resisted'
    if (effectiveness <= 0.25) return 'Doubly Resisted'
    if (effectiveness < 1) return 'Resisted'
    if (effectiveness >= 3) return 'Triply Super Effective'
    if (effectiveness >= 2) return 'Doubly Super Effective'
    if (effectiveness > 1) return 'Super Effective'
    return 'Neutral'
  }

  // ===========================================
  // PTU Type Immunities
  // ===========================================
  const typeImmunities: Record<string, string[]> = {
    Electric: ['Paralyzed'],
    Fire: ['Burned'],
    Ghost: ['Stuck', 'Trapped'],
    Grass: [], // Immune to Powder moves (handled separately)
    Ice: ['Frozen'],
    Poison: ['Poisoned', 'Badly Poisoned'],
    Steel: ['Poisoned', 'Badly Poisoned']
  }

  // Check if type grants immunity to status
  const isImmuneToStatus = (types: string[], status: string): boolean => {
    for (const type of types) {
      if (typeImmunities[type]?.includes(status)) {
        return true
      }
    }
    return false
  }

  // Check if move gets STAB (Same Type Attack Bonus)
  const hasSTAB = (moveType: string, userTypes: string[]): boolean => {
    return userTypes.includes(moveType)
  }

  return {
    typeEffectiveness,
    getTypeEffectiveness,
    getEffectivenessDescription,
    typeImmunities,
    isImmuneToStatus,
    hasSTAB
  }
}
