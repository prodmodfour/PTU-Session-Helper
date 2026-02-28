<template>
  <div v-if="hasDeclarations" class="declaration-summary">
    <div class="summary-header" @click="expanded = !expanded">
      <PhListBullets :size="18" />
      <span>Trainer Declarations (Round {{ currentRound }})</span>
      <PhCaretDown :size="14" :class="{ rotated: !expanded }" />
    </div>

    <div v-show="expanded" class="summary-list">
      <div
        v-for="declaration in roundDeclarations"
        :key="declaration.combatantId"
        class="declaration-item"
        :class="{
          'is-resolving': isCurrentlyResolving(declaration.combatantId),
          'is-resolved': isResolved(declaration.combatantId)
        }"
      >
        <span class="trainer-name">{{ declaration.trainerName }}</span>
        <span class="action-badge" :class="'action-badge--' + declaration.actionType">
          {{ formatActionType(declaration.actionType) }}
        </span>
        <span class="declaration-text">{{ declaration.description }}</span>
        <PhCheck v-if="isResolved(declaration.combatantId)" :size="14" class="resolved-icon" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhListBullets, PhCaretDown, PhCheck } from '@phosphor-icons/vue'

const encounterStore = useEncounterStore()

const expanded = ref(true)

const hasDeclarations = computed(() =>
  encounterStore.currentDeclarations.length > 0
)

const roundDeclarations = computed(() =>
  encounterStore.currentDeclarations
)

const currentRound = computed(() =>
  encounterStore.currentRound
)

function isCurrentlyResolving(combatantId: string): boolean {
  if (encounterStore.currentPhase !== 'trainer_resolution') return false
  return encounterStore.currentCombatant?.id === combatantId
}

function isResolved(combatantId: string): boolean {
  if (encounterStore.currentPhase !== 'trainer_resolution') return false
  const turnOrder = encounterStore.encounter?.turnOrder ?? []
  const currentIndex = encounterStore.encounter?.currentTurnIndex ?? 0
  const combatantIndex = turnOrder.indexOf(combatantId)
  return combatantIndex >= 0 && combatantIndex < currentIndex
}

function formatActionType(type: string): string {
  const labels: Record<string, string> = {
    command_pokemon: 'Command',
    switch_pokemon: 'Switch',
    use_item: 'Item',
    use_feature: 'Feature',
    orders: 'Orders',
    pass: 'Pass'
  }
  return labels[type] ?? type
}
</script>

<style lang="scss" scoped>
.declaration-summary {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  overflow: hidden;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  cursor: pointer;
  user-select: none;
  font-size: $font-size-sm;
  font-weight: 600;
  color: $color-accent-violet-light;
  border-bottom: 1px solid $glass-border;
  transition: background 0.15s ease;

  &:hover {
    background: rgba($color-accent-violet, 0.08);
  }

  .rotated {
    transform: rotate(-90deg);
    transition: transform 0.2s ease;
  }
}

.summary-list {
  display: flex;
  flex-direction: column;
}

.declaration-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  border-bottom: 1px solid rgba($glass-border, 0.5);
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &.is-resolving {
    background: rgba($color-accent-violet, 0.15);
    border-left: 3px solid $color-accent-violet;
    box-shadow: inset 0 0 12px rgba($color-accent-violet, 0.1);
  }

  &.is-resolved {
    opacity: 0.6;
  }
}

.trainer-name {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $color-text;
  white-space: nowrap;
  min-width: 80px;
}

.action-badge {
  font-size: $font-size-xs;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 2px $spacing-xs;
  border-radius: $border-radius-sm;
  white-space: nowrap;

  &--command_pokemon {
    background: rgba($color-side-player, 0.2);
    color: $color-side-player;
  }

  &--switch_pokemon {
    background: rgba(#f59e0b, 0.2);
    color: #fbbf24;
  }

  &--use_item {
    background: rgba($color-side-ally, 0.2);
    color: $color-side-ally;
  }

  &--use_feature {
    background: rgba($color-accent-violet, 0.2);
    color: $color-accent-violet-light;
  }

  &--orders {
    background: rgba(#06b6d4, 0.2);
    color: #22d3ee;
  }

  &--pass {
    background: rgba($color-text-muted, 0.15);
    color: $color-text-muted;
  }
}

.declaration-text {
  flex: 1;
  font-size: $font-size-sm;
  color: $color-text-muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resolved-icon {
  color: $color-success;
  flex-shrink: 0;
}
</style>
