import { test, expect } from '@playwright/test'

test.describe('VTT Grid - View Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm')
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Use default encounter name by clicking button directly
    await page.click('button:has-text("Start New Encounter")')
    await page.waitForSelector('.encounter-header', { timeout: 15000 })
  })

  test('should display view tabs (List and Grid)', async ({ page }) => {
    const viewTabs = page.locator('.view-tabs')
    await expect(viewTabs).toBeVisible()

    await expect(page.locator('.view-tab', { hasText: 'List View' })).toBeVisible()
    await expect(page.locator('.view-tab', { hasText: 'Grid View' })).toBeVisible()
  })

  test('should have List view active by default', async ({ page }) => {
    const listTab = page.locator('.view-tab', { hasText: 'List' })
    await expect(listTab).toHaveClass(/view-tab--active/)

    // Should show the combat sides in list view
    await expect(page.locator('.side--players')).toBeVisible()
    await expect(page.locator('.side--allies')).toBeVisible()
    await expect(page.locator('.side--enemies')).toBeVisible()
  })

  test('should switch to Grid view when clicking Grid tab', async ({ page }) => {
    const gridTab = page.locator('.view-tab', { hasText: 'Grid' })
    await gridTab.click()

    await expect(gridTab).toHaveClass(/view-tab--active/)

    // Should show the VTT container
    await expect(page.locator('.vtt-container')).toBeVisible()
  })

  test('should switch back to List view when clicking List tab', async ({ page }) => {
    // First switch to Grid
    await page.click('.view-tab:has-text("Grid View")')
    await expect(page.locator('.vtt-container')).toBeVisible()

    // Then switch back to List
    await page.click('.view-tab:has-text("List View")')
    await expect(page.locator('.side--players')).toBeVisible()
  })
})

test.describe('VTT Grid - Container', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm')
    await page.waitForLoadState('networkidle')
    await page.click('button:has-text("Start New Encounter")')
    await page.waitForSelector('.encounter-header', { timeout: 15000 })
    await page.click('.view-tab:has-text("Grid View")')
    await page.waitForSelector('.vtt-container', { timeout: 5000 })
  })

  test('should display VTT container header', async ({ page }) => {
    const header = page.locator('.vtt-header')
    await expect(header).toBeVisible()
    await expect(header.locator('h3')).toHaveText('Battle Grid')
  })

  test('should display toggle grid button', async ({ page }) => {
    const toggleButton = page.locator('.vtt-header button', { hasText: /Grid (On|Off)/ })
    await expect(toggleButton).toBeVisible()
  })

  test('should display settings button', async ({ page }) => {
    const settingsButton = page.locator('.vtt-header button', { hasText: /Settings/ })
    await expect(settingsButton).toBeVisible()
  })

  test('should toggle settings panel when clicking Settings button', async ({ page }) => {
    const settingsButton = page.locator('.vtt-header button', { hasText: /Settings/ })
    await settingsButton.click()

    // Settings panel should appear
    const settingsPanel = page.locator('.vtt-settings')
    await expect(settingsPanel).toBeVisible()

    // Click again to hide
    await settingsButton.click()
    await expect(settingsPanel).not.toBeVisible()
  })
})

test.describe('VTT Grid - Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm')
    await page.waitForLoadState('networkidle')
    await page.click('button:has-text("Start New Encounter")')
    await page.waitForSelector('.encounter-header', { timeout: 15000 })
    await page.click('.view-tab:has-text("Grid View")')
    await page.waitForSelector('.vtt-container', { timeout: 5000 })
    await page.click('.vtt-header button:has-text("Settings")')
    await page.waitForSelector('.vtt-settings', { timeout: 5000 })
  })

  test('should display width input', async ({ page }) => {
    const widthLabel = page.locator('.vtt-settings label', { hasText: 'Width' })
    await expect(widthLabel).toBeVisible()

    const widthInput = page.locator('.vtt-settings input[type="number"]').first()
    await expect(widthInput).toBeVisible()
  })

  test('should display height input', async ({ page }) => {
    const heightLabel = page.locator('.vtt-settings label', { hasText: 'Height' })
    await expect(heightLabel).toBeVisible()
  })

  test('should display cell size input', async ({ page }) => {
    const cellSizeLabel = page.locator('.vtt-settings label', { hasText: 'Cell Size' })
    await expect(cellSizeLabel).toBeVisible()
  })

  test('should display background upload button', async ({ page }) => {
    const bgLabel = page.locator('.vtt-settings label', { hasText: 'Background' })
    await expect(bgLabel).toBeVisible()

    // File input is hidden, but upload button should be visible
    const uploadBtn = page.locator('[data-testid="upload-bg-btn"]')
    await expect(uploadBtn).toBeVisible()
    await expect(uploadBtn).toHaveText('Upload Image')
  })

  test('should display Apply and Reset buttons', async ({ page }) => {
    const applyButton = page.locator('.vtt-settings button', { hasText: 'Apply' })
    const resetButton = page.locator('.vtt-settings button', { hasText: 'Reset' })

    await expect(applyButton).toBeVisible()
    await expect(resetButton).toBeVisible()
  })
})

test.describe('VTT Grid - Canvas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm')
    await page.waitForLoadState('networkidle')
    await page.click('button:has-text("Start New Encounter")')
    await page.waitForSelector('.encounter-header', { timeout: 15000 })
    await page.click('.view-tab:has-text("Grid View")')
    await page.waitForSelector('.vtt-container', { timeout: 5000 })
  })

  test('should display grid canvas when grid is enabled', async ({ page }) => {
    // Enable grid if not already
    const toggleButton = page.locator('.vtt-header button', { hasText: /Grid Off/ })
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
    }

    const canvas = page.locator('[data-testid="grid-canvas"]')
    await expect(canvas).toBeVisible({ timeout: 5000 })
  })

  test('should display zoom controls', async ({ page }) => {
    const toggleButton = page.locator('.vtt-header button', { hasText: /Grid Off/ })
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
    }

    const zoomControls = page.locator('.zoom-controls')
    await expect(zoomControls).toBeVisible({ timeout: 5000 })
  })

  test('should display zoom in and zoom out buttons', async ({ page }) => {
    const toggleButton = page.locator('.vtt-header button', { hasText: /Grid Off/ })
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
    }

    const zoomIn = page.locator('.zoom-controls button', { hasText: '+' })
    const zoomOut = page.locator('.zoom-controls button', { hasText: '-' })
    // Reset button uses ⌂ symbol
    const resetZoom = page.locator('.zoom-controls button', { hasText: '⌂' })

    await expect(zoomIn).toBeVisible({ timeout: 5000 })
    await expect(zoomOut).toBeVisible({ timeout: 5000 })
    await expect(resetZoom).toBeVisible()
  })

  test('should display coordinate tooltip when hovering over grid', async ({ page }) => {
    const toggleButton = page.locator('.vtt-header button', { hasText: /Grid Off/ })
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
    }

    // Wait for canvas to be visible
    const canvas = page.locator('[data-testid="grid-canvas"]')
    await expect(canvas).toBeVisible({ timeout: 5000 })

    // Hover over the canvas to trigger coordinate display
    await canvas.hover()

    // CSS class is coordinate-display and only shows when hovering
    const coordDisplay = page.locator('.coordinate-display')
    await expect(coordDisplay).toBeVisible({ timeout: 5000 })
  })

  test('should show disabled message when grid is disabled', async ({ page }) => {
    // Make sure grid is disabled
    const toggleButton = page.locator('.vtt-header button', { hasText: /Disable Grid/ })
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
    }

    const disabledMessage = page.locator('.vtt-disabled')
    await expect(disabledMessage).toBeVisible({ timeout: 5000 })
    await expect(disabledMessage).toContainText('Grid is disabled')
  })
})

test.describe('VTT Grid - Grid Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm')
    await page.waitForLoadState('networkidle')
    await page.click('button:has-text("Start New Encounter")')
    await page.waitForSelector('.encounter-header', { timeout: 15000 })
    await page.click('.view-tab:has-text("Grid View")')
    await page.waitForSelector('.vtt-container', { timeout: 5000 })
  })

  test('should toggle grid on and off', async ({ page }) => {
    // Button text is "🗺 Grid Off" when disabled, "🗺 Grid On" when enabled
    const gridOffButton = page.locator('[data-testid="toggle-grid-btn"]', { hasText: 'Grid Off' })
    const gridOnButton = page.locator('[data-testid="toggle-grid-btn"]', { hasText: 'Grid On' })

    // Grid should start disabled (Grid Off button visible)
    await expect(gridOffButton).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.vtt-disabled')).toBeVisible()

    // Enable the grid
    await gridOffButton.click()
    await expect(gridOnButton).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="grid-canvas"]')).toBeVisible({ timeout: 5000 })

    // Disable the grid again
    await gridOnButton.click()
    await expect(gridOffButton).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.vtt-disabled')).toBeVisible({ timeout: 5000 })
  })
})
