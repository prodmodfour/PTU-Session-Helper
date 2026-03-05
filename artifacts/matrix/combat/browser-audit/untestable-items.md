---
domain: combat
type: browser-audit-untestable
total_untestable: 74
browser_audited_at: 2026-03-05T21:15:00Z
browser_audited_by: browser-auditor
---

# Untestable Items: Combat

Server-side only capabilities with no direct UI terminus. These are backend models, fields, service functions, utilities, constants, store internals, and WebSocket protocol events that have no browser-facing element to verify.

## Prisma Models & Fields (5)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| combat-C001 | Encounter Model | prisma-model | Database schema definition; no UI element to verify |
| combat-C002 | HumanCharacter Equipment Field | prisma-field | JSON field on database model |
| combat-C003 | Encounter Weather Fields | prisma-field | Database field (UI dropdown triggers API that writes this) |
| combat-C004 | Encounter League Battle Fields | prisma-field | Database fields for battle mode |
| combat-C005 | Encounter XP Tracking Fields | prisma-field | Database fields for XP system |

## API Endpoints (27)

These endpoints are server-side HTTP handlers. Some are triggered by UI buttons (those UI buttons are tested in view files), but the endpoints themselves are not browser-testable.

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| combat-C010 | Create Encounter | api-endpoint | POST handler; UI trigger verified via encounter creation flow |
| combat-C011 | List Encounters | api-endpoint | GET handler returning JSON |
| combat-C012 | Get Encounter | api-endpoint | GET handler returning single encounter |
| combat-C013 | Update Encounter | api-endpoint | PATCH handler for encounter mutations |
| combat-C014 | Create Encounter from Scene | api-endpoint | POST handler for scene-to-encounter conversion |
| combat-C015 | Start Encounter | api-endpoint | POST handler; initiates encounter state |
| combat-C016 | End Encounter | api-endpoint | POST handler; button exists (see view-gm.md C016-UI) |
| combat-C017 | Next Turn | api-endpoint | POST handler; button exists (see view-gm.md C017-UI) |
| combat-C018 | Add Combatant | api-endpoint | POST handler; modal trigger exists (see view-gm.md C018-UI) |
| combat-C019 | Remove Combatant | api-endpoint | DELETE handler; button exists (see view-gm.md C019-UI) |
| combat-C020 | Apply Damage | api-endpoint | POST handler; -HP button exists (see view-gm.md C020-UI) |
| combat-C021 | Heal Combatant | api-endpoint | POST handler; +HP button exists (see view-gm.md C021-UI) |
| combat-C022 | Execute Move | api-endpoint | POST handler; move buttons exist (see view-gm.md C022-UI) |
| combat-C023 | Modify Combat Stages | api-endpoint | POST handler; CS modal exists (see view-gm.md C023-UI) |
| combat-C024 | Update Status Conditions | api-endpoint | POST handler; ST modal exists (see view-gm.md C024-UI) |
| combat-C025 | Take a Breather | api-endpoint | POST handler; breather action available in GMActionModal |
| combat-C026 | Sprint Action | api-endpoint | POST handler; sprint available in maneuver grid |
| combat-C027 | Pass Turn | api-endpoint | POST handler; Pass Turn button exists in GMActionModal |
| combat-C028 | Calculate Damage (Read-Only) | api-endpoint | GET handler for damage preview |
| combat-C033 | Wild Pokemon Spawn | api-endpoint | POST handler for wild spawn |
| combat-C034 | Set Significance | api-endpoint | POST handler for XP significance |
| combat-C035 | Calculate XP Preview | api-endpoint | GET handler for XP preview |
| combat-C036 | Distribute XP | api-endpoint | POST handler for XP distribution |
| combat-C037 | Get Character Equipment | api-endpoint | GET handler for equipment data |
| combat-C038 | Update Character Equipment | api-endpoint | PUT handler for equipment changes |
| combat-C039 | Update Grid Position | api-endpoint | PUT handler for token movement |
| combat-C044 | Next Scene | api-endpoint | POST handler for scene advancement |

## API Endpoints with UI Triggers Verified Separately (8)

These API endpoints have UI buttons/controls verified in view-gm.md. The endpoints themselves are untestable as HTTP handlers.

| Cap ID | Name | Type | UI Trigger Verified |
|--------|------|------|-------------------|
| combat-C029 | Set Weather | api-endpoint | Weather dropdown (view-gm.md) |
| combat-C030 | Serve Encounter | api-endpoint | Serve/Unserve button (view-gm.md) |
| combat-C031 | Unserve Encounter | api-endpoint | Unserve button (view-gm.md) |
| combat-C032 | Get Served Encounter | api-endpoint | Group view loads served encounter (view-group.md) |
| combat-C040 | Update Grid Config | api-endpoint | Grid Settings button (view-gm.md) |
| combat-C041 | Manage Grid Background | api-endpoint | Grid Settings (view-gm.md) |
| combat-C042 | Get/Set Fog of War | api-endpoint | Fog On/Reveal/Hide controls (view-gm.md) |
| combat-C043 | Get/Set Terrain | api-endpoint | Grid terrain tools (view-gm.md) |

## Service Functions (9)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| combat-C050 | calculateDamage (Combatant Service) | service-function | Server-side damage calculation |
| combat-C051 | applyDamageToEntity | service-function | Server-side damage application |
| combat-C052 | applyHealingToEntity | service-function | Server-side healing |
| combat-C053 | updateStatusConditions | service-function | Server-side status update |
| combat-C054 | updateStageModifiers | service-function | Server-side stage modification |
| combat-C055 | buildCombatantFromEntity | service-function | Server-side entity builder |
| combat-C056 | buildPokemonEntityFromRecord | service-function | Server-side Pokemon builder |
| combat-C057 | buildHumanEntityFromRecord | service-function | Server-side Human builder |
| combat-C058 | countMarkersCrossed | service-function | Server-side HP marker calculation |

## Utilities (13)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| combat-C060 | calculateDamage (9-Step) | utility | Pure calculation function |
| combat-C061 | calculateEvasion | utility | Pure calculation function |
| combat-C062 | calculateAccuracyThreshold | utility | Pure calculation function |
| combat-C063 | applyStageModifier | utility | Pure calculation function |
| combat-C064 | applyStageModifierWithBonus | utility | Pure calculation function |
| combat-C065 | computeEquipmentBonuses | utility | Pure calculation function |
| combat-C066 | checkMoveFrequency | utility | Pure calculation function |
| combat-C067 | incrementMoveUsage | utility | Pure calculation function |
| combat-C068 | resetSceneUsage | utility | Pure calculation function |
| combat-C069 | resetDailyUsage | utility | Pure calculation function |
| combat-C070 | calculateEncounterBudget | utility | Pure calculation function |
| combat-C071 | analyzeEncounterBudget | utility | Pure calculation function |
| combat-C072 | calculateEncounterXp | utility | Pure calculation function |

## Constants (6)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| combat-C080 | COMBAT_MANEUVERS | constant | Data constant; maneuver grid uses this (UI verified in view-gm.md) |
| combat-C081 | EQUIPMENT_CATALOG | constant | Data constant for equipment items |
| combat-C082 | STATUS_CONDITIONS | constant | Data constant; status modal uses this (UI verified in view-gm.md) |
| combat-C083 | SIGNIFICANCE_PRESETS | constant | Data constant for XP significance presets |
| combat-C084 | DAMAGE_BASE_CHART | constant | Data constant for damage base lookup |
| combat-C085 | STAGE_MULTIPLIERS | constant | Data constant for stage multiplier table |

## Composable Functions (4)

These are Vue composables that drive UI behavior. Their effects are visible in components (verified in view files) but the composables themselves are not browser-testable elements.

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| combat-C090 | useCombat | composable-function | Composable driving CombatantCard HP/stats display |
| combat-C091 | useMoveCalculation | composable-function | Composable driving MoveTargetModal accuracy/damage |
| combat-C092 | usePlayerCombat | composable-function | Composable driving PlayerCombatantCard |
| combat-C093 | useEncounterBudget | composable-function | Composable driving budget analysis |

## Store Actions & Getters (10)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| combat-C100 | encounter store -- loadEncounter | store-action | Pinia store action |
| combat-C101 | encounter store -- createEncounter | store-action | Pinia store action |
| combat-C102 | encounter store -- createFromScene | store-action | Pinia store action |
| combat-C109 | encounter store -- undo/redo | store-action | Buttons exist (view-gm.md); action itself is untestable |
| combat-C110 | encounter store -- serve/unserve | store-action | Buttons exist (view-gm.md); action itself is untestable |
| combat-C111 | encounter store -- setWeather | store-action | Dropdown exists (view-gm.md); action itself is untestable |
| combat-C112 | encounter store -- addWildPokemon | store-action | Store action for wild spawns |
| combat-C115 | encounter store -- getters | store-getter | Computed properties |
| combat-C116 | encounter store -- updateFromWebSocket | store-action | WebSocket handler action |
| combat-C117 | encounterCombat store | store-action | Combat sub-store actions |

## WebSocket Events (10)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| combat-C150 | encounter_update | websocket-event | Protocol event; no direct UI element |
| combat-C151 | turn_change | websocket-event | Protocol event |
| combat-C152 | damage_applied / heal_applied | websocket-event | Protocol event |
| combat-C153 | status_change / move_executed | websocket-event | Protocol event |
| combat-C154 | combatant_added / combatant_removed | websocket-event | Protocol event |
| combat-C155 | serve_encounter / encounter_unserved | websocket-event | Protocol event |
| combat-C156 | player_action / player_action_ack | websocket-event | Protocol event |
| combat-C157 | player_turn_notify | websocket-event | Protocol event |
| combat-C158 | movement_preview | websocket-event | Protocol event |
| combat-C159 | player_move_request / player_move_response | websocket-event | Protocol event |
