<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal confirm-modal" data-testid="confirm-modal">
      <div class="modal__header">
        <h2>{{ title }}</h2>
        <button class="modal__close" @click="$emit('cancel')">&times;</button>
      </div>

      <div class="modal__body">
        <p>{{ message }}</p>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('cancel')">
          {{ cancelText }}
        </button>
        <button
          :class="['btn', confirmClass]"
          @click="$emit('confirm')"
          data-testid="confirm-btn"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmClass?: string
}>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmClass: 'btn--primary'
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style lang="scss" scoped>
.confirm-modal {
  max-width: 400px;

  .modal__body {
    p {
      color: $color-text-muted;
      line-height: 1.6;
    }
  }
}
</style>
