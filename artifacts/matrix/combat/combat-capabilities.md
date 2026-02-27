# Combat Domain — Application Capabilities

> Generated: 2026-02-28 | Source: deep-read of all combat source files

## Individual Capabilities

### combat-C001: Combat Stage Multiplier Table
- **type**: constant
- **location**: `app/utils/damageCalculation.ts` → `STAGE_MULTIPLIERS`
- **game_concept**: PTU Combat Stages (-6 to +6)
- **description**: Lookup table mapping combat stage values to stat multipliers. Positive stages: +20%/stage, negative stages: -10%/stage.
- **inputs**: Stage value (-6 to +6)
- **outputs**: Multiplier (0.4 to 2.2)
- **accessible_from**: gm, group, player (auto-imported utility)

### combat-C002: Apply Stage Modifier
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` → `applyStageModifier()`
- **game_concept**: PTU stat modification via combat stages
- **description**: Applies combat stage multiplier to a base stat. Clamps stage to -6/+6, floors result.
- **inputs**: baseStat (number), stage (number)
- **outputs**: Modified stat value (number)
- **accessible_from**: gm, group, player (auto-imported utility)

### combat-C003: Apply Stage Modifier With Bonus
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` → `applyStageModifierWithBonus()`
- **game_concept**: PTU Focus item bonus (p.295) applied after combat stages
- **description**: Applies stage modifier then adds a flat post-stage bonus (e.g., Focus +5). PTU p.295: bonus applied AFTER stages.
- **inputs**: baseStat, stage, postStageBonus
- **outputs**: Modified stat with bonus (number)
- **accessible_from**: gm, group, player

### combat-C004: STAB Check
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` → `hasSTAB()`
- **game_concept**: Same Type Attack Bonus (PTU p.790-793)
- **description**: Checks if the move's type matches any of the attacker's types for STAB (+2 DB).
- **inputs**: moveType (string), attackerTypes (string[])
- **outputs**: boolean
- **accessible_from**: gm, group, player

### combat-C005: Set Damage Lookup
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` → `getSetDamage()`
- **game_concept**: PTU Damage Base chart (p.921-985)
- **description**: Looks up the average set damage value for a given Damage Base (1-28).
- **inputs**: DB value (number)
- **outputs**: Set damage average (number)
- **accessible_from**: gm, group, player

### combat-C006: Damage Base Chart
- **type**: constant
- **location**: `app/utils/damageCalculation.ts` → `DAMAGE_BASE_CHART`
- **game_concept**: PTU DB-to-damage mapping
- **description**: Complete lookup table mapping DB 1-28 to min/avg/max damage values.
- **inputs**: DB value
- **outputs**: { min, avg, max }
- **accessible_from**: gm, group, player

### combat-C007: Full Damage Calculation
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` → `calculateDamage()`
- **game_concept**: PTU 9-step damage formula (p.834-847)
- **description**: Complete damage formula: DB + STAB → set damage + crit → add attack → subtract defense + DR → type effectiveness → min 1 (unless immune). Pure function with full breakdown.
- **inputs**: DamageCalcInput (attacker types/stats, move data, target types/stats, crit, DR, bonuses)
- **outputs**: DamageCalcResult (finalDamage + step-by-step breakdown)
- **accessible_from**: gm, group, player

### combat-C008: Evasion Calculation
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` → `calculateEvasion()`
- **game_concept**: PTU evasion (p.594-657) — stat-derived + bonus evasion
- **description**: Two-part evasion: (1) stage-modified stat → floor(stat/5) capped at +6, (2) additive bonus from moves/effects. Focus bonus applied before floor division. Total clamped to min 0.
- **inputs**: baseStat, combatStage, evasionBonus, statBonus
- **outputs**: Total evasion (number, min 0)
- **accessible_from**: gm, group, player

### combat-C009: Accuracy Threshold Calculation
- **type**: utility
- **location**: `app/utils/damageCalculation.ts` → `calculateAccuracyThreshold()`
- **game_concept**: PTU accuracy check (p.624-657)
- **description**: Calculates d20 threshold: moveAC + min(9, evasion) - accuracyStage. Clamped to min 1. Nat 1/20 handling delegated to caller.
- **inputs**: moveAC, attackerAccuracyStage, defenderEvasion
- **outputs**: Accuracy threshold (number)
- **accessible_from**: gm, group, player

### combat-C010: Type Effectiveness Chart
- **type**: constant
- **location**: `app/utils/typeChart.ts` → `TYPE_CHART` (re-exported via damageCalculation.ts)
- **game_concept**: PTU type effectiveness multipliers
- **description**: Complete 18-type effectiveness chart. Maps attacker type vs defender types to multiplier (0/0.25/0.5/1/1.5/2).
- **inputs**: Attacker type, defender types
- **outputs**: Effectiveness multiplier
- **accessible_from**: gm, group, player

### combat-C011: Compute Target Evasions
- **type**: utility
- **location**: `app/utils/evasionCalculation.ts` → `computeTargetEvasions()`
- **game_concept**: PTU evasion calculation for a combat target
- **description**: Computes physical, special, and speed evasion for a target combatant. Handles zero-evasion conditions (Vulnerable, Frozen, Asleep), equipment bonuses (shields, Focus), and evasion stage bonus. Checks both statusConditions and tempConditions.
- **inputs**: Combatant, EvasionDependencies
- **outputs**: EvasionValues { physical, special, speed }
- **accessible_from**: gm, group, player

### combat-C012: Combat Stage Multiplier Composable
- **type**: composable-function
- **location**: `app/composables/useCombat.ts` → `applyStageModifier()`
- **game_concept**: PTU combat stages applied to stats
- **description**: Composable wrapper applying combat stage multipliers. Delegates to damageCalculation utility.
- **inputs**: baseStat, stage
- **outputs**: Modified stat
- **accessible_from**: gm, group, player

### combat-C013: Pokemon Max HP Calculation
- **type**: composable-function
- **location**: `app/composables/useCombat.ts` → `calculatePokemonMaxHP()`
- **game_concept**: PTU HP formula: Level + (HP * 3) + 10
- **description**: Calculates Pokemon max HP from level and base HP stat.
- **inputs**: level, hpStat
- **outputs**: maxHp (number)
- **accessible_from**: gm, group, player

### combat-C014: Trainer Max HP Calculation
- **type**: composable-function
- **location**: `app/composables/useCombat.ts` → `calculateTrainerMaxHP()`
- **game_concept**: Trainer HP formula: Level*2 + (HP*3) + 10
- **description**: Calculates trainer max HP from level and HP stat.
- **inputs**: level, hpStat
- **outputs**: maxHp (number)
- **accessible_from**: gm, group, player

### combat-C015: Evasion Wrappers (Physical/Special/Speed)
- **type**: composable-function
- **location**: `app/composables/useCombat.ts` → `calculatePhysicalEvasion()`, `calculateSpecialEvasion()`, `calculateSpeedEvasion()`
- **game_concept**: PTU three evasion types
- **description**: Semantic wrappers over canonical calculateEvasion() for each of the three evasion types.
- **inputs**: stat, stageModifiers, evasionBonus, statBonus
- **outputs**: Evasion value (number)
- **accessible_from**: gm, group, player

### combat-C016: Injury Check
- **type**: composable-function
- **location**: `app/composables/useCombat.ts` → `checkForInjury()`
- **game_concept**: PTU injury from massive damage or HP marker crossing
- **description**: Checks if damage causes injury from massive damage (50%+ maxHP in one hit) or crossing HP markers (50%, 0%, -50%, -100%).
- **inputs**: previousHp, currentHp, maxHp, damageTaken
- **outputs**: { injured: boolean, reason: string }
- **accessible_from**: gm, group, player

### combat-C017: XP Gain Calculation
- **type**: composable-function
- **location**: `app/composables/useCombat.ts` → `calculateXPGain()`
- **game_concept**: PTU XP from defeating enemies
- **description**: Calculates XP gain per participant from a defeated entity's level.
- **inputs**: defeatedLevel, participantCount
- **outputs**: XP per participant (number)
- **accessible_from**: gm, group, player

### combat-C018: Can Act Check
- **type**: composable-function
- **location**: `app/composables/useCombat.ts` → `canAct()`
- **game_concept**: PTU action eligibility (fainted/frozen/asleep check)
- **description**: Returns whether an entity can act (not fainted, frozen, or asleep).
- **inputs**: Pokemon | HumanCharacter entity
- **outputs**: boolean
- **accessible_from**: gm, group, player

### combat-C019: Max Action Points
- **type**: composable-function
- **location**: `app/composables/useCombat.ts` → `calculateMaxActionPoints()`
- **game_concept**: PTU AP formula: 5 + floor(level/5)
- **description**: Calculates max AP for a trainer based on level.
- **inputs**: trainerLevel
- **outputs**: Max AP (number)
- **accessible_from**: gm, group, player

### combat-C020: Movement Modifier from Speed CS
- **type**: composable-function
- **location**: `app/composables/useCombat.ts` → `calculateMovementModifier()`, `calculateEffectiveMovement()`
- **game_concept**: PTU movement from Speed combat stages
- **description**: Calculates movement bonus/penalty from Speed CS (floor(CS/2)). Effective movement has min 2.
- **inputs**: speedCombatStages, baseMovement
- **outputs**: Modifier or effective movement
- **accessible_from**: gm, group, player

### combat-C021: Move Calculation Composable
- **type**: composable-function
- **location**: `app/composables/useMoveCalculation.ts` → `useMoveCalculation()`
- **game_concept**: PTU move execution pipeline (accuracy + damage)
- **description**: Full move execution composable: range/LoS filtering, STAB, accuracy roll (d20 vs threshold with nat 1/20), damage calculation with per-target type effectiveness and defense, rough terrain penalty, critical hits, fixed damage detection, equipment bonuses. Manages selected targets, roll state, and confirm data.
- **inputs**: move, actor, targets, allCombatants (all as Refs)
- **outputs**: Complete move calculation state and methods (selectedTargets, accuracyResults, damageCalcs, confirm data)
- **accessible_from**: gm

### combat-C022: Rough Terrain Accuracy Penalty
- **type**: composable-function
- **location**: `app/composables/useMoveCalculation.ts` → `getRoughTerrainPenalty()`, `targetsThroughRoughTerrain()`
- **game_concept**: PTU p.231 rough terrain -2 accuracy penalty
- **description**: Checks if line from attacker to target passes through rough terrain (enemy-occupied squares per decree-003, or painted terrain with rough flag per decree-010). Uses Bresenham's line algorithm. Naturewalk bypasses painted rough but NOT enemy-occupied rough. Returns +2 to accuracy threshold.
- **inputs**: targetId (string)
- **outputs**: Penalty value (0 or 2)
- **accessible_from**: gm

### combat-C023: Range and Line-of-Sight Filtering
- **type**: composable-function
- **location**: `app/composables/useMoveCalculation.ts` → `targetRangeStatus`, `inRangeTargets`, `outOfRangeTargets`
- **game_concept**: PTU move range and blocking terrain
- **description**: Determines which targets are in range and have line of sight from the attacker. Uses parsed move range and blocking terrain check. Non-VTT encounters treat all targets as in range.
- **inputs**: actor position, targets, move range, blocking terrain
- **outputs**: Per-target { inRange, reason } map, filtered target lists
- **accessible_from**: gm

### combat-C024: Equipment Bonuses for Combat
- **type**: utility
- **location**: `app/utils/equipmentBonuses.ts` → `computeEquipmentBonuses()`
- **game_concept**: PTU trainer equipment (Focus, Shield, Helmet, Heavy Armor)
- **description**: Computes all equipment-derived bonuses for a trainer: evasion bonus from shields, speed default CS from heavy armor, stat bonuses from Focus items, damage reduction from armor, conditional DR from helmets (crit only).
- **inputs**: Equipment object
- **outputs**: { evasionBonus, speedDefaultCS, statBonuses, damageReduction, conditionalDR }
- **accessible_from**: gm, group, player

### combat-C025: Encounter Actions Composable
- **type**: composable-function
- **location**: `app/composables/useEncounterActions.ts` → `useEncounterActions()`
- **game_concept**: PTU combat action orchestration
- **description**: Orchestrates all combat actions: damage, healing, stage changes, status updates, move execution, maneuver execution, VTT grid operations. Each action captures undo snapshot, broadcasts via WebSocket, and refreshes undo/redo state.
- **inputs**: encounter (Ref), send (WebSocket), refreshUndoRedoState
- **outputs**: Handler functions for all combat operations
- **accessible_from**: gm

### combat-C026: Combatant Damage Calculation (Server)
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `calculateDamage()`
- **game_concept**: PTU damage with temp HP, injuries, faint detection
- **description**: Server-side damage calculation: temp HP absorbs first, massive damage rule (50%+ maxHP = injury), HP marker crossing detection (50%, 0%, -50%, -100%, etc.), injury tracking, faint detection. Uses real maxHP for markers.
- **inputs**: damage, currentHp, maxHp, temporaryHp, currentInjuries
- **outputs**: DamageResult (newHp, newTempHp, injuries, markers crossed, faint status)
- **accessible_from**: gm (via API)

### combat-C027: HP Marker Crossing Counter
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `countMarkersCrossed()`
- **game_concept**: PTU HP markers at 50%, 0%, -50%, -100%
- **description**: Counts how many HP markers were crossed between previous and new HP values. Uses real maxHP (not injury-reduced). Generates marker thresholds at 50% steps into negative territory.
- **inputs**: previousHp, newHp, realMaxHp
- **outputs**: { count, markers[] }
- **accessible_from**: api-only (internal service)

### combat-C028: Apply Damage to Entity
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `applyDamageToEntity()`
- **game_concept**: PTU damage application with faint handling
- **description**: Mutates combatant entity with damage result. On faint: clears persistent and volatile conditions (PTU p.248), reverses CS effects from cleared conditions (decree-005), adds Fainted status. Other conditions (Stuck, Slowed, etc.) survive faint.
- **inputs**: combatant, DamageResult
- **outputs**: void (mutates entity)
- **accessible_from**: api-only (internal service)

### combat-C029: Combatant Healing (Server)
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `applyHealingToEntity()`
- **game_concept**: PTU healing (HP, temp HP, injuries)
- **description**: Heals a combatant: injuries healed first (so effective max HP reflects post-heal count), HP capped at injury-reduced effective max, temp HP keeps whichever is higher (old or new, no stacking). Removes Fainted status if healed from 0 HP.
- **inputs**: combatant, HealOptions { amount, tempHp, healInjuries }
- **outputs**: HealResult (amounts healed, faintedRemoved)
- **accessible_from**: api-only (internal service)

### combat-C030: Status Condition Management (Server)
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `updateStatusConditions()`
- **game_concept**: PTU status conditions with CS auto-application (decree-005)
- **description**: Add/remove status conditions on a combatant. Auto-applies/reverses CS effects for Burn (-2 Def), Paralysis (-4 Spd), Poison/Badly Poisoned (-2 SpDef) per decree-005. Tracks stage sources for clean reversal.
- **inputs**: combatant, addStatuses[], removeStatuses[]
- **outputs**: StatusChangeResult { added, removed, current, stageChanges }
- **accessible_from**: api-only (internal service)

### combat-C031: Status CS Effect Application
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `applyStatusCsEffects()`, `reverseStatusCsEffects()`, `reapplyActiveStatusCsEffects()`
- **game_concept**: Status condition inherent CS effects (decree-005)
- **description**: Applies/reverses/reapplies CS effects from status conditions. Records changes in stageSources for clean reversal. Reapply used after Take a Breather (stages reset but persistent conditions survive).
- **inputs**: combatant, condition
- **outputs**: void (mutates combatant stages and stageSources)
- **accessible_from**: api-only (internal service)

### combat-C032: Stage Modifier Management (Server)
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `updateStageModifiers()`
- **game_concept**: PTU combat stage changes (-6 to +6)
- **description**: Updates combat stage modifiers on a combatant. Supports delta or absolute mode. Clamps to -6/+6. Returns previous/change/current per stat.
- **inputs**: combatant, changes (Record<string, number>), isAbsolute
- **outputs**: StageChangeResult { changes, currentStages }
- **accessible_from**: api-only (internal service)

### combat-C033: Combatant Builder
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `buildCombatantFromEntity()`
- **game_concept**: PTU combatant initialization for encounter entry
- **description**: Builds a full Combatant wrapper from a typed entity. Calculates initiative from speed (with equipment bonuses for humans), resets stages to defaults (encounter-scoped per PTU p.235), applies heavy armor speed CS default, computes initial evasions, auto-applies CS effects from pre-existing status conditions (decree-005).
- **inputs**: BuildCombatantOptions { entityType, entityId, entity, side, initiativeBonus, position, tokenSize }
- **outputs**: Combatant (full combat wrapper)
- **accessible_from**: api-only (internal service)

### combat-C034: Initiative Recalculation
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `calculateCurrentInitiative()`
- **game_concept**: PTU dynamic initiative from Speed CS changes (decree-006)
- **description**: Recalculates a combatant's initiative from current CS-modified speed. Used for initiative reordering when Speed CS changes during combat.
- **inputs**: combatant
- **outputs**: New initiative value (number)
- **accessible_from**: api-only (internal service)

### combat-C035: Damage Application API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/damage.post.ts`
- **game_concept**: PTU damage application in encounter
- **description**: POST endpoint applying damage to a combatant with full PTU mechanics. Calculates damage (temp HP, injuries, faint), syncs to database, tracks defeated enemies for XP. Returns damage breakdown.
- **inputs**: { combatantId, damage }
- **outputs**: Encounter response + damageResult
- **accessible_from**: gm (via encounterStore.applyDamage)

### combat-C036: Healing Application API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/heal.post.ts`
- **game_concept**: PTU in-combat healing
- **description**: POST endpoint healing a combatant (HP, temp HP, injuries). Uses applyHealingToEntity service. Syncs to database.
- **inputs**: { combatantId, amount, tempHp, healInjuries }
- **outputs**: Encounter response + healResult
- **accessible_from**: gm (via encounterStore.healCombatant)

### combat-C037: Status Update API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/status.post.ts`
- **game_concept**: PTU status conditions with type immunity (decree-012) and Naturewalk immunity
- **description**: POST endpoint updating status conditions on a combatant. Checks type-based immunity (decree-012) and Naturewalk immunity (PTU p.276) before applying. Both can be GM-overridden. Auto-applies CS effects (decree-005). Triggers initiative reorder on Speed CS change (decree-006).
- **inputs**: { combatantId, add[], remove[], override }
- **outputs**: Encounter response + statusChange + initiativeReorder
- **accessible_from**: gm (via encounterCombatStore)

### combat-C038: Stage Update API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/stages.post.ts`
- **game_concept**: PTU combat stage modification
- **description**: POST endpoint modifying combat stages on a combatant. Validates stat names. Triggers initiative reorder on Speed CS change (decree-006).
- **inputs**: { combatantId, changes, absolute }
- **outputs**: Encounter response + stageChanges + initiativeReorder
- **accessible_from**: gm (via encounterCombatStore)

### combat-C039: Move Execution API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/move.post.ts`
- **game_concept**: PTU move execution with frequency tracking
- **description**: POST endpoint executing a move in combat. Validates frequency restrictions (Scene, EOT, Daily, At-Will). Processes per-target damage with full PTU pipeline. Increments move usage tracking. Logs to move log. Consumes standard action.
- **inputs**: { actorId, moveId, targetIds, damage, targetDamages, notes }
- **outputs**: Encounter response with updated combatants and move log
- **accessible_from**: gm (via encounterStore.executeMove)

### combat-C040: Take a Breather API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/breather.post.ts`
- **game_concept**: PTU Take a Breather maneuver (p.245)
- **description**: POST endpoint for Take a Breather full action. Resets stages (Heavy Armor preserves -1 Speed CS), removes temp HP, cures volatile conditions + Slowed/Stuck (except Cursed). Standard: Tripped + Vulnerable. Assisted: Tripped + ZeroEvasion (decree-005). Re-applies persistent status CS effects. Logs to move log.
- **inputs**: { combatantId, assisted }
- **outputs**: Encounter response + breatherResult
- **accessible_from**: gm (via encounterCombatStore.takeABreather)

### combat-C041: Sprint API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/sprint.post.ts`
- **game_concept**: PTU Sprint maneuver (p.245)
- **description**: POST endpoint adding Sprint tempCondition for +50% movement speed until next turn. Logs to move log.
- **inputs**: { combatantId }
- **outputs**: Encounter response + sprintResult
- **accessible_from**: gm (via encounterCombatStore.sprint)

### combat-C042: Pass Turn API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/pass.post.ts`
- **game_concept**: PTU pass/forfeit actions
- **description**: POST endpoint marking all actions as used, ending the combatant's turn. Logs to move log.
- **inputs**: { combatantId }
- **outputs**: Encounter response
- **accessible_from**: gm (via encounterCombatStore.pass)

### combat-C043: Next Turn API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/next-turn.post.ts`
- **game_concept**: PTU turn progression with League Battle phases
- **description**: POST endpoint advancing to next turn. Handles both Full Contact (linear) and League Battle (decree-021: declaration → resolution → pokemon → new round). Resets turn state, clears temp conditions (skip during declaration phase), decrements weather duration. Resets all combatants on new round.
- **inputs**: encounterId
- **outputs**: Encounter response with updated turn order
- **accessible_from**: gm (via encounterStore)

### combat-C044: Encounter Start API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/start.post.ts`
- **game_concept**: PTU encounter activation with initiative sorting
- **description**: POST endpoint activating an encounter. Resets turn states and scene-frequency moves. Sorts initiative: Full Contact = all by speed (high→low); League Battle = trainers by speed (low→high for declaration) + pokemon by speed (high→low). Uses roll-off for ties.
- **inputs**: encounterId
- **outputs**: Encounter response with turn order and phase
- **accessible_from**: gm (via encounterStore)

### combat-C045: Encounter End API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/end.post.ts`
- **game_concept**: PTU encounter end (volatile clearing, stage reset, AP restoration)
- **description**: POST endpoint ending an encounter. Clears volatile conditions (PTU p.247), resets stages to defaults, resets scene-frequency moves, unbinds AP (PTU Core p.59: Stratagems auto-unbind), restores scene-end AP for trainers.
- **inputs**: encounterId
- **outputs**: Encounter response (deactivated)
- **accessible_from**: gm (via encounterStore)

### combat-C046: Trainer Declaration API (League Battle)
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/declare.post.ts`
- **game_concept**: PTU League Battle declaration phase (decree-021)
- **description**: POST endpoint recording a trainer's declared action during declaration phase. Validates phase, turn order, combatant type (human only), and duplicate detection. Does NOT execute — only records for later resolution.
- **inputs**: { combatantId, actionType, description, targetIds }
- **outputs**: Encounter response with updated declarations
- **accessible_from**: gm

### combat-C047: Weather Management API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/weather.post.ts`
- **game_concept**: PTU weather system with duration tracking
- **description**: POST endpoint setting or clearing weather. Supports move/ability/manual sources. Move/ability weather defaults to 5 rounds (PTU). Manual weather is indefinite. Duration auto-decremented at end of round by next-turn.
- **inputs**: { weather, source, duration }
- **outputs**: Encounter response with weather state
- **accessible_from**: gm

### combat-C048: XP Calculation API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-calculate.post.ts`
- **game_concept**: PTU XP calculation (p.460)
- **description**: Read-only POST endpoint previewing XP for a completed encounter. Calculates from defeated enemies, significance multiplier, player count, and boss flag. Lists participating player-side Pokemon.
- **inputs**: { significanceMultiplier, playerCount, isBossEncounter, trainerEnemyIds }
- **outputs**: XP breakdown + participating Pokemon list
- **accessible_from**: gm

### combat-C049: XP Distribution API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/xp-distribute.post.ts`
- **game_concept**: PTU XP application with level-up
- **description**: POST endpoint applying XP to Pokemon. Verifies distribution doesn't exceed pool, calculates level-ups (experience, level, tutorPoints, maxHp level component), preserves full-HP state, marks encounter as XP distributed. Detects new learnset moves.
- **inputs**: { significanceMultiplier, playerCount, distribution[{pokemonId, xpAmount}] }
- **outputs**: Per-Pokemon application results with level-up details
- **accessible_from**: gm

### combat-C050: Significance Multiplier API
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/significance.put.ts`
- **game_concept**: PTU encounter significance (p.460)
- **description**: PUT endpoint persisting the GM-set significance multiplier (0.5-10) and tier on an encounter record.
- **inputs**: { significanceMultiplier, significanceTier }
- **outputs**: Updated significance data
- **accessible_from**: gm

### combat-C051: Combat Maneuvers Data
- **type**: constant
- **location**: `app/constants/combatManeuvers.ts` → `COMBAT_MANEUVERS`
- **game_concept**: PTU combat maneuvers (Push, Sprint, Trip, Grapple, Disarm, Dirty Trick, Intercept, Take a Breather)
- **description**: Array of 10 combat maneuvers with ID, name, action type (standard/full/interrupt), AC, icon, short description, and target requirement. Includes standard and assisted Take a Breather variants.
- **inputs**: N/A (constant data)
- **outputs**: Maneuver[]
- **accessible_from**: gm, group, player

### combat-C052: Status Condition Categories
- **type**: constant
- **location**: `app/constants/statusConditions.ts` → `PERSISTENT_CONDITIONS`, `VOLATILE_CONDITIONS`, `OTHER_CONDITIONS`, `ALL_STATUS_CONDITIONS`
- **game_concept**: PTU status condition classification
- **description**: Categorized arrays of all PTU status conditions. Persistent: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned. Volatile: Asleep, Bad Sleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed. Other: Fainted, Stuck, Slowed, Trapped, Tripped, Vulnerable.
- **inputs**: N/A
- **outputs**: StatusCondition arrays
- **accessible_from**: gm, group, player

### combat-C053: Zero-Evasion Conditions
- **type**: constant
- **location**: `app/constants/statusConditions.ts` → `ZERO_EVASION_CONDITIONS`
- **game_concept**: PTU conditions that set evasion to 0
- **description**: Conditions that force evasion to 0: Vulnerable, Frozen, Asleep.
- **inputs**: N/A
- **outputs**: StatusCondition[]
- **accessible_from**: gm, group, player

### combat-C054: Status CS Effects Data
- **type**: constant
- **location**: `app/constants/statusConditions.ts` → `STATUS_CS_EFFECTS`, `getStatusCsEffect()`
- **game_concept**: Inherent CS effects from status conditions (PTU p.246-247)
- **description**: Lookup table and getter for status-to-CS-effect mapping: Burned → -2 Def, Paralyzed → -4 Speed, Poisoned/Badly Poisoned → -2 SpDef.
- **inputs**: StatusCondition
- **outputs**: { stat, value } or undefined
- **accessible_from**: gm, group, player

### combat-C055: Combatant Capability Utilities
- **type**: utility
- **location**: `app/utils/combatantCapabilities.ts`
- **game_concept**: PTU movement capabilities (Overland, Swim, Sky, Burrow)
- **description**: Functions for querying combatant movement: canSwim, canBurrow, canFly, getSkySpeed, getOverlandSpeed, getSwimSpeed, getBurrowSpeed, getSpeedForTerrain, calculateAveragedSpeed (cross-terrain averaging per PTU p.231 and decree-011).
- **inputs**: Combatant, terrain type
- **outputs**: Speed values, boolean capability checks
- **accessible_from**: gm, group, player

### combat-C056: Naturewalk Capability
- **type**: utility
- **location**: `app/utils/combatantCapabilities.ts` → `getCombatantNaturewalks()`, `naturewalkBypassesTerrain()`
- **game_concept**: PTU Naturewalk (p.322) — ignore terrain modifiers
- **description**: Extracts Naturewalk terrain names from Pokemon capabilities (both direct field and otherCapabilities parsing). Checks if a combatant's Naturewalk bypasses rough/slow terrain flags. Does NOT bypass enemy-occupied rough (decree-003).
- **inputs**: Combatant, TerrainType
- **outputs**: Naturewalk terrain names, bypass boolean
- **accessible_from**: gm, group, player

### combat-C057: Naturewalk Status Immunity
- **type**: utility
- **location**: `app/utils/combatantCapabilities.ts` → `findNaturewalkImmuneStatuses()`
- **game_concept**: PTU Naturewalk immunity to Slowed/Stuck (p.276)
- **description**: Checks if a Pokemon with Naturewalk on matching terrain is immune to Slowed or Stuck status conditions.
- **inputs**: combatant, statuses[], terrainCells[], terrainEnabled
- **outputs**: Array of blocked statuses
- **accessible_from**: api-only (used by status.post.ts)

### combat-C058: Type Status Immunity
- **type**: utility
- **location**: `app/utils/typeStatusImmunity.ts` → `findImmuneStatuses()`
- **game_concept**: PTU type-based status immunities (decree-012)
- **description**: Checks if a Pokemon's types grant immunity to specific status conditions (e.g., Fire immune to Burned, Electric immune to Paralyzed).
- **inputs**: entityTypes[], statuses[]
- **outputs**: Array of { status, immuneType }
- **accessible_from**: api-only (used by status.post.ts)

### combat-C059: Entity Stats Composable
- **type**: composable-function
- **location**: `app/composables/useEntityStats.ts` → `useEntityStats()`
- **game_concept**: Safe stat access for diverse entity formats
- **description**: Composable for safely accessing entity stats from various formats (nested currentStats.attack vs flat currentAttack vs baseStats). Handles JSON string stage modifiers. Provides getters for all stat types and damage-class-aware stat selection.
- **inputs**: Entity object (unknown format)
- **outputs**: Typed stat values, stage modifiers
- **accessible_from**: gm, group, player

### combat-C060: Encounter Combat Store
- **type**: store-action
- **location**: `app/stores/encounterCombat.ts` → `useEncounterCombatStore`
- **game_concept**: PTU combat API client
- **description**: Pinia store providing typed methods for all combat-related API calls: addStatusCondition, removeStatusCondition, updateStatusConditions (with GM override), modifyStage, setCombatStages, addInjury, removeInjury, takeABreather (standard and assisted), sprint, pass, setPhase, nextScene.
- **inputs**: encounterId, combatantId, action-specific params
- **outputs**: Updated Encounter
- **accessible_from**: gm

### combat-C061: Entity Builders (Prisma → Typed)
- **type**: service-function
- **location**: `app/server/services/combatant.service.ts` → `buildPokemonEntityFromRecord()`, `buildHumanEntityFromRecord()`
- **game_concept**: Entity transformation for combat embedding
- **description**: Transforms Prisma database records into typed Pokemon/HumanCharacter entities. Parses JSON fields, maps DB column names to typed interface fields.
- **inputs**: PrismaPokemonRecord or PrismaHumanRecord
- **outputs**: Pokemon or HumanCharacter
- **accessible_from**: api-only (internal service)

### combat-C062: Combat Side Utilities
- **type**: utility
- **location**: `app/utils/combatSides.ts` → `isEnemySide()`
- **game_concept**: Three-sided combat (Players, Allies, Enemies)
- **description**: Determines if two combat sides are enemies of each other. Enemies side vs Players/Allies = true. Used for rough terrain enemy-occupied square detection.
- **inputs**: actorSide, combatantSide
- **outputs**: boolean
- **accessible_from**: gm, group, player

## Capability Chains

### Chain 1: Move Execution Pipeline
**Components**: MoveTargetModal (gm) → useMoveCalculation → useCombat + useEntityStats + useTypeChart + useRangeParser + terrainStore → move.post.ts → combatant.service → entity-update.service → Prisma
**Accessibility**: gm-only (MoveTargetModal is in GM encounter view)

### Chain 2: Damage Application
**Components**: EncounterView (gm) → useEncounterActions.handleDamage → encounterStore.applyDamage → damage.post.ts → combatant.service.calculateDamage + applyDamageToEntity → entity-update.service → Prisma
**Accessibility**: gm-only

### Chain 3: Status Condition Management
**Components**: StatusConditionModal (gm) → useEncounterActions.handleStatus → encounterCombatStore.updateStatusConditions → status.post.ts → combatant.service.updateStatusConditions + typeStatusImmunity + Naturewalk immunity → entity-update.service → Prisma
**Accessibility**: gm-only

### Chain 4: Combat Stage Modification
**Components**: StageModifierPanel (gm) → useEncounterActions.handleStages → encounterCombatStore.setCombatStages → stages.post.ts → combatant.service.updateStageModifiers → syncStagesToDatabase + initiative reorder → Prisma
**Accessibility**: gm-only

### Chain 5: Take a Breather
**Components**: GMActionModal (gm) → useEncounterActions.handleExecuteAction → encounterCombatStore.takeABreather → breather.post.ts → stage reset + volatile cure + tempConditions → Prisma
**Accessibility**: gm-only

### Chain 6: Turn Progression
**Components**: EncounterView (gm) → encounterStore.nextTurn → next-turn.post.ts → phase management + round advancement + weather decrement → Prisma
**Accessibility**: gm-only

### Chain 7: Encounter Lifecycle
**Components**: EncounterView (gm) → encounterStore.startEncounter/endEncounter → start.post.ts / end.post.ts → initiative sort / volatile clear + AP restore → Prisma
**Accessibility**: gm-only

### Chain 8: XP Distribution
**Components**: XpDistributionModal (gm) → xp-calculate.post.ts + xp-distribute.post.ts → experienceCalculation utils → Prisma (Pokemon level, experience, tutorPoints, maxHp)
**Accessibility**: gm-only

### Chain 9: In-Combat Healing
**Components**: HealModal (gm) → useEncounterActions.handleHeal → encounterStore.healCombatant → heal.post.ts → combatant.service.applyHealingToEntity → Prisma
**Accessibility**: gm-only

### Chain 10: League Battle Declaration
**Components**: DeclarationPanel (gm) → declare.post.ts → Prisma declarations JSON
**Accessibility**: gm-only

## Accessibility Summary

| Access Level | Capabilities |
|-------------|-------------|
| **gm-only** | C021-C023 (move calculation UI), C025 (encounter actions), C035-C050 (all encounter API endpoints), C060 (combat store) |
| **gm+group+player** | C001-C020 (pure calculations, composables), C024 (equipment bonuses), C051-C056 (constants, utilities), C059 (entity stats) |
| **api-only** | C026-C034 (combatant service internals), C057-C058 (immunity checks), C061 (entity builders), C062 (combat sides) |
| **group** | Display-only access to encounter state via WebSocket broadcast (encounter_update, turn_change, damage_applied, etc.) |
| **player** | No direct combat action capabilities — all combat actions are GM-proxy only |

## Missing Subsystems

### MS-1: Player Combat Action Interface
- **subsystem**: No player-facing UI for choosing and executing moves, using items, or declaring actions during combat
- **actor**: player
- **ptu_basis**: PTU assumes players choose their Pokemon's moves each turn and declare trainer actions in League Battles. Players need to select targets, confirm accuracy/damage, and manage their turn.
- **impact**: Players cannot directly participate in combat — the GM must act as proxy for all player-side combat decisions, slowing gameplay and removing player agency.

### MS-2: Player Turn Status Display
- **subsystem**: No player-facing display showing whose turn it is, available actions, or turn timer
- **actor**: player
- **ptu_basis**: PTU combat is turn-based with action economy (Standard, Shift, Swift actions). Players need to know when it's their turn and what actions remain.
- **impact**: Players have no visibility into the combat flow from their own device, must watch the group screen or rely on verbal GM announcements.

### MS-3: Player Pokemon Switch Interface
- **subsystem**: No player-facing UI for switching active Pokemon during combat (a trainer Standard Action)
- **actor**: player
- **ptu_basis**: PTU p.223: "Trainers may switch out their Active Pokemon as a Standard Action." Players need to choose which Pokemon to switch in from their party.
- **impact**: Pokemon switching requires GM proxy action — players cannot manage their own party in combat.

### MS-4: Player Item Use Interface
- **subsystem**: No player-facing UI for using items (potions, status heals, Poke Balls) during combat
- **actor**: player
- **ptu_basis**: PTU p.223-224: Using items is a Standard or Swift Action depending on item type. Players need to select items from inventory and apply them.
- **impact**: Item usage (healing, status curing, capture attempts) requires GM proxy.
