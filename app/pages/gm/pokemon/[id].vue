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
      <div class="sheet__header">
        <div class="sheet__sprite">
          <img :src="spriteUrl" :alt="pokemon.species" />
          <span v-if="pokemon.shiny" class="shiny-badge">★</span>
        </div>
        <div class="sheet__title">
          <div class="form-row">
            <div class="form-group">
              <label>Species</label>
              <input v-model="editData.species" type="text" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group">
              <label>Nickname</label>
              <input v-model="editData.nickname" type="text" class="form-input" :disabled="!isEditing" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group form-group--sm">
              <label>Level</label>
              <input v-model.number="editData.level" type="number" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>EXP</label>
              <input v-model.number="editData.experience" type="number" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>Gender</label>
              <input v-model="editData.gender" type="text" class="form-input" :disabled="!isEditing" />
            </div>
            <div class="form-group form-group--sm">
              <label>Shiny</label>
              <input v-model="editData.shiny" type="checkbox" class="form-checkbox" :disabled="!isEditing" />
            </div>
          </div>
          <div class="type-badges">
            <span v-for="t in pokemon.types" :key="t" class="type-badge" :class="`type-badge--${t.toLowerCase()}`">
              {{ t }}
            </span>
          </div>
        </div>
      </div>

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
        <div v-if="activeTab === 'stats'" class="tab-content">
          <div class="stats-grid">
            <div class="stat-block">
              <label>HP</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.hp || 0 }}</span>
                <span class="stat-current">{{ editData.currentHp }} / {{ editData.maxHp }}</span>
              </div>
              <div v-if="isEditing" class="stat-edit">
                <input v-model.number="editData.currentHp" type="number" class="form-input form-input--sm" />
                <span>/</span>
                <input v-model.number="editData.maxHp" type="number" class="form-input form-input--sm" />
              </div>
            </div>
            <div class="stat-block">
              <label>Attack</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.attack || 0 }}</span>
                <span class="stat-current">{{ pokemon.currentStats?.attack || 0 }}</span>
              </div>
            </div>
            <div class="stat-block">
              <label>Defense</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.defense || 0 }}</span>
                <span class="stat-current">{{ pokemon.currentStats?.defense || 0 }}</span>
              </div>
            </div>
            <div class="stat-block">
              <label>Sp. Atk</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.specialAttack || 0 }}</span>
                <span class="stat-current">{{ pokemon.currentStats?.specialAttack || 0 }}</span>
              </div>
            </div>
            <div class="stat-block">
              <label>Sp. Def</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.specialDefense || 0 }}</span>
                <span class="stat-current">{{ pokemon.currentStats?.specialDefense || 0 }}</span>
              </div>
            </div>
            <div class="stat-block">
              <label>Speed</label>
              <div class="stat-values">
                <span class="stat-base">{{ pokemon.baseStats?.speed || 0 }}</span>
                <span class="stat-current">{{ pokemon.currentStats?.speed || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <h4>Nature</h4>
            <p v-if="pokemon.nature">
              {{ pokemon.nature.name }}
              <span v-if="pokemon.nature.raisedStat" class="nature-mod nature-mod--up">
                +{{ formatStatName(pokemon.nature.raisedStat) }}
              </span>
              <span v-if="pokemon.nature.loweredStat" class="nature-mod nature-mod--down">
                -{{ formatStatName(pokemon.nature.loweredStat) }}
              </span>
            </p>
          </div>
        </div>

        <!-- Moves Tab -->
        <div v-if="activeTab === 'moves'" class="tab-content">
          <div class="moves-list">
            <div v-for="(move, idx) in pokemon.moves" :key="idx" class="move-card">
              <div class="move-card__header">
                <span class="move-name">{{ move.name }}</span>
                <span class="move-type type-badge" :class="`type-badge--${(move.type || 'normal').toLowerCase()}`">
                  {{ move.type }}
                </span>
              </div>
              <div class="move-card__details">
                <span><strong>Class:</strong> {{ move.damageClass }}</span>
                <span><strong>Freq:</strong> {{ move.frequency }}</span>
                <span v-if="move.ac"><strong>AC:</strong> {{ move.ac }}</span>
                <span v-if="move.damageBase"><strong>DB:</strong> {{ move.damageBase }}</span>
              </div>
              <div class="move-card__range">
                <strong>Range:</strong> {{ move.range }}
              </div>
              <div v-if="move.effect" class="move-card__effect">
                {{ move.effect }}
              </div>
            </div>
            <p v-if="!pokemon.moves?.length" class="empty-state">No moves recorded</p>
          </div>
        </div>

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
        <div v-if="activeTab === 'skills'" class="tab-content">
          <!-- Last Roll Result -->
          <div v-if="lastSkillRoll" class="roll-result">
            <div class="roll-result__header">
              <span class="roll-result__skill">{{ lastSkillRoll.skill }}</span>
              <span class="roll-result__total">{{ lastSkillRoll.result.total }}</span>
            </div>
            <div class="roll-result__breakdown">{{ lastSkillRoll.result.breakdown }}</div>
          </div>

          <div v-if="pokemon.skills && Object.keys(pokemon.skills).length" class="skills-grid">
            <div v-for="(value, skill) in pokemon.skills" :key="skill" class="skill-item skill-item--clickable" @click="rollSkill(skill as string, value as string)">
              <label>{{ skill }}</label>
              <span class="skill-dice">{{ value }}</span>
            </div>
          </div>
          <p v-else class="empty-state">No skills recorded</p>

          <div class="info-section">
            <h4>Training</h4>
            <div class="training-info">
              <span><strong>Tutor Points:</strong> {{ pokemon.tutorPoints || 0 }}</span>
              <span><strong>Training EXP:</strong> {{ pokemon.trainingExp || 0 }}</span>
            </div>
          </div>

          <div v-if="pokemon.eggGroups?.length" class="info-section">
            <h4>Egg Groups</h4>
            <div class="tag-list">
              <span v-for="eg in pokemon.eggGroups" :key="eg" class="tag">{{ eg }}</span>
            </div>
          </div>
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
import { roll, type DiceRollResult } from '~/utils/diceRoller'

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
const lastSkillRoll = ref<{ skill: string; result: DiceRollResult } | null>(null)

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
  { id: 'notes', label: 'Notes' }
]

const formatStatName = (stat: string) => {
  const names: Record<string, string> = {
    'hp': 'HP',
    'attack': 'Atk',
    'defense': 'Def',
    'specialAttack': 'SpAtk',
    'specialDefense': 'SpDef',
    'speed': 'Spd'
  }
  return names[stat] || stat
}

// Skill rolling
const rollSkill = (skill: string, notation: string) => {
  const result = roll(notation)
  lastSkillRoll.value = { skill, result }
}

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

  &__header {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-lg;
    border-bottom: 1px solid $glass-border;
  }

  &__sprite {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
    border: 2px solid $border-color-default;
    border-radius: $border-radius-lg;
    overflow: hidden;
    position: relative;

    img {
      max-width: 100%;
      max-height: 100%;
      image-rendering: pixelated;
    }

    .shiny-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      color: gold;
      font-size: 1.2rem;
    }
  }

  &__title {
    flex: 1;
  }

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

.type-badges {
  display: flex;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
}

.type-badge {
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: 600;
  text-transform: uppercase;

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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.stat-block {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;
  text-align: center;

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
    text-transform: uppercase;
  }

  .stat-values {
    display: flex;
    justify-content: center;
    gap: $spacing-sm;
    align-items: baseline;
  }

  .stat-base {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  .stat-current {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-text;
  }

  .stat-edit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-xs;
    margin-top: $spacing-sm;

    .form-input--sm {
      width: 60px;
      padding: $spacing-xs;
      text-align: center;
    }
  }
}

.info-section {
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid $glass-border;

  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
  }
}

.nature-mod {
  font-size: $font-size-sm;
  margin-left: $spacing-sm;

  &--up { color: $color-success; }
  &--down { color: $color-danger; }
}

.moves-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.move-card {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;
  border-left: 3px solid $color-accent-violet;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    .move-name {
      font-weight: 600;
      font-size: $font-size-md;
    }
  }

  &__details {
    display: flex;
    gap: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  &__range {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
  }

  &__effect {
    font-size: $font-size-sm;
    line-height: 1.5;
    color: $color-text;
  }
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

.skills-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-secondary;
  border-radius: $border-radius-sm;

  label {
    font-size: $font-size-sm;
  }

  span {
    font-weight: 500;
    font-size: $font-size-sm;
  }

  &--clickable {
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $color-bg-tertiary;
      transform: translateX(4px);

      .skill-dice {
        color: $color-accent-violet;
      }
    }

    &:active {
      transform: translateX(2px);
    }
  }
}

.skill-dice {
  font-family: 'Fira Code', 'Consolas', monospace;
  transition: color $transition-fast;
}

.roll-result {
  background: linear-gradient(135deg, rgba($color-accent-violet, 0.15) 0%, rgba($color-accent-scarlet, 0.1) 100%);
  border: 1px solid rgba($color-accent-violet, 0.3);
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-lg;
  margin-bottom: $spacing-lg;
  animation: rollIn 0.3s ease-out;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-xs;
  }

  &__skill {
    font-weight: 600;
    color: $color-text;
  }

  &__total {
    font-size: $font-size-xxl;
    font-weight: 700;
    color: $color-accent-violet;
  }

  &__breakdown {
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-family: 'Fira Code', 'Consolas', monospace;
  }
}

@keyframes rollIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.training-info {
  display: flex;
  gap: $spacing-lg;
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

.form-row {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-md;

  .form-group {
    flex: 1;

    &--sm {
      flex: 0 0 auto;
      min-width: 100px;
    }
  }
}

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: $color-accent-violet;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
