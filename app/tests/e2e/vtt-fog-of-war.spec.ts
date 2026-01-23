import { test, expect } from '@playwright/test'

test.describe('VTT Grid - Fog of War Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm')
    await page.waitForLoadState('networkidle')

    // Start new encounter
    await page.click('button:has-text("Start New Encounter")')
    await page.waitForSelector('.encounter-header', { timeout: 15000 })

    // Switch to Grid view
    await page.click('.view-tab:has-text("Grid View")')
    await page.waitForSelector('.vtt-container', { timeout: 5000 })

    // Enable grid if not already
    const gridOffButton = page.locator('[data-testid="toggle-grid-btn"]', { hasText: 'Grid Off' })
    if (await gridOffButton.isVisible()) {
      await gridOffButton.click()
      await page.waitForSelector('[data-testid="grid-canvas"]', { timeout: 5000 })
    }
  })

  test('should display fog of war toolbar when grid is enabled', async ({ page }) => {
    const toolbar = page.locator('[data-testid="fow-toolbar"]')
    await expect(toolbar).toBeVisible({ timeout: 5000 })
  })

  test('should have toggle fog button', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await expect(toggleBtn).toBeVisible()
    await expect(toggleBtn).toContainText('Fog Off')
  })

  test('should toggle fog of war on click', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')

    // Enable fog
    await toggleBtn.click()
    await expect(toggleBtn).toContainText('Fog On')
    await expect(toggleBtn).toHaveClass(/fow-toggle-btn--active/)

    // Disable fog
    await toggleBtn.click()
    await expect(toggleBtn).toContainText('Fog Off')
    await expect(toggleBtn).not.toHaveClass(/fow-toggle-btn--active/)
  })

  test('should show tool buttons when fog is enabled', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await toggleBtn.click()

    const revealBtn = page.locator('[data-testid="fow-reveal-btn"]')
    const hideBtn = page.locator('[data-testid="fow-hide-btn"]')
    const exploreBtn = page.locator('[data-testid="fow-explore-btn"]')

    await expect(revealBtn).toBeVisible()
    await expect(hideBtn).toBeVisible()
    await expect(exploreBtn).toBeVisible()
  })

  test('should hide tool buttons when fog is disabled', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')

    // Fog should be off by default
    const revealBtn = page.locator('[data-testid="fow-reveal-btn"]')
    await expect(revealBtn).not.toBeVisible()
  })

  test('should toggle reveal tool mode', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await toggleBtn.click()

    const revealBtn = page.locator('[data-testid="fow-reveal-btn"]')
    await expect(revealBtn).toHaveClass(/fow-btn--active/) // Default active

    // Click again should keep it active (it's the default)
    await revealBtn.click()
    await expect(revealBtn).toHaveClass(/fow-btn--active/)
  })

  test('should toggle hide tool mode', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await toggleBtn.click()

    const hideBtn = page.locator('[data-testid="fow-hide-btn"]')
    const revealBtn = page.locator('[data-testid="fow-reveal-btn"]')

    await hideBtn.click()
    await expect(hideBtn).toHaveClass(/fow-btn--active/)
    await expect(revealBtn).not.toHaveClass(/fow-btn--active/)
  })

  test('should toggle explore tool mode', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await toggleBtn.click()

    const exploreBtn = page.locator('[data-testid="fow-explore-btn"]')
    const revealBtn = page.locator('[data-testid="fow-reveal-btn"]')

    await exploreBtn.click()
    await expect(exploreBtn).toHaveClass(/fow-btn--active/)
    await expect(revealBtn).not.toHaveClass(/fow-btn--active/)
  })

  test('should show brush size controls when fog is enabled', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await toggleBtn.click()

    const brushLabel = page.locator('.vtt-fow-toolbar__brush label:has-text("Brush:")')
    await expect(brushLabel).toBeVisible()

    const sizeDisplay = page.locator('.vtt-fow-toolbar__brush .size-display')
    await expect(sizeDisplay).toBeVisible()
    await expect(sizeDisplay).toContainText('1')
  })

  test('should increase brush size', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await toggleBtn.click()

    const increaseBtn = page.locator('.vtt-fow-toolbar__brush .size-btn').last()
    const sizeDisplay = page.locator('.vtt-fow-toolbar__brush .size-display')

    await increaseBtn.click()
    await expect(sizeDisplay).toContainText('2')

    await increaseBtn.click()
    await expect(sizeDisplay).toContainText('3')
  })

  test('should decrease brush size', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await toggleBtn.click()

    const increaseBtn = page.locator('.vtt-fow-toolbar__brush .size-btn').last()
    const decreaseBtn = page.locator('.vtt-fow-toolbar__brush .size-btn').first()
    const sizeDisplay = page.locator('.vtt-fow-toolbar__brush .size-display')

    // Increase first
    await increaseBtn.click()
    await increaseBtn.click()
    await expect(sizeDisplay).toContainText('3')

    // Then decrease
    await decreaseBtn.click()
    await expect(sizeDisplay).toContainText('2')
  })

  test('should have reveal all and hide all buttons', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await toggleBtn.click()

    const revealAllBtn = page.locator('[data-testid="fow-reveal-all-btn"]')
    const hideAllBtn = page.locator('[data-testid="fow-hide-all-btn"]')

    await expect(revealAllBtn).toBeVisible()
    await expect(hideAllBtn).toBeVisible()
  })

  test('should hide fog toolbar when grid is disabled', async ({ page }) => {
    // Grid is enabled, toolbar should be visible
    const toolbar = page.locator('[data-testid="fow-toolbar"]')
    await expect(toolbar).toBeVisible()

    // Disable grid
    const toggleBtn = page.locator('[data-testid="toggle-grid-btn"]')
    await toggleBtn.click()

    // Toolbar should not be visible
    await expect(toolbar).not.toBeVisible()
  })
})

test.describe('VTT Grid - Fog of War Store Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm')
    await page.waitForLoadState('networkidle')

    // Start encounter and go to grid
    await page.click('button:has-text("Start New Encounter")')
    await page.waitForSelector('.encounter-header', { timeout: 15000 })
    await page.click('.view-tab:has-text("Grid View")')
    await page.waitForSelector('.vtt-container', { timeout: 5000 })

    // Enable grid
    const gridOffButton = page.locator('[data-testid="toggle-grid-btn"]', { hasText: 'Grid Off' })
    if (await gridOffButton.isVisible()) {
      await gridOffButton.click()
    }
    await page.waitForSelector('[data-testid="grid-canvas"]', { timeout: 5000 })
  })

  test('should render grid canvas when fog is enabled', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await toggleBtn.click()

    const canvas = page.locator('[data-testid="grid-canvas"]')
    await expect(canvas).toBeVisible()
  })

  test('should switch between tool modes via buttons', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="toggle-fow-btn"]')
    await toggleBtn.click()

    const revealBtn = page.locator('[data-testid="fow-reveal-btn"]')
    const hideBtn = page.locator('[data-testid="fow-hide-btn"]')
    const exploreBtn = page.locator('[data-testid="fow-explore-btn"]')

    // Reveal mode should be default active
    await expect(revealBtn).toHaveClass(/fow-btn--active/)

    // Switch to hide
    await hideBtn.click()
    await expect(hideBtn).toHaveClass(/fow-btn--active/)
    await expect(revealBtn).not.toHaveClass(/fow-btn--active/)

    // Switch to explore
    await exploreBtn.click()
    await expect(exploreBtn).toHaveClass(/fow-btn--active/)
    await expect(hideBtn).not.toHaveClass(/fow-btn--active/)

    // Back to reveal
    await revealBtn.click()
    await expect(revealBtn).toHaveClass(/fow-btn--active/)
    await expect(exploreBtn).not.toHaveClass(/fow-btn--active/)
  })
})
