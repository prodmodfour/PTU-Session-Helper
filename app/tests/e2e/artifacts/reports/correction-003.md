---
correction_id: correction-003
category: SCENARIO_BUG
scenario_id: combat-workflow-template-setup-001
---

## What Was Wrong

Assertion 3a ("Charmander HP = 34/34") and 3b ("Rattata HP = 29/29") assume template-loaded Pokemon have deterministic stats based on base stats only. However, the template load endpoint (`POST /api/encounter-templates/:id/load`) recreates Pokemon via `generateAndCreatePokemon({ speciesName, level })`, which distributes `level - 1` random stat points via `distributeStatPoints()`. The template stores species/level data — not the original Pokemon's actual stats.

For Charmander L12: 11 random stat points distributed. HP base = 4 (out of 31 total base stats) gives ~12.9% chance per point. Each HP point adds 3 to maxHp. Expected range: 34 (0 HP points) to 67 (11 points, theoretically).

Same root cause as correction-002 (wild-encounter-001).

## Correct Values

Assertions 1, 2, 4, 5, 6, 7 are stat-independent and pass consistently. Only assertion 3 (HP values for template-loaded Pokemon) is affected.

### Option A: Read actual stats after template load (recommended)

After loading the template, read the encounter's combatants and use their actual stats:

```markdown
## Phase 2: Load Template into New Encounter

POST /api/encounter-templates/$template_id/load
$encounter_id = response.data.id

GET /api/encounters/$encounter_id
$combatants = response.data.combatants
$charmander = combatant where species = "Charmander"
$rattata = combatant where species = "Rattata"
$charmander_hp = $charmander.entity.currentHp
$rattata_hp = $rattata.entity.currentHp

### Assertions (Phase 2)
3. **Template combatants present with valid stats:**
   **Assert: Encounter has 2 combatants**
   **Assert: Charmander HP = $charmander_hp/$charmander_hp (full HP, matches maxHp)**
   **Assert: Rattata HP = $rattata_hp/$rattata_hp (full HP, matches maxHp)**
```

The key assertion becomes: template-loaded Pokemon exist, are at full HP, and have stats within the valid range for their species/level. Exact HP values are read dynamically.

### Option B: Use deterministic-stats assertion

Assert that HP is within valid range and that currentHp equals maxHp (full health):

```markdown
3. **Template combatants at full HP:**
   **Assert: Charmander currentHp = maxHp (full health)**
   **Assert: Rattata currentHp = maxHp (full health)**
   **Assert: Charmander maxHp >= 34 (minimum: base stats only)**
   **Assert: Rattata maxHp >= 29 (minimum: base stats only)**
```

## Action Required

Update scenario file `artifacts/scenarios/combat-workflow-template-setup-001.md`:
- Apply Option A (dynamic stat reading) for template-loaded combatants
- Update the spec file `tests/e2e/scenarios/combat/combat-workflow-template-setup-001.spec.ts` to match
- Re-run to confirm all 7 assertions pass
