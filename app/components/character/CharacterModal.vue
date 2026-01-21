<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal modal--large">
      <div class="modal__header">
        <h2>{{ isEditing ? 'Edit' : 'View' }} {{ characterName }}</h2>
        <button class="btn btn--icon btn--secondary" @click="$emit('close')">✕</button>
      </div>

      <div class="modal__body">
        <!-- Pokemon View/Edit -->
        <template v-if="isPokemon">
          <div class="character-view">
            <div class="character-view__sprite">
              <img :src="spriteUrl" :alt="(character as Pokemon).species" />
            </div>

            <div class="character-view__info">
              <div class="form-row">
                <div class="form-group">
                  <label>Species</label>
                  <input
                    v-model="editData.species"
                    type="text"
                    class="form-input"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="form-group">
                  <label>Nickname</label>
                  <input
                    v-model="editData.nickname"
                    type="text"
                    class="form-input"
                    :disabled="!isEditing"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Level</label>
                  <input
                    v-model.number="editData.level"
                    type="number"
                    class="form-input"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="form-group">
                  <label>Current HP</label>
                  <input
                    v-model.number="editData.currentHp"
                    type="number"
                    class="form-input"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="form-group">
                  <label>Max HP</label>
                  <input
                    v-model.number="editData.maxHp"
                    type="number"
                    class="form-input"
                    :disabled="!isEditing"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Notes</label>
                <textarea
                  v-model="editData.notes"
                  class="form-input"
                  rows="3"
                  :disabled="!isEditing"
                ></textarea>
              </div>
            </div>
          </div>
        </template>

        <!-- Human View/Edit -->
        <template v-else>
          <div class="character-view">
            <div class="character-view__avatar">
              <img v-if="(character as HumanCharacter).avatarUrl" :src="(character as HumanCharacter).avatarUrl" :alt="characterName" />
              <span v-else>{{ characterName.charAt(0) }}</span>
            </div>

            <div class="character-view__info">
              <div class="form-row">
                <div class="form-group">
                  <label>Name</label>
                  <input
                    v-model="editData.name"
                    type="text"
                    class="form-input"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="form-group">
                  <label>Type</label>
                  <select
                    v-model="editData.characterType"
                    class="form-select"
                    :disabled="!isEditing"
                  >
                    <option value="player">Player</option>
                    <option value="npc">NPC</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Level</label>
                  <input
                    v-model.number="editData.level"
                    type="number"
                    class="form-input"
                    :disabled="!isEditing"
                  />
                </div>
                <div class="form-group">
                  <label>Current HP</label>
                  <input
                    v-model.number="editData.currentHp"
                    type="number"
                    class="form-input"
                    :disabled="!isEditing"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Notes</label>
                <textarea
                  v-model="editData.notes"
                  class="form-input"
                  rows="3"
                  :disabled="!isEditing"
                ></textarea>
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

const characterName = computed(() => {
  if (isPokemon.value) {
    const pokemon = props.character as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (props.character as HumanCharacter).name
})

const spriteUrl = computed(() => {
  if (isPokemon.value) {
    const pokemon = props.character as Pokemon
    return getSpriteUrl(pokemon.species, pokemon.shiny)
  }
  return ''
})

// Edit data (reactive copy)
const editData = ref<any>({})

// Initialize edit data
onMounted(() => {
  editData.value = { ...props.character }
})

const save = () => {
  emit('save', editData.value)
}
</script>

<style lang="scss" scoped>
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
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-xl, 0 0 40px rgba($color-accent-violet, 0.15);
  animation: slideUp 0.3s ease-out;

  &--large {
    max-width: 700px;
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

.character-view {
  display: flex;
  gap: $spacing-xl;

  &__sprite,
  &__avatar {
    width: 150px;
    height: 150px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
    border: 2px solid $border-color-default;
    border-radius: $border-radius-lg;
    overflow: hidden;
    box-shadow: $shadow-md;

    img {
      max-width: 100%;
      max-height: 100%;
      image-rendering: pixelated;
    }

    span {
      font-size: 4rem;
      font-weight: 700;
      background: $gradient-sv-cool;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  &__info {
    flex: 1;
  }
}

.form-row {
  display: flex;
  gap: $spacing-md;

  .form-group {
    flex: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
