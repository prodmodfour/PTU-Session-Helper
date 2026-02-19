# Skill Interfaces

Data contracts between skills in the PTU Skills Ecosystem. All artifacts use markdown with YAML frontmatter. Skills read from the previous stage's directory and write to their own.

## Artifact Directory Layout

```
app/tests/e2e/artifacts/
├── tickets/               # Cross-ecosystem communication
│   ├── bug/               # Feature Designer writes → Developer reads
│   ├── ptu-rule/          # Game Logic Reviewer writes → Developer reads
│   ├── feature/           # Feature Designer writes → Developer reads
│   └── ux/                # Feature Designer writes → Developer reads
├── loops/                 # Gameplay Loop Synthesizer writes
├── scenarios/             # Scenario Crafter writes
├── verifications/         # Scenario Verifier writes → Feature Designer reads (gap detection)
├── designs/               # Feature Designer writes
├── refactoring/           # Code Health Auditor writes
├── reviews/               # Senior Reviewer + Game Logic Reviewer write
├── lessons/               # Retrospective Analyst writes
├── results/               # Legacy: from previous Playtester runs
├── reports/               # Legacy: from previous Result Verifier runs
├── dev-state.md           # Orchestrator writes (sole writer)
└── test-state.md          # Orchestrator writes (sole writer)
```

## File Naming Conventions

- Loops: `<domain>.md` (e.g., `combat.md`, `capture.md`)
- Workflow scenarios: `<domain>-workflow-<description>-<NNN>.md` (e.g., `combat-workflow-wild-encounter-001.md`)
- Mechanic scenarios: `<domain>-<mechanic>-<NNN>.md` (e.g., `combat-stab-001.md`)
- Verifications: `<scenario-id>.verified.md` (e.g., `combat-workflow-wild-encounter-001.verified.md`)
- Results: `<scenario-id>.result.md` (e.g., `combat-workflow-wild-encounter-001.result.md`)
- Reports: `<category>-<NNN>.md` (e.g., `bug-001.md`, `correction-001.md`, `escalation-001.md`, `feature-gap-001.md`, `ux-gap-001.md`) — counters are per-prefix (e.g., `bug-001` and `feature-gap-001` coexist)
- Tickets: `<type>-<NNN>.md` in `tickets/<type>/` (e.g., `tickets/bug/bug-003.md`, `tickets/retest/retest-001.md`) — same sequence number as corresponding report
- Designs: `design-<NNN>.md` (e.g., `design-001.md`) — per-prefix counter in `artifacts/designs/`
- Code reviews: `code-review-<NNN>.md` (e.g., `code-review-001.md`) — per-prefix counter in `artifacts/reviews/`
- Rules reviews: `rules-review-<NNN>.md` (e.g., `rules-review-001.md`) — per-prefix counter in `artifacts/reviews/`

---

## 1. Gameplay Loop

**Written by:** Gameplay Loop Synthesizer
**Read by:** Scenario Crafter, Scenario Verifier
**Location:** `artifacts/loops/<domain>.md`

Loops come in two tiers. Tier 1 (Session Workflows) are the primary output — they represent real GM tasks at the table. Tier 2 (Mechanic Validations) are secondary — they isolate individual PTU rules for focused testing.

### 1a. Tier 1: Session Workflow

```markdown
---
loop_id: <domain>-workflow-<description>
tier: workflow
domain: <domain>
gm_intent: <one sentence: what the GM is trying to accomplish>
ptu_refs:
  - <rulebook-file>#<section>
  - ...
app_features:
  - <app-file-path>
  - ...
mechanics_exercised:
  - <mechanic-name>
  - ...
sub_workflows:
  - <loop_id of workflow variation>
  - ...
---

## GM Context
<1-2 sentences: when does this happen in a session? What real-play situation triggers it?>

## Preconditions
- <state required before this workflow starts>

## Workflow Steps
1. **[Setup]** <GM creates/configures something>
2. **[Action]** <GM or system performs a game action>
3. **[Mechanic: <name>]** <system applies a PTU rule — tag which mechanic fires>
4. **[Bookkeeping]** <GM resolves aftermath>
5. **[Done]** <end state that proves the workflow succeeded>

## PTU Rules Applied
- <rule name>: <exact quote or paraphrase> (file:section)
- ...

## Expected End State
- <what the app should show when this workflow is complete>
- <what data should exist in the database>

## Variations
- **<variation name>**: <how the workflow changes> → sub-workflow loop_id
```

### 1b. Tier 2: Mechanic Validation

```markdown
---
loop_id: <domain>-mechanic-<description>
tier: mechanic
domain: <domain>
ptu_refs:
  - <rulebook-file>#<section>
  - ...
app_features:
  - <app-file-path>
  - ...
sub_loops:
  - <loop_id of edge case variant>
  - ...
---

## Preconditions
- <state required before this loop can execute>

## Steps
1. <game action in PTU terms>
2. <system responds>
3. ...

## PTU Rules Applied
- <rule name>: <exact quote or paraphrase> (file:section)
- ...

## Expected Outcomes
- <observable result with formula>
- ...

## Edge Cases
- <variant condition> → <expected different behavior>
- ...
```

**Constraints:**
- One file per domain, containing all workflows and mechanic validations
- Tier 1 workflows listed first (W1, W2...), Tier 2 mechanics second (M1, M2...)
- Each sub-workflow/sub-loop gets its own section
- `ptu_refs` must point to actual rulebook files via `references/ptu-chapter-index.md`
- `app_features` must point to actual app files via `references/app-surface.md`
- Workflow `mechanics_exercised` lists which PTU rules are implicitly tested by the workflow

---

## 2. Scenario

**Written by:** Scenario Crafter
**Read by:** Scenario Verifier, Feature Designer (gap detection)
**Location:** `artifacts/scenarios/<scenario-id>.md`

Scenarios come in two types matching the two loop tiers.

### 2a. Workflow Scenario (from Tier 1 loops)

Multi-phase scenarios that test a realistic GM task end-to-end. Assertions are placed at phase boundaries.

```markdown
---
scenario_id: <domain>-workflow-<description>-<NNN>
loop_id: <source workflow loop_id>
tier: workflow
priority: P0 | P1
ptu_assertions: <count>
mechanics_tested:
  - <mechanic-name>
  - ...
---

## Narrative
<2-3 sentences describing the real play situation this simulates>

## Setup (API)
POST /api/<endpoint> { <json body> }
<!-- $var = response.data.id -->

## Phase 1: <phase name>
<API calls and/or UI actions for this phase>

### Assertions (Phase 1)
1. <what to check>
   Derivation: <formula with concrete values>
   **Assert: <element> displays "<expected value>"**

## Phase 2: <phase name>
<actions>

### Assertions (Phase 2)
2. ...

## Phase N: Resolution
<final actions>

### Assertions (Phase N)
N. <end-state assertion>

## Teardown
DELETE /api/<endpoint>/$variable
```

### 2b. Mechanic Scenario (from Tier 2 loops)

Focused scenarios that isolate a single PTU rule.

```markdown
---
scenario_id: <domain>-<mechanic>-<NNN>
loop_id: <source mechanic loop_id>
tier: mechanic
priority: P1 | P2
ptu_assertions: <count>
---

## Setup (API)
POST /api/<endpoint> { <json body> }

## Actions
1. <focused interaction to trigger the mechanic>

## Assertions
1. <what to check>
   Derivation: <formula with concrete values>
   **Assert: <element> displays "<expected value>"**

## Teardown
DELETE /api/<endpoint>/$variable
```

**Constraints (both types):**
- One file per scenario (not per domain)
- Priority: P0 = session workflow (must work for app to fulfill its purpose), P1 = workflow variation or important mechanic, P2 = edge case
- Every assertion MUST show the mathematical derivation with concrete values
- Use real Pokemon species with looked-up base stats (from pokedex files)
- Setup uses API calls, not UI navigation (faster, more reliable)
- Actions use specific route paths from `references/app-surface.md`
- Variable capture syntax: `$var = response.path.to.value`
- Workflow scenarios MUST place assertions at each phase boundary, not just at the end

---

## 3. Verification Report

**Written by:** Scenario Verifier
**Read by:** Feature Designer (gap detection — checks verified scenarios against app surface)
**Location:** `artifacts/verifications/<scenario-id>.verified.md`

```markdown
---
scenario_id: <scenario-id>
verified_at: <ISO timestamp>
status: PASS | FAIL | PARTIAL
assertions_checked: <count>
assertions_correct: <count>
---

## Assertion Verification

### Assertion 1: <description>
- **Scenario says:** <the assertion from the scenario>
- **Independent derivation:** <re-derived from scratch using rulebook>
- **Status:** CORRECT | INCORRECT
- **Fix (if incorrect):** <corrected value with derivation>

### Assertion 2: ...

## Data Validity
- [ ] Species exist in pokedex
- [ ] Base stats match pokedex files
- [ ] Moves are learnable at specified level
- [ ] Abilities are available to species
- [ ] Status conditions are valid PTU statuses

## Completeness Check
- [ ] All steps from source gameplay loop are covered
- [ ] Edge cases from loop are addressed or noted as separate scenarios
- [ ] Errata corrections applied where relevant

## Issues Found
<!-- List any problems, empty if all correct -->
1. <issue description and fix>
```

**Constraints:**
- Only scenarios with status `PASS` proceed to Feature Designer gap detection
- `PARTIAL` means some assertions were corrected — Scenario Crafter should update the original
- `FAIL` means fundamental problems — return to Scenario Crafter for rewrite
- Verifier must re-derive assertions from rulebook independently, not just check the math

---

## 4. Bug Report / Correction / Escalation

**Written by:** Feature Designer (bug, feature-gap, ux-gap), Scenario Verifier (correction), Game Logic Reviewer (escalation)
**Read by:** Developer (bug), Scenario Crafter (correction), Game Logic Reviewer (escalation)
**Location:** `artifacts/reports/<type>-<NNN>.md`

### Bug Report (APP_BUG)

```markdown
---
bug_id: bug-<NNN>
severity: CRITICAL | HIGH | MEDIUM
category: APP_BUG
scenario_id: <scenario-id>
affected_files:
  - <app file path>
  - ...
---

## What Happened
<Concise description of the incorrect behavior>

## Expected vs Actual
- **Expected:** <value with PTU derivation>
- **Actual:** <value from test result>

## Root Cause Analysis
<Where in the code the bug likely lives and why>

## PTU Rule Reference
<rulebook file>: "<exact quote>"

## Suggested Fix
<Specific code change suggestion>

## Fix Log
<!-- Dev fills this in after fixing -->
- [ ] Fixed in commit: ___
- [ ] Files changed: ___
- [ ] Re-run scenario: <scenario-id>
```

### Correction (SCENARIO_BUG)

```markdown
---
correction_id: correction-<NNN>
category: SCENARIO_BUG
scenario_id: <scenario-id>
---

## What Was Wrong
<Which assertion(s) had incorrect expected values>

## Correct Values
<Re-derived values with shown math>

## Action Required
Update scenario file `artifacts/scenarios/<scenario-id>.md` assertion(s).
```

### Escalation (AMBIGUOUS)

```markdown
---
escalation_id: escalation-<NNN>
category: AMBIGUOUS
scenario_id: <scenario-id>
ptu_refs:
  - <conflicting rulebook sections>
---

## The Ambiguity
<What the rule says vs what's unclear>

## Possible Interpretations
1. <interpretation A> → expected value X
2. <interpretation B> → expected value Y

## Action Required
Game Logic Reviewer to make a ruling. Update scenario after ruling.
```

### Feature Gap Report (FEATURE_GAP)

```markdown
---
feature_gap_id: feature-gap-<NNN>
category: FEATURE_GAP
scope: FULL | PARTIAL | MINOR
scenario_id: <scenario-id>
loop_id: <source loop_id>
domain: <domain>
missing_capabilities:
  - <capability description>
  - ...
ptu_refs:
  - <rulebook-file>#<section>
  - ...
---

## What Is Missing
<Concise description of the capability the app lacks>

## Workflow Impact
<Which workflow step fails and why — reference the source loop>

## What Exists Today
<Any partial implementation, related endpoints, or adjacent features>

## PTU Rule Reference
<Rulebook quote establishing why this capability is needed>

## Recommended Scope
<FULL: new subsystem | PARTIAL: extend existing feature | MINOR: small addition>

## Design Spec
<!-- Feature Designer fills this in -->
See: `artifacts/designs/design-<NNN>.md`
```

### UX Gap Report (UX_GAP)

```markdown
---
ux_gap_id: ux-gap-<NNN>
category: UX_GAP
scope: PARTIAL | MINOR
scenario_id: <scenario-id>
loop_id: <source loop_id>
domain: <domain>
working_endpoints:
  - <endpoint that works via direct API call>
  - ...
missing_ui:
  - <UI element that doesn't exist>
  - ...
---

## What Is Missing
<Concise description of the UI gap — backend works but no UI exposes the action>

## Backend Evidence
<API calls that succeed, confirming the backend supports the operation>

## Workflow Impact
<Which workflow step fails for the GM and why>

## What GM Sees Today
<What the GM's current experience is — no button, no route, no form field>

## Design Spec
<!-- Feature Designer fills this in -->
See: `artifacts/designs/design-<NNN>.md`
```

**Constraints (both gap types):**
- UX_GAP scope is never `FULL` — if there's no backend at all, it's `FEATURE_GAP`
- Gap reports link to their design spec once the Feature Designer produces one
- Counters are per-prefix: `feature-gap-001` and `ux-gap-001` start independently

---

## 4e. Design Spec

**Written by:** Feature Designer
**Read by:** Developer (implements), Senior Reviewer (reviews architecture), Game Logic Reviewer (PTU rule questions)
**Location:** `artifacts/designs/design-<NNN>.md`

```markdown
---
design_id: design-<NNN>
gap_report: <feature-gap-NNN or ux-gap-NNN>
category: FEATURE_GAP | UX_GAP
scope: FULL | PARTIAL | MINOR
domain: <domain>
scenario_id: <scenario-id>
loop_id: <source loop_id>
status: pending | complete | implemented
affected_files:
  - <existing app file path>
  - ...
new_files:
  - <new file path to create>
  - ...
---

## Summary
<1-2 sentences: what this design adds to the app>

## GM User Flow
1. <step-by-step user interaction from the GM's perspective>
2. ...

## Data Model Changes
<!-- FEATURE_GAP only — skip for UX_GAP -->
- <Prisma schema changes, new fields, new models>

## API Changes
<!-- FEATURE_GAP only — skip for UX_GAP -->
- <new or modified endpoints>

## Client Changes
- **Components:** <new or modified components>
- **Stores:** <new or modified Pinia stores>
- **Pages:** <new or modified page routes>
- **Composables:** <new or modified composables>

## WebSocket Events
- <new events for GM-to-Group sync, if any>

## Existing Patterns to Follow
- <reference to existing app code that implements a similar pattern>

## PTU Rule Questions
<!-- Flag ambiguous rules for Game Logic Reviewer -->
- <question about PTU rule interpretation, if any>

## Questions for Senior Reviewer
<!-- Architectural questions the Developer should route during implementation review -->
- <e.g., "New service vs extend existing?", "New store vs extend?">

## Implementation Log
<!-- Developer fills this in after implementing -->
- Commits: <commit hashes>
- Files changed: <list>
- `app-surface.md` updated: yes/no
```

**Status lifecycle:**
- `pending` — Feature Designer is working on the spec
- `complete` — spec written, awaiting Developer implementation
- `implemented` — Developer filled in the Implementation Log and updated `app-surface.md`

**Constraints:**
- One design spec per gap report (1:1 relationship)
- The Developer updates `status` to `implemented` after filling in the Implementation Log
- The Orchestrator uses the `status` frontmatter field for routing decisions

---

## 5. State Files

The Orchestrator is the **sole writer** of both state files. No other skill writes to them.

### 5a. Dev State

**Written by:** Orchestrator (sole writer)
**Read by:** Dev Ecosystem skills
**Location:** `artifacts/dev-state.md`

Tracks: open tickets per type, active Developer work, review status, retest tickets created, refactoring queue, code health metrics.

### 5b. Test State

**Written by:** Orchestrator (sole writer)
**Read by:** Test Ecosystem skills
**Location:** `artifacts/test-state.md`

Tracks: active domain, domain progress table (Loops → Scenarios → Verifications → Gap Check), internal issues (corrections), lessons metrics.

### 5c. Pipeline State (Legacy)

**Location:** `artifacts/pipeline-state.legacy.md`

The original unified state file, archived for historical reference. Contains the full record from combat and capture domain cycles.

## 5d. Cross-Ecosystem Tickets

**Written by:** Feature Designer (bug/feature/ux), Game Logic Reviewer (ptu-rule)
**Read by:** Developer, Feature Designer
**Location:** `artifacts/tickets/<type>/<type>-<NNN>.md`

### Unified Ticket Schema

```markdown
---
ticket_id: <type>-<NNN>
type: bug | ptu-rule | feature | ux
priority: P0 | P1 | P2
status: open | in-progress | resolved | rejected
source_ecosystem: dev | test
target_ecosystem: dev | test
created_by: <skill-name>
created_at: <ISO timestamp>
domain: <domain>
# Type-specific optional fields:
severity: CRITICAL | HIGH | MEDIUM          # bug, ptu-rule
scope: FULL | PARTIAL | MINOR              # feature, ux
affected_files:                             # bug, ptu-rule
  - <app file path>
scenario_ids:                               # bug, feature, ux, retest
  - <scenario-id>
design_spec: <design-NNN>                  # feature, ux (back-reference, added by Feature Designer)
source_report: <report-filename>           # bug, feature, ux (link to internal report)
categories:                                 # refactoring only
  - <category-id>
estimated_scope: small | medium | large    # refactoring only
---

## Summary
<actionable description for the target ecosystem>

## <type-specific sections>
```

**Constraints:**
- Same sequence number for ticket and corresponding report (e.g., `bug-003` in both `reports/` and `tickets/bug/`)
- Ticket is slimmer than report — just actionable info + `source_report` link
- Status lifecycle: `open` → `in-progress` → `resolved` (or `rejected`)
- Bug/feature/ux tickets are created by the Feature Designer during gap detection

---

## 6. Lesson File

**Written by:** Retrospective Analyst
**Read by:** All skills (for learning from past errors)
**Location:** `artifacts/lessons/<skill-name>.lessons.md`

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
<2-3 sentences summarizing key patterns found for this skill>

---

## Lesson <N>: <imperative title>

- **Category:** <one of: math-error, data-lookup, missing-check, process-gap, triage-error, selector-issue, routing-error, rule-ambiguity, fix-pattern>
- **Severity:** high | medium | low
- **Domain:** <domain or cross-cutting>
- **Frequency:** observed | recurring | systemic
- **First observed:** <date>
- **Status:** active | resolved | promote-candidate

### Pattern
<Concrete description of the error pattern with artifact references>

### Evidence
- `artifacts/<dir>/<file>`: <what was found>
- `git diff <hash>`: <what was changed>

### Recommendation
<Imperative instruction that could be added to the skill's process>
```

**File naming:** `<skill-name>.lessons.md` — hyphenated, matching ecosystem conventions. Examples:
- `scenario-crafter.lessons.md`
- `feature-designer.lessons.md`
- `game-logic-reviewer.lessons.md`

**Cross-cutting summary:** `artifacts/lessons/retrospective-summary.md` — aggregates metrics and patterns that span multiple skills.

**Constraints:**
- One file per skill — only created for skills with actual lessons
- `promote-candidate` status means the lesson should be considered for integration into the skill's process
- Resolved lessons remain in the file (marked `status: resolved`) for historical reference
- Lessons are numbered sequentially within each file
- The Retrospective Analyst deduplicates before writing — if a pattern already exists, it updates frequency and adds evidence rather than creating a duplicate

---

## 7. Refactoring Ticket + Audit Summary

**Written by:** Code Health Auditor
**Read by:** Developer (implements refactoring), Senior Reviewer (reviews approach)
**Location:** `artifacts/refactoring/refactoring-<NNN>.md` and `artifacts/refactoring/audit-summary.md`

### Refactoring Ticket

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

### Finding 2: ...

## Suggested Refactoring
1. <step with exact file paths>
2. <step referencing existing patterns to follow>
3. ...
Estimated commits: <count>

## Related Lessons
- <cross-reference to Retrospective Analyst finding, or "none">

## Resolution Log
<!-- Developer fills this in after refactoring -->
- Commits: ___
- Files changed: ___
- New files created: ___
- Tests passing: ___
```

**File naming:** `refactoring-<NNN>.md` — sequential counter starting from 001. Examples:
- `refactoring-001.md`
- `refactoring-002.md`

**Scope definitions:**
- **small**: Single file, <50 lines changed, no interface changes
- **medium**: 2-3 files, possible interface changes, <200 lines changed
- **large**: 4+ files, interface changes, >200 lines changed

**Status lifecycle:** `open` → `in-progress` → `resolved`

### Audit Summary

```markdown
---
last_audited: <ISO timestamp>
audited_by: code-health-auditor
scope: <"full codebase" | "domain: <name>" | "targeted: <paths>">
files_scanned: <count>
files_deep_read: <count>
total_tickets: <count>
overflow_files: <count of files that qualified but exceeded the 20-file cap>
---

## Metrics
| Metric | Value |
|--------|-------|
| Total files scanned | <count> |
| Total lines of code | <count> |
| Files over 800 lines | <count> |
| Files over 600 lines | <count> |
| Files over 400 lines | <count> |
| Open tickets (P0) | <count> |
| Open tickets (P1) | <count> |
| Open tickets (P2) | <count> |

## Hotspots
| Rank | File | Lines | Categories | Priority |
|------|------|-------|------------|----------|
| 1 | <path> | <count> | <ids> | <P0/P1/P2> |

## Tickets Written
- `refactoring-<NNN>`: <summary> (P<X>)

## Overflow
<!-- Files that qualified for deep-read but were capped -->
- <path> (<line count>, reason: <size/hot/lesson-ref>)

## Comparison to Last Audit
- Resolved since last audit: <count>
- New issues found: <count>
- Trend: improving | stable | degrading
```

**Constraints:**
- One audit summary file — overwritten each audit run
- Overflow section tracks files that exceeded the 20-file deep-read cap
- Comparison section is empty on first audit
- Max 10 tickets per audit run

---

## 8. Code Review

**Written by:** Senior Reviewer
**Read by:** Orchestrator, Developer, Game Logic Reviewer
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
  - ...
files_reviewed:
  - <app file path>
  - ...
verdict: APPROVED | CHANGES_REQUIRED | BLOCKED
issues_found:
  critical: <count>
  high: <count>
  medium: <count>
scenarios_to_rerun:
  - <scenario-id>
  - ...
reviewed_at: <ISO timestamp>
follows_up: <code-review-NNN>  # optional — for re-reviews
---

## Review Scope
<What was reviewed — commits, bug report reference, design spec reference>

## Issues

### CRITICAL
<!-- Empty if none -->
1. **<title>** — `<file>:<line>`
   ```<language>
   <buggy code>
   ```
   **Fix:**
   ```<language>
   <corrected code>
   ```

### HIGH
<!-- Empty if none -->

### MEDIUM
<!-- Empty if none -->

## What Looks Good
- <specific positive observations>

## Verdict
<APPROVED | CHANGES_REQUIRED | BLOCKED> — <one sentence justification>

## Required Changes
<!-- Empty if APPROVED -->
1. <specific change with file:line reference>

## Scenarios to Re-run
- <scenario-id>: <why this scenario is affected>
```

**Constraints:**
- One review per target report per review cycle (re-reviews use `follows_up` or create a new artifact)
- Verdict `BLOCKED` means CRITICAL issues found — Developer must fix before any further pipeline progress
- Verdict `CHANGES_REQUIRED` means HIGH/MEDIUM issues that must be addressed before approval
- Verdict `APPROVED` means the code is ready for rules review and eventually re-test
- `scenarios_to_rerun` is informational — notes which scenarios are affected by the reviewed changes
- Counters are per-prefix: `code-review-001` and `rules-review-001` coexist independently

---

## 9. Rules Review

**Written by:** Game Logic Reviewer
**Read by:** Orchestrator, Developer
**Location:** `artifacts/reviews/rules-review-<NNN>.md`

```markdown
---
review_id: rules-review-<NNN>
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix | design-implementation | escalation-ruling
target_report: <bug-NNN | design-NNN | escalation-NNN>
domain: <domain>
commits_reviewed:
  - <commit hash>
  - ...
mechanics_verified:
  - <mechanic-name>
  - ...
verdict: APPROVED | CHANGES_REQUIRED | BLOCKED
issues_found:
  critical: <count>
  high: <count>
  medium: <count>
ptu_refs:
  - <rulebook-file>#<section>
  - ...
reviewed_at: <ISO timestamp>
follows_up: <rules-review-NNN>  # optional — for re-reviews
---

## Review Scope
<What was reviewed — commits, bug report reference, mechanic areas>

## Mechanics Verified

### <Mechanic Name>
- **Rule:** "<exact quote>" (`<rulebook-file>#<section>`)
- **Implementation:** <what the code does>
- **Status:** CORRECT | INCORRECT | NEEDS REVIEW
- **Fix (if incorrect):** <specific correction>

### <Next Mechanic>
...

## Summary
- Mechanics checked: <N>
- Correct: <N>
- Incorrect: <N>
- Needs review: <N>

## Rulings
<!-- For escalation triggers or ambiguous rule interpretations -->
- <ruling with rulebook justification>

## Verdict
<APPROVED | CHANGES_REQUIRED | BLOCKED> — <one sentence justification>

## Required Changes
<!-- Empty if APPROVED -->
1. <specific change with PTU rule reference>
```

**Constraints:**
- One review per target report per review cycle (re-reviews use `follows_up` or create a new artifact)
- Verdict meanings match Code Review (BLOCKED = CRITICAL, CHANGES_REQUIRED = must fix, APPROVED = ready)
- `mechanics_verified` lists every mechanic the reviewer checked — even if all are correct
- `ptu_refs` must point to actual rulebook files via `references/ptu-chapter-index.md`
- Escalation rulings should also produce a `rules-review-*.md` for audit trail
- Counters are per-prefix: `rules-review-001` and `code-review-001` coexist independently
