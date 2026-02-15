---
scenario_id: combat-encounter-lifecycle-001
loop_id: combat-encounter-lifecycle
priority: P0
ptu_assertions: 5
---

## Setup (API)

POST /api/pokemon {
  "species": "Pikachu",
  "level": 10,
  "baseHp": 4, "baseAttack": 6, "baseDefense": 4,
  "baseSpAttack": 5, "baseSpDefense": 5, "baseSpeed": 9,
  "types": ["Electric"]
}
$pokemon_a_id = response.data.id

POST /api/pokemon {
  "species": "Bulbasaur",
  "level": 10,
  "baseHp": 5, "baseAttack": 5, "baseDefense": 5,
  "baseSpAttack": 7, "baseSpDefense": 7, "baseSpeed": 5,
  "types": ["Grass", "Poison"]
}
$pokemon_b_id = response.data.id

## Actions (UI + API)

### Phase 1: Create Encounter
POST /api/encounters { "name": "Test: Lifecycle" }
$encounter_id = response.data.id

1. **Assert: Encounter created with status "created"**

### Phase 2: Add Combatants
POST /api/encounters/$encounter_id/combatants { "pokemonId": $pokemon_a_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $pokemon_b_id, "side": "enemy" }

2. **Assert: Encounter has 2 combatants (1 ally, 1 enemy)**

### Phase 3: Start Combat
POST /api/encounters/$encounter_id/start

3. **Assert: Encounter status is "active", initiative calculated, Pikachu (SPD 9) is first**

### Phase 4: Serve to Group View
POST /api/encounters/$encounter_id/serve

4. Navigate to `/group`
   **Assert: Group View shows the active encounter with combatant health bars and turn indicator**

### Phase 5: End Combat
POST /api/encounters/$encounter_id/end

5. **Assert: Encounter status is "ended"**

### Phase 6: Unserve
POST /api/encounters/$encounter_id/unserve

6. Navigate to `/group`
   **Assert: Group View no longer shows the encounter (returns to lobby)**

## Assertions

1. **Encounter creation:**
   **Assert: POST /api/encounters returns { success: true, data: { id, name: "Test: Lifecycle" } }**

2. **Combatant addition:**
   **Assert: GET /api/encounters/$encounter_id shows 2 combatants on opposing sides**

3. **Combat start — initiative calculated:**
   Pikachu SPD = 9, Bulbasaur SPD = 5
   **Assert: Active combatant is Pikachu, encounter status is active**

4. **Serve broadcasts to Group View:**
   **Assert: GET /api/encounters/served returns the active encounter**

5. **Combat end and unserve:**
   **Assert: Encounter status is "ended"; served endpoint returns null after unserve**

## Teardown

DELETE /api/pokemon/$pokemon_a_id
DELETE /api/pokemon/$pokemon_b_id
