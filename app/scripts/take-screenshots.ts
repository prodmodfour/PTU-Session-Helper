import { chromium } from '@playwright/test'

async function takeScreenshots() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })
  const page = await context.newPage()

  const screenshotDir = './docs/screenshots'

  // GM View - Main encounter page
  console.log('Capturing GM View...')
  await page.goto('http://localhost:3000/gm')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${screenshotDir}/gm-view.png`, fullPage: false })

  // GM Sheets - Character library
  console.log('Capturing GM Sheets...')
  await page.goto('http://localhost:3000/gm/sheets')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${screenshotDir}/gm-sheets.png`, fullPage: false })

  // GM Encounter Tables
  console.log('Capturing Encounter Tables...')
  await page.goto('http://localhost:3000/gm/encounter-tables')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${screenshotDir}/gm-encounter-tables.png`, fullPage: false })

  // Group View
  console.log('Capturing Group View...')
  await page.goto('http://localhost:3000/group')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${screenshotDir}/group-view.png`, fullPage: false })

  // Home page
  console.log('Capturing Home Page...')
  await page.goto('http://localhost:3000')
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${screenshotDir}/home.png`, fullPage: false })

  await browser.close()
  console.log('Screenshots saved to docs/screenshots/')
}

takeScreenshots().catch(console.error)
