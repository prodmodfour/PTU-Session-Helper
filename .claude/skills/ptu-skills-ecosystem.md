# PTU Skills Ecosystem

Master reference for the 10-skill ecosystem that validates the PTU Session Helper through direct PTU rule-to-code coverage analysis. The ecosystem is organized into two logically separate halves — Dev and Matrix — coordinated by a single Orchestrator.

## Core Principle

The Feature Matrix drives the dev loop. Every PTU rule is extracted, every app capability is mapped, and the two are cross-referenced to find gaps and verify correctness. Development responds to matrix gaps and audit findings, not indirect scenario testing.

## Architecture

**Separate terminals.** Each skill runs in its own Claude Code session. The user acts as liaison between terminals. Skills communicate through persistent artifact files on disk, never through shared context.

**Two ecosystems, one orchestrator.** The Dev Ecosystem handles implementation, reviews, and code health. The Matrix Ecosystem handles rule extraction, capability mapping, coverage analysis, and implementation auditing. The Orchestrator reads both and gives parallel recommendations.

**Ticket boundary.** Matrix artifacts stay in `artifacts/matrix/`. Only actionable work items cross the boundary as **tickets** in `artifacts/tickets/`, created by the Orchestrator from completed matrix analyses.

**Playtesting is external.** Running Playwright tests against the app happens outside this ecosystem. The ecosystem produces coverage matrices and correctness audits; actual test execution is a separate concern.

## Two-Ecosystem Diagram

```
                    ┌──────────────────────┐
                    │     Orchestrator     │ ← reads both state files + all ticket dirs
                    │  (advises on BOTH    │   creates tickets from completed matrices
                    │   ecosystems)        │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┼──────────────────────┐
            │                  │                       │
       DEV ECOSYSTEM     TICKET BOUNDARY      MATRIX ECOSYSTEM
            │                  │                       │
       Developer          ← bug tickets ←       Rule Extractor ──┐
       Senior Reviewer    ← feature tickets ←                    ├→ Coverage Analyzer
       Game Logic Rev     ← ptu-rule tickets ←  Capability Mapper┘        │
       Code Health Aud    ← ux tickets ←                         Implementation Auditor
       Retrospective*                                                     │
                                                              Orchestrator reads matrix,
                                                              creates tickets
```

* Retrospective Analyst reads both ecosystems

### Internal Loops

**Matrix Ecosystem Internal:**
- AMBIGUOUS audit items → Game Logic Reviewer (ruling) → re-audit
- App code changed → re-map capabilities → re-analyze → re-audit

**Dev Ecosystem Internal:**
- CHANGES_REQUIRED review → Developer (address feedback)
- Refactoring tickets → Developer → Senior Reviewer

### Cross-Ecosystem Flow

```
Orchestrator ──── reads matrix + audit ────→ creates bug/feature/ptu-rule tickets
                                                      ↓
                                                Dev Developer
                                                      ↓
                                                Senior Reviewer ∥ Game Logic Reviewer
                                                      ↓
                                                Orchestrator updates state
```

## Skills Summary

Skills are loaded by asking Claude to load the relevant skill file.

### Dev Ecosystem

| # | Skill | Skill File | Input | Output | Terminal |
|---|-------|-----------|-------|--------|----------|
| 1 | Developer | `ptu-session-helper-dev.md` | tickets (bug/feature/ux/ptu-rule), designs, reviews | code commits | persistent |
| 2 | Senior Reviewer | `ptu-session-helper-senior-reviewer.md` | code diffs + tickets | `reviews/code-review-*.md` | persistent |
| 3 | Game Logic Reviewer | `game-logic-reviewer.md` | code/audit ambiguities/escalations | `reviews/rules-review-*.md` | as-needed |
| 4 | Code Health Auditor | `code-health-auditor.md` | source code under `app/` | `refactoring/*.md` | per-audit |

### Matrix Ecosystem

| # | Skill | Skill File | Input | Output | Terminal |
|---|-------|-----------|-------|--------|----------|
| 5 | PTU Rule Extractor | `ptu-rule-extractor.md` | PTU rulebook chapters + errata | `matrix/<domain>-rules.md` | per-domain |
| 6 | App Capability Mapper | `app-capability-mapper.md` | app source code + app-surface.md | `matrix/<domain>-capabilities.md` | per-domain |
| 7 | Coverage Analyzer | `coverage-analyzer.md` | rules + capabilities catalogs | `matrix/<domain>-matrix.md` | per-domain |
| 8 | Implementation Auditor | `implementation-auditor.md` | matrix + source code + rulebook | `matrix/<domain>-audit.md` | per-domain |

### Coordination Skills

| # | Skill | Skill File | Invoked By | Output |
|---|-------|-----------|------------|--------|
| 9 | Orchestrator | `orchestrator.md` | user (start of session) | `dev-state.md`, `test-state.md`, tickets from matrix |
| 10 | Retrospective Analyst | `retrospective-analyst.md` | after cycles complete | `lessons/*.md` |

## Skill Files

```
.claude/skills/
├── ptu-skills-ecosystem.md              ← you are here
├── specification.md                      (full contracts and formats)
├── USAGE.md                              (workflow guide)
├── orchestrator.md
├── ptu-rule-extractor.md
├── app-capability-mapper.md
├── coverage-analyzer.md
├── implementation-auditor.md
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
    └── playwright-patterns.md            (e2e patterns — for external testing)
```

## Artifact Flow

```
artifacts/
├── tickets/               Cross-ecosystem communication
│   ├── bug/               Orchestrator writes (from audit) → Developer reads
│   ├── ptu-rule/          Orchestrator/Game Logic Reviewer writes → Developer reads
│   ├── feature/           Orchestrator writes (from matrix) → Developer reads
│   └── ux/                Orchestrator writes (from matrix) → Developer reads
├── matrix/                Feature Matrix workflow artifacts
│   ├── <domain>-rules.md          Rule Extractor writes → Coverage Analyzer reads
│   ├── <domain>-capabilities.md   Capability Mapper writes → Coverage Analyzer reads
│   ├── <domain>-matrix.md         Coverage Analyzer writes → Auditor reads, Orchestrator reads
│   └── <domain>-audit.md          Implementation Auditor writes → Orchestrator reads
├── designs/               Developer writes (when feature ticket needs design) → shared read zone
├── lessons/               Retrospective Analyst writes → all skills read
├── refactoring/           Code Health Auditor writes → Developer/Reviewer reads
├── reviews/               Senior Reviewer + Game Logic Reviewer write → Orchestrator/Developer reads
├── loops/                 (legacy — from previous Synthesizer runs)
├── scenarios/             (legacy — from previous Crafter runs)
├── verifications/         (legacy — from previous Verifier runs)
├── results/               (legacy — from previous Playtester runs)
├── reports/               (legacy — from previous Result Verifier runs)
├── dev-state.md           Orchestrator writes → Dev skills read
└── test-state.md          Orchestrator writes → Matrix skills read
```

## Authority Hierarchy

| Domain | Final Authority |
|--------|----------------|
| PTU game logic, formulas, rule interpretation | Game Logic Reviewer |
| Code quality, architecture, patterns | Senior Reviewer |
| Pipeline sequencing, what to analyze next | Orchestrator |
| Rule extraction completeness | PTU Rule Extractor |
| Capability mapping completeness | App Capability Mapper |
| Coverage classification accuracy | Coverage Analyzer |
| Implementation correctness verification | Implementation Auditor |
| Gap detection and ticket creation | Orchestrator (from matrix data) |
| Pattern identification and lesson accuracy | Retrospective Analyst |
| Structural code health issues and refactoring priority | Code Health Auditor |

## Orchestration Patterns

### Full Loop (new domain)
1. Load Orchestrator → "Start Rule Extractor and Capability Mapper for domain X" (parallel)
2. **Terminal A:** Load Rule Extractor → rules catalog written to `matrix/<domain>-rules.md`
3. **Terminal B:** Load Capability Mapper → capabilities catalog written to `matrix/<domain>-capabilities.md`
4. Load Orchestrator → "Both catalogs ready, start Coverage Analyzer"
5. Load Coverage Analyzer → matrix written to `matrix/<domain>-matrix.md`
6. Load Orchestrator → "Matrix ready, start Implementation Auditor"
7. Load Implementation Auditor → audit written to `matrix/<domain>-audit.md`
8. Load Orchestrator → "Audit complete, creating tickets" → Orchestrator creates bug/feature/ptu-rule tickets
9. Load Orchestrator → "bug-001 ticket created, start Dev with bug-001"

### Bug Fix Cycle (cross-ecosystem)
1. Dev reads bug ticket + source info → implements fix → commits
2. Senior Reviewer reviews code → writes `reviews/code-review-<NNN>.md` with verdict
3. Game Logic Reviewer confirms PTU correctness → writes `reviews/rules-review-<NNN>.md` with verdict
4. Load Orchestrator → detects both reviews APPROVED → updates state

### Parallel Work
The Orchestrator may recommend work in both ecosystems simultaneously:
- **Dev Terminal:** Developer fixing bug-001 while...
- **Matrix Terminal A:** Rule Extractor extracting rules for healing domain
- **Matrix Terminal B:** Capability Mapper mapping capabilities for healing domain (parallel with A)

### Stale Artifact Detection
Orchestrator compares timestamps:
- App code changed after capability mapping → re-map, re-analyze, re-audit
- Developer commit after latest approved review for same target → re-review needed

## Detailed Contracts

See `specification.md` for full skill contracts, artifact format schemas, and examples.
See `.claude/skills/references/skill-interfaces.md` for YAML frontmatter templates and field definitions.
