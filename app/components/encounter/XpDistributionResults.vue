<template>
  <div class="results-section">
    <h3 class="section__title">XP Distribution Complete</h3>
    <div class="results-list">
      <div
        v-for="result in results"
        :key="result.pokemonId"
        class="result-row"
        :class="{ 'result-row--leveled': result.levelsGained > 0 }"
      >
        <div class="result-row__info">
          <span class="result-row__name">{{ result.species }}</span>
          <span class="result-row__xp">+{{ result.xpGained }} XP</span>
        </div>
        <div class="result-row__level">
          <span v-if="result.levelsGained > 0" class="result-row__levelup">
            Lv.{{ result.previousLevel }} -> Lv.{{ result.newLevel }}
          </span>
          <span v-else class="result-row__no-change">
            Lv.{{ result.newLevel }}
          </span>
        </div>
      </div>
    </div>
    <div class="results-total">
      Total XP Distributed: {{ totalXpDistributed }}
    </div>

    <!-- Level-Up Notification (detailed view for leveled Pokemon) -->
    <LevelUpNotification
      v-if="hasLevelUps"
      :results="results"
      @evolve-click="handleEvolveClick"
    />

    <!-- Evolution Confirmation Modal -->
    <EvolutionConfirmModal
      v-if="evolutionModal.visible"
      :pokemon-id="evolutionModal.pokemonId"
      :pokemon-name="evolutionModal.pokemonName"
      :current-species="evolutionModal.currentSpecies"
      :current-types="evolutionModal.currentTypes"
      :target-species="evolutionModal.targetSpecies"
      :target-types="evolutionModal.targetTypes"
      :current-level="evolutionModal.currentLevel"
      :current-max-hp="evolutionModal.currentMaxHp"
      :old-base-stats="evolutionModal.oldBaseStats"
      :target-raw-base-stats="evolutionModal.targetRawBaseStats"
      :nature-name="evolutionModal.natureName"
      :required-item="evolutionModal.requiredItem"
      :item-must-be-held="evolutionModal.itemMustBeHeld"
      @close="evolutionModal.visible = false"
      @evolved="handleEvolved"
    />
  </div>
</template>

<script setup lang="ts">
import type { XpApplicationResult } from '~/utils/experienceCalculation'
import type { EvolutionStats as Stats } from '~/utils/evolutionCheck'

const props = defineProps<{
  results: XpApplicationResult[]
  totalXpDistributed: number
}>()

const emit = defineEmits<{
  'pokemon-evolved': [result: Record<string, unknown>]
}>()

const hasLevelUps = computed(() =>
  props.results.some(r => r.levelsGained > 0)
)

// Evolution modal state
const evolutionModal = reactive({
  visible: false,
  pokemonId: '',
  pokemonName: '',
  currentSpecies: '',
  currentTypes: [] as string[],
  targetSpecies: '',
  targetTypes: [] as string[],
  currentLevel: 0,
  currentMaxHp: 0,
  oldBaseStats: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 } as Stats,
  targetRawBaseStats: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 } as Stats,
  natureName: '',
  requiredItem: null as string | null,
  itemMustBeHeld: false
})

/**
 * Handle click on evolution entry in LevelUpNotification.
 * Fetches evolution check data and Pokemon details, then opens the modal.
 */
async function handleEvolveClick(payload: { pokemonId: string; species: string }): Promise<void> {
  try {
    // Fetch evolution check to get available evolutions with target base stats
    const checkResponse = await $fetch<{
      success: boolean
      data: {
        currentSpecies: string
        currentLevel: number
        heldItem: string | null
        available: Array<{
          toSpecies: string
          targetStage: number
          minimumLevel: number | null
          requiredItem: string | null
          itemMustBeHeld: boolean
          targetBaseStats: Stats | null
          targetTypes: string[]
        }>
      }
    }>(`/api/pokemon/${payload.pokemonId}/evolution-check`, { method: 'POST' })

    if (!checkResponse.success || checkResponse.data.available.length === 0) {
      alert('No evolutions currently available for this Pokemon.')
      return
    }

    // Fetch Pokemon details for current stats (serialized format)
    const pokemonResponse = await $fetch<{
      success: boolean
      data: {
        id: string; species: string; nickname: string | null
        types: string[]
        level: number; maxHp: number
        baseStats: Stats
        nature: { name: string }
      }
    }>(`/api/pokemon/${payload.pokemonId}`)

    if (!pokemonResponse.success) {
      alert('Failed to load Pokemon data.')
      return
    }

    const pokemon = pokemonResponse.data

    // If multiple evolutions available, use the first one for P0
    // P1 can add a selection UI
    const evo = checkResponse.data.available[0]

    if (!evo.targetBaseStats) {
      alert('Target species data not found.')
      return
    }

    // Set modal data
    evolutionModal.pokemonId = pokemon.id
    evolutionModal.pokemonName = pokemon.nickname || pokemon.species
    evolutionModal.currentSpecies = pokemon.species
    evolutionModal.currentTypes = pokemon.types
    evolutionModal.targetSpecies = evo.toSpecies
    evolutionModal.targetTypes = evo.targetTypes
    evolutionModal.currentLevel = pokemon.level
    evolutionModal.currentMaxHp = pokemon.maxHp
    evolutionModal.oldBaseStats = pokemon.baseStats
    evolutionModal.targetRawBaseStats = evo.targetBaseStats
    evolutionModal.natureName = pokemon.nature.name
    evolutionModal.requiredItem = evo.requiredItem
    evolutionModal.itemMustBeHeld = evo.itemMustBeHeld
    evolutionModal.visible = true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to check evolution'
    alert(`Evolution check failed: ${message}`)
  }
}

function handleEvolved(result: Record<string, unknown>): void {
  emit('pokemon-evolved', result)
}
</script>

<style lang="scss" scoped>
.results-section {
  padding: $spacing-sm 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
}

.result-row {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &--leveled {
    border-color: rgba($color-success, 0.4);
    background: linear-gradient(135deg, rgba($color-success, 0.05) 0%, $color-bg-tertiary 100%);
  }

  &__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-weight: 600;
    color: $color-text;
  }

  &__xp {
    font-size: $font-size-sm;
    color: $color-accent-teal;
    font-weight: 600;
  }

  &__level {
    margin-bottom: $spacing-xs;
  }

  &__levelup {
    font-weight: 700;
    color: $color-success;
  }

  &__no-change {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

.results-total {
  text-align: center;
  padding: $spacing-md;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-accent-teal;
}
</style>
