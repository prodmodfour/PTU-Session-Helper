<template>
  <div class="action-section">
    <button class="section-toggle" @click="showConditions = !showConditions">
      <h3>Status Conditions</h3>
      <span class="section-toggle__icon" :class="{ 'section-toggle__icon--open': showConditions }">
        &#x25BC;
      </span>
    </button>
    <div v-if="showConditions" class="conditions-section">
      <!-- Current Conditions -->
      <div v-if="currentConditions.length > 0" class="current-conditions">
        <p class="conditions-label">Active:</p>
        <div class="condition-tags">
          <button
            v-for="condition in currentConditions"
            :key="condition"
            class="condition-tag condition-tag--active"
            :class="getConditionClass(condition)"
            @click="$emit('removeCondition', condition)"
            :title="'Click to remove ' + condition"
          >
            {{ formatCondition(condition) }}
            <span class="condition-tag__remove">&times;</span>
          </button>
        </div>
      </div>
      <p v-else class="no-conditions">No active conditions</p>

      <!-- Add Conditions -->
      <div class="add-conditions">
        <p class="conditions-label">Persistent:</p>
        <div class="condition-tags">
          <button
            v-for="condition in persistentConditions"
            :key="condition"
            class="condition-tag"
            :class="[getConditionClass(condition), { 'condition-tag--has': hasCondition(condition) }]"
            :disabled="hasCondition(condition)"
            @click="$emit('addCondition', condition)"
          >
            {{ condition }}
          </button>
        </div>

        <p class="conditions-label">Volatile:</p>
        <div class="condition-tags">
          <button
            v-for="condition in volatileConditions"
            :key="condition"
            class="condition-tag"
            :class="[getConditionClass(condition), { 'condition-tag--has': hasCondition(condition) }]"
            :disabled="hasCondition(condition)"
            @click="$emit('addCondition', condition)"
          >
            {{ condition }}
          </button>
        </div>

        <p class="conditions-label">Other:</p>
        <div class="condition-tags">
          <button
            v-for="condition in otherConditions"
            :key="condition"
            class="condition-tag"
            :class="[getConditionClass(condition), { 'condition-tag--has': hasCondition(condition) }]"
            :disabled="hasCondition(condition)"
            @click="$emit('addCondition', condition)"
          >
            {{ condition }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusCondition, ConditionInstance } from '~/types'
import {
  PERSISTENT_CONDITIONS,
  VOLATILE_CONDITIONS,
  OTHER_CONDITIONS,
  getConditionClass
} from '~/constants/statusConditions'
import { formatConditionDisplay } from '~/constants/conditionSourceRules'

const props = defineProps<{
  currentConditions: StatusCondition[]
  conditionInstances?: ConditionInstance[]
}>()

defineEmits<{
  addCondition: [condition: StatusCondition]
  removeCondition: [condition: StatusCondition]
}>()

const showConditions = ref(false)

const persistentConditions = PERSISTENT_CONDITIONS
const volatileConditions = VOLATILE_CONDITIONS
const otherConditions = OTHER_CONDITIONS

const hasCondition = (condition: StatusCondition): boolean => {
  return props.currentConditions.includes(condition)
}

const formatCondition = (condition: StatusCondition): string => {
  return formatConditionDisplay(condition, props.conditionInstances)
}
</script>

<style lang="scss" scoped>
// Status Conditions Section
.conditions-section {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.current-conditions {
  padding: $spacing-md;
  background: rgba($color-danger, 0.1);
  border: 1px solid rgba($color-danger, 0.3);
  border-radius: $border-radius-md;
}

.no-conditions {
  color: $color-text-muted;
  font-size: $font-size-sm;
  font-style: italic;
  margin: 0;
}

.conditions-label {
  margin: 0 0 $spacing-xs;
  font-size: $font-size-xs;
  color: $color-text-muted;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.condition-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-bottom: $spacing-md;

  &:last-child {
    margin-bottom: 0;
  }
}

// condition-tag styles now in global main.scss

.add-conditions {
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
}

// Section toggle for collapsible sections
.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  margin-bottom: $spacing-md;
  background: none;
  border: none;
  cursor: pointer;
  color: $color-text;

  h3 {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__icon {
    font-size: $font-size-xs;
    color: $color-text-muted;
    transition: transform $transition-fast;

    &--open {
      transform: rotate(180deg);
    }
  }

  &:hover h3 {
    color: $color-text;
  }
}

.action-section {
  margin-bottom: $spacing-xl;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}
</style>
