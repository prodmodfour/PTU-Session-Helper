---
scenario_id: pokemon-lifecycle-workflow-link-unlink-001
loop_id: pokemon-lifecycle-workflow-link-unlink
tier: workflow
priority: P0
ptu_assertions: 1
mechanics_tested:
  - trainer-pokemon-relationship
  - ownership-transfer
non_deterministic: false
---

## Narrative

The GM has a manually-created Rattata that needs to be assigned to a trainer. They link the
Pokemon to the trainer, verify it appears in the trainer's Pokemon list, then unlink it and
verify it returns to unowned status. Also tests the validation guard: linking to a
non-existent trainer returns 404.

## Setup (API)

```
POST /api/pokemon {
  species: "Rattata",
  nickname: "Nibbles",
  level: 7,
  types: ["Normal"],
  gender: "Male",
  baseStats: {
    hp: 3,
    attack: 6,
    defense: 4,
    specialAttack: 3,
    specialDefense: 4,
    speed: 7
  }
}
$rattata_id = response.data.id

POST /api/characters {
  name: "Brock",
  level: 5,
  isPlayer: true
}
$trainer_id = response.data.id
```

## Phase 1: Verify Unowned State

```
GET /api/pokemon/$rattata_id
```

### Assertions (Phase 1)

1. **Initially unowned:**
   **Assert: response.data.ownerId = null**

## Phase 2: Link to Trainer

```
POST /api/pokemon/$rattata_id/link {
  trainerId: $trainer_id
}
```

### Assertions (Phase 2 — Link)

2. **Link response shows ownership:** (App-enforced: trainer-pokemon-relationship)
   **Assert: response.data.ownerId = $trainer_id**

3. **Verify via GET:**
   ```
   GET /api/pokemon/$rattata_id
   ```
   **Assert: response.data.ownerId = $trainer_id**

4. **All other fields unchanged after link:**
   **Assert: response.data.species = "Rattata"**
   **Assert: response.data.nickname = "Nibbles"**
   **Assert: response.data.level = 7**

## Phase 3: Unlink from Trainer

```
POST /api/pokemon/$rattata_id/unlink
```

### Assertions (Phase 3 — Unlink)

5. **Unlink response shows no owner:** (App-enforced: ownership-transfer)
   **Assert: response.data.ownerId = null**

6. **Verify via GET:**
   ```
   GET /api/pokemon/$rattata_id
   ```
   **Assert: response.data.ownerId = null**

7. **All other fields unchanged after unlink:**
   **Assert: response.data.species = "Rattata"**
   **Assert: response.data.nickname = "Nibbles"**
   **Assert: response.data.level = 7**

## Phase 4: Link to Non-Existent Trainer (Validation)

```
POST /api/pokemon/$rattata_id/link {
  trainerId: "non-existent-trainer-id-12345"
}
```

### Assertions (Phase 4 — Error Handling)

8. **404 for non-existent trainer:**
   **Assert: response.statusCode = 404**

9. **Pokemon ownership unchanged after failed link:**
   ```
   GET /api/pokemon/$rattata_id
   ```
   **Assert: response.data.ownerId = null** (still unowned)

## Teardown

```
DELETE /api/pokemon/$rattata_id
DELETE /api/characters/$trainer_id
```
