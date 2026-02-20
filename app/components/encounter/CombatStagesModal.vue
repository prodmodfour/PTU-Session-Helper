<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal__header">
          <h3>Combat Stages - {{ combatantName }}</h3>
          <button class="modal__close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal__body">
          <!-- Combat Stages: use multiplier table (PTU p.235) -->
          <div class="stages-section">
            <h4 class="stages-section__title">Combat Stages (stat multipliers)</h4>
            <div class="stages-grid">
              <div v-for="stat in COMBAT_STAGE_STATS" :key="stat" class="stage-control">
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

          <!-- Accuracy & Evasion: additive modifiers, not multipliers (PTU p.234) -->
          <div class="stages-section">
            <h4 class="stages-section__title">Accuracy & Evasion (additive modifiers)</h4>
            <div class="stages-grid">
              <div v-for="stat in ADDITIVE_MODIFIER_STATS" :key="stat" class="stage-control">
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
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" @click="resetStages">Reset All</button>
          <button class="btn btn--primary" @click="applyStages">Save Changes</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { StageModifiers } from '~/types'

const props = defineProps<{
  combatantName: string
  currentStages: StageModifiers
}>()

const emit = defineEmits<{
  close: []
  save: [changes: Partial<StageModifiers>, absolute: boolean]
}>()

// PTU p.235: These five stats use the combat stage multiplier table (+20%/-10% per stage)
const COMBAT_STAGE_STATS = ['attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const

// PTU p.234: Accuracy and Evasion are additive modifiers, NOT multiplier-based combat stages.
// Accuracy stages modify rolls directly. Evasion bonuses (from moves/effects) stack on top of
// stat-derived evasion (which is floor(stageModifiedStat / 5), already affected by the CS multiplier
// on Defense/SpDef/Speed).
const ADDITIVE_MODIFIER_STATS = ['accuracy', 'evasion'] as const

// Combined list for iteration in reset/apply
const ALL_STATS = [...COMBAT_STAGE_STATS, ...ADDITIVE_MODIFIER_STATS] as const

const STAT_NAMES: Record<string, string> = {
  attack: 'Atk',
  defense: 'Def',
  specialAttack: 'SpA',
  specialDefense: 'SpD',
  speed: 'Spe',
  accuracy: 'Acc',
  evasion: 'Eva Bonus'
}

// Stage inputs initialized from current values
const stageInputs = reactive<Record<string, number>>({
  attack: props.currentStages.attack || 0,
  defense: props.currentStages.defense || 0,
  specialAttack: props.currentStages.specialAttack || 0,
  specialDefense: props.currentStages.specialDefense || 0,
  speed: props.currentStages.speed || 0,
  accuracy: props.currentStages.accuracy || 0,
  evasion: props.currentStages.evasion || 0
})

const formatStatName = (stat: string): string => STAT_NAMES[stat] || stat

const resetStages = () => {
  for (const stat of ALL_STATS) {
    stageInputs[stat] = 0
  }
}

const applyStages = () => {
  const changes: Partial<StageModifiers> = {}
  for (const stat of ALL_STATS) {
    changes[stat] = stageInputs[stat]
  }
  emit('save', changes, true)
  emit('close')
}
</script>

<style lang="scss" scoped>
.stages-section {
  &:not(:first-child) {
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid $glass-border;
  }

  &__title {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
    font-weight: 500;
  }
}

.stages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: $spacing-md;
}

.stage-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;

  &__label {
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text;
  }

  &__buttons {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__value {
    min-width: 40px;
    text-align: center;
    font-weight: 600;
    font-size: $font-size-md;

    &--positive {
      color: $color-success;
    }

    &--negative {
      color: $color-danger;
    }
  }
}
</style>
