---
scenario_id: healing-extended-rest-status-clearing-001
verified_at: 2026-02-18T12:00:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

1. **[Burned, Confused]**: Burned is persistent → cleared. Confused is volatile → survives. cleared: [Burned], remaining: [Confused]. PASS
2. **[Frozen, Paralyzed, Poisoned]**: All three are persistent → all cleared. remaining: []. PASS
3. **[Asleep, Flinched, Stuck]**: All three are volatile → none cleared by extended rest. remaining: [Asleep, Flinched, Stuck]. PASS
4. **[Badly Poisoned, Enraged, Slowed]**: Badly Poisoned is persistent → cleared. Enraged and Slowed are volatile → survive. cleared: [Badly Poisoned], remaining: [Enraged, Slowed]. PASS

## Data Validity

- [x] PERSISTENT_CONDITIONS = ['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']
- [x] All other conditions are volatile (not cleared by extended rest)

## Completeness Check

- [x] Mixed persistent + volatile input
- [x] All-persistent input
- [x] All-volatile input
- [x] Edge case: Badly Poisoned (compound name) correctly identified as persistent

## Errata Check

- No errata affects status condition classification

## Issues Found

(none)
