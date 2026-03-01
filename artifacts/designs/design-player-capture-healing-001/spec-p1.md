# P1: Player Capture UI

## Goal

Add a "Throw Poke Ball" button and capture flow to the player combat interface. The player selects a wild Pokemon target, sees a capture rate preview, and submits a capture request for GM approval. The GM executes the actual capture and the result flows back to the player via action ack.

**Depends on:** P0 (PlayerActionType extensions + PlayerRequestPanel)

---

## Section E: PlayerCapturePanel Component

### New File: `app/components/player/PlayerCapturePanel.vue` (~180 lines)

An expandable panel within PlayerCombatActions that handles the capture request flow.

**Props:** None (uses composables for state)

**State:**
```typescript
const showCapturePanel = ref(false)
const selectedTarget = ref<Combatant | null>(null)
const captureRateData = ref<CaptureRateData | null>(null)
const loadingRate = ref(false)
const requestPending = ref(false)
```

**Template structure:**
```
<section class="combat-actions__panel">
  <h4 class="combat-actions__panel-title">
    <PhCrosshairSimple :size="16" />
    Throw Poke Ball
  </h4>

  <!-- Step 1: Select target Pokemon (enemies only) -->
  <div v-if="!selectedTarget" class="capture-panel__targets">
    <p class="capture-panel__hint">Select a target Pokemon:</p>
    <button
      v-for="target in captureTargets"
      :key="target.id"
      class="combat-actions__panel-row combat-actions__panel-row--pokemon"
      @click="selectTarget(target)"
    >
      <img :src="getSpriteUrl(target.entity.species, target.entity.shiny)"
           :alt="getCombatantName(target)"
           class="combat-actions__panel-sprite" loading="lazy" />
      <div class="combat-actions__panel-pokemon-info">
        <span class="combat-actions__panel-name">{{ getCombatantName(target) }}</span>
        <span class="combat-actions__panel-hp">
          {{ target.entity.currentHp }} / {{ target.entity.maxHp }} HP
        </span>
      </div>
    </button>
    <div v-if="captureTargets.length === 0" class="combat-actions__panel-empty">
      No wild Pokemon to capture.
    </div>
  </div>

  <!-- Step 2: Capture rate preview + confirm -->
  <div v-else class="capture-panel__confirm">
    <div class="capture-panel__target-info">
      <img :src="getSpriteUrl(selectedTarget.entity.species, selectedTarget.entity.shiny)"
           :alt="getCombatantName(selectedTarget)"
           class="capture-panel__sprite" loading="lazy" />
      <span class="capture-panel__name">{{ getCombatantName(selectedTarget) }}</span>
    </div>

    <!-- Capture rate display -->
    <div v-if="loadingRate" class="capture-panel__loading">
      Calculating capture rate...
    </div>
    <CaptureRateDisplay
      v-else-if="captureRateData"
      :capture-rate="captureRateData"
      :show-breakdown="true"
      :show-attempt-button="false"
    />

    <!-- Action cost reminder -->
    <div class="capture-panel__action-cost">
      <PhInfo :size="14" />
      <span>Standard Action (AC 6 accuracy check)</span>
    </div>

    <!-- Confirm / Cancel -->
    <div class="capture-panel__buttons">
      <button
        class="combat-actions__btn combat-actions__btn--cancel"
        @click="cancelCapture"
      >
        Cancel
      </button>
      <button
        class="combat-actions__btn combat-actions__btn--confirm"
        :disabled="requestPending || !captureRateData?.canBeCaptured"
        @click="confirmCapture"
      >
        <PhCrosshairSimple :size="18" />
        {{ requestPending ? 'Waiting for GM...' : 'Request Capture' }}
      </button>
    </div>
  </div>
</section>
```

---

## Section F: Capture Target Filtering

### In `app/composables/usePlayerCombat.ts` (or new `usePlayerCapture.ts`)

Add a computed that returns valid capture targets: enemy-side Pokemon combatants that are not fainted.

```typescript
/**
 * Get enemy Pokemon that can be targeted for capture.
 * - Must be on the 'Enemies' side (wild Pokemon)
 * - Must not be fainted (currentHp > 0)
 * - Must be of type 'pokemon' (not trainers)
 * - Excludes already-captured Pokemon (if tracked)
 */
const captureTargets = computed((): Combatant[] => {
  if (!encounterStore.encounter) return []

  return encounterStore.encounter.combatants.filter(c => {
    if (c.type !== 'pokemon') return false
    if (c.side !== 'Enemies') return false
    const pokemon = c.entity as Pokemon
    return pokemon.currentHp > 0
  })
})
```

**Why filter to Enemies side:** In PTU, you can only capture wild Pokemon, not trained Pokemon belonging to other trainers. The app's encounter model uses `Enemies` side for wild Pokemon. Trainer-owned enemy Pokemon are a rare edge case (trainer battles) where capture is not permitted.

---

## Section G: Capture Rate Preview

### New File: `app/composables/usePlayerCapture.ts` (~100 lines)

A small composable focused on the player-side capture flow. Wraps `useCapture` with player-specific logic.

```typescript
import type { Combatant, Pokemon } from '~/types'
import type { CaptureRateData } from '~/composables/useCapture'

/**
 * Player-side capture composable.
 * Provides capture rate preview and request submission.
 * Does NOT execute capture -- that is GM-only.
 */
export function usePlayerCapture() {
  const { getCaptureRate, calculateCaptureRateLocal, loading, error } = useCapture()

  /**
   * Fetch capture rate for a target combatant.
   * Uses the server endpoint which has full Pokemon data.
   */
  const fetchCaptureRate = async (targetCombatant: Combatant): Promise<CaptureRateData | null> => {
    if (targetCombatant.type !== 'pokemon') return null
    const pokemon = targetCombatant.entity as Pokemon
    return getCaptureRate(pokemon.id)
  }

  /**
   * Calculate capture rate locally from combatant data.
   * Falls back to this when the server call is not possible.
   */
  const estimateCaptureRate = (targetCombatant: Combatant): CaptureRateData | null => {
    if (targetCombatant.type !== 'pokemon') return null
    const pokemon = targetCombatant.entity as Pokemon

    return calculateCaptureRateLocal({
      level: pokemon.level,
      currentHp: pokemon.currentHp,
      maxHp: pokemon.maxHp,
      evolutionStage: pokemon.evolutionStage,
      maxEvolutionStage: pokemon.maxEvolutionStage,
      statusConditions: pokemon.statusConditions ?? [],
      injuries: pokemon.injuries ?? 0,
      isShiny: pokemon.shiny ?? false,
      isLegendary: pokemon.isLegendary ?? false
    })
  }

  return {
    fetchCaptureRate,
    estimateCaptureRate,
    loading: readonly(loading),
    error: readonly(error)
  }
}
```

**Design note:** The player sees a capture rate preview using `fetchCaptureRate()` (server call) or `estimateCaptureRate()` (local fallback). This is informational only. The actual capture roll happens on the GM side via the existing capture attempt endpoint. The player's preview rate is included in the request payload (`captureRatePreview`) so the GM can see it in the request panel.

---

## Section H: Wire Capture into PlayerCombatActions

### File: `app/components/player/PlayerCombatActions.vue`

Add the capture button and panel to the existing "Requests" section.

**Changes to template:**

```vue
<!-- In the Requests section, after existing buttons -->
<!-- Throw Poke Ball -->
<button
  class="combat-actions__btn combat-actions__btn--capture"
  :disabled="!canUseStandardAction || !canBeCommanded || captureTargets.length === 0"
  :aria-expanded="showCapturePanel"
  aria-label="Request to throw a Poke Ball (requires GM approval)"
  @click="showCapturePanel = !showCapturePanel"
>
  <PhCrosshairSimple :size="20" />
  <span>Capture</span>
</button>

<!-- ... after existing panels ... -->

<!-- Capture Panel (expandable) -->
<PlayerCapturePanel
  v-if="showCapturePanel"
  @request-sent="handleCaptureRequestSent"
  @cancel="showCapturePanel = false"
/>
```

**Changes to script:**

```typescript
// Import
import PlayerCapturePanel from './PlayerCapturePanel.vue'

// Add to existing state
const showCapturePanel = ref(false)

// Close capture panel when turn ends (add to existing watcher)
watch(isMyTurn, (isTurn) => {
  if (!isTurn) {
    showCapturePanel.value = false
    // ... existing panel closures ...
  }
})

const handleCaptureRequestSent = () => {
  showCapturePanel.value = false
  showToast('Capture request sent to GM')
}
```

**Trainer-only availability:** The capture button should only appear when the active combatant is a trainer (human type), not when a Pokemon is acting. Trainers throw Poke Balls, not Pokemon. If in a League Battle during the Pokemon phase, the button is hidden.

```typescript
const canShowCapture = computed((): boolean => {
  // Only trainers can throw Poke Balls
  if (isActivePokemon.value) return false
  // In League Battles, only during trainer phase
  if (isLeagueBattle.value && !isTrainerPhase.value) return false
  return true
})
```

---

## P1 File Summary

| File | Type | Change | Lines |
|------|------|--------|-------|
| `app/components/player/PlayerCapturePanel.vue` | New | Capture target selector + rate preview + request confirm | ~180 |
| `app/composables/usePlayerCapture.ts` | New | Player-side capture rate + request logic | ~100 |
| `app/composables/usePlayerCombat.ts` | Modified | Add captureTargets computed, requestCapture function | +30 |
| `app/components/player/PlayerCombatActions.vue` | Modified | Add capture button + panel wiring | +25 |

**Estimated commits:** 4-5

**Acceptance criteria:**
- "Capture" button visible to trainers when Standard Action available and enemy Pokemon exist
- Tapping button opens target selector showing enemy Pokemon with HP
- Selecting target shows capture rate preview (via server or local calc)
- "Request Capture" sends `player_action` with `action: 'capture'` and all required fields
- GM sees capture request in PlayerRequestPanel with target name, ball type, and rate
- GM approve triggers capture attempt and sends result back via ack
- Player sees capture result in toast notification
- Capture button hidden during Pokemon phase in League Battles
- Button disabled when Standard Action already used
- Panel closes when turn ends

## PTU Rules Verified

| Rule | Verification |
|------|-------------|
| R004 | Throwing accuracy AC 6 -- displayed in capture panel action cost reminder |
| R027 | Full capture workflow -- player requests, GM executes, result shown |
| R032 | Standard Action cost -- button disabled when Standard Action used |
| decree-013 | 1d100 capture rate -- uses existing calculateCaptureRate (core system) |
| decree-015 | Real max HP -- uses existing getCaptureRate server endpoint |
