---
cap_id: capture-C004
name: POKE_BALL_CATALOG
type: constant
domain: capture
---

### capture-C004: POKE_BALL_CATALOG
- **cap_id**: capture-C004
- **name**: Poke Ball Type Catalog (25 ball types)
- **type**: constant
- **location**: `app/constants/pokeBalls.ts` -- `POKE_BALL_CATALOG`
- **game_concept**: PTU Chapter 9 p.271-273 Poke Ball types with modifiers, conditions, and post-capture effects
- **description**: Defines all 25 Poke Ball types from PTU. Each ball has: id, name, category (basic/apricorn/special/safari), base modifier (negative = easier), description, cost, optional conditionDescription, and optional postCaptureEffect ('heal_full', 'loyalty_plus_one', 'raised_happiness'). Categories: Basic (Basic/Great/Ultra/Master), Safari (Safari/Sport/Park), Apricorn (Level/Lure/Moon/Friend/Love/Heavy/Fast), Special (Premier/Repeat/Timer/Nest/Net/Dive/Luxury/Heal/Quick/Dusk/Cherish).
- **inputs**: Ball name key (string)
- **outputs**: PokeBallDef { id, name, category, modifier, description, cost, conditionDescription?, postCaptureEffect?, postCaptureDescription? }
- **accessible_from**: gm, player (auto-imported constant)
