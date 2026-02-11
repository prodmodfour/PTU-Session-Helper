<template>
  <section class="add-section">
    <h3>Add to Scene</h3>

    <div class="add-tabs">
      <button
        class="add-tab"
        :class="{ 'add-tab--active': activeTab === 'characters' }"
        @click="activeTab = 'characters'"
      >
        Characters
      </button>
      <button
        class="add-tab"
        :class="{ 'add-tab--active': activeTab === 'pokemon' }"
        @click="activeTab = 'pokemon'"
      >
        Pokemon
      </button>
    </div>

    <!-- Characters List -->
    <div v-if="activeTab === 'characters'" class="add-list">
      <div
        v-for="char in availableCharacters"
        :key="char.id"
        class="add-item"
        @click="emit('add-character', char)"
      >
        <div class="add-item__avatar">
          <img v-if="char.avatarUrl" :src="char.avatarUrl" :alt="char.name" />
          <PhUser v-else :size="20" />
        </div>
        <div class="add-item__info">
          <span class="name">{{ char.name }}</span>
          <span class="detail">{{ char.characterType }}</span>
        </div>
        <PhPlus :size="16" class="add-icon" />
      </div>
      <div v-if="availableCharacters.length === 0" class="empty-list">
        All characters are in the scene.
      </div>
    </div>

    <!-- Pokemon Form -->
    <div v-if="activeTab === 'pokemon'" class="add-list">
      <div class="add-pokemon-form">
        <input
          v-model="species"
          type="text"
          placeholder="Pokemon species..."
          @keyup.enter="addPokemon"
        />
        <input
          v-model.number="level"
          type="number"
          min="1"
          max="100"
          placeholder="Level"
          class="level-input"
        />
        <button class="btn btn--sm btn--primary" @click="addPokemon">
          <PhPlus :size="16" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PhUser, PhPlus } from '@phosphor-icons/vue'

interface AvailableCharacter {
  id: string
  name: string
  avatarUrl: string | null
  characterType: string
}

defineProps<{
  availableCharacters: AvailableCharacter[]
}>()

const emit = defineEmits<{
  'add-character': [char: AvailableCharacter]
  'add-pokemon': [species: string, level: number]
}>()

const activeTab = ref<'characters' | 'pokemon'>('characters')
const species = ref('')
const level = ref(5)

const addPokemon = () => {
  if (!species.value) return
  emit('add-pokemon', species.value, level.value || 5)
  species.value = ''
  level.value = 5
}
</script>

<style lang="scss" scoped>
.add-section {
  padding: $spacing-md;
  border-bottom: 1px solid $border-color-default;

  h3 {
    margin: 0 0 $spacing-md;
    font-size: $font-size-md;
    color: $color-text;
  }
}

.empty-list {
  padding: $spacing-md;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.add-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: $spacing-md;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  padding: 2px;
}

.add-tab {
  flex: 1;
  padding: $spacing-sm;
  background: transparent;
  border: none;
  color: $color-text-muted;
  font-size: $font-size-sm;
  cursor: pointer;
  border-radius: $border-radius-sm;
  transition: all $transition-fast;

  &--active {
    background: $color-primary;
    color: white;
  }
}

.add-list {
  max-height: 200px;
  overflow-y: auto;
}

.add-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  cursor: pointer;
  border-radius: $border-radius-sm;
  transition: background $transition-fast;

  &:hover {
    background: $color-bg-tertiary;

    .add-icon {
      opacity: 1;
    }
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $color-bg-tertiary;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__info {
    flex: 1;

    .name {
      display: block;
      font-size: $font-size-sm;
      color: $color-text;
    }

    .detail {
      font-size: $font-size-xs;
      color: $color-text-muted;
    }
  }

  .add-icon {
    opacity: 0;
    color: $color-primary;
  }
}

.add-pokemon-form {
  display: flex;
  gap: $spacing-sm;

  input {
    flex: 1;
    padding: $spacing-sm;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    color: $color-text;
    font-size: $font-size-sm;

    &:focus {
      outline: none;
      border-color: $color-primary;
    }
  }

  .level-input {
    width: 60px;
    flex: none;
  }
}
</style>
