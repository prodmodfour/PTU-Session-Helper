<template>
  <div
    class="combatant-card"
    :class="{
      'combatant-card--current': isCurrent,
      'combatant-card--fainted': isFainted
    }"
  >
    <!-- Sprite/Avatar -->
    <div class="combatant-card__visual">
      <img v-if="isPokemon" :src="spriteUrl" :alt="displayName" class="combatant-card__sprite" />
      <div v-else class="combatant-card__avatar">
        <img v-if="(entity as any).avatarUrl" :src="(entity as any).avatarUrl" :alt="displayName" />
        <span v-else>{{ displayName.charAt(0) }}</span>
      </div>
    </div>

    <!-- Info -->
    <div class="combatant-card__info">
      <div class="combatant-card__header">
        <span class="combatant-card__name">{{ displayName }}</span>
        <span class="combatant-card__level">Lv.{{ entity.level }}</span>
      </div>

      <!-- Types (Pokemon only) -->
      <div v-if="isPokemon" class="combatant-card__types">
        <span
          v-for="type in (entity as any).types"
          :key="type"
          class="type-badge type-badge--sm"
          :class="`type-badge--${type.toLowerCase()}`"
        >
          {{ type }}
        </span>
      </div>

      <!-- Health Bar - B2W2 Style with Temp HP -->
      <div class="combatant-card__health">
        <div class="health-bar" :class="healthBarClass">
          <div class="health-bar__label">HP</div>
          <div class="health-bar__container">
            <div class="health-bar__track">
              <!-- Temp HP layer (cyan) -->
              <div
                v-if="tempHp > 0"
                class="health-bar__temp"
                :style="{ width: tempHpPercentage + '%' }"
              ></div>
              <!-- Regular HP layer -->
              <div class="health-bar__fill" :style="{ width: healthPercentage + '%' }"></div>
            </div>
            <span class="health-bar__text">
              <template v-if="isGm">
                {{ entity.currentHp }}/{{ entity.maxHp }}
                <span v-if="tempHp > 0" class="health-bar__temp-text">(+{{ tempHp }})</span>
              </template>
              <template v-else>
                {{ healthPercentage }}%
                <span v-if="tempHp > 0" class="health-bar__temp-text">(+T)</span>
              </template>
            </span>
          </div>
        </div>
      </div>

      <!-- Injuries indicator -->
      <div v-if="injuries > 0" class="combatant-card__injuries">
        <span class="injury-badge" :class="{ 'injury-badge--severe': injuries >= 5 }">
          {{ injuries }} {{ injuries === 1 ? 'Injury' : 'Injuries' }}
        </span>
      </div>

      <!-- Status Conditions -->
      <div v-if="statusConditions.length > 0" class="combatant-card__status">
        <span
          v-for="status in statusConditions"
          :key="status"
          class="status-badge"
          :class="`status-badge--${status.toLowerCase().replace(' ', '-')}`"
        >
          {{ status }}
        </span>
      </div>

      <!-- Combat Stages (GM only, show non-zero) -->
      <div v-if="isGm && hasStageChanges" class="combatant-card__stages">
        <span
          v-for="(value, stat) in nonZeroStages"
          :key="stat"
          class="stage-badge"
          :class="{ 'stage-badge--positive': value > 0, 'stage-badge--negative': value < 0 }"
        >
          {{ formatStatName(stat as string) }} {{ value > 0 ? '+' : '' }}{{ value }}
        </span>
      </div>

      <!-- Initiative (GM only) -->
      <div v-if="isGm" class="combatant-card__initiative">
        Init: {{ combatant.initiative }}
      </div>
    </div>

    <!-- GM Actions -->
    <div v-if="isGm" class="combatant-card__actions">
      <!-- HP Controls -->
      <div class="action-row">
        <input
          v-model.number="damageInput"
          type="number"
          class="form-input form-input--sm"
          placeholder="DMG"
          min="0"
        />
        <button class="btn btn--sm btn--danger" @click="applyDamage">
          -HP
        </button>
      </div>
      <div class="action-row">
        <input
          v-model.number="healInput"
          type="number"
          class="form-input form-input--sm"
          placeholder="HEAL"
          min="0"
        />
        <button class="btn btn--sm btn--success" @click="applyHeal">
          +HP
        </button>
      </div>

      <!-- Quick Actions -->
      <div class="action-row action-row--controls">
        <button
          class="btn btn--sm btn--secondary"
          title="Add Temp HP"
          @click="showTempHpModal = true"
        >
          +T
        </button>
        <button
          class="btn btn--sm btn--secondary"
          title="Modify Stages"
          @click="showStagesModal = true"
        >
          CS
        </button>
        <button
          class="btn btn--sm btn--secondary"
          title="Status Conditions"
          @click="showStatusModal = true"
        >
          ST
        </button>
      </div>

      <!-- Actions Button -->
      <button
        class="btn btn--sm btn--primary"
        title="Take Action"
        @click="handleActClick"
      >
        Act
      </button>

      <button class="btn btn--sm btn--ghost" @click="$emit('remove', combatant.id)">
        Remove
      </button>
    </div>

    <!-- Temp HP Modal -->
    <Teleport to="body">
      <div v-if="showTempHpModal" class="modal-overlay" @click.self="showTempHpModal = false">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h3>Add Temporary HP</h3>
            <button class="modal__close" @click="showTempHpModal = false">&times;</button>
          </div>
          <div class="modal__body">
            <div class="form-group">
              <label>Temp HP Amount</label>
              <input v-model.number="tempHpInput" type="number" class="form-input" min="0" />
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" @click="showTempHpModal = false">Cancel</button>
            <button class="btn btn--primary" @click="applyTempHp">Apply</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Stages Modal -->
    <Teleport to="body">
      <div v-if="showStagesModal" class="modal-overlay" @click.self="showStagesModal = false">
        <div class="modal">
          <div class="modal__header">
            <h3>Combat Stages</h3>
            <button class="modal__close" @click="showStagesModal = false">&times;</button>
          </div>
          <div class="modal__body">
            <div class="stages-grid">
              <div v-for="stat in statsList" :key="stat" class="stage-control">
                <span class="stage-control__label">{{ formatStatName(stat) }}</span>
                <div class="stage-control__buttons">
                  <button
                    class="btn btn--sm btn--danger"
                    :disabled="stageInputs[stat] <= -6"
                    @click="stageInputs[stat]--"
                  >
                    -
                  </button>
                  <span class="stage-control__value" :class="{
                    'stage-control__value--positive': stageInputs[stat] > 0,
                    'stage-control__value--negative': stageInputs[stat] < 0
                  }">
                    {{ stageInputs[stat] > 0 ? '+' : '' }}{{ stageInputs[stat] }}
                  </span>
                  <button
                    class="btn btn--sm btn--success"
                    :disabled="stageInputs[stat] >= 6"
                    @click="stageInputs[stat]++"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" @click="resetStages">Reset All</button>
            <button class="btn btn--primary" @click="applyStages">Save Changes</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Status Modal -->
    <Teleport to="body">
      <div v-if="showStatusModal" class="modal-overlay" @click.self="showStatusModal = false">
        <div class="modal">
          <div class="modal__header">
            <h3>Status Conditions</h3>
            <button class="modal__close" @click="showStatusModal = false">&times;</button>
          </div>
          <div class="modal__body">
            <div class="status-grid">
              <label
                v-for="status in availableStatuses"
                :key="status"
                class="status-checkbox"
                :class="{ 'status-checkbox--active': statusInputs.includes(status) }"
              >
                <input
                  type="checkbox"
                  :checked="statusInputs.includes(status)"
                  @change="toggleStatus(status)"
                />
                <span class="status-checkbox__label">{{ status }}</span>
              </label>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--secondary" @click="clearAllStatuses">Clear All</button>
            <button class="btn btn--primary" @click="applyStatuses">Save Changes</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter, StatusCondition, StageModifiers } from '~/types'

const props = defineProps<{
  combatant: Combatant
  isCurrent: boolean
  isGm: boolean
}>()

const emit = defineEmits<{
  action: [combatantId: string, action: { type: string; data: any }]
  damage: [combatantId: string, damage: number]
  heal: [combatantId: string, amount: number, tempHp?: number, healInjuries?: number]
  remove: [combatantId: string]
  stages: [combatantId: string, changes: Partial<StageModifiers>, absolute: boolean]
  status: [combatantId: string, add: StatusCondition[], remove: StatusCondition[]]
  openActions: [combatantId: string]
}>()

const { getSpriteUrl } = usePokemonSprite()
const { getHealthPercentage, getHealthStatus } = useCombat()

// Input states
const damageInput = ref(0)
const healInput = ref(0)
const tempHpInput = ref(0)

// Modal states
const showTempHpModal = ref(false)
const showStagesModal = ref(false)
const showStatusModal = ref(false)

// Stats list for stages modal
const statsList = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed', 'accuracy', 'evasion'] as const

// Stage inputs (initialized from current values)
const stageInputs = reactive<Record<string, number>>({
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
  accuracy: 0,
  evasion: 0
})

// Status inputs
const statusInputs = ref<StatusCondition[]>([])

// Available statuses
const availableStatuses: StatusCondition[] = [
  'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned',
  'Asleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed',
  'Disabled', 'Encored', 'Taunted', 'Tormented',
  'Stuck', 'Slowed', 'Trapped', 'Enraged', 'Suppressed', 'Fainted'
]

const entity = computed(() => props.combatant.entity)
const isPokemon = computed(() => props.combatant.type === 'pokemon')

const displayName = computed(() => {
  if (isPokemon.value) {
    const pokemon = entity.value as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (entity.value as HumanCharacter).name
})

const spriteUrl = computed(() => {
  if (isPokemon.value) {
    const pokemon = entity.value as Pokemon
    return getSpriteUrl(pokemon.species, pokemon.shiny)
  }
  return ''
})

const healthPercentage = computed(() =>
  getHealthPercentage(entity.value.currentHp, entity.value.maxHp)
)

const tempHp = computed(() => entity.value.temporaryHp || 0)

const tempHpPercentage = computed(() => {
  // Show temp HP as percentage of max HP, capped at 100%
  return Math.min(100, Math.round((tempHp.value / entity.value.maxHp) * 100))
})

const injuries = computed(() => entity.value.injuries || 0)

const healthBarClass = computed(() => {
  const status = getHealthStatus(healthPercentage.value)
  return `health-bar--${status}`
})

const isFainted = computed(() => entity.value.currentHp <= 0)

const statusConditions = computed(() => entity.value.statusConditions || [])

// Stage modifiers
const stages = computed(() => entity.value.stageModifiers || {
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
  accuracy: 0,
  evasion: 0
})

const nonZeroStages = computed(() => {
  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(stages.value)) {
    if (value !== 0) {
      result[key] = value as number
    }
  }
  return result
})

const hasStageChanges = computed(() => Object.keys(nonZeroStages.value).length > 0)

// Format stat name for display
const formatStatName = (stat: string): string => {
  const names: Record<string, string> = {
    attack: 'Atk',
    defense: 'Def',
    specialAttack: 'SpA',
    specialDefense: 'SpD',
    speed: 'Spe',
    accuracy: 'Acc',
    evasion: 'Eva'
  }
  return names[stat] || stat
}

// Initialize stage inputs when modal opens
watch(showStagesModal, (open) => {
  if (open) {
    for (const stat of statsList) {
      stageInputs[stat] = stages.value[stat] || 0
    }
  }
})

// Initialize status inputs when modal opens
watch(showStatusModal, (open) => {
  if (open) {
    statusInputs.value = [...statusConditions.value]
  }
})

// Actions
const applyDamage = () => {
  if (damageInput.value > 0) {
    emit('damage', props.combatant.id, damageInput.value)
    damageInput.value = 0
  }
}

const applyHeal = () => {
  if (healInput.value > 0) {
    emit('heal', props.combatant.id, healInput.value)
    healInput.value = 0
  }
}

const applyTempHp = () => {
  if (tempHpInput.value > 0) {
    emit('heal', props.combatant.id, 0, tempHpInput.value)
    tempHpInput.value = 0
    showTempHpModal.value = false
  }
}

const resetStages = () => {
  for (const stat of statsList) {
    stageInputs[stat] = 0
  }
}

const applyStages = () => {
  const changes: Partial<StageModifiers> = {}
  for (const stat of statsList) {
    changes[stat] = stageInputs[stat]
  }
  emit('stages', props.combatant.id, changes, true)
  showStagesModal.value = false
}

const toggleStatus = (status: StatusCondition) => {
  const index = statusInputs.value.indexOf(status)
  if (index === -1) {
    statusInputs.value.push(status)
  } else {
    statusInputs.value.splice(index, 1)
  }
}

const clearAllStatuses = () => {
  statusInputs.value = []
}

const applyStatuses = () => {
  const current = statusConditions.value
  const target = statusInputs.value

  const added = target.filter(s => !current.includes(s))
  const removed = current.filter(s => !target.includes(s))

  if (added.length > 0 || removed.length > 0) {
    emit('status', props.combatant.id, added, removed)
  }
  showStatusModal.value = false
}

const handleActClick = () => {
  console.log('[CombatantCard] Act button clicked for:', props.combatant.id)
  emit('openActions', props.combatant.id)
}
</script>

<style lang="scss" scoped>
.combatant-card {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  transition: all $transition-normal;

  &--current {
    border-color: $color-accent-scarlet;
    background: linear-gradient(135deg, rgba($color-accent-scarlet, 0.15) 0%, rgba($color-accent-violet, 0.1) 100%);
    box-shadow: $shadow-glow-scarlet;
  }

  &--fainted {
    opacity: 0.5;
    filter: grayscale(30%);
  }

  &__visual {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
    border: 2px solid $border-color-default;
    border-radius: $border-radius-md;
  }

  &__sprite {
    max-width: 100%;
    max-height: 100%;
    image-rendering: pixelated;
  }

  &__avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: $border-radius-md;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span {
      font-size: $font-size-xl;
      font-weight: 700;
      background: $gradient-sv-cool;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-md;
    color: $color-text;
  }

  &__level {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__types {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;

    .type-badge--sm {
      font-size: 0.65rem;
      padding: 1px 4px;
    }
  }

  &__health {
    margin-bottom: $spacing-xs;
    width: 100%;
  }

  &__injuries {
    margin-bottom: $spacing-xs;
  }

  &__status {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  &__stages {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  &__initiative {
    font-size: $font-size-xs;
    color: $color-accent-scarlet;
    font-weight: 500;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    min-width: 100px;
  }
}

// Health bar styles
.health-bar {
  display: flex;
  align-items: center;
  gap: $spacing-xs;

  &__label {
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-text-muted;
    min-width: 20px;
  }

  &__container {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__track {
    flex: 1;
    height: 8px;
    background: $color-bg-tertiary;
    border-radius: $border-radius-full;
    overflow: hidden;
    position: relative;
  }

  &__fill {
    height: 100%;
    border-radius: $border-radius-full;
    transition: width $transition-normal, background-color $transition-normal;
    position: relative;
    z-index: 1;
  }

  &__temp {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: $color-accent-cyan;
    opacity: 0.6;
    border-radius: $border-radius-full;
    z-index: 0;
  }

  &__text {
    font-size: $font-size-xs;
    color: $color-text;
    min-width: 60px;
    text-align: right;
  }

  &__temp-text {
    color: $color-accent-cyan;
    font-weight: 600;
  }

  &--healthy .health-bar__fill {
    background: $color-success;
  }

  &--warning .health-bar__fill {
    background: $color-warning;
  }

  &--critical .health-bar__fill {
    background: $color-danger;
  }

  &--fainted .health-bar__fill {
    background: $color-text-muted;
  }
}

// Injury badge
.injury-badge {
  display: inline-block;
  padding: 2px $spacing-xs;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-danger;
  background: rgba($color-danger, 0.2);
  border: 1px solid rgba($color-danger, 0.4);
  border-radius: $border-radius-sm;

  &--severe {
    background: rgba($color-danger, 0.4);
    animation: pulse 1.5s infinite;
  }
}

// Stage badge
.stage-badge {
  display: inline-block;
  padding: 1px $spacing-xs;
  font-size: 0.65rem;
  font-weight: 600;
  border-radius: $border-radius-sm;

  &--positive {
    color: $color-success;
    background: rgba($color-success, 0.2);
  }

  &--negative {
    color: $color-danger;
    background: rgba($color-danger, 0.2);
  }
}

// Action rows
.action-row {
  display: flex;
  gap: $spacing-xs;

  &--controls {
    justify-content: space-between;
  }

  .form-input--sm {
    width: 50px;
    padding: $spacing-xs;
    font-size: $font-size-xs;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    color: $color-text;

    &::placeholder {
      color: $color-text-muted;
    }

    &:focus {
      border-color: $color-accent-scarlet;
      outline: none;
      box-shadow: 0 0 0 2px rgba($color-accent-scarlet, 0.2);
    }
  }
}

// Modal styles
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
}

.modal {
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-lg;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &--sm {
    max-width: 280px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-md;
    border-bottom: 1px solid $border-color-default;

    h3 {
      margin: 0;
      font-size: $font-size-lg;
      color: $color-text;
    }
  }

  &__close {
    background: none;
    border: none;
    color: $color-text-muted;
    font-size: $font-size-xl;
    cursor: pointer;
    padding: 0;
    line-height: 1;

    &:hover {
      color: $color-text;
    }
  }

  &__body {
    padding: $spacing-md;
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    gap: $spacing-sm;
    justify-content: flex-end;
    padding: $spacing-md;
    border-top: 1px solid $border-color-default;
  }
}

// Stages grid
.stages-grid {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.stage-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;

  &__label {
    font-weight: 500;
    min-width: 60px;
  }

  &__buttons {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__value {
    min-width: 30px;
    text-align: center;
    font-weight: 600;

    &--positive {
      color: $color-success;
    }

    &--negative {
      color: $color-danger;
    }
  }
}

// Status grid
.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
}

.status-checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $color-bg-hover;
  }

  &--active {
    border-color: $color-accent-scarlet;
    background: rgba($color-accent-scarlet, 0.1);
  }

  input {
    display: none;
  }

  &__label {
    font-size: $font-size-xs;
  }
}

// Form styles
.form-group {
  margin-bottom: $spacing-md;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

.form-input {
  width: 100%;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  color: $color-text;
  font-size: $font-size-md;

  &:focus {
    border-color: $color-accent-scarlet;
    outline: none;
    box-shadow: 0 0 0 2px rgba($color-accent-scarlet, 0.2);
  }
}

// Button styles
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-sm $spacing-md;
  border: none;
  border-radius: $border-radius-md;
  font-size: $font-size-sm;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-fast;

  &--sm {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
  }

  &--primary {
    background: $color-accent-scarlet;
    color: white;

    &:hover {
      background: lighten($color-accent-scarlet, 10%);
    }
  }

  &--secondary {
    background: $color-bg-tertiary;
    color: $color-text;
    border: 1px solid $border-color-default;

    &:hover {
      background: $color-bg-hover;
    }
  }

  &--danger {
    background: rgba($color-danger, 0.2);
    color: $color-danger;
    border: 1px solid rgba($color-danger, 0.3);

    &:hover {
      background: rgba($color-danger, 0.3);
    }
  }

  &--success {
    background: rgba($color-success, 0.2);
    color: $color-success;
    border: 1px solid rgba($color-success, 0.3);

    &:hover {
      background: rgba($color-success, 0.3);
    }
  }

  &--ghost {
    background: transparent;
    color: $color-text-muted;

    &:hover {
      background: $color-bg-tertiary;
      color: $color-text;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
