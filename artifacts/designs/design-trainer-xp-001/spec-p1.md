# P1: Integration — Capture XP, Encounter XP, Quest XP

## Overview

P1 integrates the core XP model (P0) with the three main XP sources in PTU: capturing new species (+1 XP), post-encounter trainer XP distribution, and GM quest/milestone awards from scene tools. Each section hooks into an existing system and adds trainer XP as a side effect.

**Prerequisite:** P0 must be implemented and merged. All P1 features depend on the `trainerXp` field, `capturedSpecies` field, XP endpoint, and `useTrainerXp` composable from P0.

---

## Section E: New Species Capture XP

### E.1 PTU Rule

> "Whenever a Trainer catches, hatches, or evolves a Pokemon species they did not previously own, they gain +1 Experience." (PTU Core p.461)

### E.2 Data Model

The `capturedSpecies` field (added in P0) is a JSON array of lowercase species names on `HumanCharacter`. P1 populates this field during capture.

### E.3 Capture Endpoint Modification

**Modified file:** `app/server/api/capture/attempt.post.ts`

After a successful capture, check if the species is new and award +1 XP:

```typescript
// After: await prisma.pokemon.update({ ownerId, origin: 'captured' })

if (captureResult.success) {
  // Link Pokemon to trainer
  await prisma.pokemon.update({
    where: { id: body.pokemonId },
    data: { ownerId: body.trainerId, origin: 'captured' }
  })

  // Check for new species -> +1 trainer XP
  const trainerRecord = await prisma.humanCharacter.findUnique({
    where: { id: body.trainerId },
    select: { capturedSpecies: true, trainerXp: true, level: true, name: true }
  })

  let speciesXpAwarded = false
  let xpResult: TrainerXpResult | null = null

  if (trainerRecord) {
    const existingSpecies: string[] = JSON.parse(trainerRecord.capturedSpecies || '[]')
    const normalizedSpecies = pokemon.species.toLowerCase().trim()

    if (isNewSpecies(pokemon.species, existingSpecies)) {
      // Add species to captured list
      const updatedSpecies = [...existingSpecies, normalizedSpecies]

      // Award +1 XP via the same logic as the XP endpoint
      const xpCalc = applyTrainerXp({
        currentXp: trainerRecord.trainerXp,
        currentLevel: trainerRecord.level,
        xpToAdd: 1
      })

      await prisma.humanCharacter.update({
        where: { id: body.trainerId },
        data: {
          capturedSpecies: JSON.stringify(updatedSpecies),
          trainerXp: xpCalc.newXp,
          level: xpCalc.newLevel
        }
      })

      speciesXpAwarded = true
      xpResult = xpCalc

      // Broadcast if level changed
      if (xpCalc.levelsGained > 0) {
        broadcast({ type: 'character_update', data: { characterId: body.trainerId } })
      }

      console.log(`[Trainer XP] ${trainerRecord.name}: +1 XP (new species: ${pokemon.species}). Bank: ${xpCalc.previousXp} -> ${xpCalc.newXp}, Level: ${xpCalc.previousLevel} -> ${xpCalc.newLevel}`)
    }
  }
}
```

### E.4 Capture Response Extension

The capture response includes new fields for the client to react:

```typescript
return {
  success: true,
  data: {
    captured: captureResult.success,
    // ... existing capture response fields ...

    // New species XP info (only present when captured === true)
    speciesXp: captureResult.success ? {
      awarded: speciesXpAwarded,
      species: pokemon.species,
      xpResult: xpResult  // null if species was already captured
    } : undefined
  }
}
```

### E.5 Client Handling

The capture UI (wherever it consumes the capture response) should show a notification when species XP is awarded:

```typescript
if (result.speciesXp?.awarded) {
  // Show toast: "New species captured! +1 Trainer XP"
  // If result.speciesXp.xpResult.levelsGained > 0:
  //   Show toast: "Level Up! Level X -> Y"
  //   Trigger LevelUpModal via useTrainerXp.pendingLevelUp
}
```

### E.6 Species Deduplication

The `capturedSpecies` list only grows. Species are never removed. The normalization (lowercase, trimmed) prevents duplicates from case differences. The `isNewSpecies()` utility from P0 handles the comparison.

**Edge case: Releasing a captured Pokemon**
If the trainer releases a Pokemon (unlinking it), the species remains in `capturedSpecies`. PTU says "species they did not previously own" -- once owned, the +1 XP was earned and cannot be revoked. The species is still "known."

**Edge case: Same species caught by multiple trainers**
Each trainer has their own `capturedSpecies` list. Trainer A catching Pikachu and Trainer B catching Pikachu are separate events, each granting +1 XP to their respective trainers.

---

## Section F: Batch Trainer XP After Encounters

### F.1 PTU Rule

> "Like with Pokemon Experience, GMs will have to decide how much Trainer Experience to grant after each encounter; and again, we encourage GMs to consider narrative significance and challenge as the main determining factors." (PTU Core p.461)

Trainer XP after encounters is NOT formula-based (unlike Pokemon XP). The GM manually decides the amount (typically 0-5). P1 adds a trainer XP section to the existing post-encounter XP distribution flow.

### F.2 Encounter Flow Extension

The existing post-encounter flow:
1. Encounter ends (all enemies defeated or encounter closed)
2. `XpDistributionModal` opens for Pokemon XP distribution
3. GM configures significance, allocates Pokemon XP
4. GM clicks "Apply XP"
5. Results shown

P1 adds a trainer XP step between steps 3 and 4:

```
1. Encounter ends
2. XpDistributionModal opens
3. [Pokemon XP Configuration] — existing
4. [Trainer XP Configuration] — NEW (Section F)
5. GM clicks "Apply XP"
6. [Pokemon XP Results + Trainer XP Results] — results phase extended
```

### F.3 UI: `TrainerXpSection.vue`

**New file:** `app/components/encounter/TrainerXpSection.vue`

A section within the XpDistributionModal that appears after the Pokemon XP configuration.

**Props:**
```typescript
interface Props {
  participatingTrainers: Array<{
    id: string
    name: string
    level: number
    trainerXp: number
  }>
  suggestedXp: number  // Based on significance tier
}
```

**Emits:**
```typescript
interface Emits {
  'update:allocations': [allocations: Map<string, number>]
}
```

**Template structure:**
```html
<div class="trainer-xp-section">
  <h3 class="section__title">Trainer Experience</h3>

  <!-- Suggestion bar (based on encounter significance) -->
  <div class="trainer-xp-section__suggestion">
    <span>Suggested: {{ suggestedXp }} XP per trainer</span>
    <button @click="applyToAll(suggestedXp)">Apply to All</button>
  </div>

  <!-- Per-trainer XP input -->
  <div class="trainer-xp-section__trainers">
    <div v-for="trainer in participatingTrainers" :key="trainer.id" class="trainer-xp-row">
      <div class="trainer-xp-row__info">
        <span class="trainer-xp-row__name">{{ trainer.name }}</span>
        <span class="trainer-xp-row__level">Lv.{{ trainer.level }}</span>
        <span class="trainer-xp-row__bank">Bank: {{ trainer.trainerXp }}/10</span>
      </div>
      <div class="trainer-xp-row__input">
        <input
          :value="getAllocation(trainer.id)"
          type="number"
          min="0"
          max="10"
          @input="handleInput(trainer.id, $event)"
        />
      </div>
      <div class="trainer-xp-row__preview">
        <span v-if="getLevelUpPreview(trainer)" class="trainer-xp-row__levelup">
          LEVEL UP! -> Lv.{{ getLevelUpPreview(trainer) }}
        </span>
      </div>
    </div>
  </div>

  <!-- Quick-set row -->
  <div class="trainer-xp-section__quick">
    <button v-for="n in [0, 1, 2, 3, 5]" :key="n" @click="applyToAll(n)">
      {{ n }} to All
    </button>
  </div>
</div>
```

**Level-up preview logic:**
```typescript
function getLevelUpPreview(trainer: { level: number; trainerXp: number }): number | null {
  const allocation = getAllocation(trainer.id)
  if (allocation <= 0) return null

  const result = applyTrainerXp({
    currentXp: trainer.trainerXp,
    currentLevel: trainer.level,
    xpToAdd: allocation
  })

  return result.levelsGained > 0 ? result.newLevel : null
}
```

### F.4 Significance-to-Trainer-XP Mapping

PTU does not define a formula, but provides guidelines (p.461). The suggested XP maps to the encounter's significance tier:

```typescript
const SIGNIFICANCE_TO_TRAINER_XP: Record<string, number> = {
  insignificant: 0,   // Weak/average wild Pokemon
  everyday: 1,        // Average trainer or strong wild
  significant: 3      // Important battle
}
```

The GM can always override. The suggestion is just a default.

### F.5 API Endpoint: `POST /api/encounters/:id/trainer-xp-distribute`

**New file:** `app/server/api/encounters/[id]/trainer-xp-distribute.post.ts`

Batch-awards trainer XP to multiple trainers after an encounter.

**Request body:**
```typescript
{
  distribution: Array<{
    characterId: string
    xpAmount: number
  }>
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    results: Array<{
      characterId: string
      characterName: string
      previousXp: number
      previousLevel: number
      newXp: number
      newLevel: number
      levelsGained: number
    }>
    totalXpDistributed: number
  }
}
```

**Implementation:**
```typescript
// For each trainer in the distribution:
// 1. Load character from DB
// 2. Call applyTrainerXp()
// 3. Update DB (trainerXp, level)
// 4. If levelsGained > 0, broadcast character_update
// 5. Collect results

// Execute updates in sequence (not parallel) to avoid race conditions
// if the same character appears twice (edge case: shouldn't happen but safety first)
```

### F.6 XpDistributionModal Integration

**Modified file:** `app/components/encounter/XpDistributionModal.vue`

Add the `TrainerXpSection` component to the modal. It appears after the Pokemon XP configuration section but before the "Apply XP" button.

```html
<!-- After Per-Player Distribution section -->
<TrainerXpSection
  v-if="calculationResult && participatingTrainers.length > 0"
  :participating-trainers="participatingTrainers"
  :suggested-xp="suggestedTrainerXp"
  @update:allocations="trainerXpAllocations = $event"
/>
```

The `participatingTrainers` computed property extracts trainer info from player-side human combatants:

```typescript
const participatingTrainers = computed(() => {
  if (!props.encounter) return []
  return props.encounter.combatants
    .filter(c => c.side === 'players' && c.type === 'human')
    .map(c => ({
      id: c.entityId,
      name: c.name,
      level: (c.entity as { level?: number }).level ?? 1,
      trainerXp: (c.entity as { trainerXp?: number }).trainerXp ?? 0
    }))
})
```

The "Apply XP" button handler is extended to distribute trainer XP alongside Pokemon XP:

```typescript
async function handleApply() {
  // ... existing Pokemon XP distribution ...

  // Distribute trainer XP (if any allocated)
  if (trainerXpAllocations.value.size > 0) {
    const trainerDistribution = Array.from(trainerXpAllocations.value.entries())
      .filter(([, xp]) => xp > 0)
      .map(([characterId, xpAmount]) => ({ characterId, xpAmount }))

    if (trainerDistribution.length > 0) {
      await $fetch(`/api/encounters/${encounterId}/trainer-xp-distribute`, {
        method: 'POST',
        body: { distribution: trainerDistribution }
      })
    }
  }
}
```

### F.7 Store Extension

**Modified file:** `app/stores/encounterXp.ts`

Add a `distributeTrainerXp` action:

```typescript
async distributeTrainerXp(params: {
  encounterId: string
  distribution: Array<{ characterId: string; xpAmount: number }>
}): Promise<{ results: TrainerXpDistributionResult[]; totalXpDistributed: number }> {
  const response = await $fetch(`/api/encounters/${params.encounterId}/trainer-xp-distribute`, {
    method: 'POST',
    body: { distribution: params.distribution }
  })
  return response.data
}
```

---

## Section G: Quest/Milestone XP from Scene Tools

### G.1 Concept

The scene system links characters to narrative locations. GMs use scenes for story progression. P1 adds a "Quest XP" action on the scene detail view that awards a specified amount of trainer XP to all characters in the scene.

This is a convenience tool -- functionally identical to manually awarding XP to each character individually, but faster when all scene participants earn the same amount.

### G.2 Scene Detail UI Extension

**Modified file:** `app/components/scene/SceneDetail.vue` (or equivalent)

Add a "Quest XP" button in the scene actions toolbar:

```html
<button class="btn btn--secondary" @click="showQuestXpDialog = true">
  <PhosphorIconStar :size="16" />
  Award Quest XP
</button>
```

### G.3 Quest XP Dialog

**Inline dialog (not a separate component)** — appears within the scene detail when "Award Quest XP" is clicked:

```html
<div v-if="showQuestXpDialog" class="quest-xp-dialog">
  <h4>Award Quest XP</h4>
  <p>Award trainer XP to all {{ sceneCharacters.length }} characters in this scene.</p>

  <div class="quest-xp-dialog__input">
    <label>XP Amount</label>
    <input v-model.number="questXpAmount" type="number" min="1" max="20" />
  </div>

  <div class="quest-xp-dialog__reason">
    <label>Reason (optional)</label>
    <input v-model="questXpReason" type="text" placeholder="Completed quest, milestone, etc." />
  </div>

  <div class="quest-xp-dialog__preview">
    <div v-for="char in sceneCharacters" :key="char.id" class="quest-xp-preview-row">
      <span>{{ char.name }} (Lv.{{ char.level }}, Bank: {{ char.trainerXp }}/10)</span>
      <span v-if="getQuestLevelUpPreview(char)" class="levelup-indicator">
        -> Lv.{{ getQuestLevelUpPreview(char) }}
      </span>
    </div>
  </div>

  <div class="quest-xp-dialog__actions">
    <button class="btn btn--secondary" @click="showQuestXpDialog = false">Cancel</button>
    <button class="btn btn--primary" @click="handleAwardQuestXp" :disabled="isAwardingQuestXp">
      {{ isAwardingQuestXp ? 'Awarding...' : 'Award' }}
    </button>
  </div>
</div>
```

### G.4 Quest XP Implementation

The quest XP feature calls the existing `POST /api/characters/:id/xp` endpoint for each scene participant. No new server endpoint is needed -- the client iterates:

```typescript
async function handleAwardQuestXp() {
  isAwardingQuestXp.value = true
  const results = []

  for (const char of sceneCharacters.value) {
    try {
      const result = await useTrainerXp().awardXp(
        char.id,
        questXpAmount.value,
        questXpReason.value || `Quest XP from scene: ${scene.value.name}`
      )
      results.push({ character: char, result })
    } catch (e) {
      console.error(`Failed to award XP to ${char.name}:`, e)
    }
  }

  // Show summary toast
  const levelUps = results.filter(r => r.result.levelsGained > 0)
  if (levelUps.length > 0) {
    // Notify about level-ups
    for (const lu of levelUps) {
      // The character sheet will handle opening LevelUpModal
      // when the character data refreshes
    }
  }

  showQuestXpDialog.value = false
  isAwardingQuestXp.value = false

  // Refresh scene data to reflect updated levels
  await refreshScene()
}
```

**Note:** Sequential API calls (not parallel) to prevent race conditions if the same character appears multiple times (edge case). In practice, each character appears once in a scene.

### G.5 Scene Characters Computed

The `sceneCharacters` computed property extracts `HumanCharacter` data from the scene's character list. Scenes store character references as `{ id, characterId, name }`. The full character data (including `trainerXp`) is loaded from the library store or fetched on demand.

---

## P1 Deliverables Summary

| Deliverable | Type | File |
|------------|------|------|
| Capture species XP hook | Modified | `app/server/api/capture/attempt.post.ts` |
| Trainer XP section component | New | `app/components/encounter/TrainerXpSection.vue` |
| Batch trainer XP endpoint | New | `app/server/api/encounters/[id]/trainer-xp-distribute.post.ts` |
| XP modal integration | Modified | `app/components/encounter/XpDistributionModal.vue` |
| Store extension | Modified | `app/stores/encounterXp.ts` |
| Scene quest XP UI | Modified | `app/components/scene/SceneDetail.vue` (or equivalent) |

---

## P1 Edge Cases

| Case | Expected Behavior |
|------|-------------------|
| Capture a species already in capturedSpecies | No +1 XP, no duplicate in list |
| Capture while trainer is at level 50 | +1 XP goes to bank, no level-up |
| Encounter with no player-side human combatants | TrainerXpSection hidden |
| All trainers set to 0 XP in encounter distribution | Skip trainer XP distribution entirely |
| Quest XP to scene with 0 characters | "Award Quest XP" button disabled |
| Quest XP causes multi-level jump | Each trainer's result tracked independently |
| Same trainer appears as combatant and in scene | Each system awards independently (encounter XP + quest XP stack) |
| Capture + encounter XP in same encounter | Species XP fires on capture; encounter XP fires on end. Both use the XP bank correctly (sequential, not concurrent) |
| Trainer XP distributed after Pokemon XP in same modal | Pokemon XP first (existing), then trainer XP (new). Both committed in the "Apply" action |
