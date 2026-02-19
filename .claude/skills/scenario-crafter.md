---
name: scenario-crafter
description: Turns gameplay loops into concrete, testable scenarios with real Pokemon data, UI actions, and quantitative assertions. Use when gameplay loops are ready and need to be converted into test cases, or when the Orchestrator directs you to craft scenarios.
---

# Scenario Crafter

You turn gameplay loops into concrete, executable test scenarios. Every scenario uses real Pokemon species with looked-up base stats, maps game actions to specific UI/API interactions, and includes quantitative assertions with shown math.

You handle two types of input: **session workflows** (multi-step, multi-mechanic) and **mechanic validations** (single-mechanic focused). The scenario format adapts to match.

## Context

This skill is the second stage of the **Testing Ecosystem**.

**Pipeline position:** Gameplay Loop Synthesizer → **You** → Scenario Verifier → Feature Designer (gap detection)

**Input:** `app/tests/e2e/artifacts/loops/<domain>.md`
**Output:** `app/tests/e2e/artifacts/scenarios/<scenario-id>.md`

See `ptu-skills-ecosystem.md` for the full architecture.

## The Two Scenario Types

### Workflow Scenarios (from Tier 1 loops)

These test whether the app supports a realistic GM task end-to-end. They chain multiple mechanics in the order they'd naturally occur during a session.

**Characteristics:**
- Multiple phases (setup → action → more action → resolution → bookkeeping)
- Each phase may exercise a different mechanic
- Assertions are spread across the workflow, not just at the end
- The scenario tells a story — "It's session night, the party enters Route 3..."
- A single workflow scenario may cover 4-8 mechanics implicitly

**Example:** A "run a wild encounter" workflow scenario would assert on: encounter creation, combatant HP calculations, initiative ordering, damage from a move (including STAB/effectiveness), faint threshold, and encounter resolution — all in one scenario.

### Mechanic Scenarios (from Tier 2 loops)

These isolate a single PTU rule and verify its math. Same format as the first pipeline cycle produced.

**Characteristics:**
- Focused setup for one mechanic
- 2-5 tightly scoped assertions
- Good for edge cases, boundary values, and complex formulas

## Process

### Step 0: Read Lessons

Before starting work, check `app/tests/e2e/artifacts/lessons/scenario-crafter.lessons.md` for patterns from previous cycles. If the file exists, review active lessons — they highlight recurring mistakes (e.g., math errors in derivations, incorrect base stat lookups) that you should watch for in this session. If no lesson file exists, skip this step.

### Step 1: Read Loop Files

Read the gameplay loop(s) from `app/tests/e2e/artifacts/loops/`. Identify:
- Which loops are Tier 1 (workflows) vs Tier 2 (mechanic validations)
- The `mechanics_exercised` list for each workflow (these become implicit test points)
- The PTU rules referenced
- The app features involved
- The expected outcomes and end states

If a workflow step is annotated with `[GAP: FEATURE_GAP]` or `[GAP: UX_GAP]`, include the step in the scenario anyway. Write the scenario as if the feature existed — the Playtester will fail at that step, the Result Verifier will triage it as FEATURE_GAP/UX_GAP, and the pipeline will route it to the Feature Designer. Do not skip or rewrite gap-annotated steps.

### Step 2: Choose Concrete Data

For each loop, select real Pokemon species and concrete values:

1. **Look up base stats** — read species files from `books/markdown/pokedexes/gen<N>/<species>.md` (see lookup guide in `.claude/skills/references/ptu-chapter-index.md`)
2. **Pick species that make the scenario clear** — e.g., for type effectiveness, pick species with obvious type matchups
3. **Set specific levels** — choose levels that produce clear, verifiable numbers
4. **Select real moves** — verify the species can learn the move at the given level (check the Level-Up Moves section in the pokedex file)
5. **Calculate all derived values** — HP, evasion, damage, etc. using formulas from `.claude/skills/references/ptu-chapter-index.md`

**STAB validation (mandatory):** For every move in the scenario, explicitly check whether the attacker's type(s) match the move type. Annotate the result: `Tackle (Normal) — attacker is Grass/Poison → no STAB` or `Water Gun (Water) — attacker is Water → STAB applies (+2 DB)`.

**Move learn-level validation (mandatory):** For every move, verify the species learns it at or before the specified level by reading the pokedex file. Include the citation: `Tackle — learned at L1 (Bulbasaur pokedex: Level-Up Moves)`.

**Type chart validation (mandatory):** For every damage interaction, look up each type pair against the PTU type chart. Don't assume — check: `Normal → Rock: resisted (×0.5)`.

**Non-deterministic API check (mandatory):** Before writing any assertion with an exact expected stat value, determine whether the API endpoint that creates the entity produces deterministic output. Endpoints using `generateAndCreatePokemon` (wild-spawn, template-load) distribute `level - 1` random stat points — exact HP/stat values are non-deterministic. For these endpoints: (a) design the spec to read actual stats from the API after creation and derive expected values dynamically, or (b) use `>=` minimum bounds and relational checks (`currentHp = maxHp`). Document which approach and why in the scenario. Only manually-created Pokemon (via `POST /api/pokemon` with explicit base stats) produce deterministic stats.

**Enforcement boundary check (mandatory):** For every assertion that tests a PTU rule, determine whether the app enforces that rule at the API level or whether it's a GM responsibility. The status API, for example, is a GM tool — it applies any valid status without type checking. The damage API accepts raw damage values without checking move legality. Annotate each rule-dependent assertion: `App-enforced: HP calculation` or `GM-enforced: type immunity (not in API)`. Do not write assertions expecting the API to enforce GM-responsibility rules.

### Step 3: Map to Actions

Translate game actions to specific interactions using `.claude/skills/references/app-surface.md`.

**For workflow scenarios:** Actions are a sequence of phases, each with its own API calls and/or UI interactions. Use phase headers to organize.

**For mechanic scenarios:** Actions are a focused setup → single action → check result.

Be specific: not "apply damage" but "click the 'Apply Damage' button, enter '18' in the damage input field."

### Step 4: Write Assertions with Derivations

Every assertion must show its mathematical derivation with concrete values. This is the most important part — it lets the Scenario Verifier independently check your math.

**Good assertion:**
```
Bulbasaur HP = level(15) + (baseHp(5) * 3) + 10 = 40
After 22 damage: 40 - 22 = 18
Assert: Bulbasaur HP displays "18/40"
```

**Bad assertion:**
```
Assert: Bulbasaur HP is reduced
```

**For workflow scenarios:** Place assertions at each phase boundary (not just at the end). After initiative is set, assert the order. After damage is dealt, assert HP. After a faint, assert status. This lets the Playtester catch exactly where a workflow breaks down.

### Step 5: Write Setup and Teardown

**Setup (API-based):** Use API calls to create test data. This is faster and more reliable than UI-based setup. Reference `.claude/skills/references/app-surface.md` for endpoint patterns.

```markdown
## Setup (API)
POST /api/encounters { name: "Test Combat", weather: "Clear" }
$encounter_id = response.data.id

POST /api/pokemon { species: "Bulbasaur", level: 15, ... }
$pokemon_id = response.data.id

POST /api/encounters/$encounter_id/combatants { pokemonId: $pokemon_id, side: "enemy" }
```

**Teardown:** Clean up test data.
```markdown
## Teardown
POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$pokemon_id
```

### Step 6: Assign Priority

- **P0** — Session workflow: end-to-end GM task that must work for the app to fulfill its purpose
- **P1** — Workflow variation or important mechanic that most sessions exercise
- **P2** — Mechanic edge case or rare interaction

### Step 7: Save

Write each scenario to `app/tests/e2e/artifacts/scenarios/<scenario-id>.md`.

Naming:
- Workflow scenarios: `<domain>-workflow-<description>-<NNN>.md` (e.g., `combat-workflow-wild-encounter-001.md`)
- Mechanic scenarios: `<domain>-<mechanic>-<NNN>.md` (e.g., `combat-stab-001.md`)

Note: The Orchestrator is the sole writer of state files (`test-state.md`). It will detect your new scenario files on its next scan.

## Output Format: Workflow Scenario

```markdown
---
scenario_id: combat-workflow-wild-encounter-001
loop_id: combat-workflow-wild-encounter
tier: workflow
priority: P0
ptu_assertions: 8
mechanics_tested:
  - hp-calculation
  - initiative-ordering
  - physical-damage
  - stab
  - faint-check
---

## Narrative
The party encounters 2 wild Geodude on Route 3. The GM sets up the encounter,
runs 2 rounds of combat, and one Geodude faints from a super-effective Water Gun.

## Setup (API)
POST /api/pokemon {
  species: "Squirtle", level: 13,
  baseHp: 4, baseAttack: 5, baseDefense: 7,
  baseSpAtk: 5, baseSpDef: 6, baseSpeed: 4
}
$squirtle_id = response.data.id
<!-- ... more setup ... -->

POST /api/encounters { name: "Route 3: Wild Geodude" }
$encounter_id = response.data.id

POST /api/encounters/$encounter_id/combatants { pokemonId: $squirtle_id, side: "ally" }
POST /api/encounters/$encounter_id/combatants { pokemonId: $geodude1_id, side: "enemy" }
POST /api/encounters/$encounter_id/combatants { pokemonId: $geodude2_id, side: "enemy" }

## Phase 1: Start Encounter
POST /api/encounters/$encounter_id/start

### Assertions (Phase 1)
1. Squirtle HP:
   HP = level(13) + (baseHp(4) * 3) + 10 = 35
   **Assert: Squirtle HP shows "35/35"**

2. Geodude 1 HP:
   HP = level(12) + (baseHp(4) * 3) + 10 = 34
   **Assert: Geodude 1 HP shows "34/34"**

3. Initiative order:
   Squirtle speed stat = 4, Geodude speed stat = 2
   **Assert: Squirtle appears before Geodude in turn order**

## Phase 2: Round 1 — Squirtle attacks Geodude 1
1. Select move: Water Gun (Water, DB 6, Special, AC 2)
   Learn level: L13 (Squirtle pokedex: Level-Up Moves) ✓
   STAB: Squirtle is Water, Water Gun is Water → STAB applies (+2 DB → DB 8)
   Type: Water → Rock/Ground: super effective (×2)
2. Enter set damage for DB 8: 20
3. Apply to Geodude 1

### Assertions (Phase 2)
4. Damage calculation:
   Raw = setDamage(20) + SpAtk(5) - SpDef(2) = 23
   Type effectiveness: ×2 = 46
   Geodude 1 HP: 34 - 46 = -12 → 0 (fainted)
   **Assert: Geodude 1 HP shows "0/34"**
   **Assert: Geodude 1 has fainted status**

## Phase 3: Round 1 — Geodude 2 attacks Squirtle
<!-- ... continues ... -->

## Phase 4: Resolution
POST /api/encounters/$encounter_id/end

### Assertions (Phase 4)
8. Encounter ended:
   **Assert: Encounter status is "ended"**

## Teardown
DELETE /api/pokemon/$squirtle_id
DELETE /api/pokemon/$geodude1_id
DELETE /api/pokemon/$geodude2_id
```

## Output Format: Mechanic Scenario

```markdown
---
scenario_id: combat-stab-001
loop_id: combat-mechanic-stab
tier: mechanic
priority: P1
ptu_assertions: 3
---

## Setup (API)
<!-- focused setup for this specific mechanic -->

## Actions
<!-- single focused interaction -->

## Assertions
1. <what to check>
   Derivation: <formula with concrete values>
   **Assert: <element> displays "<expected value>"**

## Teardown
<!-- cleanup -->
```

## Handling the Two Tiers

When a domain has both workflow and mechanic loops:

1. **Workflow scenarios first (P0):** One scenario per Tier 1 workflow loop. These are the most important — they test whether the app fulfills its purpose.
2. **Workflow variations (P1):** One scenario per sub-workflow (e.g., "encounter where player captures instead of fainting").
3. **Mechanic scenarios (P1-P2):** One scenario per Tier 2 mechanic loop. Only for mechanics that aren't adequately covered by workflow scenarios, or that have complex math worth isolating.

**Coverage check:** After writing all scenarios, verify that every entry in a workflow's `mechanics_exercised` list has at least one assertion somewhere across the scenario set.

## Species Data Lookup

When you need base stats for a Pokemon:

1. Check `.claude/skills/references/ptu-chapter-index.md` → "How to Look Up Base Stats" section
2. Read the species file: `books/markdown/pokedexes/gen<N>/<species>.md`
3. If unsure which generation: check `scripts/data/pokemon-gen-lookup.json`
4. Extract: Base Stats, Type(s), Level-Up Moves, Abilities

## Corrections

If the Scenario Verifier or Result Verifier sends back a `correction-*.md` report:
1. Read the correction — which assertions were wrong and what the correct values are
2. Update the scenario file with corrected values
3. Re-save to `artifacts/scenarios/`

## What You Do NOT Do

- Verify your own scenarios against PTU rules (that's Scenario Verifier)
- Fix app bugs (that's Developer)
- Check the app surface for gaps (that's Feature Designer)
