<template>
  <div class="tab-content">
    <!-- Last Roll Result -->
    <div v-if="lastSkillRoll" class="roll-result">
      <div class="roll-result__header">
        <span class="roll-result__skill">{{ lastSkillRoll.skill }}</span>
        <span class="roll-result__total">{{ lastSkillRoll.result.total }}</span>
      </div>
      <div class="roll-result__breakdown">{{ lastSkillRoll.result.breakdown }}</div>
    </div>

    <div v-if="pokemon.skills && Object.keys(pokemon.skills).length" class="skills-grid">
      <div v-for="(value, skill) in pokemon.skills" :key="skill" class="skill-item skill-item--clickable" @click="handleRollSkill(skill as string, value as string)">
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
</template>

<script setup lang="ts">
import type { Pokemon } from '~/types'
import type { SkillRollState } from '~/composables/usePokemonSheetRolls'

defineProps<{
  pokemon: Pokemon
  lastSkillRoll: SkillRollState | null
}>()

const emit = defineEmits<{
  'roll-skill': [skill: string, notation: string]
}>()

const handleRollSkill = (skill: string, notation: string) => {
  emit('roll-skill', skill, notation)
}
</script>

<style lang="scss" scoped>
.tab-content {
  @include pokemon-tab-content;
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
  @include pokemon-roll-result;
}

.info-section {
  @include pokemon-info-section;
}

.training-info {
  display: flex;
  gap: $spacing-lg;
}

.tag-list {
  @include pokemon-tag-list;
}

.tag {
  @include pokemon-tag;
}

.empty-state {
  @include pokemon-empty-state;
}

@include pokemon-sheet-keyframes;
</style>
