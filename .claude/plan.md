# Plan: Feature Designer Skill + Gap Detection Categories

## Context

The PTU skills ecosystem (10 skills) tests the app against PTU rulebook expectations. The Result Verifier currently classifies test failures into 4 categories: APP_BUG, SCENARIO_BUG, TEST_BUG, AMBIGUOUS. With Tier 1 workflow tests now entering the pipeline, tests will start failing because the app doesn't support a feature at all or the backend works but no UI exposes it. These aren't bugs — they're gaps. The Developer skill implements code but isn't suited for UI/UX design decisions. We need:

1. Two new failure categories (FEATURE_GAP, UX_GAP) in the Result Verifier
2. A new Feature Designer skill to design solutions for gaps before the Developer implements
3. A proactive feasibility check in the Synthesizer to catch gaps before testing
4. Updates to Orchestrator, Scenario Verifier, Senior Reviewer, specification, and ecosystem docs

After this change the ecosystem goes from 10 to 11 skills.

---

## Implementation Order

Changes are ordered by dependency — later files reference earlier ones, with the exception of Steps 5-6 (Crafter/Verifier) which add handling for gap annotations produced by Step 8 (Synthesizer). Those changes are additive no-ops until the Synthesizer gains annotation capability, so they're safe to apply early.

### 1. Create directories and seed files

- Create `app/tests/e2e/artifacts/designs/` with `.gitkeep`
- Create empty `app/tests/e2e/artifacts/lessons/feature-designer.lessons.md` (Step 0 of every skill reads its lesson file — seed it so the Feature Designer doesn't skip on first run)

### 2. Update skill-interfaces.md — new report + design spec schemas

**File:** `.claude/skills/references/skill-interfaces.md`

**Changes:**
- Add to Artifact Directory Layout: `designs/` line with `# Feature Designer writes`
- Add to File Naming Conventions:
  - `feature-gap-<NNN>.md` and `ux-gap-<NNN>.md` in `artifacts/reports/` (per-prefix counter — e.g., `feature-gap-001` and `ux-gap-001` can coexist, matching existing convention where `bug-001` and `correction-001` coexist)
  - `design-<NNN>.md` in `artifacts/designs/` (also per-prefix counter)
- Add Section 5c: Feature Gap Report (FEATURE_GAP) — frontmatter: `feature_gap_id`, `category: FEATURE_GAP`, `scope: FULL|PARTIAL|MINOR`, `scenario_id`, `loop_id`, `domain`, `missing_capabilities[]`, `ptu_refs[]`. Body: What Is Missing, Workflow Impact, What Exists Today, PTU Rule Reference, Recommended Scope, Design Spec link
- Add Section 5d: UX Gap Report (UX_GAP) — frontmatter: `ux_gap_id`, `category: UX_GAP`, `scope: PARTIAL|MINOR` (never FULL — if there's no backend at all, it's FEATURE_GAP not UX_GAP), `scenario_id`, `loop_id`, `domain`, `working_endpoints[]`, `missing_ui[]`. Body: What Is Missing, Backend Evidence, Workflow Impact, What GM Sees Today, Design Spec link
- Add Section 8: Design Spec — frontmatter: `design_id`, `gap_report`, `category`, `scope`, `domain`, `scenario_id`, `loop_id`, `status: pending | complete | implemented`, `affected_files[]`, `new_files[]`. Body: Summary, GM User Flow, Data Model Changes (FEATURE_GAP only), API Changes (FEATURE_GAP only), Client Changes (components, stores, pages), WebSocket Events, Existing Patterns to Follow, PTU Rule Questions, Implementation Log (Developer fills in — commit hashes and files changed)
  - The `status` frontmatter field tracks lifecycle: `pending` (Feature Designer working), `complete` (spec written, awaiting Developer), `implemented` (Developer filled in Implementation Log with commit hashes). The Orchestrator uses this field for routing decisions — no markdown content parsing needed
- Add Pipeline State: Design stage — new row in per-domain tables:
  - Placed after Results (the final existing stage): `Loops → Scenarios → Verifications → Test Runs → Results → Designs`
  - The Design stage is a parallel track triggered by gap reports, not a sequential gate — a domain can have Designs in progress while other stages continue for non-gap scenarios
  - A domain can have multiple designs in flight (one per gap report) — the count column shows e.g. `2/3 complete`
  - Statuses: `design pending` (gap report exists, no design spec yet), `design complete` (spec written, awaiting Developer), `implemented` (Developer updates this after implementation + commit), `re-tested` (Playtester re-ran the original scenario after implementation)
  - The `implemented` status is set by the Developer when they fill in the design spec's Implementation Log section and update the frontmatter `status` field to `implemented`. The Orchestrator can verify by checking the design spec frontmatter `status` field
  - The `re-tested` status is set by the Playtester after re-running the original scenario against the implemented feature
- Update Section 6 (Shared References) — add Feature Designer to consumers of `app-surface.md` and `ptu-chapter-index.md`

### 3. Create feature-designer.md — new skill

**File:** `.claude/skills/feature-designer.md`

**Structure** (following existing skill conventions):
- Frontmatter: `name: feature-designer`, description with triggers
- H1: Feature Designer
- **Role:** "You design app features and UI surface area to close gaps between what PTU gameplay requires and what the app currently supports."
- **Context:** Pipeline position (Result Verifier → gap report → You → design spec → Developer), input/output paths
- **Process:**
  - Step 0: Read lessons (`artifacts/lessons/feature-designer.lessons.md`)
  - Step 1: Read gap report — understand what workflow triggered it, what's missing, FEATURE_GAP vs UX_GAP
  - Step 2: Read workflow context — the full loop from `artifacts/loops/`
  - Step 3: Analyze current app surface — read `app-surface.md` + relevant app code. For FEATURE_GAP: focus on server-side (services, API, Prisma). For UX_GAP: focus on client-side (pages, components, composables, stores)
  - Step 4: Read PTU rules (FEATURE_GAP only) — via `ptu-chapter-index.md`. Flag ambiguous rules for Game Logic Reviewer
  - Step 5: Design the feature — produce spec sections based on gap type. FEATURE_GAP: data model, API, service logic, client integration, WebSocket, migration. UX_GAP: components, page changes, stores/composables, user flow, WebSocket
  - Step 5b: Escalation check — if the design involves architectural questions (e.g., new service vs extending existing, new store vs extending existing), note them in a "Questions for Senior Reviewer" section in the design spec. The Developer will route these during implementation review
  - Step 6: Write design spec to `artifacts/designs/design-<NNN>.md` with frontmatter `status: complete`
  - Step 7: Update pipeline state (set design stage to `design complete`)
- **Authority:** UI/UX design patterns and feature surface design. Defers to Game Logic Reviewer for PTU rules, Senior Reviewer for code architecture
- **What You Do NOT Do:** write code (Developer), make PTU rulings (Game Logic Reviewer), judge code architecture (Senior Reviewer), write scenarios (Crafter), run tests (Playtester), triage failures (Result Verifier)

### 4. Update result-verifier.md — add FEATURE_GAP and UX_GAP

**File:** `.claude/skills/result-verifier.md`

**Changes:**
- Step 2 decision tree — redesigned (this replaces the current simpler classification process with a more detailed nested decision tree that handles gap detection):

```
Was it a Playwright error (selector not found, timeout, navigation)?
  YES → Did Playtester already retry twice?
    YES → TEST_BUG
    NO → Should not be here (Playtester handles retries)
  NO → Was it a 404/missing endpoint error?
    YES → Does the scenario reference a capability listed in app-surface.md?
      YES (capability is listed but 404 anyway) → APP_BUG (likely wrong URL or broken endpoint)
      NO (capability is NOT in app-surface.md) → FEATURE_GAP
    NO → Was the expected value correct per PTU rules?
      YES (expected is correct) →
        Does the specific operation exist? (Check: read the actual route handler
        and service source code to verify the endpoint accepts the needed
        parameters and supports the operation. Do NOT rely solely on
        app-surface.md for parameter-level detail.)
          NO (endpoint exists but doesn't support this operation)
            → FEATURE_GAP (partial — the capability doesn't exist,
              even though a related endpoint does)
          YES → Can the GM trigger this action via the UI?
            Check: is there a button, form, page route for this action?
            NO → UX_GAP
            YES → APP_BUG (app produced wrong value)
      NO (expected was wrong) → SCENARIO_BUG
      UNCLEAR (rule is ambiguous) → AMBIGUOUS
```

- Key: The "specific operation" check catches cases where an endpoint exists but doesn't support the needed operation (e.g., `/api/capture` exists but doesn't accept `encounterId` for in-combat capture). The response may be 200 with unexpected results, not 404 — so the 404 check alone would miss this. The Result Verifier reads actual source code for this check rather than relying on `app-surface.md`, which documents endpoints at the path level but not parameter-level detail.
- Failure Categories section — add:
  - **FEATURE_GAP:** App lacks the capability entirely. Diagnostic signals: 404 from API call AND the endpoint is not listed in `app-surface.md`, OR endpoint exists but doesn't support the needed operation (verified by reading source code), no corresponding service/composable exists. Routes to Feature Designer
  - **UX_GAP:** Backend works, no UI path. Diagnostic signals: direct API call succeeds, but no UI element exists for the action. Routes to Feature Designer
- Decision Rules — add:
  - FEATURE_GAP guard: Always cross-check against `app-surface.md` before classifying. If the capability IS listed in `app-surface.md` but returns 404, it's more likely APP_BUG (broken endpoint) or TEST_BUG (wrong URL in test), not FEATURE_GAP
  - FEATURE_GAP at operation level: An endpoint may exist but not support the needed operation (e.g., 200 response but missing parameters or unexpected behavior). Read the actual route handler/service source to verify — `app-surface.md` lists endpoints at the path level but not parameter support
  - FEATURE_GAP vs UX_GAP: test via direct API call. 404 + not in `app-surface.md` = FEATURE_GAP. API succeeds + no UI = UX_GAP
  - UX_GAP scope: never FULL — if there's no backend at all, classify as FEATURE_GAP instead
- Report Naming — add `feature-gap-<NNN>.md`, `ux-gap-<NNN>.md`
- Update description frontmatter to mention 6 categories instead of 4

### 5. Update scenario-crafter.md — gap annotation awareness

**File:** `.claude/skills/scenario-crafter.md`

**Changes** (minimal — one paragraph):
- Add to the section where the Crafter reads workflow loops: "If a workflow step is annotated with `[GAP: FEATURE_GAP]` or `[GAP: UX_GAP]`, include the step in the scenario anyway. Write the scenario as if the feature existed — the Playtester will fail at that step, the Result Verifier will triage it as FEATURE_GAP/UX_GAP, and the pipeline will route it to the Feature Designer. Do not skip or rewrite gap-annotated steps."
- This makes the Crafter's behavior explicit: include gap steps, let the pipeline handle them
- Update "10-skill" reference to "11-skill"

### 6. Update scenario-verifier.md — gap annotation awareness

**File:** `.claude/skills/scenario-verifier.md`

**Changes:**
- Step 1 (Read Scenario) — add: "Check if the source workflow loop has any `[GAP: FEATURE_GAP]` or `[GAP: UX_GAP]` annotations from the Synthesizer's feasibility check."
- New Step 5b: Feasibility Flag Check (after existing Step 5: Completeness Check):
  - If the scenario's source workflow has gap-annotated steps, AND the scenario includes actions that exercise those gap-annotated steps, mark the verification report with a warning AND add frontmatter field `has_feasibility_warnings: true`:

```yaml
---
has_feasibility_warnings: true
feasibility_gaps:
  - step: 3
    type: FEATURE_GAP
    detail: "No capture-in-combat API endpoint"
  - step: 5
    type: UX_GAP
    detail: "No 'Send Replacement' button in encounter UI"
---
```

```markdown
## Feasibility Warning

This scenario exercises workflow steps flagged as infeasible by the Synthesizer:
- Step 3: [GAP: FEATURE_GAP] — No capture-in-combat API endpoint
- Step 5: [GAP: UX_GAP] — No "Send Replacement" button in encounter UI

The Playtester should expect failures at these steps. Consider routing to Feature Designer before testing.
```

  - This is informational only — it does NOT block verification or prevent the Playtester from running the scenario. It gives the Orchestrator early signal to prioritize gap resolution
  - The `has_feasibility_warnings` frontmatter field enables efficient Orchestrator scanning without parsing markdown body content
- Update "10-skill" reference to "11-skill"

### 7. Update orchestrator.md — route gap reports + designs

**File:** `.claude/skills/orchestrator.md`

**Changes:**
- Skill Triggers table — add Feature Designer row: `| Feature Designer | new or reuse | feature-designer.md |`
- Step 2 scan directories — add `artifacts/designs/`
- Step 2 scan — add: "For verification reports, check frontmatter `has_feasibility_warnings` field to detect proactive gap signals from the Scenario Verifier"
- Step 3 priority routing — updated order:
  1. CRITICAL bugs → Dev
  2. FULL-scope feature gaps → Feature Designer (blocks entire workflows)
  3. Escalations → Game Logic Reviewer
  4. HIGH bugs + PARTIAL/MINOR gaps → Dev / Feature Designer respectively
  5. Scenario corrections → Crafter
  6. Test bugs → Playtester
  7. Gap reports with no design spec yet (gap report exists in `reports/`, no corresponding `design-*.md` references it) → Feature Designer
  8. Pending designs (design spec frontmatter `status: complete`, not yet `implemented`) → Dev with explicit artifact path
  9. Implemented designs awaiting re-test (design spec frontmatter `status: implemented`, original scenario not re-run since implementation) → Playtester with explicit scenario path
  10. Feasibility warnings (verification reports with `has_feasibility_warnings: true` in frontmatter) → Feature Designer (proactive path — gaps detected before testing)
  11. Stale artifacts → Crafter
  12. Continue pipeline
  13. Domain cycle complete → Retrospective
  14. All clean → next domain
- Handoff format for designs → Dev: When the Orchestrator routes to the Developer for a pending design, the Step 4 advice must include the design spec path explicitly. Example:

```
Step 2 — after it loads, paste this:
  Implement design-001: mid-combat Pokemon replacement UI.
  Design spec: app/tests/e2e/artifacts/designs/design-001.md
  Gap report: app/tests/e2e/artifacts/reports/ux-gap-001.md
```

- Handoff format for re-test after implementation: When the Orchestrator routes to the Playtester for a re-test, include both the scenario path and the design spec that triggered re-implementation. Example:

```
Step 2 — after it loads, paste this:
  Re-test scenario after feature implementation.
  Scenario: app/tests/e2e/artifacts/scenarios/combat-workflow-capture-variant-001.md
  Design spec: app/tests/e2e/artifacts/designs/design-001.md (status: implemented)
```

- This ensures the Developer knows exactly which artifact to read (design spec vs bug report), and the Playtester knows which scenario to re-run after implementation
- Reports Format example — add gap report examples in the Active Issues list
- Domain List — unchanged
- Update "10-skill" reference to "11-skill"

### 8. Update gameplay-loop-synthesizer.md — feasibility check

**File:** `.claude/skills/gameplay-loop-synthesizer.md`

**Changes:**
- Step 4: Map to App Features — add Step 4b: Feasibility Check as a sub-step:
  - For each workflow step, verify: Does the API endpoint exist in `app-surface.md`? Does the UI expose the action (route/component listed)? Does the data model support the operation?
  - Annotate steps with `[FEASIBLE]` or `[GAP: FEATURE_GAP]` / `[GAP: UX_GAP]`
  - If any step has a GAP marker, append a Feasibility Summary table at the end of the workflow:

```markdown
## Feasibility Summary

| Step | Status | Gap Type | Details |
|------|--------|----------|---------|
| 3    | GAP    | FEATURE_GAP | No capture-in-combat API endpoint |
| 5    | GAP    | UX_GAP      | No "Send Replacement" button in encounter UI |
```

  - Soft flag, not hard gate — write complete workflows even with gaps. Orchestrator/Crafter/Verifier can use the flags to prioritize
- Update "10-skill" reference to "11-skill"

### 9. Update ptu-skills-ecosystem.md — architecture + tables

**File:** `.claude/skills/ptu-skills-ecosystem.md`

**Changes:**
- Change "10-skill" → "11-skill" references
- Architecture diagram — restructure to show a DESIGN LOOP as a third path from Result Verifier (alongside DEV LOOP for bugs and TESTING LOOP for scenario corrections):

```
Result Verifier
  ├── APP_BUG ──────────→ DEV LOOP (Developer → Reviewer)
  ├── SCENARIO_BUG ─────→ Scenario Crafter (back into TESTING LOOP)
  ├── TEST_BUG ─────────→ Playtester (retry/fix selectors)
  ├── AMBIGUOUS ────────→ Game Logic Reviewer
  ├── FEATURE_GAP ──────→ DESIGN LOOP (Feature Designer → Developer → Reviewer)
  └── UX_GAP ───────────→ DESIGN LOOP (Feature Designer → Developer → Reviewer)
```

- The Feature Designer sits in a new DESIGN LOOP that feeds into the DEV LOOP. This keeps the diagram clean rather than overloading the DEV LOOP box
- Skills Summary table — add row 11: Feature Designer
- Skill Files listing — add `feature-designer.md`
- Artifact Flow — add `designs/` line: Feature Designer writes → Developer reads
- Authority Hierarchy — add "UI/UX design, feature surface area, user flows" → Feature Designer; update Result Verifier row to mention 6 categories

### 10. Update specification.md — new skill entry + patterns

**File:** `.claude/skills/specification.md`

**Changes:**
- Add Section 3.11: Feature Designer — spec table (file, trigger, input, output, terminal), responsibilities, does-not-do list
- Update Authority Hierarchy — add Feature Designer authority
- Update Result Verifier section — mention 6 failure categories
- Add Section 7.5: Gap Detection Cycle — Result Verifier → Feature Designer → Developer → re-run
- Add Section 7.6: Proactive Gap Detection — Synthesizer flags → Verifier warns → Orchestrator → Feature Designer → Developer (before testing)
- Update "10-skill" references to "11-skill"

### 11. Update ptu-session-helper-dev.md — read design specs

**File:** `.claude/skills/ptu-session-helper-dev.md`

**Changes:**
- Ecosystem Role — add: design specs live in `artifacts/designs/design-*.md`, read them for new feature implementations. After implementing a design:
  1. Update the Implementation Log section in the design spec with commit hashes and files changed
  2. Set the design spec frontmatter `status` field to `implemented`
  3. Update `app-surface.md` with new routes/endpoints/components added by the implementation
- Plans bullet — add `artifacts/designs/` as a place to check before starting work

### 12. Update playtester.md — 404 retry behavior

**File:** `.claude/skills/playtester.md`

**Changes** (minimal — one line in Step 4: Self-Correction Loop):
- Add before the retry instructions: "Do not retry 404 responses. A 404 indicates a missing endpoint, not a transient failure. Record it as-is in the result and move on — the Result Verifier will classify it as FEATURE_GAP. Only retry selector/timing issues."
- Update "10-skill" reference to "11-skill"

### 13. Update game-logic-reviewer.md — design spec escalations

**File:** `.claude/skills/game-logic-reviewer.md`

**Changes** (minimal — one bullet):
- Escalations bullet (line ~16): extend to: "Escalations come from Scenario Verifier (ambiguous scenarios), Result Verifier (ambiguous test failures) via `artifacts/reports/escalation-*.md`, and Feature Designer (PTU rule questions in design specs) via `artifacts/designs/design-*.md` — check the 'PTU Rule Questions' section."
- Triggers list — add: "When a Feature Designer design spec contains unresolved PTU rule questions"
- Update "10-skill" reference to "11-skill"

### 14. Update ptu-session-helper-senior-reviewer.md — design escalations + app-surface verification

**File:** `.claude/skills/ptu-session-helper-senior-reviewer.md`

**Changes:**
- Ecosystem Role — add: design specs from the Feature Designer may include a "Questions for Senior Reviewer" section with architectural questions (new service vs extend existing, new store vs extend, etc.). When reviewing a Developer's implementation of a design spec, check this section and ensure the architectural decisions are sound
- Bug reports bullet — extend to: "Bug reports live in `artifacts/reports/bug-*.md`. Design specs with architectural questions live in `artifacts/designs/design-*.md`. Cross-check the worker's implementation against both."
- Review checklist — add: "If the implementation adds new endpoints, components, routes, or stores, verify that `app-surface.md` was updated to reflect them. This is the Developer's responsibility but the Senior Reviewer should catch it if missed."
- Update "10-skill" reference to "11-skill"

### 15. Update retrospective-analyst.md — new error categories

**File:** `.claude/skills/retrospective-analyst.md`

**Changes:**
- Step 3 categories table — add:
  - `feature-gap-recurrence`: tests were repeatedly written and run against nonexistent features, indicating the Synthesizer's feasibility check or Orchestrator's proactive routing failed to catch the gap early enough
  - `ux-gap-recurrence`: backend works but tests repeatedly fail because the UI doesn't expose the action, indicating the gap between backend capabilities and frontend surface area is a systemic pattern
- Note: These are process failure patterns (like `process-gap` or `routing-error`), not individual Result Verifier classifications. A single FEATURE_GAP classification is not a lesson — repeated gap-related failures across scenarios or domains indicate a process problem worth capturing
- Update "9 categories" → "11 categories"
- Update "10-skill" reference to "11-skill"

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Output location | `artifacts/designs/` (not `docs/`) | Pipeline artifact, not human-authored plan. Consistent with artifact-based communication model |
| FEATURE_GAP vs UX_GAP | Separate categories | Different diagnostic signals, different design scope. FEATURE_GAP = backend + frontend; UX_GAP = frontend only |
| Scope levels | FULL / PARTIAL / MINOR | "Scope" describes work needed; "severity" implies a bug. FULL maps to CRITICAL priority, PARTIAL to HIGH, MINOR to MEDIUM |
| UX_GAP scope | PARTIAL or MINOR only, never FULL | If there's no backend at all, it's FEATURE_GAP not UX_GAP. FULL scope implies a new subsystem, which always includes backend |
| Synthesizer check | Soft flag (annotate, continue) | Hard gate would block Crafter from getting input. Soft flag lets pipeline proceed while Orchestrator can proactively route to Feature Designer |
| app-surface.md updates | Developer updates after implementation | Feature Designer writes what should exist; `app-surface.md` describes what does exist |
| FEATURE_GAP guard | Cross-check against `app-surface.md` before classifying | Prevents misclassifying test typos (wrong URL) or broken endpoints as gaps |
| Operation-level gap check | Read actual source code, not just app-surface.md | `app-surface.md` documents endpoints at the path level but not parameter support. Reading route handlers/services is more reliable for operation-level checks |
| NNN counters | Per-prefix (not global across types) | Matches existing convention: `bug-001` and `correction-001` coexist. So `feature-gap-001`, `ux-gap-001`, `design-001` each start at 001 independently |
| Feature Designer in diagram | New DESIGN LOOP (not stuffed into DEV LOOP) | Cleaner separation; the design phase is distinct from implementation |
| Senior Reviewer interaction | Questions embedded in design spec, reviewed during implementation | Avoids a separate escalation step; Senior Reviewer naturally sees questions when reviewing the Developer's PR |
| skill_creation.md | No update needed | Generic Anthropic guide. Feature Designer uses flat `.md` pattern matching all existing project skills — no structural mismatch |
| Playtester 404 behavior | Don't retry 404s | A 404 is not a flaky selector — retrying wastes 2 cycles and delays FEATURE_GAP classification |
| Design lifecycle tracking | Frontmatter `status` field on design specs | Orchestrator scans frontmatter fields (not markdown content) for routing decisions — consistent with existing pipeline patterns. Three states: `pending`, `complete`, `implemented` |
| Feasibility warning detection | Frontmatter `has_feasibility_warnings` on verification reports | Enables efficient Orchestrator scanning without parsing markdown body content. Consistent with how other skills use frontmatter for machine-readable signals |
| Post-implementation re-test | Explicit Orchestrator routing priority for implemented designs | After Developer sets design `status: implemented`, the Orchestrator routes to Playtester with the original scenario path — closing the reactive loop |

---

## Verification

After implementation, verify by:

1. **Read-through check:** Load each modified skill file and confirm internal references are consistent (category names, report file patterns, routing targets, skill count)
2. **Trace the reactive path:** Result Verifier → FEATURE_GAP report → Orchestrator routing → Feature Designer → design spec (`status: complete`) → Developer → Implementation Log + `status: implemented` → Orchestrator detects implemented design → Playtester re-run → Result Verifier re-triage
3. **Trace the proactive path:** Synthesizer feasibility flag → Scenario Verifier warning (frontmatter `has_feasibility_warnings: true`) → Orchestrator reads frontmatter → routes to Feature Designer → design spec → Developer (before test failures)
4. **Trace the Scenario Verifier path:** Scenario with gap-annotated workflow → Verifier adds feasibility warning + frontmatter flag → Orchestrator scans verification frontmatter → can prioritize Feature Designer before Playtester
5. **Decision tree validation:** Walk through Result Verifier's decision tree with 5 scenarios:
   - (a) API returns 404, endpoint NOT in `app-surface.md` → FEATURE_GAP
   - (b) API returns 404, endpoint IS in `app-surface.md` → APP_BUG (broken endpoint, not a gap)
   - (c) Endpoint exists and returns 200, but doesn't support the needed operation (verified by reading source code) → FEATURE_GAP (operation-level gap)
   - (d) API works for the specific operation, no UI button exists → UX_GAP
   - (e) UI element exists but test selector is wrong → TEST_BUG
6. **Playtester 404 check:** Confirm the Playtester skill explicitly does not retry 404 responses
7. **Game Logic Reviewer check:** Confirm it knows to check "PTU Rule Questions" section in design specs
8. **Senior Reviewer check:** Confirm it knows to (a) look for "Questions for Senior Reviewer" in design specs and (b) verify `app-surface.md` was updated for new endpoints/components
9. **Orchestrator handoff format:** Confirm the Orchestrator's Developer routing includes the design spec path in the Step 2 task instructions
10. **Orchestrator re-test routing:** Confirm the Orchestrator has an explicit priority for implemented designs awaiting re-test, routing to Playtester with the original scenario path
11. **Design lifecycle states:** Confirm the Orchestrator distinguishes three design states via frontmatter `status` field: (a) no design yet → Feature Designer, (b) `status: complete` → Developer, (c) `status: implemented` → Playtester re-test
12. **Feasibility warning detection:** Confirm the Orchestrator scans verification report frontmatter for `has_feasibility_warnings: true` (not markdown body content)
13. **Count check:** All 15 modified files reference "11-skill" consistently
