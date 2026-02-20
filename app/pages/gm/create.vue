<template>
  <div class="create-page">
    <div class="create-page__header">
      <NuxtLink to="/gm/sheets" class="btn btn--secondary btn--sm">
        ← Back to Sheets
      </NuxtLink>
      <h2>Create Character</h2>
    </div>

    <!-- Type Selection -->
    <div class="create-page__type-select">
      <button
        class="type-btn"
        :class="{ 'type-btn--active': createType === 'human' }"
        @click="createType = 'human'"
      >
        <span class="type-btn__icon">
          <img src="/icons/phosphor/user.svg" alt="" class="type-btn__svg" />
        </span>
        <span>Human Character</span>
      </button>
      <button
        class="type-btn"
        :class="{ 'type-btn--active': createType === 'pokemon' }"
        @click="createType = 'pokemon'"
      >
        <span class="type-btn__icon">
          <img src="/icons/phosphor/circle.svg" alt="" class="type-btn__svg type-btn__svg--pokemon" />
        </span>
        <span>Pokemon</span>
      </button>
    </div>

    <!-- Human Form -->
    <form v-if="createType === 'human'" class="create-form" @submit.prevent="createHuman">
      <div class="create-form__section">
        <h3>Basic Info</h3>

        <div class="form-row">
          <div class="form-group">
            <label>Name *</label>
            <input v-model="creation.form.name" type="text" class="form-input" required />
          </div>

          <div class="form-group">
            <label>Character Type</label>
            <select v-model="creation.form.characterType" class="form-select">
              <option value="player">Player Character</option>
              <option value="npc">NPC</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Level</label>
            <input v-model.number="creation.form.level" type="number" class="form-input" min="1" max="100" />
          </div>
          <div v-if="creation.form.characterType === 'npc'" class="form-group">
            <label>Location</label>
            <input v-model="creation.form.location" type="text" class="form-input" placeholder="e.g., Mesagoza" />
          </div>
        </div>
      </div>

      <div class="create-form__section">
        <SkillBackgroundSection
          :skills="creation.form.skills"
          :background-name="creation.form.backgroundName"
          :is-custom-background="creation.form.isCustomBackground"
          :warnings="creation.skillWarnings.value"
          @apply-background="creation.applyBackground"
          @clear-background="creation.clearBackground"
          @enable-custom-background="creation.enableCustomBackground"
          @set-skill-rank="creation.setSkillRank"
          @update:background-name="(name: string) => creation.form.backgroundName = name"
        />
      </div>

      <div class="create-form__section">
        <StatAllocationSection
          :stat-points="creation.form.statPoints"
          :computed-stats="creation.computedStats.value"
          :stat-points-remaining="creation.statPointsRemaining.value"
          :max-hp="creation.maxHp.value"
          :evasions="creation.evasions.value"
          :warnings="creation.statWarnings.value"
          @increment="creation.incrementStat"
          @decrement="creation.decrementStat"
        />
      </div>

      <div class="create-form__section">
        <h3>Notes</h3>
        <textarea v-model="creation.form.notes" class="form-input" rows="3" placeholder="Additional notes..."></textarea>
      </div>

      <div v-if="creation.allWarnings.value.length" class="create-form__section create-form__section--warnings">
        <h3>Validation Summary</h3>
        <div class="validation-summary">
          <div
            v-for="(w, i) in creation.allWarnings.value"
            :key="i"
            class="validation-item"
            :class="`validation-item--${w.severity}`"
          >
            <span class="validation-item__section">{{ w.section }}</span>
            {{ w.message }}
          </div>
        </div>
      </div>

      <div class="create-form__actions">
        <button type="submit" class="btn btn--primary" :disabled="creating">
          {{ creating ? 'Creating...' : 'Create Human' }}
        </button>
      </div>
    </form>

    <!-- Pokemon Form -->
    <form v-if="createType === 'pokemon'" class="create-form" @submit.prevent="createPokemon">
      <div class="create-form__section">
        <h3>Basic Info</h3>

        <div class="form-row">
          <div class="form-group">
            <label>Species *</label>
            <input v-model="pokemonForm.species" type="text" class="form-input" required placeholder="Pikachu" />
          </div>

          <div class="form-group">
            <label>Nickname</label>
            <input v-model="pokemonForm.nickname" type="text" class="form-input" placeholder="Optional" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Level</label>
            <input v-model.number="pokemonForm.level" type="number" class="form-input" min="1" max="100" />
          </div>

          <div class="form-group">
            <label>Gender</label>
            <select v-model="pokemonForm.gender" class="form-select">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Genderless">Genderless</option>
            </select>
          </div>

          <div class="form-group">
            <label>Shiny</label>
            <select v-model="pokemonForm.shiny" class="form-select">
              <option :value="false">No</option>
              <option :value="true">Yes</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Location</label>
          <input v-model="pokemonForm.location" type="text" class="form-input" placeholder="e.g., Route 1" />
        </div>
      </div>

      <div class="create-form__section">
        <h3>Types</h3>

        <div class="form-row">
          <div class="form-group">
            <label>Primary Type *</label>
            <select v-model="pokemonForm.type1" class="form-select" required>
              <option v-for="type in pokemonTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Secondary Type</label>
            <select v-model="pokemonForm.type2" class="form-select">
              <option value="">None</option>
              <option v-for="type in pokemonTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="create-form__section">
        <h3>Base Stats</h3>

        <div class="stats-grid">
          <div class="form-group">
            <label>HP</label>
            <input v-model.number="pokemonForm.baseHp" type="number" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Attack</label>
            <input v-model.number="pokemonForm.baseAttack" type="number" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Defense</label>
            <input v-model.number="pokemonForm.baseDefense" type="number" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Sp. Attack</label>
            <input v-model.number="pokemonForm.baseSpAtk" type="number" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Sp. Defense</label>
            <input v-model.number="pokemonForm.baseSpDef" type="number" class="form-input" min="1" />
          </div>
          <div class="form-group">
            <label>Speed</label>
            <input v-model.number="pokemonForm.baseSpeed" type="number" class="form-input" min="1" />
          </div>
        </div>
      </div>

      <div class="create-form__section">
        <h3>Notes</h3>
        <textarea v-model="pokemonForm.notes" class="form-input" rows="3" placeholder="Additional notes..."></textarea>
      </div>

      <div class="create-form__actions">
        <button type="submit" class="btn btn--primary" :disabled="creating">
          {{ creating ? 'Creating...' : 'Create Pokemon' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { PokemonType } from '~/types'

definePageMeta({
  layout: 'gm'
})

useHead({
  title: 'GM - Create Character'
})

const router = useRouter()
const libraryStore = useLibraryStore()

const createType = ref<'human' | 'pokemon'>('human')
const creating = ref(false)

const pokemonTypes: PokemonType[] = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
]

// Human form via composable
const creation = useCharacterCreation()

// Pokemon form (unchanged)
const pokemonForm = ref({
  species: '',
  nickname: '',
  level: 1,
  location: '',
  gender: 'Genderless' as 'Male' | 'Female' | 'Genderless',
  shiny: false,
  type1: 'Normal' as PokemonType,
  type2: '' as PokemonType | '',
  baseHp: 50,
  baseAttack: 50,
  baseDefense: 50,
  baseSpAtk: 50,
  baseSpDef: 50,
  baseSpeed: 50,
  notes: ''
})

const createHuman = async () => {
  creating.value = true
  try {
    const data = creation.buildCreatePayload()
    await libraryStore.createHuman(data)
    router.push('/gm/sheets')
  } catch (e) {
    alert('Failed to create human character. Check the console for details.')
  } finally {
    creating.value = false
  }
}

const createPokemon = async () => {
  creating.value = true
  try {
    // PTU HP formula: Level + (HP Base * 3) + 10
    const maxHp = pokemonForm.value.level + (pokemonForm.value.baseHp * 3) + 10

    const data = {
      species: pokemonForm.value.species,
      nickname: pokemonForm.value.nickname || undefined,
      level: pokemonForm.value.level,
      location: pokemonForm.value.location || undefined,
      gender: pokemonForm.value.gender,
      shiny: pokemonForm.value.shiny,
      types: (pokemonForm.value.type2
        ? [pokemonForm.value.type1, pokemonForm.value.type2] as [PokemonType, PokemonType]
        : [pokemonForm.value.type1] as [PokemonType]),
      baseStats: {
        hp: pokemonForm.value.baseHp,
        attack: pokemonForm.value.baseAttack,
        defense: pokemonForm.value.baseDefense,
        specialAttack: pokemonForm.value.baseSpAtk,
        specialDefense: pokemonForm.value.baseSpDef,
        speed: pokemonForm.value.baseSpeed
      },
      currentStats: {
        hp: pokemonForm.value.baseHp,
        attack: pokemonForm.value.baseAttack,
        defense: pokemonForm.value.baseDefense,
        specialAttack: pokemonForm.value.baseSpAtk,
        specialDefense: pokemonForm.value.baseSpDef,
        speed: pokemonForm.value.baseSpeed
      },
      currentHp: maxHp,
      maxHp: maxHp,
      notes: pokemonForm.value.notes
    }

    await libraryStore.createPokemon(data)
    router.push('/gm/sheets')
  } catch (e) {
    alert('Failed to create Pokemon. Check the console for details.')
  } finally {
    creating.value = false
  }
}
</script>

<style lang="scss" scoped>
.create-page {
  max-width: 800px;
  margin: 0 auto;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-lg;
    margin-bottom: $spacing-xl;

    h2 {
      margin: 0;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__type-select {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-xl;
  }
}

.type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-lg;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 2px solid $glass-border;
  border-radius: $border-radius-lg;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    border-color: $color-accent-scarlet;
    box-shadow: 0 0 15px rgba($color-accent-scarlet, 0.2);
  }

  &--active {
    border-color: $color-accent-scarlet;
    background: linear-gradient(135deg, rgba($color-accent-scarlet, 0.15) 0%, rgba($color-accent-violet, 0.1) 100%);
    box-shadow: $shadow-glow-scarlet;
  }

  &__icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    border-radius: $border-radius-md;
  }

  &__svg {
    width: 28px;
    height: 28px;
    filter: brightness(0) invert(1);

    &--pokemon {
      filter: brightness(0) saturate(100%) invert(33%) sepia(98%) saturate(7407%) hue-rotate(355deg) brightness(91%) contrast(118%);
    }
  }
}

.create-form {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-xl;
  box-shadow: $shadow-lg;

  &__section {
    margin-bottom: $spacing-xl;

    h3 {
      margin-bottom: $spacing-md;
      padding-bottom: $spacing-sm;
      border-bottom: 1px solid $glass-border;
      font-size: $font-size-md;
      background: $gradient-sv-cool;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 600;
    }

    &--warnings {
      h3 {
        background: none;
        -webkit-text-fill-color: $color-warning;
        color: $color-warning;
      }
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    padding-top: $spacing-lg;
    border-top: 1px solid $glass-border;
  }
}

.form-row {
  display: flex;
  gap: $spacing-md;

  .form-group {
    flex: 1;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.validation-summary {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.validation-item {
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;

  &__section {
    font-weight: 600;
    text-transform: uppercase;
    margin-right: $spacing-xs;
  }

  &--warning {
    background: rgba($color-warning, 0.1);
    border: 1px solid rgba($color-warning, 0.3);
    color: $color-warning;
  }

  &--info {
    background: rgba($color-info, 0.1);
    border: 1px solid rgba($color-info, 0.3);
    color: $color-info;
  }
}
</style>
