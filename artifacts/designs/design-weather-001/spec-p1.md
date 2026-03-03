# P1 Specification: Type Damage Modifiers + Speed Abilities + Weather Healing/Damage

## D. Type Damage Modifiers (Rain + Sun)

### Problem

PTU pp.341-342 specify that Rain and Sun modify the Damage Base of Fire and Water moves:

- **Rain:** Water +5 DB, Fire -5 DB
- **Sun:** Fire +5 DB, Water -5 DB

The current `calculateDamage()` function in `damageCalculation.ts` does not consider weather. There is no input field for weather state.

### Design Decision: Weather Modifier Applied to Damage Base (Step 1.5)

The weather modifier is applied to the move's Damage Base BEFORE STAB, as a pre-processing step. This matches the PTU wording: "Fire-Type Attacks gain a +5 bonus to Damage Rolls" -- it modifies the damage roll base, not a flat bonus after defense.

Implementation: Insert a new step between Step 1 (raw DB) and Step 2 (STAB) in the 9-step formula.

### Modified: `app/utils/damageCalculation.ts`

#### Extended Input Type

```typescript
export interface DamageCalcInput {
  // ... existing fields ...

  /**
   * Active weather condition on the encounter (P1: type damage modifiers).
   * PTU pp.341-342: Rain/Sun modify Fire/Water DB by +/-5.
   */
  weather?: string | null
}
```

#### New Helper Function

```typescript
/**
 * Calculate weather damage base modifier.
 * PTU pp.341-342:
 * - Rain: Water +5 DB, Fire -5 DB
 * - Sun: Fire +5 DB, Water -5 DB
 *
 * @returns The DB modifier to apply (-5, 0, or +5)
 */
export function getWeatherDamageModifier(
  weather: string | null | undefined,
  moveType: string
): number {
  if (!weather) return 0

  const normalizedType = moveType.charAt(0).toUpperCase() + moveType.slice(1).toLowerCase()

  switch (weather) {
    case 'rain':
      if (normalizedType === 'Water') return 5
      if (normalizedType === 'Fire') return -5
      return 0
    case 'sunny':
      if (normalizedType === 'Fire') return 5
      if (normalizedType === 'Water') return -5
      return 0
    default:
      return 0
  }
}
```

#### Modified calculateDamage Function

```typescript
export function calculateDamage(input: DamageCalcInput): DamageCalcResult {
  // Step 1: Raw Damage Base
  const rawDB = input.moveDamageBase

  // Step 1.5 (NEW): Weather modifier to DB
  const weatherModifier = getWeatherDamageModifier(input.weather, input.moveType)
  const weatherAdjustedDB = Math.max(1, rawDB + weatherModifier)

  // Steps 2-3: STAB applied to weather-adjusted DB
  const stabApplied = hasSTAB(input.moveType, input.attackerTypes)
  const effectiveDB = weatherAdjustedDB + (stabApplied ? 2 : 0)

  // Steps 4-9: Continue as before, using effectiveDB
  // ...
}
```

#### Extended Result Type

```typescript
export interface DamageCalcResult {
  finalDamage: number
  breakdown: {
    // ... existing fields ...

    /** Weather modifier applied to Damage Base (P1) */
    weatherModifier: number
    weatherModifierApplied: boolean
  }
}
```

### Callers Must Pass Weather

All code paths that call `calculateDamage` from `damageCalculation.ts` must be updated to pass the encounter's weather:

1. **`app/composables/useCombat.ts`** -- The primary client-side damage calculation composable. Must read `encounter.weather` from the store and pass it to `calculateDamage`.

2. **`app/stores/encounter.ts`** -- If the store calls damage calculation directly.

3. **Server-side damage endpoints** -- `app/server/api/encounters/[id]/damage.post.ts` and similar. Read weather from the encounter record and pass through.

Implementation note: The weather field is optional (`weather?: string | null`), so existing callers that don't pass it will get `weatherModifier: 0` -- backward compatible.

---

## E. Speed-Doubling Abilities (Swift Swim, Chlorophyll, Sand Rush)

### Problem

PTU pp.311-335 specify that certain abilities grant +4 Speed Combat Stages while their corresponding weather is active:

- **Swift Swim:** +4 Speed CS in Rain (p.331)
- **Chlorophyll:** +4 Speed CS in Sun (p.315)
- **Sand Rush:** +4 Speed CS in Sandstorm (p.323)

These are "Static" abilities that apply automatically. The current system tracks combat stages but does not auto-apply weather-based CS bonuses.

### Design Decision: Applied When Weather Is Set, Reversed When Weather Clears

These are static passive abilities. The CS bonus should be applied when:
1. Weather matching the ability is set (via `POST /api/encounters/:id/weather`)
2. A combatant with the ability is added to an encounter where the weather is already active

And reversed when:
1. Weather changes away from the matching condition
2. The combatant is removed from the encounter
3. Weather duration expires (handled by `decrementWeather`)

### Design Decision: Source-Tracked CS Changes

Use the existing `stageSources` system (decree-005) to track weather-origin CS changes. This allows clean reversal when weather changes without affecting other CS modifications.

```typescript
// When Swift Swim activates:
combatant.stageSources = [
  ...combatant.stageSources ?? [],
  { stat: 'speed', amount: 4, source: 'weather:rain:Swift Swim' }
]
combatant.entity.stageModifiers.speed += 4
```

When weather clears, find and reverse all `weather:*` stage sources:

```typescript
// When weather changes from rain:
const weatherSources = combatant.stageSources?.filter(
  s => s.source.startsWith('weather:rain:')
) ?? []
for (const src of weatherSources) {
  combatant.entity.stageModifiers[src.stat] -= src.amount
}
combatant.stageSources = combatant.stageSources?.filter(
  s => !s.source.startsWith('weather:rain:')
) ?? []
```

### New Functions in `app/utils/weatherRules.ts`

```typescript
/** Weather-speed ability mapping */
export const WEATHER_SPEED_ABILITIES: Array<{
  weather: PtuWeather
  ability: string
  speedBonus: number
}> = [
  { weather: 'rain', ability: 'Swift Swim', speedBonus: 4 },
  { weather: 'sunny', ability: 'Chlorophyll', speedBonus: 4 },
  { weather: 'sandstorm', ability: 'Sand Rush', speedBonus: 4 }
]

/**
 * Get weather-based Speed CS bonuses for a combatant.
 * Returns array of { ability, bonus } for all matching abilities.
 */
export function getWeatherSpeedBonuses(
  combatant: Combatant,
  weather: string | null | undefined
): Array<{ ability: string; bonus: number }> {
  if (!weather) return []
  const abilities = getCombatantAbilities(combatant)
  const bonuses: Array<{ ability: string; bonus: number }> = []

  for (const entry of WEATHER_SPEED_ABILITIES) {
    if (weather === entry.weather) {
      if (abilities.some(a => a.toLowerCase() === entry.ability.toLowerCase())) {
        bonuses.push({ ability: entry.ability, bonus: entry.speedBonus })
      }
    }
  }

  return bonuses
}
```

### Modified: `app/server/api/encounters/[id]/weather.post.ts`

When weather is set or changed, iterate all combatants to:
1. Reverse any existing weather-origin CS bonuses
2. Apply new weather-origin CS bonuses for matching abilities
3. Sync affected combatants to the database

```typescript
// After updating weather on encounter record...

// Apply/reverse weather-based speed abilities
for (const combatant of combatants) {
  // Reverse old weather CS sources
  const oldSources = combatant.stageSources?.filter(
    s => s.source.startsWith('weather:')
  ) ?? []
  for (const src of oldSources) {
    combatant.entity.stageModifiers[src.stat] -= src.amount
  }
  combatant.stageSources = combatant.stageSources?.filter(
    s => !s.source.startsWith('weather:')
  ) ?? []

  // Apply new weather CS bonuses
  if (weather) {
    const speedBonuses = getWeatherSpeedBonuses(combatant, weather)
    for (const bonus of speedBonuses) {
      combatant.entity.stageModifiers.speed = Math.min(6,
        (combatant.entity.stageModifiers.speed || 0) + bonus.bonus
      )
      combatant.stageSources = [
        ...(combatant.stageSources ?? []),
        { stat: 'speed', amount: bonus.bonus, source: `weather:${weather}:${bonus.ability}` }
      ]
    }
  }
}

// Save updated combatants
await prisma.encounter.update({
  where: { id },
  data: {
    weather,
    weatherDuration: duration,
    weatherSource: source,
    combatants: JSON.stringify(combatants)
  }
})
```

Also reverse weather CS bonuses in `decrementWeather()` when weather expires in `next-turn.post.ts`.

---

## F. Weather Ability Healing/Damage at Turn Start/End

### Problem

Several abilities interact with weather to heal or damage the user at the start or end of their turn:

**Turn Start (beginning of turn):**
- **Ice Body (Hail):** Heal 1 tick (PTU p.320)
- **Rain Dish (Rain):** Heal 1 tick (PTU p.323)
- **Sun Blanket (Sun):** Heal 1 tick (PTU p.330)
- **Solar Power (Sun):** Lose 1/16th max HP (PTU p.327)

**Turn End (end of turn):**
- **Dry Skin (Rain):** Heal 1 tick (PTU p.317)
- **Dry Skin (Sun):** Lose 1 tick (PTU p.317)
- **Desert Weather (Rain):** Heal 1/16th max HP (PTU p.316)

### Design Decision: Integrate with Existing Turn Lifecycle

Turn-start effects: Process alongside weather damage ticks in `next-turn.post.ts`, after advancing to the new combatant.

Turn-end effects: Process alongside existing status tick damage (Burn/Poison) in `next-turn.post.ts`, before advancing.

### New Functions in `app/server/services/weather-automation.service.ts`

```typescript
/**
 * Weather ability healing/damage mapping.
 * Each entry defines when the effect fires and what it does.
 */
export interface WeatherAbilityEffect {
  ability: string
  weather: PtuWeather
  timing: 'turn_start' | 'turn_end'
  type: 'heal' | 'damage'
  /** Fraction of max HP: 10 = 1/10th (tick), 16 = 1/16th */
  hpFraction: number
}

export const WEATHER_ABILITY_EFFECTS: WeatherAbilityEffect[] = [
  // Turn start
  { ability: 'Ice Body', weather: 'hail', timing: 'turn_start', type: 'heal', hpFraction: 10 },
  { ability: 'Rain Dish', weather: 'rain', timing: 'turn_start', type: 'heal', hpFraction: 10 },
  { ability: 'Sun Blanket', weather: 'sunny', timing: 'turn_start', type: 'heal', hpFraction: 10 },
  { ability: 'Solar Power', weather: 'sunny', timing: 'turn_start', type: 'damage', hpFraction: 16 },

  // Turn end
  { ability: 'Dry Skin', weather: 'rain', timing: 'turn_end', type: 'heal', hpFraction: 10 },
  { ability: 'Dry Skin', weather: 'sunny', timing: 'turn_end', type: 'damage', hpFraction: 10 },
  { ability: 'Desert Weather', weather: 'rain', timing: 'turn_end', type: 'heal', hpFraction: 16 },
]

export interface WeatherAbilityResult {
  combatantId: string
  combatantName: string
  ability: string
  weather: string
  effect: 'heal' | 'damage'
  amount: number
  formula: string
}

/**
 * Get weather ability effects for a combatant at a given timing.
 *
 * @param combatant - The combatant to check
 * @param weather - Current encounter weather
 * @param timing - 'turn_start' or 'turn_end'
 */
export function getWeatherAbilityEffects(
  combatant: Combatant,
  weather: string | null | undefined,
  timing: 'turn_start' | 'turn_end'
): WeatherAbilityResult[] {
  if (!weather || !isPtuWeather(weather)) return []
  if (combatant.entity.currentHp <= 0) return []

  const abilities = getCombatantAbilities(combatant)
  const results: WeatherAbilityResult[] = []
  const name = getCombatantDisplayName(combatant)

  for (const effect of WEATHER_ABILITY_EFFECTS) {
    if (effect.weather !== weather) continue
    if (effect.timing !== timing) continue
    if (!abilities.some(a => a.toLowerCase() === effect.ability.toLowerCase())) continue

    const amount = Math.max(1, Math.floor(combatant.entity.maxHp / effect.hpFraction))
    results.push({
      combatantId: combatant.id,
      combatantName: name,
      ability: effect.ability,
      weather,
      effect: effect.type,
      amount,
      formula: `${effect.ability}: 1/${effect.hpFraction} max HP (${amount})`
    })
  }

  return results
}

function getCombatantDisplayName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (combatant.entity as HumanCharacter).name
}
```

### Solar Power Combat Stage Bonus

Solar Power also grants +2 SpAtk CS in Sun. This is handled the same way as the speed abilities in Section E -- via source-tracked CS changes applied when weather is set:

Add to `WEATHER_CS_ABILITIES` (alongside speed abilities):

```typescript
export const WEATHER_CS_ABILITIES: Array<{
  weather: PtuWeather
  ability: string
  stat: string
  bonus: number
}> = [
  { weather: 'rain', ability: 'Swift Swim', stat: 'speed', bonus: 4 },
  { weather: 'sunny', ability: 'Chlorophyll', stat: 'speed', bonus: 4 },
  { weather: 'sandstorm', ability: 'Sand Rush', stat: 'speed', bonus: 4 },
  { weather: 'sunny', ability: 'Solar Power', stat: 'specialAttack', bonus: 2 },
]
```

### Modified: `app/server/api/encounters/[id]/next-turn.post.ts`

#### Turn Start: Weather Ability Effects

After weather damage processing for the incoming combatant:

```typescript
// --- Weather ability effects at turn start ---
const weatherAbilityResults: WeatherAbilityResult[] = []

if (weather && currentTurnIndex < turnOrder.length) {
  const newCurrentId = turnOrder[currentTurnIndex]
  const newCurrent = combatants.find((c: any) => c.id === newCurrentId)

  if (newCurrent && newCurrent.entity.currentHp > 0) {
    const effects = getWeatherAbilityEffects(newCurrent, weather, 'turn_start')

    for (const effect of effects) {
      if (effect.effect === 'heal') {
        // Apply healing
        const healed = Math.min(effect.amount, newCurrent.entity.maxHp - newCurrent.entity.currentHp)
        newCurrent.entity.currentHp += healed

        await syncEntityToDatabase(newCurrent, {
          currentHp: newCurrent.entity.currentHp
        })
      } else {
        // Apply damage using existing damage pipeline
        const damageResult = calculateDamage(
          effect.amount,
          newCurrent.entity.currentHp,
          newCurrent.entity.maxHp,
          newCurrent.entity.temporaryHp || 0,
          newCurrent.entity.injuries || 0
        )
        applyDamageToEntity(newCurrent, damageResult)

        if (damageResult.fainted) {
          applyFaintStatus(newCurrent)
        }

        await syncEntityToDatabase(newCurrent, {
          currentHp: newCurrent.entity.currentHp,
          temporaryHp: newCurrent.entity.temporaryHp,
          injuries: newCurrent.entity.injuries,
          statusConditions: newCurrent.entity.statusConditions
        })
      }

      weatherAbilityResults.push(effect)
    }
  }
}
```

#### Turn End: Weather Ability Effects

Before existing status tick processing for the outgoing combatant:

```typescript
// --- Weather ability effects at turn end ---
if (currentCombatant && weather && currentPhase !== 'trainer_declaration' && currentCombatant.entity.currentHp > 0) {
  const turnEndEffects = getWeatherAbilityEffects(currentCombatant, weather, 'turn_end')

  for (const effect of turnEndEffects) {
    if (effect.effect === 'heal') {
      const healed = Math.min(effect.amount, currentCombatant.entity.maxHp - currentCombatant.entity.currentHp)
      currentCombatant.entity.currentHp += healed

      await syncEntityToDatabase(currentCombatant, {
        currentHp: currentCombatant.entity.currentHp
      })
    } else {
      const damageResult = calculateDamage(
        effect.amount,
        currentCombatant.entity.currentHp,
        currentCombatant.entity.maxHp,
        currentCombatant.entity.temporaryHp || 0,
        currentCombatant.entity.injuries || 0
      )
      applyDamageToEntity(currentCombatant, damageResult)

      if (damageResult.fainted) {
        applyFaintStatus(currentCombatant)
      }

      await syncEntityToDatabase(currentCombatant, {
        currentHp: currentCombatant.entity.currentHp,
        temporaryHp: currentCombatant.entity.temporaryHp,
        injuries: currentCombatant.entity.injuries,
        statusConditions: currentCombatant.entity.statusConditions
      })
    }

    weatherAbilityResults.push(effect)
  }
}
```

---

## Summary of File Changes (P1)

| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/utils/damageCalculation.ts` | Add `weather` to DamageCalcInput, `getWeatherDamageModifier()`, apply in step 1.5, add `weatherModifier` to breakdown |
| **EDIT** | `app/utils/weatherRules.ts` | Add `WEATHER_CS_ABILITIES`, `getWeatherSpeedBonuses()` |
| **EDIT** | `app/server/services/weather-automation.service.ts` | Add `WEATHER_ABILITY_EFFECTS`, `getWeatherAbilityEffects()` |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Weather ability effects at turn start/end, weather CS reversal on expiry |
| **EDIT** | `app/server/api/encounters/[id]/weather.post.ts` | Apply/reverse weather CS bonuses on all combatants when weather changes |
| **EDIT** | `app/composables/useCombat.ts` | Pass `encounter.weather` to damage calculation |
| **EDIT** | `app/stores/encounter.ts` | Pass weather context to damage calculation calls |
