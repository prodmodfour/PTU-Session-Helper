# P1 Specification: Conditional Ball Logic

P1 extends the Poke Ball system from P0 (base modifiers only) to implement the conditional modifier logic for all balls that have context-dependent bonuses. This includes round-dependent balls (Timer, Quick), stat-comparison balls (Level, Heavy, Fast), and context-dependent balls (Love, Net, Dusk, Moon, Lure, Repeat, Nest, Dive).

**Prerequisite:** P0 must be fully implemented and reviewed before P1 begins.

---

## E. Conditional Ball Logic Engine

### New File: `app/utils/pokeBallConditions.ts`

A pure function module containing the condition evaluator for each ball type. Every condition function is a pure function with no side effects, taking a `BallConditionContext` and returning a number (the conditional modifier).

```typescript
import type { BallConditionContext } from '~/constants/pokeBalls'

/**
 * Evaluate the conditional modifier for a given ball type.
 * Returns 0 if no condition function exists or conditions are not met.
 *
 * Each ball's condition is a pure function: (context) => number.
 * Negative return = easier capture. Positive = harder.
 */
export function evaluateBallCondition(
  ballName: string,
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const evaluator = BALL_CONDITION_EVALUATORS[ballName]
  if (!evaluator) {
    return { modifier: 0, conditionMet: false }
  }
  return evaluator(context)
}

/**
 * Registry of per-ball condition evaluators.
 * Each entry maps a ball name to its condition function.
 */
const BALL_CONDITION_EVALUATORS: Record<
  string,
  (context: Partial<BallConditionContext>) => {
    modifier: number
    conditionMet: boolean
    description?: string
  }
> = {
  'Timer Ball': evaluateTimerBall,
  'Quick Ball': evaluateQuickBall,
  'Level Ball': evaluateLevelBall,
  'Heavy Ball': evaluateHeavyBall,
  'Fast Ball': evaluateFastBall,
  'Love Ball': evaluateLoveBall,
  'Net Ball': evaluateNetBall,
  'Dusk Ball': evaluateDuskBall,
  'Moon Ball': evaluateMoonBall,
  'Lure Ball': evaluateLureBall,
  'Repeat Ball': evaluateRepeatBall,
  'Nest Ball': evaluateNestBall,
  'Dive Ball': evaluateDiveBall,
}
```

**Design notes:**

- Each evaluator is a standalone pure function. Easy to test individually.
- The registry pattern allows adding new ball conditions without modifying `calculateBallModifier()`.
- `Partial<BallConditionContext>` is used because not all context fields are always available (GM may not provide all info).

---

## F. Round-Dependent Balls (Timer Ball, Quick Ball)

### Timer Ball

PTU p.272: "Timer Ball: +5. -5 to the Modifier after every round since the beginning of the encounter, until the Modifier is -20."

The base modifier is +5 (already in the catalog). The conditional modifier decreases by -5 for each round that has passed:

```typescript
/**
 * Timer Ball: Gets better over time.
 * Base: +5 (in catalog)
 * Conditional: -5 per round elapsed since encounter start.
 * Total modifier = 5 - (5 * roundsElapsed), capped at -20 total.
 *
 * Round 1: conditional = 0 (no rounds elapsed) -> total = +5
 * Round 2: conditional = -5 -> total = 0
 * Round 3: conditional = -10 -> total = -5
 * Round 4: conditional = -15 -> total = -10
 * Round 5: conditional = -20 -> total = -15
 * Round 6+: conditional = -25 -> total = -20 (capped)
 *
 * Cap: total modifier cannot go below -20.
 * Since base is +5, conditional cap = -25 (so total = +5 + (-25) = -20).
 */
function evaluateTimerBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const round = context.encounterRound ?? 1
  const roundsElapsed = Math.max(0, round - 1)
  const rawConditional = -(5 * roundsElapsed)
  // Total = base(+5) + conditional. Cap total at -20.
  // So conditional must be capped at -25 (since +5 + (-25) = -20).
  const conditional = Math.max(-25, rawConditional)
  const conditionMet = roundsElapsed > 0

  return {
    modifier: conditional,
    conditionMet,
    description: conditionMet
      ? `Timer Ball: ${roundsElapsed} rounds elapsed (${conditional >= 0 ? '+' : ''}${conditional} conditional)`
      : 'Timer Ball: round 1 (no bonus yet)',
  }
}
```

### Quick Ball

PTU p.273: "Quick Ball: -20. +5 to Modifier after 1 round of the encounter, +10 to Modifier after round 2, +20 to modifier after round 3."

The base modifier is -20 (already in the catalog). After rounds pass, the modifier degrades:

```typescript
/**
 * Quick Ball: Best on round 1, degrades over time.
 * Base: -20 (in catalog)
 * Conditional (cumulative additions to the base):
 *   Round 1: +0 -> total = -20
 *   Round 2 (after round 1): +5 -> total = -15
 *   Round 3 (after round 2): +10 -> total = -10
 *   Round 4+ (after round 3): +20 -> total = 0
 *
 * PTU says "+5 after 1 round", "+10 after round 2", "+20 after round 3".
 * These are cumulative additions: round 2 total addition is +5,
 * round 3 total addition is +10, round 4+ total addition is +20.
 */
function evaluateQuickBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const round = context.encounterRound ?? 1

  let conditional: number
  if (round <= 1) {
    conditional = 0       // Best: total = -20
  } else if (round === 2) {
    conditional = 5       // total = -15
  } else if (round === 3) {
    conditional = 10      // total = -10
  } else {
    conditional = 20      // total = 0
  }

  const conditionMet = round > 1

  return {
    modifier: conditional,
    conditionMet,
    description: conditionMet
      ? `Quick Ball: round ${round} (+${conditional} degradation, total effective: ${-20 + conditional})`
      : 'Quick Ball: round 1 (maximum bonus, -20)',
  }
}
```

### Round Tracking

The `encounterRound` is already tracked on the encounter record (the `round` field). The API endpoint reads it from the encounter state when `conditionContext.encounterRound` is not provided:

```typescript
// In attempt.post.ts, before calling calculateBallModifier:
const conditionContext: Partial<BallConditionContext> = {
  ...body.conditionContext,
  // Auto-populate round from encounter if available
  encounterRound: body.conditionContext?.encounterRound ?? encounter?.round ?? 1,
}
```

For out-of-combat captures (no active encounter), `encounterRound` defaults to 1.

---

## G. Stat-Comparison Balls (Level Ball, Heavy Ball, Fast Ball)

### Level Ball

PTU p.272: "-20 Modifier if the target is under half the level your active Pokemon is."

```typescript
/**
 * Level Ball: -20 if target level < half of user's active Pokemon level.
 * Requires: targetLevel, activePokemonLevel
 */
function evaluateLevelBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const targetLevel = context.targetLevel
  const activeLevel = context.activePokemonLevel

  if (targetLevel === undefined || activeLevel === undefined) {
    return {
      modifier: 0,
      conditionMet: false,
      description: 'Level Ball: active Pokemon level not provided',
    }
  }

  const threshold = activeLevel / 2
  const conditionMet = targetLevel < threshold

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? `Level Ball: target level ${targetLevel} < ${threshold} (half of ${activeLevel})`
      : `Level Ball: target level ${targetLevel} >= ${threshold} (no bonus)`,
  }
}
```

### Heavy Ball

PTU p.272: "-5 Modifier for each Weight Class the target is above 1."

```typescript
/**
 * Heavy Ball: -5 per Weight Class above 1.
 * WC 1: +0, WC 2: -5, WC 3: -10, WC 4: -15, WC 5: -20, WC 6: -25
 * Requires: targetWeightClass
 */
function evaluateHeavyBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const wc = context.targetWeightClass

  if (wc === undefined) {
    return {
      modifier: 0,
      conditionMet: false,
      description: 'Heavy Ball: target Weight Class not provided',
    }
  }

  const classesAboveOne = Math.max(0, wc - 1)
  const modifier = -(5 * classesAboveOne)
  const conditionMet = classesAboveOne > 0

  return {
    modifier,
    conditionMet,
    description: conditionMet
      ? `Heavy Ball: WC ${wc} (${classesAboveOne} above 1, ${modifier} modifier)`
      : `Heavy Ball: WC ${wc} (no bonus at WC 1)`,
  }
}
```

### Fast Ball

PTU p.272: "-20 Modifier if the target has a Movement Capability above 7."

```typescript
/**
 * Fast Ball: -20 if target's highest Movement Capability is above 7.
 * Requires: targetMovementSpeed (highest movement value)
 */
function evaluateFastBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const speed = context.targetMovementSpeed

  if (speed === undefined) {
    return {
      modifier: 0,
      conditionMet: false,
      description: 'Fast Ball: target Movement Capability not provided',
    }
  }

  const conditionMet = speed > 7

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? `Fast Ball: movement ${speed} > 7 (-20 modifier)`
      : `Fast Ball: movement ${speed} <= 7 (no bonus)`,
  }
}
```

### Data Source for Stats

The condition evaluators need data from the SpeciesData Prisma model:

- **Level Ball**: `activePokemonLevel` comes from the trainer's active Pokemon in the encounter. The API layer fetches it.
- **Heavy Ball**: `targetWeightClass` comes from `speciesData.weightClass`. Added to the context in the API layer.
- **Fast Ball**: `targetMovementSpeed` comes from `speciesData.landSpeed` (or highest of all movement types). Added to context in API layer.

The API endpoint populates `BallConditionContext` by querying the database:

```typescript
// In attempt.post.ts, build context from DB data:
const speciesData = await prisma.speciesData.findUnique({
  where: { name: pokemon.species }
})

const conditionContext: Partial<BallConditionContext> = {
  encounterRound: encounter?.round ?? 1,
  targetLevel: pokemon.level,
  targetTypes: speciesData ? JSON.parse(speciesData.types || '[]') : [],
  targetWeightClass: speciesData?.weightClass ?? 1,
  targetMovementSpeed: speciesData?.landSpeed ?? 5,
  targetSpecies: pokemon.species,
  ...body.conditionContext,  // GM overrides
}
```

---

## H. Context-Dependent Balls

### Love Ball

PTU p.272: "-30 Modifier if the user has an active Pokemon that is of the same evolutionary line as the target, and the opposite gender. Does not work with genderless Pokemon."

```typescript
/**
 * Love Ball: -30 if active Pokemon is same evo line + opposite gender.
 * Does not work with genderless Pokemon.
 */
function evaluateLoveBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const targetGender = context.targetGender
  const activeGender = context.activePokemonGender
  const targetEvoLine = context.targetEvoLine ?? []
  const activeEvoLine = context.activePokemonEvoLine ?? []

  // Cannot work with genderless Pokemon
  if (!targetGender || !activeGender || targetGender === 'N' || activeGender === 'N') {
    return {
      modifier: 0,
      conditionMet: false,
      description: 'Love Ball: genderless Pokemon or gender data not available',
    }
  }

  // Opposite gender check
  const isOppositeGender = targetGender !== activeGender

  // Same evolutionary line check: any overlap between evo line species
  const targetLineSet = new Set(targetEvoLine.map(s => s.toLowerCase()))
  const sameEvoLine = activeEvoLine.some(s => targetLineSet.has(s.toLowerCase()))

  const conditionMet = isOppositeGender && sameEvoLine

  return {
    modifier: conditionMet ? -30 : 0,
    conditionMet,
    description: conditionMet
      ? 'Love Ball: same evo line + opposite gender (-30 modifier)'
      : `Love Ball: conditions not met (opposite gender: ${isOppositeGender}, same evo line: ${sameEvoLine})`,
  }
}
```

**Evolutionary line data:** The `targetEvoLine` and `activePokemonEvoLine` arrays contain all species names in the evolution chain (e.g., `['Bulbasaur', 'Ivysaur', 'Venusaur']`). This data comes from the SpeciesData model's evolution fields. The API layer constructs these arrays by traversing the evolution chain.

### Net Ball

PTU p.272: "-20 Modifier, if the target is Water or Bug type."

```typescript
/**
 * Net Ball: -20 if target is Water or Bug type.
 */
function evaluateNetBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const types = context.targetTypes ?? []
  const normalizedTypes = types.map(t => t.toLowerCase())
  const conditionMet = normalizedTypes.includes('water') || normalizedTypes.includes('bug')

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? `Net Ball: target is ${types.join('/')} type (-20 modifier)`
      : `Net Ball: target is ${types.join('/')} type (no bonus)`,
  }
}
```

### Dusk Ball

PTU p.273: "-20 Modifier if it is dark, or if there is very little light out, when used."

```typescript
/**
 * Dusk Ball: -20 in dark or low-light conditions.
 * This is a GM-provided context flag.
 */
function evaluateDuskBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const conditionMet = context.isDarkOrLowLight === true

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? 'Dusk Ball: dark/low-light conditions (-20 modifier)'
      : 'Dusk Ball: normal lighting (no bonus)',
  }
}
```

### Moon Ball

PTU p.272: "-20 Modifier if the target evolves with an Evolution Stone."

```typescript
/**
 * Moon Ball: -20 if target evolves using an Evolution Stone.
 */
function evaluateMoonBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const conditionMet = context.targetEvolvesWithStone === true

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? 'Moon Ball: target evolves with Evolution Stone (-20 modifier)'
      : 'Moon Ball: target does not evolve with Evolution Stone (no bonus)',
  }
}
```

### Lure Ball

PTU p.272: "-20 Modifier if the target was baited into the encounter with food."

```typescript
/**
 * Lure Ball: -20 if target was baited with food.
 * GM-provided context flag.
 */
function evaluateLureBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const conditionMet = context.targetWasBaited === true

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? 'Lure Ball: target was baited (-20 modifier)'
      : 'Lure Ball: target was not baited (no bonus)',
  }
}
```

### Repeat Ball

PTU p.272: "-20 Modifier if you already own a Pokemon of the target's species."

```typescript
/**
 * Repeat Ball: -20 if trainer already owns a Pokemon of the target's species.
 */
function evaluateRepeatBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const conditionMet = context.trainerOwnsSpecies === true

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? 'Repeat Ball: trainer owns same species (-20 modifier)'
      : 'Repeat Ball: trainer does not own same species (no bonus)',
  }
}
```

### Nest Ball

PTU p.272: "-20 Modifier if the target is under level 10."

```typescript
/**
 * Nest Ball: -20 if target is under level 10.
 */
function evaluateNestBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const level = context.targetLevel

  if (level === undefined) {
    return {
      modifier: 0,
      conditionMet: false,
      description: 'Nest Ball: target level not provided',
    }
  }

  const conditionMet = level < 10

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? `Nest Ball: target level ${level} < 10 (-20 modifier)`
      : `Nest Ball: target level ${level} >= 10 (no bonus)`,
  }
}
```

### Dive Ball

PTU p.272: "-20 Modifier, if the target was found underwater or underground."

```typescript
/**
 * Dive Ball: -20 if target was found underwater or underground.
 * GM-provided context flag.
 */
function evaluateDiveBall(
  context: Partial<BallConditionContext>
): { modifier: number; conditionMet: boolean; description?: string } {
  const conditionMet = context.isUnderwaterOrUnderground === true

  return {
    modifier: conditionMet ? -20 : 0,
    conditionMet,
    description: conditionMet
      ? 'Dive Ball: underwater/underground encounter (-20 modifier)'
      : 'Dive Ball: surface encounter (no bonus)',
  }
}
```

---

## Updated `calculateBallModifier()` for P1

The `calculateBallModifier()` function in `app/constants/pokeBalls.ts` is updated to call the condition evaluator:

```typescript
import { evaluateBallCondition } from '~/utils/pokeBallConditions'

/**
 * Calculate the total ball modifier (base + conditional).
 * P1: Evaluates condition function if present.
 */
export function calculateBallModifier(
  ballType: string,
  context?: Partial<BallConditionContext>
): { total: number; base: number; conditional: number; conditionMet: boolean; description?: string } {
  const ball = POKE_BALL_CATALOG[ballType]
  if (!ball) {
    return { total: 0, base: 0, conditional: 0, conditionMet: false }
  }

  // Evaluate conditional modifier
  const condResult = evaluateBallCondition(ballType, context ?? {})

  const total = ball.modifier + condResult.modifier

  return {
    total,
    base: ball.modifier,
    conditional: condResult.modifier,
    conditionMet: condResult.conditionMet,
    description: condResult.description,
  }
}
```

---

## API Layer Context Population

### Auto-Populated Context Fields

The API endpoint auto-populates context fields from the database, reducing the need for the GM to provide all data manually:

```typescript
// In attempt.post.ts, after fetching pokemon and speciesData:

// Get the trainer's active Pokemon for Level Ball / Love Ball
let activePokemon: Pokemon | null = null
let activeSpeciesData: SpeciesData | null = null
if (encounter) {
  // Find the trainer's first non-fainted Pokemon in the encounter
  const trainerPokemon = encounter.combatants.find(
    c => c.type === 'pokemon' && c.entity.ownerId === body.trainerId
      && !(c.entity.statusConditions || []).includes('Fainted')
  )
  if (trainerPokemon) {
    activePokemon = trainerPokemon.entity as Pokemon
    activeSpeciesData = await prisma.speciesData.findUnique({
      where: { name: activePokemon.species }
    })
  }
}

// Check if trainer already owns this species (for Repeat Ball)
const existingOwned = await prisma.pokemon.count({
  where: {
    ownerId: body.trainerId,
    species: pokemon.species,
  }
})

const autoContext: Partial<BallConditionContext> = {
  encounterRound: encounter?.round ?? 1,
  targetLevel: pokemon.level,
  targetTypes: speciesData ? JSON.parse(speciesData.types || '[]') : [],
  targetGender: pokemon.gender || 'N',
  targetSpecies: pokemon.species,
  targetWeightClass: speciesData?.weightClass ?? 1,
  targetMovementSpeed: speciesData?.landSpeed ?? 5,
  targetEvolvesWithStone: speciesData?.evolvesWithStone ?? false,
  activePokemonLevel: activePokemon?.level,
  activePokemonGender: activePokemon?.gender || 'N',
  trainerOwnsSpecies: existingOwned > 0,
  // Evolution line data (if available from speciesData):
  targetEvoLine: speciesData?.evolutionLine
    ? JSON.parse(speciesData.evolutionLine)
    : [pokemon.species],
  activePokemonEvoLine: activeSpeciesData?.evolutionLine
    ? JSON.parse(activeSpeciesData.evolutionLine)
    : activePokemon ? [activePokemon.species] : [],
}

// GM overrides take priority
const conditionContext: Partial<BallConditionContext> = {
  ...autoContext,
  ...body.conditionContext,
}
```

### GM-Only Context Fields

Some fields cannot be auto-populated and require GM input:

| Field | Auto? | Source |
|-------|-------|--------|
| `encounterRound` | Yes | encounter.round |
| `targetLevel` | Yes | pokemon.level |
| `targetTypes` | Yes | speciesData.types |
| `targetGender` | Yes | pokemon.gender |
| `targetWeightClass` | Yes | speciesData.weightClass |
| `targetMovementSpeed` | Yes | speciesData.landSpeed |
| `targetEvolvesWithStone` | Yes | speciesData.evolvesWithStone |
| `activePokemonLevel` | Yes | trainer's active Pokemon |
| `activePokemonGender` | Yes | trainer's active Pokemon |
| `trainerOwnsSpecies` | Yes | DB count query |
| `targetEvoLine` | Yes | speciesData.evolutionLine |
| `activePokemonEvoLine` | Yes | active Pokemon's speciesData |
| `targetWasBaited` | **No** | GM provides |
| `isDarkOrLowLight` | **No** | GM provides (could be scene-linked in future) |
| `isUnderwaterOrUnderground` | **No** | GM provides (could be scene-linked in future) |

The three GM-only fields (`targetWasBaited`, `isDarkOrLowLight`, `isUnderwaterOrUnderground`) default to `false` if not provided, meaning the conditional bonus is not applied. The GM explicitly enables them via the capture UI (P2) or the API request body.

---

## SpeciesData Schema Considerations

P1 relies on the following SpeciesData fields:

| Field | Exists? | Notes |
|-------|---------|-------|
| `types` | Yes | JSON array of type strings |
| `weightClass` | Yes | Integer 1-6 |
| `landSpeed` | Yes | Integer movement value |
| `evolvesWithStone` | **No** | Needs adding or deriving |
| `evolutionLine` | **No** | Needs adding or deriving |

**evolvesWithStone:** Whether any evolution in the line requires an Evolution Stone. This could be:
- A boolean column on SpeciesData (populated during seed)
- A runtime check against the evolution method field

The implementation should prefer a boolean column populated during seed, as it avoids runtime parsing of evolution data.

**evolutionLine:** Array of all species in the same evolution chain. This could be:
- A JSON column on SpeciesData (populated during seed)
- A runtime traversal of pre-evolution/evolution fields

Again, prefer pre-computed data in the seed for performance.

If these columns cannot be added in P1, the condition evaluators gracefully handle missing data by returning `conditionMet: false` (no bonus applied). The GM can always override via `conditionContext`.
