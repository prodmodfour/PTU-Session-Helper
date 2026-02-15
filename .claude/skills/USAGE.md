# PTU Skills Ecosystem — Usage Guide

How to use the 9-skill testing pipeline to validate the PTU Session Helper app.

## Prerequisites

Before starting, ensure:

1. **Dev server running** on port 3001:
   ```bash
   cd app && npm run dev
   ```

2. **Database seeded**:
   ```bash
   cd app && npx prisma db seed
   ```

3. **Playwright browsers installed**:
   ```bash
   cd app && npx playwright install chromium
   ```

## Terminal Setup

Each skill runs in its own Claude Code terminal. You act as the liaison — copy-pasting context and following the Orchestrator's guidance.

### Persistent Terminals (keep open all session)

| Terminal | Skill | How to Start |
|----------|-------|-------------|
| T1 | Orchestrator | Open Claude Code, run `/orchestrate` |
| T2 | Developer | Open Claude Code, load `ptu-session-helper-dev.md` at session start |
| T3 | Senior Reviewer | Open Claude Code, load `ptu-session-helper-senior-reviewer.md` at session start |
| T4 | Playtester | Open Claude Code, run `/playtest` when needed |

### Spin-Up Terminals (open as needed, close when done)

| Terminal | Skill | Trigger |
|----------|-------|---------|
| T5 | Gameplay Loop Synthesizer | `/synthesize-loops` |
| T6 | Scenario Crafter | `/craft-scenarios` |
| T7 | Scenario Verifier | `/verify-scenarios` |
| T8 | Result Verifier | `/verify-results` |
| T9 | Game Logic Reviewer | `/verify-ptu` or `/verify-game-logic` |

You don't need all terminals at once. The Orchestrator tells you which one to open next.

## Quick Start: Testing a New Domain

This walks through the full pipeline for a domain (e.g., `combat`) from scratch.

### Step 1 — Ask the Orchestrator what to do

Open **T1** and run:
```
/orchestrate
```

It reads `app/tests/e2e/artifacts/pipeline-state.md`, sees all domains are "not started", and tells you which domain to begin with and which terminal to open.

### Step 2 — Synthesize gameplay loops

Open **T5** and run:
```
/synthesize-loops
```

Tell it which domain (e.g., "combat"). It reads the PTU rulebook chapters and produces loop files in `app/tests/e2e/artifacts/loops/`.

Close T5 when done.

### Step 3 — Check back with Orchestrator

Go back to **T1** and run `/orchestrate` again. It sees the new loop files and tells you to proceed to the Scenario Crafter.

### Step 4 — Craft scenarios

Open **T6** and run:
```
/craft-scenarios
```

It reads the loop files and produces concrete, testable scenarios with real Pokemon data and calculated expected values. Output goes to `app/tests/e2e/artifacts/scenarios/`.

Close T6 when done.

### Step 5 — Verify scenarios

Open **T7** and run:
```
/verify-scenarios
```

It independently re-derives every assertion from the PTU rulebook to catch math errors or incorrect data. Output goes to `app/tests/e2e/artifacts/verifications/`.

If it flags anything `AMBIGUOUS`, open **T9** (`/verify-ptu`) to get a ruling.

Close T7 when done.

### Step 6 — Run the playtest

Open **T4** and run:
```
/playtest
```

It translates verified scenarios into Playwright spec files, executes them against the running dev server, and writes results to `app/tests/e2e/artifacts/results/`.

### Step 7 — Verify results

Open **T8** and run:
```
/verify-results
```

It triages every failure into one of four categories and writes reports to `app/tests/e2e/artifacts/reports/`:

| Category | Meaning | Goes to |
|----------|---------|---------|
| `APP_BUG` | App code is wrong | Developer (T2) |
| `SCENARIO_BUG` | Scenario assertion was wrong | Scenario Crafter (T6) |
| `TEST_BUG` | Playwright issue | Playtester (T4) |
| `AMBIGUOUS` | PTU rule unclear | Game Logic Reviewer (T9) |

Close T8 when done.

### Step 8 — Fix bugs

Go to **T1** (`/orchestrate`). It reads the reports and tells you which bug to fix first (CRITICAL before HIGH before MEDIUM).

In **T2** (Developer), read the bug report and implement the fix. After committing, the Developer annotates the bug report's Fix Log section.

In **T3** (Senior Reviewer), review the code changes. If the fix involves game logic, also get a ruling from **T9** (`/verify-ptu`).

### Step 9 — Re-run affected scenarios

Back to **T1** (`/orchestrate`). It knows which scenarios to re-run based on the fix. Go to **T4** and re-run only those scenarios.

Repeat steps 7-9 until all scenarios pass.

## Bug Fix Cycle (standalone)

When you've already completed the full loop and just need to fix a specific bug:

1. **T1** `/orchestrate` — identifies open bugs and priority
2. **T2** Developer — reads bug report, implements fix, commits
3. **T3** Senior Reviewer — reviews code
4. **T9** `/verify-ptu` — confirms PTU correctness (if game logic involved)
5. **T1** `/orchestrate` — "Fix approved, re-run scenario X"
6. **T4** `/playtest` — re-runs affected scenario
7. **T8** `/verify-results` — checks new result
8. Repeat until PASS

## Targeted Test (after a feature change)

When you change a feature and want to validate it against existing scenarios:

1. **T1** `/orchestrate` — it detects which domain your change touches and whether existing artifacts are still current
2. If artifacts are current: skip straight to **T4** `/playtest` to re-run affected scenarios
3. If artifacts are stale: Orchestrator tells you which step to restart from (re-craft, re-verify, etc.)

## Domains

The pipeline covers 8 domains:

| Domain | What it covers |
|--------|---------------|
| `combat` | Damage, initiative, turns, type effectiveness, STAB |
| `capture` | Pokeball mechanics, capture rate, status effects |
| `character-lifecycle` | Character creation, stats, leveling |
| `pokemon-lifecycle` | Pokemon creation, evolution, moves, abilities |
| `healing` | Pokemon Center, items, rest |
| `encounter-tables` | Wild encounters, table generation |
| `scenes` | Scene management, GM/group sync |
| `vtt-grid` | Virtual tabletop grid, movement, terrain |

Work through one domain at a time. The Orchestrator tracks progress across all domains.

## Artifact Locations

All artifacts live under `app/tests/e2e/artifacts/`:

```
artifacts/
├── loops/              # Gameplay loop definitions
├── scenarios/          # Concrete test scenarios
├── verifications/      # Independently verified scenarios
├── results/            # Playwright test results
├── reports/            # Bug reports, corrections, escalations
└── pipeline-state.md   # Pipeline progress tracker
```

Playwright spec files: `app/tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts`

## Tips

- **Always return to the Orchestrator** between steps. It tracks state so you don't have to.
- **Don't skip the Scenario Verifier.** Catching a math error before running Playwright saves significant time.
- **One domain at a time.** Get a domain to all-PASS before moving to the next.
- **Persistent terminals preserve context.** Don't close T1 (Orchestrator), T2 (Developer), T3 (Reviewer), or T4 (Playtester) mid-session.
- **Spin-up terminals are disposable.** Close them after they finish their batch to free context.
- **When in doubt, `/orchestrate`.** It reads all artifacts and tells you exactly what to do next.
