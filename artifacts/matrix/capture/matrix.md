---
domain: capture
type: matrix
total_rules: 33
analyzed_at: 2026-02-28T00:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: artifacts/matrix/capture/rules/_index.md
capabilities_catalog: artifacts/matrix/capture/capabilities/_index.md
---

# Feature Completeness Matrix: Capture

## Coverage Score

```
Implemented:              20
Implemented-Unreachable:   3
Partial:                   2
Missing:                   7
Subsystem-Missing:         0 (individual Missing counts cover subsystem gaps below)
Out of Scope:              1
─────────────────────────────
Total:                    33
Out of Scope:              1
Effective Total:          32

Coverage = (20 + 0.5*2 + 0.5*3) / 32 * 100 = 22.5 / 32 * 100 = 70.3%
```

| Classification | Count | % of Effective |
|---------------|-------|----------------|
| Implemented | 20 | 62.5% |
| Implemented-Unreachable | 3 | 9.4% |
| Partial | 2 | 6.3% |
| Missing | 7 | 21.9% |
| Out of Scope | 1 | — |
| **Effective Total** | **32** | **100%** |

**Coverage: 70.3%**

---

## Relevant Decrees

- **decree-013**: Use the core 1d100 capture system, not the errata d20 playtest
- **decree-014**: Stuck/Slow capture bonuses are separate, not stacked with volatile
- **decree-015**: Use real max HP for capture rate HP percentage calculations

---

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Mapped Capabilities | Accessible From | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|--------------------|-----------------|--------------| ------|
| capture-R001 | Capture Rate Base Formula | formula | core | system | **Implemented** | C001 | gm, player | — | Base 100 - level*2. Decree-013 confirms 1d100 system. |
| capture-R002 | Persistent Status Condition Definition | enumeration | core | system | **Implemented** | C001 | gm, player | — | Burned, Frozen, Paralyzed, Poisoned, Sleep enumerated in utility. |
| capture-R003 | Volatile Status Condition Definition | enumeration | core | system | **Implemented** | C001 | gm, player | — | Volatile conditions enumerated and handled separately per decree-014. |
| capture-R004 | Throwing Accuracy Check | formula | core | player | **Implemented-Unreachable** | C023 | gm | P1 | AC 6 d20 accuracy check exists but only GM can roll it. Player view has no capture UI. |
| capture-R005 | Capture Roll Mechanic | formula | core | system | **Implemented** | C002, C011 | gm | — | 1d100 roll with trainer level subtraction. Decree-013 confirms. |
| capture-R006 | HP Modifier — Above 75% | modifier | core | system | **Implemented** | C001 | gm, player | — | -30 modifier applied. Decree-015 confirms real max HP for thresholds. |
| capture-R007 | HP Modifier — 51-75% | modifier | core | system | **Implemented** | C001 | gm, player | — | -15 modifier applied. |
| capture-R008 | HP Modifier — 26-50% | modifier | core | system | **Implemented** | C001 | gm, player | — | No modifier (0). |
| capture-R009 | HP Modifier — 1-25% | modifier | core | system | **Implemented** | C001 | gm, player | — | +15 modifier applied. |
| capture-R010 | HP Modifier — Exactly 1 HP | modifier | core | system | **Implemented** | C001 | gm, player | — | +30 modifier applied. |
| capture-R011 | Evolution Stage — Two Remaining | modifier | core | system | **Implemented** | C001, C042 | gm, player | — | +10 from SpeciesData evolution fields. |
| capture-R012 | Evolution Stage — One Remaining | modifier | core | system | **Implemented** | C001, C042 | gm, player | — | +0 (no change). |
| capture-R013 | Evolution Stage — No Remaining | modifier | core | system | **Implemented** | C001, C042 | gm, player | — | -10 applied. |
| capture-R014 | Status Affliction Modifier — Persistent | modifier | core | system | **Implemented** | C001 | gm, player | — | +10 per persistent. Poisoned/Badly Poisoned count once. Decree-014 confirms separation. |
| capture-R015 | Status Affliction Modifier — Volatile/Injuries | modifier | core | system | **Implemented** | C001 | gm, player | — | +5 per volatile, +5 per injury, Stuck +10, Slow +5. Decree-014: Stuck/Slow separate from volatile. |
| capture-R016 | Rarity Modifier — Shiny/Legendary | modifier | core | system | **Implemented** | C001 | gm, player | — | Shiny -10, Legendary -30. |
| capture-R017 | Fainted Cannot Be Captured | constraint | core | system | **Implemented** | C001, C011 | gm | — | canBeCaptured flag false when HP <= 0. |
| capture-R018 | Owned Pokemon Cannot Be Captured | constraint | core | system | **Partial** | C011, C041 | gm | P1 | **Present:** Pokemon.ownerId exists in DB; attempt endpoint looks up Pokemon record. **Missing:** Capability description only confirms 0-HP check. No explicit owned-check documented. Auditor must verify attempt endpoint rejects Pokemon with non-null ownerId. |
| capture-R019 | Fainted Pokemon Capture Failsafe | constraint | core | system | **Implemented** | C001, C011 | gm | — | Same canBeCaptured check as R017. Redundant PTU emphasis. |
| capture-R020 | Poke Ball Type Modifiers | enumeration | core | system | **Missing** | — | — | P1 | No Poke Ball type catalog or ball-specific modifier system. GM manually passes a raw numeric modifier. 25 ball types from PTU not enumerated. |
| capture-R021 | Level Ball Condition | condition | situational | system | **Missing** | — | — | P2 | Depends on R020 ball type system. No Level Ball conditional logic. |
| capture-R022 | Love Ball Condition | condition | situational | system | **Missing** | — | — | P2 | Depends on R020. No Love Ball same-evo-line + opposite-gender check. |
| capture-R023 | Timer Ball Scaling | formula | situational | system | **Missing** | — | — | P2 | Depends on R020. No round-tracking for Timer Ball -5/round scaling. |
| capture-R024 | Quick Ball Decay | formula | situational | system | **Missing** | — | — | P2 | Depends on R020. No Quick Ball decay logic (-20 round 1, decaying). |
| capture-R025 | Heavy Ball Scaling | formula | situational | system | **Missing** | — | — | P2 | Depends on R020. No Heavy Ball weight-class-based modifier. |
| capture-R026 | Heal Ball Post-Capture Effect | interaction | situational | system | **Missing** | — | — | P2 | Depends on R020. No auto-heal-to-max-HP on Heal Ball capture success. |
| capture-R027 | Capture Workflow | workflow | core | player | **Implemented-Unreachable** | C020-C023, C010-C011, C030 | gm | P1 | Full capture chain (accuracy + capture roll + auto-link + action consumption) exists but only GM can initiate. Player view has no capture interface. |
| capture-R028 | Natural 20 Accuracy Bonus | interaction | situational | system | **Implemented** | C002, C011 | gm | — | Nat 20 detected on accuracy, -10 applied to capture roll via criticalHit flag. |
| capture-R029 | Natural 100 Auto-Capture | condition | edge-case | system | **Implemented** | C002 | gm | — | C002 checks naturalHundred — natural 100 always captures regardless of rate. |
| capture-R030 | Missed Ball Recovery | condition | situational | system | **Out of Scope** | — | — | — | Narrative flavor: ball lands harmlessly behind target. Not an automatable mechanic — physical item tracking is out of app scope. |
| capture-R031 | Poke Ball Recall Range | constraint | situational | player | **Missing** | — | — | P3 | 8m recall range. No VTT integration for recall distance enforcement. Low impact — recall is rarely contested. |
| capture-R032 | Capture Is Standard Action | workflow | core | player | **Implemented-Unreachable** | C022 | gm | P1 | C022 optionally consumes Standard Action in encounter context, but only GM can trigger the capture attempt. |
| capture-R033 | Accuracy Check Natural 1 Always Misses | condition | edge-case | system | **Partial** | C023 | gm | P2 | **Present:** C023 returns raw roll value including isNat1 detection. **Missing:** Capture-specific auto-miss enforcement on nat 1 not confirmed in capability docs. Auditor should verify whether general combat nat-1 logic applies or if capture accuracy path handles it independently. |

---

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|------------|-------------|------------------|---------|---------|-------------|
| system | 28 | 20 | 0 | 2 | 6 | 1 |
| player | 4 | 0 | 3 | 0 | 1 | 0 |

### Key Findings

- **3 player-actor rules are Implemented-Unreachable:** R004 (Throwing Accuracy), R027 (Capture Workflow), R032 (Standard Action). All capture mechanics work correctly but only the GM can trigger them. In PTU, throwing a Poke Ball is explicitly a player Standard Action.
- **1 player-actor rule is Missing:** R031 (Recall Range). No VTT enforcement.
- **The entire capture flow is GM-gated.** Players must verbally request capture, and the GM executes it from the GM encounter view. This is a significant workflow bottleneck in multi-player sessions.
- **All 7 Missing rules are system-actor:** 6 are ball-type-specific mechanics (R020-R026) dependent on a Poke Ball catalog that doesn't exist. 1 is VTT-dependent (R031).

---

## Subsystem Gaps

### GAP-CAP-1: No Player-Facing Capture Interface
- **Type:** Subsystem-Missing (player view)
- **Affected Rules:** capture-R004, capture-R027, capture-R032 (3 Implemented-Unreachable), capture-R031 (Missing)
- **Priority:** P1
- **Description:** Players cannot throw Poke Balls, view capture rates, or execute any capture action from the player view. All capture functionality is exclusively GM-accessible. In PTU, throwing a Poke Ball is a Standard Action any trainer can take during their turn (p.227).
- **Suggested Ticket:** "feat: Player View capture interface — accuracy roll, capture attempt, capture rate display"
- **Workaround:** GM performs capture on behalf of player via verbal request. Functional but creates bottleneck.

### GAP-CAP-2: No Poke Ball Type System
- **Type:** Subsystem-Missing (feature)
- **Affected Rules:** capture-R020, capture-R021, capture-R022, capture-R023, capture-R024, capture-R025, capture-R026 (7 Missing rules)
- **Priority:** P1
- **Description:** No Poke Ball type catalog, no ball-specific modifier calculations, no conditional ball effects (Level/Love/Timer/Quick/Heavy/Heal). PTU defines 25 ball types with unique modifiers. GM must manually calculate all ball-specific bonuses and pass them as a raw numeric value in the modifiers field.
- **Suggested Ticket:** "feat: Poke Ball type system — ball catalog constant, auto-modifier calculation, conditional effects for specialty balls"
- **Workaround:** GM manually calculates ball modifier and enters it. Functional for experienced GMs but error-prone and slow.

### GAP-CAP-3: No Capture Rate Display for Players
- **Type:** Accessibility gap (player view)
- **Affected Rules:** capture-R027 (player decision-making aspect)
- **Priority:** P2
- **Description:** CaptureRateDisplay component (C030) only renders in GM encounter view. Players cannot see capture difficulty to make informed decisions about when to attempt capture.
- **Suggested Ticket:** "feat: Capture rate preview in player encounter view"
- **Workaround:** GM verbally communicates difficulty to players.

---

## Gap Priorities

### P1 — Important Mechanic, Commonly Used
| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| capture-R004 | Throwing Accuracy Check | Implemented-Unreachable | Player cannot throw balls from player view |
| capture-R018 | Owned Pokemon Cannot Be Captured | Partial | Ownership validation not confirmed in attempt endpoint |
| capture-R020 | Poke Ball Type Modifiers | Missing | No ball type catalog — all balls use manual numeric modifier |
| capture-R027 | Capture Workflow | Implemented-Unreachable | Full workflow GM-only, player cannot initiate |
| capture-R032 | Capture Is Standard Action | Implemented-Unreachable | Action consumption GM-only |

### P2 — Situational, Workaround Exists
| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| capture-R021 | Level Ball Condition | Missing | No ball type system — no Level Ball logic |
| capture-R022 | Love Ball Condition | Missing | No ball type system — no Love Ball logic |
| capture-R023 | Timer Ball Scaling | Missing | No round-tracking for Timer Ball |
| capture-R024 | Quick Ball Decay | Missing | No decay logic for Quick Ball |
| capture-R025 | Heavy Ball Scaling | Missing | No weight-class lookup for Heavy Ball |
| capture-R026 | Heal Ball Post-Capture Effect | Missing | No auto-heal on Heal Ball capture |
| capture-R033 | Accuracy Check Nat 1 | Partial | Nat 1 auto-miss not confirmed for capture-specific path |

### P3 — Edge Case, Minimal Impact
| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| capture-R031 | Poke Ball Recall Range | Missing | No VTT recall range enforcement |

---

## Auditor Queue

Priority-ordered list for Implementation Auditor to verify correctness of implemented items.

### Tier 1: Core Formulas (verify calculation correctness)
1. **capture-R001** → C001 — Verify base 100 - level*2 formula
2. **capture-R006** → C001 — Verify -30 at >75% HP (decree-015: real max HP)
3. **capture-R007** → C001 — Verify -15 at 51-75% HP
4. **capture-R008** → C001 — Verify 0 at 26-50% HP
5. **capture-R009** → C001 — Verify +15 at 1-25% HP
6. **capture-R010** → C001 — Verify +30 at exactly 1 HP
7. **capture-R011** → C001, C042 — Verify +10 for 2 evolutions remaining (SpeciesData lookup)
8. **capture-R012** → C001 — Verify +0 for 1 evolution remaining
9. **capture-R013** → C001, C042 — Verify -10 for fully evolved
10. **capture-R014** → C001 — Verify +10 per persistent (Poisoned/Badly Poisoned count once)
11. **capture-R015** → C001 — Verify +5/volatile, +5/injury, Stuck +10, Slow +5 (decree-014: separate)
12. **capture-R016** → C001 — Verify Shiny -10, Legendary -30
13. **capture-R005** → C002 — Verify 1d100 roll with trainer level subtraction (decree-013)

### Tier 2: Core Constraints (verify validation logic)
14. **capture-R017** → C001, C011 — Verify canBeCaptured false when HP <= 0
15. **capture-R019** → C011 — Verify fainted failsafe (redundant with R017)
16. **capture-R018** → C011, C041 — **CRITICAL AUDIT**: Verify attempt endpoint rejects Pokemon with non-null ownerId

### Tier 3: Edge Cases and Interactions (verify special-case logic)
17. **capture-R028** → C002 — Verify nat 20 accuracy applies -10 to capture roll (criticalHit flag)
18. **capture-R029** → C002 — Verify natural 100 always captures (naturalHundred flag)
19. **capture-R033** → C023 — **AUDIT**: Verify nat 1 auto-miss exists in capture accuracy path

### Tier 4: Core Workflow (verify end-to-end chain)
20. **capture-R027** → Capability Chain 2 — Verify full workflow: accuracy check → capture roll → auto-link on success (ownerId + origin='captured')
21. **capture-R032** → C022 — Verify Standard Action consumption in encounter context

### Tier 5: Data Model (verify schema and enumeration correctness)
22. **capture-R002** → C001 — Verify persistent condition enumeration matches PTU (Burned, Frozen, Paralyzed, Poisoned, Sleep)
23. **capture-R003** → C001 — Verify volatile condition enumeration matches PTU (Confused, Cursed, Disabled, Rage, Flinch, Infatuation, Suppressed)

### Tier 6: Implemented-Unreachable (verify logic correct, flag accessibility gap)
24. **capture-R004** → C023 — Logic correct (AC 6 d20 roll)? Flag: player view inaccessible
25. **capture-R027** → Chains 1+2 — Logic correct (full chain)? Flag: player view inaccessible
26. **capture-R032** → C022 — Logic correct (action consumption)? Flag: player view inaccessible
