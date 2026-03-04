<template>
  <div class="environment-selector">
    <!-- Header -->
    <div class="environment-selector__header">
      <span class="environment-selector__title">Environment</span>
      <span
        v-if="activePreset"
        class="environment-selector__badge"
      >
        {{ activePreset.name }}
      </span>
      <span v-else class="environment-selector__badge environment-selector__badge--none">
        None
      </span>
    </div>

    <!-- Preset Picker -->
    <div class="environment-selector__picker">
      <label class="environment-selector__label">Environment Preset</label>
      <select
        v-model="selectedPresetId"
        class="environment-selector__select"
        @change="handlePresetChange"
      >
        <option value="">None</option>
        <option
          v-for="presetId in BUILT_IN_PRESET_IDS"
          :key="presetId"
          :value="presetId"
        >
          {{ PRESET_LABELS[presetId] }}
        </option>
        <option value="custom">Custom...</option>
      </select>
    </div>

    <!-- Custom Preset Name (when custom is selected) -->
    <div v-if="selectedPresetId === 'custom'" class="environment-selector__custom">
      <label class="environment-selector__label">Custom Name</label>
      <input
        v-model="customName"
        type="text"
        class="environment-selector__input"
        placeholder="e.g., Volcanic Crater"
      />
      <label class="environment-selector__label">Description</label>
      <textarea
        v-model="customDescription"
        class="environment-selector__textarea"
        placeholder="Describe the environmental rules..."
        rows="3"
      />
      <button
        class="btn btn--sm btn--primary"
        :disabled="!customName.trim()"
        @click="applyCustomPreset"
      >
        Apply Custom Preset
      </button>
    </div>

    <!-- Active Preset Details -->
    <div v-if="activePreset" class="environment-selector__details">
      <p class="environment-selector__description">
        {{ activePreset.description }}
      </p>

      <!-- Effect List -->
      <div class="environment-selector__effects">
        <div
          v-for="(effect, index) in activePreset.effects"
          :key="index"
          class="environment-effect"
        >
          <div class="environment-effect__header">
            <PhGlobe v-if="effect.type === 'terrain_override'" :size="14" />
            <PhTarget v-else-if="effect.type === 'accuracy_penalty'" :size="14" />
            <PhWarning v-else-if="effect.type === 'status_trigger'" :size="14" />
            <PhGear v-else-if="effect.type === 'movement_modifier'" :size="14" />
            <PhNote v-else :size="14" />
            <span class="environment-effect__type">{{ formatEffectType(effect.type) }}</span>
          </div>
          <div class="environment-effect__detail">
            <template v-if="effect.type === 'accuracy_penalty' && effect.accuracyPenaltyPerMeter">
              {{ effect.accuracyPenaltyPerMeter }} accuracy per unilluminated meter
            </template>
            <template v-else-if="effect.type === 'terrain_override' && effect.terrainRules">
              <span v-if="effect.terrainRules.slowTerrain">Slow Terrain. </span>
              <span v-if="effect.terrainRules.weightClassBreak">
                WC {{ effect.terrainRules.weightClassBreak }}+ breaks ice. </span>
              <span v-if="effect.terrainRules.acrobaticsOnInjury">
                Acrobatics DC 10 on injury.
              </span>
            </template>
            <template v-else-if="effect.type === 'status_trigger' && effect.statusOnEntry">
              On {{ effect.statusOnEntry.terrain }} entry:
              {{ effect.statusOnEntry.effect }}
              <span v-if="effect.statusOnEntry.stagePenalty">
                ({{ effect.statusOnEntry.stagePenalty.stat }}
                {{ effect.statusOnEntry.stagePenalty.stages }})
              </span>
            </template>
            <template v-else-if="effect.customRule">
              {{ effect.customRule }}
            </template>
          </div>
          <!-- Dismiss individual effect -->
          <button
            class="environment-effect__dismiss"
            title="Dismiss this effect"
            @click="dismissEffect(index)"
          >
            <PhX :size="12" />
          </button>
        </div>
      </div>

      <!-- Clear Preset -->
      <button
        class="btn btn--sm btn--ghost environment-selector__clear"
        @click="clearPreset"
      >
        Clear Environment
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PhGlobe,
  PhTarget,
  PhWarning,
  PhGear,
  PhNote,
  PhX
} from '@phosphor-icons/vue'
import type { EnvironmentPreset, EnvironmentEffect } from '~/types/encounter'
import {
  BUILT_IN_PRESETS,
  BUILT_IN_PRESET_IDS,
  PRESET_LABELS
} from '~/constants/environmentPresets'

const props = defineProps<{
  encounter: { id: string; environmentPreset?: EnvironmentPreset | null }
}>()

const encounterStore = useEncounterStore()
const { send } = useWebSocket()

// Local state
const selectedPresetId = ref<string>(props.encounter.environmentPreset?.id ?? '')
const customName = ref('')
const customDescription = ref('')

// Computed
const activePreset = computed((): EnvironmentPreset | null => {
  return encounterStore.activeEnvironmentPreset ?? null
})

// Watch for external changes (WebSocket updates)
watch(() => props.encounter.environmentPreset, (newPreset) => {
  selectedPresetId.value = newPreset?.id ?? ''
})

// Handlers
const handlePresetChange = async () => {
  const id = selectedPresetId.value
  if (id === 'custom') return // Wait for custom form submission
  if (!id) {
    await clearPreset()
    return
  }

  const preset = BUILT_IN_PRESETS[id]
  if (!preset) return

  try {
    await encounterStore.setEnvironmentPreset(props.encounter.id, preset)
    broadcastUpdate()
  } catch {
    alert('Failed to set environment preset.')
  }
}

const applyCustomPreset = async () => {
  if (!customName.value.trim()) return

  const preset: EnvironmentPreset = {
    id: `custom-${Date.now()}`,
    name: customName.value.trim(),
    description: customDescription.value.trim() || 'Custom environment preset.',
    effects: [
      {
        type: 'custom',
        customRule: customDescription.value.trim() || 'GM-defined environmental rules.'
      }
    ]
  }

  try {
    await encounterStore.setEnvironmentPreset(props.encounter.id, preset)
    selectedPresetId.value = preset.id
    broadcastUpdate()
  } catch {
    alert('Failed to apply custom environment preset.')
  }
}

const clearPreset = async () => {
  try {
    await encounterStore.setEnvironmentPreset(props.encounter.id, null)
    selectedPresetId.value = ''
    broadcastUpdate()
  } catch {
    alert('Failed to clear environment preset.')
  }
}

const dismissEffect = async (index: number) => {
  if (!activePreset.value) return

  const updatedEffects = activePreset.value.effects.filter((_, i) => i !== index)
  if (updatedEffects.length === 0) {
    await clearPreset()
    return
  }

  const updatedPreset: EnvironmentPreset = {
    ...activePreset.value,
    effects: updatedEffects
  }

  try {
    await encounterStore.setEnvironmentPreset(props.encounter.id, updatedPreset)
    broadcastUpdate()
  } catch {
    alert('Failed to dismiss environment effect.')
  }
}

const broadcastUpdate = () => {
  if (encounterStore.encounter) {
    send({
      type: 'encounter_update',
      data: encounterStore.encounter
    })
  }
}

const formatEffectType = (type: EnvironmentEffect['type']): string => {
  switch (type) {
    case 'accuracy_penalty': return 'Accuracy'
    case 'terrain_override': return 'Terrain'
    case 'status_trigger': return 'Status'
    case 'movement_modifier': return 'Movement'
    case 'custom': return 'Rule'
    default: return 'Effect'
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/components/environment-selector';
</style>
