<template>
  <div class="group-view">
    <!-- No Served Encounter -->
    <div v-if="!encounter || !encounter.isServed" class="group-view__waiting">
      <div class="waiting-content">
        <h1>PTU Session Helper</h1>
        <p>Waiting for GM to serve an encounter...</p>
        <div class="waiting-spinner"></div>
      </div>
    </div>

    <!-- Active Encounter -->
    <div v-else class="group-view__active">
      <!-- Header -->
      <header class="group-header">
        <div class="group-header__info">
          <h1>{{ encounter.name }}</h1>
          <span class="round-badge">Round {{ encounter.currentRound }}</span>
        </div>
        <div class="group-header__turn" v-if="currentCombatant">
          <span class="turn-label">Current Turn:</span>
          <span class="turn-name">{{ getCombatantName(currentCombatant) }}</span>
        </div>
      </header>

      <!-- Main Content -->
      <main class="group-main">
        <!-- All Combatants -->
        <div class="combatants-display">
          <!-- Players Section -->
          <section class="combatant-section combatant-section--players">
            <h2>Players</h2>
            <div class="combatant-grid">
              <GroupCombatantCard
                v-for="combatant in playerCombatants"
                :key="combatant.id"
                :combatant="combatant"
                :is-current-turn="combatant.id === currentCombatant?.id"
                :show-details="combatant.side === 'players'"
              />
            </div>
          </section>

          <!-- Allies Section (if any) -->
          <section v-if="allyCombatants.length > 0" class="combatant-section combatant-section--allies">
            <h2>Allies</h2>
            <div class="combatant-grid">
              <GroupCombatantCard
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
              <GroupCombatantCard
                v-for="combatant in enemyCombatants"
                :key="combatant.id"
                :combatant="combatant"
                :is-current-turn="combatant.id === currentCombatant?.id"
                :show-details="false"
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter } from '~/types'

definePageMeta({
  layout: 'group'
})

useHead({
  title: 'PTU - Group View'
})

const encounterStore = useEncounterStore()
const { isConnected, identify, joinEncounter } = useWebSocket()

// Poll for served encounters
let pollInterval: ReturnType<typeof setInterval> | null = null

const checkForServedEncounter = async () => {
  try {
    // Use the store's loadServedEncounter which handles everything
    const servedEncounter = await encounterStore.loadServedEncounter()

    if (servedEncounter) {
      // Stop polling once we find a served encounter
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }

      // Identify as group and join the encounter via WebSocket
      if (isConnected.value) {
        identify('group', servedEncounter.id)
        joinEncounter(servedEncounter.id)
      }
    }
  } catch (error) {
    console.error('Failed to fetch served encounter:', error)
  }
}

// Fetch served encounter on mount
onMounted(async () => {
  await checkForServedEncounter()

  // If no served encounter found, poll every 2 seconds
  if (!encounterStore.encounter?.isServed) {
    pollInterval = setInterval(checkForServedEncounter, 2000)
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
    identify('group', encounterStore.encounter.id)
    joinEncounter(encounterStore.encounter.id)
  }
})

// Computed
const encounter = computed(() => encounterStore.encounter)
const currentCombatant = computed(() => encounterStore.currentCombatant)
const playerCombatants = computed(() => encounterStore.playerCombatants)
const allyCombatants = computed(() => encounterStore.allyCombatants)
const enemyCombatants = computed(() => encounterStore.enemyCombatants)

// Helpers
const getCombatantName = (combatant: Combatant): string => {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.nickname || pokemon.species
  } else {
    const human = combatant.entity as HumanCharacter
    return human.name
  }
}
</script>

<style lang="scss" scoped>
.group-view {
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

    // 4K optimization
    @media (min-width: 3000px) {
      font-size: 6rem;
    }
  }

  p {
    font-size: $font-size-xl;
    color: $color-text-muted;
    margin-bottom: $spacing-xl;

    // 4K optimization
    @media (min-width: 3000px) {
      font-size: $font-size-xxl;
    }
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

  // 4K optimization
  @media (min-width: 3000px) {
    width: 90px;
    height: 90px;
    border-width: 6px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.group-header {
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

  // 4K optimization
  @media (min-width: 3000px) {
    padding: $spacing-xl $spacing-xxl;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-lg;

    h1 {
      font-size: $font-size-xxl;
      margin: 0;
      color: $color-text;
      font-weight: 600;

      // 4K optimization
      @media (min-width: 3000px) {
        font-size: $font-size-xxxl;
      }
    }
  }

  &__turn {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    font-size: $font-size-xl;

    // 4K optimization
    @media (min-width: 3000px) {
      font-size: $font-size-xxl;
      gap: $spacing-lg;
    }
  }
}

.round-badge {
  background: $gradient-sv-cool;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-md;
  font-weight: 700;
  font-size: $font-size-lg;
  box-shadow: $shadow-glow-scarlet;

  // 4K optimization
  @media (min-width: 3000px) {
    font-size: $font-size-xl;
    padding: $spacing-md $spacing-lg;
  }
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

.group-main {
  flex: 1;
  display: flex;
  padding: $spacing-xl;

  // 4K optimization
  @media (min-width: 3000px) {
    padding: $spacing-xxl;
  }
}

.combatants-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;

  // 4K optimization
  @media (min-width: 3000px) {
    gap: $spacing-xxl;
  }
}

.combatant-section {
  h2 {
    font-size: $font-size-xl;
    margin-bottom: $spacing-md;
    padding-left: $spacing-md;
    border-left: 4px solid;
    font-weight: 600;

    // 4K optimization
    @media (min-width: 3000px) {
      font-size: $font-size-xxl;
      margin-bottom: $spacing-lg;
      border-left-width: 6px;
    }
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
    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
    gap: $spacing-xl;
  }
}
</style>
