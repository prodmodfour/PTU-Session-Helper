---
scenario_id: pokemon-lifecycle-workflow-manual-create-001
loop_id: pokemon-lifecycle-workflow-manual-create
tier: workflow
priority: P0
ptu_assertions: 3
mechanics_tested:
  - hp-formula
  - nickname-resolution
non_deterministic: false
---

## Narrative

The GM needs a custom Pidgey for an NPC trainer. They navigate to the creation form, enter
the species, level, custom stats, and a nickname. The system calculates max HP using the PTU
formula, creates the Pokemon record, and redirects to the library where it appears. A second
Pidgey is created without a nickname to verify auto-naming.

## Species Data (from gen1/pidgey.md)

| Field | Value |
|-------|-------|
| Species | Pidgey |
| Types | Normal, Flying |
| Base HP | 4 |
| Base ATK | 5 |
| Base DEF | 4 |
| Base SpATK | 4 |
| Base SpDEF | 4 |
| Base SPD | 6 |

Note: For manual create, the GM enters base stats by hand. The API does not look up
SpeciesData — it trusts the provided values. These stats are used AS the current stats
(no stat point distribution on manual create).

## Setup (API)

No pre-existing entities needed.

## Phase 1: Create with Custom Nickname

```
POST /api/pokemon {
  species: "Pidgey",
  nickname: "Scout",
  level: 8,
  types: ["Normal", "Flying"],
  gender: "Female",
  baseStats: {
    hp: 4,
    attack: 5,
    defense: 4,
    specialAttack: 4,
    specialDefense: 4,
    speed: 6
  }
}
$pidgey1_id = response.data.id
```

### Assertions (Phase 1 — HP Formula)

1. **Max HP via PTU formula:** (App-enforced: hp-formula)
   maxHp = level(8) + (baseHp(4) * 3) + 10 = 8 + 12 + 10 = **30**
   **Assert: response.data.maxHp = 30**

2. **Current HP starts at max:** (App-enforced)
   **Assert: response.data.currentHp = 30**

3. **Custom nickname preserved:** (App-enforced: nickname-resolution)
   **Assert: response.data.nickname = "Scout"**

4. **Current stats equal base stats (no distribution):** (App-enforced)
   Manual create sets currentStats = baseStats (no stat point distribution).
   **Assert: response.data.currentStats.attack = 5**
   **Assert: response.data.currentStats.defense = 4**
   **Assert: response.data.currentStats.specialAttack = 4**
   **Assert: response.data.currentStats.specialDefense = 4**
   **Assert: response.data.currentStats.speed = 6**

5. **Origin is manual:** (App-enforced)
   **Assert: response.data.origin = "manual"**

6. **Moves and abilities empty:** (App-enforced)
   Manual create does not auto-select moves or abilities.
   **Assert: response.data.moves = []**
   **Assert: response.data.abilities = []**

7. **Types preserved:** (App-enforced)
   **Assert: response.data.types = ["Normal", "Flying"]**

8. **Library visible:** (App-enforced)
   **Assert: response.data.isInLibrary = true**

## Phase 2: Create without Nickname (Auto-generation)

```
POST /api/pokemon {
  species: "Pidgey",
  level: 5,
  types: ["Normal", "Flying"],
  baseStats: {
    hp: 4,
    attack: 5,
    defense: 4,
    specialAttack: 4,
    specialDefense: 4,
    speed: 6
  }
}
$pidgey2_id = response.data.id
```

### Assertions (Phase 2 — Nickname Resolution)

9. **Auto-generated nickname:** (App-enforced: nickname-resolution)
   No nickname provided → resolveNickname counts existing Pidgey records and generates "Pidgey N".
   Since Phase 1 created one Pidgey ("Scout"), there is at least 1 existing record.
   The exact N depends on pre-existing data, but it must match the pattern.
   **Assert: response.data.nickname matches pattern /^Pidgey \d+$/**

10. **HP formula for level 5:** (App-enforced: hp-formula)
    maxHp = level(5) + (baseHp(4) * 3) + 10 = 5 + 12 + 10 = **27**
    **Assert: response.data.maxHp = 27**

## Phase 3: Verify Persistence

```
GET /api/pokemon/$pidgey1_id
```

### Assertions (Phase 3)

11. **Data persisted correctly:**
    **Assert: response.data.species = "Pidgey"**
    **Assert: response.data.nickname = "Scout"**
    **Assert: response.data.level = 8**
    **Assert: response.data.maxHp = 30**

## Teardown

```
DELETE /api/pokemon/$pidgey1_id
DELETE /api/pokemon/$pidgey2_id
```
