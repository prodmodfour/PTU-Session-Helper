<template>
  <div class="gm-encounter__empty">
    <div class="gm-encounter__new-section">
      <h2>No Active Encounter</h2>
      <p>Start a new encounter or load an existing one.</p>

      <div class="gm-encounter__new">
        <div class="form-group">
          <label>Encounter Name</label>
          <input
            v-model="encounterName"
            type="text"
            class="form-input"
            placeholder="Route 1 Wild Battle"
          />
        </div>

        <div class="form-group">
          <label>Battle Type</label>
          <select v-model="battleType" class="form-select">
            <option value="trainer">Trainer Battle</option>
            <option value="full_contact">Full Contact</option>
          </select>
        </div>

        <button class="btn btn--primary" @click="handleCreate">
          Start New Encounter
        </button>

        <div class="template-options">
          <span class="template-divider">or</span>
          <button class="btn btn--secondary btn--with-icon" @click="$emit('loadTemplate')">
            <img src="/icons/phosphor/folder-open.svg" alt="" class="btn-svg" />
            Load from Template
          </button>
          <NuxtLink to="/gm/encounters" class="btn btn--ghost">
            Browse Library
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  create: [name: string, battleType: 'trainer' | 'full_contact']
  loadTemplate: []
}>()

const encounterName = ref('')
const battleType = ref<'trainer' | 'full_contact'>('trainer')

const handleCreate = () => {
  const name = encounterName.value.trim() || 'New Encounter'
  emit('create', name, battleType.value)
  encounterName.value = ''
}
</script>

<style lang="scss" scoped>
.gm-encounter {
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    text-align: center;

    h2 {
      margin-bottom: $spacing-sm;
      color: $color-text;
    }

    p {
      color: $color-text-muted;
      margin-bottom: $spacing-xl;
    }
  }

  &__new {
    background: $glass-bg;
    backdrop-filter: $glass-blur;
    border: 1px solid $glass-border;
    padding: $spacing-xl;
    border-radius: $border-radius-lg;
    width: 100%;
    max-width: 400px;
    box-shadow: $shadow-lg;

    .form-group {
      margin-bottom: $spacing-md;
    }

    .btn {
      width: 100%;
      margin-top: $spacing-md;
    }
  }

  &__new-section {
    text-align: center;

    h2 {
      margin-bottom: $spacing-sm;
    }

    p {
      color: $color-text-muted;
      margin-bottom: $spacing-xl;
    }
  }
}

.template-options {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $glass-border;

  .btn {
    margin-top: 0;
  }
}

.template-divider {
  color: $color-text-muted;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.btn--ghost {
  background: transparent;
  border: 1px solid $glass-border;
  color: $color-text-muted;

  &:hover {
    border-color: $color-primary;
    color: $color-text;
  }
}

.btn-svg {
  width: 16px;
  height: 16px;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}

.btn--with-icon {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
}
</style>
