<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal switch-modal">
      <div class="modal__header">
        <h2>{{ modalTitle }}</h2>
        <button class="btn btn--icon btn--secondary" @click="$emit('close')">
          <img src="/icons/phosphor/x.svg" alt="Close" class="close-icon" />
        </button>
      </div>

      <div class="modal__body">
        <!-- Mode indicator -->
        <div v-if="mode !== 'standard'" class="switch-modal__mode-badge" :class="modeBadgeClass">
          {{ modeBadgeText }}
        </div>

        <!-- Current Pokemon being recalled -->
        <div class="switch-modal__section">
          <h3 class="switch-modal__label">Recalling</h3>
          <div class="switch-modal__recalled" :class="{ 'switch-modal__recalled--fainted': mode === 'fainted' }">
            <img
              :src="getSpriteUrl(recalledPokemonName, false)"
              :alt="recalledPokemonName"
              class="switch-modal__sprite"
            />
            <div>
              <span class="switch-modal__name">{{ recalledDisplayName }}</span>
              <span v-if="mode === 'fainted'" class="switch-modal__fainted-label">Fainted</span>
            </div>
          </div>
        </div>

        <!-- Arrow indicator -->
        <div class="switch-modal__arrow">
          <img src="/icons/phosphor/arrow-clockwise.svg" alt="Switch" class="switch-modal__arrow-icon" />
        </div>

        <!-- Bench Pokemon selection -->
        <div class="switch-modal__section">
          <h3 class="switch-modal__label">Select Replacement</h3>

          <div v-if="loadingBench" class="switch-modal__loading">
            Loading bench Pokemon...
          </div>

          <div v-else-if="benchPokemon.length === 0" class="switch-modal__empty">
            No available Pokemon to switch in.
          </div>

          <div v-else class="switch-modal__bench">
            <div
              v-for="pokemon in benchPokemon"
              :key="pokemon.id"
              class="bench-card"
              :class="{ 'bench-card--selected': selectedReleaseId === pokemon.id }"
              @click="selectedReleaseId = pokemon.id"
            >
              <div class="bench-card__sprite">
                <img
                  :src="getSpriteUrl(pokemon.species, pokemon.shiny)"
                  :alt="pokemon.nickname || pokemon.species"
                />
              </div>
              <div class="bench-card__info">
                <span class="bench-card__name">{{ pokemon.nickname || pokemon.species }}</span>
                <span class="bench-card__level">Lv.{{ pokemon.level }}</span>
                <HealthBar
                  :current-hp="pokemon.currentHp"
                  :max-hp="pokemon.maxHp"
                  :show-exact-values="true"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- League restriction warning -->
        <div v-if="showLeagueWarning" class="switch-modal__league-warning">
          <img src="/icons/phosphor/warning.svg" alt="" class="switch-modal__warning-icon" />
          The replacement Pokemon cannot act for the remainder of this round.
        </div>

        <!-- Error display -->
        <div v-if="switchError" class="switch-modal__error">
          {{ switchError }}
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">
          Cancel
        </button>
        <button
          class="btn btn--primary"
          :disabled="!selectedReleaseId || switchLoading"
          @click="confirmSwitch"
        >
          {{ switchLoading ? 'Switching...' : confirmButtonText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon } from '~/types/character'

const props = defineProps<{
  trainerId: string
  pokemonCombatantId: string
  trainerEntityId: string
  /** Switch mode: standard (P0), fainted (P1 Section H), forced (P1 Section I) */
  mode?: 'standard' | 'fainted' | 'forced'
}>()

const emit = defineEmits<{
  close: []
  switched: []
}>()

const switchMode = computed(() => props.mode ?? 'standard')

const encounterStore = useEncounterStore()
const { getSpriteUrl } = usePokemonSprite()
const { getBenchPokemon, executeSwitch, loading: switchLoading, error: switchError } = useSwitching()

const selectedReleaseId = ref<string | null>(null)
const loadingBench = ref(true)
const benchPokemon = ref<Pokemon[]>([])

// Modal title varies by mode
const modalTitle = computed(() => {
  switch (switchMode.value) {
    case 'fainted': return 'Switch Fainted Pokemon'
    case 'forced': return 'Force Switch Pokemon'
    default: return 'Switch Pokemon'
  }
})

// Mode badge text and class
const modeBadgeText = computed(() => {
  switch (switchMode.value) {
    case 'fainted': return 'Shift Action'
    case 'forced': return 'No Action Cost'
    default: return ''
  }
})

const modeBadgeClass = computed(() => {
  switch (switchMode.value) {
    case 'fainted': return 'switch-modal__mode-badge--fainted'
    case 'forced': return 'switch-modal__mode-badge--forced'
    default: return ''
  }
})

// Confirm button text
const confirmButtonText = computed(() => {
  switch (switchMode.value) {
    case 'fainted': return 'Confirm Fainted Switch'
    case 'forced': return 'Confirm Force Switch'
    default: return 'Confirm Switch'
  }
})

// Show League restriction warning for standard switches in League Battles
const showLeagueWarning = computed(() => {
  if (switchMode.value !== 'standard') return false
  return encounterStore.isLeagueBattle
})

// Get the recalled Pokemon's display info
const recalledCombatant = computed(() =>
  encounterStore.encounter?.combatants.find(c => c.id === props.pokemonCombatantId)
)

const recalledPokemonName = computed(() => {
  if (!recalledCombatant.value || recalledCombatant.value.type !== 'pokemon') return ''
  return (recalledCombatant.value.entity as Pokemon).species
})

const recalledDisplayName = computed(() => {
  if (!recalledCombatant.value || recalledCombatant.value.type !== 'pokemon') return ''
  const entity = recalledCombatant.value.entity as Pokemon
  return entity.nickname || entity.species
})

// Load bench Pokemon on mount
onMounted(async () => {
  loadingBench.value = true
  benchPokemon.value = await getBenchPokemon(props.trainerEntityId)
  loadingBench.value = false
})

async function confirmSwitch() {
  if (!selectedReleaseId.value) return

  try {
    await executeSwitch(
      props.trainerId,
      props.pokemonCombatantId,
      selectedReleaseId.value,
      {
        faintedSwitch: switchMode.value === 'fainted',
        forced: switchMode.value === 'forced'
      }
    )
    emit('switched')
    emit('close')
  } catch {
    // Error is already set by useSwitching composable
  }
}
</script>

<style lang="scss" scoped>
.switch-modal {
  max-width: 480px;
  width: 90vw;
}

.switch-modal__mode-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-md;

  &--fainted {
    background: rgba($color-warning, 0.2);
    color: $color-warning;
    border: 1px solid rgba($color-warning, 0.4);
  }

  &--forced {
    background: rgba($color-accent-violet, 0.2);
    color: $color-accent-violet;
    border: 1px solid rgba($color-accent-violet, 0.4);
  }
}

.switch-modal__section {
  margin-bottom: $spacing-md;
}

.switch-modal__label {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: $spacing-sm;
}

.switch-modal__recalled {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-danger, 0.1);
  border: 1px solid rgba($color-danger, 0.3);
  border-radius: $border-radius-md;

  &--fainted {
    background: rgba($color-text-muted, 0.1);
    border-color: rgba($color-text-muted, 0.3);
    filter: grayscale(40%);
    opacity: 0.7;
  }
}

.switch-modal__sprite {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
}

.switch-modal__name {
  font-weight: 600;
  font-size: $font-size-md;
  color: $color-text;
  display: block;
}

.switch-modal__fainted-label {
  display: block;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-danger;
}

.switch-modal__arrow {
  display: flex;
  justify-content: center;
  padding: $spacing-sm 0;
}

.switch-modal__arrow-icon {
  width: 24px;
  height: 24px;
  opacity: 0.6;
  filter: invert(1);
}

.switch-modal__loading,
.switch-modal__empty {
  padding: $spacing-lg;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.switch-modal__bench {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  max-height: 300px;
  overflow-y: auto;
}

.switch-modal__league-warning {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-warning, 0.1);
  border: 1px solid rgba($color-warning, 0.3);
  border-radius: $border-radius-sm;
  color: $color-warning;
  font-size: $font-size-sm;
  font-weight: 500;
}

.switch-modal__warning-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  filter: invert(1);
  opacity: 0.8;
}

.switch-modal__error {
  margin-top: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-danger, 0.15);
  border: 1px solid rgba($color-danger, 0.4);
  border-radius: $border-radius-sm;
  color: $color-danger;
  font-size: $font-size-sm;
}

// Bench Pokemon card
.bench-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: $glass-bg;
  border: 2px solid transparent;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-normal;

  &:hover {
    background: rgba($color-accent-scarlet, 0.05);
    border-color: rgba($color-accent-scarlet, 0.3);
  }

  &--selected {
    background: rgba($color-accent-scarlet, 0.1);
    border-color: $color-accent-scarlet;
  }

  &__sprite {
    width: 48px;
    height: 48px;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-weight: 600;
    font-size: $font-size-md;
    color: $color-text;
    margin-bottom: 2px;
  }

  &__level {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }
}
</style>
