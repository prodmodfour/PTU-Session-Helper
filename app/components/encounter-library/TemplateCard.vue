<template>
  <div class="template-card" :class="{ 'template-card--selected': isSelected }">
    <div class="template-card__header">
      <h3 class="template-card__name">{{ template.name }}</h3>
      <div class="template-card__actions">
        <button
          class="btn btn--icon btn--ghost"
          @click="$emit('load', template)"
          title="Load Template"
        >
          📂
        </button>
        <button
          class="btn btn--icon btn--ghost"
          @click="$emit('duplicate', template)"
          title="Duplicate Template"
        >
          📋
        </button>
        <button
          class="btn btn--icon btn--ghost"
          @click="$emit('edit', template)"
          title="Edit Template"
        >
          ✏️
        </button>
        <button
          class="btn btn--icon btn--ghost btn--danger"
          @click="$emit('delete', template)"
          title="Delete Template"
        >
          🗑️
        </button>
      </div>
    </div>

    <p v-if="template.description" class="template-card__description">
      {{ template.description }}
    </p>

    <div class="template-card__meta">
      <span class="meta-item">
        <span class="meta-label">Type:</span>
        <span class="meta-value battle-type" :class="`battle-type--${template.battleType}`">
          {{ formatBattleType(template.battleType) }}
        </span>
      </span>
      <span class="meta-item">
        <span class="meta-label">Combatants:</span>
        <span class="meta-value">{{ template.combatants.length }}</span>
      </span>
      <span v-if="template.gridConfig" class="meta-item">
        <span class="meta-label">Grid:</span>
        <span class="meta-value">{{ template.gridConfig.width }}x{{ template.gridConfig.height }}</span>
      </span>
    </div>

    <!-- Combatants preview -->
    <div v-if="template.combatants.length > 0" class="template-card__preview">
      <div class="preview-header">Combatants</div>
      <div class="preview-combatants">
        <div
          v-for="(combatant, idx) in previewCombatants"
          :key="idx"
          class="preview-combatant"
        >
          <span class="combatant-side" :class="`side--${combatant.side}`">
            {{ getSideIcon(combatant.side) }}
          </span>
          <span class="combatant-name">{{ getCombatantName(combatant) }}</span>
          <span class="combatant-type">{{ combatant.type }}</span>
        </div>
        <div v-if="template.combatants.length > 5" class="preview-more">
          +{{ template.combatants.length - 5 }} more
        </div>
      </div>
    </div>

    <!-- Tags -->
    <div v-if="template.tags.length > 0" class="template-card__tags">
      <span
        v-for="tag in template.tags"
        :key="tag"
        class="tag"
      >
        {{ tag }}
      </span>
    </div>

    <!-- Category badge -->
    <div v-if="template.category" class="template-card__category">
      {{ template.category }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EncounterTemplate, TemplateCombatant } from '~/stores/encounterLibrary'

const props = defineProps<{
  template: EncounterTemplate
  isSelected?: boolean
}>()

defineEmits<{
  (e: 'load', template: EncounterTemplate): void
  (e: 'edit', template: EncounterTemplate): void
  (e: 'delete', template: EncounterTemplate): void
  (e: 'duplicate', template: EncounterTemplate): void
}>()

// Get preview combatants (first 5)
const previewCombatants = computed(() => {
  return props.template.combatants.slice(0, 5)
})

// Format battle type for display
const formatBattleType = (type: string): string => {
  const types: Record<string, string> = {
    trainer: 'Trainer Battle',
    full_contact: 'Full Contact',
    'full-contact': 'Full Contact' // Legacy compatibility
  }
  return types[type] || type
}

// Get side icon
const getSideIcon = (side: string): string => {
  const icons: Record<string, string> = {
    player: '🟢',
    ally: '🔵',
    enemy: '🔴'
  }
  return icons[side] || '⚪'
}

// Get combatant name for display
const getCombatantName = (combatant: TemplateCombatant): string => {
  if (!combatant.entityData) return 'Unknown'

  if (combatant.type === 'pokemon') {
    const data = combatant.entityData as { species: string; nickname?: string | null }
    return data.nickname || data.species
  } else {
    const data = combatant.entityData as { name: string }
    return data.name
  }
}
</script>

<style lang="scss" scoped>
.template-card {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  transition: border-color 0.2s ease;
  position: relative;

  &:hover {
    border-color: $color-primary;
  }

  &--selected {
    border-color: $color-accent-teal;
    box-shadow: 0 0 10px rgba($color-accent-teal, 0.3);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $spacing-sm;
  }

  &__name {
    margin: 0;
    font-size: 1.125rem;
    color: $color-text;
    font-weight: 600;
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
  }

  &__description {
    margin: 0 0 $spacing-md;
    color: $color-text-muted;
    font-size: 0.875rem;
    line-height: 1.4;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $glass-border;
  }

  &__preview {
    margin-bottom: $spacing-md;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-top: $spacing-sm;
  }

  &__category {
    position: absolute;
    top: $spacing-sm;
    right: $spacing-sm;
    padding: 2px 8px;
    background: rgba($color-accent-scarlet, 0.2);
    border-radius: $border-radius-sm;
    font-size: 0.75rem;
    color: $color-accent-scarlet;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.meta-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: 0.875rem;
}

.meta-label {
  color: $color-text-muted;
}

.meta-value {
  color: $color-text;
  font-weight: 500;
}

.battle-type {
  padding: 2px 8px;
  border-radius: $border-radius-sm;
  font-size: 0.75rem;

  &--trainer {
    background: rgba($color-primary, 0.2);
    color: $color-primary;
  }

  &--full_contact,
  &--full-contact {
    background: rgba(244, 67, 54, 0.2);
    color: #ef5350;
  }
}

.preview-header {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $color-text-muted;
  margin-bottom: $spacing-sm;
}

.preview-combatants {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.preview-combatant {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-size: 0.875rem;
}

.combatant-side {
  width: 20px;
  text-align: center;
}

.combatant-name {
  color: $color-text;
  flex: 1;
}

.combatant-type {
  font-size: 0.75rem;
  color: $color-text-muted;
  text-transform: capitalize;
}

.preview-more {
  font-size: 0.75rem;
  color: $color-text-muted;
  text-align: center;
  padding-top: $spacing-xs;
}

.tag {
  padding: 2px 8px;
  background: rgba($color-accent-teal, 0.2);
  border-radius: $border-radius-sm;
  font-size: 0.75rem;
  color: $color-accent-teal;
}

.btn--icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.btn--ghost {
  background: transparent;
  border: 1px solid transparent;

  &:hover {
    background: $glass-bg;
    border-color: $glass-border;
  }
}

.btn--danger:hover {
  background: rgba($color-danger, 0.2);
  border-color: $color-danger;
}
</style>
