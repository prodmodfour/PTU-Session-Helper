---
review_id: rules-review-124
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-060
domain: scenes
commits_reviewed:
  - 3f362c7
  - e0d2e23
  - d613c6d
  - da0f7da
mechanics_verified:
  - encounter-budget-formula
  - player-count-filtering
  - trainer-level-doubling
  - xp-calculation
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 0
ptu_refs:
  - core/11-running-the-game.md#Page 473
  - core/11-running-the-game.md#Page 460
reviewed_at: 2026-02-23T07:30:00Z
follows_up: code-review-130
---

## Mechanics Verified

### Encounter Budget Formula (PTU p.473)
- **Rule:** "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter." (`core/11-running-the-game.md#Page 473`)
- **Implementation:** `calculateEncounterBudget()` in `app/utils/encounterBudget.ts` computes `averagePokemonLevel * 2 * playerCount`. The formula display in `BudgetGuide.vue` line 38 shows `Lv.X x 2 x N players = total levels`.
- **Status:** CORRECT -- the formula matches the PTU rulebook example: "Multiply the average Pokemon Level by 2 for a baseline Experience drop of 40. Multiply this by 3 for the number of Trainers for a total of 120 levels."

### Player Count Filtering (PTU p.473)
- **Rule:** "multiply the Experience drop by your number of Trainers" -- the rulebook consistently refers to player trainers (PCs), not NPCs or allies. The example says "designing an encounter for three Level 10 Trainers" where the three are the PCs. (`core/11-running-the-game.md#Page 473`)
- **Implementation:** The M4 fix in `app/pages/gm/scenes/[id].vue` line 222-224 attempts to filter to PC trainers only by checking `characterType === 'pc'`.
- **Status:** INCORRECT -- see C1 below. The filter uses the wrong string constant `'pc'` instead of `'player'`, causing the budget to never be computed.

### Trainer Level Doubling (PTU p.460)
- **Rule:** "For encounters where Trainers were directly involved in the combat, treat their Level as doubled for the sake of this calculation." (`core/11-running-the-game.md#Page 460`)
- **Implementation:** `calculateEffectiveEnemyLevels()` in `app/utils/encounterBudget.ts` line 159: `effectiveLevels += enemy.isTrainer ? enemy.level * 2 : enemy.level`
- **Status:** CORRECT

### XP Calculation (PTU p.460)
- **Rule:** "Third, divide the Experience by the number of players gaining Experience. Divide by the number of Players -- not the number of Pokemon." (`core/11-running-the-game.md#Page 460`)
- **Implementation:** `calculateEncounterXp()` in `app/utils/encounterBudget.ts` line 208: `Math.floor(totalXp / Math.max(1, playerCount))`
- **Status:** CORRECT

### BudgetGuide Party Context (new component)
- **Rule:** Same as encounter budget formula above -- the manual input fallback in `BudgetGuide.vue` allows GM to enter average Pokemon level and player count when no scene context is available.
- **Implementation:** `BudgetGuide.vue` lines 66-75 implement a prop-then-manual fallback pattern. The `generatedPokemon` are treated as wild (non-trainer) enemies with `isTrainer: false` at line 88.
- **Status:** CORRECT -- wild encounter tables generate wild Pokemon, not trainer opponents, so `isTrainer: false` is the correct default.

## Issues

### CRITICAL

#### C1: M4 fix uses wrong characterType constant -- `'pc'` instead of `'player'`

**File:** `app/pages/gm/scenes/[id].vue` line 223

The M4 fix from code-review-130 correctly identified that the budget formula should count only PC trainers, not NPCs. However, the implementation compares against `'pc'`:

```typescript
const playerCharIds = sceneCharIds.filter(id =>
  allCharacters.value.find(c => c.id === id)?.characterType === 'pc'  // WRONG constant
)
```

The Prisma schema (`app/prisma/schema.prisma` line 14) defines `characterType String @default("npc")` with values `'player'` and `'npc'`. Every other reference in the codebase uses `'player'`:

- `app/components/character/HumanCard.vue:14` -- `characterType === 'player'`
- `app/stores/library.ts:115` -- `h.characterType === 'player'`
- `app/pages/gm/create.vue:109` -- `<option value="player">Player Character</option>`

The string `'pc'` appears **nowhere else** in the codebase. This means the filter will never match any character, `playerCount` will always be 0, the guard clause `if (playerCount === 0) return undefined` at line 226 fires every time, and the budget info is **never displayed** in the StartEncounterModal.

This completely defeats the purpose of the M4 fix and also breaks the original C1 feature (budget display in StartEncounterModal). The PTU p.473 encounter budget is non-functional in the scene-to-encounter flow.

**PTU impact:** The GM cannot see encounter difficulty when starting an encounter from a scene, which is exactly the information PTU p.473 provides to help balance encounters.

**Required fix:** Change `'pc'` to `'player'`:

```typescript
const playerCharIds = sceneCharIds.filter(id =>
  allCharacters.value.find(c => c.id === id)?.characterType === 'player'
)
```

## Summary

The encounter budget formula (`avgLevel * 2 * playerCount`), trainer level doubling, and XP calculation are all correctly implemented per PTU 1.05 Core p.460 and p.473. The `BudgetGuide` component extraction correctly carries the budget logic and wild Pokemon default of `isTrainer: false`.

However, the M4 fix introduces a critical regression by using the wrong character type constant `'pc'` instead of `'player'`. This makes the budget info permanently invisible in the scene-to-encounter flow, which is the primary consumer of this feature. The intent of the fix (filtering to PC trainers only per PTU p.473) is correct, but the implementation has a typo that nullifies the entire budget display system.

No errata corrections affect the encounter budget mechanics.

## Rulings

1. **Budget formula is PTU-correct.** `averagePokemonLevel * 2 * playerCount` matches the rulebook's worked example on p.473 (Level 20 * 2 = 40 baseline, * 3 trainers = 120 total).
2. **Player count must exclude NPCs.** PTU p.473 says "your number of Trainers" referring to PCs. The intent of M4 is correct -- only the constant is wrong.
3. **Wild Pokemon as non-trainer is correct.** Generated encounter table Pokemon are wild, not trainer-owned, so `isTrainer: false` is the right default per PTU p.460's doubling rule.

## Verdict

**CHANGES_REQUIRED**

## Required Changes

| ID | Severity | Description | File | PTU Ref |
|----|----------|-------------|------|---------|
| C1 | CRITICAL | Change `characterType === 'pc'` to `characterType === 'player'` -- the Prisma schema and all other code use `'player'`/`'npc'`, never `'pc'`. This typo causes the budget to never be computed, making the encounter balance feature non-functional. | `app/pages/gm/scenes/[id].vue:223` | p.473 |
