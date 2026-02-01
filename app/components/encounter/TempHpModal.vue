<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal modal--sm">
        <div class="modal__header">
          <h3>Add Temporary HP</h3>
          <button class="modal__close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal__body">
          <div class="form-group">
            <label>Temp HP Amount</label>
            <input
              v-model.number="tempHpInput"
              type="number"
              class="form-input"
              min="0"
              @keyup.enter="applyTempHp"
            />
          </div>
          <p v-if="currentTempHp > 0" class="temp-hp-note">
            Current Temp HP: {{ currentTempHp }} (will stack)
          </p>
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" @click="$emit('close')">Cancel</button>
          <button class="btn btn--primary" :disabled="tempHpInput <= 0" @click="applyTempHp">Apply</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  currentTempHp?: number
}>(), {
  currentTempHp: 0
})

const emit = defineEmits<{
  close: []
  apply: [amount: number]
}>()

const tempHpInput = ref(0)

const applyTempHp = () => {
  if (tempHpInput.value > 0) {
    emit('apply', tempHpInput.value)
    tempHpInput.value = 0
    emit('close')
  }
}
</script>

<style lang="scss" scoped>
.temp-hp-note {
  margin-top: $spacing-sm;
  font-size: $font-size-sm;
  color: $color-info;
}
</style>
