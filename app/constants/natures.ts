/**
 * PTU Nature Chart (Core Chapter 5, p.199)
 *
 * Each nature raises one stat and lowers another.
 * HP modifiers: +1 / -1
 * Non-HP modifiers: +2 / -2
 * Neutral natures (raise === lower) cancel out and have no effect.
 */

export type NatureStat = 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed'

export interface NatureModifiers {
  raise: NatureStat
  lower: NatureStat
}

/**
 * Complete PTU nature table (36 natures).
 * Neutral natures (Composed, Hardy, Docile, Bashful, Quirky, Serious) have
 * raise === lower, so their modifiers cancel out when applied.
 */
export const NATURE_TABLE: Record<string, NatureModifiers> = {
  // HP-raising natures (1-5)
  Cuddly:     { raise: 'hp', lower: 'attack' },
  Distracted: { raise: 'hp', lower: 'defense' },
  Proud:      { raise: 'hp', lower: 'specialAttack' },
  Decisive:   { raise: 'hp', lower: 'specialDefense' },
  Patient:    { raise: 'hp', lower: 'speed' },

  // Attack-raising natures (6-10)
  Desperate:  { raise: 'attack', lower: 'hp' },
  Lonely:     { raise: 'attack', lower: 'defense' },
  Adamant:    { raise: 'attack', lower: 'specialAttack' },
  Naughty:    { raise: 'attack', lower: 'specialDefense' },
  Brave:      { raise: 'attack', lower: 'speed' },

  // Defense-raising natures (11-15)
  Stark:      { raise: 'defense', lower: 'hp' },
  Bold:       { raise: 'defense', lower: 'attack' },
  Impish:     { raise: 'defense', lower: 'specialAttack' },
  Lax:        { raise: 'defense', lower: 'specialDefense' },
  Relaxed:    { raise: 'defense', lower: 'speed' },

  // Special Atk-raising natures (16-20)
  Curious:    { raise: 'specialAttack', lower: 'hp' },
  Modest:     { raise: 'specialAttack', lower: 'attack' },
  Mild:       { raise: 'specialAttack', lower: 'defense' },
  Rash:       { raise: 'specialAttack', lower: 'specialDefense' },
  Quiet:      { raise: 'specialAttack', lower: 'speed' },

  // Special Def-raising natures (21-25)
  Dreamy:     { raise: 'specialDefense', lower: 'hp' },
  Calm:       { raise: 'specialDefense', lower: 'attack' },
  Gentle:     { raise: 'specialDefense', lower: 'defense' },
  Careful:    { raise: 'specialDefense', lower: 'specialAttack' },
  Sassy:      { raise: 'specialDefense', lower: 'speed' },

  // Speed-raising natures (26-30)
  Skittish:   { raise: 'speed', lower: 'hp' },
  Timid:      { raise: 'speed', lower: 'attack' },
  Hasty:      { raise: 'speed', lower: 'defense' },
  Jolly:      { raise: 'speed', lower: 'specialAttack' },
  Naive:      { raise: 'speed', lower: 'specialDefense' },

  // Neutral natures (31-36) — raise === lower, so they cancel out
  Composed:   { raise: 'hp', lower: 'hp' },
  Hardy:      { raise: 'attack', lower: 'attack' },
  Docile:     { raise: 'defense', lower: 'defense' },
  Bashful:    { raise: 'specialAttack', lower: 'specialAttack' },
  Quirky:     { raise: 'specialDefense', lower: 'specialDefense' },
  Serious:    { raise: 'speed', lower: 'speed' }
}

/**
 * Get the modifier amount for a stat.
 * HP uses +1/-1, all other stats use +2/-2.
 */
function modifierAmount(stat: NatureStat): number {
  return stat === 'hp' ? 1 : 2
}

/**
 * Apply nature modifiers to base stats.
 * Returns a new stats object (immutable — does not mutate input).
 * Stats are floored at 1 after modification per PTU rules.
 */
export function applyNatureToBaseStats(
  baseStats: { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number },
  natureName: string
): { hp: number; attack: number; defense: number; specialAttack: number; specialDefense: number; speed: number } {
  const nature = NATURE_TABLE[natureName]
  if (!nature) {
    return { ...baseStats }
  }

  // Neutral natures: raise === lower, no net effect
  if (nature.raise === nature.lower) {
    return { ...baseStats }
  }

  const modified = { ...baseStats }
  modified[nature.raise] = Math.max(1, modified[nature.raise] + modifierAmount(nature.raise))
  modified[nature.lower] = Math.max(1, modified[nature.lower] - modifierAmount(nature.lower))

  return modified
}
