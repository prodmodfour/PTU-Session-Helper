---
cap_id: capture-C023
name: formatModifier
type: utility
domain: capture
---

### capture-C023: formatModifier
- **cap_id**: capture-C023
- **name**: Ball Modifier Formatter
- **type**: utility
- **location**: `app/utils/pokeBallFormatters.ts` -- `formatModifier()`
- **game_concept**: PTU ball modifier display convention
- **description**: Formats a ball modifier as a signed string (e.g. "+0", "-10", "+5"). Used by BallSelector and CaptureRateDisplay components.
- **inputs**: mod (number)
- **outputs**: Signed string
- **accessible_from**: gm, player (auto-imported utility)
