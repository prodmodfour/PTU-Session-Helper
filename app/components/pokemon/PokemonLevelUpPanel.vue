<template>
  <div v-if="levelUpInfo" class="level-up-panel">
    <div class="level-up-panel__header">
      <img src="/icons/phosphor/arrow-fat-line-up.svg" alt="" class="level-up-icon" />
      <h4>Level Up: {{ currentLevel }} → {{ targetLevel }}</h4>
    </div>
    <div class="level-up-panel__content">
      <div class="level-up-item">
        <strong>Stat Points:</strong> +{{ levelUpInfo.totalStatPoints }} (assign following Base Relations)
      </div>
      <div v-if="levelUpInfo.totalTutorPoints > 0" class="level-up-item">
        <strong>Tutor Points:</strong> +{{ levelUpInfo.totalTutorPoints }}
      </div>
      <div v-if="levelUpInfo.allNewMoves.length > 0" class="level-up-item level-up-item--highlight">
        <strong>New Moves Available:</strong>
        <ul>
          <li v-for="move in levelUpInfo.allNewMoves" :key="move">{{ move }}</li>
        </ul>
      </div>
      <div v-if="levelUpInfo.abilityMilestones.length > 0" class="level-up-item level-up-item--milestone">
        <div v-for="milestone in levelUpInfo.abilityMilestones" :key="milestone.level">
          <strong>Lv. {{ milestone.level }}:</strong> {{ milestone.message }}
        </div>
      </div>
      <div class="level-up-item level-up-item--reminder">
        Check the Pokedex entry for possible evolution at this level.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface LevelUpSummary {
  totalStatPoints: number
  allNewMoves: string[]
  abilityMilestones: Array<{ level: number; type: string; message: string }>
  totalTutorPoints: number
}

const props = defineProps<{
  pokemonId: string
  currentLevel: number
  targetLevel: number | undefined
}>()

const levelUpInfo = ref<LevelUpSummary | null>(null)

// Watch for level changes — fetch level-up info from server
watch(() => props.targetLevel, async (newLevel) => {
  if (!newLevel || newLevel <= props.currentLevel) {
    levelUpInfo.value = null
    return
  }
  try {
    const response = await $fetch<{ success: boolean; data: LevelUpSummary }>(
      `/api/pokemon/${props.pokemonId}/level-up-check`,
      { method: 'POST', body: { targetLevel: newLevel } }
    )
    if (response.success) {
      levelUpInfo.value = response.data
    }
  } catch {
    levelUpInfo.value = null
  }
})
</script>

<style lang="scss" scoped>
.level-up-panel {
  background: linear-gradient(135deg, rgba($color-success, 0.1) 0%, rgba($color-accent-teal, 0.05) 100%);
  border: 1px solid rgba($color-success, 0.3);
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-lg;
  margin-bottom: $spacing-lg;
  animation: slideDown 0.3s ease-out;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;

    h4 {
      margin: 0;
      color: $color-success;
      font-size: $font-size-md;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
}

.level-up-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0) saturate(100%) invert(67%) sepia(59%) saturate(403%) hue-rotate(93deg) brightness(101%) contrast(87%);
}

.level-up-item {
  font-size: $font-size-sm;
  color: $color-text;

  ul {
    margin: $spacing-xs 0 0 $spacing-md;
    padding: 0;
  }

  li {
    margin-bottom: 2px;
  }

  &--highlight {
    padding: $spacing-sm;
    background: rgba($color-accent-teal, 0.1);
    border-radius: $border-radius-sm;
  }

  &--milestone {
    padding: $spacing-sm;
    background: rgba($color-warning, 0.1);
    border: 1px solid rgba($color-warning, 0.3);
    border-radius: $border-radius-sm;
    color: $color-warning;
  }

  &--reminder {
    font-style: italic;
    color: $color-text-muted;
    font-size: $font-size-xs;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
