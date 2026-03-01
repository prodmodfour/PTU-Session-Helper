---
review_id: rules-review-208
review_type: rules
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-011
domain: combat
commits_reviewed:
  - a4ede7d
  - e92405f
  - 23c2e76
  - fcf791a
  - d7ab314
  - 2aa2dd4
  - 272aa69
  - 7ed0283
  - 18d1717
  - d492e68
files_reviewed:
  - app/server/services/switching.service.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/start.post.ts
  - app/composables/useSwitching.ts
  - app/types/combat.ts
  - app/types/encounter.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-01T04:30:00Z
follows_up: null
---

## Review Scope

PTU rules compliance review for feature-011 Pokemon Switching Workflow P0. Verified the implementation against PTU 1.05 Chapter 7 switching rules (p.229-232) and all applicable design decrees.

### Matrix Rules Covered by P0

| Rule | Title | P0 Coverage |
|------|-------|-------------|
| R049 | Full Switch -- Standard Action | Fully covered: Standard Action cost enforced, 8m range check, initiative insertion |
| R050 | League Switch Restriction | Deferred to P1 (correct per design spec) |
| R051 | Fainted Switch -- Shift Action | Deferred to P1 (correct per design spec) |
| R052 | Recall and Release as Separate Actions | Deferred to P2 (correct per design spec) |
| R053 | Released Pokemon Can Act Immediately | Partially covered: initiative insertion determines whether Pokemon can act this round; full "immediate-act" logic deferred to P2 |

## Decree Compliance

### decree-006: Dynamic initiative reordering on speed changes

**Status: Compliant.** The `insertIntoTurnOrder` function in `switching.service.ts` correctly inserts the new Pokemon among unacted combatants only, preserving the acted/current slots. This respects decree-006's "never grant extra turns" principle. The new Pokemon's initiative is calculated via `buildCombatantFromEntity` which uses current speed (CS-modified per the combatant service). Ties in full contact mode are broken by `sortByInitiativeWithRollOff`.

### decree-021: True two-phase trainer system for League Battles

**Status: Compliant.** The `insertIntoLeagueTurnOrder` function correctly:
- Inserts new Pokemon into `pokemonTurnOrder` always (line 203-205)
- Inserts into active `turnOrder` only during pokemon phase (line 210-221)
- Does NOT modify `trainerTurnOrder` (new combatant is a Pokemon, not a trainer) (line 227)
- During trainer phases, the new Pokemon will naturally appear when pokemon phase starts since `pokemonTurnOrder` is copied to `turnOrder` at phase transition

### decree-033: Fainted switch timing (on trainer's next turn)

**Status: Not applicable to P0.** P0 only implements voluntary full switch. Fainted switch is P1 scope. The `SwitchAction.actionType` field includes `'fainted_switch'` for forward compatibility, and the endpoint accepts `faintedSwitch` in the request body but does not implement the Shift Action path yet. This is correct per the design spec's tier separation.

### decree-034: Roar recall range and Whirlwind push

**Status: Not applicable to P0.** P0 only implements voluntary switching. Forced switch (Roar) is P1 scope. The `SwitchAction.forced` field and `forced` request body parameter are present for forward compatibility. The `POKEBALL_RECALL_RANGE = 8` constant is correctly specific to voluntary switching (Roar uses its own 6m range per decree-034). No decree violation.

## PTU Rule Verification

### PTU p.229: "A Trainer may recall a Pokemon to its Poke Ball or release a Pokemon from its Poke Ball as a Standard Action"

**Implementation:** `switch.post.ts` validates Standard Action availability via `validateActionAvailability()` (lines 123-136). The action is marked as used via `markActionUsed(updatedInitiator, 'standard')` (lines 206-209). Correctly implemented.

### PTU p.229: "on either the Trainer's or the Pokemon's Initiative"

**Implementation:** `validateActionAvailability()` in `switching.service.ts` (lines 401-433) checks both cases: `isTrainerTurn` and `isPokemonTurn`. If neither is the current turn, the switch is rejected. The Standard Action is consumed on whichever combatant initiates (trainer on trainer's turn, Pokemon on Pokemon's turn). Correctly implemented.

### PTU p.229: "A Trainer cannot Switch or Recall their Pokemon if their active Pokemon is out of range of their Poke Ball's recall beam -- 8 meters"

**Implementation:** `checkRecallRange()` in `switching.service.ts` (lines 39-63) calculates PTU diagonal distance between trainer and Pokemon positions. The 8m constant is correctly defined. Correctly implemented.

### PTU p.229: "During a League Battle, Trainers are generally considered to always be in Switching range"

**Implementation:** `checkRecallRange()` returns `{ inRange: true, distance: 0 }` when `isLeagueBattle` is true (line 46-47). Correctly implemented.

### PTU p.229: Initiative insertion for released Pokemon

**Implementation:** `insertIntoTurnOrder()` splits turn order into acted (frozen) and unacted (sortable), adds the new Pokemon to the unacted set, and re-sorts by initiative. This ensures the released Pokemon gets its turn at the correct initiative position among remaining combatants, but never before already-acted combatants. Correctly implemented per PTU rules and decree-006.

### Ownership validation chain

The 10-step validation chain correctly enforces:
1. Encounter active (step 1)
2. Trainer exists and is human type (steps 2-3)
3. Recalled Pokemon exists and is pokemon type (steps 3-4)
4. Recalled Pokemon owned by trainer via `ownerId === trainer.entityId` (step 4)
5. Released Pokemon exists in DB (step 5)
6. Released Pokemon owned by same trainer (step 6)
7. Released Pokemon not already in encounter (step 7)
8. Released Pokemon not fainted (step 8)
9. Range check (step 9, separate function)
10. Action availability (step 10, separate function)

All ownership checks use `entityId` matching, not combatant ID matching. This is correct because `entityId` is the stable database reference, while combatant IDs are ephemeral per-encounter.

### Side preservation

The released Pokemon inherits the recalled Pokemon's side (`recalledSide`, line 149 in `switch.post.ts`). This is correct -- a trainer's replacement Pokemon should be on the same side as the recalled one.

### Position preservation

The released Pokemon defaults to the recalled Pokemon's grid position (`recalledPosition`, line 148, 168 in `switch.post.ts`), with an optional `releasePosition` override from the request body. This matches the PTU expectation that the new Pokemon appears at the same location the old one was recalled from.

### switchActions lifecycle

- Initialized to `[]` on encounter start (`start.post.ts`, line 141)
- Cleared on new round (`next-turn.post.ts`, line 375)
- Appended on each switch (`switch.post.ts`, line 212)
- Included in encounter response via `buildEncounterResponse` (line 251)
- Synced via WebSocket in `updateFromWebSocket` (lines 533-535)

This lifecycle mirrors the `declarations` field exactly, which is the correct pattern.

## P1/P2 Forward Compatibility

The P0 implementation correctly lays groundwork for future tiers:

- `SwitchAction.actionType` supports `'fainted_switch'`, `'recall_only'`, `'release_only'`, `'forced_switch'` for P1/P2
- `SwitchAction.actionCost` supports `'shift'` for P1 fainted switch
- `SwitchAction.forced` flag for P1 forced switch (Roar)
- `TurnState.canBeCommanded` field exists but is not modified by P0 (correct -- League restriction is P1)
- Request body accepts `faintedSwitch` and `forced` parameters (ignored in P0 validation, ready for P1)

## Verdict

**APPROVED** from a PTU rules perspective. The P0 implementation correctly enforces full switch as Standard Action, 8m range check with League exemption, ownership validation, initiative insertion for both Full Contact and League modes, and switchActions lifecycle. All applicable decrees are respected. P1/P2 features are correctly deferred with forward-compatible data structures.

Note: The code review (code-review-232) identified critical and high issues related to WebSocket sync and undo/redo integration. Those are code quality / integration issues, not PTU rules issues, so this rules review passes independently.
