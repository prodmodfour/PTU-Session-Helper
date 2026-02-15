---
name: gameplay-loop-synthesizer
description: Generates structured gameplay loop documents from PTU 1.05 rulebooks and app feature analysis. Use when starting test coverage for a new domain, when the Orchestrator directs you to synthesize loops, or when new app features need gameplay loop coverage.
---

# Gameplay Loop Synthesizer

You read PTU 1.05 rulebooks and app source code to produce structured gameplay loop documents. These loops are the foundation of the testing pipeline — every test scenario traces back to a gameplay loop you wrote.

## Context

This skill is the entry point of the **Testing Loop** in the 10-skill PTU ecosystem. Your output feeds directly into the Scenario Crafter.

**Pipeline position:** You → Scenario Crafter → Scenario Verifier → Playtester → Result Verifier

**Output location:** `app/tests/e2e/artifacts/loops/<domain>.md`

See `ptu-skills-ecosystem.md` for the full architecture.

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

### Step 2: Read Rulebook

Look up the domain's rulebook chapters in `.claude/skills/references/ptu-chapter-index.md`.

For each chapter:
1. Read the relevant sections from `books/markdown/core/`
2. Check `books/markdown/errata-2.md` for corrections
3. Extract the core rules, formulas, and decision points

**Important:** Read the actual rulebook text. Do not rely on memory or summaries — PTU has specific numbers and edge cases that matter.

### Step 3: Map to App Features

Read `.claude/skills/references/app-surface.md` to identify which app features implement the domain's rules:

1. **Routes** — which pages does the user interact with?
2. **API endpoints** — which server actions execute the mechanics?
3. **Stores/composables** — which client code contains the logic?

For each mechanic, note:
- The app file that implements it
- Whether it's client-side, server-side, or both
- Any WebSocket events that broadcast the result

### Step 4: Generate Loops

For each core gameplay flow in the domain, write a loop document following the format in `.claude/skills/references/skill-interfaces.md`.

**What makes a good loop:**
- Covers one complete user flow from start to observable outcome
- References specific PTU rules with file:section pointers
- References specific app files that implement it
- Identifies the expected numerical outcomes (not just "damage is applied" but "damage = ATK + Roll - DEF")
- Lists edge cases as sub-loops

**How to identify loops within a domain:**

1. **Start with the happy path** — the most common, simplest version of the mechanic
2. **Add modifier loops** — what changes the outcome? (STAB, type effectiveness, stages, status)
3. **Add edge case loops** — what can go wrong? (0 HP, max stages, immunity, fainted)
4. **Add interaction loops** — how does this mechanic interact with others? (capture during combat, healing mid-encounter)

### Step 5: Identify Edge Cases

For each main loop, list sub-loops for:
- Boundary values (0 HP, max level, empty inventory)
- Special conditions (status effects, weather, terrain)
- Interaction with other domains (combat + capture, healing + injuries)
- Failure paths (capture fails, not enough AP for heal)

### Step 6: Write and Save

Write the complete loop document to `app/tests/e2e/artifacts/loops/<domain>.md`.

Then update `app/tests/e2e/artifacts/pipeline-state.md`:
- Set the domain's Loops stage to "complete"
- Record the loop count and timestamp

## Output Format

Use the Gameplay Loop format from `.claude/skills/references/skill-interfaces.md`:

```markdown
---
loop_id: <domain>-<description>
domain: <domain>
ptu_refs:
  - core/07-combat.md#damage-roll
app_features:
  - composables/useCombat.ts
  - server/services/combatant.service.ts
sub_loops:
  - <domain>-<edge-case>
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

## Sub-Loop: <edge-case-name>
<!-- Same structure as main loop -->
```

## Domain-Specific Guidance

### Combat
Key loops: basic attack, special attack, critical hit, STAB, type effectiveness, combat stages, status conditions, maneuvers (Struggle, Shift, Run), initiative order, turn progression, multi-target moves.

Read: `core/07-combat.md`, `composables/useCombat.ts`, `composables/useMoveCalculation.ts`

### Capture
Key loops: basic capture, status bonus, HP modifier, ball type modifier, evolution stage modifier, legendary/shiny penalty, capture success, capture failure.

Read: `core/05-pokemon.md` (Capture Rate section), `composables/useCapture.ts`, `server/api/capture/`

### Healing
Key loops: 30-min rest, extended rest, Pokemon Center, injury healing (natural vs drain AP), new day reset, breather (mid-combat).

Read: `core/07-combat.md` (Resting section), `composables/useRestHealing.ts`, `server/api/*/rest.post.ts`

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
