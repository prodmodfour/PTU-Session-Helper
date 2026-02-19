# PTU Skills Ecosystem — Usage Guide

How to use the 10-skill two-ecosystem pipeline to validate the PTU Session Helper app.

## Two-Ecosystem Architecture

The ecosystem is split into **Dev** and **Matrix** halves that communicate through tickets:

```
Dev Terminal                    Matrix Terminals
────────────                   ────────────────
Developer                      PTU Rule Extractor     ─┐
Senior Reviewer                App Capability Mapper   ─┤→ Coverage Analyzer → Implementation Auditor
Game Logic Reviewer                                    ─┘
Code Health Auditor
        ←── bug/feature/ptu-rule/ux tickets ──→
```

The **Orchestrator** reads both ecosystems and gives parallel recommendations. You can work on both simultaneously — e.g., fixing a bug in the Dev terminal while extracting rules for a new domain in the Matrix terminal.

**Playtesting is external.** Running Playwright tests against the app happens outside this ecosystem. The ecosystem produces coverage matrices and correctness audits.

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
| T4 | PTU Rule Extractor | Matrix | When Orchestrator directs rule extraction for a domain |
| T5 | App Capability Mapper | Matrix | When Orchestrator directs capability mapping for a domain |
| T6 | Coverage Analyzer | Matrix | When both rules + capabilities are ready for a domain |
| T7 | Implementation Auditor | Matrix | When matrix is ready for a domain |
| T8 | Game Logic Reviewer | Dev | `/verify-ptu` or `/verify-game-logic`, or ambiguous audit items |
| T9 | Retrospective Analyst | Both | After domain cycles complete |
| T10 | Code Health Auditor | Dev | On demand or after cycles |

You don't need all terminals at once. The Orchestrator tells you which one to open next — and may recommend parallel work across both ecosystems.

## Quick Start: Analyzing a New Domain

This walks through the full Feature Matrix workflow for a domain (e.g., `combat`) from scratch.

### Step 1 — Ask the Orchestrator what to do

Open **T1** and run:
```
/orchestrate
```

It reads `dev-state.md` and `test-state.md`, sees all domains are "not started", and tells you which domain to begin with and which terminals to open.

### Step 2 — Extract rules AND map capabilities (parallel)

The Orchestrator will recommend opening two terminals simultaneously:

**Terminal T4 — Rule Extractor:**
```
load .claude/skills/ptu-rule-extractor.md
```
Then: "Extract all PTU rules for domain combat."

It reads the PTU rulebook chapters and produces a rule catalog in `artifacts/matrix/combat-rules.md`.

**Terminal T5 — Capability Mapper** (at the same time):
```
load .claude/skills/app-capability-mapper.md
```
Then: "Map all app capabilities for domain combat."

It reads the app source code and produces a capability catalog in `artifacts/matrix/combat-capabilities.md`.

Close T4 and T5 when both are done.

### Step 3 — Check back with Orchestrator

Go back to **T1** and run `/orchestrate` again. It detects both catalogs and tells you to proceed to the Coverage Analyzer.

### Step 4 — Analyze coverage

Open **T6**:
```
load .claude/skills/coverage-analyzer.md
```
Then: "Analyze coverage for domain combat."

It cross-references every rule against every capability and produces the matrix in `artifacts/matrix/combat-matrix.md` with coverage score and gap priorities.

Close T6 when done.

### Step 5 — Audit implementation correctness

Open **T7**:
```
load .claude/skills/implementation-auditor.md
```
Then: "Audit implementation correctness for domain combat."

It deep-reads source code AND rulebook sections side-by-side to verify every implemented rule is correct. Produces audit in `artifacts/matrix/combat-audit.md`.

If it flags anything `AMBIGUOUS`, open **T8** (`/verify-ptu`) to get a ruling.

Close T7 when done.

### Step 6 — Orchestrator creates tickets

Go to **T1** (`/orchestrate`). It reads the completed matrix and audit, then creates tickets:
- **Bug tickets** for `Incorrect` audit items
- **Feature tickets** for `Missing` matrix items
- **PTU rule tickets** for `Approximation` audit items

### Step 7 — Fix issues (Dev terminal)

The Orchestrator tells you which tickets to fix first (CRITICAL before HIGH before MEDIUM).

In **T2** (Developer), read the ticket and implement the fix.

In **T3** (Senior Reviewer), review the code changes. Also get a PTU ruling from **T8** if game logic is involved.

### Step 8 — Iterate

After fixes, the Orchestrator may recommend re-mapping capabilities (since code changed) or moving to the next domain.

## Parallel Work

The Orchestrator may recommend work in both ecosystems simultaneously:

```
## Parallel Recommendation
**Dev Terminal:** Developer — fix bug-001 (CRITICAL)
**Matrix Terminal A:** Rule Extractor — extract healing rules
**Matrix Terminal B:** Capability Mapper — map healing capabilities
```

This is safe because the two ecosystems only communicate through tickets. Dev fixing combat bugs doesn't interfere with Matrix analyzing the healing domain.

**Within the Matrix Ecosystem**, Steps 2a and 2b (Rule Extractor + Capability Mapper) always run in parallel for maximum throughput. Steps 3 and 4 (Coverage Analyzer + Implementation Auditor) run sequentially since each depends on the previous.

## Bug Fix Cycle (standalone)

When you've already completed the full matrix and just need to fix a specific bug:

1. **T1** `/orchestrate` — identifies open bug tickets and priority
2. **T2** Developer — reads bug ticket, implements fix, commits
3. **T3** Senior Reviewer — reviews code
4. **T8** `/verify-ptu` — confirms PTU correctness (if game logic involved)
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

The Orchestrator can recommend parallel domain work — e.g., Dev fixing combat bugs while Matrix analyzes healing.

## Artifact Locations

All artifacts live under `app/tests/e2e/artifacts/`:

```
artifacts/
├── tickets/               # Cross-ecosystem communication
│   ├── bug/               # Bug tickets (Orchestrator from audit → Dev)
│   ├── ptu-rule/          # PTU rule tickets (Orchestrator/GLR → Dev)
│   ├── feature/           # Feature gap tickets (Orchestrator from matrix → Dev)
│   └── ux/                # UX gap tickets (Orchestrator from matrix → Dev)
├── matrix/                # Feature Matrix workflow
│   ├── <domain>-rules.md          # PTU Rule Extractor output
│   ├── <domain>-capabilities.md   # App Capability Mapper output
│   ├── <domain>-matrix.md         # Coverage Analyzer output
│   └── <domain>-audit.md          # Implementation Auditor output
├── designs/               # Feature design specs (Developer writes when needed)
├── refactoring/           # Refactoring tickets
├── reviews/               # Code + rules reviews
├── lessons/               # Retrospective lessons
├── loops/                 # Legacy: previous Synthesizer runs
├── scenarios/             # Legacy: previous Crafter runs
├── verifications/         # Legacy: previous Verifier runs
├── results/               # Legacy: previous Playtester runs
├── reports/               # Legacy: previous Result Verifier runs
├── dev-state.md           # Dev ecosystem state (Orchestrator writes)
└── test-state.md          # Matrix ecosystem state (Orchestrator writes)
```

## Tips

- **Always return to the Orchestrator** between steps. It tracks both ecosystems so you don't have to.
- **Run Rule Extractor and Capability Mapper in parallel.** They have no dependency on each other and this cuts domain analysis time nearly in half.
- **Parallel work is encouraged.** Dev and Matrix can work independently. The ticket boundary keeps them decoupled.
- **Persistent terminals preserve context.** Don't close T1 (Orchestrator), T2 (Developer), or T3 (Reviewer) mid-session.
- **Spin-up terminals are disposable.** Close them after they finish their domain to free context.
- **When in doubt, `/orchestrate`.** It reads all artifacts and tells you exactly what to do next.
- **Multiple domains can be in different stages.** One domain might be at the audit stage while another is still being extracted. The Orchestrator tracks each independently.
