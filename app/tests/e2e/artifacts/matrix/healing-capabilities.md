---
domain: healing
mapped_at: 2026-02-19T00:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 51
files_read: 22
---

# App Capabilities: Healing

## Summary
- Total capabilities: 51
- Types: api-endpoint(13), service-function(5), composable-function(9), store-action(4), component(4), utility(8), constant(3), websocket-event(1), prisma-field(4)
- Orphan capabilities: 0

---

## healing-C001: Character 30-Minute Rest API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/rest.post.ts:default`
- **Game Concept:** 30-minute rest HP recovery
- **Description:** Applies 30 minutes of rest to a human character, healing 1/16th max HP. Auto-resets daily counters if a new calendar day has started.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }`
- **Orphan:** false

## healing-C002: Character Extended Rest API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/extended-rest.post.ts:default`
- **Game Concept:** Extended rest (4+ hours) — HP recovery, status clearing, AP restoration
- **Description:** Applies 8 rest periods (4 hours) of HP healing, clears persistent status conditions (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned), and restores all drained AP.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, clearedStatuses, apRestored, restMinutesToday, restMinutesRemaining } }`
- **Orphan:** false

## healing-C003: Character Pokemon Center API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/pokemon-center.post.ts:default`
- **Game Concept:** Pokemon Center full healing for trainers
- **Description:** Restores HP to full, clears all status conditions, heals injuries (max 3/day). Calculates healing time (1hr base + 30min/injury, or 1hr/injury if 5+). Does NOT restore drained AP.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, injuriesHealed, injuriesRemaining, clearedStatuses, apRestored: 0, healingTime, healingTimeDescription, atDailyInjuryLimit, injuriesHealedToday } }`
- **Orphan:** false

## healing-C004: Character Heal Injury API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/heal-injury.post.ts:default`
- **Game Concept:** Injury healing — natural (24h timer) or drain AP (trainers only)
- **Description:** Heals one injury via natural healing (24h since last injury) or AP drain (costs 2 AP). Enforces daily limit of 3 injuries healed from all sources. Natural method checks 24h timer; drain_ap method increments drainedAp by 2.
- **Inputs:** Character ID (URL param), `{ method: 'natural' | 'drain_ap' }` (body, defaults to 'natural')
- **Outputs:** `{ success, message, data: { injuriesHealed, injuries, drainedAp?, injuriesHealedToday } }`
- **Orphan:** false

## healing-C005: Character New Day API

- **Type:** api-endpoint
- **Location:** `server/api/characters/[id]/new-day.post.ts:default`
- **Game Concept:** Per-character daily counter reset
- **Description:** Resets a single character's daily healing counters: restMinutesToday → 0, injuriesHealedToday → 0, drainedAp → 0.
- **Inputs:** Character ID (URL param)
- **Outputs:** `{ success, message, data: { restMinutesToday, injuriesHealedToday, drainedAp, lastRestReset } }`
- **Orphan:** false

## healing-C006: Pokemon 30-Minute Rest API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/rest.post.ts:default`
- **Game Concept:** 30-minute rest HP recovery for Pokemon
- **Description:** Applies 30 minutes of rest to a Pokemon, healing 1/16th max HP. Same rules as character rest: blocked at 5+ injuries, capped at 480 min/day.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, restMinutesToday, restMinutesRemaining } }`
- **Orphan:** false

## healing-C007: Pokemon Extended Rest API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/extended-rest.post.ts:default`
- **Game Concept:** Extended rest (4+ hours) for Pokemon — HP recovery, status clearing, daily move restoration
- **Description:** Applies 8 rest periods of HP healing, clears persistent status conditions, resets daily move usage (usedToday → 0) and daily-frequency scene usage.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, clearedStatuses, restoredMoves, restMinutesToday, restMinutesRemaining } }`
- **Orphan:** false

## healing-C008: Pokemon Pokemon Center API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/pokemon-center.post.ts:default`
- **Game Concept:** Pokemon Center full healing for Pokemon
- **Description:** Full HP restoration, clears all status conditions, restores all move usage (usedToday and usedThisScene → 0), heals injuries (max 3/day). Calculates healing time.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { hpHealed, newHp, maxHp, injuriesHealed, injuriesRemaining, clearedStatuses, restoredMoves, healingTime, healingTimeDescription, atDailyInjuryLimit, injuriesHealedToday } }`
- **Orphan:** false

## healing-C009: Pokemon Heal Injury API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/heal-injury.post.ts:default`
- **Game Concept:** Natural injury healing for Pokemon (24h timer)
- **Description:** Heals one injury naturally after 24 hours since last injury. Enforces daily 3-injury limit. Pokemon do NOT have AP drain method (trainers only).
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { injuriesHealed, injuries, injuriesHealedToday } }`
- **Orphan:** false

## healing-C010: Pokemon New Day API

- **Type:** api-endpoint
- **Location:** `server/api/pokemon/[id]/new-day.post.ts:default`
- **Game Concept:** Per-Pokemon daily counter reset
- **Description:** Resets a single Pokemon's daily healing counters: restMinutesToday → 0, injuriesHealedToday → 0.
- **Inputs:** Pokemon ID (URL param)
- **Outputs:** `{ success, message, data: { restMinutesToday, injuriesHealedToday, lastRestReset } }`
- **Orphan:** false

## healing-C011: Global New Day API

- **Type:** api-endpoint
- **Location:** `server/api/game/new-day.post.ts:default`
- **Game Concept:** Global daily counter reset for all entities
- **Description:** Resets daily healing counters for ALL Pokemon (restMinutesToday, injuriesHealedToday) and ALL Characters (restMinutesToday, injuriesHealedToday, drainedAp) in a single operation.
- **Inputs:** None
- **Outputs:** `{ success, message, data: { pokemonReset, charactersReset, timestamp } }`
- **Orphan:** false

## healing-C012: Calculate Rest Healing

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculateRestHealing`
- **Game Concept:** 30-minute rest HP calculation formula
- **Description:** Pure function that calculates HP healed from a 30-minute rest. Returns 1/16th maxHp (min 1), capped at remaining HP. Returns canHeal=false if injuries >= 5, restMinutesToday >= 480, or already at maxHp.
- **Inputs:** `{ currentHp, maxHp, injuries, restMinutesToday }`
- **Outputs:** `{ hpHealed, canHeal, reason? }`
- **Orphan:** false

## healing-C013: Should Reset Daily Counters

- **Type:** utility
- **Location:** `utils/restHealing.ts:shouldResetDailyCounters`
- **Game Concept:** Daily rest counter reset detection
- **Description:** Checks if a new calendar day has started since lastReset. Returns true if lastReset is null or a different calendar day from now.
- **Inputs:** `lastReset: Date | null`
- **Outputs:** `boolean`
- **Orphan:** false

## healing-C014: Can Heal Injury Naturally

- **Type:** utility
- **Location:** `utils/restHealing.ts:canHealInjuryNaturally`
- **Game Concept:** Natural injury healing timer check (24h rule)
- **Description:** Returns true if 24+ hours have elapsed since lastInjuryTime. Returns false if lastInjuryTime is null.
- **Inputs:** `lastInjuryTime: Date | null`
- **Outputs:** `boolean`
- **Orphan:** false

## healing-C015: Calculate Pokemon Center Time

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculatePokemonCenterTime`
- **Game Concept:** Pokemon Center healing duration calculation
- **Description:** Calculates healing time: 1hr base + 30min per injury (or 1hr per injury if 5+). Returns breakdown and formatted description.
- **Inputs:** `injuries: number`
- **Outputs:** `{ baseTime, injuryTime, totalTime, timeDescription }`
- **Orphan:** false

## healing-C016: Calculate Pokemon Center Injury Healing

- **Type:** utility
- **Location:** `utils/restHealing.ts:calculatePokemonCenterInjuryHealing`
- **Game Concept:** Pokemon Center injury healing with daily cap
- **Description:** Calculates how many injuries can be healed at Pokemon Center given the daily 3-injury limit. Returns injuries actually healed, remaining injuries, and whether at daily limit.
- **Inputs:** `{ injuries, injuriesHealedToday }`
- **Outputs:** `{ injuriesHealed, remaining, atDailyLimit }`
- **Orphan:** false

## healing-C017: Get Statuses to Clear

- **Type:** utility
- **Location:** `utils/restHealing.ts:getStatusesToClear`
- **Game Concept:** Extended rest persistent status condition identification
- **Description:** Filters status conditions to find which ones would be cleared by extended rest (persistent conditions: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned).
- **Inputs:** `statusConditions: string[]`
- **Outputs:** `string[]` (persistent conditions present)
- **Orphan:** false

## healing-C018: Clear Persistent Status Conditions

- **Type:** utility
- **Location:** `utils/restHealing.ts:clearPersistentStatusConditions`
- **Game Concept:** Extended rest persistent status removal
- **Description:** Returns a new array with all persistent conditions removed (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned). Immutable — does not mutate input.
- **Inputs:** `statusConditions: string[]`
- **Outputs:** `string[]` (remaining non-persistent conditions)
- **Orphan:** false

## healing-C019: Get Rest Healing Info

- **Type:** utility
- **Location:** `utils/restHealing.ts:getRestHealingInfo`
- **Game Concept:** Healing status display data aggregation
- **Description:** Computes a full RestHealingInfo object for UI display: canRestHeal, restMinutesRemaining, hpPerRest, injury natural heal timing, daily injury remaining count.
- **Inputs:** `{ maxHp, injuries, restMinutesToday, lastInjuryTime, injuriesHealedToday }`
- **Outputs:** `RestHealingInfo` interface (canRestHeal, restMinutesRemaining, hpPerRest, injuries, canHealInjuryNaturally, hoursSinceLastInjury, hoursUntilNaturalHeal, injuriesHealedToday, injuriesRemainingToday)
- **Orphan:** false

## healing-C020: Composable — rest()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:rest`
- **Game Concept:** Client-side 30-minute rest action
- **Description:** Calls `POST /api/pokemon/:id/rest` or `POST /api/characters/:id/rest` depending on entity type. Manages loading/error state.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null` (success, message, data)
- **Orphan:** false

## healing-C021: Composable — extendedRest()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:extendedRest`
- **Game Concept:** Client-side extended rest action
- **Description:** Calls `POST /api/.../extended-rest` for the given entity type.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null`
- **Orphan:** false

## healing-C022: Composable — pokemonCenter()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:pokemonCenter`
- **Game Concept:** Client-side Pokemon Center healing action
- **Description:** Calls `POST /api/.../pokemon-center` for the given entity type.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null`
- **Orphan:** false

## healing-C023: Composable — healInjury()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:healInjury`
- **Game Concept:** Client-side injury healing action
- **Description:** Calls `POST /api/.../heal-injury` with method parameter ('natural' or 'drain_ap').
- **Inputs:** `type: 'pokemon' | 'character', id: string, method: 'natural' | 'drain_ap'`
- **Outputs:** `RestResult | null`
- **Orphan:** false

## healing-C024: Composable — newDay()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:newDay`
- **Game Concept:** Client-side per-entity daily reset action
- **Description:** Calls `POST /api/.../new-day` for a single Pokemon or Character.
- **Inputs:** `type: 'pokemon' | 'character', id: string`
- **Outputs:** `RestResult | null`
- **Orphan:** false

## healing-C025: Composable — newDayGlobal()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:newDayGlobal`
- **Game Concept:** Client-side global daily reset action
- **Description:** Calls `POST /api/game/new-day` to reset all entities' daily counters at once.
- **Inputs:** None
- **Outputs:** `RestResult | null`
- **Orphan:** false

## healing-C026: Composable — getHealingInfo()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:getHealingInfo`
- **Game Concept:** Client-side healing status computation
- **Description:** Wrapper around `getRestHealingInfo()` utility that converts string dates to Date objects for the underlying pure function.
- **Inputs:** `{ maxHp, injuries, restMinutesToday, lastInjuryTime: Date|string|null, injuriesHealedToday }`
- **Outputs:** `RestHealingInfo`
- **Orphan:** false

## healing-C027: Composable — formatRestTime()

- **Type:** composable-function
- **Location:** `composables/useRestHealing.ts:formatRestTime`
- **Game Concept:** Rest time display formatting
- **Description:** Formats rest minutes as human-readable "Xh Ym" string.
- **Inputs:** `minutes: number`
- **Outputs:** `string` (e.g., "4h 30m", "30m", "8h")
- **Orphan:** false

## healing-C028: Encounter Heal Combatant API

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/heal.post.ts:default`
- **Game Concept:** In-combat healing (HP, temp HP, injuries)
- **Description:** Applies healing to a combatant during an encounter. Supports HP healing (capped at maxHp), temp HP granting (stacks), and injury healing. Removes Fainted status if healed from 0 HP. Syncs changes to entity database record.
- **Inputs:** Encounter ID (URL param), `{ combatantId, amount?, tempHp?, healInjuries? }` (body)
- **Outputs:** `{ success, data: Encounter, healResult: { combatantId, hpHealed?, tempHpGained?, injuriesHealed?, newHp, newTempHp, newInjuries, faintedRemoved } }`
- **Orphan:** false

## healing-C029: Encounter Take a Breather API

- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/breather.post.ts:default`
- **Game Concept:** Take a Breather — PTU Full Action (p.245)
- **Description:** Resets all combat stages to 0, removes temp HP, cures all volatile status conditions (Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed) plus Slowed and Stuck. Applies Tripped and Vulnerable as temporary conditions until next turn. Marks standard action as used. Logs to move log.
- **Inputs:** Encounter ID (URL param), `{ combatantId }` (body)
- **Outputs:** `{ success, data: Encounter, breatherResult: { combatantId, stagesReset, tempHpRemoved, conditionsCured, trippedApplied, vulnerableApplied } }`
- **Orphan:** false

## healing-C030: Apply Healing to Entity (Service)

- **Type:** service-function
- **Location:** `server/services/combatant.service.ts:applyHealingToEntity`
- **Game Concept:** Core in-combat healing logic
- **Description:** Applies HP healing (capped at maxHp), grants temp HP (stacks with existing), heals injuries (can't go below 0), and removes Fainted status if healing from 0 HP. Mutates combatant entity in-place.
- **Inputs:** `combatant: Combatant, options: { amount?, tempHp?, healInjuries? }`
- **Outputs:** `HealResult { hpHealed?, tempHpGained?, injuriesHealed?, newHp, newTempHp, newInjuries, faintedRemoved }`
- **Orphan:** false

## healing-C031: Sync Healing to Database (Service)

- **Type:** service-function
- **Location:** `server/services/entity-update.service.ts:syncHealingToDatabase`
- **Game Concept:** Persist healing changes from encounter to entity DB record
- **Description:** Syncs currentHp, temporaryHp, injuries, and statusConditions from encounter combatant back to the underlying Pokemon or HumanCharacter database record.
- **Inputs:** `combatant: Combatant, currentHp, temporaryHp, injuries, statusConditions`
- **Outputs:** `Promise<void>`
- **Orphan:** false

## healing-C032: Sync Damage to Database (Service)

- **Type:** service-function
- **Location:** `server/services/entity-update.service.ts:syncDamageToDatabase`
- **Game Concept:** Persist damage and injury changes from encounter to entity DB record
- **Description:** Syncs currentHp, temporaryHp, injuries, statusConditions, and lastInjuryTime (if injury gained) to underlying DB record. Relevant to healing because injuries tracked here affect rest/healing logic.
- **Inputs:** `combatant, newHp, newTempHp, newInjuries, statusConditions, injuryGained`
- **Outputs:** `Promise<void>`
- **Orphan:** false

## healing-C033: Calculate Damage (Injury Mechanics)

- **Type:** service-function
- **Location:** `server/services/combatant.service.ts:calculateDamage`
- **Game Concept:** Damage → injury tracking (massive damage + HP marker crossings)
- **Description:** Calculates damage with PTU injury mechanics: temp HP absorbs first, massive damage (50%+ maxHp) = 1 injury, HP marker crossings (50%, 0%, -50%, -100%) = 1 injury each. Sets lastInjuryTime when injuries gained. Foundational for the healing system — determines injury state.
- **Inputs:** `damage, currentHp, maxHp, temporaryHp, currentInjuries`
- **Outputs:** `DamageResult { finalDamage, tempHpAbsorbed, hpDamage, newHp, newTempHp, injuryGained, massiveDamageInjury, markerInjuries, markersCrossed, totalNewInjuries, newInjuries, fainted }`
- **Orphan:** false

## healing-C034: Create Default Stage Modifiers (Service)

- **Type:** service-function
- **Location:** `server/services/combatant.service.ts:createDefaultStageModifiers`
- **Game Concept:** Stage modifier reset (used by Take a Breather)
- **Description:** Creates a default stage modifiers object with all stages at 0. Used by Take a Breather to reset combat stages.
- **Inputs:** None
- **Outputs:** `StageModifiers` (all zeroes)
- **Orphan:** false

## healing-C035: Store — healCombatant()

- **Type:** store-action
- **Location:** `stores/encounter.ts:healCombatant`
- **Game Concept:** Store action for in-combat healing
- **Description:** Calls `POST /api/encounters/:id/heal` with combatantId, amount, tempHp, healInjuries. Updates encounter state with response.
- **Inputs:** `combatantId, amount, tempHp, healInjuries`
- **Outputs:** Updates `this.encounter` with healed encounter state
- **Orphan:** false

## healing-C036: Store — takeABreather()

- **Type:** store-action
- **Location:** `stores/encounterCombat.ts:takeABreather`
- **Game Concept:** Store action for Take a Breather maneuver
- **Description:** Calls `POST /api/encounters/:id/breather` with combatantId. Returns updated encounter data.
- **Inputs:** `encounterId, combatantId`
- **Outputs:** `Encounter` (updated)
- **Orphan:** false

## healing-C037: Store — addInjury()

- **Type:** store-action
- **Location:** `stores/encounterCombat.ts:addInjury`
- **Game Concept:** Manual injury addition during encounter
- **Description:** Calls `POST /api/encounters/:id/injury` with combatantId and source description. Returns updated encounter.
- **Inputs:** `encounterId, combatantId, source`
- **Outputs:** `Encounter` (updated)
- **Orphan:** false

## healing-C038: Store — removeInjury()

- **Type:** store-action
- **Location:** `stores/encounterCombat.ts:removeInjury`
- **Game Concept:** Manual injury removal during encounter
- **Description:** Calls `DELETE /api/encounters/:id/injury` with combatantId. Returns updated encounter.
- **Inputs:** `encounterId, combatantId`
- **Outputs:** `Encounter` (updated)
- **Orphan:** false

## healing-C039: Composable — handleHeal()

- **Type:** composable-function
- **Location:** `composables/useEncounterActions.ts:handleHeal`
- **Game Concept:** Orchestrates in-combat healing with undo/redo support
- **Description:** Captures undo snapshot, calls `encounterStore.healCombatant()`, refreshes undo/redo state, and broadcasts the update via WebSocket.
- **Inputs:** `combatantId, amount, tempHp?, healInjuries?`
- **Outputs:** Side effects: encounter state updated, snapshot captured, broadcast sent
- **Orphan:** false

## healing-C040: HealingTab Component

- **Type:** component
- **Location:** `components/common/HealingTab.vue`
- **Game Concept:** Healing UI for character/Pokemon sheets
- **Description:** Displays healing status (current HP, injuries, rest today, HP per rest, injuries healed today, drained AP, natural injury timer) and action buttons: Rest 30min, Extended Rest, Pokemon Center, Natural Injury Heal, Drain AP (character only), New Day. Shows result messages (success/error). Calls `useRestHealing` composable for all actions.
- **Inputs:** Props: `entityType ('pokemon'|'character'), entityId, entity`
- **Outputs:** Emits `healed` event when any healing action completes
- **Orphan:** false

## healing-C041: Character Sheet Healing Tab Page

- **Type:** component
- **Location:** `pages/gm/characters/[id].vue` (healing tab section)
- **Game Concept:** Character sheet healing integration
- **Description:** Renders `<HealingTab>` with `entity-type="character"` in the character sheet's "Healing" tab. Reloads character data on `@healed` event.
- **Inputs:** Character data from page load
- **Outputs:** Displays HealingTab, triggers `loadCharacter()` on heal
- **Orphan:** false

## healing-C042: Pokemon Sheet Healing Tab Page

- **Type:** component
- **Location:** `pages/gm/pokemon/[id].vue` (healing tab section)
- **Game Concept:** Pokemon sheet healing integration
- **Description:** Renders `<HealingTab>` with `entity-type="pokemon"` in the Pokemon sheet's "Healing" tab. Reloads Pokemon data on `@healed` event.
- **Inputs:** Pokemon data from page load
- **Outputs:** Displays HealingTab, triggers `loadPokemon()` on heal
- **Orphan:** false

## healing-C043: GM Layout Advance Day Button

- **Type:** component
- **Location:** `layouts/gm.vue:handleAdvanceDay`
- **Game Concept:** Global new day UI trigger
- **Description:** "Advance Day" button in the GM header bar. Shows confirmation dialog, then calls `newDayGlobal()` from `useRestHealing`. Displays loading state and success alert.
- **Inputs:** User click + confirmation
- **Outputs:** Calls global new day API, shows alert on success
- **Orphan:** false

## healing-C044: Persistent Status Conditions Constant

- **Type:** constant
- **Location:** `constants/statusConditions.ts:PERSISTENT_CONDITIONS`
- **Game Concept:** Status conditions cleared by extended rest
- **Description:** Array of persistent conditions: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned. Used by `clearPersistentStatusConditions()` and `getStatusesToClear()`.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Orphan:** false

## healing-C045: Volatile Status Conditions Constant

- **Type:** constant
- **Location:** `constants/statusConditions.ts:VOLATILE_CONDITIONS`
- **Game Concept:** Status conditions cleared by Take a Breather
- **Description:** Array of volatile conditions: Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed. Used by breather endpoint to determine cured conditions.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Orphan:** false

## healing-C046: Breather Cured Conditions Constant

- **Type:** constant
- **Location:** `server/api/encounters/[id]/breather.post.ts:BREATHER_CURED_CONDITIONS`
- **Game Concept:** Full set of conditions cleared by Take a Breather
- **Description:** Combines VOLATILE_CONDITIONS + Slowed + Stuck. Per PTU 1.05 p.245, Take a Breather cures all volatile conditions plus Slowed and Stuck.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]`
- **Orphan:** false

## healing-C047: WebSocket heal_applied Event

- **Type:** websocket-event
- **Location:** `server/routes/ws.ts` (case 'heal_applied') and `types/api.ts:WebSocketEvent`
- **Game Concept:** Real-time healing broadcast to Group View
- **Description:** When healing is applied to a combatant, the `heal_applied` event is broadcast to all clients in the same encounter room. Event data: `{ combatantId, amount, newHp }`.
- **Inputs:** Event from GM client after healing action
- **Outputs:** Broadcast to all encounter-room clients (Group View, other GMs)
- **Orphan:** false

---

## Prisma Fields (Healing Tracking)

## healing-C048: HumanCharacter Healing Fields

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:HumanCharacter`
- **Game Concept:** Character rest & healing state persistence
- **Description:** Fields: `lastInjuryTime` (DateTime?, 24h timer), `restMinutesToday` (Int, max 480), `injuriesHealedToday` (Int, max 3), `lastRestReset` (DateTime?, daily counter reset), `drainedAp` (Int, restored by extended rest), `injuries` (Int), `temporaryHp` (Int), `currentHp` (Int), `maxHp` (Int), `statusConditions` (JSON string).
- **Inputs:** Updated by healing API endpoints
- **Outputs:** Read by healing API endpoints and composables
- **Orphan:** false

## healing-C049: Pokemon Healing Fields

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Pokemon`
- **Game Concept:** Pokemon rest & healing state persistence
- **Description:** Fields: `lastInjuryTime` (DateTime?, 24h timer), `restMinutesToday` (Int, max 480), `injuriesHealedToday` (Int, max 3), `lastRestReset` (DateTime?, daily counter reset), `injuries` (Int), `temporaryHp` (Int), `currentHp` (Int), `maxHp` (Int), `statusConditions` (JSON string). Note: Pokemon do NOT have `drainedAp`.
- **Inputs:** Updated by healing API endpoints
- **Outputs:** Read by healing API endpoints and composables
- **Orphan:** false

## healing-C050: Pokemon Type Healing Fields

- **Type:** prisma-field
- **Location:** `types/character.ts:Pokemon` (lines ~126-131)
- **Game Concept:** Client-side Pokemon healing type definition
- **Description:** TypeScript interface fields: `restMinutesToday`, `lastInjuryTime: string | null`, `injuriesHealedToday`. Used by HealingTab and composables for type safety.
- **Inputs:** Populated from API responses
- **Outputs:** Used by components and composables
- **Orphan:** false

## healing-C051: HumanCharacter Type Healing Fields

- **Type:** prisma-field
- **Location:** `types/character.ts:HumanCharacter` (lines ~187-193)
- **Game Concept:** Client-side character healing type definition
- **Description:** TypeScript interface fields: `restMinutesToday`, `lastInjuryTime: string | null`, `injuriesHealedToday`, `drainedAp`. Used by HealingTab and composables.
- **Inputs:** Populated from API responses
- **Outputs:** Used by components and composables
- **Orphan:** false

---

## Capability Chains

### Chain 1: Character 30-Minute Rest
1. `healing-C040` (component: HealingTab — handleRest) → 2. `healing-C020` (composable: rest()) → 3. `healing-C001` (api: characters/:id/rest) → 4. `healing-C013` (utility: shouldResetDailyCounters) → 5. `healing-C012` (utility: calculateRestHealing) → 6. `healing-C048` (prisma: HumanCharacter update)
**Breaks at:** complete

### Chain 2: Pokemon 30-Minute Rest
1. `healing-C042` (component: Pokemon sheet healing tab) → 2. `healing-C040` (component: HealingTab — handleRest) → 3. `healing-C020` (composable: rest()) → 4. `healing-C006` (api: pokemon/:id/rest) → 5. `healing-C013` (utility: shouldResetDailyCounters) → 6. `healing-C012` (utility: calculateRestHealing) → 7. `healing-C049` (prisma: Pokemon update)
**Breaks at:** complete

### Chain 3: Character Extended Rest
1. `healing-C040` (component: HealingTab — handleExtendedRest) → 2. `healing-C021` (composable: extendedRest()) → 3. `healing-C002` (api: characters/:id/extended-rest) → 4. `healing-C012` (utility: calculateRestHealing, 8x loop) → 5. `healing-C017` (utility: getStatusesToClear) → 6. `healing-C018` (utility: clearPersistentStatusConditions) → 7. `healing-C048` (prisma: update HP, status, drainedAp)
**Breaks at:** complete

### Chain 4: Pokemon Extended Rest
1. `healing-C040` (component: HealingTab — handleExtendedRest) → 2. `healing-C021` (composable: extendedRest()) → 3. `healing-C007` (api: pokemon/:id/extended-rest) → 4. `healing-C012` (utility: calculateRestHealing, 8x loop) → 5. `healing-C017` (utility: getStatusesToClear) → 6. `healing-C018` (utility: clearPersistentStatusConditions) → 7. `healing-C049` (prisma: update HP, status, moves)
**Breaks at:** complete

### Chain 5: Character Pokemon Center
1. `healing-C040` (component: HealingTab — handlePokemonCenter) → 2. `healing-C022` (composable: pokemonCenter()) → 3. `healing-C003` (api: characters/:id/pokemon-center) → 4. `healing-C015` (utility: calculatePokemonCenterTime) → 5. `healing-C016` (utility: calculatePokemonCenterInjuryHealing) → 6. `healing-C048` (prisma: full HP, clear status, heal injuries)
**Breaks at:** complete

### Chain 6: Pokemon Pokemon Center
1. `healing-C040` (component: HealingTab — handlePokemonCenter) → 2. `healing-C022` (composable: pokemonCenter()) → 3. `healing-C008` (api: pokemon/:id/pokemon-center) → 4. `healing-C015` (utility: calculatePokemonCenterTime) → 5. `healing-C016` (utility: calculatePokemonCenterInjuryHealing) → 6. `healing-C049` (prisma: full HP, clear status, heal injuries, restore moves)
**Breaks at:** complete

### Chain 7: Character Natural Injury Healing
1. `healing-C040` (component: HealingTab — handleHealInjury('natural')) → 2. `healing-C023` (composable: healInjury()) → 3. `healing-C004` (api: characters/:id/heal-injury) → 4. `healing-C014` (utility: canHealInjuryNaturally) → 5. `healing-C013` (utility: shouldResetDailyCounters) → 6. `healing-C048` (prisma: update injuries, injuriesHealedToday)
**Breaks at:** complete

### Chain 8: Character AP Drain Injury Healing
1. `healing-C040` (component: HealingTab — handleHealInjury('drain_ap')) → 2. `healing-C023` (composable: healInjury()) → 3. `healing-C004` (api: characters/:id/heal-injury with method='drain_ap') → 4. `healing-C013` (utility: shouldResetDailyCounters) → 5. `healing-C048` (prisma: update injuries, drainedAp, injuriesHealedToday)
**Breaks at:** complete

### Chain 9: Pokemon Natural Injury Healing
1. `healing-C040` (component: HealingTab — handleHealInjury('natural')) → 2. `healing-C023` (composable: healInjury()) → 3. `healing-C009` (api: pokemon/:id/heal-injury) → 4. `healing-C014` (utility: canHealInjuryNaturally) → 5. `healing-C013` (utility: shouldResetDailyCounters) → 6. `healing-C049` (prisma: update injuries, injuriesHealedToday)
**Breaks at:** complete

### Chain 10: Per-Entity New Day Reset
1. `healing-C040` (component: HealingTab — handleNewDay) → 2. `healing-C024` (composable: newDay()) → 3. `healing-C005` or `healing-C010` (api: characters/:id/new-day or pokemon/:id/new-day) → 4. `healing-C048`/`healing-C049` (prisma: reset counters)
**Breaks at:** complete

### Chain 11: Global New Day Reset
1. `healing-C043` (component: GM Layout Advance Day button) → 2. `healing-C025` (composable: newDayGlobal()) → 3. `healing-C011` (api: game/new-day) → 4. `healing-C048` + `healing-C049` (prisma: updateMany on both models)
**Breaks at:** complete

### Chain 12: In-Combat Healing
1. `healing-C039` (composable: useEncounterActions.handleHeal) → 2. `healing-C035` (store: encounter.healCombatant) → 3. `healing-C028` (api: encounters/:id/heal) → 4. `healing-C030` (service: applyHealingToEntity) → 5. `healing-C031` (service: syncHealingToDatabase) → 6. `healing-C047` (websocket: heal_applied broadcast)
**Breaks at:** complete

### Chain 13: Take a Breather
1. `healing-C039` (composable: useEncounterActions — maneuver 'take-a-breather') → 2. `healing-C036` (store: encounterCombat.takeABreather) → 3. `healing-C029` (api: encounters/:id/breather) → 4. `healing-C034` (service: createDefaultStageModifiers) → 5. `healing-C046` (constant: BREATHER_CURED_CONDITIONS) → 6. DB sync via encounter update
**Breaks at:** complete

### Chain 14: Injury from Damage (Foundation for Healing)
1. Damage action → 2. `healing-C033` (service: calculateDamage — injury detection) → 3. `healing-C032` (service: syncDamageToDatabase — sets lastInjuryTime) → 4. `healing-C048`/`healing-C049` (prisma: injuries, lastInjuryTime)
**Breaks at:** complete

### Chain 15: Healing Status Display
1. `healing-C041`/`healing-C042` (pages: character/Pokemon sheet) → 2. `healing-C040` (component: HealingTab) → 3. `healing-C026` (composable: getHealingInfo) → 4. `healing-C019` (utility: getRestHealingInfo) → 5. `healing-C014` (utility: canHealInjuryNaturally)
**Breaks at:** complete
