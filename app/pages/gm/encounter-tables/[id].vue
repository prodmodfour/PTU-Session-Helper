<template>
  <EncounterTableTableEditor
    :table-id="tableId"
    back-link="/gm/encounter-tables"
    back-label="Back to Tables"
  >
    <template #header-actions>
      <button class="btn btn--primary btn--with-icon" @click="generateEncounter">
        <img src="/icons/phosphor/dice-five.svg" alt="" class="btn-icon" />
        Generate
      </button>
    </template>
  </EncounterTableTableEditor>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'gm'
})

const route = useRoute()
const router = useRouter()

const tableId = computed(() => route.params.id as string)

const generateEncounter = () => {
  router.push(`/gm/encounter-tables?generate=${tableId.value}`)
}
</script>

<style lang="scss" scoped>
.btn--with-icon {
  @include btn-with-icon;
}

.btn-icon {
  @include btn-icon-img;
}
</style>
