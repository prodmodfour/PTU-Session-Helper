---
cap_id: capture-C045
name: CaptureRateDisplay
type: component
domain: capture
---

### capture-C045: CaptureRateDisplay
- **cap_id**: capture-C045
- **name**: Capture Rate Display
- **type**: component
- **location**: `app/components/encounter/CaptureRateDisplay.vue`
- **game_concept**: Visual capture rate indicator with breakdown tooltip
- **description**: Displays capture rate percentage, difficulty label, and color-coded border (green Very Easy to red Very Difficult, grayed out for Impossible/fainted). Hover reveals detailed breakdown: base 100, level modifier, HP modifier, evolution modifier, shiny, legendary, status, injuries, Stuck, Slow. When ball type is not Basic Ball, shows ball modifier breakdown: base modifier, conditional modifier (met or n/a), total. Optional "Attempt Capture" button.
- **inputs**: captureRate (CaptureRateData), showBreakdown?, showAttemptButton?
- **outputs**: Emits 'attempt' when button clicked
- **accessible_from**: gm, player (used in CapturePanel and PlayerCapturePanel)
