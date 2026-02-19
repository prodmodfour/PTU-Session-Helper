# PTU Skills Ecosystem — Usage Guide

How to use the 10-skill two-ecosystem pipeline to validate the PTU Session Helper app.

## Two-Ecosystem Architecture

The ecosystem is split into **Dev** and **Test** halves that communicate through tickets:

```
Dev Terminal                    Test Terminal
────────────                   ──────────────
Developer                      Synthesizer
Senior Reviewer                Crafter
Game Logic Reviewer            Verifier
Code Health Auditor            Feature Designer (gap detection)
        ←── bug/feature/ux tickets ──→
```

The **Orchestrator** reads both ecosystems and gives parallel recommendations. You can work on both simultaneously — e.g., fixing a bug in the Dev terminal while crafting scenarios for a new domain in the Test terminal.

**Playtesting is external.** Running Playwright tests against the app happens outside this ecosystem. The ecosystem produces verified scenarios and design specs.

## Terminal Setup

### Persistent Terminals (keep open all session)

| Terminal | Skill | Ecosystem | How to Start |
|----------|-------|-----------|-------------|
| T1 | Orchestrator | Both | Open Claude Code, run `/orchestrate` |
| T2 | Developer | Dev | Open Claude Code, load `ptu-session-helper-dev.md` at session start |
| T3 | Senior Reviewer | Dev | Open Claude Code, load `ptu-session-helper-senior-reviewer.md` at session start |

### Spin-Up Terminals (open as needed, close when done)

| Terminal | Skill | Ecosystem | Trigger |
|----------|-------|-----------|---------|
| T4 | Gameplay Loop Synthesizer | Test | `/synthesize-loops` |
| T5 | Scenario Crafter | Test | `/craft-scenarios` |
| T6 | Scenario Verifier | Test | `/verify-scenarios` |
| T7 | Game Logic Reviewer | Dev | `/verify-ptu` or `/verify-game-logic` |
| T8 | Feature Designer | Both | When Orchestrator routes gap detection or gap tickets |
| T9 | Retrospective Analyst | Both | After domain cycles complete |
| T10 | Code Health Auditor | Dev | On demand or after cycles |

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

Open **T4** and run:
```
/synthesize-loops
```

Tell it which domain (e.g., "combat"). It reads the PTU rulebook chapters and produces loop files in `artifacts/loops/`.

Close T4 when done.

### Step 3 — Check back with Orchestrator

Go back to **T1** and run `/orchestrate` again. It detects the new loop files and tells you to proceed to the Scenario Crafter.

### Step 4 — Craft scenarios

Open **T5** and run:
```
/craft-scenarios
```

It reads the loop files and produces concrete, testable scenarios with real Pokemon data. Output goes to `artifacts/scenarios/`.

Close T5 when done.

### Step 5 — Verify scenarios

Open **T6** and run:
```
/verify-scenarios
```

It independently re-derives every assertion from the PTU rulebook to catch math errors. Output goes to `artifacts/verifications/`.

If it flags anything `AMBIGUOUS`, open **T7** (`/verify-ptu`) to get a ruling.

Close T6 when done.

### Step 6 — Run gap detection

Open **T8** (Feature Designer). It reads the verified scenarios and checks each step against the app surface:
- Does the API endpoint exist?
- Does the UI expose the action?
- Is the data model complete?

For missing capabilities, it creates tickets (feature-gap, ux-gap, or bug) and design specs for FULL-scope gaps.

### Step 7 — Fix gaps (Dev terminal)

Go to **T1** (`/orchestrate`). It reads the tickets and tells you which to fix first (CRITICAL before HIGH before MEDIUM).

In **T2** (Developer), read the ticket and design spec, implement the fix.

In **T3** (Senior Reviewer), review the code changes. Also get a PTU ruling from **T7** if game logic is involved.

### Step 8 — Iterate

Repeat steps 6-7 for remaining gaps. The Orchestrator tracks progress across both ecosystems.

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
2. **T2** Developer — reads bug ticket, implements fix, commits
3. **T3** Senior Reviewer — reviews code
4. **T7** `/verify-ptu` — confirms PTU correctness (if game logic involved)
5. **T1** `/orchestrate` — both reviews APPROVED, updates state

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
│   ├── bug/               # Bug tickets (Feature Designer → Dev)
│   ├── ptu-rule/          # PTU rule tickets (Either → Dev)
│   ├── feature/           # Feature gap tickets (Feature Designer → Dev)
│   └── ux/                # UX gap tickets (Feature Designer → Dev)
├── loops/                 # Gameplay loop definitions
├── scenarios/             # Concrete test scenarios
├── verifications/         # Independently verified scenarios
├── designs/               # Feature design specs
├── refactoring/           # Refactoring tickets
├── reviews/               # Code + rules reviews
├── lessons/               # Retrospective lessons
├── results/               # Legacy: previous Playtester runs
├── reports/               # Legacy: previous Result Verifier runs
├── dev-state.md           # Dev ecosystem state (Orchestrator writes)
└── test-state.md          # Test ecosystem state (Orchestrator writes)
```

## Tips

- **Always return to the Orchestrator** between steps. It tracks both ecosystems so you don't have to.
- **Don't skip the Scenario Verifier.** Catching a math error before gap detection saves significant time.
- **Parallel work is encouraged.** Dev and Test can work independently. The ticket boundary keeps them decoupled.
- **Persistent terminals preserve context.** Don't close T1 (Orchestrator), T2 (Developer), or T3 (Reviewer) mid-session.
- **Spin-up terminals are disposable.** Close them after they finish their batch to free context.
- **When in doubt, `/orchestrate`.** It reads all artifacts and tells you exactly what to do next.
