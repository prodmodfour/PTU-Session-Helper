import { chromium } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'

async function takeScreenshots() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })
  const page = await context.newPage()

  const screenshotDir = './docs/screenshots'

  // Helper to wait for page to be fully rendered
  async function captureScreen(url: string, filename: string, description: string) {
    console.log(`Capturing ${description}...`)
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    // Wait for Vue to hydrate and render
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${screenshotDir}/${filename}`, fullPage: false })
  }

  await captureScreen(`${BASE_URL}/gm`, 'gm-view.png', 'GM View')
  await captureScreen(`${BASE_URL}/gm/sheets`, 'gm-sheets.png', 'GM Sheets')
  await captureScreen(`${BASE_URL}/gm/encounter-tables`, 'gm-encounter-tables.png', 'Encounter Tables')
  await captureScreen(`${BASE_URL}/group`, 'group-view.png', 'Group View')
  await captureScreen(`${BASE_URL}`, 'home.png', 'Home Page')

  await browser.close()
  console.log('Screenshots saved to docs/screenshots/')
}

takeScreenshots().catch(console.error)
