# Plan: Build PTU Skills Ecosystem (9 Skills)

## Context

The PTU Session Helper needs a structured skill ecosystem to drive quality through gameplay testing. The core insight: the playtest loop drives the dev loop — gameplay scenarios define correctness, and development responds to test failures.

**Architecture: Separate terminals.** Each skill runs in its own Claude Code session. The user acts as liaison, copy-pasting context between terminals. Skills communicate through persistent artifact files on disk, not shared context.

## Ecosystem Architecture

```
Orchestrator (reads artifacts, suggests next step to user)
     │
     ├── Testing Loop (primary):
     │   Gameplay Loop Synthesizer → Scenario Crafter → Scenario Verifier
     │       → Playtester → Result Verifier
     │                           │
     │                      issues found
     │                           │
     └── Dev Loop (reactive):
         Dev → Reviewer + Game Logic Reviewer
                           │
                      back to Playtester
```

**Orchestrator** reads the artifact directory (`tests/e2e/artifacts/`) to see what exists, what's stale, and what failed. It tells the user which terminal to go to next and what command to run.

## Artifact Flow

All inter-skill communication happens through files:

```
tests/e2e/
├── artifacts/
│   ├── loops/              # Gameplay Loop Synthesizer output
│   │   ├── combat.md
│   │   ├── capture.md
│   │   └── ...
│   ├── scenarios/          # Scenario Crafter output
│   │   ├── combat-basic-damage.md
│   │   └── ...
│   ├── verifications/      # Scenario Verifier output
│   │   ├── combat-basic-damage.verified.md
│   │   └── ...
│   ├── results/            # Playtester output (test run results)
│   │   ├── combat-basic-damage.result.md
│   │   └── ...
│   └── reports/            # Result Verifier output (bug reports, corrections)
│       ├── bug-001.md
│       └── ...
├── scenarios/              # Playwright spec files written by Playtester
│   └── combat/
│       └── basic-damage.spec.ts
└── .gitkeep
```

Each skill reads from the previous stage's directory and writes to its own.

## File Layout

```
.claude/skills/
├── ptu-skills-ecosystem.md              (new — master reference)
├── orchestrator.md                      (new — pipeline driver)
├── ptu-session-helper-dev.md            (update — add ecosystem awareness)
├── ptu-session-helper-senior-reviewer.md (update — add ecosystem awareness)
├── game-logic-reviewer.md               (evolve from verify-ptu.md)
├── gameplay-loop-synthesizer.md         (new)
├── scenario-crafter.md                  (new)
├── scenario-verifier.md                 (new)
├── playtester.md                        (new)
├── result-verifier.md                   (new)
├── skill_creation.md                    (unchanged)
└── references/
    ├── ptu-chapter-index.md             (new — shared rulebook lookup)
    ├── skill-interfaces.md              (new — data contracts between skills)
    ├── app-surface.md                   (new — testable feature map)
    └── playwright-patterns.md           (new — e2e test patterns for this app)
```

Remove after evolution: `verify-ptu.md`
Update: `.claude/hookify.verify-ptu-mechanics.local.md` (keep `/verify-ptu` trigger, add note about `game-logic-reviewer.md`)

---

## Build Order (15 steps)

### Phase 1: Foundation (shared references + ecosystem doc + scaffolding)

#### Step 1: Scaffold artifact directories and install Playwright

Create the directory structure for inter-skill artifacts:
```
mkdir -p app/tests/e2e/artifacts/{loops,scenarios,verifications,results,reports}
mkdir -p app/tests/e2e/scenarios
touch app/tests/e2e/.gitkeep
```

Verify Playwright is ready:
```
cd app && npx playwright install chromium
```

This unblocks Step 12 (Playtester) and avoids a "browsers not installed" failure on first run.

#### Step 2: references/ptu-chapter-index.md (~140 lines)

- Mechanic-to-rulebook mapping table (carried from verify-ptu.md)
- Chapter-to-file map with key section search terms
- Key formulas: HP (`level + (baseHp * 3) + 10`), evasion (`floor(stat / 5)`), damage, capture rate
- App code locations per mechanic (composables, services, API routes)
- Errata overrides section
- **"How to look up base stats" section**: explains pokedex directory structure (`books/markdown/pokedexes/gen<N>/<species>.md`), the format guide at `pokedexes/how-to-read.md`, and grep patterns for finding a species file

#### Step 3: references/skill-interfaces.md (~180 lines)

Define 5 interchange formats (YAML frontmatter + structured markdown body):

1. **Gameplay Loop** — `loop_id`, `domain`, `ptu_refs`, `app_features` → Preconditions, Steps, PTU Rules Applied, Expected Outcomes
2. **Scenario** — `scenario_id`, `loop_id`, `priority`, `ptu_assertions` → Setup (API calls), Actions (UI steps), Assertions (with derivations showing math), Teardown
3. **Test Result** — `scenario_id`, `run_id`, `status` → Assertion Results table (expected/actual/status), Errors, Screenshots
4. **Bug Report** — `bug_id`, `severity`, `scenario_id`, `affected_files` → What Happened, Root Cause Analysis, Suggested Fix, PTU Rule Reference
5. **Pipeline State** — `domain`, `last_updated`, `stage` → Per-loop status (which loops exist, which are verified, which have passing tests, which have open bugs). Read by Orchestrator.

#### Step 4: references/app-surface.md (~100 lines)

- Page routes by view (GM/Group/Player) with purpose
- API endpoint groups with CRUD patterns
- Store → composable → API mapping per domain
- Dev server details (port 3001, seed commands)
- Selector guidance: prefer `data-testid` attributes, fall back to label-based selectors

#### Step 5: references/playwright-patterns.md (~80 lines)

- Playwright config reference (`app/playwright.config.ts`: testDir `./tests/e2e`, baseURL `localhost:3001`, Chromium, 60s timeout)
- API setup/teardown pattern using `request` fixture
- Navigation patterns for GM/Group views
- Wait strategies for WebSocket updates (`page.waitForResponse`)
- Screenshot capture patterns
- File organization: `app/tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts`
- Prerequisites note: `npx playwright install chromium` before first run

#### Step 6: ptu-skills-ecosystem.md (~250 lines)

- Overview of the two-loop system and separate-terminal architecture
- Text diagrams for Testing Loop and Dev Loop
- Per-skill summary table: name, trigger command, input, output, terminal, file path
- Artifact directory layout and file naming conventions
- Interface format summaries (pointers to `references/skill-interfaces.md`)
- Orchestration patterns: full loop, targeted test, debug failure, add new loops
- Shared resources listing
- **Pipeline state file**: explain that `tests/e2e/artifacts/pipeline-state.md` tracks overall progress, updated by each skill after writing its artifacts

### Phase 2: Orchestrator + Existing Skill Updates

#### Step 7: orchestrator.md (~200 lines)

**Trigger:** `/orchestrate`, start of any PTU testing session, "what should I do next"

**Role:** Read artifact directory state → determine pipeline position → tell user which terminal and command to run next.

**Process:**
1. Scan `tests/e2e/artifacts/` — what loops exist? What scenarios? What results?
2. Check for stale artifacts (loop updated but scenarios not re-verified)
3. Check for open bug reports in `artifacts/reports/`
4. Suggest next action with specific command: "Go to the Scenario Crafter terminal and run `/craft-scenarios` for the `combat` domain — 3 verified loops have no scenarios yet"
5. After dev fixes, suggest re-running affected scenarios only (not the full suite)

**Key behaviors:**
- Never writes code or artifacts itself — only reads and advises
- Maintains `tests/e2e/artifacts/pipeline-state.md` (a summary of what exists and what's needed)
- Knows all 8 other skills' triggers and what they produce
- When all scenarios pass for a domain, says so and suggests the next domain

**YAML frontmatter:** proper `name:` and `description:` per skill_creation.md spec.

#### Step 8: Update ptu-session-helper-dev.md

Add after "Project Context" section (~20 lines):
- "Ecosystem Role" section explaining this skill runs in its own terminal within the dev loop
- How to read bug reports from `tests/e2e/artifacts/reports/`
- After fixing a bug, update the bug report file with fix details
- Reference to `ptu-skills-ecosystem.md`
- No other changes to existing content

#### Step 9: Update ptu-session-helper-senior-reviewer.md

Add after "Your Role" section (~15 lines):
- "Ecosystem Role" section explaining review alongside Game Logic Reviewer, each in separate terminals
- How to read bug reports and check fixes against test failure assertions
- When approving a fix, note which scenarios should be re-run
- Reference to `ptu-skills-ecosystem.md`
- No other changes to existing content

#### Step 10: Evolve verify-ptu.md → game-logic-reviewer.md

- **Add proper YAML frontmatter** with `name: game-logic-reviewer` and `description:` that includes when to use it (the current verify-ptu.md has no frontmatter)
- Keep the core 4-step process intact
- Move mechanic-to-rulebook table to shared `references/ptu-chapter-index.md`, replace with pointer
- Expand triggers: add dev loop triggers (fix verification, scenario verification, reviewer escalation)
- Add severity levels (CRITICAL/HIGH/MEDIUM) matching Reviewer conventions
- Add structured output format with `Status: CORRECT / INCORRECT / NEEDS REVIEW` per mechanic
- Add "Ecosystem Integration" section — explains this runs in its own terminal, reads bug reports and scenario verifications
- Keep `/verify-ptu` in description for backward compatibility
- Update hookify file: keep `/verify-ptu` trigger, add note that the full skill is now `game-logic-reviewer.md`
- Delete old `verify-ptu.md`

### Phase 3: Testing Loop Skills (dependency order)

#### Step 11: gameplay-loop-synthesizer.md (~250 lines)

**Trigger:** `/synthesize-loops`, generating test coverage, new feature domains

**Role:** Read PTU rulebooks + app code → produce structured gameplay loop documents → save to `tests/e2e/artifacts/loops/`

**Process:**
1. Select domain
2. Read rulebook chapters (via `references/ptu-chapter-index.md`)
3. Map to app features (via `references/app-surface.md`)
4. Generate loops per interface spec
5. Identify edge case sub-loops
6. **Save loops as persistent files** in `tests/e2e/artifacts/loops/<domain>.md`
7. Update `pipeline-state.md`

**Domain list:** combat, capture, character-lifecycle, pokemon-lifecycle, healing, encounter-tables, scenes, vtt-grid

**Output:** Gameplay Loop format per `references/skill-interfaces.md`, persisted to disk.

**Key:** Loops are generated once and reused. Only regenerate when rulebook interpretation changes or new app features are added.

#### Step 12: scenario-crafter.md (~280 lines)

**Trigger:** `/craft-scenarios`, turning loops into test cases

**Role:** Read Gameplay Loops from `tests/e2e/artifacts/loops/` → produce Scenarios with concrete data, UI actions, quantitative assertions → save to `tests/e2e/artifacts/scenarios/`

**Process:**
1. Read loop file(s) from artifacts directory
2. Generate concrete data — **real Pokemon species with looked-up base stats** (reads pokedex files via the lookup guide in `references/ptu-chapter-index.md`)
3. Map to UI actions (page routes, form fields, buttons via `references/app-surface.md`)
4. Write assertions with shown math (e.g., "Bulbasaur HP = 15 + (5 * 3) + 10 = 40, expected 40")
5. Add API-based setup/teardown
6. Assign priority
7. Save to `tests/e2e/artifacts/scenarios/<scenario-id>.md`
8. Update `pipeline-state.md`

#### Step 13: scenario-verifier.md (~200 lines)

**Trigger:** `/verify-scenarios`, before running Playtester

**Role:** Read scenarios from `tests/e2e/artifacts/scenarios/` → validate against PTU 1.05 rules → save verification reports to `tests/e2e/artifacts/verifications/`

**Process:**
1. Check data validity (real species? correct base stats from pokedex files? learnable moves?)
2. Re-derive each assertion's expected value independently
3. Check completeness vs gameplay loop
4. Check errata overrides
5. Save verification report (each assertion: CORRECT / INCORRECT with fix)
6. Update `pipeline-state.md`

**Escalation:** Ambiguous PTU rules → tell user to consult Game Logic Reviewer terminal

#### Step 14: playtester.md (~300 lines)

**Trigger:** `/playtest`, executing verified scenarios

**Role:** Read verified scenarios from `tests/e2e/artifacts/verifications/` → write Playwright `.spec.ts` files → execute → produce Test Results → save to `tests/e2e/artifacts/results/`

**Process:**
1. Parse verified scenario file
2. Write `.spec.ts` to `app/tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts`
3. API-based setup using `request` fixture (faster than UI)
4. UI actions via Playwright
5. Assert expected values
6. Screenshot on failure
7. Parse Playwright output
8. Save Test Result doc to `tests/e2e/artifacts/results/<scenario-id>.result.md`
9. Update `pipeline-state.md`

**Self-correction loop:** On selector/timing failures (not assertion failures), retry up to 2 times with adjusted selectors or waits before classifying as TEST_BUG. This avoids escalating flaky locators to the Scenario Crafter unnecessarily.

**Prerequisites note:** If Playwright browsers aren't installed, run `npx playwright install chromium` first.

**References:** `references/playwright-patterns.md` for selectors and patterns, `references/app-surface.md` for routes.

#### Step 15: result-verifier.md (~200 lines)

**Trigger:** `/verify-results`, after Playtester runs

**Role:** Read test results from `tests/e2e/artifacts/results/` → triage failures → produce bug reports or correction reports → save to `tests/e2e/artifacts/reports/`

**Failure triage categories:**
- **APP_BUG:** Code wrong, PTU rule correct → Bug Report for Dev terminal
- **SCENARIO_BUG:** Assertion wrong → Correction for Scenario Crafter terminal
- **TEST_BUG:** Playwright timing/selector issue (after Playtester's 2 retries exhausted) → Fix notes for Playtester terminal
- **AMBIGUOUS:** PTU rule unclear → Escalate to Game Logic Reviewer terminal

**Output:** Summary report + individual bug/correction reports per interface spec, saved to `tests/e2e/artifacts/reports/`. Update `pipeline-state.md`.

---

## Key Design Decisions

1. **Separate terminals** — each skill is a Claude Code session, user liaisons between them. Skills never share context directly.
2. **Persistent artifact files** — all inter-skill data lives on disk in `tests/e2e/artifacts/`. This means state survives terminal restarts and context clears.
3. **Pipeline state file** — `tests/e2e/artifacts/pipeline-state.md` is the Orchestrator's single source of truth for pipeline progress.
4. **Structured markdown with YAML frontmatter** — Claude generates it natively, human-readable, parseable by subsequent skills.
5. **Shared references directory** — all PTU-aware skills point to `references/ptu-chapter-index.md` instead of duplicating rulebook knowledge. Includes pokedex lookup instructions.
6. **API-based test setup** — Playtester uses Playwright's `request` fixture for data creation (faster, more reliable than UI-based setup).
7. **Four-way failure triage** — Result Verifier classifies failures so fixes go to the right terminal.
8. **Playtester self-correction** — 2 retries on selector/timing issues before escalating as TEST_BUG.
9. **Loops are persistent artifacts** — Synthesizer generates them once, they're reused until domain changes. No regeneration per cycle.
10. **All skills get proper YAML frontmatter** — `name:` and `description:` per the skill_creation.md spec.

## Verification

After building all skills:
1. Invoke each skill's trigger command to verify it loads correctly
2. Run `/orchestrate` on an empty artifact directory — should suggest starting with Gameplay Loop Synthesizer
3. Run `/synthesize-loops` on "combat" domain → check loop file written to `artifacts/loops/combat.md`
4. Run `/craft-scenarios` reading the combat loop → check scenario files in `artifacts/scenarios/`
5. Run `/verify-scenarios` → check verification files in `artifacts/verifications/`
6. Run `/playtest` on a verified scenario (requires running dev server) → check spec file and result file
7. Run `/verify-results` → check triage report in `artifacts/reports/`
8. Run `/orchestrate` again — should reflect pipeline progress and suggest next step
9. If bugs found, verify the Dev + Reviewer + Game Logic Reviewer handoff via Orchestrator guidance
