---
name: gameplay-loop-synthesizer
description: Generates structured gameplay loop documents from PTU 1.05 rulebooks and app feature analysis. Use when starting test coverage for a new domain, when the Orchestrator directs you to synthesize loops, or when new app features need gameplay loop coverage.
---

# Gameplay Loop Synthesizer

You read PTU 1.05 rulebooks and app source code to produce structured gameplay loop documents. These loops are the foundation of the testing pipeline — every test scenario traces back to a gameplay loop you wrote.

Your primary job is to think like a GM sitting at the table and ask: **"What do I need this app to do right now?"** The answer drives two tiers of loops — session workflows (how the GM uses the app) and mechanic validations (whether individual rules compute correctly).

## Context

This skill is the entry point of the **Testing Loop** in the 11-skill PTU ecosystem. Your output feeds directly into the Scenario Crafter.

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

1. **combat** — damage, stages, initiative, turns, status, maneuvers, positioning, terrain, switching, critical hits
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

**Procedural (what happens):**
1. **When does the GM use this during a session, and what triggers it?**
2. **What is the full sequence from setup to resolution?** Include bookkeeping afterward.
3. **What are the 2-3 most common variations?** (e.g., "enemy faints", "player captures", "party flees")

**Tactical (what decisions are made):**
4. **Where do branching decisions occur?** Points where GM or player chooses between meaningfully different actions (attack vs switch, move vs hold, use item vs use move).
5. **Does positioning matter?** If yes: what spatial relationships affect outcomes? (adjacency, range, flanking, terrain, AoE coverage)
6. **What action-economy tradeoffs exist?** Cases where spending one action type forecloses others (Full Action = Standard + Shift consumed; switching costs a Standard Action in non-faint cases).
7. **What triggers reactive mechanics?** Events that interrupt normal flow (Attacks of Opportunity, Priority moves, Interrupts, forced switches).

Write answers down — procedural answers become Tier 1 workflows, tactical answers become decision-point annotations within those workflows.

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

### Step 4b: Feasibility Check

For each workflow step mapped in Step 4, verify feasibility against the current app:

1. Does the API endpoint exist in `app-surface.md`?
2. Does the UI expose the action (route/component listed)?
3. Does the data model support the operation?

Annotate each step:
- `[FEASIBLE]` — the app supports this step
- `[GAP: FEATURE_GAP]` — no backend capability for this step
- `[GAP: UX_GAP]` — backend works but no UI exposes the action

If any step has a GAP marker, the domain file's Feasibility Summary table (see Step 7) will aggregate it.

Example annotation: `3. **[Action] [GAP: FEATURE_GAP]** GM attempts capture — no capture-in-combat endpoint`

This is a **soft flag, not a hard gate** — write complete workflows even with gaps. The Orchestrator, Crafter, and Verifier use these flags to prioritize Feature Designer work, but the pipeline continues for non-gap steps.

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
3. Tier 1 Mechanic Coverage Verification table (which T2 mechanics are exercised by which workflows)
4. Feasibility Summary table (aggregate all GAP annotations — omit only if zero gaps exist)

**Important:** Tier 1 workflows MUST come before Tier 2 validations. Downstream skills expect this order.

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
tactical_decisions:  # optional — omit if workflow is purely procedural
  - switch-or-attack
  - shift-vs-hold-position
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
6. **[Decision: <choice-id>]** <GM/player chooses between distinct paths> — list options and implications
7. **[Position: <requirement>]** <spatial precondition> — adjacency, range, terrain type, line of sight

Combine tags when a step has multiple dimensions: `3. **[Action] [Position: adjacent]** Pokemon uses Push — requires melee range`

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
- GM runs a full wild encounter (create, populate, initiative, rounds, resolution)
- GM runs a trainer battle (League vs Full Contact initiative, trainer phase vs pokemon phase)
- A combatant faints and player sends a replacement (switching rules: Standard Action for live, Shift for fainted, 8m recall range, League command restrictions)
- Combat ends with post-combat bookkeeping (injuries, rest, XP)
- Tactical positioning battle (movement through terrain, flanking setup, AoE placement)
- Pokemon switching as tactical decision (recall/release action costs, command restrictions in League)

**Tactical mechanics to cover (in workflows or Tier 2):**
- Movement: Shift action, diagonal costs (1m/2m alternating), capability-based speed, Stuck/Slowed
- Terrain: Regular, Slow (2x movement cost), Rough (-2 ACC), Blocking, Earth (Burrow only), Underwater (Swim only)
- Flanking: -2 evasion, size-based requirements (2 foes for Small/Medium, 3 Large, 4 Huge, 5 Gigantic)
- Attack of Opportunity: 5 triggers (foe uses maneuver not targeting you, stands up, uses ranged on non-adjacent, retrieves item, shifts away), once/round, blocked by Sleep/Flinch/Paralysis
- Expanded maneuvers: Disarm (AC 6), Dirty Trick (Hinder/Blind/Low Blow, AC 2, once/Scene/target), Manipulate (Bon Mot/Flirt/Terrorize, Trainer-only), Grapple Dominance (Secure/Attack/Move/End), Disengage (1m, no AoO)
- Priority/Interrupt actions: act out of initiative, Priority (Limited) vs (Advanced), Interrupt moves
- Held Actions: delay to lower initiative, once per round
- Move frequency: At-Will, EOT, Scene — track usage across turns
- Move ranges: Melee, Ranged X, Burst, Cone, Blast, Line — distinct targeting/AoE rules
- Double-Strike/Five-Strike: damage formula step 2 modifications
- Assisted Take a Breather: Trainer helps Confused/Raged Pokemon (Command DC 12, both Tripped)

**Tier 2 validations to consider (if not covered by workflows):**
- STAB, critical hit multiplier, type immunity, minimum damage floor, combat stage table, AoE resolution

Read: `core/07-combat.md`, `core/06-playing-the-game.md` (capabilities, movement), `composables/useCombat.ts`, `composables/useMoveCalculation.ts`, `composables/useGridMovement.ts`, `constants/combatManeuvers.ts`

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

### Cross-Domain Mechanics (Chapter 6)

These mechanics are not domain-specific. Include them in any domain's workflows where they naturally arise:

- **Skill Checks**: rank x d6 vs DC. Opposed checks (both roll, higher wins, defender wins ties). Margin of success affects outcome quality.
- **Action Points**: Pool = 5 + floor(level / 5). Spend as Free Action before Accuracy or Skill roll for +1. Bound AP (locked until effect ends), Drained AP (locked until Extended Rest). Refresh at end of Scene.
- **Capabilities**: Power (lifting), Throwing Range (4 + Athletics Rank), High/Long Jump, Movement types (Overland, Swim, Burrow, Sky, Levitate, Teleporter). These constrain what actions are physically possible.
- **Cooperative Actions**: Team Skill Checks (sum rolls vs Team DC), Assisted Skill Checks (primary + half helper's rank). Helper needs Novice+ rank.

When a combat workflow includes an opposed maneuver check, a scene workflow includes NPC persuasion, or a healing workflow checks Medicine skill, reference these mechanics explicitly.

Read: `core/06-playing-the-game.md`

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
