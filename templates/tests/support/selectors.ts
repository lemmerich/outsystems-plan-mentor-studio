import { Page } from '@playwright/test';

// ─── Navigation ──────────────────────────────────────────────────────────────

export const sidebar = {
  // OutSystems LayoutSideMenu entries have role "menuitem", not "link"
  link: (page: Page, name: string) =>
    page.getByRole('menuitem', { name }),
};

// ─── Page structure ──────────────────────────────────────────────────────────

export const pageTitle = (page: Page, name: string) =>
  // OutSystems Title widget renders a <span>, not a heading.
  // Scoped to main to avoid matching the sidebar link with the same text.
  page.locator('main').getByText(name, { exact: true }).first();

// ─── Lists ───────────────────────────────────────────────────────────────────

export const listRow = (page: Page, containsText: string) =>
  // TableRecords data-test lands on <td> cells, not <tr>.
  // Locate the row by filtering <tr> elements, then read cells as descendants.
  page.locator('tr').filter({ hasText: containsText });

// ─── Forms ───────────────────────────────────────────────────────────────────

export const fileInput = {
  // Upload widget labels are not wired to <input> — use type="file" by index.
  first:  (page: Page) => page.locator('input[type="file"]').nth(0),
  second: (page: Page) => page.locator('input[type="file"]').nth(1),
};

// ─── Verbatim messages ───────────────────────────────────────────────────────
// Add every exact PT-BR message from the wave specs here.
// A test that asserts msg.fileInvalid will break if the message changes — good.

export const msg = {
  // W1
  // fileInvalid: 'Formato inválido. Envie um arquivo PDF.',
  // fileTooLarge: 'Arquivo muito grande. Limite: 5 MB.',

  // W2
  // Add messages as waves are planned
};
