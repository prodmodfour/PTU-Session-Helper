import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the home page with title and navigation cards', async ({ page }) => {
    await expect(page.locator('.home__title')).toHaveText('PTU Session Helper')
    await expect(page.locator('.home__subtitle')).toHaveText('Pokemon Tabletop United 1.05')

    const gmCard = page.locator('.home__card', { hasText: 'GM View' })
    const groupCard = page.locator('.home__card', { hasText: 'Group View' })

    await expect(gmCard).toBeVisible()
    await expect(groupCard).toBeVisible()
  })

  test('should display quick start instructions', async ({ page }) => {
    const quickStart = page.locator('.home__info')
    await expect(quickStart).toBeVisible()
    await expect(quickStart.locator('h3')).toHaveText('Quick Start')

    const steps = quickStart.locator('ol li')
    await expect(steps).toHaveCount(4)
  })

  test('should navigate to GM View when clicking GM card', async ({ page }) => {
    const gmCard = page.locator('.home__card', { hasText: 'GM View' })
    await gmCard.click()

    await expect(page).toHaveURL('/gm')
  })

  test('should navigate to Group View when clicking Group card', async ({ page }) => {
    const groupCard = page.locator('.home__card', { hasText: 'Group View' })
    await groupCard.click()

    await expect(page).toHaveURL('/group')
  })
})
