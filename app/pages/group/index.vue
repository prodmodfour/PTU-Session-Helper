<template>
  <div class="group-view">
    <!-- Map Overlay (takes priority over everything) -->
    <MapOverlay v-if="servedMap" :map="servedMap" :fullscreen="true" />

    <!-- Wild Spawn Overlay -->
    <WildSpawnOverlay v-else :wild-spawn="wildSpawnPreview" />

    <!-- No Served Encounter - Show Players and Teams (hide when map is served) -->
    <PlayerLobbyView
      v-if="!servedMap && (!encounter || !encounter.isServed)"
      :players="players"
    />

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
        <InitiativeTracker
          :combatants="sortedCombatants"
          :current-turn-id="currentCombatant?.id"
        />

        <!-- Grid View -->
        <div class="grid-view-panel" data-testid="group-grid-panel">
          <GroupGridCanvas
            :config="gridConfig"
            :combatants="encounter.combatants"
            :current-turn-id="currentCombatant?.id"
            :movement-preview="movementPreview"
          />
        </div>

        <!-- Current Combatant Details -->
        <CombatantDetailsPanel :combatant="currentCombatant" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter, GridConfig } from '~/types'
import { useFogOfWarStore } from '~/stores/fogOfWar'
import { useTerrainStore } from '~/stores/terrain'

interface PlayerPokemon {
  id: string
  species: string
  nickname: string | null
  level: number
  types: string[]
  currentHp: number
  maxHp: number
  shiny: boolean
  spriteUrl: string | null
}

interface Player {
  id: string
  name: string
  playedBy: string | null
  level: number
  currentHp: number
  maxHp: number
  avatarUrl: string | null
  trainerClasses: { name: string }[]
  pokemon: PlayerPokemon[]
}

definePageMeta({
  layout: 'group'
})

useHead({
  title: 'PTU - Group View'
})

const encounterStore = useEncounterStore()
const fogOfWarStore = useFogOfWarStore()
const terrainStore = useTerrainStore()
const groupViewStore = useGroupViewStore()
const { isConnected, identify, joinEncounter, movementPreview } = useWebSocket()

// Wild spawn preview from store
const wildSpawnPreview = computed(() => groupViewStore.wildSpawnPreview)

// Players data for lobby view
const players = ref<Player[]>([])

// Fetch players on mount
const fetchPlayers = async () => {
  try {
    const response = await $fetch<{ success: boolean; data: Player[] }>('/api/characters/players')
    if (response.success) {
      players.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch players:', error)
  }
}

// Persistence composables (read-only for group view)
const { loadFogState } = useFogPersistence()
const { loadTerrainState } = useTerrainPersistence()

// Poll for served encounters and wild spawn
let pollInterval: ReturnType<typeof setInterval> | null = null
let wildSpawnPollInterval: ReturnType<typeof setInterval> | null = null
let mapPollInterval: ReturnType<typeof setInterval> | null = null

// Poll for wild spawn preview
const checkForWildSpawn = async () => {
  await groupViewStore.fetchWildSpawnPreview()
}

// Poll for served map
const checkForServedMap = async () => {
  await groupViewStore.fetchServedMap()
}

// Served map computed
const servedMap = computed(() => groupViewStore.servedMap)

// Load VTT state (fog, terrain) for a specific encounter
const loadVttState = async (encounterId: string) => {
  await Promise.all([
    loadFogState(encounterId),
    loadTerrainState(encounterId)
  ])
}

// Track the current served encounter ID to detect changes
let currentServedEncounterId: string | null = null

const checkForServedEncounter = async () => {
  try {
    const servedEncounter = await encounterStore.loadServedEncounter()

    if (servedEncounter) {
      if (servedEncounter.id !== currentServedEncounterId) {
        currentServedEncounterId = servedEncounter.id
        await loadVttState(servedEncounter.id)

        if (isConnected.value) {
          identify('group', servedEncounter.id)
          joinEncounter(servedEncounter.id)
        }
      }
    } else {
      currentServedEncounterId = null
    }
  } catch (error) {
    console.error('Failed to fetch served encounter:', error)
  }
}

// Fetch served encounter on mount
onMounted(async () => {
  await fetchPlayers()
  await checkForServedEncounter()

  pollInterval = setInterval(checkForServedEncounter, 2000)
  await checkForWildSpawn()
  wildSpawnPollInterval = setInterval(checkForWildSpawn, 1000)
  await checkForServedMap()
  mapPollInterval = setInterval(checkForServedMap, 1000)
})

// Cleanup on unmount
onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  if (wildSpawnPollInterval) {
    clearInterval(wildSpawnPollInterval)
    wildSpawnPollInterval = null
  }
  if (mapPollInterval) {
    clearInterval(mapPollInterval)
    mapPollInterval = null
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

  @media (min-width: 3000px) {
    padding: $spacing-xl;
    gap: $spacing-xl;
  }
}
</style>
