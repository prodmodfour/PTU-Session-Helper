<template>
  <div class="player-view">
    <!-- No Active Encounter -->
    <div v-if="!encounter || !encounter.isActive" class="player-view__waiting">
      <div class="waiting-content">
        <h1>PTU Session Helper</h1>
        <p>Waiting for encounter to start...</p>
        <div class="waiting-spinner"></div>
      </div>
    </div>

    <!-- Active Encounter -->
    <div v-else class="player-view__active">
      <!-- Header -->
      <header class="player-header">
        <div class="player-header__info">
          <h1>{{ encounter.name }}</h1>
          <span class="round-badge">Round {{ encounter.currentRound }}</span>
        </div>
        <div class="player-header__turn" v-if="currentCombatant">
          <span class="turn-label">Current Turn:</span>
          <span class="turn-name">{{ getCombatantName(currentCombatant) }}</span>
        </div>
      </header>

      <!-- Main Content -->
      <main class="player-main">
        <!-- All Combatants -->
        <div class="combatants-display">
          <!-- Players Section -->
          <section class="combatant-section combatant-section--players">
            <h2>Players</h2>
            <div class="combatant-grid">
              <PlayerCombatantCard
                v-for="combatant in playerCombatants"
                :key="combatant.id"
                :combatant="combatant"
                :is-current-turn="combatant.id === currentCombatant?.id"
                :show-details="combatant.side === 'players'"
                @use-move="handleUseMove"
              />
            </div>
          </section>

          <!-- Allies Section (if any) -->
          <section v-if="allyCombatants.length > 0" class="combatant-section combatant-section--allies">
            <h2>Allies</h2>
            <div class="combatant-grid">
              <PlayerCombatantCard
                v-for="combatant in allyCombatants"
                :key="combatant.id"
                :combatant="combatant"
                :is-current-turn="combatant.id === currentCombatant?.id"
                :show-details="false"
              />
            </div>
          </section>

          <!-- Enemies Section -->
          <section class="combatant-section combatant-section--enemies">
            <h2>Enemies</h2>
            <div class="combatant-grid">
              <PlayerCombatantCard
                v-for="combatant in enemyCombatants"
                :key="combatant.id"
                :combatant="combatant"
                :is-current-turn="combatant.id === currentCombatant?.id"
                :show-details="false"
              />
            </div>
          </section>
        </div>

        <!-- Current Turn Actions (for player turns) -->
        <aside v-if="isPlayerTurn && currentCombatant" class="actions-panel">
          <h2>Actions</h2>
          <PlayerActionPanel
            :combatant="currentCombatant"
            :available-targets="availableTargets"
            @use-move="handleUseMove"
            @pass-turn="handlePassTurn"
          />
        </aside>
      </main>
    </div>

    <!-- Move Selection Modal -->
    <MoveTargetModal
      v-if="selectedMove"
      :move="selectedMove"
      :actor="currentCombatant!"
      :targets="availableTargets"
      @confirm="confirmMove"
      @cancel="selectedMove = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Move } from '~/types'

const { getCombatantName } = useCombatantDisplay()

definePageMeta({
  layout: 'player'
})

useHead({
  title: 'PTU - Player View'
})

const encounterStore = useEncounterStore()
const { isConnected, identify, joinEncounter } = useWebSocket()

// Poll for active encounters
let pollInterval: ReturnType<typeof setInterval> | null = null

const checkForActiveEncounter = async () => {
  try {
    const response = await $fetch<{ data: any[] }>('/api/encounters')
    const activeEncounter = response.data?.find(e => e.isActive)

    if (activeEncounter) {
      // Stop polling once we find an active encounter
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }

      // Load the full encounter into the store
      await encounterStore.loadEncounter(activeEncounter.id)

      // Identify as player and join the encounter via WebSocket
      if (isConnected.value) {
        identify('player', activeEncounter.id)
        joinEncounter(activeEncounter.id)
      }
    }
  } catch (error) {
    console.error('Failed to fetch encounters:', error)
  }
}

// Fetch active encounter on mount
onMounted(async () => {
  await checkForActiveEncounter()

  // If no active encounter found, poll every 2 seconds
  if (!encounterStore.encounter?.isActive) {
    pollInterval = setInterval(checkForActiveEncounter, 2000)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})

// Watch for WebSocket connection to join encounter
watch(isConnected, (connected) => {
  if (connected && encounterStore.encounter?.id) {
    identify('player', encounterStore.encounter.id)
    joinEncounter(encounterStore.encounter.id)
  }
})

// Computed
const encounter = computed(() => encounterStore.encounter)
const currentCombatant = computed(() => encounterStore.currentCombatant)
const playerCombatants = computed(() => encounterStore.playerCombatants)
const allyCombatants = computed(() => encounterStore.allyCombatants)
const enemyCombatants = computed(() => encounterStore.enemyCombatants)

const isPlayerTurn = computed(() => {
  return currentCombatant.value?.side === 'players'
})

const availableTargets = computed(() => {
  return encounter.value?.combatants ?? []
})

// Move selection
const selectedMove = ref<Move | null>(null)

// Actions
const handleUseMove = (move: Move) => {
  selectedMove.value = move
}

const confirmMove = async (targetIds: string[], damage?: number) => {
  if (!currentCombatant.value || !selectedMove.value) return

  await encounterStore.executeMove(
    currentCombatant.value.id,
    selectedMove.value.id,
    targetIds,
    damage
  )

  selectedMove.value = null
}

const handlePassTurn = async () => {
  await encounterStore.nextTurn()
}
</script>

<style lang="scss" scoped>
.player-view {
  min-height: 100vh;
  background: $gradient-bg-radial;

  &__waiting {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  &__active {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
}

.waiting-content {
  text-align: center;

  h1 {
    font-size: 4rem;
    margin-bottom: $spacing-md;
    background: $gradient-sv-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;
  }

  p {
    font-size: $font-size-xl;
    color: $color-text-muted;
    margin-bottom: $spacing-xl;
  }
}

.waiting-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid $glass-border;
  border-top-color: $color-accent-scarlet;
  border-radius: 50%;
  margin: 0 auto;
  animation: spin 1s linear infinite;
  box-shadow: $shadow-glow-scarlet;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg $spacing-xl;
  background: rgba($color-bg-primary, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 2px solid transparent;
  background-image: linear-gradient(rgba($color-bg-primary, 0.95), rgba($color-bg-primary, 0.95)),
                    $gradient-sv-cool;
  background-origin: border-box;
  background-clip: padding-box, border-box;

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-lg;

    h1 {
      font-size: $font-size-xxl;
      margin: 0;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__turn {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    font-size: $font-size-xl;
  }
}

.round-badge {
  background: $gradient-sv-cool;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-md;
  font-weight: 700;
  font-size: $font-size-lg;
  box-shadow: $shadow-glow-scarlet;
}

.turn-label {
  color: $color-text-muted;
}

.turn-name {
  background: $gradient-sv-cool;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.player-main {
  flex: 1;
  display: flex;
  gap: $spacing-xl;
  padding: $spacing-xl;

  @media (max-width: 1400px) {
    flex-direction: column;
  }
}

.combatants-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;
}

.combatant-section {
  h2 {
    font-size: $font-size-xl;
    margin-bottom: $spacing-md;
    padding-left: $spacing-md;
    border-left: 4px solid;
    font-weight: 600;
  }

  &--players h2 {
    border-color: $color-accent-scarlet;
    color: $color-accent-scarlet;
  }

  &--allies h2 {
    border-color: $color-success;
    color: $color-success;
  }

  &--enemies h2 {
    border-color: $color-accent-scarlet;
    color: $color-accent-scarlet;
  }
}

.combatant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: $spacing-lg;

  // 4K optimization
  @media (min-width: 3000px) {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
    gap: $spacing-xl;
  }
}

.actions-panel {
  width: 400px;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  padding: $spacing-xl;
  height: fit-content;
  position: sticky;
  top: $spacing-xl;
  box-shadow: $shadow-lg;

  h2 {
    margin-bottom: $spacing-lg;
    background: $gradient-sv-cool;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
  }

  @media (max-width: 1400px) {
    width: 100%;
    position: static;
  }

  // 4K optimization
  @media (min-width: 3000px) {
    width: 600px;
    padding: $spacing-xxl;
  }
}
</style>
