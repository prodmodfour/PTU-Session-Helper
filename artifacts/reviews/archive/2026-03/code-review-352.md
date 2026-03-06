---
review_id: code-review-352
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-058, ptu-rule-150
domain: combat
commits_reviewed:
  - f479c4c7
  - e65c8385
  - 2a40a84d
  - 064119a2
  - ae63b934
  - 5758c16a
  - 0f326187
files_reviewed:
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/damage.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/utils/turn-helpers.ts
  - app/composables/useEncounterCombatActions.ts
  - app/composables/useEncounterActions.ts
  - app/stores/encounter.ts
  - app/components/encounter/CombatantGmActions.vue
  - app/components/encounter/CombatantCard.vue
  - app/components/gm/CombatantSides.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 2
  medium: 2
reviewed_at: 2026-03-06T18:00:00Z
follows_up: null
---

## Review Scope

7 commits (f479c4c7 through 0f326187) implementing an HP loss pathway that distinguishes "damage" from "HP loss" and "set HP" effects. Joint fix for bug-058 (Belly Drum/Life Orb triggering massive damage injuries) and ptu-rule-150 (Pain Split/Endeavor triggering injury checks). 10 files across server services, API endpoints, composables, stores, and Vue components.

**Decrees verified:**
- decree-001 (minimum 1 damage): Not affected. The minimum-1 floor is applied upstream in `damageCalculation.ts` before the value reaches `calculateDamage()`. The `lossType` parameter does not interact with the damage floor.
- decree-004 (massive damage uses real HP after temp HP absorption): Correctly respected. For `lossType === 'damage'`, temp HP is absorbed first and `hpDamage` reflects real HP lost. For non-damage types, the massive damage check is gated by `lossType === 'damage'` and never evaluated, so decree-004's temp HP rule is moot for those paths. Correct.
- decree-047 (other conditions source-dependent clearing on faint): `applyFaintStatus()` is called identically regardless of `lossType`. Faint handling is unaffected. Correct.

**PTU rule verification:**
- PTU p.236 (line 794-798): "Effects that say 'loses Hit Points' or that set Hit Points to a certain value instead of 'deals damage' do not have Defensive Stats applied to these Hit Point changes nor cause Injuries from Massive Damage." The implementation correctly skips massive damage for `hpLoss` and `setHp` types.
- PTU p.250 (line 1846-1848): "Massive Damage Injuries are never gained from Moves that cause you to 'Set' or 'lose' Hit Points, such as a Pain Split or Endeavor." Consistent with above.
- PTU p.250 (line 1900-1905): Heavily Injured penalty triggers when a Trainer/Pokemon "takes Damage from an attack." The implementation correctly gates this behind `isDamageFromAttack`. Correct.
- PTU p.250 (line 1849-1856): HP marker injuries apply when crossing thresholds. No exemption for HP loss in the text. The implementation correctly applies marker injuries to all reduction types. Correct.

## Issues

### HIGH

#### HIGH-001: `HpReductionType` union inlined 6 times instead of using the exported type

**Files:** `app/stores/encounter.ts` (line 559), `app/composables/useEncounterActions.ts` (line 43), `app/components/encounter/CombatantGmActions.vue` (lines 169, 183), `app/components/encounter/CombatantCard.vue` (line 196), `app/components/gm/CombatantSides.vue` (line 167)

The `HpReductionType` type is defined in `combatant.service.ts` and properly imported by `damage.post.ts` and `useEncounterCombatActions.ts`. However, in 5 other files, the union `'damage' | 'hpLoss' | 'setHp'` is written inline as a literal string union. If a fourth reduction type is ever added (e.g., `'recoil'`), all 6 inline occurrences must be found and updated manually, creating a guaranteed drift risk.

The type should be imported from `combatant.service.ts` (as the two server-side files already do) or, better yet, moved to `~/types/combat.ts` where the `types/CLAUDE.md` already anticipates its presence ("HpReductionType" is listed in the combat.ts description). Centralizing the type in `~/types/combat.ts` would also eliminate the cross-boundary import concern (frontend composable importing from server service), though that pattern has precedent in this codebase (`useEvolutionUndo.ts` imports types from `evolution.service.ts`).

**Fix:** Move `HpReductionType` to `~/types/combat.ts`, export from barrel, and replace all 6 inline unions with the imported type. Alternatively, at minimum import from `combatant.service.ts` in all files that use the type.

#### HIGH-002: `lossTypeInput` not reset after damage application -- sticky selector will cause GM errors

**File:** `app/components/encounter/CombatantGmActions.vue` (lines 208-213)

When the GM applies damage, `damageInput` is reset to `0` (line 211) but `lossTypeInput` retains its current value. If the GM selects "Loss" for a Belly Drum and applies it, the selector stays on "Loss" for the next damage application. The next standard attack damage will silently use `hpLoss` type, skipping massive damage and heavily injured checks incorrectly.

This is a high-severity UX issue because it will cause invisible gameplay errors -- the GM will not notice the selector is still on "Loss" and will apply incorrect damage mechanics to subsequent attacks.

**Fix:** Reset `lossTypeInput.value = 'damage'` after emitting (line 211, alongside `damageInput.value = 0`):
```typescript
const applyDamage = () => {
  if (damageInput.value > 0) {
    emit('damage', props.combatant.id, damageInput.value, lossTypeInput.value)
    damageInput.value = 0
    lossTypeInput.value = 'damage'
  }
}
```

### MEDIUM

#### MED-001: Temp HP bypass for `hpLoss` type is a PTU ambiguity requiring a decree

**File:** `app/server/services/combatant.service.ts` (line 117-121)

The implementation skips temp HP absorption for both `hpLoss` and `setHp` types (line 118: `if (lossType === 'damage' && temporaryHp > 0)`). For `setHp` this is clearly correct -- setting HP to a value should bypass temp HP entirely. For `hpLoss`, the behavior is debatable.

PTU p.247 states: "Temporary Hit Points are always lost first from damage **or any other effects**. Damage carries over directly to real Hit Points once the Temporary Hit Points are lost." The phrase "any other effects" could encompass HP loss effects like Belly Drum. However, the counter-reading is that "loses Hit Points" specifically targets real HP, and temp HP is explicitly described as not stacking with real HP for percentage purposes.

The docstring at line 104 documents "temp HP not absorbed" for `setHp` but does not explicitly document this behavior for `hpLoss`. The comment on line 117 says "only for standard damage, not HP loss or set-HP" which is the implementation but not necessarily the correct rule.

This is a PTU rule ambiguity that the Senior Reviewer should not resolve (per lesson L2: "PTU rule correctness is exclusively the Game Logic Reviewer's domain"). A decree-need ticket should be filed for the Game Logic Reviewer to evaluate whether `hpLoss` type effects should be absorbed by temp HP per PTU p.247's "any other effects" language.

**Action:** File `decree-need-053` for this ambiguity. Not blocking the current fix since the implementation is reasonable and internally consistent, but the ruling should be recorded.

#### MED-002: No unit tests for the new `lossType` parameter in `calculateDamage`

**File:** `app/tests/unit/services/combatant.service.test.ts`

The existing test file (747 lines) has zero tests for `calculateDamage()` -- all tests cover `buildCombatantFromEntity`. The new `lossType` parameter introduces three behavioral branches:
1. `'damage'`: temp HP absorbed, massive damage checked (existing behavior)
2. `'hpLoss'`: temp HP NOT absorbed, massive damage NOT checked, marker injuries still apply
3. `'setHp'`: temp HP NOT absorbed, massive damage NOT checked, marker injuries still apply

Per lesson L1 (verify test coverage for behavioral changes in refactoring reviews): this is a behavioral expansion with zero test coverage for the delta. The `calculateDamage` function is pure (no DB, no side effects) and trivially testable. Tests should cover:
- `hpLoss` with amount >= 50% maxHp does NOT trigger massive damage injury
- `hpLoss` preserves temp HP unchanged
- `setHp` with amount >= 50% maxHp does NOT trigger massive damage injury
- Both types still trigger marker crossing injuries
- Default parameter behavior (`lossType` omitted = `'damage'`, backward compatible)
- `lossType` is included in the return object

**Fix:** Add unit tests for `calculateDamage` covering the three `lossType` branches. This function is pure and the tests are straightforward (no mocking needed).

## What Looks Good

1. **Core logic is correct and well-documented.** The `calculateDamage` function properly gates massive damage behind `lossType === 'damage'` while preserving marker injury checks for all types. The docstring cites specific PTU page references (p.236, p.250) and quotes the relevant rules text. Per decree-004, the massive damage check correctly evaluates `hpDamage` (real HP after temp HP absorption).

2. **Endpoint-level gating is thorough.** The `damage.post.ts` endpoint correctly uses `isDamageFromAttack` to guard: heavily injured penalty (line 96), dismount checks (line 163), Cavalier's Reprisal (line 193), and Soulstealer (line 246). All four downstream effects are correctly treated as "damage from an attack" only behaviors. The validation of `lossType` against `VALID_LOSS_TYPES` (line 51) prevents injection of invalid values.

3. **Tick damage and weather damage correctly use `hpLoss`.** Both `next-turn.post.ts` (lines 277 and 558) and `turn-helpers.ts` (line 342) pass `'hpLoss'` to `calculateDamage` for tick/weather damage. PTU p.246-247 and p.342 use "lose Hit Points" language for these effects, confirming the type choice. The comments cite the relevant PTU page numbers.

4. **Frontend propagation chain is complete.** The `lossType` parameter flows correctly through all 7 layers: `CombatantGmActions.vue` (emits with value) -> `CombatantCard.vue` (forwards emit) -> `CombatantSides.vue` (forwards emit, 4 instances) -> `gm/index.vue` (binds to `handleDamage`) -> `useEncounterActions.ts` (passes to store) -> `encounter.ts` store (passes to composable) -> `useEncounterCombatActions.ts` (includes in fetch body). No layer drops the parameter.

5. **Backward compatibility is preserved.** The `lossType` parameter defaults to `'damage'` in `calculateDamage` (line 112), the endpoint defaults via `body.lossType || 'damage'` (line 50), and the composable uses conditional spread `...(lossType && { lossType })` (line 154). All existing callers (`move.post.ts`, `aoo-resolve.post.ts`) continue to work without modification.

6. **Snapshot labels are descriptive.** `useEncounterActions.ts` (line 46) uses `typeLabel` to produce human-readable undo labels: "Applied 50 HP loss to Pikachu" vs "Applied 50 damage to Pikachu". This aids the GM in understanding the undo history.

7. **Commit granularity is appropriate.** 7 commits, each focused on a single layer: service type/logic, endpoint, composable, tick damage, weather abilities, store propagation, UI. Each step produces a working state (earlier commits use the default `'damage'` type until the UI commit enables user selection).

8. **Death checks apply regardless of loss type.** The `checkDeath()` call in `damage.post.ts` (line 114) runs for all `lossType` values. You can die from HP loss effects that push you below the death threshold. This is correct -- PTU death is an HP threshold check, not a "damage from attack" check.

## Verdict

**CHANGES_REQUIRED** -- Route back to Developer.

HIGH-002 is a UX correctness issue: the sticky `lossTypeInput` selector will cause the GM to accidentally apply the wrong HP reduction type to subsequent damage. This is a 1-line fix.

HIGH-001 is a maintainability issue: 6 inline string unions will drift when the type changes.

MED-001 flags a legitimate PTU rule ambiguity (temp HP interaction with HP loss effects) that should be recorded as a decree-need but is not blocking.

MED-002 identifies a test coverage gap for the new behavioral branches, following lesson L1.

## Required Changes

1. **HIGH-002:** In `CombatantGmActions.vue`, reset `lossTypeInput.value = 'damage'` after emitting the damage event (line 211). This is a 1-line fix.

2. **HIGH-001:** Replace all 6 inline `'damage' | 'hpLoss' | 'setHp'` unions with the `HpReductionType` type. Preferred approach: move the type to `~/types/combat.ts`, re-export from barrel, and import in all consuming files. Alternatively, import from `combatant.service.ts` directly.

3. **MED-001:** File `decree-need-053` for the temp HP / HP loss interaction ambiguity. The current implementation is reasonable and not blocking, but the ruling should be recorded. (Note: if decree-need-053 already exists for an unrelated topic, use the next available number.)

4. **MED-002:** Add unit tests for `calculateDamage` in `app/tests/unit/services/combatant.service.test.ts` covering the three `lossType` branches. At minimum: massive damage skipped for `hpLoss`/`setHp`, temp HP preserved for non-damage types, marker injuries still apply, default parameter backward compatibility, `lossType` included in return.
