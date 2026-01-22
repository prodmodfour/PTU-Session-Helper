import { defineConfig, devices } from '@playwright/test'

const port = process.env.TEST_PORT || '3001'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.CI ? {
    command: 'npm run dev',
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120000,
  } : undefined,
})
