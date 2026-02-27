# P0 Specification: Core Declaration/Resolution Flow

## A. Declaration Data Model

### Extended Types: `app/types/combat.ts`

Add a `TrainerDeclaration` interface to represent a recorded but unexecuted trainer action:

```typescript
/**
 * A trainer's declared action during League Battle declaration phase.
 * Recorded during trainer_declaration, executed during trainer_resolution.
 */
export interface TrainerDeclaration {
  /** Combatant ID of the declaring trainer */
  combatantId: string
  /** Display name of the trainer (for UI) */
  trainerName: string
  /** Type of declared action */
  actionType: 'command_pokemon' | 'switch_pokemon' | 'use_item' | 'use_feature' | 'orders' | 'pass'
  /** Free-text description of the declared action (e.g., "Switch Charmander for Squirtle") */
  description: string
  /** Target combatant IDs if applicable (e.g., which Pokemon to command, which to switch in) */
  targetIds?: string[]
  /** The round number this declaration was made in */
  round: number
}
```

### Extended Types: `app/types/encounter.ts`

Add `declarations` field to the `Encounter` interface:

```typescript
export interface Encounter {
  // ... existing fields ...

  // League Battle declaration tracking
  // Populated during trainer_declaration phase, consumed during trainer_resolution phase
  // Cleared at the start of each new round
  declarations: TrainerDeclaration[]
}
```

### Prisma Schema: `app/prisma/schema.prisma`

Add a JSON field to the Encounter model to persist declarations:

```prisma
model Encounter {
  // ... existing fields ...

  // League Battle trainer declarations (JSON array of TrainerDeclaration)
  // Populated during declaration phase, consumed during resolution, cleared per round
  declarations  String   @default("[]")
}
```

### Encounter Service: `app/server/services/encounter.service.ts`

Update `ParsedEncounter` to include declarations:

```typescript
export interface ParsedEncounter {
  // ... existing fields ...
  declarations: TrainerDeclaration[]
}
```

Update `buildEncounterResponse()` to parse and include declarations:

```typescript
export function buildEncounterResponse(
  record: EncounterRecord,
  combatants: Combatant[],
  options?: {
    // ... existing options ...
    declarations?: TrainerDeclaration[]
  }
): ParsedEncounter {
  // ... existing logic ...
  return {
    // ... existing fields ...
    declarations: options?.declarations ?? JSON.parse(record.declarations || '[]')
  }
}
```

---

## B. Declaration Recording API

### New Endpoint: `app/server/api/encounters/[id]/declare.post.ts`

Records a trainer's declared action during the `trainer_declaration` phase. Does NOT execute the action.

**Request body:**

```typescript
{
  combatantId: string          // Which trainer is declaring
  actionType: 'command_pokemon' | 'switch_pokemon' | 'use_item' | 'use_feature' | 'orders' | 'pass'
  description: string          // Human-readable description of the action
  targetIds?: string[]         // Optional target combatant IDs
}
```

**Response:**

```typescript
{
  success: true,
  data: Encounter  // Updated encounter with the new declaration
}
```

**Validation rules:**
1. Encounter must be active and in `trainer_declaration` phase
2. The declaring combatant must be the current turn's combatant (i.e., `turnOrder[currentTurnIndex]`)
3. The combatant must be a human type (trainers only)
4. The combatant must not have already declared this round (check `declarations` array for existing entry with same `combatantId` and `round`)

**Implementation:**

```typescript
import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import type { TrainerDeclaration } from '~/types/combat'
import type { Combatant } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Encounter ID is required' })
  }

  const body = await readBody(event)
  const { combatantId, actionType, description, targetIds } = body

  if (!combatantId || !actionType || !description) {
    throw createError({
      statusCode: 400,
      message: 'combatantId, actionType, and description are required'
    })
  }

  const validActionTypes = ['command_pokemon', 'switch_pokemon', 'use_item', 'use_feature', 'orders', 'pass']
  if (!validActionTypes.includes(actionType)) {
    throw createError({
      statusCode: 400,
      message: `Invalid actionType. Must be one of: ${validActionTypes.join(', ')}`
    })
  }

  try {
    const encounter = await prisma.encounter.findUnique({ where: { id } })
    if (!encounter) {
      throw createError({ statusCode: 404, message: 'Encounter not found' })
    }
    if (!encounter.isActive) {
      throw createError({ statusCode: 400, message: 'Encounter is not active' })
    }
    if (encounter.currentPhase !== 'trainer_declaration') {
      throw createError({
        statusCode: 400,
        message: 'Can only declare actions during the trainer declaration phase'
      })
    }

    const combatants: Combatant[] = JSON.parse(encounter.combatants)
    const turnOrder: string[] = JSON.parse(encounter.turnOrder)
    const declarations: TrainerDeclaration[] = JSON.parse(encounter.declarations || '[]')

    // Verify the declaring combatant is the current turn's combatant
    const currentCombatantId = turnOrder[encounter.currentTurnIndex]
    if (combatantId !== currentCombatantId) {
      throw createError({
        statusCode: 400,
        message: 'Only the current turn\'s combatant can declare an action'
      })
    }

    // Verify it's a trainer
    const combatant = combatants.find(c => c.id === combatantId)
    if (!combatant || combatant.type !== 'human') {
      throw createError({
        statusCode: 400,
        message: 'Only trainers can declare actions in League Battle declaration phase'
      })
    }

    // Check for duplicate declaration
    const alreadyDeclared = declarations.some(
      d => d.combatantId === combatantId && d.round === encounter.currentRound
    )
    if (alreadyDeclared) {
      throw createError({
        statusCode: 400,
        message: 'This trainer has already declared an action this round'
      })
    }

    // Build the declaration
    const entityName = (combatant.entity as { name: string }).name
    const declaration: TrainerDeclaration = {
      combatantId,
      trainerName: entityName,
      actionType,
      description,
      targetIds,
      round: encounter.currentRound
    }

    const updatedDeclarations = [...declarations, declaration]

    // Persist (does NOT advance turn -- next-turn.post.ts handles that)
    await prisma.encounter.update({
      where: { id },
      data: {
        declarations: JSON.stringify(updatedDeclarations)
      }
    })

    const response = buildEncounterResponse(encounter, combatants, {
      declarations: updatedDeclarations
    })

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to record declaration'
    throw createError({ statusCode: 500, message })
  }
})
```

**Flow:** The GM submits a declaration for the current trainer, then separately calls `next-turn` to advance to the next declaring trainer (or transition to resolution phase if all have declared).

---

## C. Phase Transition Logic

### Modified: `app/server/api/encounters/[id]/next-turn.post.ts`

The critical change: when the declaration phase ends (all trainers have declared), transition to `trainer_resolution` instead of jumping directly to `pokemon`.

**Current flow (buggy):**
```
trainer_declaration (all done) -> pokemon
```

**Corrected flow:**
```
trainer_declaration (all done) -> trainer_resolution -> pokemon
```

**Key changes to the League Battle branch in `next-turn.post.ts`:**

```typescript
const isLeagueBattle = encounter.battleType === 'trainer'

if (isLeagueBattle) {
  if (currentTurnIndex >= turnOrder.length) {
    if (currentPhase === 'trainer_declaration') {
      // Declaration phase done -> transition to RESOLUTION phase
      // Resolution processes trainers in HIGH-to-LOW speed order (reverse of declaration)
      if (trainerTurnOrder.length > 0) {
        // Build resolution order: reverse of declaration order (high-to-low speed)
        const resolutionOrder = [...trainerTurnOrder].reverse()
        currentPhase = 'trainer_resolution'
        turnOrder = resolutionOrder
        currentTurnIndex = 0
      } else {
        // No trainers with declarations -> skip to pokemon
        if (pokemonTurnOrder.length > 0) {
          currentPhase = 'pokemon'
          turnOrder = [...pokemonTurnOrder]
          currentTurnIndex = 0
        } else {
          // No trainers, no pokemon -> new round (shouldn't happen but handle gracefully)
          currentRound++
          currentTurnIndex = 0
          resetCombatantsForNewRound(combatants)
          ;({ weather, weatherDuration, weatherSource } = decrementWeather(weather, weatherDuration, weatherSource))
        }
      }
    } else if (currentPhase === 'trainer_resolution') {
      // Resolution phase done -> transition to Pokemon phase
      if (pokemonTurnOrder.length > 0) {
        currentPhase = 'pokemon'
        turnOrder = [...pokemonTurnOrder]
        currentTurnIndex = 0
      } else {
        // No Pokemon -> start new round with trainer declarations
        currentPhase = trainerTurnOrder.length > 0 ? 'trainer_declaration' : 'pokemon'
        turnOrder = trainerTurnOrder.length > 0 ? [...trainerTurnOrder] : [...pokemonTurnOrder]
        currentTurnIndex = 0
        currentRound++
        resetCombatantsForNewRound(combatants)
        clearDeclarations = true
        ;({ weather, weatherDuration, weatherSource } = decrementWeather(weather, weatherDuration, weatherSource))
      }
    } else {
      // Pokemon phase done -> new round starts with trainer declarations
      currentTurnIndex = 0
      currentRound++
      resetCombatantsForNewRound(combatants)
      clearDeclarations = true

      if (trainerTurnOrder.length > 0) {
        currentPhase = 'trainer_declaration'
        turnOrder = [...trainerTurnOrder]
      } else {
        currentPhase = 'pokemon'
        turnOrder = [...pokemonTurnOrder]
      }

      ;({ weather, weatherDuration, weatherSource } = decrementWeather(weather, weatherDuration, weatherSource))
    }
  }
}
```

**Declaration clearing:** When transitioning to a new round (from pokemon phase back to trainer_declaration), clear the declarations array:

```typescript
let clearDeclarations = false
// ... (set clearDeclarations = true when starting a new round) ...

const updateData: Record<string, unknown> = {
  currentTurnIndex,
  currentRound,
  currentPhase,
  turnOrder: JSON.stringify(turnOrder),
  combatants: JSON.stringify(combatants),
  weather,
  weatherDuration,
  weatherSource
}

if (clearDeclarations) {
  updateData.declarations = JSON.stringify([])
}

const updatedRecord = await prisma.encounter.update({
  where: { id },
  data: updateData
})
```

---

## D. Resolution Execution

During the `trainer_resolution` phase, the GM processes each trainer's declared action in high-to-low speed order. The system needs to:

1. Display the current trainer's declared action to the GM
2. Allow the GM to execute the declared action (using existing action endpoints: move, switch, item, etc.)
3. Advance to the next trainer's resolution via `next-turn`

### How resolution works mechanically:

Resolution does NOT auto-execute declarations. Instead:

1. The UI shows the current trainer's declaration (from the `declarations` array)
2. The GM manually executes the declared action using existing endpoints (`/move`, `/action`, custom logic)
3. The GM clicks "Next Turn" to advance to the next resolution

This approach is chosen because:
- Declared actions are free-text descriptions (not machine-executable commands)
- The GM may need to adjudicate edge cases (e.g., the switch target fainted during another resolution)
- Existing action endpoints already handle all the mechanical effects
- It avoids building a complex action serialization/replay system in P0

### Resolution Turn State

During the resolution phase, each trainer's turn state should be reset to allow them to take their declared action:

```typescript
// In resetCombatantsForNewRound or when entering resolution phase:
// Trainers in resolution get fresh action economy to execute their declared action
if (currentPhase === 'trainer_resolution') {
  const resolvingTrainer = combatants.find(c => c.id === turnOrder[currentTurnIndex])
  if (resolvingTrainer) {
    resolvingTrainer.turnState = {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false
    }
  }
}
```

**Important:** Trainers do NOT get action economy during the declaration phase. The declaration phase is purely for recording intent. The actual standard/shift/swift actions are consumed during resolution.

### Modified: `app/server/api/encounters/[id]/start.post.ts`

Initialize the `declarations` field on encounter start:

```typescript
await prisma.encounter.update({
  where: { id },
  data: {
    // ... existing fields ...
    declarations: JSON.stringify([])
  }
})
```

### Encounter Store: `app/stores/encounter.ts`

Add a getter to retrieve the declaration for the current combatant:

```typescript
getters: {
  // ... existing getters ...

  /** Get all declarations for the current round */
  currentDeclarations: (state): TrainerDeclaration[] => {
    if (!state.encounter) return []
    return (state.encounter.declarations ?? []).filter(
      d => d.round === state.encounter!.currentRound
    )
  },

  /** Get the declaration for the currently-resolving trainer (resolution phase only) */
  currentResolutionDeclaration: (state): TrainerDeclaration | null => {
    if (!state.encounter) return null
    if (state.encounter.currentPhase !== 'trainer_resolution') return null
    const currentId = state.encounter.turnOrder[state.encounter.currentTurnIndex]
    return (state.encounter.declarations ?? []).find(
      d => d.combatantId === currentId && d.round === state.encounter!.currentRound
    ) ?? null
  }
}
```

Add an action to submit a declaration:

```typescript
actions: {
  // ... existing actions ...

  /** Submit a trainer declaration during League Battle declaration phase */
  async submitDeclaration(
    combatantId: string,
    actionType: TrainerDeclaration['actionType'],
    description: string,
    targetIds?: string[]
  ) {
    if (!this.encounter) return

    try {
      const response = await $fetch<{ data: Encounter }>(
        `/api/encounters/${this.encounter.id}/declare`,
        {
          method: 'POST',
          body: { combatantId, actionType, description, targetIds }
        }
      )
      this.encounter = response.data
    } catch (e: any) {
      this.error = e.message || 'Failed to submit declaration'
      throw e
    }
  }
}
```

---

## Summary of File Changes (P0)

| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/types/combat.ts` | Add `TrainerDeclaration` interface |
| **EDIT** | `app/types/encounter.ts` | Add `declarations` field to `Encounter` interface |
| **EDIT** | `app/prisma/schema.prisma` | Add `declarations` JSON string field to Encounter model |
| **NEW** | `app/server/api/encounters/[id]/declare.post.ts` | Declaration recording endpoint |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Add `trainer_resolution` phase transition |
| **EDIT** | `app/server/api/encounters/[id]/start.post.ts` | Initialize `declarations` field on start |
| **EDIT** | `app/server/services/encounter.service.ts` | Parse/include declarations in response builder |
| **EDIT** | `app/stores/encounter.ts` | Add declaration getters and `submitDeclaration` action |
