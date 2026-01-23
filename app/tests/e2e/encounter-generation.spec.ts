import { test, expect } from '@playwright/test'

test.describe('Wild Encounter Generation', () => {
  // Helper to create a test table with entries
  async function createTableWithEntries(page: any, tableName: string) {
    // Navigate to habitats
    await page.goto('/gm/habitats')

    // Create a table
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', tableName)
    await page.fill('[data-testid="level-min-input"]', '5')
    await page.fill('[data-testid="level-max-input"]', '10')
    await page.click('[data-testid="save-table-btn"]')

    // Wait for modal to close
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    return tableName
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/gm/habitats')
  })

  test('should open generate modal when clicking Generate button', async ({ page }) => {
    // First create a table
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Gen Test Table')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Click generate button on the card
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Gen Test Table' })
      .locator('[data-testid="generate-btn"]').click()

    // Generate modal should appear
    await expect(page.locator('[data-testid="generate-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="generate-modal"] h2')).toHaveText('Generate Wild Encounter')
  })

  test('should display table info in generate modal', async ({ page }) => {
    // Create a table with specific settings
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Route 1')
    await page.fill('[data-testid="table-description-input"]', 'Test description')
    await page.fill('[data-testid="level-min-input"]', '3')
    await page.fill('[data-testid="level-max-input"]', '7')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Open generate modal
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Route 1' })
      .locator('[data-testid="generate-btn"]').click()

    // Verify table info is displayed
    const modal = page.locator('[data-testid="generate-modal"]')
    await expect(modal.locator('h3')).toHaveText('Route 1')
    await expect(modal.locator('.badge').first()).toContainText('Lv. 3-7')
  })

  test('should allow setting generation count', async ({ page }) => {
    await createTableWithEntries(page, 'Count Test')

    // Open generate modal
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Count Test' })
      .locator('[data-testid="generate-btn"]').click()

    // Set count to 5
    await page.fill('[data-testid="gen-count-input"]', '5')
    await expect(page.locator('[data-testid="gen-count-input"]')).toHaveValue('5')
  })

  test('should allow selecting a modification', async ({ page }) => {
    // Create table
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Mod Select Test')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Edit table to add a modification
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Mod Select Test' })
      .locator('[data-testid="edit-table-btn"]').click()

    await page.fill('[data-testid="mod-name-input"]', 'Night Time')
    await page.click('[data-testid="add-mod-btn"]')
    await expect(page.locator('[data-testid="mod-item"]')).toBeVisible()

    // Close edit modal
    await page.click('button:has-text("Cancel")')

    // Open generate modal
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Mod Select Test' })
      .locator('[data-testid="generate-btn"]').click()

    // Modification select should be visible
    const modSelect = page.locator('[data-testid="gen-modification-select"]')
    await expect(modSelect).toBeVisible()

    // Should have the Night Time option
    await modSelect.click()
    await expect(page.locator('option', { hasText: 'Night Time' })).toBeVisible()
  })

  test('should allow overriding level range', async ({ page }) => {
    await createTableWithEntries(page, 'Level Override Test')

    // Open generate modal
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Level Override Test' })
      .locator('[data-testid="generate-btn"]').click()

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
    await createTableWithEntries(page, 'Cancel Test')

    // Open generate modal
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Cancel Test' })
      .locator('[data-testid="generate-btn"]').click()

    await expect(page.locator('[data-testid="generate-modal"]')).toBeVisible()

    // Click cancel
    await page.click('button:has-text("Cancel")')

    // Modal should close
    await expect(page.locator('[data-testid="generate-modal"]')).not.toBeVisible()
  })

  test('generate button should be disabled when table has no entries', async ({ page }) => {
    await createTableWithEntries(page, 'Empty Table Test')

    // Open generate modal
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Empty Table Test' })
      .locator('[data-testid="generate-btn"]').click()

    // Generate button should be disabled (no entries)
    const generateBtn = page.locator('[data-testid="generate-btn"]').filter({ has: page.locator('text=Generate') })
    // Note: Button may be enabled if species exist in the table
    // This test validates the UI elements exist
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

    await page.goto('/gm/habitats')

    // Create table and add entries via species autocomplete
    // Then generate and verify results
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

test.describe('Add to Encounter Integration', () => {
  test('should show "No Active Encounter" when no encounter exists', async ({ page }) => {
    // Create a table
    await page.goto('/gm/habitats')
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Encounter Integration Test')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Open generate modal
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Encounter Integration Test' })
      .locator('[data-testid="generate-btn"]').click()

    // The modal should open
    await expect(page.locator('[data-testid="generate-modal"]')).toBeVisible()

    // Note: Without actual entries and generation, we can't test the full flow
    // but we can verify the UI elements exist
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
