<template>
  <div class="target-selection">
    <h4 v-if="showTitle">{{ title }}</h4>
    <div class="target-list">
      <button
        v-for="target in targets"
        :key="target.id"
        class="target-btn"
        :class="{
          'target-btn--selected': selectedIds.includes(target.id),
          'target-btn--ally': target.side === 'players' || target.side === 'allies',
          'target-btn--enemy': target.side === 'enemies',
          'target-btn--fainted': target.entity.currentHp <= 0
        }"
        @click="toggleTarget(target.id)"
      >
        <div class="target-btn__main">
          <span class="target-btn__name">{{ getTargetName(target) }}</span>
          <span class="target-btn__hp">{{ target.entity.currentHp }}/{{ target.entity.maxHp }}</span>
        </div>
        <slot name="target-extra" :target="target" :selected="selectedIds.includes(target.id)" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant } from '~/types'

const { getCombatantName: getTargetName } = useCombatantDisplay()

const props = withDefaults(defineProps<{
  targets: Combatant[]
  selectedIds: string[]
  title?: string
  showTitle?: boolean
  multiSelect?: boolean
}>(), {
  title: 'Select Target(s)',
  showTitle: true,
  multiSelect: true
})

const emit = defineEmits<{
  'update:selectedIds': [ids: string[]]
  select: [targetId: string]
  deselect: [targetId: string]
}>()

const toggleTarget = (targetId: string) => {
  const index = props.selectedIds.indexOf(targetId)

  if (index === -1) {
    // Add target
    if (props.multiSelect) {
      emit('update:selectedIds', [...props.selectedIds, targetId])
    } else {
      emit('update:selectedIds', [targetId])
    }
    emit('select', targetId)
  } else {
    // Remove target
    const newIds = props.selectedIds.filter(id => id !== targetId)
    emit('update:selectedIds', newIds)
    emit('deselect', targetId)
  }
}
</script>

<style lang="scss" scoped>
.target-selection {
  h4 {
    margin: 0 0 $spacing-sm 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

.target-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.target-btn {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 2px solid transparent;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;

  &:hover:not(:disabled) {
    background: $color-bg-hover;
  }

  &--selected {
    border-color: $color-accent-scarlet;
    background: rgba($color-accent-scarlet, 0.1);
  }

  &--ally {
    border-left: 3px solid $color-side-player;
  }

  &--enemy {
    border-left: 3px solid $color-side-enemy;
  }

  &--fainted {
    opacity: 0.5;
  }

  &__main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  &__name {
    font-weight: 500;
    color: $color-text;
  }

  &__hp {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}
</style>
