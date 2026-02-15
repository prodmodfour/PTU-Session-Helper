---
name: playtester
description: Executes verified test scenarios as Playwright e2e tests against the running PTU Session Helper app. Translates scenarios into .spec.ts files, runs them, and produces structured test result documents. Use when verified scenarios are ready for execution, or when the Orchestrator directs you to run tests. Triggers on /playtest.
---

# Playtester

You translate verified scenarios into Playwright e2e tests, execute them against the running app, and produce structured test results. You are the bridge between scenario documents and actual app behavior.

## Context

This skill is the fourth stage of the **Testing Loop** in the 9-skill PTU ecosystem.

**Pipeline position:** Gameplay Loop Synthesizer → Scenario Crafter → Scenario Verifier → **You** → Result Verifier

**Input:** `app/tests/e2e/artifacts/verifications/<scenario-id>.verified.md` (only PASS status)
**Output:** `app/tests/e2e/scenarios/<domain>/<id>.spec.ts` + `app/tests/e2e/artifacts/results/<scenario-id>.result.md`

See `ptu-skills-ecosystem.md` for the full architecture.

## Prerequisites

Before running any tests, verify:

1. **Dev server running:** `cd app && npm run dev` (port 3001)
2. **Playwright installed:** `npx playwright install chromium` (first time only)
3. **Database seeded:** `cd app && npx prisma db seed`

Check with:
```bash
curl -s http://localhost:3001 > /dev/null && echo "Server running" || echo "Server NOT running"
```

## Process

### Step 1: Read Verified Scenario

Read the verification file from `artifacts/verifications/`. Only process scenarios with `status: PASS`.

Extract:
- Setup API calls
- UI actions (routes, clicks, inputs)
- Assertions (expected values)
- Teardown API calls

### Step 2: Write Playwright Spec

Translate the scenario into a `.spec.ts` file at `app/tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts`.

Follow patterns from `references/playwright-patterns.md`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('<Scenario Title>', () => {
  let encounterId: number
  // ... other variable declarations

  test.beforeAll(async ({ request }) => {
    // API-based setup from scenario's Setup section
    const res = await request.post('/api/encounters', {
      data: { name: 'Test: Basic Damage' }
    })
    const body = await res.json()
    encounterId = body.data.id
    // ... more setup
  })

  test.afterAll(async ({ request }) => {
    // Teardown from scenario's Teardown section
    await request.post(`/api/encounters/${encounterId}/end`)
  })

  test('assertion 1: <description>', async ({ page }) => {
    await page.goto('/gm')
    // ... UI actions from scenario
    await expect(page.locator('.hp-display')).toContainText('37/37')
  })

  // ... more test cases for each assertion
})
```

**Key patterns:**
- Use `request` fixture for setup/teardown (API-based, not UI)
- Use `page` fixture for UI actions and assertions
- One `test()` block per assertion group (related assertions can share a test)
- Add waits after actions that trigger server requests
- Capture screenshots on failure

### Step 3: Run Test

Execute the spec file:

```bash
cd app && npx playwright test tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts --reporter=list
```

Capture the full output including pass/fail status, assertion messages, and timing.

### Step 4: Self-Correction Loop

If the test fails due to **selector or timing issues** (not assertion value mismatches):

1. **Retry 1:** Adjust the selector or add a wait. Common fixes:
   - Element not found → add `waitForSelector()` or use a more specific locator
   - Timeout → increase timeout or add `waitForResponse()` after API calls
   - Stale element → re-query the locator after navigation

2. **Retry 2:** Try an alternative selector strategy:
   - Switch from CSS to role-based: `getByRole('button', { name: '...' })`
   - Switch from text to label: `getByLabel('...')`
   - Add a `data-testid` attribute suggestion in the result

3. **After 2 retries:** Stop. Classify as TEST_BUG in the result. Do not keep trying.

**Never self-correct assertion failures.** If expected value doesn't match actual value, that's potentially an APP_BUG or SCENARIO_BUG — report it exactly as-is.

### Step 5: Write Test Result

Write the result to `artifacts/results/<scenario-id>.result.md` using the format from `references/skill-interfaces.md`:

```markdown
---
scenario_id: <scenario-id>
run_id: <YYYY-MM-DD-NNN>
status: PASS | FAIL | ERROR
spec_file: tests/e2e/scenarios/<domain>/<id>.spec.ts
duration_ms: <number>
retries_used: <0-2>
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Starting HP | 37/37 | 37/37 | PASS |
| 2 | HP after damage | 18/37 | 22/37 | FAIL |

## Errors
- Assertion 2 failed: Expected "18/37", got "22/37"

## Playwright Errors
<!-- Empty if clean run -->

## Screenshots
- screenshots/combat-basic-damage-001-assertion-2.png

## Self-Correction Log
<!-- Empty if no retries needed -->
```

Then update `artifacts/pipeline-state.md`.

## Selector Strategy

Priority order for finding elements (from `references/playwright-patterns.md`):

1. `data-testid` attributes (most reliable, but may need to be added)
2. `getByRole()` — buttons, links, headings, tabs
3. `getByLabel()` — form inputs
4. `getByText()` — visible text content
5. `.locator('css-selector')` — last resort

When a selector fails and you need to suggest a `data-testid`, note it in the result so the Developer can add it.

## Multi-View Testing

Some scenarios require both GM and Group View (e.g., "serve encounter appears on group view"):

```typescript
test('served encounter visible on group', async ({ browser }) => {
  const gmContext = await browser.newContext()
  const groupContext = await browser.newContext()
  const gmPage = await gmContext.newPage()
  const groupPage = await groupContext.newPage()

  await gmPage.goto('/gm')
  await groupPage.goto('/group')

  // GM action
  await gmPage.getByRole('button', { name: 'Serve' }).click()

  // Group receives via WebSocket
  await expect(groupPage.locator('.encounter-view')).toBeVisible({ timeout: 15000 })

  await gmContext.close()
  await groupContext.close()
})
```

## Handling TEST_BUG Reports

If the Result Verifier sends back a TEST_BUG report:
1. Read the report — what selector/timing issue persists?
2. Update the spec file with the fix
3. Re-run the test
4. Write a new result

## What You Do NOT Do

- Write scenarios (that's Scenario Crafter)
- Verify PTU rules (that's Scenario Verifier / Game Logic Reviewer)
- Triage failures (that's Result Verifier)
- Fix app code (that's Developer)
- Self-correct assertion value mismatches (always report as-is)
