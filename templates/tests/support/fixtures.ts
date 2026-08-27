import { test as base, Page } from '@playwright/test';

// Extend base test with one authenticated Page per role.
// Add roles as needed for your project.
// For open apps (no login), use page directly — no fixtures needed.

type Roles = {
  // auditorPage: Page;
  // adminPage: Page;
  // managerPage: Page;
};

export const test = base.extend<Roles>({
  // auditorPage: async ({ browser }, use) => {
  //   const context = await browser.newContext();
  //   const page = await context.newPage();
  //   await page.goto(process.env.BASE_URL!);
  //   // perform login as auditor
  //   await use(page);
  //   await context.close();
  // },
});

export { expect } from '@playwright/test';
