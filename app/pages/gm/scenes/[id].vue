<template>
  <div class="scene-editor">
    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <PhSpinner class="spinner" :size="32" />
      <span>Loading scene...</span>
    </div>

    <!-- Not Found -->
    <div v-else-if="!scene" class="empty-state">
      <PhWarning :size="64" />
      <h2>Scene Not Found</h2>
      <NuxtLink to="/gm/scenes" class="btn btn--primary">Back to Scenes</NuxtLink>
    </div>

    <!-- Editor -->
    <template v-else>
      <!-- Header -->
      <header class="scene-editor__header">
        <div class="header-left">
          <NuxtLink to="/gm/scenes" class="back-link">
            <PhArrowLeft :size="20" />
            <span>Back</span>
          </NuxtLink>
          <input
            v-model="sceneName"
            class="scene-name-input"
            placeholder="Scene Name"
            @blur="saveSceneName"
            @keyup.enter="($event.target as HTMLInputElement)?.blur()"
          />
        </div>
        <div class="header-actions">
          <button
            v-if="!scene.isActive"
            class="btn btn--primary"
            @click="activateScene"
            :disabled="activating"
          >
            <PhBroadcast :size="18" />
            <span>{{ activating ? 'Activating...' : 'Activate Scene' }}</span>
          </button>
          <button
            v-else
            class="btn btn--ghost"
            @click="deactivateScene"
          >
            <PhStop :size="18" />
            <span>Deactivate</span>
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <div class="scene-editor__content">
        <!-- Left Panel: Canvas Preview -->
        <div class="canvas-panel">
          <div class="canvas-container" ref="canvasContainer">
            <!-- Background -->
            <div
              class="canvas-background"
              :style="scene.locationImage ? { backgroundImage: `url(${scene.locationImage})` } : {}"
            >
              <!-- Groups -->
              <div
                v-for="group in scene.groups"
                :key="group.id"
                class="canvas-group"
                :class="{ 'canvas-group--selected': selectedGroupId === group.id }"
                :style="{
                  left: `${group.position.x}%`,
                  top: `${group.position.y}%`,
                  width: `${group.width}px`,
                  height: `${group.height}px`
                }"
                @click="selectGroup(group.id)"
                @mousedown="startDragGroup($event, group)"
              >
                <span class="group-label">{{ group.name }}</span>
                <button class="group-delete" @click.stop="deleteGroup(group.id)">
                  <PhX :size="12" />
                </button>
              </div>

              <!-- Pokemon Sprites -->
              <div
                v-for="pokemon in scene.pokemon"
                :key="pokemon.id"
                class="canvas-sprite canvas-sprite--pokemon"
                :style="{
                  left: `${pokemon.position.x}%`,
                  top: `${pokemon.position.y}%`
                }"
                @mousedown="startDragSprite($event, 'pokemon', pokemon)"
              >
                <img
                  :src="getPokemonSprite(pokemon.species)"
                  :alt="pokemon.nickname || pokemon.species"
                />
                <span class="sprite-label">{{ pokemon.nickname || pokemon.species }}</span>
                <button class="sprite-delete" @click.stop="removePokemon(pokemon.id)">
                  <PhX :size="10" />
                </button>
              </div>

              <!-- Character Avatars -->
              <div
                v-for="character in scene.characters"
                :key="character.id"
                class="canvas-sprite canvas-sprite--character"
                :style="{
                  left: `${character.position.x}%`,
                  top: `${character.position.y}%`
                }"
                @mousedown="startDragSprite($event, 'character', character)"
              >
                <div class="avatar-circle">
                  <img
                    v-if="character.avatarUrl"
                    :src="character.avatarUrl"
                    :alt="character.name"
                  />
                  <PhUser v-else :size="24" />
                </div>
                <span class="sprite-label">{{ character.name }}</span>
                <button class="sprite-delete" @click.stop="removeCharacter(character.id)">
                  <PhX :size="10" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Properties -->
        <div class="properties-panel">
          <!-- Scene Properties -->
          <section class="properties-section">
            <h3>Scene Properties</h3>

            <div class="form-group">
              <label>Location Name</label>
              <input
                v-model="scene.locationName"
                type="text"
                placeholder="e.g., Viridian Forest"
                @change="saveScene"
              />
            </div>

            <div class="form-group">
              <label>Background Image URL</label>
              <input
                v-model="scene.locationImage"
                type="url"
                placeholder="https://..."
                @change="saveScene"
              />
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea
                v-model="scene.description"
                placeholder="Scene description..."
                rows="3"
                @change="saveScene"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Weather</label>
              <select v-model="scene.weather" @change="saveScene">
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
                    @change="toggleTerrain(terrain)"
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
              <button class="btn btn--sm btn--ghost" @click="createGroup">
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
                @click="selectGroup(group.id)"
              >
                <input
                  v-model="group.name"
                  class="group-name-input"
                  @blur="saveScene"
                  @click.stop
                />
                <span class="group-count">{{ getGroupMemberCount(group.id) }}</span>
              </div>
            </div>
          </section>

          <!-- Add to Scene Section -->
          <section class="properties-section">
            <h3>Add to Scene</h3>

            <div class="add-tabs">
              <button
                class="add-tab"
                :class="{ 'add-tab--active': addTab === 'characters' }"
                @click="addTab = 'characters'"
              >
                Characters
              </button>
              <button
                class="add-tab"
                :class="{ 'add-tab--active': addTab === 'pokemon' }"
                @click="addTab = 'pokemon'"
              >
                Pokemon
              </button>
            </div>

            <!-- Characters List -->
            <div v-if="addTab === 'characters'" class="add-list">
              <div
                v-for="char in availableCharacters"
                :key="char.id"
                class="add-item"
                @click="addCharacter(char)"
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

            <!-- Pokemon List -->
            <div v-if="addTab === 'pokemon'" class="add-list">
              <div class="add-pokemon-form">
                <input
                  v-model="newPokemonSpecies"
                  type="text"
                  placeholder="Pokemon species..."
                  @keyup.enter="addWildPokemon"
                />
                <input
                  v-model.number="newPokemonLevel"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Level"
                  class="level-input"
                />
                <button class="btn btn--sm btn--primary" @click="addWildPokemon">
                  <PhPlus :size="16" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  PhSpinner,
  PhWarning,
  PhArrowLeft,
  PhBroadcast,
  PhStop,
  PhX,
  PhUser,
  PhPlus
} from '@phosphor-icons/vue'
import type { Scene, ScenePokemon, SceneCharacter, SceneGroup } from '~/stores/groupViewTabs'

definePageMeta({
  layout: 'gm'
})

const route = useRoute()
const groupViewTabsStore = useGroupViewTabsStore()

// State
const loading = ref(true)
const activating = ref(false)
const scene = ref<Scene | null>(null)
const sceneName = ref('')
const selectedGroupId = ref<string | null>(null)
const addTab = ref<'characters' | 'pokemon'>('characters')
const newPokemonSpecies = ref('')
const newPokemonLevel = ref(5)

// Canvas drag state
const canvasContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragTarget = ref<{ type: 'pokemon' | 'character' | 'group'; id: string } | null>(null)

// Available characters (not already in scene)
const allCharacters = ref<Array<{
  id: string
  name: string
  avatarUrl: string | null
  characterType: string
}>>([])

const availableCharacters = computed(() => {
  if (!scene.value) return []
  const sceneCharIds = scene.value.characters.map(c => c.characterId)
  return allCharacters.value.filter(c => !sceneCharIds.includes(c.id))
})

// Terrain options
const terrainOptions = ['grassy', 'electric', 'psychic', 'misty']

// Fetch scene on mount
onMounted(async () => {
  const id = route.params.id as string

  try {
    const fetchedScene = await groupViewTabsStore.fetchScene(id)
    if (fetchedScene) {
      scene.value = { ...fetchedScene }
      sceneName.value = fetchedScene.name
    }

    // Fetch all characters for the add panel
    const response = await $fetch<{ success: boolean; data: any[] }>('/api/characters')
    if (response.success) {
      allCharacters.value = response.data.map(c => ({
        id: c.id,
        name: c.name,
        avatarUrl: c.avatarUrl,
        characterType: c.characterType
      }))
    }
  } catch (error) {
    // Failed to fetch scene
  } finally {
    loading.value = false
  }

  useHead({
    title: scene.value ? `${scene.value.name} - Scene Editor` : 'Scene Editor'
  })
})

// Save scene name
const saveSceneName = async () => {
  if (!scene.value || sceneName.value === scene.value.name) return
  scene.value.name = sceneName.value
  await saveScene()
}

// Save scene
const saveScene = async () => {
  if (!scene.value) return
  try {
    await groupViewTabsStore.updateScene(scene.value.id, {
      name: scene.value.name,
      description: scene.value.description,
      locationName: scene.value.locationName,
      locationImage: scene.value.locationImage,
      weather: scene.value.weather,
      terrains: scene.value.terrains,
      pokemon: scene.value.pokemon,
      characters: scene.value.characters,
      groups: scene.value.groups
    })
  } catch (error) {
    // Failed to save scene
  }
}

// Activate scene
const activateScene = async () => {
  if (!scene.value) return
  activating.value = true
  try {
    await groupViewTabsStore.activateScene(scene.value.id)
    await groupViewTabsStore.setActiveTab('scene', scene.value.id)
    scene.value.isActive = true
  } catch (error) {
    // Failed to activate
  } finally {
    activating.value = false
  }
}

// Deactivate scene
const deactivateScene = async () => {
  if (!scene.value) return
  try {
    await groupViewTabsStore.deactivateScene(scene.value.id)
    scene.value.isActive = false
  } catch (error) {
    // Failed to deactivate
  }
}

// Toggle terrain
const toggleTerrain = (terrain: string) => {
  if (!scene.value) return
  const index = scene.value.terrains.indexOf(terrain)
  if (index === -1) {
    scene.value.terrains = [...scene.value.terrains, terrain]
  } else {
    scene.value.terrains = scene.value.terrains.filter(t => t !== terrain)
  }
  saveScene()
}

// Create group
const createGroup = async () => {
  if (!scene.value) return
  try {
    const response = await $fetch<{ success: boolean; data: SceneGroup }>(
      `/api/scenes/${scene.value.id}/groups`,
      { method: 'POST', body: {} }
    )
    if (response.success) {
      scene.value.groups = [...scene.value.groups, response.data]
    }
  } catch (error) {
    // Failed to create group
  }
}

// Delete group
const deleteGroup = async (groupId: string) => {
  if (!scene.value) return
  try {
    await $fetch(`/api/scenes/${scene.value.id}/groups/${groupId}`, { method: 'DELETE' })
    scene.value.groups = scene.value.groups.filter(g => g.id !== groupId)
    if (selectedGroupId.value === groupId) {
      selectedGroupId.value = null
    }
  } catch (error) {
    // Failed to delete group
  }
}

// Select group
const selectGroup = (groupId: string) => {
  selectedGroupId.value = selectedGroupId.value === groupId ? null : groupId
}

// Get group member count
const getGroupMemberCount = (groupId: string): number => {
  if (!scene.value) return 0
  const pokemonCount = scene.value.pokemon.filter(p => p.groupId === groupId).length
  const characterCount = scene.value.characters.filter(c => c.groupId === groupId).length
  return pokemonCount + characterCount
}

// Add character to scene
const addCharacter = async (char: { id: string; name: string; avatarUrl: string | null }) => {
  if (!scene.value) return
  try {
    const response = await $fetch<{ success: boolean; data: SceneCharacter }>(
      `/api/scenes/${scene.value.id}/characters`,
      {
        method: 'POST',
        body: {
          characterId: char.id,
          name: char.name,
          avatarUrl: char.avatarUrl
        }
      }
    )
    if (response.success) {
      scene.value.characters = [...scene.value.characters, response.data]
    }
  } catch (error) {
    // Failed to add character
  }
}

// Remove character from scene
const removeCharacter = async (charSceneId: string) => {
  if (!scene.value) return
  try {
    await $fetch(`/api/scenes/${scene.value.id}/characters/${charSceneId}`, { method: 'DELETE' })
    scene.value.characters = scene.value.characters.filter(c => c.id !== charSceneId)
  } catch (error) {
    // Failed to remove character
  }
}

// Add wild pokemon
const addWildPokemon = async () => {
  if (!scene.value || !newPokemonSpecies.value) return
  try {
    const response = await $fetch<{ success: boolean; data: ScenePokemon }>(
      `/api/scenes/${scene.value.id}/pokemon`,
      {
        method: 'POST',
        body: {
          species: newPokemonSpecies.value,
          level: newPokemonLevel.value || 5
        }
      }
    )
    if (response.success) {
      scene.value.pokemon = [...scene.value.pokemon, response.data]
      newPokemonSpecies.value = ''
      newPokemonLevel.value = 5
    }
  } catch (error) {
    // Failed to add pokemon
  }
}

// Remove pokemon from scene
const removePokemon = async (pokemonSceneId: string) => {
  if (!scene.value) return
  try {
    await $fetch(`/api/scenes/${scene.value.id}/pokemon/${pokemonSceneId}`, { method: 'DELETE' })
    scene.value.pokemon = scene.value.pokemon.filter(p => p.id !== pokemonSceneId)
  } catch (error) {
    // Failed to remove pokemon
  }
}

// Get pokemon sprite URL
const getPokemonSprite = (species: string): string => {
  const formattedName = species.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `https://img.pokemondb.net/sprites/black-white/anim/normal/${formattedName}.gif`
}

// Drag and drop for sprites
const startDragSprite = (event: MouseEvent, type: 'pokemon' | 'character', item: ScenePokemon | SceneCharacter) => {
  if (!canvasContainer.value) return
  isDragging.value = true
  dragTarget.value = { type, id: item.id }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !dragTarget.value || !canvasContainer.value || !scene.value) return

    const rect = canvasContainer.value.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    // Clamp to 0-100
    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))

    if (dragTarget.value.type === 'pokemon') {
      const pokemon = scene.value.pokemon.find(p => p.id === dragTarget.value!.id)
      if (pokemon) {
        pokemon.position = { x: clampedX, y: clampedY }
      }
    } else {
      const character = scene.value.characters.find(c => c.id === dragTarget.value!.id)
      if (character) {
        character.position = { x: clampedX, y: clampedY }
      }
    }
  }

  const onMouseUp = async () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    isDragging.value = false
    dragTarget.value = null
    await saveScene()
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// Drag and drop for groups
const startDragGroup = (event: MouseEvent, group: SceneGroup) => {
  if (!canvasContainer.value) return
  isDragging.value = true
  dragTarget.value = { type: 'group', id: group.id }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value || !dragTarget.value || !canvasContainer.value || !scene.value) return

    const rect = canvasContainer.value.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const clampedX = Math.max(0, Math.min(100, x))
    const clampedY = Math.max(0, Math.min(100, y))

    const groupItem = scene.value.groups.find(g => g.id === dragTarget.value!.id)
    if (groupItem) {
      groupItem.position = { x: clampedX, y: clampedY }
    }
  }

  const onMouseUp = async () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    isDragging.value = false
    dragTarget.value = null
    await saveScene()
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style lang="scss" scoped>
.scene-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  margin: -$spacing-xl;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md $spacing-xl;
    background: $color-bg-secondary;
    border-bottom: 1px solid $border-color-default;

    .header-left {
      display: flex;
      align-items: center;
      gap: $spacing-md;
    }

    .back-link {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      color: $color-text-muted;
      text-decoration: none;

      &:hover {
        color: $color-text;
      }
    }

    .scene-name-input {
      font-size: $font-size-xl;
      font-weight: 600;
      background: transparent;
      border: none;
      color: $color-text;
      padding: $spacing-xs;
      border-radius: $border-radius-sm;

      &:hover, &:focus {
        background: $color-bg-tertiary;
        outline: none;
      }
    }
  }

  &__content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: $spacing-md;
  color: $color-text-muted;

  h2 {
    margin: 0;
    color: $color-text;
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Canvas Panel
.canvas-panel {
  flex: 1;
  padding: $spacing-lg;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $shadow-lg;
}

.canvas-background {
  position: relative;
  width: 100%;
  height: 100%;
  background: $color-bg-tertiary;
  background-size: cover;
  background-position: center;
}

.canvas-group {
  position: absolute;
  border: 2px dashed rgba(255, 255, 255, 0.5);
  border-radius: $border-radius-lg;
  background: rgba(0, 0, 0, 0.2);
  transform: translate(-50%, -50%);
  cursor: move;

  &--selected {
    border-color: $color-primary;
    background: rgba($color-primary, 0.1);
  }

  .group-label {
    position: absolute;
    top: -20px;
    left: 0;
    padding: 2px $spacing-sm;
    background: rgba(0, 0, 0, 0.7);
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    color: white;
  }

  .group-delete {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: $color-error;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    display: none;
  }

  &:hover .group-delete {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.canvas-sprite {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: move;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;

  &--pokemon {
    img {
      width: 64px;
      height: 64px;
      object-fit: contain;
      filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, 0.5));
    }
  }

  &--character {
    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: $color-bg-secondary;
      border: 2px solid $color-primary;
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
  }

  .sprite-label {
    padding: 2px $spacing-sm;
    background: rgba(0, 0, 0, 0.8);
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    color: white;
    white-space: nowrap;
  }

  .sprite-delete {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 16px;
    height: 16px;
    padding: 0;
    border: none;
    background: $color-error;
    color: white;
    border-radius: 50%;
    cursor: pointer;
    display: none;
  }

  &:hover .sprite-delete {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

// Properties Panel
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
