---
name: gameplay-loop-synthesizer
description: Generates structured gameplay loop documents from PTU 1.05 rulebooks and app feature analysis. Use when starting test coverage for a new domain, when the Orchestrator directs you to synthesize loops, or when new app features need gameplay loop coverage.
---

# Gameplay Loop Synthesizer

You read PTU 1.05 rulebooks and app source code to produce structured gameplay loop documents. These loops are the foundation of the testing pipeline — every test scenario traces back to a gameplay loop you wrote.

Your primary job is to think like a GM sitting at the table and ask: **"What do I need this app to do right now?"** The answer drives two tiers of loops — session workflows (how the GM uses the app) and mechanic validations (whether individual rules compute correctly).

## Context

This skill is the entry point of the **Testing Loop** in the 10-skill PTU ecosystem. Your output feeds directly into the Scenario Crafter.

**Pipeline position:** You → Scenario Crafter → Scenario Verifier → Playtester → Result Verifier

**Output location:** `app/tests/e2e/artifacts/loops/<domain>.md`

See `ptu-skills-ecosystem.md` for the full architecture.

## The Two Tiers

### Tier 1: Session Workflows (primary)

These are the loops that matter most. A session workflow represents a **real task a GM performs during a play session**, from intent to completion. It often chains multiple mechanics together in the natural order they'd occur at the table.

**Examples:**
- "GM sets up a wild encounter with 3 Zubats, rolls initiative, runs 2 rounds of combat, one Zubat faints"
- "Player weakens a wild Pokemon, then attempts capture — capture succeeds, Pokemon is added to their party"
- "Combat ends, GM heals the party, applies rest, checks for injury recovery"
- "GM creates a new trainer mid-session, assigns their starter Pokemon, adds them to the active scene"

**What makes a good session workflow:**
- Mirrors a real task a GM would perform at the table (not an abstract mechanic)
- Chains 3-8 steps that span multiple mechanics within the domain
- Has a clear beginning ("GM wants to...") and a clear done state ("...and now the party can move on")
- Includes the setup, the action, and the bookkeeping afterward
- Individual mechanics (damage calc, type effectiveness) are exercised *implicitly* as part of the flow
- May cross into adjacent domains when that's what naturally happens (e.g., combat → capture → party management)

### Tier 2: Mechanic Validations (secondary)

These are focused checks on individual PTU rules — the kind of loops the pipeline produced in its first cycle. They're still valuable for catching math bugs, but they're secondary to workflows.

**Examples:**
- "STAB adds +2 to Damage Base"
- "Type immunity results in 0 damage"
- "Combat stages modify stats with the correct multiplier"

**When to include Tier 2 loops:**
- The mechanic has complex math worth verifying independently (damage formula, capture rate)
- The mechanic has known edge cases (minimum damage, double resistance)
- The mechanic isn't naturally exercised by any Tier 1 workflow
- A Retrospective lesson flagged a specific mechanic as error-prone

## Process

### Step 0: Read Lessons

Before starting work, check `app/tests/e2e/artifacts/lessons/gameplay-loop-synthesizer.lessons.md` for patterns from previous cycles. If the file exists, review active lessons — they highlight process gaps (e.g., missing sub-loops, overlooked edge cases) found in previous loop documents. If no lesson file exists, skip this step.

### Step 1: Select Domain

Choose the domain to synthesize loops for. Domains (in priority order):

1. **combat** — damage, stages, initiative, turns, status, maneuvers, critical hits
2. **capture** — capture rate calculation, attempt execution, ball modifiers, status bonuses
3. **healing** — rest (30 min), extended rest (4h+), Pokemon Center, injuries, new day
4. **pokemon-lifecycle** — creation, stat calculation, moves, abilities, evolution, linking/unlinking, archiving
5. **character-lifecycle** — creation, stat points, classes, skills, Pokemon ownership
6. **encounter-tables** — table CRUD, entries with weights, sub-habitats, generation
7. **scenes** — CRUD, activate/deactivate, entity positioning, groups, weather
8. **vtt-grid** — grid movement (diagonal costs), fog of war, terrain, backgrounds, measurement

If the user doesn't specify a domain, ask which one.

### Step 2: Think Like a GM

Before reading any rules, answer these questions for the domain:

1. **When does the GM use this part of the app during a session?** (e.g., "When the party walks into tall grass and I need a wild encounter")
2. **What is the GM trying to accomplish?** (e.g., "Run a combat that's fun and correctly adjudicated")
3. **What sequence of actions does the GM perform from start to finish?** (e.g., "Create encounter → add combatants → start → run turns → resolve faints/captures → end → heal")
4. **What does 'done' look like?** (e.g., "Encounter ended, XP noted, captures resolved, party healed")
5. **What are the 2-3 most common variations?** (e.g., "All enemies faint", "Player captures one", "Party flees")

Write your answers down — they become the basis for Tier 1 workflows.

### Step 3: Read Rulebook

Look up the domain's rulebook chapters in `.claude/skills/references/ptu-chapter-index.md`.

For each chapter:
1. Read the relevant sections from `books/markdown/core/`
2. Check `books/markdown/errata-2.md` for corrections
3. Extract the core rules, formulas, and decision points

**Important:** Read the actual rulebook text. Do not rely on memory or summaries — PTU has specific numbers and edge cases that matter.

### Step 4: Map to App Features

Read `.claude/skills/references/app-surface.md` to identify which app features implement the domain's rules:

1. **Routes** — which pages does the user interact with?
2. **API endpoints** — which server actions execute the mechanics?
3. **Stores/composables** — which client code contains the logic?

For each mechanic, note:
- The app file that implements it
- Whether it's client-side, server-side, or both
- Any WebSocket events that broadcast the result

### Step 5: Generate Tier 1 Workflows

For each real GM task identified in Step 2, write a session workflow loop.

**How to structure a workflow:**
1. Start with the GM's intent ("GM wants to run a wild encounter")
2. List the full sequence of actions from setup to resolution
3. Note which mechanics fire at each step (these become implicit test points)
4. Define the end state that proves the workflow succeeded
5. List the 2-3 most important variations as sub-workflows

**Coverage check:** After writing all workflows, list every mechanic in the domain. Verify each mechanic appears in at least one workflow. If a mechanic isn't covered by any workflow, either:
- Add it to an existing workflow where it naturally fits, OR
- Flag it for a Tier 2 mechanic validation

### Step 6: Generate Tier 2 Mechanic Validations

For mechanics that aren't adequately covered by Tier 1 workflows, or that have complex math worth isolating:

1. **Start with the happy path** — the simplest version of the mechanic
2. **Add modifier variants** — what changes the outcome? (STAB, type effectiveness, stages)
3. **Add edge cases** — what are the boundary conditions? (0 HP, max stages, immunity)

These are the same style of loops the pipeline produced in its first cycle. They're still useful — just secondary to workflows.

### Step 7: Write and Save

Write the complete loop document to `app/tests/e2e/artifacts/loops/<domain>.md`.

**Document structure:**
1. Tier 1 workflows first (numbered W1, W2, W3...)
2. Tier 2 mechanic validations second (numbered M1, M2, M3...)
3. Each loop clearly labeled with its tier

Then update `app/tests/e2e/artifacts/pipeline-state.md`:
- Set the domain's Loops stage to "complete"
- Record the loop count (workflows + validations) and timestamp

## Output Format

### Tier 1: Session Workflow

```markdown
---
loop_id: <domain>-workflow-<description>
tier: workflow
domain: <domain>
gm_intent: <one sentence: what the GM is trying to accomplish>
ptu_refs:
  - core/07-combat.md#section
  - core/07-combat.md#another-section
app_features:
  - composables/useCombat.ts
  - server/api/encounters/[id]/start.post.ts
mechanics_exercised:
  - initiative-calculation
  - damage-formula
  - faint-check
  - type-effectiveness
sub_workflows:
  - <loop_id of variation>
---

## GM Context
<1-2 sentences describing the real play situation. When does this happen in a session?>

## Preconditions
- <state required before this workflow starts>

## Workflow Steps
1. **[Setup]** <GM creates/configures something>
2. **[Action]** <GM or system performs a game action>
3. **[Mechanic: damage-formula]** <system applies a PTU rule — tag which mechanic fires>
4. **[Bookkeeping]** <GM resolves aftermath>
5. **[Done]** <end state that proves the workflow succeeded>

## PTU Rules Applied
- <rule>: "<quote>" (file:section)

## Expected End State
- <what the app should show when this workflow is complete>
- <what data should exist in the database>

## Variations
- **<variation name>**: <how the workflow changes> → sub-workflow loop_id
```

### Tier 2: Mechanic Validation

```markdown
---
loop_id: <domain>-mechanic-<description>
tier: mechanic
domain: <domain>
ptu_refs:
  - core/07-combat.md#section
app_features:
  - composables/useMoveCalculation.ts
sub_loops:
  - <loop_id of edge case>
---

## Preconditions
- <required state>

## Steps
1. <game action>
2. <system responds>

## PTU Rules Applied
- <rule>: "<quote>" (file:section)

## Expected Outcomes
- <observable result with formula>

## Edge Cases
- <condition> → <behavior>
```

## Domain-Specific Guidance

### Combat

**Tier 1 workflows to consider:**
- GM runs a full wild encounter (create → populate → initiative → rounds → resolution)
- GM runs a trainer battle (two sides, each with trainers + Pokemon, turn alternation)
- A combatant faints mid-combat and the player sends out a replacement
- Combat ends and GM performs post-combat bookkeeping (injuries, XP)

**Tier 2 validations to consider (if not covered by workflows):**
- STAB calculation, critical hit multiplier, type immunity edge case, minimum damage floor, combat stage multiplier table

Read: `core/07-combat.md`, `composables/useCombat.ts`, `composables/useMoveCalculation.ts`

### Capture

**Tier 1 workflows to consider:**
- Player weakens a wild Pokemon in combat and attempts capture
- Capture fails, player tries again with a different ball
- Capture succeeds, Pokemon is added to the player's party and linked to trainer

**Tier 2 validations to consider:**
- Capture rate formula with each modifier (HP, status, ball type, evolution stage)

Read: `core/05-pokemon.md` (Capture Rate section), `composables/useCapture.ts`, `server/api/capture/`

### Healing

**Tier 1 workflows to consider:**
- Post-combat healing: party rests, Pokemon HP restored, injuries checked
- Full Pokemon Center visit: all Pokemon healed, status cleared
- Mid-combat breather: trainer spends action to heal a Pokemon

**Tier 2 validations to consider:**
- Rest HP recovery formula, injury natural recovery conditions

Read: `core/07-combat.md` (Resting section), `composables/useRestHealing.ts`, `server/api/*/rest.post.ts`

### Pokemon Lifecycle

**Tier 1 workflows to consider:**
- GM creates a new wild Pokemon for an encounter (species → stats → moves → add to encounter)
- Player's Pokemon levels up and learns a new move
- Player's Pokemon evolves mid-session
- GM archives/unarchives Pokemon from a trainer's library

**Tier 2 validations to consider:**
- Stat calculation formula, move learning at level, ability assignment

### Character Lifecycle

**Tier 1 workflows to consider:**
- GM creates a new player character (stats → class → skills → starter Pokemon)
- GM creates an NPC with Pokemon for an upcoming encounter
- Player levels up and allocates new stat points

### Encounter Tables

**Tier 1 workflows to consider:**
- GM creates an encounter table for a route, adds entries, generates a random encounter
- GM modifies table weights for different sub-habitats

### Scenes

**Tier 1 workflows to consider:**
- GM sets up a new scene, positions entities, activates it for the group view
- GM transitions between scenes mid-session (deactivate old, activate new)

### VTT Grid

**Tier 1 workflows to consider:**
- GM moves tokens on the grid during combat (including diagonal movement costs)
- GM toggles fog of war to reveal/hide areas as party explores

## Persistence

Loop files are generated once and reused across testing cycles. Only regenerate when:
- New app features are added to the domain
- A PTU rule interpretation is corrected by Game Logic Reviewer
- The Orchestrator flags loops as stale

## What You Do NOT Do

- Write test scenarios (that's Scenario Crafter)
- Write Playwright code (that's Playtester)
- Make definitive PTU rule interpretations when ambiguous (escalate to Game Logic Reviewer)
- Modify app code
