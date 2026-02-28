# Testing Strategy

## Test Plan

### P0 Tests — Data Model, Capability Parsing, Engage/Disengage

#### Capability Parsing (unit)
- [ ] `getLivingWeaponConfig()` returns Honedge config for a Pokemon with species "Honedge"
- [ ] `getLivingWeaponConfig()` returns Doublade config for a Pokemon with species "Doublade"
- [ ] `getLivingWeaponConfig()` returns Aegislash config for a Pokemon with species "Aegislash"
- [ ] `getLivingWeaponConfig()` returns fallback config for unknown species with "Living Weapon" in otherCapabilities
- [ ] `getLivingWeaponConfig()` returns null for a Pokemon without Living Weapon capability
- [ ] `getLivingWeaponConfig()` handles case-insensitive "living weapon" string in otherCapabilities

#### Engage Logic (unit)
- [ ] `engageLivingWeapon()` creates WieldRelationship with correct fields
- [ ] `engageLivingWeapon()` sets `wieldingWeaponId` on wielder combatant
- [ ] `engageLivingWeapon()` sets `wieldedByTrainerId` on weapon combatant
- [ ] `engageLivingWeapon()` does not modify other combatants
- [ ] `engageLivingWeapon()` correctly sets `isFainted: true` when weapon is fainted

#### Disengage Logic (unit)
- [ ] `disengageLivingWeapon()` removes WieldRelationship from encounter
- [ ] `disengageLivingWeapon()` clears `wieldingWeaponId` on wielder
- [ ] `disengageLivingWeapon()` clears `wieldedByTrainerId` on weapon
- [ ] `disengageLivingWeapon()` finds relationship when called with wielder ID
- [ ] `disengageLivingWeapon()` finds relationship when called with weapon ID
- [ ] `disengageLivingWeapon()` returns encounter unchanged when no matching relationship

#### State Query Functions (unit)
- [ ] `isWielded()` returns true for a combatant with `wieldedByTrainerId` set
- [ ] `isWielded()` returns false for a combatant without `wieldedByTrainerId`
- [ ] `isWielding()` returns true for a combatant with `wieldingWeaponId` set
- [ ] `isWielding()` returns false for a combatant without `wieldingWeaponId`
- [ ] `getWieldedWeapon()` returns the weapon combatant for a wielding trainer
- [ ] `getWieldedWeapon()` returns null for a non-wielding trainer
- [ ] `getWielder()` returns the trainer combatant for a wielded weapon
- [ ] `getWielder()` returns null for an un-wielded Pokemon
- [ ] `findWieldRelationship()` finds by wielder ID
- [ ] `findWieldRelationship()` finds by weapon ID
- [ ] `findWieldRelationship()` returns null when no match

#### Skill Rank Validation (unit)
- [ ] `meetsSkillRequirement()` returns true for Adept when Adept is required
- [ ] `meetsSkillRequirement()` returns true for Expert when Adept is required
- [ ] `meetsSkillRequirement()` returns true for Master when Adept is required
- [ ] `meetsSkillRequirement()` returns false for Novice when Adept is required
- [ ] `meetsSkillRequirement()` returns false for Untrained when Novice is required
- [ ] `meetsSkillRequirement()` defaults to Untrained when rank is undefined

#### Engage API Endpoint (integration)
- [ ] `POST /engage` succeeds with valid wielder and weapon combatant IDs
- [ ] `POST /engage` returns 400 when wielder is not a human combatant
- [ ] `POST /engage` returns 400 when weapon does not have Living Weapon capability
- [ ] `POST /engage` returns 400 when wielder is already wielding another weapon
- [ ] `POST /engage` returns 400 when weapon is already wielded by another trainer
- [ ] `POST /engage` returns 400 when wielder lacks required Combat skill rank (Fine weapon)
- [ ] `POST /engage` returns 400 when combatants are on different sides
- [ ] `POST /engage` marks Standard Action as used

#### Disengage API Endpoint (integration)
- [ ] `POST /disengage` succeeds when called with wielder combatant ID
- [ ] `POST /disengage` succeeds when called with weapon combatant ID
- [ ] `POST /disengage` returns 400 when combatant has no active wield relationship
- [ ] `POST /disengage` marks Swift Action as used

#### Faint State Tracking (unit)
- [ ] `updateWieldFaintedState()` sets `isFainted: true` on matching relationship
- [ ] `updateWieldFaintedState()` does not modify other relationships
- [ ] `updateWieldFaintedState()` can revert `isFainted: false` when healed

---

### P1 Tests — Equipment Integration, Evasion, Shield, Fainted Penalty, Moves

#### Dynamic Equipment Overlay (unit)
- [ ] `computeEffectiveEquipment()` places Honedge in mainHand only
- [ ] `computeEffectiveEquipment()` places Doublade in mainHand and offHand
- [ ] `computeEffectiveEquipment()` places Aegislash weapon in mainHand and shield in offHand
- [ ] `computeEffectiveEquipment()` replaces existing mainHand equipment with Living Weapon
- [ ] `computeEffectiveEquipment()` preserves non-weapon slots (head, body, feet, accessory)

#### Doublade Dual-Wield Evasion (unit)
- [ ] Doublade wielded: mainHand item has `evasionBonus: 2`, offHand has 0
- [ ] `computeEquipmentBonuses()` on Doublade effective equipment returns `evasionBonus: 2`
- [ ] Honedge wielded: no evasion bonus from mainHand
- [ ] Aegislash wielded: no dual-wield evasion (shield handles evasion separately)

#### Aegislash Shield DR (unit)
- [ ] Aegislash wielded: offHand is a Light Shield with `evasionBonus: 2`
- [ ] Aegislash wielded: offHand shield has `canReady: true` and readied bonuses
- [ ] `computeEquipmentBonuses()` on Aegislash effective equipment returns `evasionBonus: 2` (from shield)

#### Fainted Penalty (unit)
- [ ] Fainted Doublade: `evasionBonus: 0` (2 - 2 penalty = 0)
- [ ] Fainted Aegislash shield: `evasionBonus: 0` (2 - 2 penalty = 0)
- [ ] Fainted Aegislash shield: `canReady: false` (cannot ready fainted shield)
- [ ] Non-fainted Living Weapon: normal bonuses (no penalty)

#### Weapon Moves (unit)
- [ ] `getGrantedWeaponMoves()` returns Wounding Strike for Honedge with Adept Combat wielder
- [ ] `getGrantedWeaponMoves()` returns Double Swipe for Doublade with Adept Combat wielder
- [ ] `getGrantedWeaponMoves()` returns Wounding Strike + Bleed! for Aegislash with Master Combat wielder
- [ ] `getGrantedWeaponMoves()` returns Wounding Strike only for Aegislash with Adept Combat wielder (Bleed! filtered)
- [ ] `getGrantedWeaponMoves()` returns empty for Honedge with Novice Combat wielder (Adept required)
- [ ] `getGrantedWeaponMoves()` returns empty for undefined Combat rank (defaults to Untrained)

#### Effective Move List (unit)
- [ ] `getEffectiveMoveList()` returns base moves for non-wielded Pokemon
- [ ] `getEffectiveMoveList()` appends weapon moves for wielded Pokemon
- [ ] `getEffectiveMoveList()` does not duplicate moves already in base list
- [ ] `getEffectiveMoveList()` returns base moves for non-Pokemon combatants

#### Combatant Refresh (integration)
- [ ] After engage: trainer evasion values recalculated with Living Weapon bonuses
- [ ] After disengage: trainer evasion values revert to normal equipment bonuses
- [ ] Doublade engage: trainer gains +2 evasion on all three evasion types
- [ ] Aegislash engage: trainer gains +2 evasion from shield

---

### P2 Tests — Shared Movement, No Guard, Blade Forme, Weaponize, Soulstealer

#### Shared Movement (unit)
- [ ] `syncWeaponPosition()` sets weapon position to wielder position
- [ ] `syncWeaponPosition()` returns encounter unchanged when no wield relationship
- [ ] `getEffectiveMovementSpeed()` returns wielder speed minus used pool for wielded pair
- [ ] `getEffectiveMovementSpeed()` returns 0 when pool is exhausted
- [ ] `getEffectiveMovementSpeed()` returns normal speed for non-wielded combatants
- [ ] `handleLinkedMovement()` updates both combatant positions
- [ ] `handleLinkedMovement()` increments shared movement pool
- [ ] `handleLinkedMovement()` returns encounter unchanged for non-wielded combatant
- [ ] `resetWieldMovementPools()` sets all pools to 0

#### No Guard Suppression (unit)
- [ ] `isNoGuardActive()` returns true for un-wielded Honedge with No Guard
- [ ] `isNoGuardActive()` returns false for wielded Honedge with No Guard
- [ ] `isNoGuardActive()` returns false for Pokemon without No Guard
- [ ] `isNoGuardActive()` returns false for human combatants

#### Aegislash Forced Blade Forme (unit)
- [ ] `swapAegislashStance()` swaps Attack<->Defense and SpAtk<->SpDef
- [ ] `swapAegislashStance()` is reversible (double swap returns original stats)
- [ ] Engage Aegislash in Shield forme: stats swapped to Blade forme
- [ ] Engage Aegislash already in Blade forme: stats unchanged, `wasInBladeFormeOnEngage: true`
- [ ] Disengage Aegislash that was in Shield forme: stats swapped back
- [ ] Disengage Aegislash that was in Blade forme: stats unchanged

#### Weaponize Ability (unit)
- [ ] `canUseWeaponize()` returns true for wielded Pokemon with Weaponize that is not fainted
- [ ] `canUseWeaponize()` returns false for wielded Pokemon without Weaponize
- [ ] `canUseWeaponize()` returns false for un-wielded Pokemon with Weaponize
- [ ] `canUseWeaponize()` returns false for fainted wielded Pokemon with Weaponize

#### Soulstealer Ability (unit)
- [ ] `checkSoulstealer()` triggers on faint caused by Pokemon with Soulstealer
- [ ] `checkSoulstealer()` returns null when attacker has no Soulstealer
- [ ] `checkSoulstealer()` returns null when target did not faint
- [ ] `applySoulstealerHealing()` heals 25% max HP and 1 injury on regular faint
- [ ] `applySoulstealerHealing()` fully heals and removes all injuries on kill

---

## Test File Organization

```
app/tests/unit/
  utils/
    livingWeaponMoves.test.ts      — weapon move generation tests
  services/
    living-weapon.service.test.ts  — engage, disengage, state management
  constants/
    livingWeapon.test.ts           — config validation, capability parsing
```

## Coverage Targets

- **P0:** 100% branch coverage on engage/disengage service functions, capability parser, skill rank validation
- **P1:** 100% branch coverage on equipment overlay, weapon move filtering, fainted penalty
- **P2:** 100% branch coverage on shared movement functions, No Guard suppression, Stance Change swap

---
