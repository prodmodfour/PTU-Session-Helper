<template>
  <div class="evo-stat-section">
    <h4 class="evo-stat-section__title">
      Stat Point Redistribution
      <span class="evo-stat-section__total" :class="{ 'evo-stat-section__total--invalid': !isPointTotalValid }">
        {{ currentPointTotal }} / {{ requiredPointTotal }}
      </span>
    </h4>

    <div class="evo-stat-grid">
      <div class="evo-stat-grid__header">
        <span>Stat</span>
        <span>Old Base</span>
        <span>New Base</span>
        <span>Points</span>
        <span>Final</span>
      </div>

      <div
        v-for="stat in statKeys"
        :key="stat"
        class="evo-stat-row"
        :class="{ 'evo-stat-row--violation': statHasViolation(stat) }"
      >
        <span class="evo-stat-row__label">{{ STAT_LABELS[stat] }}</span>
        <span class="evo-stat-row__old-base">{{ oldBaseStats[stat] }}</span>
        <span class="evo-stat-row__new-base" :class="{
          'evo-stat-row__new-base--up': newNatureAdjustedBase[stat] > oldBaseStats[stat],
          'evo-stat-row__new-base--down': newNatureAdjustedBase[stat] < oldBaseStats[stat]
        }">
          {{ newNatureAdjustedBase[stat] }}
        </span>
        <div class="evo-stat-row__points">
          <button
            class="btn btn--sm btn--danger"
            :disabled="statPointInputs[stat] <= 0"
            @click="$emit('decrement', stat)"
          >-</button>
          <span class="evo-stat-row__point-value">{{ statPointInputs[stat] }}</span>
          <button
            class="btn btn--sm btn--success"
            @click="$emit('increment', stat)"
          >+</button>
        </div>
        <span class="evo-stat-row__final">
          {{ newNatureAdjustedBase[stat] + statPointInputs[stat] }}
        </span>
      </div>
    </div>

    <div class="evo-hp-preview">
      <span class="evo-hp-preview__label">Max HP:</span>
      <span class="evo-hp-preview__old">{{ currentMaxHp }}</span>
      <PhArrowRight :size="14" />
      <span class="evo-hp-preview__new" :class="{
        'evo-hp-preview__new--up': newMaxHp > currentMaxHp,
        'evo-hp-preview__new--down': newMaxHp < currentMaxHp
      }">
        {{ newMaxHp }}
      </span>
    </div>
  </div>

  <div v-if="violations.length > 0" class="evo-violations-section">
    <h4 class="evo-violations-section__title">
      <PhWarning :size="16" />
      Base Relations Violations
    </h4>
    <ul>
      <li v-for="(v, i) in violations" :key="i">{{ v }}</li>
    </ul>
    <label class="evo-violations-override">
      <input
        :checked="skipBaseRelations"
        type="checkbox"
        @change="$emit('update:skipBaseRelations', ($event.target as HTMLInputElement).checked)"
      />
      Override Base Relations (GM discretion)
    </label>
  </div>
</template>

<script setup lang="ts">
import { PhArrowRight, PhWarning } from '@phosphor-icons/vue'
import type { EvolutionStats as Stats } from '~/utils/evolutionCheck'

const props = defineProps<{
  oldBaseStats: Stats
  newNatureAdjustedBase: Stats
  statPointInputs: Record<string, number>
  currentMaxHp: number
  newMaxHp: number
  requiredPointTotal: number
  currentPointTotal: number
  isPointTotalValid: boolean
  violations: string[]
  skipBaseRelations: boolean
}>()

defineEmits<{
  increment: [stat: string]
  decrement: [stat: string]
  'update:skipBaseRelations': [value: boolean]
}>()

const STAT_LABELS: Record<string, string> = {
  hp: 'HP', attack: 'Attack', defense: 'Defense',
  specialAttack: 'Sp. Atk', specialDefense: 'Sp. Def', speed: 'Speed'
}

const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const

function statHasViolation(stat: string): boolean {
  return props.violations.some(v => v.includes(stat))
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/components/evolution-modal';
</style>
