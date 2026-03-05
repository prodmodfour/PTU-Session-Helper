---
cap_id: capture-C048
name: PlayerCombatActions.captureButton
type: component
domain: capture
---

### capture-C048: PlayerCombatActions Capture Button
- **cap_id**: capture-C048
- **name**: Player Combat Actions Capture Button
- **type**: component
- **location**: `app/components/player/PlayerCombatActions.vue` -- Capture button + panel toggle
- **game_concept**: Player initiates capture from combat actions during their turn
- **description**: Capture button in the Requests section of PlayerCombatActions. Visibility controlled by canShowCapture (trainers only, not during Pokemon phase in League Battles). Disabled when Standard Action is used, combatant cannot be commanded, or no capture targets exist. Toggles PlayerCapturePanel open/closed (mutual exclusion with other request panels).
- **inputs**: canUseStandardAction, canBeCommanded, captureTargets, isActivePokemon, isLeagueBattle, isTrainerPhase
- **outputs**: Opens/closes PlayerCapturePanel
- **accessible_from**: player
