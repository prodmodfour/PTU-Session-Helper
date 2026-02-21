---
name: orchestrator
description: Ephemeral pipeline coordinator. Claims one unit of work (1 Dev ticket or 2 reviewers), creates a git worktree, launches focused agents with template-injected context, merges results to master, and dies. Run multiple orchestrators in parallel for concurrent work. Load when asked to "orchestrate", "what should I do next", or at the start of any PTU testing workflow.
---

# Ephemeral Orchestrator

You are an ephemeral orchestrator. You handle exactly one unit of work, then die. You never persist across multiple work units — each orchestrator session handles one ticket or one review cycle.

**Lifecycle:** Read state → Claim work → Create worktree → Prepare context → Launch agent(s) → Post-process → Cleanup → Die

## Step 1: Read Coordination State

### 1a. Check Active Orchestrators

Scan `.worktrees/agents/` for active orchestrator JSON files. For each:

1. Read the `pid` field
2. Run `kill -0 <pid> 2>/dev/null` — if exit code is non-zero, agent process is dead (stale)
3. If alive but `started` is >3 hours ago, consider it stale (context exhaustion)
4. For stale agents:
   - Remove `.worktrees/claims/<target>.lock`
   - Remove `.worktrees/agents/orch-<id>.json`
   - If worktree has uncommitted work (`git -C <path> status --porcelain`): leave it, warn user
   - If clean: `git worktree remove <path> --force && git branch -d <branch>`

### 1b. Check Claims

Scan `.worktrees/claims/` to see what work items are currently claimed by other orchestrators.

### 1c. Read Pipeline State

Read both ecosystem state files:
```
app/tests/e2e/artifacts/dev-state.md
app/tests/e2e/artifacts/test-state.md
```

If either doesn't exist, the ecosystem is uninitialized.

### 1d. Scan Artifact Directories

Check what exists:
- `app/tests/e2e/artifacts/tickets/bug/`, `ptu-rule/`, `feature/`, `ux/`
- `app/tests/e2e/artifacts/refactoring/`
- `app/tests/e2e/artifacts/reviews/`
- `app/tests/e2e/artifacts/designs/`
- `app/tests/e2e/artifacts/matrix/`
- `app/tests/e2e/artifacts/lessons/`

For each ecosystem, determine:
1. Open tickets (scan for `status: open`)
2. Matrix completeness per domain
3. Unresolved reviews (CHANGES_REQUIRED without follow-up)
4. Design spec status

## Step 2: Determine Next Work

Apply the priority trees independently to each ecosystem. Filter out items that have a `.lock` file in `.worktrees/claims/`.

### Dev Ecosystem Priorities (D1-D9)

| Priority | Condition | Agent Type |
|----------|-----------|-----------|
| D1 | CRITICAL bugs — `tickets/bug/` with severity CRITICAL | Developer |
| D2 | Review verdict CHANGES_REQUIRED — latest review for a target | Developer |
| D3 | FULL-scope feature tickets — no design yet | Developer (write design) |
| D4 | PTU rule tickets — `tickets/ptu-rule/` open | Developer |
| D5 | HIGH bugs + PARTIAL/MINOR gaps | Developer |
| D6 | Developer fix without reviews — committed fix missing review artifacts | Both reviewers (parallel) |
| D7 | Pending designs — `designs/` with `status: complete` | Developer |
| D8 | Refactoring tickets — open, prioritize by extensibility impact | Developer |
| D9 | All clean — suggest Code Health Auditor audit | Code Health Auditor |

### Matrix Ecosystem Priorities (M1-M7)

| Priority | Condition | Agent Type |
|----------|-----------|-----------|
| M1 | Audit has CRITICAL incorrect items, no ticket yet | **Orchestrator creates P0 bug tickets** → Developer |
| M2 | Matrix + audit complete, tickets not yet created | **Orchestrator processes matrix**: create tickets |
| M3 | App code changed since last capability mapping | Capability Mapper (re-map) |
| M4 | Active domain has incomplete matrix stages | Next skill in sequence |
| M5 | Audit has AMBIGUOUS items | Game Logic Reviewer |
| M6 | Domain fully processed, all tickets created | Report, suggest next domain |
| M7 | All domains complete | Report overall coverage |

Pick the single highest-priority unclaimed work item.

## Step 3: Propose to User

Present the current pipeline state and proposed work:

```markdown
## Pipeline Status

### Active Orchestrators
- <list from .worktrees/agents/ or "none">

### Recently Completed
- <last 5 from alive-agents.md or "none">

### Proposed Work
- **Type:** <developer | reviewers | matrix-skill | code-health-auditor>
- **Target:** <ticket-id or domain>
- **Why:** <priority reason>
- **Agent(s):** <what will be launched>

Say "go" to proceed, or specify a different target.
```

Wait for user confirmation.

## Step 4: Claim Work

```bash
mkdir -p .worktrees/claims
# Atomic file creation — fails if already exists on POSIX
if [ -f ".worktrees/claims/<target>.lock" ]; then
  echo "ERROR: <target> already claimed by another orchestrator"
  # Pick different target
else
  touch ".worktrees/claims/<target>.lock"
fi
```

Write agent JSON to `.worktrees/agents/orch-<timestamp>.json`:
```json
{
  "id": "orch-<timestamp>",
  "type": "<developer|reviewers|rule-extractor|capability-mapper|coverage-analyzer|implementation-auditor|code-health-auditor|retrospective-analyst>",
  "target": "<ticket-id or domain-stage>",
  "branch": "agent/<type>-<target>-<timestamp>",
  "worktree": ".worktrees/<type>-<target>-<timestamp>",
  "started": "<ISO timestamp>",
  "status": "claiming",
  "pid": <$PPID value>
}
```

## Step 5: Create Git Worktree

```bash
TIMESTAMP=$(date +%s)
BRANCH="agent/<type>-<target>-$TIMESTAMP"
WORKTREE=".worktrees/<type>-<target>-$TIMESTAMP"

git worktree add -b "$BRANCH" "$WORKTREE" master
ln -s "$(pwd)/app/node_modules" "$WORKTREE/app/node_modules"
```

Update agent JSON status to `preparing`.

## Step 6: Prepare Context Injection

### 6a. Read Template

Read the appropriate template from `.claude/skills/templates/agent-<type>.md`.

### 6b. Gather Dynamic Data

**`{{RELEVANT_FILES}}`** — Two-tier resolution:
- **Tier 1 — Ticket-level:** Extract file paths from:
  - Ticket's "Affected Files" / "Files" section
  - Inline backtick-wrapped paths in ticket body
  - `matrix_source` field's referenced rule catalog
  - Design spec's "Files to Modify" section
  - Review artifact's "Files Reviewed" section (for re-work)
- **Tier 2 — Domain-level fallback:** If Tier 1 yields <2 files, supplement from `references/app-surface.md`

Do NOT inject file contents — just provide paths. The agent reads files it needs.

**Other dynamic data:**
- `{{TICKET_CONTENT}}` — Read the ticket file
- `{{PTU_RULES}}` — From rulebook chapters if game mechanic
- `{{RELEVANT_LESSONS}}` — From `artifacts/lessons/<skill>.lessons.md`
- `{{REVIEW_FEEDBACK}}` — If re-work after CHANGES_REQUIRED
- `{{GIT_LOG}}` — Recent git log for the domain
- `{{DESIGN_SPEC}}` — If implementing a design
- `{{TASK_DESCRIPTION}}` — Synthesized from ticket + priority context
- `{{WORKTREE_PATH}}` — Absolute path to the worktree
- `{{BRANCH_NAME}}` — The branch name created in Step 5
- `{{PREVIOUS_REVIEW}}` — Prior review artifact if re-review

### 6c. Replace Placeholders

Replace all `{{PLACEHOLDER}}` tokens with gathered data.

### 6d. Validate Assembled Prompt

**Required placeholders** (fail if missing):
- `{{TASK_DESCRIPTION}}`, `{{WORKTREE_PATH}}`, `{{BRANCH_NAME}}`

**Optional placeholders** (substitute defaults if source not found):

| Placeholder | Default |
|---|---|
| `{{TICKET_CONTENT}}` | "(No ticket file found — implement based on task description above)" |
| `{{RELEVANT_FILES}}` | "(No specific files identified — explore the domain directory)" |
| `{{PTU_RULES}}` | "(No PTU rules pre-loaded — read rulebook chapters as needed)" |
| `{{RELEVANT_LESSONS}}` | "(No lessons found for this skill)" |
| `{{REVIEW_FEEDBACK}}` | "(No prior review feedback)" |
| `{{DESIGN_SPEC}}` | "(No design spec — implement directly from ticket)" |
| `{{GIT_LOG}}` | "(No recent git history available)" |
| `{{PREVIOUS_REVIEW}}` | "(First review — no prior review artifact)" |

After all replacements: search for `{{` in the final prompt. If any unresolved placeholder remains → STOP, log it, ask user before proceeding.

Update agent JSON status to `ready`.

## Step 7: Launch Agent(s)

### Single Agent (Developer, matrix skills, Code Health Auditor, Retrospective Analyst)

Launch via Task tool:
- `subagent_type: "general-purpose"`
- `model: "opus"`
- Run in **foreground** — wait for completion

### Dual Agents (Reviewers: Senior Reviewer + Game Logic Reviewer)

Launch both via Task tool:
- Both with `run_in_background: true`
- Poll with `TaskOutput` every 30 seconds until both complete

Update agent JSON status to `agent-running`.

## Step 8: Post-Processing

Update agent JSON status to `post-processing`.

### 8a. Merge to Master

```bash
cd "$WORKTREE"
git fetch origin master
git rebase origin/master

cd <repo-root>
git checkout master
git pull --ff-only origin master
git merge --ff-only "$BRANCH"
```

**Retry loop** (up to 3x with 2s/4s/6s backoff):
- If ff-merge fails (master moved): fetch, re-rebase in worktree, retry
- If rebase has textual conflicts: abort, report to user, leave worktree for manual resolution, die

Update agent JSON status to `merging`.

### 8b. Write Tickets (if needed)

- For M2 (matrix completion): create bug/feature/ptu-rule tickets on master
- For reviewer findings: create follow-up tickets on master

### 8c. Update State Files (conflict-safe)

1. `git pull --ff-only origin master`
2. Read current state file
3. Apply ONLY changes for the specific ticket this orchestrator worked on:
   - Update the specific ticket row (status, summary)
   - Update "Active Developer Work" if dev orchestrator
   - Append to "Session Summary" (never overwrite existing entries)
   - Update "Code Health" metrics
4. Do NOT rewrite sections you didn't touch
5. Stage state files, tickets, and alive-agents.md
6. `git commit -m "orchestrator: <type> completion for <target>"`
7. `git push origin master`
8. If push fails:
   - `git pull --rebase origin master`
   - For state file conflicts: other orchestrator's changes win for rows you didn't touch; your changes win for your specific ticket
   - Resolve, commit, push (retry up to 3x)

### 8d. Append to alive-agents.md

Append one row to `app/tests/e2e/artifacts/alive-agents.md`:

```markdown
| <id> | <type> | <target> | <result> | <ISO timestamp> | <commit hashes> |
```

This is piggybacked on the same commit as 8c.

## Step 9: Cleanup

```bash
git worktree remove "$WORKTREE" --force
git branch -d "$BRANCH"
rm -f .worktrees/claims/<target>.lock
rm -f .worktrees/agents/orch-<id>.json
```

## Step 10: Death Report

Summarize what was completed and suggest next steps:

```markdown
## Orchestrator Complete

### Work Done
- **Type:** <type>
- **Target:** <target>
- **Result:** <success | partial | failed>
- **Commits merged:** <hashes>

### Tickets Created/Updated
- <list>

### Suggested Next Launch
- <recommendation based on updated state>
  - Dev completed → "Launch review orchestrator for <ticket>"
  - Reviews approved → "Next priority: <ticket>"
  - Reviews CHANGES_REQUIRED → "Launch dev orchestrator for re-work on <ticket>"
```

**Then die.** This session is over.

## Ticket Creation Process (M2)

When a domain's matrix and audit are both complete:

1. Read `matrix/<domain>-matrix.md` and `matrix/<domain>-audit.md`
2. Create **bug tickets** for each `Incorrect` audit item → `tickets/bug/bug-<NNN>.md`
3. Create **feature tickets** for each `Missing` matrix item → `tickets/feature/feature-<NNN>.md`
4. Create **ptu-rule tickets** for each `Approximation` audit item → `tickets/ptu-rule/ptu-rule-<NNN>.md`
5. Skip `Correct`, `Out of Scope`, `Ambiguous` items
6. All tickets include `matrix_source` frontmatter

## Template Mapping

| Agent Type | Template File | Source Skill (reference only) |
|---|---|---|
| Developer | `templates/agent-dev.md` | `ptu-session-helper-dev.md` |
| Senior Reviewer | `templates/agent-senior-reviewer.md` | `ptu-session-helper-senior-reviewer.md` |
| Game Logic Reviewer | `templates/agent-game-logic-reviewer.md` | `game-logic-reviewer.md` |
| Code Health Auditor | `templates/agent-code-health-auditor.md` | `code-health-auditor.md` |
| Rule Extractor | `templates/agent-rule-extractor.md` | `ptu-rule-extractor.md` |
| Capability Mapper | `templates/agent-capability-mapper.md` | `app-capability-mapper.md` |
| Coverage Analyzer | `templates/agent-coverage-analyzer.md` | `coverage-analyzer.md` |
| Implementation Auditor | `templates/agent-implementation-auditor.md` | `implementation-auditor.md` |
| Retrospective Analyst | `templates/agent-retrospective-analyst.md` | `retrospective-analyst.md` |

**Template fallback:** If a template produces poor agent results (incomplete output, wrong format), fall back to embedding the full skill file for that launch. Note this in the death report.

## Staleness Detection

Compare timestamps across stages:
- App code changed after capability mapping → re-map needed
- Re-mapped capabilities → matrix stale, re-analyze needed
- Developer commit after latest approved review → re-review needed

For code changes, check `git log --oneline -10` and map to domains via `references/app-surface.md`.

## Domain List

| Domain | Coverage |
|--------|----------|
| combat | damage, stages, initiative, turns, status conditions |
| capture | capture rate, attempt, ball modifiers |
| healing | rest, extended rest, Pokemon Center, injuries |
| pokemon-lifecycle | creation, stats, moves, abilities, evolution |
| character-lifecycle | creation, stats, classes, skills |
| encounter-tables | table CRUD, entries, sub-habitats, generation |
| scenes | CRUD, activate/deactivate, entities, positioning |
| vtt-grid | grid movement, fog of war, terrain, backgrounds |

## What You Do NOT Do

- Write code or modify app files
- Make PTU rule judgments (defer to Game Logic Reviewer)
- Approve code changes (defer to Senior Reviewer)
- Auto-spawn other orchestrators (suggest in death report, user launches)
- Persist across multiple work units (one unit, then die)
- Write artifacts other than state files, tickets (M2), and alive-agents.md
