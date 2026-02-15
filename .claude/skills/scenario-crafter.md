---
name: scenario-crafter
description: Turns gameplay loops into concrete, testable scenarios with real Pokemon data, UI actions, and quantitative assertions. Use when gameplay loops are ready and need to be converted into test cases, or when the Orchestrator directs you to craft scenarios.
---

# Scenario Crafter

You turn abstract gameplay loops into concrete, executable test scenarios. Every scenario uses real Pokemon species with looked-up base stats, maps game actions to specific UI interactions, and includes quantitative assertions with shown math.

## Context

This skill is the second stage of the **Testing Loop** in the 10-skill PTU ecosystem.

**Pipeline position:** Gameplay Loop Synthesizer → **You** → Scenario Verifier → Playtester → Result Verifier

**Input:** `app/tests/e2e/artifacts/loops/<domain>.md`
**Output:** `app/tests/e2e/artifacts/scenarios/<scenario-id>.md`

See `ptu-skills-ecosystem.md` for the full architecture.

## Process

### Step 0: Read Lessons

Before starting work, check `app/tests/e2e/artifacts/lessons/scenario-crafter.lessons.md` for patterns from previous cycles. If the file exists, review active lessons — they highlight recurring mistakes (e.g., math errors in derivations, incorrect base stat lookups) that you should watch for in this session. If no lesson file exists, skip this step.

### Step 1: Read Loop Files

Read the gameplay loop(s) from `app/tests/e2e/artifacts/loops/`. Identify:
- The main loop and all sub-loops
- The PTU rules referenced
- The app features involved
- The expected outcomes

### Step 2: Choose Concrete Data

For each loop, select real Pokemon species and concrete values:

1. **Look up base stats** — read species files from `books/markdown/pokedexes/gen<N>/<species>.md` (see lookup guide in `.claude/skills/references/ptu-chapter-index.md`)
2. **Pick species that make the scenario clear** — e.g., for type effectiveness, pick species with obvious type matchups
3. **Set specific levels** — choose levels that produce clear, verifiable numbers
4. **Select real moves** — verify the species can learn the move at the given level (check the Level-Up Moves section in the pokedex file)
5. **Calculate all derived values** — HP, evasion, damage, etc. using formulas from `.claude/skills/references/ptu-chapter-index.md`

### Step 3: Map to UI Actions

Translate game actions to specific UI interactions using `.claude/skills/references/app-surface.md`:

1. **Route** — which page does the user navigate to?
2. **Form fields** — what inputs need values?
3. **Buttons** — what triggers the action?
4. **Responses** — what UI element shows the result?

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

- **P0** — Core mechanic that must work for the app to be useful (e.g., damage calculation, HP display)
- **P1** — Important flow that most sessions use (e.g., STAB bonus, type effectiveness)
- **P2** — Edge case or rare interaction (e.g., critical hit with max stages, capture at exactly 0 HP)

### Step 7: Save

Write each scenario to `app/tests/e2e/artifacts/scenarios/<scenario-id>.md`.

Naming: `<domain>-<description>-<NNN>.md` (e.g., `combat-basic-damage-001.md`)

Then update `app/tests/e2e/artifacts/pipeline-state.md`.

## Output Format

Use the Scenario format from `.claude/skills/references/skill-interfaces.md`:

```markdown
---
scenario_id: combat-basic-damage-001
loop_id: combat-basic-damage
priority: P0
ptu_assertions: 3
---

## Setup (API)
POST /api/encounters { name: "Test: Basic Damage" }
$encounter_id = response.data.id

POST /api/pokemon {
  species: "Bulbasaur", level: 15,
  baseHp: 5, baseAttack: 5, baseDefense: 5,
  baseSpAttack: 7, baseSpDefense: 7, baseSpeed: 5
}
$attacker_id = response.data.id

POST /api/pokemon {
  species: "Charmander", level: 15,
  baseHp: 4, baseAttack: 5, baseDefense: 4,
  baseSpAttack: 6, baseSpDefense: 5, baseSpeed: 7
}
$target_id = response.data.id

POST /api/encounters/$encounter_id/combatants { pokemonId: $attacker_id, side: "ally" }
POST /api/encounters/$encounter_id/combatants { pokemonId: $target_id, side: "enemy" }
POST /api/encounters/$encounter_id/start

## Actions (UI)
1. Navigate to /gm
2. Select the test encounter
3. On Bulbasaur's turn, click "Attack"
4. Select move: "Tackle" (Normal, DB 5 → 2d6+5, Physical, AC 3)
5. Select target: Charmander
6. Enter damage roll result: 18
7. Click "Apply"

## Assertions
1. Charmander starting HP:
   HP = level(15) + (baseHp(4) * 3) + 10 = 37
   **Assert: Charmander HP bar shows "37/37" before attack**

2. Damage applied:
   Tackle damage = rolled(18) + ATK(5) - DEF(4) = 19
   Remaining HP = 37 - 19 = 18
   **Assert: Charmander HP bar shows "18/37" after attack**

3. Combat log:
   **Assert: Log entry shows "Bulbasaur used Tackle on Charmander for 19 damage"**

## Teardown
POST /api/encounters/$encounter_id/end
```

## Handling Multiple Loops

When a domain has multiple loops and sub-loops:

1. Create one scenario per main loop (P0 priority)
2. Create one scenario per critical sub-loop (P1 priority)
3. Create scenarios for edge case sub-loops as needed (P2 priority)
4. Group related scenarios by prefix: `combat-basic-damage-001`, `combat-stab-damage-001`, `combat-critical-hit-001`

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
- Write Playwright test code (that's Playtester)
- Fix app bugs (that's Developer)
- Run tests (that's Playtester)
