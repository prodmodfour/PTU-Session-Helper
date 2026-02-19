---
domain: character-lifecycle
audited_at: 2026-02-19T18:00:00Z
audited_by: implementation-auditor
items_audited: 41
correct: 28
incorrect: 5
approximation: 8
ambiguous: 2
---

# Implementation Audit: Character Lifecycle

## Summary

| Classification | Count |
|---------------|-------|
| Correct | 28 |
| Incorrect | 5 |
| Approximation | 8 |
| Ambiguous | 2 |
| **Total** | **41** |

*Note: The Auditor Queue has 43 numbered items, but items 27 and 29 are marked "already queued above" (R003 and R008 duplicates). 41 unique items were audited. The 2 Ambiguous items are secondary aspects of R042 and R020 (already counted under Incorrect and Approximation respectively).*

### Severity Breakdown (Incorrect + Approximation)
- CRITICAL: 0
- HIGH: 1
- MEDIUM: 5
- LOW: 7

---

## Correct Items

### character-lifecycle-R001: Trainer Combat Stats Definition
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:24-30` — HumanCharacter stat columns; `app/types/character.ts:21-28` — Stats interface
- **Rule:** "The 6 combat stats are HP, Attack, Defense, Special Attack, Special Defense, and Speed."
- **Verification:** The Prisma schema defines all 6 stats as integer columns (hp, attack, defense, specialAttack, specialDefense, speed) with defaults. The Stats TypeScript interface mirrors all 6 fields exactly. Both the create endpoint (`index.post.ts:19-24`) and update endpoint (`[id].put.ts:28-33`) handle all 6 stats via nested stats object.

### character-lifecycle-R004: Skill Ranks and Dice
- **Classification:** Correct
- **Code:** `app/types/character.ts:18` — SkillRank type
- **Rule:** "There are 6 Ranks of Skills." Pathetic=1d6, Untrained=2d6, Novice=3d6, Adept=4d6, Expert=5d6, Master=6d6.
- **Verification:** The SkillRank type defines exactly 6 ranks: `'Pathetic' | 'Untrained' | 'Novice' | 'Adept' | 'Expert' | 'Master'`. The HumanSkillsTab component (`HumanSkillsTab.vue:8`) applies rank-based CSS classes for visual differentiation of all 6 ranks (pathetic, untrained, novice, adept, expert, master). The dice counts themselves are not stored (they are a table lookup handled at the physical table), which is appropriate for a GM tool.

### character-lifecycle-R006: Skills Default Rank
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:36` — skills default `"{}"`; `app/server/api/characters/index.post.ts:29` — skills default `{}`
- **Rule:** "Skills begin at Untrained unless modified by a Background."
- **Verification:** When a character is created without specifying skills, the default is an empty JSON object `{}`. Since the app stores only non-default ranks and the SkillRank type has Untrained as the baseline, any skill not in the object is implicitly Untrained. This matches the PTU rule.

### character-lifecycle-R009: Physical Evasion Formula
- **Classification:** Correct
- **Code:** `app/utils/damageCalculation.ts:91-96` — calculateEvasion()
- **Rule:** "for every 5 points a Pokemon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense."
- **Verification:** The `calculateEvasion` function computes `Math.min(6, Math.floor(applyStageModifier(baseStat, combatStage) / 5))`. For Physical Evasion, it is called with `defenseBase` and `defenseStage` (`calculate-damage.post.ts:190`). The formula correctly divides by 5, floors the result, and caps at 6. Stage-modified stats are used (consistent with PTU 07-combat.md where raising Defense via Combat Stages grants additional evasion).

### character-lifecycle-R010: Special Evasion Formula
- **Classification:** Correct
- **Code:** `app/utils/damageCalculation.ts:91-96` — calculateEvasion(); `app/server/api/encounters/[id]/calculate-damage.post.ts:191`
- **Rule:** "for every 5 points a Pokemon or Trainer has in Special Defense, they gain +1 Special Evasion, up to a maximum of +6 at 30 Special Defense."
- **Verification:** Same `calculateEvasion` function called with `spDefBase` and `spDefStage`. Formula `Math.min(6, Math.floor(modifiedSpDef / 5))` correctly implements the rule.

### character-lifecycle-R011: Speed Evasion Formula
- **Classification:** Correct
- **Code:** `app/utils/damageCalculation.ts:91-96` — calculateEvasion(); `app/server/api/encounters/[id]/calculate-damage.post.ts:192`
- **Rule:** "for every 5 points a Pokemon or Trainer has in Speed, they gain +1 Speed Evasion, up to a maximum of +6 at 30 Speed."
- **Verification:** Same `calculateEvasion` function called with `speedBase` and `speedStage`. Formula correctly implements the rule.

### character-lifecycle-R012: Evasion General Formula
- **Classification:** Correct
- **Code:** `app/utils/damageCalculation.ts:91-96` — calculateEvasion()
- **Rule:** "To calculate these Evasion values, divide the related Combat Stat by 5 and round down. You may never have more than +6 in a given Evasion from Combat Stats alone."
- **Verification:** The function uses `Math.floor` for rounding down and `Math.min(6, ...)` for the cap. The evasion from stats is capped at 6, while bonus evasion from moves/effects stacks on top (line 95: `statEvasion + evasionBonus`), correctly modeling "from Combat Stats alone" as the 6-cap scope.

### character-lifecycle-R021: Rounding Rule
- **Classification:** Correct
- **Code:** `app/utils/restHealing.ts:50` — Math.floor; `app/utils/damageCalculation.ts:92,202` — Math.floor
- **Rule:** "When working with decimals in the system, round down to the nearest whole number, even if the decimal is .5 or higher."
- **Verification:** All calculation utilities use `Math.floor` consistently. Rest healing: `Math.floor(maxHp / 16)` (line 50). Evasion: `Math.floor(applyStageModifier(...) / 5)` (line 92). Stage modifier: `Math.floor(baseStat * multiplier)` (line 202). No instances of `Math.round` or `Math.ceil` found in game mechanic calculations.

### character-lifecycle-R041: Action Points Pool
- **Classification:** Correct
- **Code:** `app/composables/useCombat.ts:174-177` — calculateMaxActionPoints()
- **Rule:** "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels they have achieved; a Level 15 Trainer would have a maximum of 8 Action Points."
- **Verification:** The function computes `5 + Math.floor(trainerLevel / 5)`. For Level 15: `5 + Math.floor(15/5) = 5 + 3 = 8`. This matches the PTU example exactly. The formula correctly handles non-multiples: Level 14 = 5 + 2 = 7, Level 16 = 5 + 3 = 8.

### character-lifecycle-R043: AP Bind and Drain
- **Classification:** Correct
- **Code:** `app/server/api/characters/[id]/heal-injury.post.ts:64-89` — drain_ap method; `app/server/api/characters/[id]/extended-rest.post.ts:74,84` — AP restore
- **Rule:** "Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **Verification:** The drain AP method (`heal-injury.post.ts:66`) adds 2 to drainedAp per injury healed. The extended rest endpoint (`extended-rest.post.ts:84`) sets `drainedAp: 0`, restoring all drained AP. This correctly models the PTU rule that drained AP is restored after an Extended Rest. Note: Bound AP is not tracked (see R042 for that distinction).

### character-lifecycle-R068: Percentages Are Additive
- **Classification:** Correct
- **Code:** `app/utils/captureRate.ts:53-130` — calculateCaptureRate()
- **Rule:** "Percentages are additive, not multiplicative."
- **Verification:** The capture rate calculator sums all modifiers additively: `base + levelModifier + hpModifier + evolutionModifier + shinyModifier + legendaryModifier + statusModifier + injuryModifier + stuckModifier + slowModifier`. No multiplicative combination of percentage modifiers exists. The rest healing utility also uses additive percentage logic (1/16th max HP is a fixed formula, not layered percentages).

### character-lifecycle-R019: Trainer Size
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:11-76` — HumanCharacter model (no size field = implicit Medium)
- **Rule:** "Size is how big you are. Trainers are Medium by default."
- **Verification:** The HumanCharacter model does not have an explicit `size` field, meaning trainers are implicitly Medium. This is consistent with the PTU rule since trainers are always Medium and no size change mechanic exists for trainers. The app does not need to store what never changes.

### character-lifecycle-R003: Skill Categories
- **Classification:** Correct
- **Code:** `app/server/services/csv-import.service.ts:123-141` — parseTrainerSheet() skill rows
- **Rule:** "The Body Skills are Acrobatics, Athletics, Combat, Intimidate, Stealth, and Survival. The Mind Skills are General Education, Medicine Education, Occult Education, Pokemon Education, Technology Education, Guile, and Perception. The Spirit Skills are Charm, Command, Focus, and Intuition."
- **Verification:** The CSV import parses all 17 skills: Acrobatics (row 12), Athletics (13), Charm (14), Combat (15), Command (16), General Ed (17), Medicine Ed (18), Occult Ed (19), Pokemon Ed (20), Technology Ed (21), Focus (22), Guile (23), Intimidate (24), Intuition (25), Perception (26), Stealth (27), Survival (28). All 17 PTU skills across all 3 categories are present. The categorization (Body/Mind/Spirit) is not stored in the data model, but all skills are individually tracked.

### character-lifecycle-R005: Skill Rank Level Prerequisites
- **Classification:** Correct
- **Code:** `app/types/character.ts:18` — SkillRank type
- **Rule:** "Adept Rank requires Level 2. Expert Rank requires Level 6, and Master Rank requires Level 12."
- **Verification:** The SkillRank type includes all six ranks. The level prerequisites are NOT enforced by code validation, but this is consistent with the app's design philosophy as a GM tool. The type correctly defines the full rank spectrum. The prerequisites are meant to be enforced by the GM during manual editing. The matrix classified this as "Implemented" because the type includes all ranks and the GM manages prerequisites, which is accurate for this app's design.

### character-lifecycle-R022: Starting Edges
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:38` — edges JSON; `app/server/api/characters/index.post.ts:31` — edges default
- **Rule:** "Starting Trainers begin with four Edges to distribute as they see fit."
- **Verification:** Edges are stored as a JSON array. The create endpoint accepts an edges array and defaults to `[]`. The 4-edge starting allocation is a character creation guideline managed by the GM, consistent with the app's design. CSV import (`csv-import.service.ts:157-173`) parses edges from the sheet.

### character-lifecycle-R030: Starting Features
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:37` — features JSON; `app/server/api/characters/index.post.ts:30` — features default
- **Rule:** "Starting Trainers begin with four Features to distribute as they see fit. They also choose one Training Feature to gain, regardless of prerequisites."
- **Verification:** Features are stored as a JSON array. The create endpoint accepts a features array and defaults to `[]`. The 4+1 starting allocation is managed by the GM. CSV import (`csv-import.service.ts:149-155`) parses features from the sheet.

### character-lifecycle-R032: Max Class Features
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:35` — trainerClasses JSON; `app/components/character/tabs/HumanClassesTab.vue:3-8`
- **Rule:** "A Trainer may only have a maximum of 4 Class Features."
- **Verification:** Trainer classes are stored as a JSON array. The HumanClassesTab component displays them. The 4-class maximum is a constraint the GM enforces, consistent with the app's design philosophy.

### character-lifecycle-R038: Stat Points Per Level
- **Classification:** Correct
- **Code:** `app/server/api/characters/[id].put.ts:27-34` — stat update handling
- **Rule:** "Every Level you gain a Stat Point. Trainers don't follow Base Relations, so feel free to spend these freely."
- **Verification:** The update endpoint allows unrestricted modification of all 6 stats. There are no base relation constraints or per-stat caps for trainers. Stats can be freely allocated, matching the PTU rule that trainers don't follow Base Relations.

### character-lifecycle-R040: Max Trainer Level
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:24` — level Int; `app/server/api/characters/index.post.ts:18` — level default; `app/pages/gm/create.vue:57` — max="100" on input
- **Rule:** "Trainers have a Maximum Level of 50."
- **Verification:** The level is stored as an integer with default 1. The create page input has `max="100"` which is higher than PTU's max of 50, but this is a UI guideline not a hard constraint. The API does not validate the max level. The GM manages the level constraint. Since the matrix classified this as "Implemented" with the note that "The max of 50 is a data constraint enforceable at the UI/API level", and the code does store and allow editing of level, this is correct for the GM-tool design. Note: the UI `max` attribute of 100 instead of 50 is a minor inconsistency but does not break functionality since the GM controls the value.

### character-lifecycle-R002: Starting Stat Baseline (Partial — present portion)
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:25-30` — stat defaults; `app/pages/gm/create.vue:251-256` — form defaults
- **Rule:** "Level 1 Trainers begin with 10 HP and 5 in each of their other Stats."
- **Verification:** Schema defaults: hp=10, attack/defense/specialAttack/specialDefense/speed=5. Create page form defaults: hp=10, others=5. These match the PTU Level 1 baselines exactly.

### character-lifecycle-R007: Background Skill Modification (Partial — present portion)
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:36` — skills JSON; `app/server/services/csv-import.service.ts:122-147` — skill parsing
- **Rule:** "Simply choose 1 Skill to raise to Adept Rank and 1 Skill to raise to Novice Rank."
- **Verification:** Skills are stored as JSON and fully editable. CSV import correctly parses all skill ranks from the sheet. The present portion (data storage and editability) is correctly implemented.

### character-lifecycle-R025: Skill Edge Definitions (Partial — present portion)
- **Classification:** Correct
- **Code:** `app/types/character.ts:18` — SkillRank type; `app/prisma/schema.prisma:38` — edges JSON
- **Rule:** "Basic Skills: Rank Up from Pathetic to Untrained or Untrained to Novice. Adept Skills [Level 2]... Expert Skills [Level 6]... Master Skills [Level 12]..."
- **Verification:** The SkillRank type includes all 6 ranks. Edges are stored as a JSON array of names. The Skill Edge type distinctions (Basic, Adept, Expert, Master) are not enforced by code but the data storage supports all rank values. The present portion is correct.

### character-lifecycle-R026: Edges Per Level (Partial — present portion)
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:38` — edges JSON; `app/server/api/characters/[id].put.ts` — update
- **Rule:** "You gain 4 Edges during character creation, another at every even Level..."
- **Verification:** Edges are stored as a JSON array and can be modified through the create and update endpoints. The present portion (data storage and editability) is correct.

### character-lifecycle-R036: Features Per Level (Partial — present portion)
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:37` — features JSON
- **Rule:** "Every odd Level you gain a Feature."
- **Verification:** Features are stored as a JSON array. The present portion (data storage) is correct.

### character-lifecycle-R039: Edges Per Level Advancement (Partial — present portion)
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:38` — edges JSON
- **Rule:** "Every even Level you gain an Edge."
- **Verification:** Edges are stored and editable. The present portion is correct.

### character-lifecycle-R053: Leveling Triggers (Partial — present portion)
- **Classification:** Correct
- **Code:** `app/server/api/characters/[id].put.ts:19` — level update
- **Rule:** "In Pokemon Tabletop United, there are two ways for Trainers to gain levels; Milestones and Experience."
- **Verification:** The level field is editable via the update endpoint. The GM can manually change a character's level. The present portion (level field editability) is correct.

### character-lifecycle-R054: Experience Bank (Partial — present portion)
- **Classification:** Correct
- **Code:** `app/server/api/characters/[id].put.ts:19` — level update
- **Rule:** "Whenever a Trainer reaches 10 Experience or higher, they immediately subtract 10 Experience and gain 1 Level."
- **Verification:** The level field can be manually incremented. The present portion (manual level increment) is correct.

### character-lifecycle-R060: Experience From Pokemon (Partial — present portion)
- **Classification:** Correct
- **Code:** `app/server/api/capture/attempt.post.ts:92-98` — capture auto-link
- **Rule:** "Whenever a Trainer catches, hatches, or evolves a Pokemon species they did not previously own, they gain +1 Experience."
- **Verification:** The capture system sets `origin: 'captured'` and links the Pokemon to the trainer via `ownerId`. The present portion (capture linking) is correctly implemented.

---

## Incorrect Items

### character-lifecycle-R008: Trainer HP Formula
- **Classification:** Incorrect
- **Severity:** HIGH
- **Code:** `app/pages/gm/create.vue:295-296` — createHuman(); `app/server/api/characters/index.post.ts:25-26` — maxHp default
- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10"
- **Expected:** When creating a character at Level 1 with HP stat 10, maxHp should be `1*2 + 10*3 + 10 = 42`. The create page should compute the Trainer HP formula from level and HP stat.
- **Actual:** The create page (`create.vue:295-296`) sets `currentHp: humanForm.value.hp` and `maxHp: humanForm.value.hp`. For a Level 1 character with HP stat 10, this sets maxHp=10 instead of 42. The create API endpoint defaults maxHp to 10 (`index.post.ts:26`). The Trainer HP formula is never computed anywhere in the human character creation path. By contrast, the Pokemon HP formula IS correctly computed in the same file (`create.vue:313`): `level + (baseHp * 3) + 10`.
- **Evidence:** CSV import (`csv-import.service.ts:111,320-321`) reads maxHp from the sheet directly, which is correct since the sheet pre-computes it. But manual creation through the UI always sets maxHp to the raw HP stat value (10 for a level 1 trainer), not the derived value (42).

### character-lifecycle-R033: Stat Tag Effect
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `app/server/api/characters/[id].put.ts:1-92` — update endpoint
- **Rule:** "[+Stat] - Features with this tag increase a Stat by one point."
- **Expected:** The update endpoint should support updating features and edges so the GM can add features (which may have [+Stat] tags that the GM then manually reflects by updating stats).
- **Actual:** The PUT endpoint at `[id].put.ts` does NOT handle `features` or `edges` fields. Lines 36-40 handle trainerClasses, skills, inventory, statusConditions, and stageModifiers, but there is no `if (body.features !== undefined)` or `if (body.edges !== undefined)` handler. The GM cannot update features or edges through the API's update endpoint. The matrix says "Feature stat bonuses are reflected by the GM manually adjusting stats when features are added" -- but the GM cannot add features through the update endpoint in the first place.
- **Evidence:** Reading `[id].put.ts` in full: fields handled are name, characterType, level, currentHp, money, avatarUrl, isInLibrary, notes, location, stats (nested), trainerClasses, skills, inventory, statusConditions, stageModifiers, maxHp, injuries, drainedAp, restMinutesToday, injuriesHealedToday, lastInjuryTime, lastRestReset. No `features` or `edges` handling.

### character-lifecycle-R037: No Duplicate Features
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `app/server/api/characters/[id].put.ts:1-92` — update endpoint (features not updateable)
- **Rule:** "Unless a Feature or Edge EXPLICITLY says that you may take it multiple times, such as a Ranked Feature, then you can only take it once!"
- **Expected:** Features should be editable via the update endpoint so the GM can manage the feature list (even if duplicate prevention is manual).
- **Actual:** The PUT endpoint does not accept `features` or `edges` in the request body. Features and edges can only be set at creation time or via CSV import. The matrix classified this as "Implemented" with the note "Duplicate prevention is managed by the GM during editing" -- but the GM cannot edit features through the update endpoint at all. The features set at creation (or CSV import) are frozen.
- **Evidence:** Same as R033 — the `[id].put.ts` endpoint lacks `features` and `edges` field handling.

### character-lifecycle-R055: Retraining Costs
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `app/server/api/characters/[id].put.ts:1-92` — update endpoint
- **Rule:** "You may spend 2 Trainer Experience to Retrain a Feature. You may spend 1 Trainer Experience to Retrain an Edge."
- **Expected:** The update endpoint should support modifying features and edges so the GM can apply retraining changes.
- **Actual:** The PUT endpoint does not accept `features` or `edges` fields. Retraining (swapping features or edges) cannot be performed through the update API. The matrix says "Features, edges, and stats can be freely edited via the character update endpoint" — this is incorrect for features and edges.
- **Evidence:** Same as R033 — missing `features`/`edges` handling in `[id].put.ts`.

### character-lifecycle-R042: AP Refresh Per Scene
- **Classification:** Incorrect
- **Severity:** LOW
- **Code:** `app/server/api/characters/[id]/extended-rest.post.ts:84` — drainedAp reset; `app/prisma/schema.prisma:55` — drainedAp field
- **Rule:** "Action Points are completely regained at the end of each Scene."
- **Expected:** AP should be fully restored (available AP = max AP) at the end of each scene. Bound AP should be released. Only Drained AP should persist across scenes (until Extended Rest).
- **Actual:** The app tracks only `drainedAp` (restored by extended rest). There is no scene-end AP restoration mechanism. The drainedAp field tracks permanently drained AP correctly, but the per-scene AP pool (which includes Bound AP that should be released at scene end) is not tracked or refreshed. The matrix says "Scene-end AP refresh is handled implicitly" but there is no code that refreshes AP at scene boundaries. The combat system calculates max AP (`useCombat.ts:176-177`) but does not track current available AP or trigger a scene-end restoration.
- **Evidence:** There is no endpoint or function that restores AP at scene end. The only AP-related operations are: (1) draining AP via heal-injury, (2) restoring drained AP via extended rest, (3) calculating max AP in useCombat.ts. Scene-end AP refresh is missing entirely.

---

## Approximation Items

### character-lifecycle-R020: Weight Class
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/prisma/schema.prisma:21` — weight Int (in kg)
- **Rule:** "A Trainer between 55 and 110 pounds is Weight Class 3. Between 111 and 220 is WC 4. Higher than that is WC 5."
- **Expected:** Weight class should be derived from the weight field using the PTU pound thresholds (55-110 = WC3, 111-220 = WC4, 221+ = WC5).
- **Actual:** The weight field stores weight in kilograms (schema comment: "in kg"). There is no weight class derivation function anywhere in the codebase. The weight is displayed as a raw number on the character sheet. The conversion from kg to pounds (for PTU thresholds) and the derivation of weight class from weight are both absent.
- **What's Missing:** A function to derive weight class from weight (with kg-to-lbs conversion), and display of the derived weight class on the character sheet.

### character-lifecycle-R013: Power Capability (Partial — present portion)
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/prisma/schema.prisma:36` — skills JSON
- **Rule:** "A Trainer's Power starts at 4 but is changed by several factors. If your Athletics Skill is at Novice Rank or higher, increase Power by +1. If your Combat Skill is at Adept Rank or higher, increase Power by +1."
- **Expected:** Power should be derivable from stored skill ranks.
- **Actual:** Skills including Athletics and Combat ranks are stored and accessible. However, no Power derivation function exists. The skills data is present but the derivation is not implemented.
- **What's Missing:** A `calculateTrainerPower(skills)` function that reads Athletics and Combat ranks and computes `4 + (Athletics >= Novice ? 1 : 0) + (Combat >= Adept ? 1 : 0)`.

### character-lifecycle-R016: Overland Movement Speed (Partial — present portion)
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/prisma/schema.prisma:36` — skills JSON
- **Rule:** "Overland = 3 + [(Athl + Acro)/2]"
- **Expected:** Overland speed should be derivable from Athletics and Acrobatics ranks.
- **Actual:** Skills including Athletics and Acrobatics are stored and accessible. However, no trainer Overland speed derivation function exists. The formula requires converting skill rank names to numeric values (Pathetic=0, Untrained=1, Novice=2, Adept=3, Expert=4, Master=5) then computing `3 + floor((Athletics + Acrobatics) / 2)`.
- **What's Missing:** A skill-rank-to-number converter and a `calculateTrainerOverland(skills)` function.

### character-lifecycle-R018: Throwing Range (Partial — present portion)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/prisma/schema.prisma:36` — skills JSON
- **Rule:** "Throwing Range is how far a Trainer can throw Poke Balls and other items. It's equal to 4 plus Athletics Rank."
- **Expected:** Throwing Range should be derivable from Athletics rank. This is particularly important because it affects Poke Ball throwing range in the capture system.
- **Actual:** Athletics rank is stored and accessible. However, no Throwing Range derivation function exists. The capture system does not use throwing range for determining if a Poke Ball throw is in range.
- **What's Missing:** A `calculateThrowingRange(athleticsRank)` function. Higher priority than other derived stats because it intersects with the capture system.

### character-lifecycle-R051: Character Creation Workflow (Partial — present portion)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/pages/gm/create.vue:35-107` — human creation form
- **Rule:** "Step 1: Create Character Concept. Step 2: Create Skill Background. Step 3: Choose Edges. Step 4: Choose Features. Step 5: Assign Combat Stats. Step 6: Find Derived Stats. Step 7: Create Basic Descriptions. Step 8: Choose your Starter Pokemon. Step 9: Buy starting items."
- **Expected:** The create page should cover at minimum the fields needed for a basic character (name, stats, edges, features, skills, notes).
- **Actual:** The create form only has: name, characterType, level, location (for NPCs), 6 stats, and notes. It does NOT include fields for edges, features, skills, trainerClasses, background, personality, goals, age, gender, playedBy, or inventory. The form covers only Step 5 (stats) partially and Step 7 (descriptions) minimally. Key character data (edges, features, skills) can only be populated via CSV import, not through the manual creation form.
- **What's Missing:** Form fields for edges, features, skills, trainerClasses, and other character creation data. The CSV import path covers all fields but the manual creation path is severely limited.

### character-lifecycle-R014: High Jump Capability (Partial — present portion)
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/prisma/schema.prisma:36` — skills JSON
- **Rule:** "A Trainer's High Jump starts at 0, but is raised by several factors. If your Acrobatics is Adept, raise High Jump by +1. If your Acrobatics is Master, raise High Jump by an additional +1."
- **Expected:** High Jump should be derivable from Acrobatics rank.
- **Actual:** Acrobatics rank is stored and accessible. No High Jump derivation function exists.
- **What's Missing:** A `calculateHighJump(acrobaticsRank)` function.

### character-lifecycle-R015: Long Jump Capability (Partial — present portion)
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/prisma/schema.prisma:36` — skills JSON
- **Rule:** "Long Jump is how much horizontal distance a Trainer or Pokemon can jump in meters. This value for Trainers is equal to half of their Acrobatics Rank."
- **Expected:** Long Jump should be derivable from Acrobatics rank.
- **Actual:** Acrobatics rank is stored and accessible. No Long Jump derivation function exists.
- **What's Missing:** A `calculateLongJump(acrobaticsRank)` function.

### character-lifecycle-R017: Swimming Speed (Partial — present portion)
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/prisma/schema.prisma:30` — speed stat
- **Rule:** "Swimming Speed for a Trainer is equal to half of their Overland Speed."
- **Expected:** Swimming speed should be derivable from Overland speed (which itself is derived from skills).
- **Actual:** Speed stat exists. However, since Overland speed itself is not derived (see R016), Swimming speed cannot be derived either. Both require the same skill-rank-to-number conversion infrastructure.
- **What's Missing:** First implement R016 (Overland), then Swimming = floor(Overland / 2).

---

## Ambiguous Items

### character-lifecycle-R042 (secondary aspect): AP Scene Refresh vs Drain Interaction
- **Classification:** Ambiguous
- **Code:** `app/prisma/schema.prisma:55` — drainedAp field
- **Rule:** "Action Points are completely regained at the end of each Scene. However, some effects may Bind or Drain Action Points... Drained AP becomes unavailable for use until after an Extended Rest is taken."
- **Interpretation A:** At scene end, all AP are restored to max minus drained. "Completely regained" means the scene-available pool resets, but drained AP remains drained. So available AP = maxAP - drainedAP at start of each scene.
- **Interpretation B:** At scene end, available AP = maxAP (the "completely regained" overrides drain). Drain only matters within the current scene.
- **Code follows:** Interpretation A — the drainedAp field persists across scenes and is only restored by Extended Rest. The available AP at any point = maxAP - drainedAP.
- **Action:** Escalate to Game Logic Reviewer. Note: Interpretation A is almost certainly correct based on the rule text ("Drained AP becomes unavailable for use until after an Extended Rest"), but the interaction with "completely regained" could be read either way.

### character-lifecycle-R020 (secondary aspect): Weight Class Thresholds — Pounds vs Kilograms
- **Classification:** Ambiguous
- **Code:** `app/prisma/schema.prisma:21` — weight Int (comment: "in kg")
- **Rule:** "A Trainer between 55 and 110 pounds is Weight Class 3. Between 111 and 220 is WC 4."
- **Interpretation A:** The weight field stores kg, and the app should convert to pounds for weight class determination. The PTU rule uses pounds as stated.
- **Interpretation B:** The weight field stores kg, and the weight class thresholds should be converted to kg equivalents (25-50kg = WC3, 50-100kg = WC4, 100+ = WC5). The app targets a modern/international audience.
- **Code follows:** Neither — no weight class derivation exists. The weight field stores kg per the schema comment, but no conversion or classification occurs.
- **Action:** Escalate to Game Logic Reviewer. The PTU book uses pounds; the app schema says kg. When implementing weight class derivation, the unit system needs a decision.

---

## Additional Observations

### Observation 1: Players endpoint uses HP stat instead of maxHp
The `GET /api/characters/players` endpoint (`players.get.ts:36`) returns `maxHp: char.hp` instead of `maxHp: char.maxHp`. This means the players list (used in encounter/lobby display) shows the HP stat value (e.g., 10 for a default character) as the max HP, not the derived Trainer Hit Points (e.g., 42 for a Level 1 trainer with 10 HP stat). This is likely a bug but is outside the audit queue scope.

### Observation 2: Features and edges not updateable via PUT endpoint
The PUT `/api/characters/:id` endpoint does not handle `features` or `edges` fields. This is documented as an Incorrect finding for R033, R037, and R055, but the impact is broader: it means the entire character sheet edit flow cannot modify features, edges, or the response does not return them. The response object at lines 56-82 also does not return `features`, `edges`, `background`, `personality`, `goals`, `playedBy`, `age`, `gender`, `height`, `weight`, `injuries`, `temporaryHp`, `drainedAp`, `restMinutesToday`, or `injuriesHealedToday`. Several fields are writable via the endpoint but not returned in the response.

### Observation 3: Create page level max is 100, not 50
The create page (`create.vue:57`) sets `max="100"` on the level input, while PTU's maximum trainer level is 50. This is a minor UI inconsistency.
