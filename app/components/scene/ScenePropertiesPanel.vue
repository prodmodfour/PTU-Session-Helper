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

      <div class="form-group">
        <label>Habitat</label>
        <select
          :value="scene.habitatId"
          @change="emit('update:scene', 'habitatId', ($event.target as HTMLSelectElement).value || null)"
        >
          <option :value="null">None</option>
          <option v-for="habitat in habitats" :key="habitat.id" :value="habitat.id">
            {{ habitat.name }}
          </option>
        </select>
      </div>
    </section>

    <!-- Modifiers Section -->
    <section class="properties-section">
      <div class="section-header">
        <h3>Modifiers</h3>
        <button class="btn btn--sm btn--ghost" @click="showModifierForm = true" v-if="!showModifierForm">
          <PhPlus :size="16" />
        </button>
      </div>

      <div v-if="scene.modifiers.length === 0 && !showModifierForm" class="empty-list">
        No modifiers. Click + to add one.
      </div>

      <div v-if="scene.modifiers.length > 0" class="modifiers-list">
        <div v-for="(modifier, index) in scene.modifiers" :key="index" class="modifier-item">
          <div class="modifier-info">
            <span class="modifier-name">{{ modifier.name }}</span>
            <span v-if="modifier.description" class="modifier-desc">{{ modifier.description }}</span>
            <span v-if="modifier.effect" class="modifier-effect">{{ modifier.effect }}</span>
          </div>
          <button class="btn-icon btn-icon--danger" @click="emit('remove-modifier', index)">
            <PhTrash :size="14" />
          </button>
        </div>
      </div>

      <div v-if="showModifierForm" class="modifier-form">
        <input
          v-model="newModifier.name"
          type="text"
          placeholder="Modifier name..."
          class="modifier-form__input"
        />
        <textarea
          v-model="newModifier.description"
          placeholder="Description (optional)"
          rows="2"
          class="modifier-form__input"
        ></textarea>
        <input
          v-model="newModifier.effect"
          type="text"
          placeholder="Effect (optional, e.g. +2 Atk to Fire types)"
          class="modifier-form__input"
        />
        <div class="modifier-form__actions">
          <button class="btn btn--sm btn--primary" @click="submitModifier" :disabled="!newModifier.name">
            Add
          </button>
          <button class="btn btn--sm btn--ghost" @click="cancelModifierForm">
            Cancel
          </button>
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
import { PhPlus, PhTrash } from '@phosphor-icons/vue'
import type { Scene, SceneModifier } from '~/stores/groupViewTabs'

const props = defineProps<{
  scene: Scene
  selectedGroupId: string | null
  habitats: Array<{ id: string; name: string }>
}>()

const emit = defineEmits<{
  'update:scene': [field: string, value: any]
  'toggle-terrain': [terrain: string]
  'add-modifier': [modifier: SceneModifier]
  'remove-modifier': [index: number]
  'create-group': []
  'delete-group': [id: string]
  'select-group': [id: string]
  'rename-group': [groupId: string, name: string]
}>()

const terrainOptions = ['grassy', 'electric', 'psychic', 'misty']

// Modifier form state
const showModifierForm = ref(false)
const newModifier = ref<SceneModifier>({ name: '', description: '', effect: '' })

const submitModifier = () => {
  if (!newModifier.value.name) return
  emit('add-modifier', { ...newModifier.value })
  newModifier.value = { name: '', description: '', effect: '' }
  showModifierForm.value = false
}

const cancelModifierForm = () => {
  newModifier.value = { name: '', description: '', effect: '' }
  showModifierForm.value = false
}

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

.modifiers-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  margin-bottom: $spacing-sm;
}

.modifier-item {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;

  .modifier-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .modifier-name {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text;
  }

  .modifier-desc {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  .modifier-effect {
    font-size: $font-size-xs;
    color: $color-primary;
    font-style: italic;
  }
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: $border-radius-sm;
  background: transparent;
  cursor: pointer;

  &--danger {
    color: $color-text-muted;

    &:hover {
      color: $color-danger;
      background: rgba($color-danger, 0.1);
    }
  }
}

.modifier-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  &__input {
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

  &__actions {
    display: flex;
    gap: $spacing-sm;
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
