---
review_id: rules-review-276
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-021
domain: character-lifecycle
commits_reviewed:
  - e670e023
  - 7229ec97
  - 80b31073
  - 6d54d85e
  - 3912f8da
mechanics_verified:
  - trainer-overland-speed
  - trainer-swimming-speed
  - combatant-can-swim
  - pokemon-speed-regression
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/02-character-creation.md#Page-16
  - core/03-skills-edges-and-features.md#Swimmer
reviewed_at: 2026-03-03T17:15:00Z
follows_up: rules-review-271
---

## Mechanics Verified

### Trainer Overland Speed
- **Rule:** "Overland Movement Speed is how quickly a Trainer or Pokemon can move over flat land. For Trainers, this value is equal to three plus half the sum of their Athletics and Acrobatics Ranks. By default, this value is 5. Overland = 3 + [(Athl + Acro)/2]" (`core/02-character-creation.md#Page-16`, lines 345-349)
- **Implementation:** `computeTrainerDerivedStats` in `app/utils/trainerDerivedStats.ts` (line 103): `const overland = 3 + Math.floor((athleticsRank + acrobaticsRank) / 2)`. Called via `getHumanDerivedSpeeds` -> `getOverlandSpeed` in `app/utils/combatantCapabilities.ts`.
- **Verification:** Cross-checked against the Lisa example (PTU p.16 line 366-367): Athletics=Adept(4), Acrobatics=Novice(3) yields Overland = 3 + floor(7/2) = 6. Rulebook states "Overland 6". Formula matches.
- **Test assertions audited:**
  - Adept(4) + Novice(3) -> 3 + floor(7/2) = 6. Test asserts `toBe(6)`. CORRECT.
  - Expert(5) + Expert(5) -> 3 + floor(10/2) = 8. Test asserts `toBe(8)`. CORRECT.
  - Master(6) + Master(6) -> 3 + floor(12/2) = 9. Test asserts `toBe(9)`. CORRECT.
  - Untrained(2) + Untrained(2) -> 3 + floor(4/2) = 5. Test asserts `toBe(5)`. CORRECT. Matches rulebook "default this value is 5".
  - Pathetic(1) + Pathetic(1) -> 3 + floor(2/2) = 4. Test asserts `toBe(4)`. CORRECT.
- **Status:** CORRECT

### Trainer Swimming Speed
- **Rule:** "Swimming Speed for a Trainer is equal to half of their Overland Speed." (`core/02-character-creation.md#Page-16`, lines 350-351)
- **Implementation:** `computeTrainerDerivedStats` in `app/utils/trainerDerivedStats.ts` (line 106): `const swimming = Math.floor(overland / 2)`. Called via `getHumanDerivedSpeeds` -> `getSwimSpeed` in `app/utils/combatantCapabilities.ts`.
- **Verification:** Lisa example: Overland=6, Swimming = floor(6/2) = 3. Rulebook states "Swim 3". Formula matches. (Note: Lisa also took the Swimmer edge for +2 Swim Speed, but that is an additive edge bonus handled separately from the base derivation formula.)
- **Test assertions audited:**
  - Overland=6 (Adept+Novice) -> floor(6/2) = 3. Test asserts `toBe(3)`. CORRECT.
  - Overland=5 (Untrained defaults) -> floor(5/2) = 2. Test asserts `toBe(2)`. CORRECT.
  - Overland=6 (Novice+Adept, reversed) -> floor(6/2) = 3. Test asserts `toBe(3)`. CORRECT.
- **Status:** CORRECT

### Combatant Can Swim (Human Trainers)
- **Rule:** Since Swimming = floor(Overland / 2) and minimum Overland is 4 (Pathetic(1) + Pathetic(1)), minimum Swimming is floor(4/2) = 2. All trainers have Swimming >= 2, so all trainers can swim.
- **Implementation:** `combatantCanSwim` in `app/utils/combatantCapabilities.ts` (line 41-50): Returns `true` directly for human combatants. Comment documents the minimum Swimming >= 2 rationale.
- **Test assertions audited:**
  - `combatantCanSwim(human)` returns `true` for default human. CORRECT.
  - `combatantCanSwim(human with Pathetic/Pathetic)` returns `true`. CORRECT.
  - `combatantCanSwim(pokemon with swim=3)` returns `true`. CORRECT.
  - `combatantCanSwim(pokemon with swim=0)` returns `false`. CORRECT.
- **Status:** CORRECT

### Pokemon Speed Derivation (Regression Check)
- **Rule:** Pokemon movement speeds come from species capabilities (Overland, Swim, Sky, Burrow), not from skill formulas.
- **Implementation:** `getOverlandSpeed` returns `pokemon.capabilities?.overland ?? 5` for Pokemon (line 94-95). `getSwimSpeed` returns `pokemon.capabilities?.swim ?? 0` for Pokemon (line 107-108). These paths are unchanged from the pre-feature-021 implementation.
- **Test assertions audited:**
  - Pokemon with overland=7 returns 7. CORRECT.
  - Pokemon with swim=4 returns 4. CORRECT.
  - Pokemon with undefined capabilities defaults overland to 5. CORRECT.
  - Pokemon with undefined capabilities defaults swim to 0. CORRECT.
- **Status:** CORRECT (no regression)

### Skill Rank Numeric Mapping
- **Rule:** PTU skill ranks: Pathetic=1, Untrained=2, Novice=3, Adept=4, Expert=5, Master=6 (`core/02-character-creation.md` p.14, p.34)
- **Implementation:** `SKILL_RANK_VALUES` in `app/utils/trainerDerivedStats.ts` (lines 37-44). Unknown/undefined ranks default to Untrained(2) via `skillRankToNumber` (line 47-52).
- **Status:** CORRECT

## Summary

All PTU formulas for trainer movement speed derivation are correctly implemented and tested. The implementation in `trainerDerivedStats.ts` faithfully reproduces the formulas from PTU Core p.16. The test suite covers 17 new test cases for the speed derivation functions with correct expected values audited against the rulebook formulas and the Lisa character example.

The consolidation refactor (`getHumanDerivedSpeeds`) is a pure performance optimization that does not change any formula output -- it calls `computeTrainerDerivedStats` once instead of twice when both Overland and Swimming are needed. The simplification of `combatantCanSwim` for humans (returning `true` directly) is mathematically proven correct since the minimum possible Swimming speed is 2.

The `getMaxPossibleSpeed` hot path in `useGridMovement.ts` (lines 219-222) correctly uses the consolidated function for human combatants, pushing both overland and swimming into the speeds array for max-speed calculation.

No regressions found in the Pokemon speed derivation path. Pokemon continue to use capabilities-based speeds with correct defaults (overland=5, swim=0).

## Rulings

No new PTU ambiguities discovered. No decree violations found. No applicable decrees in the movement speed derivation domain beyond decree-011 (speed averaging when crossing terrain boundaries), which is correctly implemented in `calculateAveragedSpeed` and is not affected by the feature-021 changes.

## Verdict

**APPROVED** -- All mechanics verified correct. 0 issues found. The fix cycle successfully addressed all 3 issues from code-review-298 without introducing any PTU rule violations or regressions.

## Required Changes

None.
