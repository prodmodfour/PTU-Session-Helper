---
scenario_id: pokemon-lifecycle-workflow-library-management-001
verified_at: 2026-02-19T23:45:00Z
status: PASS
assertions_checked: 10
assertions_correct: 10
---

## Assertion Verification

### Assertion 1: Delete succeeds

- **Scenario says:** `response.success = true`
- **Independent derivation:** `DELETE /api/pokemon/[id]` calls `prisma.pokemon.delete({ where: { id } })` and returns `{ success: true }`. No encounter guard on single delete.
- **Implementation check:** Verified in `app/server/api/pokemon/[id].delete.ts`.
- **Status:** CORRECT

### Assertion 2: Pokemon no longer exists

- **Scenario says:** `GET /api/pokemon/$rattata_a_id` returns `response.statusCode = 404`
- **Independent derivation:** After deletion, `prisma.pokemon.findUnique` returns null. The GET endpoint throws `createError({ statusCode: 404, message: 'Pokemon not found' })`.
- **Implementation check:** Verified in `app/server/api/pokemon/[id].get.ts`.
- **Status:** CORRECT

### Assertion 3: Archive succeeds

- **Scenario says:** `response.data.action = "archive"`, `response.data.count = 1`
- **Independent derivation:** `POST /api/pokemon/bulk-action` with action="archive", pokemonIds=[$rattata_b_id].
  - Encounter guard (lines 52-78): queries `isActive: true` encounters. The test encounter IS active (started via `POST .../start`). Combatants = [{entityId: $rattata_d_id}]. rattata_b_id NOT in activeEntityIds set.
  - Guard passes. `updateMany` with rattata_b_id sets `isInLibrary: false`. count=1.
  - Response: {success: true, data: {action: "archive", count: 1}}
- **Implementation check:** Verified in `app/server/api/pokemon/bulk-action.post.ts` lines 82-87.
- **Status:** CORRECT

### Assertion 4: Pokemon archived (hidden but preserved)

- **Scenario says:** `response.data.isInLibrary = false`, `response.data.species = "Rattata"`
- **Independent derivation:** After archive, record still exists with `isInLibrary = false`. GET returns full record including species and isInLibrary.
- **Implementation check:** `updateMany` sets `isInLibrary: false` without deleting.
- **Status:** CORRECT

### Assertion 5: Bulk delete rejected with 409 (encounter guard)

- **Scenario says:** `response.statusCode = 409`
- **Independent derivation:**
  - `POST /api/pokemon/bulk-action` with action="delete", pokemonIds=[$rattata_d_id]
  - Encounter guard (lines 52-78):
    - Query `isActive: true` encounters → finds the test encounter (started via `POST .../start` which sets isActive=true)
    - Parses combatants JSON → extracts entityIds → activeEntityIds = {$rattata_d_id}
    - candidates = findMany where id in [$rattata_d_id] → [{id: $rattata_d_id}]
    - inActiveEncounter = candidates.filter(p => activeEntityIds.has(p.id)) → [{id: $rattata_d_id}]
    - inActiveEncounter.length = 1 > 0 → throws createError({statusCode: 409, message: "Cannot delete 1 Pokemon that are in active encounters"})
- **Implementation check:** Verified in `bulk-action.post.ts` lines 52-78. The encounter is active because the corrected setup now calls `POST /api/encounters/$encounter_id/start` (confirmed: start.post.ts sets `isActive: true` on line 87).
- **Status:** CORRECT

### Assertion 6: Pokemon still exists (not deleted)

- **Scenario says:** `GET /api/pokemon/$rattata_d_id` returns status 200 and `response.data.species = "Rattata"`
- **Independent derivation:** Bulk delete was blocked by 409. No DB modification occurred (createError throws before deleteMany). Rattata D still exists.
- **Implementation check:** The error is thrown (line 74-77) before reaching deleteMany (line 89).
- **Status:** CORRECT

### Assertion 7: Bulk delete succeeds (non-encounter Pokemon)

- **Scenario says:** `response.data.action = "delete"`, `response.data.count = 1`
- **Independent derivation:**
  - `POST /api/pokemon/bulk-action` with action="delete", pokemonIds=[$rattata_c_id]
  - Encounter guard: rattata_c_id NOT in activeEntityIds → inActiveEncounter = [] → guard passes
  - `deleteMany` with where id in [$rattata_c_id] → removes 1 record → count=1
  - Response: {success: true, data: {action: "delete", count: 1}}
- **Implementation check:** Verified in lines 88-91.
- **Status:** CORRECT

### Assertion 8: Pokemon permanently removed

- **Scenario says:** `GET /api/pokemon/$rattata_c_id` returns `response.statusCode = 404`
- **Independent derivation:** After deleteMany, record is gone. GET returns 404.
- **Status:** CORRECT

### Assertion 9: Entire batch rejected (all-or-nothing)

- **Scenario says:** `response.statusCode = 409`
- **Independent derivation:**
  - `POST /api/pokemon/bulk-action` with action="delete", pokemonIds=[$rattata_b_id, $rattata_d_id]
  - Encounter guard: candidates = findMany where id in [$rattata_b_id, $rattata_d_id] → both exist
  - rattata_d_id IS in activeEntityIds → inActiveEncounter = [{id: $rattata_d_id}]
  - inActiveEncounter.length = 1 > 0 → throws 409
  - The entire batch is rejected — rattata_b_id is not individually checked, the error is thrown before deleteMany
- **Implementation check:** Verified. The guard checks ALL candidates against active encounters. If ANY are in an active encounter, the entire operation is rejected (lines 72-78).
- **Status:** CORRECT

### Assertion 10: Neither Pokemon deleted

- **Scenario says:** GET for rattata_b_id returns 200; GET for rattata_d_id returns 200
- **Independent derivation:**
  - Batch was rejected by 409 before any DB modification
  - rattata_b_id: still exists (archived but preserved) → 200 ✓
  - rattata_d_id: still exists (in active encounter) → 200 ✓
- **Implementation check:** createError thrown before deleteMany — no records affected.
- **Status:** CORRECT

## Data Validity

- [x] Rattata base stats: HP 3, Atk 6, Def 4, SpAtk 3, SpDef 4, Spd 7 — matches PTU 1.05 gen1/rattata.md
- [x] All four Rattata created via `POST /api/pokemon` (manual path) — no random stat distribution
- [x] `non_deterministic: false` is correct since no generator service is used
- [x] Encounter creation: `POST /api/encounters` sets `isActive: false` (confirmed: index.post.ts line 25)
- [x] Encounter start: `POST /api/encounters/$id/start` sets `isActive: true` (confirmed: start.post.ts line 87)
- [x] Combatant body: uses `entityType: "pokemon"` and `entityId` (confirmed: combatants.post.ts lines 38-39)

## Completeness Check

- [x] Single delete tested (Phase 1) — no encounter guard on single delete
- [x] Bulk archive tested (Phase 2) — guard passes for non-encounter Pokemon
- [x] Encounter guard blocks bulk delete (Phase 3) — rattata_d_id in active encounter
- [x] Bulk delete of non-encounter Pokemon tested (Phase 4) — rattata_c_id passes guard
- [x] All-or-nothing batch semantics tested (Phase 5) — mixed batch rejected entirely
- [x] Intentional inconsistency (single delete has no guard vs bulk does) documented in narrative

## Errata Check

No errata items in `books/markdown/errata-2.md` affect library management mechanics. Library management is entirely app-level, not PTU rules.

## Issues Found

None. All 10 assertions in the corrected scenario are correct. The previous issues have been properly addressed:
- Setup now includes `POST /api/encounters/$encounter_id/start` to activate the encounter
- Combatant body uses correct fields: `entityType: "pokemon"`, `entityId: $rattata_d_id`

## Re-Verification Summary

This is a re-verification of the corrected scenario (original verification was FAIL with 7/10 correct).

| Change | Previous | Corrected | Verified |
|--------|----------|-----------|----------|
| Setup: encounter start | Missing — encounter stayed isActive=false | Added `POST .../start` | Guard correctly fires |
| Setup: combatant body | Used `pokemonId` | Uses `entityType`/`entityId` | Matches API endpoint |
| Assertions 5, 6, 9, 10 | INCORRECT (guard not triggered) | Now correct (encounter active) | All CORRECT |
