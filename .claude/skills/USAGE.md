# PTU Skills Ecosystem — Usage Guide

How to use the 12-skill two-ecosystem pipeline to validate the PTU Session Helper app.

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

## Two-Ecosystem Architecture

The ecosystem is split into **Dev** and **Test** halves that communicate through tickets:

```
Dev Terminal                    Test Terminal
────────────                   ──────────────
Developer                      Synthesizer
Senior Reviewer                Crafter
Game Logic Reviewer            Verifier
Code Health Auditor            Playtester
                               Result Verifier
        ←── bug/feature/ux tickets ──→
        ←── retest tickets ──────────→
```

The **Orchestrator** reads both ecosystems and gives parallel recommendations. You can work on both simultaneously — e.g., fixing a bug in the Dev terminal while crafting scenarios for a new domain in the Test terminal.

## Terminal Setup

### Persistent Terminals (keep open all session)

| Terminal | Skill | Ecosystem | How to Start |
|----------|-------|-----------|-------------|
| T1 | Orchestrator | Both | Open Claude Code, run `/orchestrate` |
| T2 | Developer | Dev | Open Claude Code, load `ptu-session-helper-dev.md` at session start |
| T3 | Senior Reviewer | Dev | Open Claude Code, load `ptu-session-helper-senior-reviewer.md` at session start |
| T4 | Playtester | Test | Open Claude Code, run `/playtest` when needed |

### Spin-Up Terminals (open as needed, close when done)

| Terminal | Skill | Ecosystem | Trigger |
|----------|-------|-----------|---------|
| T5 | Gameplay Loop Synthesizer | Test | `/synthesize-loops` |
| T6 | Scenario Crafter | Test | `/craft-scenarios` |
| T7 | Scenario Verifier | Test | `/verify-scenarios` |
| T8 | Result Verifier | Test | `/verify-results` |
| T9 | Game Logic Reviewer | Dev | `/verify-ptu` or `/verify-game-logic` |
| T10 | Feature Designer | Both | When Orchestrator routes gap tickets |
| T11 | Retrospective Analyst | Both | After domain cycles complete |
| T12 | Code Health Auditor | Dev | On demand or after cycles |

You don't need all terminals at once. The Orchestrator tells you which one to open next — and may recommend parallel work across both ecosystems.

## Quick Start: Testing a New Domain

This walks through the full pipeline for a domain (e.g., `combat`) from scratch.

### Step 1 — Ask the Orchestrator what to do

Open **T1** and run:
```
/orchestrate
```

It reads `dev-state.md` and `test-state.md`, sees all domains are "not started", and tells you which domain to begin with and which terminal to open.

### Step 2 — Synthesize gameplay loops

Open **T5** and run:
```
/synthesize-loops
```

Tell it which domain (e.g., "combat"). It reads the PTU rulebook chapters and produces loop files in `artifacts/loops/`.

Close T5 when done.

### Step 3 — Check back with Orchestrator

Go back to **T1** and run `/orchestrate` again. It detects the new loop files and tells you to proceed to the Scenario Crafter.

### Step 4 — Craft scenarios

Open **T6** and run:
```
/craft-scenarios
```

It reads the loop files and produces concrete, testable scenarios with real Pokemon data. Output goes to `artifacts/scenarios/`.

Close T6 when done.

### Step 5 — Verify scenarios

Open **T7** and run:
```
/verify-scenarios
```

It independently re-derives every assertion from the PTU rulebook to catch math errors. Output goes to `artifacts/verifications/`.

If it flags anything `AMBIGUOUS`, open **T9** (`/verify-ptu`) to get a ruling.

Close T7 when done.

### Step 6 — Run the playtest

Open **T4** and run:
```
/playtest
```

It translates verified scenarios into Playwright spec files, executes them, and writes results to `artifacts/results/`.

### Step 7 — Verify results

Open **T8** and run:
```
/verify-results
```

It triages every failure and writes reports + cross-ecosystem tickets:

| Category | Meaning | Goes to |
|----------|---------|---------|
| `APP_BUG` | App code is wrong | Bug ticket → Developer (T2) |
| `FEATURE_GAP` | App lacks the capability | Feature ticket → Feature Designer (T10) |
| `UX_GAP` | Backend works, no UI | UX ticket → Feature Designer (T10) |
| `SCENARIO_BUG` | Scenario assertion was wrong | Correction report → Scenario Crafter (T6) |
| `TEST_BUG` | Playwright issue | Test-fix report → Playtester (T4) |
| `AMBIGUOUS` | PTU rule unclear | Escalation report → Game Logic Reviewer (T9) |

Close T8 when done.

### Step 8 — Fix bugs (Dev terminal)

Go to **T1** (`/orchestrate`). It reads the tickets and tells you which to fix first (CRITICAL before HIGH before MEDIUM).

In **T2** (Developer), read the bug ticket and source report, implement the fix.

In **T3** (Senior Reviewer), review the code changes. Also get a PTU ruling from **T9** if game logic is involved.

### Step 9 — Re-run affected scenarios

Back to **T1** (`/orchestrate`). After both reviews APPROVED, it creates a retest ticket. Go to **T4** — the Playtester picks up the retest ticket and re-runs only the affected scenarios.

Repeat steps 7-9 until all scenarios pass.

## Parallel Work

The Orchestrator may recommend work in both ecosystems simultaneously:

```
## Parallel Recommendation
**Dev Terminal:** Developer — fix bug-001 (CRITICAL)
**Test Terminal:** Scenario Crafter — craft healing scenarios
```

This is safe because the two ecosystems only communicate through tickets. Dev fixing combat bugs doesn't interfere with Test writing healing scenarios.

## Bug Fix Cycle (standalone)

When you've already completed the full loop and just need to fix a specific bug:

1. **T1** `/orchestrate` — identifies open bug tickets and priority
2. **T2** Developer — reads bug ticket + source report, implements fix, commits
3. **T3** Senior Reviewer — reviews code
4. **T9** `/verify-ptu` — confirms PTU correctness (if game logic involved)
5. **T1** `/orchestrate` — both reviews APPROVED, creates retest ticket
6. **T4** `/playtest` — picks up retest ticket, re-runs affected scenario
7. **T8** `/verify-results` — checks new result
8. Repeat until PASS

## Domains

The pipeline covers 8 domains:

| Domain | What it covers |
|--------|---------------|
| `combat` | Damage, initiative, turns, type effectiveness, STAB |
| `capture` | Pokeball mechanics, capture rate, status effects |
| `healing` | Pokemon Center, rest, injuries |
| `character-lifecycle` | Character creation, stats, leveling |
| `pokemon-lifecycle` | Pokemon creation, evolution, moves, abilities |
| `encounter-tables` | Wild encounters, table generation |
| `scenes` | Scene management, GM/group sync |
| `vtt-grid` | Virtual tabletop grid, movement, terrain |

The Orchestrator can recommend parallel domain work — e.g., Dev fixing combat bugs while Test explores healing.

## Artifact Locations

All artifacts live under `app/tests/e2e/artifacts/`:

```
artifacts/
├── tickets/               # Cross-ecosystem communication
│   ├── bug/               # Bug tickets (Test → Dev)
│   ├── ptu-rule/          # PTU rule tickets (Either → Dev)
│   ├── feature/           # Feature gap tickets (Test → Dev)
│   ├── ux/                # UX gap tickets (Test → Dev)
│   └── retest/            # Retest tickets (Dev → Test)
├── loops/                 # Gameplay loop definitions
├── scenarios/             # Concrete test scenarios
├── verifications/         # Independently verified scenarios
├── results/               # Playwright test results
├── reports/               # Testing-internal reports
├── designs/               # Feature design specs
├── refactoring/           # Refactoring tickets
├── reviews/               # Code + rules reviews
├── lessons/               # Retrospective lessons
├── dev-state.md           # Dev ecosystem state (Orchestrator writes)
└── test-state.md          # Test ecosystem state (Orchestrator writes)
```

Playwright spec files: `app/tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts`

## Tips

- **Always return to the Orchestrator** between steps. It tracks both ecosystems so you don't have to.
- **Don't skip the Scenario Verifier.** Catching a math error before running Playwright saves significant time.
- **Parallel work is encouraged.** Dev and Test can work independently. The ticket boundary keeps them decoupled.
- **Persistent terminals preserve context.** Don't close T1 (Orchestrator), T2 (Developer), T3 (Reviewer), or T4 (Playtester) mid-session.
- **Spin-up terminals are disposable.** Close them after they finish their batch to free context.
- **When in doubt, `/orchestrate`.** It reads all artifacts and tells you exactly what to do next.
