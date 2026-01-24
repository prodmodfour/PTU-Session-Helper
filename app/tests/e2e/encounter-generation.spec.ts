import { test, expect } from '@playwright/test'

// Skip - tests have data pollution issues (tables not cleaned between tests)
test.describe.skip('Wild Encounter Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm/habitats')
    // Wait for page to fully load
    await expect(page.locator('.habitats-page')).toBeVisible({ timeout: 10000 })
  })

  test('should open generate modal when clicking Generate button', async ({ page }) => {
    // First create a table
    await page.click('button:has-text("New Table")')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible({ timeout: 5000 })

    await page.fill('[data-testid="table-name-input"]', 'Gen Test Table')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible({ timeout: 5000 })

    // Wait for table card to appear
    const tableCard = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Gen Test Table' })
    await expect(tableCard).toBeVisible({ timeout: 5000 })

    // Click generate button on the card
    await tableCard.locator('[data-testid="generate-btn"]').click()

    // Generate modal should appear
    await expect(page.locator('[data-testid="generate-modal"]')).toBeVisible({ timeout: 5000 })
  })

  test('should display table info in generate modal', async ({ page }) => {
    // Create a table with specific settings
    await page.click('button:has-text("New Table")')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible({ timeout: 5000 })

    await page.fill('[data-testid="table-name-input"]', 'Route 1')
    await page.fill('[data-testid="table-description-input"]', 'Test description')
    await page.fill('[data-testid="level-min-input"]', '3')
    await page.fill('[data-testid="level-max-input"]', '7')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible({ timeout: 5000 })

    // Open generate modal
    const tableCard = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Route 1' })
    await expect(tableCard).toBeVisible({ timeout: 5000 })
    await tableCard.locator('[data-testid="generate-btn"]').click()

    // Verify table info is displayed
    const modal = page.locator('[data-testid="generate-modal"]')
    await expect(modal).toBeVisible({ timeout: 5000 })
    await expect(modal.locator('h3')).toHaveText('Route 1')
  })

  test('should allow setting generation count', async ({ page }) => {
    // Create a table
    await page.click('button:has-text("New Table")')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible({ timeout: 5000 })

    await page.fill('[data-testid="table-name-input"]', 'Count Test')
    await page.fill('[data-testid="level-min-input"]', '5')
    await page.fill('[data-testid="level-max-input"]', '10')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible({ timeout: 5000 })

    // Open generate modal
    const tableCard = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Count Test' })
    await expect(tableCard).toBeVisible({ timeout: 5000 })
    await tableCard.locator('[data-testid="generate-btn"]').click()

    // Wait for modal
    await expect(page.locator('[data-testid="generate-modal"]')).toBeVisible({ timeout: 5000 })

    // Set count to 5
    await page.fill('[data-testid="gen-count-input"]', '5')
    await expect(page.locator('[data-testid="gen-count-input"]')).toHaveValue('5')
  })

  test('should allow selecting a modification', async ({ page }) => {
    // Create table
    await page.click('button:has-text("New Table")')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible({ timeout: 5000 })

    await page.fill('[data-testid="table-name-input"]', 'Mod Select Test')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible({ timeout: 5000 })

    // Wait for card to appear
    const tableCard = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Mod Select Test' })
    await expect(tableCard).toBeVisible({ timeout: 5000 })

    // Edit table to add a modification
    await tableCard.locator('[data-testid="edit-table-btn"]').click()
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible({ timeout: 5000 })

    await page.fill('[data-testid="mod-name-input"]', 'Night Time')
    await page.click('[data-testid="add-mod-btn"]')
    await expect(page.locator('[data-testid="mod-item"]')).toBeVisible({ timeout: 5000 })

    // Close edit modal
    await page.click('button:has-text("Cancel")')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible({ timeout: 5000 })

    // Open generate modal
    await tableCard.locator('[data-testid="generate-btn"]').click()
    await expect(page.locator('[data-testid="generate-modal"]')).toBeVisible({ timeout: 5000 })

    // Modification select should be visible when modifications exist
    const modSelect = page.locator('[data-testid="gen-modification-select"]')
    await expect(modSelect).toBeVisible()
  })

  test('should allow overriding level range', async ({ page }) => {
    // Create a table
    await page.click('button:has-text("New Table")')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible({ timeout: 5000 })

    await page.fill('[data-testid="table-name-input"]', 'Level Override Test')
    await page.fill('[data-testid="level-min-input"]', '5')
    await page.fill('[data-testid="level-max-input"]', '10')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible({ timeout: 5000 })

    // Open generate modal
    const tableCard = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Level Override Test' })
    await expect(tableCard).toBeVisible({ timeout: 5000 })
    await tableCard.locator('[data-testid="generate-btn"]').click()
    await expect(page.locator('[data-testid="generate-modal"]')).toBeVisible({ timeout: 5000 })

    // Check the override checkbox
    await page.click('label:has-text("Override Level Range")')

    // Override inputs should appear
    await expect(page.locator('[data-testid="override-min-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="override-max-input"]')).toBeVisible()

    // Set custom levels
    await page.fill('[data-testid="override-min-input"]', '15')
    await page.fill('[data-testid="override-max-input"]', '20')

    await expect(page.locator('[data-testid="override-min-input"]')).toHaveValue('15')
    await expect(page.locator('[data-testid="override-max-input"]')).toHaveValue('20')
  })

  test('should close modal when clicking Cancel', async ({ page }) => {
    // Create a table
    await page.click('button:has-text("New Table")')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible({ timeout: 5000 })

    await page.fill('[data-testid="table-name-input"]', 'Cancel Test')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible({ timeout: 5000 })

    // Open generate modal
    const tableCard = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Cancel Test' })
    await expect(tableCard).toBeVisible({ timeout: 5000 })
    await tableCard.locator('[data-testid="generate-btn"]').click()

    await expect(page.locator('[data-testid="generate-modal"]')).toBeVisible({ timeout: 5000 })

    // Click cancel
    await page.click('[data-testid="generate-modal"] button:has-text("Cancel")')

    // Modal should close
    await expect(page.locator('[data-testid="generate-modal"]')).not.toBeVisible()
  })

  test('generate button should be visible in modal', async ({ page }) => {
    // Create a table
    await page.click('button:has-text("New Table")')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible({ timeout: 5000 })

    await page.fill('[data-testid="table-name-input"]', 'Empty Table Test')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible({ timeout: 5000 })

    // Open generate modal
    const tableCard = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Empty Table Test' })
    await expect(tableCard).toBeVisible({ timeout: 5000 })
    await tableCard.locator('[data-testid="generate-btn"]').click()

    // Generate button should be visible
    const generateBtn = page.locator('[data-testid="generate-modal"] [data-testid="generate-btn"]')
    await expect(generateBtn).toBeVisible()
  })
})

test.describe('Encounter Generation - With Seeded Data', () => {
  // These tests require seeded species data in the database

  test.skip('should generate Pokemon from table entries', async ({ page }) => {
    // This test would require:
    // 1. Seeded SpeciesData in database
    // 2. A table with actual entries
    // Skip for now - implement when seed data is available
  })

  test.skip('should show generated Pokemon in results section', async ({ page }) => {
    // Similar to above - requires seeded data
  })

  test.skip('should add generated Pokemon to encounter', async ({ page }) => {
    // Tests the addToEncounter flow
    // Requires integration with encounter store
  })
})

test.describe('Generation API Endpoint', () => {
  // API-level tests can be done via page.request

  test('should return error for non-existent table', async ({ page }) => {
    const response = await page.request.post('/api/encounter-tables/non-existent-id/generate', {
      data: { count: 1 }
    })

    expect(response.status()).toBe(404)
  })

  test('should validate count parameter', async ({ page }) => {
    // First need a valid table ID - this would need seeding
    // Skip for now
  })
})

// Skip - tests have data pollution issues
test.describe.skip('Add to Encounter Integration', () => {
  test('should show "No Active Encounter" button state', async ({ page }) => {
    await page.goto('/gm/habitats')
    await expect(page.locator('.habitats-page')).toBeVisible({ timeout: 10000 })

    // Create a table
    await page.click('button:has-text("New Table")')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible({ timeout: 5000 })

    await page.fill('[data-testid="table-name-input"]', 'Encounter Integration Test')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible({ timeout: 5000 })

    // Open generate modal
    const tableCard = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Encounter Integration Test' })
    await expect(tableCard).toBeVisible({ timeout: 5000 })
    await tableCard.locator('[data-testid="generate-btn"]').click()

    // The modal should open
    await expect(page.locator('[data-testid="generate-modal"]')).toBeVisible({ timeout: 5000 })
  })

  test.skip('should add generated Pokemon to active encounter', async ({ page }) => {
    // This test requires:
    // 1. An active encounter created
    // 2. Seeded species data
    // 3. A table with entries
    // Full integration test to be enabled when seed data is available
  })
})

test.describe('Wild Spawn API Endpoint', () => {
  test('should return error for non-existent encounter', async ({ page }) => {
    const response = await page.request.post('/api/encounters/non-existent-id/wild-spawn', {
      data: {
        pokemon: [{ speciesName: 'Pikachu', level: 5 }],
        side: 'enemies'
      }
    })

    expect(response.status()).toBe(404)
  })
})
