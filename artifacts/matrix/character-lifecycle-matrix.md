---
domain: character-lifecycle
analyzed_at: 2026-03-05T16:00:00Z
analyzed_by: coverage-analyzer
session: 120
rules_catalog: character-lifecycle/rules/_index.md
capabilities_catalog: character-lifecycle/capabilities/_index.md
decrees_checked: [decree-022, decree-026, decree-027, decree-037]
---

# Feature Completeness Matrix: Character Lifecycle

## Coverage Score

```
Implemented:              48
Implemented-Unreachable:   1
Partial:                   8
Missing:                   4
Subsystem-Missing:         0
Out of Scope:              7
---
Total:                    68
Effective Total:          61  (68 - 7 Out of Scope)

Coverage = (48 + 0.5*1 + 0.5*8) / 61 * 100
         = (48 + 0.5 + 4) / 61 * 100
         = 52.5 / 61 * 100
         = 86.1%
```

Previous coverage (session 59): 70.0%. Delta: **+16.1 percentage points**.

Key changes driving improvement:
- R013-R018 (6 rules): Missing -> Implemented (trainerDerivedStats.ts + CapabilitiesDisplay.vue)
- R020: Partial -> Implemented (computeWeightClass in trainerDerivedStats.ts)
- R024: Partial -> Implemented (decree-027 hard enforcement in useCharacterCreation)
- R042: Partial -> Implemented (calculateSceneEndAp in scene.service + encounter end)
- R044, R046, R048: Partial -> Implemented (LevelUpEdgeSection + LevelUpMilestoneSection + trainerAdvancement.ts)
- R045, R047, R049, R050: Missing -> Implemented (milestone choices in trainerAdvancement.ts + LevelUpMilestoneSection)
- R053: Missing -> Implemented (XP-based leveling via trainerExperience.ts + milestone via LevelUpModal)
- R054: Missing -> Implemented (experience bank with auto-level at 10 XP in applyTrainerXp)
- R060: Missing -> Partial (auto-XP on catch + evolve, no hatch path)
- R040: Partial -> Partial (XP system enforces cap, but creation/edit API does not)
- R058: Out of Scope -> Missing (XP system now exists, so retraining XP cost is in scope)

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|-----------------|-------------|-------|
| R001 | Trainer Combat Stats Definition | enumeration | core | system | **Implemented** | all | -- | C001 (Prisma model: hp, attack, defense, specialAttack, specialDefense, speed), C087 (Stats type) |
| R002 | Starting Stat Baseline | constraint | core | gm | **Implemented** | gm | -- | C029 (useCharacterCreation: BASE_HP=10, BASE_OTHER=5, 10 points, max 5/stat), C031 (validateStatAllocation) |
| R003 | Skill Categories | enumeration | core | system | **Implemented** | all | -- | C029/C032 (PTU_SKILL_CATEGORIES: Body 6, Mind 7, Spirit 4 = 17 total) |
| R004 | Skill Ranks and Dice | enumeration | core | system | **Implemented** | gm | -- | SKILL_RANKS constant: rank/value/dice for Pathetic through Master |
| R005 | Skill Rank Level Prerequisites | constraint | core | gm | **Implemented** | gm | -- | getMaxSkillRankForLevel (Adept@2, Expert@6, Master@12), C032 (validateSkillBackground checks cap) |
| R006 | Skills Default Rank | constraint | core | system | **Implemented** | gm | -- | getDefaultSkills returns all skills at Untrained |
| R007 | Background Skill Modification | workflow | core | gm | **Implemented** | gm | -- | C029 (applyBackground, clearBackground, enableCustomBackground), 11 sample backgrounds + custom, C032 (validates 1 Adept, 1 Novice, 3 Pathetic) |
| R008 | Trainer HP Formula | formula | core | system | **Implemented** | gm, player | -- | C003 (Create API: maxHp = Level*2 + HP*3 + 10), C029 (composable computes in real-time), C084 (player view displays) |
| R009 | Physical Evasion Formula | formula | core | system | **Implemented** | gm | -- | C029 (floor(Defense/5), capped at +6) |
| R010 | Special Evasion Formula | formula | core | system | **Implemented** | gm | -- | C029 (floor(SpDef/5), capped at +6) |
| R011 | Speed Evasion Formula | formula | core | system | **Implemented** | gm | -- | C029 (floor(Speed/5), capped at +6) |
| R012 | Evasion General Formula | formula | core | system | **Implemented** | gm | -- | C029 (floor division with +6 cap per PTU) |
| R013 | Power Capability | formula | core | system | **Implemented** | gm | -- | `trainerDerivedStats.ts:computeTrainerDerivedStats` (4 base + Athletics Novice+ bonus + Combat Adept+ bonus), C059 (CapabilitiesDisplay shows power) |
| R014 | High Jump Capability | formula | core | system | **Implemented** | gm | -- | `trainerDerivedStats.ts` (0 base + Acrobatics Adept+ bonus + Acrobatics Master+ bonus), C059 |
| R015 | Long Jump Capability | formula | core | system | **Implemented** | gm | -- | `trainerDerivedStats.ts` (floor(Acrobatics rank / 2)), C059 |
| R016 | Overland Movement Speed | formula | core | system | **Implemented** | gm | -- | `trainerDerivedStats.ts` (3 + floor((Athletics + Acrobatics) / 2)), C059 |
| R017 | Swimming Speed | formula | core | system | **Implemented** | gm | -- | `trainerDerivedStats.ts` (floor(Overland / 2)), C059 |
| R018 | Throwing Range | formula | core | system | **Implemented** | gm | -- | `trainerDerivedStats.ts` (4 + Athletics rank), C059 |
| R019 | Trainer Size | enumeration | core | system | **Implemented** | gm | -- | Trainers treated as Medium throughout combat system (implicit default) |
| R020 | Weight Class | enumeration | core | system | **Implemented** | gm | -- | `trainerDerivedStats.ts:computeWeightClass` (WC3: <=110 lbs, WC4: 111-220, WC5: >220), C059 (displays weight class), C076 (BiographySection captures weight) |
| R021 | Rounding Rule | constraint | core | system | **Implemented** | gm | -- | Math.floor used consistently in evasion, HP, derived stat, and capability calculations |
| R022 | Starting Edges | constraint | core | gm | **Implemented** | gm | -- | getExpectedEdgesForLevel returns base=4 at level 1, C033 (validateEdgesAndFeatures checks count) |
| R023 | Starting Skill Cap | constraint | core | gm | **Implemented** | gm | -- | getMaxSkillRankForLevel returns Novice at level 1, C032 (validates cap) |
| R024 | Pathetic Skills Cannot Be Raised At Creation | constraint | core | gm | **Implemented** | gm | -- | C029 enforces decree-027: addSkillEdge blocks Pathetic skills. C032 (validateSkillBackground) checks for Pathetic-locked skill edge violations. Hard enforcement, not just warnings. |
| R025 | Skill Edge Definitions | enumeration | core | gm | **Implemented** | gm | -- | SKILL_RANKS with level prereqs, C029 (addSkillEdge bumps rank with revert on remove), C075 (EdgeSelectionSection) |
| R026 | Edges Per Level | constraint | core | gm | **Implemented** | gm | -- | getExpectedEdgesForLevel (base + bonus skill edges by level), C033 (validates edge count) |
| R027 | Skill Check Mechanic | workflow | core | gm | **Out of Scope** | -- | -- | Table-resolved mechanic. App is a session helper, not a dice resolution engine. |
| R028 | Opposed Check Mechanic | workflow | situational | gm | **Out of Scope** | -- | -- | Table-resolved mechanic. |
| R029 | Extended Skill Check | workflow | situational | gm | **Out of Scope** | -- | -- | Table-resolved mechanic. |
| R030 | Starting Features | constraint | core | gm | **Implemented** | gm | -- | getExpectedFeaturesForLevel returns 4+1 training at level 1, C033 (validates feature count) |
| R031 | Free Training Feature | modifier | core | gm | **Implemented** | gm | -- | C029 (setTrainingFeature separate slot, no prereqs required), C074 (ClassFeatureSection has training feature slot) |
| R032 | Max Class Features | constraint | core | gm | **Implemented** | gm | -- | MAX_TRAINER_CLASSES = 4, C029 (addClass respects cap), C033 (validates class count <= 4) |
| R033 | Stat Tag Effect | modifier | core | system | **Partial** | gm | P2 | **Present:** Features stored as name strings, can be added via C029/C080. **Missing:** No automatic stat bonus from [+Stat] tagged features. GM must manually adjust stats when features provide stat bonuses. |
| R034 | Ranked Feature Tag | constraint | situational | gm | **Partial** | gm | P3 | **Present:** Features stored as strings, can add multiples manually. **Missing:** No ranked feature tracking (Rank 1, Rank 2). No validation preventing excess ranks. |
| R035 | Branch Feature Tag | constraint | situational | gm | **Implemented** | gm | -- | C029 (addClass with branching support per decree-022: specialization suffix "Type Ace: Fire"), C074 (ClassFeatureSection provides specialization selection). Decree-026 correctly excludes Martial Artist from branching. |
| R036 | Features Per Level | constraint | core | gm | **Implemented** | gm | -- | getExpectedFeaturesForLevel (4 base + 1 per odd level 3+), C033 (validates), C080 (LevelUpFeatureSection) |
| R037 | No Duplicate Features | constraint | core | gm | **Partial** | gm | P2 | **Present:** C033 validates feature count. **Missing:** No explicit duplicate detection. Features stored as string array; duplicates possible if GM enters same name twice. |
| R038 | Stat Points Per Level | modifier | core | gm | **Implemented** | gm | -- | `trainerAdvancement.ts` (statPointsGained: 1 per level), C031 (validateStatAllocation checks total against budget), C078 (LevelUpStatSection) |
| R039 | Edges Per Level (Advancement) | modifier | core | gm | **Implemented** | gm | -- | `trainerAdvancement.ts` (edgesGained: 1 on even levels), C081 (LevelUpEdgeSection) |
| R040 | Max Trainer Level | constraint | core | gm | **Partial** | gm | P3 | **Present:** TRAINER_MAX_LEVEL = 50 in trainerExperience.ts. XP system caps level at 50 (applyTrainerXp). TrainerXpPanel disables XP award at max level. trainerAdvancement.ts caps at 50. **Missing:** No validation on character creation/edit API preventing level > 50. GM can manually set level above 50 via PUT. |
| R041 | Action Points Pool | formula | core | system | **Implemented** | gm | -- | `restHealing.ts:calculateMaxAp` (5 + floor(level/5)), used in update API, XP endpoint, and scene-end restoration |
| R042 | AP Refresh Per Scene | condition | core | system | **Implemented** | gm | -- | `restHealing.ts:calculateSceneEndAp` called by scene.service.ts (scene end) and encounters/[id]/end.post.ts (encounter end). Restores AP to max minus drained/bound. |
| R043 | AP Bind and Drain | interaction | core | gm | **Implemented** | gm | -- | C001 (drainedAp, boundAp, currentAp fields), C013 (extended rest clears drained AP, bound preserved per decree-016), C016 (heal-injury drain_ap drains 2 AP), C015 (new day resets) |
| R044 | Level 2 Milestone -- Adept Skills | workflow | core | gm | **Implemented** | gm | -- | `trainerAdvancement.ts` (bonusSkillEdge at level 2, skillRankCapUnlocked: Adept), C081 (LevelUpEdgeSection presents bonus skill edge), C082 (LevelUpMilestoneSection). Per decree-037: skill ranks via edge slots only. |
| R045 | Level 5 Milestone -- Amateur Trainer | workflow | core | gm | **Implemented** | gm | -- | `trainerAdvancement.ts:getMilestoneAt(5)` returns Amateur milestone with two choices: lifestyle stat points (+1 Atk/SpAtk per even level 6-10, +2 retroactive) OR general feature. C082 (LevelUpMilestoneSection) presents choice. |
| R046 | Level 6 Milestone -- Expert Skills | workflow | core | gm | **Implemented** | gm | -- | `trainerAdvancement.ts` (bonusSkillEdge at level 6, skillRankCapUnlocked: Expert), C081 (LevelUpEdgeSection), C082. |
| R047 | Level 10 Milestone -- Capable Trainer | workflow | core | gm | **Implemented** | gm | -- | `trainerAdvancement.ts:getMilestoneAt(10)` returns Capable milestone with choices: lifestyle stat points (+1 Atk/SpAtk per even level 12-20) OR two bonus edges. C082 presents choice. |
| R048 | Level 12 Milestone -- Master Skills | workflow | core | gm | **Implemented** | gm | -- | `trainerAdvancement.ts` (bonusSkillEdge at level 12, skillRankCapUnlocked: Master), C081 (LevelUpEdgeSection), C082. |
| R049 | Level 20 Milestone -- Veteran Trainer | workflow | situational | gm | **Implemented** | gm | -- | `trainerAdvancement.ts:getMilestoneAt(20)` returns Veteran milestone with choices: lifestyle stat points (+1 Atk/SpAtk per even level 22-30) OR two bonus edges. C082 presents choice. |
| R050 | Level 30/40 Milestones -- Elite/Champion | workflow | situational | gm | **Implemented** | gm | -- | `trainerAdvancement.ts:getMilestoneAt(30)` and `getMilestoneAt(40)` return Elite/Champion milestones with three choices: lifestyle stat points OR two bonus edges OR one general feature. C082 presents choice. |
| R051 | Character Creation Workflow | workflow | core | gm | **Implemented** | gm | -- | C090 (GM Create Page: Basic Info, Background & Skills, Edges, Classes & Features, Combat Stats, Biography, Notes), C029 (useCharacterCreation composable manages full flow with section completion tracking) |
| R052 | Steps 3 and 4 Interleaving | constraint | situational | gm | **Implemented** | gm | -- | C090 (sections are independent, no forced sequence between Edges and Classes/Features) |
| R053 | Leveling Triggers | workflow | core | gm | **Implemented** | gm | -- | C017 (Award XP API with auto-level), C056 (TrainerXpPanel UI), C050 (distributeTrainerXp for post-encounter batch). Milestone-based leveling via LevelUpModal. Both XP-based and milestone triggers implemented. |
| R054 | Experience Bank | workflow | core | gm | **Implemented** | gm | -- | `trainerExperience.ts:applyTrainerXp` (bank accumulates, auto-subtract 10 and level up, handles multi-level jumps, bank cannot go below 0). C017 (XP API), C056 (TrainerXpPanel displays bank). |
| R055 | Retraining Costs | enumeration | core | gm | **Missing** | -- | P2 | No retraining workflow (2 XP for feature, 1 XP for edge, 1 XP for stat point). |
| R056 | Retraining Prerequisite Lock | constraint | core | gm | **Missing** | -- | P2 | No prerequisite dependency tracking for retraining restrictions. |
| R057 | Retraining Permanent Effect Lock | constraint | situational | gm | **Out of Scope** | -- | -- | Requires feature effect tracking ("used Move Tutor") which is beyond app's current scope. |
| R058 | Retraining Experience Requirement | constraint | core | gm | **Missing** | -- | P2 | XP system exists but no retraining workflow to consume XP. Depends on R055 implementation. |
| R059 | Retraining Timing | constraint | situational | gm | **Out of Scope** | -- | -- | Narrative timing constraint -- table-resolved. |
| R060 | Experience From Pokemon | modifier | core | system | **Partial** | gm | P2 | **Present:** Auto +1 XP on catch (capture/attempt.post.ts) and evolve (pokemon/[id]/evolve.post.ts) of new species. ownedSpecies tracking on character model. **Missing:** No auto-XP on hatch (no hatching system exists). |
| R061 | Cooperative Skill Check -- Team | interaction | situational | gm | **Out of Scope** | -- | -- | Table-resolved mechanic. App does not handle skill check resolution. |
| R062 | Cooperative Skill Check -- Assisted | interaction | situational | gm | **Out of Scope** | -- | -- | Table-resolved mechanic. |
| R063 | AP Spend for Roll Bonus | interaction | situational | player | **Implemented-Unreachable** | gm | P2 | AP tracking exists (currentAp, drainedAp, boundAp on model). GM can manually decrement AP via character edit. But **player** cannot spend their own AP from the player view -- PlayerCharacterSheet (C084) is read-only. **Intended actor:** player. **Actual access:** gm only. |
| R064 | Skill Stunt Edge | modifier | situational | gm | **Partial** | gm | P3 | **Present:** Edge stored as string (e.g., "Skill Stunt: Perception"). **Missing:** +6/-1d6 swap not computed. Dice resolution is table-side. |
| R065 | Skill Enhancement Edge | modifier | situational | gm | **Partial** | gm | P3 | **Present:** Edge stored as string. **Missing:** +2 bonus to chosen skills not auto-applied in any computation. |
| R066 | Categoric Inclination Edge | modifier | situational | gm | **Partial** | gm | P3 | **Present:** Edge stored as string. **Missing:** +1 bonus to skill category not auto-applied. |
| R067 | Virtuoso Edge | modifier | edge-case | gm | **Out of Scope** | -- | -- | Requires Master rank + level 20. Mechanical effect (rank 8 treatment) is too niche for app tracking. |
| R068 | Percentages Are Additive | constraint | core | system | **Implemented** | all | -- | Additive percentage pattern used in capture rate calculations and equipment bonus aggregation. |

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|-------------|-------------|-------------------|---------|---------|-------------|
| system | 22 | 21 | 0 | 1 | 0 | 0 |
| gm | 45 | 27 | 0 | 7 | 4 | 7 |
| player | 1 | 0 | 1 | 0 | 0 | 0 |

**Actor reachability:**
- **system** rules (22 total): 21/22 implemented -- only gap is R060 (Partial: no hatch-triggered XP). All derived stat formulas now computed.
- **gm** rules (45 total): 27/45 fully implemented, 7 partial, 4 missing, 7 out of scope. Main gaps: retraining system (R055/R056/R058), feature metadata tracking (R033/R034/R037), edge bonus automation (R064-R066).
- **player** rules (1 total): R063 is the only player-actor rule. It is Implemented-Unreachable because the player view is read-only.

**Player view subsystem note:** While only 1 rule has `actor: player` explicitly, the Missing Subsystems section of the capability catalog identifies 8 player-facing subsystem gaps. These affect rule *accessibility* (many gm-actor rules could benefit from player access) but do not change rule classifications since the rules specify `actor: gm`.

## Subsystem Gaps

### SG-1: No Retraining System
- **Missing subsystem:** Retraining workflow with XP cost, prerequisite dependency tracking
- **Affected rules:** R055 (costs), R056 (prereq lock), R058 (XP requirement) -- 3 rules
- **Suggested feature ticket:** "feat: add retraining workflow for features, edges, and stat points with XP cost deduction"
- **Priority:** P2 -- situational between-session activity, workaround exists (GM manually edits character + deducts XP)

### SG-2: No Player View Write Access
- **Missing subsystem:** Player-facing character editing, AP management, equipment changes
- **Affected rules:** R063 (1 directly unreachable)
- **Capability catalog missing subsystems:** MS-1 (no player creation), MS-2 (no player level-up), MS-3 (no player stat/skill editing), MS-4 (no player equipment), MS-5 (no player inventory), MS-7 (no player injury healing)
- **Suggested feature ticket:** "feat: add player view character sheet editing capabilities"
- **Priority:** P1 -- bottleneck during gameplay when players need to update their sheets. However, only 1 rule is directly affected; the rest are actor=gm rules that work correctly from GM view.

### SG-3: No Feature Metadata System
- **Missing subsystem:** Feature metadata tracking ([+Stat] auto-bonuses, [Ranked] rank tracking, duplicate detection)
- **Affected rules:** R033 (stat tag), R034 (ranked tag), R037 (no duplicates) -- 3 rules (all Partial)
- **Suggested feature ticket:** "feat: add feature metadata system with stat bonuses, rank tracking, and duplicate prevention"
- **Priority:** P2 -- improves data integrity but GM can manually manage. Features currently stored as simple string arrays.

## Gap Priorities

| Priority | Count | Rules |
|----------|-------|-------|
| P1 | 0 | (none -- previous P1 gaps for level-up and XP are now resolved) |
| P2 | 7 | R033 (partial), R037 (partial), R055, R056, R058, R060 (partial), R063 (unreachable) |
| P3 | 6 | R034 (partial), R040 (partial), R064 (partial), R065 (partial), R066 (partial) |

## Auditor Queue

Priority-ordered list for Implementation Auditor to verify correctness.

### Tier 1: Core Formulas (verify computation correctness first)
1. **R008** -- Trainer HP Formula: verify `Level*2 + HP*3 + 10` in C003 and C029
2. **R009** -- Physical Evasion: verify `floor(Defense/5)`, cap +6 in C029
3. **R010** -- Special Evasion: verify `floor(SpDef/5)`, cap +6 in C029
4. **R011** -- Speed Evasion: verify `floor(Speed/5)`, cap +6 in C029
5. **R012** -- Evasion General: verify floor division with +6 cap
6. **R013** -- Power Capability: verify `trainerDerivedStats.ts` (4 + Athletics Novice+ + Combat Adept+)
7. **R014** -- High Jump: verify `trainerDerivedStats.ts` (0 + Acrobatics Adept+ + Acrobatics Master+)
8. **R015** -- Long Jump: verify `trainerDerivedStats.ts` (floor(Acrobatics rank / 2))
9. **R016** -- Overland Speed: verify `trainerDerivedStats.ts` (3 + floor((Athletics+Acrobatics) / 2))
10. **R017** -- Swimming Speed: verify `trainerDerivedStats.ts` (floor(Overland / 2))
11. **R018** -- Throwing Range: verify `trainerDerivedStats.ts` (4 + Athletics rank)
12. **R041** -- Action Points Pool: verify `calculateMaxAp` (5 + floor(level/5))
13. **R054** -- Experience Bank: verify `applyTrainerXp` (subtract 10, level up, multi-level jumps, cap at 50)

### Tier 2: Core Enumerations (verify data completeness)
14. **R001** -- Trainer Combat Stats: verify 6 stats on Prisma model
15. **R003** -- Skill Categories: verify 17 skills in 3 categories (Body 6, Mind 7, Spirit 4)
16. **R004** -- Skill Ranks and Dice: verify rank/dice mapping (Pathetic=1d6 through Master=6d6)
17. **R020** -- Weight Class: verify `computeWeightClass` (WC3: <=110, WC4: 111-220, WC5: >220)
18. **R068** -- Percentages Additive: verify additive pattern in capture and equipment calculations

### Tier 3: Core Constraints (verify enforcement)
19. **R002** -- Starting Stat Baseline: verify base values (10 HP, 5 others) and 10-point budget with max 5/stat
20. **R005** -- Skill Rank Level Prerequisites: verify Adept@2, Expert@6, Master@12
21. **R006** -- Skills Default Rank: verify getDefaultSkills returns Untrained
22. **R021** -- Rounding Rule: verify Math.floor usage across formulas
23. **R022** -- Starting Edges: verify 4 edges at level 1
24. **R023** -- Starting Skill Cap: verify Novice cap at level 1
25. **R024** -- Pathetic Skills at Creation: verify decree-027 hard enforcement (addSkillEdge blocks Pathetic)
26. **R026** -- Edges Per Level: verify level-based edge budget computation
27. **R030** -- Starting Features: verify 4 + 1 training feature
28. **R032** -- Max Class Features: verify max 4 cap
29. **R036** -- Features Per Level: verify odd-level feature gain
30. **R038** -- Stat Points Per Level: verify trainerAdvancement.ts (1 per level)
31. **R039** -- Edges Per Level Advancement: verify even-level edge gain
32. **R040** -- Max Trainer Level: verify TRAINER_MAX_LEVEL=50 enforcement in XP system; flag missing validation on create/edit API

### Tier 4: Core Workflows (verify flow correctness)
33. **R007** -- Background Skill Modification: verify 11 presets + custom, 1 Adept + 1 Novice + 3 Pathetic
34. **R025** -- Skill Edge Definitions: verify addSkillEdge rank bump with revert
35. **R035** -- Branch Feature Tag: verify decree-022 (specialization suffix) and decree-026 (Martial Artist excluded), verify branching class data
36. **R044** -- Level 2 Milestone: verify bonusSkillEdge and Adept cap unlock in trainerAdvancement.ts
37. **R046** -- Level 6 Milestone: verify bonusSkillEdge and Expert cap unlock
38. **R048** -- Level 12 Milestone: verify bonusSkillEdge and Master cap unlock
39. **R045** -- Level 5 Milestone: verify Amateur milestone choices (lifestyle stats vs feature)
40. **R047** -- Level 10 Milestone: verify Capable milestone choices (lifestyle stats vs edges)
41. **R049** -- Level 20 Milestone: verify Veteran milestone choices
42. **R050** -- Level 30/40 Milestones: verify Elite/Champion milestone choices (3 options each)
43. **R051** -- Character Creation Workflow: verify full flow with section coverage
44. **R052** -- Steps 3/4 Interleaving: verify no forced ordering
45. **R053** -- Leveling Triggers: verify XP-based auto-level + milestone via LevelUpModal

### Tier 5: Interaction and Modifier Rules (verify logic)
46. **R042** -- AP Refresh Per Scene: verify calculateSceneEndAp in scene.service + encounter end
47. **R043** -- AP Bind and Drain: verify drainedAp/boundAp fields and healing/rest flow
48. **R031** -- Free Training Feature: verify setTrainingFeature is separate from features
49. **R019** -- Trainer Size: verify Medium default treatment
50. **R060** -- Experience From Pokemon: verify auto-XP on catch + evolve; confirm no hatch path

### Tier 6: Implemented-Unreachable (verify logic correctness, flag access gap)
51. **R063** -- AP Spend for Roll Bonus: verify AP fields exist; confirm player view is read-only; flag that player cannot self-manage AP

### Tier 7: Partial Items (verify present portion, document missing)
52. **R033** -- Stat Tag Effect: verify features stored as strings, confirm no auto-stat-bonus
53. **R034** -- Ranked Feature Tag: verify string storage, confirm no rank tracking
54. **R037** -- No Duplicate Features: verify array storage, confirm no dedup validation
55. **R064** -- Skill Stunt Edge: verify storage as string, confirm no +6/-1d6 computation
56. **R065** -- Skill Enhancement Edge: verify storage as string, confirm no +2 auto-apply
57. **R066** -- Categoric Inclination Edge: verify storage as string, confirm no +1 auto-apply

## Decree Compliance Notes

- **decree-022** (Branch classes with specialization suffix): Verified in R035 classification. C029 uses specialization suffix format ("Type Ace: Fire"). Canonical branching classes: Type Ace, Stat Ace, Style Expert, Researcher.
- **decree-026** (Martial Artist not branching): Verified. Martial Artist is excluded from branching class list per RAW [Class]-only tag.
- **decree-027** (Pathetic skills cannot be raised during creation): Verified in R024 classification. C029 hard-blocks addSkillEdge from raising Pathetic skills. C032 validates. Changed R024 from Partial (old matrix) to Implemented.
- **decree-037** (Skill ranks via Edge slots only): Verified in R044/R046/R048 classifications. trainerAdvancement.ts does not include automatic skillRanksGained. Skill rank progression deferred to Edge selection (bonus skill edges at levels 2, 6, 12).
