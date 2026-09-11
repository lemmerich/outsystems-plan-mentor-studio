import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
dotenv.config();

// An ODC app lives under a sub-path (https://tenant/AppName). Without a trailing
// slash, a relative page.goto('Screen') resolves against the domain root and
// silently drops /AppName.
const rawBaseURL = process.env.BASE_URL ?? '';
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL : rawBaseURL + '/';

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
    baseURL,
    // IMPORTANT: OutSystems apps use data-test, not data-testid.
    // Removing this line silently breaks every getByTestId() call.
    testIdAttribute: 'data-test',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
});
