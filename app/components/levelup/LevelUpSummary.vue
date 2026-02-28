<template>
  <div class="levelup-summary">
    <h3>Level-Up Summary</h3>
    <p class="levelup-summary__subtitle">
      {{ characterName }}: Level {{ fromLevel }} -> Level {{ toLevel }}
    </p>

    <!-- Stat Changes -->
    <div class="summary-section">
      <h4 class="summary-section__title">Stats</h4>
      <div class="summary-section__list">
        <div
          v-for="stat in statChanges"
          :key="stat.key"
          class="summary-item"
          :class="{ 'summary-item--changed': stat.delta > 0 }"
        >
          <span class="summary-item__label">{{ stat.label }}</span>
          <span class="summary-item__value">
            {{ stat.oldValue }}
            <template v-if="stat.delta > 0">
              -> {{ stat.newValue }} <span class="summary-item__delta">(+{{ stat.delta }})</span>
            </template>
            <template v-else>
              <span class="summary-item__unchanged">(unchanged)</span>
            </template>
          </span>
        </div>
      </div>
      <div class="summary-maxhp">
        <span class="summary-maxhp__label">Max HP</span>
        <span class="summary-maxhp__value">
          {{ currentMaxHp }} -> {{ updatedMaxHp }}
        </span>
      </div>
    </div>

    <!-- Skill Changes -->
    <div v-if="skillChanges.length" class="summary-section">
      <h4 class="summary-section__title">Skills</h4>
      <div class="summary-section__list">
        <div
          v-for="change in skillChanges"
          :key="change.name"
          class="summary-item summary-item--changed"
        >
          <span class="summary-item__label">{{ change.name }}</span>
          <span class="summary-item__value">
            {{ change.from }} -> {{ change.to }}
          </span>
        </div>
      </div>
    </div>

    <!-- P1 Indicators -->
    <div v-if="p1Indicators.length" class="summary-section summary-section--p1">
      <h4 class="summary-section__title">Coming in P1</h4>
      <div class="summary-section__list">
        <div
          v-for="(indicator, i) in p1Indicators"
          :key="i"
          class="summary-item summary-item--p1"
        >
          <span class="summary-item__label">{{ indicator }}</span>
        </div>
      </div>
    </div>

    <!-- Warnings -->
    <div v-if="warnings.length" class="summary-section summary-section--warnings">
      <h4 class="summary-section__title">Warnings</h4>
      <div class="summary-section__list">
        <div
          v-for="(warning, i) in warnings"
          :key="i"
          class="summary-item summary-item--warning"
        >
          <span class="summary-item__label">{{ warning }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Stats, SkillRank } from '~/types/character'
import type { StatPoints } from '~/composables/useCharacterCreation'
import type { PtuSkillName } from '~/constants/trainerSkills'
import type { TrainerAdvancementSummary } from '~/utils/trainerAdvancement'

interface Props {
  /** Character name */
  characterName: string
  /** Level transition */
  fromLevel: number
  toLevel: number
  /** Stat allocations */
  statAllocations: StatPoints
  currentStats: Stats
  /** Current and updated maxHp */
  currentMaxHp: number
  updatedMaxHp: number
  /** Skill rank choices */
  skillChoices: PtuSkillName[]
  currentSkills: Record<string, SkillRank>
  /** Warnings about incomplete allocations */
  warnings: string[]
  /** Advancement summary for P1 indicators */
  summary: TrainerAdvancementSummary | null
}

const props = defineProps<Props>()

const RANK_PROGRESSION: readonly SkillRank[] = [
  'Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master'
] as const

const statDefinitions = [
  { key: 'hp' as const, label: 'HP' },
  { key: 'attack' as const, label: 'Attack' },
  { key: 'defense' as const, label: 'Defense' },
  { key: 'specialAttack' as const, label: 'Sp. Attack' },
  { key: 'specialDefense' as const, label: 'Sp. Defense' },
  { key: 'speed' as const, label: 'Speed' }
]

/** Compute stat change rows */
const statChanges = computed(() =>
  statDefinitions.map(stat => ({
    key: stat.key,
    label: stat.label,
    oldValue: props.currentStats[stat.key] ?? 0,
    newValue: (props.currentStats[stat.key] ?? 0) + props.statAllocations[stat.key],
    delta: props.statAllocations[stat.key]
  }))
)

/** Compute skill change rows (only skills that changed) */
const skillChanges = computed(() => {
  // Track cumulative rank-ups per skill
  const rankUps: Record<string, number> = {}
  for (const skill of props.skillChoices) {
    rankUps[skill] = (rankUps[skill] ?? 0) + 1
  }

  return Object.entries(rankUps).map(([skillName, ups]) => {
    const baseRank = (props.currentSkills[skillName] as SkillRank) ?? 'Untrained'
    const baseIndex = RANK_PROGRESSION.indexOf(baseRank)
    const newIndex = Math.min(baseIndex + ups, RANK_PROGRESSION.length - 1)
    return {
      name: skillName,
      from: baseRank,
      to: RANK_PROGRESSION[newIndex]
    }
  })
})

/** P1 feature/edge/milestone indicators */
const p1Indicators = computed(() => {
  if (!props.summary) return []
  const indicators: string[] = []
  if (props.summary.totalEdges > 0) {
    indicators.push(`${props.summary.totalEdges} edge(s) to select (P1)`)
  }
  if (props.summary.bonusSkillEdges > 0) {
    indicators.push(`${props.summary.bonusSkillEdges} bonus Skill Edge(s) to select (P1)`)
  }
  if (props.summary.totalFeatures > 0) {
    indicators.push(`${props.summary.totalFeatures} feature(s) to select (P1)`)
  }
  if (props.summary.milestones.length > 0) {
    const names = props.summary.milestones.map(m => m.name).join(', ')
    indicators.push(`Milestone(s): ${names} (P1)`)
  }
  if (props.summary.classChoicePrompts.length > 0) {
    indicators.push(`Class choice at level(s) ${props.summary.classChoicePrompts.join(', ')} (P1)`)
  }
  return indicators
})
</script>

<style lang="scss" scoped>
.levelup-summary {
  h3 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-md;
    color: $color-text;
    font-weight: 600;
  }

  &__subtitle {
    margin: 0 0 $spacing-lg 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }
}

.summary-section {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;

  &__title {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &--p1 {
    border-color: rgba($color-info, 0.3);
    background: rgba($color-info, 0.05);
  }

  &--warnings {
    border-color: rgba($color-warning, 0.3);
    background: rgba($color-warning, 0.05);
  }
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;

  &--changed {
    background: rgba($color-success, 0.05);
  }

  &--warning {
    background: rgba($color-warning, 0.1);
  }

  &--p1 {
    background: rgba($color-info, 0.1);
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__value {
    font-size: $font-size-sm;
    color: $color-text;
    font-weight: 500;
  }

  &__delta {
    color: $color-success;
    font-weight: 600;
  }

  &__unchanged {
    color: $color-text-muted;
    font-style: italic;
  }
}

.summary-maxhp {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: $spacing-sm;
  padding-top: $spacing-sm;
  border-top: 1px solid $glass-border;

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    font-weight: 600;
    text-transform: uppercase;
  }

  &__value {
    font-size: $font-size-md;
    font-weight: 700;
    color: $color-accent-teal;
  }
}
</style>
