---
cap_id: capture-C057
name: CombatantCard.captureSection
type: component
domain: capture
---

### capture-C057: CombatantCard Capture Integration
- **cap_id**: capture-C057
- **name**: CombatantCard Capture Section Rendering
- **type**: component
- **location**: `app/components/encounter/CombatantCard.vue` -- CombatantCaptureSection rendering block
- **game_concept**: GM encounters wild Pokemon and can capture them from the combatant card
- **description**: CombatantCard conditionally renders CombatantCaptureSection when isGm is true and the combatant is a wild Pokemon (no owner). On successful capture, calls handleCaptured which reloads the encounter to reflect ownership changes.
- **inputs**: combatant (with entity), encounterStore
- **outputs**: Triggers encounter reload on capture
- **accessible_from**: gm
