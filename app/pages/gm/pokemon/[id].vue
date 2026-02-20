<template>
  <div class="pokemon-sheet-page">
    <div class="sheet-header">
      <NuxtLink to="/gm/sheets" class="back-link">
        ← Back to Sheets
      </NuxtLink>
      <div class="sheet-header__actions">
        <template v-if="!isEditing">
          <button class="btn btn--primary" @click="startEditing">
            Edit
          </button>
        </template>
        <template v-else>
          <button class="btn btn--secondary" @click="cancelEditing">
            Cancel
          </button>
          <button class="btn btn--primary" @click="saveChanges" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </template>
      </div>
    </div>

    <div v-if="loading" class="sheet-loading">
      Loading...
    </div>

    <div v-else-if="error" class="sheet-error">
      <p>{{ error }}</p>
      <NuxtLink to="/gm/sheets" class="btn btn--primary">
        Return to Sheets
      </NuxtLink>
    </div>

    <div v-else-if="pokemon" class="sheet pokemon-sheet">
      <!-- Header with sprite and basic info -->
      <PokemonEditForm
        :pokemon="pokemon"
        :edit-data="editData"
        :is-editing="isEditing"
        :sprite-url="spriteUrl"
        @update:edit-data="editData = $event"
      />

      <!-- Level-Up Info Panel (shown when level increases in edit mode) -->
      <PokemonLevelUpPanel
        v-if="isEditing"
        :pokemon-id="pokemon.id"
        :current-level="pokemon.level"
        :target-level="editData.level"
      />

      <!-- Tabs -->
      <div class="sheet__tabs">
        <button
          v-for="tab in pokemonTabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ 'tab-btn--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="sheet__content">
        <!-- Stats Tab -->
        <PokemonStatsTab
          v-if="activeTab === 'stats'"
          :pokemon="pokemon"
          :edit-data="editData"
          :is-editing="isEditing"
          @update:edit-data="editData = { ...editData, ...$event }"
        />

        <!-- Moves Tab -->
        <PokemonMovesTab
          v-if="activeTab === 'moves'"
          :pokemon="pokemon"
          :last-move-roll="lastMoveRoll"
          :get-move-damage-formula="getMoveDamageFormula"
          @roll-attack="rollAttack"
          @roll-damage="(move, isCrit) => rollDamage(move, isCrit)"
        />

        <!-- Abilities Tab -->
        <div v-if="activeTab === 'abilities'" class="tab-content">
          <div class="abilities-list">
            <div v-for="(ability, idx) in pokemon.abilities" :key="idx" class="ability-card">
              <div class="ability-card__header">
                <span class="ability-name">{{ ability.name }}</span>
                <span v-if="ability.trigger" class="ability-trigger">{{ ability.trigger }}</span>
              </div>
              <p class="ability-effect">{{ ability.effect }}</p>
            </div>
            <p v-if="!pokemon.abilities?.length" class="empty-state">No abilities recorded</p>
          </div>
        </div>

        <!-- Capabilities Tab -->
        <div v-if="activeTab === 'capabilities'" class="tab-content">
          <div v-if="pokemon.capabilities" class="capabilities-grid">
            <div class="cap-item">
              <label>Overland</label>
              <span>{{ pokemon.capabilities.overland || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Swim</label>
              <span>{{ pokemon.capabilities.swim || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Sky</label>
              <span>{{ pokemon.capabilities.sky || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Burrow</label>
              <span>{{ pokemon.capabilities.burrow || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Levitate</label>
              <span>{{ pokemon.capabilities.levitate || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Jump (H/L)</label>
              <span>{{ pokemon.capabilities.jump?.high || 0 }} / {{ pokemon.capabilities.jump?.long || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Power</label>
              <span>{{ pokemon.capabilities.power || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Weight Class</label>
              <span>{{ pokemon.capabilities.weightClass || 0 }}</span>
            </div>
            <div class="cap-item">
              <label>Size</label>
              <span>{{ pokemon.capabilities.size || 'Medium' }}</span>
            </div>
          </div>
          <div v-if="pokemon.capabilities?.otherCapabilities?.length" class="info-section">
            <h4>Other Capabilities</h4>
            <div class="tag-list">
              <span v-for="cap in pokemon.capabilities.otherCapabilities" :key="cap" class="tag">
                {{ cap }}
              </span>
            </div>
          </div>
        </div>

        <!-- Skills Tab -->
        <PokemonSkillsTab
          v-if="activeTab === 'skills'"
          :pokemon="pokemon"
          :last-skill-roll="lastSkillRoll"
          @roll-skill="(skill, notation) => rollSkill(skill, notation)"
        />

        <!-- Healing Tab -->
        <div v-if="activeTab === 'healing'" class="tab-content">
          <HealingTab
            entity-type="pokemon"
            :entity-id="pokemon.id"
            :entity="pokemon"
            @healed="loadPokemon"
          />
        </div>

        <!-- Notes Tab -->
        <div v-if="activeTab === 'notes'" class="tab-content">
          <div class="form-group">
            <label>Notes</label>
            <textarea v-model="editData.notes" class="form-input" rows="6" :disabled="!isEditing"></textarea>
          </div>
          <div class="form-group">
            <label>Held Item</label>
            <input v-model="editData.heldItem" type="text" class="form-input" :disabled="!isEditing" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon } from '~/types'

definePageMeta({
  layout: 'gm'
})

const route = useRoute()
const router = useRouter()
const libraryStore = useLibraryStore()
const { getSpriteUrl } = usePokemonSprite()

const pokemonId = computed(() => route.params.id as string)

// State
const pokemon = ref<Pokemon | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isEditing = ref(false)
const saving = ref(false)
const editData = ref<Partial<Pokemon>>({})
const activeTab = ref('stats')

// Dice rolling (extracted composable)
const { lastSkillRoll, lastMoveRoll, rollSkill, rollAttack, rollDamage, getMoveDamageFormula } = usePokemonSheetRolls(pokemon)

// Check for edit mode from query param
onMounted(async () => {
  if (route.query.edit === 'true') {
    isEditing.value = true
  }
  await loadPokemon()
})

// Watch for route param changes
watch(pokemonId, async () => {
  await loadPokemon()
})

const loadPokemon = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<{ success: boolean; data: Pokemon }>(`/api/pokemon/${pokemonId.value}`)
    pokemon.value = response.data
    editData.value = { ...response.data }

    useHead({
      title: `GM - ${response.data.nickname || response.data.species}`
    })
  } catch (e) {
    error.value = 'Pokemon not found'
    console.error('Failed to load Pokemon:', e)
  } finally {
    loading.value = false
  }
}

const spriteUrl = computed(() => {
  if (!pokemon.value) return ''
  return getSpriteUrl(pokemon.value.species, pokemon.value.shiny)
})

// Tabs
const pokemonTabs = [
  { id: 'stats', label: 'Stats' },
  { id: 'moves', label: 'Moves' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'skills', label: 'Skills' },
  { id: 'healing', label: 'Healing' },
  { id: 'notes', label: 'Notes' }
]

// Edit mode
const startEditing = () => {
  editData.value = { ...pokemon.value }
  isEditing.value = true
  // Update URL without navigation
  router.replace({ query: { edit: 'true' } })
}

const cancelEditing = () => {
  editData.value = { ...pokemon.value }
  isEditing.value = false
  router.replace({ query: {} })
}

const saveChanges = async () => {
  if (!pokemon.value) return

  saving.value = true
  try {
    await libraryStore.updatePokemon(pokemon.value.id, editData.value)
    // Reload to get fresh data
    await loadPokemon()
    isEditing.value = false
    router.replace({ query: {} })
  } catch (e) {
    console.error('Failed to save Pokemon:', e)
    alert('Failed to save changes')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.pokemon-sheet-page {
  max-width: 900px;
  margin: 0 auto;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $glass-border;

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.back-link {
  color: $color-text-muted;
  text-decoration: none;
  transition: color $transition-fast;

  &:hover {
    color: $color-text;
  }
}

.sheet-loading,
.sheet-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: $color-text-muted;

  p {
    margin-bottom: $spacing-md;
  }
}

.sheet {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  padding: $spacing-lg;

  &__tabs {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $glass-border;
    overflow-x: auto;
  }

  &__content {
    min-height: 300px;
  }
}

.tab-btn {
  padding: $spacing-sm $spacing-md;
  background: transparent;
  border: none;
  color: $color-text-muted;
  font-size: $font-size-sm;
  font-weight: 500;
  cursor: pointer;
  border-radius: $border-radius-md;
  transition: all $transition-fast;
  white-space: nowrap;

  &:hover {
    background: $color-bg-hover;
    color: $color-text;
  }

  &--active {
    background: $gradient-sv-cool;
    color: $color-text;
  }
}

.tab-content {
  animation: fadeIn 0.2s ease-out;
}

.abilities-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.ability-card {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .ability-name {
      font-weight: 600;
    }

    .ability-trigger {
      font-size: $font-size-xs;
      padding: $spacing-xs $spacing-sm;
      background: $color-bg-tertiary;
      border-radius: $border-radius-sm;
      color: $color-text-muted;
    }
  }

  .ability-effect {
    font-size: $font-size-sm;
    line-height: 1.5;
    margin: 0;
  }
}

.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
}

.cap-item {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;
  text-align: center;

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  span {
    font-size: $font-size-lg;
    font-weight: 600;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tag {
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
}

.empty-state {
  text-align: center;
  color: $color-text-muted;
  padding: $spacing-xl;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
