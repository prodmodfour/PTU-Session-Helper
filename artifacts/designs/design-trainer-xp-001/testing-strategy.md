# Testing Strategy

## Overview

Testing follows the project's TDD approach with Vitest for unit tests. The trainer XP system has clear boundaries between pure logic, server endpoints, and UI components, making it naturally testable at each layer.

**Test location:** `app/tests/unit/`

---

## P0 Tests

### T1: Pure Utility — `trainerExperience.ts`

**File:** `app/tests/unit/utils/trainerExperience.test.ts`

This is the highest-value test target. The `applyTrainerXp()` function contains all the math and edge case handling.

#### T1.1 Basic XP Application

```typescript
describe('applyTrainerXp', () => {
  it('adds XP to bank without level-up', () => {
    const result = applyTrainerXp({ currentXp: 3, currentLevel: 5, xpToAdd: 4 })
    expect(result.newXp).toBe(7)
    expect(result.newLevel).toBe(5)
    expect(result.levelsGained).toBe(0)
  })

  it('triggers level-up at exactly 10 XP', () => {
    const result = applyTrainerXp({ currentXp: 7, currentLevel: 5, xpToAdd: 3 })
    expect(result.newXp).toBe(0)
    expect(result.newLevel).toBe(6)
    expect(result.levelsGained).toBe(1)
  })

  it('triggers level-up with remainder', () => {
    const result = applyTrainerXp({ currentXp: 8, currentLevel: 5, xpToAdd: 5 })
    expect(result.newXp).toBe(3)
    expect(result.newLevel).toBe(6)
    expect(result.levelsGained).toBe(1)
  })
})
```

#### T1.2 Multi-Level Jumps

```typescript
describe('multi-level jumps', () => {
  it('handles double level-up', () => {
    const result = applyTrainerXp({ currentXp: 8, currentLevel: 5, xpToAdd: 15 })
    // 8 + 15 = 23 -> floor(23/10) = 2 levels, remainder 3
    expect(result.newXp).toBe(3)
    expect(result.newLevel).toBe(7)
    expect(result.levelsGained).toBe(2)
  })

  it('handles triple level-up', () => {
    const result = applyTrainerXp({ currentXp: 0, currentLevel: 1, xpToAdd: 35 })
    // 0 + 35 = 35 -> 3 levels, remainder 5
    expect(result.newXp).toBe(5)
    expect(result.newLevel).toBe(4)
    expect(result.levelsGained).toBe(3)
  })

  it('handles exact multiple of 10', () => {
    const result = applyTrainerXp({ currentXp: 0, currentLevel: 1, xpToAdd: 20 })
    expect(result.newXp).toBe(0)
    expect(result.newLevel).toBe(3)
    expect(result.levelsGained).toBe(2)
  })
})
```

#### T1.3 Max Level Handling

```typescript
describe('max level (50)', () => {
  it('does not level past 50', () => {
    const result = applyTrainerXp({ currentXp: 8, currentLevel: 50, xpToAdd: 5 })
    expect(result.newXp).toBe(13)
    expect(result.newLevel).toBe(50)
    expect(result.levelsGained).toBe(0)
  })

  it('caps level at 50 during multi-level jump', () => {
    const result = applyTrainerXp({ currentXp: 0, currentLevel: 49, xpToAdd: 25 })
    // Would be 2 levels but capped at 1 (49 -> 50)
    // Remaining XP: 25 - 10 = 15 (only 1 level consumed)
    expect(result.newLevel).toBe(50)
    expect(result.levelsGained).toBe(1)
    expect(result.newXp).toBe(15)
  })

  it('handles near-max level with exact level-up to 50', () => {
    const result = applyTrainerXp({ currentXp: 5, currentLevel: 49, xpToAdd: 5 })
    expect(result.newXp).toBe(0)
    expect(result.newLevel).toBe(50)
    expect(result.levelsGained).toBe(1)
  })
})
```

#### T1.4 Negative XP (Deduction)

```typescript
describe('XP deduction', () => {
  it('deducts XP from bank', () => {
    const result = applyTrainerXp({ currentXp: 7, currentLevel: 5, xpToAdd: -3 })
    expect(result.newXp).toBe(4)
    expect(result.newLevel).toBe(5)
    expect(result.levelsGained).toBe(0)
  })

  it('clamps bank to 0 on excessive deduction', () => {
    const result = applyTrainerXp({ currentXp: 3, currentLevel: 5, xpToAdd: -10 })
    expect(result.newXp).toBe(0)
    expect(result.newLevel).toBe(5)
    expect(result.levelsGained).toBe(0)
  })

  it('does not reduce level on deduction', () => {
    const result = applyTrainerXp({ currentXp: 0, currentLevel: 5, xpToAdd: -5 })
    expect(result.newXp).toBe(0)
    expect(result.newLevel).toBe(5)
    expect(result.levelsGained).toBe(0)
  })
})
```

#### T1.5 Edge Cases

```typescript
describe('edge cases', () => {
  it('handles zero starting XP', () => {
    const result = applyTrainerXp({ currentXp: 0, currentLevel: 1, xpToAdd: 1 })
    expect(result.newXp).toBe(1)
    expect(result.levelsGained).toBe(0)
  })

  it('handles level 1 with exactly 10 XP', () => {
    const result = applyTrainerXp({ currentXp: 0, currentLevel: 1, xpToAdd: 10 })
    expect(result.newXp).toBe(0)
    expect(result.newLevel).toBe(2)
    expect(result.levelsGained).toBe(1)
  })

  it('preserves previous values in result', () => {
    const result = applyTrainerXp({ currentXp: 7, currentLevel: 10, xpToAdd: 5 })
    expect(result.previousXp).toBe(7)
    expect(result.previousLevel).toBe(10)
    expect(result.xpAdded).toBe(5)
  })
})
```

### T2: `isNewSpecies` Utility

```typescript
describe('isNewSpecies', () => {
  it('returns true for species not in list', () => {
    expect(isNewSpecies('Pikachu', ['charmander', 'bulbasaur'])).toBe(true)
  })

  it('returns false for species already in list', () => {
    expect(isNewSpecies('Pikachu', ['pikachu', 'charmander'])).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isNewSpecies('PIKACHU', ['pikachu'])).toBe(false)
    expect(isNewSpecies('pikachu', ['PIKACHU'])).toBe(false)
  })

  it('handles empty list', () => {
    expect(isNewSpecies('Pikachu', [])).toBe(true)
  })

  it('trims whitespace', () => {
    expect(isNewSpecies(' Pikachu ', ['pikachu'])).toBe(false)
  })
})
```

### T3: XP Endpoint — `xp.post.ts`

**File:** `app/tests/unit/api/characters/xp.test.ts`

Server endpoint tests mock Prisma and test request validation + response shape.

#### T3.1 Input Validation

```typescript
describe('POST /api/characters/:id/xp', () => {
  it('rejects missing amount', async () => {
    // Expect 400 response
  })

  it('rejects non-integer amount', async () => {
    // body: { amount: 2.5 }
    // Expect 400 response
  })

  it('rejects zero amount', async () => {
    // body: { amount: 0 }
    // Expect 400 response
  })

  it('rejects out-of-range amount', async () => {
    // body: { amount: 200 }
    // Expect 400 response
  })

  it('rejects non-existent character', async () => {
    // Mock prisma.humanCharacter.findUnique -> null
    // Expect 404 response
  })
})
```

#### T3.2 Successful XP Award

```typescript
describe('successful XP award', () => {
  it('awards XP without level-up', async () => {
    // Mock character: trainerXp: 3, level: 5
    // body: { amount: 4 }
    // Expect: newXp: 7, newLevel: 5, levelsGained: 0
  })

  it('awards XP with level-up', async () => {
    // Mock character: trainerXp: 8, level: 5
    // body: { amount: 5 }
    // Expect: newXp: 3, newLevel: 6, levelsGained: 1
  })

  it('broadcasts character_update on level-up', async () => {
    // Mock character: trainerXp: 9, level: 5
    // body: { amount: 1 }
    // Expect: broadcast called with { type: 'character_update', data: { characterId } }
  })

  it('does not broadcast without level-up', async () => {
    // Mock character: trainerXp: 3, level: 5
    // body: { amount: 2 }
    // Expect: broadcast NOT called
  })
})
```

### T4: Composable — `useTrainerXp.ts`

**File:** `app/tests/unit/composables/useTrainerXp.test.ts`

Tests the composable's reactive state management. Mock `$fetch` for API calls.

```typescript
describe('useTrainerXp', () => {
  it('sets isProcessing during API call', async () => {
    // ...
  })

  it('sets pendingLevelUp when levelsGained > 0', async () => {
    // Mock API response with levelsGained: 1
    // Expect: pendingLevelUp = { oldLevel: 5, newLevel: 6 }
  })

  it('does not set pendingLevelUp when levelsGained === 0', async () => {
    // Mock API response with levelsGained: 0
    // Expect: pendingLevelUp = null
  })

  it('clearPendingLevelUp resets the ref', () => {
    // Set pendingLevelUp, then clear
    // Expect: pendingLevelUp = null
  })

  it('deductXp calls awardXp with negative amount', async () => {
    // Call deductXp(id, 3)
    // Expect: API called with amount: -3
  })

  it('sets error on API failure', async () => {
    // Mock $fetch to throw
    // Expect: error is set, isProcessing is false
  })
})
```

---

## P1 Tests

### T5: Capture Species XP

**File:** `app/tests/unit/api/capture/attempt-species-xp.test.ts`

Tests the +1 XP hook in the capture endpoint.

```typescript
describe('capture species XP', () => {
  it('awards +1 XP for new species', async () => {
    // Mock: trainer.capturedSpecies = '["charmander"]'
    // Capture pokemon.species = 'Pikachu'
    // Expect: capturedSpecies updated to include 'pikachu'
    // Expect: trainerXp incremented by 1
  })

  it('does not award XP for already-captured species', async () => {
    // Mock: trainer.capturedSpecies = '["pikachu"]'
    // Capture pokemon.species = 'Pikachu'
    // Expect: capturedSpecies unchanged
    // Expect: trainerXp unchanged
  })

  it('triggers level-up when species XP fills bank', async () => {
    // Mock: trainer.capturedSpecies = '[]', trainerXp = 9, level = 5
    // Capture new species
    // Expect: trainerXp = 0, level = 6, levelsGained = 1
  })

  it('includes speciesXp in capture response', async () => {
    // Successful capture of new species
    // Expect: response.data.speciesXp.awarded = true
  })

  it('does not include speciesXp on failed capture', async () => {
    // Failed capture attempt
    // Expect: response.data.speciesXp undefined
  })

  it('normalizes species name to lowercase', async () => {
    // Mock: trainer.capturedSpecies = '["pikachu"]'
    // Capture pokemon.species = 'PIKACHU'
    // Expect: no duplicate, no XP awarded
  })
})
```

### T6: Batch Trainer XP Distribution

**File:** `app/tests/unit/api/encounters/trainer-xp-distribute.test.ts`

```typescript
describe('POST /api/encounters/:id/trainer-xp-distribute', () => {
  it('distributes XP to multiple trainers', async () => {
    // distribution: [{ characterId: 'a', xpAmount: 3 }, { characterId: 'b', xpAmount: 2 }]
    // Expect: both characters updated correctly
  })

  it('validates distribution array is non-empty', async () => {
    // distribution: []
    // Expect: 400 response
  })

  it('validates xpAmount is non-negative integer', async () => {
    // distribution: [{ characterId: 'a', xpAmount: -5 }]
    // Expect: 400 response
  })

  it('returns per-trainer results with level-up info', async () => {
    // Mock: trainer A has trainerXp: 9, level: 5
    // distribution: [{ characterId: 'a', xpAmount: 3 }]
    // Expect: result for A shows levelsGained: 1
  })

  it('handles non-existent character gracefully', async () => {
    // distribution: [{ characterId: 'nonexistent', xpAmount: 1 }]
    // Expect: 404 response
  })
})
```

### T7: `TrainerXpSection.vue` Component

**File:** `app/tests/unit/components/encounter/TrainerXpSection.test.ts`

Component tests verify rendering and interaction.

```typescript
describe('TrainerXpSection', () => {
  it('renders trainer list with XP inputs', () => {
    // Mount with 2 participating trainers
    // Expect: 2 trainer rows with name, level, bank display
  })

  it('shows level-up preview when XP would trigger level', () => {
    // Trainer with trainerXp: 9, set input to 3
    // Expect: "LEVEL UP! -> Lv.X" visible
  })

  it('emits update:allocations on input change', () => {
    // Change input for trainer A to 3
    // Expect: emit with Map containing { trainerA: 3 }
  })

  it('applies suggested XP to all trainers', () => {
    // Click "3 to All" button
    // Expect: all trainer inputs set to 3
  })
})
```

---

## Test Coverage Targets

| Layer | Target Coverage | Key Files |
|-------|----------------|-----------|
| Pure utilities | 100% line/branch | `trainerExperience.ts` |
| API endpoints | 90%+ line (validation + happy path + error cases) | `xp.post.ts`, `trainer-xp-distribute.post.ts` |
| Composables | 90%+ line | `useTrainerXp.ts` |
| Components | 80%+ line (render + interactions) | `TrainerXpPanel.vue`, `TrainerXpSection.vue` |
| Integration points | 80%+ line (capture hook, XpDistributionModal changes) | `attempt.post.ts`, `XpDistributionModal.vue` |

---

## Test Execution

```bash
# Run all trainer XP tests
cd app && npx vitest run --reporter verbose tests/unit/utils/trainerExperience.test.ts tests/unit/api/characters/xp.test.ts tests/unit/composables/useTrainerXp.test.ts

# Run with coverage
cd app && npx vitest run --coverage tests/unit/utils/trainerExperience.test.ts
```

---

## Mock Strategy

| Dependency | Mock Approach |
|-----------|---------------|
| Prisma | Mock `prisma.humanCharacter.findUnique`, `update`, etc. using `vi.mock('~/server/utils/prisma')` |
| WebSocket broadcast | Mock `broadcast` from `~/server/utils/websocket` |
| `$fetch` (in composables) | Mock global `$fetch` with `vi.fn()` |
| `useTrainerXp` (in components) | Mock the composable return value |
| PTU constants | Use real values (they are pure constants) |

---

## Regression Risks

| Risk | Mitigation |
|------|-----------|
| Character PUT endpoint breaks with new fields | Add test for PUT accepting `trainerXp` and `capturedSpecies` |
| Capture endpoint regression (existing capture flow) | Run existing capture tests + add species XP tests |
| XpDistributionModal regression (existing Pokemon XP flow) | Run existing XP distribution tests, verify Pokemon XP still works after adding trainer section |
| Level-up modal not opening after XP-triggered level change | Manual integration test: award XP that crosses 10, verify LevelUpModal opens |
| WebSocket broadcast double-fire | Test that broadcast fires exactly once per level change |
