---
domain: healing
type: matrix
total_rules: 42
analyzed_at: 2026-02-28T00:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: artifacts/matrix/healing/rules/_index.md
capabilities_catalog: artifacts/matrix/healing/capabilities/_index.md
---

# Feature Completeness Matrix: Healing

## Coverage Score

```
Implemented:              22
Implemented-Unreachable:   3
Partial:                   5
Missing:                  10
Subsystem-Missing:         0 (individual Missing counts cover subsystem gaps below)
Out of Scope:              2
─────────────────────────────
Total:                    42
Out of Scope:              2
Effective Total:          40

Coverage = (22 + 0.5*5 + 0.5*3) / 40 * 100 = 26.0 / 40 * 100 = 65.0%
```

| Classification | Count | % of Effective |
|---------------|-------|----------------|
| Implemented | 22 | 55.0% |
| Implemented-Unreachable | 3 | 7.5% |
| Partial | 5 | 12.5% |
| Missing | 10 | 25.0% |
| Out of Scope | 2 | — |
| **Effective Total** | **40** | **100%** |

**Coverage: 65.0%**

---

## Relevant Decrees

- **decree-016**: Extended rest clears only Drained AP, not Bound AP
- **decree-017**: Pokemon Center heals to effective max HP, respecting injury cap
- **decree-018**: Extended rest accepts a duration parameter for scalable healing
- **decree-019**: New Day is a pure counter reset, no implicit extended rest
- **decree-020**: Pokemon Center healing time uses pre-healing injury count

---

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Mapped Capabilities | Accessible From | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|--------------------|-----------------|--------------| ------|
| healing-R001 | Tick of Hit Points Definition | formula | core | system | **Implemented** | C052 | api-only | — | 1/10th max HP per tick. Used by injury reduction and healing calculations. |
| healing-R002 | Rest Definition | condition | core | system | **Implemented** | C001, C006 | gm | — | 30-min rest endpoints implement rest mechanic. |
| healing-R003 | Injury Definition — HP Reduction | formula | core | system | **Implemented** | C052, C033 | gm | — | getEffectiveMaxHp computes injury-reduced max HP. |
| healing-R004 | Injury from Massive Damage | condition | core | system | **Implemented** | C033 | api-only | — | calculateDamage tracks massiveDamageInjury (50%+ real maxHp). |
| healing-R005 | Injury from HP Markers | condition | core | system | **Implemented** | C033 | api-only | — | calculateDamage tracks markerInjuries at 50%, 0%, -50%, -100% thresholds. |
| healing-R006 | Fainted Condition Definition | condition | core | system | **Implemented** | C028, C030, C033 | gm | — | Fainted tracked on 0 HP. Healing removes fainted when HP restored to positive. |
| healing-R007 | Natural Healing Rate (1/16th per rest) | formula | core | system | **Implemented** | C012 | api-only | — | calculateRestHealing returns 1/16th of real maxHp (min 1). |
| healing-R008 | Rest Requires Continuous Half Hour | constraint | core | system | **Implemented** | C001, C006 | gm | — | Rest endpoints apply one 30-min increment per call. |
| healing-R009 | Rest Daily Cap (8 Hours / 480 min) | constraint | core | system | **Implemented** | C001, C006, C012 | gm | — | restMinutesToday capped at 480. |
| healing-R010 | Heavily Injured Threshold (5+ Injuries) | condition | core | system | **Implemented** | C012 | api-only | — | canHeal=false when injuries >= 5. |
| healing-R011 | Heavily Injured Blocks Rest HP Recovery | constraint | core | system | **Implemented** | C012, C001, C006 | gm | — | Rest healing blocked at 5+ injuries. |
| healing-R012 | Massive Damage Exclusion for Set/Lose HP Moves | constraint | situational | system | **Partial** | C033 | api-only | P2 | **Present:** calculateDamage computes massive damage from raw damage amount. **Missing:** No distinction between "damage" and "set/lose HP" effects (Pain Split, Endeavor). These moves should not trigger massive damage injury. |
| healing-R013 | Multiple Injuries from Single Attack | interaction | core | system | **Implemented** | C033 | api-only | — | calculateDamage returns totalNewInjuries combining massive damage + marker crossings in one call. |
| healing-R014 | Fainted Cured by Revive or Healing to Positive HP | workflow | core | system | **Implemented** | C028, C030 | gm | — | applyHealingToEntity removes Fainted when healed above 0 HP. faintedRemoved flag in result. |
| healing-R015 | Fainted Clears All Status Conditions | interaction | core | system | **Partial** | C033 | api-only | P1 | **Present:** Fainted state detected by calculateDamage. **Missing:** Auto-clearing all persistent and volatile status conditions when a combatant becomes fainted is not confirmed in capability docs. Auditor must verify damage application pipeline clears statuses on faint. |
| healing-R016 | Heavily Injured Combat Penalty | modifier | core | system | **Missing** | — | — | P1 | Heavily Injured entities (5+ injuries) should lose HP equal to injury count on Standard Actions and when taking damage. No capability implements this automatic HP loss. |
| healing-R017 | Injury Does Not Affect HP Marker Thresholds | constraint | core | system | **Implemented** | C033 | api-only | — | Marker thresholds use real maxHp. Consistent with decree-015 precedent. |
| healing-R018 | Take a Breather — Core Effects | workflow | core | player | **Implemented-Unreachable** | C029, C034, C046, C062 | gm | P1 | Full breather implementation: reset stages (with Heavy Armor CS override), remove temp HP, cure volatile+Slow+Stuck. Only GM can trigger. Player view has no breather action. |
| healing-R019 | Take a Breather — Action Cost | constraint | core | player | **Implemented-Unreachable** | C029 | gm | P1 | Marks standard+shift as used, applies Tripped+Vulnerable. GM-only. |
| healing-R020 | Take a Breather — Requires Save Checks | constraint | situational | system | **Missing** | — | — | P2 | Breather endpoint does not enforce save check requirement (e.g., Confusion save before acting). |
| healing-R021 | Take a Breather — Assisted by Trainer | workflow | situational | player | **Missing** | — | — | P2 | No assisted breather workflow (Trainer Full Action, Interrupt for target, DC 12 Command Check). |
| healing-R022 | Healing Past HP Markers Re-Injury Risk | interaction | situational | system | **Implemented** | C033 | api-only | — | HP marker system is absolute — healing past a marker and taking damage back through it naturally triggers a new injury via calculateDamage marker crossing logic. |
| healing-R023 | Natural Injury Healing (24h Timer) | workflow | core | gm | **Implemented** | C004, C009, C014 | gm | — | canHealInjuryNaturally checks 24h elapsed since lastInjuryTime. Both character and Pokemon endpoints. |
| healing-R024 | Trainer AP Drain to Remove Injury | workflow | situational | player | **Implemented-Unreachable** | C004 | gm | P2 | Character heal-injury with method='drain_ap' exists (costs 2 AP). Only accessible from GM view. Player cannot drain own AP from player view. |
| healing-R025 | Daily Injury Healing Cap (3/Day) | constraint | core | system | **Implemented** | C004, C009, C016 | gm | — | All injury healing sources check injuriesHealedToday against 3-per-day limit. |
| healing-R026 | Pokemon Center — Base Healing | workflow | core | gm | **Implemented** | C003, C008 | gm | — | Full HP to effective max (decree-017), clear all statuses, heal injuries, restore moves (Pokemon). |
| healing-R027 | Pokemon Center — Injury Time (Under 5) | modifier | core | system | **Implemented** | C015 | api-only | — | 1hr base + 30min/injury. Decree-020: pre-healing count. |
| healing-R028 | Pokemon Center — Injury Time (5+) | modifier | situational | system | **Implemented** | C015 | api-only | — | 1hr/injury if 5+ injuries. |
| healing-R029 | Pokemon Center — Injury Cap (3/Day) | constraint | core | system | **Implemented** | C016 | api-only | — | Same daily cap as all injury healing. |
| healing-R030 | Death from 10 Injuries | condition | edge-case | system | **Missing** | — | — | P1 | No death detection or warning when injuries reach 10 or HP reaches death threshold (-50 HP or -200% HP). |
| healing-R031 | Fainted Recovery Timer (Potions) | constraint | situational | system | **Missing** | — | — | P2 | Potion healing restores HP but Pokemon remains fainted for 10 more minutes. No timer tracking for this. |
| healing-R032 | Extended Rest — Clears Persistent Status | workflow | core | gm | **Implemented** | C002, C007, C017, C018 | gm | — | clearPersistentStatusConditions removes Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned. |
| healing-R033 | Extended Rest — Restores Drained AP | modifier | core | system | **Partial** | C002 | gm | P0 | **Present:** Extended rest restores drained AP. **Missing:** Decree-016 mandates extended rest does NOT clear bound AP, but C002 description says it clears bound AP too. **CRITICAL**: Auditor must verify actual code — if bound AP is still being cleared, this is a decree-016 violation. Implementation ticket ptu-rule-105 was created for this fix. |
| healing-R034 | Extended Rest — Daily Move Recovery | workflow | core | system | **Implemented** | C007, C053 | gm | — | isDailyMoveRefreshable implements rolling window: moves used today are NOT refreshed. |
| healing-R035 | HP Lost vs Damage Distinction | condition | core | system | **Partial** | C033 | api-only | P2 | **Present:** calculateDamage handles generic HP loss. **Missing:** No mechanism to flag "set HP" or "lose HP" effects vs actual damage, which affects injury and defense calculations. Same gap as R012. |
| healing-R036 | Bandages — Double Healing Rate | modifier | situational | gm | **Out of Scope** | — | — | — | No bandage system. Bandages are physical items requiring time tracking (6hr duration) that the session helper doesn't track. GM handles manually. |
| healing-R037 | Bandages — Heal 1 Injury After Full Duration | condition | situational | gm | **Out of Scope** | — | — | — | Same — bandage duration tracking is out of scope. |
| healing-R038 | Bandages — Broken by Damage | constraint | situational | system | **Missing** | — | — | P3 | Would require bandage state tracking. No bandage system exists. Low priority — follows from bandages being out of scope. |
| healing-R039 | Basic Restorative Items | enumeration | core | gm | **Partial** | C028 | gm | P1 | **Present:** Generic in-combat healing (C028) can apply any HP amount. **Missing:** No item catalog (Potion=20HP, Super Potion=35HP, etc.), no Revive-specific logic (set to specific HP amount + remove fainted), no Full Restore (heal + cure statuses). GM manually enters amounts. |
| healing-R040 | Status Cure Items | enumeration | core | gm | **Missing** | — | — | P2 | No item catalog for status cures (Antidote, Burn Heal, etc.). Status conditions can be manually edited but there's no item-based cure flow. |
| healing-R041 | Applying Items — Action Economy | workflow | core | player | **Missing** | — | — | P2 | No item application action economy (Standard Action, target forfeits next actions, Medic Training exception, self-use is Full-Round). |
| healing-R042 | AP Scene Refresh and Drain/Bind | workflow | cross-domain-ref | system | **Partial** | C054, C055, C056 | api-only | P1 | **Present:** calculateSceneEndAp, calculateAvailableAp, calculateMaxAp utilities exist and are correct. **Missing:** No endpoint or UI trigger for scene-end AP restoration. When a scene/encounter ends, AP is not automatically restored. |

---

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|------------|-------------|------------------|---------|---------|-------------|
| system | 29 | 18 | 0 | 4 | 5 | 0 |
| gm | 6 | 4 | 0 | 1 | 1 | 0 |
| player | 5 | 0 | 3 | 0 | 2 | 0 |
| cross-domain | 2 | 0 | 0 | 0 | 0 | 2 |

### Key Findings

- **3 player-actor rules are Implemented-Unreachable:** R018 (Breather Core), R019 (Breather Action Cost), R024 (AP Drain Injury). All healing actions are GM-only.
- **2 player-actor rules are Missing:** R021 (Assisted Breather) and R041 (Item Action Economy).
- **All healing is GM-gated.** No player view has any healing interface — not for resting, healing items, breather, or injury management.
- **The entire item system is Missing.** No item catalog, no item-based healing flow, no item action economy. All healing is done via generic numeric inputs.

---

## Subsystem Gaps

### GAP-HEAL-1: No Player-Facing Healing Interface
- **Type:** Subsystem-Missing (player view)
- **Affected Rules:** healing-R018, healing-R019 (Implemented-Unreachable), healing-R021, healing-R024, healing-R041 (Missing)
- **Priority:** P1
- **Description:** Players cannot trigger any healing action from the player view. No rest, extended rest, Pokemon Center, injury healing, Take a Breather, or item usage. All healing is mediated by the GM.
- **Suggested Ticket:** "feat: Player View healing interface — rest, injury healing, item usage"
- **Workaround:** GM performs all healing actions on behalf of players.

### GAP-HEAL-2: No Item System
- **Type:** Subsystem-Missing (feature)
- **Affected Rules:** healing-R039 (Partial), healing-R040, healing-R041 (Missing)
- **Priority:** P1
- **Description:** No item catalog (Potion, Super Potion, Revive, Antidote, etc.), no item inventory tracking, no item-specific healing logic, no item action economy (Standard Action, forfeit next turn). GM must manually enter all healing amounts and manually track item usage.
- **Suggested Ticket:** "feat: Healing item system — item catalog constant, item-specific healing, Revive logic, action economy"
- **Workaround:** GM manually enters healing amounts and status changes.

### GAP-HEAL-3: No Death Detection
- **Type:** Subsystem-Missing (safety check)
- **Affected Rules:** healing-R030 (Missing)
- **Priority:** P1
- **Description:** No warning or detection when injuries reach 10 (death) or HP reaches death threshold (-50 HP or -200% HP, whichever is lower). The GM must manually track this critical game state.
- **Suggested Ticket:** "feat: Death detection and warning — 10 injuries, extreme negative HP"
- **Workaround:** GM manually monitors injury count. Risk of oversight during intense combat.

### GAP-HEAL-4: No Scene-End AP Restoration
- **Type:** Subsystem-Missing (automation)
- **Affected Rules:** healing-R042 (Partial)
- **Priority:** P1
- **Description:** Utility functions for scene-end AP calculation exist (C054-C056) but no endpoint or UI triggers them. When a scene/encounter ends, AP should be automatically restored (minus drained and bound).
- **Suggested Ticket:** "feat: Auto-restore AP on scene/encounter end"
- **Workaround:** GM manually tracks AP across scenes.

### GAP-HEAL-5: No Bandage System
- **Type:** Out of Scope (classified, documented)
- **Affected Rules:** healing-R036, healing-R037 (Out of Scope), healing-R038 (Missing)
- **Priority:** P3
- **Description:** Bandages require 6-hour duration tracking, damage interruption, and healing rate modification. The session helper does not track time-based item effects. Classified as Out of Scope for the core product.

---

## Gap Priorities

### P0 — Decree Violation (CRITICAL)
| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| healing-R033 | Extended Rest — Drained AP | Partial | Decree-016 violation: C002 may still clear bound AP during extended rest. Auditor must verify actual code. |

### P1 — Important Mechanic, Commonly Used
| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| healing-R015 | Fainted Clears Statuses | Partial | Auto-clear statuses on faint not confirmed |
| healing-R016 | Heavily Injured Combat Penalty | Missing | 5+ injury HP loss on Standard Action / damage taken |
| healing-R018 | Breather Core Effects | Implemented-Unreachable | Player cannot trigger Take a Breather |
| healing-R019 | Breather Action Cost | Implemented-Unreachable | Player cannot trigger |
| healing-R030 | Death from 10 Injuries | Missing | No death detection or warning |
| healing-R039 | Basic Restorative Items | Partial | No item catalog — generic HP amounts only |
| healing-R042 | AP Scene Refresh | Partial | Utilities exist but no auto-trigger |

### P2 — Situational, Workaround Exists
| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| healing-R012 | Massive Damage Set/Lose Exclusion | Partial | No move type distinction |
| healing-R020 | Breather Save Checks | Missing | No save check enforcement |
| healing-R021 | Assisted Breather | Missing | No DC 12 Command Check workflow |
| healing-R024 | AP Drain Injury | Implemented-Unreachable | Player cannot drain own AP |
| healing-R031 | Fainted Potion Timer | Missing | No 10-min fainted timer |
| healing-R035 | HP Lost vs Damage | Partial | Same as R012 |
| healing-R040 | Status Cure Items | Missing | No item catalog for status cures |
| healing-R041 | Item Action Economy | Missing | No action cost for items |

### P3 — Edge Case, Minimal Impact
| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| healing-R038 | Bandages Broken by Damage | Missing | No bandage system |

---

## Auditor Queue

Priority-ordered list for Implementation Auditor to verify correctness of implemented items.

### Tier 0: Decree Compliance (CRITICAL — verify first)
1. **healing-R033** → C002 — **CRITICAL**: Verify extended rest does NOT clear bound AP per decree-016. Check if ptu-rule-105 ticket was implemented.

### Tier 1: Core Formulas (verify calculation correctness)
2. **healing-R001** → C052 — Verify tick = 1/10th max HP
3. **healing-R003** → C052 — Verify getEffectiveMaxHp: maxHp * (10 - injuries) / 10
4. **healing-R007** → C012 — Verify 1/16th of real maxHp (min 1), capped at effective max
5. **healing-R027** → C015 — Verify 1hr base + 30min/injury (decree-020: pre-healing count)
6. **healing-R028** → C015 — Verify 1hr/injury if 5+ injuries

### Tier 2: Core Constraints (verify validation logic)
7. **healing-R009** → C001, C006, C012 — Verify 480-min daily cap
8. **healing-R011** → C012 — Verify rest blocked at 5+ injuries
9. **healing-R025** → C004, C009, C016 — Verify 3/day injury healing limit from all sources
10. **healing-R029** → C016 — Verify Pokemon Center respects same 3/day cap
11. **healing-R017** → C033 — Verify marker thresholds use real maxHp

### Tier 3: Injury System (verify damage-to-injury pipeline)
12. **healing-R004** → C033 — Verify massive damage = 50%+ real maxHp = 1 injury
13. **healing-R005** → C033 — Verify HP marker crossings at 50%, 0%, -50%, -100%
14. **healing-R013** → C033 — Verify single attack can yield multiple injuries (massive + markers)
15. **healing-R022** → C033 — Verify re-healing past marker then re-crossing triggers new injury

### Tier 4: Healing Workflows (verify end-to-end chains)
16. **healing-R014** → C028, C030 — Verify fainted removed when healed above 0 HP
17. **healing-R026** → C003, C008 — Verify Pokemon Center: full HP (decree-017: effective max), clear statuses, heal injuries (3/day), restore moves
18. **healing-R032** → C002, C007 — Verify extended rest clears persistent statuses (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned)
19. **healing-R034** → C007, C053 — Verify daily move refresh rolling window (moves used today not refreshed)
20. **healing-R023** → C004, C009, C014 — Verify 24h timer check for natural injury healing

### Tier 5: Breather System (verify end-to-end)
21. **healing-R018** → C029 — Verify stage reset (with Heavy Armor speed CS per C062), temp HP removal, volatile + Slow + Stuck curing (Cursed excluded)
22. **healing-R019** → C029 — Verify standard+shift actions consumed, Tripped+Vulnerable applied

### Tier 6: Partial Items — Present Portion (verify)
23. **healing-R039** → C028 — Verify generic HP healing works correctly (amount applied, capped at effective max)
24. **healing-R042** → C054, C055, C056 — Verify AP calculation utilities are correct (even though no trigger exists)
25. **healing-R033** → C002 — Verify drained AP restoration is correct (separate from bound AP question)
26. **healing-R012/R035** → C033 — Verify damage calculation is at least correct for standard damage (even without set/lose distinction)

### Tier 7: Implemented-Unreachable (verify logic correct, flag accessibility)
27. **healing-R018** → C029 — Logic correct? Flag: player view inaccessible
28. **healing-R019** → C029 — Logic correct? Flag: player view inaccessible
29. **healing-R024** → C004 — Logic correct (2 AP cost, injury decrement)? Flag: player view inaccessible

### Tier 8: Data Model (verify schema correctness)
30. **healing-R002** → C001, C006 — Verify rest endpoints track restMinutesToday correctly
31. **healing-R006** → C048, C049 — Verify statusConditions JSON includes Fainted tracking
32. **healing-R010** → C048, C049 — Verify injuries field properly maintained across all healing paths
