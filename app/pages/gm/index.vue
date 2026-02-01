<template>
  <div class="gm-encounter">
    <!-- No Active Encounter -->
    <NewEncounterForm
      v-if="!encounter"
      @create="createNewEncounter"
      @loadTemplate="showLoadTemplateModal = true"
    />

    <!-- Active Encounter -->
    <div v-else class="gm-encounter__active">
      <!-- Header -->
      <EncounterHeader
        :encounter="encounter"
        :undo-redo-state="undoRedoState"
        @serve="serveEncounter"
        @unserve="unserveEncounter"
        @undo="handleUndo"
        @redo="handleRedo"
        @start="startEncounter"
        @next-turn="nextTurn"
        @end="endEncounter"
        @save-template="showSaveTemplateModal = true"
        @show-help="showShortcutsHelp = true"
      />

      <!-- View Tabs & Settings Row -->
      <ViewTabsRow
        v-model:active-view="activeView"
        :damage-mode="settingsStore.damageMode"
        @update:damage-mode="settingsStore.setDamageMode($event)"
      />

      <!-- Main Content -->
      <div class="encounter-content">
        <!-- Grid View -->
        <div v-if="activeView === 'grid'" class="grid-view-panel">
          <VTTContainer
            :config="gridConfig"
            :combatants="encounter.combatants"
            :current-turn-id="currentCombatant?.id"
            :is-gm="true"
            :encounter-id="encounter.id"
            @config-update="handleGridConfigUpdate"
            @token-move="handleTokenMove"
            @background-upload="handleBackgroundUpload"
            @background-remove="handleBackgroundRemove"
            @movement-preview-change="handleMovementPreviewChange"
          />
        </div>

        <!-- Combatants Panel (List View) -->
        <CombatantSides
          v-if="activeView === 'list'"
          :player-combatants="playerCombatants"
          :ally-combatants="allyCombatants"
          :enemy-combatants="enemyCombatants"
          :current-combatant="currentCombatant"
          :is-active="encounter.isActive"
          @action="handleAction"
          @damage="handleDamage"
          @heal="handleHeal"
          @remove="removeCombatant"
          @stages="handleStages"
          @status="handleStatus"
          @openActions="handleOpenActions"
          @addCombatant="showAddCombatant"
        />

        <!-- Move Log -->
        <CombatLogPanel :move-log="moveLog" />
      </div>
    </div>

    <!-- Add Combatant Modal -->
    <AddCombatantModal
      v-if="showAddModal"
      :side="addingSide"
      @close="showAddModal = false"
      @add="addCombatant"
    />

    <!-- Save Template Modal -->
    <SaveTemplateModal
      v-if="showSaveTemplateModal && encounter"
      :encounter-id="encounter.id"
      :combatant-count="encounter.combatants.length"
      :has-grid="encounter.gridConfig?.enabled ?? true"
      @close="showSaveTemplateModal = false"
      @saved="handleTemplateSaved"
    />

    <!-- Load Template Modal -->
    <LoadTemplateModal
      v-if="showLoadTemplateModal"
      @close="showLoadTemplateModal = false"
      @load="handleLoadTemplate"
    />

    <!-- Keyboard Shortcuts Help Modal -->
    <Teleport to="body">
      <div v-if="showShortcutsHelp" class="modal-backdrop" @click.self="showShortcutsHelp = false">
        <KeyboardShortcutsHelp @close="showShortcutsHelp = false" />
      </div>
    </Teleport>

    <!-- GM Action Modal -->
    <Teleport to="body">
      <GMActionModal
        v-if="actionModalCombatant && encounter"
        :combatant="actionModalCombatant"
        :all-combatants="encounter.combatants"
        @close="actionModalCombatantId = null"
        @execute-move="handleExecuteMove"
        @execute-action="handleExecuteAction"
        @update-status="handleStatus"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { CombatSide, Combatant, StageModifiers, StatusCondition, GridConfig, GridPosition, MovementPreview } from '~/types'

const { getCombatantName } = useCombatantDisplay()

definePageMeta({
  layout: 'gm'
})

useHead({
  title: 'GM - Encounter'
})

const encounterStore = useEncounterStore()
const libraryStore = useLibraryStore()
const settingsStore = useSettingsStore()
const { send, isConnected, identify, joinEncounter } = useWebSocket()

// Undo/Redo state
const undoRedoState = ref({
  canUndo: false,
  canRedo: false,
  lastActionName: null as string | null,
  nextActionName: null as string | null
})

// Update undo/redo state
const refreshUndoRedoState = () => {
  const state = encounterStore.getUndoRedoState()
  undoRedoState.value = state
}

// Get route for query params
const route = useRoute()
const router = useRouter()

// Load library on mount, initialize history, and set up keyboard shortcuts
onMounted(async () => {
  await libraryStore.loadLibrary()

  // Load settings from localStorage
  settingsStore.loadSettings()

  // Check for loadTemplate query parameter (coming from encounters library)
  const loadTemplateId = route.query.loadTemplate as string | undefined
  if (loadTemplateId) {
    // Clear the query param from URL
    router.replace({ query: {} })
    // Load the template
    try {
      await encounterStore.loadFromTemplate(loadTemplateId)
      encounterStore.initializeHistory()
      refreshUndoRedoState()
    } catch (error) {
      console.error('Failed to load template from URL:', error)
    }
  }

  // If no current encounter, try to load the served encounter
  if (!encounterStore.encounter) {
    await encounterStore.loadServedEncounter()
  }

  // Initialize history if encounter exists
  if (encounterStore.encounter) {
    encounterStore.initializeHistory()
    refreshUndoRedoState()

    // Identify as GM and join the encounter via WebSocket
    if (isConnected.value) {
      identify('gm', encounterStore.encounter.id)
      joinEncounter(encounterStore.encounter.id)
    }
  }

  // Add keyboard shortcuts
  window.addEventListener('keydown', handleKeyboardShortcuts)
})

// Cleanup keyboard shortcuts
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardShortcuts)
})

// Identify as GM when WebSocket connects or when encounter is created
watch(isConnected, (connected) => {
  if (connected) {
    // Identify as GM even without encounter
    identify('gm', encounterStore.encounter?.id)
    if (encounterStore.encounter?.id) {
      joinEncounter(encounterStore.encounter.id)
    }
  }
}, { immediate: true })

// Also identify/join when encounter is created
watch(() => encounterStore.encounter?.id, (encounterId) => {
  if (isConnected.value && encounterId) {
    identify('gm', encounterId)
    joinEncounter(encounterId)
  }
})

// Keyboard shortcuts handler
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  // Ignore if typing in an input/textarea
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }

  // Toggle shortcuts help with ? key
  if (event.key === '?' || (event.shiftKey && event.key === '/')) {
    event.preventDefault()
    showShortcutsHelp.value = !showShortcutsHelp.value
    return
  }

  // Close shortcuts help with Escape
  if (event.key === 'Escape' && showShortcutsHelp.value) {
    showShortcutsHelp.value = false
    return
  }

  // Check for Ctrl/Cmd key for undo/redo
  const isMod = event.ctrlKey || event.metaKey

  if (!isMod) return

  // Undo: Ctrl+Z
  if (event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    handleUndo()
    return
  }

  // Redo: Ctrl+Shift+Z or Ctrl+Y
  if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
    event.preventDefault()
    handleRedo()
    return
  }
}

// View state
const activeView = ref<'list' | 'grid'>('list')


// Add combatant modal
const showAddModal = ref(false)
const addingSide = ref<CombatSide>('players')

// Template modals
const showSaveTemplateModal = ref(false)
const showLoadTemplateModal = ref(false)

// Keyboard shortcuts help
const showShortcutsHelp = ref(false)

// GM Action Modal state - store ID only, compute fresh combatant from store
const actionModalCombatantId = ref<string | null>(null)
const actionModalCombatant = computed(() => {
  if (!actionModalCombatantId.value || !encounter.value) return null
  return encounter.value.combatants.find(c => c.id === actionModalCombatantId.value) || null
})

// Computed from store
const encounter = computed(() => encounterStore.encounter)
const currentCombatant = computed(() => encounterStore.currentCombatant)
const playerCombatants = computed(() => encounterStore.playerCombatants)
const allyCombatants = computed(() => encounterStore.allyCombatants)
const enemyCombatants = computed(() => encounterStore.enemyCombatants)
const moveLog = computed(() => encounterStore.moveLog.slice().reverse())

// Grid config with fallback defaults
const gridConfig = computed(() => encounter.value?.gridConfig ?? {
  enabled: true,
  width: 20,
  height: 15,
  cellSize: 40,
  background: undefined
})

// Actions
const createNewEncounter = async (name: string, battleType: 'trainer' | 'full_contact') => {
  await encounterStore.createEncounter(name, battleType)
  // Initialize history for new encounter
  encounterStore.initializeHistory()
  refreshUndoRedoState()
}

const startEncounter = async () => {
  await encounterStore.startEncounter()
  // Wait for Vue reactivity to process the store update
  await nextTick()
  // Broadcast the encounter start via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

const nextTurn = async () => {
  await encounterStore.nextTurn()
  // Wait for Vue reactivity to process the store update
  await nextTick()
  // Broadcast the turn change via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

const endEncounter = async () => {
  if (confirm('Are you sure you want to end this encounter?')) {
    await encounterStore.endEncounter()
  }
}

const serveEncounter = async () => {
  await encounterStore.serveEncounter()
  // Notify group views via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'serve_encounter',
      data: { encounterId: encounterStore.encounter.id, encounter: encounterStore.encounter }
    })
  }
}

const unserveEncounter = async () => {
  const encounterId = encounterStore.encounter?.id
  await encounterStore.unserveEncounter()
  // Notify group views via WebSocket
  if (encounterId) {
    send({
      type: 'encounter_unserved',
      data: { encounterId }
    })
  }
}

// Undo/Redo handlers
const handleUndo = async () => {
  if (!undoRedoState.value.canUndo) return
  await encounterStore.undoAction()
  refreshUndoRedoState()
}

const handleRedo = async () => {
  if (!undoRedoState.value.canRedo) return
  await encounterStore.redoAction()
  refreshUndoRedoState()
}

const showAddCombatant = (side: CombatSide) => {
  addingSide.value = side
  showAddModal.value = true
}

const addCombatant = async (entityId: string, entityType: 'pokemon' | 'human', initiativeBonus: number) => {
  await encounterStore.addCombatant(entityId, entityType, addingSide.value, initiativeBonus)
  showAddModal.value = false
}

// Template handlers
const handleTemplateSaved = (_templateId: string) => {
  showSaveTemplateModal.value = false
  // Could show a success toast here
}

const handleLoadTemplate = async (data: { templateId: string; encounterName: string }) => {
  try {
    await encounterStore.loadFromTemplate(data.templateId, data.encounterName)
    showLoadTemplateModal.value = false
    // Initialize history for the new encounter
    encounterStore.initializeHistory()
    refreshUndoRedoState()
  } catch (error) {
    console.error('Failed to load template:', error)
  }
}

const removeCombatant = async (combatantId: string) => {
  if (confirm('Remove this combatant?')) {
    await encounterStore.removeCombatant(combatantId)
  }
}

const handleAction = async (combatantId: string, action: { type: string; data: any }) => {
  // Handle different action types based on action.type
  switch (action.type) {
    case 'standard':
      await encounterStore.useStandardAction(combatantId)
      break
    case 'shift':
      await encounterStore.useShiftAction(combatantId)
      break
    case 'swift':
      await encounterStore.useSwiftAction(combatantId)
      break
    default:
      // Other actions can be handled here
      break
  }
}

const handleDamage = async (combatantId: string, damage: number) => {
  // Find combatant name for snapshot
  const combatant = encounter.value?.combatants.find(c => c.id === combatantId)
  const name = getCombatantName(combatant)
  encounterStore.captureSnapshot(`Applied ${damage} damage to ${name}`)
  await encounterStore.applyDamage(combatantId, damage)
  refreshUndoRedoState()
  await nextTick()
  // Broadcast damage update via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

const handleHeal = async (combatantId: string, amount: number, tempHp?: number, healInjuries?: number) => {
  const combatant = encounter.value?.combatants.find(c => c.id === combatantId)
  const name = getCombatantName(combatant)
  const parts: string[] = []
  if (amount > 0) parts.push(`${amount} HP`)
  if (tempHp && tempHp > 0) parts.push(`${tempHp} Temp HP`)
  if (healInjuries && healInjuries > 0) parts.push(`${healInjuries} injury`)
  encounterStore.captureSnapshot(`Healed ${name} (${parts.join(', ')})`)
  await encounterStore.healCombatant(combatantId, amount, tempHp ?? 0, healInjuries ?? 0)
  refreshUndoRedoState()
  await nextTick()
  // Broadcast heal update via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

const handleStages = async (combatantId: string, changes: Partial<StageModifiers>, absolute: boolean) => {
  const combatant = encounter.value?.combatants.find(c => c.id === combatantId)
  const name = getCombatantName(combatant)
  encounterStore.captureSnapshot(`Changed ${name}'s combat stages`)
  await encounterStore.setCombatStages(combatantId, changes as Record<string, number>, absolute)
  refreshUndoRedoState()
  await nextTick()
  // Broadcast stage changes via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

const handleStatus = async (combatantId: string, add: StatusCondition[], remove: StatusCondition[]) => {
  const combatant = encounter.value?.combatants.find(c => c.id === combatantId)
  const name = getCombatantName(combatant)
  const parts: string[] = []
  if (add.length > 0) parts.push(`added ${add.join(', ')}`)
  if (remove.length > 0) parts.push(`removed ${remove.join(', ')}`)
  encounterStore.captureSnapshot(`${name}: ${parts.join('; ')}`)
  await encounterStore.updateStatusConditions(combatantId, add, remove)
  refreshUndoRedoState()
  await nextTick()
  // Broadcast status changes via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

// GM Action Modal handlers
const handleOpenActions = (combatantId: string) => {
  actionModalCombatantId.value = combatantId
}

const handleExecuteMove = async (combatantId: string, moveId: string, targetIds: string[], damage?: number, targetDamages?: Record<string, number>) => {
  const combatant = encounter.value?.combatants.find(c => c.id === combatantId)
  if (!combatant) return

  // moveId could be either the move's id or name - check both
  const moveName = moveId === 'struggle' ? 'Struggle' : (combatant.type === 'pokemon'
    ? ((combatant.entity as any).moves?.find((m: any) => m.id === moveId || m.name === moveId)?.name || moveId)
    : moveId)

  encounterStore.captureSnapshot(`${getCombatantName(combatant)} used ${moveName}`)
  await encounterStore.executeMove(combatantId, moveId, targetIds, damage, targetDamages)
  refreshUndoRedoState()
  await nextTick()

  if (encounterStore.encounter) {
    send({ type: 'encounter_update', data: encounterStore.encounter })
  }

  actionModalCombatantId.value = null
}

// Maneuver name mapping
const maneuverNames: Record<string, string> = {
  'push': 'Push',
  'sprint': 'Sprint',
  'trip': 'Trip',
  'grapple': 'Grapple',
  'intercept-melee': 'Intercept Melee',
  'intercept-ranged': 'Intercept Ranged',
  'take-a-breather': 'Take a Breather'
}

const handleExecuteAction = async (combatantId: string, actionType: string) => {
  const combatant = encounter.value?.combatants.find(c => c.id === combatantId)
  if (!combatant) return

  const name = getCombatantName(combatant)

  // Handle maneuvers (prefixed with 'maneuver:')
  if (actionType.startsWith('maneuver:')) {
    const maneuverId = actionType.replace('maneuver:', '')
    const maneuverName = maneuverNames[maneuverId] || maneuverId
    encounterStore.captureSnapshot(`${name} used ${maneuverName}`)

    // Use standard action for most maneuvers
    if (['push', 'sprint', 'trip', 'grapple'].includes(maneuverId)) {
      await encounterStore.useStandardAction(combatantId)
    }
    // Full actions use both standard and shift
    if (['take-a-breather', 'intercept-melee', 'intercept-ranged'].includes(maneuverId)) {
      await encounterStore.useStandardAction(combatantId)
      await encounterStore.useShiftAction(combatantId)
    }
    // Special handling for Take a Breather
    if (maneuverId === 'take-a-breather') {
      await encounterStore.takeABreather(combatantId)
    }
  } else {
    // Handle standard actions
    switch (actionType) {
      case 'shift':
        encounterStore.captureSnapshot(`${name} used Shift action`)
        await encounterStore.useShiftAction(combatantId)
        break
      case 'pass':
        encounterStore.captureSnapshot(`${name} passed their turn`)
        // Mark turn as complete - both standard and shift actions used
        if (combatant.turnState) {
          combatant.turnState.hasActed = true
          combatant.turnState.standardActionUsed = true
          combatant.turnState.shiftActionUsed = true
        }
        break
    }
  }

  refreshUndoRedoState()
  await nextTick()

  if (encounterStore.encounter) {
    send({ type: 'encounter_update', data: encounterStore.encounter })
  }
}

// VTT Grid handlers
const handleGridConfigUpdate = async (config: GridConfig) => {
  await encounterStore.updateGridConfig(config)
}

const handleTokenMove = async (combatantId: string, position: GridPosition) => {
  const combatant = encounter.value?.combatants.find(c => c.id === combatantId)
  const name = getCombatantName(combatant)
  encounterStore.captureSnapshot(`Moved ${name} to (${position.x}, ${position.y})`)
  await encounterStore.updateCombatantPosition(combatantId, position)
  refreshUndoRedoState()
  await nextTick()
  // Broadcast the updated encounter state via WebSocket
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

const handleBackgroundUpload = async (file: File) => {
  try {
    await encounterStore.uploadBackgroundImage(file)
  } catch (error) {
    console.error('Failed to upload background:', error)
  }
}

const handleBackgroundRemove = async () => {
  try {
    await encounterStore.removeBackgroundImage()
  } catch (error) {
    console.error('Failed to remove background:', error)
  }
}

// Broadcast movement preview to group view via WebSocket
const handleMovementPreviewChange = (preview: MovementPreview | null) => {
  send({
    type: 'movement_preview',
    data: preview
  })
}
</script>

<style lang="scss" scoped>
.btn--ghost {
  background: transparent;
  border: 1px solid $glass-border;
  color: $color-text-muted;

  &:hover {
    border-color: $color-primary;
    color: $color-text;
  }
}

.encounter-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: $spacing-lg;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.grid-view-panel {
  grid-column: 1 / -1;
}

.map-view-panel {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
</style>
