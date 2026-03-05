/**
 * Source-dependent clearing rules for condition instances (decree-047).
 *
 * For Persistent and Volatile conditions, clearing behavior is always
 * determined by the static per-condition flags (they clear on faint per RAW).
 *
 * For Other conditions, the source type can override the static flags.
 * Per decree-047: move-inflicted Other conditions clear on faint,
 * terrain-based Other conditions do not.
 */
import { getConditionDef } from '~/constants/statusConditions'
import type { StatusCondition, ConditionSourceType, ConditionInstance } from '~/types'

export interface ConditionClearingOverrides {
  clearsOnFaint: boolean
}

/**
 * Source-type to clearing-behavior override map.
 * Only consulted for 'other' category conditions.
 * An empty object means "use the static condition def flag."
 */
export const SOURCE_CLEARING_RULES: Record<ConditionSourceType, Partial<ConditionClearingOverrides>> = {
  'move':        { clearsOnFaint: true },   // Move effect dissipates on faint
  'ability':     { clearsOnFaint: true },    // Ability effect typically dissipates
  'terrain':     { clearsOnFaint: false },   // Terrain persists independently
  'weather':     { clearsOnFaint: false },   // Weather persists independently
  'item':        { clearsOnFaint: true },    // Item effects are combat-contextual
  'environment': { clearsOnFaint: false },   // Environment preset persists
  'manual':      { clearsOnFaint: false },   // GM-applied: conservative, GM controls removal
  'system':      { clearsOnFaint: false },   // System-applied: defer to static flags
  'unknown':     {}                          // No override: use static condition def
}

/**
 * Determine whether a specific condition instance should be cleared on faint.
 *
 * Logic:
 * 1. Persistent/Volatile: always use static clearsOnFaint flag (true per RAW).
 * 2. Other + known source: check SOURCE_CLEARING_RULES for override.
 * 3. Other + unknown/no source: use static flag (false per decree-047).
 */
export function shouldClearOnFaint(
  condition: StatusCondition,
  instance?: ConditionInstance
): boolean {
  const def = getConditionDef(condition)

  // Persistent and Volatile always clear on faint per PTU p.248
  if (def.category !== 'other') {
    return def.clearsOnFaint
  }

  // Other condition: check source-based override
  if (instance?.sourceType) {
    const sourceRule = SOURCE_CLEARING_RULES[instance.sourceType]
    if (sourceRule && sourceRule.clearsOnFaint !== undefined) {
      return sourceRule.clearsOnFaint
    }
  }

  // Fallback: static condition def flag (clearsOnFaint: false for Other, decree-047)
  return def.clearsOnFaint
}

/**
 * Build a default ConditionInstance for a condition with no known source.
 * Used when seeding conditionInstances from pre-existing statusConditions.
 */
export function buildUnknownSourceInstance(condition: StatusCondition): ConditionInstance {
  return {
    condition,
    sourceType: 'unknown',
    sourceLabel: 'Unknown source'
  }
}

/**
 * Build a ConditionInstance for a GM-applied condition.
 */
export function buildManualSourceInstance(condition: StatusCondition): ConditionInstance {
  return {
    condition,
    sourceType: 'manual',
    sourceLabel: 'GM applied'
  }
}

/**
 * Format a condition for display, including source label for Other conditions.
 * Used in GM view to show what applied an Other condition.
 *
 * Display rules:
 * - Persistent/Volatile: condition name only (source doesn't affect behavior)
 * - Other with manual source: condition name only (GM applied it, they know why)
 * - Other with unknown source: condition name + "(source unknown)"
 * - Other with specific source: condition name + "(sourceLabel)"
 */
export function formatConditionDisplay(
  condition: StatusCondition,
  instances?: ConditionInstance[]
): string {
  const def = getConditionDef(condition)
  if (def.category !== 'other') return condition

  const instance = instances?.find(i => i.condition === condition)
  if (!instance || instance.sourceType === 'manual') return condition
  if (instance.sourceType === 'unknown') return `${condition} (source unknown)`
  return `${condition} (${instance.sourceLabel})`
}
