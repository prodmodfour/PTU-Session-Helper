<template>
  <div class="lobby-view">
    <!-- Wild Spawn Overlay -->
    <WildSpawnOverlay :wild-spawn="wildSpawnPreview" />

    <!-- Player Lobby -->
    <PlayerLobbyView :players="players" />
  </div>
</template>

<script setup lang="ts">
interface PlayerPokemon {
  id: string
  species: string
  nickname: string | null
  level: number
  types: string[]
  currentHp: number
  maxHp: number
  shiny: boolean
  spriteUrl: string | null
}

interface Player {
  id: string
  name: string
  playedBy: string | null
  level: number
  currentHp: number
  maxHp: number
  avatarUrl: string | null
  trainerClasses: { name: string }[]
  pokemon: PlayerPokemon[]
}

const groupViewStore = useGroupViewStore()

// Wild spawn preview from store
const wildSpawnPreview = computed(() => groupViewStore.wildSpawnPreview)

// Players data for lobby view
const players = ref<Player[]>([])

// Poll for wild spawn
let wildSpawnPollInterval: ReturnType<typeof setInterval> | null = null

const checkForWildSpawn = async () => {
  await groupViewStore.fetchWildSpawnPreview()
}

// Fetch players
const fetchPlayers = async () => {
  try {
    const response = await $fetch<{ success: boolean; data: Player[] }>('/api/characters/players')
    if (response.success) {
      players.value = response.data
    }
  } catch (error) {
    alert('Failed to load players')
  }
}

onMounted(async () => {
  await fetchPlayers()
  await checkForWildSpawn()
  wildSpawnPollInterval = setInterval(checkForWildSpawn, 1000)
})

onUnmounted(() => {
  if (wildSpawnPollInterval) {
    clearInterval(wildSpawnPollInterval)
    wildSpawnPollInterval = null
  }
})
</script>

<style lang="scss" scoped>
.lobby-view {
  min-height: 100vh;
  background: $gradient-bg-radial;
}
</style>
