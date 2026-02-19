---
scenario_id: pokemon-lifecycle-workflow-sheet-edit-001
loop_id: pokemon-lifecycle-workflow-sheet-edit
tier: workflow
priority: P0
ptu_assertions: 2
mechanics_tested:
  - stat-display
  - move-display-with-rolls
  - partial-update
non_deterministic: false
---

## Narrative

The GM creates an Eevee with known stats, moves, and an ability, then navigates to its
Pokemon sheet. They verify data displays correctly across the Stats, Moves, and Abilities
tabs. Then they edit the nickname and level, save, and confirm the partial update persisted
while leaving other fields untouched. Notably, changing the level does NOT trigger any
recalculation of maxHp or stat distribution — this tests the partial update behavior.

## Species Data (from gen1/eevee.md)

| Field | Value |
|-------|-------|
| Species | Eevee |
| Types | Normal |
| Base HP | 6 |
| Base ATK | 6 |
| Base DEF | 5 |
| Base SpATK | 5 |
| Base SpDEF | 7 |
| Base SPD | 6 |
| Basic Abilities | Run Away, Sprint |

## Setup (API)

```
POST /api/pokemon {
  species: "Eevee",
  nickname: "Fluffy",
  level: 10,
  types: ["Normal"],
  gender: "Female",
  baseStats: {
    hp: 6,
    attack: 6,
    defense: 5,
    specialAttack: 5,
    specialDefense: 7,
    speed: 6
  },
  moves: [
    { name: "Tackle", type: "Normal", damageClass: "Physical", frequency: "At-Will", ac: 2, damageBase: "5", range: "Melee" },
    { name: "Sand Attack", type: "Ground", damageClass: "Status", frequency: "At-Will", ac: 2, damageBase: null, range: "2, 1 Target" },
    { name: "Quick Attack", type: "Normal", damageClass: "Physical", frequency: "At-Will", ac: 2, damageBase: "4", range: "Melee, Priority" }
  ],
  abilities: [{ name: "Run Away", effect: "" }],
  notes: "Test Eevee for sheet edit"
}
$eevee_id = response.data.id
```

HP: maxHp = level(10) + (baseHp(6) * 3) + 10 = 10 + 18 + 10 = **38**

## Phase 1: View Pokemon Sheet

Navigate to `/gm/pokemon/$eevee_id` and verify data display.

```
GET /api/pokemon/$eevee_id
```

### Assertions (Phase 1 — Data Display)

1. **Header info:**
   **Assert: species = "Eevee"**
   **Assert: nickname = "Fluffy"**
   **Assert: level = 10**
   **Assert: gender = "Female"**

2. **HP display:** (App-enforced: hp-formula)
   maxHp = 10 + (6 × 3) + 10 = **38**
   **Assert: maxHp = 38**
   **Assert: currentHp = 38**

3. **Base stats displayed:**
   **Assert: baseStats.hp = 6**
   **Assert: baseStats.attack = 6**
   **Assert: baseStats.defense = 5**
   **Assert: baseStats.specialAttack = 5**
   **Assert: baseStats.specialDefense = 7**
   **Assert: baseStats.speed = 6**

4. **Moves tab — 3 moves with metadata:**
   **Assert: moves.length = 3**
   **Assert: moves contain "Tackle" (Normal, Physical, At-Will, AC 2, DB 5)**
   **Assert: moves contain "Sand Attack" (Ground, Status, At-Will, AC 2)**
   **Assert: moves contain "Quick Attack" (Normal, Physical, At-Will, AC 2, DB 4)**

5. **Abilities tab:**
   **Assert: abilities.length = 1**
   **Assert: abilities[0].name = "Run Away"**

6. **Notes tab:**
   **Assert: notes = "Test Eevee for sheet edit"**

## Phase 2: Edit Fields (Partial Update)

```
PUT /api/pokemon/$eevee_id {
  nickname: "Sparkle",
  level: 12,
  notes: "Renamed and leveled up"
}
```

### Assertions (Phase 2 — Update Response)

7. **Changed fields updated:**
   **Assert: response.data.nickname = "Sparkle"**
   **Assert: response.data.level = 12**

8. **maxHp NOT recalculated on level change:** (App-enforced: partial-update)
   The PUT endpoint does NOT recalculate maxHp when level changes.
   Original maxHp was 38 (at level 10). After changing level to 12, maxHp should still be 38.
   If the formula were re-applied: 12 + (6 × 3) + 10 = 40. But it should NOT be 40.
   **Assert: response.data.maxHp = 38** (unchanged)

## Phase 3: Verify Persistence

```
GET /api/pokemon/$eevee_id
```

### Assertions (Phase 3 — Unchanged Fields Preserved)

9. **Edited fields persisted:**
   **Assert: response.data.nickname = "Sparkle"**
   **Assert: response.data.level = 12**
   **Assert: response.data.notes = "Renamed and leveled up"**

10. **Unchanged fields preserved:** (App-enforced: partial-update)
    **Assert: response.data.maxHp = 38** (not recalculated)
    **Assert: response.data.currentHp = 38**
    **Assert: response.data.species = "Eevee"**
    **Assert: response.data.gender = "Female"**
    **Assert: response.data.types = ["Normal"]**
    **Assert: response.data.moves.length = 3**
    **Assert: response.data.abilities.length = 1**
    **Assert: response.data.abilities[0].name = "Run Away"**
    **Assert: response.data.baseStats.hp = 6**
    **Assert: response.data.baseStats.attack = 6**

## Teardown

```
DELETE /api/pokemon/$eevee_id
```
