import { test, expect } from '@playwright/test'

test.describe('VTT Grid - Measurement Tools', () => {
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

  test('should display measurement toolbar when grid is enabled', async ({ page }) => {
    const toolbar = page.locator('[data-testid="measurement-toolbar"]')
    await expect(toolbar).toBeVisible({ timeout: 5000 })
  })

  test('should have all measurement mode buttons', async ({ page }) => {
    const distanceBtn = page.locator('[data-testid="measure-distance-btn"]')
    const burstBtn = page.locator('[data-testid="measure-burst-btn"]')
    const coneBtn = page.locator('[data-testid="measure-cone-btn"]')
    const lineBtn = page.locator('[data-testid="measure-line-btn"]')
    const closeBlastBtn = page.locator('[data-testid="measure-close-blast-btn"]')

    await expect(distanceBtn).toBeVisible()
    await expect(burstBtn).toBeVisible()
    await expect(coneBtn).toBeVisible()
    await expect(lineBtn).toBeVisible()
    await expect(closeBlastBtn).toBeVisible()
  })

  test('should toggle distance measurement mode on click', async ({ page }) => {
    const distanceBtn = page.locator('[data-testid="measure-distance-btn"]')

    // Click to activate
    await distanceBtn.click()
    await expect(distanceBtn).toHaveClass(/measurement-btn--active/)

    // Click again to deactivate
    await distanceBtn.click()
    await expect(distanceBtn).not.toHaveClass(/measurement-btn--active/)
  })

  test('should toggle burst measurement mode on click', async ({ page }) => {
    const burstBtn = page.locator('[data-testid="measure-burst-btn"]')

    // Click to activate
    await burstBtn.click()
    await expect(burstBtn).toHaveClass(/measurement-btn--active/)

    // Click again to deactivate
    await burstBtn.click()
    await expect(burstBtn).not.toHaveClass(/measurement-btn--active/)
  })

  test('should show size controls when burst mode is active', async ({ page }) => {
    const burstBtn = page.locator('[data-testid="measure-burst-btn"]')
    await burstBtn.click()

    // Size controls should appear
    const sizeLabel = page.locator('.vtt-measurement-toolbar__options label:has-text("Size:")')
    await expect(sizeLabel).toBeVisible()

    const sizeDisplay = page.locator('.size-display')
    await expect(sizeDisplay).toBeVisible()
  })

  test('should show direction controls when cone mode is active', async ({ page }) => {
    const coneBtn = page.locator('[data-testid="measure-cone-btn"]')
    await coneBtn.click()

    // Direction controls should appear
    const dirLabel = page.locator('.vtt-measurement-toolbar__options label:has-text("Dir:")')
    await expect(dirLabel).toBeVisible()

    const dirBtn = page.locator('.dir-btn')
    await expect(dirBtn).toBeVisible()
  })

  test('should cycle through directions when clicking direction button', async ({ page }) => {
    const coneBtn = page.locator('[data-testid="measure-cone-btn"]')
    await coneBtn.click()

    const dirBtn = page.locator('.dir-btn')
    const initialArrow = await dirBtn.textContent()

    // Click to cycle
    await dirBtn.click()
    const newArrow = await dirBtn.textContent()

    // Arrow should change
    expect(newArrow).not.toBe(initialArrow)
  })

  test('should clear measurement mode when clicking clear button', async ({ page }) => {
    const distanceBtn = page.locator('[data-testid="measure-distance-btn"]')
    await distanceBtn.click()
    await expect(distanceBtn).toHaveClass(/measurement-btn--active/)

    // Click clear button
    const clearBtn = page.locator('.measurement-btn--clear')
    await clearBtn.click()

    // Distance button should no longer be active
    await expect(distanceBtn).not.toHaveClass(/measurement-btn--active/)
  })

  test('should switch between measurement modes', async ({ page }) => {
    const distanceBtn = page.locator('[data-testid="measure-distance-btn"]')
    const burstBtn = page.locator('[data-testid="measure-burst-btn"]')

    // Activate distance
    await distanceBtn.click()
    await expect(distanceBtn).toHaveClass(/measurement-btn--active/)
    await expect(burstBtn).not.toHaveClass(/measurement-btn--active/)

    // Switch to burst
    await burstBtn.click()
    await expect(burstBtn).toHaveClass(/measurement-btn--active/)
    await expect(distanceBtn).not.toHaveClass(/measurement-btn--active/)
  })

  test('should hide measurement toolbar when grid is disabled', async ({ page }) => {
    // Grid is enabled, toolbar should be visible
    const toolbar = page.locator('[data-testid="measurement-toolbar"]')
    await expect(toolbar).toBeVisible()

    // Disable grid
    const toggleBtn = page.locator('[data-testid="toggle-grid-btn"]')
    await toggleBtn.click()

    // Toolbar should not be visible
    await expect(toolbar).not.toBeVisible()
  })
})

test.describe('VTT Grid - Measurement Keyboard Shortcuts', () => {
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

  test('should activate distance mode with M key', async ({ page }) => {
    const canvas = page.locator('[data-testid="grid-canvas"]')
    await canvas.focus()

    await page.keyboard.press('m')

    const distanceBtn = page.locator('[data-testid="measure-distance-btn"]')
    await expect(distanceBtn).toHaveClass(/measurement-btn--active/)
  })

  test('should activate burst mode with B key', async ({ page }) => {
    const canvas = page.locator('[data-testid="grid-canvas"]')
    await canvas.focus()

    await page.keyboard.press('b')

    const burstBtn = page.locator('[data-testid="measure-burst-btn"]')
    await expect(burstBtn).toHaveClass(/measurement-btn--active/)
  })

  test('should activate cone mode with C key', async ({ page }) => {
    const canvas = page.locator('[data-testid="grid-canvas"]')
    await canvas.focus()

    await page.keyboard.press('c')

    const coneBtn = page.locator('[data-testid="measure-cone-btn"]')
    await expect(coneBtn).toHaveClass(/measurement-btn--active/)
  })

  test('should clear measurement with Escape key', async ({ page }) => {
    const canvas = page.locator('[data-testid="grid-canvas"]')
    await canvas.focus()

    // Activate distance mode
    await page.keyboard.press('m')
    const distanceBtn = page.locator('[data-testid="measure-distance-btn"]')
    await expect(distanceBtn).toHaveClass(/measurement-btn--active/)

    // Press Escape to clear
    await page.keyboard.press('Escape')
    await expect(distanceBtn).not.toHaveClass(/measurement-btn--active/)
  })

  test('should cycle direction with R key when in cone mode', async ({ page }) => {
    const canvas = page.locator('[data-testid="grid-canvas"]')
    await canvas.focus()

    // Activate cone mode
    await page.keyboard.press('c')

    const dirBtn = page.locator('.dir-btn')
    const initialArrow = await dirBtn.textContent()

    // Press R to cycle direction
    await page.keyboard.press('r')

    const newArrow = await dirBtn.textContent()
    expect(newArrow).not.toBe(initialArrow)
  })
})

test.describe('VTT Grid - Coordinate Display with Measurement', () => {
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

  test('should show coordinate display on hover', async ({ page }) => {
    const canvas = page.locator('[data-testid="grid-canvas"]')
    await canvas.hover()

    const coordDisplay = page.locator('.coordinate-display')
    await expect(coordDisplay).toBeVisible({ timeout: 5000 })
  })

  test('should show mode in coordinate display when measurement is active', async ({ page }) => {
    const canvas = page.locator('[data-testid="grid-canvas"]')
    await canvas.hover()

    // Activate distance mode
    const distanceBtn = page.locator('[data-testid="measure-distance-btn"]')
    await distanceBtn.click()

    // Coordinate display should show mode
    const modeDisplay = page.locator('.coordinate-display__mode')
    await expect(modeDisplay).toBeVisible()
    await expect(modeDisplay).toContainText('distance')
  })
})
