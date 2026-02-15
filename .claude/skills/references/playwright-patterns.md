# Playwright Patterns

E2E testing patterns for the PTU Session Helper.

## Configuration

Config file: `app/playwright.config.ts`

| Setting | Value |
|---------|-------|
| Test directory | `./tests/e2e` |
| Base URL | `http://localhost:3001` (configurable via `TEST_PORT`) |
| Browser | Chromium only |
| Timeout | 60s per test |
| Expect timeout | 15s |
| Screenshots | On failure only |
| Trace | On first retry |
| Retries | 0 local, 2 in CI |
| Web server | Auto-starts in CI only |

## Prerequisites

```bash
cd app
npx playwright install chromium    # first time only
npm run dev                        # dev server must be running locally
npx prisma db seed                 # ensure DB has base data
```

## File Organization

```
app/tests/e2e/
├── scenarios/
│   ├── combat/
│   │   ├── basic-damage.spec.ts
│   │   └── capture-during-encounter.spec.ts
│   ├── capture/
│   │   └── wild-capture.spec.ts
│   └── healing/
│       └── rest-healing.spec.ts
└── .gitkeep
```

Naming: `<scenario-id>.spec.ts` matching the artifact scenario ID.

## API Setup / Teardown Pattern

Use Playwright's `request` fixture for data creation — faster and more reliable than UI-based setup.

```typescript
import { test, expect } from '@playwright/test'

test.describe('Combat: Basic Damage', () => {
  let encounterId: number

  test.beforeAll(async ({ request }) => {
    // Create test data via API
    const encounter = await request.post('/api/encounters', {
      data: { name: 'Test Encounter', weather: 'Clear' }
    })
    const body = await encounter.json()
    encounterId = body.data.id

    // Add combatants
    await request.post(`/api/encounters/${encounterId}/combatants`, {
      data: { pokemonId: 1, side: 'enemy' }
    })
  })

  test.afterAll(async ({ request }) => {
    // Clean up
    await request.post(`/api/encounters/${encounterId}/end`)
  })

  test('damage reduces target HP', async ({ page }) => {
    await page.goto(`/gm`)
    // ... test actions
  })
})
```

## Navigation Patterns

### GM View
```typescript
// Encounter page
await page.goto('/gm')

// Character sheet
await page.goto(`/gm/characters/${charId}`)

// Pokemon sheet
await page.goto(`/gm/pokemon/${pokemonId}`)

// Sheets library
await page.goto('/gm/sheets')

// Scene editor
await page.goto(`/gm/scenes/${sceneId}`)
```

### Group View
```typescript
// Group view (auto-switches tabs based on served content)
await page.goto('/group')
```

### Player View
```typescript
await page.goto('/player')
```

## Wait Strategies

### After API-Triggered State Changes
The app uses WebSocket to sync GM actions to Group View. After an API call that broadcasts:

```typescript
// Wait for the API response to complete
await page.waitForResponse(resp =>
  resp.url().includes('/api/encounters') && resp.status() === 200
)
```

### After WebSocket Updates (Group View)
```typescript
// Wait for UI to reflect WebSocket push
await page.waitForSelector('[data-testid="combatant-hp"]')
// Or wait for specific text
await page.waitForFunction(
  () => document.querySelector('.hp-display')?.textContent?.includes('15')
)
```

### After Navigation
```typescript
await page.goto('/gm/sheets')
await page.waitForLoadState('networkidle')
```

### Polling-Based Views
Group View and Player View poll for state. Allow extra time:
```typescript
await expect(page.locator('.encounter-panel')).toBeVisible({ timeout: 10000 })
```

## Screenshot Patterns

```typescript
// On failure (automatic via config)
// Manual capture for evidence:
await page.screenshot({
  path: `tests/e2e/screenshots/${scenarioId}-step-${step}.png`,
  fullPage: true
})
```

## Common Selectors

Until `data-testid` attributes are added broadly, use:

```typescript
// Buttons
page.getByRole('button', { name: 'Start Encounter' })
page.getByRole('button', { name: /attack/i })

// Form inputs
page.getByLabel('Name')
page.getByLabel('Level')
page.getByPlaceholder('Search...')

// Tab navigation
page.getByRole('tab', { name: 'Stats' })
page.getByRole('tab', { name: 'Moves' })

// Cards and lists
page.locator('.combatant-card').filter({ hasText: 'Bulbasaur' })
page.locator('.pokemon-card').first()

// Health displays
page.locator('.hp-bar').filter({ hasText: /\d+\/\d+/ })
```

## Multi-View Testing

Some scenarios require both GM and Group views:

```typescript
test('served encounter appears on group view', async ({ browser }) => {
  const gmContext = await browser.newContext()
  const groupContext = await browser.newContext()

  const gmPage = await gmContext.newPage()
  const groupPage = await groupContext.newPage()

  await gmPage.goto('/gm')
  await groupPage.goto('/group')

  // GM serves encounter
  await gmPage.getByRole('button', { name: 'Serve' }).click()

  // Group view receives it (via WebSocket + poll)
  await expect(groupPage.locator('.encounter-view')).toBeVisible({ timeout: 15000 })

  await gmContext.close()
  await groupContext.close()
})
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Browser not found" | `npx playwright install chromium` |
| Connection refused on 3001 | Start dev server: `cd app && npm run dev` |
| Empty database | Seed: `cd app && npx prisma db seed` |
| Stale data between tests | Use `beforeAll`/`afterAll` for setup/teardown |
| Selector not found | Check if component renders after async load — add `waitForSelector` |
| Timeout on Group View | WebSocket + polling can take up to 10s — increase timeout |
| Flaky test on CI | Add `test.retries(2)` for tests with WebSocket dependencies |
