---
cap_id: capture-C002
name: attemptCapture
type: utility
domain: capture
---

### capture-C002: attemptCapture
- **cap_id**: capture-C002
- **name**: Capture Attempt Simulation
- **type**: utility
- **location**: `app/utils/captureRate.ts` -- `attemptCapture()`
- **game_concept**: PTU capture roll (1d100 system per decree-013)
- **description**: Simulates a capture attempt. Rolls 1d100. Modified roll = roll - trainerLevel + modifiers + ballModifier. Ball modifiers are negative (e.g. Great Ball = -10), reducing the roll to make capture easier. Critical hit (nat 20 accuracy) adds +10 to effective capture rate. Natural 100 always captures. Success if modifiedRoll <= effectiveCaptureRate.
- **inputs**: captureRate (number), trainerLevel (number), modifiers (number), criticalHit (boolean), ballModifier (number)
- **outputs**: { success, roll, modifiedRoll, effectiveCaptureRate, naturalHundred, ballModifier }
- **accessible_from**: gm, player (auto-imported utility)
