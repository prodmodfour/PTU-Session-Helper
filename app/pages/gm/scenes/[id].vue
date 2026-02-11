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
        <SceneCanvas
          :scene="scene"
          :selected-group-id="selectedGroupId"
          @update:positions="handlePositionUpdate"
          @resize-group="handleGroupResize"
          @select-group="selectGroup"
          @delete-group="deleteGroup"
          @remove-pokemon="removePokemon"
          @remove-character="removeCharacter"
        />

        <!-- Right Panel: Properties -->
        <ScenePropertiesPanel
          :scene="scene"
          :selected-group-id="selectedGroupId"
          @update:scene="handleSceneFieldUpdate"
          @toggle-terrain="toggleTerrain"
          @create-group="createGroup"
          @delete-group="deleteGroup"
          @select-group="selectGroup"
          @rename-group="handleRenameGroup"
        >
          <SceneAddPanel
            :available-characters="availableCharacters"
            @add-character="addCharacter"
            @add-pokemon="addWildPokemon"
          />
        </ScenePropertiesPanel>
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
  PhStop
} from '@phosphor-icons/vue'
import type { Scene, ScenePokemon, SceneCharacter, SceneGroup, ScenePosition } from '~/stores/groupViewTabs'

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
    alert('Failed to load scene data')
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
    alert('Failed to save scene')
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
    alert('Failed to activate scene')
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
    alert('Failed to deactivate scene')
  }
}

// Handle scene field updates from properties panel
const handleSceneFieldUpdate = (field: string, value: any) => {
  if (!scene.value) return
  scene.value = { ...scene.value, [field]: value }
  saveScene()
}

// Handle terrain toggle from properties panel
const toggleTerrain = (terrain: string) => {
  if (!scene.value) return
  const index = scene.value.terrains.indexOf(terrain)
  if (index === -1) {
    scene.value = { ...scene.value, terrains: [...scene.value.terrains, terrain] }
  } else {
    scene.value = { ...scene.value, terrains: scene.value.terrains.filter(t => t !== terrain) }
  }
  saveScene()
}

// Handle group rename from properties panel
const handleRenameGroup = (groupId: string, name: string) => {
  if (!scene.value) return
  scene.value = {
    ...scene.value,
    groups: scene.value.groups.map(g =>
      g.id === groupId ? { ...g, name } : g
    )
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
    alert('Failed to create group')
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
    alert('Failed to delete group')
  }
}

// Select group
const selectGroup = (groupId: string) => {
  selectedGroupId.value = selectedGroupId.value === groupId ? null : groupId
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
    alert('Failed to add character to scene')
  }
}

// Remove character from scene
const removeCharacter = async (charSceneId: string) => {
  if (!scene.value) return
  try {
    await $fetch(`/api/scenes/${scene.value.id}/characters/${charSceneId}`, { method: 'DELETE' })
    scene.value.characters = scene.value.characters.filter(c => c.id !== charSceneId)
  } catch (error) {
    alert('Failed to remove character from scene')
  }
}

// Add wild pokemon
const addWildPokemon = async (species: string, level: number) => {
  if (!scene.value) return
  try {
    const response = await $fetch<{ success: boolean; data: ScenePokemon }>(
      `/api/scenes/${scene.value.id}/pokemon`,
      {
        method: 'POST',
        body: { species, level }
      }
    )
    if (response.success) {
      scene.value = {
        ...scene.value,
        pokemon: [...scene.value.pokemon, response.data]
      }
    }
  } catch (error) {
    alert('Failed to add Pokemon to scene')
  }
}

// Remove pokemon from scene
const removePokemon = async (pokemonSceneId: string) => {
  if (!scene.value) return
  try {
    await $fetch(`/api/scenes/${scene.value.id}/pokemon/${pokemonSceneId}`, { method: 'DELETE' })
    scene.value.pokemon = scene.value.pokemon.filter(p => p.id !== pokemonSceneId)
  } catch (error) {
    alert('Failed to remove Pokemon from scene')
  }
}

// Handle group resize from canvas
const handleGroupResize = async (groupId: string, position: ScenePosition, width: number, height: number) => {
  if (!scene.value) return
  scene.value = {
    ...scene.value,
    groups: scene.value.groups.map(g =>
      g.id === groupId ? { ...g, position, width, height } : g
    )
  }
  try {
    await $fetch(`/api/scenes/${scene.value.id}/groups/${groupId}`, {
      method: 'PUT',
      body: { position, width, height }
    })
  } catch (error) {
    alert('Failed to resize group')
  }
}

// Handle position update from canvas (with optional group assignment)
const handlePositionUpdate = async (type: 'pokemon' | 'character' | 'group', id: string, position: ScenePosition, groupId?: string | null) => {
  if (!scene.value) return
  if (type === 'pokemon') {
    scene.value = {
      ...scene.value,
      pokemon: scene.value.pokemon.map(p =>
        p.id === id ? { ...p, position, groupId: groupId !== undefined ? groupId : p.groupId } : p
      )
    }
    await groupViewTabsStore.updatePositions(scene.value.id, {
      pokemon: [{ id, position, ...(groupId !== undefined && { groupId }) }]
    })
  } else if (type === 'character') {
    scene.value = {
      ...scene.value,
      characters: scene.value.characters.map(c =>
        c.id === id ? { ...c, position, groupId: groupId !== undefined ? groupId : c.groupId } : c
      )
    }
    await groupViewTabsStore.updatePositions(scene.value.id, {
      characters: [{ id, position, ...(groupId !== undefined && { groupId }) }]
    })
  } else {
    scene.value = {
      ...scene.value,
      groups: scene.value.groups.map(g =>
        g.id === id ? { ...g, position } : g
      )
    }
    await groupViewTabsStore.updatePositions(scene.value.id, {
      groups: [{ id, position }]
    })
  }
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


</style>
