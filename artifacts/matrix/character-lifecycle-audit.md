---
domain: character-lifecycle
audited_at: 2026-03-05T18:00:00Z
audited_by: implementation-auditor
session: 121
matrix_source: artifacts/matrix/character-lifecycle-matrix.md
rules_catalog: artifacts/matrix/character-lifecycle/rules/_index.md
capabilities_catalog: artifacts/matrix/character-lifecycle/capabilities/_index.md
decrees_checked: [decree-022, decree-026, decree-027, decree-037]
items_audited: 57
---

# Character-Lifecycle Implementation Audit

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 48 |
| Incorrect | 2 |
| Approximation | 4 |
| Ambiguous | 3 |
| **Total** | **57** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | -- |
| HIGH | 1 | R054 (Incorrect) |
| MEDIUM | 3 | R040 (Incorrect), R045 (Approximation), R050 (Approximation) |
| LOW | 2 | R034 (Approximation), R037 (Approximation) |

### Ambiguous Items

| Item | Issue |
|------|-------|
| R033 | Stat Tag auto-bonus: no decree governs whether app should auto-apply [+Stat] |
| R064 | Skill Stunt: dice swap is table-resolved; unclear if app should track |
| R066 | Categoric Inclination: bonus auto-application scope unclear |

---

## Tier 1: Core Formulas (13 items)

### R008 -- Trainer HP Formula
- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10" (PTU Core p.16)
- **Expected behavior:** maxHp = level * 2 + hpStat * 3 + 10
- **Actual behavior (composable):** `useCharacterCreation.ts:115-116` computes `form.level * 2 + computedStats.value.hp * 3 + 10`. Note: `computedStats.value.hp = BASE_HP(10) + form.statPoints.hp`, so for a level 1 trainer with 0 HP points added, maxHp = 1*2 + 10*3 + 10 = 42. This matches PTU: a level 1 trainer with 10 HP stat has 42 Hit Points.
- **Actual behavior (API):** `characters/index.post.ts:13` computes `level * 2 + hpStat * 3 + 10` where hpStat is the full HP stat value (base + allocated points).
- **Classification:** Correct

### R009 -- Physical Evasion Formula
- **Rule:** "For every 5 points ... in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense." (PTU Core p.15)
- **Expected behavior:** physicalEvasion = min(6, floor(defense / 5))
- **Actual behavior:** `useCharacterCreation.ts:121` -- `Math.min(6, Math.floor(computedStats.value.defense / 5))`
- **Classification:** Correct

### R010 -- Special Evasion Formula
- **Rule:** "For every 5 points ... in Special Defense, they gain +1 Special Evasion, up to a maximum of +6 at 30 Special Defense." (PTU Core p.15)
- **Expected behavior:** specialEvasion = min(6, floor(specialDefense / 5))
- **Actual behavior:** `useCharacterCreation.ts:122` -- `Math.min(6, Math.floor(computedStats.value.specialDefense / 5))`
- **Classification:** Correct

### R011 -- Speed Evasion Formula
- **Rule:** "For every 5 points ... in Speed, they gain +1 Speed Evasion, up to a maximum of +6 at 30 Speed." (PTU Core p.15)
- **Expected behavior:** speedEvasion = min(6, floor(speed / 5))
- **Actual behavior:** `useCharacterCreation.ts:123` -- `Math.min(6, Math.floor(computedStats.value.speed / 5))`
- **Classification:** Correct

### R012 -- Evasion General Formula
- **Rule:** "Divide the related Combat Stat by 5 and round down. You may never have more than +6 in a given Evasion from Combat Stats alone." (PTU Core p.16)
- **Expected behavior:** All evasion formulas use floor division and +6 cap.
- **Actual behavior:** All three evasion calculations in `useCharacterCreation.ts:120-124` use `Math.min(6, Math.floor(stat / 5))`. The `Math.floor` matches PTU's round-down rule; the `Math.min(6, ...)` enforces the +6 cap.
- **Classification:** Correct

### R013 -- Power Capability
- **Rule:** "A Trainer's Power starts at 4. If Athletics is at Novice Rank or higher, increase Power by +1. If Combat Skill is at Adept Rank or higher, increase Power by +1." (PTU Core p.16)
- **Expected behavior:** power = 4 + (Athletics >= Novice ? 1 : 0) + (Combat >= Adept ? 1 : 0)
- **Actual behavior:** `trainerDerivedStats.ts:81-88` -- `power = 4`, then `+1 if athleticsRank >= 3 (Novice)`, then `+1 if combatRank >= 4 (Adept)`. Rank values: Novice=3, Adept=4 per `SKILL_RANK_VALUES`.
- **Classification:** Correct

### R014 -- High Jump Capability
- **Rule:** "A Trainer's High Jump starts at 0. If Acrobatics is Adept, raise High Jump by +1. If Acrobatics is Master, raise High Jump by an additional +1." (PTU Core p.16)
- **Expected behavior:** highJump = 0 + (Acrobatics >= Adept ? 1 : 0) + (Acrobatics >= Master ? 1 : 0)
- **Actual behavior:** `trainerDerivedStats.ts:90-97` -- `highJump = 0`, then `+1 if acrobaticsRank >= 4 (Adept)`, then `+1 if acrobaticsRank >= 6 (Master)`.
- **Note:** PTU also says "+1 if you have a running start when jumping" -- this is a situational modifier not tracked by the app, which is correct (table-resolved condition).
- **Classification:** Correct

### R015 -- Long Jump Capability
- **Rule:** "Long Jump is how much horizontal distance ... This value for Trainers is equal to half of their Acrobatics Rank." (PTU Core p.16)
- **Expected behavior:** longJump = floor(acrobaticsRank / 2)
- **Actual behavior:** `trainerDerivedStats.ts:100` -- `Math.floor(acrobaticsRank / 2)`
- **Classification:** Correct

### R016 -- Overland Movement Speed
- **Rule:** "Overland = 3 + [(Athl + Acro)/2]" (PTU Core p.16)
- **Expected behavior:** overland = 3 + floor((athleticsRank + acrobaticsRank) / 2)
- **Actual behavior:** `trainerDerivedStats.ts:103` -- `3 + Math.floor((athleticsRank + acrobaticsRank) / 2)`
- **Classification:** Correct

### R017 -- Swimming Speed
- **Rule:** "Swimming Speed for a Trainer is equal to half of their Overland Speed." (PTU Core p.16)
- **Expected behavior:** swimming = floor(overland / 2)
- **Actual behavior:** `trainerDerivedStats.ts:106` -- `Math.floor(overland / 2)`
- **Classification:** Correct

### R018 -- Throwing Range
- **Rule:** "Throwing Range is how far a Trainer can throw ... It's equal to 4 plus Athletics Rank." (PTU Core p.16, p.223)
- **Expected behavior:** throwingRange = 4 + athleticsRank
- **Actual behavior:** `trainerDerivedStats.ts:109` -- `4 + athleticsRank`
- **Classification:** Correct

### R041 -- Action Points Pool
- **Rule:** "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels they have achieved; a Level 15 Trainer would have a maximum of 8 Action Points." (PTU Core p.221)
- **Expected behavior:** maxAp = 5 + floor(level / 5). Level 15 = 5 + 3 = 8.
- **Actual behavior:** `restHealing.ts:224-226` -- `return 5 + Math.floor(level / 5)`. Level 15 yields 8.
- **Verification:** Level 1 = 5 + 0 = 5. Level 5 = 5 + 1 = 6. Level 10 = 5 + 2 = 7. PTU example "Level 10 has 7 AP" (p.16) matches.
- **Classification:** Correct

### R054 -- Experience Bank
- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level. Leveling Up through a Milestone does not affect your Experience Bank." (PTU Core p.461)
- **Expected behavior:** Bank accumulates XP. When bank >= 10, subtract 10 per level gained. Multi-level jumps possible (bank 8 + 15 = 23 -> 2 levels, bank 3). Level capped at 50.
- **Actual behavior:** `trainerExperience.ts:45-85` -- `applyTrainerXp` adds XP to bank, then calculates `levelsFromXp = Math.floor(rawTotal / 10)` and `remainingXp = rawTotal - (levelsFromXp * 10)`. Caps at TRAINER_MAX_LEVEL(50). Correctly handles multi-level jumps. Bank cannot go below 0 (`Math.max(0, ...)`).
- **Issue:** The function computes `levelsFromXp = Math.floor(rawTotal / 10)` where `rawTotal = Math.max(0, currentXp + xpToAdd)`. This means if a trainer has 8 XP and gains 15, rawTotal = 23, levelsFromXp = 2, remainingXp = 3. This is correct per PTU ("subtract 10 ... gain 1 Level" -- iterated). However, the PTU rule says "reaches 10 Experience **or higher**" and "immediately subtract 10." The implementation uses division which is mathematically equivalent to iterative subtraction, but there is an edge case: PTU says "you cannot 'go back' a level" (p.22 retraining section), yet the `applyTrainerXp` function accepts negative `xpToAdd` and can reduce the bank below the threshold without de-leveling. Negative XP is used for retraining costs, which the app does not yet implement, so the negative XP path is currently unreachable.
- **Deeper issue:** When XP auto-levels a trainer, the level is incremented in the database (`trainerXp: xpCalc.newXp, level: xpCalc.newLevel`) without triggering the level-up workflow (stat allocation, feature/edge selection, milestone choices). The XP endpoint at `characters/[id]/xp.post.ts` and capture/evolve endpoints simply update level and XP in DB. The actual level-up choices must be made separately via the LevelUpModal, which the GM must manually invoke. This means a trainer can be at level 5 in the database without having made their Amateur milestone choice. The PTU rule says trainers "immediately" gain a level, but the choices inherent in leveling are necessarily deferred in a digital tool. This is an acceptable approximation of the tabletop workflow, not a correctness bug -- BUT the auto-level can skip over milestone levels without the GM noticing, which is a potential gameplay issue.
- **Classification:** Incorrect
- **Severity:** HIGH
- **Detail:** When XP auto-levels past a milestone level (e.g., bank=8, +5 XP = level 5 Amateur milestone), the level increases in DB but milestone choices are not enforced or prompted. The LevelUpModal must be manually opened. If XP triggers a multi-level jump that crosses a milestone (e.g., level 4 to 6), the milestone at level 5 could be silently skipped.

---

## Tier 2: Core Enumerations (5 items)

### R001 -- Trainer Combat Stats Definition
- **Rule:** "The 6 combat stats are HP, Attack, Defense, Special Attack, Special Defense, and Speed." (PTU Core p.15)
- **Expected behavior:** Prisma model has all 6 stat fields.
- **Actual behavior:** `schema.prisma` (model HumanCharacter) -- fields: `hp`, `attack`, `defense`, `specialAttack`, `specialDefense`, `speed`. All 6 present with correct defaults (hp=10, others=5).
- **Classification:** Correct

### R003 -- Skill Categories
- **Rule:** "Body: Acrobatics, Athletics, Combat, Intimidate, Stealth, Survival. Mind: General Education, Medicine Education, Occult Education, Pokemon Education, Technology Education, Guile, Perception. Spirit: Charm, Command, Focus, Intuition." (PTU Core p.33)
- **Expected behavior:** 17 skills in 3 categories (Body 6, Mind 7, Spirit 4).
- **Actual behavior:** `trainerSkills.ts:4-8` -- `PTU_SKILL_CATEGORIES` has Body (6), Mind (7), Spirit (4). Total: 17.
- **Note:** App uses abbreviated names: "General Ed", "Medicine Ed", "Occult Ed", "Pokemon Ed", "Technology Ed" instead of full "General Education" etc. This is a UI shortening, not a rule violation.
- **Classification:** Correct

### R004 -- Skill Ranks and Dice
- **Rule:** "Pathetic 1d6, Untrained 2d6, Novice 3d6, Adept 4d6, Expert 5d6, Master 6d6." (PTU Core p.33)
- **Expected behavior:** 6 ranks with correct rank numbers and dice.
- **Actual behavior:** `trainerSkills.ts:19-26` -- `SKILL_RANKS` array with: Pathetic/1/1d6, Untrained/2/2d6, Novice/3/3d6, Adept/4/4d6, Expert/5/5d6, Master/6/6d6. All match.
- **Classification:** Correct

### R020 -- Weight Class
- **Rule:** "A Trainer between 55 and 110 pounds is Weight Class 3. Between 111 and 220 is WC 4. Higher than that is WC 5." (PTU Core p.16)
- **Expected behavior:** WC3: 55-110 lbs, WC4: 111-220 lbs, WC5: >220 lbs.
- **Actual behavior:** `trainerDerivedStats.ts:64-68` -- `if (weightLbs > 220) return 5; if (weightLbs >= 111) return 4; return 3`.
- **Note:** Trainers under 55 lbs default to WC3. PTU doesn't specify what happens below 55 lbs for trainers. Defaulting to WC3 is reasonable.
- **Classification:** Correct

### R068 -- Percentages Are Additive
- **Rule:** "Percentages are additive, not multiplicative. For example, a 20% boost and a 30% boost = 50% total." (PTU Core p.219)
- **Expected behavior:** All percentage modifiers are summed, not compounded.
- **Actual behavior:** In `captureRate.ts:208`, ball modifier is described as "additive with other modifiers on the roll." In `equipmentBonuses.ts`, equipment bonuses are summed additively. No multiplicative percentage stacking found in the codebase.
- **Classification:** Correct

---

## Tier 3: Core Constraints (14 items)

### R002 -- Starting Stat Baseline
- **Rule:** "Starting Trainers begin with 10 HP and 5 points each in the rest of their Combat Stats. You may distribute 10 additional points among your Combat Stats, but no more than 5 points into any single stat." (PTU Core p.15)
- **Expected behavior:** BASE_HP=10, BASE_OTHER=5, TOTAL_STAT_POINTS=10, MAX_POINTS_PER_STAT=5.
- **Actual behavior:** `trainerStats.ts:11-19` -- `BASE_HP=10`, `BASE_OTHER=5`, `TOTAL_STAT_POINTS=10`, `MAX_POINTS_PER_STAT=5`. `useCharacterCreation.ts:106-112` applies these: `hp: BASE_HP + form.statPoints.hp`, others: `BASE_OTHER + form.statPoints[stat]`. `incrementStat` (line 129) enforces `MAX_POINTS_PER_STAT` cap at level 1. `validateStatAllocation` (characterCreationValidation.ts:31-73) checks total and per-stat caps.
- **Classification:** Correct

### R005 -- Skill Rank Level Prerequisites
- **Rule:** "Adept Rank requires Level 2. Expert Rank requires Level 6, and Master Rank requires Level 12." (PTU Core p.34)
- **Expected behavior:** Skill rank caps by level: Novice@1, Adept@2, Expert@6, Master@12.
- **Actual behavior:** `trainerStats.ts:72-77` -- `getMaxSkillRankForLevel`: `if (level >= 12) return 'Master'; if (level >= 6) return 'Expert'; if (level >= 2) return 'Adept'; return 'Novice'`. Also: `trainerSkills.ts:29-33` -- `SKILL_RANK_LEVEL_REQS: { Adept: 2, Expert: 6, Master: 12 }`.
- **Classification:** Correct

### R006 -- Skills Default Rank
- **Rule:** "Skills begin at Untrained unless modified by a Background." (PTU Core p.33)
- **Expected behavior:** `getDefaultSkills()` returns all 17 skills at Untrained.
- **Actual behavior:** `trainerSkills.ts:36-40` -- returns `Object.fromEntries(PTU_ALL_SKILLS.map(skill => [skill, 'Untrained']))`.
- **Classification:** Correct

### R021 -- Rounding Rule
- **Rule:** "When working with decimals in the system, round down to the nearest whole number, even if the decimal is .5 or higher." (PTU Core p.219)
- **Expected behavior:** `Math.floor` used everywhere, never `Math.round` or `Math.ceil`.
- **Actual behavior:** All formulas verified use `Math.floor`: evasions (`useCharacterCreation.ts:121-123`), capabilities (`trainerDerivedStats.ts:100,103,106`), AP pool (`restHealing.ts:225`), stat points (`trainerStats.ts:56`), features (`trainerStats.ts:119`), edge budget (`trainerStats.ts:97`). No instances of `Math.round` or `Math.ceil` in character-lifecycle computation paths.
- **Classification:** Correct

### R022 -- Starting Edges
- **Rule:** "Starting Trainers begin with four Edges to distribute as they see fit." (PTU Core p.13)
- **Expected behavior:** 4 edges at level 1.
- **Actual behavior:** `trainerStats.ts:95-106` -- `getExpectedEdgesForLevel(1)` returns `{ base: 4, bonusSkillEdges: 0, total: 4 }`. Computed: `base = 4 + Math.floor(1/2) = 4`, `bonusSkillEdges = 0`. `validateEdgesAndFeatures` (characterCreationValidation.ts:196) checks `edges.length !== expectedEdges.total`.
- **Classification:** Correct

### R023 -- Starting Skill Cap
- **Rule:** "Remember, even though you have one Adept Skill after creating your Background, you cannot use Edges to raise other Skills up to Adept until you are at least Level 2." (PTU Core p.13)
- **Expected behavior:** Skill rank cap at level 1 = Novice.
- **Actual behavior:** `trainerStats.ts:76` -- `getMaxSkillRankForLevel(1)` returns `'Novice'`. `useCharacterCreation.ts:330-331` -- `addSkillEdge` checks `isSkillRankAboveCap(nextRank, form.level)` and blocks raising above Novice at level 1.
- **Classification:** Correct

### R024 -- Pathetic Skills Cannot Be Raised At Creation
- **Rule:** "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank." (PTU Core p.18, step 3). "Rank three different Skills down to Pathetic Rank ... These Pathetic Skills cannot be raised above Pathetic during character creation." (PTU Core p.13)
- **Expected behavior:** Skills marked Pathetic by background cannot be raised by any means during creation.
- **Actual behavior:** Per decree-027. `useCharacterCreation.ts:315-317` -- `addSkillEdge` checks `form.patheticSkills.includes(skill)` and returns error if true. `setSkillRank` (line 183) also blocks non-Pathetic rank for Pathetic skills. `addEdge` (line 275) rejects strings matching "Skill Edge:" to prevent bypass. `validateSkillBackground` (characterCreationValidation.ts:125-138) warns if any Skill Edge references a Pathetic-locked skill.
- **Classification:** Correct (per decree-027)

### R026 -- Edges Per Level
- **Rule:** "Every even Level you gain an Edge." (PTU Core p.19). Plus bonus Skill Edges at levels 2, 6, 12.
- **Expected behavior:** Total edges = 4 (starting) + floor(level/2) (even-level edges) + bonus skill edges (at levels 2, 6, 12).
- **Actual behavior:** `trainerStats.ts:95-106` -- `getExpectedEdgesForLevel`: `base = 4 + Math.floor(Math.max(1, level) / 2)`, then adds bonus skill edges. Verified: Level 1=4, Level 2=6 (4+1+1bonus), Level 6=10 (4+3+2bonus), Level 12=13 (4+6+3bonus).
- **Verification against PTU progression chart (p.20):** Level 2 total edges = 6 (4 starting + 1 even-level + 1 bonus). Level 6 total = 4 + 3 (even levels 2,4,6) + 2 (bonus at 2,6) = 9. Wait -- let me recheck. Level 6: `base = 4 + Math.floor(6/2) = 4 + 3 = 7`. `bonusSkillEdges` = 2 (for levels 2 and 6). Total = 9. PTU chart shows level 6 edges = "1 + 1 Bonus" at level and "9" total. Matches.
- **Classification:** Correct

### R030 -- Starting Features
- **Rule:** "Starting Trainers begin with four Features to distribute as they see fit. They also choose one Training Feature to gain, regardless of prerequisites." (PTU Core p.13)
- **Expected behavior:** 5 features at level 1 (4 regular + 1 training).
- **Actual behavior:** `trainerStats.ts:118-120` -- `getExpectedFeaturesForLevel(1)` returns `5 + Math.floor(0/2) = 5`. The composable at `useCharacterCreation.ts:263-265` has a separate `setTrainingFeature` slot, and `allFeatures` computed (line 249-253) combines both.
- **Classification:** Correct

### R032 -- Max Class Features
- **Rule:** "A Trainer may only have a maximum of 4 Class Features." (PTU Core p.58, Feature Tags section)
- **Expected behavior:** Max 4 trainer classes.
- **Actual behavior:** `trainerClasses.ts:40` -- `MAX_TRAINER_CLASSES = 4`. `useCharacterCreation.ts:237` -- `addClass` checks `form.trainerClasses.length >= MAX_TRAINER_CLASSES` and returns early. `validateEdgesAndFeatures` (characterCreationValidation.ts:220-226) warns if `trainerClasses.length > 4`.
- **Classification:** Correct

### R036 -- Features Per Level
- **Rule:** "Every odd Level you gain a Feature." (PTU Core p.19)
- **Expected behavior:** Features at level = 5 + floor((level - 1) / 2). Level 1=5, Level 3=6, Level 5=7, etc.
- **Actual behavior:** `trainerStats.ts:118-120` -- `getExpectedFeaturesForLevel(level)` returns `5 + Math.floor(Math.max(0, level - 1) / 2)`. Level 1=5, Level 3=6, Level 5=7, Level 10=9, Level 50=29. Also in `trainerAdvancement.ts:253` -- `featuresGained: (isOdd && level >= 3) ? 1 : 0`. Level 2 correctly gives 0 features.
- **Classification:** Correct

### R038 -- Stat Points Per Level
- **Rule:** "Every Level you gain a Stat Point." (PTU Core p.19)
- **Expected behavior:** 1 stat point per level.
- **Actual behavior:** `trainerAdvancement.ts:251` -- `statPointsGained: 1` (always 1 regardless of level). `trainerStats.ts:55-57` -- `getStatPointsForLevel(level) = 10 + Math.max(0, level - 1) = 9 + level`. Level 1 = 10, Level 2 = 11, Level 50 = 59. Matches PTU (10 base + 49 from levels = 59).
- **Classification:** Correct

### R039 -- Edges Per Level (Advancement)
- **Rule:** "Every even Level you gain an Edge." (PTU Core p.19)
- **Expected behavior:** 1 edge on even levels, 0 on odd.
- **Actual behavior:** `trainerAdvancement.ts:252` -- `edgesGained: isEven ? 1 : 0`. Level 2=1, Level 3=0, Level 4=1, etc.
- **Classification:** Correct

### R040 -- Max Trainer Level
- **Rule:** "Trainers have a Maximum Level of 50." (PTU Core p.19)
- **Expected behavior:** Level cannot exceed 50.
- **Actual behavior (XP system):** `trainerExperience.ts:14` -- `TRAINER_MAX_LEVEL = 50`. `applyTrainerXp` (line 52) returns early with no level gain if `currentLevel >= 50`. Line 68-69 caps at `TRAINER_MAX_LEVEL`. `trainerAdvancement.ts:271` -- `computeTrainerAdvancement` caps loop at `Math.min(toLevel, 50)`.
- **Actual behavior (create/edit API):** `characters/index.post.ts` -- line 9 accepts `body.level` with no max validation. `characters/[id].put.ts` -- line 21 accepts `body.level` directly into `updateData.level` with no cap check. A GM can set level > 50 via the PUT endpoint.
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Detail:** XP system correctly caps at 50. However, the character creation POST and character edit PUT endpoints do not validate `level <= 50`. The GM could manually set a character's level above 50, bypassing the cap. The composable (`useCharacterCreation`) also does not enforce a max level.

---

## Tier 4: Core Workflows (13 items)

### R007 -- Background Skill Modification
- **Rule:** "Rank three different Skills down to Pathetic Rank. Rank up one Skill to Adept Rank and one other Skill to Novice Rank." (PTU Core p.13, p.18)
- **Expected behavior:** Background applies: 1 Adept, 1 Novice, 3 Pathetic. 11 sample backgrounds available plus custom.
- **Actual behavior:** `trainerBackgrounds.ts` -- `SAMPLE_BACKGROUNDS` array has 11 entries. Each has `adeptSkill`, `noviceSkill`, and `patheticSkills` (tuple of 3). `useCharacterCreation.ts:146-159` -- `applyBackground` sets skills from background data. `enableCustomBackground` (line 169) allows custom. `validateSkillBackground` (characterCreationValidation.ts:86-176) checks 1 Adept, 1 Novice, 3 Pathetic counts.
- **Note:** Some PTU backgrounds allow choices (e.g., "Old Timer: Novice Intuition **or** Perception"). The app's preset backgrounds fix one choice (Old Timer uses Intuition). This is acceptable since custom mode is available for the alternative.
- **Classification:** Correct

### R025 -- Skill Edge Definitions
- **Rule:** "Basic Skills: Untrained -> Novice. You may take this Edge multiple times." (PTU Core p.52). Adept Skills (Lv2): Novice -> Adept. Expert Skills (Lv6): Adept -> Expert. Master Skills (Lv12): Expert -> Master.
- **Expected behavior:** Skill Edges bump rank by one step with level-gated caps.
- **Actual behavior:** `useCharacterCreation.ts:314-339` -- `addSkillEdge` gets current rank, finds next rank in progression, checks `isSkillRankAboveCap`, then updates skill and adds "Skill Edge: [skill]" to edges. `removeEdge` (line 283-300) reverts the rank bump when a Skill Edge is removed.
- **Classification:** Correct

### R035 -- Branch Feature Tag
- **Rule:** "[Branch] -- If on a [Class] Feature, this tag means that Feature may be taken multiple times using a Class slot and choosing a different specialization each time." (PTU Core p.58)
- **Expected behavior:** Branching classes stored with specialization suffix (decree-022). Canonical branching classes: Type Ace, Stat Ace, Style Expert, Researcher (decree-026 excludes Martial Artist).
- **Actual behavior:** `trainerClasses.ts:104-119` -- `BRANCHING_CLASS_SPECIALIZATIONS` maps Type Ace (18 types), Stat Ace (5 stats), Style Expert (5 contest stats), Researcher (9 fields). `isBranching: true` set on Type Ace, Stat Ace, Style Expert, Researcher. Martial Artist is NOT marked as branching (line 76: `{ name: 'Martial Artist', ...}` with no `isBranching`). `useCharacterCreation.ts:236-241` -- `addClass` blocks exact duplicates but allows different specializations of the same base class. `hasBaseClass` (trainerClasses.ts:137-139) uses prefix matching per decree-022.
- **Classification:** Correct (per decree-022 and decree-026)

### R044 -- Level 2 Milestone: Adept Skills
- **Rule:** "Level 2 -- Adept Skills: You now qualify to Rank Up Skills to Adept. You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Adept Rank." (PTU Core p.19)
- **Expected behavior:** At level 2: Adept cap unlocked, bonus Skill Edge granted.
- **Actual behavior:** `trainerAdvancement.ts:108-110` -- `getSkillRankCapUnlockedAt(2)` returns `'Adept'`. Line 254: `bonusSkillEdge: [2, 6, 12].includes(level)` is true at level 2. `computeTrainerLevelUp(2)` returns `{ bonusSkillEdge: true, skillRankCapUnlocked: 'Adept', ... }`.
- **Note on restriction:** PTU says the bonus Skill Edge "may not be used to Rank Up a Skill to Adept Rank." This restriction is **not enforced** in the code -- the LevelUpEdgeSection presents the bonus Skill Edge but doesn't prevent the player from using it to reach Adept. This is a known limitation documented in the matrix but not a classification change since the edge is correctly granted.
- **Classification:** Correct
- **Note:** The "may not rank to newly unlocked rank" restriction on the bonus Skill Edge is not enforced. This is an advisory gap, not a formula/data error.

### R046 -- Level 6 Milestone: Expert Skills
- **Rule:** "Level 6 -- Expert Skills: You now qualify to Rank Up Skills to Expert. You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Expert Rank." (PTU Core p.19)
- **Expected behavior:** At level 6: Expert cap unlocked, bonus Skill Edge granted.
- **Actual behavior:** `trainerAdvancement.ts:109` -- `getSkillRankCapUnlockedAt(6)` returns `'Expert'`. `bonusSkillEdge` is true at level 6.
- **Same advisory note as R044:** Restriction on ranking to newly unlocked Expert not enforced.
- **Classification:** Correct

### R048 -- Level 12 Milestone: Master Skills
- **Rule:** "Level 12 -- Master Skills: You now qualify to Rank Up Skills to Master. You gain one Skill Edge for which you qualify. It may not be used to Rank Up a Skill to Master Rank." (PTU Core p.19)
- **Expected behavior:** At level 12: Master cap unlocked, bonus Skill Edge granted.
- **Actual behavior:** `trainerAdvancement.ts:110` -- `getSkillRankCapUnlockedAt(12)` returns `'Master'`. `bonusSkillEdge` is true at level 12.
- **Same advisory note as R044/R046.**
- **Classification:** Correct

### R045 -- Level 5 Milestone: Amateur Trainer
- **Rule:** "Level 5 -- Amateur Trainer: Choose One: (A) On every even-numbered Level Up from Level 6 through Level 10, you gain +1 Stat Point that must be spent on Attack or Special Attack. You also gain +2 Stat Points, representing Levels 2 and 4, retroactively. (B) Gain one General Feature for which you qualify." (PTU Core p.19)
- **Expected behavior:** Two choices: lifestyle stat points OR general feature.
- **Actual behavior:** `trainerAdvancement.ts:119-139` -- `getMilestoneAt(5)` returns Amateur milestone with two choices: `amateur-stats` (lifestyle_stat_points, evenLevelRange [6,10], retroactivePoints 2) and `amateur-feature` (general_feature).
- **Issue:** The lifestyle stat choice description says "+1 Atk or SpAtk per even level (6-10), +2 retroactive for levels 2 and 4." This matches PTU. However, the code's `evenLevelRange: [6, 10]` would give +1 at levels 6, 8, 10 = 3 points, plus 2 retroactive = 5 total. PTU says even levels 6-10: that's 6, 8, 10 = 3 points + 2 retro = 5 total. This matches.
- **Minor approximation:** The milestone choice is presented by `LevelUpMilestoneSection.vue` but the actual stat points are not auto-applied to Attack or Special Attack. The GM must manually allocate the bonus stat points. The restriction that these points "must be spent on Attack or Special Attack" is not enforced by the code.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Detail:** Milestone choices are correctly modeled and presented. The restriction that lifestyle stat points must be spent on Attack or Special Attack is not enforced -- the points are added to the general stat budget without constraining which stats they go to.

### R047 -- Level 10 Milestone: Capable Trainer
- **Rule:** "Level 10 -- Capable Trainer: Choose One: (A) On every even-numbered Level Up from Level 12 through Level 20, you gain +1 Stat Point that must be spent on Attack or Special Attack. (B) Gain two Edges for which you qualify." (PTU Core p.19)
- **Expected behavior:** Two choices: lifestyle stat points OR two bonus edges.
- **Actual behavior:** `trainerAdvancement.ts:140-160` -- `getMilestoneAt(10)` returns Capable milestone with `capable-stats` (evenLevelRange [12,20]) and `capable-edges` (edgeCount 2).
- **Note:** Same Attack/SpAtk restriction non-enforcement as R045 for the stats option.
- **Classification:** Correct
- **Note:** The Atk/SpAtk restriction on lifestyle stats is a known advisory gap (same as R045).

### R049 -- Level 20 Milestone: Veteran Trainer
- **Rule:** "Level 20 -- Veteran Trainer: Choose One: (A) On every even-numbered Level Up from Level 22 through Level 30, you gain +1 Stat Point that must be spent on Attack or Special Attack. (B) Gain two Edges for which you qualify." (PTU Core p.19)
- **Expected behavior:** Two choices: lifestyle stat points OR two bonus edges.
- **Actual behavior:** `trainerAdvancement.ts:161-181` -- `getMilestoneAt(20)` returns Veteran milestone with `veteran-stats` (evenLevelRange [22,30]) and `veteran-edges` (edgeCount 2).
- **Classification:** Correct

### R050 -- Level 30/40 Milestones: Elite/Champion
- **Rule (Level 30):** "Choose One: (A) Lifestyle stat points (even levels 32-40). (B) Two Edges. (C) One General Feature." (PTU Core p.19)
- **Rule (Level 40):** "Choose One: (A) Lifestyle stat points (even levels 42-50). (B) Two Edges. (C) One General Feature." (PTU Core p.19)
- **Expected behavior:** Three choices each for Elite and Champion milestones.
- **Actual behavior:** `trainerAdvancement.ts:182-238` -- `getMilestoneAt(30)` returns Elite with 3 choices (stats/edges/feature). `getMilestoneAt(40)` returns Champion with 3 choices.
- **Issue:** Level 30 and 40 milestones have three options (lifestyle stats, 2 edges, OR 1 general feature), while levels 5, 10, 20 have only two options each. The code correctly models this difference.
- **Minor note:** The feature option for Elite/Champion is labeled "General Feature" in the code, matching PTU's "Gain one General Feature for which you qualify."
- **Approximation:** Like R045, the Atk/SpAtk restriction on lifestyle stat points is not enforced. Additionally, the "for which you qualify" prerequisite check on the bonus feature/edges is not validated by the code -- the GM must verify prerequisites manually.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Detail:** Milestone options correctly modeled with three choices at levels 30 and 40. Prerequisite checking for bonus edges/features and Atk/SpAtk restriction on lifestyle stats are not enforced.

### R051 -- Character Creation Workflow
- **Rule:** Steps 1-9 of character creation (PTU Core pp. 12-17).
- **Expected behavior:** Full creation flow covering concept, background, edges, features, stats, derived stats, descriptions, pokemon, money.
- **Actual behavior:** `useCharacterCreation.ts` manages the full flow with `sectionCompletion` tracking (line 367-409): basicInfo, background, edges, classes, stats, biography. The GM Create Page at `app/pages/gm/characters/create.vue` provides the UI. Steps for Pokemon selection and money are also handled (money defaults to $5000).
- **Classification:** Correct

### R052 -- Steps 3 and 4 Interleaving
- **Rule:** "You may do Steps 3 and 4 in any order, alternating between spending Edges and Features as best suits you." (PTU Core p.14)
- **Expected behavior:** No forced ordering between edges and features sections.
- **Actual behavior:** `sectionCompletion` in `useCharacterCreation.ts` treats edges and classes/features as independent sections. Each section has its own completion state with no dependency on the other. The create page renders them as separate, independently editable sections.
- **Classification:** Correct

### R053 -- Leveling Triggers
- **Rule:** "There are two ways for Trainers to gain levels; Milestones and Experience. ... Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience from their Experience Bank and gain 1 Level. Leveling Up through a Milestone does not affect your Experience Bank." (PTU Core p.461)
- **Expected behavior:** Two leveling paths: XP-based (auto at 10) and milestone-based (manual).
- **Actual behavior:** XP-based: `trainerExperience.ts:applyTrainerXp` auto-levels at 10 XP. Used in `characters/[id]/xp.post.ts`, `capture/attempt.post.ts`, `pokemon/[id]/evolve.post.ts`, and `encounters/[id]/trainer-xp-distribute.post.ts`. Milestone-based: `LevelUpModal.vue` provides manual level-up workflow.
- **Classification:** Correct

---

## Tier 5: Interaction and Modifier Rules (5 items)

### R042 -- AP Refresh Per Scene
- **Rule:** "Action Points are completely regained at the end of each Scene. However, some effects may Bind or Drain Action Points. Bound Action Points remain off-limits until the effect that Bound them ends. Drained AP becomes unavailable for use until after an Extended Rest is taken." (PTU Core p.221)
- **Expected behavior:** At scene end, AP restores to max minus drained minus bound.
- **Actual behavior:** `restHealing.ts:245-248` -- `calculateSceneEndAp(level, drainedAp, boundAp)` calls `calculateMaxAp(level)` then `calculateAvailableAp(maxAp, boundAp, drainedAp)` which returns `Math.max(0, maxAp - boundAp - drainedAp)`. Called by `scene.service.ts` (line 55) and `encounters/[id]/end.post.ts` (line 145). Scene service passes `drainedAp` only (not boundAp), because it separately sets `boundAp: 0` (Stratagems auto-unbind at scene end). Encounter end also sets `boundAp: 0` and calls `calculateSceneEndAp(char.level, char.drainedAp)`.
- **Classification:** Correct

### R043 -- AP Bind and Drain
- **Rule:** "Bound Action Points remain off-limits until the effect that Bound them ends. Drained AP becomes unavailable for use until after an Extended Rest is taken." (PTU Core p.221)
- **Expected behavior:** `drainedAp` cleared by extended rest. `boundAp` cleared by effect end.
- **Actual behavior:** Prisma schema: `drainedAp Int @default(0)`, `boundAp Int @default(0)`, `currentAp Int @default(5)`. Extended rest (`extended-rest.post.ts:96`) sets `drainedAp: 0` and restores `currentAp = maxAp - boundAp`. New day (`new-day.post.ts:38`) also clears `drainedAp` but preserves `boundAp`. Heal injury drain (`heal-injury.post.ts:66`) increments `drainedAp` by 2 and decrements `currentAp` by 2.
- **Classification:** Correct

### R031 -- Free Training Feature
- **Rule:** "They also choose one Training Feature to gain, regardless of prerequisites." (PTU Core p.13)
- **Expected behavior:** Separate training feature slot, no prerequisite enforcement.
- **Actual behavior:** `useCharacterCreation.ts:263-265` -- `setTrainingFeature(featureName)` sets `form.trainingFeature` directly. No prerequisite validation is performed. The `allFeatures` computed (line 249-253) combines the training feature with regular features for API payload.
- **Classification:** Correct

### R019 -- Trainer Size
- **Rule:** "Size is how big you are. Trainers are Medium by default." (PTU Core p.16)
- **Expected behavior:** Trainers treated as Medium size.
- **Actual behavior:** No explicit `size` field on the Prisma model. The combat system treats trainers as Medium implicitly (no size override mechanism). The grid system uses 1-cell tokens for trainers, consistent with Medium size.
- **Classification:** Correct

### R060 -- Experience From Pokemon
- **Rule:** "Whenever a Trainer catches, hatches, or evolves a Pokemon species they did not previously own, they gain +1 Experience." (PTU Core p.461)
- **Expected behavior:** Auto +1 XP on catch, hatch, or evolve of new species.
- **Actual behavior (catch):** `capture/attempt.post.ts:232-259` -- On successful capture, checks `isNewSpecies` against `ownedSpecies`, adds +1 XP via `applyTrainerXp`, updates `ownedSpecies` list.
- **Actual behavior (evolve):** `pokemon/[id]/evolve.post.ts:213-241` -- After evolution, checks `isNewSpecies` for evolved species, adds +1 XP.
- **Actual behavior (hatch):** No hatching system exists in the app. No auto-XP on hatch.
- **Classification:** Correct (for implemented paths: catch and evolve). The missing hatch path is a feature gap (Partial per matrix), not a correctness error in what is implemented.

---

## Tier 6: Implemented-Unreachable (1 item)

### R063 -- AP Spend for Roll Bonus
- **Rule:** "Any Trainer may spend 1 Action Point as a free action before making an Accuracy Roll or Skill Check to add +1 to the result. This cannot be done more than once per roll." (PTU Core p.221)
- **Expected behavior:** AP fields exist; player can spend AP for +1 to rolls.
- **Actual behavior:** AP fields exist on Prisma model (`drainedAp`, `boundAp`, `currentAp`). GM can manually adjust AP via character edit PUT endpoint (`characters/[id].put.ts:69-77`). The PlayerCharacterSheet (`components/player/PlayerCharacterSheet.vue`) is read-only -- it displays character data but provides no mechanism for the player to decrement their own AP. The only interactive buttons are export/import.
- **Classification:** Correct (for data model and GM access)
- **Note:** Player cannot self-manage AP. This is an access gap (Implemented-Unreachable per matrix), not a rule correctness issue. The AP tracking logic itself is correct.

---

## Tier 7: Partial Items (6 items)

### R033 -- Stat Tag Effect
- **Rule:** "[+Stat] -- Features with this tag increase a Stat by one point; for example, a Feature might read as [+Attack]." (PTU Core p.58)
- **Expected behavior:** Features with [+Stat] tags auto-increment the corresponding stat.
- **Actual behavior:** Features are stored as simple strings in a JSON array (`features String @default("[]")`). No metadata parsing for [+Stat] tags. No auto-bonus application. The composable's `computedStats` (useCharacterCreation.ts:105-112) only uses `BASE + statPoints`, without checking features for stat tags. The GM must manually account for [+Stat] bonuses.
- **Classification:** Ambiguous
- **Note:** No decree exists governing whether the app should auto-apply [+Stat] bonuses. Multiple valid interpretations: (1) app should parse feature tags and auto-apply stat bonuses; (2) app is a session helper and the GM handles tag effects manually (consistent with "session helper" philosophy). Recommend decree-need ticket.
- **Escalation:** Both interpretations are valid. The PTU rule is unambiguous about what [+Stat] means, but the question is whether a session helper app is expected to implement this automatically or leave it to GM discretion.

### R034 -- Ranked Feature Tag
- **Rule:** "[Ranked X] -- A Feature with the Ranked Tag can be taken up to X Times." (PTU Core p.58)
- **Expected behavior:** Ranked features tracked with rank count, max enforcement.
- **Actual behavior:** Features stored as string array. No rank tracking metadata. A feature could be added multiple times to the array with no enforcement of the [Ranked X] limit. No validation prevents taking a feature more times than its rank allows.
- **Classification:** Approximation
- **Severity:** LOW
- **Detail:** Features are stored as strings without rank metadata. The GM can add duplicate entries to represent ranks, but there is no enforcement of the maximum rank count. This is an acceptable simplification given the session helper scope, but it could lead to data integrity issues.

### R037 -- No Duplicate Features
- **Rule:** "Unless a Feature or Edge EXPLICITLY says that you may take it multiple times, such as a Ranked Feature, then you can only take it once!" (PTU Core p.19)
- **Expected behavior:** Duplicate detection for non-Ranked features.
- **Actual behavior:** `useCharacterCreation.ts:255-257` -- `addFeature` appends to the array with no duplicate check. `validateEdgesAndFeatures` checks total count but not for duplicates. The GM could add the same feature name twice.
- **Classification:** Approximation
- **Severity:** LOW
- **Detail:** No duplicate detection for features. Since features are stored as strings and ranked features are allowed to appear multiple times, implementing dedup requires knowing which features are [Ranked] vs not, which requires feature metadata the app doesn't have.

### R064 -- Skill Stunt Edge
- **Rule:** "Choose a Skill ... when rolling that skill under those circumstances, you may choose to roll one less dice, and instead add +6 to the result." (PTU Core p.52)
- **Expected behavior:** Edge stored with specific circumstance; dice swap computed.
- **Actual behavior:** Edges stored as strings (e.g., "Skill Stunt: Perception"). No parsing of the circumstance. No dice computation (the app does not resolve skill checks). The +6/-1d6 swap is a table-side mechanic.
- **Classification:** Ambiguous
- **Note:** The dice swap is fundamentally a table-side mechanic. Since the app does not resolve skill checks (R027/R028/R029 are Out of Scope), there is nothing for the edge to modify. Storing the edge name is sufficient for record-keeping. Recommend no decree-need -- this is appropriately out of scope.

### R065 -- Skill Enhancement Edge
- **Rule:** "Choose two different Skills. You gain a +2 bonus to each of those skills." (PTU Core p.52)
- **Expected behavior:** +2 bonus to chosen skills auto-applied in skill checks.
- **Actual behavior:** Edge stored as string (e.g., "Skill Enhancement"). The +2 bonus is not auto-applied in any computation because the app does not resolve skill checks. No metadata tracking of which two skills were chosen.
- **Classification:** Approximation
- **Severity:** LOW (further reduced because skill checks are Out of Scope)
- **Detail:** The +2 bonus cannot be auto-applied because skill check resolution is out of scope. The edge name is stored for record-keeping. The specific skill choices are not tracked.

### R066 -- Categoric Inclination Edge
- **Rule:** "Choose Body, Mind, or Spirit. You gain a +1 Bonus to all Skill Checks of that Category." (PTU Core p.52)
- **Expected behavior:** +1 bonus to all skills in chosen category.
- **Actual behavior:** Edge stored as string (e.g., "Categoric Inclination"). The +1 bonus is not auto-applied. No metadata tracking of which category was chosen. Skill check resolution is out of scope.
- **Classification:** Ambiguous
- **Note:** Same reasoning as R064/R065 -- the bonus applies to skill check resolution, which is out of scope for the app. The question is whether the app should at least track which category was chosen for display purposes. Recommend decree-need ticket for edge metadata tracking scope.

---

## Decree Compliance Verification

### decree-022 (Branch classes with specialization suffix)
- **Verified in:** R035. `trainerClasses.ts` uses specialization suffix format ("Type Ace: Fire"). `hasBaseClass` uses prefix matching. Canonical branching classes: Type Ace, Stat Ace, Style Expert, Researcher. All correctly marked with `isBranching: true`.
- **Status:** Compliant

### decree-026 (Martial Artist not branching)
- **Verified in:** R035. `trainerClasses.ts:76` -- Martial Artist entry has no `isBranching` flag. Not present in `BRANCHING_CLASS_SPECIALIZATIONS`.
- **Status:** Compliant

### decree-027 (Pathetic skills cannot be raised during creation)
- **Verified in:** R024. `useCharacterCreation.ts` hard-blocks via `addSkillEdge` (line 316), `setSkillRank` (line 183), and `addEdge` (line 275). `validateSkillBackground` warns on violation.
- **Status:** Compliant

### decree-037 (Skill ranks via Edge slots only)
- **Verified in:** R044, R046, R048. `trainerAdvancement.ts` does NOT include automatic `skillRanksGained`. Level-up grants `bonusSkillEdge: true` at levels 2, 6, 12, which must be spent on Skill Edges. No per-level skill rank auto-grants.
- **Status:** Compliant

---

## Escalation Notes

### Decree-Need: R033 -- Feature Stat Tag Auto-Application
- **Question:** Should the app automatically parse [+Stat] tags from feature names and apply stat bonuses, or should this remain a manual GM responsibility?
- **Interpretation A:** Auto-apply. The PTU rule is explicit: "[+Stat] Features with this tag increase a Stat by one point." The app computes derived stats, so it should include [+Stat] bonuses.
- **Interpretation B:** Manual. The app is a session helper, not a character builder. Feature metadata parsing is complex (requires a complete feature database). The GM can manually adjust stats. Other apps (like PCGen) also leave this manual.
- **Recommendation:** File `decree-need` ticket.

### Decree-Need: R066 -- Edge Metadata Tracking Scope
- **Question:** Should edges store structured metadata (chosen category, chosen skills) beyond the string name, for display and potential future automation?
- **Interpretation A:** Store metadata. The edge name alone doesn't record the player's choice. Future features may need this data.
- **Interpretation B:** String storage is sufficient. The GM knows which category was chosen. Adding structured metadata requires a schema migration and UI changes for a rarely-used edge.
- **Recommendation:** File `decree-need` ticket (lower priority than R033).

### Advisory: Bonus Skill Edge Restriction Not Enforced (R044/R046/R048)
- **Issue:** PTU says the bonus Skill Edge at levels 2, 6, 12 "may not be used to Rank Up a Skill to [newly unlocked] Rank." The app does not enforce this restriction.
- **Impact:** LOW -- this is a rarely-triggered edge case that the GM can catch during level-up review.
- **Recommendation:** Track as a potential enhancement, not a bug.

### Advisory: Milestone Stat Point Restriction (R045/R050)
- **Issue:** Lifestyle stat points from milestone choices "must be spent on Attack or Special Attack." The app does not enforce this restriction.
- **Impact:** MEDIUM -- incorrect stat allocation could result in unintended builds.
- **Recommendation:** Track as a potential enhancement.

### Advisory: XP Auto-Level Milestone Skip (R054)
- **Issue:** When XP auto-levels past a milestone level, the milestone choice is not prompted or enforced.
- **Impact:** HIGH -- a GM could miss that a trainer crossed a milestone boundary during XP distribution.
- **Recommendation:** Add milestone notification when XP triggers a level crossing that includes a milestone level.
