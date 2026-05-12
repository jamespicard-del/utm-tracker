import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  use: {
    actionTimeout: 5000,
    navigationTimeout: 15000,
    ignoreHTTPSErrors: false,
  },
  reporter: 'list',
});
