/**
 * PTU Ability Assignment Pool Computation
 *
 * At Level 20, a Pokemon gains a Second Ability from Basic or Advanced.
 * At Level 40, a Pokemon gains a Third Ability from any category (Basic/Advanced/High).
 *
 * The ability list in SpeciesData is structured as:
 *   [Basic1, Basic2, ..., BasicN, Advanced1, ..., AdvancedM, High]
 * Where numBasicAbilities = N. The last entry is always the High Ability (when present).
 *
 * Reference: PTU Core Chapter 5 - Pokemon (p.200)
 */

export type AbilityCategory = 'Basic' | 'Advanced' | 'High'

export interface CategorizedAbility {
  name: string
  category: AbilityCategory
}

export interface AbilityPoolResult {
  /** Abilities available for selection (not already held) */
  available: CategorizedAbility[]
  /** Names of abilities the Pokemon already has */
  alreadyHas: string[]
}

/**
 * Categorize a species' ability list into Basic, Advanced, and High.
 *
 * @param speciesAbilities - Full list from SpeciesData (ordered: Basic, Advanced, High)
 * @param numBasicAbilities - Count of Basic abilities in the list
 * @returns Array of abilities with their category
 */
export function categorizeAbilities(
  speciesAbilities: string[],
  numBasicAbilities: number
): CategorizedAbility[] {
  // High ability exists only when there are entries beyond Basic AND Advanced
  // i.e., length must be strictly greater than numBasicAbilities + 1
  // (at least one Basic, at least one Advanced, and one High)
  const hasHighAbility = speciesAbilities.length > numBasicAbilities + 1

  return speciesAbilities.map((name, index) => {
    let category: AbilityCategory

    if (index < numBasicAbilities) {
      category = 'Basic'
    } else if (!hasHighAbility || index < speciesAbilities.length - 1) {
      category = 'Advanced'
    } else {
      category = 'High'
    }

    return { name, category }
  })
}

/**
 * Get the pool of abilities available for a given milestone.
 *
 * Level 20 (second ability): Basic + Advanced abilities
 * Level 40 (third ability): Basic + Advanced + High abilities
 *
 * Excludes abilities the Pokemon already has.
 *
 * @param input.speciesAbilities - Full list from SpeciesData
 * @param input.numBasicAbilities - Count of Basic abilities
 * @param input.currentAbilities - Names of abilities the Pokemon already has
 * @param input.milestone - Which milestone ('second' for Lv20, 'third' for Lv40)
 */
export function getAbilityPool(input: {
  speciesAbilities: string[]
  numBasicAbilities: number
  currentAbilities: string[]
  milestone: 'second' | 'third'
}): AbilityPoolResult {
  const { speciesAbilities, numBasicAbilities, currentAbilities, milestone } = input

  // Categorize all abilities
  const categorized = categorizeAbilities(speciesAbilities, numBasicAbilities)

  // Filter by milestone allowance
  const allowedCategories: Set<AbilityCategory> = milestone === 'second'
    ? new Set(['Basic', 'Advanced'])
    : new Set(['Basic', 'Advanced', 'High'])

  // Filter: must be in allowed categories AND not already held
  const currentSet = new Set(currentAbilities)
  const alreadyHas = currentAbilities.filter(name =>
    categorized.some(a => a.name === name)
  )

  const available = categorized.filter(
    a => allowedCategories.has(a.category) && !currentSet.has(a.name)
  )

  return { available, alreadyHas }
}
