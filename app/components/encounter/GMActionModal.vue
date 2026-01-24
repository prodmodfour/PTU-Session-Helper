<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="gm-action-modal">
      <!-- Header -->
      <div class="gm-action-modal__header">
        <div class="header-info">
          <img
            v-if="isPokemon"
            :src="spriteUrl"
            :alt="displayName"
            class="header-info__sprite"
          />
          <div v-else class="header-info__avatar">
            <span>{{ displayName.charAt(0) }}</span>
          </div>
          <div class="header-info__text">
            <h2>{{ displayName }}</h2>
            <div v-if="isPokemon" class="header-info__types">
              <span
                v-for="type in (combatant.entity as Pokemon).types"
                :key="type"
                class="type-badge"
                :class="`type-badge--${type.toLowerCase()}`"
              >
                {{ type }}
              </span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <span class="action-count">
            <span class="action-count__label">Standard:</span>
            <span :class="{ 'action-count--used': turnState.standardActionUsed }">
              {{ turnState.standardActionUsed ? 0 : 1 }}
            </span>
          </span>
          <span class="action-count">
            <span class="action-count__label">Shift:</span>
            <span :class="{ 'action-count--used': turnState.shiftActionUsed }">
              {{ turnState.shiftActionUsed ? 0 : 1 }}
            </span>
          </span>
        </div>
        <button class="modal__close" @click="$emit('close')">&times;</button>
      </div>

      <!-- Body -->
      <div class="gm-action-modal__body">
        <!-- Moves Section (Pokemon only) -->
        <div v-if="isPokemon && moves.length > 0" class="action-section">
          <h3>Moves</h3>
          <div class="move-list">
            <button
              v-for="move in moves"
              :key="move.id || move.name"
              class="move-btn"
              :class="`move-btn--${move.type?.toLowerCase() || 'normal'}`"
              :disabled="turnState.standardActionUsed"
              @click="selectMove(move)"
            >
              <div class="move-btn__main">
                <span class="move-btn__name">{{ move.name }}</span>
                <span class="move-btn__type">{{ move.type }}</span>
              </div>
              <div class="move-btn__details">
                <span v-if="move.damageBase" class="move-btn__damage">
                  DB {{ move.damageBase }}
                </span>
                <span class="move-btn__frequency">{{ move.frequency }}</span>
                <span v-if="move.ac !== null" class="move-btn__ac">AC {{ move.ac }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Standard Actions Section -->
        <div class="action-section">
          <h3>Standard Actions</h3>
          <div class="standard-actions">
            <button
              class="action-btn action-btn--shift"
              :disabled="turnState.shiftActionUsed"
              @click="executeStandardAction('shift')"
            >
              <span class="action-btn__icon">
                <img src="/icons/phosphor/arrows-out-cardinal.svg" alt="" class="action-icon" />
              </span>
              <span class="action-btn__text">
                <span class="action-btn__name">Shift</span>
                <span class="action-btn__desc">Move 1 meter</span>
              </span>
            </button>

            <button
              v-if="isPokemon"
              class="action-btn action-btn--struggle"
              :disabled="turnState.standardActionUsed"
              @click="selectStruggle"
            >
              <span class="action-btn__icon">
                <img src="/icons/phosphor/hand-fist.svg" alt="" class="action-icon" />
              </span>
              <span class="action-btn__text">
                <span class="action-btn__name">Struggle</span>
                <span class="action-btn__desc">DB 4 Typeless attack</span>
              </span>
            </button>

            <button
              class="action-btn action-btn--pass"
              @click="executeStandardAction('pass')"
            >
              <span class="action-btn__icon">
                <img src="/icons/phosphor/skip-forward.svg" alt="" class="action-icon" />
              </span>
              <span class="action-btn__text">
                <span class="action-btn__name">Pass Turn</span>
                <span class="action-btn__desc">End this combatant's turn</span>
              </span>
            </button>
          </div>
        </div>

        <!-- Combat Maneuvers Section -->
        <div class="action-section">
          <button class="section-toggle" @click="showManeuvers = !showManeuvers">
            <h3>Combat Maneuvers</h3>
            <span class="section-toggle__icon" :class="{ 'section-toggle__icon--open': showManeuvers }">
              ▼
            </span>
          </button>
          <div v-if="showManeuvers" class="maneuvers-grid">
            <button
              v-for="maneuver in maneuvers"
              :key="maneuver.id"
              class="maneuver-btn"
              :class="`maneuver-btn--${maneuver.actionType}`"
              :disabled="isManeuverDisabled(maneuver)"
              @click="selectManeuver(maneuver)"
            >
              <div class="maneuver-btn__header">
                <img :src="maneuver.icon" alt="" class="maneuver-btn__icon" />
                <span class="maneuver-btn__name">{{ maneuver.name }}</span>
              </div>
              <div class="maneuver-btn__meta">
                <span class="maneuver-btn__action">{{ maneuver.actionLabel }}</span>
                <span v-if="maneuver.ac" class="maneuver-btn__ac">AC {{ maneuver.ac }}</span>
              </div>
              <p class="maneuver-btn__desc">{{ maneuver.shortDesc }}</p>
            </button>
          </div>
        </div>

        <!-- Status Conditions Section -->
        <div class="action-section">
          <button class="section-toggle" @click="showConditions = !showConditions">
            <h3>Status Conditions</h3>
            <span class="section-toggle__icon" :class="{ 'section-toggle__icon--open': showConditions }">
              ▼
            </span>
          </button>
          <div v-if="showConditions" class="conditions-section">
            <!-- Current Conditions -->
            <div v-if="currentConditions.length > 0" class="current-conditions">
              <p class="conditions-label">Active:</p>
              <div class="condition-tags">
                <button
                  v-for="condition in currentConditions"
                  :key="condition"
                  class="condition-tag condition-tag--active"
                  :class="getConditionClass(condition)"
                  @click="removeCondition(condition)"
                  :title="'Click to remove ' + condition"
                >
                  {{ condition }}
                  <span class="condition-tag__remove">&times;</span>
                </button>
              </div>
            </div>
            <p v-else class="no-conditions">No active conditions</p>

            <!-- Add Conditions -->
            <div class="add-conditions">
              <p class="conditions-label">Persistent:</p>
              <div class="condition-tags">
                <button
                  v-for="condition in persistentConditions"
                  :key="condition"
                  class="condition-tag"
                  :class="[getConditionClass(condition), { 'condition-tag--has': hasCondition(condition) }]"
                  :disabled="hasCondition(condition)"
                  @click="addCondition(condition)"
                >
                  {{ condition }}
                </button>
              </div>

              <p class="conditions-label">Volatile:</p>
              <div class="condition-tags">
                <button
                  v-for="condition in volatileConditions"
                  :key="condition"
                  class="condition-tag"
                  :class="[getConditionClass(condition), { 'condition-tag--has': hasCondition(condition) }]"
                  :disabled="hasCondition(condition)"
                  @click="addCondition(condition)"
                >
                  {{ condition }}
                </button>
              </div>

              <p class="conditions-label">Other:</p>
              <div class="condition-tags">
                <button
                  v-for="condition in otherConditions"
                  :key="condition"
                  class="condition-tag"
                  :class="[getConditionClass(condition), { 'condition-tag--has': hasCondition(condition) }]"
                  :disabled="hasCondition(condition)"
                  @click="addCondition(condition)"
                >
                  {{ condition }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Move Target Modal -->
      <MoveTargetModal
        v-if="selectedMove"
        :move="selectedMove"
        :actor="combatant"
        :targets="allCombatants"
        @confirm="handleMoveConfirm"
        @cancel="selectedMove = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Move, Pokemon, HumanCharacter, StatusCondition } from '~/types'

const props = defineProps<{
  combatant: Combatant
  allCombatants: Combatant[]
}>()

const emit = defineEmits<{
  close: []
  executeMove: [combatantId: string, moveId: string, targetIds: string[], damage?: number, targetDamages?: Record<string, number>]
  executeAction: [combatantId: string, actionType: string]
  updateStatus: [combatantId: string, add: StatusCondition[], remove: StatusCondition[]]
}>()

// Maneuver type definition
interface Maneuver {
  id: string
  name: string
  actionType: 'standard' | 'full' | 'interrupt'
  actionLabel: string
  ac: number | null
  icon: string
  shortDesc: string
  requiresTarget: boolean
}

// Combat Maneuvers from PTU 1.05
const maneuvers: Maneuver[] = [
  {
    id: 'push',
    name: 'Push',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: 4,
    icon: '/icons/phosphor/arrow-fat-right.svg',
    shortDesc: 'Push target 1m away (opposed Combat/Athletics)',
    requiresTarget: true
  },
  {
    id: 'sprint',
    name: 'Sprint',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: null,
    icon: '/icons/phosphor/person-simple-run.svg',
    shortDesc: '+50% Movement Speed this turn',
    requiresTarget: false
  },
  {
    id: 'trip',
    name: 'Trip',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: 6,
    icon: '/icons/phosphor/sneaker-move.svg',
    shortDesc: 'Trip target (opposed Combat/Acrobatics)',
    requiresTarget: true
  },
  {
    id: 'grapple',
    name: 'Grapple',
    actionType: 'standard',
    actionLabel: 'Standard',
    ac: 4,
    icon: '/icons/phosphor/hand-grabbing.svg',
    shortDesc: 'Initiate grapple (opposed Combat/Athletics)',
    requiresTarget: true
  },
  {
    id: 'intercept-melee',
    name: 'Intercept Melee',
    actionType: 'interrupt',
    actionLabel: 'Full + Interrupt',
    ac: null,
    icon: '/icons/phosphor/shield.svg',
    shortDesc: 'Take melee hit meant for adjacent ally',
    requiresTarget: false
  },
  {
    id: 'intercept-ranged',
    name: 'Intercept Ranged',
    actionType: 'interrupt',
    actionLabel: 'Full + Interrupt',
    ac: null,
    icon: '/icons/phosphor/shield.svg',
    shortDesc: 'Intercept ranged attack for ally',
    requiresTarget: false
  },
  {
    id: 'take-a-breather',
    name: 'Take a Breather',
    actionType: 'full',
    actionLabel: 'Full Action',
    ac: null,
    icon: '/icons/phosphor/wind.svg',
    shortDesc: 'Reset stages, cure volatile status, become Tripped',
    requiresTarget: false
  }
]

const { getSpriteUrl } = usePokemonSprite()

const selectedMove = ref<Move | null>(null)
const showManeuvers = ref(false)
const showConditions = ref(false)

// Status condition categories
const persistentConditions: StatusCondition[] = [
  'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned', 'Asleep'
]

const volatileConditions: StatusCondition[] = [
  'Confused', 'Flinched', 'Infatuated', 'Cursed', 'Disabled', 'Encored', 'Taunted', 'Tormented'
]

const otherConditions: StatusCondition[] = [
  'Fainted', 'Stuck', 'Slowed', 'Trapped', 'Tripped', 'Vulnerable', 'Suppressed'
]

const isPokemon = computed(() => props.combatant.type === 'pokemon')

// Provide default turnState if not present
const turnState = computed(() => props.combatant.turnState ?? {
  hasActed: false,
  standardActionUsed: false,
  shiftActionUsed: false,
  swiftActionUsed: false,
  canBeCommanded: true,
  isHolding: false
})

const displayName = computed(() => {
  if (isPokemon.value) {
    const pokemon = props.combatant.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (props.combatant.entity as HumanCharacter).name
})

const spriteUrl = computed(() => {
  if (isPokemon.value) {
    const pokemon = props.combatant.entity as Pokemon
    return getSpriteUrl(pokemon.species, pokemon.shiny)
  }
  return ''
})

const moves = computed(() => {
  if (isPokemon.value) {
    return (props.combatant.entity as Pokemon).moves || []
  }
  return []
})

// Get current status conditions from the entity
const currentConditions = computed((): StatusCondition[] => {
  return props.combatant.entity.statusConditions || []
})

const hasCondition = (condition: StatusCondition): boolean => {
  return currentConditions.value.includes(condition)
}

const getConditionClass = (condition: StatusCondition): string => {
  const classMap: Record<string, string> = {
    'Burned': 'condition--burn',
    'Frozen': 'condition--freeze',
    'Paralyzed': 'condition--paralysis',
    'Poisoned': 'condition--poison',
    'Badly Poisoned': 'condition--poison',
    'Asleep': 'condition--sleep',
    'Confused': 'condition--confusion',
    'Fainted': 'condition--fainted',
    'Flinched': 'condition--flinch',
    'Infatuated': 'condition--infatuation'
  }
  return classMap[condition] || 'condition--default'
}

const addCondition = (condition: StatusCondition) => {
  emit('updateStatus', props.combatant.id, [condition], [])
}

const removeCondition = (condition: StatusCondition) => {
  emit('updateStatus', props.combatant.id, [], [condition])
}

// Create a Struggle move for Pokemon
const struggleMove: Move = {
  id: 'struggle',
  name: 'Struggle',
  type: 'Normal',
  damageClass: 'Physical',
  frequency: 'At-Will',
  ac: 4,
  damageBase: 4,
  range: 'Melee',
  effect: 'Typeless. The user loses 1/4th of their max HP.'
}

const selectMove = (move: Move) => {
  selectedMove.value = move
}

const selectStruggle = () => {
  selectedMove.value = struggleMove
}

const handleMoveConfirm = (targetIds: string[], damage?: number, rollResult?: any, targetDamages?: Record<string, number>) => {
  if (selectedMove.value) {
    // Use move name as identifier since id might be undefined
    const moveIdentifier = selectedMove.value.id || selectedMove.value.name
    emit('executeMove', props.combatant.id, moveIdentifier, targetIds, damage, targetDamages)
    selectedMove.value = null
    emit('close')
  }
}

const executeStandardAction = (actionType: 'shift' | 'struggle' | 'pass') => {
  emit('executeAction', props.combatant.id, actionType)
  if (actionType === 'pass') {
    emit('close')
  }
}

// Check if a maneuver is disabled based on action economy
const isManeuverDisabled = (maneuver: Maneuver): boolean => {
  if (maneuver.actionType === 'standard') {
    return turnState.value.standardActionUsed
  }
  if (maneuver.actionType === 'full') {
    // Full action requires both standard and shift
    return turnState.value.standardActionUsed || turnState.value.shiftActionUsed
  }
  // Interrupts are always available (they're reactions)
  return false
}

// Select and execute a maneuver
const selectManeuver = (maneuver: Maneuver) => {
  // For now, just emit the action - the GM page will handle logging
  emit('executeAction', props.combatant.id, `maneuver:${maneuver.id}`)
  emit('close')
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
  animation: fadeIn 0.2s ease-out;
}

.gm-action-modal {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-xl, 0 0 40px rgba($color-accent-violet, 0.15);
  animation: slideUp 0.3s ease-out;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-lg;
    border-bottom: 1px solid $glass-border;
    background: linear-gradient(135deg, rgba($color-accent-violet, 0.1) 0%, transparent 100%);

    .header-info {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      flex: 1;

      &__sprite {
        width: 64px;
        height: 64px;
        image-rendering: pixelated;
        background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
        border: 2px solid $border-color-default;
        border-radius: $border-radius-md;
        padding: $spacing-xs;
      }

      &__avatar {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
        border: 2px solid $border-color-default;
        border-radius: $border-radius-md;

        span {
          font-size: $font-size-xl;
          font-weight: 700;
          background: $gradient-sv-cool;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      &__text {
        h2 {
          margin: 0 0 $spacing-xs;
          font-size: $font-size-xl;
          color: $color-text;
        }
      }

      &__types {
        display: flex;
        gap: $spacing-xs;
      }
    }

    .header-actions {
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-lg;
  }
}

.action-count {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;

  &__label {
    color: $color-text-muted;
  }

  span:last-child {
    font-weight: 600;
    color: $color-success;
  }

  &--used {
    color: $color-danger !important;
  }
}

.modal__close {
  background: none;
  border: none;
  color: $color-text-muted;
  font-size: 1.5rem;
  cursor: pointer;
  padding: $spacing-xs;
  line-height: 1;
  margin-left: $spacing-md;

  &:hover {
    color: $color-text;
  }
}

.action-section {
  margin-bottom: $spacing-xl;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.move-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.move-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border: none;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;
  color: $color-text;
  box-shadow: $shadow-sm;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    transform: translateX(4px);
    box-shadow: $shadow-md;
  }

  &__main {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-md;
  }

  &__type {
    font-size: $font-size-xs;
    opacity: 0.8;
    text-transform: uppercase;
  }

  &__details {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-xs;
  }

  &__damage {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    font-weight: 600;
  }

  &__frequency {
    opacity: 0.7;
  }

  &__ac {
    opacity: 0.7;
  }

  // Type colors
  &--normal { background-color: $type-normal; }
  &--fire { background-color: $type-fire; }
  &--water { background-color: $type-water; }
  &--electric { background-color: $type-electric; color: $color-text-dark; }
  &--grass { background-color: $type-grass; }
  &--ice { background-color: $type-ice; color: $color-text-dark; }
  &--fighting { background-color: $type-fighting; }
  &--poison { background-color: $type-poison; }
  &--ground { background-color: $type-ground; color: $color-text-dark; }
  &--flying { background-color: $type-flying; }
  &--psychic { background-color: $type-psychic; }
  &--bug { background-color: $type-bug; }
  &--rock { background-color: $type-rock; }
  &--ghost { background-color: $type-ghost; }
  &--dragon { background-color: $type-dragon; }
  &--dark { background-color: $type-dark; }
  &--steel { background-color: $type-steel; color: $color-text-dark; }
  &--fairy { background-color: $type-fairy; }
}

.standard-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;
  min-width: 160px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: $color-bg-hover;
    border-color: $border-color-emphasis;
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: $color-bg-secondary;
    border-radius: $border-radius-sm;

    .action-icon {
      width: 20px;
      height: 20px;
      filter: brightness(0) invert(1);
    }
  }

  &__text {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-md;
  }

  &__desc {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &--shift {
    &:not(:disabled):hover {
      border-color: $color-accent-teal;
      .action-btn__icon {
        background: rgba($color-accent-teal, 0.2);
      }
    }
  }

  &--struggle {
    &:not(:disabled):hover {
      border-color: $color-danger;
      .action-btn__icon {
        background: rgba($color-danger, 0.2);
      }
    }
  }

  &--pass {
    &:not(:disabled):hover {
      border-color: $color-accent-violet;
      .action-btn__icon {
        background: rgba($color-accent-violet, 0.2);
      }
    }
  }
}

.type-badge {
  display: inline-block;
  padding: 2px $spacing-sm;
  font-size: $font-size-xs;
  font-weight: 600;
  text-transform: uppercase;
  border-radius: $border-radius-sm;
  color: white;

  &--normal { background-color: $type-normal; }
  &--fire { background-color: $type-fire; }
  &--water { background-color: $type-water; }
  &--electric { background-color: $type-electric; color: $color-text-dark; }
  &--grass { background-color: $type-grass; }
  &--ice { background-color: $type-ice; color: $color-text-dark; }
  &--fighting { background-color: $type-fighting; }
  &--poison { background-color: $type-poison; }
  &--ground { background-color: $type-ground; color: $color-text-dark; }
  &--flying { background-color: $type-flying; }
  &--psychic { background-color: $type-psychic; }
  &--bug { background-color: $type-bug; }
  &--rock { background-color: $type-rock; }
  &--ghost { background-color: $type-ghost; }
  &--dragon { background-color: $type-dragon; }
  &--dark { background-color: $type-dark; }
  &--steel { background-color: $type-steel; color: $color-text-dark; }
  &--fairy { background-color: $type-fairy; }
}

// Section toggle for collapsible sections
.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  margin-bottom: $spacing-md;
  background: none;
  border: none;
  cursor: pointer;
  color: $color-text;

  h3 {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__icon {
    font-size: $font-size-xs;
    color: $color-text-muted;
    transition: transform $transition-fast;

    &--open {
      transform: rotate(180deg);
    }
  }

  &:hover h3 {
    color: $color-text;
  }
}

// Maneuvers grid
.maneuvers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: $spacing-md;
}

.maneuver-btn {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: $color-bg-hover;
    border-color: $border-color-emphasis;
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__icon {
    width: 20px;
    height: 20px;
    filter: brightness(0) invert(1);
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-md;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-xs;
  }

  &__action {
    padding: 2px $spacing-xs;
    background: $color-bg-secondary;
    border-radius: $border-radius-sm;
    color: $color-text-muted;
  }

  &__ac {
    color: $color-text-muted;
  }

  &__desc {
    margin: 0;
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.4;
  }

  // Action type colors
  &--standard {
    &:not(:disabled):hover {
      border-color: $color-accent-teal;
    }
  }

  &--full {
    &:not(:disabled):hover {
      border-color: $color-warning;
    }
    .maneuver-btn__action {
      background: rgba($color-warning, 0.2);
      color: $color-warning;
    }
  }

  &--interrupt {
    &:not(:disabled):hover {
      border-color: $color-accent-violet;
    }
    .maneuver-btn__action {
      background: rgba($color-accent-violet, 0.2);
      color: $color-accent-violet;
    }
  }
}

// Status Conditions Section
.conditions-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.current-conditions {
  padding: $spacing-md;
  background: rgba($color-danger, 0.1);
  border: 1px solid rgba($color-danger, 0.3);
  border-radius: $border-radius-md;
}

.no-conditions {
  color: $color-text-muted;
  font-size: $font-size-sm;
  font-style: italic;
  margin: 0;
}

.conditions-label {
  margin: 0 0 $spacing-xs;
  font-size: $font-size-xs;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.condition-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-bottom: $spacing-md;

  &:last-child {
    margin-bottom: 0;
  }
}

.condition-tag {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
  font-weight: 500;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  background: $color-bg-tertiary;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover:not(:disabled) {
    background: $color-bg-hover;
    border-color: $border-color-emphasis;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &--active {
    background: rgba($color-danger, 0.2);
    border-color: $color-danger;

    &:hover {
      background: rgba($color-danger, 0.3);
    }
  }

  &--has {
    opacity: 0.4;
  }

  &__remove {
    font-size: $font-size-sm;
    font-weight: 700;
    opacity: 0.7;

    &:hover {
      opacity: 1;
    }
  }

  // Condition type colors
  &.condition--burn {
    border-color: $type-fire;
    &.condition-tag--active { background: rgba($type-fire, 0.2); }
  }

  &.condition--freeze {
    border-color: $type-ice;
    &.condition-tag--active { background: rgba($type-ice, 0.2); }
  }

  &.condition--paralysis {
    border-color: $type-electric;
    &.condition-tag--active { background: rgba($type-electric, 0.2); }
  }

  &.condition--poison {
    border-color: $type-poison;
    &.condition-tag--active { background: rgba($type-poison, 0.2); }
  }

  &.condition--sleep {
    border-color: $type-psychic;
    &.condition-tag--active { background: rgba($type-psychic, 0.2); }
  }

  &.condition--confusion {
    border-color: $type-psychic;
    &.condition-tag--active { background: rgba($type-psychic, 0.2); }
  }

  &.condition--fainted {
    border-color: $color-danger;
    &.condition-tag--active { background: rgba($color-danger, 0.3); }
  }

  &.condition--flinch {
    border-color: $type-normal;
    &.condition-tag--active { background: rgba($type-normal, 0.2); }
  }

  &.condition--infatuation {
    border-color: $type-fairy;
    &.condition-tag--active { background: rgba($type-fairy, 0.2); }
  }
}

.add-conditions {
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
