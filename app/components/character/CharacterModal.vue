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
              <!-- Stats Tab -->
              <div v-if="activeTab === 'stats'" class="tab-content">
                <div class="stats-grid">
                  <div class="stat-block">
                    <label>HP</label>
                    <div class="stat-values">
                      <span class="stat-base">{{ pokemonData.baseStats?.hp || 0 }}</span>
                      <span class="stat-current">{{ editData.currentHp }} / {{ editData.maxHp }}</span>
                    </div>
                  </div>
                  <div class="stat-block">
                    <label>Attack</label>
                    <div class="stat-values">
                      <span class="stat-base">{{ pokemonData.baseStats?.attack || 0 }}</span>
                      <span class="stat-current">{{ pokemonData.currentStats?.attack || 0 }}</span>
                    </div>
                  </div>
                  <div class="stat-block">
                    <label>Defense</label>
                    <div class="stat-values">
                      <span class="stat-base">{{ pokemonData.baseStats?.defense || 0 }}</span>
                      <span class="stat-current">{{ pokemonData.currentStats?.defense || 0 }}</span>
                    </div>
                  </div>
                  <div class="stat-block">
                    <label>Sp. Atk</label>
                    <div class="stat-values">
                      <span class="stat-base">{{ pokemonData.baseStats?.specialAttack || 0 }}</span>
                      <span class="stat-current">{{ pokemonData.currentStats?.specialAttack || 0 }}</span>
                    </div>
                  </div>
                  <div class="stat-block">
                    <label>Sp. Def</label>
                    <div class="stat-values">
                      <span class="stat-base">{{ pokemonData.baseStats?.specialDefense || 0 }}</span>
                      <span class="stat-current">{{ pokemonData.currentStats?.specialDefense || 0 }}</span>
                    </div>
                  </div>
                  <div class="stat-block">
                    <label>Speed</label>
                    <div class="stat-values">
                      <span class="stat-base">{{ pokemonData.baseStats?.speed || 0 }}</span>
                      <span class="stat-current">{{ pokemonData.currentStats?.speed || 0 }}</span>
                    </div>
                  </div>
                </div>

                <div class="info-section">
                  <h4>Nature</h4>
                  <p v-if="pokemonData.nature">
                    {{ pokemonData.nature.name }}
                    <span v-if="pokemonData.nature.raisedStat" class="nature-mod nature-mod--up">
                      +{{ formatStatName(pokemonData.nature.raisedStat) }}
                    </span>
                    <span v-if="pokemonData.nature.loweredStat" class="nature-mod nature-mod--down">
                      -{{ formatStatName(pokemonData.nature.loweredStat) }}
                    </span>
                  </p>
                </div>
              </div>

              <!-- Moves Tab -->
              <div v-if="activeTab === 'moves'" class="tab-content">
                <div class="moves-list">
                  <div v-for="(move, idx) in pokemonData.moves" :key="idx" class="move-card">
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
                  <p v-if="!pokemonData.moves?.length" class="empty-state">No moves recorded</p>
                </div>
              </div>

              <!-- Abilities Tab -->
              <div v-if="activeTab === 'abilities'" class="tab-content">
                <div class="abilities-list">
                  <div v-for="(ability, idx) in pokemonData.abilities" :key="idx" class="ability-card">
                    <div class="ability-card__header">
                      <span class="ability-name">{{ ability.name }}</span>
                      <span v-if="ability.trigger" class="ability-trigger">{{ ability.trigger }}</span>
                    </div>
                    <p class="ability-effect">{{ ability.effect }}</p>
                  </div>
                  <p v-if="!pokemonData.abilities?.length" class="empty-state">No abilities recorded</p>
                </div>
              </div>

              <!-- Capabilities Tab -->
              <div v-if="activeTab === 'capabilities'" class="tab-content">
                <div v-if="pokemonData.capabilities" class="capabilities-grid">
                  <div class="cap-item">
                    <label>Overland</label>
                    <span>{{ pokemonData.capabilities.overland || 0 }}</span>
                  </div>
                  <div class="cap-item">
                    <label>Swim</label>
                    <span>{{ pokemonData.capabilities.swim || 0 }}</span>
                  </div>
                  <div class="cap-item">
                    <label>Sky</label>
                    <span>{{ pokemonData.capabilities.sky || 0 }}</span>
                  </div>
                  <div class="cap-item">
                    <label>Burrow</label>
                    <span>{{ pokemonData.capabilities.burrow || 0 }}</span>
                  </div>
                  <div class="cap-item">
                    <label>Levitate</label>
                    <span>{{ pokemonData.capabilities.levitate || 0 }}</span>
                  </div>
                  <div class="cap-item">
                    <label>Jump (H/L)</label>
                    <span>{{ pokemonData.capabilities.jump?.high || 0 }} / {{ pokemonData.capabilities.jump?.long || 0 }}</span>
                  </div>
                  <div class="cap-item">
                    <label>Power</label>
                    <span>{{ pokemonData.capabilities.power || 0 }}</span>
                  </div>
                  <div class="cap-item">
                    <label>Weight Class</label>
                    <span>{{ pokemonData.capabilities.weightClass || 0 }}</span>
                  </div>
                  <div class="cap-item">
                    <label>Size</label>
                    <span>{{ pokemonData.capabilities.size || 'Medium' }}</span>
                  </div>
                </div>
                <div v-if="pokemonData.capabilities?.otherCapabilities?.length" class="info-section">
                  <h4>Other Capabilities</h4>
                  <div class="tag-list">
                    <span v-for="cap in pokemonData.capabilities.otherCapabilities" :key="cap" class="tag">
                      {{ cap }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Skills Tab -->
              <div v-if="activeTab === 'skills'" class="tab-content">
                <div v-if="pokemonData.skills && Object.keys(pokemonData.skills).length" class="skills-grid">
                  <div v-for="(value, skill) in pokemonData.skills" :key="skill" class="skill-item">
                    <label>{{ skill }}</label>
                    <span>{{ value }}</span>
                  </div>
                </div>
                <p v-else class="empty-state">No skills recorded</p>

                <div class="info-section">
                  <h4>Training</h4>
                  <div class="training-info">
                    <span><strong>Tutor Points:</strong> {{ pokemonData.tutorPoints || 0 }}</span>
                    <span><strong>Training EXP:</strong> {{ pokemonData.trainingExp || 0 }}</span>
                  </div>
                </div>

                <div v-if="pokemonData.eggGroups?.length" class="info-section">
                  <h4>Egg Groups</h4>
                  <div class="tag-list">
                    <span v-for="eg in pokemonData.eggGroups" :key="eg" class="tag">{{ eg }}</span>
                  </div>
                </div>
              </div>

              <!-- Notes Tab -->
              <div v-if="activeTab === 'notes'" class="tab-content">
                <div class="form-group">
                  <label>Notes</label>
                  <textarea v-model="editData.notes" class="form-input" rows="6" :disabled="!isEditing"></textarea>
                </div>
                <div v-if="pokemonData.heldItem" class="info-section">
                  <h4>Held Item</h4>
                  <p>{{ pokemonData.heldItem }}</p>
                </div>
              </div>
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
              <!-- Stats Tab -->
              <div v-if="activeTab === 'stats'" class="tab-content">
                <div class="stats-grid">
                  <div class="stat-block">
                    <label>HP</label>
                    <div class="stat-values">
                      <span class="stat-base">{{ humanData.stats?.hp || 0 }}</span>
                      <span class="stat-current">{{ editData.currentHp }} / {{ humanData.maxHp }}</span>
                    </div>
                  </div>
                  <div class="stat-block">
                    <label>Attack</label>
                    <span class="stat-current">{{ humanData.stats?.attack || 0 }}</span>
                  </div>
                  <div class="stat-block">
                    <label>Defense</label>
                    <span class="stat-current">{{ humanData.stats?.defense || 0 }}</span>
                  </div>
                  <div class="stat-block">
                    <label>Sp. Atk</label>
                    <span class="stat-current">{{ humanData.stats?.specialAttack || 0 }}</span>
                  </div>
                  <div class="stat-block">
                    <label>Sp. Def</label>
                    <span class="stat-current">{{ humanData.stats?.specialDefense || 0 }}</span>
                  </div>
                  <div class="stat-block">
                    <label>Speed</label>
                    <span class="stat-current">{{ humanData.stats?.speed || 0 }}</span>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group form-group--sm">
                    <label>Height (cm)</label>
                    <input v-model.number="editData.height" type="number" class="form-input" :disabled="!isEditing" />
                  </div>
                  <div class="form-group form-group--sm">
                    <label>Weight (kg)</label>
                    <input v-model.number="editData.weight" type="number" class="form-input" :disabled="!isEditing" />
                  </div>
                  <div class="form-group form-group--sm">
                    <label>Money</label>
                    <input v-model.number="editData.money" type="number" class="form-input" :disabled="!isEditing" />
                  </div>
                </div>
              </div>

              <!-- Classes Tab -->
              <div v-if="activeTab === 'classes'" class="tab-content">
                <div v-if="humanData.trainerClasses?.length" class="info-section">
                  <h4>Trainer Classes</h4>
                  <div class="tag-list">
                    <span v-for="tc in humanData.trainerClasses" :key="tc" class="tag tag--class">{{ tc }}</span>
                  </div>
                </div>

                <div v-if="humanData.features?.length" class="info-section">
                  <h4>Features</h4>
                  <div class="tag-list">
                    <span v-for="feat in humanData.features" :key="feat" class="tag tag--feature">{{ feat }}</span>
                  </div>
                </div>

                <div v-if="humanData.edges?.length" class="info-section">
                  <h4>Edges</h4>
                  <div class="tag-list">
                    <span v-for="edge in humanData.edges" :key="edge" class="tag tag--edge">{{ edge }}</span>
                  </div>
                </div>
              </div>

              <!-- Skills Tab -->
              <div v-if="activeTab === 'skills'" class="tab-content">
                <div v-if="humanData.skills && Object.keys(humanData.skills).length" class="skills-grid skills-grid--human">
                  <div v-for="(rank, skill) in humanData.skills" :key="skill" class="skill-item" :class="`skill-item--${rank.toLowerCase()}`">
                    <label>{{ skill }}</label>
                    <span class="skill-rank">{{ rank }}</span>
                  </div>
                </div>
                <p v-else class="empty-state">No skills recorded</p>
              </div>

              <!-- Pokemon Tab -->
              <div v-if="activeTab === 'pokemon'" class="tab-content">
                <div v-if="humanData.pokemon?.length" class="pokemon-team">
                  <div v-for="poke in humanData.pokemon" :key="poke.id" class="team-pokemon">
                    <img :src="getSpriteUrl(poke.species, poke.shiny)" :alt="poke.species" />
                    <div class="team-pokemon__info">
                      <span class="team-pokemon__name">{{ poke.nickname || poke.species }}</span>
                      <span class="team-pokemon__level">Lv. {{ poke.level }}</span>
                    </div>
                  </div>
                </div>
                <p v-else class="empty-state">No Pokemon linked to this trainer</p>
              </div>

              <!-- Notes Tab -->
              <div v-if="activeTab === 'notes'" class="tab-content">
                <div class="form-group">
                  <label>Background</label>
                  <textarea v-model="editData.background" class="form-input" rows="3" :disabled="!isEditing"></textarea>
                </div>
                <div class="form-group">
                  <label>Personality</label>
                  <textarea v-model="editData.personality" class="form-input" rows="3" :disabled="!isEditing"></textarea>
                </div>
                <div class="form-group">
                  <label>Goals</label>
                  <textarea v-model="editData.goals" class="form-input" rows="3" :disabled="!isEditing"></textarea>
                </div>
                <div class="form-group">
                  <label>Notes</label>
                  <textarea v-model="editData.notes" class="form-input" rows="3" :disabled="!isEditing"></textarea>
                </div>
              </div>
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

  &--human {
    grid-template-columns: repeat(3, 1fr);
  }
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

  .skill-rank {
    text-transform: capitalize;
  }

  &--pathetic .skill-rank { color: $color-danger; }
  &--untrained .skill-rank { color: $color-text-muted; }
  &--novice .skill-rank { color: $color-text; }
  &--adept .skill-rank { color: $color-success; }
  &--expert .skill-rank { color: $color-info; }
  &--master .skill-rank { color: gold; }
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

  &--class {
    background: rgba($color-accent-violet, 0.2);
    color: $color-accent-violet;
  }

  &--feature {
    background: rgba($color-accent-scarlet, 0.2);
    color: $color-accent-scarlet;
  }

  &--edge {
    background: rgba($color-info, 0.2);
    color: $color-info;
  }
}

.pokemon-team {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: $spacing-md;
}

.team-pokemon {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md;
  background: $color-bg-secondary;
  border-radius: $border-radius-md;

  img {
    width: 64px;
    height: 64px;
    image-rendering: pixelated;
  }

  &__info {
    text-align: center;
    margin-top: $spacing-sm;
  }

  &__name {
    display: block;
    font-weight: 600;
  }

  &__level {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
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
