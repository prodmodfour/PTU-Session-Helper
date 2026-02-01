<template>
  <div class="tab-content">
    <!-- Pokemon Notes -->
    <template v-if="isPokemon">
      <div class="form-group">
        <label>Notes</label>
        <textarea
          :value="notes"
          @input="$emit('update:notes', ($event.target as HTMLTextAreaElement).value)"
          class="form-input"
          rows="6"
          :disabled="!isEditing"
        ></textarea>
      </div>
      <div v-if="heldItem" class="info-section">
        <h4>Held Item</h4>
        <p>{{ heldItem }}</p>
      </div>
    </template>

    <!-- Human Notes -->
    <template v-else>
      <div class="form-group">
        <label>Background</label>
        <textarea
          :value="background"
          @input="$emit('update:background', ($event.target as HTMLTextAreaElement).value)"
          class="form-input"
          rows="3"
          :disabled="!isEditing"
        ></textarea>
      </div>
      <div class="form-group">
        <label>Personality</label>
        <textarea
          :value="personality"
          @input="$emit('update:personality', ($event.target as HTMLTextAreaElement).value)"
          class="form-input"
          rows="3"
          :disabled="!isEditing"
        ></textarea>
      </div>
      <div class="form-group">
        <label>Goals</label>
        <textarea
          :value="goals"
          @input="$emit('update:goals', ($event.target as HTMLTextAreaElement).value)"
          class="form-input"
          rows="3"
          :disabled="!isEditing"
        ></textarea>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea
          :value="notes"
          @input="$emit('update:notes', ($event.target as HTMLTextAreaElement).value)"
          class="form-input"
          rows="3"
          :disabled="!isEditing"
        ></textarea>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isPokemon: boolean
  isEditing: boolean
  notes?: string
  heldItem?: string
  background?: string
  personality?: string
  goals?: string
}>()

defineEmits<{
  'update:notes': [value: string]
  'update:background': [value: string]
  'update:personality': [value: string]
  'update:goals': [value: string]
}>()
</script>

<style lang="scss" scoped>
.form-group {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    display: block;
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }
}

.form-input {
  width: 100%;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;
  font-family: inherit;
  resize: vertical;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    border-color: $color-accent-teal;
  }
}

.info-section {
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color-default;

  h4 {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
  }

  p {
    margin: 0;
    color: $color-text;
  }
}
</style>
