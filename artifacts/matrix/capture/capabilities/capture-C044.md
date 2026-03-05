---
cap_id: capture-C044
name: CaptureContextToggles
type: component
domain: capture
---

### capture-C044: CaptureContextToggles
- **cap_id**: capture-C044
- **name**: Capture Context Toggles (GM)
- **type**: component
- **location**: `app/components/capture/CaptureContextToggles.vue`
- **game_concept**: GM overrides for ball condition context flags
- **description**: Three checkbox toggles for GM-provided context that cannot be auto-detected: (1) targetWasBaited -- Lure Ball condition, (2) isDarkOrLowLight -- Dusk Ball condition, (3) isUnderwaterOrUnderground -- Dive Ball condition. Uses v-model with ContextFlags type. Changes immediately reflected in ball modifier preview.
- **inputs**: modelValue (ContextFlags: { targetWasBaited, isDarkOrLowLight, isUnderwaterOrUnderground })
- **outputs**: Emits update:modelValue with updated flags
- **accessible_from**: gm (rendered inside CapturePanel)
