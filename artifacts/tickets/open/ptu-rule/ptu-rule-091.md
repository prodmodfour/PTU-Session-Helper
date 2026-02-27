---
id: ptu-rule-091
title: Branch class blocked by duplicate check
priority: P3
severity: MEDIUM
status: in-progress
domain: character-lifecycle
source: character-lifecycle-audit.md (R035)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-091: Branch class blocked by duplicate check

## Summary

The `addClass` function in `useCharacterCreation.ts:183` blocks adding the same class name twice (`if (form.trainerClasses.includes(className)) return`). This prevents branching classes (Type Ace, Stat Ace, Style Expert, Researcher, Martial Artist) from being taken multiple times with different specializations, which PTU explicitly allows via the `[Branch]` tag. The `isBranching` flag exists in `trainerClasses.ts` but is dead code.

## Affected Files

- `app/composables/useCharacterCreation.ts` (line 183, `addClass` function)
- `app/constants/trainerClasses.ts` (`isBranching` flag)

## PTU Rule Reference

`[Branch]` tag: "This Feature may be taken multiple times, each time with a different specialization."

## Suggested Fix

Requires decree-need-022 to determine implementation approach (see decree ticket). Two options: (a) skip duplicate check when `isBranching` is true, (b) require specialization suffix (e.g., "Type Ace: Fire") so names are naturally unique.

## Impact

Players cannot take branching classes multiple times with different specializations during character creation.

## Resolution Log

Implementation follows decree-022: specialization suffix approach (e.g., 'Type Ace: Fire').

### Commits

- `69f53a0` feat: add branching class specialization constants and helpers
  - `app/constants/trainerClasses.ts` — Added `BRANCHING_CLASS_SPECIALIZATIONS` with valid options per class, `getBranchingSpecializations()`, `hasBaseClass()`, `getBaseClassName()`, `getSpecialization()` helpers
- `572f99f` fix: allow branching classes with different specializations in addClass
  - `app/composables/useCharacterCreation.ts` — Updated duplicate check to block exact duplicates only (not different specializations). Added `countClassInstances()` helper.
- `ef9b512` feat: add specialization selection dropdown for branching classes
  - `app/components/create/ClassFeatureSection.vue` — Replaced free-text input with select dropdown. Fixed toggle behavior so branching classes always open picker. Added `isClassDisabled()` and `availableSpecializations` computed.
- `57c0aee` chore: remove unused getBaseClassName import from useCharacterCreation

### Files Changed

- `app/constants/trainerClasses.ts` — specialization data + helper functions
- `app/composables/useCharacterCreation.ts` — addClass fix + countClassInstances
- `app/components/create/ClassFeatureSection.vue` — UI specialization picker

### Verification Approach

No existing class lookup code in the server or display components required changes for prefix matching — all display code simply renders the stored string array, and server code only does JSON serialize/deserialize. The `ClassFeatureSection.vue` was the only component performing class name matching, and it already had partial `startsWith` logic that was extended.

### Fix Cycle 2 (code-review-200 + rules-review-176)

Addresses CHANGES_REQUIRED from both reviews. Also implements decree-026 (Martial Artist is not branching) and closes ptu-rule-115.

#### Commits

- `bcfb466` fix: remove HP from Stat Ace specializations
  - `app/constants/trainerClasses.ts` — PTU Core p.112 lists only Attack, Defense, Special Attack, Special Defense, Speed (CRITICAL-001)
- `60a1520` fix: replace Researcher specializations with correct Fields of Study
  - `app/constants/trainerClasses.ts` — 9 Fields of Study per PTU Core pp.140-148 (HIGH-001). Added comment noting PTU two-field simplification (M1)
- `93eb8d3` fix: remove Martial Artist from branching classes per decree-026
  - `app/constants/trainerClasses.ts` — Removed isBranching flag, removed from BRANCHING_CLASS_SPECIALIZATIONS, updated comment (HIGH-002/C1)
- `558601f` fix: disable branching class button at max class slots
  - `app/components/create/ClassFeatureSection.vue` — isClassDisabled now checks slot availability for branching classes (H1)
- `82dbd2e` refactor: remove unused countClassInstances from useCharacterCreation
  - `app/composables/useCharacterCreation.ts` — Removed dead code function and unused hasBaseClass import (M2)

#### Files Changed

- `app/constants/trainerClasses.ts` — Stat Ace specs corrected, Researcher Fields of Study corrected, Martial Artist removed from branching
- `app/components/create/ClassFeatureSection.vue` — isClassDisabled fix for max slots with branching classes
- `app/composables/useCharacterCreation.ts` — Removed countClassInstances dead code

#### Review Issues Resolved

| ID | Severity | Review | Fix |
|----|----------|--------|-----|
| CRITICAL-001 | CRITICAL | rules-review-176 | Remove HP from Stat Ace specializations |
| HIGH-001 | HIGH | rules-review-176 | Correct Researcher Fields of Study |
| HIGH-002 | HIGH | rules-review-176 | Remove Martial Artist from branching (decree-026) |
| C1 | CRITICAL | code-review-200 | Remove Martial Artist from branching |
| H1 | HIGH | code-review-200 | Fix isClassDisabled max slots check |
| M1 | MEDIUM | code-review-200 | Add Researcher two-field simplification comment |
| M2 | MEDIUM | code-review-200 | Remove countClassInstances dead code |
