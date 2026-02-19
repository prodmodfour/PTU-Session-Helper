---
scenario_id: pokemon-lifecycle-workflow-library-management-001
loop_id: pokemon-lifecycle-workflow-library-management
tier: workflow
priority: P0
ptu_assertions: 0
mechanics_tested:
  - archive-flag
  - bulk-action-safety-check
  - encounter-guard
non_deterministic: false
---

## Narrative

After a session, the GM cleans up the Pokemon library. They delete a single Pokemon,
archive another via bulk action, attempt to bulk-delete a Pokemon that's in an active
encounter (blocked by the safety guard), and then successfully bulk-delete a Pokemon
not in any encounter. Tests the full library management lifecycle including the
encounter guard inconsistency (single delete has no guard, bulk does).

## Setup (API)

Create 4 wild Rattata and an encounter with one of them as a combatant.

```
POST /api/pokemon {
  species: "Rattata", nickname: "Rattata A", level: 3,
  types: ["Normal"], origin: "wild",
  baseStats: { hp: 3, attack: 6, defense: 4, specialAttack: 3, specialDefense: 4, speed: 7 }
}
$rattata_a_id = response.data.id

POST /api/pokemon {
  species: "Rattata", nickname: "Rattata B", level: 3,
  types: ["Normal"], origin: "wild",
  baseStats: { hp: 3, attack: 6, defense: 4, specialAttack: 3, specialDefense: 4, speed: 7 }
}
$rattata_b_id = response.data.id

POST /api/pokemon {
  species: "Rattata", nickname: "Rattata C", level: 3,
  types: ["Normal"], origin: "wild",
  baseStats: { hp: 3, attack: 6, defense: 4, specialAttack: 3, specialDefense: 4, speed: 7 }
}
$rattata_c_id = response.data.id

POST /api/pokemon {
  species: "Rattata", nickname: "Rattata D", level: 3,
  types: ["Normal"], origin: "wild",
  baseStats: { hp: 3, attack: 6, defense: 4, specialAttack: 3, specialDefense: 4, speed: 7 }
}
$rattata_d_id = response.data.id

POST /api/encounters { name: "Library Guard Test Encounter" }
$encounter_id = response.data.id

POST /api/encounters/$encounter_id/combatants {
  entityType: "pokemon",
  entityId: $rattata_d_id,
  side: "enemy"
}

POST /api/encounters/$encounter_id/start
```

## Phase 1: Single Delete

```
DELETE /api/pokemon/$rattata_a_id
```

### Assertions (Phase 1)

1. **Delete succeeds:**
   **Assert: response.success = true**

2. **Pokemon no longer exists:**
   ```
   GET /api/pokemon/$rattata_a_id
   ```
   **Assert: response.statusCode = 404**

Note: Single delete does NOT check active encounters — this is an intentional inconsistency
with bulk-action. (App behavior, not a PTU rule.)

## Phase 2: Bulk Archive

```
POST /api/pokemon/bulk-action {
  action: "archive",
  pokemonIds: ["$rattata_b_id"]
}
```

### Assertions (Phase 2 — Archive Flag)

3. **Archive succeeds:** (App-enforced: archive-flag)
   **Assert: response.data.action = "archive"**
   **Assert: response.data.count = 1**

4. **Pokemon archived (hidden but preserved):**
   ```
   GET /api/pokemon/$rattata_b_id
   ```
   **Assert: response.data.isInLibrary = false**
   **Assert: response.data.species = "Rattata"** (record still exists)

## Phase 3: Encounter Guard — Bulk Delete Blocked

Rattata D is in the active encounter. Bulk delete should be rejected.

```
POST /api/pokemon/bulk-action {
  action: "delete",
  pokemonIds: ["$rattata_d_id"]
}
```

### Assertions (Phase 3 — Encounter Guard)

5. **Bulk delete rejected with 409:** (App-enforced: encounter-guard)
   **Assert: response.statusCode = 409**

6. **Pokemon still exists (not deleted):**
   ```
   GET /api/pokemon/$rattata_d_id
   ```
   **Assert: response.statusCode = 200**
   **Assert: response.data.species = "Rattata"**

## Phase 4: Bulk Delete — Non-Encounter Pokemon

Rattata C is NOT in any encounter. Bulk delete should succeed.

```
POST /api/pokemon/bulk-action {
  action: "delete",
  pokemonIds: ["$rattata_c_id"]
}
```

### Assertions (Phase 4)

7. **Bulk delete succeeds:**
   **Assert: response.data.action = "delete"**
   **Assert: response.data.count = 1**

8. **Pokemon permanently removed:**
   ```
   GET /api/pokemon/$rattata_c_id
   ```
   **Assert: response.statusCode = 404**

## Phase 5: Batch Encounter Guard — All-or-Nothing

Attempt to bulk-delete both Rattata B (archived, not in encounter) AND Rattata D
(in encounter). The entire batch should be rejected because D is in an active encounter.

```
POST /api/pokemon/bulk-action {
  action: "delete",
  pokemonIds: ["$rattata_b_id", "$rattata_d_id"]
}
```

### Assertions (Phase 5 — All-or-Nothing)

9. **Entire batch rejected:** (App-enforced: bulk-action-safety-check)
   **Assert: response.statusCode = 409**

10. **Neither Pokemon deleted:**
    ```
    GET /api/pokemon/$rattata_b_id
    ```
    **Assert: response.statusCode = 200** (archived but still exists)

    ```
    GET /api/pokemon/$rattata_d_id
    ```
    **Assert: response.statusCode = 200** (still in encounter)

## Teardown

```
POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$rattata_b_id
DELETE /api/pokemon/$rattata_d_id
```
