import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: false, // Run tests sequentially since we're testing deployment
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker since we need deployment isolation
  reporter: 'html',
  timeout: 600000, // 10 minutes for dfx start, deployment, and blockchain operations
  use: {
    baseURL: 'http://localhost:4943',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // No webServer config since we manage dfx startup ourselves in the test
}); 
