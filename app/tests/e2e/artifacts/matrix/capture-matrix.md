---
domain: capture
analyzed_at: 2026-02-19T00:00:00Z
analyzed_by: coverage-analyzer
total_rules: 33
implemented: 19
partial: 5
missing: 7
out_of_scope: 2
coverage_score: 69.4
---

# Feature Completeness Matrix: Capture

## Coverage Score
**69.4%** — (19 + 0.5 * 5) / (33 - 2) * 100 = 21.5 / 31 * 100

| Classification | Count |
|---------------|-------|
| Implemented | 19 |
| Partial | 5 |
| Missing | 7 |
| Out of Scope | 2 |
| **Total** | **33** |

---

## Implemented Rules

### capture-R001: Capture Rate Base Formula
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`)

### capture-R002: Persistent Status Condition Definition
- **Classification:** Implemented
- **Mapped to:** `capture-C014` — Persistent Conditions Constant (`constants/statusConditions.ts:PERSISTENT_CONDITIONS`)

### capture-R003: Volatile Status Condition Definition
- **Classification:** Implemented
- **Mapped to:** `capture-C015` — Volatile Conditions Constant (`constants/statusConditions.ts:VOLATILE_CONDITIONS`)

### capture-R005: Capture Roll Mechanic
- **Classification:** Implemented
- **Mapped to:** `capture-C012` — attemptCapture (`utils/captureRate.ts:attemptCapture`)

### capture-R006: HP Modifier — Above 75%
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`)

### capture-R007: HP Modifier — 51-75%
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`)

### capture-R008: HP Modifier — 26-50%
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`)

### capture-R009: HP Modifier — 1-25%
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`)

### capture-R010: HP Modifier — Exactly 1 HP
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`)

### capture-R011: Evolution Stage Modifier — Two Evolutions Remaining
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`)
- **Note:** Utility accepts correct inputs; CombatantCard (C024) passes hardcoded evolutionStage 1/3 instead of actual species data. Auditor should verify utility logic is correct; the hardcoded data is a UI integration issue, not a formula issue.

### capture-R012: Evolution Stage Modifier — One Evolution Remaining
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`)

### capture-R013: Evolution Stage Modifier — No Evolutions Remaining
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`)

### capture-R014: Status Affliction Modifier — Persistent
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`) + `capture-C014` — PERSISTENT_CONDITIONS (`constants/statusConditions.ts:PERSISTENT_CONDITIONS`)

### capture-R015: Status Affliction Modifier — Volatile and Injuries
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`) + `capture-C015` — VOLATILE_CONDITIONS + `capture-C016` — STUCK/SLOW_CONDITIONS + `capture-C007` — injuries field

### capture-R016: Rarity Modifier — Shiny and Legendary
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`) + `capture-C008` — shiny field

### capture-R017: Fainted Cannot Be Captured
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate returns `canBeCaptured: false` when HP <= 0 (`utils/captureRate.ts:calculateCaptureRate`)

### capture-R019: Fainted Pokemon Capture Failsafe
- **Classification:** Implemented
- **Mapped to:** `capture-C011` — calculateCaptureRate (`utils/captureRate.ts:calculateCaptureRate`)
- **Note:** Restatement of R017 from a different rulebook section. Same canBeCaptured check covers both.

### capture-R028: Natural 20 Accuracy Bonus
- **Classification:** Implemented
- **Mapped to:** `capture-C012` — attemptCapture (`utils/captureRate.ts:attemptCapture`) — criticalHit parameter adds +10 to effective capture rate

### capture-R029: Natural 100 Auto-Capture
- **Classification:** Implemented
- **Mapped to:** `capture-C012` — attemptCapture (`utils/captureRate.ts:attemptCapture`) — natural 100 on d100 always captures

---

## Partial Rules

### capture-R004: Throwing Accuracy Check
- **Classification:** Partial
- **Present:** d20 roll function exists in `rollAccuracyCheck()` composable (C022). Returns roll value and isNat20 flag.
- **Missing:** AC 6 comparison is not enforced — caller must check manually. Throw range (4 + Athletics Rank) is not calculated or validated. No UI component calls `rollAccuracyCheck()` (Chain 4 breaks at UI layer).
- **Mapped to:** `capture-C022` — rollAccuracyCheck (`composables/useCapture.ts:rollAccuracyCheck`)
- **Gap Priority:** P1

### capture-R018: Owned Pokemon Cannot Be Captured
- **Classification:** Partial
- **Present:** CombatantCard (C024) only shows capture UI for wild Pokemon (enemy side + no ownerId). The `ownerId` field (C003) tracks ownership. UI-level gatekeeping prevents accidental capture attempts on owned Pokemon.
- **Missing:** No server-side validation in the capture attempt endpoint (C018) to reject requests targeting owned Pokemon. A direct API call could bypass the UI check.
- **Mapped to:** `capture-C024` — CombatantCard isWildPokemon check + `capture-C003` — ownerId field
- **Gap Priority:** P1

### capture-R020: Poke Ball Type Modifiers
- **Classification:** Partial
- **Present:** API endpoint (C018) accepts `pokeBallType` parameter. The attempt flow passes this through.
- **Missing:** No constant, enumeration, or lookup table for Poke Ball modifier values found in the capability catalog. The full chart (25 ball types with conditional modifiers) is not represented as app data. It is unclear whether the server converts pokeBallType to a numeric modifier or relies on the client to pass the modifier directly.
- **Mapped to:** `capture-C018` — Attempt Capture API (`server/api/capture/attempt.post.ts`)
- **Gap Priority:** P1

### capture-R027: Capture Workflow
- **Classification:** Partial
- **Present:** Full server-side workflow exists — capture rate calculation (C011, C017), roll resolution (C012, C018), and DB update on success (sets ownerId and origin). Chain 1 (calculate rate) is complete. Chain 3 (execute attempt) is complete on the server side.
- **Missing:** UI wiring is broken — CaptureRateDisplay (C023) emits an `attempt` event but CombatantCard (C024) does not handle it. There is no `@attempt` listener connecting the button to the composable's `attemptCapture()` function. The "Attempt Capture" button exists visually but does nothing. Additionally, the accuracy check (C022) is not integrated into the workflow.
- **Mapped to:** Chain 3 (`capture-C023` -> `capture-C021` -> `capture-C018` -> `capture-C011` + `capture-C012` -> `capture-C001`)
- **Gap Priority:** P0

### capture-R032: Capture Is a Standard Action
- **Classification:** Partial
- **Present:** Capture can be initiated during an encounter (the UI shows capture rate on combatant cards during combat).
- **Missing:** No enforcement that capture consumes a Standard Action in the action economy. The turn/action tracking system does not deduct or validate action usage when a capture attempt is made.
- **Mapped to:** No specific capability — depends on encounter action economy system
- **Gap Priority:** P2

---

## Missing Rules

### capture-R021: Level Ball Condition
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Requires comparing target Pokemon level to active Pokemon level. No conditional ball logic exists in the app. Workaround: GM manually applies the -20 modifier.

### capture-R022: Love Ball Condition
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Requires checking same evolutionary line and opposite gender between active Pokemon and target. Complex condition involving species evolution chain lookup and gender comparison. Workaround: GM manually applies the -30 modifier.

### capture-R023: Timer Ball Scaling
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Requires tracking rounds since encounter start and scaling modifier from +5 down to -20. The encounter system tracks turns but no ball-specific round-based modifier logic exists. Workaround: GM manually calculates the modifier based on round count.

### capture-R024: Quick Ball Decay
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Similar to Timer Ball — requires round-based modifier decay from -20 up to 0 over 4 rounds. Workaround: GM manually applies the correct modifier per round.

### capture-R025: Heavy Ball Scaling
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Requires looking up target Pokemon weight class from species data. No weight class field found in the capability catalog's SpeciesData model (C002). Workaround: GM manually applies the modifier.

### capture-R026: Heal Ball Post-Capture Effect
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Requires healing captured Pokemon to max HP immediately on capture. The capture attempt endpoint (C018) updates ownerId and origin but does not heal. Workaround: GM manually sets HP to max after capture.

### capture-R033: Accuracy Check Natural 1 Always Misses
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** The accuracy check (C022) tracks isNat20 but does not flag natural 1. Since the AC 6 comparison itself is not enforced (R004 partial), nat 1 handling is also absent. Workaround: GM observes the roll and applies the rule manually.

---

## Out of Scope

### capture-R030: Missed Ball Recovery
- **Classification:** Out of Scope
- **Justification:** The app is a session helper focused on encounter and combat automation. It does not track item inventory, Poke Ball quantities, or physical ball recovery after a miss. Ball inventory management is outside the app's stated purpose — the GM tracks consumables separately.

### capture-R031: Poke Ball Recall Range
- **Classification:** Out of Scope
- **Justification:** Poke Ball recall (returning a Pokemon to its ball from 8 meters away) is a narrative/spatial action handled by the GM during play. The VTT grid could theoretically enforce this range, but the app treats recall as an out-of-combat action not requiring automation. No spatial constraints on non-combat Poke Ball usage exist in the app's design.

---

## Auditor Queue

Ordered list of items for the Implementation Auditor to check. Core scope first, formulas and conditions first, foundation rules before derived.

1. `capture-R001` — Implemented — core/formula — Base capture rate formula (foundation)
2. `capture-R002` — Implemented — core/enumeration — Persistent status conditions (foundation) — verify exact condition names match PTU (Sleep vs Badly Poisoned)
3. `capture-R003` — Implemented — core/enumeration — Volatile status conditions (foundation) — verify exact condition names (Rage vs Enraged, Bad Sleep vs Asleep)
4. `capture-R005` — Implemented — core/formula — d100 capture roll mechanic (foundation)
5. `capture-R017` — Implemented — core/constraint — Fainted cannot be captured (foundation)
6. `capture-R006` — Implemented — core/modifier — HP >75% modifier (-30)
7. `capture-R007` — Implemented — core/modifier — HP 51-75% modifier (-15)
8. `capture-R008` — Implemented — core/modifier — HP 26-50% modifier (0)
9. `capture-R009` — Implemented — core/modifier — HP 1-25% modifier (+15)
10. `capture-R010` — Implemented — core/modifier — HP exactly 1 (+30)
11. `capture-R011` — Implemented — core/modifier — Evolution stage: two remaining (+10)
12. `capture-R012` — Implemented — core/modifier — Evolution stage: one remaining (0)
13. `capture-R013` — Implemented — core/modifier — Evolution stage: none remaining (-10)
14. `capture-R014` — Implemented — core/modifier — Persistent status +10 each
15. `capture-R015` — Implemented — core/modifier — Volatile +5, Injuries +5, Stuck +10, Slow +5
16. `capture-R016` — Implemented — core/modifier — Shiny -10, Legendary -30
17. `capture-R019` — Implemented — core/constraint — Fainted capture failsafe (same check as R017)
18. `capture-R004` — Partial (present) — core/formula — Accuracy check d20 roll exists
19. `capture-R018` — Partial (present) — core/constraint — UI-level owned Pokemon gatekeeping
20. `capture-R020` — Partial (present) — core/enumeration — pokeBallType parameter accepted
21. `capture-R027` — Partial (present) — core/workflow — Server-side capture workflow (rate calc + roll + DB update)
22. `capture-R028` — Implemented — situational/interaction — Nat 20 accuracy bonus (+10 to capture rate)
23. `capture-R029` — Implemented — edge-case/condition — Natural 100 auto-capture
24. `capture-R032` — Partial (present) — core/workflow — Capture during encounter (action economy not enforced)
