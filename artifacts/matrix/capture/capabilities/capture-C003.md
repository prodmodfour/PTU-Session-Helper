---
cap_id: capture-C003
name: getCaptureDescription
type: utility
domain: capture
---

### capture-C003: getCaptureDescription
- **cap_id**: capture-C003
- **name**: Capture Difficulty Description
- **type**: utility
- **location**: `app/utils/captureRate.ts` -- `getCaptureDescription()`
- **game_concept**: Human-readable capture difficulty label
- **description**: Maps a numeric capture rate to a difficulty label: >=80 Very Easy, >=60 Easy, >=40 Moderate, >=20 Difficult, >=1 Very Difficult, <1 Nearly Impossible.
- **inputs**: captureRate (number)
- **outputs**: Difficulty description string
- **accessible_from**: gm, player (auto-imported utility)
