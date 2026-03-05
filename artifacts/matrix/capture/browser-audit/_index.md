---
domain: capture
type: browser-audit
browser_audited_at: 2026-03-05T20:03:00Z
browser_audited_by: browser-auditor
total_checked: 10
present: 10
absent: 0
error: 0
unreachable: 0
untestable: 49
---

# Browser Audit: Capture Domain

## Summary

All 59 capture-domain capabilities were classified. Of the 10 that have a UI terminus (components), all 10 were verified as **Present** in the running application via playwright-cli accessibility tree snapshots. The remaining 49 capabilities are server-side utilities, constants, API endpoints, composable internals, WebSocket events, or Prisma fields with no direct UI representation -- classified as **Untestable** for browser auditing.

### Test Environment

- **Dev server:** `npm run dev` on port 3000
- **Test encounter:** "Capture Browser Audit Test" -- trainer battle with Hassan (player trainer), Chomps (player Pokemon), and wild Pidgey (enemy)
- **Encounter state:** Served to group, combat started, Hassan's turn (trainer phase)
- **Decrees checked:** decree-013 (1d100 system), decree-014 (Stuck/Slow separate), decree-015 (real max HP), decree-042 (full accuracy system), decree-049 (loyalty by origin). No conflicts found -- all UI elements are consistent with active decrees.

### Key Findings

1. **GM capture panel is fully functional.** The CombatantCard for wild Pokemon on the GM view renders the complete capture pipeline: trainer selector, BallSelector (25 ball types), CaptureContextToggles (3 situational checkboxes), CaptureRateDisplay (live rate + difficulty), and "Throw" action button. Verified at `/gm` in list view mode.

2. **Player capture button is present.** The "Capture" request button appears in the player encounter view under "Requests (GM approval)" when it is the trainer's turn. The PlayerCapturePanel (target selection + capture rate preview + "Request Capture") is conditionally rendered upon clicking the button.

3. **Group view has no capture elements.** This is expected -- capture is an interactive mechanic, not a passive display element. The group encounter view shows combatant cards and initiative but no capture controls.

4. **All conditional renders are correctly gated.** The `v-if="isGm && isWildPokemon"` guard on CombatantCaptureSection, `v-if="showCapturePanel"` on PlayerCapturePanel, and `v-if="pendingList.length > 0"` on PlayerRequestPanel are all functioning as designed.

5. **Capture rate calculation is live.** The CaptureRateDisplay showed 70% / "Easy" for a level 5 Pidgey at full HP with a Basic Ball -- mathematically correct per the capture formula: base 100 - (5*2) = 90, HP >75% modifier = -30, evolution stage modifier = +10 (Pidgey has 2 evolutions remaining) = 70.

---

## Classification Breakdown

| Classification | Count | Percentage |
|---------------|-------|------------|
| Present | 10 | 17.0% |
| Absent | 0 | 0.0% |
| Error | 0 | 0.0% |
| Unreachable | 0 | 0.0% |
| Untestable | 49 | 83.0% |
| **Total** | **59** | **100%** |

---

## Action Items

None. All UI-facing capabilities are present and accessible.

| Priority | Action | Cap IDs | Status |
|----------|--------|---------|--------|
| -- | No action items | -- | All clear |

---

## View Files

| View | File | Capabilities Checked |
|------|------|---------------------|
| GM (`/gm`) | [view-gm.md](view-gm.md) | 7 (C042, C043, C044, C045, C046, C049, C057) |
| Group (`/group`) | [view-group.md](view-group.md) | 0 (no capture elements expected) |
| Player (`/player`) | [view-player.md](view-player.md) | 3 (C047, C048, C058) |
| Untestable | [untestable-items.md](untestable-items.md) | 49 (C001-C041, C050-C056, C059) |

---

## Capability-to-View Map

| Cap ID | Name | Type | View | Classification |
|--------|------|------|------|----------------|
| capture-C001 | calculateCaptureRate | utility | -- | Untestable |
| capture-C002 | attemptCapture | utility | -- | Untestable |
| capture-C003 | getCaptureDescription | utility | -- | Untestable |
| capture-C004 | POKE_BALL_CATALOG | constant | -- | Untestable |
| capture-C005 | calculateBallModifier | utility | -- | Untestable |
| capture-C006 | getBallsByCategory | utility | -- | Untestable |
| capture-C007 | getBallDef | utility | -- | Untestable |
| capture-C008 | getAvailableBallNames | utility | -- | Untestable |
| capture-C009 | evaluateBallCondition | utility | -- | Untestable |
| capture-C010 | evaluateTimerBall | utility | -- | Untestable |
| capture-C011 | evaluateQuickBall | utility | -- | Untestable |
| capture-C012 | evaluateLevelBall | utility | -- | Untestable |
| capture-C013 | evaluateHeavyBall | utility | -- | Untestable |
| capture-C014 | evaluateFastBall | utility | -- | Untestable |
| capture-C015 | evaluateLoveBall | utility | -- | Untestable |
| capture-C016 | evaluateNetBall | utility | -- | Untestable |
| capture-C017 | evaluateDuskBall | utility | -- | Untestable |
| capture-C018 | evaluateMoonBall | utility | -- | Untestable |
| capture-C019 | evaluateLureBall | utility | -- | Untestable |
| capture-C020 | evaluateRepeatBall | utility | -- | Untestable |
| capture-C021 | evaluateNestBall | utility | -- | Untestable |
| capture-C022 | evaluateDiveBall | utility | -- | Untestable |
| capture-C023 | formatModifier | utility | -- | Untestable |
| capture-C024 | modifierClass | utility | -- | Untestable |
| capture-C025 | isLegendarySpecies | utility | -- | Untestable |
| capture-C026 | LEGENDARY_SPECIES | constant | -- | Untestable |
| capture-C027 | buildConditionContext | service-function | -- | Untestable |
| capture-C028 | checkEvolvesWithStone | service-function | -- | Untestable |
| capture-C029 | deriveEvoLine | service-function | -- | Untestable |
| capture-C030 | Capture Rate API | api-endpoint | -- | Untestable |
| capture-C031 | Capture Attempt API | api-endpoint | -- | Untestable |
| capture-C032 | useCapture | composable-function | -- | Untestable |
| capture-C033 | useCapture.getCaptureRate | composable-function | -- | Untestable |
| capture-C034 | useCapture.calculateCaptureRateLocal | composable-function | -- | Untestable |
| capture-C035 | useCapture.attemptCapture | composable-function | -- | Untestable |
| capture-C036 | useCapture.rollAccuracyCheck | composable-function | -- | Untestable |
| capture-C037 | useCapture.getAvailableBalls | composable-function | -- | Untestable |
| capture-C038 | usePlayerCapture | composable-function | -- | Untestable |
| capture-C039 | usePlayerCombat.requestCapture | composable-function | -- | Untestable |
| capture-C040 | usePlayerCombat.captureTargets | composable-function | -- | Untestable |
| capture-C041 | usePlayerRequestHandlers.handleApproveCapture | composable-function | -- | Untestable |
| capture-C042 | CapturePanel | component | GM | Present |
| capture-C043 | BallSelector | component | GM | Present |
| capture-C044 | CaptureContextToggles | component | GM | Present |
| capture-C045 | CaptureRateDisplay | component | GM | Present |
| capture-C046 | CombatantCaptureSection | component | GM | Present |
| capture-C047 | PlayerCapturePanel | component | Player | Present |
| capture-C048 | PlayerCombatActions.captureButton | component | Player | Present |
| capture-C049 | PlayerRequestPanel.captureApproval | component | GM | Present |
| capture-C050 | capture_attempt WebSocket event | websocket-event | -- | Untestable |
| capture-C051 | PlayerActionType.capture | constant | -- | Untestable |
| capture-C052 | PokemonOrigin.captured | prisma-field | -- | Untestable |
| capture-C053 | Pokemon.ownerId | prisma-field | -- | Untestable |
| capture-C054 | Pokemon.loyalty | prisma-field | -- | Untestable |
| capture-C055 | HumanCharacter.ownedSpecies | prisma-field | -- | Untestable |
| capture-C056 | BallConditionContext | constant | -- | Untestable |
| capture-C057 | CombatantCard.captureSection | component | GM | Present |
| capture-C058 | player.index.captureAckDisplay | component | Player | Present |
| capture-C059 | trainerXpOnCapture | utility | -- | Untestable |
