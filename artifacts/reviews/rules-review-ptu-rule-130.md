---
review_id: rules-review-ptu-rule-130
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-130
domain: combat
commits_reviewed:
  - cc39b317
  - 02beecb7
  - 21a90b58
  - 2b4a7623
  - f6ae7952
  - 3fee2a90
  - e6fbf256
  - 0712e99a
  - 99796267
mechanics_verified:
  - league-switch-restriction-fainted-exemption
  - recall-release-pair-detection
  - fainted-switch-on-turn-only
  - standalone-recall-action-cost
  - standalone-release-action-cost
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Page 229
  - decree-033
  - decree-034
  - decree-044
reviewed_at: 2026-03-05T14:30:00Z
follows_up: null
---

## Mechanics Verified

### League Switch Restriction (Fainted Exemption)
- **Rule:** "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon." (`core/07-combat.md#Page 229`, lines 243-248)
- **Implementation:** `canSwitchedPokemonBeCommanded()` in `switching.service.ts:659-675` checks three conditions in order: non-League (always allowed), fainted switch (exempt), forced switch (exempt). If none apply, returns `false` (cannot be commanded). Both `recall.post.ts:225-238` and `release.post.ts:274-289` call this function after pair detection, passing `pairCheckAfter.isFaintedSwitch` as the fainted switch flag.
- **Status:** CORRECT

### Recall+Release Pair Detection
- **Rule:** "Recalling and then Releasing by using two Shift Actions in one Round still counts as a Switch, even if they are declared as separate actions, and you may not do this to Recall and then Release the same Pokemon in one round." (`core/07-combat.md#Page 229`, lines 250-255)
- **Implementation:** `checkRecallReleasePair()` in `switching.service.ts:800-829` filters switch actions by trainer and round, collecting recalled entity IDs and released entity IDs. Returns `countsAsSwitch: true` when both lists are non-empty. The same-Pokemon-recall-then-release prevention is enforced separately: `release.post.ts:107-115` blocks releasing any entity ID found in `pairCheckBefore.recalledEntityIds`, and `recall.post.ts:135-144` blocks recalling any entity found in `pairCheck.releasedEntityIds`.
- **Status:** CORRECT

### Fainted State Tracking at Time of Recall
- **Rule:** The fainted exemption depends on whether the recalled Pokemon was fainted at the time of recall, not at any other point. (`core/07-combat.md#Page 229`, line 247: "replacing a Fainted Pokemon")
- **Implementation:** In `recall.post.ts:199`, `wasFainted = pokemon.entity.currentHp <= 0` captures the HP state of the combatant entity at the moment of recall, before removal. This is stored as `recalledWasFainted: true` on the `SwitchAction` record (line 210). The `SwitchAction` interface in `combat.ts:197-200` declares `recalledWasFainted?: boolean` as an optional field with clear documentation. `checkRecallReleasePair()` reads this field via `.some(a => a.recalledWasFainted === true)` (line 826), correctly defaulting old/absent records to `false` via strict equality.
- **Status:** CORRECT

### Decree-033 Compliance (Fainted Switch on Turn Only)
- **Rule:** Per decree-033: "fainted Pokemon switching happens on the trainer's next available turn in initiative order, not as an immediate reaction." The trainer can perform the fainted switch on their own turn (Trainer turn or Pokemon turn).
- **Implementation:** Both `recall.post.ts:83-100` and `release.post.ts:89-104` enforce turn validation. Recall checks `isTrainerTurn || isOwnedPokemonTurn`, where `isOwnedPokemonTurn` includes both the specific recalled Pokemon's turn AND any other owned Pokemon's turn. Release checks `isTrainerTurn || isOwnedPokemonTurn` for any owned Pokemon. These turn guards ensure the fainted recall+release pair can only happen during the trainer's initiative slot, consistent with decree-033. No "interrupt" or "reaction" path bypasses this check.
- **Status:** CORRECT

### Decree-044 Compliance (Only Trapped Blocks Recall)
- **Rule:** Per decree-044: "Only Trapped blocks recall. Grapple does not block recall (RAW)." Remove all 'Bound' condition checks.
- **Implementation:** `recall.post.ts:117-122` checks `allConditions.includes('Trapped')` and does NOT check for 'Bound'. The Trapped check uses both `entity.statusConditions` and `combatant.tempConditions` (per commit `02beecb7` which fixed reading tempConditions from combatant rather than entity). This is correct per decree-044.
- **Status:** CORRECT

### Standalone Recall Action Cost
- **Rule:** "Recall and Release actions can also be taken individually by a Trainer as Shift Actions." (`core/07-combat.md#Page 229`, lines 250-251) and "A Trainer may also spend a Standard Action to Recall two Pokemon or Release two Pokemon at once." (lines 255-257)
- **Implementation:** `recall.post.ts:147` sets `actionType = pokemonCombatantIds.length === 1 ? 'shift' : 'standard'`. Lines 148-153 validate the appropriate action is available. Correct: 1 Pokemon = Shift Action, 2 Pokemon = Standard Action.
- **Status:** CORRECT

### Standalone Release Action Cost
- **Rule:** Same as recall action cost rule above.
- **Implementation:** `release.post.ts:148` uses same pattern: `actionType = pokemonEntityIds.length === 1 ? 'shift' : 'standard'`. Lines 149-154 validate action availability. Correct.
- **Status:** CORRECT

## Observations

### MEDIUM-001: Multi-recall fainted exemption is overly generous (edge case)

`checkRecallReleasePair()` at `switching.service.ts:826` uses `.some()` to determine `isFaintedSwitch`:

```typescript
const isFaintedSwitch = recallActions.some(a => a.recalledWasFainted === true)
```

If a trainer recalls two Pokemon in one round (one fainted, one healthy) and releases two replacements, ALL released Pokemon are exempt from the League restriction. PTU says "replacing a Fainted Pokemon" (singular), suggesting the exemption should only cover the replacement for the fainted one, not all replacements.

**Practical impact:** Extremely low. This scenario requires 4 Shift Actions in one round (2 recalls + 2 releases), which exceeds what a trainer can typically perform. The most realistic scenario (1 recall + 1 release) is correctly handled. No ticket filed because the edge case is essentially unreachable in normal play and the current behavior is a reasonable interpretation of the rule.

## Summary

The fainted recall+release League exemption is correctly implemented. The core fix chain is sound:

1. **Data capture:** `recall.post.ts` records `recalledWasFainted` based on `entity.currentHp <= 0` at time of recall.
2. **Pair detection:** `checkRecallReleasePair()` aggregates recall and release actions per trainer per round, returning `isFaintedSwitch: true` when any recall was of a fainted Pokemon.
3. **Restriction bypass:** Both `release.post.ts` and `recall.post.ts` (for recall-after-release order) pass `pairCheckAfter.isFaintedSwitch` to `canSwitchedPokemonBeCommanded()`, which correctly returns `true` (exempt from restriction) when `isFaintedSwitch` is `true`.
4. **Non-fainted path preserved:** When no recalled Pokemon was fainted, `isFaintedSwitch` is `false`, and the League restriction correctly applies (`canBeCommanded = false`).
5. **Turn validation:** Per decree-033, both endpoints enforce turn ownership checks, preventing out-of-turn fainted switches.
6. **Decree-044 compliance:** Only Trapped blocks recall; no phantom 'Bound' checks remain.

The errata (`books/markdown/errata-2.md`) contains no corrections to the League Battle switching rules or fainted switch exemption, confirming the core text governs.

## Rulings

1. The `recalledWasFainted` field correctly captures fainted state at time of recall using `entity.currentHp <= 0`. This is the correct check point -- HP at recall time, not at any prior or subsequent moment.
2. The `.some()` aggregation for multi-recall scenarios is a generous but reasonable interpretation for the standalone recall+release path. The edge case where it matters is essentially unreachable.
3. The `canSwitchedPokemonBeCommanded()` function correctly implements the three-way exemption check (non-League, fainted, forced) per PTU p.229.
4. The `forced: false` hardcode in both standalone endpoints is correct -- standalone recall/release cannot be forced (Roar uses the full `switch.post.ts` path per decree-034).

## Verdict

**APPROVED** -- The fainted recall+release League exemption is correctly implemented per PTU p.229 and all applicable decrees (decree-033, decree-034, decree-044). No CRITICAL or HIGH issues found. One MEDIUM observation noted regarding overly generous multi-recall exemption, but the edge case is practically unreachable.

## Required Changes

None. All mechanics are correctly implemented.
