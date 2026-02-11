<template>
  <div class="pokemon-list">
    <div v-if="charactersWithPokemon.length === 0" class="empty-list">
      No Pokemon found in character sheets.
    </div>

    <div
      v-for="character in charactersWithPokemon"
      :key="character.id"
      class="character-group"
    >
      <button
        class="character-header"
        @click="toggleCharacter(character.id)"
      >
        <span class="character-name">{{ character.name }}</span>
        <span class="character-count">{{ character.pokemon.length }}</span>
        <PhCaretDown
          :size="14"
          class="caret"
          :class="{ 'caret--open': expandedCharacters.has(character.id) }"
        />
      </button>

      <div v-if="expandedCharacters.has(character.id)" class="pokemon-entries">
        <div
          v-for="pokemon in character.pokemon"
          :key="pokemon.id"
          class="pokemon-entry"
        >
          <img
            :src="getSpriteUrl(pokemon.species, pokemon.shiny)"
            :alt="pokemon.species"
            class="pokemon-sprite"
            loading="lazy"
          />
          <div class="pokemon-info">
            <span class="pokemon-species">{{ pokemon.species }}</span>
            <span v-if="pokemon.nickname" class="pokemon-nickname">{{ pokemon.nickname }}</span>
            <span class="pokemon-level">Lv.{{ pokemon.level }}</span>
          </div>
          <button
            class="btn btn--sm btn--ghost add-btn"
            @click="emit('add-pokemon', pokemon.species, pokemon.level)"
          >
            <PhPlus :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCaretDown, PhPlus } from '@phosphor-icons/vue'

interface PokemonEntry {
  id: string
  species: string
  nickname: string | null
  level: number
  shiny: boolean
}

interface CharacterWithPokemon {
  id: string
  name: string
  characterType: string
  pokemon: PokemonEntry[]
}

defineProps<{
  charactersWithPokemon: CharacterWithPokemon[]
}>()

const emit = defineEmits<{
  'add-pokemon': [species: string, level: number]
}>()

const { getSpriteUrl } = usePokemonSprite()

const expandedCharacters = ref(new Set<string>())

const toggleCharacter = (characterId: string) => {
  const next = new Set(expandedCharacters.value)
  if (next.has(characterId)) {
    next.delete(characterId)
  } else {
    next.add(characterId)
  }
  expandedCharacters.value = next
}
</script>

<style lang="scss" scoped>
.pokemon-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.empty-list {
  padding: $spacing-md;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.character-group {
  border-radius: $border-radius-sm;
  overflow: hidden;
}

.character-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  width: 100%;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  color: $color-text;
  font-size: $font-size-sm;

  &:hover {
    background: rgba($color-primary, 0.1);
  }
}

.character-name {
  flex: 1;
  text-align: left;
  font-weight: 600;
}

.character-count {
  padding: 2px $spacing-xs;
  background: $color-bg-secondary;
  border-radius: $border-radius-full;
  font-size: $font-size-xs;
  color: $color-text-muted;
}

.caret {
  transition: transform 0.15s ease;
  color: $color-text-muted;

  &--open {
    transform: rotate(180deg);
  }
}

.pokemon-entries {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-top: $spacing-xs;
}

.pokemon-entry {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;

  &:hover {
    background: $color-bg-tertiary;

    .add-btn {
      opacity: 1;
    }
  }
}

.pokemon-sprite {
  width: 40px;
  height: 40px;
  object-fit: contain;
  image-rendering: pixelated;
}

.pokemon-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pokemon-species {
  font-size: $font-size-sm;
  color: $color-text;
  font-weight: 500;
}

.pokemon-nickname {
  font-size: $font-size-xs;
  color: $color-text-muted;
  font-style: italic;
}

.pokemon-level {
  font-size: $font-size-xs;
  color: $color-text-muted;
}

.add-btn {
  opacity: 0;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}
</style>
