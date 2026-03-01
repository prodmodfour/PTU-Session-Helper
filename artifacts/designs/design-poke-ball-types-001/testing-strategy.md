# Testing Strategy

## Overview

Testing follows the project's standard Vitest unit testing approach. Each tier has its own test suite. Tests are structured to cover:
1. Pure utility/constant functions (no mocking needed)
2. Condition evaluator functions (no mocking needed -- all pure)
3. API endpoints (Prisma mocking required)
4. Composable logic (store mocking required)

---

## P0 Test Suite

### Poke Ball Catalog: `app/tests/unit/constants/pokeBalls.test.ts`

```
Test: POKE_BALL_CATALOG structure
  - every entry has required fields (id, name, category, modifier, description, cost)
  - category values are valid ('basic' | 'apricorn' | 'special' | 'safari')
  - modifier is a number (can be positive, negative, or zero)
  - no duplicate names
  - no duplicate IDs
  - total count is 25 (all PTU balls from p.271-273)

Test: Ball modifiers match PTU book (p.271-273)
  - Basic Ball: +0
  - Great Ball: -10
  - Ultra Ball: -15
  - Master Ball: -100
  - Safari Ball: +0
  - Level Ball: +0 (base, conditional separate)
  - Lure Ball: +0
  - Moon Ball: +0
  - Friend Ball: -5
  - Love Ball: +0
  - Heavy Ball: +0
  - Fast Ball: +0
  - Sport Ball: +0
  - Premier Ball: +0
  - Repeat Ball: +0
  - Timer Ball: +5
  - Nest Ball: +0
  - Net Ball: +0
  - Dive Ball: +0
  - Luxury Ball: -5
  - Heal Ball: -5
  - Quick Ball: -20
  - Dusk Ball: +0
  - Cherish Ball: -5
  - Park Ball: -15

Test: Ball costs match PTU book
  - Basic Ball: 250
  - Great Ball: 400
  - Ultra Ball: 800
  - Master Ball: 300000
  - All special balls: 800 (Level, Moon, Love, Heavy, Fast, Lure, Friend,
    Repeat, Timer, Nest, Net, Dive, Luxury, Heal, Quick, Dusk)
  - Safari/Sport/Park/Premier/Cherish: 0

Test: Ball categories
  - Basic: Basic Ball, Great Ball, Ultra Ball, Master Ball
  - Safari: Safari Ball, Sport Ball, Park Ball
  - Apricorn: Level, Lure, Moon, Friend, Love, Heavy, Fast
  - Special: all others

Test: conditionDescription defined for conditional balls
  - Level Ball, Love Ball, Heavy Ball, Fast Ball, Timer Ball, Quick Ball,
    Lure Ball, Moon Ball, Net Ball, Dusk Ball, Dive Ball, Repeat Ball, Nest Ball
    all have non-empty conditionDescription
  - Basic Ball, Great Ball, Ultra Ball, Master Ball have no conditionDescription

Test: postCaptureEffect defined for effect balls
  - Heal Ball: 'heal_full'
  - Friend Ball: 'loyalty_plus_one'
  - Luxury Ball: 'raised_happiness'
  - All other balls: undefined postCaptureEffect

Test: getBallsByCategory()
  - returns 4 categories
  - basic category has 4 balls
  - safari category has 3 balls
  - apricorn category has 7 balls
  - special category has 11 balls
  - all categories sum to 25

Test: getBallDef()
  - returns correct def for 'Great Ball'
  - returns undefined for 'Nonexistent Ball'

Test: getAvailableBallNames()
  - without safari: returns 22 balls (excludes Safari, Sport, Park)
  - with safari: returns 25 balls

Test: calculateBallModifier (P0 -- base only)
  - Basic Ball: total = 0, base = 0, conditional = 0
  - Great Ball: total = -10, base = -10, conditional = 0
  - Ultra Ball: total = -15, base = -15, conditional = 0
  - Master Ball: total = -100, base = -100, conditional = 0
  - Timer Ball: total = 5, base = 5, conditional = 0 (P0 ignores context)
  - Quick Ball: total = -20, base = -20, conditional = 0 (P0 ignores context)
  - Unknown ball: total = 0, base = 0, conditional = 0
```

### Updated attemptCapture: `app/tests/unit/utils/captureRate.test.ts`

```
Test: attemptCapture with ballModifier parameter
  - ballModifier = 0 produces same result as before (backward compat)
  - ballModifier = -10 (Great Ball) reduces modified roll by 10
  - ballModifier = -15 (Ultra Ball) reduces modified roll by 15
  - ballModifier = -100 (Master Ball) reduces modified roll by 100
  - ballModifier = +5 (Timer Ball round 1) increases modified roll by 5
  - ballModifier stacks with existing modifiers parameter
  - ballModifier field returned in result matches input
  - naturalHundred still captures regardless of ball modifier
  - formula: modifiedRoll = roll - trainerLevel + modifiers + ballModifier
```

### API Endpoint: `app/tests/unit/api/capture/rate.test.ts`

```
Test: POST /api/capture/rate with ballType
  - default (no ballType): returns ballType 'Basic Ball', ballModifier 0
  - ballType 'Great Ball': returns ballModifier -10
  - ballType 'Ultra Ball': returns ballModifier -15
  - unknown ballType: returns 400 error
  - ballBreakdown included in response with baseModifier, conditionalModifier, conditionMet
```

### API Endpoint: `app/tests/unit/api/capture/attempt.test.ts`

```
Test: POST /api/capture/attempt with ballType
  - default (no ballType): uses Basic Ball (+0), backward compat
  - ballType 'Great Ball': applies -10 to capture roll
  - ballType 'Ultra Ball': applies -15 to capture roll
  - ballType preserved in response data
  - ballModifier in response matches catalog value
  - unknown ballType: returns 400 error
  - modifiers (non-ball) still stack with ball modifier
```

---

## P1 Test Suite

### Condition Evaluators: `app/tests/unit/utils/pokeBallConditions.test.ts`

```
Test: evaluateBallCondition for unknown ball
  - returns modifier 0, conditionMet false

Test: Timer Ball evaluator
  - round 1: conditional = 0, conditionMet = false (no rounds elapsed)
  - round 2: conditional = -5, conditionMet = true
  - round 3: conditional = -10, conditionMet = true
  - round 4: conditional = -15, conditionMet = true
  - round 5: conditional = -20, conditionMet = true
  - round 6: conditional = -25 (capped so total hits -20)
  - round 10: still capped at conditional = -25
  - total = base(+5) + conditional: round 1 = +5, round 6+ = -20
  - no encounterRound provided: defaults to round 1

Test: Quick Ball evaluator
  - round 1: conditional = 0 (total = -20, best)
  - round 2: conditional = +5 (total = -15)
  - round 3: conditional = +10 (total = -10)
  - round 4+: conditional = +20 (total = 0)
  - no encounterRound provided: defaults to round 1

Test: Level Ball evaluator
  - target level 5, active level 20: conditionMet = true (-20)
  - target level 10, active level 20: conditionMet = false (10 is not < 10)
  - target level 9, active level 20: conditionMet = true (9 < 10)
  - target level 15, active level 20: conditionMet = false
  - no activePokemonLevel: conditionMet = false, modifier = 0
  - no targetLevel: conditionMet = false, modifier = 0

Test: Heavy Ball evaluator
  - WC 1: modifier = 0, conditionMet = false
  - WC 2: modifier = -5, conditionMet = true
  - WC 3: modifier = -10
  - WC 4: modifier = -15
  - WC 5: modifier = -20
  - WC 6: modifier = -25
  - no targetWeightClass: modifier = 0, conditionMet = false

Test: Fast Ball evaluator
  - speed 5: conditionMet = false
  - speed 7: conditionMet = false (not above 7)
  - speed 8: conditionMet = true (-20)
  - speed 12: conditionMet = true (-20)
  - no targetMovementSpeed: conditionMet = false

Test: Love Ball evaluator
  - same evo line + opposite gender: conditionMet = true (-30)
  - same evo line + same gender: conditionMet = false
  - different evo line + opposite gender: conditionMet = false
  - genderless target: conditionMet = false
  - genderless active: conditionMet = false
  - no gender data: conditionMet = false
  - no evo line data: conditionMet = false

Test: Net Ball evaluator
  - Water type: conditionMet = true (-20)
  - Bug type: conditionMet = true (-20)
  - Water/Bug dual type: conditionMet = true (-20, not -40)
  - Fire type: conditionMet = false
  - no types: conditionMet = false
  - case insensitive: 'water' and 'Water' both match

Test: Dusk Ball evaluator
  - isDarkOrLowLight = true: conditionMet = true (-20)
  - isDarkOrLowLight = false: conditionMet = false
  - isDarkOrLowLight = undefined: conditionMet = false

Test: Moon Ball evaluator
  - targetEvolvesWithStone = true: conditionMet = true (-20)
  - targetEvolvesWithStone = false: conditionMet = false
  - targetEvolvesWithStone = undefined: conditionMet = false

Test: Lure Ball evaluator
  - targetWasBaited = true: conditionMet = true (-20)
  - targetWasBaited = false: conditionMet = false

Test: Repeat Ball evaluator
  - trainerOwnsSpecies = true: conditionMet = true (-20)
  - trainerOwnsSpecies = false: conditionMet = false

Test: Nest Ball evaluator
  - level 5: conditionMet = true (-20)
  - level 9: conditionMet = true (-20)
  - level 10: conditionMet = false (not under 10)
  - level 15: conditionMet = false
  - no targetLevel: conditionMet = false

Test: Dive Ball evaluator
  - isUnderwaterOrUnderground = true: conditionMet = true (-20)
  - isUnderwaterOrUnderground = false: conditionMet = false
```

### Updated calculateBallModifier (P1): `app/tests/unit/constants/pokeBalls-p1.test.ts`

```
Test: calculateBallModifier with condition context
  - Timer Ball round 1: total = +5 (base +5, conditional 0)
  - Timer Ball round 3: total = -5 (base +5, conditional -10)
  - Timer Ball round 6: total = -20 (capped)
  - Quick Ball round 1: total = -20 (base -20, conditional 0)
  - Quick Ball round 4: total = 0 (base -20, conditional +20)
  - Level Ball with condition met: total = -20
  - Level Ball without condition met: total = 0
  - Heavy Ball WC 4: total = -15
  - Net Ball Water type: total = -20
  - Dusk Ball in dark: total = -20
  - Great Ball (no condition): total = -10 regardless of context
```

---

## P2 Test Suite

### Post-Capture Effects: `app/tests/unit/api/capture/postCapture.test.ts`

```
Test: Heal Ball post-capture effect
  - on successful capture: Pokemon HP set to maxHp
  - uses real max HP (not injury-reduced) per PTU text
  - effect NOT applied when capture fails
  - postCaptureEffect in response: { type: 'heal_full', description: ... }

Test: Friend Ball post-capture effect
  - on successful capture: postCaptureEffect = { type: 'loyalty_plus_one' }
  - no mechanical change (loyalty not tracked)

Test: Luxury Ball post-capture effect
  - on successful capture: postCaptureEffect = { type: 'raised_happiness' }
  - no mechanical change (happiness not tracked)

Test: Basic Ball post-capture (no effect)
  - postCaptureEffect is undefined in response
  - Pokemon HP unchanged after capture

Test: Post-capture effect only on success
  - failed capture with Heal Ball: no HP change, no postCaptureEffect
```

### Ball Selector Component: `app/tests/unit/components/capture/BallSelector.test.ts`

```
Test: BallSelector rendering
  - renders all non-safari balls by default (22 balls)
  - groups balls by category
  - shows modifier for each ball
  - highlights currently selected ball

Test: BallSelector selection
  - emits update:modelValue on ball click
  - defaults to Basic Ball

Test: BallSelector conditional display
  - shows condition description for conditional balls
  - shows condition met status when context provided
  - shows "n/a" for conditions when no context

Test: BallSelector safari toggle
  - excludes safari balls by default
  - includes safari balls when includeSafari = true
```

---

## Test Coverage Targets

| Layer | File | Target |
|-------|------|--------|
| Constants | `pokeBalls.ts` | 100% (pure data + simple getters) |
| Utility | `pokeBallConditions.ts` | 95%+ (all condition branches) |
| Utility | `captureRate.ts` (ballModifier addition) | 95%+ (existing + new param) |
| API | `rate.post.ts` (ball param) | 80%+ (happy paths + errors) |
| API | `attempt.post.ts` (ball param + post-capture) | 80%+ |
| Composable | `useCapture.ts` (ball param) | 80%+ |
| Component | `BallSelector.vue` | 75%+ (rendering + selection) |

---

## PTU Rule Verification Checklist

These tests explicitly verify PTU book values (all from Chapter 9, p.271-273):

- [ ] Basic Ball: +0 modifier (PTU p.272)
- [ ] Great Ball: -10 modifier (PTU p.272)
- [ ] Ultra Ball: -15 modifier (PTU p.272)
- [ ] Master Ball: -100 modifier (PTU p.272)
- [ ] Level Ball: -20 when target < half active Pokemon level (PTU p.272)
- [ ] Love Ball: -30 when same evo line + opposite gender (PTU p.272)
- [ ] Love Ball: does not work with genderless (PTU p.272)
- [ ] Heavy Ball: -5 per Weight Class above 1 (PTU p.272)
- [ ] Fast Ball: -20 when Movement > 7 (PTU p.272)
- [ ] Timer Ball: +5 base, -5 per round, capped at -20 total (PTU p.272)
- [ ] Quick Ball: -20 base, +5/+10/+20 decay after rounds 1/2/3 (PTU p.273)
- [ ] Nest Ball: -20 when target under level 10 (PTU p.272)
- [ ] Net Ball: -20 when Water or Bug type (PTU p.272)
- [ ] Dusk Ball: -20 in dark/low-light (PTU p.273)
- [ ] Moon Ball: -20 when target evolves with Evolution Stone (PTU p.272)
- [ ] Lure Ball: -20 when target was baited (PTU p.272)
- [ ] Repeat Ball: -20 when trainer owns same species (PTU p.272)
- [ ] Dive Ball: -20 when underwater/underground (PTU p.272)
- [ ] Friend Ball: -5 base, +1 Loyalty on capture (PTU p.272)
- [ ] Heal Ball: -5 base, heal to Max HP on capture (PTU p.273)
- [ ] Luxury Ball: -5 base, raised happiness (PTU p.272)
- [ ] Cherish Ball: -5 base (PTU p.273)
- [ ] Park Ball: -15 base (PTU p.273)
- [ ] Ball modifier applied to capture roll, not capture rate (PTU p.271)
- [ ] 1d100 capture system used, not d20 errata (decree-013)
- [ ] Real max HP used for HP percentage (decree-015)

---

## Integration Test Notes

No Playwright e2e tests are defined for this feature. Integration testing will be covered by:
1. Manual GM workflow testing (select ball type, view modifier preview, attempt capture)
2. UX exploration sessions (future session)
3. Unit tests covering the service, utility, and API layers
