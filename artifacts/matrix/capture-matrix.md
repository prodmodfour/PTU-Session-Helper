---
domain: capture
type: matrix
total_rules: 33
analyzed_at: 2026-03-05T15:00:00Z
analyzed_by: coverage-analyzer
session: 120
rules_catalog: artifacts/matrix/capture/rules/_index.md
capabilities_catalog: artifacts/matrix/capture/capabilities/_index.md
previous_matrix: artifacts/matrix/capture/matrix.md (session 59, stale)
---

# Feature Completeness Matrix: Capture (Session 120)

## Coverage Score

```
Implemented:              31
Implemented-Unreachable:   0
Partial:                   0
Missing:                   1
Subsystem-Missing:         0
Out of Scope:              1
------------------------------
Total:                    33
Out of Scope:              1
Effective Total:          32

Coverage = (31 + 0.5*0 + 0.5*0) / 32 * 100 = 31 / 32 * 100 = 96.9%
```

| Classification | Count | % of Effective |
|---------------|-------|----------------|
| Implemented | 31 | 96.9% |
| Implemented-Unreachable | 0 | 0% |
| Partial | 0 | 0% |
| Missing | 1 | 3.1% |
| Out of Scope | 1 | -- |
| **Effective Total** | **32** | **100%** |

**Coverage: 96.9%** (up from 70.3% in session 59)

### Delta from Previous Matrix (Session 59)

| Change | Count | Details |
|--------|-------|---------|
| Missing -> Implemented | 7 | R020 (ball catalog), R021-R025 (ball conditions), R026 (Heal Ball effect) |
| Impl-Unreachable -> Implemented | 3 | R004 (accuracy), R027 (workflow), R032 (Standard Action) -- player capture request flow now exists |
| Partial -> Implemented | 2 | R018 (owned check confirmed), R033 (nat 1 confirmed) |
| Unchanged Implemented | 19 | R001-R003, R005-R017, R019, R028-R029 |
| Unchanged Missing | 1 | R031 (recall range) |
| Unchanged Out of Scope | 1 | R030 (missed ball recovery) |

Major capability additions since session 59: POKE_BALL_CATALOG with 25 ball types (C004), 13 ball condition evaluators (C010-C022), ball-condition.service (C027-C029), player capture request flow via WebSocket (C038-C041, C047-C049, C050-C051, C058), post-capture effects (C031 Heal/Friend/Luxury), decree-042 accuracy system (C036), decree-049 loyalty defaults (C054).

---

## Relevant Decrees

- **decree-013**: Use the core 1d100 capture system, not the errata d20 playtest
- **decree-014**: Stuck/Slow capture bonuses are separate, not stacked with volatile (+10/+5 only)
- **decree-015**: Use real max HP for capture rate HP percentage calculations
- **decree-042**: Apply full accuracy system to Poke Ball throws (accuracy stages, Speed Evasion, flanking, rough terrain)
- **decree-049**: Origin-dependent default loyalty -- wild captures at Loyalty 2 (Wary), hatched/gifted at Loyalty 3 (Neutral)

---

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Mapped Capabilities | Accessible From | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|--------------------|-----------------|--------------| ------|
| capture-R001 | Capture Rate Base Formula | formula | core | system | **Implemented** | C001 | gm, player | -- | Base 100 - level*2. Decree-013 confirms 1d100 system. Pure function, auto-imported. |
| capture-R002 | Persistent Status Condition Definition | enumeration | core | system | **Implemented** | C001 | gm, player | -- | Burned, Frozen, Paralyzed, Poisoned enumerated in captureRate.ts PERSISTENT constant. |
| capture-R003 | Volatile Status Condition Definition | enumeration | core | system | **Implemented** | C001 | gm, player | -- | Volatile conditions enumerated separately. Decree-014: Stuck/Slow are OTHER_CONDITIONS, not volatile. |
| capture-R004 | Throwing Accuracy Check | formula | core | player | **Implemented** | C036, C041, C039, C048, C047 | gm, player | -- | Player initiates via C048 (capture button) -> C047 (PlayerCapturePanel) -> C039 (WebSocket request). GM approves via C049 -> C041 (handleApproveCapture) which calls C036 (rollAccuracyCheck with decree-042 full accuracy system: AC 6 + evasion - accuracy stages - flanking + rough terrain). GM can also directly throw via C042 (CapturePanel). |
| capture-R005 | Capture Roll Mechanic | formula | core | system | **Implemented** | C002, C031 | gm, player | -- | 1d100 roll - trainerLevel + modifiers + ballModifier. Decree-013 confirms 1d100 system. |
| capture-R006 | HP Modifier -- Above 75% | modifier | core | system | **Implemented** | C001 | gm, player | -- | -30 modifier applied. Decree-015: uses real max HP for thresholds. |
| capture-R007 | HP Modifier -- 51-75% | modifier | core | system | **Implemented** | C001 | gm, player | -- | -15 modifier applied. |
| capture-R008 | HP Modifier -- 26-50% | modifier | core | system | **Implemented** | C001 | gm, player | -- | No modifier (0). |
| capture-R009 | HP Modifier -- 1-25% | modifier | core | system | **Implemented** | C001 | gm, player | -- | +15 modifier applied. |
| capture-R010 | HP Modifier -- Exactly 1 HP | modifier | core | system | **Implemented** | C001 | gm, player | -- | +30 modifier applied. |
| capture-R011 | Evolution Stage -- Two Remaining | modifier | core | system | **Implemented** | C001, C030, C031 | gm, player | -- | +10. Server-side API (C030/C031) fetches SpeciesData for accurate evolution stage. |
| capture-R012 | Evolution Stage -- One Remaining | modifier | core | system | **Implemented** | C001, C030, C031 | gm, player | -- | +0 (no change). |
| capture-R013 | Evolution Stage -- No Remaining | modifier | core | system | **Implemented** | C001, C030, C031 | gm, player | -- | -10 applied. |
| capture-R014 | Status Affliction Modifier -- Persistent | modifier | core | system | **Implemented** | C001 | gm, player | -- | +10 per persistent condition. Decree-014 confirms separation from Stuck/Slow. |
| capture-R015 | Status Affliction Modifier -- Volatile/Injuries | modifier | core | system | **Implemented** | C001 | gm, player | -- | +5 per volatile, +5 per injury, Stuck +10, Slow +5. Decree-014: Stuck/Slow separate, not stacked with volatile +5. |
| capture-R016 | Rarity Modifier -- Shiny/Legendary | modifier | core | system | **Implemented** | C001, C025, C026 | gm, player | -- | Shiny -10, Legendary -30. C025/C026 auto-detect legendary from ~70 species set. |
| capture-R017 | Fainted Cannot Be Captured | constraint | core | system | **Implemented** | C001, C040 | gm, player | -- | C001: canBeCaptured=false when currentHp<=0. C040: captureTargets filters out fainted Pokemon (currentHp > 0). |
| capture-R018 | Owned Pokemon Cannot Be Captured | constraint | core | system | **Implemented** | C031, C040, C053 | gm, player | -- | C031: validates Pokemon "must be wild/unowned" before capture attempt. C040: filters to enemy-side combatants only. C053: ownerId field used for ownership validation. Previous matrix had this as Partial; C031 now explicitly confirms ownership check. |
| capture-R019 | Fainted Pokemon Capture Failsafe | constraint | core | system | **Implemented** | C001, C031 | gm, player | -- | Same canBeCaptured check as R017. Redundant PTU emphasis in separate chapter. |
| capture-R020 | Poke Ball Type Modifiers | enumeration | core | system | **Implemented** | C004, C005, C009 | gm, player | -- | C004: POKE_BALL_CATALOG with all 25 ball types, base modifiers, categories. C005: calculateBallModifier combines base + conditional. C009: evaluateBallCondition registry for 13 conditional balls. Previously Missing -- now fully implemented. |
| capture-R021 | Level Ball Condition | condition | situational | system | **Implemented** | C012, C027 | gm, player | -- | C012: evaluateLevelBall returns -20 if target level < half active Pokemon level. C027: buildConditionContext auto-populates targetLevel and activePokemonLevel from DB. |
| capture-R022 | Love Ball Condition | condition | situational | system | **Implemented** | C015, C027, C029 | gm, player | -- | C015: evaluateLoveBall returns -30 if same evo line + opposite gender, excludes genderless. C029: deriveEvoLine builds evo line from SpeciesData. C027: auto-populates gender and evo line context. |
| capture-R023 | Timer Ball Scaling | formula | situational | system | **Implemented** | C010, C027 | gm, player | -- | C010: evaluateTimerBall applies -5 per round elapsed, total capped at -20. C027: auto-populates encounterRound from encounter record. |
| capture-R024 | Quick Ball Decay | formula | situational | system | **Implemented** | C011, C027 | gm, player | -- | C011: evaluateQuickBall base -20, degrading per round (R1: -20, R2: -15, R3: -10, R4+: 0). |
| capture-R025 | Heavy Ball Scaling | formula | situational | system | **Implemented** | C013, C027 | gm, player | -- | C013: evaluateHeavyBall returns -5 * (WC - 1). C027: auto-populates targetWeightClass from SpeciesData. |
| capture-R026 | Heal Ball Post-Capture Effect | interaction | situational | system | **Implemented** | C004, C031 | gm, player | -- | C004: Heal Ball has postCaptureEffect='heal_full'. C031: on successful capture, applies heal_full (set to maxHp per decree-015). Also handles Friend Ball (+1 loyalty) and Luxury Ball (raised_happiness). |
| capture-R027 | Capture Workflow | workflow | core | player | **Implemented** | C048, C047, C039, C049, C041, C036, C035, C031, C050, C058, C042, C046 | gm, player | -- | Full workflow chain: Player path: C048 (capture button, checks Standard Action) -> C047 (target select, ball select, rate preview) -> C039 (WebSocket request to GM) -> C049 (GM approval panel) -> C041 (rolls accuracy, executes capture, consumes action) -> C031 (API: capture roll, auto-link, post-capture effects, XP) -> C050 (broadcast) -> C058 (player ack). GM path: C046 (CombatantCaptureSection) -> C042 (CapturePanel: ball select, context toggles, throw) -> C035 (attemptCapture with encounter context). Previously Impl-Unreachable; player capture request flow now provides full player-initiated path. |
| capture-R028 | Natural 20 Accuracy Bonus | interaction | situational | system | **Implemented** | C002, C036, C041 | gm, player | -- | C036: detects isNat20. C041: passes criticalHit to attemptCapture. C002: criticalHit adds +10 to effective capture rate. |
| capture-R029 | Natural 100 Auto-Capture | condition | edge-case | system | **Implemented** | C002 | gm, player | -- | C002: naturalHundred flag -- natural 100 always captures regardless of rate. |
| capture-R030 | Missed Ball Recovery | condition | situational | system | **Out of Scope** | -- | -- | -- | Narrative flavor: ball lands harmlessly behind target, usually without breaking. Not an automatable mechanic -- physical item tracking and terrain placement are outside app scope. |
| capture-R031 | Poke Ball Recall Range | constraint | situational | player | **Missing** | -- | -- | P3 | 8m recall range constraint. No VTT integration for recall distance enforcement. Would require VTT range calculation between trainer token and Pokemon token. Low impact -- recall is rarely contested and does not affect capture mechanics. |
| capture-R032 | Capture Is Standard Action | workflow | core | player | **Implemented** | C048, C035, C041 | gm, player | -- | C048: capture button disabled when canUseStandardAction is false. C035: calls encounter action API to consume Standard Action. C041: on GM approval, consumes Standard Action for the requesting trainer. Previously Impl-Unreachable; player capture request flow now checks and consumes Standard Action from player-initiated path. |
| capture-R033 | Accuracy Check Natural 1 Always Misses | condition | edge-case | system | **Implemented** | C036, C031 | gm, player | -- | C036: "Natural 1 always misses" explicitly handled in rollAccuracyCheck. C031: "nat 1 always misses" in attempt API accuracy validation. Previously Partial; C036/C031 capability docs now explicitly confirm nat 1 auto-miss. |

---

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|------------|-------------|------------------|---------|---------|-------------|
| system | 27 | 27 | 0 | 0 | 0 | 0 |
| player | 5 | 4 | 0 | 0 | 1 | 0 |
| (none) | 1 | 0 | 0 | 0 | 0 | 1 |

### Actor: system (27 rules)

All 27 system-actor rules are Implemented. These are formulas, modifiers, conditions, constraints, and enumerations that the system evaluates automatically. No accessibility concerns -- system-actor rules run server-side or as auto-imported utilities available to all views.

### Actor: player (5 rules)

| Rule | Classification | Player Access Path |
|------|---------------|-------------------|
| R004 (Accuracy Check) | Implemented | C048 -> C047 -> C039 -> C049 -> C041 -> C036 |
| R027 (Capture Workflow) | Implemented | C048 -> C047 -> C039 -> C049 -> C041 -> C031 -> C050 -> C058 |
| R031 (Recall Range) | Missing | No VTT enforcement |
| R032 (Standard Action) | Implemented | C048 checks canUseStandardAction; C041 consumes action |
| R033 (Nat 1 Miss) | Implemented | C036 enforces nat 1 auto-miss in accuracy roll |

### Key Findings (Delta from Session 59)

- **Previously 3 player-actor rules were Implemented-Unreachable -- now all 3 are Implemented.** The player capture request flow (C038-C041, C047-C049, C050-C051, C058) provides a full player-initiated path: select target, choose ball, preview rate, request capture, receive result via WebSocket ack.
- **Previously 7 rules were Missing (entire Poke Ball system) -- now all 7 are Implemented.** POKE_BALL_CATALOG (C004) defines all 25 ball types. 13 conditional ball evaluators (C010-C022) cover every conditional ball from PTU. ball-condition.service (C027-C029) auto-populates context from DB data.
- **Only 1 rule remains Missing:** R031 (Recall Range), a P3 VTT constraint that requires spatial calculation and has minimal gameplay impact.
- **The capture system is no longer GM-gated.** Players have a full capture interface with target selection, ball selection, capture rate preview, and request submission.

---

## Subsystem Gaps

### Previous Subsystem Gaps -- Resolved

**GAP-CAP-1 (from session 59): No Player-Facing Capture Interface** -- **RESOLVED.** PlayerCapturePanel (C047), PlayerCombatActions capture button (C048), requestCapture (C039), player_action_ack display (C058) provide a complete player-initiated capture flow. Player can select target, choose ball type, preview capture rate, and submit request to GM for execution.

**GAP-CAP-2 (from session 59): No Poke Ball Type System** -- **RESOLVED.** POKE_BALL_CATALOG (C004) with 25 types, calculateBallModifier (C005), evaluateBallCondition (C009) with 13 conditional evaluators, BallSelector (C043), CaptureContextToggles (C044), and ball-condition.service (C027-C029) for auto-context provide a comprehensive ball type system.

**GAP-CAP-3 (from session 59): No Capture Rate Display for Players** -- **RESOLVED.** PlayerCapturePanel (C047) shows capture rate preview via server-side fetch (C033/C038) or local estimate (C034/C038). CaptureRateDisplay (C045) renders in both GM and player views.

### Current Subsystem Gaps

No subsystem-level gaps remain. The single Missing rule (R031: Recall Range) is an individual feature gap in the VTT domain, not a subsystem gap for the capture domain.

---

## Gap Priorities

### P3 -- Edge Case, Minimal Impact

| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| capture-R031 | Poke Ball Recall Range | Missing | 8m recall range not enforced in VTT. Recall is a non-contested action in most sessions. Would require VTT spatial calculation between trainer token and Pokemon token, which is a VTT-domain concern, not a capture-domain concern. |

### No P0, P1, or P2 gaps remain.

---

## Auditor Queue

Priority-ordered list for Implementation Auditor to verify correctness of implemented items. Ordered: core scope first, formulas/conditions first, foundation before derived.

### Tier 1: Core Formula -- Base Capture Rate (foundation for all modifiers)

1. **capture-R001** -> C001 -- Verify base 100 - level*2 formula. Decree-013: must be 1d100 system, not errata d20.

### Tier 2: Core Formula -- HP Modifiers (decree-015: real max HP)

2. **capture-R006** -> C001 -- Verify -30 at >75% HP. Decree-015: real max HP for percentage thresholds.
3. **capture-R007** -> C001 -- Verify -15 at 51-75% HP.
4. **capture-R008** -> C001 -- Verify 0 at 26-50% HP.
5. **capture-R009** -> C001 -- Verify +15 at 1-25% HP.
6. **capture-R010** -> C001 -- Verify +30 at exactly 1 HP.

### Tier 3: Core Formula -- Evolution & Rarity Modifiers

7. **capture-R011** -> C001, C030, C031 -- Verify +10 for 2 evolutions remaining. Check SpeciesData lookup.
8. **capture-R012** -> C001 -- Verify +0 for 1 evolution remaining.
9. **capture-R013** -> C001, C030, C031 -- Verify -10 for fully evolved.
10. **capture-R016** -> C001, C025, C026 -- Verify Shiny -10, Legendary -30. Check LEGENDARY_SPECIES set completeness.

### Tier 4: Core Formula -- Status & Injury Modifiers (decree-014)

11. **capture-R014** -> C001 -- Verify +10 per persistent condition. Decree-014: Stuck/Slow NOT in persistent category.
12. **capture-R015** -> C001 -- Verify +5/volatile, +5/injury, Stuck +10, Slow +5. Decree-014: Stuck/Slow are separate, not stacked with volatile +5.

### Tier 5: Core Formula -- Capture Roll

13. **capture-R005** -> C002, C031 -- Verify 1d100 roll with trainerLevel subtraction. Decree-013: 1d100 system only.

### Tier 6: Core Constraints (validation logic)

14. **capture-R017** -> C001, C040 -- Verify canBeCaptured=false when HP <= 0. Verify captureTargets filters fainted.
15. **capture-R019** -> C001, C031 -- Verify fainted failsafe (same check as R017, redundant PTU emphasis).
16. **capture-R018** -> C031, C040, C053 -- Verify attempt endpoint rejects Pokemon with non-null ownerId. Verify captureTargets filters to enemy-side only.

### Tier 7: Core Enumerations

17. **capture-R002** -> C001 -- Verify persistent condition enumeration: Burned, Frozen, Paralyzed, Poisoned (per PTU p.246).
18. **capture-R003** -> C001 -- Verify volatile condition enumeration matches PTU p.247. Cross-reference with GLR Lesson 1.
19. **capture-R020** -> C004 -- Verify all 25 ball types present with correct base modifiers. Cross-reference against PTU p.271-273.

### Tier 8: Situational Ball Conditions

20. **capture-R021** -> C012, C027 -- Verify Level Ball: -20 when target level < half active Pokemon level. Check auto-population of both levels.
21. **capture-R022** -> C015, C027, C029 -- Verify Love Ball: -30 when same evo line + opposite gender. Genderless excluded. Check deriveEvoLine correctness.
22. **capture-R023** -> C010, C027 -- Verify Timer Ball: +5 base, -5 per round, capped at -20. Check encounterRound auto-population.
23. **capture-R024** -> C011 -- Verify Quick Ball: -20 base, degrading (R1: -20, R2: -15, R3: -10, R4+: 0).
24. **capture-R025** -> C013, C027 -- Verify Heavy Ball: -5 per weight class above 1. Check targetWeightClass from SpeciesData.
25. **capture-R026** -> C004, C031 -- Verify Heal Ball post-capture effect: heal to maxHp (decree-015: real max HP). Also verify Friend Ball (+1 loyalty per decree-049) and Luxury Ball (raised_happiness).

### Tier 9: Edge Cases and Interactions

26. **capture-R028** -> C002, C036, C041 -- Verify nat 20 accuracy: isNat20 detection, criticalHit passed through, +10 to effective capture rate.
27. **capture-R029** -> C002 -- Verify natural 100 always captures (naturalHundred flag).
28. **capture-R033** -> C036, C031 -- Verify nat 1 always misses in both rollAccuracyCheck and attempt API accuracy validation.

### Tier 10: Core Workflow End-to-End

29. **capture-R004** -> C036, C041 -- Verify full accuracy system per decree-042: AC 6 base, thrower accuracy stages, target Speed Evasion (capped at 9), flanking penalty, rough terrain penalty. Check CombatantCaptureSection (C046) computes accuracy params from encounter data.
30. **capture-R027** -> Full chain -- Verify end-to-end: Player path (C048 -> C047 -> C039 -> C049 -> C041 -> C031 -> C050 -> C058). GM path (C046 -> C042 -> C035 -> C031). Verify ownerId set, origin='captured', loyalty=2 (decree-049), post-capture effects, trainer XP on new species.
31. **capture-R032** -> C048, C035, C041 -- Verify Standard Action: C048 disables when canUseStandardAction is false. C035/C041 consume Standard Action via encounter action API.
