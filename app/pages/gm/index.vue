<template>
  <div class="gm-encounter">
    <!-- No Active Encounter -->
    <div v-if="!encounter" class="gm-encounter__empty">
      <h2>No Active Encounter</h2>
      <p>Start a new encounter or load an existing one.</p>

      <div class="gm-encounter__new">
        <div class="form-group">
          <label>Encounter Name</label>
          <input
            v-model="newEncounterName"
            type="text"
            class="form-input"
            placeholder="Route 1 Wild Battle"
          />
        </div>

        <div class="form-group">
          <label>Battle Type</label>
          <select v-model="newBattleType" class="form-select">
            <option value="trainer">Trainer Battle</option>
            <option value="full_contact">Full Contact</option>
          </select>
        </div>

        <button class="btn btn--primary" @click="createNewEncounter">
          Start New Encounter
        </button>

        <div class="template-options">
          <span class="template-divider">or</span>
          <button class="btn btn--secondary btn--with-icon" @click="showLoadTemplateModal = true">
            <img src="/icons/phosphor/folder-open.svg" alt="" class="btn-svg" />
            Load from Template
          </button>
          <NuxtLink to="/gm/encounters" class="btn btn--ghost">
            Browse Library
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Active Encounter -->
    <div v-else class="gm-encounter__active">
      <!-- Header -->
      <div class="encounter-header">
        <div class="encounter-header__info">
          <h2>{{ encounter.name }}</h2>
          <div class="encounter-header__meta">
            <span class="badge" :class="encounter.battleType === 'trainer' ? 'badge--blue' : 'badge--red'">
              {{ encounter.battleType === 'trainer' ? 'Trainer Battle' : 'Full Contact' }}
            </span>
            <span class="badge badge--gray">Round {{ encounter.currentRound }}</span>
            <span v-if="encounter.isPaused" class="badge badge--yellow">Paused</span>
            <span v-if="encounter.isServed" class="badge badge--green">
              <img src="/icons/phosphor/monitor.svg" alt="" class="badge-icon" /> Served to Group
            </span>
          </div>
        </div>

        <div class="encounter-header__actions">
          <!-- Serve/Unserve Buttons -->
          <button
            v-if="!encounter.isServed"
            class="btn btn--secondary btn--with-icon"
            @click="serveEncounter"
            title="Display this encounter on Group View"
          >
            <img src="/icons/phosphor/monitor.svg" alt="" class="btn-svg" />
            Serve to Group
          </button>
          <button
            v-else
            class="btn btn--warning btn--with-icon"
            @click="unserveEncounter"
            title="Stop displaying this encounter on Group View"
          >
            <img src="/icons/phosphor/monitor.svg" alt="" class="btn-svg" />
            Unserve
          </button>

          <!-- Undo/Redo Buttons -->
          <div class="undo-redo-group">
            <button
              class="btn btn--secondary btn--icon btn--with-icon"
              :disabled="!undoRedoState.canUndo"
              :title="undoRedoState.canUndo ? `Undo: ${undoRedoState.lastActionName}` : 'Nothing to undo'"
              @click="handleUndo"
            >
              <img src="/icons/phosphor/arrow-counter-clockwise.svg" alt="" class="btn-svg" />
              Undo
            </button>
            <button
              class="btn btn--secondary btn--icon btn--with-icon"
              :disabled="!undoRedoState.canRedo"
              :title="undoRedoState.canRedo ? `Redo: ${undoRedoState.nextActionName}` : 'Nothing to redo'"
              @click="handleRedo"
            >
              <img src="/icons/phosphor/arrow-clockwise.svg" alt="" class="btn-svg" />
              Redo
            </button>
          </div>

          <button
            v-if="!encounter.isActive"
            class="btn btn--success"
            @click="startEncounter"
            :disabled="encounter.combatants.length === 0"
          >
            Start Combat
          </button>
          <button
            v-else
            class="btn btn--primary"
            @click="nextTurn"
          >
            Next Turn
          </button>
          <button class="btn btn--danger" @click="endEncounter">
            End Encounter
          </button>
          <button
            class="btn btn--ghost btn--with-icon"
            @click="showSaveTemplateModal = true"
            title="Save current setup as a reusable template"
          >
            <img src="/icons/phosphor/floppy-disk.svg" alt="" class="btn-svg" />
            Save Template
          </button>
          <button
            class="btn btn--ghost btn--icon-only"
            @click="showShortcutsHelp = true"
            title="Keyboard shortcuts (?)"
            data-testid="help-btn"
          >
            <img src="/icons/phosphor/question.svg" alt="" class="btn-svg btn-svg--icon-only" />
          </button>
        </div>
      </div>

      <!-- View Tabs & Settings Row -->
      <div class="view-tabs-row">
        <div class="view-tabs">
          <button
            class="view-tab"
            :class="{ 'view-tab--active': activeView === 'list' }"
            @click="activeView = 'list'"
            data-testid="list-view-tab"
          >
            <img src="/icons/phosphor/list.svg" alt="" class="view-tab__icon" />
            List View
          </button>
          <button
            class="view-tab"
            :class="{ 'view-tab--active': activeView === 'grid' }"
            @click="activeView = 'grid'"
            data-testid="grid-view-tab"
          >
            <img src="/icons/phosphor/map-trifold.svg" alt="" class="view-tab__icon" />
            Grid View
          </button>
        </div>

        <!-- Damage Mode Toggle -->
        <div class="damage-mode-toggle">
          <span class="damage-mode-label">Damage Mode:</span>
          <button
            class="damage-mode-btn"
            :class="{ 'damage-mode-btn--active': settingsStore.damageMode === 'set' }"
            @click="settingsStore.setDamageMode('set')"
            title="Use fixed average damage values"
            data-testid="set-damage-btn"
          >
            <img src="/icons/phosphor/chart-bar.svg" alt="" class="damage-mode-btn__icon" />
            Set
          </button>
          <button
            class="damage-mode-btn"
            :class="{ 'damage-mode-btn--active': settingsStore.damageMode === 'rolled' }"
            @click="settingsStore.setDamageMode('rolled')"
            title="Roll dice for damage"
            data-testid="rolled-damage-btn"
          >
            <img src="/icons/phosphor/dice-five.svg" alt="" class="damage-mode-btn__icon" />
            Rolled
          </button>
        </div>
      </div>

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
        <div v-else class="combatants-panel">
          <!-- Current Turn Indicator -->
          <div v-if="currentCombatant && encounter.isActive" class="current-turn">
            <h3>Current Turn</h3>
            <CombatantCard
              :combatant="currentCombatant"
              :is-current="true"
              :is-gm="true"
              @action="handleAction"
              @damage="handleDamage"
              @heal="handleHeal"
              @stages="handleStages"
              @status="handleStatus"
              @openActions="handleOpenActions"
            />
          </div>

          <!-- Sides -->
          <div class="sides-grid">
            <!-- Players -->
            <div class="side side--players">
              <div class="side__header">
                <h3>Players</h3>
                <button class="btn btn--sm btn--secondary" @click="showAddCombatant('players')">
                  + Add
                </button>
              </div>
              <div class="side__combatants">
                <CombatantCard
                  v-for="combatant in playerCombatants"
                  :key="combatant.id"
                  :combatant="combatant"
                  :is-current="combatant.id === currentCombatant?.id"
                  :is-gm="true"
                  @action="handleAction"
                  @damage="handleDamage"
                  @heal="handleHeal"
                  @remove="removeCombatant"
                  @stages="handleStages"
                  @status="handleStatus"
                  @openActions="handleOpenActions"
                />
                <p v-if="playerCombatants.length === 0" class="side__empty">
                  No players added
                </p>
              </div>
            </div>

            <!-- Allies -->
            <div class="side side--allies">
              <div class="side__header">
                <h3>Allies</h3>
                <button class="btn btn--sm btn--secondary" @click="showAddCombatant('allies')">
                  + Add
                </button>
              </div>
              <div class="side__combatants">
                <CombatantCard
                  v-for="combatant in allyCombatants"
                  :key="combatant.id"
                  :combatant="combatant"
                  :is-current="combatant.id === currentCombatant?.id"
                  :is-gm="true"
                  @action="handleAction"
                  @damage="handleDamage"
                  @heal="handleHeal"
                  @remove="removeCombatant"
                  @stages="handleStages"
                  @status="handleStatus"
                  @openActions="handleOpenActions"
                />
                <p v-if="allyCombatants.length === 0" class="side__empty">
                  No allies
                </p>
              </div>
            </div>

            <!-- Enemies -->
            <div class="side side--enemies">
              <div class="side__header">
                <h3>Enemies</h3>
                <button class="btn btn--sm btn--secondary" @click="showAddCombatant('enemies')">
                  + Add
                </button>
              </div>
              <div class="side__combatants">
                <CombatantCard
                  v-for="combatant in enemyCombatants"
                  :key="combatant.id"
                  :combatant="combatant"
                  :is-current="combatant.id === currentCombatant?.id"
                  :is-gm="true"
                  @action="handleAction"
                  @damage="handleDamage"
                  @heal="handleHeal"
                  @remove="removeCombatant"
                  @stages="handleStages"
                  @status="handleStatus"
                  @openActions="handleOpenActions"
                />
                <p v-if="enemyCombatants.length === 0" class="side__empty">
                  No enemies
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Move Log -->
        <div class="move-log-panel">
          <h3>Combat Log</h3>
          <div class="move-log">
            <div
              v-for="entry in moveLog"
              :key="entry.id"
              class="move-log__entry"
            >
              <span class="move-log__round">R{{ entry.round }}</span>
              <span class="move-log__actor">{{ entry.actorName }}</span>
              <span class="move-log__move">{{ entry.moveName }}</span>
              <span class="move-log__targets">
                → {{ entry.targets.map(t => t.name).join(', ') }}
              </span>
            </div>
            <p v-if="moveLog.length === 0" class="move-log__empty">
              No actions yet
            </p>
          </div>
        </div>
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
        @close="actionModalCombatant = null"
        @execute-move="handleExecuteMove"
        @execute-action="handleExecuteAction"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { CombatSide, Combatant, StageModifiers, StatusCondition, GridConfig, GridPosition, HumanCharacter, Pokemon, MovementPreview } from '~/types'

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

// Load library on mount, initialize history, and set up keyboard shortcuts
onMounted(async () => {
  await libraryStore.loadLibrary()

  // Load settings from localStorage
  settingsStore.loadSettings()

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

// New encounter form
const newEncounterName = ref('')
const newBattleType = ref<'trainer' | 'full_contact'>('trainer')

// Add combatant modal
const showAddModal = ref(false)
const addingSide = ref<CombatSide>('players')

// Template modals
const showSaveTemplateModal = ref(false)
const showLoadTemplateModal = ref(false)

// Keyboard shortcuts help
const showShortcutsHelp = ref(false)

// GM Action Modal state
const actionModalCombatant = ref<Combatant | null>(null)

// Computed from store
const encounter = computed(() => encounterStore.encounter)
const currentCombatant = computed(() => encounterStore.currentCombatant)
const playerCombatants = computed(() => encounterStore.playerCombatants)
const allyCombatants = computed(() => encounterStore.allyCombatants)
const enemyCombatants = computed(() => encounterStore.enemyCombatants)
const moveLog = computed(() => encounterStore.moveLog.slice().reverse())

// Helper to get combatant display name with proper type narrowing
const getCombatantName = (combatant?: Combatant): string => {
  if (!combatant?.entity) return 'Unknown'
  if (combatant.type === 'human') {
    return (combatant.entity as HumanCharacter).name
  } else {
    const pokemon = combatant.entity as Pokemon
    return pokemon.nickname ?? pokemon.species
  }
}

// Grid config with fallback defaults
const gridConfig = computed(() => encounter.value?.gridConfig ?? {
  enabled: true,
  width: 20,
  height: 15,
  cellSize: 40,
  background: undefined
})

// Actions
const createNewEncounter = async () => {
  const name = newEncounterName.value.trim() || 'New Encounter'
  await encounterStore.createEncounter(name, newBattleType.value)
  newEncounterName.value = ''
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
    console.log('[GM] Sending encounter_update after nextTurn')
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  } else {
    console.log('[GM] No encounter to send after nextTurn')
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
  console.log('[GM] handleOpenActions called with:', combatantId)
  const combatant = encounter.value?.combatants.find(c => c.id === combatantId)
  console.log('[GM] Found combatant:', combatant?.id, combatant?.type)
  if (combatant) {
    actionModalCombatant.value = combatant
    console.log('[GM] actionModalCombatant set to:', actionModalCombatant.value?.id)
  }
}

const handleExecuteMove = async (combatantId: string, moveId: string, targetIds: string[], damage?: number) => {
  const combatant = encounter.value?.combatants.find(c => c.id === combatantId)
  if (!combatant) return

  const moveName = moveId === 'struggle' ? 'Struggle' : (combatant.type === 'pokemon'
    ? ((combatant.entity as any).moves?.find((m: any) => m.id === moveId)?.name || moveId)
    : moveId)

  encounterStore.captureSnapshot(`${getCombatantName(combatant)} used ${moveName}`)
  await encounterStore.executeMove(combatantId, moveId, targetIds, damage)
  refreshUndoRedoState()
  await nextTick()

  if (encounterStore.encounter) {
    send({ type: 'encounter_update', data: encounterStore.encounter })
  }

  actionModalCombatant.value = null
}

const handleExecuteAction = async (combatantId: string, actionType: 'shift' | 'struggle' | 'pass') => {
  const combatant = encounter.value?.combatants.find(c => c.id === combatantId)
  if (!combatant) return

  const name = getCombatantName(combatant)

  switch (actionType) {
    case 'shift':
      encounterStore.captureSnapshot(`${name} used Shift action`)
      await encounterStore.useShiftAction(combatantId)
      break
    case 'pass':
      encounterStore.captureSnapshot(`${name} passed their turn`)
      // Mark turn as complete - both standard and shift actions used
      combatant.turnState.hasActed = true
      combatant.turnState.standardActionUsed = true
      combatant.turnState.shiftActionUsed = true
      break
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
.gm-encounter {
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;

    h2 {
      margin-bottom: $spacing-sm;
      color: $color-text;
    }

    p {
      color: $color-text-muted;
      margin-bottom: $spacing-xl;
    }
  }

  &__new {
    background: $glass-bg;
    backdrop-filter: $glass-blur;
    border: 1px solid $glass-border;
    padding: $spacing-xl;
    border-radius: $border-radius-lg;
    width: 100%;
    max-width: 400px;
    box-shadow: $shadow-lg;

    .form-group {
      margin-bottom: $spacing-md;
    }

    .btn {
      width: 100%;
      margin-top: $spacing-md;
    }
  }
}

.template-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $glass-border;

  .btn {
    margin-top: 0;
  }
}

.template-divider {
  color: $color-text-muted;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn--ghost {
  background: transparent;
  border: 1px solid $glass-border;
  color: $color-text-muted;

  &:hover {
    border-color: $color-primary;
    color: $color-text;
  }
}

.encounter-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $glass-border;

  &__info {
    h2 {
      margin-bottom: $spacing-sm;
      color: $color-text;
    }
  }

  &__meta {
    display: flex;
    gap: $spacing-sm;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
  }
}

.undo-redo-group {
  display: flex;
  gap: $spacing-xs;
  padding: 0 $spacing-sm;
  border-left: 1px solid $glass-border;
  border-right: 1px solid $glass-border;
  margin: 0 $spacing-xs;

  .btn {
    min-width: auto;
    padding: $spacing-xs $spacing-sm;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-icon {
      font-size: 1.1em;
    }
  }
}

// Button with icon styles
.btn-svg {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
  opacity: 0.9;

  &--icon-only {
    width: 18px;
    height: 18px;
  }
}

.btn--with-icon {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;

  &--blue {
    background: $gradient-scarlet;
    box-shadow: 0 0 8px rgba($color-accent-scarlet, 0.3);
  }
  &--red {
    background: $gradient-scarlet;
    box-shadow: 0 0 8px rgba($color-accent-scarlet, 0.3);
  }
  &--gray {
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
  }
  &--yellow {
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    color: $color-text-dark;
  }
  &--green {
    background: linear-gradient(135deg, $color-success 0%, #34d399 100%);
    box-shadow: 0 0 8px rgba($color-success, 0.4);
  }
}

.badge-icon {
  width: 12px;
  height: 12px;
  filter: brightness(0) invert(1);
}

.encounter-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: $spacing-lg;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.combatants-panel {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
}

.current-turn {
  background: linear-gradient(135deg, rgba($color-accent-scarlet, 0.15) 0%, rgba($color-accent-violet, 0.1) 100%);
  border: 2px solid $color-accent-scarlet;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-glow-scarlet;

  h3 {
    margin-bottom: $spacing-md;
    background: $gradient-sv-cool;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
  }
}

.sides-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-lg;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.side {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;

  &--players {
    border-top: 3px solid $color-accent-scarlet;
  }

  &--allies {
    border-top: 3px solid $color-success;
  }

  &--enemies {
    border-top: 3px solid $color-accent-scarlet;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    h3 {
      margin: 0;
      font-size: $font-size-md;
      font-weight: 600;
    }
  }

  &__combatants {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__empty {
    color: $color-text-muted;
    font-size: $font-size-sm;
    text-align: center;
    padding: $spacing-lg;
    font-style: italic;
  }
}

.move-log-panel {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  height: fit-content;
  max-height: 600px;
  overflow-y: auto;

  h3 {
    margin-bottom: $spacing-md;
    font-size: $font-size-md;
    font-weight: 600;
  }
}

.move-log {
  &__entry {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    padding: $spacing-sm;
    border-bottom: 1px solid $border-color-default;
    font-size: $font-size-sm;

    &:last-child {
      border-bottom: none;
    }
  }

  &__round {
    background: $color-bg-tertiary;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;
    font-weight: 600;
    font-size: $font-size-xs;
  }

  &__actor {
    font-weight: 600;
    color: $color-accent-scarlet;
  }

  &__move {
    color: $color-text-muted;
  }

  &__targets {
    color: $color-text-muted;
  }

  &__empty {
    color: $color-text-muted;
    text-align: center;
    padding: $spacing-lg;
    font-style: italic;
  }
}

.view-tabs-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;
  flex-wrap: wrap;
}

.view-tabs {
  display: flex;
  gap: $spacing-sm;
}

.view-tab {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-lg;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  color: $color-text-muted;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &__icon {
    width: 16px;
    height: 16px;
    filter: brightness(0) invert(0.5);
    transition: filter 0.2s ease;
  }

  &:hover {
    background: $color-bg-secondary;
    color: $color-text;

    .view-tab__icon {
      filter: brightness(0) invert(1);
    }
  }

  &--active {
    background: $gradient-scarlet;
    border-color: transparent;
    color: $color-text;
    box-shadow: $shadow-glow-scarlet;

    .view-tab__icon {
      filter: brightness(0) invert(1);
    }
  }
}

.damage-mode-toggle {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-md;
  padding: $spacing-xs $spacing-sm;
}

.damage-mode-label {
  font-size: $font-size-sm;
  color: $color-text-muted;
  font-weight: 500;
}

.damage-mode-btn {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: transparent;
  border: 1px solid transparent;
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  font-size: $font-size-sm;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &__icon {
    width: 14px;
    height: 14px;
    filter: brightness(0) invert(0.5);
    transition: filter 0.2s ease;
  }

  &:hover {
    background: $color-bg-tertiary;
    color: $color-text;

    .damage-mode-btn__icon {
      filter: brightness(0) invert(1);
    }
  }

  &--active {
    background: rgba($color-accent-teal, 0.2);
    border-color: $color-accent-teal;
    color: $color-accent-teal;

    .damage-mode-btn__icon {
      filter: brightness(0) saturate(100%) invert(80%) sepia(30%) saturate(700%) hue-rotate(120deg);
    }
  }
}

.grid-view-panel {
  grid-column: 1 / -1;
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
