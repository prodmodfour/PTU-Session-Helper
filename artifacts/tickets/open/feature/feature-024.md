---
id: feature-024
title: "Add unit tests for Living Weapon system"
priority: P3
severity: MEDIUM
status: open
domain: testing
source: code-review-297 H3
created_by: developer (fix cycle)
created_at: 2026-03-03
affected_files:
  - app/server/services/living-weapon.service.ts
  - app/server/services/living-weapon-state.ts
  - app/utils/combatantCapabilities.ts
  - app/constants/livingWeapon.ts
---

## Summary

No unit tests exist for any Living Weapon code (code-review-297 H3). Add minimum test coverage for the core service functions.

## Required Tests

### living-weapon.service.ts
- **Engage validation**: verify all precondition checks (human wielder, pokemon weapon, same side, not already wielding/wielded, adjacency)
- **Engage execution**: verify combatant flags set correctly, wieldRelationship created
- **Disengage state clearing**: verify flags cleared on both wielder and weapon
- **Disengage from either side**: verify resolution works from wielder ID or weapon ID
- **clearWieldOnRemoval**: verify auto-disengage on combatant removal
- **updateWieldFaintedState**: verify fainted flag update
- **meetsSkillRequirement**: verify rank comparison logic (retained for future P1 move access gating)

### living-weapon-state.ts
- **Reconstruction from flags**: verify correct WieldRelationship[] built from combatant flags
- **Homebrew species fallback**: verify unknown species defaults to 'Honedge' in reconstruction

### combatantCapabilities.ts
- **getLivingWeaponConfig**: verify known species returns correct config
- **getLivingWeaponConfig homebrew**: verify otherCapabilities fallback with Honedge defaults

## Notes

These are pure functions with no DB dependency — ideal for unit testing with Vitest.
