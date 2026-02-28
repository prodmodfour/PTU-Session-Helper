<template>
  <div class="levelup-skills">
    <div class="levelup-skills__header">
      <h3>Skill Rank Allocation</h3>
      <div
        class="levelup-skills__pool"
        :class="{
          'levelup-skills__pool--empty': ranksRemaining === 0,
          'levelup-skills__pool--over': ranksRemaining < 0
        }"
      >
        Ranks Remaining: <strong>{{ ranksRemaining }}</strong> / {{ totalRanks }}
      </div>
    </div>

    <div v-if="capsUnlocked.length" class="levelup-skills__caps">
      <div v-for="cap in capsUnlocked" :key="cap.level" class="cap-badge">
        New Skill Cap: <strong>{{ cap.cap }}</strong> (unlocked at L{{ cap.level }})
      </div>
    </div>

    <div class="levelup-skills__categories">
      <div
        v-for="(skills, category) in groupedSkills"
        :key="category"
        class="skill-category"
      >
        <h4 class="skill-category__title">{{ category }}</h4>
        <div class="skill-category__list">
          <div
            v-for="skill in skills"
            :key="skill.name"
            class="skill-item"
            :class="{
              'skill-item--selectable': skill.selectable,
              'skill-item--capped': !skill.selectable && ranksRemaining > 0,
              'skill-item--upgraded': skill.pendingUps > 0
            }"
          >
            <span class="skill-item__name">{{ skill.name }}</span>
            <span class="skill-item__rank" :class="`skill-item__rank--${skill.effectiveRank.toLowerCase()}`">
              {{ skill.baseRank !== skill.effectiveRank
                ? `${skill.baseRank} -> ${skill.effectiveRank}`
                : skill.effectiveRank
              }}
            </span>
            <button
              v-if="skill.selectable"
              class="skill-item__btn"
              @click="$emit('addSkillRank', skill.name)"
            >
              +
            </button>
            <span v-else-if="!skill.selectable && ranksRemaining > 0" class="skill-item__capped">
              (capped)
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="skillChoices.length" class="levelup-skills__chosen">
      <h4>Chosen Rank-Ups</h4>
      <div class="chosen-list">
        <div
          v-for="(choice, index) in choiceDetails"
          :key="index"
          class="chosen-item"
        >
          <span class="chosen-item__text">{{ choice.name }}: {{ choice.from }} -> {{ choice.to }}</span>
          <button class="chosen-item__remove" @click="$emit('removeSkillRank', index)">x</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SkillRank } from '~/types/character'
import type { PtuSkillName } from '~/constants/trainerSkills'
import type { SkillRankName } from '~/constants/trainerStats'
import { PTU_SKILL_CATEGORIES } from '~/constants/trainerSkills'

interface Props {
  /** Current skill ranks (from character) */
  currentSkills: Record<string, SkillRank>
  /** Skills already chosen for rank-up in this session */
  skillChoices: PtuSkillName[]
  /** Total skill ranks to allocate */
  totalRanks: number
  /** Ranks remaining to allocate */
  ranksRemaining: number
  /** Target level (for skill rank cap) */
  targetLevel: number
  /** Skill rank caps unlocked in this advancement */
  capsUnlocked: Array<{ level: number; cap: SkillRankName }>
  /** Function to get effective rank accounting for pending rank-ups */
  getEffectiveSkillRank: (skill: PtuSkillName) => SkillRank
  /** Function to check if a skill can be ranked up further */
  canRankUpSkill: (skill: PtuSkillName) => boolean
}

const props = defineProps<Props>()

defineEmits<{
  addSkillRank: [skill: PtuSkillName]
  removeSkillRank: [index: number]
}>()

const RANK_PROGRESSION: readonly SkillRank[] = [
  'Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master'
] as const

interface SkillDisplay {
  name: PtuSkillName
  baseRank: SkillRank
  effectiveRank: SkillRank
  pendingUps: number
  selectable: boolean
}

/** Group skills by category with computed display data */
const groupedSkills = computed((): Record<string, SkillDisplay[]> => {
  const result: Record<string, SkillDisplay[]> = {}

  for (const [category, skills] of Object.entries(PTU_SKILL_CATEGORIES)) {
    result[category] = skills.map((skillName) => {
      const baseRank = (props.currentSkills[skillName] as SkillRank) ?? 'Untrained'
      const effectiveRank = props.getEffectiveSkillRank(skillName)
      const pendingUps = props.skillChoices.filter(s => s === skillName).length

      return {
        name: skillName,
        baseRank,
        effectiveRank,
        pendingUps,
        selectable: props.canRankUpSkill(skillName)
      }
    })
  }

  return result
})

/** Compute details for each chosen rank-up (for the "Chosen" list) */
const choiceDetails = computed(() => {
  // Track cumulative rank-ups per skill to show correct from -> to
  const rankUpsApplied: Record<string, number> = {}

  return props.skillChoices.map((skillName) => {
    const appliedSoFar = rankUpsApplied[skillName] ?? 0
    const baseRank = (props.currentSkills[skillName] as SkillRank) ?? 'Untrained'
    const baseIndex = RANK_PROGRESSION.indexOf(baseRank)
    const fromIndex = Math.min(baseIndex + appliedSoFar, RANK_PROGRESSION.length - 1)
    const toIndex = Math.min(fromIndex + 1, RANK_PROGRESSION.length - 1)

    rankUpsApplied[skillName] = appliedSoFar + 1

    return {
      name: skillName,
      from: RANK_PROGRESSION[fromIndex],
      to: RANK_PROGRESSION[toIndex]
    }
  })
})
</script>

<style lang="scss" scoped>
.levelup-skills {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    h3 {
      margin: 0;
      font-size: $font-size-md;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__pool {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    padding: $spacing-xs $spacing-md;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;
    border: 1px solid $border-color-default;

    strong {
      color: $color-info;
      font-size: $font-size-md;
    }

    &--empty strong {
      color: $color-success;
    }

    &--over strong {
      color: $color-danger;
    }
  }

  &__caps {
    margin-bottom: $spacing-md;
  }

  &__categories {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
  }

  &__chosen {
    margin-top: $spacing-lg;
    padding-top: $spacing-md;
    border-top: 1px solid $glass-border;

    h4 {
      margin: 0 0 $spacing-sm 0;
      font-size: $font-size-sm;
      color: $color-text-secondary;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}

.cap-badge {
  display: inline-block;
  padding: $spacing-xs $spacing-md;
  background: rgba($color-info, 0.15);
  border: 1px solid rgba($color-info, 0.3);
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  color: $color-info;

  strong {
    color: $color-accent-teal;
  }
}

.skill-category {
  &__title {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: $spacing-xs;
    border-bottom: 1px solid $glass-border;
  }

  &__list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-xs;

    @media (max-width: 500px) {
      grid-template-columns: 1fr;
    }
  }
}

.skill-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  transition: all $transition-fast;

  &--selectable {
    cursor: pointer;

    &:hover {
      border-color: $color-accent-teal;
      background: $color-bg-hover;
    }
  }

  &--capped {
    opacity: 0.6;
  }

  &--upgraded {
    border-color: rgba($color-success, 0.4);
    background: rgba($color-success, 0.05);
  }

  &__name {
    font-size: $font-size-sm;
    color: $color-text;
    flex: 1;
  }

  &__rank {
    font-size: $font-size-xs;
    font-weight: 500;

    &--pathetic { color: $color-danger; }
    &--untrained { color: $color-text-muted; }
    &--novice { color: $color-text; }
    &--adept { color: $color-success; }
    &--expert { color: $color-info; }
    &--master { color: gold; }
  }

  &__btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid $border-color-emphasis;
    border-radius: $border-radius-sm;
    background: $color-bg-secondary;
    color: $color-success;
    cursor: pointer;
    font-size: $font-size-sm;
    font-weight: 700;
    transition: all $transition-fast;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;

    &:hover {
      background: rgba($color-success, 0.15);
      border-color: $color-success;
    }
  }

  &__capped {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-style: italic;
  }
}

.chosen-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.chosen-item {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: rgba($color-success, 0.1);
  border: 1px solid rgba($color-success, 0.3);
  border-radius: $border-radius-sm;

  &__text {
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__remove {
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: $border-radius-sm;
    background: transparent;
    color: $color-text-muted;
    cursor: pointer;
    font-size: $font-size-xs;
    padding: 0;
    line-height: 1;

    &:hover {
      color: $color-danger;
      background: rgba($color-danger, 0.15);
    }
  }
}
</style>
