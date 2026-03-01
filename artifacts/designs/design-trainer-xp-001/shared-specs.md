# Shared Specifications

## Existing Code Analysis

### 1. Pokemon XP System (Established Pattern)

The Pokemon XP system is the direct parallel for trainer XP. Key differences:

| Aspect | Pokemon XP | Trainer XP |
|--------|-----------|------------|
| XP chart | 100 levels, exponential curve (EXPERIENCE_CHART) | Flat: every 10 XP = 1 level |
| Storage | `Pokemon.experience` (cumulative total) | `HumanCharacter.trainerXp` (bank, resets at 10) |
| Level source | XP only | XP bank AND milestones (separate tracks) |
| Distribution | Per-Pokemon allocation from pool | Per-trainer flat amount from GM |
| Level-up action | Stat points, moves, abilities, evolution | Stat points, skills, edges, features, class choices (feature-008) |
| Max level | 100 | 50 (practical PTU max, trainerAdvancement.ts caps at 50) |

**Pokemon XP flow (reference for pattern reuse):**
1. `experienceCalculation.ts` -- pure math (encounter XP formula, level-up detection)
2. `xp-distribute.post.ts` -- server endpoint (validate, apply XP, update DB)
3. `encounterXp.ts` store -- client actions (calculateXp, distributeXp)
4. `XpDistributionModal.vue` -- GM UI for allocation

**Trainer XP flow (new, simpler):**
1. `trainerExperience.ts` -- pure math (apply XP to bank, calculate levels gained)
2. `[id]/xp.post.ts` -- server endpoint (validate, apply XP, auto-level, update DB)
3. `useTrainerXp.ts` composable -- client actions and reactive state
4. `TrainerXpPanel.vue` -- GM UI for direct XP management

### 2. Character Level Editing & Level-Up Detection (feature-008)

Feature-008 added level-up detection in two places:

**Standalone page (`gm/characters/[id].vue`):**
```typescript
// Watch for level increase -> show LevelUpModal
watch(() => editData.value.level, (newLevel, oldLevel) => {
  if (isEditing.value && newLevel > oldLevel && character.value) {
    editData.value.level = oldLevel  // Revert
    showLevelUpModal.value = true
    levelUpTarget.value = newLevel
  }
})
```

**CharacterModal (`CharacterModal.vue`):**
Same pattern -- intercepts level changes and redirects to LevelUpModal.

**Integration point for XP auto-level:**
When the XP endpoint increments the trainer's level, the character data refreshes in the store. The existing watch on `level` detects the change and opens the LevelUpModal. The XP system does NOT need to open the modal itself -- it updates the DB, the client refreshes, and the existing detection kicks in.

However, there is a subtlety: the existing watch only fires in **edit mode**. For auto-level from XP, we need a separate detection path that works outside edit mode. The `useTrainerXp` composable will handle this by emitting a `levelUp` event when XP application causes a level change.

### 3. Capture System (`capture/attempt.post.ts`)

The capture endpoint currently:
1. Validates Pokemon is wild (no owner)
2. Calculates capture rate from PTU formulas
3. Rolls capture attempt
4. On success: links Pokemon to trainer (`ownerId`, `origin: 'captured'`)

**Missing:** No species tracking, no +1 XP award. The P1 integration adds:
1. Check if `trainer.capturedSpecies` already includes `pokemon.species`
2. If new species: add to `capturedSpecies`, call XP award logic for +1

### 4. Encounter XP Distribution (`XpDistributionModal.vue`)

The modal currently handles Pokemon XP only:
- Shows defeated enemies and significance multiplier
- Calculates XP per player
- GM allocates XP across each player's Pokemon
- Results phase shows level-ups

**P1 adds a trainer XP section:**
- After Pokemon XP is configured, a "Trainer XP" section allows the GM to set XP per trainer
- This is a flat number (0-5 typically), not calculated from a formula
- The GM enters the amount, and it applies to all participating trainers (with per-trainer override)

### 5. Scene System (Quest/Milestone XP, P1)

Scenes link characters to narrative locations. The scene detail view shows participants. P1 adds a "Quest XP" action that awards XP to all scene participants. This is a GM convenience tool -- the same effect as manually awarding XP to each character.

---

## Schema Changes

### HumanCharacter Model (Prisma)

```prisma
model HumanCharacter {
  // ... existing fields ...

  // Trainer XP (Experience Bank)
  // PTU Core p.461: accumulates XP, auto-levels at 10
  trainerXp        Int      @default(0)

  // Species capture history (for +1 XP on new species)
  // JSON array of lowercase species names: ["pikachu", "charmander"]
  capturedSpecies  String   @default("[]")
}
```

**Why `trainerXp` is a bank (not cumulative):**
PTU trainers don't have a cumulative XP total like Pokemon. The "Experience Bank" holds 0-9 XP. When it reaches 10, the trainer levels up and the bank resets to `bank - 10`. Multi-level jumps are possible (e.g., bank at 8, +15 XP = bank 23 = 2 levels + bank 3).

**Why `capturedSpecies` is on HumanCharacter:**
The species list is per-trainer, not global. Different trainers may have caught different species. Storing on the trainer model keeps the data co-located with the XP it affects.

### TypeScript Type Changes

```typescript
// In app/types/character.ts
export interface HumanCharacter {
  // ... existing fields ...
  trainerXp: number       // Experience bank (0-9 normally, can temporarily exceed 10 before processing)
  capturedSpecies: string[] // Species names this trainer has captured/hatched/evolved
}
```

---

## Utility: `trainerExperience.ts`

### New File: `app/utils/trainerExperience.ts`

Pure functions for trainer XP math. No side effects, no DB access.

```typescript
/** Maximum trainer level (practical PTU limit) */
export const TRAINER_MAX_LEVEL = 50

/** XP required per trainer level */
export const TRAINER_XP_PER_LEVEL = 10

/**
 * Input for applying XP to a trainer's experience bank.
 */
export interface TrainerXpInput {
  currentXp: number    // Current bank value (0-9 normally)
  currentLevel: number // Current trainer level
  xpToAdd: number      // XP to award (can be negative for deduction)
}

/**
 * Result of applying XP. Includes level changes and final bank state.
 */
export interface TrainerXpResult {
  previousXp: number
  previousLevel: number
  xpAdded: number
  newXp: number        // Final bank value after level-ups consumed
  newLevel: number
  levelsGained: number // How many times the bank crossed 10
}

/**
 * Apply XP to a trainer's experience bank.
 * Handles multi-level jumps and negative XP (deduction).
 * Bank cannot go below 0. Level cannot go below 1 or above TRAINER_MAX_LEVEL.
 */
export function applyTrainerXp(input: TrainerXpInput): TrainerXpResult { ... }

/**
 * Check if a species is new for a trainer (not in their capturedSpecies list).
 * Case-insensitive comparison.
 */
export function isNewSpecies(species: string, capturedSpecies: string[]): boolean { ... }

/**
 * Suggested trainer XP description for UI display.
 * Maps significance tiers to typical trainer XP awards.
 */
export const TRAINER_XP_SUGGESTIONS: Record<string, { label: string; xp: number; description: string }> = {
  none: { label: 'None', xp: 0, description: 'Weak/average wild Pokemon' },
  low: { label: 'Low', xp: 1, description: 'Average trainer encounter' },
  moderate: { label: 'Moderate', xp: 2, description: 'Challenging trainer battle' },
  significant: { label: 'Significant', xp: 3, description: 'Important battle, rival encounter' },
  major: { label: 'Major', xp: 4, description: 'Significant non-milestone event' },
  critical: { label: 'Critical', xp: 5, description: 'Near-milestone battle, major story event' }
}
```

---

## Composable: `useTrainerXp.ts`

### New File: `app/composables/useTrainerXp.ts`

Reactive state management for trainer XP operations. Thin wrapper around API calls with local state tracking.

```typescript
export function useTrainerXp() {
  const isAwarding = ref(false)
  const error = ref<string | null>(null)
  const lastResult = ref<TrainerXpResult | null>(null)

  /**
   * Award XP to a trainer. Returns the result including any level changes.
   * Caller is responsible for refreshing character data and handling level-ups.
   */
  async function awardXp(characterId: string, amount: number, reason?: string): Promise<TrainerXpResult> { ... }

  /**
   * Deduct XP from a trainer. Cannot go below 0.
   */
  async function deductXp(characterId: string, amount: number, reason?: string): Promise<TrainerXpResult> { ... }

  return {
    isAwarding: readonly(isAwarding),
    error: readonly(error),
    lastResult: readonly(lastResult),
    awardXp,
    deductXp
  }
}
```

---

## API Endpoint: `POST /api/characters/:id/xp`

### New File: `app/server/api/characters/[id]/xp.post.ts`

Awards or deducts XP from a trainer's experience bank. Handles auto-level-up when bank reaches 10+.

**Request body:**
```typescript
{
  amount: number       // Positive = award, negative = deduct
  reason?: string      // Optional audit trail (not stored in DB currently, logged to console)
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    previousXp: number
    previousLevel: number
    xpAdded: number
    newXp: number
    newLevel: number
    levelsGained: number
    character: HumanCharacter  // Full updated character object
  }
}
```

**Auto-level behavior:**
1. Load character from DB
2. Call `applyTrainerXp()` pure function
3. If `levelsGained > 0`:
   a. Update `trainerXp`, `level` in DB
   b. Broadcast `character_update` via WebSocket (so Group/Player views refresh)
   c. Client detects level change and opens LevelUpModal (feature-008)
4. If `levelsGained === 0`:
   a. Update `trainerXp` only
5. Return updated character

**Multi-level jump handling:**
When awarding large XP amounts (e.g., 25 XP with bank at 8):
- Total = 8 + 25 = 33
- Levels gained = floor(33 / 10) = 3
- Remaining bank = 33 - (3 * 10) = 3
- New level = old level + 3
- The LevelUpModal (feature-008) already handles multi-level jumps via `computeTrainerAdvancement(oldLevel, newLevel)`

---

## Component: `TrainerXpPanel.vue`

### New File: `app/components/character/TrainerXpPanel.vue`

Displays the XP bank and provides quick-award controls. Embedded in the character sheet.

**Layout:**
```
[ XP Bank: 7 / 10 ] [Progress bar]
[ -1 ] [ +1 ] [ +2 ] [ +3 ] [ +5 ] [ Custom... ]
```

**Behavior:**
- Progress bar shows current XP / 10 visually
- Quick buttons award common amounts (referencing TRAINER_XP_SUGGESTIONS)
- "Custom..." opens a small input for arbitrary amounts
- After awarding, if level changed, shows a brief toast/notification before LevelUpModal opens
- Deduction via -1 button (or custom negative amount)
- Disabled when character is in an active encounter (prevents desync)

---

## Changes to Existing Files

### `app/types/character.ts`

Add `trainerXp` and `capturedSpecies` to `HumanCharacter` interface.

### `app/prisma/schema.prisma`

Add `trainerXp` and `capturedSpecies` fields to `HumanCharacter` model.

### `app/server/api/characters/[id].put.ts`

No changes needed. The PUT endpoint already accepts arbitrary fields. The XP endpoint is separate because it has auto-level logic.

### `app/server/api/characters/index.get.ts` and `[id].get.ts`

Ensure `trainerXp` and `capturedSpecies` are included in the response serialization. Since Prisma returns all fields by default, this should work without changes.

### `gm/characters/[id].vue` and `CharacterModal.vue`

Add `<TrainerXpPanel>` component to the character sheet layout. Wire the `levelUp` event from `useTrainerXp` to the existing LevelUpModal trigger.

### `app/stores/library.ts`

No changes to the store itself. The `loadLibrary()` action already fetches full character objects. The new fields are included automatically.

---

## Key Design Decisions

### 1. Bank model, not cumulative total

PTU explicitly uses a "bank" that resets at 10. Storing the bank value (0-9) rather than a cumulative total matches the rules exactly and avoids the need to compute `currentXp mod 10` everywhere. The tradeoff is no historical total, but PTU doesn't use a historical total for anything.

### 2. Separate XP endpoint (not PUT)

The XP endpoint has auto-level logic that the generic PUT does not. Mixing auto-level into PUT would risk triggering level-ups during normal field edits. Separation keeps the PUT endpoint simple and the XP logic explicit.

### 3. Client-driven level-up modal (not server-driven)

The XP endpoint updates `level` in the DB. The client detects the level change on refresh and opens the LevelUpModal (feature-008). The server does NOT return "open a modal" -- it returns the new character state, and the client's existing level-change detection handles the rest. This keeps the server stateless and the client in control of UI flow.

### 4. `capturedSpecies` as lowercase normalized list

Species names are stored lowercase for case-insensitive comparison. The list grows monotonically (species are added, never removed). This is cheaper than a separate join table and sufficient for the use case (typical trainer captures <100 species in a campaign).

### 5. Trainer XP is GM-granted, not formula-based

PTU p.461 explicitly says trainer XP amounts are GM decisions, not formulas. The app provides suggested amounts (TRAINER_XP_SUGGESTIONS) but the GM enters the final number. This differs from Pokemon XP which has a formula (sum of enemy levels * significance / players).

### 6. WebSocket broadcast on level change

When XP causes a level change, the server broadcasts `character_update` via WebSocket. This ensures the Group View and Player View see the updated level immediately. The same broadcast pattern is used by existing character update flows.
