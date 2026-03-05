---
cap_id: capture-C043
name: BallSelector
type: component
domain: capture
---

### capture-C043: BallSelector
- **cap_id**: capture-C043
- **name**: Ball Type Selector Dropdown
- **type**: component
- **location**: `app/components/capture/BallSelector.vue`
- **game_concept**: PTU Chapter 9: selection UI for all 25 Poke Ball types
- **description**: Dropdown selector for Poke Ball types organized by category (Basic, Apricorn, Special, Safari). Displays ball name, base modifier (color-coded), conditional modifier preview via BallConditionPreview subcomponent (if conditionContext provided), and post-capture effect badges (Heal Max, +1 Loyalty, Happiness). Uses v-model for selected ball type. Click-outside dismisses dropdown. Optionally includes Safari balls (excluded by default).
- **inputs**: modelValue (selected ball name), conditionContext? (for live conditional preview), includeSafari?
- **outputs**: Emits update:modelValue with selected ball name
- **accessible_from**: gm (rendered inside CapturePanel)
