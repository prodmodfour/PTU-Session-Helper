# PTU Skills Ecosystem — Specification

## 1. Purpose

The PTU Session Helper app must accurately replicate PTU 1.05 gameplay. Code correctness alone is insufficient — the app must be validated against the complete PTU ruleset through direct rule-to-code coverage analysis. This ecosystem exists to automate that validation.

**Core principle:** The Feature Matrix drives the dev loop. Every PTU rule is extracted, every app capability is mapped, and the two are cross-referenced to find gaps and verify correctness.

## 2. Architecture

### 2.1 Two Ecosystems, One Orchestrator

The ecosystem is split into two logically separate halves:

- **Dev Ecosystem:** Developer, Senior Reviewer, Game Logic Reviewer, Code Health Auditor
- **Matrix Ecosystem:** PTU Rule Extractor, App Capability Mapper, Coverage Analyzer, Implementation Auditor

The Retrospective Analyst serves both. A single Orchestrator reads both state files and gives parallel recommendations. The Orchestrator also creates tickets from completed matrix analyses.

**Playtesting is external.** The ecosystem produces coverage matrices and correctness audits. Running Playwright tests against the app happens outside these two ecosystems.

### 2.2 Separate Terminals

Each skill runs in its own Claude Code terminal (session). Skills never share context windows. The user acts as liaison between terminals, copy-pasting context summaries and following the Orchestrator's guidance on which terminal to use next.

**Why separate terminals:**
- Each skill has a distinct role and knowledge set — mixing them bloats context
- Terminal crashes or context clears don't cascade
- Skills can run concurrently (e.g., Dev fixing bug A while Rule Extractor extracts rules for domain B)
- Matches the real-world model: QA team members don't share a single brain

### 2.3 Artifact-Based Communication

All inter-skill communication happens through persistent files on disk. No skill assumes knowledge of another skill's context.

**Cross-ecosystem communication** uses tickets:
```
app/tests/e2e/artifacts/tickets/
├── bug/               # Orchestrator writes (from audit) → Developer reads
├── ptu-rule/          # Orchestrator/Game Logic Reviewer writes → Developer reads
├── feature/           # Orchestrator writes (from matrix) → Developer reads
└── ux/                # Orchestrator writes (from matrix) → Developer reads
```

**Ecosystem-internal artifacts:**
```
app/tests/e2e/artifacts/
├── matrix/             # Matrix: all 4 skills write sequentially
│   ├── <domain>-rules.md          # Rule Extractor writes → Coverage Analyzer reads
│   ├── <domain>-capabilities.md   # Capability Mapper writes → Coverage Analyzer reads
│   ├── <domain>-matrix.md         # Coverage Analyzer writes → Auditor reads, Orchestrator reads
│   └── <domain>-audit.md          # Implementation Auditor writes → Orchestrator reads
├── designs/            # Shared: Developer writes → shared read zone
├── refactoring/        # Dev: Code Health Auditor writes → Developer reads
├── reviews/            # Dev: Reviewers write → Orchestrator/Developer read
├── lessons/            # Shared: Retrospective Analyst writes → all read
├── loops/              # Legacy: from previous Synthesizer runs
├── scenarios/          # Legacy: from previous Crafter runs
├── verifications/      # Legacy: from previous Verifier runs
├── results/            # Legacy: from previous Playtester runs
├── reports/            # Legacy: from previous Result Verifier runs
├── dev-state.md        # Orchestrator writes → Dev skills read
└── test-state.md       # Orchestrator writes → Matrix skills read
```

### 2.4 Ticket System

Tickets are the **sole cross-ecosystem communication mechanism**. Matrix artifacts stay in `artifacts/matrix/`. Only actionable work items cross the boundary, created by the Orchestrator from completed matrix analyses.

| Type | Prefix | Direction | Producer | Consumer |
|------|--------|-----------|----------|----------|
| bug | `bug-NNN` | Matrix → Dev | Orchestrator (from audit INCORRECT) | Developer |
| ptu-rule | `ptu-rule-NNN` | Either → Dev | Orchestrator (from audit APPROXIMATION) / Game Logic Reviewer | Developer |
| feature | `feature-NNN` | Matrix → Dev | Orchestrator (from matrix MISSING) | Developer |
| ux | `ux-NNN` | Matrix → Dev | Orchestrator (from matrix MISSING UI) | Developer |
| refactoring | `refactoring-NNN` | Dev internal | Code Health Auditor | Developer |

### 2.5 State Files

The Orchestrator is the **sole writer** of both state files:
- `dev-state.md` — tracks open tickets, active Developer work, review status, refactoring queue
- `test-state.md` — tracks domain matrix progress, coverage scores, active work, ambiguous items

No other skill writes to state files. Skills report completions via their artifacts; the Orchestrator reads artifacts and updates state.

### 2.6 Pipeline Flow

```
                    ┌──────────────────────┐
                    │     Orchestrator     │ ← reads both state files
                    │  (advises + creates  │   + all ticket dirs + matrix/
                    │   tickets from matrix)│
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
                                                                          │
                                                              Orchestrator reads,
                                                              creates tickets
```

## 3. Skills

### 3.1 Orchestrator

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/orchestrator.md` |
| **Trigger** | Ask Claude to load the orchestrator skill |
| **Input** | `dev-state.md`, `test-state.md`, all ticket directories, matrix artifacts |
| **Output** | `dev-state.md`, `test-state.md`, tickets (from completed matrix data) |
| **Terminal** | Persistent — keep open throughout a testing session |

**Responsibilities:**
- Scan both ecosystems to determine pipeline position
- Apply D1-D9 priority tree to Dev Ecosystem
- Apply M1-M7 priority tree to Matrix Ecosystem
- Give parallel recommendations when both ecosystems have work
- Create tickets from completed matrix + audit data (M2 process)
- Sole writer of both state files
- Detect stale artifacts and open tickets

**Does NOT:**
- Write code
- Write artifacts other than state files and tickets
- Make PTU rule judgments
- Approve code or plans

### 3.2 PTU Rule Extractor

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/ptu-rule-extractor.md` |
| **Trigger** | Ask Claude to load the ptu-rule-extractor skill |
| **Input** | PTU rulebook chapters (`books/markdown/core/`), errata |
| **Output** | `app/tests/e2e/artifacts/matrix/<domain>-rules.md` |
| **Terminal** | Spin up per domain, can close after rules extracted |

**Responsibilities:**
- Read PTU rulebook chapters relevant to a domain
- Extract every mechanic as a structured catalog entry
- Build dependency graph (foundation → derived → workflow)
- Handle cross-domain references
- Apply errata corrections

**Runs in parallel with:** App Capability Mapper (no dependency between them)

### 3.3 App Capability Mapper

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/app-capability-mapper.md` |
| **Trigger** | Ask Claude to load the app-capability-mapper skill |
| **Input** | App source code, `references/app-surface.md`, Prisma schema |
| **Output** | `app/tests/e2e/artifacts/matrix/<domain>-capabilities.md` |
| **Terminal** | Spin up per domain, can close after capabilities mapped |

**Responsibilities:**
- Deep-read source code for all files in a domain
- Catalog every capability with type, location, and game concept
- Map capability chains (UI → Store → Composable → API → Service → DB)
- Identify orphan capabilities (exist but unused)

**Runs in parallel with:** PTU Rule Extractor (no dependency between them)

### 3.4 Coverage Analyzer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/coverage-analyzer.md` |
| **Trigger** | Ask Claude to load the coverage-analyzer skill |
| **Input** | `matrix/<domain>-rules.md`, `matrix/<domain>-capabilities.md` |
| **Output** | `app/tests/e2e/artifacts/matrix/<domain>-matrix.md` |
| **Terminal** | Spin up per domain, can close after matrix produced |

**Responsibilities:**
- Cross-reference every rule against capabilities
- Classify each rule: Implemented / Partial / Missing / Out of Scope
- Assign gap priorities (P0-P3) to Missing and Partial items
- Compute coverage score
- Produce Auditor Queue for Implementation Auditor

**Depends on:** Both Rule Extractor and Capability Mapper outputs

### 3.5 Implementation Auditor

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/implementation-auditor.md` |
| **Trigger** | Ask Claude to load the implementation-auditor skill |
| **Input** | `matrix/<domain>-matrix.md`, source code, PTU rulebook sections |
| **Output** | `app/tests/e2e/artifacts/matrix/<domain>-audit.md` |
| **Terminal** | Spin up per domain, can close after audit complete |

**Responsibilities:**
- Work through the Auditor Queue from the matrix
- Deep-read both source code AND PTU rulebook for each item
- Classify each: Correct / Incorrect / Approximation / Ambiguous
- Provide file:line evidence for every finding
- Escalate Ambiguous items for Game Logic Reviewer

**Depends on:** Coverage Analyzer output

### 3.6 Developer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/ptu-session-helper-dev.md` |
| **Trigger** | Load at session start |
| **Input** | Bug reports, feature/ux tickets, design specs, reviewer feedback |
| **Output** | Code changes, committed to git |
| **Terminal** | Persistent — primary implementation terminal |

**Ecosystem additions (to existing skill):**
- Read bug/feature/ux tickets from `app/tests/e2e/artifacts/tickets/`
- After fixing, annotate the ticket with fix details (file changed, commit hash)
- Follow the Orchestrator's guidance on which ticket to fix next
- Write design specs when feature tickets need design before implementation

### 3.7 Senior Reviewer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/ptu-session-helper-senior-reviewer.md` |
| **Trigger** | Load at session start, after Dev produces changes |
| **Input** | Dev's code changes (git diff), bug reports being addressed |
| **Output** | `app/tests/e2e/artifacts/reviews/code-review-<NNN>.md` |
| **Terminal** | Persistent — review terminal |

**Ecosystem additions (to existing skill):**
- Check fixes against the original ticket's description
- Code quality and architecture review remain primary responsibilities

### 3.8 Game Logic Reviewer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/game-logic-reviewer.md` |
| **Trigger** | Ask Claude to load the game-logic-reviewer skill |
| **Input** | Code changes, audit ambiguities, escalations from other skills |
| **Output** | `app/tests/e2e/artifacts/reviews/rules-review-<NNN>.md` |
| **Terminal** | Spin up when needed for PTU rule questions |

**Responsibilities:**
- Verify code changes implement PTU 1.05 rules correctly
- Resolve `AMBIGUOUS` items from Implementation Auditor
- Review Dev output for game logic correctness (complements Senior Reviewer's code quality review)
- Provide definitive PTU rule interpretations when skills disagree

**Authority:** On PTU game logic, this skill's judgment overrides all others. On code quality and architecture, Senior Reviewer overrides.

### 3.9 Retrospective Analyst

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/retrospective-analyst.md` |
| **Trigger** | After a domain completes a full cycle OR on-demand by user request |
| **Input** | All artifact directories, `dev-state.md`, `test-state.md`, git history |
| **Output** | `app/tests/e2e/artifacts/lessons/<skill-name>.lessons.md`, `retrospective-summary.md` |
| **Terminal** | Spin up after cycles complete or on user request |

**Responsibilities:**
- Scan artifact trail and git history for error patterns across completed pipeline cycles
- Classify errors into categories with clear boundary definitions
- Track recurrence (observed → recurring → systemic)
- Deduplicate against existing lessons before writing
- Write per-skill lesson files with evidence and recommendations
- Write cross-cutting retrospective summary

**Does NOT:**
- Fix app code (that's Developer)
- Make PTU rule rulings (that's Game Logic Reviewer)
- Modify any skill's process steps (recommends changes only)
- Write to any artifact directory other than `artifacts/lessons/`

### 3.10 Code Health Auditor

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/code-health-auditor.md` |
| **Trigger** | On-demand, after a domain completes a full pipeline cycle, or after Developer implements a FULL-scope design spec |
| **Input** | Source code files under `app/`, `app-surface.md`, lesson files, git log |
| **Output** | `app/tests/e2e/artifacts/refactoring/refactoring-<NNN>.md`, `audit-summary.md` |
| **Terminal** | Spin up per audit |

**Responsibilities:**
- Scan production source code for structural issues that hinder LLM agent correctness
- Categorize findings into 12 categories (7 LLM-friendliness + 5 extensibility)
- Cross-reference Retrospective Analyst lessons to boost priority of flagged files
- Detect hot files via git change frequency
- Write prioritized refactoring tickets (max 10 per audit)
- Write audit summary with metrics and hotspots

**Authority boundary:** Decides *what* needs fixing and its priority. Senior Reviewer decides *how* the refactoring is implemented.

**Does NOT:**
- Modify source code (that's Developer)
- Review code changes (that's Senior Reviewer)
- Fix bugs or implement features (that's Developer)
- Make PTU rule judgments (that's Game Logic Reviewer)
- Scan test files or artifacts — only production code under `app/`
- Write to any artifact directory other than `artifacts/refactoring/`

## 4. Artifact Formats

All artifacts use markdown with YAML frontmatter. Full schemas in `.claude/skills/references/skill-interfaces.md`.

### 4.1 Rule Catalog

```markdown
---
domain: combat
extracted_at: 2026-02-19T10:00:00Z
extracted_by: ptu-rule-extractor
total_rules: 45
sources:
  - core/07-combat.md
  - core/08-pokemon-moves.md
errata_applied: true
---

# PTU Rules: Combat

## combat-R001: Base Damage Formula
- **Category:** formula
- **Scope:** core
- **PTU Ref:** `core/07-combat.md#Damage`
- **Quote:** "Damage = Attack Roll + Attack Stat - Defense Stat"
- **Dependencies:** none
- **Errata:** false
```

### 4.2 Capability Catalog

```markdown
---
domain: combat
mapped_at: 2026-02-19T10:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 32
files_read: 18
---

# App Capabilities: Combat

## combat-C001: Apply Damage Endpoint
- **Type:** api-endpoint
- **Location:** `server/api/encounters/[id]/combatants/[combatantId]/damage.post.ts:default`
- **Game Concept:** damage application
- **Description:** Applies damage to a combatant, updating HP and checking injury thresholds
- **Inputs:** { amount: number, damageType: string }
- **Outputs:** { currentHp: number, injuries: number }
```

### 4.3 Feature Completeness Matrix

```markdown
---
domain: combat
analyzed_at: 2026-02-19T12:00:00Z
analyzed_by: coverage-analyzer
total_rules: 45
implemented: 32
partial: 5
missing: 6
out_of_scope: 2
coverage_score: 80.2
---

# Feature Completeness Matrix: Combat

## Coverage Score
**80.2%** — (32 + 0.5 * 5) / (45 - 2) * 100
```

### 4.4 Implementation Audit Report

```markdown
---
domain: combat
audited_at: 2026-02-19T14:00:00Z
audited_by: implementation-auditor
items_audited: 37
correct: 30
incorrect: 3
approximation: 2
ambiguous: 2
---

# Implementation Audit: Combat

## combat-R001: Base Damage Formula
- **Classification:** Correct
- **Code:** `server/services/combatant.service.ts:142-158` — `applyDamage()`
- **Rule:** "Damage = Attack Roll + Attack Stat - Defense Stat"
- **Verification:** Code computes `rollTotal + attackStat - defenseStat`, matches PTU formula
```

### 4.5 Bug Report (Legacy)

```markdown
---
bug_id: bug-001
severity: CRITICAL
category: APP_BUG
scenario_id: combat-basic-damage-001
affected_files:
  - app/composables/useCombat.ts
  - app/server/services/combatant.service.ts
---

## What Happened
Damage calculation does not subtract defense stat.

## Root Cause Analysis
In `useCombat.ts:calculateDamage()`, the defense parameter is accepted but never subtracted.

## PTU Rule Reference
core/07-combat.md: "Damage = Attack Roll + Attack Stat - Defense Stat"
```

### 4.6 State Files

The Orchestrator maintains two state files (sole writer):

**dev-state.md** — Dev Ecosystem state:
```markdown
---
last_updated: <ISO timestamp>
updated_by: orchestrator
---

# Dev Ecosystem State

## Open Tickets
### Bug Tickets (`tickets/bug/`)
### PTU Rule Tickets (`tickets/ptu-rule/`)
### Feature Tickets (`tickets/feature/`)
### UX Tickets (`tickets/ux/`)

## Active Developer Work
## Review Status
## Refactoring Tickets (`refactoring/`)
## Code Health
```

**test-state.md** — Matrix Ecosystem state:
```markdown
---
last_updated: <ISO timestamp>
updated_by: orchestrator
---

# Matrix Ecosystem State

## Domain Progress
| Domain | Rules | Capabilities | Matrix | Audit | Tickets | Coverage |
|--------|-------|-------------|--------|-------|---------|----------|
| combat | done | done | done | done | created | 80.2% |

## Active Work
## Pending Ticket Creation
## Ambiguous Items Pending Ruling
## Recommended Next Step
```

### 4.6b Pipeline State (Legacy)

The original `pipeline-state.md` has been archived as `pipeline-state.legacy.md`. It contains the full historical record from the combat and capture domain cycles. New state tracking uses the two state files above.

### 4.7 Lesson File

```markdown
---
skill: <skill-name>
last_analyzed: <ISO timestamp>
analyzed_by: retrospective-analyst
total_lessons: <count>
domains_covered:
  - <domain>
  - ...
---

# Lessons: <Skill Display Name>

## Summary
<2-3 sentences summarizing the key patterns found for this skill>

---

## Lesson 1: <imperative title>

- **Category:** math-error | data-lookup | missing-check | process-gap | triage-error | selector-issue | routing-error | rule-ambiguity | fix-pattern
- **Severity:** high | medium | low
- **Domain:** combat | capture | healing | pokemon-lifecycle | character-lifecycle | encounter-tables | scenes | vtt-grid | cross-cutting
- **Frequency:** observed | recurring | systemic
- **First observed:** <date>
- **Status:** active | resolved | promote-candidate

### Pattern
<Concrete description of the error pattern with references to specific artifacts>

### Evidence
- `artifacts/verifications/<id>.verified.md`: <what was found>
- `git diff <hash>`: <what was changed to fix it>

### Recommendation
<Imperative instruction that could be added to the skill's process>

---

## Lesson 2: ...
```

### 4.8 Refactoring Ticket + Audit Summary

**Written by:** Code Health Auditor
**Read by:** Developer (implements refactoring), Senior Reviewer (reviews approach)
**Location:** `artifacts/refactoring/refactoring-<NNN>.md` and `artifacts/refactoring/audit-summary.md`

#### Refactoring Ticket

```markdown
---
ticket_id: refactoring-<NNN>
priority: P0 | P1 | P2
categories:
  - <category-id>
affected_files:
  - <app file path>
estimated_scope: small | medium | large
status: open | in-progress | resolved
created_at: <ISO timestamp>
---

## Summary
<1-2 sentences: what the problem is and why it matters for LLM agents>

## Findings

### Finding 1: <category-id>
- **Metric:** <measured value>
- **Threshold:** <threshold that was exceeded>
- **Impact:** <how this affects LLM agent code generation>
- **Evidence:** <file:line-range, function names>

## Suggested Refactoring
1. <step with exact file paths>
Estimated commits: <count>

## Resolution Log
<!-- Developer fills this in after refactoring -->
- Commits: ___
- Files changed: ___
```

#### Audit Summary

```markdown
---
last_audited: <ISO timestamp>
audited_by: code-health-auditor
scope: <"full codebase" | "domain: <name>" | "targeted: <paths>">
files_scanned: <count>
files_deep_read: <count>
total_tickets: <count>
---

## Metrics
| Metric | Value |
|--------|-------|

## Hotspots
| Rank | File | Lines | Categories | Priority |

## Tickets Written
## Overflow
## Comparison to Last Audit
```

### 4.9 Code Review

**Written by:** Senior Reviewer
**Location:** `artifacts/reviews/code-review-<NNN>.md`

```markdown
---
review_id: code-review-<NNN>
review_type: code
reviewer: senior-reviewer
trigger: bug-fix | design-implementation | refactoring
target_report: <bug-NNN | design-NNN | refactoring-NNN>
domain: <domain>
commits_reviewed:
  - <commit hash>
files_reviewed:
  - <app file path>
verdict: APPROVED | CHANGES_REQUIRED | BLOCKED
issues_found:
  critical: <count>
  high: <count>
  medium: <count>
reviewed_at: <ISO timestamp>
follows_up: <code-review-NNN>  # optional — for re-reviews
---

## Review Scope
## Issues
### CRITICAL / HIGH / MEDIUM
## What Looks Good
## Verdict
## Required Changes
```

### 4.10 Rules Review

**Written by:** Game Logic Reviewer
**Location:** `artifacts/reviews/rules-review-<NNN>.md`

```markdown
---
review_id: rules-review-<NNN>
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix | design-implementation | escalation-ruling | audit-ambiguity
target_report: <bug-NNN | design-NNN | escalation-NNN>
domain: <domain>
commits_reviewed:
  - <commit hash>
mechanics_verified:
  - <mechanic-name>
verdict: APPROVED | CHANGES_REQUIRED | BLOCKED
issues_found:
  critical: <count>
  high: <count>
  medium: <count>
ptu_refs:
  - <rulebook-file>#<section>
reviewed_at: <ISO timestamp>
follows_up: <rules-review-NNN>  # optional — for re-reviews
---

## Review Scope
## Mechanics Verified
### <Mechanic Name>
- **Rule:** "<quote>" (`<file>#<section>`)
- **Implementation:** <what the code does>
- **Status:** CORRECT | INCORRECT | NEEDS REVIEW

## Summary
## Rulings
## Verdict
## Required Changes
```

## 5. Authority Hierarchy

When skills disagree:

| Domain | Final authority |
|--------|----------------|
| PTU game logic, formulas, rule interpretation | Game Logic Reviewer |
| Code quality, architecture, patterns, performance | Senior Reviewer |
| Pipeline sequencing, what to analyze next | Orchestrator |
| Rule extraction completeness | PTU Rule Extractor |
| Capability mapping completeness | App Capability Mapper |
| Coverage classification accuracy | Coverage Analyzer |
| Implementation correctness verification | Implementation Auditor |
| Gap detection and ticket creation | Orchestrator (from matrix data) |
| Pattern identification and lesson accuracy | Retrospective Analyst |
| Structural code health issues and refactoring priority | Code Health Auditor |

No skill overrides another outside its authority domain.

## 6. Shared References

All skills that need PTU knowledge read from shared reference files rather than encoding rulebook content themselves.

| Reference | Path | Used by |
|-----------|------|---------|
| Chapter Index | `.claude/skills/references/ptu-chapter-index.md` | Rule Extractor, Implementation Auditor, Game Logic Reviewer |
| Skill Interfaces | `.claude/skills/references/skill-interfaces.md` | All skills (artifact format contracts) |
| App Surface | `.claude/skills/references/app-surface.md` | Capability Mapper, Dev, Code Health Auditor |
| Playwright Patterns | `.claude/skills/references/playwright-patterns.md` | External testing reference |
| Lesson Files | `app/tests/e2e/artifacts/lessons/` | Retrospective Analyst (writes), all skills (read) |
| Refactoring Tickets | `app/tests/e2e/artifacts/refactoring/` | Code Health Auditor (writes), Developer + Senior Reviewer (read) |
| Review Artifacts | `app/tests/e2e/artifacts/reviews/` | Senior Reviewer + Game Logic Reviewer (write), Orchestrator + Developer (read) |
| Matrix Artifacts | `app/tests/e2e/artifacts/matrix/` | All 4 matrix skills (write sequentially), Orchestrator (read for tickets) |

Reference files live in `.claude/skills/references/`.

## 7. Lifecycle Patterns

### 7.1 Full Loop (new domain)

1. Orchestrator: "No matrix for domain X. Go to Rule Extractor terminal AND Capability Mapper terminal (parallel)"
2. Rule Extractor produces rule catalog → writes to `matrix/<domain>-rules.md`
3. Capability Mapper produces capability catalog → writes to `matrix/<domain>-capabilities.md`
4. Orchestrator: "Both catalogs ready. Go to Coverage Analyzer terminal"
5. Coverage Analyzer produces matrix → writes to `matrix/<domain>-matrix.md`
6. Orchestrator: "Matrix ready. Go to Implementation Auditor terminal"
7. Implementation Auditor produces audit → writes to `matrix/<domain>-audit.md`
8. Orchestrator: "Audit complete. Creating tickets..." → creates bug/feature/ptu-rule tickets from matrix + audit data
9. Orchestrator: "bug-001 ticket created. Go to Dev terminal, start with bug-001"

### 7.2 Bug Fix Cycle (Cross-Ecosystem)

1. Dev reads bug ticket + source info → implements fix → commits
2. Senior Reviewer reviews code → writes `reviews/code-review-<NNN>.md` with verdict
3. Game Logic Reviewer confirms PTU correctness → writes `reviews/rules-review-<NNN>.md` with verdict
4. Orchestrator detects both reviews APPROVED → updates state

### 7.3 Stale Artifact Detection

The Orchestrator detects staleness by comparing timestamps:
- App code changed after capability mapping → capabilities stale, re-map needed
- Re-mapped capabilities → matrix stale, re-analyze needed
- Re-analyzed matrix → audit stale, re-audit needed
- Developer commit after latest approved review for same target → review stale, re-review needed

### 7.4 Ticket Creation Process (Orchestrator M2)

When a domain's matrix and audit are both complete:

1. Orchestrator reads `matrix/<domain>-matrix.md` and `matrix/<domain>-audit.md`
2. For each `Incorrect` audit item → creates bug ticket in `tickets/bug/`
3. For each `Missing` matrix item → creates feature ticket in `tickets/feature/`
4. For each `Approximation` audit item → creates ptu-rule ticket in `tickets/ptu-rule/`
5. Skips `Correct`, `Out of Scope`, and `Ambiguous` items
6. All tickets include `matrix_source` frontmatter linking back to rule_id/domain
7. Updates `test-state.md` with ticket creation summary

### 7.5 Ambiguous Item Resolution

When the Implementation Auditor flags ambiguous items:

1. Orchestrator detects ambiguous items in audit (M5 priority)
2. Routes to Game Logic Reviewer with audit file reference
3. Game Logic Reviewer reads the ambiguous items and PTU rulebook
4. Produces ruling in `reviews/rules-review-<NNN>.md`
5. Orchestrator may request re-audit of affected items with the ruling applied
