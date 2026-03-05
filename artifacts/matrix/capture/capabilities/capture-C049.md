---
cap_id: capture-C049
name: PlayerRequestPanel.captureApproval
type: component
domain: capture
---

### capture-C049: PlayerRequestPanel Capture Approval
- **cap_id**: capture-C049
- **name**: GM Player Request Panel -- Capture Approval
- **type**: component
- **location**: `app/components/encounter/PlayerRequestPanel.vue` -- capture request display + approve-capture emit
- **game_concept**: GM sees and approves/denies player capture requests
- **description**: Displays incoming capture requests in the GM's PlayerRequestPanel. Shows ball type, target Pokemon name, and capture rate preview. Approve button emits 'approve-capture' with requestId, targetPokemonId, trainerCombatantId, ballType. Deny button emits 'deny-request'. Connected to handleApproveCapture in usePlayerRequestHandlers.
- **inputs**: Player action requests via WebSocket (action='capture')
- **outputs**: Emits 'approve-capture', 'deny-request'
- **accessible_from**: gm
