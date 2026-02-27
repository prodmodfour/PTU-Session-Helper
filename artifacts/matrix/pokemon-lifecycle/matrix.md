---
domain: pokemon-lifecycle
type: matrix
total_rules: 68
analyzed_at: 2026-02-28T00:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: artifacts/matrix/pokemon-lifecycle/rules/_index.md
capabilities_catalog: artifacts/matrix/pokemon-lifecycle/capabilities/_index.md
---

# Feature Completeness Matrix: Pokemon Lifecycle

## Coverage Score

```
Implemented:              35
Implemented-Unreachable:   0
Partial:                   8
Missing:                  11
Subsystem-Missing:         0 (individual Missing counts cover subsystem gaps below)
Out of Scope:             14
─────────────────────────────
Total:                    68
Out of Scope:             14
Effective Total:          54

Coverage = (35 + 0.5*8 + 0.5*0) / 54 * 100 = 39.0 / 54 * 100 = 72.2%
```

| Classification | Count | % of Effective |
|---------------|-------|----------------|
| Implemented | 35 | 64.8% |
| Implemented-Unreachable | 0 | 0.0% |
| Partial | 8 | 14.8% |
| Missing | 11 | 20.4% |
| Out of Scope | 14 | — |
| **Effective Total** | **54** | **100%** |

**Coverage: 72.2%**

---

## Relevant Decrees

No decrees directly target the pokemon-lifecycle domain. Cross-domain decree-015 (real max HP) applies to HP formula calculations.

---

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Mapped Capabilities | Accessible From | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|--------------------|-----------------|--------------| ------|
| R001 | Pokemon Party Limit | constraint | core | gm | **Missing** | — | — | P2 | No enforcement of 6-Pokemon party limit per trainer. GM can link unlimited Pokemon via C039. |
| R002 | Pokemon Maximum Level | constraint | core | system | **Implemented** | C006, C014, C021 | gm | — | EXPERIENCE_CHART caps at level 100. calculateLevelUps respects cap. |
| R003 | Base Stats Definition | enumeration | core | system | **Implemented** | C002 | api-only | — | 6 base stats from SpeciesData seeded from PTU pokedex. |
| R004 | Pokemon Types | enumeration | core | system | **Implemented** | C001 | gm, player | — | Types stored on Pokemon model, sourced from SpeciesData. |
| R005 | Nature System | enumeration | core | system | **Implemented** | C010, C013 | gm, player | — | 36 natures in NATURE_TABLE constant (C013). |
| R006 | Nature Stat Adjustments | formula | core | system | **Implemented** | C017 | api-only | — | applyNatureToBaseStats: HP +1/-1, others +2/-2, floor 1. |
| R007 | Neutral Natures | condition | core | system | **Implemented** | C013, C017 | api-only | — | 6 neutral natures (raise === lower) return unmodified stats. |
| R008 | Nature Flavor Preferences | enumeration | situational | system | **Out of Scope** | — | — | — | Flavor preferences are roleplay-only, not mechanical. |
| R009 | Stat Points Allocation Total | formula | core | system | **Implemented** | C029, C033 | api-only | — | Level + 10 stat points in generatePokemonData/distributeStatPoints. |
| R010 | Base Relations Rule | constraint | core | system | **Implemented** | C033 | api-only | — | distributeStatPoints enforces Base Relations ordering during generation. |
| R011 | Pokemon HP Formula | formula | core | system | **Implemented** | C009, C029 | gm, player, group | — | Level + (HP_stat * 3) + 10 in generator and HP calc. |
| R012 | Evasion Calculation | formula | cross-domain-ref | system | **Implemented** | combat-domain | gm, player | — | floor(stat/5), cap 6. Implemented in combat domain. Uses calculated stats. |
| R013 | Abilities — Initial Assignment | workflow | core | gm | **Implemented** | C012, C029 | gm | — | Random Basic Ability selected during generation from species data. |
| R014 | Abilities — Level 20 | workflow | core | gm | **Partial** | C018, C043, C073, C082 | gm | P1 | **Present:** checkLevelUp reports ability milestone at 20. PokemonLevelUpPanel (C073) and LevelUpNotification (C082) display it. **Missing:** No UI for GM to assign the second ability from Basic/Advanced list. Manual JSON edit required. |
| R015 | Abilities — Level 40 | workflow | core | gm | **Partial** | C018, C043, C073, C082 | gm | P1 | **Present:** checkLevelUp reports milestone at 40. Same display. **Missing:** No assignment UI. Same gap as R014. |
| R016 | No Ability Maximum | constraint | situational | system | **Implemented** | C012 | gm | — | abilities stored as JSON array, no length validation. |
| R017 | Move Slot Limit | constraint | core | system | **Partial** | C011, C029 | gm | P2 | **Present:** Generator selects max 6 moves. **Missing:** PUT endpoint allows saving >6 moves with no validation. No enforcement on manual edits. |
| R018 | Natural Move Sources | enumeration | core | system | **Implemented** | C002, C029 | api-only | — | Learnset from SpeciesData includes level-up moves. Generator selects from these. |
| R019 | TM/Tutor Move Limit | constraint | core | system | **Missing** | — | — | P2 | No tracking of which moves are from TMs vs natural. No 3-TM limit enforcement. |
| R020 | TM-to-Natural Reclassification | condition | situational | system | **Out of Scope** | — | — | — | No TM/natural source tracking means reclassification cannot apply. |
| R021 | Tutor Move Level Restrictions | constraint | core | system | **Out of Scope** | — | — | — | No tutor move learning UI; level restrictions cannot be applied. |
| R022 | Tutor Points — Initial | formula | core | system | **Implemented** | C008, C029 | gm, player | — | Pokemon generation includes initial tutor points. |
| R023 | Tutor Points — Level Progression | formula | core | system | **Implemented** | C018, C021, C042, C045 | gm | — | checkLevelUp awards tutor point at level 5 and every 5 levels. |
| R024 | Tutor Points — Permanent Spend | constraint | core | system | **Missing** | — | — | P2 | No UI or endpoint for spending tutor points. tutorPoints field (C008) exists but is never decremented. |
| R025 | Tutor Points — Trade Refund | condition | situational | system | **Out of Scope** | — | — | — | No trade mechanic or Feature-to-Pokemon tracking. |
| R026 | Level Up Workflow | workflow | core | gm | **Implemented** | C018, C021, C042-C045, C073, C078, C081, C082 | gm | — | checkLevelUp + calculateLevelUps + XP endpoints handle full level-up detection. XpDistributionModal (C078), XpDistributionResults (C081), LevelUpNotification (C082) display outcomes. |
| R027 | Level Up — Stat Point | formula | core | gm | **Partial** | C018, C073 | gm | P1 | **Present:** checkLevelUp reports +1 stat point per level. PokemonLevelUpPanel displays. **Missing:** No stat allocation UI enforcing Base Relations Rule. GM must manually edit stats. |
| R028 | Level Up — Move Check | workflow | core | gm | **Partial** | C018, C073 | gm | P1 | **Present:** checkLevelUp reports new moves from learnset. PokemonLevelUpPanel displays. **Missing:** No UI to add moves to active set. Manual JSON edit required. |
| R029 | Evolution Check on Level Up | workflow | core | gm | **Missing** | — | — | P1 | No evolution detection. checkLevelUp does not check evolution conditions. SpeciesData lacks evolution trigger encoding. |
| R030 | Optional Evolution Refusal | condition | core | gm | **Out of Scope** | — | — | — | Evolution not implemented; refusal is moot. |
| R031 | Evolution — Stat Recalculation | workflow | core | gm | **Missing** | — | — | P1 | No species change workflow. No stat recalculation on evolution. Missing subsystem: Evolution. |
| R032 | Evolution — Ability Remapping | workflow | core | gm | **Missing** | — | — | P1 | No ability remapping on evolution. Same missing subsystem. |
| R033 | Evolution — Immediate Move Learning | workflow | core | gm | **Missing** | — | — | P1 | No evolution-triggered move learning logic. |
| R034 | Evolution — Skills/Capabilities Update | workflow | core | gm | **Missing** | — | — | P1 | No evolution capability/skill update. |
| R035 | Vitamins — Base Stat Increase | modifier | core | gm | **Missing** | — | — | P2 | No vitamin item system. No endpoint to apply base stat increases. |
| R036 | Vitamins — Maximum Per Pokemon | constraint | core | gm | **Out of Scope** | — | — | — | No vitamin system; constraint is moot. |
| R037 | Heart Booster | modifier | situational | gm | **Out of Scope** | — | — | — | No item effect system. |
| R038 | Pokemon Creation Workflow | workflow | core | gm | **Implemented** | C029, C031, Chain 2 | gm | — | Full creation via pokemon-generator service: SpeciesData lookup, nature application, stat distribution, move selection, ability pick, nickname resolution. |
| R039 | Breeding — Species Determination | formula | core | gm | **Out of Scope** | — | — | — | Breeding not implemented. Session helper focuses on combat/management. |
| R040 | Breeding — Inheritance Move List | workflow | core | gm | **Out of Scope** | — | — | — | Breeding not implemented. |
| R041 | Breeding — Inheritance Move Schedule | constraint | core | gm | **Out of Scope** | — | — | — | Breeding not implemented. |
| R042 | Inheritance Move Level Restrictions | constraint | core | gm | **Out of Scope** | — | — | — | Breeding not implemented. |
| R043 | Breeding — Trait Determination | workflow | core | gm | **Out of Scope** | — | — | — | Breeding not implemented. |
| R044 | Breeding — Nature Choice Threshold | condition | situational | gm | **Out of Scope** | — | — | — | Breeding not implemented. |
| R045 | Breeding — Ability Choice Threshold | condition | situational | gm | **Out of Scope** | — | — | — | Breeding not implemented. |
| R046 | Breeding — Gender Choice Threshold | condition | situational | gm | **Out of Scope** | — | — | — | Breeding not implemented. |
| R047 | Breeding — Shiny Determination | formula | situational | gm | **Out of Scope** | — | — | — | Breeding not implemented. |
| R048 | Loyalty System — Ranks | enumeration | core | gm | **Missing** | — | — | P2 | No loyalty field on Pokemon model. 7 ranks (0-6) not tracked. |
| R049 | Loyalty — Command Checks | formula | core | gm | **Missing** | — | — | P2 | No loyalty system; no command check DC enforcement. |
| R050 | Loyalty — Starting Values | condition | core | system | **Missing** | — | — | P2 | No loyalty assigned at capture or creation. |
| R051 | Loyalty — Intercept at Rank 3 | interaction | cross-domain-ref | system | **Out of Scope** | — | — | — | Loyalty not tracked; Intercept restrictions handled by combat domain. |
| R052 | Loyalty — Intercept at Rank 6 | interaction | cross-domain-ref | system | **Out of Scope** | — | — | — | Same as R051. |
| R053 | Disposition System | enumeration | situational | gm | **Partial** | — | — | P3 | No disposition tracking for wild Pokemon. Encounter tables provide habitat context but no disposition state. |
| R054 | Disposition — Charm Check DCs | formula | situational | gm | **Out of Scope** | — | — | — | Disposition not implemented; charm mechanics are narrative. |
| R055 | Training Session | workflow | situational | gm | **Missing** | — | — | P2 | trainingExp field (C001) exists but no training session endpoint or UI. |
| R056 | Experience Training Formula | formula | situational | gm | **Missing** | — | — | P2 | Half level + Command rank bonus not implemented. |
| R057 | Experience Training Limit | constraint | situational | gm | **Out of Scope** | — | — | — | Training not implemented; limit is moot. |
| R058 | Pokemon Experience Calculation | formula | core | system | **Implemented** | C020, C022, C044 | gm | — | calculateEncounterXp: total defeated levels (trainers doubled via enrichDefeatedEnemies) * significance / player count. |
| R059 | Experience Distribution Rules | workflow | core | gm | **Implemented** | C045, C056, C078, C081 | gm | — | XpDistributionModal (C078) allows per-Pokemon allocation. Fainted Pokemon eligible. XpDistributionResults (C081) shows outcomes. |
| R060 | Experience Chart | formula | core | system | **Implemented** | C014, C023, C024, C025 | gm | — | Full EXPERIENCE_CHART constant (C014) with getXpForLevel, getLevelForXp, getXpToNextLevel utilities. |
| R061 | Size Classes | enumeration | core | system | **Implemented** | C001, C076 | gm | — | Size stored on Pokemon from SpeciesData, displayed in PokemonCapabilitiesTab. |
| R062 | Weight Classes | enumeration | core | system | **Implemented** | C001, C076 | gm | — | Weight class from SpeciesData, displayed in capabilities tab. |
| R063 | Species Capabilities | enumeration | core | system | **Implemented** | C001, C076 | gm | — | capabilities JSON on Pokemon from SpeciesData. |
| R064 | Move-Granted Capabilities | condition | situational | system | **Partial** | C011, C076 | gm | P3 | **Present:** Capabilities stored on Pokemon. **Missing:** No automated linkage between moves and capability grants. Forgotten moves don't auto-remove granted capabilities. |
| R065 | Pokemon Skills | enumeration | core | system | **Implemented** | C001, C066, C077 | gm | — | Skills JSON from SpeciesData. PokemonSkillsTab (C077) displays. Dice rolling via C066. |
| R066 | Mega Evolution — Trigger | workflow | edge-case | both | **Partial** | C001 | gm | P3 | **Present:** heldItem field can store Mega Stone name. **Missing:** No Mega Evolution trigger UI, Swift Action integration, or Mega Ring check. |
| R067 | Mega Evolution — Stat/Ability Changes | formula | edge-case | system | **Partial** | — | — | P3 | **Present:** Stats editable via PUT (manual workaround). **Missing:** No automated Mega stat recalculation. No Mega stat data in SpeciesData. |
| R068 | Mega Evolution — Constraints | constraint | edge-case | system | **Out of Scope** | — | — | — | Mega Evolution not implemented; constraints are moot. |

---

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|------------|-------------|------------------|---------|---------|-------------|
| system | 31 | 20 | 0 | 3 | 4 | 4 |
| gm | 33 | 14 | 0 | 4 | 7 | 8 |
| both | 1 | 0 | 0 | 1 | 0 | 0 |
| cross-domain | 3 | 1 | 0 | 0 | 0 | 2 |

### Key Findings

- **No Implemented-Unreachable rules.** All lifecycle capabilities are accessible from the GM view where they belong. Pokemon lifecycle is inherently a GM management domain.
- **Player visibility exists** for Pokemon data (stats, types, moves, level, experience, tutor points via player view), export/import (C047-C048/C070-C071), and sprites (C062-C065).
- **Evolution is the largest gap:** 5 rules (R029, R031-R034) are Missing. No automated evolution detection, species transformation, stat recalculation, ability remapping, or move learning.
- **Breeding is entirely Out of Scope:** 9 rules (R039-R047). The app is a session helper, not a breeding simulator.
- **Level-up UI is incomplete:** Level-ups are correctly detected and reported (R026 Implemented) but stat allocation (R027), move learning (R028), and ability assignment (R014/R015) require manual editing.
- **XP system is fully implemented:** XP calculation (R058), distribution (R059), experience chart (R060), and level-up detection (R026) form a complete chain with full UI.

---

## Subsystem Gaps

### GAP-PLC-1: No Evolution System
- **Type:** Subsystem-Missing (feature)
- **Affected Rules:** R029, R031, R032, R033, R034 — 5 Missing rules + R030 (Out of Scope)
- **Priority:** P1
- **Description:** No automated evolution detection, species transformation, stat recalculation, ability remapping, or move learning on evolution. SpeciesData does not encode evolution triggers.
- **Suggested Ticket:** "feat: Pokemon evolution system — trigger detection, species transformation, stat recalc, ability remap"
- **Workaround:** GM manually creates new Pokemon of evolved species and copies/recalculates stats.

### GAP-PLC-2: No Level-Up Allocation UI
- **Type:** Subsystem-Missing (UI)
- **Affected Rules:** R014, R015, R027, R028 — 4 Partial rules
- **Priority:** P1
- **Description:** Level-up effects are detected and reported but no UI for stat allocation (Base Relations enforcement), move learning, or ability assignment. Manual JSON editing via PUT required.
- **Suggested Ticket:** "feat: Level-up allocation UI — stat points with Base Relations validation, move learning, ability assignment"

### GAP-PLC-3: No Loyalty System
- **Type:** Subsystem-Missing (feature)
- **Affected Rules:** R048, R049, R050 — 3 Missing rules
- **Priority:** P2
- **Description:** No loyalty field on Pokemon model. 7 loyalty ranks (0-6) not tracked. Command check DCs unenforceable.
- **Suggested Ticket:** "feat: Loyalty system — ranks 0-6, starting values, command check DCs"

### GAP-PLC-4: No Training XP System
- **Type:** Subsystem-Missing (feature)
- **Affected Rules:** R055, R056 — 2 Missing rules
- **Priority:** P2
- **Description:** trainingExp field exists but no training session workflow or XP calculation.
- **Suggested Ticket:** "feat: Daily training XP system — session workflow, formula, daily limit"

### GAP-PLC-5: Breeding System (Out of Scope)
- **Type:** Out of Scope
- **Affected Rules:** R039-R047 — 9 rules
- **Description:** Breeding mechanics not implemented. Session helper focus is combat/management.

---

## Gap Priorities

### P1 — Important Mechanic, Commonly Used
| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| R014 | Abilities — Level 20 | Partial | No ability assignment UI |
| R015 | Abilities — Level 40 | Partial | No ability assignment UI |
| R027 | Level Up — Stat Point | Partial | No stat allocation UI |
| R028 | Level Up — Move Check | Partial | No move learning UI |
| R029 | Evolution Check | Missing | No evolution detection |
| R031 | Evolution — Stat Recalc | Missing | No species transformation |
| R032 | Evolution — Ability Remap | Missing | No ability remapping |
| R033 | Evolution — Move Learning | Missing | No evolution moves |
| R034 | Evolution — Skills Update | Missing | No evolution caps update |

### P2 — Situational, Workaround Exists
| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| R001 | Party Limit | Missing | No 6-Pokemon enforcement |
| R017 | Move Slot Limit | Partial | No >6 validation on PUT |
| R019 | TM/Tutor Move Limit | Missing | No TM source tracking |
| R024 | Tutor Points — Spend | Missing | No spending mechanism |
| R035 | Vitamins | Missing | No vitamin application |
| R048 | Loyalty — Ranks | Missing | No loyalty tracking |
| R049 | Loyalty — Commands | Missing | No command check DCs |
| R050 | Loyalty — Starting | Missing | No loyalty initialization |
| R055 | Training Session | Missing | No training workflow |
| R056 | Training Formula | Missing | No training XP calc |

### P3 — Edge Case, Minimal Impact
| Rule ID | Rule Name | Classification | Gap Description |
|---------|-----------|---------------|-----------------|
| R053 | Disposition | Partial | No disposition tracking |
| R064 | Move Capabilities | Partial | No auto-link |
| R066 | Mega Trigger | Partial | No Mega UI |
| R067 | Mega Stats | Partial | No automated Mega stats |

---

## Auditor Queue

### Tier 1: Core Formulas
1. **R011** → C009, C029 — HP formula: level + (HP_stat * 3) + 10
2. **R006** → C017 — Nature adjustments: HP +1/-1, others +2/-2, floor 1
3. **R009** → C029, C033 — Stat point total: level + 10
4. **R023** → C018, C021 — Tutor point: +1 at level 5, 10, 15, ...
5. **R058** → C020, C022, C044 — XP: defeated levels (trainers doubled) * significance / players
6. **R060** → C014, C023-C025 — XP chart: levels 1-100
7. **R012** → combat-domain — Evasion: floor(calculatedStat/5), cap 6

### Tier 2: Core Workflows
8. **R038** → C029, C031, Chain 2 — Full creation pipeline
9. **R013** → C029 — Initial ability: random Basic Ability
10. **R026** → C018, C021, C042-C045, C073, C078, C081, C082 — Level-up chain
11. **R059** → C045, C078, C081 — XP distribution flow

### Tier 3: Core Constraints
12. **R002** → C006, C014 — Max level 100 cap
13. **R010** → C033 — Base Relations ordering
14. **R007** → C013, C017 — Neutral natures unmodified

### Tier 4: Enumerations
15. **R003** → C002 — 6 base stats per species
16. **R004** → C001 — 18 types
17. **R005** → C013 — 36 natures
18. **R018** → C002 — Learnset completeness
19. **R061-R063** → C001, C076 — Size, weight, capabilities
20. **R065** → C001, C066, C077 — 6 skills + dice

### Tier 5: Partial Items — Present Portion
21. **R014/R015** → C018, C043, C073, C082 — Ability milestone detection
22. **R017** → C029 — Generator 6-move limit
23. **R027** → C018 — Stat point reporting
24. **R028** → C018, C073 — New move detection
25. **R064** → C001, C076 — Capabilities stored
26. **R066/R067** → C001 — Held item / manual stat editing
