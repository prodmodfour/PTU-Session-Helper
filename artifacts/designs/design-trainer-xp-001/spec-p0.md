# P0: Core Trainer XP Model

## Overview

P0 delivers the foundation: a trainer XP bank on `HumanCharacter`, endpoints to manage it, auto-level detection with multi-level jump support, and a GM-facing XP panel on the character sheet. After P0, the GM can manually award/deduct trainer XP and the system auto-triggers level-ups via feature-008's LevelUpModal.

---

## Section A: Trainer XP Data Model

### A.1 Schema Migration

Add two fields to the `HumanCharacter` model in `app/prisma/schema.prisma`:

```prisma
model HumanCharacter {
  // ... existing fields ...

  // Trainer Experience Bank (PTU Core p.461)
  // Accumulates XP from GM awards, captures, quests. Auto-levels at 10.
  trainerXp        Int      @default(0)

  // Captured species history for +1 XP tracking (P1 uses this)
  // JSON array of lowercase species names: ["pikachu", "charmander"]
  capturedSpecies  String   @default("[]")
}
```

**Migration notes:**
- Both fields have defaults, so existing records are unaffected
- `trainerXp` starts at 0 for all existing characters
- `capturedSpecies` starts as empty JSON array
- No index needed on either field (not queried directly)

### A.2 TypeScript Type Update

In `app/types/character.ts`, add to the `HumanCharacter` interface:

```typescript
export interface HumanCharacter {
  // ... existing fields ...

  // Trainer XP
  trainerXp: number          // Experience bank (0-9 normally)
  capturedSpecies: string[]   // Species captured by this trainer (lowercase)
}
```

### A.3 API Serialization

The character GET endpoints (`index.get.ts`, `[id].get.ts`) already return all Prisma fields. The `capturedSpecies` field is stored as a JSON string in SQLite and must be parsed in the serialization layer, matching the existing pattern for `statusConditions`, `skills`, `edges`, etc.

In the serialization function (wherever characters are mapped from Prisma to API response), add:

```typescript
capturedSpecies: JSON.parse(record.capturedSpecies || '[]')
```

In the PUT endpoint (`[id].put.ts`), handle `capturedSpecies` as a JSON-serialized field:

```typescript
if (body.capturedSpecies !== undefined) {
  data.capturedSpecies = JSON.stringify(body.capturedSpecies)
}
```

---

## Section B: XP Management Endpoints

### B.1 Pure Utility: `trainerExperience.ts`

**New file:** `app/utils/trainerExperience.ts`

Pure functions for trainer XP math. Zero side effects, fully testable.

```typescript
/**
 * PTU 1.05 Trainer Experience Logic
 *
 * Trainer XP rules (PTU Core p.461):
 * - Trainers have an "Experience Bank" that accumulates XP
 * - When the bank reaches 10+, subtract 10 and gain 1 level
 * - Multi-level jumps are possible (bank 8 + 15 = 23 -> 2 levels, bank 3)
 * - Milestones grant levels separately (do not affect the bank)
 * - Bank cannot go below 0
 * - Level cannot exceed TRAINER_MAX_LEVEL (50)
 */

export const TRAINER_MAX_LEVEL = 50
export const TRAINER_XP_PER_LEVEL = 10

export interface TrainerXpInput {
  currentXp: number
  currentLevel: number
  xpToAdd: number
}

export interface TrainerXpResult {
  previousXp: number
  previousLevel: number
  xpAdded: number
  newXp: number
  newLevel: number
  levelsGained: number
}

export function applyTrainerXp(input: TrainerXpInput): TrainerXpResult {
  const { currentXp, currentLevel, xpToAdd } = input

  // Clamp bank to non-negative after addition
  const rawTotal = Math.max(0, currentXp + xpToAdd)

  // If already at max level, bank accumulates but no more level-ups
  if (currentLevel >= TRAINER_MAX_LEVEL) {
    return {
      previousXp: currentXp,
      previousLevel: currentLevel,
      xpAdded: xpToAdd,
      newXp: rawTotal,
      newLevel: currentLevel,
      levelsGained: 0
    }
  }

  // Calculate levels gained from bank
  const levelsFromXp = Math.floor(rawTotal / TRAINER_XP_PER_LEVEL)
  const remainingXp = rawTotal - (levelsFromXp * TRAINER_XP_PER_LEVEL)

  // Cap at max level
  const maxLevelsGainable = TRAINER_MAX_LEVEL - currentLevel
  const actualLevelsGained = Math.min(levelsFromXp, maxLevelsGainable)
  const newLevel = currentLevel + actualLevelsGained

  // If capped at max level, put excess XP back in bank
  const newXp = actualLevelsGained < levelsFromXp
    ? rawTotal - (actualLevelsGained * TRAINER_XP_PER_LEVEL)
    : remainingXp

  return {
    previousXp: currentXp,
    previousLevel: currentLevel,
    xpAdded: xpToAdd,
    newXp,
    newLevel,
    levelsGained: actualLevelsGained
  }
}

export function isNewSpecies(species: string, capturedSpecies: string[]): boolean {
  const normalized = species.toLowerCase().trim()
  return !capturedSpecies.some(s => s.toLowerCase().trim() === normalized)
}

export const TRAINER_XP_SUGGESTIONS = {
  none: { label: 'None', xp: 0, description: 'Weak/average wild Pokemon' },
  low: { label: 'Low', xp: 1, description: 'Average trainer encounter' },
  moderate: { label: 'Moderate', xp: 2, description: 'Challenging trainer battle' },
  significant: { label: 'Significant', xp: 3, description: 'Important battle or rival encounter' },
  major: { label: 'Major', xp: 4, description: 'Significant non-milestone event' },
  critical: { label: 'Critical', xp: 5, description: 'Near-milestone battle or major story event' }
} as const
```

**Key behaviors:**
- `applyTrainerXp()` handles all edge cases: negative XP, max level cap, multi-level jumps
- Bank value is always >= 0
- At max level, XP still accumulates in the bank but no levels are gained
- The function is pure: same input always produces same output

### B.2 API Endpoint: `POST /api/characters/:id/xp`

**New file:** `app/server/api/characters/[id]/xp.post.ts`

```typescript
/**
 * POST /api/characters/:id/xp
 *
 * Award or deduct trainer XP. Handles auto-level-up when bank >= 10.
 * Returns the updated character with level change info.
 *
 * Body: { amount: number, reason?: string }
 * - Positive amount = award XP
 * - Negative amount = deduct XP (bank cannot go below 0)
 */

import { prisma } from '~/server/utils/prisma'
import { applyTrainerXp, TRAINER_MAX_LEVEL } from '~/utils/trainerExperience'
import { broadcast } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  // Validation
  if (!id) {
    throw createError({ statusCode: 400, message: 'Character ID is required' })
  }
  if (typeof body.amount !== 'number' || !Number.isInteger(body.amount)) {
    throw createError({ statusCode: 400, message: 'amount must be an integer' })
  }
  if (body.amount === 0) {
    throw createError({ statusCode: 400, message: 'amount must be non-zero' })
  }
  if (body.amount < -100 || body.amount > 100) {
    throw createError({ statusCode: 400, message: 'amount must be between -100 and 100' })
  }

  // Load character
  const character = await prisma.humanCharacter.findUnique({ where: { id } })
  if (!character) {
    throw createError({ statusCode: 404, message: 'Character not found' })
  }

  // Apply XP (pure function)
  const result = applyTrainerXp({
    currentXp: character.trainerXp,
    currentLevel: character.level,
    xpToAdd: body.amount
  })

  // Update DB
  const updated = await prisma.humanCharacter.update({
    where: { id },
    data: {
      trainerXp: result.newXp,
      level: result.newLevel
    }
  })

  // Broadcast character update via WebSocket (for Group/Player View sync)
  if (result.levelsGained > 0) {
    broadcast({ type: 'character_update', data: { characterId: id } })
  }

  // Log for audit trail
  if (body.reason) {
    console.log(`[Trainer XP] ${character.name}: ${body.amount > 0 ? '+' : ''}${body.amount} XP (${body.reason}). Bank: ${result.previousXp} -> ${result.newXp}, Level: ${result.previousLevel} -> ${result.newLevel}`)
  }

  // Serialize response (parse JSON fields)
  return {
    success: true,
    data: {
      previousXp: result.previousXp,
      previousLevel: result.previousLevel,
      xpAdded: result.xpAdded,
      newXp: result.newXp,
      newLevel: result.newLevel,
      levelsGained: result.levelsGained,
      character: serializeCharacter(updated)
    }
  }
})
```

**Note:** `serializeCharacter()` is the existing helper that parses JSON fields. If it doesn't exist as a shared function, the endpoint will inline the parsing (matching the pattern in `index.get.ts`).

### B.3 XP History Endpoint (Optional, Lightweight)

**New file:** `app/server/api/characters/[id]/xp-history.get.ts`

This is a lightweight endpoint that returns the current XP state. No server-side history is stored in P0 (the reason is logged to console only). Future enhancement: add a `TrainerXpLog` model for full history.

```typescript
// Returns current XP state for display
return {
  success: true,
  data: {
    trainerXp: character.trainerXp,
    level: character.level,
    xpToNextLevel: TRAINER_XP_PER_LEVEL - character.trainerXp,
    capturedSpecies: JSON.parse(character.capturedSpecies || '[]')
  }
}
```

---

## Section C: Auto-Level-Up Trigger

### C.1 Level Change Detection Flow

When the XP endpoint increments the trainer's level, the following chain fires:

```
GM clicks "+3 XP" on TrainerXpPanel
  -> POST /api/characters/:id/xp { amount: 3 }
  -> Server: applyTrainerXp() -> levelsGained = 1 (bank was 8 + 3 = 11)
  -> Server: update DB (trainerXp: 1, level: old + 1)
  -> Server: broadcast character_update
  -> Client: useTrainerXp.awardXp() returns result with levelsGained = 1
  -> Client: refreshes character data from store
  -> Client: TrainerXpPanel emits 'level-up' event with { oldLevel, newLevel }
  -> Parent page: opens LevelUpModal (feature-008) with oldLevel/newLevel
  -> LevelUpModal: runs computeTrainerAdvancement(oldLevel, newLevel)
  -> GM completes stat allocation, etc.
  -> LevelUpModal: saves via PUT /api/characters/:id
```

### C.2 Composable: `useTrainerXp.ts`

**New file:** `app/composables/useTrainerXp.ts`

```typescript
/**
 * Composable for trainer XP operations.
 * Wraps API calls with reactive state and level-up detection.
 */
export function useTrainerXp() {
  const isProcessing = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<TrainerXpResult | null>(null)
  const pendingLevelUp = ref<{ oldLevel: number; newLevel: number } | null>(null)

  async function awardXp(
    characterId: string,
    amount: number,
    reason?: string
  ): Promise<TrainerXpResult> {
    isProcessing.value = true
    error.value = null

    try {
      const response = await $fetch(`/api/characters/${characterId}/xp`, {
        method: 'POST',
        body: { amount, reason }
      })

      const result = response.data
      lastResult.value = result

      // If levels were gained, set pending level-up for parent to handle
      if (result.levelsGained > 0) {
        pendingLevelUp.value = {
          oldLevel: result.previousLevel,
          newLevel: result.newLevel
        }
      }

      return result
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to award XP'
      error.value = message
      throw e
    } finally {
      isProcessing.value = false
    }
  }

  async function deductXp(
    characterId: string,
    amount: number,
    reason?: string
  ): Promise<TrainerXpResult> {
    // Deduction is just a negative award
    return awardXp(characterId, -Math.abs(amount), reason)
  }

  function clearPendingLevelUp(): void {
    pendingLevelUp.value = null
  }

  return {
    isProcessing: readonly(isProcessing),
    error: readonly(error),
    lastResult: readonly(lastResult),
    pendingLevelUp: readonly(pendingLevelUp),
    awardXp,
    deductXp,
    clearPendingLevelUp
  }
}
```

### C.3 Multi-Level Jump Handling

The composable returns `pendingLevelUp` with `oldLevel` and `newLevel`. The parent page passes these to `useTrainerLevelUp.initialize(character, newLevel)`, which calls `computeTrainerAdvancement(oldLevel, newLevel)`. This already handles multi-level jumps (e.g., level 3 to 6 returns advancement info for levels 4, 5, 6).

**Edge case: XP award during active LevelUpModal**
If the GM awards XP while the LevelUpModal is already open (e.g., from a previous manual level change), the composable queues the level-up. The `pendingLevelUp` ref only updates after the current modal closes and the character data is refreshed.

**Edge case: Reaching max level (50)**
When the trainer reaches level 50, the XP endpoint stops granting levels. The bank continues to accumulate (no cap on bank value at max level). The `TrainerXpPanel` shows "Max Level" and disables the progress bar animation.

---

## Section D: GM XP Award UI

### D.1 Component: `TrainerXpPanel.vue`

**New file:** `app/components/character/TrainerXpPanel.vue`

A compact panel embedded in the character sheet showing XP bank status and quick-award buttons.

**Props:**
```typescript
interface Props {
  character: HumanCharacter
  disabled?: boolean  // True when character is in active encounter
}
```

**Emits:**
```typescript
interface Emits {
  'level-up': [payload: { oldLevel: number; newLevel: number; character: HumanCharacter }]
  'xp-changed': [payload: { newXp: number; newLevel: number }]
}
```

**Template structure:**

```html
<div class="trainer-xp-panel">
  <!-- Header -->
  <div class="trainer-xp-panel__header">
    <h4>Trainer Experience</h4>
    <span class="trainer-xp-panel__bank">{{ character.trainerXp }} / 10 XP</span>
  </div>

  <!-- Progress bar -->
  <div class="trainer-xp-panel__progress">
    <div
      class="trainer-xp-panel__progress-fill"
      :style="{ width: `${(character.trainerXp / 10) * 100}%` }"
    />
  </div>

  <!-- Quick award buttons -->
  <div class="trainer-xp-panel__actions">
    <button @click="handleAward(-1)" :disabled="disabled || character.trainerXp === 0">-1</button>
    <button @click="handleAward(1)" :disabled="disabled">+1</button>
    <button @click="handleAward(2)" :disabled="disabled">+2</button>
    <button @click="handleAward(3)" :disabled="disabled">+3</button>
    <button @click="handleAward(5)" :disabled="disabled">+5</button>
    <button @click="showCustomInput = true" :disabled="disabled">Custom</button>
  </div>

  <!-- Custom input (shown when "Custom" is clicked) -->
  <div v-if="showCustomInput" class="trainer-xp-panel__custom">
    <input v-model.number="customAmount" type="number" min="-100" max="100" />
    <input v-model="customReason" type="text" placeholder="Reason (optional)" />
    <button @click="handleCustomAward">Apply</button>
    <button @click="showCustomInput = false">Cancel</button>
  </div>

  <!-- Max level indicator -->
  <div v-if="character.level >= 50" class="trainer-xp-panel__max-level">
    Max Level Reached
  </div>
</div>
```

**Script logic:**
```typescript
const { awardXp, isProcessing, pendingLevelUp } = useTrainerXp()

async function handleAward(amount: number) {
  const result = await awardXp(props.character.id, amount, `Quick award: ${amount > 0 ? '+' : ''}${amount}`)

  emit('xp-changed', { newXp: result.newXp, newLevel: result.newLevel })

  if (result.levelsGained > 0) {
    emit('level-up', {
      oldLevel: result.previousLevel,
      newLevel: result.newLevel,
      character: { ...props.character, level: result.newLevel, trainerXp: result.newXp }
    })
  }
}
```

### D.2 Integration into Character Sheet

**`gm/characters/[id].vue`:**

Add the `TrainerXpPanel` below the level display:

```html
<TrainerXpPanel
  :character="character"
  :disabled="isInActiveEncounter"
  @level-up="handleXpLevelUp"
  @xp-changed="handleXpChanged"
/>
```

```typescript
function handleXpLevelUp(payload: { oldLevel: number; newLevel: number; character: HumanCharacter }) {
  // Trigger the existing LevelUpModal from feature-008
  levelUpComposable.initialize(payload.character, payload.newLevel)
  showLevelUpModal.value = true
}

async function handleXpChanged(payload: { newXp: number; newLevel: number }) {
  // Refresh character data
  await refreshCharacter()
}
```

**`CharacterModal.vue`:**

Same integration pattern. The modal embeds `TrainerXpPanel` when in view mode (not editing). The `level-up` event opens the LevelUpModal nested within the CharacterModal.

### D.3 Styling

The panel uses the existing SCSS variables and follows the character sheet styling patterns:

```scss
.trainer-xp-panel {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__bank {
    font-weight: 600;
    color: $color-accent-teal;
    font-size: $font-size-lg;
  }

  &__progress {
    height: 8px;
    background: $color-bg-primary;
    border-radius: $border-radius-sm;
    overflow: hidden;
    margin-bottom: $spacing-sm;
  }

  &__progress-fill {
    height: 100%;
    background: $color-accent-teal;
    border-radius: $border-radius-sm;
    transition: width $transition-medium;
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }

  &__max-level {
    text-align: center;
    color: $color-text-muted;
    font-style: italic;
    padding: $spacing-sm 0;
  }
}
```

---

## P0 Deliverables Summary

| Deliverable | Type | File |
|------------|------|------|
| Schema migration | Modified | `app/prisma/schema.prisma` |
| Type update | Modified | `app/types/character.ts` |
| Pure XP utility | New | `app/utils/trainerExperience.ts` |
| XP award endpoint | New | `app/server/api/characters/[id]/xp.post.ts` |
| XP state endpoint | New | `app/server/api/characters/[id]/xp-history.get.ts` |
| XP composable | New | `app/composables/useTrainerXp.ts` |
| XP panel component | New | `app/components/character/TrainerXpPanel.vue` |
| Character sheet integration | Modified | `app/pages/gm/characters/[id].vue` |
| Character modal integration | Modified | `app/components/character/CharacterModal.vue` |
| Character serialization | Modified | Character GET/PUT endpoints (add capturedSpecies parsing) |

---

## P0 Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Award 0 XP | Server rejects with 400 (no-op prevention) |
| Award negative XP | Deducts from bank, bank cannot go below 0 |
| Bank at 8, award +15 | Bank 23 -> 2 levels + bank 3 |
| Bank at 0, deduct -5 | Bank stays at 0, no level change |
| Already at level 50, award +5 | Bank increases by 5, no level change |
| Bank at 9, award +1 | Bank 10 -> 1 level + bank 0 |
| Bank at 9, award +1, then +1 again immediately | First: level + bank 0. Second: bank 1, no level |
| XP award while LevelUpModal is open | Composable queues the level-up via `pendingLevelUp` |
| NPC character | XP panel shown (NPCs have levels too in PTU) |
| Character in active encounter | XP panel disabled (disable prop) |
