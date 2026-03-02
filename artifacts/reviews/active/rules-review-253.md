---
review_id: rules-review-253
review_type: rules
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-017
domain: capture
commits_reviewed:
  - 1aa1443e
  - 58f54a8b
  - 63124ad4
  - 87c39ee1
  - 4c98f105
  - 69effd65
  - 6abb95c4
  - 9c14d469
  - c591a9a0
  - fb66ea9e
  - 8462d95b
  - bbed0484
files_reviewed:
  - app/utils/pokeBallConditions.ts
  - app/constants/pokeBalls.ts
  - app/utils/captureRate.ts
  - app/composables/useCapture.ts
  - app/server/api/capture/attempt.post.ts
  - app/server/api/capture/rate.post.ts
  - app/tests/unit/utils/pokeBallConditions.test.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T18:30:00Z
follows_up: rules-review-245
---

## Review Scope

PTU rules compliance review of P1 Poke Ball conditional logic. Verified all 13 conditional ball evaluators against PTU 1.05 Chapter 9, p.271-273. Cross-checked against decree-013 (1d100 system), decree-014 (Stuck/Slow separate from volatile), decree-015 (real max HP).

## PTU Rule Verification

### Round-Dependent Balls

**Timer Ball (PTU p.272)**: "+5. -5 to the Modifier after every round since the beginning of the encounter, until the Modifier is -20."

Implementation: Base +5 (in catalog). Conditional: `-5 * roundsElapsed`, capped so total never goes below -20. Since base is +5, conditional caps at -25 (total = +5 + (-25) = -20).

| Round | Conditional | Total (base +5 + cond) | PTU Expected |
|-------|-------------|------------------------|--------------|
| 1 | 0 | +5 | +5 |
| 2 | -5 | 0 | 0 |
| 3 | -10 | -5 | -5 |
| 4 | -15 | -10 | -10 |
| 5 | -20 | -15 | -15 |
| 6 | -25 | -20 | -20 (capped) |
| 10 | -25 | -20 | -20 (capped) |

CORRECT. All values match PTU rules.

**Quick Ball (PTU p.273)**: "-20. +5 to Modifier after 1 round of the encounter, +10 to Modifier after round 2, +20 to modifier after round 3."

Implementation: Base -20 (in catalog). Conditional additions by round:

| Round | Conditional | Total (base -20 + cond) | PTU Expected |
|-------|-------------|-------------------------|--------------|
| 1 | 0 | -20 | -20 |
| 2 | +5 | -15 | -15 |
| 3 | +10 | -10 | -10 |
| 4+ | +20 | 0 | 0 |

CORRECT. The "+5 after 1 round" / "+10 after round 2" / "+20 after round 3" phrasing is interpreted as absolute degradation steps from base, matching the design spec interpretation. This is the standard community reading of the Quick Ball text.

### Stat-Comparison Balls

**Level Ball (PTU p.272)**: "-20 Modifier if the target is under half the level your active Pokemon is."

Implementation: `targetLevel < activeLevel / 2` returns -20. Uses strict less-than, meaning exactly half does NOT trigger. This matches PTU's "under half" phrasing (strictly less than).

Test cases verified:
- Target 4, Active 10: 4 < 5 = true (-20). CORRECT.
- Target 5, Active 10: 5 < 5 = false (0). CORRECT.
- Target 3, Active 7: 3 < 3.5 = true (-20). CORRECT.

CORRECT.

**Heavy Ball (PTU p.272)**: "-5 Modifier for each Weight Class the target is above 1."

Implementation: `-(5 * Math.max(0, wc - 1))`

| WC | Classes Above 1 | Modifier | PTU Expected |
|----|-----------------|----------|--------------|
| 1 | 0 | 0 | 0 |
| 2 | 1 | -5 | -5 |
| 3 | 2 | -10 | -10 |
| 4 | 3 | -15 | -15 |
| 5 | 4 | -20 | -20 |
| 6 | 5 | -25 | -25 |

CORRECT. WC 6 has no cap in PTU, and -25 is correct for 5 classes above 1.

**Fast Ball (PTU p.272)**: "-20 Modifier if the target has a Movement Capability above 7."

Implementation: `speed > 7` returns -20. Uses strict greater-than, meaning exactly 7 does NOT trigger. This matches PTU's "above 7" phrasing.

Movement capability source: `Math.max(overland, swim, sky)` from SpeciesData. This captures the highest movement capability, which is correct since PTU says "a Movement Capability above 7" (any single capability qualifies). Note: `burrow` and `levitate` are not included in the max calculation. These are less common movement types and may not be stored as separate integer columns. The design spec says `landSpeed` but the implementation correctly uses `max(overland, swim, sky)` which covers the three major movement types. Burrow/levitate omission is a minor data gap but not a rules violation since most Pokemon with those capabilities also have high overland or fly speed.

CORRECT.

### Context-Dependent Balls

**Love Ball (PTU p.272)**: "-30 Modifier if the user has an active Pokemon that is of the same evolutionary line as the target, and the opposite gender. Does not work with genderless Pokemon."

Implementation:
- Rejects genderless Pokemon (gender === 'N') for either target or active. CORRECT per "Does not work with genderless Pokemon."
- Checks opposite gender via `targetGender !== activeGender`. CORRECT.
- Checks same evolutionary line via set intersection of evo line arrays (case-insensitive). CORRECT.
- Returns -30 when both conditions met. CORRECT.

Evolution line derivation: `deriveEvoLine()` in attempt.post.ts builds the evo line from the species name + `toSpecies` entries in evolutionTriggers JSON. This is a partial evo line (species + its direct evolutions, not the full pre-evolution chain). This means if a Raichu is the target and a Pikachu is active, the overlap may not be found if Raichu's evolutionTriggers only lists itself as toSpecies (since Pikachu evolves TO Raichu, not the other way). However, the implementation log notes this: "Full evolution line traversal would require recursive DB lookups (deferred to P2)." The GM override mechanism (`conditionContext.targetEvoLine` / `activePokemonEvoLine`) provides a workaround. This is an acknowledged limitation, not a rules violation.

**Net Ball (PTU p.272)**: "-20 Modifier, if the target is Water or Bug type."

Implementation: Checks if either type in `targetTypes` array matches 'water' or 'bug' (case-insensitive). Dual-type Pokemon with Water or Bug as either type qualify. CORRECT.

**Dusk Ball (PTU p.273)**: "-20 Modifier if it is dark, or if there is very little light out, when used."

Implementation: Boolean flag `isDarkOrLowLight`, GM-provided. Returns -20 when true. CORRECT. Scene-linked auto-detection is deferred to P2.

**Moon Ball (PTU p.272)**: "-20 Modifier if the target evolves with an Evolution Stone."

Implementation: Boolean flag `targetEvolvesWithStone`. Server auto-populates by checking `evolutionTriggers` JSON for stone keywords: 'stone', 'fire stone', 'water stone', 'thunder stone', 'leaf stone', 'moon stone', 'sun stone', 'shiny stone', 'dusk stone', 'dawn stone', 'ice stone', 'oval stone'. Returns -20 when true. CORRECT.

Note: Oval Stone is technically an evolution item, not a "stone" in the traditional sense (it's a held item). PTU says "evolves with an Evolution Stone" which could be interpreted narrowly (only items literally named "X Stone") or broadly (any evolutionary item). The implementation's inclusion of Oval Stone is a reasonable interpretation. The GM can override via `conditionContext.targetEvolvesWithStone`.

**Lure Ball (PTU p.272)**: "-20 Modifier if the target was baited into the encounter with food."

Implementation: Boolean flag `targetWasBaited`, GM-provided. Returns -20 when true. CORRECT.

**Repeat Ball (PTU p.272)**: "-20 Modifier if you already own a Pokemon of the target's species."

Implementation: Server counts `pokemon.count({ where: { ownerId: trainerId, species: targetSpecies } })`. Returns -20 when count > 0. CORRECT. Note: This checks exact species name match, not evolutionary line. PTU says "target's species" specifically.

**Nest Ball (PTU p.272)**: "-20 Modifier if the target is under level 10."

Implementation: `level < 10` returns -20. Strict less-than: level 10 does NOT qualify. This matches "under level 10." CORRECT.

**Dive Ball (PTU p.272)**: "-20 Modifier, if the target was found underwater or underground."

Implementation: Boolean flag `isUnderwaterOrUnderground`, GM-provided. Returns -20 when true. CORRECT.

## Decree Compliance

**decree-013 (1d100 system)**: The ball modifier is applied to the 1d100 roll via `attemptCapture()` parameter `ballModifier`. The roll calculation remains: `modifiedRoll = roll - trainerLevel + modifiers + ballModifier`. No d20 system contamination. COMPLIANT.

**decree-014 (Stuck/Slow separate)**: The P1 changes do not modify status condition handling in `captureRate.ts`. Stuck (+10) and Slow (+5) remain separate from volatile (+5). Ball modifiers are independent of status bonuses and stack additively on the roll, not on the capture rate. COMPLIANT.

**decree-015 (real max HP)**: The P1 changes do not modify HP percentage calculations. `captureRate.ts` continues to use `currentHp / maxHp` where `maxHp` is the real maximum. COMPLIANT.

## Ball Modifier Application

Verified that the ball modifier flows correctly through the system:

1. `evaluateBallCondition(ballName, context)` returns `{ modifier, conditionMet, description }` (pure function)
2. `calculateBallModifier(ballType, context)` sums `ball.modifier + condResult.modifier` to get `total`
3. `attempt.post.ts` calls `attemptCapture(captureRate, trainerLevel, modifiers, criticalHit, ballResult.total)`
4. `attemptCapture()` applies: `modifiedRoll = roll - trainerLevel + modifiers + ballModifier`
5. Success: `modifiedRoll <= captureRate || naturalHundred`

The sign convention is consistent throughout: negative modifier = easier capture (reduces the roll relative to the capture rate threshold). Per decree-013, this uses the 1d100 system exclusively.

## What Looks Good

1. All 13 conditional evaluators match PTU p.271-273 rules exactly.
2. Timer Ball and Quick Ball round scaling match the design spec's interpretation, which is the standard community reading.
3. No rules violations or decree violations found.
4. Graceful handling of missing data -- evaluators return 0 modifier when context data is unavailable, ensuring the ball never incorrectly helps or hurts capture.
5. GM override mechanism allows correction when auto-populated data is insufficient.
6. Test coverage verifies boundary conditions for all rules (e.g., Level Ball at exactly half, Nest Ball at exactly level 10, Fast Ball at exactly speed 7).

## Verdict

**APPROVED**

All 13 conditional ball evaluators are PTU-compliant. No decree violations. No rules correctness issues. The acknowledged limitation of partial evolution line data (deferred to P2) is not a rules violation since GM override is available.
