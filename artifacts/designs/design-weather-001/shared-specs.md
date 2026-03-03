# Shared Specifications

## Weather Type Enum

The system already uses string-based weather identifiers. Define a canonical enum for the four PTU-standard weather conditions (the ones with mechanical effects):

```typescript
// app/utils/weatherRules.ts

/**
 * PTU 1.05 standard weather conditions with mechanical effects.
 * PTU pp.341-342 (10-indices-and-reference.md).
 *
 * Other weather strings ('snow', 'fog', 'harsh_sunlight', 'heavy_rain',
 * 'strong_winds') are display-only and have no automated mechanical effects.
 */
export type PtuWeather = 'hail' | 'sandstorm' | 'rain' | 'sunny'

/** All weather strings the system supports (display + mechanical) */
export type WeatherCondition =
  | PtuWeather
  | 'snow'
  | 'fog'
  | 'harsh_sunlight'
  | 'heavy_rain'
  | 'strong_winds'

/** Weather conditions that deal tick damage at turn start */
export const DAMAGING_WEATHER: PtuWeather[] = ['hail', 'sandstorm']

/** Weather conditions that modify move damage bases */
export const MODIFIER_WEATHER: PtuWeather[] = ['rain', 'sunny']
```

---

## Weather Damage Formulas

### Hail Damage (PTU p.341)

> "While it is Hailing, all non-Ice Type Pokemon lose a Tick of Hit Points at the beginning of their turn."

- **Amount:** 1 Tick = `Math.max(1, Math.floor(maxHp / 10))`
- **Timing:** Beginning of each turn (turn start, before actions)
- **Exempt — by Type:** Ice-type Pokemon
- **Exempt — by Ability:**
  - Ice Body (also heals 1 tick instead of damage)
  - Snow Cloak (user immune + adjacent allies immune)
  - Snow Warning (static effect: user is not damaged by Hail)
  - Overcoat (immune to weather damage -- PTU errata)

### Sandstorm Damage (PTU p.341)

> "While it is Sandstorming, all non-Ground, Rock, or Steel Type Pokemon lose a Tick of Hit Points at the beginning of their turn."

- **Amount:** 1 Tick = `Math.max(1, Math.floor(maxHp / 10))`
- **Timing:** Beginning of each turn (turn start, before actions)
- **Exempt — by Type:** Ground, Rock, or Steel type Pokemon
- **Exempt — by Ability:**
  - Sand Veil (user immune + adjacent allies immune)
  - Sand Rush (immune to Sandstorm damage)
  - Sand Force (immune to Sandstorm damage)
  - Desert Weather (immune to Sandstorm damage)
  - Overcoat (immune to weather damage -- PTU errata)

### Rain/Sun Damage Modifiers (PTU pp.341-342)

> Rain: "Water-Type Attacks gain a +5 bonus to Damage Rolls, and Fire-Type Attacks suffer a -5 Damage penalty."
> Sun: "Fire-Type Attacks gain a +5 bonus to Damage Rolls, and Water-Type Attacks suffer a -5 Damage penalty."

- **Application point:** Applied to the move's Damage Base BEFORE set damage lookup
- **Amount:** +5 or -5 to Damage Base
- **Floor:** Damage Base cannot go below 1 after weather modifier

---

## Weather Ability Interactions

### Complete Ability-Weather Matrix

| Ability | Weather | Effect | Tier |
|---------|---------|--------|------|
| Ice Body | Hail | Heal 1 tick at turn start; immune to Hail damage | P1 |
| Snow Cloak | Hail | +2 Evasion; user + adjacent allies immune to Hail | P2 |
| Snow Warning | Hail | (Sets weather); static: immune to Hail damage | P0 (immunity only) |
| Rain Dish | Rain | Heal 1 tick at turn start | P1 |
| Swift Swim | Rain | +4 Speed CS (static, while weather active) | P1 |
| Hydration | Rain | Cure 1 status at turn end | P2 |
| Dry Skin | Rain | Heal 1 tick at turn end; immune to Water moves | P1 |
| Dry Skin | Sun | Lose 1 tick at turn end | P1 |
| Desert Weather | Rain | Heal 1/16th max HP at turn end | P1 |
| Desert Weather | Sandstorm | Immune to Sandstorm damage | P0 (immunity only) |
| Desert Weather | Sun | Resist Fire one step further | P1 |
| Sand Veil | Sandstorm | +2 Evasion; user + adjacent allies immune | P2 |
| Sand Rush | Sandstorm | +4 Speed CS; immune to Sandstorm damage | P1 (speed); P0 (immunity) |
| Sand Force | Sandstorm | +5 damage to Ground/Rock/Steel moves; immune | P2 (damage); P0 (immunity) |
| Chlorophyll | Sun | +4 Speed CS (static, while weather active) | P1 |
| Solar Power | Sun | +2 SpAtk CS; lose 1/16th max HP at turn start | P1 |
| Sun Blanket | Sun | +1 Fire resistance; heal 1 tick at turn start | P1 |
| Leaf Guard | Sun | Cure 1 status at turn end | P2 |
| Harvest | Sun | Digestion Buff auto-retain | P2 |
| Flower Gift | Sun | Burst 4 +2 CS distribution | P2 |
| Thermosensitive | Sun | +2 Atk/SpAtk CS | P2 |
| Thermosensitive | Hail | Movement halved | P2 |
| Forecast | Any | Type changes: Fire(Sun)/Water(Rain)/Ice(Hail)/Rock(Sandstorm) | P2 |

---

## Data Flow Diagram

```
WEATHER DAMAGE AT TURN START (P0):

  Next Turn Triggered
       |
       v
  Is weather active? (encounter.weather)
       |
       NO ──> Skip weather processing
       |
       YES
       |
       v
  Is weather Hail or Sandstorm?
       |
       NO ──> Skip weather damage (Rain/Sun have no turn-start damage)
       |
       YES
       |
       v
  Get current combatant (whose turn is starting)
       |
       v
  Is combatant immune by type?
       |
       +──> Hail: is combatant Ice-type? ──> IMMUNE, skip
       +──> Sandstorm: is combatant Ground/Rock/Steel-type? ──> IMMUNE, skip
       |
       v
  Is combatant immune by ability?
       |
       +──> Check ability list (Ice Body, Snow Cloak, Sand Veil, etc.)
       +──> Check adjacent allies for Snow Cloak / Sand Veil protection
       |
       IMMUNE ──> Skip damage (or apply healing for Ice Body)
       |
       v
  Calculate weather tick damage: Math.max(1, Math.floor(maxHp / 10))
       |
       v
  Apply damage via combatant.service.calculateDamage + applyDamageToEntity
       |
       v
  Check for injury, faint, death
       |
       v
  Sync to database
       |
       v
  Add weather tick to move log + broadcast via WebSocket
       |
       v
  Return weather damage result in response


WEATHER DAMAGE MODIFIERS (P1):

  Damage Calculation (damageCalculation.ts)
       |
       v
  Step 1: Start with Move's Damage Base
       |
       v
  Step 1.5 (NEW): Apply weather modifier to DB
       +──> Rain + Fire move: DB -= 5 (min 1)
       +──> Rain + Water move: DB += 5
       +──> Sun + Fire move: DB += 5
       +──> Sun + Water move: DB -= 5
       |
       v
  Step 2: Apply Five-Strike/Double-Strike
       |
       v
  Continue existing 9-step formula...


WEATHER ABILITY EFFECTS AT TURN START/END (P1/P2):

  Turn Start
       |
       v
  Check combatant abilities against current weather
       |
       +──> Ice Body + Hail: heal 1 tick
       +──> Rain Dish + Rain: heal 1 tick
       +──> Sun Blanket + Sun: heal 1 tick
       +──> Solar Power + Sun: lose 1/16th max HP
       |
       v
  Turn End
       |
       +──> Dry Skin + Rain: heal 1 tick
       +──> Dry Skin + Sun: lose 1 tick
       +──> Desert Weather + Rain: heal 1/16th max HP
       +──> Hydration + Rain: cure 1 status
       +──> Leaf Guard + Sun: cure 1 status
```

---

## Data Models

### No Schema Changes Required

Weather state is already tracked on the Encounter model:
- `weather: String?` -- current weather condition
- `weatherDuration: Int` -- rounds remaining
- `weatherSource: String?` -- source type ('move', 'ability', 'manual')

No new Prisma columns are needed. Weather effects are computed from existing combatant data (types, abilities) at turn processing time.

### Extended Damage Calculation Input (P1)

```typescript
// app/utils/damageCalculation.ts

export interface DamageCalcInput {
  // ... existing fields ...

  /** Active weather condition on the encounter (P1: type damage modifiers) */
  weather?: string | null
}
```

### Weather Tick Result Type

```typescript
// app/server/services/weather-automation.service.ts

/** Result of weather damage/healing at turn start */
export interface WeatherTickResult {
  combatantId: string
  combatantName: string
  weather: string
  effect: 'damage' | 'heal' | 'immune'
  amount: number
  formula: string
  newHp: number
  injuryGained: boolean
  fainted: boolean
  /** Why immune: 'type' | 'ability' | 'adjacent_ally' */
  immuneReason?: string
  /** Which ability granted immunity or triggered healing */
  immuneAbility?: string
}
```

---

## API Contracts

### No New Endpoints Required

Weather effects integrate into the existing `POST /api/encounters/:id/next-turn` endpoint. The response is extended with weather tick results.

### Extended Next-Turn Response (P0)

```typescript
{
  success: true,
  data: Encounter,
  // Existing fields...
  heavilyInjuredPenalty?: { ... },
  tickDamage?: TickDamageResult[],
  holdReleaseTriggered?: { ... }[],
  actionForfeitApplied?: boolean,

  // NEW: Weather effects processed at turn start
  weatherTick?: WeatherTickResult
}
```

### Extended Damage Calculation Response (P1)

The damage response includes whether weather modified the Damage Base:

```typescript
// In DamageCalcResult.breakdown:
{
  // ... existing fields ...

  /** Weather modifier applied to Damage Base (P1) */
  weatherModifier: number       // -5, 0, or +5
  weatherModifierApplied: boolean
}
```

---

## Constants

```typescript
// app/utils/weatherRules.ts

/** Weather damage = 1 Tick = 1/10th max HP (PTU p.246) */
export const WEATHER_TICK_FRACTION = 10

/** Rain/Sun damage modifier applied to Damage Base (PTU pp.341-342) */
export const WEATHER_DB_MODIFIER = 5

/** Speed CS bonus from Swift Swim / Chlorophyll / Sand Rush (PTU pp.311-335) */
export const WEATHER_SPEED_CS_BONUS = 4

/** Solar Power SpAtk CS bonus (PTU p.327) */
export const SOLAR_POWER_SPATK_BONUS = 2

/** Solar Power HP loss fraction: 1/16th max HP (PTU p.327) */
export const SOLAR_POWER_HP_FRACTION = 16

/** Snow Cloak / Sand Veil evasion bonus (PTU pp.327, 323) */
export const WEATHER_EVASION_BONUS = 2

/** Thermosensitive Atk/SpAtk CS bonus in Sun (PTU p.331) */
export const THERMOSENSITIVE_CS_BONUS = 2

/** Hail: types immune to weather damage */
export const HAIL_IMMUNE_TYPES = ['Ice']

/** Sandstorm: types immune to weather damage */
export const SANDSTORM_IMMUNE_TYPES = ['Ground', 'Rock', 'Steel']

/** Hail: abilities that grant immunity to weather damage */
export const HAIL_IMMUNE_ABILITIES = ['Ice Body', 'Snow Cloak', 'Snow Warning', 'Overcoat']

/** Sandstorm: abilities that grant immunity to weather damage */
export const SANDSTORM_IMMUNE_ABILITIES = ['Sand Veil', 'Sand Rush', 'Sand Force', 'Desert Weather', 'Overcoat']

/** Abilities that protect adjacent allies from Hail damage */
export const HAIL_ADJACENT_PROTECTION_ABILITIES = ['Snow Cloak']

/** Abilities that protect adjacent allies from Sandstorm damage */
export const SANDSTORM_ADJACENT_PROTECTION_ABILITIES = ['Sand Veil']
```

---

## Files Changed Summary (All Tiers)

### P0 (Weather Damage at Turn Start)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/utils/weatherRules.ts` | Weather type enum, immunity checks, constants |
| **NEW** | `app/server/services/weather-automation.service.ts` | Weather tick calculation + immunity logic |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Add weather tick processing at turn start |
| **EDIT** | `app/server/services/status-automation.service.ts` | Export `calculateTickDamage` for reuse |
| **EDIT** | `app/types/combat.ts` | (No changes needed -- existing types suffice) |

### P1 (Type Damage Modifiers + Speed Abilities + Weather Healing/Damage)
| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/utils/damageCalculation.ts` | Add weather DB modifier to DamageCalcInput, apply in step 1.5 |
| **EDIT** | `app/utils/weatherRules.ts` | Add speed ability checks, weather healing/damage functions |
| **EDIT** | `app/server/services/weather-automation.service.ts` | Add ability-based healing/damage at turn start/end |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Add ability weather effects at turn start/end |
| **EDIT** | `app/composables/useCombat.ts` | Pass weather to damage calculation calls |
| **EDIT** | `app/stores/encounter.ts` | Pass weather context to damage calculations |

### P2 (Weather Ball, Forecast, UI Indicators, Additional Abilities)
| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/utils/weatherRules.ts` | Weather Ball type lookup, Forecast type lookup |
| **NEW** | `app/components/encounter/WeatherEffectIndicator.vue` | Visual indicator of active weather effects on combatants |
| **EDIT** | `app/components/gm/EncounterHeader.vue` | Enhanced weather display with active effect summary |
| **EDIT** | `app/server/services/weather-automation.service.ts` | Forecast type change, additional ability effects |
| **EDIT** | `app/server/api/encounters/[id]/weather.post.ts` | Apply Forecast type change when weather is set |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Process additional weather abilities (Hydration, Leaf Guard, etc.) |
| **EDIT** | `app/composables/useCombat.ts` | Weather Ball type resolution in move selection |

---

## Undo/Redo Compatibility

Weather effects are applied to combatant entities (HP changes, CS changes) which are stored in the combatants JSON. The existing undo/redo snapshot system captures the full combatant array, so weather effect changes are automatically included in snapshots.

Weather state itself (weather, weatherDuration, weatherSource) is stored on the Encounter record and also captured by snapshots.

No special undo/redo handling is needed.

---

## WebSocket Compatibility

Weather tick results will be broadcast using the existing `status_tick` event type, with the condition field set to the weather name (e.g., `'Hail'`, `'Sandstorm'`). This reuses the existing Group View tick damage display.

Weather ability healing will be broadcast using a new `weather_effect` event to distinguish healing from damage.
