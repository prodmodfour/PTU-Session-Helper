# P2 Specification: Weather Ball, Forecast, UI Indicators, Additional Abilities

## G. Weather Ball Type Change

### Problem

Weather Ball (Normal-type, EOT, DB 5) changes type and doubles its Damage Base when a weather condition is active:

> "If it is Sunny, Weather Ball is Fire-Type. If it is Rainy, Weather Ball is Water-Type. If it is Hailing, Weather Ball is Ice-Type. If it is Sandstorming, Weather Ball is Rock-Type. When a weather effect is on the field, Weather Ball has a Damage Base of 10." (PTU p.338+)

Currently, Weather Ball's type and DB are static -- they don't change based on encounter weather.

### Design Decision: Dynamic Type Resolution at Move Use Time

Weather Ball's type change is resolved when the GM selects the move for use, not stored permanently on the move data. The combatant's move pool still lists Weather Ball as Normal-type; the type is overridden dynamically during damage calculation.

### New Function in `app/utils/weatherRules.ts`

```typescript
/**
 * Weather Ball type/DB mapping (PTU p.338+).
 * Returns the effective type and DB for Weather Ball given the current weather.
 *
 * Without weather: Normal-type, DB 5
 * With weather: matching type, DB 10
 */
export function getWeatherBallEffect(weather: string | null | undefined): {
  type: string
  damageBase: number
} {
  switch (weather) {
    case 'sunny': return { type: 'Fire', damageBase: 10 }
    case 'rain': return { type: 'Water', damageBase: 10 }
    case 'hail': return { type: 'Ice', damageBase: 10 }
    case 'sandstorm': return { type: 'Rock', damageBase: 10 }
    default: return { type: 'Normal', damageBase: 5 }
  }
}
```

### Integration Points

1. **Client-side move selection (`useCombat.ts`):** When the GM selects Weather Ball as the move, check encounter weather and display the effective type/DB in the UI.

2. **Damage calculation:** When Weather Ball is used, override `moveType` and `moveDamageBase` in the `DamageCalcInput` with the weather-adjusted values before calling `calculateDamage()`.

3. **STAB check:** The weather-adjusted type is used for STAB. If Castform (with Forecast) is Fire-type in Sun and uses Weather Ball (also Fire-type in Sun), it gets STAB.

---

## H. Forecast (Castform) Form/Type Change

### Problem

Forecast is a Static ability that changes Castform's type based on weather:

> "The user's Type changes depending on the weather. It changes to Fire Type if it is Sunny, Ice Type if it is Hailing, Water Type if it is Rainy, and Rock Type if there is a Sandstorm. It returns to Normal Type if it is in no specific weather." (PTU p.319)

The Weathershape capability also changes Castform's visual form (PTU p.306):

> "Castform's appearance changes with the weather around it. It changes to its orange form in Sunny weather, its blue and grey form in Raining weather, its light blue form when it's Hailing, a rocky brown form in a Sandstorm."

Currently, Pokemon types are static in combat. No mechanism exists to change a combatant's type mid-encounter.

### Design Decision: Combat-Scoped Type Override

Forecast type changes are applied to the combatant's entity types within the encounter, not to the persistent Pokemon record. This parallels how combat stages are encounter-scoped.

When weather changes:
1. Find all combatants with the Forecast ability
2. Update their `entity.type1` (and clear `entity.type2`) to match the weather
3. Store original types for restoration when weather clears

### New Function in `app/utils/weatherRules.ts`

```typescript
/**
 * Forecast type mapping (PTU p.319).
 * Returns the type Castform becomes in the given weather.
 * Returns 'Normal' if no weather or non-PTU weather.
 */
export function getForecastType(weather: string | null | undefined): string {
  switch (weather) {
    case 'sunny': return 'Fire'
    case 'rain': return 'Water'
    case 'hail': return 'Ice'
    case 'sandstorm': return 'Rock'
    default: return 'Normal'
  }
}
```

### Combatant Extension

Add optional fields to track original types for Forecast reversal:

```typescript
// In the combatant's entity (not the Combatant wrapper):
// Store original types before Forecast change
// These are transient combat-scoped fields, not persisted to DB
interface ForecastState {
  originalType1: string
  originalType2: string | null
}
```

**Design decision:** Store the Forecast state as a top-level field on the Combatant (not the entity) to keep it combat-scoped and avoid contaminating the entity data:

```typescript
// In Combatant interface (app/types/encounter.ts):
/** Forecast ability: original types before weather-based type change */
forecastOriginalTypes?: { type1: string; type2: string | null }
```

### Modified: `app/server/api/encounters/[id]/weather.post.ts`

When weather changes, after applying CS bonuses:

```typescript
// Apply Forecast type changes
for (const combatant of combatants) {
  const abilities = getCombatantAbilities(combatant)
  const hasForecast = abilities.some(a => a.toLowerCase() === 'forecast')

  if (hasForecast && combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon

    // Save original types (only if not already saved from a previous weather change)
    if (!combatant.forecastOriginalTypes) {
      combatant.forecastOriginalTypes = {
        type1: pokemon.type1,
        type2: pokemon.type2 ?? null
      }
    }

    // Apply new weather type
    const newType = getForecastType(weather)
    pokemon.type1 = newType
    pokemon.type2 = null  // Forecast makes the Pokemon single-typed

    // If weather is cleared, restore original types
    if (!weather || newType === 'Normal') {
      if (combatant.forecastOriginalTypes) {
        pokemon.type1 = combatant.forecastOriginalTypes.type1
        pokemon.type2 = combatant.forecastOriginalTypes.type2 ?? undefined
        combatant.forecastOriginalTypes = undefined
      }
    }
  }
}
```

### Sprite Change Note

Castform has different sprites for each weather form. The sprite URL should be updated when Forecast changes the type. This depends on the existing sprite system:
- The `VTTToken.vue` component renders sprites based on species
- A special override would need to check for Forecast-active Castform and swap the sprite

This is a UI-only concern and can be handled in the `VTTToken.vue` rendering logic by checking `combatant.forecastOriginalTypes` as an indicator that Forecast is active, then using the weather to select the appropriate sprite.

---

## I. UI Weather Effect Indicators

### Problem

When weather effects are active, the GM needs visual feedback about:
1. Which combatants will take weather damage
2. Which combatants are immune (and why)
3. Which combatants have weather-boosted abilities active
4. What type/DB modifiers are in effect for the current move

### New Component: `app/components/encounter/WeatherEffectIndicator.vue`

A small inline component shown in the combatant panel when weather is active:

```vue
<template>
  <div v-if="weatherEffect" class="weather-effect-indicator" :class="effectClass">
    <PhosphorIcon :name="weatherIcon" :size="14" />
    <span class="weather-effect-label">{{ effectLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Combatant } from '~/types'
import {
  isDamagingWeather,
  isImmuneToWeatherDamage,
  getCombatantAbilities
} from '~/utils/weatherRules'

const props = defineProps<{
  combatant: Combatant
  weather: string | null
  allCombatants: Combatant[]
}>()

// Compute weather effect for this combatant
const weatherEffect = computed(() => {
  if (!props.weather) return null

  const isDamaging = isDamagingWeather(props.weather)

  if (isDamaging) {
    const immunity = isImmuneToWeatherDamage(
      props.combatant,
      props.weather,
      props.allCombatants
    )
    if (immunity.immune) {
      return { type: 'immune', reason: immunity.detail }
    }
    return { type: 'damage', reason: null }
  }

  // Check for weather ability effects (healing, speed boost)
  const abilities = getCombatantAbilities(props.combatant)
  // ... check for active weather abilities

  return null
})

const effectClass = computed(() => ({
  'weather-effect--damage': weatherEffect.value?.type === 'damage',
  'weather-effect--immune': weatherEffect.value?.type === 'immune',
  'weather-effect--boost': weatherEffect.value?.type === 'boost',
  'weather-effect--heal': weatherEffect.value?.type === 'heal'
}))

const weatherIcon = computed(() => {
  switch (props.weather) {
    case 'hail': return 'snowflake'
    case 'sandstorm': return 'wind'
    case 'rain': return 'cloud-rain'
    case 'sunny': return 'sun'
    default: return 'cloud'
  }
})

const effectLabel = computed(() => {
  if (!weatherEffect.value) return ''
  switch (weatherEffect.value.type) {
    case 'damage': return 'Takes weather damage'
    case 'immune': return `Immune: ${weatherEffect.value.reason}`
    case 'boost': return 'Weather-boosted'
    case 'heal': return 'Weather healing'
    default: return ''
  }
})
</script>
```

### Modified: `app/components/gm/EncounterHeader.vue`

Enhance the existing weather badge to show a tooltip with active effects summary:

```typescript
const weatherTooltip = computed(() => {
  if (!props.encounter.weather) return ''
  const source = props.encounter.weatherSource ?? 'manual'
  const duration = props.encounter.weatherDuration

  let tooltip = `${weatherLabel.value}`
  if (duration > 0) {
    tooltip += ` - ${duration} round${duration === 1 ? '' : 's'} remaining (${source})`
  } else {
    tooltip += ` - indefinite (${source})`
  }

  // Add weather effect summary
  const weather = props.encounter.weather
  if (weather === 'hail') {
    tooltip += '\nDamage: 1/10 max HP to non-Ice types'
    tooltip += '\nImmune: Ice Body, Snow Cloak, Snow Warning, Overcoat'
  } else if (weather === 'sandstorm') {
    tooltip += '\nDamage: 1/10 max HP to non-Ground/Rock/Steel types'
    tooltip += '\nImmune: Sand Veil, Sand Rush, Sand Force, Desert Weather, Overcoat'
  } else if (weather === 'rain') {
    tooltip += '\nFire moves: -5 DB | Water moves: +5 DB'
    tooltip += '\nSwift Swim: +4 Speed CS'
  } else if (weather === 'sunny') {
    tooltip += '\nFire moves: +5 DB | Water moves: -5 DB'
    tooltip += '\nChlorophyll: +4 Speed CS'
  }

  return tooltip
})
```

---

## J. Additional Weather Abilities

### Hydration (Rain) -- PTU p.320

> "At the end of the user's turn, if the weather is Rainy, the user is cured of one Status Affliction."

**Implementation:** Add to the turn-end processing in `next-turn.post.ts`. After checking for weather ability healing/damage (P1), check for Hydration:

```typescript
// Hydration: cure one status at turn end in Rain
if (weather === 'rain' && abilities.includes('Hydration')) {
  const statuses = currentCombatant.entity.statusConditions ?? []
  const persistentStatuses = statuses.filter(s =>
    ['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned', 'Asleep'].includes(s)
  )
  if (persistentStatuses.length > 0) {
    // Cure the first persistent status (order: as listed)
    const cured = persistentStatuses[0]
    updateStatusConditions(currentCombatant, statuses.filter(s => s !== cured))
    // Reverse CS effects from the cured condition
    reverseStatusCsEffects(currentCombatant, cured)
  }
}
```

### Leaf Guard (Sun) -- PTU p.320

> "At the end of the user's turn, if the weather is Sunny, the user is cured of one Status Condition."

Same pattern as Hydration but for Sunny weather. Note: "Status Condition" is broader than "Status Affliction" -- includes volatile conditions too.

### Sand Force (Sandstorm) -- PTU p.323

> "While in a Sandstorm, the user's Ground, Rock, and Steel-Type Direct-Damage Moves deal +5 Damage."

**Implementation:** Applied as a flat damage bonus in the damage calculation. Add to `DamageCalcInput`:

```typescript
/** Flat bonus to final damage from abilities (e.g., Sand Force +5 for Ground/Rock/Steel in Sandstorm) */
abilityDamageBonus?: number
```

Check at the point of move use: if attacker has Sand Force, weather is Sandstorm, and move type is Ground/Rock/Steel, set `abilityDamageBonus: 5`.

### Snow Cloak (Hail) -- PTU p.327

> "The user's Evasion is increased by +2 while in Hail."

**Implementation:** Applied as a source-tracked evasion bonus when weather is set to Hail. Add to `WEATHER_CS_ABILITIES`:

```typescript
// Evasion bonuses from weather abilities
{ weather: 'hail', ability: 'Snow Cloak', stat: 'evasion_bonus', bonus: 2 },
{ weather: 'sandstorm', ability: 'Sand Veil', stat: 'evasion_bonus', bonus: 2 },
```

Note: PTU evasion bonuses are additive (Part 2 of evasion calculation). This needs to be tracked separately from combat stage bonuses. Use the `evasionBonus` field that already exists in the evasion calculation pipeline.

### Sand Veil (Sandstorm) -- PTU p.323

> "The user's Evasion is increased by +2 while in a Sandstorm."

Same pattern as Snow Cloak but for Sandstorm.

### Thermosensitive -- PTU p.331

> "While Sunny, the user's Attack and Special Attack are raised by +2 combat stages each. While Hailing, the user's movement capabilities are reduced by half."

Sun effect: Add to `WEATHER_CS_ABILITIES`:
```typescript
{ weather: 'sunny', ability: 'Thermosensitive', stat: 'attack', bonus: 2 },
{ weather: 'sunny', ability: 'Thermosensitive', stat: 'specialAttack', bonus: 2 },
```

Hail effect: Movement halving would need to be applied in `useGridMovement.ts` by checking the combatant's abilities when calculating movement range in Hail.

### Flower Gift (Sun) -- PTU p.318

> "If it is Sunny, Flower Gift creates a 4-meter Burst. The user and all of their allies in the burst gain +2 Combat Stages, distributed among any Stat or Stats as they wish."

This is a Scene-frequency Free Action, not a passive static effect. It requires the GM to manually activate it. The weather automation only needs to enable the button/option when Sun is active.

**Implementation:** Add a UI indicator in the combatant panel showing "Flower Gift available" when weather is Sunny and the combatant has the ability. The actual CS distribution is manual (GM chooses which stats to boost).

### Harvest (Sun) -- PTU p.319

> "While in Sunny Weather, the Buff is never consumed."

This interacts with the Berry/Digestion Buff system, which is not yet implemented. **Defer** until the item consumption system exists. Note its existence in the weather rules utility for future reference.

---

## Summary of File Changes (P2)

| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/utils/weatherRules.ts` | `getWeatherBallEffect()`, `getForecastType()`, additional ability constants |
| **NEW** | `app/components/encounter/WeatherEffectIndicator.vue` | Per-combatant weather effect display |
| **EDIT** | `app/components/gm/EncounterHeader.vue` | Enhanced weather tooltip with effect summary |
| **EDIT** | `app/types/encounter.ts` | Add `forecastOriginalTypes?` to Combatant |
| **EDIT** | `app/server/api/encounters/[id]/weather.post.ts` | Apply Forecast type changes when weather set |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Hydration/Leaf Guard status cure at turn end |
| **EDIT** | `app/server/services/weather-automation.service.ts` | Additional ability effect entries |
| **EDIT** | `app/composables/useCombat.ts` | Weather Ball type resolution for move selection, Sand Force damage bonus |
| **EDIT** | `app/utils/damageCalculation.ts` | Add `abilityDamageBonus` to DamageCalcInput |
