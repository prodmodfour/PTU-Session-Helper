<template>
  <div class="groups-panel" :class="{ 'groups-panel--collapsed': collapsed }">
    <!-- Collapsed State -->
    <div v-if="collapsed" class="collapsed-strip" @click="emit('toggle-collapse')">
      <PhRectangleDashed :size="20" />
      <span v-if="scene.groups.length > 0" class="collapsed-badge">{{ scene.groups.length }}</span>
    </div>

    <!-- Expanded State -->
    <template v-else>
      <div class="panel-header">
        <h3>Groups</h3>
        <div class="panel-header__actions">
          <button class="btn btn--sm btn--ghost" @click="emit('create-group')">
            <PhPlus :size="16" />
          </button>
          <button class="btn btn--sm btn--ghost" @click="emit('toggle-collapse')">
            <PhCaretLeft :size="16" />
          </button>
        </div>
      </div>

      <div class="panel-content">
        <div v-if="scene.groups.length === 0" class="empty-list">
          No groups. Click + to create one.
        </div>
        <div v-else class="groups-list">
          <div
            v-for="group in scene.groups"
            :key="group.id"
            class="group-item"
            :class="{ 'group-item--selected': selectedGroupId === group.id }"
            @click="emit('select-group', group.id)"
          >
            <input
              :value="group.name"
              class="group-name-input"
              @blur="emit('rename-group', group.id, ($event.target as HTMLInputElement).value)"
              @click.stop
            />
            <span class="group-count">{{ getGroupMemberCount(group.id) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhRectangleDashed, PhPlus, PhCaretLeft } from '@phosphor-icons/vue'
import type { Scene } from '~/stores/groupViewTabs'

const props = defineProps<{
  scene: Scene
  selectedGroupId: string | null
  collapsed: boolean
}>()

const emit = defineEmits<{
  'create-group': []
  'delete-group': [id: string]
  'select-group': [id: string]
  'rename-group': [groupId: string, name: string]
  'toggle-collapse': []
}>()

const getGroupMemberCount = (groupId: string): number => {
  const pokemonCount = props.scene.pokemon.filter(p => p.groupId === groupId).length
  const characterCount = props.scene.characters.filter(c => c.groupId === groupId).length
  return pokemonCount + characterCount
}
</script>

<style lang="scss" scoped>
.groups-panel {
  width: 280px;
  background: $color-bg-secondary;
  border-right: 1px solid $border-color-default;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;

  &--collapsed {
    width: 40px;
  }
}

.collapsed-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md $spacing-xs;
  gap: $spacing-sm;
  cursor: pointer;
  color: $color-text-muted;

  &:hover {
    color: $color-text;
    background: $color-bg-tertiary;
  }
}

.collapsed-badge {
  padding: 2px $spacing-xs;
  background: $color-primary;
  border-radius: $border-radius-full;
  font-size: $font-size-xs;
  color: white;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid $border-color-default;

  h3 {
    margin: 0;
    font-size: $font-size-md;
    color: $color-text;
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-md;
}

.empty-list {
  padding: $spacing-md;
  text-align: center;
  color: $color-text-muted;
  font-size: $font-size-sm;
}

.groups-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.group-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  cursor: pointer;

  &--selected {
    background: rgba($color-primary, 0.2);
  }

  .group-name-input {
    flex: 1;
    padding: $spacing-xs;
    background: transparent;
    border: none;
    color: $color-text;
    font-size: $font-size-sm;

    &:focus {
      outline: none;
      background: $color-bg-secondary;
    }
  }

  .group-count {
    padding: 2px $spacing-sm;
    background: $color-bg-secondary;
    border-radius: $border-radius-full;
    font-size: $font-size-xs;
    color: $color-text-muted;
  }
}
</style>
