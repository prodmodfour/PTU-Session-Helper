import { test, expect } from '@playwright/test'

test.describe('GM View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm')
  })

  test('should display empty encounter state initially', async ({ page }) => {
    await expect(page.locator('.gm-encounter__empty h2')).toHaveText('No Active Encounter')
    await expect(page.locator('.gm-encounter__empty p')).toHaveText('Start a new encounter or load an existing one.')
  })

  test('should show encounter creation form', async ({ page }) => {
    const encounterForm = page.locator('.gm-encounter__new')
    await expect(encounterForm).toBeVisible()

    await expect(page.locator('label', { hasText: 'Encounter Name' })).toBeVisible()
    await expect(page.locator('input[placeholder="Route 1 Wild Battle"]')).toBeVisible()

    await expect(page.locator('label', { hasText: 'Battle Type' })).toBeVisible()
    await expect(page.locator('select.form-select')).toBeVisible()

    const createButton = page.locator('button', { hasText: 'Start New Encounter' })
    await expect(createButton).toBeVisible()
  })

  test('should have battle type options', async ({ page }) => {
    const select = page.locator('select.form-select')
    const options = select.locator('option')

    await expect(options).toHaveCount(2)
    await expect(options.nth(0)).toHaveText('Trainer Battle')
    await expect(options.nth(1)).toHaveText('Full Contact')
  })

  test('should create a new encounter', async ({ page }) => {
    const encounterName = 'Test Wild Battle'

    const input = page.locator('input[placeholder="Route 1 Wild Battle"]')
    await input.click()
    await input.fill('')
    await input.pressSequentially(encounterName, { delay: 10 })
    await expect(input).toHaveValue(encounterName)

    await page.selectOption('select.form-select', 'trainer')
    await page.click('button:has-text("Start New Encounter")')

    // Wait for encounter header to appear (indicates successful creation)
    await expect(page.locator('.encounter-header')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.encounter-header__info h2')).toHaveText(encounterName)
    await expect(page.locator('.badge', { hasText: 'Trainer Battle' })).toBeVisible()
    await expect(page.locator('.badge', { hasText: 'Round 1' })).toBeVisible()
  })

  test('should create a full contact encounter', async ({ page }) => {
    const input = page.locator('input[placeholder="Route 1 Wild Battle"]')
    await input.click()
    await input.fill('')
    await input.pressSequentially('Full Contact Test', { delay: 10 })
    await expect(input).toHaveValue('Full Contact Test')

    await page.selectOption('select.form-select', 'full_contact')
    await page.click('button:has-text("Start New Encounter")')

    await expect(page.locator('.badge', { hasText: 'Full Contact' })).toBeVisible({ timeout: 15000 })
  })

  test('should use default name if none provided', async ({ page }) => {
    await page.click('button:has-text("Start New Encounter")')

    await expect(page.locator('.encounter-header__info h2')).toHaveText('New Encounter', { timeout: 15000 })
  })
})

test.describe('GM View - Active Encounter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm')
    await page.fill('input[placeholder="Route 1 Wild Battle"]', 'E2E Test Encounter')
    await page.click('button:has-text("Start New Encounter")')
    await page.waitForSelector('.encounter-header', { timeout: 15000 })
  })

  test('should display three combat sides', async ({ page }) => {
    await expect(page.locator('.side--players h3')).toHaveText('Players')
    await expect(page.locator('.side--allies h3')).toHaveText('Allies')
    await expect(page.locator('.side--enemies h3')).toHaveText('Enemies')
  })

  test('should display add buttons for each side', async ({ page }) => {
    const addButtons = page.locator('.side__header button', { hasText: '+ Add' })
    await expect(addButtons).toHaveCount(3)
  })

  test('should display empty state messages for each side', async ({ page }) => {
    await expect(page.locator('.side--players .side__empty')).toHaveText('No players added')
    await expect(page.locator('.side--allies .side__empty')).toHaveText('No allies')
    await expect(page.locator('.side--enemies .side__empty')).toHaveText('No enemies')
  })

  test('should display combat log panel', async ({ page }) => {
    await expect(page.locator('.move-log-panel h3')).toHaveText('Combat Log')
    await expect(page.locator('.move-log__empty')).toHaveText('No actions yet')
  })

  test('should have serve to group button', async ({ page }) => {
    const serveButton = page.locator('button', { hasText: 'Serve to Group' })
    await expect(serveButton).toBeVisible()
  })

  test('should have undo/redo buttons', async ({ page }) => {
    const undoButton = page.locator('button', { hasText: 'Undo' })
    const redoButton = page.locator('button', { hasText: 'Redo' })

    await expect(undoButton).toBeVisible()
    await expect(redoButton).toBeVisible()
    await expect(undoButton).toBeDisabled()
    await expect(redoButton).toBeDisabled()
  })

  test('should have start combat button disabled when no combatants', async ({ page }) => {
    const startButton = page.locator('button', { hasText: 'Start Combat' })
    await expect(startButton).toBeVisible()
    await expect(startButton).toBeDisabled()
  })

  test('should have end encounter button', async ({ page }) => {
    const endButton = page.locator('button', { hasText: 'End Encounter' })
    await expect(endButton).toBeVisible()
  })

  test('should open add combatant modal when clicking add button', async ({ page }) => {
    await page.click('.side--players .side__header button:has-text("+ Add")')

    const modal = page.locator('.modal, [class*="add-combatant"]')
    await expect(modal).toBeVisible({ timeout: 5000 })
  })
})
