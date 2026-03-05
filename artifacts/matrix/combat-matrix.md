---
domain: combat
type: coverage-matrix
total_rules: 146
total_capabilities: 102
analyzed_at: 2026-03-05T00:00:00Z
analyzed_by: coverage-analyzer
session: 120
previous_session: 59
---

# Feature Completeness Matrix: Combat (Session 120 Refresh)

> Re-analyzed against freshly re-mapped capabilities (session 120). Major changes since last matrix (session 59): equipment system (DR, evasion, Focus bonuses, Heavy Armor speed), Focus(Speed) stat bonuses, Helmet conditional DR, Sprint action, Snow Boots, fainted recall exemption, Permafrost weather, condition source-tracking, mounted combat rules (R136-R146).

## Coverage Score

| Metric | Count |
|--------|-------|
| Total Rules | 146 |
| Out of Scope | 11 |
| Effective Rules | 135 |
| Implemented | 88 |
| Implemented-Unreachable | 4 |
| Partial | 22 |
| Missing | 17 |
| Subsystem-Missing | 4 |

**Coverage Score**: `(88 + 0.5*22 + 0.5*4) / 135 * 100` = `(88 + 11 + 2) / 135 * 100` = **74.8%**

*Previous score (session 59): 71.9% -- delta: +2.9pp*

### Breakdown by Scope

| Scope | Total | Impl | Partial | Impl-Unreach | Missing | Sub-Missing | OoS |
|-------|-------|------|---------|--------------|---------|-------------|-----|
| core | 86 | 60 | 14 | 1 | 7 | 4 | 0 |
| situational | 35 | 17 | 6 | 3 | 7 | 2 | 0 |
| edge-case | 15 | 7 | 1 | 0 | 3 | 0 | 4 |
| cross-domain-ref | 10 | 4 | 1 | 0 | 0 | 0 | 5 |

### Breakdown by Category

| Category | Total | Impl | Partial | Impl-Unreach | Missing | Sub-Missing | OoS |
|----------|-------|------|---------|--------------|---------|-------------|-----|
| formula (17) | 17 | 14 | 1 | 0 | 1 | 0 | 1 |
| condition (21) | 21 | 14 | 3 | 0 | 2 | 1 | 1 |
| workflow (24) | 24 | 13 | 5 | 2 | 2 | 1 | 1 |
| constraint (23) | 23 | 16 | 3 | 1 | 1 | 0 | 2 |
| enumeration (12) | 12 | 10 | 1 | 0 | 1 | 0 | 0 |
| modifier (29) | 29 | 14 | 7 | 1 | 5 | 1 | 1 |
| interaction (9) | 9 | 5 | 2 | 0 | 1 | 1 | 0 |
| other (11) | 11 | 2 | 0 | 0 | 2 | 0 | 7 |

---

## Full Matrix

### Foundation: Stats, HP, Evasions (R001-R010)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R001 | Basic Combat Stats | enumeration | core | system | **Implemented** | gm, group, player | C001, C055-C057, C090 | 6 basic + 4 derived stats tracked on all entities |
| combat-R002 | Pokemon HP Formula | formula | core | system | **Implemented** | gm, group, player | C090, C056 | `useCombat.calculateHp()` = `level + (hp*3) + 10` |
| combat-R003 | Trainer HP Formula | formula | core | system | **Implemented** | gm, group, player | C090, C057 | `useCombat.calculateTrainerHp()` = `level*2 + (hp*3) + 10` |
| combat-R004 | Accuracy Stat Baseline | formula | core | system | **Implemented** | gm | C062, C091 | Accuracy base 0, modified by CS. Tracked in stage modifiers |
| combat-R005 | Physical Evasion Formula | formula | core | system | **Implemented** | gm, player | C061, C090, C055 | `calculateEvasion()`: `floor(stat/5)` cap 6 |
| combat-R006 | Special Evasion Formula | formula | core | system | **Implemented** | gm, player | C061, C090, C055 | Same formula as R005, uses SpDef |
| combat-R007 | Speed Evasion Formula | formula | core | system | **Implemented** | gm, player | C061, C090, C055 | Same formula, uses Speed. Focus(Speed) +5 now integrated |
| combat-R008 | Combat Stage Range and Multipliers | formula | core | system | **Implemented** | gm, player | C063, C085, C054 | Stage multiplier table + clamp -6/+6 |
| combat-R009 | Combat Stage Multiplier Table | enumeration | core | system | **Implemented** | gm, player | C085 | STAGE_MULTIPLIERS constant matches PTU table exactly |
| combat-R010 | Combat Stages Affect Evasion | modifier | core | system | **Implemented** | gm, player | C061, C055 | `calculateEvasion()` applies stage modifier before floor(stat/5) |

### Accuracy and Hit Detection (R011-R016)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R011 | Accuracy Roll Mechanics | formula | core | gm | **Implemented** | gm | C091, C062 | d20 roll in useMoveCalculation |
| combat-R012 | Accuracy Check Calculation | formula | core | system | **Implemented** | gm | C062, C091, C028 | `calculateAccuracyThreshold()`: moveAC + min(9, evasion) - accuracyStage |
| combat-R013 | Evasion Application Rules | constraint | core | system | **Partial** | gm | C061, C091 | **Present**: Best evasion auto-selected, phys/spec/speed all computed. **Missing**: No enforcement that physical evasion only applies to Defense-targeting moves; auto-select picks highest regardless of move class |
| combat-R014 | Natural 1 Always Misses | condition | core | system | **Implemented** | gm | C091 | useMoveCalculation checks nat 1 |
| combat-R015 | Natural 20 Always Hits | condition | core | system | **Implemented** | gm | C091 | useMoveCalculation checks nat 20 |
| combat-R016 | Accuracy Modifiers vs Dice Results | constraint | situational | gm | **Implemented** | gm | C091 | Crit/effect checks use raw d20, accuracy modifiers separate |

### Damage System (R017-R025)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R017 | Damage Base Table -- Rolled Damage | enumeration | core | system | **Implemented** | gm | C084 | DAMAGE_BASE_CHART constant, DB 1-28 |
| combat-R018 | Damage Base Table -- Set Damage | enumeration | core | system | **Implemented** | gm | C084, C060 | Set damage (min/avg/max) in chart, used by calculateDamage |
| combat-R019 | Damage Formula -- Full Process | workflow | core | system | **Implemented** | gm | C060, C028, C050 | 9-step process in calculateDamage utility. Equipment DR + Focus bonuses integrated |
| combat-R020 | Physical vs Special Damage | condition | core | system | **Implemented** | gm | C060 | Attack/Defense vs SpAtk/SpDef branch in damage formula |
| combat-R021 | STAB -- Same Type Attack Bonus | modifier | core | system | **Implemented** | gm | C060, C091 | DB + 2 for matching type |
| combat-R022 | Critical Hit Trigger | condition | core | system | **Implemented** | gm | C091, C060 | Raw d20 = 20 check |
| combat-R023 | Critical Hit Damage Calculation | formula | core | system | **Implemented** | gm | C060 | Dice doubled, stats not doubled, +5 flat in set damage mode |
| combat-R024 | Increased Critical Hit Range | modifier | situational | gm | **Partial** | gm | C091 | **Present**: Critical range parameter exists in calculation. **Missing**: No UI for specifying custom crit range per move; GM must manually track |
| combat-R025 | Minimum Damage | constraint | core | system | **Implemented** | gm | C060 | min 1 enforced (0 if immune) |

### Type Effectiveness (R026-R030)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R026 | Type Effectiveness -- Single Type | modifier | core | system | **Implemented** | gm | C060, C091 | Multiplier chain: x1.5, x2, x3, x0.5, x0.25, x0.125 |
| combat-R027 | Type Effectiveness -- Dual Type | interaction | core | system | **Implemented** | gm | C060 | Dual-type multiplication in damageCalculation |
| combat-R028 | Type Effectiveness -- Status Moves Excluded | constraint | core | system | **Implemented** | gm | C060 | Status moves skip type effectiveness |
| combat-R029 | Type Effectiveness -- Immunity vs Non-Standard Damage | interaction | edge-case | system | **Missing** | -- | -- | Moves like Sonic Boom/Counter: immunity blocks but resistance does not reduce. No special handling |
| combat-R030 | Trainers Have No Type | constraint | situational | system | **Implemented** | gm | C060, C057 | Human entities have no type; always neutral damage |

### Hit Points, Ticks, Injuries (R031-R032, R072-R076)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R031 | Hit Point Loss vs Dealing Damage | interaction | core | gm | **Partial** | gm | C020, C051 | **Present**: Damage endpoint applies defensive stats. **Missing**: No separate "HP loss" pathway that bypasses defense/injury checks; GM must manually use heal with negative value or adjust |
| combat-R032 | Tick of Hit Points | formula | core | system | **Implemented** | gm | C090, C050 | Tick = 1/10 maxHP, used in poison/burn calculations |
| combat-R072 | Massive Damage Injury | condition | core | system | **Implemented** | gm | C050, C058 | 50%+ realMaxHP = 1 injury. Uses real max (not injury-reduced) |
| combat-R073 | Hit Point Marker Injuries | condition | core | system | **Implemented** | gm | C050, C058 | countMarkersCrossed at 50% intervals into negatives |
| combat-R074 | Injury Effect on Max HP | formula | core | system | **Implemented** | gm | C050, C052, C090 | Effective max = realMax * (1 - injuries/10) |
| combat-R075 | Injury Max HP -- Uses Real Maximum | constraint | core | system | **Implemented** | gm | C050, C058 | Markers, massive damage, tick all use realMaxHP |
| combat-R076 | Heavily Injured -- 5+ Injuries | condition | core | system | **Partial** | gm | C090 | **Present**: `useCombat.isHeavilyInjured()` returns true at 5+. **Missing**: No automated standard-action HP loss or damage-tick for heavily injured combatants |

### Type Immunities to Status (R033)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R033 | Type Immunities to Status Conditions | enumeration | core | system | **Partial** | gm | C082, C053 | **Present**: Status condition list exists. **Missing**: No automated enforcement of type-based immunities (e.g., Fire immune to Burn). GM must manually avoid applying |

### Combat Types and Initiative (R034-R040)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R034 | Combat Types -- League vs Full Contact | enumeration | core | gm | **Implemented** | gm | C001, C004, C010 | battleType field: trainer (league) / full_contact |
| combat-R035 | Round Structure -- Two Turns Per Player | workflow | core | gm | **Implemented** | gm, group, player | C015, C017, C004, C115 | Trainer + Pokemon turns tracked; League phases separate them |
| combat-R036 | Initiative -- Speed Based | formula | core | system | **Implemented** | gm | C055, C015 | initiative = speed + bonus (+ Focus(Speed) +5, - Heavy Armor CS) |
| combat-R037 | Initiative -- League Battle Order | workflow | core | gm | **Implemented** | gm | C004, C015, C017 | Trainer declaration (low-to-high), Pokemon action (high-to-low), phase transitions |
| combat-R038 | Initiative -- Full Contact Order | workflow | core | gm | **Implemented** | gm | C015 | Simple high-to-low speed sort |
| combat-R039 | Initiative -- Tie Breaking | condition | core | system | **Implemented** | gm | C015 | Roll-off for ties in start endpoint |
| combat-R040 | Initiative -- Holding Action | constraint | situational | both | **Missing** | -- | -- | No hold-action mechanic. GM must manually reorder turn list |

### Duration, Action Economy (R041-R048)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R041 | One Full Round Duration | condition | situational | system | **Partial** | gm | C017 | **Present**: Round tracking exists. **Missing**: No auto-expire for "one full round" effects; GM manually removes |
| combat-R042 | Action Types -- Standard Action | enumeration | core | both | **Implemented** | gm, player | C022, C080, C117 | Standard action tracked via turn state |
| combat-R043 | Action Economy Per Turn | workflow | core | both | **Implemented** | gm, player | C017, C092, C117 | Standard + Shift + Swift tracked; actions consumed by moves/maneuvers/sprint |
| combat-R044 | Standard-to-Shift/Swift Conversion | constraint | situational | both | **Partial** | gm | C117, C092 | **Present**: Actions tracked, breather uses both. **Missing**: No explicit standard-to-shift or standard-to-swift conversion UI; GM adjusts manually |
| combat-R045 | Full Action Definition | constraint | core | system | **Implemented** | gm | C025, C117 | Breather consumes standard + shift. Full action pattern used |
| combat-R046 | Priority Action Rules | workflow | situational | both | **Missing** | -- | -- | No priority move interrupt. GM must manually reorder initiative |
| combat-R047 | Priority Limited and Advanced Variants | constraint | situational | both | **Missing** | -- | -- | Depends on R046 |
| combat-R048 | Interrupt Actions | workflow | situational | both | **Missing** | -- | -- | No interrupt action system. GM handles out-of-turn actions manually |

### Pokemon Switching (R049-R053)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R049 | Pokemon Switching -- Full Switch | workflow | core | both | **Partial** | gm | C018, C019, C156 | **Present**: Add/remove combatant APIs exist; player can request switch via WS. **Missing**: No atomic "switch" action that recalls one and releases another in a single standard action flow |
| combat-R050 | Pokemon Switching -- League Restriction | constraint | situational | system | **Missing** | -- | -- | No enforcement of "cannot command switched-in Pokemon this round" in League mode |
| combat-R051 | Fainted Pokemon Switch -- Shift Action | constraint | core | both | **Implemented** | gm | C019 | Fainted recall exemption integrated; remove combatant works as shift action |
| combat-R052 | Recall and Release as Separate Actions | workflow | situational | both | **Partial** | gm | C018, C019 | **Present**: Add/remove are separate actions. **Missing**: No recall-as-shift-action tracking; no "release two as standard" option |
| combat-R053 | Released Pokemon Can Act Immediately | condition | situational | system | **Partial** | gm | C018, C015 | **Present**: Added combatant gets initiative slot. **Missing**: No "act immediately if initiative already passed" logic |

### Movement and Grid (R054-R062)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R054 | Combat Grid -- Size Footprints | enumeration | core | system | **Implemented** | gm, group, player | C039, C040 | Token sizes on VTT grid |
| combat-R055 | Movement -- Shift Action | formula | core | both | **Implemented** | gm, group, player | C039, C090, C092 | Movement speed from capabilities; shift action consumes movement |
| combat-R056 | Movement -- No Splitting | constraint | core | system | **Partial** | gm | C039 | **Present**: Movement is per-shift-action. **Missing**: No enforcement preventing move-then-act-then-move; VTT allows free repositioning |
| combat-R057 | Diagonal Movement Costs | formula | core | system | **Implemented** | gm | C039, C090 | 1-2-1-2 diagonal cost pattern |
| combat-R058 | Adjacency Definition | condition | core | system | **Implemented** | gm | C091 | Diagonal adjacency in target selection |
| combat-R059 | Stuck and Slowed Conditions on Movement | modifier | core | system | **Partial** | gm | C082, C090 | **Present**: Conditions tracked; `useCombat.movementModifier()` exists. **Missing**: No automated Stuck movement block or Slowed halving in VTT |
| combat-R060 | Speed Combat Stages Affect Movement | modifier | core | system | **Implemented** | gm | C090, C063 | `useCombat.movementModifier()` computes half speed CS, min 2 |
| combat-R061 | Terrain Types | enumeration | core | gm | **Implemented** | gm | C043 | normal, rough, blocking, water, tall_grass, hazard in terrain grid |
| combat-R062 | Rough Terrain Accuracy Penalty | modifier | situational | system | **Missing** | -- | -- | Terrain painted on grid but no auto accuracy penalty for rough terrain |

### Flanking (R063-R065)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R063 | Flanking -- Evasion Penalty | modifier | situational | system | **Missing** | -- | -- | No flanking detection or evasion penalty |
| combat-R064 | Flanking -- Requirements by Size | condition | situational | system | **Missing** | -- | -- | No flanking detection |
| combat-R065 | Flanking -- Large Combatant Multiple Squares | modifier | edge-case | system | **Missing** | -- | -- | No flanking detection |

### Evasion Caps and Clearing (R066-R069)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R066 | Evasion Max from Stats | constraint | core | system | **Implemented** | gm, player | C061 | cap 6 in calculateEvasion |
| combat-R067 | Evasion Max Total Cap | constraint | core | system | **Implemented** | gm | C062 | `min(9, evasion)` in calculateAccuracyThreshold |
| combat-R068 | Evasion Bonus Clearing | interaction | situational | system | **Partial** | gm | C025, C054 | **Present**: Breather clears CS (which clear evasion). **Missing**: No explicit evasion bonus field separate from CS; other clearing events not tracked |
| combat-R069 | Willing Target | condition | edge-case | player | **Missing** | -- | -- | No "willing target" bypass. GM must manually set evasion to 0 |

### Combat Stages Constraints (R070-R071)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R070 | Combat Stages -- Applicable Stats Only | constraint | core | system | **Implemented** | gm | C023, C054 | Stage modifier supports atk/def/spA/spD/spe/accuracy only. HP excluded |
| combat-R071 | Combat Stages -- Persistence | condition | core | system | **Implemented** | gm | C025, C016, C054 | Stages persist until breather/switch/encounter end |

### Fainted, Death (R077-R081)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R077 | Fainted Condition | condition | core | system | **Implemented** | gm, group, player | C051, C082 | Fainted at 0 HP; added by applyDamageToEntity |
| combat-R078 | Fainted Recovery | constraint | core | gm | **Implemented** | gm | C052 | applyHealingToEntity removes Fainted when healed above 0 |
| combat-R079 | Fainted Clears All Status | interaction | core | system | **Implemented** | gm | C051 | On faint: clears persistent + volatile (not Other) |
| combat-R080 | Death Conditions | condition | core | system | **Partial** | gm | C050 | **Present**: Injuries tracked, HP goes negative. **Missing**: No automated death detection at 10 injuries or -50/-200% HP |
| combat-R081 | Death -- League Exemption | constraint | situational | gm | **Partial** | gm | C001, C004 | **Present**: League battle type tracked. **Missing**: No automated death suppression based on battle type |

### Struggle and Coup de Grace (R082-R084)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R082 | Struggle Attack | enumeration | core | both | **Implemented** | gm, player | C080, C092 | Struggle in maneuver list + PlayerCombatActions; AC 4, DB 4, Normal Physical Melee |
| combat-R083 | Struggle Attack -- Expert Combat Upgrade | modifier | situational | system | **Missing** | -- | -- | No Expert Combat skill check to upgrade Struggle to AC 3 / DB 5 |
| combat-R084 | Coup de Grace | workflow | edge-case | both | **Missing** | -- | -- | No Coup de Grace action. GM uses normal move + manual crit |

### Take a Breather (R085-R087)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R085 | Take a Breather | workflow | core | both | **Implemented** | gm | C025, C117, C138 | Full Action: resets CS (Heavy Armor aware), removes temp HP, cures volatiles + Slow/Stuck, applies Tripped + Vulnerable |
| combat-R086 | Take a Breather -- Assisted | workflow | situational | gm | **Missing** | -- | -- | No assisted breather (Command Check DC 12) flow |
| combat-R087 | Take a Breather -- Curse Exception | interaction | edge-case | system | **Implemented** | gm | C025 | Breather explicitly excludes Cursed from cure list |

### Persistent Status Conditions (R088-R092)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R088 | Burned Status | modifier | core | system | **Partial** | gm, group, player | C082, C053, C024 | **Present**: Burned tracked, displayed. **Missing**: No automated -2 Def CS on apply, no auto tick HP loss on standard action |
| combat-R089 | Frozen Status | modifier | core | system | **Partial** | gm, group, player | C082, C053 | **Present**: Frozen tracked, displayed. **Missing**: No auto action-block, no DC 16 save, no fire/fighting/rock/steel auto-cure |
| combat-R090 | Paralysis Status | modifier | core | system | **Partial** | gm, group, player | C082, C053 | **Present**: Paralysis tracked, displayed. **Missing**: No automated -4 Speed CS on apply, no DC 5 save check |
| combat-R091 | Poisoned Status | modifier | core | system | **Partial** | gm, group, player | C082, C053 | **Present**: Poisoned tracked, displayed. **Missing**: No automated -2 SpDef CS, no auto tick HP loss, no badly poisoned escalation |
| combat-R092 | Persistent Status -- Cured on Faint | interaction | core | system | **Implemented** | gm | C051 | applyDamageToEntity clears persistent on faint |

### Volatile Status Conditions (R093-R102)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R093 | Sleep Status | modifier | core | system | **Partial** | gm, group, player | C082, C053 | **Present**: Sleep tracked. **Missing**: No auto action-block, no DC 16 save, no wake-on-damage |
| combat-R094 | Confused Status | modifier | core | system | **Partial** | gm, group, player | C082, C053 | **Present**: Confused tracked. **Missing**: No auto save check (1-8 self-hit, 9-15 normal, 16+ cure) |
| combat-R095 | Rage Status | modifier | situational | system | **Implemented** | gm | C082, C053 | Tracked. Effect is behavioral constraint; GM enforces |
| combat-R096 | Flinch Status | modifier | situational | system | **Implemented** | gm | C082, C053 | Tracked. GM enforces action block |
| combat-R097 | Infatuation Status | modifier | situational | system | **Implemented** | gm | C082, C053 | Tracked. GM enforces save check |
| combat-R098 | Volatile Status -- Cured on Recall/Encounter End | interaction | core | system | **Implemented** | gm | C051, C016 | Faint clears volatile; encounter end clears all |
| combat-R099 | Suppressed Status | modifier | situational | system | **Implemented** | gm | C082, C053 | Tracked. Frequency downgrade is behavioral |
| combat-R100 | Cursed Status | modifier | situational | system | **Implemented** | gm | C082, C053 | Tracked. Tick loss is manual |
| combat-R101 | Bad Sleep Status | modifier | edge-case | system | **Implemented** | gm | C082 | Tracked alongside Sleep |
| combat-R102 | Disabled Status | modifier | situational | system | **Implemented** | gm | C082, C053 | Tracked. Move restriction is behavioral |

### Temporary HP (R103-R104)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R103 | Temporary Hit Points | interaction | core | system | **Implemented** | gm | C021, C050, C051 | Temp HP absorbed first in damage; heal takes higher (no stack) |
| combat-R104 | Temporary HP -- Does Not Count for Percentage | constraint | situational | system | **Implemented** | gm | C050, C075 | Massive damage and markers use real HP, not temp |

### Other Conditions (R105-R109)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R105 | Blindness Condition | modifier | situational | system | **Implemented** | gm | C082, C053 | Tracked. -6 accuracy is behavioral (GM applies) |
| combat-R106 | Total Blindness Condition | modifier | edge-case | system | **Implemented** | gm | C082 | Tracked. -10 accuracy behavioral |
| combat-R107 | Tripped Condition | condition | core | system | **Implemented** | gm | C082, C025 | Tracked. Breather applies it. Shift-to-stand behavioral |
| combat-R108 | Vulnerable Condition | condition | core | system | **Implemented** | gm | C082, C025 | Tracked. No-evasion behavioral |
| combat-R109 | Trapped Condition | condition | situational | system | **Implemented** | gm | C082, C053 | Tracked. Recall block behavioral |

### Combat Maneuvers (R110-R122)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R110 | Attack of Opportunity | workflow | core | both | **Partial** | gm | C080 | **Present**: AoO listed in COMBAT_MANEUVERS. **Missing**: No automated trigger detection (adjacent foe shifts away, etc.); GM must declare |
| combat-R111 | Disengage Maneuver | workflow | core | both | **Implemented** | gm, player | C080, C125 | In maneuver grid; behavioral (1m shift no AoO) |
| combat-R112 | Push Maneuver | workflow | situational | both | **Implemented** | gm, player | C080, C125 | In maneuver grid; GM resolves opposed checks |
| combat-R113 | Sprint Maneuver | workflow | core | both | **Implemented** | gm | C026, C080, C117, C125 | Sprint API endpoint, +50% movement speed. Standard action consumed |
| combat-R114 | Trip Maneuver | workflow | situational | both | **Implemented** | gm, player | C080, C125 | In maneuver grid; GM resolves |
| combat-R115 | Grapple Maneuver | workflow | situational | both | **Implemented** | gm, player | C080, C125 | In maneuver grid; GM resolves |
| combat-R116 | Intercept Melee Maneuver | workflow | situational | both | **Implemented-Unreachable** | gm | C080, C125 | Listed in maneuver defs. **Intended actor**: both (player Pokemon can intercept). **Actual access**: gm only -- no player maneuver execution path for intercept |
| combat-R117 | Intercept Ranged Maneuver | workflow | situational | both | **Implemented-Unreachable** | gm | C080, C125 | Same as R116 -- player cannot trigger intercept from player view |
| combat-R118 | Intercept -- Loyalty Requirement | constraint | situational | system | **Missing** | -- | -- | No loyalty check in intercept flow |
| combat-R119 | Intercept -- Additional Rules | constraint | edge-case | system | **Missing** | -- | -- | No speed comparison, no cannot-miss exclusion, no condition-block for intercept |
| combat-R120 | Disarm Maneuver | workflow | situational | both | **Implemented** | gm, player | C080, C125 | In maneuver grid; GM resolves |
| combat-R121 | Dirty Trick Maneuver | enumeration | situational | both | **Implemented** | gm, player | C080, C125 | Hinder/Blind/Low Blow in maneuver grid |
| combat-R122 | Manipulate Maneuver -- Trainers Only | enumeration | situational | gm | **Implemented** | gm | C080, C125 | Bon Mot/Flirt/Terrorize listed. Trainer-only enforcement behavioral |

### Environmental Hazards (R123-R125)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R123 | Suffocating | condition | edge-case | system | **Out of Scope** | -- | -- | Rare environmental hazard; GM tracks manually |
| combat-R124 | Falling Damage Formula | formula | edge-case | system | **Out of Scope** | -- | -- | Rare environmental; GM calculates manually |
| combat-R125 | Falling Injuries | modifier | edge-case | system | **Out of Scope** | -- | -- | Depends on R124 |

### Cross-Domain References (R126-R135)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R126 | Resting -- HP Recovery | workflow | cross-domain-ref | both | **Out of Scope** | -- | -- | Healing domain; rest healing utility exists separately |
| combat-R127 | Extended Rest -- Status and AP Recovery | workflow | cross-domain-ref | both | **Out of Scope** | -- | -- | Healing domain |
| combat-R128 | Natural Injury Healing | condition | cross-domain-ref | both | **Implemented** | gm | C052 | Injury healing via heal endpoint |
| combat-R129 | Pokemon Center Healing | workflow | cross-domain-ref | both | **Implemented** | gm | C052 | Full heal capability exists |
| combat-R130 | Action Points | formula | cross-domain-ref | both | **Implemented** | gm, player | C090 | `useCombat.maxAp()` = 5 + floor(level/5) |
| combat-R131 | AP Accuracy Bonus | modifier | cross-domain-ref | player | **Implemented-Unreachable** | gm | C090 | **Intended actor**: player (spends own AP). **Actual access**: Player view has no AP spending UI for accuracy. Only GM can apply |
| combat-R132 | Rounding Rule | constraint | cross-domain-ref | system | **Implemented** | gm, player | C060, C063 | Math.floor used throughout |
| combat-R133 | Percentages Additive Rule | constraint | cross-domain-ref | system | **Implemented** | gm | C060 | Type effectiveness multiplied additively |
| combat-R134 | Armor Damage Reduction | modifier | cross-domain-ref | system | **Implemented** | gm | C065, C060, C028, C081 | Light +5 Physical DR, Special +5 Special DR, Heavy +5 all DR. Equipment system fully integrated |
| combat-R135 | Shield Evasion Bonus | modifier | cross-domain-ref | system | **Implemented** | gm | C065, C061, C081 | Shield +1 evasion via computeEquipmentBonuses |

### Mounted Combat (R136-R146)

| Rule ID | Name | Category | Scope | Actor | Classification | Accessible From | Matching Caps | Notes |
|---------|------|----------|-------|-------|---------------|----------------|---------------|-------|
| combat-R136 | Mounting a Pokemon | action | core | player | **Subsystem-Missing** | -- | -- | No mounted combat subsystem |
| combat-R137 | Mounted Movement | movement | core | player | **Subsystem-Missing** | -- | -- | No mounted combat subsystem |
| combat-R138 | Dismount Check | trigger | core | system | **Subsystem-Missing** | -- | -- | No mounted combat subsystem |
| combat-R139 | Mounted Intercept | modifier | core | both | **Subsystem-Missing** | -- | -- | No mounted combat subsystem |
| combat-R140 | Mountable Capability | capability | core | system | **Out of Scope** | -- | -- | Pokemon capability data; not combat-system responsibility |
| combat-R141 | Mounted Prowess Edge | modifier | core | player | **Out of Scope** | -- | -- | Character feature; not combat-system responsibility |
| combat-R142 | Living Weapon Capability | capability | core | both | **Out of Scope** | -- | -- | Honedge-family specific; extremely niche |
| combat-R143 | Living Weapon Shared Movement | movement | core | both | **Out of Scope** | -- | -- | Honedge-family specific |
| combat-R144 | Living Weapon Engage/Disengage | action | core | both | **Out of Scope** | -- | -- | Honedge-family specific |
| combat-R145 | Living Weapon Granted Moves | enumeration | core | both | **Out of Scope** | -- | -- | Honedge-family specific |
| combat-R146 | Fainted Living Weapon Penalty | modifier | core | both | **Out of Scope** | -- | -- | Honedge-family specific |

---

## Actor Accessibility Summary

| Rule Actor | Total Rules | Reachable | Unreachable | Percentage Reachable |
|-----------|-------------|-----------|-------------|---------------------|
| system | 73 | 69 | 0 | 94.5% (4 missing, not unreachable) |
| gm | 12 | 11 | 0 | 91.7% |
| both | 34 | 26 | 2 | 76.5% |
| player | 5 | 1 | 2 | 20.0% |

### Player-Reachable vs GM-Only for "both" Actor Rules

Of the 34 rules with `actor: both`:
- **Player can reach**: 12 (via usePlayerCombat: moves, struggle, pass, maneuver grid, shift)
- **GM-only despite both**: 16 (damage calc, breather, status, stages, switching details)
- **Unreachable for player**: 2 (Intercept Melee R116, Intercept Ranged R117)
- **Missing entirely**: 4 (Priority R046-R047, Interrupt R048, Hold Action R040)

### Player View Combat Capabilities

Players CAN directly:
- Execute moves (via usePlayerCombat + WS)
- Use Struggle attack
- Pass turn
- Request switch/item/maneuver (via WS to GM)
- View own Pokemon HP, status, moves with frequency

Players CANNOT:
- Apply damage or heal
- Modify combat stages
- Add/remove status conditions
- Take a Breather (must request via GM)
- Sprint (must request via GM)
- Preview damage calculations
- Spend AP for accuracy
- View equipment bonuses

---

## Subsystem Gaps

### SM-1: Mounted Combat Subsystem (4 rules: R136-R139)

- **Missing subsystem**: No mounting/dismounting, mounted movement, or mounted intercept mechanics
- **Affected rules**: combat-R136, combat-R137, combat-R138, combat-R139
- **Priority**: P2 -- Situational mechanic, used by some but not all campaigns
- **Suggested feature ticket**: "Mounted Combat: mount/dismount actions, shared movement, dismount checks"

### SM-2: Priority/Interrupt Action Subsystem (3 rules: R046-R048)

- **Missing subsystem**: No out-of-turn-order action mechanics (Priority, Priority Limited/Advanced, Interrupt)
- **Affected rules**: combat-R046, combat-R047, combat-R048
- **Priority**: P1 -- Priority moves are common in competitive PTU play
- **Suggested feature ticket**: "Priority and Interrupt Actions: out-of-order turn execution, priority declaration between turns"

### SM-3: Status Condition Auto-Effects (6 rules: R088-R091, R093-R094)

- **Missing subsystem**: Status conditions are tracked but their mechanical effects (CS penalties, HP loss, save checks, action blocks) are not automated
- **Affected rules**: combat-R088 (Burn), combat-R089 (Frozen), combat-R090 (Paralysis), combat-R091 (Poison), combat-R093 (Sleep), combat-R094 (Confused)
- **Priority**: P1 -- These statuses are used every session
- **Suggested feature ticket**: "Status Condition Automation: auto-apply CS on inflict, auto-tick HP on turn end, save check prompts, action blocking"
- **Note**: Individual rules classified as Partial (not Subsystem-Missing) because tracking IS present. The automation gap spans multiple rules as a coherent subsystem.

### SM-4: Flanking Detection (3 rules: R063-R065)

- **Missing subsystem**: No positional analysis for flanking on the VTT grid
- **Affected rules**: combat-R063, combat-R064, combat-R065
- **Priority**: P2 -- Requires spatial analysis of VTT; workaround is GM judgment
- **Suggested feature ticket**: "Flanking Detection: auto-detect flanking from grid positions, apply -2 evasion"

### SM-5: Player Equipment Visibility (from Capability Mapper)

- **Missing subsystem**: Players cannot view their trainer's equipment or combat bonuses from the player view
- **Priority**: P2 -- Players ask GM about their own equipment
- **Suggested feature ticket**: "Player Equipment View: read-only equipment display on player character sheet"

### SM-6: Held Item / Ability Combat Automation (from Capability Mapper)

- **Missing subsystem**: Pokemon held items and abilities have no automated combat effects
- **Priority**: P2 -- Extremely broad scope; all effects manually applied by GM
- **Suggested feature ticket**: "Held Item/Ability Framework: extensible effect hooks for combat items and abilities"

---

## Gap Priorities

### P0 -- Blocks Basic Session Usage

None. All core combat mechanics needed for basic play are functional.

### P1 -- Important Mechanic, Commonly Used

| Rule ID | Name | Classification | Gap Description |
|---------|------|---------------|-----------------|
| combat-R013 | Evasion Application Rules | Partial | Auto-select picks highest evasion regardless of move class (phys/spec/speed) |
| combat-R033 | Type Immunities to Status | Partial | No automated type immunity enforcement (Fire immune to Burn, etc.) |
| combat-R046 | Priority Action Rules | Missing | No priority move interrupt system |
| combat-R048 | Interrupt Actions | Missing | No interrupt action system |
| combat-R050 | Pokemon Switching -- League Restriction | Missing | No "cannot command switched Pokemon" enforcement |
| combat-R076 | Heavily Injured -- 5+ Injuries | Partial | No auto HP loss on standard action for heavily injured |
| combat-R088 | Burned Status | Partial | No auto -2 Def CS or tick HP loss |
| combat-R089 | Frozen Status | Partial | No auto action block or save check |
| combat-R090 | Paralysis Status | Partial | No auto -4 Speed CS or save check |
| combat-R091 | Poisoned Status | Partial | No auto -2 SpDef CS or tick HP loss |
| combat-R093 | Sleep Status | Partial | No auto action block or save check |
| combat-R094 | Confused Status | Partial | No auto confusion save/self-hit |
| combat-R131 | AP Accuracy Bonus | Impl-Unreachable | Player cannot spend AP from player view |

### P2 -- Situational, Workaround Exists

| Rule ID | Name | Classification | Gap Description |
|---------|------|---------------|-----------------|
| combat-R024 | Increased Critical Hit Range | Partial | No UI for custom crit range |
| combat-R031 | Hit Point Loss vs Dealing Damage | Partial | No "lose HP" pathway bypassing defense |
| combat-R040 | Initiative -- Holding Action | Missing | No hold-action mechanic |
| combat-R041 | One Full Round Duration | Partial | No auto-expire for "one round" effects |
| combat-R044 | Standard-to-Shift/Swift Conversion | Partial | No explicit conversion UI |
| combat-R049 | Pokemon Switching -- Full Switch | Partial | No atomic switch action |
| combat-R052 | Recall/Release as Separate Actions | Partial | No recall-as-shift or release-two-as-standard |
| combat-R053 | Released Pokemon Can Act Immediately | Partial | No "act immediately" on late-round release |
| combat-R056 | Movement -- No Splitting | Partial | VTT allows unrestricted repositioning |
| combat-R059 | Stuck and Slowed on Movement | Partial | No VTT movement enforcement |
| combat-R062 | Rough Terrain Accuracy Penalty | Missing | Terrain exists but no auto accuracy modifier |
| combat-R063 | Flanking -- Evasion Penalty | Missing | No flanking detection |
| combat-R068 | Evasion Bonus Clearing | Partial | No explicit evasion bonus tracking |
| combat-R080 | Death Conditions | Partial | No auto death detection |
| combat-R081 | Death -- League Exemption | Partial | No auto death suppression |
| combat-R083 | Struggle -- Expert Combat Upgrade | Missing | No skill-rank check for struggle upgrade |
| combat-R086 | Take a Breather -- Assisted | Missing | No assisted breather flow |
| combat-R110 | Attack of Opportunity | Partial | No auto trigger detection |
| combat-R116 | Intercept Melee | Impl-Unreachable | Player cannot trigger intercept |
| combat-R117 | Intercept Ranged | Impl-Unreachable | Player cannot trigger intercept |
| combat-R136-R139 | Mounted Combat | Subsystem-Missing | No mount system |

### P3 -- Edge Case, Minimal Gameplay Impact

| Rule ID | Name | Classification | Gap Description |
|---------|------|---------------|-----------------|
| combat-R029 | Type Immunity vs Non-Standard Damage | Missing | Sonic Boom/Counter immunity special case |
| combat-R047 | Priority Limited/Advanced | Missing | Depends on R046 |
| combat-R064 | Flanking by Size | Missing | Depends on R063 |
| combat-R065 | Flanking Large Combatants | Missing | Depends on R063 |
| combat-R069 | Willing Target | Missing | No willing-target evasion bypass |
| combat-R084 | Coup de Grace | Missing | GM can use normal move + manual crit |
| combat-R118 | Intercept Loyalty Requirement | Missing | No loyalty check |
| combat-R119 | Intercept Additional Rules | Missing | No speed/condition checks |

---

## Auditor Queue

Prioritized list for the Implementation Auditor. Items are ordered: core scope first, formulas/conditions first, foundation before derived.

### Tier 1: Implemented -- Core Formulas and Data (verify correctness)

| # | Rule ID | Name | Caps to Audit | Focus |
|---|---------|------|---------------|-------|
| 1 | combat-R002 | Pokemon HP Formula | C090, C056 | Verify `level + (hp*3) + 10` |
| 2 | combat-R003 | Trainer HP Formula | C090, C057 | Verify `level*2 + (hp*3) + 10` |
| 3 | combat-R008 | Combat Stage Range and Multipliers | C063, C085 | Verify clamp -6/+6, multiplier table |
| 4 | combat-R009 | Combat Stage Multiplier Table | C085 | Verify all 13 values match PTU |
| 5 | combat-R005 | Physical Evasion Formula | C061 | Verify `floor(stat/5)` cap 6, Focus bonus |
| 6 | combat-R006 | Special Evasion Formula | C061 | Same as R005 for SpDef |
| 7 | combat-R007 | Speed Evasion Formula | C061 | Same for Speed + Focus(Speed) +5 |
| 8 | combat-R012 | Accuracy Check Calculation | C062 | Verify moveAC + min(9, evasion) - accStage |
| 9 | combat-R017 | Damage Base Table -- Rolled | C084 | Verify DB 1-28 values |
| 10 | combat-R018 | Damage Base Table -- Set | C084 | Verify min/avg/max for DB 1-28 |
| 11 | combat-R032 | Tick of Hit Points | C090 | Verify 1/10 realMaxHP |
| 12 | combat-R074 | Injury Effect on Max HP | C050, C090 | Verify effective max = real * (1 - injuries/10) |
| 13 | combat-R036 | Initiative -- Speed Based | C055, C015 | Verify speed + Focus + Heavy Armor CS |
| 14 | combat-R132 | Rounding Rule | C060, C063 | Verify Math.floor everywhere |
| 15 | combat-R130 | Action Points | C090 | Verify 5 + floor(level/5) |

### Tier 2: Implemented -- Core Damage Pipeline (verify correctness)

| # | Rule ID | Name | Caps to Audit | Focus |
|---|---------|------|---------------|-------|
| 16 | combat-R019 | Damage Formula -- Full Process | C060, C028, C050 | Verify 9-step order, Focus bonuses, equipment DR |
| 17 | combat-R020 | Physical vs Special Damage | C060 | Verify atk/def vs spAtk/spDef branch |
| 18 | combat-R021 | STAB | C060 | Verify DB + 2 |
| 19 | combat-R022 | Critical Hit Trigger | C091 | Verify raw d20 = 20 |
| 20 | combat-R023 | Critical Hit Damage Calculation | C060 | Verify dice doubled, stats not doubled |
| 21 | combat-R025 | Minimum Damage | C060 | Verify min 1 (0 if immune) |
| 22 | combat-R026 | Type Effectiveness -- Single | C060 | Verify multiplier chain |
| 23 | combat-R027 | Type Effectiveness -- Dual | C060 | Verify dual-type multiplication |
| 24 | combat-R028 | Type Effectiveness -- Status Excluded | C060 | Verify status moves skip effectiveness |
| 25 | combat-R134 | Armor Damage Reduction | C065, C060 | Verify Light/Special/Heavy DR values |
| 26 | combat-R135 | Shield Evasion Bonus | C065, C061 | Verify +1 evasion |
| 27 | combat-R133 | Percentages Additive Rule | C060 | Verify additive not multiplicative |

### Tier 3: Implemented -- Injury and Faint Pipeline (verify correctness)

| # | Rule ID | Name | Caps to Audit | Focus |
|---|---------|------|---------------|-------|
| 28 | combat-R072 | Massive Damage Injury | C050, C058 | Verify 50% realMaxHP threshold |
| 29 | combat-R073 | Hit Point Marker Injuries | C050, C058 | Verify markers at 50% intervals |
| 30 | combat-R075 | Injury Max HP -- Real Maximum | C050, C058 | Verify realMaxHP used for checks |
| 31 | combat-R077 | Fainted Condition | C051 | Verify auto-add at 0 HP |
| 32 | combat-R078 | Fainted Recovery | C052 | Verify Fainted removed on heal above 0 |
| 33 | combat-R079 | Fainted Clears Status | C051 | Verify persistent + volatile cleared |
| 34 | combat-R092 | Persistent Cured on Faint | C051 | Verify persistent cleared |
| 35 | combat-R098 | Volatile Cured on Recall/End | C016, C051 | Verify volatile cleared |
| 36 | combat-R103 | Temporary Hit Points | C050, C051, C021 | Verify temp HP absorb, no stack |
| 37 | combat-R104 | Temp HP -- Not for Percentage | C050 | Verify real HP used for %% checks |

### Tier 4: Implemented -- Initiative, Actions, Turn Flow (verify correctness)

| # | Rule ID | Name | Caps to Audit | Focus |
|---|---------|------|---------------|-------|
| 38 | combat-R034 | League vs Full Contact | C001, C004 | Verify battleType enum |
| 39 | combat-R035 | Round Structure | C015, C017 | Verify trainer + pokemon turns |
| 40 | combat-R037 | League Battle Order | C004, C015, C017 | Verify declaration (low-to-high) + action (high-to-low) |
| 41 | combat-R038 | Full Contact Order | C015 | Verify high-to-low sort |
| 42 | combat-R039 | Tie Breaking | C015 | Verify roll-off |
| 43 | combat-R043 | Action Economy Per Turn | C017, C117 | Verify standard + shift + swift |
| 44 | combat-R045 | Full Action Definition | C025 | Verify standard + shift consumed |
| 45 | combat-R055 | Movement -- Shift Action | C039, C090 | Verify movement speed |
| 46 | combat-R057 | Diagonal Movement | C090 | Verify 1-2-1-2 pattern |
| 47 | combat-R060 | Speed CS Affects Movement | C090 | Verify half CS bonus, min 2 |
| 48 | combat-R085 | Take a Breather | C025, C117 | Verify CS reset (Heavy Armor), temp HP removal, volatile cure, Tripped+Vulnerable |
| 49 | combat-R087 | Breather Curse Exception | C025 | Verify Cursed excluded from cure |
| 50 | combat-R113 | Sprint Maneuver | C026 | Verify +50% movement, standard consumed |

### Tier 5: Implemented -- Conditions and Maneuvers (verify correctness)

| # | Rule ID | Name | Caps to Audit | Focus |
|---|---------|------|---------------|-------|
| 51 | combat-R001 | Basic Combat Stats | C001, C055-C057 | Verify all 6+4 stats present |
| 52 | combat-R004 | Accuracy Stat Baseline | C062 | Verify base 0 |
| 53 | combat-R010 | Combat Stages Affect Evasion | C061 | Verify stage modifier on evasion stat |
| 54 | combat-R014 | Natural 1 Always Misses | C091 | Verify nat 1 check |
| 55 | combat-R015 | Natural 20 Always Hits | C091 | Verify nat 20 check |
| 56 | combat-R016 | Accuracy Modifiers vs Dice | C091 | Verify raw d20 for effects |
| 57 | combat-R030 | Trainers Have No Type | C060, C057 | Verify neutral damage to humans |
| 58 | combat-R042 | Action Types | C022, C080 | Verify standard action tracking |
| 59 | combat-R051 | Fainted Switch -- Shift Action | C019 | Verify fainted recall exemption |
| 60 | combat-R054 | Size Footprints | C039 | Verify token sizes |
| 61 | combat-R058 | Adjacency Definition | C091 | Verify diagonal adjacency |
| 62 | combat-R061 | Terrain Types | C043 | Verify all terrain types |
| 63 | combat-R066 | Evasion Max from Stats | C061 | Verify cap 6 |
| 64 | combat-R067 | Evasion Max Total Cap | C062 | Verify min(9, evasion) |
| 65 | combat-R070 | Combat Stages -- Applicable Stats | C023, C054 | Verify HP excluded |
| 66 | combat-R071 | Combat Stages -- Persistence | C025, C016 | Verify persist until clear |
| 67 | combat-R082 | Struggle Attack | C080, C092 | Verify AC 4, DB 4, Normal Physical |
| 68 | combat-R095-R102 | Volatile Status Conditions | C082, C053 | Verify tracking for Rage, Flinch, Infatuation, Suppressed, Cursed, Bad Sleep, Disabled |
| 69 | combat-R105-R109 | Other Conditions | C082, C053 | Verify Blindness, Total Blindness, Tripped, Vulnerable, Trapped |
| 70 | combat-R107 | Tripped Condition | C082, C025 | Verify breather applies Tripped |
| 71 | combat-R108 | Vulnerable Condition | C082, C025 | Verify breather applies Vulnerable |
| 72 | combat-R111-R122 | Combat Maneuvers (non-intercept) | C080, C125 | Verify all 9 maneuvers present and described |
| 73 | combat-R128 | Natural Injury Healing | C052 | Verify injury heal via endpoint |
| 74 | combat-R129 | Pokemon Center Healing | C052 | Verify full heal capability |

### Tier 6: Implemented-Unreachable (verify logic, flag accessibility)

| # | Rule ID | Name | Caps to Audit | Focus |
|---|---------|------|---------------|-------|
| 75 | combat-R116 | Intercept Melee | C080, C125 | Verify maneuver def correct; flag: player view cannot trigger |
| 76 | combat-R117 | Intercept Ranged | C080, C125 | Same as R116 |
| 77 | combat-R131 | AP Accuracy Bonus | C090 | Verify AP math; flag: no player AP UI |
| 78 | combat-R113 | Sprint (player access) | C026, C092 | Sprint API gm-only; player must request via WS |

### Tier 7: Partial Items -- Present Portions (verify correctness)

| # | Rule ID | Name | Caps to Audit | Present Portion |
|---|---------|------|---------------|-----------------|
| 79 | combat-R013 | Evasion Application Rules | C061, C091 | Verify 3 evasion types computed correctly; note auto-select ignores move class |
| 80 | combat-R024 | Increased Crit Range | C091 | Verify crit range parameter exists |
| 81 | combat-R033 | Type Immunities to Status | C082 | Verify condition list complete |
| 82 | combat-R041 | One Full Round Duration | C017 | Verify round tracking |
| 83 | combat-R044 | Standard-to-Shift/Swift | C117 | Verify action tracking |
| 84 | combat-R049 | Pokemon Switching | C018, C019 | Verify add/remove combatant |
| 85 | combat-R052 | Recall/Release | C018, C019 | Verify separate add/remove |
| 86 | combat-R053 | Released Pokemon Act | C018, C015 | Verify initiative assignment |
| 87 | combat-R056 | Movement No Splitting | C039 | Verify per-shift-action movement |
| 88 | combat-R059 | Stuck/Slowed | C082, C090 | Verify conditions tracked, movementModifier exists |
| 89 | combat-R068 | Evasion Bonus Clearing | C025 | Verify breather CS clearing |
| 90 | combat-R076 | Heavily Injured | C090 | Verify isHeavilyInjured threshold |
| 91 | combat-R080 | Death Conditions | C050 | Verify injury count + negative HP tracked |
| 92 | combat-R081 | Death League Exemption | C001, C004 | Verify battleType tracked |
| 93 | combat-R088-R091 | Persistent Status Tracking | C082, C053 | Verify all 5 persistent tracked and displayed |
| 94 | combat-R093-R094 | Sleep/Confused Tracking | C082, C053 | Verify tracked and displayed |
| 95 | combat-R110 | Attack of Opportunity | C080 | Verify AoO in maneuver list |
| 96 | combat-R031 | HP Loss vs Damage | C020, C051 | Verify damage pipeline includes defense subtraction |

---

## Changes from Previous Matrix (Session 59)

### Newly Implemented (was Partial or Missing)

| Rule ID | Previous | Now | Reason |
|---------|----------|-----|--------|
| combat-R007 | Implemented | Implemented (enhanced) | Focus(Speed) +5 now integrated into evasion and initiative |
| combat-R085 | Implemented | Implemented (enhanced) | Heavy Armor speed CS awareness in breather CS reset |
| combat-R087 | Missing | Implemented | Breather Curse exception now coded |
| combat-R113 | Missing | Implemented | Sprint endpoint added (C026) |
| combat-R134 | Partial | Implemented | Full equipment DR system (Light/Special/Heavy Armor) |
| combat-R135 | Missing | Implemented | Shield evasion bonus via equipment system |
| combat-R036 | Implemented | Implemented (enhanced) | Focus(Speed) and Heavy Armor speed CS in initiative |

### Newly Classified (R136-R146)

11 new rules added for Mounted Combat (R136-R141) and Living Weapon (R142-R146). 4 classified as Subsystem-Missing (Mounted Combat core), 7 as Out of Scope (Mountable capability, Mounted Prowess edge, and all 5 Living Weapon rules as Honedge-family-specific niche).

### Score Change

- **Previous**: 71.9% (82 impl + 12.5 partial + 2.5 unreachable) / 135
- **Current**: 74.8% (88 impl + 11 partial + 2 unreachable) / 135
- **Delta**: +2.9pp
- **Net Effective Rules**: 135 (unchanged -- 11 new rules all Out of Scope)
- **Key drivers**: Equipment system (+3 impl), Sprint (+1 impl), Focus(Speed) (+quality), Helmet DR (+quality)
