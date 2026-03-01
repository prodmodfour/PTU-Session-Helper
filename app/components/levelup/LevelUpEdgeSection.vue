<template>
  <div class="levelup-edges">
    <div class="levelup-edges__header">
      <h3>Edges</h3>
    </div>

    <!-- Regular Edges -->
    <div class="levelup-edges__regular">
      <div class="section-subheader">
        <h4>Regular Edges</h4>
        <span
          class="counter"
          :class="{ 'counter--full': edgeChoices.length >= regularEdgesTotal }"
        >
          {{ edgeChoices.length }} / {{ regularEdgesTotal }}
        </span>
      </div>

      <div class="edge-input">
        <input
          v-model="newEdge"
          type="text"
          class="form-input"
          :class="{ 'form-input--error': edgeError }"
          placeholder="Enter edge name..."
          :disabled="edgeChoices.length >= regularEdgesTotal"
          @keydown.enter.prevent="onAddEdge"
          @input="edgeError = ''"
        />
        <button
          class="btn btn--primary btn--sm"
          :disabled="!newEdge.trim() || edgeChoices.length >= regularEdgesTotal"
          @click="onAddEdge"
        >
          Add Edge
        </button>
      </div>
      <p v-if="edgeError" class="edge-error">{{ edgeError }}</p>

      <!-- Skill Edge Shortcut for regular edges -->
      <div class="skill-edge-shortcut">
        <button
          class="btn btn--secondary btn--sm"
          :class="{ 'btn--active': showRegularSkillEdge }"
          :disabled="edgeChoices.length >= regularEdgesTotal"
          @click="showRegularSkillEdge = !showRegularSkillEdge"
        >
          Add Skill Edge
        </button>

        <div v-if="showRegularSkillEdge" class="skill-edge-dropdown">
          <p class="skill-edge-dropdown__hint">
            Skill Edges raise a skill rank by one step. No rank restriction on regular edges.
          </p>
          <div class="skill-edge-dropdown__grid">
            <div
              v-for="(categorySkills, category) in PTU_SKILL_CATEGORIES"
              :key="category"
              class="skill-edge-category"
            >
              <h5>{{ category }}</h5>
              <div class="skill-edge-category__items">
                <button
                  v-for="skill in categorySkills"
                  :key="skill"
                  class="skill-edge-btn"
                  :class="{
                    'skill-edge-btn--capped': isRegularSkillEdgeCapped(skill)
                  }"
                  :disabled="isRegularSkillEdgeCapped(skill) || edgeChoices.length >= regularEdgesTotal"
                  :title="getRegularSkillEdgeTooltip(skill)"
                  @click="onAddRegularSkillEdge(skill)"
                >
                  <span class="skill-edge-btn__name">{{ skill }}</span>
                  <span class="skill-edge-btn__rank">{{ effectiveSkills[skill] || 'Untrained' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Regular Edges Tags -->
      <div v-if="edgeChoices.length" class="selected-tags">
        <span
          v-for="(edge, i) in edgeChoices"
          :key="i"
          class="tag tag--edge"
          :class="{ 'tag--skill-edge': edge.startsWith('Skill Edge:') }"
        >
          {{ edge }}
          <button class="tag__remove" @click="$emit('removeEdge', i)">&times;</button>
        </span>
      </div>
    </div>

    <!-- Bonus Skill Edges -->
    <div
      v-for="entry in bonusSkillEdges"
      :key="entry.level"
      class="levelup-edges__bonus"
    >
      <div class="section-subheader">
        <h4>Bonus Skill Edge (Level {{ entry.level }})</h4>
        <span
          class="counter"
          :class="{ 'counter--full': isBonusSlotFilled(entry.level) }"
        >
          {{ isBonusSlotFilled(entry.level) ? '1' : '0' }} / 1
        </span>
      </div>

      <p class="bonus-restriction">
        Cannot raise a skill to {{ entry.restrictedRank }} with this edge.
      </p>

      <div class="skill-edge-dropdown skill-edge-dropdown--bonus">
        <div class="skill-edge-dropdown__grid">
          <div
            v-for="(categorySkills, category) in PTU_SKILL_CATEGORIES"
            :key="category"
            class="skill-edge-category"
          >
            <h5>{{ category }}</h5>
            <div class="skill-edge-category__items">
              <button
                v-for="skill in categorySkills"
                :key="skill"
                class="skill-edge-btn"
                :class="{
                  'skill-edge-btn--blocked': isBonusSkillEdgeBlocked(skill, entry.restrictedRank),
                  'skill-edge-btn--capped': isBonusSkillEdgeAtCap(skill)
                }"
                :disabled="isBonusSkillEdgeBlocked(skill, entry.restrictedRank) || isBonusSkillEdgeAtCap(skill) || isBonusSlotFilled(entry.level)"
                :title="getBonusSkillEdgeTooltip(skill, entry.restrictedRank)"
                @click="$emit('addBonusSkillEdge', skill, entry.level)"
              >
                <span class="skill-edge-btn__name">{{ skill }}</span>
                <span class="skill-edge-btn__rank">{{ effectiveSkills[skill] || 'Untrained' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected Bonus Skill Edge -->
      <div v-if="getBonusChoiceForLevel(entry.level)" class="selected-tags">
        <span class="tag tag--skill-edge">
          Skill Edge: {{ getBonusChoiceForLevel(entry.level)!.skill }}
          <button class="tag__remove" @click="removeBonusByLevel(entry.level)">&times;</button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SkillRank } from '~/types/character'
import type { PtuSkillName } from '~/constants/trainerSkills'
import type { SkillRankName } from '~/constants/trainerStats'
import { PTU_SKILL_CATEGORIES } from '~/constants/trainerSkills'
import { RANK_PROGRESSION, getMaxSkillRankForLevel } from '~/constants/trainerStats'
import type { BonusSkillEdgeChoice } from '~/composables/useTrainerLevelUp'

interface Props {
  /** Current effective skills (character base + bonus skill edge rank-ups) */
  effectiveSkills: Record<string, SkillRank>
  /** Regular edges to choose in this level-up session */
  regularEdgesTotal: number
  /** Bonus Skill Edges to choose (from levels 2/6/12) */
  bonusSkillEdges: Array<{
    level: number
    restrictedRank: SkillRankName
  }>
  /** Edges chosen so far (regular) */
  edgeChoices: string[]
  /** Bonus Skill Edge choices so far */
  bonusSkillEdgeChoices: BonusSkillEdgeChoice[]
  /** Target level (for general skill rank cap) */
  targetLevel: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addEdge: [edgeName: string]
  removeEdge: [index: number]
  addBonusSkillEdge: [skill: PtuSkillName, fromLevel: number]
  removeBonusSkillEdge: [index: number]
}>()

// --- Local State ---
const newEdge = ref('')
const showRegularSkillEdge = ref(false)
const edgeError = ref('')

// --- Methods ---
function onAddEdge(): void {
  const trimmed = newEdge.value.trim()
  if (!trimmed) return

  // Block "Skill Edge:" prefix -- use the Skill Edge button instead
  if (trimmed.toLowerCase().startsWith('skill edge:')) {
    edgeError.value = 'Use the "Add Skill Edge" button for Skill Edges.'
    return
  }

  edgeError.value = ''
  emit('addEdge', trimmed)
  newEdge.value = ''
}

function isRegularSkillEdgeCapped(skill: PtuSkillName): boolean {
  const rank = props.effectiveSkills[skill] ?? 'Untrained'
  if (rank === 'Master') return true
  const maxRank = getMaxSkillRankForLevel(props.targetLevel)
  const rankIndex = RANK_PROGRESSION.indexOf(rank)
  const maxIndex = RANK_PROGRESSION.indexOf(maxRank)
  return rankIndex >= maxIndex
}

function getRegularSkillEdgeTooltip(skill: PtuSkillName): string {
  const rank = props.effectiveSkills[skill] ?? 'Untrained'
  if (rank === 'Master') return 'Already at Master rank'
  if (isRegularSkillEdgeCapped(skill)) return `At max rank for level ${props.targetLevel}`
  const progression: Record<string, string> = {
    'Pathetic': 'Untrained',
    'Untrained': 'Novice',
    'Novice': 'Adept',
    'Adept': 'Expert',
    'Expert': 'Master'
  }
  return `Raise ${skill} from ${rank} to ${progression[rank] || 'next rank'}`
}

function onAddRegularSkillEdge(skill: PtuSkillName): void {
  emit('addEdge', `Skill Edge: ${skill}`)
}

function isBonusSkillEdgeBlocked(skill: PtuSkillName, restrictedRank: SkillRankName): boolean {
  const effectiveRank = props.effectiveSkills[skill] ?? 'Untrained'
  const currentIndex = RANK_PROGRESSION.indexOf(effectiveRank)
  const nextRank = RANK_PROGRESSION[currentIndex + 1]
  return nextRank === restrictedRank
}

function isBonusSkillEdgeAtCap(skill: PtuSkillName): boolean {
  const rank = props.effectiveSkills[skill] ?? 'Untrained'
  if (rank === 'Master') return true
  const maxRank = getMaxSkillRankForLevel(props.targetLevel)
  const rankIndex = RANK_PROGRESSION.indexOf(rank)
  const maxIndex = RANK_PROGRESSION.indexOf(maxRank)
  return rankIndex >= maxIndex
}

function getBonusSkillEdgeTooltip(skill: PtuSkillName, restrictedRank: SkillRankName): string {
  const rank = props.effectiveSkills[skill] ?? 'Untrained'
  if (rank === 'Master') return 'Already at Master rank'
  if (isBonusSkillEdgeAtCap(skill)) return `At max rank for level ${props.targetLevel}`
  if (isBonusSkillEdgeBlocked(skill, restrictedRank)) {
    return `Cannot raise to ${restrictedRank} with this bonus edge`
  }
  const currentIndex = RANK_PROGRESSION.indexOf(rank)
  const nextRank = RANK_PROGRESSION[currentIndex + 1] ?? rank
  return `Raise ${skill} from ${rank} to ${nextRank}`
}

function isBonusSlotFilled(level: number): boolean {
  return props.bonusSkillEdgeChoices.some(c => c.fromLevel === level)
}

function getBonusChoiceForLevel(level: number): BonusSkillEdgeChoice | undefined {
  return props.bonusSkillEdgeChoices.find(c => c.fromLevel === level)
}

function removeBonusByLevel(level: number): void {
  const index = props.bonusSkillEdgeChoices.findIndex(c => c.fromLevel === level)
  if (index !== -1) {
    emit('removeBonusSkillEdge', index)
  }
}
</script>

<style lang="scss" scoped>
.levelup-edges {
  &__header {
    margin-bottom: $spacing-md;

    h3 {
      margin: 0;
      font-size: $font-size-md;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__regular {
    margin-bottom: $spacing-xl;
  }

  &__bonus {
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: rgba($color-info, 0.05);
    border: 1px solid rgba($color-info, 0.2);
    border-radius: $border-radius-md;
  }
}

.section-subheader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-sm;

  h4 {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.counter {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;

  &--full {
    color: $color-success;
    background: rgba($color-success, 0.1);
  }
}

.edge-input {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;

  .form-input {
    flex: 1;

    &--error {
      border-color: $color-danger;
    }
  }
}

.edge-error {
  font-size: $font-size-xs;
  color: $color-danger;
  margin: 0 0 $spacing-sm 0;
}

.bonus-restriction {
  font-size: $font-size-xs;
  color: $color-warning;
  margin: 0 0 $spacing-sm 0;
  font-style: italic;
}

.skill-edge-shortcut {
  margin-bottom: $spacing-md;

  .btn--active {
    background: rgba($color-warning, 0.15);
    border-color: rgba($color-warning, 0.4);
    color: $color-warning;
  }
}

.skill-edge-dropdown {
  margin-top: $spacing-sm;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid rgba($color-warning, 0.3);
  border-radius: $border-radius-sm;

  &--bonus {
    border-color: rgba($color-info, 0.3);
    background: $color-bg-secondary;
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    margin: 0 0 $spacing-sm 0;
    font-style: italic;
  }

  &__grid {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
}

.skill-edge-category {
  h5 {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-xs;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  &__items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: $spacing-xs;
  }
}

.skill-edge-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  cursor: pointer;
  font-size: $font-size-sm;
  transition: all $transition-fast;

  &:hover:not(:disabled) {
    border-color: $color-warning;
    background: rgba($color-warning, 0.1);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &--blocked {
    border-left: 3px solid $color-warning;
  }

  &--capped {
    opacity: 0.4;
  }

  &__name {
    font-weight: 500;
  }

  &__rank {
    font-size: $font-size-xs;
    padding: 2px $spacing-xs;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;
    text-transform: capitalize;
  }
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;

  &--edge {
    background: rgba($color-success, 0.1);
    border: 1px solid rgba($color-success, 0.3);
    color: $color-text;
  }

  &--skill-edge {
    background: rgba($color-warning, 0.1);
    border: 1px solid rgba($color-warning, 0.3);
    color: $color-warning;
  }

  &__remove {
    background: none;
    border: none;
    color: $color-text-muted;
    cursor: pointer;
    padding: 0;
    font-size: $font-size-md;
    line-height: 1;

    &:hover {
      color: $color-danger;
    }
  }
}

// Shared button styles (matching LevelUpModal patterns)
.btn {
  padding: $spacing-xs $spacing-sm;
  border: 1px solid transparent;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-fast;

  &--primary {
    background: $gradient-sv-cool;
    color: $color-text;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--secondary {
    background: $color-bg-tertiary;
    color: $color-text-secondary;
    border-color: $border-color-default;

    &:hover:not(:disabled) {
      background: $color-bg-hover;
      color: $color-text;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--sm {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
  }
}
</style>
