---
scenario_id: capture-mechanic-worked-examples-001
loop_id: capture-mechanic-worked-examples
tier: mechanic
priority: P2
ptu_assertions: 3
---

## Setup (API)

Uses the direct-data mode of the capture rate API. No Pokemon DB records created.

Requires seeded SpeciesData for species evolution lookups (Pikachu, Caterpie, Hydreigon).

**Enforcement boundary:** All assertions are App-enforced (calculateCaptureRate utility).

**Evolution stage note:** All three PTU worked examples use 3-stage evolution lines (Pichu/Pikachu/Raichu, Caterpie/Metapod/Butterfree, Deino/Zweilous/Hydreigon). The API's `Math.max(3, evolutionStage)` hardcode produces correct results for all three. For species with 1-stage or 2-stage lines, evolution modifiers would be incorrect (FEATURE_GAP — not tested here).

**PTU Source:** All three examples are from core/05-pokemon.md, p215, "Calculating Capture Rates" worked examples section.

## Actions & Assertions

### Example 1: Level 10 Pikachu, 70% HP, Confused

**Pikachu** (gen1/pikachu.md):
- Type: Electric
- Evolution: Stage 2 of 3 (Pichu -> Pikachu -> Raichu)
- SpeciesData: evolutionStage = 2, `Math.max(3, 2)` = 3, remaining = 1, modifier = 0

POST /api/capture/rate {
  "level": 10,
  "currentHp": 70,
  "maxHp": 100,
  "species": "Pikachu",
  "statusConditions": ["Confused"]
}

1. **PTU Example 1: Capture rate = 70**
   base: 100
   levelModifier: -(10 x 2) = -20
   hpModifier: (70/100) x 100 = 70%, 70% <= 75% -> -15
   evolutionModifier: Pikachu stage 2 of 3, remaining 1 -> 0
   statusModifier: Confused (Volatile) -> +5
   shinyModifier: 0, legendaryModifier: 0, injuryModifier: 0
   captureRate = 100 + (-20) + (-15) + 0 + 5 = **70**
   PTU states: "Math: Level (+80), Health (-15), One Evolution (+0), Confused (+5)" -> 70 ✓
   **Assert: captureRate = 70**
   **Assert: breakdown.levelModifier = -20, breakdown.hpModifier = -15, breakdown.evolutionModifier = 0, breakdown.statusModifier = 5**

### Example 2: Shiny Level 30 Caterpie, 40% HP, 1 Injury

**Caterpie** (gen1/caterpie.md):
- Type: Bug
- Evolution: Stage 1 of 3 (Caterpie -> Metapod -> Butterfree)
- SpeciesData: evolutionStage = 1, `Math.max(3, 1)` = 3, remaining = 2, modifier = +10

POST /api/capture/rate {
  "level": 30,
  "currentHp": 40,
  "maxHp": 100,
  "species": "Caterpie",
  "isShiny": true,
  "injuries": 1
}

2. **PTU Example 2: Capture rate = 45**
   base: 100
   levelModifier: -(30 x 2) = -60
   hpModifier: (40/100) x 100 = 40%, 40% <= 50% -> 0
   evolutionModifier: Caterpie stage 1 of 3, remaining 2 -> +10
   shinyModifier: Shiny -> -10
   injuryModifier: 1 x 5 = +5
   statusModifier: 0, legendaryModifier: 0
   captureRate = 100 + (-60) + 0 + 10 + (-10) + 5 = **45**
   PTU states: "Math: Level (+40), Health (+0), Two Evolutions (+10), Shiny (-10), Injury (+5)" -> 45 ✓
   **Assert: captureRate = 45**
   **Assert: breakdown.levelModifier = -60, breakdown.hpModifier = 0, breakdown.evolutionModifier = 10, breakdown.shinyModifier = -10, breakdown.injuryModifier = 5**

### Example 3: Level 80 Hydreigon, Exactly 1 HP, Burned + Poisoned + 1 Injury

**Hydreigon** (gen5/hydreigon.md):
- Type: Dark/Dragon
- Evolution: Stage 3 of 3 (Deino -> Zweilous -> Hydreigon)
- SpeciesData: evolutionStage = 3, `Math.max(3, 3)` = 3, remaining = 0, modifier = -10

POST /api/capture/rate {
  "level": 80,
  "currentHp": 1,
  "maxHp": 200,
  "species": "Hydreigon",
  "statusConditions": ["Burned", "Poisoned"],
  "injuries": 1
}

3. **PTU Example 3: Capture rate = -15**
   base: 100
   levelModifier: -(80 x 2) = -160
   hpModifier: currentHp === 1 -> +30 (special case, before percentage)
   evolutionModifier: Hydreigon stage 3 of 3, remaining 0 -> -10
   statusModifier: Burned (Persistent +10) + Poisoned (Persistent +10) = +20
   injuryModifier: 1 x 5 = +5
   shinyModifier: 0, legendaryModifier: 0
   captureRate = 100 + (-160) + 30 + (-10) + 20 + 5 = **-15**
   PTU states: "Math: Level (-60), Health (+30), No Evolutions (-10), Burned (+10), Poisoned (+10), Injury (+5)" -> -15 ✓
   **Assert: captureRate = -15**
   **Assert: breakdown.levelModifier = -160, breakdown.hpModifier = 30, breakdown.evolutionModifier = -10, breakdown.statusModifier = 20, breakdown.injuryModifier = 5**

## Teardown

No cleanup needed (no DB records created by direct-data rate calls).
