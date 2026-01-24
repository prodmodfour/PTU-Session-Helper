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
        <!-- Initiative Tracker -->
        <aside class="initiative-tracker" v-if="sortedCombatants.length > 0">
          <h3 class="initiative-tracker__title">Initiative</h3>
          <div class="initiative-tracker__list">
            <div
              v-for="(combatant, index) in sortedCombatants"
              :key="combatant.id"
              class="initiative-entry"
              :class="{
                'initiative-entry--current': combatant.id === currentCombatant?.id,
                'initiative-entry--player': combatant.side === 'players',
                'initiative-entry--ally': combatant.side === 'allies',
                'initiative-entry--enemy': combatant.side === 'enemies'
              }"
            >
              <span class="initiative-entry__order">{{ index + 1 }}</span>
              <img
                v-if="combatant.type === 'pokemon'"
                :src="getSpriteUrl((combatant.entity as Pokemon).species)"
                :alt="getCombatantName(combatant)"
                class="initiative-entry__sprite"
                @error="handleSpriteError($event)"
              />
              <div v-else class="initiative-entry__avatar">
                {{ getCombatantName(combatant).charAt(0) }}
              </div>
              <div class="initiative-entry__info">
                <span class="initiative-entry__name">{{ getCombatantName(combatant) }}</span>
                <div class="initiative-entry__health-bar">
                  <div
                    class="initiative-entry__health-fill"
                    :style="{ width: getHpPercentage(combatant) + '%' }"
                    :class="getHpClass(combatant)"
                  ></div>
                </div>
              </div>
              <span class="initiative-entry__init">{{ combatant.initiative }}</span>
            </div>
          </div>
        </aside>

        <!-- Grid View -->
        <div class="grid-view-panel" data-testid="group-grid-panel">
          <GroupGridCanvas
            :config="gridConfig"
            :combatants="encounter.combatants"
            :current-turn-id="currentCombatant?.id"
            :movement-preview="movementPreview"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter, GridConfig } from '~/types'
import { useFogOfWarStore } from '~/stores/fogOfWar'
import { useTerrainStore } from '~/stores/terrain'

definePageMeta({
  layout: 'group'
})

useHead({
  title: 'PTU - Group View'
})

const encounterStore = useEncounterStore()
const fogOfWarStore = useFogOfWarStore()
const terrainStore = useTerrainStore()
const { isConnected, identify, joinEncounter, movementPreview } = useWebSocket()

// Persistence composables (read-only for group view)
const { loadFogState } = useFogPersistence()
const { loadTerrainState } = useTerrainPersistence()


// Poll for served encounters
let pollInterval: ReturnType<typeof setInterval> | null = null

// Load VTT state (fog, terrain) for a specific encounter
const loadVttState = async (encounterId: string) => {
  await Promise.all([
    loadFogState(encounterId),
    loadTerrainState(encounterId)
  ])
}

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

      // Load VTT state for the encounter
      await loadVttState(servedEncounter.id)

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

// Sprites
const { getSpriteUrl } = usePokemonSprite()

const handleSpriteError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/images/pokemon-placeholder.svg'
}

// Computed
const encounter = computed(() => encounterStore.encounter)
const currentCombatant = computed(() => encounterStore.currentCombatant)
const sortedCombatants = computed(() => encounterStore.combatantsByInitiative)

// Grid config with fallback defaults
const gridConfig = computed((): GridConfig => encounter.value?.gridConfig ?? {
  enabled: true,
  width: 20,
  height: 15,
  cellSize: 40,
  background: undefined
})


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

const getHpPercentage = (combatant: Combatant): number => {
  const { currentHp, maxHp } = combatant.entity
  if (!maxHp || maxHp <= 0) return 100
  return Math.max(0, Math.min(100, (currentHp / maxHp) * 100))
}

const getHpClass = (combatant: Combatant): string => {
  const percentage = getHpPercentage(combatant)
  if (percentage <= 25) return 'health--critical'
  if (percentage <= 50) return 'health--low'
  return 'health--good'
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

.grid-view-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: $spacing-lg;

  // 4K optimization
  @media (min-width: 3000px) {
    padding: $spacing-xl;
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
  gap: $spacing-lg;
  padding: $spacing-lg;

  // 4K optimization
  @media (min-width: 3000px) {
    padding: $spacing-xl;
    gap: $spacing-xl;
  }
}

.initiative-tracker {
  width: 280px;
  flex-shrink: 0;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  max-height: calc(100vh - 150px);
  overflow-y: auto;

  // 4K optimization
  @media (min-width: 3000px) {
    width: 400px;
    padding: $spacing-lg;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text;
    margin: 0 0 $spacing-md 0;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $glass-border;

    // 4K optimization
    @media (min-width: 3000px) {
      font-size: $font-size-lg;
      margin-bottom: $spacing-lg;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
}

.initiative-entry {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border-radius: $border-radius-md;
  background: rgba($color-bg-secondary, 0.5);
  transition: all $transition-fast;

  // 4K optimization
  @media (min-width: 3000px) {
    padding: $spacing-md;
    gap: $spacing-md;
  }

  &--current {
    background: rgba($color-accent-scarlet, 0.2);
    border: 1px solid $color-accent-scarlet;
    box-shadow: $shadow-glow-scarlet;
  }

  &--player {
    border-left: 3px solid $color-accent-scarlet;
  }

  &--ally {
    border-left: 3px solid $color-success;
  }

  &--enemy {
    border-left: 3px solid $color-accent-violet;
  }

  &__order {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-bg-tertiary;
    border-radius: 50%;
    font-size: $font-size-xs;
    font-weight: 700;
    color: $color-text-muted;

    // 4K optimization
    @media (min-width: 3000px) {
      width: 32px;
      height: 32px;
      font-size: $font-size-sm;
    }
  }

  &__sprite {
    width: 32px;
    height: 32px;
    object-fit: contain;
    image-rendering: pixelated;

    // 4K optimization
    @media (min-width: 3000px) {
      width: 48px;
      height: 48px;
    }
  }

  &__avatar {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    border-radius: $border-radius-sm;
    font-size: $font-size-sm;
    font-weight: 700;
    color: $color-text;

    // 4K optimization
    @media (min-width: 3000px) {
      width: 48px;
      height: 48px;
      font-size: $font-size-md;
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0; // Allow text truncation
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    // 4K optimization
    @media (min-width: 3000px) {
      font-size: $font-size-md;
    }
  }

  &__health-bar {
    width: 100%;
    height: 4px;
    background: rgba($color-bg-tertiary, 0.8);
    border-radius: 2px;
    overflow: hidden;

    // 4K optimization
    @media (min-width: 3000px) {
      height: 6px;
      border-radius: 3px;
    }
  }

  &__health-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease, background-color 0.3s ease;

    &.health--good {
      background: linear-gradient(90deg, $color-success 0%, lighten($color-success, 10%) 100%);
    }

    &.health--low {
      background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
    }

    &.health--critical {
      background: linear-gradient(90deg, $color-danger 0%, lighten($color-danger, 10%) 100%);
    }

    // 4K optimization
    @media (min-width: 3000px) {
      border-radius: 3px;
    }
  }

  &__init {
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-text-muted;
    background: $color-bg-tertiary;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;

    // 4K optimization
    @media (min-width: 3000px) {
      font-size: $font-size-sm;
      padding: $spacing-xs $spacing-sm;
    }
  }
}
</style>
