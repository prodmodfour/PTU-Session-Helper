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

        <!-- Current Combatant Details -->
        <aside class="combatant-details" v-if="currentCombatant">
          <h3 class="combatant-details__title">Current Turn</h3>

          <!-- Header with sprite/avatar and name -->
          <div class="combatant-details__header">
            <img
              v-if="currentCombatant.type === 'pokemon'"
              :src="getSpriteUrl((currentCombatant.entity as Pokemon).species)"
              :alt="getCombatantName(currentCombatant)"
              class="combatant-details__sprite"
              @error="handleSpriteError($event)"
            />
            <div v-else class="combatant-details__avatar">
              {{ getCombatantName(currentCombatant).charAt(0) }}
            </div>
            <div class="combatant-details__name-block">
              <span class="combatant-details__name">{{ getCombatantName(currentCombatant) }}</span>
              <span class="combatant-details__type-badge" :class="'side--' + currentCombatant.side">
                {{ currentCombatant.side === 'players' ? 'Player' : currentCombatant.side === 'allies' ? 'Ally' : 'Enemy' }}
              </span>
            </div>
          </div>

          <!-- Pokemon Types -->
          <div v-if="currentCombatant.type === 'pokemon'" class="combatant-details__types">
            <span
              v-for="pType in (currentCombatant.entity as Pokemon).types"
              :key="pType"
              class="type-badge"
              :class="'type-badge--' + pType.toLowerCase()"
            >
              {{ pType }}
            </span>
          </div>

          <!-- HP Bar -->
          <div class="combatant-details__hp">
            <div class="hp-label">
              <span>HP</span>
              <span v-if="isPlayerSide(currentCombatant)">
                {{ currentCombatant.entity.currentHp }} / {{ getEffectiveMaxHp(currentCombatant) }}
                <span v-if="currentCombatant.entity.injuries > 0" class="hp-base-max">
                  ({{ currentCombatant.entity.maxHp }})
                </span>
              </span>
              <span v-else>{{ getHpPercentageDisplay(currentCombatant) }}%</span>
            </div>
            <div class="hp-bar">
              <div
                class="hp-bar__fill"
                :style="{ width: getHpPercentage(currentCombatant) + '%' }"
                :class="getHpClass(currentCombatant)"
              ></div>
            </div>
          </div>

          <!-- Injuries -->
          <div v-if="currentCombatant.entity.injuries > 0" class="combatant-details__injuries">
            <span class="injuries-label">Injuries:</span>
            <span class="injuries-value">{{ currentCombatant.entity.injuries }}</span>
            <div class="injuries-pips">
              <span
                v-for="i in currentCombatant.entity.injuries"
                :key="i"
                class="injury-pip"
              ></span>
            </div>
          </div>

          <!-- Player-only details -->
          <template v-if="isPlayerSide(currentCombatant)">
            <!-- Stats -->
            <div class="combatant-details__stats">
              <div class="stat-row">
                <span class="stat-label">ATK</span>
                <span class="stat-value">{{ getStatValue(currentCombatant, 'attack') }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">DEF</span>
                <span class="stat-value">{{ getStatValue(currentCombatant, 'defense') }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">SP.ATK</span>
                <span class="stat-value">{{ getStatValue(currentCombatant, 'specialAttack') }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">SP.DEF</span>
                <span class="stat-value">{{ getStatValue(currentCombatant, 'specialDefense') }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">SPD</span>
                <span class="stat-value">{{ getStatValue(currentCombatant, 'speed') }}</span>
              </div>
            </div>

            <!-- Abilities (Pokemon only) -->
            <div v-if="currentCombatant.type === 'pokemon' && (currentCombatant.entity as Pokemon).abilities?.length" class="combatant-details__section">
              <h4>Abilities</h4>
              <div class="ability-list">
                <span
                  v-for="ability in (currentCombatant.entity as Pokemon).abilities"
                  :key="ability.name"
                  class="ability-tag"
                >
                  {{ ability.name }}
                </span>
              </div>
            </div>

            <!-- Moves (Pokemon only) -->
            <div v-if="currentCombatant.type === 'pokemon' && (currentCombatant.entity as Pokemon).moves?.length" class="combatant-details__section">
              <h4>Moves</h4>
              <div class="move-list">
                <div
                  v-for="move in (currentCombatant.entity as Pokemon).moves"
                  :key="move.name"
                  class="move-tag"
                  :class="'move-tag--' + move.type.toLowerCase()"
                >
                  {{ move.name }}
                </div>
              </div>
            </div>
          </template>

          <!-- Status Conditions (shown for all) -->
          <div v-if="currentCombatant.entity.statusConditions?.length" class="combatant-details__section">
            <h4>Status</h4>
            <div class="status-list">
              <span
                v-for="status in currentCombatant.entity.statusConditions"
                :key="status"
                class="status-tag"
                :class="'status-tag--' + status.toLowerCase()"
              >
                {{ status }}
              </span>
            </div>
          </div>

          <!-- Combat Stages (if any non-zero, player-side only) -->
          <div v-if="isPlayerSide(currentCombatant) && hasNonZeroStages(currentCombatant)" class="combatant-details__section">
            <h4>Combat Stages</h4>
            <div class="stages-grid">
              <template v-for="(value, key) in currentCombatant.entity.stageModifiers" :key="key">
                <div v-if="value !== 0" class="stage-item" :class="value > 0 ? 'stage-item--positive' : 'stage-item--negative'">
                  <span class="stage-label">{{ formatStageName(key as string) }}</span>
                  <span class="stage-value">{{ value > 0 ? '+' : '' }}{{ value }}</span>
                </div>
              </template>
            </div>
          </div>
        </aside>
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

const getEffectiveMaxHp = (combatant: Combatant): number => {
  const { maxHp, injuries } = combatant.entity
  if (!maxHp || maxHp <= 0) return 0
  // Each injury reduces max HP by 10%
  const injuryReduction = (injuries || 0) * 0.1
  return Math.floor(maxHp * (1 - injuryReduction))
}

const getHpPercentage = (combatant: Combatant): number => {
  const { currentHp } = combatant.entity
  const effectiveMax = getEffectiveMaxHp(combatant)
  if (effectiveMax <= 0) return 100
  // HP can go negative in PTU, but bar shows 0-100%
  return Math.max(0, Math.min(100, (currentHp / effectiveMax) * 100))
}

// Get HP percentage for display (can be negative)
const getHpPercentageDisplay = (combatant: Combatant): number => {
  const { currentHp } = combatant.entity
  const effectiveMax = getEffectiveMaxHp(combatant)
  if (effectiveMax <= 0) return 100
  return Math.round((currentHp / effectiveMax) * 100)
}

const getHpClass = (combatant: Combatant): string => {
  const { currentHp } = combatant.entity
  // Check for fainted/negative HP first
  if (currentHp <= 0) return 'health--fainted'
  const percentage = getHpPercentage(combatant)
  if (percentage <= 25) return 'health--critical'
  if (percentage <= 50) return 'health--low'
  return 'health--good'
}

const isPlayerSide = (combatant: Combatant): boolean => {
  return combatant.side === 'players' || combatant.side === 'allies'
}

const getStatValue = (combatant: Combatant, stat: string): number => {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.currentStats?.[stat as keyof typeof pokemon.currentStats] ?? 0
  } else {
    const human = combatant.entity as HumanCharacter
    return human.stats?.[stat as keyof typeof human.stats] ?? 0
  }
}

const hasNonZeroStages = (combatant: Combatant): boolean => {
  const stages = combatant.entity.stageModifiers
  if (!stages) return false
  return Object.values(stages).some(v => v !== 0)
}

const formatStageName = (key: string): string => {
  const names: Record<string, string> = {
    attack: 'ATK',
    defense: 'DEF',
    specialAttack: 'SP.ATK',
    specialDefense: 'SP.DEF',
    speed: 'SPD',
    accuracy: 'ACC',
    evasion: 'EVA'
  }
  return names[key] || key.toUpperCase()
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
    border-left: 3px solid $color-side-player;
  }

  &--ally {
    border-left: 3px solid $color-side-ally;
  }

  &--enemy {
    border-left: 3px solid $color-side-enemy;
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

    &.health--fainted {
      background: linear-gradient(90deg, #4a4a4a 0%, #2a2a2a 100%);
      width: 0% !important;
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

// Combatant Details Panel
.combatant-details {
  width: 320px;
  flex-shrink: 0;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  // 4K optimization
  @media (min-width: 3000px) {
    width: 450px;
    padding: $spacing-lg;
    gap: $spacing-lg;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text;
    margin: 0;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $glass-border;

    @media (min-width: 3000px) {
      font-size: $font-size-lg;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__sprite {
    width: 64px;
    height: 64px;
    object-fit: contain;
    image-rendering: pixelated;
    background: rgba($color-bg-tertiary, 0.5);
    border-radius: $border-radius-md;
    padding: $spacing-xs;

    @media (min-width: 3000px) {
      width: 96px;
      height: 96px;
    }
  }

  &__avatar {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    border-radius: $border-radius-md;
    font-size: $font-size-xxl;
    font-weight: 700;
    color: $color-text;

    @media (min-width: 3000px) {
      width: 96px;
      height: 96px;
      font-size: $font-size-xxxl;
    }
  }

  &__name-block {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__name {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text;

    @media (min-width: 3000px) {
      font-size: $font-size-xl;
    }
  }

  &__type-badge {
    font-size: $font-size-xs;
    font-weight: 600;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    text-transform: uppercase;
    width: fit-content;

    &.side--players {
      background: rgba($color-side-player, 0.2);
      color: $color-side-player;
    }

    &.side--allies {
      background: rgba($color-side-ally, 0.2);
      color: $color-side-ally;
    }

    &.side--enemies {
      background: rgba($color-side-enemy, 0.2);
      color: $color-side-enemy;
    }
  }

  &__types {
    display: flex;
    gap: $spacing-xs;
  }

  &__hp {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__injuries {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm;
    background: rgba($color-danger, 0.1);
    border: 1px solid rgba($color-danger, 0.3);
    border-radius: $border-radius-md;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: $spacing-xs;
    background: rgba($color-bg-tertiary, 0.5);
    border-radius: $border-radius-md;
    padding: $spacing-sm;
  }

  &__section {
    h4 {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-text-muted;
      margin: 0 0 $spacing-sm 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}

.hp-label {
  display: flex;
  justify-content: space-between;
  font-size: $font-size-sm;
  color: $color-text-muted;
}

.hp-base-max {
  color: $color-text-muted;
  opacity: 0.6;
  text-decoration: line-through;
  font-size: $font-size-xs;
}

.hp-bar {
  width: 100%;
  height: 8px;
  background: rgba($color-bg-tertiary, 0.8);
  border-radius: 4px;
  overflow: hidden;

  @media (min-width: 3000px) {
    height: 12px;
    border-radius: 6px;
  }

  &__fill {
    height: 100%;
    border-radius: 4px;
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

    &.health--fainted {
      background: linear-gradient(90deg, #4a4a4a 0%, #2a2a2a 100%);
      width: 0% !important;
    }
  }
}

.stat-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-size: $font-size-xs;
  color: $color-text-muted;
  font-weight: 500;
}

.stat-value {
  font-size: $font-size-md;
  font-weight: 700;
  color: $color-text;
}

.type-badge {
  font-size: $font-size-xs;
  font-weight: 600;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;
  text-transform: uppercase;

  // Pokemon type colors
  &--normal { background: #A8A878; color: #fff; }
  &--fire { background: #F08030; color: #fff; }
  &--water { background: #6890F0; color: #fff; }
  &--electric { background: #F8D030; color: #000; }
  &--grass { background: #78C850; color: #fff; }
  &--ice { background: #98D8D8; color: #000; }
  &--fighting { background: #C03028; color: #fff; }
  &--poison { background: #A040A0; color: #fff; }
  &--ground { background: #E0C068; color: #000; }
  &--flying { background: #A890F0; color: #fff; }
  &--psychic { background: #F85888; color: #fff; }
  &--bug { background: #A8B820; color: #fff; }
  &--rock { background: #B8A038; color: #fff; }
  &--ghost { background: #705898; color: #fff; }
  &--dragon { background: #7038F8; color: #fff; }
  &--dark { background: #705848; color: #fff; }
  &--steel { background: #B8B8D0; color: #000; }
  &--fairy { background: #EE99AC; color: #000; }
}

.ability-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.ability-tag {
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  background: rgba($color-accent-teal, 0.2);
  border: 1px solid rgba($color-accent-teal, 0.4);
  border-radius: $border-radius-sm;
  color: $color-accent-teal;
}

.move-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.move-tag {
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  color: #fff;

  // Inherit from type-badge colors
  &--normal { background: #A8A878; }
  &--fire { background: #F08030; }
  &--water { background: #6890F0; }
  &--electric { background: #F8D030; color: #000; }
  &--grass { background: #78C850; }
  &--ice { background: #98D8D8; color: #000; }
  &--fighting { background: #C03028; }
  &--poison { background: #A040A0; }
  &--ground { background: #E0C068; color: #000; }
  &--flying { background: #A890F0; }
  &--psychic { background: #F85888; }
  &--bug { background: #A8B820; }
  &--rock { background: #B8A038; }
  &--ghost { background: #705898; }
  &--dragon { background: #7038F8; }
  &--dark { background: #705848; }
  &--steel { background: #B8B8D0; color: #000; }
  &--fairy { background: #EE99AC; color: #000; }
}

.status-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.status-tag {
  font-size: $font-size-xs;
  font-weight: 600;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;
  text-transform: uppercase;

  &--burned, &--burn { background: #F08030; color: #fff; }
  &--frozen, &--freeze { background: #98D8D8; color: #000; }
  &--paralyzed, &--paralysis { background: #F8D030; color: #000; }
  &--poisoned, &--poison { background: #A040A0; color: #fff; }
  &--badly-poisoned { background: #682a68; color: #fff; }
  &--asleep, &--sleep { background: #705898; color: #fff; }
  &--confused, &--confusion { background: #F85888; color: #fff; }
  &--flinched, &--flinch { background: #705848; color: #fff; }
  &--infatuated, &--infatuation { background: #EE99AC; color: #000; }
}

.stages-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;

  &--positive {
    background: rgba($color-success, 0.2);
    color: $color-success;
  }

  &--negative {
    background: rgba($color-danger, 0.2);
    color: $color-danger;
  }
}

.stage-label {
  font-weight: 500;
}

.stage-value {
  font-weight: 700;
}

.injuries-label {
  font-size: $font-size-sm;
  color: $color-danger;
  font-weight: 500;
}

.injuries-value {
  font-size: $font-size-md;
  color: $color-danger;
  font-weight: 700;
}

.injuries-pips {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.injury-pip {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $color-danger;
  box-shadow: 0 0 4px rgba($color-danger, 0.5);

  @media (min-width: 3000px) {
    width: 16px;
    height: 16px;
  }
}
</style>
