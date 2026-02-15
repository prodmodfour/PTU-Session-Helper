# PTU Skills Ecosystem

Master reference for the 12-skill ecosystem that validates the PTU Session Helper through gameplay-driven testing.

## Core Principle

The playtest loop drives the dev loop. Gameplay scenarios — derived from PTU 1.05 rulebooks — define what "correct" means. Development responds to test failures, not the other way around.

## Architecture

**Separate terminals.** Each skill runs in its own Claude Code session. The user acts as liaison between terminals. Skills communicate through persistent artifact files on disk, never through shared context.

## Three-Loop System

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
   Result Verifier
        ├── APP_BUG ──────────→ DEV LOOP (Developer → Reviewer)
        ├── SCENARIO_BUG ─────→ Scenario Crafter (back into TESTING LOOP)
        ├── TEST_BUG ─────────→ Playtester (retry/fix selectors)
        ├── AMBIGUOUS ────────→ Game Logic Reviewer
        ├── FEATURE_GAP ──────→ DESIGN LOOP (Feature Designer → Developer → Reviewer)
        └── UX_GAP ───────────→ DESIGN LOOP (Feature Designer → Developer → Reviewer)

                    ┌────────────────────────┐
                    │ Retrospective Analyst  │ ← runs after cycles complete
                    │  (mines error patterns │   writes per-skill lessons
                    │   across artifacts)    │
                    └────────────────────────┘

                    ┌────────────────────────┐
                    │ Code Health Auditor    │ ← runs after cycles / on-demand
                    │  (scans source code    │   writes refactoring tickets
                    │   for structural debt) │
                    └────────────────────────┘
```

## Skills Summary

Skills are loaded by asking Claude to load the relevant skill file (e.g., "load the orchestrator skill").

| # | Skill | Skill File | Input | Output | Terminal |
|---|-------|-----------|-------|--------|----------|
| 1 | Orchestrator | `orchestrator.md` | artifact dirs | advice (no files) | persistent |
| 2 | Gameplay Loop Synthesizer | `gameplay-loop-synthesizer.md` | rulebooks + app code | `artifacts/loops/` | per-domain |
| 3 | Scenario Crafter | `scenario-crafter.md` | loop files | `artifacts/scenarios/` | per-batch |
| 4 | Scenario Verifier | `scenario-verifier.md` | scenario files | `artifacts/verifications/` | per-batch |
| 5 | Playtester | `playtester.md` | verified scenarios | spec files + `artifacts/results/` | persistent |
| 6 | Result Verifier | `result-verifier.md` | result files | `artifacts/reports/` | per-batch |
| 7 | Developer | `ptu-session-helper-dev.md` | bug reports | code commits | persistent |
| 8 | Senior Reviewer | `ptu-session-helper-senior-reviewer.md` | code diffs + reports | `artifacts/reviews/` | persistent |
| 9 | Game Logic Reviewer | `game-logic-reviewer.md` | code/scenarios/escalations | `artifacts/reviews/` | as-needed |
| 10 | Feature Designer | `feature-designer.md` | gap reports | `artifacts/designs/` | per-gap |
| 11 | Retrospective Analyst | `retrospective-analyst.md` | verifications, results, reports, git history | `artifacts/lessons/` | after cycles / on-demand |
| 12 | Code Health Auditor | `code-health-auditor.md` | source code files under `app/` | `artifacts/refactoring/` | per-audit |

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
├── feature-designer.md
├── ptu-session-helper-dev.md
├── ptu-session-helper-senior-reviewer.md
├── game-logic-reviewer.md
├── retrospective-analyst.md
├── code-health-auditor.md
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
├── reports/            Result Verifier writes → Dev/Crafter/Playtester/Feature Designer reads
├── designs/            Feature Designer writes → Developer reads
├── lessons/            Retrospective Analyst writes → all skills read
├── refactoring/        Code Health Auditor writes → Developer/Reviewer reads
├── reviews/            Senior Reviewer + Game Logic Reviewer write → Orchestrator/Developer reads
└── pipeline-state.md   All skills update → Orchestrator reads
```

Playwright specs: `tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts`

## Authority Hierarchy

| Domain | Final Authority |
|--------|----------------|
| PTU game logic, formulas, rule interpretation | Game Logic Reviewer |
| Code quality, architecture, patterns | Senior Reviewer |
| UI/UX design, feature surface area, user flows | Feature Designer |
| Pipeline sequencing, what to test next | Orchestrator |
| Scenario data accuracy, assertion math | Scenario Verifier |
| Failure classification (6 categories) | Result Verifier |
| Pattern identification and lesson accuracy | Retrospective Analyst |
| Structural code health issues and refactoring priority | Code Health Auditor |

## Orchestration Patterns

### Full Loop (new domain)
1. Load Orchestrator → "Start Synthesizer for domain X"
2. Load Synthesizer → loops written
3. Load Orchestrator → "Loops ready, start Crafter"
4. Load Crafter → scenarios written
5. Load Orchestrator → "Scenarios ready, start Verifier"
6. Load Verifier → verifications written
7. Load Orchestrator → "Verified, start Playtester"
8. Load Playtester → specs + results written
9. Load Orchestrator → "Results ready, start Result Verifier"
10. Load Result Verifier → reports written
11. Load Orchestrator → "3 bugs found, start Dev with bug-001"

### Bug Fix Cycle
1. Dev reads bug report → implements fix → commits
2. Senior Reviewer reviews code → writes `artifacts/reviews/code-review-<NNN>.md` with verdict
3. Game Logic Reviewer confirms PTU correctness → writes `artifacts/reviews/rules-review-<NNN>.md` with verdict
4. Load Orchestrator → detects both reviews APPROVED → "Fix approved, re-run scenario X"
5. Playtester re-runs → new result
6. Result Verifier checks → PASS or new issue

### Targeted Test (feature change)
1. Load Orchestrator → "Change touches combat domain, existing loops cover it — re-run scenarios 001-004"
2. Skip Synthesizer/Crafter/Verifier — artifacts current
3. Playtester re-runs affected scenarios only

### Stale Artifact Detection
Orchestrator compares timestamps in `pipeline-state.md`:
- Loop newer than its scenarios → scenarios stale, re-craft
- Scenario newer than verification → re-verify
- Verification newer than test result → re-run

## Detailed Contracts

See `specification.md` for full skill contracts, artifact format schemas, and examples.
See `.claude/skills/references/skill-interfaces.md` for YAML frontmatter templates and field definitions.
