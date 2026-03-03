# Testing Strategy

## Unit Tests (P0)

### `app/tests/unit/utils/weatherRules.test.ts`

#### Type Guards and Constants
- `isPtuWeather` returns true for 'hail', 'sandstorm', 'rain', 'sunny'
- `isPtuWeather` returns false for 'snow', 'fog', null, undefined
- `isDamagingWeather` returns true for 'hail', 'sandstorm'
- `isDamagingWeather` returns false for 'rain', 'sunny', null
- `HAIL_IMMUNE_TYPES` contains 'Ice'
- `SANDSTORM_IMMUNE_TYPES` contains 'Ground', 'Rock', 'Steel'

#### getCombatantTypes
- Returns `[type1, type2]` for dual-typed Pokemon
- Returns `[type1]` for single-typed Pokemon
- Returns `[]` for human combatants (trainers have no type)
- Handles null/undefined type2 gracefully

#### getCombatantAbilities
- Returns ability names from Pokemon's abilities array
- Handles abilities stored as strings
- Handles abilities stored as `{ name: string }` objects
- Returns `[]` for human combatants
- Returns `[]` when abilities array is empty or undefined

#### isImmuneToHail
- Returns immune=true with reason='type' for Ice-type Pokemon
- Returns immune=true for dual-typed Pokemon where one type is Ice
- Returns immune=false for non-Ice-type Pokemon (e.g., Fire-type)
- Returns immune=true with reason='ability' for Pokemon with Ice Body
- Returns immune=true with reason='ability' for Pokemon with Snow Cloak
- Returns immune=true with reason='ability' for Pokemon with Snow Warning
- Returns immune=true with reason='ability' for Pokemon with Overcoat
- Returns immune=false for Pokemon without immune type or ability
- Returns immune=true with reason='adjacent_ally' when adjacent to ally with Snow Cloak
- Does not grant adjacent immunity from enemies with Snow Cloak (wrong side)
- Adjacent check requires position data (no position = no adjacent check)
- Ability matching is case-insensitive ('ice body' = 'Ice Body')
- Returns immune=false for human combatants (no type immunity)

#### isImmuneToSandstorm
- Returns immune=true with reason='type' for Ground-type Pokemon
- Returns immune=true with reason='type' for Rock-type Pokemon
- Returns immune=true with reason='type' for Steel-type Pokemon
- Returns immune=true for dual-typed Pokemon where one type is Ground/Rock/Steel
- Returns immune=false for non-Ground/Rock/Steel-type Pokemon
- Returns immune=true with reason='ability' for Pokemon with Sand Veil
- Returns immune=true with reason='ability' for Pokemon with Sand Rush
- Returns immune=true with reason='ability' for Pokemon with Sand Force
- Returns immune=true with reason='ability' for Pokemon with Desert Weather
- Returns immune=true with reason='ability' for Pokemon with Overcoat
- Returns immune=true with reason='adjacent_ally' when adjacent to ally with Sand Veil
- Does not grant adjacent immunity from enemies with Sand Veil
- Returns immune=false for human combatants

#### isImmuneToWeatherDamage
- Dispatches to isImmuneToHail for 'hail' weather
- Dispatches to isImmuneToSandstorm for 'sandstorm' weather
- Returns immune=true for non-damaging weather ('rain', 'sunny')

### `app/tests/unit/services/weather-automation.test.ts`

#### getWeatherTickForCombatant
- Returns `shouldApply: false` when weather is null
- Returns `shouldApply: false` when weather is 'rain' (non-damaging)
- Returns `shouldApply: false` when weather is 'sunny' (non-damaging)
- Returns `shouldApply: false` when combatant is fainted (HP = 0)
- Returns `shouldApply: true` for non-Ice Pokemon in Hail
- Returns `shouldApply: false` with immunity for Ice-type Pokemon in Hail
- Returns `shouldApply: true` for non-Ground/Rock/Steel Pokemon in Sandstorm
- Returns `shouldApply: false` with immunity for Ground-type Pokemon in Sandstorm
- Returns `shouldApply: false` for Pokemon with Ice Body in Hail
- Returns `shouldApply: false` for Pokemon with Sand Rush in Sandstorm
- Damage amount equals `Math.max(1, Math.floor(maxHp / 10))` (tick damage formula)
- Damage amount is at least 1 even for very low maxHp
- Formula string includes weather name and damage amount
- Returns immunity with correct reason and detail for type immunity
- Returns immunity with correct reason and detail for ability immunity

---

## Unit Tests (P1)

### `app/tests/unit/utils/damageCalculation-weather.test.ts`

#### getWeatherDamageModifier
- Returns +5 for Rain + Water move
- Returns -5 for Rain + Fire move
- Returns 0 for Rain + Normal move
- Returns +5 for Sun + Fire move
- Returns -5 for Sun + Water move
- Returns 0 for Sun + Normal move
- Returns 0 for Hail + any move
- Returns 0 for Sandstorm + any move
- Returns 0 when weather is null
- Returns 0 when weather is undefined
- Case-insensitive move type matching ('fire' and 'Fire' both work)

#### calculateDamage with weather modifier
- Rain + Fire move: effective DB reduced by 5 (minimum DB 1)
- Rain + Water move: effective DB increased by 5
- Sun + Fire move: effective DB increased by 5
- Sun + Water move: effective DB reduced by 5 (minimum DB 1)
- Weather modifier applied BEFORE STAB
- DB 1 + Fire in Rain: DB floors at 1 (not negative)
- DB 6 + Fire in Rain: DB becomes 1 (6-5=1)
- No weather: modifier is 0, no change to existing behavior
- `breakdown.weatherModifier` reflects the actual modifier applied
- `breakdown.weatherModifierApplied` is true when modifier != 0
- Backward compatible: omitting `weather` field gives same results as before

### `app/tests/unit/utils/weatherRules-speed.test.ts`

#### getWeatherSpeedBonuses
- Returns `[{ ability: 'Swift Swim', bonus: 4 }]` for Swift Swim in Rain
- Returns `[{ ability: 'Chlorophyll', bonus: 4 }]` for Chlorophyll in Sun
- Returns `[{ ability: 'Sand Rush', bonus: 4 }]` for Sand Rush in Sandstorm
- Returns `[]` for Swift Swim in Sun (wrong weather)
- Returns `[]` for Chlorophyll in Rain (wrong weather)
- Returns `[]` when weather is null
- Returns `[]` for human combatants (no abilities)
- Ability matching is case-insensitive

### `app/tests/unit/services/weather-automation-abilities.test.ts`

#### getWeatherAbilityEffects (turn_start)
- Ice Body + Hail: returns heal effect with amount = 1/10 max HP
- Rain Dish + Rain: returns heal effect with amount = 1/10 max HP
- Sun Blanket + Sun: returns heal effect with amount = 1/10 max HP
- Solar Power + Sun: returns damage effect with amount = 1/16 max HP
- No matching ability: returns empty array
- Wrong weather for ability: returns empty array
- Fainted combatant: returns empty array

#### getWeatherAbilityEffects (turn_end)
- Dry Skin + Rain: returns heal effect with amount = 1/10 max HP
- Dry Skin + Sun: returns damage effect with amount = 1/10 max HP
- Desert Weather + Rain: returns heal effect with amount = 1/16 max HP
- No matching ability: returns empty array
- Wrong weather for ability: returns empty array

---

## Unit Tests (P2)

### `app/tests/unit/utils/weatherRules-weatherball.test.ts`

#### getWeatherBallEffect
- Returns `{ type: 'Fire', damageBase: 10 }` for Sunny weather
- Returns `{ type: 'Water', damageBase: 10 }` for Rain weather
- Returns `{ type: 'Ice', damageBase: 10 }` for Hail weather
- Returns `{ type: 'Rock', damageBase: 10 }` for Sandstorm weather
- Returns `{ type: 'Normal', damageBase: 5 }` for no weather
- Returns `{ type: 'Normal', damageBase: 5 }` for non-PTU weather ('fog')

#### getForecastType
- Returns 'Fire' for Sunny weather
- Returns 'Water' for Rain weather
- Returns 'Ice' for Hail weather
- Returns 'Rock' for Sandstorm weather
- Returns 'Normal' for no weather
- Returns 'Normal' for null/undefined weather

### `app/tests/unit/api/weather-forecast.test.ts`

#### Forecast type change via weather endpoint
- Setting weather to Sunny changes Forecast Pokemon to Fire-type
- Setting weather to Rain changes Forecast Pokemon to Water-type
- Setting weather to Hail changes Forecast Pokemon to Ice-type
- Setting weather to Sandstorm changes Forecast Pokemon to Rock-type
- Clearing weather restores Forecast Pokemon to original types
- Changing weather (e.g., Rain -> Sun) changes type accordingly
- Original types are stored in `forecastOriginalTypes`
- Non-Forecast Pokemon are unaffected by weather type changes
- Multiple Forecast Pokemon in encounter are all updated

### `app/tests/unit/components/WeatherEffectIndicator.test.ts`

- Shows damage indicator for non-immune combatant in Hail
- Shows immune indicator for Ice-type Pokemon in Hail
- Shows immune indicator with ability name for Ice Body in Hail
- Shows nothing when no weather is active
- Shows nothing when weather is non-damaging and no abilities match
- Uses correct icon for each weather type (snowflake, wind, rain, sun)

---

## Integration Tests (P0)

### Full Weather Damage Cycle
1. Create encounter with 3 Pokemon: Ice-type, Fire-type, Ground-type
2. Set weather to Hail
3. Advance turn to Fire-type Pokemon
4. Verify weatherTick in response: damage = 1/10 max HP
5. Verify HP reduced correctly
6. Advance turn to Ice-type Pokemon
7. Verify weatherTick shows immune (reason: type, detail: Ice)
8. Verify HP unchanged
9. Change weather to Sandstorm
10. Advance turn to Fire-type Pokemon
11. Verify weatherTick: damage (Fire is not Ground/Rock/Steel)
12. Advance turn to Ground-type Pokemon
13. Verify weatherTick shows immune

### Weather Damage with Abilities
1. Create encounter with Pokemon that has Sand Rush ability
2. Set weather to Sandstorm
3. Advance turn to Sand Rush Pokemon
4. Verify weatherTick shows immune (reason: ability, detail: Sand Rush)

### Weather Duration Expiry
1. Create encounter with weather set via move (5 round duration)
2. Advance through 5 rounds
3. Verify weather is cleared on round 6
4. Verify no weather damage on next turn

### Weather Damage + Faint
1. Create encounter with Pokemon at low HP in Hail
2. Advance turn -- weather tick brings HP to 0
3. Verify faint status applied
4. Verify move log entry for weather damage

---

## Integration Tests (P1)

### Rain Damage Modifier
1. Create encounter with weather set to Rain
2. Execute Water-type attack on a target
3. Verify damage calculation shows `weatherModifier: 5` in breakdown
4. Verify effective DB is rawDB + 5
5. Execute Fire-type attack on a target
6. Verify damage calculation shows `weatherModifier: -5` in breakdown
7. Verify effective DB is rawDB - 5 (minimum 1)

### Sun Damage Modifier
1. Create encounter with weather set to Sunny
2. Execute Fire-type attack -- verify DB +5
3. Execute Water-type attack -- verify DB -5

### Speed CS Bonus Application
1. Create encounter with Swift Swim Pokemon, no weather
2. Verify Speed CS is baseline
3. Set weather to Rain
4. Verify Speed CS increased by 4
5. Verify `stageSources` contains `weather:rain:Swift Swim`
6. Change weather to Sunny (clear Rain)
7. Verify Speed CS returned to baseline
8. Verify weather stage sources cleared

### Weather Ability Healing
1. Create encounter with Ice Body Pokemon in Hail
2. Reduce Pokemon to 50% HP
3. Advance to Ice Body Pokemon's turn
4. Verify HP increased by 1/10 max HP (heal tick)
5. Verify no Hail weather damage (Ice Body grants immunity)

### Solar Power Damage + CS
1. Create encounter with Solar Power Pokemon in Sun
2. Verify SpAtk CS increased by 2
3. Advance to Solar Power Pokemon's turn
4. Verify HP reduced by 1/16 max HP

---

## Integration Tests (P2)

### Weather Ball Type Change
1. Create encounter with weather set to Rain
2. Select Weather Ball move
3. Verify move displays as Water-type, DB 10
4. Change weather to Sunny
5. Verify Weather Ball displays as Fire-type, DB 10
6. Clear weather
7. Verify Weather Ball displays as Normal-type, DB 5

### Forecast Type Change
1. Create encounter with Castform (Normal-type, Forecast ability)
2. Set weather to Sunny
3. Verify Castform's type1 is now 'Fire' and type2 is null
4. Verify `forecastOriginalTypes` stores { type1: 'Normal', type2: null }
5. Clear weather
6. Verify Castform's type1 restored to 'Normal'
7. Verify `forecastOriginalTypes` is cleared

### Forecast + Weather Ball STAB
1. Castform with Forecast in Sun becomes Fire-type
2. Uses Weather Ball (also Fire-type in Sun)
3. Verify STAB is applied (attacker type matches move type)

---

## Manual Testing Checklist

### Happy Path (P0)
- [ ] Set weather to Hail on an active encounter
- [ ] Advance turn to a non-Ice Pokemon -- verify weather damage badge and HP reduction
- [ ] Advance turn to an Ice-type Pokemon -- verify no damage, immune indicator
- [ ] Set weather to Sandstorm
- [ ] Advance turn to a non-Ground/Rock/Steel Pokemon -- verify weather damage
- [ ] Advance turn to a Ground/Rock/Steel Pokemon -- verify immune
- [ ] Verify weather damage appears in move log
- [ ] Verify weather damage broadcasts to Group View via WebSocket
- [ ] Verify undo restores weather damage correctly
- [ ] Clear weather -- verify no more weather damage on subsequent turns

### Type Modifiers (P1)
- [ ] Set weather to Rain, use a Fire attack -- verify DB reduced by 5
- [ ] Set weather to Rain, use a Water attack -- verify DB increased by 5
- [ ] Set weather to Sunny, use a Fire attack -- verify DB increased by 5
- [ ] Set weather to Sunny, use a Water attack -- verify DB reduced by 5
- [ ] Verify modifier shown in damage breakdown

### Speed Abilities (P1)
- [ ] Set weather to Rain with Swift Swim Pokemon -- verify +4 Speed CS
- [ ] Change weather away from Rain -- verify Speed CS restored
- [ ] Set weather to Sunny with Chlorophyll Pokemon -- verify +4 Speed CS
- [ ] Set weather to Sandstorm with Sand Rush Pokemon -- verify +4 Speed CS

### Weather Healing (P1)
- [ ] Ice Body Pokemon in Hail -- verify heals 1 tick at turn start
- [ ] Rain Dish Pokemon in Rain -- verify heals 1 tick at turn start
- [ ] Solar Power Pokemon in Sun -- verify loses HP and gains SpAtk CS
- [ ] Dry Skin Pokemon in Rain -- verify heals 1 tick at turn end
- [ ] Dry Skin Pokemon in Sun -- verify loses 1 tick at turn end

### Weather Ball (P2)
- [ ] Use Weather Ball in different weather conditions -- verify type and DB change
- [ ] Use Weather Ball with no weather -- verify Normal-type DB 5

### Forecast (P2)
- [ ] Castform type changes with weather
- [ ] Castform type restores when weather clears
- [ ] Castform sprite updates with type change (if implemented)

### Edge Cases
- [ ] Pokemon faints from weather damage at turn start -- faint status applied correctly
- [ ] Weather damage to Pokemon at exactly 1 HP -- verify faint
- [ ] Weather damage to trainer in Full Contact -- verify trainers take damage
- [ ] League Battle: weather damage does NOT fire during declaration phase
- [ ] Weather set mid-round -- speed CS bonuses apply immediately
- [ ] Multiple Pokemon with weather abilities -- all effects process correctly
- [ ] Pokemon adjacent to ally with Snow Cloak in Hail -- verify immune
- [ ] Two overlapping immunities (type + ability) -- handled without double-processing

### Group View
- [ ] Weather damage ticks appear on Group View via WebSocket
- [ ] Weather badge updates when weather changes
- [ ] Weather effect indicators visible on Group View combatant cards
