---
cap_id: capture-C054
name: Pokemon.loyalty
type: prisma-field
domain: capture
---

### capture-C054: Pokemon.loyalty
- **cap_id**: capture-C054
- **name**: Pokemon Loyalty Field
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` -- Pokemon.loyalty (Int, default 3)
- **game_concept**: PTU Chapter 10 Loyalty system (0=Hostile to 6=Devoted)
- **description**: Integer field representing Pokemon loyalty. Default is 3 (Neutral). Wild captures default to Loyalty 2 (Wary) per decree-049. Friend Ball captures get +1 (Loyalty 3). Capped at 6.
- **inputs**: Set during capture (2 for wild, 3 for Friend Ball)
- **outputs**: Affects Pokemon behavior per PTU loyalty rules
- **accessible_from**: gm (visible in Pokemon management)
