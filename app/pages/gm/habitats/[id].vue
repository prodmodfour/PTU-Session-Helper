<template>
  <EncounterTableTableEditor
    :table-id="tableId"
    back-link="/gm/habitats"
    back-label="Back to Habitats"
  >
    <template #header-actions>
      <button class="btn btn--primary btn--with-icon" @click="showGenerateModal = true">
        <img src="/icons/phosphor/dice-five.svg" alt="" class="btn-icon" />
        Generate
      </button>
      <button class="btn btn--danger btn--with-icon" @click="showDeleteModal = true">
        <img src="/icons/phosphor/trash.svg" alt="" class="btn-icon" />
        Delete
      </button>
    </template>

    <template #after="{ table }">
      <GenerateEncounterModal
        v-if="showGenerateModal && table"
        :table="table"
        :has-active-encounter="!!encounterStore.encounter"
        :add-error="addError"
        :adding-to-encounter="addingToEncounter"
        :scenes="availableScenes"
        @close="showGenerateModal = false; addError = null"
        @add-to-encounter="handleAddToEncounter"
        @add-to-scene="handleAddToScene"
      />

      <ConfirmModal
        v-if="showDeleteModal"
        title="Delete Encounter Table"
        :message="`Are you sure you want to delete '${table?.name}'? This will also delete all modifications and entries.`"
        confirm-text="Delete"
        confirm-class="btn--danger"
        @confirm="handleDelete"
        @cancel="showDeleteModal = false"
      />
    </template>
  </EncounterTableTableEditor>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'gm'
})

const route = useRoute()
const router = useRouter()
const tablesStore = useEncounterTablesStore()
const encounterStore = useEncounterStore()
const groupViewTabsStore = useGroupViewTabsStore()

const tableId = computed(() => route.params.id as string)

// Generate modal state
const showGenerateModal = ref(false)
const addingToEncounter = ref(false)
const addError = ref<string | null>(null)

// Delete modal state
const showDeleteModal = ref(false)

// Scene integration
const availableScenes = computed(() => groupViewTabsStore.scenes)

onMounted(() => {
  groupViewTabsStore.fetchScenes()
})

const handleAddToScene = async (sceneId: string, pokemon: Array<{ speciesId: string; speciesName: string; level: number }>) => {
  addError.value = null
  try {
    for (const p of pokemon) {
      await $fetch(`/api/scenes/${sceneId}/pokemon`, {
        method: 'POST',
        body: { species: p.speciesName, level: p.level, speciesId: p.speciesId }
      })
    }
    showGenerateModal.value = false
  } catch (e: unknown) {
    addError.value = e instanceof Error ? e.message : 'Failed to add Pokemon to scene'
  }
}

const handleAddToEncounter = async (pokemon: Array<{ speciesId: string; speciesName: string; level: number }>) => {
  addingToEncounter.value = true
  addError.value = null

  try {
    const tableName = tablesStore.getTableById(tableId.value)?.name || 'Wild Encounter'
    await encounterStore.createEncounter(tableName, 'full_contact')
    await encounterStore.addWildPokemon(pokemon, 'enemies')
    await encounterStore.serveEncounter()

    showGenerateModal.value = false
    router.push('/gm')
  } catch (e: unknown) {
    addError.value = e instanceof Error ? e.message : 'Failed to add Pokemon to encounter'
  } finally {
    addingToEncounter.value = false
  }
}

const handleDelete = async () => {
  await tablesStore.deleteTable(tableId.value)
  router.push('/gm/habitats')
}
</script>

<style lang="scss" scoped>
.btn--with-icon {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
}

.btn-icon {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}
</style>
