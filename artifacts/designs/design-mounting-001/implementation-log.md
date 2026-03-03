# Implementation Log

## Status: p1-implemented

P0 (Core Mount Relationship, API, and Turn Integration) is fully implemented.
P1 (VTT Integration, Dismount Checks, Edge Effects, UI) is fully implemented.

## P0 Implementation

### Section A: Mount Relationship Data Model
- `1a2cc2d0` — Add MountState interface to `app/types/combat.ts`
- `7901c522` — Add mountState field to Combatant in `app/types/encounter.ts`

### Section B: Mountable Capability Parsing
- `a72a91ba` — Create `app/utils/mountingRules.ts` with capability parsing, DC constants, skill checks

### Section C: Mount/Dismount API Endpoints
- `638aa99c` — Create `app/server/services/mounting.service.ts` with mount/dismount business logic
- `5aeaf85d` — Create `app/server/api/encounters/[id]/mount.post.ts`
- `e43df266` — Create `app/server/api/encounters/[id]/dismount.post.ts`

### Section D: Mount State in Combat Turn System
- `8aded059` — Reset mount movement on new round in `next-turn.post.ts`
- `058bd107` — Mounted combatants use shared movementRemaining in `useGridMovement.ts`
- `1f5dcfd0` — Mount/dismount actions and getters in `encounter.ts` store
- `716c1c77` — Clear mount state on combatant removal in `[combatantId].delete.ts`
- `88bc800b` — Auto-dismount on faint from damage in `damage.post.ts`
- `09b0dce6` — Linked movement for mounted pairs in `position.post.ts`
- `59173398` — Auto-dismount on faint from tick damage in `next-turn.post.ts`
- `7fd76ad0` — Sync mountState in WebSocket surgical combatant update

### Files Changed (P0)
| Action | File |
|--------|------|
| EDIT | `app/types/combat.ts` |
| EDIT | `app/types/encounter.ts` |
| NEW | `app/utils/mountingRules.ts` |
| NEW | `app/server/services/mounting.service.ts` |
| NEW | `app/server/api/encounters/[id]/mount.post.ts` |
| NEW | `app/server/api/encounters/[id]/dismount.post.ts` |
| EDIT | `app/composables/useGridMovement.ts` |
| EDIT | `app/server/api/encounters/[id]/next-turn.post.ts` |
| EDIT | `app/server/api/encounters/[id]/damage.post.ts` |
| EDIT | `app/server/api/encounters/[id]/position.post.ts` |
| EDIT | `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts` |
| EDIT | `app/stores/encounter.ts` |

## P1 Implementation

### Section E: VTT Linked Token Movement
- `8658dc2f` — Add dismount check info builder and easy intercept check to `mountingRules.ts`
- `667896ab` — Add mount state CSS classes and rider badge to `VTTToken.vue`
- `8edc891b` — Create `VTTMountedToken.vue` for stacked token rendering (rider at 60% scale)
- `0f201661` — Integrate VTTMountedToken into GridCanvas rendering (skip riders, render pairs)
- `65a7e1c1` — Apply mount's movement modifiers for mounted rider speed calculation

### Section F: Dismount Check on Damage/Push
- `1ef65298` — Trigger dismount check when mounted combatant takes >= 1/4 max HP damage
- `97f5e691` — Notify GM when damage triggers dismount check on mounted combatant

### Section G: Mounted Prowess Edge Effect
- `8658dc2f` — hasMountedProwess() already exists from P0; buildDismountCheckInfo includes +3 bonus

### Section H: Intercept Bonus Between Rider and Mount
- `8658dc2f` — Add isEasyIntercept() function to mountingRules.ts
- `8edc891b` — VTTMountedToken shows Easy Intercept badge with tooltip (PTU p.218)
- `07ef0b41` — MountControls panel shows Easy Intercept reminder note

### Section I: UI Mount Indicators
- `07ef0b41` — Create MountControls.vue panel (mount/dismount controls, movement info)
- `3f0c7561` — Add mountedPairs, getMountState, canDismount getters to encounter store
- `dd5c4eca` — Show mount relationship indicator on CombatantCard in initiative list
- `72e3e216` — Add mount indicator to GroupCombatantCard for group view
- `4985d999` — Add mount indicator to PlayerCombatantCard for player view
- `01fe333d` — Integrate MountControls panel into GM encounter page
- `ffa1655c` — Add mount_change WebSocket broadcast event to ws.ts
- `65ead0cb` — Handle mount_change WebSocket event in client composable
- `b09ee237` — Broadcast mount_change and encounter_update after mount/dismount
- `63d96c94` — Fix: use continue instead of return in mount options combatant loop

### Files Changed (P1)
| Action | File |
|--------|------|
| EDIT | `app/utils/mountingRules.ts` |
| EDIT | `app/components/vtt/VTTToken.vue` |
| NEW | `app/components/vtt/VTTMountedToken.vue` |
| EDIT | `app/components/vtt/GridCanvas.vue` |
| EDIT | `app/composables/useGridMovement.ts` |
| EDIT | `app/server/api/encounters/[id]/damage.post.ts` |
| EDIT | `app/stores/encounter.ts` |
| EDIT | `app/composables/useEncounterActions.ts` |
| NEW | `app/components/encounter/MountControls.vue` |
| EDIT | `app/components/encounter/CombatantCard.vue` |
| EDIT | `app/components/encounter/GroupCombatantCard.vue` |
| EDIT | `app/components/encounter/PlayerCombatantCard.vue` |
| EDIT | `app/pages/gm/index.vue` |
| EDIT | `app/server/routes/ws.ts` |
| EDIT | `app/composables/useWebSocket.ts` |

## P2 Implementation

(Not started)
