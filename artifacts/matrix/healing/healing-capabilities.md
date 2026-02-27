# Healing Domain — Application Capabilities

> Generated: 2026-02-28 | Source: deep-read of all healing source files

## Individual Capabilities

### healing-C001: Effective Max HP Calculation
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `getEffectiveMaxHp()`
- **game_concept**: PTU injury-reduced effective max HP (Core Chapter 9)
- **description**: Computes injury-reduced effective max HP. Each injury reduces max HP by 1/10th. Example: 50 maxHp with 3 injuries = floor(50 * 7/10) = 35. Caps at 10 injuries.
- **inputs**: maxHp (number), injuries (number)
- **outputs**: Effective max HP (number)
- **accessible_from**: gm, group, player (auto-imported utility)

### healing-C002: Rest Healing Calculation
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `calculateRestHealing()`
- **game_concept**: PTU 30-minute rest (p.250)
- **description**: Calculates HP healed from 30 minutes of rest. Heals 1/16th of REAL max HP (floor, no minimum per PTU p.31). Cannot heal if 5+ injuries. Daily cap: 8 hours (480 min). Healing cap: injury-reduced effective max HP.
- **inputs**: { currentHp, maxHp, injuries, restMinutesToday }
- **outputs**: { hpHealed, canHeal, reason }
- **accessible_from**: gm, group, player

### healing-C003: Daily Counter Reset Check
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `shouldResetDailyCounters()`
- **game_concept**: PTU daily healing counter reset
- **description**: Checks if daily counters should be reset by comparing calendar dates of last reset vs current time.
- **inputs**: lastReset (Date | null)
- **outputs**: boolean
- **accessible_from**: gm, group, player

### healing-C004: Natural Injury Healing Check
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `canHealInjuryNaturally()`
- **game_concept**: PTU natural injury healing (24 hours since last injury)
- **description**: Checks if 24 hours have passed since the last injury, enabling natural injury healing.
- **inputs**: lastInjuryTime (Date | null)
- **outputs**: boolean
- **accessible_from**: gm, group, player

### healing-C005: Pokemon Center Healing Time
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `calculatePokemonCenterTime()`
- **game_concept**: PTU Pokemon Center healing time
- **description**: Calculates total healing time at a Pokemon Center. Base: 1 hour. With <5 injuries: +30 min per injury. With 5+ injuries: +1 hour per injury. Returns formatted time description.
- **inputs**: injuries (number)
- **outputs**: { baseTime, injuryTime, totalTime, timeDescription }
- **accessible_from**: gm, group, player

### healing-C006: Pokemon Center Injury Healing
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `calculatePokemonCenterInjuryHealing()`
- **game_concept**: PTU Pokemon Center injury healing limit
- **description**: Calculates how many injuries can be healed at a Pokemon Center. Daily limit of 3 injuries from all sources. Returns injuries actually healed, remaining, and daily limit status.
- **inputs**: { injuries, injuriesHealedToday }
- **outputs**: { injuriesHealed, remaining, atDailyLimit }
- **accessible_from**: gm, group, player

### healing-C007: Persistent Status Clearing
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `getStatusesToClear()`, `clearPersistentStatusConditions()`
- **game_concept**: PTU extended rest clears persistent conditions
- **description**: Identifies and removes persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) from a conditions array. Used during extended rest.
- **inputs**: statusConditions (string[])
- **outputs**: Cleared conditions list, or filtered conditions array
- **accessible_from**: gm, group, player

### healing-C008: Rest Healing Info
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `getRestHealingInfo()`
- **game_concept**: PTU rest healing status display
- **description**: Compiles comprehensive rest healing info for display: canRestHeal, rest minutes remaining, HP per rest, injury status, natural injury heal eligibility, hours tracking, daily injury heal count/remaining.
- **inputs**: { maxHp, injuries, restMinutesToday, lastInjuryTime, injuriesHealedToday }
- **outputs**: RestHealingInfo (full status object)
- **accessible_from**: gm, group, player

### healing-C009: Daily Move Refresh Check
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `isDailyMoveRefreshable()`
- **game_concept**: PTU daily move refresh during Extended Rest (p.252)
- **description**: Checks if a daily-frequency move is eligible for Extended Rest refresh. Rolling window: moves used today cannot be refreshed by tonight's rest. Only moves used before today are eligible.
- **inputs**: lastUsedAt (string | null)
- **outputs**: boolean
- **accessible_from**: api-only (used by rest-healing.service)

### healing-C010: Max Action Points
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `calculateMaxAp()`
- **game_concept**: PTU AP formula: 5 + floor(level/5) (Core p.221)
- **description**: Calculates max AP for a trainer based on level. Level 1 = 5 AP, Level 5 = 6 AP, etc.
- **inputs**: level (number)
- **outputs**: Max AP (number)
- **accessible_from**: gm, group, player

### healing-C011: Available AP Calculation
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `calculateAvailableAp()`
- **game_concept**: PTU AP management (bound + drained, Core p.221)
- **description**: Calculates available AP: max AP - bound AP - drained AP. Clamped to min 0.
- **inputs**: maxAp, boundAp, drainedAp
- **outputs**: Available AP (number)
- **accessible_from**: gm, group, player

### healing-C012: Scene-End AP Restoration
- **type**: utility
- **location**: `app/utils/restHealing.ts` → `calculateSceneEndAp()`
- **game_concept**: PTU AP restoration at scene end (Core p.221)
- **description**: Calculates available AP after scene-end restoration. AP fully regained at scene end except drained AP (until Extended Rest) and bound AP (until binding effect ends).
- **inputs**: level, drainedAp, boundAp
- **outputs**: Restored AP (number)
- **accessible_from**: api-only (used by encounter end endpoint)

### healing-C013: Character Rest API (30-min)
- **type**: api-endpoint
- **location**: `app/server/api/characters/[id]/rest.post.ts`
- **game_concept**: PTU 30-minute rest for human characters
- **description**: POST endpoint applying 30 minutes of rest to a character. Auto-resets daily counters if new day. Heals 1/16th max HP subject to injury and daily cap constraints. Persists to database.
- **inputs**: characterId (URL param)
- **outputs**: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining }
- **accessible_from**: gm (via useRestHealing composable)

### healing-C014: Character Extended Rest API
- **type**: api-endpoint
- **location**: `app/server/api/characters/[id]/extended-rest.post.ts`
- **game_concept**: PTU extended rest (decree-018: configurable 4-8 hours)
- **description**: POST endpoint applying extended rest. Duration configurable (4-8 hours, default 4 per decree-018). Applies multiple 30-min rest periods for HP healing (respects daily cap). Clears persistent status conditions. Restores drained AP (bound AP preserved per decree-016). Refreshes daily-frequency moves on owned Pokemon (PTU p.252 rolling window rule).
- **inputs**: characterId (URL param), { duration } (optional, 4-8)
- **outputs**: { duration, hpHealed, newHp, clearedStatuses, apRestored, boundAp, restMinutesToday, pokemonMoveRefresh }
- **accessible_from**: gm (via useRestHealing composable)

### healing-C015: Character Injury Heal API
- **type**: api-endpoint
- **location**: `app/server/api/characters/[id]/heal-injury.post.ts`
- **game_concept**: PTU injury healing (natural or AP drain)
- **description**: POST endpoint healing one injury. Natural method: requires 24 hours since last injury. Drain AP method: drains 2 AP to heal 1 injury. Daily limit of 3 injuries from all sources. Clears lastInjuryTime when all injuries healed.
- **inputs**: characterId (URL param), { method: 'natural' | 'drain_ap' }
- **outputs**: { injuriesHealed, injuries, drainedAp, currentAp, injuriesHealedToday }
- **accessible_from**: gm (via useRestHealing composable)

### healing-C016: Character Pokemon Center API
- **type**: api-endpoint
- **location**: `app/server/api/characters/[id]/pokemon-center.post.ts`
- **game_concept**: PTU Pokemon Center healing for trainers
- **description**: POST endpoint applying Pokemon Center healing. Full HP restoration (to injury-reduced effective max), ALL status conditions cleared, injuries healed (up to daily limit of 3). Time: 1 hour base + 30 min/injury (or 1 hr/injury if 5+). Does NOT restore drained AP.
- **inputs**: characterId (URL param)
- **outputs**: { hpHealed, newHp, effectiveMaxHp, injuriesHealed, injuriesRemaining, clearedStatuses, healingTime }
- **accessible_from**: gm (via useRestHealing composable)

### healing-C017: Pokemon Rest API (30-min)
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/rest.post.ts`
- **game_concept**: PTU 30-minute rest for Pokemon
- **description**: POST endpoint applying 30 minutes of rest to a Pokemon. Same logic as character rest: 1/16th max HP, 5+ injury block, daily 8h cap. Auto-resets daily counters.
- **inputs**: pokemonId (URL param)
- **outputs**: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining }
- **accessible_from**: gm (via useRestHealing composable)

### healing-C018: Pokemon Extended Rest API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/extended-rest.post.ts`
- **game_concept**: PTU extended rest for Pokemon
- **description**: POST endpoint applying extended rest to a Pokemon. Same multi-period HP healing as character extended rest. Clears persistent status conditions. Refreshes daily-frequency moves (rolling window).
- **inputs**: pokemonId (URL param), { duration }
- **outputs**: { duration, hpHealed, newHp, clearedStatuses, restMinutesToday }
- **accessible_from**: gm (via useRestHealing composable)

### healing-C019: Pokemon Injury Heal API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/heal-injury.post.ts`
- **game_concept**: PTU natural injury healing for Pokemon
- **description**: POST endpoint healing one injury on a Pokemon. Natural method: requires 24 hours since last injury. Daily limit of 3 injuries.
- **inputs**: pokemonId (URL param), { method }
- **outputs**: { injuriesHealed, injuries, injuriesHealedToday }
- **accessible_from**: gm (via useRestHealing composable)

### healing-C020: Pokemon Pokemon Center API
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/pokemon-center.post.ts`
- **game_concept**: PTU Pokemon Center healing for Pokemon
- **description**: POST endpoint applying Pokemon Center healing to a Pokemon. Full HP restoration, all status conditions cleared, injuries healed (daily limit).
- **inputs**: pokemonId (URL param)
- **outputs**: { hpHealed, newHp, injuriesHealed, injuriesRemaining, clearedStatuses, healingTime }
- **accessible_from**: gm (via useRestHealing composable)

### healing-C021: Global New Day API
- **type**: api-endpoint
- **location**: `app/server/api/game/new-day.post.ts`
- **game_concept**: PTU new day reset (all daily counters)
- **description**: POST endpoint resetting all daily counters for ALL Pokemon and characters. Resets restMinutesToday, injuriesHealedToday, daily move usage, drained AP, bound AP, and restores full AP. Groups character updates by level for efficient batching.
- **inputs**: None
- **outputs**: { pokemonReset, pokemonMovesReset, charactersReset, timestamp }
- **accessible_from**: gm (via useRestHealing.newDayGlobal)

### healing-C022: Rest Healing Composable
- **type**: composable-function
- **location**: `app/composables/useRestHealing.ts` → `useRestHealing()`
- **game_concept**: Client-side rest/healing interface
- **description**: Composable providing all rest/healing operations: rest (30 min), extendedRest (configurable duration), pokemonCenter, healInjury (natural/drain_ap), getHealingInfo, formatRestTime, newDay (single entity), newDayGlobal (all entities). Manages loading/error state.
- **inputs**: Entity type + ID for per-entity operations
- **outputs**: { loading, error, rest, extendedRest, pokemonCenter, healInjury, getHealingInfo, formatRestTime, newDay, newDayGlobal }
- **accessible_from**: gm

### healing-C023: Daily Move Refresh Service
- **type**: service-function
- **location**: `app/server/services/rest-healing.service.ts` → `refreshDailyMoves()`, `refreshDailyMovesForOwnedPokemon()`
- **game_concept**: PTU daily move refresh during Extended Rest (Core p.252)
- **description**: Refreshes daily-frequency moves for a Pokemon or all Pokemon owned by a character. Rolling window: moves used today are skipped. Non-daily moves get usedToday cleaned for data hygiene. Reports which moves were restored vs skipped.
- **inputs**: moves[] for single Pokemon, or characterId for batch
- **outputs**: { updatedMoves, restoredMoves, skippedMoves } or DailyMoveRefreshResult[]
- **accessible_from**: api-only (used by extended-rest endpoints)

### healing-C024: In-Combat Healing (Server)
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `applyHealingToEntity()`
- **game_concept**: PTU in-combat healing (HP, temp HP, injuries)
- **description**: Heals a combatant during an encounter. Injuries healed first, then HP capped at injury-reduced effective max. Temp HP keeps higher of old vs new (no stacking). Removes Fainted status if healed from 0 HP.
- **inputs**: combatant, HealOptions { amount, tempHp, healInjuries }
- **outputs**: HealResult
- **accessible_from**: gm (via encounter heal endpoint)

### healing-C025: In-Combat Healing API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/heal.post.ts`
- **game_concept**: PTU in-combat healing via encounter
- **description**: POST endpoint healing a combatant within an encounter. Accepts HP amount, temp HP, and injury healing. Syncs to database.
- **inputs**: { combatantId, amount, tempHp, healInjuries }
- **outputs**: Encounter response + healResult
- **accessible_from**: gm

## Capability Chains

### Chain 1: 30-Minute Rest (Character)
**Components**: RestPanel (gm) → useRestHealing.rest → characters/[id]/rest.post.ts → restHealing.calculateRestHealing → Prisma (currentHp, restMinutesToday)
**Accessibility**: gm-only

### Chain 2: 30-Minute Rest (Pokemon)
**Components**: RestPanel (gm) → useRestHealing.rest → pokemon/[id]/rest.post.ts → restHealing.calculateRestHealing → Prisma (currentHp, restMinutesToday)
**Accessibility**: gm-only

### Chain 3: Extended Rest (Character)
**Components**: RestPanel (gm) → useRestHealing.extendedRest → characters/[id]/extended-rest.post.ts → restHealing (multi-period HP) + clearPersistentStatus + AP restore + rest-healing.service.refreshDailyMovesForOwnedPokemon → Prisma
**Accessibility**: gm-only

### Chain 4: Pokemon Center
**Components**: RestPanel (gm) → useRestHealing.pokemonCenter → characters/[id]/pokemon-center.post.ts (or pokemon/) → restHealing (full HP, status clear, injury heal) → Prisma
**Accessibility**: gm-only

### Chain 5: Injury Healing
**Components**: RestPanel (gm) → useRestHealing.healInjury → characters/[id]/heal-injury.post.ts (or pokemon/) → restHealing (natural or drain_ap) → Prisma
**Accessibility**: gm-only

### Chain 6: Global New Day
**Components**: GM Settings (gm) → useRestHealing.newDayGlobal → game/new-day.post.ts → Prisma batch updates (all Pokemon + all Characters)
**Accessibility**: gm-only

### Chain 7: In-Combat Healing
**Components**: HealModal (gm) → useEncounterActions.handleHeal → encounterStore.healCombatant → encounters/[id]/heal.post.ts → combatant.service.applyHealingToEntity → Prisma
**Accessibility**: gm-only

### Chain 8: Encounter End AP Restoration
**Components**: EncounterView (gm) → encounterStore.endEncounter → encounters/[id]/end.post.ts → restHealing.calculateSceneEndAp → Prisma (boundAp = 0, currentAp restored)
**Accessibility**: gm-only

## Accessibility Summary

| Access Level | Capabilities |
|-------------|-------------|
| **gm-only** | C013-C022 (all REST/healing APIs and composable), C024-C025 (in-combat healing) |
| **gm+group+player** | C001-C008, C010-C011 (pure utility functions for display/calculation) |
| **api-only** | C009 (daily move refresh check), C012 (scene-end AP), C023 (daily move refresh service) |
| **group** | No healing capabilities (display only via WebSocket) |
| **player** | No healing capabilities |

## Missing Subsystems

### MS-1: Player Rest Interface
- **subsystem**: No player-facing UI for resting their own character or Pokemon (30-min rest, extended rest, Pokemon Center)
- **actor**: player
- **ptu_basis**: PTU rest is a player-initiated activity. Players decide when to rest, how long to rest, and which Pokemon to bring to the Pokemon Center. These are player decisions that should not require GM proxy action.
- **impact**: All rest/healing actions must be initiated by the GM. Players cannot independently manage their character or Pokemon recovery between encounters.

### MS-2: Player Healing Status Display
- **subsystem**: No player-facing display showing their character/Pokemon rest status (minutes rested today, injury heal eligibility, AP status)
- **actor**: player
- **ptu_basis**: Players need to make informed decisions about resting (how much rest they have left today, whether natural injury healing is available, their AP budget). This information should be visible on their own device.
- **impact**: Players have no visibility into their own healing state. They must ask the GM for status information that should be readily accessible.

### MS-3: Item-Based Healing
- **subsystem**: No healing via consumable items (Potions, Super Potions, Full Heals, Antidotes, etc.)
- **actor**: both
- **ptu_basis**: PTU has extensive item-based healing: Potions (heal HP), status cure items (Antidote, Paralyze Heal, etc.), Revive (restore fainted Pokemon). These are common player actions during and outside of combat.
- **impact**: HP/status healing from items must be manually applied by the GM editing stats directly. No automatic item consumption from inventory.
