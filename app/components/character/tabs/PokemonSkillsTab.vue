<template>
  <div class="tab-content">
    <div v-if="skills && Object.keys(skills).length" class="skills-grid">
      <div v-for="(value, skill) in skills" :key="skill" class="skill-item">
        <label>{{ skill }}</label>
        <span>{{ value }}</span>
      </div>
    </div>
    <p v-else class="empty-state">No skills recorded</p>

    <div class="info-section">
      <h4>Training</h4>
      <div class="training-info">
        <span><strong>Tutor Points:</strong> {{ tutorPoints || 0 }}</span>
        <span><strong>Training EXP:</strong> {{ trainingExp || 0 }}</span>
      </div>
    </div>

    <div v-if="eggGroups?.length" class="info-section">
      <h4>Egg Groups</h4>
      <div class="tag-list">
        <span v-for="eg in eggGroups" :key="eg" class="tag">{{ eg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  skills?: Record<string, string>  // { skillName: diceFormula like "2d6+2" }
  tutorPoints?: number
  trainingExp?: number
  eggGroups?: string[]
}>()
</script>

<style lang="scss" scoped>
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;

  label {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  span {
    font-weight: 600;
    color: $color-text;
  }
}

.info-section {
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color-default;

  h4 {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.training-info {
  display: flex;
  gap: $spacing-lg;
  font-size: $font-size-sm;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tag {
  font-size: $font-size-xs;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
}

.empty-state {
  color: $color-text-muted;
  font-style: italic;
  text-align: center;
  padding: $spacing-xl;
}
</style>
