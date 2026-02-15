# PTU Skills Ecosystem

Master reference for the 9-skill ecosystem that validates the PTU Session Helper through gameplay-driven testing.

## Core Principle

The playtest loop drives the dev loop. Gameplay scenarios — derived from PTU 1.05 rulebooks — define what "correct" means. Development responds to test failures, not the other way around.

## Architecture

**Separate terminals.** Each skill runs in its own Claude Code session. The user acts as liaison between terminals. Skills communicate through persistent artifact files on disk, never through shared context.

## Two-Loop System

```
                    ┌──────────────┐
                    │ Orchestrator │ ← reads artifacts, advises user
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────────┐
        │                  │                       │
   TESTING LOOP       DEV LOOP              REVIEW LOOP
        │                  │                       │
   Synthesizer        Developer              Reviewer
        ↓                  ↑                 Game Logic
   Crafter            (fixes bugs)           Reviewer
        ↓                  │                       │
   Verifier           ←────┴───────────────────────┘
        ↓                        (bug reports)
   Playtester
        ↓
   Result Verifier ──→ issues ──→ Dev Loop / Crafter / Playtester
```

## Skills Summary

| # | Skill | Trigger | Input | Output | Terminal |
|---|-------|---------|-------|--------|----------|
| 1 | Orchestrator | `/orchestrate` | artifact dirs | advice (no files) | persistent |
| 2 | Gameplay Loop Synthesizer | `/synthesize-loops` | rulebooks + app code | `artifacts/loops/` | per-domain |
| 3 | Scenario Crafter | `/craft-scenarios` | loop files | `artifacts/scenarios/` | per-batch |
| 4 | Scenario Verifier | `/verify-scenarios` | scenario files | `artifacts/verifications/` | per-batch |
| 5 | Playtester | `/playtest` | verified scenarios | spec files + `artifacts/results/` | persistent |
| 6 | Result Verifier | `/verify-results` | result files | `artifacts/reports/` | per-batch |
| 7 | Developer | (load at start) | bug reports | code commits | persistent |
| 8 | Senior Reviewer | (load at start) | code diffs + reports | review feedback | persistent |
| 9 | Game Logic Reviewer | `/verify-ptu` | code/scenarios/escalations | PTU compliance report | as-needed |

## Skill Files

```
.claude/skills/
├── ptu-skills-ecosystem.md              ← you are here
├── specification.md                      (full contracts and formats)
├── orchestrator.md
├── gameplay-loop-synthesizer.md
├── scenario-crafter.md
├── scenario-verifier.md
├── playtester.md
├── result-verifier.md
├── ptu-session-helper-dev.md
├── ptu-session-helper-senior-reviewer.md
├── game-logic-reviewer.md
├── skill_creation.md                     (unchanged — skill authoring guide)
└── references/
    ├── ptu-chapter-index.md              (rulebook lookup)
    ├── skill-interfaces.md               (data contracts)
    ├── app-surface.md                    (routes, APIs, stores)
    └── playwright-patterns.md            (e2e patterns)
```

## Artifact Flow

```
artifacts/
├── loops/              Synthesizer writes → Crafter reads
├── scenarios/          Crafter writes → Verifier reads
├── verifications/      Verifier writes → Playtester reads
├── results/            Playtester writes → Result Verifier reads
├── reports/            Result Verifier writes → Dev/Crafter/Playtester reads
└── pipeline-state.md   All skills update → Orchestrator reads
```

Playwright specs: `tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts`

## Authority Hierarchy

| Domain | Final Authority |
|--------|----------------|
| PTU game logic, formulas, rule interpretation | Game Logic Reviewer |
| Code quality, architecture, patterns | Senior Reviewer |
| Pipeline sequencing, what to test next | Orchestrator |
| Scenario data accuracy, assertion math | Scenario Verifier |
| Failure classification | Result Verifier |

## Orchestration Patterns

### Full Loop (new domain)
1. `/orchestrate` → "Start Synthesizer for domain X"
2. `/synthesize-loops` → loops written
3. `/orchestrate` → "Loops ready, start Crafter"
4. `/craft-scenarios` → scenarios written
5. `/orchestrate` → "Scenarios ready, start Verifier"
6. `/verify-scenarios` → verifications written
7. `/orchestrate` → "Verified, start Playtester"
8. `/playtest` → specs + results written
9. `/orchestrate` → "Results ready, start Result Verifier"
10. `/verify-results` → reports written
11. `/orchestrate` → "3 bugs found, start Dev with bug-001"

### Bug Fix Cycle
1. Dev reads bug report → implements fix → commits
2. Reviewer approves → notes affected scenarios
3. Game Logic Reviewer confirms PTU correctness
4. `/orchestrate` → "Fix approved, re-run scenario X"
5. Playtester re-runs → new result
6. Result Verifier checks → PASS or new issue

### Targeted Test (feature change)
1. `/orchestrate` → "Change touches combat domain, existing loops cover it — re-run scenarios 001-004"
2. Skip Synthesizer/Crafter/Verifier — artifacts current
3. Playtester re-runs affected scenarios only

### Stale Artifact Detection
Orchestrator compares timestamps in `pipeline-state.md`:
- Loop newer than its scenarios → scenarios stale, re-craft
- Scenario newer than verification → re-verify
- Verification newer than test result → re-run

## Detailed Contracts

See `specification.md` for full skill contracts, artifact format schemas, and examples.
See `references/skill-interfaces.md` for YAML frontmatter templates and field definitions.
