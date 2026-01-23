import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Encounter Tables Editor (2.T5)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to encounter tables page
    await page.goto('/gm/encounter-tables')
    // Wait for page to load
    await expect(page.locator('h1')).toHaveText('Encounter Tables')
  })

  test('should create encounter table and add entries', async ({ page }) => {
    // Step 1: Create a new table
    await page.click('button:has-text("New Table")')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).toBeVisible()

    await page.fill('[data-testid="table-name-input"]', 'E2E Test Forest')
    await page.fill('[data-testid="table-description-input"]', 'Test forest area for E2E testing')
    await page.fill('[data-testid="level-min-input"]', '5')
    await page.fill('[data-testid="level-max-input"]', '15')

    await page.click('[data-testid="save-table-btn"]')

    // Verify table was created
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()
    const tableCard = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'E2E Test Forest' })
    await expect(tableCard).toBeVisible()

    // Step 2: Click on the table to open editor
    await tableCard.click()

    // Should navigate to editor page
    await expect(page).toHaveURL(/\/gm\/encounter-tables\/[a-z0-9-]+/)
    await expect(page.locator('h1')).toContainText('E2E Test Forest')

    // Step 3: Add an entry using species autocomplete
    const speciesInput = page.locator('[data-testid="species-autocomplete"] input')
    await expect(speciesInput).toBeVisible()

    // Type species name
    await speciesInput.fill('Bulba')
    await speciesInput.press('Tab')

    // Wait for autocomplete suggestions
    const suggestions = page.locator('[data-testid="species-suggestion"]')
    await expect(suggestions.first()).toBeVisible({ timeout: 5000 })

    // Click first suggestion (Bulbasaur)
    await suggestions.first().click()

    // Verify entry was added
    await expect(page.locator('[data-testid="entry-row"]').filter({ hasText: 'Bulbasaur' })).toBeVisible()

    // Step 4: Modify entry weight
    const entryRow = page.locator('[data-testid="entry-row"]').filter({ hasText: 'Bulbasaur' })
    const weightInput = entryRow.locator('[data-testid="entry-weight-input"]')
    await weightInput.fill('15')
    await weightInput.blur()

    // Verify weight was updated
    await expect(weightInput).toHaveValue('15')
  })

  test('should edit existing table properties', async ({ page }) => {
    // Create a table first
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Table to Edit')
    await page.fill('[data-testid="level-min-input"]', '1')
    await page.fill('[data-testid="level-max-input"]', '10')
    await page.click('[data-testid="save-table-btn"]')

    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Navigate to editor
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Table to Edit' }).click()

    // Edit table settings
    await page.click('[data-testid="edit-table-settings-btn"]')
    await expect(page.locator('[data-testid="table-settings-modal"]')).toBeVisible()

    await page.fill('[data-testid="table-name-input"]', 'Renamed Table')
    await page.fill('[data-testid="level-min-input"]', '5')
    await page.fill('[data-testid="level-max-input"]', '20')
    await page.click('[data-testid="save-table-btn"]')

    // Verify changes
    await expect(page.locator('h1')).toContainText('Renamed Table')
    await expect(page.locator('[data-testid="level-range-display"]')).toContainText('5 - 20')
  })

  test('should remove entry from table', async ({ page }) => {
    // Create table with entry
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Removal Test Table')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Navigate to editor
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Removal Test Table' }).click()

    // Add an entry
    const speciesInput = page.locator('[data-testid="species-autocomplete"] input')
    await speciesInput.fill('Char')
    await speciesInput.press('Tab')
    await page.locator('[data-testid="species-suggestion"]').first().click()

    const entryRow = page.locator('[data-testid="entry-row"]').first()
    await expect(entryRow).toBeVisible()

    // Remove the entry
    await entryRow.locator('[data-testid="remove-entry-btn"]').click()

    // Confirm removal if dialog appears
    const confirmBtn = page.locator('[data-testid="confirm-btn"]')
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click()
    }

    // Verify entry was removed
    await expect(page.locator('[data-testid="entry-row"]')).toHaveCount(0)
  })

  test('should display weight percentages correctly', async ({ page }) => {
    // Create table
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Weight Percentage Test')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Navigate to editor
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Weight Percentage Test' }).click()

    // Add first entry with weight 10
    const speciesInput = page.locator('[data-testid="species-autocomplete"] input')
    await speciesInput.fill('Bulba')
    await speciesInput.press('Tab')
    await page.locator('[data-testid="species-suggestion"]').first().click()

    // Set weight to 10
    const firstEntry = page.locator('[data-testid="entry-row"]').first()
    await firstEntry.locator('[data-testid="entry-weight-input"]').fill('10')
    await firstEntry.locator('[data-testid="entry-weight-input"]').blur()

    // Add second entry with weight 5
    await speciesInput.fill('Char')
    await speciesInput.press('Tab')
    await page.locator('[data-testid="species-suggestion"]').first().click()

    const secondEntry = page.locator('[data-testid="entry-row"]').last()
    await secondEntry.locator('[data-testid="entry-weight-input"]').fill('5')
    await secondEntry.locator('[data-testid="entry-weight-input"]').blur()

    // Verify total weight display
    await expect(page.locator('[data-testid="total-weight"]')).toContainText('15')

    // Verify percentage displays (approximately)
    // First entry: 10/15 = ~66.7%
    // Second entry: 5/15 = ~33.3%
    const percentages = page.locator('[data-testid="entry-percentage"]')
    await expect(percentages.first()).toContainText(/6[67]/)
    await expect(percentages.last()).toContainText(/3[34]/)
  })
})

test.describe('Encounter Tables Modifications (2.T6)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm/encounter-tables')
    await expect(page.locator('h1')).toHaveText('Encounter Tables')
  })

  test('should create modification and verify inheritance', async ({ page }) => {
    // Step 1: Create base table with entries
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Modification Test Base')
    await page.fill('[data-testid="level-min-input"]', '5')
    await page.fill('[data-testid="level-max-input"]', '15')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Navigate to editor
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Modification Test Base' }).click()

    // Add entries to base table
    const speciesInput = page.locator('[data-testid="species-autocomplete"] input')
    await speciesInput.fill('Pidgey')
    await speciesInput.press('Tab')
    await page.locator('[data-testid="species-suggestion"]').first().click()

    await speciesInput.fill('Rattata')
    await speciesInput.press('Tab')
    await page.locator('[data-testid="species-suggestion"]').first().click()

    // Verify entries are in base table
    await expect(page.locator('[data-testid="entry-row"]')).toHaveCount(2)

    // Step 2: Create a modification (sub-habitat)
    await page.click('[data-testid="add-modification-btn"]')
    await expect(page.locator('[data-testid="modification-modal"]')).toBeVisible()

    await page.fill('[data-testid="mod-name-input"]', 'Night Time')
    await page.fill('[data-testid="mod-description-input"]', 'Pokemon found at night')
    await page.click('[data-testid="save-mod-btn"]')

    // Verify modification was created
    await expect(page.locator('[data-testid="modification-item"]').filter({ hasText: 'Night Time' })).toBeVisible()

    // Step 3: Select the modification to view/edit
    await page.locator('[data-testid="modification-item"]').filter({ hasText: 'Night Time' }).click()

    // Step 4: Verify parent entries are inherited (shown in modification view)
    const modEntriesSection = page.locator('[data-testid="modification-entries"]')
    await expect(modEntriesSection.locator('[data-testid="inherited-entry"]')).toHaveCount(2)

    // Step 5: Override one entry (change Pidgey weight)
    const pidgeyEntry = modEntriesSection.locator('[data-testid="inherited-entry"]').filter({ hasText: 'Pidgey' })
    await pidgeyEntry.locator('[data-testid="override-btn"]').click()

    await page.fill('[data-testid="mod-entry-weight-input"]', '20')
    await page.click('[data-testid="save-override-btn"]')

    // Verify override is shown
    await expect(modEntriesSection.locator('[data-testid="overridden-entry"]').filter({ hasText: 'Pidgey' })).toBeVisible()

    // Step 6: Add new species to modification
    await page.click('[data-testid="add-mod-entry-btn"]')
    await page.fill('[data-testid="mod-species-input"]', 'Hoothoot')
    await page.fill('[data-testid="mod-entry-weight-input"]', '15')
    await page.click('[data-testid="save-mod-entry-btn"]')

    // Verify new entry is shown as added
    await expect(modEntriesSection.locator('[data-testid="added-entry"]').filter({ hasText: 'Hoothoot' })).toBeVisible()

    // Step 7: Remove an inherited entry
    const rattataEntry = modEntriesSection.locator('[data-testid="inherited-entry"]').filter({ hasText: 'Rattata' })
    await rattataEntry.locator('[data-testid="remove-from-mod-btn"]').click()

    // Verify Rattata is marked for removal
    await expect(modEntriesSection.locator('[data-testid="removed-entry"]').filter({ hasText: 'Rattata' })).toBeVisible()
  })

  test('should edit existing modification', async ({ page }) => {
    // Create table with modification
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Edit Mod Test')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Edit Mod Test' }).click()

    // Create modification
    await page.click('[data-testid="add-modification-btn"]')
    await page.fill('[data-testid="mod-name-input"]', 'Original Name')
    await page.click('[data-testid="save-mod-btn"]')

    // Edit the modification
    const modItem = page.locator('[data-testid="modification-item"]').filter({ hasText: 'Original Name' })
    await modItem.locator('[data-testid="edit-mod-btn"]').click()

    await expect(page.locator('[data-testid="edit-mod-modal"]')).toBeVisible()
    await page.fill('[data-testid="mod-name-input"]', 'Updated Name')
    await page.fill('[data-testid="mod-description-input"]', 'Updated description')
    await page.click('[data-testid="save-mod-btn"]')

    // Verify update
    await expect(page.locator('[data-testid="modification-item"]').filter({ hasText: 'Updated Name' })).toBeVisible()
    await expect(page.locator('[data-testid="modification-item"]').filter({ hasText: 'Original Name' })).not.toBeVisible()
  })

  test('should delete modification', async ({ page }) => {
    // Create table with modification
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Delete Mod Test')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Delete Mod Test' }).click()

    // Create modification
    await page.click('[data-testid="add-modification-btn"]')
    await page.fill('[data-testid="mod-name-input"]', 'To Be Deleted')
    await page.click('[data-testid="save-mod-btn"]')

    // Delete the modification
    const modItem = page.locator('[data-testid="modification-item"]').filter({ hasText: 'To Be Deleted' })
    await modItem.locator('[data-testid="delete-mod-btn"]').click()

    // Confirm deletion
    await expect(page.locator('[data-testid="confirm-modal"]')).toBeVisible()
    await page.click('[data-testid="confirm-btn"]')

    // Verify deletion
    await expect(page.locator('[data-testid="modification-item"]').filter({ hasText: 'To Be Deleted' })).not.toBeVisible()
  })

  test('should generate encounter from modification', async ({ page }) => {
    // Create table with entry
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Generate From Mod Test')
    await page.fill('[data-testid="level-min-input"]', '5')
    await page.fill('[data-testid="level-max-input"]', '10')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Generate From Mod Test' }).click()

    // Add entry
    const speciesInput = page.locator('[data-testid="species-autocomplete"] input')
    await speciesInput.fill('Pikachu')
    await speciesInput.press('Tab')
    await page.locator('[data-testid="species-suggestion"]').first().click()

    // Create modification with different level range
    await page.click('[data-testid="add-modification-btn"]')
    await page.fill('[data-testid="mod-name-input"]', 'High Level Area')
    await page.fill('[data-testid="mod-level-min-input"]', '15')
    await page.fill('[data-testid="mod-level-max-input"]', '20')
    await page.click('[data-testid="save-mod-btn"]')

    // Select modification for generation
    await page.locator('[data-testid="modification-item"]').filter({ hasText: 'High Level Area' }).click()

    // Generate encounter from modification
    await page.click('[data-testid="generate-encounter-btn"]')

    // Verify generation result uses modification level range
    await expect(page.locator('[data-testid="generated-result"]')).toBeVisible()
    const levelDisplay = page.locator('[data-testid="generated-level"]')
    const levelText = await levelDisplay.textContent()
    const level = parseInt(levelText || '0')

    // Level should be within modification range (15-20)
    expect(level).toBeGreaterThanOrEqual(15)
    expect(level).toBeLessThanOrEqual(20)
  })
})

test.describe('Encounter Tables Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gm/encounter-tables')
    await expect(page.locator('h1')).toHaveText('Encounter Tables')
  })

  test('should export table as JSON', async ({ page }) => {
    // Create a table
    await page.click('button:has-text("New Table")')
    await page.fill('[data-testid="table-name-input"]', 'Export Test Table')
    await page.fill('[data-testid="table-description-input"]', 'Table for export testing')
    await page.fill('[data-testid="level-min-input"]', '3')
    await page.fill('[data-testid="level-max-input"]', '8')
    await page.click('[data-testid="save-table-btn"]')
    await expect(page.locator('[data-testid="encounter-table-modal"]')).not.toBeVisible()

    // Click export button on the card
    const tableCard = page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Export Test Table' })

    // Set up download listener
    const downloadPromise = page.waitForEvent('download')
    await tableCard.locator('[data-testid="export-table-btn"]').click()

    // Verify download was triggered
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('Export Test Table')
    expect(download.suggestedFilename()).toContain('.json')
  })

  test('should import table from JSON file', async ({ page }) => {
    // Open import modal
    await page.click('[data-testid="import-table-btn"]')
    await expect(page.locator('[data-testid="import-modal"]')).toBeVisible()

    // Create a test JSON file content
    const importData = {
      version: '1.0',
      table: {
        name: 'Imported Test Table',
        description: 'This table was imported',
        levelRange: { min: 5, max: 15 },
        entries: [
          { speciesName: 'Bulbasaur', weight: 10 },
          { speciesName: 'Charmander', weight: 5 }
        ],
        modifications: [
          {
            name: 'Night Area',
            description: 'Night time encounters',
            entries: [
              { speciesName: 'Hoothoot', weight: 8 }
            ]
          }
        ]
      }
    }

    // Set file input value (for testing purposes, we'll paste JSON)
    const fileInput = page.locator('[data-testid="import-file-input"]')
    await fileInput.setInputFiles({
      name: 'test-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(importData))
    })

    // Click import button
    await page.click('[data-testid="do-import-btn"]')

    // Verify import success
    await expect(page.locator('[data-testid="import-modal"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Imported Test Table' })).toBeVisible()

    // Navigate to verify imported data
    await page.locator('[data-testid="encounter-table-card"]').filter({ hasText: 'Imported Test Table' }).click()

    // Verify entries were imported (ones that exist in DB)
    await expect(page.locator('[data-testid="entry-row"]').filter({ hasText: 'Bulbasaur' })).toBeVisible()

    // Verify modification was imported
    await expect(page.locator('[data-testid="modification-item"]').filter({ hasText: 'Night Area' })).toBeVisible()
  })

  test('should show warning for unmatched species during import', async ({ page }) => {
    // Open import modal
    await page.click('[data-testid="import-table-btn"]')
    await expect(page.locator('[data-testid="import-modal"]')).toBeVisible()

    // Create import data with fake Pokemon
    const importData = {
      version: '1.0',
      table: {
        name: 'Table with Fake Pokemon',
        levelRange: { min: 1, max: 10 },
        entries: [
          { speciesName: 'Bulbasaur', weight: 10 },
          { speciesName: 'FakemonDoesNotExist', weight: 5 },
          { speciesName: 'AnotherFakemon', weight: 3 }
        ]
      }
    }

    const fileInput = page.locator('[data-testid="import-file-input"]')
    await fileInput.setInputFiles({
      name: 'test-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(importData))
    })

    await page.click('[data-testid="do-import-btn"]')

    // Should show warning about unmatched species
    await expect(page.locator('[data-testid="import-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="import-warning"]')).toContainText('FakemonDoesNotExist')
    await expect(page.locator('[data-testid="import-warning"]')).toContainText('AnotherFakemon')
  })

  test('should show error for invalid JSON', async ({ page }) => {
    await page.click('[data-testid="import-table-btn"]')
    await expect(page.locator('[data-testid="import-modal"]')).toBeVisible()

    // Create invalid JSON (missing required fields)
    const invalidData = {
      notATable: 'invalid data'
    }

    const fileInput = page.locator('[data-testid="import-file-input"]')
    await fileInput.setInputFiles({
      name: 'invalid.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(invalidData))
    })

    await page.click('[data-testid="do-import-btn"]')

    // Should show error
    await expect(page.locator('[data-testid="import-error"]')).toBeVisible()
  })

  test('should cancel import', async ({ page }) => {
    await page.click('[data-testid="import-table-btn"]')
    await expect(page.locator('[data-testid="import-modal"]')).toBeVisible()

    // Click cancel
    await page.click('[data-testid="cancel-import-btn"]')

    // Modal should close
    await expect(page.locator('[data-testid="import-modal"]')).not.toBeVisible()
  })
})
