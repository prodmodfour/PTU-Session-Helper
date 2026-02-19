---
domain: combat
analyzed_at: 2026-02-19T14:00:00Z
analyzed_by: coverage-analyzer
total_rules: 135
implemented: 72
partial: 27
missing: 26
out_of_scope: 10
coverage_score: 68.4
---

# Feature Completeness Matrix: Combat

## Coverage Score
**68.4%** — (72 + 0.5 * 27) / (135 - 10) * 100

| Classification | Count |
|---------------|-------|
| Implemented | 72 |
| Partial | 27 |
| Missing | 26 |
| Out of Scope | 10 |
| **Total** | **135** |

---

## Implemented Rules

### combat-R001: Basic Combat Stats
- **Classification:** Implemented
- **Mapped to:** `combat-C045`, `combat-C046` — `buildPokemonEntityFromRecord`, `buildHumanEntityFromRecord` (`app/server/services/combatant.service.ts`) — entities carry all 6 basic stats + derived combat stats

### combat-R002: Pokemon HP Formula
- **Classification:** Implemented
- **Mapped to:** `combat-C058` — `calculatePokemonMaxHP` (`app/composables/useCombat.ts`) — Level + (HP stat x 3) + 10

### combat-R003: Trainer HP Formula
- **Classification:** Implemented
- **Mapped to:** `combat-C059` — `calculateTrainerMaxHP` (`app/composables/useCombat.ts`) — (Level x 2) + (HP stat x 3) + 10

### combat-R004: Accuracy Stat Baseline
- **Classification:** Implemented
- **Mapped to:** `combat-C015`, `combat-C042` — stages endpoint and `updateStageModifiers` (`app/server/services/combatant.service.ts`) — accuracy tracked as a combat stage, clamped -6/+6

### combat-R005: Physical Evasion Formula
- **Classification:** Implemented
- **Mapped to:** `combat-C047`, `combat-C060`, `combat-C061`, `combat-C167` — `initialEvasion` (server), `calculateEvasion`/`calculatePhysicalEvasion` (composable), `calculateEvasion` (utility) — floor(defense / 5), capped at +6

### combat-R006: Special Evasion Formula
- **Classification:** Implemented
- **Mapped to:** `combat-C047`, `combat-C060`, `combat-C062`, `combat-C167` — `initialEvasion` (server), `calculateEvasion`/`calculateSpecialEvasion` (composable), `calculateEvasion` (utility) — floor(spDef / 5), capped at +6

### combat-R007: Speed Evasion Formula
- **Classification:** Implemented
- **Mapped to:** `combat-C047`, `combat-C060`, `combat-C063`, `combat-C167` — `initialEvasion` (server), `calculateEvasion`/`calculateSpeedEvasion` (composable), `calculateEvasion` (utility) — floor(speed / 5), capped at +6

### combat-R008: Combat Stage Range and Multipliers
- **Classification:** Implemented
- **Mapped to:** `combat-C160`, `combat-C057`, `combat-C173` — `STAGE_MULTIPLIERS` constant, `applyStageModifier` (composable + utility) — clamped -6/+6, +20%/-10% per stage

### combat-R009: Combat Stage Multiplier Table
- **Classification:** Implemented
- **Mapped to:** `combat-C160` — `STAGE_MULTIPLIERS` (`app/utils/damageCalculation.ts`) — maps -6..+6 to 0.4..2.2

### combat-R017: Damage Base Table — Rolled Damage
- **Classification:** Implemented
- **Mapped to:** `combat-C174`, `combat-C176` — `roll`, `parseDiceNotation` (`app/utils/diceRoller.ts`) — dice roller handles XdY+Z notation

### combat-R018: Damage Base Table — Set Damage
- **Classification:** Implemented
- **Mapped to:** `combat-C161`, `combat-C171` — `DAMAGE_BASE_CHART`, `getSetDamage` (`app/utils/damageCalculation.ts`) — maps DB 1-28 to {min, avg, max}

### combat-R019: Damage Formula — Full Process
- **Classification:** Implemented
- **Mapped to:** `combat-C166` — `calculateDamage` (`app/utils/damageCalculation.ts`), Chain 4 (Calculate Damage Preview) — full 9-step pipeline: DB + STAB -> lookup -> crit -> attack stat -> defense - DR -> type effectiveness -> min 1

### combat-R020: Physical vs Special Damage
- **Classification:** Implemented
- **Mapped to:** `combat-C166` — `calculateDamage` (`app/utils/damageCalculation.ts`) — moveDamageClass determines which attack/defense stats are used

### combat-R021: STAB — Same Type Attack Bonus
- **Classification:** Implemented
- **Mapped to:** `combat-C172` — `hasSTAB` (`app/utils/damageCalculation.ts`) — checks moveType against attackerTypes, adds +2 DB

### combat-R025: Minimum Damage
- **Classification:** Implemented
- **Mapped to:** `combat-C166` — `calculateDamage` (`app/utils/damageCalculation.ts`) — minimum 1 damage unless immune (0)

### combat-R026: Type Effectiveness — Single Type
- **Classification:** Implemented
- **Mapped to:** `combat-C162`, `combat-C163`, `combat-C169` — `TYPE_CHART`, `NET_EFFECTIVENESS`, `getTypeEffectiveness` (`app/utils/typeChart.ts`) — 1.5x SE (PTU-correct), qualitative net system

### combat-R027: Type Effectiveness — Dual Type
- **Classification:** Implemented
- **Mapped to:** `combat-C169` — `getTypeEffectiveness` (`app/utils/typeChart.ts`) — iterates defender types, counts SE/resist/immune, nets to -3..+3, looks up multiplier

### combat-R032: Tick of Hit Points
- **Classification:** Implemented
- **Mapped to:** `combat-C036` — `calculateDamage` in `combatant.service.ts` — maxHP is tracked and 1/10th (tick) is implicitly available for all HP percentage checks

### combat-R034: Combat Types — League vs Full Contact
- **Classification:** Implemented
- **Mapped to:** `combat-C002`, `combat-C129` — encounter creation accepts `battleType` (trainer/full_contact), `isLeagueBattle` store getter

### combat-R036: Initiative — Speed Based
- **Classification:** Implemented
- **Mapped to:** `combat-C048`, `combat-C064`, `combat-C032` — `buildCombatantFromEntity` calculates initiative = speed + bonus, `calculateInitiative` composable, `sortByInitiativeWithRollOff` service

### combat-R038: Initiative — Full Contact Order
- **Classification:** Implemented
- **Mapped to:** `combat-C007`, `combat-C032` — start endpoint sorts all combatants by initiative descending for full_contact battles

### combat-R039: Initiative — Tie Breaking
- **Classification:** Implemented
- **Mapped to:** `combat-C032` — `sortByInitiativeWithRollOff` (`app/server/services/encounter.service.ts`) — d20 roll-off with re-rolls for remaining ties

### combat-R042: Action Types — Standard Action
- **Classification:** Implemented
- **Mapped to:** `combat-C009`, `combat-C156` — turn advancement resets actionsRemaining=2, `COMBAT_MANEUVERS` constant defines which maneuvers use standard actions

### combat-R043: Action Economy Per Turn
- **Classification:** Implemented
- **Mapped to:** `combat-C009`, `combat-C126` — next-turn resets actionsRemaining=2 and shiftActionsRemaining=1, `combatantsWithActions` getter tracks who has unused actions

### combat-R054: Combat Grid — Size Footprints
- **Classification:** Implemented
- **Mapped to:** `combat-C054` — `sizeToTokenSize` (`app/server/services/grid-placement.service.ts`) — Small/Medium=1, Large=2, Huge=3, Gigantic=4

### combat-R055: Movement — Shift Action
- **Classification:** Implemented
- **Mapped to:** `combat-C078`, `combat-C079`, `combat-C083`, `combat-C115` — `calculateMoveDistance`, `isValidMove`, `getMovementRangeCells` composables + `updateCombatantPosition` store action

### combat-R057: Diagonal Movement Costs
- **Classification:** Implemented
- **Mapped to:** `combat-C078`, `combat-C083`, `combat-C084` — `calculateMoveDistance` uses PTU alternating 1/2 diagonal cost, flood-fill in `getMovementRangeCells`, A* in `calculatePathCost`

### combat-R058: Adjacency Definition
- **Classification:** Implemented
- **Mapped to:** `combat-C081` — `isInRange` (`app/composables/useRangeParser.ts`) — Chebyshev distance for adjacency (diagonal counts), melee range = 1

### combat-R061: Terrain Types
- **Classification:** Implemented
- **Mapped to:** `combat-C134`, `combat-C135`, `combat-C136`, `combat-C164` — terrain store with setTerrain, getMovementCost, isPassable, `TERRAIN_COSTS` constant — normal=1, difficult=2, blocking=Infinity, water=2

### combat-R066: Evasion Max from Stats
- **Classification:** Implemented
- **Mapped to:** `combat-C047`, `combat-C060`, `combat-C167` — `initialEvasion` caps at 6, `calculateEvasion` uses min(6, floor(stat/5))

### combat-R067: Evasion Max Total Cap
- **Classification:** Implemented
- **Mapped to:** `combat-C070`, `combat-C168` — `getAccuracyThreshold`/`calculateAccuracyThreshold` — applies min(9, evasion) cap

### combat-R070: Combat Stages — Applicable Stats Only
- **Classification:** Implemented
- **Mapped to:** `combat-C043` — `validateStageStats` (`app/server/services/combatant.service.ts`) — validates against VALID_STATS (attack, defense, spAtk, spDef, speed, accuracy, evasion)

### combat-R071: Combat Stages — Persistence
- **Classification:** Implemented
- **Mapped to:** `combat-C042`, `combat-C053`, `combat-C049` — stages persisted to DB via `syncStagesToDatabase`/`syncEntityToDatabase`, survive turn advancement

### combat-R072: Massive Damage Injury
- **Classification:** Implemented
- **Mapped to:** `combat-C036`, `combat-C065` — `calculateDamage` in combatant.service checks for 50%+ maxHP damage, `checkForInjury` composable does client-side check

### combat-R073: Hit Point Marker Injuries
- **Classification:** Implemented
- **Mapped to:** `combat-C036`, `combat-C037` — `calculateDamage`/`countMarkersCrossed` (`app/server/services/combatant.service.ts`) — markers at 50%, 0%, -50%, -100% (and below)

### combat-R074: Injury Effect on Max HP
- **Classification:** Implemented
- **Mapped to:** `combat-C036` — damage calculation tracks injuries and their effect on max HP (1/10th reduction per injury)

### combat-R075: Injury Max HP — Uses Real Maximum for Calculations
- **Classification:** Implemented
- **Mapped to:** `combat-C037` — `countMarkersCrossed` uses `realMaxHp` parameter (not injury-reduced) per PTU rules

### combat-R077: Fainted Condition
- **Classification:** Implemented
- **Mapped to:** `combat-C036`, `combat-C038`, `combat-C069` — damage pipeline detects faint at 0 HP, `applyDamageToEntity` sets Fainted status, `canAct` returns false at 0 HP

### combat-R079: Fainted Clears All Status
- **Classification:** Implemented
- **Mapped to:** `combat-C038` — `applyDamageToEntity` (`app/server/services/combatant.service.ts`) — on faint, clears all status conditions and sets Fainted

### combat-R082: Struggle Attack
- **Classification:** Implemented
- **Mapped to:** `combat-C156` — `COMBAT_MANEUVERS` constant includes Struggle Attack reference data, usable via move execution pipeline

### combat-R085: Take a Breather
- **Classification:** Implemented
- **Mapped to:** `combat-C027`, `combat-C110`, Chain 7 — breather API: resets stages to 0, removes temp HP, cures volatile status + Slowed/Stuck, applies Tripped + Vulnerable

### combat-R088: Burned Status
- **Classification:** Implemented
- **Mapped to:** `combat-C157` — `PERSISTENT_CONDITIONS` includes Burned, can be added/removed via status pipeline (Chain 5)

### combat-R089: Frozen Status
- **Classification:** Implemented
- **Mapped to:** `combat-C157` — `PERSISTENT_CONDITIONS` includes Frozen, can be added/removed via status pipeline

### combat-R090: Paralysis Status
- **Classification:** Implemented
- **Mapped to:** `combat-C157` — `PERSISTENT_CONDITIONS` includes Paralyzed, can be added/removed via status pipeline

### combat-R091: Poisoned Status
- **Classification:** Implemented
- **Mapped to:** `combat-C157` — `PERSISTENT_CONDITIONS` includes Poisoned and Badly Poisoned, can be added/removed via status pipeline

### combat-R093: Sleep Status
- **Classification:** Implemented
- **Mapped to:** `combat-C158`, `combat-C069` — `VOLATILE_CONDITIONS` includes Asleep, `canAct` checks for Asleep status

### combat-R094: Confused Status
- **Classification:** Implemented
- **Mapped to:** `combat-C158` — `VOLATILE_CONDITIONS` includes Confused, can be added/removed via status pipeline

### combat-R095: Rage Status
- **Classification:** Implemented
- **Mapped to:** `combat-C158` — `VOLATILE_CONDITIONS` includes Enraged, can be added/removed via status pipeline

### combat-R096: Flinch Status
- **Classification:** Implemented
- **Mapped to:** `combat-C158` — `VOLATILE_CONDITIONS` includes Flinched, can be added/removed via status pipeline

### combat-R097: Infatuation Status
- **Classification:** Implemented
- **Mapped to:** `combat-C158` — `VOLATILE_CONDITIONS` includes Infatuated, can be added/removed via status pipeline

### combat-R099: Suppressed Status
- **Classification:** Implemented
- **Mapped to:** `combat-C158` — `VOLATILE_CONDITIONS` includes Suppressed, can be added/removed via status pipeline

### combat-R100: Cursed Status
- **Classification:** Implemented
- **Mapped to:** `combat-C158` — `VOLATILE_CONDITIONS` includes Cursed, can be added/removed via status pipeline

### combat-R102: Disabled Status
- **Classification:** Implemented
- **Mapped to:** `combat-C158` — `VOLATILE_CONDITIONS` includes Disabled, can be added/removed via status pipeline

### combat-R103: Temporary Hit Points
- **Classification:** Implemented
- **Mapped to:** `combat-C036`, `combat-C039`, `combat-C152` — damage pipeline absorbs temp HP first, healing can grant temp HP, TempHpModal component for management

### combat-R107: Tripped Condition
- **Classification:** Implemented
- **Mapped to:** `combat-C159` — `OTHER_CONDITIONS` includes Tripped, applied by Take a Breather and manageable via status pipeline

### combat-R108: Vulnerable Condition
- **Classification:** Implemented
- **Mapped to:** `combat-C159` — `OTHER_CONDITIONS` includes Vulnerable, applied by Take a Breather and manageable via status pipeline

### combat-R109: Trapped Condition
- **Classification:** Implemented
- **Mapped to:** `combat-C159` — `OTHER_CONDITIONS` includes Trapped, can be added/removed via status pipeline

### combat-R110: Attack of Opportunity
- **Classification:** Implemented
- **Mapped to:** `combat-C156` — `COMBAT_MANEUVERS` constant includes Attack of Opportunity reference data

### combat-R111: Disengage Maneuver
- **Classification:** Implemented
- **Mapped to:** `combat-C156` — `COMBAT_MANEUVERS` constant includes Disengage reference data

### combat-R112: Push Maneuver
- **Classification:** Implemented
- **Mapped to:** `combat-C156`, `combat-C145` — `COMBAT_MANEUVERS` includes Push (AC 4, standard), ManeuverGrid component displays it

### combat-R114: Trip Maneuver
- **Classification:** Implemented
- **Mapped to:** `combat-C156`, `combat-C145` — `COMBAT_MANEUVERS` includes Trip (AC 6, standard), ManeuverGrid component displays it

### combat-R115: Grapple Maneuver
- **Classification:** Implemented
- **Mapped to:** `combat-C156`, `combat-C145` — `COMBAT_MANEUVERS` includes Grapple (AC 4, standard), ManeuverGrid component displays it

### combat-R116: Intercept Melee Maneuver
- **Classification:** Implemented
- **Mapped to:** `combat-C156`, `combat-C145` — `COMBAT_MANEUVERS` includes Intercept Melee (full+interrupt), ManeuverGrid component displays it

### combat-R117: Intercept Ranged Maneuver
- **Classification:** Implemented
- **Mapped to:** `combat-C156`, `combat-C145` — `COMBAT_MANEUVERS` includes Intercept Ranged (full+interrupt), ManeuverGrid component displays it

### combat-R120: Disarm Maneuver
- **Classification:** Implemented
- **Mapped to:** `combat-C156` — `COMBAT_MANEUVERS` constant includes reference data for Disarm

### combat-R121: Dirty Trick Maneuver
- **Classification:** Implemented
- **Mapped to:** `combat-C156` — `COMBAT_MANEUVERS` constant includes reference data for Dirty Trick subtypes

### combat-R126: Resting — HP Recovery (cross-domain: healing)
- **Classification:** Implemented
- **Mapped to:** cross-domain — rest endpoints exist on characters/pokemon (`/api/characters/:id/rest`, `/api/pokemon/:id/rest`) per app-surface.md

### combat-R127: Extended Rest — Status and AP Recovery (cross-domain: healing)
- **Classification:** Implemented
- **Mapped to:** cross-domain — extended-rest endpoints exist (`/api/characters/:id/extended-rest`, `/api/pokemon/:id/extended-rest`) per app-surface.md

### combat-R128: Natural Injury Healing (cross-domain: healing)
- **Classification:** Implemented
- **Mapped to:** cross-domain — heal-injury endpoints exist (`/api/characters/:id/heal-injury`, `/api/pokemon/:id/heal-injury`) per app-surface.md

### combat-R129: Pokemon Center Healing (cross-domain: healing)
- **Classification:** Implemented
- **Mapped to:** cross-domain — pokemon-center endpoints exist (`/api/characters/:id/pokemon-center`, `/api/pokemon/:id/pokemon-center`) per app-surface.md

### combat-R130: Action Points (cross-domain: character-lifecycle)
- **Classification:** Implemented
- **Mapped to:** `combat-C071` — `calculateMaxActionPoints` (`app/composables/useCombat.ts`) — Max AP = 5 + floor(level / 5)

### combat-R132: Rounding Rule (cross-domain: system)
- **Classification:** Implemented
- **Mapped to:** `combat-C057`, `combat-C173`, `combat-C166` — all stage modifier and damage calculations use Math.floor

---

## Partial Rules

### combat-R010: Combat Stages Affect Evasion
- **Classification:** Partial
- **Present:** Evasion calculations use stage-modified stats (calculateEvasion uses stageModifiedStat / 5). Physical, Special, Speed evasion all factor in combat stages.
- **Missing:** No explicit Evasion Combat Stage that directly adds to evasion independently of the stat-derived calculation. The "evasion" field in stage modifiers exists but its interaction with stat-derived evasion is unclear from capability data alone.
- **Mapped to:** `combat-C060`, `combat-C167` — `calculateEvasion` in composable and utility
- **Gap Priority:** P2

### combat-R011: Accuracy Roll Mechanics
- **Classification:** Partial
- **Present:** Accuracy threshold calculation exists (`combat-C070`, `combat-C168`) and factors in accuracy combat stages and evasion.
- **Missing:** No automated d20 roll for accuracy. The app uses set damage mode and manual GM adjudication for accuracy. No dice-rolling workflow for accuracy checks.
- **Mapped to:** `combat-C070`, `combat-C168` — `getAccuracyThreshold`, `calculateAccuracyThreshold`
- **Gap Priority:** P2

### combat-R012: Accuracy Check Calculation
- **Classification:** Partial
- **Present:** Accuracy threshold computed from base AC + evasion - accuracy stages, capped at 9. Present in both composable and utility.
- **Missing:** The formula computes the threshold correctly but the automated check against a rolled d20 is not implemented. The GM must manually compare.
- **Mapped to:** `combat-C070`, `combat-C168` — accuracy threshold calculation
- **Gap Priority:** P2

### combat-R014: Natural 1 Always Misses
- **Classification:** Partial
- **Present:** The accuracy threshold function clamps minimum to 1 (max(1, ...)), which means a threshold of at least 2 is always needed.
- **Missing:** No explicit natural-1-always-misses check in automated code. This relies on GM manually ruling misses on natural 1.
- **Mapped to:** `combat-C168` — `calculateAccuracyThreshold` (min value 1)
- **Gap Priority:** P2

### combat-R015: Natural 20 Always Hits
- **Classification:** Partial
- **Present:** The accuracy calculation produces a threshold. A natural 20 would always exceed any reasonable threshold.
- **Missing:** No explicit natural-20-always-hits override. If threshold exceeds 20 (due to extreme evasion stacking), natural 20 would not be flagged as an auto-hit.
- **Mapped to:** `combat-C168` — `calculateAccuracyThreshold`
- **Gap Priority:** P2

### combat-R022: Critical Hit Trigger
- **Classification:** Partial
- **Present:** The calculate-damage endpoint accepts `isCritical?` flag. The GM can mark an attack as critical.
- **Missing:** No automated detection of critical hit from accuracy roll. GM must manually determine critical (natural 20) and toggle the flag.
- **Mapped to:** `combat-C029`, `combat-C166` — calculate-damage accepts isCritical parameter
- **Gap Priority:** P2

### combat-R023: Critical Hit Damage Calculation
- **Classification:** Partial
- **Present:** Critical hit damage is implemented: `rollCritical` utility rolls dice twice + doubles modifier. The 9-step damage formula accepts isCritical and adjusts.
- **Missing:** For set damage mode, the critical hit behavior needs auditor verification (should double the dice portion / add the set damage again, not just double everything).
- **Mapped to:** `combat-C166`, `combat-C175` — `calculateDamage` (isCritical path), `rollCritical`
- **Gap Priority:** P1

### combat-R033: Type Immunities to Status Conditions
- **Classification:** Partial
- **Present:** Status conditions are tracked and can be added/removed. The constants define all relevant conditions.
- **Missing:** No automatic enforcement of type immunities (e.g., Electric immune to Paralysis, Fire immune to Burn). The system allows adding any condition to any combatant without checking type.
- **Mapped to:** `combat-C016`, `combat-C040`, `combat-C041` — status validation only checks if condition name is valid, not type immunity
- **Gap Priority:** P1

### combat-R035: Round Structure — Two Turns Per Player
- **Classification:** Partial
- **Present:** Turn advancement exists. League battles have separate trainerTurnOrder and pokemonTurnOrder. actionsRemaining=2 per turn.
- **Missing:** No explicit two-turns-per-player enforcement where a player gets both a Trainer turn and a Pokemon turn each round. The system tracks per-combatant turns but the linkage between a player's Trainer and their Pokemon turn is not enforced.
- **Mapped to:** `combat-C007`, `combat-C009`, `combat-C127`, `combat-C128` — start/nextTurn with trainer/pokemon separation
- **Gap Priority:** P1

### combat-R037: Initiative — League Battle Order
- **Classification:** Partial
- **Present:** League battles generate separate trainerTurnOrder and pokemonTurnOrder. Store getters (`trainersByTurnOrder`, `pokemonByTurnOrder`) exist.
- **Missing:** PTU League rule: trainers declare lowest-to-highest speed, resolve highest-to-lowest. This declaration/resolution order is not enforced — the system just sorts by initiative.
- **Mapped to:** `combat-C007`, `combat-C127`, `combat-C128` — start endpoint separates trainer/pokemon orders
- **Gap Priority:** P1

### combat-R044: Standard-to-Shift/Swift Conversion
- **Classification:** Partial
- **Present:** Action tracking exists (actionsRemaining, shiftActionsRemaining). Store action `useAction` references exist.
- **Missing:** Backend endpoint for `useAction` (`/api/encounters/:id/action`) is not implemented (orphan capability `combat-C105`). No automated enforcement of standard-to-shift/swift conversion rules.
- **Mapped to:** `combat-C105` — orphan store action, backend not found
- **Gap Priority:** P1

### combat-R045: Full Action Definition
- **Classification:** Partial
- **Present:** Take a Breather consumes standard action (marked in breather endpoint). COMBAT_MANEUVERS constant marks Intercept maneuvers as "full" action type.
- **Missing:** No generic full action enforcement that automatically consumes both standard and shift actions. Each specific feature handles it individually.
- **Mapped to:** `combat-C027`, `combat-C156` — breather and maneuver constants
- **Gap Priority:** P2

### combat-R059: Stuck and Slowed Conditions on Movement
- **Classification:** Partial
- **Present:** Stuck and Slowed are defined in OTHER_CONDITIONS. Take a Breather cures them. They can be added/removed via status pipeline.
- **Missing:** No automated movement restriction enforcement. A Stuck combatant can still be moved on the grid. No automatic halving of movement for Slowed.
- **Mapped to:** `combat-C159`, `combat-C079` — conditions exist, movement validation does not check for Stuck/Slowed
- **Gap Priority:** P1

### combat-R060: Speed Combat Stages Affect Movement
- **Classification:** Partial
- **Present:** `calculateEffectiveMovement` composable exists: max(2, base + floor(speedCS / 2)). Formula is correct.
- **Missing:** The composable is orphaned (`combat-C072`, Orphan: true) — not wired into movement validation or grid movement checks. Movement on the grid does not factor in speed combat stages.
- **Mapped to:** `combat-C072` — orphan composable `calculateEffectiveMovement`
- **Gap Priority:** P1

### combat-R076: Heavily Injured — 5+ Injuries
- **Classification:** Partial
- **Present:** Injuries are tracked per combatant. The HP marker and massive damage injury system exists. Injured combatants getter (`combat-C125`) can filter.
- **Missing:** No automatic HP drain for heavily injured combatants (5+ injuries) when they take a standard action or take damage. This PTU mechanic is not enforced.
- **Mapped to:** `combat-C036`, `combat-C125` — injury tracking exists, no heavily-injured drain
- **Gap Priority:** P1

### combat-R078: Fainted Recovery
- **Classification:** Partial
- **Present:** Healing pipeline removes Fainted status if healed from 0 HP (`combat-C039`).
- **Missing:** No enforcement of the "Potions bring above 0 HP but remain Fainted for 10 minutes" distinction. All healing that brings above 0 removes Fainted immediately.
- **Mapped to:** `combat-C039` — `applyHealingToEntity` removes Fainted on any heal from 0
- **Gap Priority:** P2

### combat-R080: Death Conditions
- **Classification:** Partial
- **Present:** HP goes negative (unclamped for marker detection), injuries tracked. Combatants can reach fatal conditions.
- **Missing:** No automated death detection: 10 injuries, or -50 HP / -200% HP (whichever is lower) is not checked. The system only checks fainted (0 HP), not death thresholds.
- **Mapped to:** `combat-C036` — damage pipeline, no death check
- **Gap Priority:** P2

### combat-R092: Persistent Status — Cured on Faint
- **Classification:** Partial
- **Present:** `applyDamageToEntity` clears ALL status conditions on faint, which includes persistent ones.
- **Missing:** Need auditor to verify it clears persistent specifically (not just volatile). The description says "clears all status conditions" which should cover this, but correctness needs verification.
- **Mapped to:** `combat-C038` — `applyDamageToEntity` clears all statuses on faint
- **Gap Priority:** P3

### combat-R098: Volatile Status — Cured on Recall/Encounter End
- **Classification:** Partial
- **Present:** End encounter endpoint exists (`combat-C008`). Status conditions can be manually removed.
- **Missing:** No automatic clearing of volatile conditions on encounter end or Pokemon recall. The end-encounter endpoint preserves combatant state without clearing volatile statuses.
- **Mapped to:** `combat-C008`, `combat-C016` — end encounter and status management
- **Gap Priority:** P1

### combat-R104: Temporary HP — Does Not Count for Percentage
- **Classification:** Partial
- **Present:** Damage calculation uses real HP for marker detection and massive damage checks. Temp HP is tracked separately.
- **Missing:** Need auditor to verify that percentage calculations (HP markers, massive damage) explicitly exclude temp HP in all code paths.
- **Mapped to:** `combat-C036`, `combat-C037` — damage pipeline separates real HP from temp HP
- **Gap Priority:** P2

### combat-R105: Blindness Condition
- **Classification:** Partial
- **Present:** Blindness could be added as a custom status condition via the status pipeline.
- **Missing:** No -6 accuracy penalty enforcement. No Acrobatics check for terrain. Blindness is not in any predefined condition constant (PERSISTENT, VOLATILE, OTHER).
- **Mapped to:** `combat-C016` — general status management; Blindness not in predefined constants
- **Gap Priority:** P2

### combat-R113: Sprint Maneuver
- **Classification:** Partial
- **Present:** Sprint is listed in COMBAT_MANEUVERS constant with action type and description. ManeuverGrid component displays it.
- **Missing:** No automated 50% movement speed increase when Sprint is used. Sprint is reference-only — no backend logic applies the speed boost.
- **Mapped to:** `combat-C156`, `combat-C145` — constant data and display only
- **Gap Priority:** P2

### combat-R122: Manipulate Maneuver — Trainers Only
- **Classification:** Partial
- **Present:** The maneuver system exists and combat maneuvers are defined. Status conditions for Manipulate effects (Enraged, Infatuated) are in VOLATILE_CONDITIONS.
- **Missing:** Manipulate maneuver is not listed in COMBAT_MANEUVERS constant. No Bon Mot, Flirt, or Terrorize sub-options with skill check resolution.
- **Mapped to:** `combat-C156` — COMBAT_MANEUVERS does not include Manipulate
- **Gap Priority:** P2

### combat-R131: AP Accuracy Bonus (cross-domain: character-lifecycle)
- **Classification:** Partial
- **Present:** `calculateMaxActionPoints` exists (`combat-C071`). AP concept is known.
- **Missing:** No in-combat AP spending mechanism. The composable is orphaned (Orphan: true). No UI or backend for spending 1 AP to add +1 to accuracy.
- **Mapped to:** `combat-C071` — orphan composable
- **Gap Priority:** P2

### combat-R133: Percentages Additive Rule (cross-domain: system)
- **Classification:** Partial
- **Present:** Damage calculation handles type effectiveness as multiplicative (x1.5, x2.0), which is correct for PTU effectiveness. Stage multipliers are applied correctly.
- **Missing:** Need auditor to verify that any percentage-based bonuses are additive not multiplicative when multiple percentage sources stack.
- **Mapped to:** `combat-C166` — damage calculation pipeline
- **Gap Priority:** P3

### combat-R134: Armor Damage Reduction (cross-domain: gear, errata-modified)
- **Classification:** Partial
- **Present:** The damage calculation accepts a `damageReduction` parameter that is subtracted from damage.
- **Missing:** No armor system that automatically provides DR values based on equipped gear. The GM must manually enter DR.
- **Mapped to:** `combat-C029`, `combat-C166` — damageReduction input exists
- **Gap Priority:** P2

### combat-R135: Shield Evasion Bonus (cross-domain: gear, errata-modified)
- **Classification:** Partial
- **Present:** Evasion calculation accepts an `evasionBonus` parameter that is added to stat-derived evasion.
- **Missing:** No shield/gear system that automatically provides evasion bonuses. The GM must manually account for shields.
- **Mapped to:** `combat-C060`, `combat-C167` — evasionBonus input exists
- **Gap Priority:** P2

---

## Missing Rules

### combat-R013: Evasion Application Rules
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** PTU requires that physical evasion only applies to Defense-targeting moves, special evasion only to SpDef-targeting moves, and speed evasion to any move — but you may only add one evasion type per check. The calculate-damage endpoint computes all three dynamic evasions but the automatic selection logic (which evasion applies based on move damage class) is not enforced. The GM must manually choose the correct evasion.

### combat-R016: Accuracy Modifiers vs Dice Results
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** The distinction between accuracy modifiers affecting the total roll vs. not affecting natural dice results (for critical hits and move effects) is not implemented. The app does not automate accuracy rolling, so this is a non-issue in current manual-adjudication mode.

### combat-R024: Increased Critical Hit Range
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No mechanism to track or apply increased critical hit range (e.g., from moves or abilities that expand crit range below 20). The isCritical flag is binary — no range tracking.

### combat-R028: Type Effectiveness — Status Moves Excluded
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** The damage formula applies type effectiveness to all moves. There is no check for move damage class being Status (which should skip type effectiveness). Since Status moves do not deal damage through the damage formula normally, this is partially mitigated but not explicitly enforced.

### combat-R029: Type Effectiveness — Immunity vs Non-Standard Damage
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Moves like Sonic Boom or Counter that have non-standard damage are still affected by type immunity but not resistance. This edge case interaction is not modeled.

### combat-R030: Trainers Have No Type
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** The damage calculation requires targetTypes. If a trainer combatant is targeted, the system may not correctly default to no-type (neutral to all). No explicit "trainers have no type" enforcement in the damage pipeline.

### combat-R031: Hit Point Loss vs Dealing Damage
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No distinction between "loses HP" effects (no defense subtraction, no massive damage injury) and "dealing damage" effects (full damage pipeline). All HP reductions go through the same damage pipeline.

### combat-R040: Initiative — Holding Action
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** `setReadyAction` store action exists (`combat-C104`) but is an orphan — the backend endpoint `/api/encounters/:id/ready` is not implemented. No functional held action system.

### combat-R041: One Full Round Duration
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No timer or tracking for "one full round" duration effects (until same initiative count next round). Status conditions have no duration tracking — they persist until manually removed.

### combat-R046: Priority Action Rules
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No Priority keyword handling. The turn order is fixed by initiative — a combatant cannot declare a Priority action to act immediately out of order.

### combat-R047: Priority Limited and Advanced Variants
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Priority (Limited) and Priority (Advanced) variants are not implemented. Depends on combat-R046 base Priority.

### combat-R048: Interrupt Actions
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No Interrupt action system. Combatants cannot declare actions during another combatant's turn.

### combat-R049: Pokemon Switching — Full Switch
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** No Pokemon switching mechanic. There is no recall/release system, no switching as a standard action, no recall range checking (8m Poke Ball beam). Combatants can be added/removed by GM but this is administrative, not a game-mechanical switch.

### combat-R050: Pokemon Switching — League Restriction
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Depends on combat-R049. No League-specific switching penalty (released Pokemon cannot act for remainder of round).

### combat-R051: Fainted Pokemon Switch — Shift Action
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** No mechanism for switching out fainted Pokemon as a Shift Action. Depends on combat-R049 base switching.

### combat-R052: Recall and Release as Separate Actions
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No recall/release as separate Shift Actions. No multi-recall/release as Standard Action. Depends on combat-R049.

### combat-R053: Released Pokemon Can Act Immediately
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No Pokemon release mechanic, so no immediate-action-after-release logic. Depends on combat-R049.

### combat-R056: Movement — No Splitting
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No enforcement of the no-split rule (cannot move, take standard action, then continue moving). Grid movement is a single action but the constraint is not validated server-side.

### combat-R062: Rough Terrain Accuracy Penalty
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No automatic -2 accuracy penalty when targeting through Rough Terrain. The terrain system tracks terrain types and movement costs but does not apply accuracy modifiers. The occupied-square-as-rough-terrain rule is also not enforced.

### combat-R063: Flanking — Evasion Penalty
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No flanking detection system. The -2 evasion penalty for flanked combatants is not computed or applied.

### combat-R064: Flanking — Requirements by Size
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No flanking detection means the size-based flanking requirements (2 foes for Small/Medium, 3 for Large, 4 for Huge, 5 for Gigantic) are not checked. Depends on combat-R063.

### combat-R065: Flanking — Large Combatant Multiple Squares
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Edge-case flanking rule for multi-cell tokens. Depends on combat-R064.

### combat-R068: Evasion Bonus Clearing
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** When combat stages are cleared (e.g., Take a Breather), evasion bonuses should also be cleared. The system resets stage modifiers to 0 but there is no explicit evasion bonus tracking separate from stages.

### combat-R101: Bad Sleep Status
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Bad Sleep (lose 2 ticks on Sleep save check) is not in any condition constant. Edge-case status that can only apply to sleeping targets.

### combat-R124: Falling Damage Formula
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No falling damage calculation. Environmental damage that the GM can resolve manually using the damage application endpoint with a calculated value.

### combat-R125: Falling Injuries
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No automatic falling injury calculation (1 injury per 2 meters for 4+ meter falls). Depends on combat-R124.

---

## Out of Scope

### combat-R069: Willing Target
- **Classification:** Out of Scope
- **Justification:** The app is a GM-controlled session helper. The GM decides targeting. A "willing target" opt-in is a player-facing roleplay decision that the GM can handle by simply applying the move to the target without an evasion check.

### combat-R081: Death — League Exemption
- **Classification:** Out of Scope
- **Justification:** Death tracking itself is not fully implemented (combat-R080 is Partial). The League exemption is a narrative/sportsmanship rule that the GM enforces by simply not checking for death in League battles.

### combat-R083: Struggle Attack — Expert Combat Upgrade
- **Classification:** Out of Scope
- **Justification:** Requires Combat Skill Rank tracking at Expert or higher. Skill ranks are not the focus of the session helper combat system — the GM can manually adjust Struggle stats.

### combat-R084: Coup de Grace
- **Classification:** Out of Scope
- **Justification:** A Full Action against a helpless target with automatic critical hit. This is a very specific narrative combat action that the GM can resolve manually using the existing damage pipeline with the isCritical flag.

### combat-R086: Take a Breather — Assisted
- **Classification:** Out of Scope
- **Justification:** Assisted Breather requires a Command Check (DC 12) and coordination between two combatants. This is a complex multi-actor interaction the GM resolves narratively. The base Take a Breather is implemented.

### combat-R087: Take a Breather — Curse Exception
- **Classification:** Out of Scope
- **Justification:** Edge-case interaction requiring distance checking between the Cursed target and Curse source after Breather movement. This is a situational ruling the GM handles.

### combat-R106: Total Blindness Condition
- **Classification:** Out of Scope
- **Justification:** Extremely rare condition with complex map-awareness removal and -10 accuracy penalty. The GM can manually apply accuracy penalties and describe the condition narratively.

### combat-R118: Intercept — Loyalty Requirement
- **Classification:** Out of Scope
- **Justification:** Requires Pokemon Loyalty tracking (3+ for trainer, 6+ for any ally). Loyalty is not currently tracked in the combat system. The GM makes this determination.

### combat-R119: Intercept — Additional Rules
- **Classification:** Out of Scope
- **Justification:** Complex constraints (speed comparison for Priority/Interrupt, cannot-miss exclusion, status condition blocking). These are maneuver resolution details the GM adjudicates.

### combat-R123: Suffocating
- **Classification:** Out of Scope
- **Justification:** Environmental condition (1 injury/round without air) that rarely occurs in standard sessions. The GM can manually add injuries using the injury system.

---

## Self-Verification

### Coverage Score Check
- Implemented: 72
- Partial: 27
- Missing: 26
- Out of Scope: 10
- Total: 72 + 27 + 26 + 10 = 135 (matches total_rules)
- Score: (72 + 0.5 * 27) / (135 - 10) * 100 = (72 + 13.5) / 125 * 100 = 85.5 / 125 * 100 = 68.4%

### Rule Accounting (R001-R135)
- R001: Implemented, R002: Implemented, R003: Implemented, R004: Implemented, R005: Implemented
- R006: Implemented, R007: Implemented, R008: Implemented, R009: Implemented, R010: Partial
- R011: Partial, R012: Partial, R013: Missing, R014: Partial, R015: Partial
- R016: Missing, R017: Implemented, R018: Implemented, R019: Implemented, R020: Implemented
- R021: Implemented, R022: Partial, R023: Partial, R024: Missing, R025: Implemented
- R026: Implemented, R027: Implemented, R028: Missing, R029: Missing, R030: Missing
- R031: Missing, R032: Implemented, R033: Partial, R034: Implemented, R035: Partial
- R036: Implemented, R037: Partial, R038: Implemented, R039: Implemented, R040: Missing
- R041: Missing, R042: Implemented, R043: Implemented, R044: Partial, R045: Partial
- R046: Missing, R047: Missing, R048: Missing, R049: Missing, R050: Missing
- R051: Missing, R052: Missing, R053: Missing, R054: Implemented, R055: Implemented
- R056: Missing, R057: Implemented, R058: Implemented, R059: Partial, R060: Partial
- R061: Implemented, R062: Missing, R063: Missing, R064: Missing, R065: Missing
- R066: Implemented, R067: Implemented, R068: Missing, R069: OOS, R070: Implemented
- R071: Implemented, R072: Implemented, R073: Implemented, R074: Implemented, R075: Implemented
- R076: Partial, R077: Implemented, R078: Partial, R079: Implemented, R080: Partial
- R081: OOS, R082: Implemented, R083: OOS, R084: OOS, R085: Implemented
- R086: OOS, R087: OOS, R088: Implemented, R089: Implemented, R090: Implemented
- R091: Implemented, R092: Partial, R093: Implemented, R094: Implemented, R095: Implemented
- R096: Implemented, R097: Implemented, R098: Partial, R099: Implemented, R100: Implemented
- R101: Missing, R102: Implemented, R103: Implemented, R104: Partial, R105: Partial
- R106: OOS, R107: Implemented, R108: Implemented, R109: Implemented, R110: Implemented
- R111: Implemented, R112: Implemented, R113: Partial, R114: Implemented, R115: Implemented
- R116: Implemented, R117: Implemented, R118: OOS, R119: OOS, R120: Implemented
- R121: Implemented, R122: Partial, R123: OOS, R124: Missing, R125: Missing
- R126: Implemented, R127: Implemented, R128: Implemented, R129: Implemented, R130: Implemented
- R131: Partial, R132: Implemented, R133: Partial, R134: Partial, R135: Partial

### Completeness Checks
- [x] Every rule R001-R135 has exactly one classification (verified above)
- [x] Every Partial item specifies present vs. missing (27 items checked)
- [x] Every Missing and Partial item has a gap priority (53 items checked)
- [x] Out of Scope items have justification (10 items checked)
- [x] No rule classified as both Implemented and Missing
- [x] Coverage score math verified: 68.4%

---

## Auditor Queue

Ordered list of items for the Implementation Auditor to check:

### Core Foundation (formulas, enumerations, constraints)
1. `combat-R002` — Implemented — core/formula — Pokemon HP formula
2. `combat-R003` — Implemented — core/formula — Trainer HP formula
3. `combat-R005` — Implemented — core/formula — Physical evasion formula
4. `combat-R006` — Implemented — core/formula — Special evasion formula
5. `combat-R007` — Implemented — core/formula — Speed evasion formula
6. `combat-R008` — Implemented — core/formula — Combat stage multipliers
7. `combat-R032` — Implemented — core/formula — Tick of Hit Points
8. `combat-R036` — Implemented — core/formula — Initiative speed-based
9. `combat-R074` — Implemented — core/formula — Injury effect on max HP
10. `combat-R001` — Implemented — core/enumeration — Basic combat stats
11. `combat-R009` — Implemented — core/enumeration — Stage multiplier table
12. `combat-R018` — Implemented — core/enumeration — Set damage base table
13. `combat-R017` — Implemented — core/enumeration — Rolled damage base table
14. `combat-R034` — Implemented — core/enumeration — League vs Full Contact types
15. `combat-R054` — Implemented — core/enumeration — Size footprints
16. `combat-R004` — Implemented — core/formula — Accuracy baseline
17. `combat-R066` — Implemented — core/constraint — Evasion max from stats (+6)
18. `combat-R067` — Implemented — core/constraint — Evasion total cap (+9)
19. `combat-R070` — Implemented — core/constraint — Stages on applicable stats only
20. `combat-R025` — Implemented — core/constraint — Minimum 1 damage
21. `combat-R075` — Implemented — core/constraint — Real max HP for percentage calcs

### Core Conditions and Modifiers
22. `combat-R020` — Implemented — core/condition — Physical vs Special damage
23. `combat-R072` — Implemented — core/condition — Massive damage injury
24. `combat-R073` — Implemented — core/condition — HP marker injuries
25. `combat-R077` — Implemented — core/condition — Fainted condition
26. `combat-R039` — Implemented — core/condition — Initiative tie breaking
27. `combat-R071` — Implemented — core/condition — Combat stages persistence
28. `combat-R021` — Implemented — core/modifier — STAB
29. `combat-R026` — Implemented — core/modifier — Type effectiveness single type
30. `combat-R027` — Implemented — core/interaction — Type effectiveness dual type

### Core Workflows
31. `combat-R019` — Implemented — core/workflow — Damage formula full process
32. `combat-R038` — Implemented — core/workflow — Full contact initiative order
33. `combat-R043` — Implemented — core/workflow — Action economy per turn
34. `combat-R042` — Implemented — core/enumeration — Standard action definition
35. `combat-R085` — Implemented — core/workflow — Take a Breather

### Core Movement and Grid
36. `combat-R055` — Implemented — core/formula — Shift action movement
37. `combat-R057` — Implemented — core/formula — Diagonal movement costs
38. `combat-R058` — Implemented — core/condition — Adjacency definition
39. `combat-R061` — Implemented — core/enumeration — Terrain types

### Core Status and Conditions
40. `combat-R079` — Implemented — core/interaction — Fainted clears all status
41. `combat-R082` — Implemented — core/enumeration — Struggle attack
42. `combat-R088` — Implemented — core/modifier — Burned status
43. `combat-R089` — Implemented — core/modifier — Frozen status
44. `combat-R090` — Implemented — core/modifier — Paralysis status
45. `combat-R091` — Implemented — core/modifier — Poisoned status
46. `combat-R093` — Implemented — core/modifier — Sleep status
47. `combat-R094` — Implemented — core/modifier — Confused status
48. `combat-R103` — Implemented — core/interaction — Temporary HP
49. `combat-R107` — Implemented — core/condition — Tripped condition
50. `combat-R108` — Implemented — core/condition — Vulnerable condition

### Core Maneuvers
51. `combat-R110` — Implemented — core/workflow — Attack of Opportunity
52. `combat-R111` — Implemented — core/workflow — Disengage

### Cross-Domain
53. `combat-R130` — Implemented — cross-domain/formula — Action Points
54. `combat-R132` — Implemented — cross-domain/constraint — Rounding rule

### Situational Implemented
55. `combat-R112` — Implemented — situational/workflow — Push maneuver
56. `combat-R114` — Implemented — situational/workflow — Trip maneuver
57. `combat-R115` — Implemented — situational/workflow — Grapple maneuver
58. `combat-R116` — Implemented — situational/workflow — Intercept Melee
59. `combat-R117` — Implemented — situational/workflow — Intercept Ranged
60. `combat-R120` — Implemented — situational/workflow — Disarm
61. `combat-R121` — Implemented — situational/enumeration — Dirty Trick
62. `combat-R095` — Implemented — situational/modifier — Rage status
63. `combat-R096` — Implemented — situational/modifier — Flinch status
64. `combat-R097` — Implemented — situational/modifier — Infatuation status
65. `combat-R099` — Implemented — situational/modifier — Suppressed status
66. `combat-R100` — Implemented — situational/modifier — Cursed status
67. `combat-R102` — Implemented — situational/modifier — Disabled status
68. `combat-R109` — Implemented — situational/condition — Trapped condition

### Cross-Domain Implemented
69. `combat-R126` — Implemented — cross-domain/workflow — Rest HP recovery
70. `combat-R127` — Implemented — cross-domain/workflow — Extended rest
71. `combat-R128` — Implemented — cross-domain/condition — Natural injury healing
72. `combat-R129` — Implemented — cross-domain/workflow — Pokemon Center healing

### Partial Items (present portions to verify)
73. `combat-R023` — Partial (verify: crit damage calc for set damage mode) — core/formula
74. `combat-R033` — Partial (verify: status constants completeness) — core/enumeration
75. `combat-R035` — Partial (verify: trainer/pokemon turn separation) — core/workflow
76. `combat-R037` — Partial (verify: separate turn orders in League) — core/workflow
77. `combat-R010` — Partial (verify: stage-modified evasion calc) — core/modifier
78. `combat-R011` — Partial (verify: accuracy threshold formula) — core/formula
79. `combat-R012` — Partial (verify: accuracy check formula) — core/formula
80. `combat-R044` — Partial (verify: action tracking fields exist) — situational/constraint
81. `combat-R059` — Partial (verify: Stuck/Slowed in condition constants) — core/modifier
82. `combat-R060` — Partial (verify: effectiveMovement formula correctness) — core/modifier
83. `combat-R076` — Partial (verify: injury tracking accuracy) — core/condition
84. `combat-R098` — Partial (verify: end encounter behavior) — core/interaction
85. `combat-R092` — Partial (verify: faint clears persistent specifically) — core/interaction
86. `combat-R134` — Partial (verify: DR parameter in damage calc) — cross-domain/modifier
87. `combat-R135` — Partial (verify: evasionBonus parameter in evasion calc) — cross-domain/modifier
88. `combat-R104` — Partial (verify: temp HP excluded from percentages) — situational/constraint
