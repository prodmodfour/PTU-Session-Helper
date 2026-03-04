---
review_id: rules-review-310
review_type: rules
reviewer: game-logic-reviewer
trigger: refactoring
target_report: refactoring-108
domain: combat
commits_reviewed:
  - c4df4def
  - 2284d5de
mechanics_verified:
  - voluntary-switch-action-cost
  - fainted-switch-action-cost
  - force-switch-visibility
  - switch-turn-eligibility
  - league-battle-switch-restriction
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - 07-combat.md#pokemon-switching
reviewed_at: 2026-03-04T12:00:00Z
follows_up: null
---

## Mechanics Verified

### Voluntary Switch Action Cost
- **Rule:** "A full Pokemon Switch requires a Standard Action and can be initiated by either the Trainer or their Pokemon on their respective Initiative Counts." (`07-combat.md#pokemon-switching`, p.229)
- **Implementation:** `isSwitchDisabled` checks `turnState.standardActionUsed` on whichever combatant's turn it is (trainer or their Pokemon). Correctly gates on Standard Action consumption.
- **Status:** CORRECT

### Switch Turn Eligibility
- **Rule:** A Switch "can be initiated by either the Trainer or their Pokemon on their respective Initiative Counts." (`07-combat.md#pokemon-switching`, p.229)
- **Implementation:** `isSwitchDisabled` allows the switch button when it is either the trainer's turn OR any of their owned Pokemon's turns (trainer card), or when it is the Pokemon's turn OR its trainer's turn (Pokemon card). The Standard Action is consumed on the initiating combatant (whoever's turn it is). This correctly reflects that either party can initiate the switch on their own initiative count.
- **Status:** CORRECT

### Fainted Switch Action Cost
- **Rule:** "Trainers may Switch out Fainted Pokemon as a Shift Action." (`07-combat.md#pokemon-switching`, p.229); per decree-033, this happens on the trainer's next available turn, not as an immediate reaction.
- **Implementation:** `isFaintedSwitchDisabled` requires it to be the trainer's turn and checks `turnState.shiftActionUsed`. Correctly uses Shift Action (not Standard). Per decree-033, the button only enables on the trainer's own turn, not as a reaction. The fainted check (`currentHp <= 0`) in `canShowFaintedSwitchButton` correctly identifies fainted Pokemon.
- **Status:** CORRECT

### Force Switch Visibility
- **Rule:** Per decree-034, Roar uses its own 6m recall range and is a forced recall mechanic. Whirlwind is a push, not a forced switch. Per decree-039, Roar's forced recall does not override the Trapped condition. Per decree-044, only Trapped blocks recall (no phantom "Bound" condition).
- **Implementation:** `canShowForceSwitchButton` shows the button only on Pokemon combatants that have an owner. The comment correctly cites decree-034 ("Whirlwind is a push, not a forced switch"). This composable only controls button visibility -- the actual Roar/Trapped/range validation logic lives in `useSwitching.ts` and server-side services, which are not part of this refactoring.
- **Status:** CORRECT

### League Battle Switch Restriction
- **Rule:** Per decree-021, League Battles use a two-phase trainer system. Per `07-combat.md` p.229: "Whenever a Trainer Switches Pokemon during a League Battle they cannot command the Pokemon that was Released as part of the Switch for the remainder of the Round unless the Switch was forced by a Move such as Roar or if they were Recalling and replacing a Fainted Pokemon."
- **Implementation:** The extracted composable does not implement League Battle switch restrictions -- it only controls button visibility/disabled state. League-specific command restrictions are enforced elsewhere in the turn/switching workflow. The task description mentioned a `leagueRestrictionText` computed, but no such computed exists in the codebase (neither before nor after this extraction). This is not a gap introduced by the refactoring.
- **Status:** CORRECT (not in scope of extracted computeds)

## Summary

This is a pure extraction refactoring. The 5 computed properties were moved verbatim from `CombatantGmActions.vue` into `useCombatantSwitchButtons.ts` with only the necessary adaptation from `props.combatant` direct access to `combatant.value` ref access. The calling code wraps `props.combatant` in `computed(() => props.combatant)` to maintain reactivity.

All PTU switching rules verified in the extracted code are correctly implemented:
- Voluntary switch costs a Standard Action (either trainer's or Pokemon's turn)
- Fainted switch costs a Shift Action on the trainer's turn only (per decree-033)
- Force switch button correctly limited to owned Pokemon (per decree-034)
- The composable delegates actual switch execution logic (Trapped checks per decree-039/decree-044, range validation, League restrictions) to downstream services

The `useEncounterStore()` call was moved from being called inline within individual computeds to a single call at composable scope. This is functionally identical since Pinia stores are singletons.

CombatantGmActions.vue reduced from 396 to 284 lines as expected.

## Rulings

No new ambiguities discovered. All applicable decrees (decree-021, decree-033, decree-034, decree-039, decree-044) are respected by the extracted code. No decree violations found.

## Verdict

**APPROVED** -- Pure extraction with no logic changes. All PTU switching mechanics in the extracted computeds are correctly implemented and consistent with active decrees.

## Required Changes

None.
