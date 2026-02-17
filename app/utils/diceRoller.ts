/**
 * Dice Roller Utility for PTU
 * Parses and rolls dice notation (e.g., "2d6+8", "3d10+10")
 */

export interface DiceRollResult {
  total: number;
  dice: number[];
  modifier: number;
  notation: string;
  breakdown: string; // e.g., "[4, 6] + 8 = 18"
}

/**
 * Parse dice notation and return components
 * Format: XdY+Z or XdY-Z or XdY
 */
export function parseDiceNotation(notation: string): { count: number; sides: number; modifier: number } | null {
  const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/)
  if (!match) return null

  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0
  }
}

/**
 * Roll a single die with specified number of sides
 */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

/**
 * Roll multiple dice
 */
export function rollDice(count: number, sides: number): number[] {
  const results: number[] = []
  for (let i = 0; i < count; i++) {
    results.push(rollDie(sides))
  }
  return results
}

/**
 * Roll dice from notation string
 * @param notation - Dice notation (e.g., "2d6+8")
 * @returns Roll result with breakdown
 */
export function roll(notation: string): DiceRollResult {
  const parsed = parseDiceNotation(notation)

  if (!parsed) {
    // Invalid notation, return 0
    return {
      total: 0,
      dice: [],
      modifier: 0,
      notation,
      breakdown: 'Invalid notation'
    }
  }

  const dice = rollDice(parsed.count, parsed.sides)
  const diceSum = dice.reduce((a, b) => a + b, 0)
  const total = diceSum + parsed.modifier

  // Build breakdown string
  let breakdown = `[${dice.join(', ')}]`
  if (parsed.modifier !== 0) {
    breakdown += ` ${parsed.modifier >= 0 ? '+' : ''}${parsed.modifier}`
  }
  breakdown += ` = ${total}`

  return {
    total,
    dice,
    modifier: parsed.modifier,
    notation,
    breakdown
  }
}

/**
 * Roll dice for critical hit (roll dice twice, keep modifier once)
 * In PTU, critical hits roll the dice portion twice
 */
export function rollCritical(notation: string): DiceRollResult {
  const parsed = parseDiceNotation(notation)

  if (!parsed) {
    return {
      total: 0,
      dice: [],
      modifier: 0,
      notation,
      breakdown: 'Invalid notation'
    }
  }

  // Roll dice twice for critical
  const firstRoll = rollDice(parsed.count, parsed.sides)
  const secondRoll = rollDice(parsed.count, parsed.sides)
  const allDice = [...firstRoll, ...secondRoll]

  const diceSum = allDice.reduce((a, b) => a + b, 0)
  const doubledModifier = parsed.modifier * 2
  const total = diceSum + doubledModifier

  // Build breakdown string for crit
  let breakdown = `CRIT: [${firstRoll.join(', ')}] + [${secondRoll.join(', ')}]`
  if (doubledModifier !== 0) {
    breakdown += ` ${doubledModifier >= 0 ? '+' : ''}${doubledModifier}`
  }
  breakdown += ` = ${total}`

  return {
    total,
    dice: allDice,
    modifier: parsed.modifier,
    notation: `${notation} (crit)`,
    breakdown
  }
}

/**
 * Calculate the minimum possible result from dice notation
 */
export function getMinRoll(notation: string): number {
  const parsed = parseDiceNotation(notation)
  if (!parsed) return 0

  // Minimum is 1 per die + modifier
  return parsed.count + parsed.modifier
}

/**
 * Calculate the maximum possible result from dice notation
 */
export function getMaxRoll(notation: string): number {
  const parsed = parseDiceNotation(notation)
  if (!parsed) return 0

  // Maximum is sides per die + modifier
  return (parsed.count * parsed.sides) + parsed.modifier
}

/**
 * Calculate the average result from dice notation
 */
export function getAverageRoll(notation: string): number {
  const parsed = parseDiceNotation(notation)
  if (!parsed) return 0

  // Average is (sides + 1) / 2 per die + modifier
  const avgPerDie = (parsed.sides + 1) / 2
  return Math.floor(parsed.count * avgPerDie) + parsed.modifier
}
