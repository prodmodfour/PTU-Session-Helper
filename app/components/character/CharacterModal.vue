<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal--fullsheet">
      <div class="modal__header">
        <h2>{{ isEditing ? 'Edit' : 'View' }} {{ characterName }}</h2>
        <button class="btn btn--icon btn--secondary" @click="$emit('close')">
          <img src="/icons/phosphor/x.svg" alt="Close" class="close-icon" />
        </button>
      </div>

      <div class="modal__body">
        <!-- Pokemon View/Edit -->
        <template v-if="isPokemon">
          <div class="sheet pokemon-sheet">
            <!-- Header with sprite and basic info -->
            <div class="sheet__header">
              <div class="sheet__sprite">
                <img :src="spriteUrl" :alt="pokemonData.species" />
                <span v-if="pokemonData.shiny" class="shiny-badge">★</span>
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
                </div>
                <div class="type-badges">
                  <span v-for="t in pokemonData.types" :key="t" class="type-badge" :class="`type-badge--${t.toLowerCase()}`">
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
              <PokemonStatsTab
                v-if="activeTab === 'stats'"
                :pokemon="pokemonData"
                :current-hp="editData.currentHp"
                :max-hp="editData.maxHp"
              />
              <PokemonMovesTab
                v-if="activeTab === 'moves'"
                :moves="pokemonData.moves || []"
              />
              <PokemonAbilitiesTab
                v-if="activeTab === 'abilities'"
                :abilities="pokemonData.abilities || []"
              />
              <PokemonCapabilitiesTab
                v-if="activeTab === 'capabilities'"
                :capabilities="pokemonData.capabilities || null"
              />
              <PokemonSkillsTab
                v-if="activeTab === 'skills'"
                :skills="pokemonData.skills"
                :tutor-points="pokemonData.tutorPoints"
                :training-exp="pokemonData.trainingExp"
                :egg-groups="pokemonData.eggGroups"
              />
              <NotesTab
                v-if="activeTab === 'notes'"
                :is-pokemon="true"
                :is-editing="isEditing"
                :notes="editData.notes"
                :held-item="pokemonData.heldItem"
                @update:notes="editData.notes = $event"
              />
            </div>
          </div>
        </template>

        <!-- Human View/Edit -->
        <template v-else>
          <div class="sheet human-sheet">
            <!-- Header -->
            <div class="sheet__header">
              <div class="sheet__avatar">
                <img v-if="humanData.avatarUrl" :src="humanData.avatarUrl" :alt="characterName" />
                <span v-else>{{ characterName.charAt(0) }}</span>
              </div>
              <div class="sheet__title">
                <div class="form-row">
                  <div class="form-group">
                    <label>Name</label>
                    <input v-model="editData.name" type="text" class="form-input" :disabled="!isEditing" />
                  </div>
                  <div class="form-group">
                    <label>Played By</label>
                    <input v-model="editData.playedBy" type="text" class="form-input" :disabled="!isEditing" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group form-group--sm">
                    <label>Level</label>
                    <input v-model.number="editData.level" type="number" class="form-input" :disabled="!isEditing" />
                  </div>
                  <div class="form-group form-group--sm">
                    <label>Age</label>
                    <input v-model.number="editData.age" type="number" class="form-input" :disabled="!isEditing" />
                  </div>
                  <div class="form-group form-group--sm">
                    <label>Gender</label>
                    <input v-model="editData.gender" type="text" class="form-input" :disabled="!isEditing" />
                  </div>
                  <div class="form-group form-group--sm">
                    <label>Type</label>
                    <select v-model="editData.characterType" class="form-select" :disabled="!isEditing">
                      <option value="player">Player</option>
                      <option value="npc">NPC</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabs -->
            <div class="sheet__tabs">
              <button
                v-for="tab in humanTabs"
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
              <HumanStatsTab
                v-if="activeTab === 'stats'"
                :human="humanData"
                :current-hp="editData.currentHp"
                :max-hp="humanData.maxHp"
                :edit-data="editData"
                :is-editing="isEditing"
                @update:edit-data="editData = $event"
              />
              <HumanClassesTab
                v-if="activeTab === 'classes'"
                :trainer-classes="humanData.trainerClasses"
                :features="humanData.features"
                :edges="humanData.edges"
              />
              <HumanSkillsTab
                v-if="activeTab === 'skills'"
                :skills="humanData.skills"
              />
              <HumanPokemonTab
                v-if="activeTab === 'pokemon'"
                :pokemon="humanData.pokemon"
              />
              <NotesTab
                v-if="activeTab === 'notes'"
                :is-pokemon="false"
                :is-editing="isEditing"
                :notes="editData.notes"
                :background="editData.background"
                :personality="editData.personality"
                :goals="editData.goals"
                @update:notes="editData.notes = $event"
                @update:background="editData.background = $event"
                @update:personality="editData.personality = $event"
                @update:goals="editData.goals = $event"
              />
            </div>
          </div>
        </template>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">
          {{ isEditing ? 'Cancel' : 'Close' }}
        </button>
        <button v-if="isEditing" class="btn btn--primary" @click="save">
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon, HumanCharacter } from '~/types'

const props = defineProps<{
  character: Pokemon | HumanCharacter
  mode: 'view' | 'edit'
}>()

const emit = defineEmits<{
  close: []
  save: [data: Partial<Pokemon> | Partial<HumanCharacter>]
}>()

const { getSpriteUrl } = usePokemonSprite()

const isPokemon = computed(() => 'species' in props.character)
const isEditing = computed(() => props.mode === 'edit')

const pokemonData = computed(() => props.character as Pokemon)
const humanData = computed(() => props.character as HumanCharacter)

const characterName = computed(() => {
  if (isPokemon.value) {
    return pokemonData.value.nickname || pokemonData.value.species
  }
  return humanData.value.name
})

const spriteUrl = computed(() => {
  if (isPokemon.value) {
    return getSpriteUrl(pokemonData.value.species, pokemonData.value.shiny)
  }
  return ''
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

const humanTabs = [
  { id: 'stats', label: 'Stats' },
  { id: 'classes', label: 'Classes' },
  { id: 'skills', label: 'Skills' },
  { id: 'pokemon', label: 'Pokemon' },
  { id: 'notes', label: 'Notes' }
]

const activeTab = ref('stats')

// Edit data (reactive copy)
const editData = ref<any>({})

// Initialize edit data
onMounted(() => {
  editData.value = { ...props.character }
})

// Reset tab when character changes
watch(() => props.character, () => {
  activeTab.value = 'stats'
  editData.value = { ...props.character }
})

const save = () => {
  emit('save', editData.value)
}
</script>

<style lang="scss" scoped>
.close-icon {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-xl, 0 0 40px rgba($color-accent-violet, 0.15);
  animation: slideUp 0.3s ease-out;

  &--fullsheet {
    max-width: 900px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    border-bottom: 1px solid $glass-border;
    background: linear-gradient(135deg, rgba($color-accent-violet, 0.1) 0%, transparent 100%);

    h2 {
      margin: 0;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-lg;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-md;
    padding: $spacing-lg;
    border-top: 1px solid $glass-border;
    background: rgba($color-bg-primary, 0.5);
  }
}

.sheet {
  &__header {
    display: flex;
    gap: $spacing-lg;
    margin-bottom: $spacing-lg;
    padding-bottom: $spacing-lg;
    border-bottom: 1px solid $glass-border;
  }

  &__sprite, &__avatar {
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

    span {
      font-size: 3rem;
      font-weight: 700;
      background: $gradient-sv-cool;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
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

    label {
      display: block;
      font-size: $font-size-xs;
      color: $color-text-muted;
      margin-bottom: $spacing-xs;
    }
  }
}

.form-input, .form-select {
  width: 100%;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    border-color: $color-accent-teal;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
