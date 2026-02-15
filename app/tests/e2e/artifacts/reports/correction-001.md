---
correction_id: correction-001
category: SCENARIO_BUG
scenario_id: combat-workflow-status-chain-001
---

## What Was Wrong

Assertion 4 ("Electric immunity blocks Paralysis") assumes the status API enforces PTU type-based immunities. It expects that `POST /api/encounters/:id/status` with `add: ["Paralyzed"]` for Pikachu (Electric type) would reject the status. Instead, the API applied it — returning `statusConditions: ["Paralyzed"]`.

The app's status endpoint is intentionally a **GM tool without type checking**. This is a known, documented design decision (see existing test `combat-status-conditions-001.spec.ts` lines 123-149). The GM is expected to know type immunities and not apply invalid statuses. The API does not second-guess the GM.

## Correct Values

Assertion 4 is based on a false premise. The status API will always apply any valid status regardless of type. Two correction options:

### Option A: Remove the type immunity assertion (recommended)

Remove assertion 4 entirely and renumber 5-9. The scenario's purpose is to test status stacking, Take a Breather, and persistent-vs-volatile behavior — type immunity enforcement is not part of the app's status API contract.

Reduce `ptu_assertions` in frontmatter from 9 to 8.

### Option B: Flip the assertion to match app behavior

Change assertion 4 to verify the GM-tool behavior:

```markdown
4. **Status applied regardless of type (GM tool):**
   The status API applies all valid statuses without type checking.
   The GM is responsible for enforcing type immunities at the table.
   **Assert: Pikachu statusConditions INCLUDES "Paralyzed" (API does not block)**
```

Then add a cleanup step before Phase 4 to remove the Paralyzed from Pikachu so it doesn't interfere with later assertions:

```
POST /api/encounters/$encounter_id/status {
  "combatantId": $pikachu_combatant.id,
  "remove": ["Paralyzed"]
}
```

### Downstream impact

Assertions 5-9 are independent of assertion 4 (they operate on Eevee, not Pikachu) and would pass once the test run continues past the assertion 4 failure.

## Action Required

Update scenario file `artifacts/scenarios/combat-workflow-status-chain-001.md`:
- Apply Option A or B above
- Update the spec file `tests/e2e/scenarios/combat/combat-workflow-status-chain-001.spec.ts` to match
- Re-run to confirm assertions 5-9 pass
