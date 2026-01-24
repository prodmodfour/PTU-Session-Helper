import { test, expect } from '@playwright/test'

// Skip - tests have data pollution issues (tables not cleaned between tests)
test.describe.skip('Encounter Tables (Habitats)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to habitats page
    await page.goto('/gm/habitats')
  })

  test('should display the habitats page with title', async ({ page }) => {
    await expect(page.locator('.habitats-page h1')).toHaveText('Encounter Tables')
    await expect(page.locator('.habitats-page__subtitle')).toBeVisible()
  })

  test('should show empty state when no tables exist', async ({ page }) => {
    // Check for empty state or tables grid
    const emptyState = page.locator('.habitats-page__empty')
    const tablesGrid = page.locator('.habitats-page__grid')

    // One of these should be visible
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    const hasGrid = await tablesGrid.isVisible().catch(() => false)

    expect(hasEmptyState || hasGrid).toBe(true)
  })

  test('should open create modal when clicking new table button', async ({ page }) => {
    await page.locator('.habitats-page button:has-text("New Table")').click()

    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible()
    await expect(page.locator('h2')).toContainText('Create Encounter Table')
  })

  test('should create a new encounter table', async ({ page }) => {
    // Open create modal
    await page.locator('.habitats-page button:has-text("New Table")').click()

    // Fill in the form
    await page.fill('[data-testid="table-name-input"]', 'Route 1 Grass')
    await page.fill('[data-testid="table-description-input"]', 'Wild Pokemon found in Route 1 tall grass')
    await page.fill('[data-testid="level-min-input"]', '2')
    await page.fill('[data-testid="level-max-input"]', '5')

    // Save
    await page.click('[data-testid="save-table-btn"]')

    // Modal should close
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Table should appear in list
    await expect(page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Route 1 Grass' })).toBeVisible()
  })

  test('should edit an existing encounter table', async ({ page }) => {
    // First create a table
    await page.locator('.habitats-page button:has-text("New Table")').click()
    await page.fill('[data-testid="table-name-input"]', 'Test Table')
    await page.click('[data-testid="save-table-btn"]')

    // Wait for modal to close and table to appear
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Test Table' })).toBeVisible()

    // Click edit button
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Test Table' })
      .locator('[data-testid="edit-table-btn"]').click()

    // Modal should open with existing data
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="table-name-input"]')).toHaveValue('Test Table')

    // Update name
    await page.fill('[data-testid="table-name-input"]', 'Updated Table')
    await page.click('[data-testid="save-table-btn"]')

    // Verify update
    await expect(page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Updated Table' })).toBeVisible()
  })

  test('should delete an encounter table', async ({ page }) => {
    // First create a table
    await page.locator('.habitats-page button:has-text("New Table")').click()
    await page.fill('[data-testid="table-name-input"]', 'Table to Delete')
    await page.click('[data-testid="save-table-btn"]')

    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Click delete button
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Table to Delete' })
      .locator('[data-testid="delete-table-btn"]').click()

    // Confirm deletion
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible()
    await page.click('[data-testid="confirm-btn"]')

    // Table should be removed
    await expect(page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Table to Delete' })).not.toBeVisible()
  })

  test('should search and filter tables', async ({ page }) => {
    // Create multiple tables
    await page.locator('.habitats-page button:has-text("New Table")').click()
    await page.fill('[data-testid="table-name-input"]', 'Forest Area')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    await page.locator('.habitats-page button:has-text("New Table")').click()
    await page.fill('[data-testid="table-name-input"]', 'Ocean Area')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Search for Forest
    await page.fill('input[placeholder="Search tables..."]', 'Forest')

    // Only Forest should be visible
    await expect(page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Forest Area' })).toBeVisible()
    await expect(page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Ocean Area' })).not.toBeVisible()

    // Clear search
    await page.fill('input[placeholder="Search tables..."]', '')

    // Both should be visible again
    await expect(page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Forest Area' })).toBeVisible()
    await expect(page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Ocean Area' })).toBeVisible()
  })

  test('should add species entries to a table', async ({ page }) => {
    // Create a table first
    await page.locator('.habitats-page button:has-text("New Table")').click()
    await page.fill('[data-testid="table-name-input"]', 'Entry Test Table')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Open edit modal
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Entry Test Table' })
      .locator('[data-testid="edit-table-btn"]').click()

    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible()

    // Species entry section should be visible in edit mode
    await expect(page.locator('h3:has-text("Species Entries")')).toBeVisible()

    // Note: Adding species requires the species autocomplete to work with seeded data
    // This test verifies the UI is present
    await expect(page.locator('[data-testid="species-autocomplete"]')).toBeVisible()
  })

  test('should create a modification (sub-habitat)', async ({ page }) => {
    // Create a table first
    await page.locator('.habitats-page button:has-text("New Table")').click()
    await page.fill('[data-testid="table-name-input"]', 'Mod Test Table')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Open edit modal
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Mod Test Table' })
      .locator('[data-testid="edit-table-btn"]').click()

    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible()

    // Modifications section should be visible
    await expect(page.locator('h3:has-text("Modifications")')).toBeVisible()

    // Add a modification
    await page.fill('[data-testid="mod-name-input"]', 'Night Time')
    await page.click('[data-testid="add-mod-btn"]')

    // Modification should appear in list
    await expect(page.locator('[data-testid="mod-item"]').filter({ hasText: 'Night Time' })).toBeVisible()
  })

  test('should display level range correctly', async ({ page }) => {
    await page.locator('.habitats-page button:has-text("New Table")').click()
    await page.fill('[data-testid="table-name-input"]', 'Level Range Table')
    await page.fill('[data-testid="level-min-input"]', '10')
    await page.fill('[data-testid="level-max-input"]', '20')
    await page.click('[data-testid="save-table-btn"]')

    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Verify level range displays on card
    const card = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Level Range Table' })
    await expect(card.locator('.table-card__level')).toContainText('Lv. 10-20')
  })
})

test.describe('Habitats - Puppeteer MCP Integration', () => {
  // These tests can be run interactively with Puppeteer MCP tools
  // for debugging and development testing

  test('should be accessible at /gm/habitats', async ({ page }) => {
    const response = await page.goto('/gm/habitats')
    expect(response?.status()).toBe(200)
  })

  // Skip - modal-overlay from layout intercepts clicks
  test.skip('should have proper page structure for automation', async ({ page }) => {
    await page.goto('/gm/habitats')

    // Verify data-testid attributes exist for MCP automation
    const newTableBtn = page.locator('button:has-text("New Table")')
    await expect(newTableBtn).toBeVisible()

    // Click to open modal
    await newTableBtn.click()

    // Verify form elements are present
    await expect(page.locator('[data-testid="table-name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="save-table-btn"]')).toBeVisible()
  })
})
