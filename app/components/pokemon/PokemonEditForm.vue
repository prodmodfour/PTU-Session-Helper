<template>
  <div class="sheet__header">
    <div class="sheet__sprite">
      <img :src="spriteUrl" :alt="pokemon.species" />
      <span v-if="pokemon.shiny" class="shiny-badge">&#9733;</span>
    </div>
    <div class="sheet__title">
      <div class="form-row">
        <div class="form-group">
          <label>Species</label>
          <input :value="editData.species" @input="updateField('species', ($event.target as HTMLInputElement).value)" type="text" class="form-input" :disabled="!isEditing" />
        </div>
        <div class="form-group">
          <label>Nickname</label>
          <input :value="editData.nickname" @input="updateField('nickname', ($event.target as HTMLInputElement).value)" type="text" class="form-input" :disabled="!isEditing" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group form-group--sm">
          <label>Level</label>
          <input :value="editData.level" @input="updateField('level', Number(($event.target as HTMLInputElement).value))" type="number" class="form-input" :disabled="!isEditing" />
        </div>
        <div class="form-group form-group--sm">
          <label>EXP</label>
          <input :value="editData.experience" @input="updateField('experience', Number(($event.target as HTMLInputElement).value))" type="number" class="form-input" :disabled="!isEditing" />
        </div>
        <div class="form-group form-group--sm">
          <label>Gender</label>
          <input :value="editData.gender" @input="updateField('gender', ($event.target as HTMLInputElement).value)" type="text" class="form-input" :disabled="!isEditing" />
        </div>
        <div class="form-group form-group--sm">
          <label>Shiny</label>
          <input :checked="editData.shiny" @change="updateField('shiny', ($event.target as HTMLInputElement).checked)" type="checkbox" class="form-checkbox" :disabled="!isEditing" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Location</label>
          <input :value="editData.location" @input="updateField('location', ($event.target as HTMLInputElement).value)" type="text" class="form-input" :disabled="!isEditing" placeholder="e.g., Route 1" />
        </div>
      </div>
      <div class="type-badges">
        <span v-for="t in pokemon.types" :key="t" class="type-badge" :class="`type-badge--${t.toLowerCase()}`">
          {{ t }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon } from '~/types'

const props = defineProps<{
  pokemon: Pokemon
  editData: Partial<Pokemon>
  isEditing: boolean
  spriteUrl: string
}>()

const emit = defineEmits<{
  'update:editData': [data: Partial<Pokemon>]
}>()

const updateField = (field: string, value: string | number | boolean) => {
  emit('update:editData', { ...props.editData, [field]: value })
}
</script>

<style lang="scss" scoped>
.sheet__header {
  display: flex;
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $glass-border;
}

.sheet__sprite {
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

  .shiny-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    color: gold;
    font-size: 1.2rem;
  }
}

.sheet__title {
  flex: 1;
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

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: $color-accent-violet;
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
</style>
