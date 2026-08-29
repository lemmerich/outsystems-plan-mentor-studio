import { test as setup, expect } from '@playwright/test';
import { AUTH_FILE } from '../playwright.config';

// Runs once before the suite. Saves the session so every spec starts logged in.
// If the ODC login screen changes, this is the only file that needs editing.
setup('authenticate', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Username').fill(process.env.APP_USER!);
  await page.getByLabel('Password').fill(process.env.APP_PASSWORD!);
  await page.getByRole('button', { name: 'Login' }).click();

  // Assert on something only a logged-in user sees — never on the URL alone.
  await expect(page.getByRole('menubar')).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
