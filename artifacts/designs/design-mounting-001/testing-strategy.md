# Testing Strategy

## Unit Tests (P0)

### `app/tests/unit/utils/mountingRules.test.ts`
- `parseMountableCapacity` returns correct number from "Mountable 1"
- `parseMountableCapacity` returns correct number from "Mountable 2"
- `parseMountableCapacity` returns 1 for bare "Mountable" without number
- `parseMountableCapacity` returns 0 for empty array
- `parseMountableCapacity` returns 0 for array without Mountable
- `parseMountableCapacity` is case-insensitive ("mountable 1", "MOUNTABLE 2")
- `parseMountableCapacity` handles whitespace ("  Mountable 1  ")
- `isMountable` returns true for Pokemon combatant with Mountable capability
- `isMountable` returns false for Pokemon without Mountable
- `isMountable` returns false for human combatant
- `getMountCapacity` returns correct capacity number
- `countCurrentRiders` returns 0 when no riders
- `countCurrentRiders` returns 1 when one rider is mounted
- `countCurrentRiders` returns 2 when two riders on a Mountable 2 Pokemon
- `hasMountedProwess` returns true when character has "Mounted Prowess" edge
- `hasMountedProwess` is case-insensitive
- `hasMountedProwess` returns false when edge not present
- `hasExpertMountingSkill` returns true for Expert Acrobatics
- `hasExpertMountingSkill` returns true for Expert Athletics
- `hasExpertMountingSkill` returns true for Master Acrobatics
- `hasExpertMountingSkill` returns false for Adept Acrobatics (not Expert)
- `hasExpertMountingSkill` returns false for Novice Athletics
- `getMountActionCost` returns 'standard' for non-Expert skill
- `getMountActionCost` returns 'free_with_shift' for Expert Acrobatics
- `triggersDismountCheck` returns true when damage >= 1/4 max HP
- `triggersDismountCheck` returns false when damage < 1/4 max HP
- `triggersDismountCheck` boundary: exactly 1/4 max HP triggers check
- `triggersDismountCheck` boundary: one less than 1/4 max HP does not trigger

### `app/tests/unit/api/mount.test.ts`
- Successful mount sets mountState on both rider and mount combatants
- Rider's mountState.isMounted is true, mount's isMounted is false
- Rider position moves to mount's position after mounting
- Standard Action consumed when rider is not Expert skill
- Standard Action NOT consumed when rider has Expert Acrobatics/Athletics
- Rejects mount when rider is not a human combatant
- Rejects mount when mount is not a Pokemon combatant
- Rejects mount when Pokemon lacks Mountable capability
- Rejects mount when Mountable capacity is full (all rider slots taken)
- Rejects mount when rider is already mounted on another Pokemon
- Rejects mount when rider and mount are on different sides
- Rejects mount when encounter is not active
- Rejects mount when rider is Fainted
- Rejects mount when rider is Stuck
- Rejects mount when rider is Frozen
- Rejects mount when mount is Fainted
- Rejects mount when rider and mount are not adjacent (grid enabled)
- Allows mount when grid is not enabled (no adjacency check)
- `skipCheck: true` bypasses the mounting check requirement
- Response includes correct actionCost field
- Response includes checkAutoSuccess when rider has Mounted Prowess

### `app/tests/unit/api/dismount.test.ts`
- Successful dismount clears mountState on both rider and mount
- Rider is placed in nearest unoccupied adjacent cell
- Returns null riderPosition when all adjacent cells are occupied
- Rejects dismount when rider is not mounted
- Rejects dismount when encounter is not active
- `forced: true` flag is passed through to response
- Fainted mount triggers automatic dismount (rider placed adjacent)
- Fainted rider clears mount state on mount

### `app/tests/unit/services/mounting-service.test.ts`
- `executeMount` returns updated combatants with mount state on both
- `executeMount` throws when validation fails (each validation rule)
- `executeDismount` returns updated combatants with mount state cleared
- `executeDismount` places rider in best adjacent position
- `resetMountMovement` sets movementRemaining to mount's Overland speed
- `resetMountMovement` preserves mount state when resetting
- `clearMountOnRemoval` clears partner's mount state when combatant removed
- `clearMountOnFaint` dismounts rider when mount faints
- `clearMountOnFaint` clears mount state when rider faints

### `app/tests/unit/composables/useGridMovement-mount.test.ts`
- `getSpeed` returns mount's movementRemaining when combatant is mounted rider
- `getSpeed` returns normal speed when combatant is not mounted
- Movement of mounted rider moves both rider and mount tokens
- Movement of ridden mount moves both mount and rider tokens
- `movementRemaining` decremented on both combatants after movement
- Movement range display uses mount's remaining movement for mounted rider
- Mount's terrain capabilities (Swim, Burrow, Sky) available to mounted rider
- Movement modifiers (Slowed, Speed CS) from MOUNT apply to mounted movement
- Movement modifiers from RIDER do NOT apply to mounted movement speed

---

## Unit Tests (P1)

### `app/tests/unit/utils/mountingRules-dismount.test.ts`
- `triggersDismountCheck` uses hpDamage (after temp HP) per decree-004
- Push effect on rider triggers dismount check
- Push effect on mount triggers dismount check
- Confusion self-damage on mount triggers dismount check
- Damage < 1/4 max HP does NOT trigger dismount check
- Mounted Prowess adds +3 to dismount check bonus

### `app/tests/unit/components/VTTMountedToken.test.ts`
- Renders mount token at full size
- Renders rider overlay at 60% scale in lower-right quadrant
- Shows mount icon badge on mounted token
- Both HP bars visible (mount full-width, rider smaller)
- Click on mounted token selects mount by default
- Click on rider overlay area selects rider

### `app/tests/unit/components/MountControls.test.ts`
- Shows "Mount" option when trainer is adjacent to mountable Pokemon
- Does not show "Mount" when no adjacent mountable Pokemon
- Shows mount action cost (Standard vs Free)
- Shows "Auto-success" when rider has Mounted Prowess
- Shows "Dismount" button when rider is mounted
- Shows remaining movement info when mounted
- Shows Easy Intercept reminder when mounted
- Hidden when current combatant is unmounted Pokemon (no mount controls relevant)

### `app/tests/unit/stores/encounter-mount.test.ts`
- `getMountState` getter returns mount state for specified combatant
- `getMountState` returns undefined for unmounted combatant
- `mountedPairs` getter returns all active mount pairs
- `canMount` returns true when conditions are met
- `canDismount` returns true when current combatant is mounted rider
- `mountPokemon` action calls correct API endpoint with body
- `dismountPokemon` action calls correct API endpoint with body
- Both actions update encounter state from response

### `app/tests/unit/api/damage-dismount.test.ts`
- Damage to mounted rider triggers dismount check when >= 1/4 max HP
- Damage to ridden mount triggers dismount check when >= 1/4 max HP
- Response includes dismountCheck object with correct fields
- dismountCheck includes mountedProwessBonus when rider has edge
- Damage below threshold does not include dismountCheck
- Temp HP absorption reduces effective damage for threshold check (decree-004)

---

## Unit Tests (P2)

### `app/tests/unit/utils/riderFeatures.test.ts`
- `hasRiderClass` returns true when trainerClasses includes 'Rider'
- `hasRiderClass` returns false for non-Rider trainers
- `hasRiderFeature` returns true for exact feature name match
- `hasRiderFeature` is case-insensitive
- Agility Training doubling: +2 movement when Rider class + Agile flag
- Agility Training normal: +1 movement when no Rider class + Agile flag
- Run Up damage bonus: floor(distance/3) for Dash/Pass moves
- Ride as One evasion: both use higher Speed Evasion
- Ride as One evasion: +1 bonus when equal Speed Evasion
- Ride as One evasion: original values stored for dismount restoration
- Overrun damage: adds mount Speed stat to damage roll
- Overrun defense: target gains DR equal to own Speed stat
- Lean In: resistance step applied to both rider and mount

### `app/tests/unit/services/mounting-ride-as-one.test.ts`
- `applyRideAsOneEvasion` returns higher of two Speed Evasions for both
- `applyRideAsOneEvasion` returns +1 bonus when evasions are equal
- `applyRideAsOneEvasion` stores original values in mountState
- `applyRideAsOneEvasion` does nothing when rider lacks Ride as One feature
- Speed Evasion reverted to originals on dismount
- Initiative swap: first pair member's turn allows GM choice
- Initiative swap: second pair member must be the one who didn't act
- Initiative swap resets at round end

### `app/tests/unit/combat/distanceTracking.test.ts`
- `distanceMovedThisTurn` starts at 0 on turn begin
- `distanceMovedThisTurn` incremented by movement distance
- `distanceMovedThisTurn` accumulated across multiple movements in same turn
- `distanceMovedThisTurn` reset to 0 on next turn

---

## Integration Tests (P0)

### Full Mount/Dismount Cycle
1. Create encounter with 1 trainer and 1 Pokemon (Mountable 1)
2. Add both as combatants on 'players' side
3. Place adjacent on grid
4. Start encounter
5. On trainer's turn, call mount endpoint -> verify both mountStates set
6. Verify rider position matches mount position
7. Move mounted pair (rider Shift) -> verify both positions update
8. Verify movementRemaining decremented on both
9. Advance to mount's Pokemon turn -> verify remaining movement available
10. Move mount (with rider) -> verify both positions update
11. Call dismount endpoint -> verify both mountStates cleared
12. Verify rider placed in adjacent cell

### Mount Capacity Enforcement
1. Create encounter with 2 trainers and 1 Pokemon (Mountable 1)
2. Mount trainer 1 -> succeeds
3. Attempt mount trainer 2 -> rejected (capacity full)
4. Dismount trainer 1
5. Mount trainer 2 -> succeeds

### Faint Dismount
1. Create encounter with mounted pair
2. Apply lethal damage to mount -> verify auto-dismount
3. Verify rider placed adjacent, mount state cleared on both
4. Alternatively: apply lethal damage to rider -> verify mount state cleared

---

## Integration Tests (P1)

### Dismount Check Trigger
1. Create encounter with mounted pair (mount max HP = 100)
2. Apply 24 damage to mount -> no dismount check (< 25 = 1/4 of 100)
3. Apply 25 damage to mount -> dismount check triggered
4. Verify response includes dismountCheck object
5. Verify dismountCheck.dc is 10
6. Call dismount endpoint (simulating failed check) -> rider placed adjacent

### Mounted Prowess Integration
1. Create encounter with rider that has Mounted Prowess edge
2. Mount -> response includes checkAutoSuccess: true
3. Apply heavy damage to mount -> dismountCheck includes mountedProwessBonus: 3

---

## Integration Tests (P2)

### Ride as One Evasion
1. Create encounter with Rider class trainer (Speed Evasion 3) and mount (Speed Evasion 5)
2. Mount the pair
3. Verify both Speed Evasions are now 5
4. Dismount -> verify evasions restored to original values

### Ride as One Initiative
1. Create encounter with Ride as One pair
2. Advance to first pair member's initiative
3. Verify GM can choose which combatant acts
4. Choose mount to act
5. Advance to next initiative -> verify rider must act (swap)
6. New round -> verify swap resets

---

## Manual Testing Checklist

### Happy Path (P0)
- [ ] Create encounter with trainer and Pokemon with Mountable capability
- [ ] Mount trainer on Pokemon via GM controls
- [ ] Verify both tokens show mount state
- [ ] Move mounted pair during trainer turn using mount's speed
- [ ] Verify mount's Pokemon turn has remaining movement
- [ ] Dismount voluntarily -> rider placed adjacent
- [ ] Verify undo restores mount state correctly
- [ ] Verify redo re-applies mount state correctly

### VTT Integration (P1)
- [ ] Mounted pair tokens visually stack on the grid
- [ ] Moving either token moves both
- [ ] Movement range shows mount's remaining movement for rider
- [ ] Clicking mounted token shows mount info by default
- [ ] Initiative tracker shows mount relationships
- [ ] Mount controls panel visible during mounted combatant's turn
- [ ] Group View shows mounted token rendering via WebSocket sync

### Dismount Checks (P1)
- [ ] Heavy damage to rider triggers dismount check notice
- [ ] Heavy damage to mount triggers dismount check notice
- [ ] Dismount check shows correct DC and Mounted Prowess bonus
- [ ] Mount fainting auto-dismounts rider
- [ ] Rider fainting clears mount state

### Rider Features (P2)
- [ ] Rider class with Agility Training toggle shows doubled bonus
- [ ] Ride as One: Speed Evasion sharing visible in combatant stats
- [ ] Ride as One: Initiative choice dialog on pair member's turn
- [ ] Lean In prompt on AoE hitting both rider and mount
- [ ] Cavalier's Reprisal prompt when adjacent foe hits mount
- [ ] Overrun activation option on qualifying Dash/Pass moves

### Edge Cases
- [ ] Multi-rider: two trainers on a Mountable 2 Pokemon
- [ ] Rider tries to mount a Pokemon on a different side -> rejected
- [ ] Rider tries to mount while already mounted -> rejected
- [ ] Removing a mounted combatant from encounter clears partner's mount state
- [ ] Speed CS change on mount updates mounted rider's available movement
- [ ] Full Contact battle mode mounting works (no phase restriction)
- [ ] League Battle mode mounting works during correct phases
- [ ] Adding combatant mid-encounter doesn't break existing mount pairs

### Group View
- [ ] Group View shows mounted tokens via WebSocket
- [ ] Mount/dismount events broadcast and update Group View in real-time
- [ ] Mounted token movement previews show for both tokens

---
