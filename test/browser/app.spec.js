const { test, expect } = require('@playwright/test');

test('loads and switches destination profiles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Copy Sanitizer' })).toBeVisible();
  await page.locator('#inputEditor').fill('Hello — world');
  await page.locator('#destinationSelect').selectOption('markdown');
  await expect(page.locator('#destinationCopyButton')).toHaveText('Copy Markdown');
  await expect(page.locator('#outputEditor')).toContainText('Hello -- world');
});

test('shows browser compatibility status', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#compatibilityList')).toContainText('ClipboardItem support:');
});

test('uses destination-specific style selectors', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#destinationStyleLabel')).toHaveText('Destination text style');
  await expect(page.locator('#destinationFontSelect')).toContainText('Sans Serif');
  await expect(page.locator('#destinationSizeSelect')).toContainText('Normal');

  await page.locator('#destinationSelect').selectOption('googleDocs');
  await expect(page.locator('#destinationFontSelect')).toContainText('Arial');
  await expect(page.locator('#destinationSizeSelect')).toContainText('Heading 1 (20 pt)');
});

test('links to tests and debugging page with runnable checks', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Tests & debugging' }).click();
  await expect(page).toHaveURL(/\/tests\.html$/);
  await expect(page.getByRole('heading', { name: 'Tests and Debugging' })).toBeVisible();
  await expect(page.locator('#testSummary')).toHaveText(/7\/7 tests passing/);
  await expect(page.locator('#debugDiagnostics')).toContainText('Clipboard API:');

  await page.getByRole('button', { name: 'Run tests' }).click();
  await expect(page.locator('#testResults .test-result.fail')).toHaveCount(0);
});
