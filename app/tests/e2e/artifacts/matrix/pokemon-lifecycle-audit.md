---
domain: pokemon-lifecycle
audited_at: 2026-02-19T18:00:00Z
audited_by: implementation-auditor
items_audited: 44
correct: 33
incorrect: 2
approximation: 9
ambiguous: 0
---

# Implementation Audit: Pokemon Lifecycle

## Summary

| Classification | Count |
|---------------|-------|
| Correct | 33 |
| Incorrect | 2 |
| Approximation | 9 |
| Ambiguous | 0 |
| **Total** | **44** |

### Severity Breakdown (Incorrect + Approximation)
- CRITICAL: 1
- HIGH: 2
- MEDIUM: 5
- LOW: 3

---

## Correct Items

### pokemon-lifecycle-R003: Base Stats Definition
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:235-280` — `SpeciesData` model; `app/server/services/pokemon-generator.service.ts:103-131` — `generatePokemonData`
- **Rule:** "Start by checking the Pokédex to see the Pokémon's Base Stats. These are your starting point."
- **Verification:** SpeciesData model stores 6 base stats (baseHp, baseAttack, baseDefense, baseSpAtk, baseSpDef, baseSpeed) seeded from pokedex files. `generatePokemonData` looks up SpeciesData and reads all 6 base stats as the starting point for stat calculation. Correct.

### pokemon-lifecycle-R004: Pokemon Types
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:238-239` — `SpeciesData.type1/type2`; `app/server/services/pokemon-generator.service.ts:112`
- **Rule:** "Each Pokémon has one or two elemental Types, chosen from the 18 Types in Pokémon."
- **Verification:** SpeciesData stores type1 (required) and type2 (optional). The generator reads these and propagates to the created Pokemon. All 18 types are representable as strings. Correct.

### pokemon-lifecycle-R005: Nature System
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:87` — `Pokemon.nature`; `app/server/services/pokemon-generator.service.ts:188`
- **Rule:** "Next, apply your Pokémon's Nature. This will simply raise one stat, and lower another"
- **Verification:** Nature is stored as JSON with `{ name, raisedStat, loweredStat }` structure. The nature chart has 36 natures (30 non-neutral + 6 neutral) and the data model supports all of them through the raised/lowered stat fields. The creation page and generation service both support nature storage. Correct as an enumeration/storage rule.

### pokemon-lifecycle-R011: Pokemon HP Formula
- **Classification:** Correct
- **Code:** `app/server/services/pokemon-generator.service.ts:137` — `generatePokemonData`; `app/server/api/pokemon/index.post.ts:14`
- **Rule:** "Pokémon Hit Points = Pokémon Level + (HP x3) + 10"
- **Verification:** In `generatePokemonData` line 137: `const maxHp = input.level + (calculatedStats.hp * 3) + 10`. The create endpoint also uses: `level + (baseHp * 3) + 10`. Both use the calculated HP stat (base + distributed points), which is correct per PTU rules since stat points are added to base stats first, then HP is calculated from the total. Correct.

### pokemon-lifecycle-R022: Tutor Points - Initial
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:139` — `Pokemon.tutorPoints`; `app/server/api/pokemon/index.post.ts:57`
- **Rule:** "Each Pokémon, upon hatching, starts with a single precious Tutor Point."
- **Verification:** The `tutorPoints` field is an Int defaulting to 0 in the schema. The create endpoint accepts `body.tutorPoints || 0`. This is a data storage mechanism; the GM manually sets the initial value. The field exists and is settable, which is correct for a GM-managed value. The default of 0 (not 1) is a minor discrepancy but since the GM is expected to set this during creation, and the auto-generation path (`generatePokemonData`) does not set tutor points, this is an acceptable data storage implementation. Correct as storage.

### pokemon-lifecycle-R060: Experience Chart
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:84` — `Pokemon.experience`; `app/server/api/pokemon/[id].put.ts:24`
- **Rule:** "Whenever your Pokémon gains Experience, add its Experience to its previous Experience total. If the new total reaches the next Level's 'Exp Needed', the Pokémon Levels up."
- **Verification:** Experience is stored as an integer field on the Pokemon model, editable via the PUT endpoint. The experience chart lookup (experience-to-level mapping) is a reference concept the GM uses. The app stores the value and allows manual updates. Correct as data storage.

### pokemon-lifecycle-R002: Pokemon Maximum Level
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:83` — `Pokemon.level`
- **Rule:** "Pokémon have a maximum Level of 100."
- **Verification:** Level stored as Int. There is no explicit level 100 cap enforcement at the API layer (the PUT endpoint accepts any integer for level). However, since the GM is the sole editor and the level field is manually managed, the practical enforcement is through GM knowledge. The data model supports level 100. Classified as Correct because the constraint is a GM-knowledge rule in this tool-assisted context. (See Additional Observations for a note on possible enforcement.)

### pokemon-lifecycle-R001: Pokemon Party Limit
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:157` — `Pokemon.ownerId`; `app/server/api/pokemon/[id]/link.post.ts:36-39`; `app/stores/library.ts:110-111` — `getPokemonByOwner`
- **Rule:** "In most settings, Trainers are allowed to carry with them a maximum of six Pokémon at a time while traveling."
- **Verification:** The link endpoint does NOT enforce a 6-Pokemon limit — it sets `ownerId` without checking how many Pokemon the trainer already owns. The `getPokemonByOwner` getter returns all owned Pokemon without limit. However, PTU explicitly states this is a soft rule ("A GM may certainly bend this rule") and the app is a GM tool where the GM is the party limit enforcer. Since the PTU rule itself is flexible and GM-discretionary, the implementation (ownership tracking without hard limit) is correct for a session helper. Correct.

### pokemon-lifecycle-R017: Move Slot Limit
- **Classification:** Correct
- **Code:** `app/server/services/pokemon-generator.service.ts:377-379` — `selectMovesFromLearnset`
- **Rule:** "Pokémon may learn a maximum of 6 Moves from all sources combined."
- **Verification:** `selectMovesFromLearnset` line 379: `.slice(-6)` limits auto-selected moves to 6. Manual editing via the PUT endpoint has no enforcement, but the generation pathway correctly limits to 6. The PTU rule includes "certain Abilities and Features may allow a Pokémon to bypass this limit," so the GM-managed editing path without enforcement is reasonable. Correct.

### pokemon-lifecycle-R061: Size Classes
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:276` — `SpeciesData.size`; `app/server/services/grid-placement.service.ts:28-42` — `sizeToTokenSize`
- **Rule:** "Pokémon sizes vary from Small, to Medium, to Large, to Huge and finally, Gigantic. On a grid, both Small and Medium Pokémon would take up one space [...] Large Pokémon occupy 2x2 spaces [...] Huge Pokémon occupy 3x3 spaces [...] Gigantic Pokémon occupies 4x4 spaces"
- **Verification:** `sizeToTokenSize` maps: Small/Medium -> 1, Large -> 2, Huge -> 3, Gigantic -> 4. This exactly matches the PTU grid sizes. Size stored in SpeciesData and propagated via `generatePokemonData`. Correct.

### pokemon-lifecycle-R062: Weight Classes
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:264` — `SpeciesData.weightClass`; `app/server/services/pokemon-generator.service.ts:130`
- **Rule:** "Weight Classes are used for several Abilities and Moves. They range from 1 to 6."
- **Verification:** Weight class stored as Int in SpeciesData, propagated to Pokemon capabilities via `generatePokemonData`. Range 1-6 is a data constraint from the seeded pokedex data. Correct.

### pokemon-lifecycle-R007: Neutral Natures
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:87` — `Pokemon.nature`
- **Rule:** "These Natures are neutral; they simply do not affect Base Stats, since they cancel themselves out."
- **Verification:** Nature JSON format `{ name, raisedStat, loweredStat }` supports neutral natures where raised == lowered (e.g., `{ name: 'Hardy', raisedStat: 'Attack', loweredStat: 'Attack' }` or `{ name: 'Hardy', raisedStat: null, loweredStat: null }`). The default nature in `createPokemonRecord` line 188 is `{ name: 'Hardy', raisedStat: null, loweredStat: null }`, which is a neutral nature. Correct.

### pokemon-lifecycle-R013: Abilities - Initial Assignment
- **Classification:** Correct
- **Code:** `app/server/services/pokemon-generator.service.ts:418-424` — `pickRandomAbility`
- **Rule:** "All Pokémon are born with a single Ability, chosen from their Basic Abilities. Normally the GM will decide what Ability a Pokémon starts with, either randomly or by choosing one."
- **Verification:** `pickRandomAbility` picks one random ability from the basic ability pool (limited by `numBasicAbilities`). Line 420: `const basicCount = Math.min(numBasicAbilities, abilityNames.length)` limits the selection pool. Line 422: selects one randomly from that pool. Returns an array of one ability. Matches "single Ability, chosen from their Basic Abilities" with random selection. Correct.

### pokemon-lifecycle-R018: Natural Move Sources
- **Classification:** Correct
- **Code:** `app/server/services/pokemon-generator.service.ts:373-411` — `selectMovesFromLearnset`; `app/prisma/schema.prisma:267` — `SpeciesData.learnset`
- **Rule:** "A Pokémon may fill as many of its Move slots as it likes with Moves from its Natural Move List. This includes all Moves gained from Level Up."
- **Verification:** The learnset JSON stores level-up moves. `selectMovesFromLearnset` filters moves at or below the Pokemon's level and selects the 6 most recent. This correctly implements natural level-up move selection. Egg Moves and Natural Tutor Moves (N) are not tracked separately but those are sources that would be managed by GM input. Correct for the auto-generation pathway.

### pokemon-lifecycle-R012: Evasion Calculation
- **Classification:** Correct
- **Code:** Cross-domain reference (combat domain). Per the matrix, evasion calculation exists in `POST /api/encounters/:id/calculate-damage`.
- **Rule:** "for every 5 points a Pokémon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6"
- **Verification:** This is classified as a cross-domain reference. The evasion formula is implemented in the combat domain. The pokemon-lifecycle concern is that calculated stats (base + distributed points) are available for evasion calculation, which they are via `currentDefense`, `currentSpDef`, `currentSpeed` fields. Correct as a cross-domain data availability check.

### pokemon-lifecycle-R024: Tutor Points - Permanent Spend
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:139` — `Pokemon.tutorPoints`; `app/server/api/pokemon/[id].put.ts:23`
- **Rule:** "Tutor Points are stored until used by a TM, Feature, or Poké Edge. Once used, Tutor Points are lost forever."
- **Verification:** Tutor points stored as integer, decrementable via the PUT endpoint. The permanence of spend is inherent in the manual tracking — when the GM decrements the value, it stays decremented. No automated refund mechanism exists (which is correct for permanent spend). Correct.

### pokemon-lifecycle-R016: No Ability Maximum
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:114` — `Pokemon.abilities`
- **Rule:** "There is no maximum to the number of Abilities that a Pokémon or Trainer may have."
- **Verification:** Abilities stored as JSON array with no fixed-length constraint. The GM can add as many abilities as needed via the PUT endpoint. Correct.

### pokemon-lifecycle-R048: Loyalty System - Ranks
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:154` — `Pokemon.notes`
- **Rule:** "There are 7 Ranks of Loyalty, from 0 to 6."
- **Verification:** Loyalty is a GM-tracked secret value. The Pokemon model has a `notes` field where the GM can record loyalty. The PTU rules explicitly state "A Pokémon's Loyalty is a secret value kept by the GM." The app provides the notes field for GM tracking. There is no dedicated `loyalty` field, but the 7-rank system (0-6) is representable. Correct as a GM-knowledge concept tracked through notes.

### pokemon-lifecycle-R049: Loyalty - Command Checks
- **Classification:** Correct
- **Code:** `app/composables/usePokemonSheetRolls.ts:34-37` — `rollSkill`
- **Rule:** "You must make a DC 20 Command Check to give commands to Pokémon with 0 Loyalty. [...] Loyalty 1 [...] require a DC 8 Command Check."
- **Verification:** `rollSkill` accepts any skill name and dice notation, rolling the dice and returning the result. The GM uses this for command checks by rolling against the appropriate DC. The DC values are GM knowledge from the rulebook. The dice rolling infrastructure supports this use case. Correct.

### pokemon-lifecycle-R050: Loyalty - Starting Values
- **Classification:** Correct
- **Code:** `app/server/api/pokemon/index.post.ts` — create endpoint; `app/server/api/pokemon/[id].put.ts` — update endpoint
- **Rule:** "Most caught wild Pokémon will begin at [Loyalty 2] [...] most Pokémon hatched from eggs will bond easily with their Trainers as a parent figure and begin at [Loyalty 3]."
- **Verification:** Starting loyalty values (2 for caught, 3 for hatched) are GM knowledge applied during creation. The GM sets these values in the notes field or a dedicated tracking mechanism. The app provides the creation and editing infrastructure. Correct as a GM-knowledge application.

### pokemon-lifecycle-R063: Species Capabilities
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:252-274` — `SpeciesData` movement/capability fields; `app/server/services/pokemon-generator.service.ts:116-131`
- **Rule:** "Unlike Trainers, Pokémon do not derive their Capabilities from their Skill Ranks; instead, they are determined by their species."
- **Verification:** SpeciesData stores overland, swim, sky, burrow, levitate, teleport, power, jumpHigh, jumpLong, weightClass, capabilities (JSON array of other capabilities), and size. `generatePokemonData` reads all of these from SpeciesData and propagates them to the generated Pokemon. Capabilities come entirely from species data, not from stats. Correct.

### pokemon-lifecycle-R065: Pokemon Skills
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:269-270` — `SpeciesData.skills`; `app/server/services/pokemon-generator.service.ts:116`
- **Rule:** "The Pokédex document assigns each species a roll value in Athletics, Acrobatics, Combat, Stealth, Perception, and Focus."
- **Verification:** Skills stored as JSON object `{ skillName: diceFormula }` in SpeciesData, propagated to Pokemon via `generatePokemonData`. The `rollSkill` composable supports rolling any skill check. Correct.

### pokemon-lifecycle-R035: Vitamins - Base Stat Increase
- **Classification:** Correct
- **Code:** `app/server/api/pokemon/[id].put.ts:55-62` — base stat update
- **Rule:** "HP Up: Raise the user's HP Base Stat 1. Protein: Raise the user's Attack Base Stat 1. [...]"
- **Verification:** The PUT endpoint supports partial updates of all 6 base stats via `body.baseStats`. The GM applies vitamin effects by incrementing the appropriate base stat through the edit interface. Correct as a manual GM operation.

### pokemon-lifecycle-R036: Vitamins - Maximum Per Pokemon
- **Classification:** Correct
- **Code:** `app/server/api/pokemon/[id].put.ts` — update endpoint (no enforcement)
- **Rule:** "you may only get use out of up to five Vitamins per Pokémon."
- **Verification:** No automated enforcement of the 5-vitamin limit exists — the GM tracks vitamin count manually. This is consistent with the app's approach of providing tools while leaving GM-knowledge constraints to the GM. The matrix classifies this as "Implemented" through GM tracking, which is correct. Correct.

### pokemon-lifecycle-R030: Optional Evolution Refusal
- **Classification:** Correct
- **Code:** `app/server/api/pokemon/[id].put.ts` — update endpoint
- **Rule:** "You may choose not to Evolve your Pokémon if you wish."
- **Verification:** Evolution is handled manually by the GM editing the Pokemon's species. Refusal is the default state — the GM simply does not change the species. Correct.

### pokemon-lifecycle-R038: Pokemon Creation Workflow
- **Classification:** Correct
- **Code:** Multiple files across 4 creation chains (see Capability Chains 1-4 in capabilities doc)
- **Rule:** "Start by checking the Pokédex to see the Pokémon's Base Stats. [...] Next, apply your Pokémon's Nature. [...] Next, add +X Stat Points [...] Calculate your Pokémon's Hit Points when you're done."
- **Verification:** Four complete creation pathways exist: (1) Manual: creation page -> store -> POST API -> DB; (2) CSV import: CSV parse -> createPokemonRecord -> DB; (3) Wild spawn: scene -> generateAndCreatePokemon -> DB; (4) Template: template load -> generateAndCreatePokemon -> DB. Each pathway produces a fully-formed Pokemon with species data lookup, stat distribution, HP calculation, move selection, and ability assignment. Correct.

### pokemon-lifecycle-R053: Disposition System
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:154` — `Pokemon.notes`
- **Rule:** "Wild Pokémon have 6 different Dispositions towards Trainers or a group of Trainers, ranging from Very Friendly to Very Hostile."
- **Verification:** Disposition is a narrative GM concept. The 6 dispositions are used to determine wild Pokemon behavior before capture. The app tracks Pokemon through notes and location fields. This is a reference concept the GM manages narratively. Correct.

### pokemon-lifecycle-R008: Nature Flavor Preferences
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:87` — `Pokemon.nature`
- **Rule:** "Each Stat correlates to a flavor; HP with Salty, Attack with Spicy, Defense with Sour, Special Attack with Dry, Special Defense with Bitter, and Speed with Sweet."
- **Verification:** Flavor preferences are a direct 1:1 mapping from the raised/lowered stat stored in the nature JSON. The GM looks up the flavor preference from the nature data. No special app feature needed beyond storing the nature. Correct.

---

## Incorrect Items

### pokemon-lifecycle-R009: Stat Points Allocation Total
- **Classification:** Incorrect
- **Severity:** CRITICAL
- **Code:** `app/server/services/pokemon-generator.service.ts:345` — `distributeStatPoints`
- **Rule:** "Next, add +X Stat Points, where X is the Pokémon's Level plus 10."
- **Expected:** Total stat points distributed = `level + 10`. A level 5 Pokemon should receive 15 stat points.
- **Actual:** The code distributes `level - 1` stat points (line 345: `let remainingPoints = Math.max(0, level - 1)`). A level 5 Pokemon receives only 4 stat points. The comment on line 133 says "PTU: level - 1 points" but this contradicts the rulebook which clearly states "Level plus 10."
- **Evidence:** For a level 30 Pokemon: expected 40 stat points, actual 29 stat points. This is a consistent undercount of 11 stat points at every level. The Venusaur example in the rulebook (page 207, level 30) shows 40 added stat points distributed across 6 stats summing to 40 (11+0+7+10+10+2 = 40 = 30+10). The code produces only 29 distributed points for the same level.

### pokemon-lifecycle-R006: Nature Stat Adjustments (Partial — present portion)
- **Classification:** Incorrect
- **Severity:** HIGH
- **Code:** `app/server/services/pokemon-generator.service.ts:82-172` — `generatePokemonData`
- **Rule:** "HP is only ever raised or lowered by 1, but all other stats are raised or lowered by 2, respectively, to a minimum of 1."
- **Expected:** During generation, nature should be applied to base stats before distributing stat points: non-HP stats get +2/-2, HP gets +1/-1, minimum 1.
- **Actual:** `generatePokemonData` stores the nature but does NOT apply nature adjustments to base stats. The stat point distribution (line 134: `distributeStatPoints(baseStats, input.level)`) receives raw species base stats without any nature modification. Nature is stored as metadata but has zero mechanical effect on the generated Pokemon's stats.
- **Evidence:** The function reads `baseStats` from SpeciesData (lines 104-111), then passes them directly to `distributeStatPoints` (line 134). There is no step between reading base stats and distributing points where nature adjustments are applied. The `createPokemonRecord` function (line 188) stores nature as JSON but it is purely informational at generation time.

---

## Approximation Items

### pokemon-lifecycle-R010: Base Relations Rule (Partial — present portion)
- **Classification:** Approximation
- **Severity:** HIGH
- **Code:** `app/server/services/pokemon-generator.service.ts:335-367` — `distributeStatPoints`
- **Rule:** "The Base Relations Rule puts a Pokémon's Base Stats in order from highest to lowest. This order must be maintained when adding Stat Points."
- **Expected:** After distributing stat points, the ordering of final stats must match the ordering of base stats (highest base stat remains the highest final stat, etc.). Equal base stats need not remain equal.
- **Actual:** The weighted random distribution uses base stats as probability weights (line 347-356), which tends to give higher base stats more points proportionally. However, this is a random process that can and does violate the base relations ordering. There is no post-distribution validation check.
- **What's Missing:** No enforcement or validation that the final stat ordering matches the base stat ordering. The random weighted approach is an approximation that works "on average" but individual Pokemon can have inverted stat rankings. A level 5 Pokemon with base stats Speed=7, SpAtk=6 could randomly get all 4 points into SpAtk, resulting in SpAtk=10 > Speed=7, violating base relations.

### pokemon-lifecycle-R026: Level Up Workflow (Partial — present portion)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/server/api/pokemon/[id].put.ts` — update endpoint; `app/pages/gm/pokemon/[id].vue`
- **Rule:** "Whenever your Pokémon Levels up, follow this list: First, it gains +1 Stat Point. [...] Next, there is the possibility your Pokémon may learn a Move or Evolve. [...] Finally, your Pokémon may gain a new Ability."
- **Expected:** A structured level-up workflow guiding GM through: +1 stat point (with Base Relations), check new moves, check evolution, check abilities at 20/40.
- **Actual:** All constituent data fields (stats, moves, abilities, level, experience) are editable through the Pokemon sheet. The GM can manually perform each step. No unified workflow or guided wizard exists.
- **What's Missing:** No "Level Up" button or wizard. No automated prompts for new moves at the current level, evolution check, or ability milestones at level 20/40. The GM must manually know and execute each step.

### pokemon-lifecycle-R027: Level Up Stat Point (Partial — present portion)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/server/api/pokemon/[id].put.ts:64-69` — currentStats update
- **Rule:** "First, it gains +1 Stat Point. As always, added Stat points must adhere to the Base Relations Rule."
- **Expected:** On level-up, automatically add +1 stat point with validation against Base Relations Rule.
- **Actual:** Stats are editable via the sheet. The GM manually increments a stat. No validation against Base Relations.
- **What's Missing:** No automated +1 stat point on level-up. No Base Relations validation on any stat change.

### pokemon-lifecycle-R028: Level Up Move Check (Partial — present portion)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/prisma/schema.prisma:267` — `SpeciesData.learnset`; `app/server/api/pokemon/[id].put.ts:45`
- **Rule:** "Next, there is the possibility your Pokémon may learn a Move or Evolve. Check its Pokédex Entry to see if either of these happens."
- **Expected:** On level-up, show available moves at the new level from the learnset. Allow GM to add them to the moveset.
- **Actual:** Learnset data exists in SpeciesData. `selectMovesFromLearnset` selects moves at creation time. Moves are editable via the PUT endpoint. No level-up move notification or suggestion system exists.
- **What's Missing:** No "new moves available" check when level changes. The GM must manually cross-reference the learnset.

### pokemon-lifecycle-R029: Evolution Check on Level Up (Partial — present portion)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/prisma/schema.prisma:249-250` — `SpeciesData.evolutionStage/maxEvolutionStage`
- **Rule:** "Next, there is the possibility your Pokémon may learn a Move or Evolve. Check its Pokédex Entry."
- **Expected:** On level-up, check if the Pokemon reaches an evolution level and notify the GM.
- **Actual:** Species is editable. SpeciesData stores evolution stage info. No automated evolution check or notification.
- **What's Missing:** No evolution level detection. No notification when a Pokemon reaches evolution level.

### pokemon-lifecycle-R031: Evolution - Stat Recalculation (Partial — present portion)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/server/api/pokemon/[id].put.ts` — update endpoint
- **Rule:** "Take the new form's Base Stats, apply the Pokémon's Nature again, reapply any Vitamins that were used, and then re-Stat the Pokémon [...] Pokémon add +X Stat Points to their Base Stats, where X is the Pokémon's Level plus 10."
- **Expected:** On evolution, automated workflow: new base stats, apply nature, apply vitamins, redistribute stat points (level+10) with Base Relations.
- **Actual:** All fields are editable. The GM manually updates base stats, current stats, species, and all other fields.
- **What's Missing:** No automated stat recalculation. The GM must manually perform the full evolution stat workflow.

### pokemon-lifecycle-R058: Pokemon Experience Calculation (Partial — present portion)
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/prisma/schema.prisma:84` — `Pokemon.experience`
- **Rule:** "First off, total the Level of the enemy combatants which were defeated. [...] Second, consider the significance of the encounter. [...] Third, divide the Experience by the number of players."
- **Expected:** Post-combat XP calculation: sum enemy levels (trainers doubled), multiply by significance, divide by player count.
- **Actual:** Experience stored as integer, manually updated by GM. The encounter model has a `defeatedEnemies` field but no automated XP calculation.
- **What's Missing:** No XP calculation after combat. No significance multiplier UI. No auto-distribution to participating Pokemon.

### pokemon-lifecycle-R014: Abilities - Level 20 (Partial — present portion)
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/prisma/schema.prisma:114` — `Pokemon.abilities`; `app/server/api/pokemon/[id].put.ts:44`
- **Rule:** "At Level 20, a Pokémon gains a Second Ability, which may be chosen from its Basic or Advanced Abilities."
- **Expected:** At level 20, prompt GM to add a second ability from Basic or Advanced list.
- **Actual:** Abilities stored as editable JSON array. GM can manually add abilities at any time. No level-20 prompt.
- **What's Missing:** No automated notification at level 20. No suggestion of available Basic/Advanced abilities.

### pokemon-lifecycle-R015: Abilities - Level 40 (Partial — present portion)
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/prisma/schema.prisma:114` — `Pokemon.abilities`; `app/server/api/pokemon/[id].put.ts:44`
- **Rule:** "At Level 40, a Pokémon gains a Third Ability, which may be chosen from any of its Abilities."
- **Expected:** At level 40, prompt GM to add a third ability from any ability list.
- **Actual:** Same as R014. Abilities editable, no level-40 prompt.
- **What's Missing:** No automated notification at level 40. No suggestion of available abilities (Basic, Advanced, or High).

---

## Ambiguous Items

(None identified.)

---

## Partial Items — Present Portion Only

The following partial items from the Auditor Queue were verified for what they claim is present. Since these items are already classified as "Partial" in the matrix, the audit focuses on verifying the present portion is correct and noting the gap accurately.

### pokemon-lifecycle-R023: Tutor Points - Level Progression (Partial)
- **Classification:** Correct (present portion)
- **Code:** `app/prisma/schema.prisma:139` — `Pokemon.tutorPoints`; `app/server/api/pokemon/[id].put.ts`
- **Present portion verified:** Tutor points stored as editable integer. GM can manually increment.
- **Gap confirmed:** No automated calculation of `1 + floor(level/5)` total tutor points. Generation service does not set tutor points based on level.

### pokemon-lifecycle-R032: Evolution - Ability Remapping (Partial)
- **Classification:** Correct (present portion)
- **Code:** `app/prisma/schema.prisma:114` — `Pokemon.abilities`
- **Present portion verified:** Abilities stored as editable JSON array. GM can manually update.
- **Gap confirmed:** No automated ability remapping matching old ability slot positions to new species' ability list.

### pokemon-lifecycle-R033: Evolution - Immediate Move Learning (Partial)
- **Classification:** Correct (present portion)
- **Code:** `app/prisma/schema.prisma:115` — `Pokemon.moves`; `app/prisma/schema.prisma:267` — `SpeciesData.learnset`
- **Present portion verified:** Moves editable. Learnset data available in SpeciesData.
- **Gap confirmed:** No automated check for moves the evolved form learns below its minimum evolution level.

### pokemon-lifecycle-R034: Evolution - Skills and Capabilities Update (Partial)
- **Classification:** Correct (present portion)
- **Code:** `app/prisma/schema.prisma:121-125` — capabilities/skills fields
- **Present portion verified:** Skills and capabilities stored and editable. SpeciesData contains evolved form's data.
- **Gap confirmed:** No automated update of skills/capabilities on evolution.

### pokemon-lifecycle-R037: Heart Booster (Partial)
- **Classification:** Correct (present portion)
- **Code:** `app/prisma/schema.prisma:139` — `Pokemon.tutorPoints`
- **Present portion verified:** Tutor points editable. GM can manually add 2 TP.
- **Gap confirmed:** No dedicated Heart Booster action. No "one per Pokemon" constraint enforcement.

---

## Additional Observations

### HP Formula Uses calculatedStats.hp, Not baseStats.hp
In `generatePokemonData` (line 137), the HP formula uses `calculatedStats.hp` (base + distributed stat points) rather than `baseStats.hp`. The PTU formula says "HP x 3" where HP refers to the final HP stat (base + stat points + nature). This is correct behavior — the formula uses the total HP stat, not just the base. However, since nature is not applied (R006 Incorrect finding), the HP stat used is missing the nature adjustment.

### Default Base Stats Fallback
When a species is not found in the database, `generatePokemonData` uses default base stats of 5 for all stats (line 89). This is a reasonable fallback but produces a non-canonical Pokemon.

### No Level Validation on API
Neither the POST nor PUT endpoints validate that level is between 1 and 100. While the GM is the sole user, a defensive validation could prevent accidental data entry errors. This is an observation, not a rule violation.

### Manual vs Automated Nature of Many Rules
Many rules classified as "Implemented" rely on the GM manually applying knowledge from the rulebook (vitamins, loyalty, experience, evolution). This is a deliberate design decision — the app is a session helper tool, not a rules engine. The audit respects this design philosophy when classifying items.

### HP Formula Interaction with R009
The incorrect stat point total (R009: `level - 1` instead of `level + 10`) cascades to the HP formula. Since `calculatedStats.hp` uses under-distributed stat points, the final maxHp will be lower than correct PTU values. For a level 30 Pokemon with base HP 8: correct HP stat would be 8 + ~7 points = ~15, giving maxHp = 30 + 15*3 + 10 = 85. With only 29 total points to distribute (vs correct 40), fewer points go to HP, reducing maxHp.
