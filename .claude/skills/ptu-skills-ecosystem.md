# PTU Skills Ecosystem

Master reference for the 12-skill ecosystem that validates the PTU Session Helper through gameplay-driven testing. The ecosystem is organized into two logically separate halves — Dev and Test — coordinated by a single Orchestrator.

## Core Principle

The playtest loop drives the dev loop. Gameplay scenarios — derived from PTU 1.05 rulebooks — define what "correct" means. Development responds to test failures, not the other way around.

## Architecture

**Separate terminals.** Each skill runs in its own Claude Code session. The user acts as liaison between terminals. Skills communicate through persistent artifact files on disk, never through shared context.

**Two ecosystems, one orchestrator.** The Dev Ecosystem handles implementation, reviews, and code health. The Test Ecosystem handles scenario creation, verification, and execution. The Orchestrator reads both and gives parallel recommendations.

**Ticket boundary.** Reports stay internal to the Test ecosystem. Only actionable work items cross the boundary as **tickets** in `artifacts/tickets/`. The `retest` type is the only ticket flowing Dev → Test.

## Two-Ecosystem Diagram

```
                    ┌──────────────────────┐
                    │     Orchestrator     │ ← reads both state files + all ticket dirs
                    │  (advises on BOTH    │   gives parallel recommendations
                    │   ecosystems)        │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┼──────────────────────┐
            │                  │                       │
       DEV ECOSYSTEM     TICKET BOUNDARY      TEST ECOSYSTEM
            │                  │                       │
       Developer          ← bug tickets ←         Synthesizer
       Senior Reviewer    ← ptu-rule tickets ←        ↓
       Game Logic Rev     ← feature tickets ←     Crafter
       Code Health Aud    ← ux tickets ←              ↓
       Retrospective*                             Verifier
       Feature Designer*  → retest tickets →          ↓
                                                  Playtester
                                                      ↓
                                                  Result Verifier
                                                      ↓
                                                  Feature Designer*

* Feature Designer bridges both ecosystems
* Retrospective Analyst reads both ecosystems
```

### Internal Loops

**Test Ecosystem Internal:**
- SCENARIO_BUG → correction report → Scenario Crafter (fix and re-verify)
- TEST_BUG → test-fix report → Playtester (fix selectors/timing)
- AMBIGUOUS → escalation report → Game Logic Reviewer (ruling)

**Dev Ecosystem Internal:**
- CHANGES_REQUIRED review → Developer (address feedback)
- Refactoring tickets → Developer → Senior Reviewer

### Cross-Ecosystem Flow

```
Test Result Verifier ──── bug/feature/ux ticket ────→ Dev Developer
                                                          ↓
                                                    Senior Reviewer ∥ Game Logic Reviewer
                                                          ↓
Dev Orchestrator ──── retest ticket ────→ Test Playtester
                                              ↓
                                         Result Verifier (re-triage)
```

## Skills Summary

Skills are loaded by asking Claude to load the relevant skill file.

### Dev Ecosystem

| # | Skill | Skill File | Input | Output | Terminal |
|---|-------|-----------|-------|--------|----------|
| 1 | Developer | `ptu-session-helper-dev.md` | tickets (bug/feature/ux/ptu-rule), designs, reviews | code commits | persistent |
| 2 | Senior Reviewer | `ptu-session-helper-senior-reviewer.md` | code diffs + tickets | `reviews/code-review-*.md` | persistent |
| 3 | Game Logic Reviewer | `game-logic-reviewer.md` | code/scenarios/escalations | `reviews/rules-review-*.md` | as-needed |
| 4 | Code Health Auditor | `code-health-auditor.md` | source code under `app/` | `refactoring/*.md` | per-audit |

### Test Ecosystem

| # | Skill | Skill File | Input | Output | Terminal |
|---|-------|-----------|-------|--------|----------|
| 5 | Gameplay Loop Synthesizer | `gameplay-loop-synthesizer.md` | rulebooks + app code | `loops/*.md` | per-domain |
| 6 | Scenario Crafter | `scenario-crafter.md` | loop files | `scenarios/*.md` | per-batch |
| 7 | Scenario Verifier | `scenario-verifier.md` | scenario files | `verifications/*.md` | per-batch |
| 8 | Playtester | `playtester.md` | verified scenarios + retest tickets | spec files + `results/*.md` | persistent |
| 9 | Result Verifier | `result-verifier.md` | result files | `reports/*.md` + `tickets/*.md` | per-batch |

### Bridge Skills

| # | Skill | Skill File | Invoked By | Output |
|---|-------|-----------|------------|--------|
| 10 | Orchestrator | `orchestrator.md` | user (start of session) | `dev-state.md`, `test-state.md`, `tickets/retest/*.md` |
| 11 | Feature Designer | `feature-designer.md` | gap tickets from Test | `designs/*.md` + ticket enrichment |
| 12 | Retrospective Analyst | `retrospective-analyst.md` | after cycles complete | `lessons/*.md` |

## Skill Files

```
.claude/skills/
├── ptu-skills-ecosystem.md              ← you are here
├── specification.md                      (full contracts and formats)
├── USAGE.md                              (two-terminal workflow guide)
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
├── tickets/               Cross-ecosystem communication
│   ├── bug/               Result Verifier writes → Developer reads
│   ├── ptu-rule/          Game Logic Reviewer writes → Developer reads
│   ├── feature/           Result Verifier writes → Feature Designer reads → Developer reads
│   ├── ux/                Result Verifier writes → Feature Designer reads → Developer reads
│   └── retest/            Orchestrator writes → Playtester reads
├── loops/                 Synthesizer writes → Crafter reads
├── scenarios/             Crafter writes → Verifier reads
├── verifications/         Verifier writes → Playtester reads
├── results/               Playtester writes → Result Verifier reads
├── reports/               Result Verifier writes (testing internal)
├── designs/               Feature Designer writes → Developer reads (shared read zone)
├── lessons/               Retrospective Analyst writes → all skills read
├── refactoring/           Code Health Auditor writes → Developer/Reviewer reads
├── reviews/               Senior Reviewer + Game Logic Reviewer write → Orchestrator/Developer reads
├── dev-state.md           Orchestrator writes → Dev skills read
└── test-state.md          Orchestrator writes → Test skills read
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
10. Load Result Verifier → reports + tickets written
11. Load Orchestrator → "bug-001 ticket created, start Dev with bug-001"

### Bug Fix Cycle (cross-ecosystem)
1. Dev reads bug ticket + source report → implements fix → commits
2. Senior Reviewer reviews code → writes `reviews/code-review-<NNN>.md` with verdict
3. Game Logic Reviewer confirms PTU correctness → writes `reviews/rules-review-<NNN>.md` with verdict
4. Load Orchestrator → detects both reviews APPROVED → creates retest ticket in `tickets/retest/`
5. Playtester picks up retest ticket → re-runs scenario → new result
6. Result Verifier checks → PASS or new bug ticket

### Parallel Work
The Orchestrator may recommend work in both ecosystems simultaneously:
- **Dev Terminal:** Developer fixing bug-001 while...
- **Test Terminal:** Scenario Crafter writing scenarios for a new domain

### Stale Artifact Detection
Orchestrator compares timestamps:
- Loop newer than its scenarios → scenarios stale, re-craft
- Scenario newer than verification → re-verify
- Verification newer than test result → re-run

## Detailed Contracts

See `specification.md` for full skill contracts, artifact format schemas, and examples.
See `.claude/skills/references/skill-interfaces.md` for YAML frontmatter templates and field definitions.
