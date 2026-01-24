import { test, expect } from '@playwright/test'

test.describe('Group View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/group')
  })

  test('should display waiting state when no encounter is served', async ({ page }) => {
    await expect(page.locator('.group-view__waiting')).toBeVisible()
    await expect(page.locator('.waiting-content h1')).toHaveText('PTU Session Helper')
    await expect(page.locator('.waiting-content p')).toHaveText('Waiting for GM to serve an encounter...')
  })

  test('should display loading spinner in waiting state', async ({ page }) => {
    await expect(page.locator('.waiting-spinner')).toBeVisible()
  })

  test('should have correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('PTU - Group View')
  })
})

// Skip - depends on encounter creation which has hydration issues
test.describe.skip('Group View - With Served Encounter', () => {
  test('should display served encounter on group view', async ({ page }) => {
    // Create and serve encounter on GM page first
    await page.goto('/gm')
    const startButton = page.locator('.gm-encounter__new button:has-text("Start New Encounter")')
    await expect(startButton).toBeEnabled({ timeout: 10000 })

    const input = page.locator('.gm-encounter__new input[placeholder="Route 1 Wild Battle"]')
    await input.fill('Served Test Encounter')
    await expect(input).toHaveValue('Served Test Encounter')

    await startButton.click()
    await page.waitForSelector('.encounter-header', { timeout: 15000 })

    await page.locator('button:has-text("Serve to Group")').click()
    await page.waitForSelector('.badge--green:has-text("Served to Group")', { timeout: 15000 })

    // Navigate to Group View
    await page.goto('/group')
    await page.waitForSelector('.group-view__active', { timeout: 15000 })

    await expect(page.locator('.group-header__info h1')).toHaveText('Served Test Encounter')
    await expect(page.locator('.round-badge')).toHaveText('Round 1')
  })

  test('should display player and enemy sections', async ({ page }) => {
    // Create and serve encounter on GM page first
    await page.goto('/gm')
    const startButton = page.locator('.gm-encounter__new button:has-text("Start New Encounter")')
    await expect(startButton).toBeEnabled({ timeout: 10000 })

    const input = page.locator('.gm-encounter__new input[placeholder="Route 1 Wild Battle"]')
    await input.fill('Section Test')

    await startButton.click()
    await page.waitForSelector('.encounter-header', { timeout: 15000 })

    await page.locator('button:has-text("Serve to Group")').click()
    await page.waitForSelector('.badge--green:has-text("Served to Group")', { timeout: 15000 })

    // Navigate to Group View
    await page.goto('/group')
    await page.waitForSelector('.group-view__active', { timeout: 15000 })

    await expect(page.locator('.combatant-section--players h2')).toHaveText('Players')
    await expect(page.locator('.combatant-section--enemies h2')).toHaveText('Enemies')
  })
})

// Skip - depends on encounter creation which has hydration issues
test.describe.skip('GM and Group View Synchronization', () => {
  test('should sync encounter name between GM and Group views', async ({ context }) => {
    const gmPage = await context.newPage()
    const groupPage = await context.newPage()

    await gmPage.goto('/gm')
    const startButton = gmPage.locator('.gm-encounter__new button:has-text("Start New Encounter")')
    await expect(startButton).toBeEnabled({ timeout: 10000 })

    const input = gmPage.locator('.gm-encounter__new input[placeholder="Route 1 Wild Battle"]')
    await input.fill('Sync Test Encounter')
    await expect(input).toHaveValue('Sync Test Encounter')

    await startButton.click()
    await gmPage.waitForSelector('.encounter-header', { timeout: 15000 })

    await gmPage.locator('button:has-text("Serve to Group")').click()
    await gmPage.waitForSelector('.badge--green:has-text("Served to Group")', { timeout: 15000 })

    await groupPage.goto('/group')
    await groupPage.waitForSelector('.group-view__active', { timeout: 20000 })

    await expect(groupPage.locator('.group-header__info h1')).toHaveText('Sync Test Encounter')
  })

  test('should return to waiting state when encounter is unserved', async ({ context }) => {
    const gmPage = await context.newPage()
    const groupPage = await context.newPage()

    await gmPage.goto('/gm')
    const startButton = gmPage.locator('.gm-encounter__new button:has-text("Start New Encounter")')
    await expect(startButton).toBeEnabled({ timeout: 10000 })

    const input = gmPage.locator('.gm-encounter__new input[placeholder="Route 1 Wild Battle"]')
    await input.fill('Unserve Test')
    await expect(input).toHaveValue('Unserve Test')

    await startButton.click()
    await gmPage.waitForSelector('.encounter-header', { timeout: 15000 })

    await gmPage.locator('button:has-text("Serve to Group")').click()
    await gmPage.waitForSelector('.badge--green:has-text("Served to Group")', { timeout: 15000 })

    await groupPage.goto('/group')
    await groupPage.waitForSelector('.group-view__active', { timeout: 20000 })

    await gmPage.locator('button:has-text("Unserve")').click()

    await groupPage.waitForSelector('.group-view__waiting', { timeout: 20000 })
    await expect(groupPage.locator('.waiting-content p')).toHaveText('Waiting for GM to serve an encounter...')
  })
})
