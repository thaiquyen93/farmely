import { defineConfig, devices } from '@playwright/test';

// Mutation tests always target the isolated Docker stack, never localhost:3000.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.workflow.spec.ts',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  globalSetup: './e2e/support/verify-isolated.cjs',
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-workflow', open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3300',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
