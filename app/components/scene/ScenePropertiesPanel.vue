<template>
  <div class="properties-panel">
    <!-- Scene Properties -->
    <section class="properties-section">
      <h3>Scene Properties</h3>

      <div class="form-group">
        <label>Location Name</label>
        <input
          :value="scene.locationName"
          type="text"
          placeholder="e.g., Viridian Forest"
          @change="emit('update:scene', 'locationName', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="form-group">
        <label>Background Image URL</label>
        <input
          :value="scene.locationImage"
          type="url"
          placeholder="https://..."
          @change="emit('update:scene', 'locationImage', ($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea
          :value="scene.description"
          placeholder="Scene description..."
          rows="3"
          @change="emit('update:scene', 'description', ($event.target as HTMLTextAreaElement).value)"
        ></textarea>
      </div>

      <div class="form-group">
        <label>Weather</label>
        <select
          :value="scene.weather"
          @change="emit('update:scene', 'weather', ($event.target as HTMLSelectElement).value || null)"
        >
          <option :value="null">None</option>
          <option value="sunny">Sunny</option>
          <option value="rain">Rain</option>
          <option value="sandstorm">Sandstorm</option>
          <option value="hail">Hail</option>
          <option value="snow">Snow</option>
          <option value="fog">Fog</option>
          <option value="harsh_sunlight">Harsh Sunlight</option>
          <option value="heavy_rain">Heavy Rain</option>
          <option value="strong_winds">Strong Winds</option>
        </select>
      </div>

      <div class="form-group">
        <label>Terrain</label>
        <div class="checkbox-group">
          <label v-for="terrain in terrainOptions" :key="terrain">
            <input
              type="checkbox"
              :checked="scene.terrains.includes(terrain)"
              @change="emit('toggle-terrain', terrain)"
            />
            {{ terrain.charAt(0).toUpperCase() + terrain.slice(1) }}
          </label>
        </div>
      </div>
    </section>

    <!-- Groups Section -->
    <section class="properties-section">
      <div class="section-header">
        <h3>Groups</h3>
        <button class="btn btn--sm btn--ghost" @click="emit('create-group')">
          <PhPlus :size="16" />
        </button>
      </div>
      <div v-if="scene.groups.length === 0" class="empty-list">
        No groups. Click + to create one.
      </div>
      <div v-else class="groups-list">
        <div
          v-for="group in scene.groups"
          :key="group.id"
          class="group-item"
          :class="{ 'group-item--selected': selectedGroupId === group.id }"
          @click="emit('select-group', group.id)"
        >
          <input
            :value="group.name"
            class="group-name-input"
            @blur="emit('rename-group', group.id, ($event.target as HTMLInputElement).value)"
            @click.stop
          />
          <span class="group-count">{{ getGroupMemberCount(group.id) }}</span>
        </div>
      </div>
    </section>

    <slot />
  </div>
</template>

<script setup lang="ts">
import { PhPlus } from '@phosphor-icons/vue'
import type { Scene } from '~/stores/groupViewTabs'

const props = defineProps<{
  scene: Scene
  selectedGroupId: string | null
}>()

const emit = defineEmits<{
  'update:scene': [field: string, value: any]
  'toggle-terrain': [terrain: string]
  'create-group': []
  'delete-group': [id: string]
  'select-group': [id: string]
  'rename-group': [groupId: string, name: string]
}>()

const terrainOptions = ['grassy', 'electric', 'psychic', 'misty']

const getGroupMemberCount = (groupId: string): number => {
  const pokemonCount = props.scene.pokemon.filter(p => p.groupId === groupId).length
  const characterCount = props.scene.characters.filter(c => c.groupId === groupId).length
  return pokemonCount + characterCount
}
</script>

<style lang="scss" scoped>
.properties-panel {
  width: 360px;
  background: $color-bg-secondary;
  border-left: 1px solid $border-color-default;
  overflow-y: auto;
}

.properties-section {
  padding: $spacing-md;
  border-bottom: 1px solid $border-color-default;

  h3 {
    margin: 0 0 $spacing-md;
    font-size: $font-size-md;
    color: $color-text;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    h3 {
      margin: 0;
    }
  }
}

.form-group {
  margin-bottom: $spacing-md;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  input, select, textarea {
    width: 100%;
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

  textarea {
    resize: vertical;
  }
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;

  label {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    cursor: pointer;
    font-size: $font-size-sm;
    color: $color-text;
  }
}

.empty-list {
  padding: $spacing-md;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.group-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  cursor: pointer;

  &--selected {
    background: rgba($color-primary, 0.2);
  }

  .group-name-input {
    flex: 1;
    padding: $spacing-xs;
    background: transparent;
    border: none;
    color: $color-text;
    font-size: $font-size-sm;

    &:focus {
      outline: none;
      background: $color-bg-secondary;
    }
  }

  .group-count {
    padding: 2px $spacing-sm;
    background: $color-bg-secondary;
    border-radius: $border-radius-full;
    font-size: $font-size-xs;
    color: $color-text-muted;
  }
}
</style>
