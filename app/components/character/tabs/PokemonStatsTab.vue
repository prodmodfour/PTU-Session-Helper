<template>
  <div class="tab-content">
    <div class="stats-grid">
      <div class="stat-block">
        <label>HP</label>
        <div class="stat-values">
          <span class="stat-base">{{ pokemon.baseStats?.hp || 0 }}</span>
          <span class="stat-current">{{ currentHp }} / {{ maxHp }}</span>
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

    <div v-if="pokemon.nature" class="info-section">
      <h4>Nature</h4>
      <p>
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
</template>

<script setup lang="ts">
import type { Pokemon } from '~/types'

const props = defineProps<{
  pokemon: Pokemon
  currentHp: number
  maxHp: number
}>()

const formatStatName = (stat: string): string => {
  const names: Record<string, string> = {
    attack: 'Atk',
    defense: 'Def',
    specialAttack: 'Sp.Atk',
    specialDefense: 'Sp.Def',
    speed: 'Spd'
  }
  return names[stat] || stat
}
</script>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.stat-block {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  text-align: center;

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    margin-bottom: $spacing-xs;
  }
}

.stat-values {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.stat-base {
  font-size: $font-size-sm;
  color: $color-text-muted;
}

.stat-current {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-text;
}

.info-section {
  margin-top: $spacing-lg;

  h4 {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
  }
}

.nature-mod {
  font-size: $font-size-sm;
  font-weight: 500;
  margin-left: $spacing-xs;

  &--up {
    color: $color-success;
  }

  &--down {
    color: $color-danger;
  }
}
</style>
