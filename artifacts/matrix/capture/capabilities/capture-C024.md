---
cap_id: capture-C024
name: modifierClass
type: utility
domain: capture
---

### capture-C024: modifierClass
- **cap_id**: capture-C024
- **name**: Ball Modifier CSS Class
- **type**: utility
- **location**: `app/utils/pokeBallFormatters.ts` -- `modifierClass()`
- **game_concept**: Visual indicator for ball modifier quality
- **description**: Returns a CSS class reflecting whether a modifier is beneficial or detrimental. Negative modifier = easier capture = 'mod--positive' (green). Positive modifier = harder = 'mod--negative' (red). Zero = 'mod--neutral'.
- **inputs**: mod (number)
- **outputs**: CSS class string
- **accessible_from**: gm, player (auto-imported utility)
