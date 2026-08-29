import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

export const AUTH_FILE = 'tests/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // 'list' alone prints to a terminal that scrolls away. The HTML report is what
  // makes "5 passed" a checkable claim. It is overwritten by the next run of the
  // same project — expected, not a gap.
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL,
    // IMPORTANT: OutSystems apps use data-test, not data-testid.
    // Removing this line silently breaks every getByTestId() call.
    testIdAttribute: 'data-test',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  // Log in once, reuse the session for every spec. Re-authenticating per test
  // against the ODC login screen is slow and flaky.
  // For an open app (no login), delete both projects and let testDir run flat.
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'e2e',
      dependencies: ['setup'],
      use: { storageState: AUTH_FILE },
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
