# P0 Specification: Weather Damage at Turn Start (Hail + Sandstorm)

## A. Weather Rules Utility

### Problem

No code exists to determine whether a combatant is immune to weather damage based on their type or abilities. Weather is display-only.

### Design Decision: Pure Utility Functions

Weather immunity checks are pure functions in a new utility file. This follows the same pattern as `mountingRules.ts` and `captureRate.ts` -- pure logic that can be tested independently of the server.

Rationale:
- Weather immunity is a PTU rules question (type + ability lookup), not a DB question
- Pure functions are trivially testable
- Both server (turn processing) and client (UI indicators) need the same immunity logic
- The utility is auto-imported via Nuxt's `utils/` convention

### New Utility: `app/utils/weatherRules.ts`

```typescript
/**
 * PTU 1.05 Weather Effect Rules
 *
 * Pure functions for weather damage, immunity, and modifier calculations.
 * Weather conditions defined in PTU pp.341-342 (10-indices-and-reference.md).
 *
 * Tick = 1/10th max HP (PTU p.246): Math.max(1, Math.floor(maxHp / 10))
 *
 * Four PTU weather conditions with mechanical effects:
 * - Hail: 1 tick damage to non-Ice-type Pokemon at turn start
 * - Sandstorm: 1 tick damage to non-Ground/Rock/Steel-type Pokemon at turn start
 * - Rain: Fire -5 DB, Water +5 DB
 * - Sunny: Fire +5 DB, Water -5 DB
 */

import type { Combatant } from '~/types'
import type { Pokemon, HumanCharacter } from '~/types/character'

// ============================================
// TYPES
// ============================================

export type PtuWeather = 'hail' | 'sandstorm' | 'rain' | 'sunny'

/** Check if a weather string is a PTU-standard weather with mechanical effects */
export function isPtuWeather(weather: string | null | undefined): weather is PtuWeather {
  return weather === 'hail' || weather === 'sandstorm' || weather === 'rain' || weather === 'sunny'
}

/** Check if weather deals tick damage at turn start */
export function isDamagingWeather(weather: string | null | undefined): boolean {
  return weather === 'hail' || weather === 'sandstorm'
}

// ============================================
// CONSTANTS
// ============================================

/** Hail: types immune to weather damage (PTU p.341) */
export const HAIL_IMMUNE_TYPES: string[] = ['Ice']

/** Sandstorm: types immune to weather damage (PTU p.341) */
export const SANDSTORM_IMMUNE_TYPES: string[] = ['Ground', 'Rock', 'Steel']

/**
 * Hail: abilities that grant immunity to weather damage (PTU pp.311-335).
 * - Ice Body: immune + heals 1 tick (healing handled separately in P1)
 * - Snow Cloak: immune + adjacent allies immune
 * - Snow Warning: static effect, user not damaged by Hail
 * - Overcoat: immune to weather damage (errata)
 */
export const HAIL_IMMUNE_ABILITIES: string[] = [
  'Ice Body', 'Snow Cloak', 'Snow Warning', 'Overcoat'
]

/**
 * Sandstorm: abilities that grant immunity to weather damage (PTU pp.311-335).
 * - Sand Veil: immune + adjacent allies immune
 * - Sand Rush: immune to Sandstorm damage
 * - Sand Force: immune to Sandstorm damage
 * - Desert Weather: immune to Sandstorm damage
 * - Overcoat: immune to weather damage (errata)
 */
export const SANDSTORM_IMMUNE_ABILITIES: string[] = [
  'Sand Veil', 'Sand Rush', 'Sand Force', 'Desert Weather', 'Overcoat'
]

/** Abilities that protect adjacent allies from Hail damage */
export const HAIL_ADJACENT_PROTECTION: string[] = ['Snow Cloak']

/** Abilities that protect adjacent allies from Sandstorm damage */
export const SANDSTORM_ADJACENT_PROTECTION: string[] = ['Sand Veil']

// ============================================
// TYPE / ABILITY HELPERS
// ============================================

/**
 * Get the types of a combatant's entity.
 * Pokemon have type1/type2. Humans have no types (always empty array).
 */
export function getCombatantTypes(combatant: Combatant): string[] {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    const types: string[] = []
    if (pokemon.type1) types.push(pokemon.type1)
    if (pokemon.type2) types.push(pokemon.type2)
    return types
  }
  // Trainers have no type -- they ARE affected by weather damage
  // (PTU p.341: "all non-Ice Type Pokemon" -- trainers are not Pokemon
  //  but take weather damage in Full Contact. No type immunity.)
  return []
}

/**
 * Get the abilities of a combatant's entity.
 * Returns all active abilities (basic + advanced + high abilities).
 * Abilities are stored as objects with a `name` field.
 */
export function getCombatantAbilities(combatant: Combatant): string[] {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    const abilities: string[] = []
    if (pokemon.abilities) {
      for (const ability of pokemon.abilities) {
        if (typeof ability === 'string') {
          abilities.push(ability)
        } else if (ability && typeof ability === 'object' && 'name' in ability) {
          abilities.push((ability as { name: string }).name)
        }
      }
    }
    return abilities
  }
  // Trainers don't have abilities in the Pokemon sense
  return []
}

// ============================================
// IMMUNITY CHECKS
// ============================================

export interface WeatherImmunityResult {
  immune: boolean
  reason?: 'type' | 'ability' | 'adjacent_ally'
  /** Which type or ability granted immunity */
  detail?: string
}

/**
 * Check if a combatant is immune to Hail damage.
 *
 * PTU p.341:
 * - Ice-type Pokemon are immune
 * - Abilities: Ice Body, Snow Cloak, Snow Warning, Overcoat
 * - Adjacent to ally with Snow Cloak: immune
 *
 * @param combatant - The combatant to check
 * @param allCombatants - All combatants (for adjacent ally checks)
 */
export function isImmuneToHail(
  combatant: Combatant,
  allCombatants?: Combatant[]
): WeatherImmunityResult {
  // Type check: Ice-type Pokemon are immune
  const types = getCombatantTypes(combatant)
  for (const immuneType of HAIL_IMMUNE_TYPES) {
    if (types.includes(immuneType)) {
      return { immune: true, reason: 'type', detail: immuneType }
    }
  }

  // Ability check: personal abilities
  const abilities = getCombatantAbilities(combatant)
  for (const immuneAbility of HAIL_IMMUNE_ABILITIES) {
    if (abilities.some(a => a.toLowerCase() === immuneAbility.toLowerCase())) {
      return { immune: true, reason: 'ability', detail: immuneAbility }
    }
  }

  // Adjacent ally check: Snow Cloak protects adjacent allies
  if (allCombatants && combatant.position) {
    for (const ally of allCombatants) {
      if (ally.id === combatant.id) continue
      if (ally.side !== combatant.side) continue
      if (!ally.position) continue

      // Check adjacency (1 cell distance in any direction)
      const dx = Math.abs(ally.position.x - combatant.position.x)
      const dy = Math.abs(ally.position.y - combatant.position.y)
      const isAdjacent = dx <= 1 && dy <= 1 && (dx + dy > 0)

      if (isAdjacent) {
        const allyAbilities = getCombatantAbilities(ally)
        for (const protectAbility of HAIL_ADJACENT_PROTECTION) {
          if (allyAbilities.some(a => a.toLowerCase() === protectAbility.toLowerCase())) {
            return { immune: true, reason: 'adjacent_ally', detail: `${protectAbility} (${ally.entity.name || (ally.entity as Pokemon).species})` }
          }
        }
      }
    }
  }

  return { immune: false }
}

/**
 * Check if a combatant is immune to Sandstorm damage.
 *
 * PTU p.341:
 * - Ground/Rock/Steel-type Pokemon are immune
 * - Abilities: Sand Veil, Sand Rush, Sand Force, Desert Weather, Overcoat
 * - Adjacent to ally with Sand Veil: immune
 *
 * @param combatant - The combatant to check
 * @param allCombatants - All combatants (for adjacent ally checks)
 */
export function isImmuneToSandstorm(
  combatant: Combatant,
  allCombatants?: Combatant[]
): WeatherImmunityResult {
  // Type check: Ground/Rock/Steel-type Pokemon are immune
  const types = getCombatantTypes(combatant)
  for (const immuneType of SANDSTORM_IMMUNE_TYPES) {
    if (types.includes(immuneType)) {
      return { immune: true, reason: 'type', detail: immuneType }
    }
  }

  // Ability check: personal abilities
  const abilities = getCombatantAbilities(combatant)
  for (const immuneAbility of SANDSTORM_IMMUNE_ABILITIES) {
    if (abilities.some(a => a.toLowerCase() === immuneAbility.toLowerCase())) {
      return { immune: true, reason: 'ability', detail: immuneAbility }
    }
  }

  // Adjacent ally check: Sand Veil protects adjacent allies
  if (allCombatants && combatant.position) {
    for (const ally of allCombatants) {
      if (ally.id === combatant.id) continue
      if (ally.side !== combatant.side) continue
      if (!ally.position) continue

      const dx = Math.abs(ally.position.x - combatant.position.x)
      const dy = Math.abs(ally.position.y - combatant.position.y)
      const isAdjacent = dx <= 1 && dy <= 1 && (dx + dy > 0)

      if (isAdjacent) {
        const allyAbilities = getCombatantAbilities(ally)
        for (const protectAbility of SANDSTORM_ADJACENT_PROTECTION) {
          if (allyAbilities.some(a => a.toLowerCase() === protectAbility.toLowerCase())) {
            return { immune: true, reason: 'adjacent_ally', detail: `${protectAbility} (${ally.entity.name || (ally.entity as Pokemon).species})` }
          }
        }
      }
    }
  }

  return { immune: false }
}

/**
 * Check weather immunity for a combatant given the current weather.
 * Dispatches to the correct weather-specific check.
 */
export function isImmuneToWeatherDamage(
  combatant: Combatant,
  weather: string,
  allCombatants?: Combatant[]
): WeatherImmunityResult {
  switch (weather) {
    case 'hail': return isImmuneToHail(combatant, allCombatants)
    case 'sandstorm': return isImmuneToSandstorm(combatant, allCombatants)
    default: return { immune: true, reason: 'type', detail: 'non-damaging weather' }
  }
}
```

---

## B. Weather Automation Service

### Problem

The existing `status-automation.service.ts` handles tick damage at turn END for status conditions (Burn, Poison, etc.). Weather damage occurs at turn START per PTU rules. A separate service keeps the concerns clean.

### Design Decision: Separate Service

Weather automation gets its own service file rather than extending `status-automation.service.ts`.

Rationale:
- Weather damage fires at turn START, status ticks fire at turn END -- different lifecycle points
- Weather checks require type + ability lookups, while status ticks only check status conditions
- Weather has immunity mechanics (type, ability, adjacency) that don't exist for status conditions
- Keeps `status-automation.service.ts` focused (currently 152 lines, well under limit)
- Pure function pattern: no DB access, no side effects

### New Service: `app/server/services/weather-automation.service.ts`

```typescript
/**
 * Weather Automation Service
 * Pure functions for weather effect processing at turn start.
 *
 * PTU pp.341-342: Hail and Sandstorm deal 1 Tick of HP damage
 * at the beginning of a Pokemon's turn. Type and ability immunities apply.
 *
 * A Tick = 1/10th max HP (PTU p.246), minimum 1.
 */

import type { Combatant } from '~/types'
import type { Pokemon, HumanCharacter } from '~/types/character'
import {
  isDamagingWeather,
  isImmuneToWeatherDamage,
  type WeatherImmunityResult
} from '~/utils/weatherRules'
import { calculateTickDamage } from '~/server/services/status-automation.service'

// ============================================
// TYPES
// ============================================

export interface WeatherTickResult {
  combatantId: string
  combatantName: string
  weather: string
  effect: 'damage' | 'immune'
  amount: number
  formula: string
  newHp: number
  injuryGained: boolean
  fainted: boolean
  immuneReason?: string
  immuneAbility?: string
}

// ============================================
// PURE FUNCTIONS
// ============================================

/**
 * Determine if a combatant should take weather damage at turn start,
 * and if so, calculate the amount.
 *
 * Returns null if no weather is active or weather is non-damaging.
 * Returns a WeatherTickResult with effect='immune' if combatant is immune.
 * Returns a WeatherTickResult with effect='damage' and the amount to apply.
 *
 * NOTE: This function does NOT apply the damage. The caller (next-turn endpoint)
 * uses combatant.service.calculateDamage + applyDamageToEntity for that.
 */
export function getWeatherTickForCombatant(
  combatant: Combatant,
  weather: string | null | undefined,
  allCombatants: Combatant[]
): { shouldApply: boolean; tick: WeatherTickResult | null } {
  // No weather or non-damaging weather: nothing to do
  if (!weather || !isDamagingWeather(weather)) {
    return { shouldApply: false, tick: null }
  }

  // Skip if combatant is fainted
  if (combatant.entity.currentHp <= 0) {
    return { shouldApply: false, tick: null }
  }

  const name = combatant.type === 'pokemon'
    ? (combatant.entity as Pokemon).nickname || (combatant.entity as Pokemon).species
    : (combatant.entity as HumanCharacter).name

  // Check immunity
  const immunity = isImmuneToWeatherDamage(combatant, weather, allCombatants)

  if (immunity.immune) {
    return {
      shouldApply: false,
      tick: {
        combatantId: combatant.id,
        combatantName: name,
        weather,
        effect: 'immune',
        amount: 0,
        formula: `Immune (${immunity.reason}: ${immunity.detail})`,
        newHp: combatant.entity.currentHp,
        injuryGained: false,
        fainted: false,
        immuneReason: immunity.reason,
        immuneAbility: immunity.detail
      }
    }
  }

  // Calculate weather tick damage
  const tickDamage = calculateTickDamage(combatant.entity.maxHp)
  const weatherLabel = weather === 'hail' ? 'Hail' : 'Sandstorm'

  return {
    shouldApply: true,
    tick: {
      combatantId: combatant.id,
      combatantName: name,
      weather,
      effect: 'damage',
      amount: tickDamage,
      formula: `${weatherLabel}: 1/10 max HP (${tickDamage})`,
      // newHp, injuryGained, fainted will be filled by the caller after applying damage
      newHp: 0,
      injuryGained: false,
      fainted: false
    }
  }
}
```

---

## C. Weather Damage Integration with Turn System

### Problem

The `next-turn.post.ts` endpoint processes the turn lifecycle. Weather damage must fire at the START of each combatant's turn, before they take any actions. Currently, only status tick damage fires at turn END.

### Design Decision: Weather Ticks at Turn Start of Incoming Combatant

PTU says weather damage occurs "at the beginning of their turn." This means we process weather damage for the INCOMING combatant (the one whose turn is starting), not the outgoing combatant (whose turn just ended).

Implementation location: After advancing `currentTurnIndex` and before returning the response, check the new current combatant for weather damage.

### Modified: `app/server/api/encounters/[id]/next-turn.post.ts`

Add weather tick processing after the turn advances to the new combatant:

```typescript
// After existing tick damage processing (turn END for outgoing combatant)...
// After currentTurnIndex++ and round/phase transitions...

// --- Weather tick damage at turn START (PTU pp.341-342) ---
// Process BEFORE the new combatant takes actions.
// Hail: 1 tick to non-Ice (immune: Ice Body, Snow Cloak, Snow Warning, Overcoat)
// Sandstorm: 1 tick to non-Ground/Rock/Steel (immune: Sand Veil, Sand Rush, Sand Force, Desert Weather, Overcoat)
let weatherTickResult: WeatherTickResult | null = null

if (weather && isDamagingWeather(weather) && currentTurnIndex < turnOrder.length) {
  const newCurrentId = turnOrder[currentTurnIndex]
  const newCurrent = combatants.find((c: any) => c.id === newCurrentId)

  if (newCurrent && newCurrent.entity.currentHp > 0) {
    const { shouldApply, tick } = getWeatherTickForCombatant(
      newCurrent,
      weather,
      combatants
    )

    if (shouldApply && tick) {
      // Apply damage using existing combatant.service functions
      const damageResult = calculateDamage(
        tick.amount,
        newCurrent.entity.currentHp,
        newCurrent.entity.maxHp,
        newCurrent.entity.temporaryHp || 0,
        newCurrent.entity.injuries || 0
      )

      applyDamageToEntity(newCurrent, damageResult)

      // Fill in post-damage fields
      tick.newHp = damageResult.newHp
      tick.injuryGained = damageResult.injuryGained
      tick.fainted = damageResult.fainted

      weatherTickResult = tick

      // Handle faint
      if (damageResult.fainted) {
        applyFaintStatus(newCurrent)
        // Auto-dismount if mounted
        if (newCurrent.mountState) {
          const gridWidth = encounter.gridWidth || 20
          const gridHeight = encounter.gridHeight || 20
          const mountFaintResult = clearMountOnFaint(combatants, newCurrentId, gridWidth, gridHeight)
          if (mountFaintResult.dismounted) {
            combatants = mountFaintResult.combatants
          }
        }
        // Track defeated
        trackDefeated(newCurrent)
      }

      // Sync to database
      await syncEntityToDatabase(newCurrent, {
        currentHp: newCurrent.entity.currentHp,
        temporaryHp: newCurrent.entity.temporaryHp,
        injuries: newCurrent.entity.injuries,
        statusConditions: newCurrent.entity.statusConditions,
        ...(damageResult.injuryGained ? { lastInjuryTime: new Date() } : {})
      })
    } else if (tick) {
      // Immune -- include in response for GM awareness
      weatherTickResult = tick
    }
  }
}
```

Add to the response:

```typescript
return {
  success: true,
  data: response,
  ...(heavilyInjuredPenalty && { heavilyInjuredPenalty }),
  ...(tickResults.length > 0 && { tickDamage: tickResults }),
  ...(holdReleaseTriggered.length > 0 && { holdReleaseTriggered }),
  ...(actionForfeitApplied && { actionForfeitApplied }),
  // NEW: Weather effect at turn start
  ...(weatherTickResult && { weatherTick: weatherTickResult })
}
```

Also add the weather tick to the move log for history:

```typescript
if (weatherTickResult && weatherTickResult.effect === 'damage') {
  const moveLog = JSON.parse(encounter.moveLog || '[]')
  moveLog.push({
    id: uuidv4(),
    timestamp: new Date(),
    round: currentRound,
    actorId: weatherTickResult.combatantId,
    actorName: weatherTickResult.combatantName,
    moveName: `${weather === 'hail' ? 'Hail' : 'Sandstorm'} Damage`,
    damageClass: 'Status',
    targets: [{
      id: weatherTickResult.combatantId,
      name: weatherTickResult.combatantName,
      hit: true,
      damage: weatherTickResult.amount,
      injury: weatherTickResult.injuryGained
    }],
    notes: weatherTickResult.formula
  })
  updateData.moveLog = JSON.stringify(moveLog)
}
```

### WebSocket Broadcast

Broadcast weather tick damage using the existing `status_tick` event type:

```typescript
if (weatherTickResult && weatherTickResult.effect === 'damage') {
  broadcastToEncounter(id, {
    type: 'status_tick',
    data: {
      encounterId: id,
      combatantId: weatherTickResult.combatantId,
      combatantName: weatherTickResult.combatantName,
      condition: weather === 'hail' ? 'Hail' : 'Sandstorm',
      damage: weatherTickResult.amount,
      newHp: weatherTickResult.newHp,
      fainted: weatherTickResult.fainted,
      formula: weatherTickResult.formula
    }
  })
}
```

### Declaration Phase Handling

Weather damage should NOT fire during the `trainer_declaration` phase of League Battles. Declaration is not a real turn -- it's just choosing an action. Weather damage fires at the start of the actual resolution/pokemon turn.

```typescript
// Skip weather tick during declaration phase
if (currentPhase === 'trainer_declaration') {
  // No weather damage during declaration
  weatherTickResult = null
}
```

### Trainers and Weather Damage

PTU says "all non-Ice Type Pokemon lose a Tick..." but in Full Contact battles, trainers also participate on the field. By the rules, trainers are not Pokemon and don't have types, so they technically don't have type immunity.

**Design decision:** Trainers in Full Contact battles DO take weather damage (they are on the field). They cannot be type-immune since they have no types. This matches the "tax the party" intent described in PTU p.472 (11-running-the-game.md).

---

## Summary of File Changes (P0)

| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/utils/weatherRules.ts` | Weather types, immunity checks, constants |
| **NEW** | `app/server/services/weather-automation.service.ts` | Weather tick calculation + immunity logic |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Weather tick at turn start, move log, broadcast |
| **EDIT** | `app/server/services/status-automation.service.ts` | Ensure `calculateTickDamage` is exported (already is) |
