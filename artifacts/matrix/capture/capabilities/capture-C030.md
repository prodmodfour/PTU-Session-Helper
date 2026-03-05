---
cap_id: capture-C030
name: Capture Rate API
type: api-endpoint
domain: capture
---

### capture-C030: Capture Rate API
- **cap_id**: capture-C030
- **name**: Calculate Capture Rate Endpoint
- **type**: api-endpoint
- **location**: `app/server/api/capture/rate.post.ts`
- **game_concept**: Server-side capture rate calculation with DB lookup and ball modifier preview
- **description**: POST endpoint calculating capture rate. Accepts pokemonId (DB lookup for level, HP, status, injuries, species/evolution data) or raw data. Auto-detects legendary status via isLegendarySpecies() (GM can override). Validates ball type against POKE_BALL_CATALOG. Builds ball condition context via buildConditionContext when trainerId is provided (full context with encounter round, active Pokemon, species ownership) or minimal context otherwise. Returns full breakdown with difficulty label and ball modifier breakdown.
- **inputs**: { pokemonId? } OR { level, currentHp, maxHp, species?, statusConditions?, injuries?, isShiny?, isLegendary? } + { ballType?, encounterId?, trainerId?, conditionContext? }
- **outputs**: { species, level, captureRate, difficulty, canBeCaptured, hpPercentage, breakdown, ballType, ballModifier, ballBreakdown }
- **accessible_from**: gm, player (via useCapture and usePlayerCapture composables)
