---
cap_id: capture-C042
name: CapturePanel
type: component
domain: capture
---

### capture-C042: CapturePanel
- **cap_id**: capture-C042
- **name**: Capture Panel (GM)
- **type**: component
- **location**: `app/components/capture/CapturePanel.vue`
- **game_concept**: GM interface for executing Poke Ball throw with ball selection, context toggles, accuracy check, and capture roll
- **description**: Full GM capture workflow component. Features: (1) BallSelector for choosing ball type (25 types with live modifier preview), (2) CaptureContextToggles for GM flags (baited, dark/low-light, underwater), (3) CaptureRateDisplay with live preview as ball/context changes, (4) "Throw" button that rolls accuracy (decree-042 with full accuracy params) then calls attemptCapture API, (5) Result display with roll breakdown, modified roll, ball modifier, outcome (captured/escaped), natural 100 auto-capture, post-capture effect notification. Emits 'captured' event on success.
- **inputs**: pokemonId, pokemonData, encounterId?, trainerId, accuracyParams?
- **outputs**: Emits 'captured' with CaptureAttemptResult
- **accessible_from**: gm (rendered inside CombatantCaptureSection)
